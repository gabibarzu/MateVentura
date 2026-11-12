import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, viewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { QuestionCard } from '../question-card/question-card';
import { QuestionState } from '../../models/game.models';
import { LEARNING_STAGES, LearningService } from '../../services/learning.service';
import { SoundService } from '../../services/sound.service';

const FEEDBACK_DELAY_MS = 1200;

@Component({
  selector: 'app-learning',
  imports: [MatButtonModule, QuestionCard],
  templateUrl: './learning.html',
  styleUrl: './learning.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Learning {
  private readonly learning = inject(LearningService);
  private readonly sound = inject(SoundService);
  private readonly cards = viewChildren(QuestionCard);
  private advanceTimeout: ReturnType<typeof setTimeout> | null = null;
  protected readonly history = signal<{ state: QuestionState; helped: boolean; label: string; feedback: string }[]>([]);
  protected readonly warmup = signal(this.learning.progress().stage > 0 ? 2 : 0);
  protected readonly stage = signal(this.currentStage());
  protected readonly question = signal(this.learning.question(this.stage()));
  protected readonly mistakes = signal(0);
  protected readonly helped = signal(false);
  protected readonly solved = signal(false);
  protected readonly revealed = signal(false);
  protected readonly message = signal('Privește exercițiul și încearcă. Cifrel este aici să te ajute!');
  protected readonly label = computed(() => LEARNING_STAGES[this.stage()].label);
  protected readonly state = computed<QuestionState>(() => ({
    question: this.question(),
    userAnswer: this.solved() || this.revealed() ? this.question().correctAnswer : null,
    status: this.solved() ? 'correct' : 'pending',
  }));
  protected readonly solutionSteps = computed(() => {
    const q = this.question();
    return Array.from({ length: q.operandB }, (_, i) => q.operandA + (q.operator === '+' ? i + 1 : -(i + 1)));
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearAdvanceTimeout());
  }

  protected submit(answer: number): void {
    if (this.solved() || this.revealed()) return;
    if (answer === this.question().correctAnswer) {
      this.solved.set(true);
      this.learning.complete(this.helped(), this.warmup() > 0);
      this.sound.playSuccess();
      this.message.set('Bravo! Ai reușit!');
      this.clearAdvanceTimeout();
      this.advanceTimeout = setTimeout(() => {
        this.advanceTimeout = null;
        this.next();
      }, FEEDBACK_DELAY_MS);
    } else {
      this.mistakes.update(n => n + 1);
      this.helped.set(true);
      if (this.mistakes() >= 3) {
        this.revealed.set(true);
        this.learning.complete(true, this.warmup() > 0);
        this.message.set('Hai să rezolvăm împreună, pas cu pas. Apoi încercăm ceva asemănător.');
      } else {
        this.message.set(this.mistakes() === 1 ? 'Mai încercăm! Uite bulinuțele: numără-le cu grijă.' : 'Hai să numărăm împreună. Privește grupurile de mai jos.');
        this.focus();
      }
    }
  }

  protected hint(): void {
    this.helped.set(true);
    this.message.set('Sigur! Ne ajutăm de bulinuțe.');
    this.focus();
  }

  protected next(): void {
    this.clearAdvanceTimeout();
    if (this.solved() || this.revealed()) {
      const completed = {
        state: this.state(),
        helped: this.helped(),
        label: this.label(),
        feedback: this.solved() ? 'Bravo! Ai reușit!' : 'Am rezolvat împreună cu Cifrel.',
      };
      this.history.update(items => [...items, completed]);
    }
    const previous = this.question();
    const needsPractice = this.helped();
    const previousStage = this.stage();
    this.warmup.update(n => Math.max(0, n - 1));
    // Keep supported practice on a familiar topic, with smaller numbers if necessary.
    this.stage.set(needsPractice ? Math.min(previousStage, this.currentStage()) : this.currentStage());
    this.question.set(this.learning.question(this.stage(), previous));
    if (needsPractice) {
      const q = this.question();
      if (q.operandA > 5 || q.operandB > 5) {
        const operandA = Math.min(q.operandA, 5);
        const operandB = Math.min(q.operandB, q.operator === '-' ? operandA : 3);
        this.question.set({ ...q, operandA, operandB, correctAnswer: q.operator === '+' ? operandA + operandB : operandA - operandB });
      }
    }
    this.mistakes.set(0);
    this.helped.set(false);
    this.solved.set(false);
    this.revealed.set(false);
    this.message.set(needsPractice ? 'Încercăm un exercițiu asemănător. Sunt aici cu tine!' : 'Continuăm în ritmul tău!');
  }

  private currentStage(): number {
    return Math.max(0, this.learning.progress().stage - (this.warmup() > 0 ? 1 : 0));
  }

  get activeCard(): HTMLElement | undefined { return this.cards().at(-1)?.element; }

  private clearAdvanceTimeout(): void {
    if (this.advanceTimeout !== null) {
      clearTimeout(this.advanceTimeout);
      this.advanceTimeout = null;
    }
  }

  private focus(): void { this.cards().at(-1)?.focus(); }
}