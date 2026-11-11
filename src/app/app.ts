import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LeaderboardCard } from './components/leaderboard-card/leaderboard-card';
import { LeaderboardDialog } from './components/leaderboard-dialog/leaderboard-dialog';
import { QuestionCard } from './components/question-card/question-card';
import { ResultsDialog } from './components/results-dialog/results-dialog';
import { SetupDialog } from './components/setup-dialog/setup-dialog';
import { BumpOnChange } from './directives/bump-on-change';
import {
  DEFAULT_SETTINGS,
  GameResult,
  GameSettings,
  GameStatus,
  HINTS_MAX_SUM,
  LeaderboardDialogData,
  QuestionState,
  ResultsDialogAction,
  SetupDialogData,
} from './models/game.models';
import { ConfettiService } from './services/confetti.service';
import { LeaderboardService } from './services/leaderboard.service';
import { MotionService } from './services/motion.service';
import { QuestionGeneratorService } from './services/question-generator.service';
import { SoundService } from './services/sound.service';
import { formatTime } from './utils/format-time';

/** How long the correct/wrong highlight stays on the active card before moving on. */
const FEEDBACK_DELAY_MS = 1200;

@Component({
  selector: 'app-root',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    QuestionCard,
    LeaderboardCard,
    BumpOnChange,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly dialog = inject(MatDialog);
  private readonly generator = inject(QuestionGeneratorService);
  private readonly confetti = inject(ConfettiService);
  private readonly leaderboard = inject(LeaderboardService);
  protected readonly sound = inject(SoundService);
  protected readonly motion = inject(MotionService);

  private readonly cards = viewChildren(QuestionCard);

  protected readonly settings = signal<GameSettings | null>(null);
  protected readonly questions = signal<QuestionState[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly status = signal<GameStatus>('idle');
  protected readonly elapsedSeconds = signal(0);

  protected readonly total = computed(() => this.questions().length);
  protected readonly correctCount = computed(() => this.questions().filter((q) => q.status === 'correct').length);
  protected readonly answeredCount = computed(() => this.questions().filter((q) => q.status !== 'pending').length);
  protected readonly exerciseNumber = computed(() => Math.min(this.currentIndex() + 1, this.total()));
  protected readonly progress = computed(() => (this.total() ? (this.answeredCount() / this.total()) * 100 : 0));
  protected readonly visibleQuestions = computed(() => this.questions().slice(0, this.currentIndex() + 1));
  protected readonly formattedTime = computed(() => formatTime(this.elapsedSeconds()));
  protected readonly showDots = computed(() => {
    const settings = this.settings();
    return !!settings?.showHints && settings.maxSum <= HINTS_MAX_SUM;
  });
  protected readonly hasScores = computed(() => this.leaderboard.entries().length > 0);
  /** Leaderboard category matching the current/last game settings. */
  protected readonly categoryKey = computed(() => {
    const settings = this.settings();
    return settings
      ? this.leaderboard.categoryKey(settings.operation, settings.maxSum, settings.questionCount)
      : null;
  });

  private timerId: ReturnType<typeof setInterval> | null = null;
  private advanceTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => this.openSetupDialog());

    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
      this.clearAdvanceTimeout();
    });
  }

  protected openSetupDialog(): void {
    const isMidGame = this.status() === 'playing';
    const data: SetupDialogData = {
      settings: this.settings() ?? DEFAULT_SETTINGS,
      canCancel: isMidGame,
    };

    // Pause the running game while the kid is choosing new settings.
    if (isMidGame) {
      this.pauseGame();
    }

    this.dialog
      .open<SetupDialog, SetupDialogData, GameSettings>(SetupDialog, {
        data,
        width: '820px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        disableClose: !data.canCancel,
        restoreFocus: false,
        panelClass: 'kid-dialog',
      })
      .afterClosed()
      .subscribe((settings) => {
        if (settings) {
          this.startGame(settings);
        } else if (isMidGame) {
          this.resumeGame();
        }
      });
  }

  protected openLeaderboard(): void {
    const isMidGame = this.status() === 'playing';
    if (isMidGame) {
      this.pauseGame();
    }

    this.dialog
      .open<LeaderboardDialog, LeaderboardDialogData>(LeaderboardDialog, {
        data: { categoryKey: this.categoryKey() },
        width: '760px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        restoreFocus: false,
        panelClass: 'kid-dialog',
      })
      .afterClosed()
      .subscribe(() => {
        if (isMidGame) {
          this.resumeGame();
        }
      });
  }

  protected onAnswered(index: number, answer: number): void {
    if (this.status() !== 'playing' || index !== this.currentIndex()) {
      return;
    }

    const isCorrect = answer === this.questions()[index].question.correctAnswer;

    this.questions.update((list) =>
      list.map((item, i): QuestionState =>
        i === index ? { ...item, userAnswer: answer, status: isCorrect ? 'correct' : 'wrong' } : item,
      ),
    );

    if (isCorrect) {
      this.sound.playSuccess();
    } else {
      this.sound.playError();
    }

    const isLast = index === this.total() - 1;
    if (isLast) {
      this.stopTimer();
    }

    this.scheduleAdvance();
  }

  private scheduleAdvance(): void {
    this.clearAdvanceTimeout();
    this.advanceTimeoutId = setTimeout(() => {
      this.advanceTimeoutId = null;
      if (this.currentIndex() >= this.total() - 1) {
        this.finishGame();
      } else {
        this.currentIndex.update((i) => i + 1);
      }
    }, FEEDBACK_DELAY_MS);
  }

  private pauseGame(): void {
    this.stopTimer();
    this.clearAdvanceTimeout();
  }

  /** Continues the game after a dialog opened mid-game was closed. */
  private resumeGame(): void {
    const currentAnswered = this.questions()[this.currentIndex()]?.status !== 'pending';
    const isLast = this.currentIndex() === this.total() - 1;

    if (!(currentAnswered && isLast)) {
      this.startTimer();
    }
    if (currentAnswered) {
      this.scheduleAdvance();
    } else {
      this.cards().at(-1)?.focus();
    }
  }

  private startGame(settings: GameSettings): void {
    this.clearAdvanceTimeout();
    this.settings.set(settings);
    this.questions.set(
      this.generator.generate(settings).map((question): QuestionState => ({ question, userAnswer: null, status: 'pending' })),
    );
    this.currentIndex.set(0);
    this.elapsedSeconds.set(0);
    this.status.set('playing');
    this.startTimer();
  }

  private finishGame(): void {
    this.status.set('finished');
    this.stopTimer();
    this.confetti.celebrate();
    this.sound.playFanfare();

    const result: GameResult = {
      correct: this.correctCount(),
      total: this.total(),
      elapsedSeconds: this.elapsedSeconds(),
      settings: this.settings() ?? DEFAULT_SETTINGS,
    };

    this.dialog
      .open<ResultsDialog, GameResult, ResultsDialogAction>(ResultsDialog, {
        data: result,
        width: '680px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        disableClose: true,
        restoreFocus: false,
        panelClass: 'kid-dialog',
      })
      .afterClosed()
      .subscribe((action) => {
        const settings = this.settings();
        if (action === 'retry' && settings) {
          this.startGame(settings);
        } else {
          this.openSetupDialog();
        }
      });
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => this.elapsedSeconds.update((s) => s + 1), 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private clearAdvanceTimeout(): void {
    if (this.advanceTimeoutId !== null) {
      clearTimeout(this.advanceTimeoutId);
      this.advanceTimeoutId = null;
    }
  }
}
