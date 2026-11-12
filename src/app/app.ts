import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { loadLeaderboardDialog, loadResultsDialog } from './components/lazy-dialogs';
import type { LeaderboardDialog } from './components/leaderboard-dialog/leaderboard-dialog';
import { QuestionCard } from './components/question-card/question-card';
import type { ResultsDialog } from './components/results-dialog/results-dialog';
import { SetupDialog } from './components/setup-dialog/setup-dialog';
import { ModeDialog, PlayMode } from './components/mode-dialog/mode-dialog';
import { Learning } from './components/learning/learning';
import { KID_DIALOG_CONFIG } from './components/dialog.config';
import { BumpOnChange } from './directives/bump-on-change';
import {
  DEFAULT_SETTINGS,
  GameResult,
  GameSettings,
  GameStatus,
  HINTS_MAX_SUM,
  isLevel,
  LeaderboardDialogData,
  QuestionState,
  ResultsDialogAction,
  SetupDialogData,
} from './models/game.models';
import { ConfettiService } from './services/confetti.service';
import { LeaderboardService } from './services/leaderboard.service';
import { QuestionGeneratorService } from './services/question-generator.service';
import { InstallService } from './services/install.service';
import { SoundService } from './services/sound.service';
import { formatTime } from './utils/format-time';

/** How long the correct/wrong highlight stays on the active card before moving on. */
const FEEDBACK_DELAY_MS = 1200;
/** Space kept between the active card and the header (top) / bottom of the visible area. */
const SCROLL_MARGIN_TOP_PX = 36;
/** Bigger at the bottom: the card's 3D shadow (~26px) is not part of its height. */
const SCROLL_MARGIN_BOTTOM_PX = 40;

const isTouchScreen = () => window.matchMedia('(pointer: coarse)').matches;

