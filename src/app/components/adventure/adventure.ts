import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QuestionState } from '../../models/game.models';
import { AdventureService } from '../../services/adventure.service';
import { ConfettiService } from '../../services/confetti.service';
import { Cifrel } from '../cifrel/cifrel';
import { QuestionCard } from '../question-card/question-card';

const PARTS = ['Motorul', 'Aripa stângă', 'Aripa dreaptă', 'Hubloul', 'Vârful rachetei'];
const EXERCISES = [
  { a: 2, b: 3, subtract: false },
  { a: 4, b: 2, subtract: false },
  { a: 7, b: 3, subtract: true },
  { a: 5, b: 4, subtract: false },
  { a: 10, b: 2, subtract: true },
];

@Component({
  selector: 'app-adventure',
  imports: [MatButtonModule, MatIconModule, QuestionCard, Cifrel],
  templateUrl: './adventure.html',
  styleUrl: './adventure.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Adventure {
  protected readonly adventure = inject(AdventureService);
  private readonly confetti = inject(ConfettiService);
  private readonly card = viewChild(QuestionCard);
  protected readonly parts = PARTS;
  protected readonly started = signal(false);
  protected readonly solved = signal(false);
  protected readonly launched = signal(false);
  protected readonly countdown = signal<number | null>(null);
  protected readonly landed = signal(false);
  protected readonly wrong = signal(false);
  protected readonly retryToken = signal(0);
  protected readonly mistakes = signal(0);
  protected readonly message = signal('');
  protected readonly complete = computed(() => this.adventure.repaired() === PARTS.length);
  private timer: ReturnType<typeof setTimeout> | undefined;
  // Keep the solved calculation visible briefly while its piece is being fitted.
  protected readonly exerciseIndex = signal(this.adventure.repaired());
  protected readonly state = computed<QuestionState>(() => {
    const index = Math.min(this.exerciseIndex(), EXERCISES.length - 1);
    const { a, b, subtract } = EXERCISES[index];
    return {
      question: { id: index + 1, operandA: a, operandB: b, operator: subtract ? '-' : '+',
        correctAnswer: subtract ? a - b : a + b },
      status: this.solved() ? 'correct' : this.wrong() ? 'wrong' : 'pending',
      userAnswer: null,
    };
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected start(): void {
    this.started.set(true);
    this.later(() => this.card()?.focus(), 0);
  }

  protected answer(value: number): void {
    if (this.solved() || this.wrong() || this.exerciseIndex() >= PARTS.length) return;
    if (value !== this.state().question.correctAnswer) {
      this.mistakes.update(n => n + 1);
      this.wrong.set(true);
      if (this.mistakes() >= 3) {
        this.message.set('Reparăm împreună. Cifrel îți arată calculul.');
        this.later(() => { this.wrong.set(false); this.repair(true); }, 900);
      } else {
        this.message.set(this.mistakes() === 1 ? 'Mai încercăm! Nu pierzi nicio piesă.'
          : 'Cifrel te ajută: ' + this.state().question.operandA + (this.state().question.operator === '+'
            ? ' și încă ' : ' din care iei ') + this.state().question.operandB + '. Ia-o încet.');
        this.later(() => {
          this.wrong.set(false);
          this.retryToken.update(n => n + 1);
        }, 900);
      }
      return;
    }
    this.repair(false);
  }

  private repair(withHelp: boolean): void {
    this.solved.set(true);
    this.adventure.repair();
    this.message.set(withHelp
      ? `Reparăm împreună: ${this.state().question.operandA} ${this.state().question.operator} ${this.state().question.operandB} = ${this.state().question.correctAnswer}. Piesa este montată!`
      : `${PARTS[this.exerciseIndex()]}: gata!`);
    this.later(() => {
      this.next();
      if (this.complete()) this.launch();
    }, withHelp ? 2600 : 1100);
  }

  private next(): void {
    this.exerciseIndex.set(this.adventure.repaired());
    this.solved.set(false);
    this.wrong.set(false);
    this.mistakes.set(0);
    this.message.set('');
    this.retryToken.update(n => n + 1);
  }

  protected launch(): void {
    if (this.launched() || this.countdown() !== null) return;
    this.countdown.set(3);
    const tick = () => {
      const count = this.countdown()!;
      if (count > 1) {
        this.countdown.set(count - 1);
        this.later(tick, 800);
      } else {
        this.countdown.set(null);
        this.launched.set(true);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          void this.confetti.celebrate(1600).catch(() => { /* Launch works without confetti. */ });
        }
        this.later(() => this.landed.set(true), 3200);
      }
    };
    this.later(tick, 800);
  }

  protected replay(): void {
    this.adventure.restart();
    clearTimeout(this.timer);
    this.launched.set(false);
    this.landed.set(false);
    this.countdown.set(null);
    this.next();
    this.started.set(true);
  }

  private later(action: () => void, delay: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(action, delay);
  }
}