@Component({
  selector: 'app-root',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    QuestionCard,
    Learning,
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
  protected readonly install = inject(InstallService);

  private readonly cards = viewChildren(QuestionCard);
  private readonly learningView = viewChild(Learning);
  private readonly header = viewChild.required<ElementRef<HTMLElement>>('header');

  protected readonly settings = signal<GameSettings | null>(null);
  protected readonly playMode = signal<PlayMode | null>(null);
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
  /** Level of the current/last game (leaderboard tab shown first), `null` for quick/custom games. */
  protected readonly preferredLevel = computed(() => {
    const mode = this.settings()?.mode;
    return mode && isLevel(mode) ? mode : null;
  });

  private timerId: ReturnType<typeof setInterval> | null = null;
  /** Time measured from timestamps: intervals are throttled in background tabs and would undercount. */
  private runningSince: number | null = null;
  private accumulatedMs = 0;
  private advanceTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => this.openModeDialog());

    // Follow both new exercises and cards expanding with learning hints/solutions.
    afterRenderEffect((onCleanup) => {
      this.currentIndex();
      this.cards();
      this.bringActiveCardIntoView(true);
      const card = this.playMode() === 'learning' ? this.learningView()?.activeCard : this.cards().at(-1)?.element;
      if (!card) return;
      let previousHeight = card.offsetHeight;
      const observer = new ResizeObserver(() => {
        const height = card.offsetHeight;
        if (height !== previousHeight) {
          previousHeight = height;
          // Follow the CSS expansion frame by frame without restarting smooth scrolls.
          this.bringActiveCardIntoView(false);
        }
      });
      observer.observe(card);
      onCleanup(() => observer.disconnect());
    });

    // On phones the virtual keyboard opening/closing resizes the visible area (and can cancel a smooth scroll):
    // keep the active card visible whenever that happens.
    const onViewportResize = () => this.bringActiveCardIntoView(false);
    afterNextRender(() => window.visualViewport?.addEventListener('resize', onViewportResize));

    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
      this.clearAdvanceTimeout();
      window.visualViewport?.removeEventListener('resize', onViewportResize);
    });
  }

  protected openModeDialog(): void {
    if (this.dialog.openDialogs.length) return;
    const isMidGame = this.playMode() === 'game' && this.status() === 'playing';
    if (isMidGame) this.pauseGame();
    this.dialog.open<ModeDialog, boolean, PlayMode>(ModeDialog, {
      data: this.playMode() !== null,
      ...KID_DIALOG_CONFIG,
      disableClose: this.playMode() === null,
      restoreFocus: false,
      autoFocus: 'dialog',
    }).afterClosed().subscribe(mode => {
      if (mode === 'learning') {
        this.stopTimer();
        this.clearAdvanceTimeout();
        this.status.set('idle');
        this.playMode.set('learning');
      } else if (mode === 'game') {
        this.openSetupDialog();
      } else if (isMidGame) {
        this.resumeGame();
      }
    });
  }

  protected openSetupDialog(): void {
    const isMidGame = this.status() === 'playing';
    const data: SetupDialogData = {
      settings: this.settings(),
      canCancel: true,
    };

    // Pause the running game while the kid is choosing new settings.
    if (isMidGame) {
      this.pauseGame();
    }

    this.dialog
      .open<SetupDialog, SetupDialogData, GameSettings>(SetupDialog, {
        data,
        ...KID_DIALOG_CONFIG,
        disableClose: !data.canCancel,
        restoreFocus: false,
        // Focus the dialog itself: auto-focusing the first button shows a keyboard focus ring on open.
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((settings) => {
        if (settings) {
          this.startGame(settings);
        } else if (isMidGame) {
          this.resumeGame();
        } else {
          this.openModeDialog();
        }
      });
  }

  protected async openLeaderboard(): Promise<void> {
    const component = await loadLeaderboardDialog();
    // A double click may get here twice while the dialog code loads.
    if (this.dialog.openDialogs.some((ref) => ref.componentInstance instanceof component)) {
      return;
    }

    const isMidGame = this.status() === 'playing';
    if (isMidGame) {
      this.pauseGame();
    }

    this.dialog
      .open<LeaderboardDialog, LeaderboardDialogData>(component, {
        data: { level: this.preferredLevel() },
        ...KID_DIALOG_CONFIG,
        restoreFocus: false,
        autoFocus: 'dialog',
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

  /**
   * Scrolls just enough to show the whole active card between the sticky header and the bottom of the
   * *visible* area. Uses the visual viewport, so the area covered by a phone's keyboard counts as hidden
   * (`scrollIntoView` treats it as visible and therefore often doesn't scroll on mobile).
   */
  private bringActiveCardIntoView(smooth: boolean): void {
    const card = this.playMode() === 'learning' ? this.learningView()?.activeCard : this.cards().at(-1)?.element;
    if (!card || (this.status() !== 'playing' && this.playMode() !== 'learning')) {
      return;
    }

    const visibleTop = this.header().nativeElement.getBoundingClientRect().bottom + SCROLL_MARGIN_TOP_PX;
    const viewport = window.visualViewport;
    const visibleBottom =
      (viewport ? viewport.offsetTop + viewport.height : window.innerHeight) - SCROLL_MARGIN_BOTTOM_PX;

    // Layout position (offsetTop/offsetHeight) ignores the card's enter animation transform.
    let documentTop = 0;
    for (let node: HTMLElement | null = card; node; node = node.offsetParent as HTMLElement | null) {
      documentTop += node.offsetTop;
    }
    const cardTop = documentTop - window.scrollY;
    const cardBottom = cardTop + card.offsetHeight;

    const topOverflow = cardTop - visibleTop; // < 0: top is hidden under the header
    const bottomOverflow = cardBottom - visibleBottom; // > 0: bottom is hidden (screen edge or keyboard)
    // Touch screens: always pin the card right under the header. In-app browsers (Messenger, ...) often pan
    // the whole window for the keyboard without telling the page, so the keyboard can't be measured; at the
    // top of the screen the card stays clear of it anyway.
    // Elsewhere: never scroll so far that the top of the card (the exercise) goes under the header.
    // Long learning explanations may not fit at once: reveal their bottom/actions rather
    // than pinning the equation at the top and leaving the new content below the viewport.
    const longLearningCard = this.playMode() === 'learning' && card.offsetHeight > visibleBottom - visibleTop;
    const delta = longLearningCard
      ? Math.max(bottomOverflow, 0)
      : isTouchScreen()
      ? topOverflow
      : topOverflow < 0
        ? topOverflow
        : Math.min(Math.max(bottomOverflow, 0), topOverflow);

    if (Math.abs(delta) >= 1) {
      window.scrollBy({ top: delta, behavior: smooth ? 'smooth' : 'auto' });
    }
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
    this.playMode.set('game');
    this.settings.set(settings);
    this.questions.set(
      this.generator.generate(settings).map((question): QuestionState => ({ question, userAnswer: null, status: 'pending' })),
    );
    this.currentIndex.set(0);
    this.stopTimer();
    this.accumulatedMs = 0;
    this.elapsedSeconds.set(0);
    this.status.set('playing');
    this.startTimer();
    // Fetch what the end of the game needs while the kid plays, so it shows without delay.
    void loadResultsDialog();
    this.confetti.preload();
  }

  private async finishGame(): Promise<void> {
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

    const component = await loadResultsDialog();
    this.dialog
      .open<ResultsDialog, GameResult, ResultsDialogAction>(component, {
        data: result,
        ...KID_DIALOG_CONFIG,
        disableClose: true,
        restoreFocus: false,
        // Level games: focus the name field (cdkFocusInitial). Otherwise focus the dialog (no focus ring on a button).
        autoFocus: isLevel(result.settings.mode) ? 'first-tabbable' : 'dialog',
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
    this.runningSince = Date.now();
    // The interval only refreshes the display; the value is always computed from timestamps.
    this.timerId = setInterval(() => this.elapsedSeconds.set(Math.floor(this.elapsedMs() / 1000)), 250);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.runningSince !== null) {
      this.accumulatedMs += Date.now() - this.runningSince;
      this.runningSince = null;
      this.elapsedSeconds.set(Math.floor(this.accumulatedMs / 1000));
    }
  }

  private elapsedMs(): number {
    return this.accumulatedMs + (this.runningSince === null ? 0 : Date.now() - this.runningSince);
  }

  private clearAdvanceTimeout(): void {
    if (this.advanceTimeoutId !== null) {
      clearTimeout(this.advanceTimeoutId);
      this.advanceTimeoutId = null;
    }
  }
}
