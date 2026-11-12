import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AnswerPosition, QuestionEquation, QuestionState } from '../../models/game.models';
import { Cifrel, CifrelMood } from '../cifrel/cifrel';

const MAX_ANSWER_LENGTH = 3;
const EDITING_KEYS = new Set(['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab']);
const PRAISES = ['Bravo!', 'Super!', 'Genial!', 'Excelent!', 'Ești grozav!', 'Ce isteț ești!'];

type DotKind = 'a' | 'b' | 'taken';

@Component({
  selector: 'app-question-card',
  imports: [NgTemplateOutlet, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, Cifrel],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionCard {
  readonly state = input.required<QuestionState>();
  readonly index = input.required<number>();
  readonly active = input.required<boolean>();
  readonly showDots = input(false);
  readonly learning = input(false);
  readonly badge = input<string | null>(null);
  readonly feedback = input('');
  readonly retryToken = input(0);
  readonly answerLocked = input(false);
  readonly answerPosition = input<AnswerPosition>('result');
  readonly equation = input<QuestionEquation | null>(null);

  readonly answered = output<number>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  protected readonly maxLength = MAX_ANSWER_LENGTH;
  protected readonly answerControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d+$/)],
  });

  protected readonly shake = signal(false);
  protected readonly praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];

  protected readonly question = computed(() => this.state().question);
  protected readonly displayedEquation = computed<QuestionEquation>(() => this.equation() ?? {
    operandA: this.question().operandA, operandB: this.question().operandB,
    operator: this.question().operator, result: this.question().correctAnswer,
  });
  protected readonly answerLabel = computed(() => {
    const q = this.displayedEquation();
    if (this.answerPosition() === 'result') return `Răspuns pentru ${q.operandA} ${q.operator} ${q.operandB}`;
    return `Numărul lipsă din ${this.answerPosition() === 'operandA' ? '?' : q.operandA} ${q.operator} ${this.answerPosition() === 'operandB' ? '?' : q.operandB} = ${q.result}`;
  });
  protected readonly status = computed(() => this.state().status);
  protected readonly cifrelMood = computed<CifrelMood>(() => {
    switch (this.status()) {
      case 'correct':
        return 'happy';
      case 'wrong':
        return 'oops';
      default:
        return 'neutral';
    }
  });
  /**
   * Counting helper shown under the answer:
   * addition = all dots of both numbers together; subtraction = first number with the last dots crossed out.
   */
  protected readonly helperDots = computed<DotKind[]>(() => {
    const { operandA, operandB, operator } = this.question();
    if (operator === '+') {
      return [...Array<DotKind>(operandA).fill('a'), ...Array<DotKind>(operandB).fill('b')];
    }
    return Array.from({ length: operandA }, (_, i): DotKind => (i >= operandA - operandB ? 'taken' : 'a'));
  });

  constructor() {
    // Missing-number steps can move the input to a different embedded view.
    // Focus only after that view has been rendered, not the previous step's input.
    afterRenderEffect(() => {
      this.retryToken();
      this.answerPosition();
      if (this.learning() && this.active() && !this.answerLocked()) this.focus();
    });
    effect(() => {
      if (!this.learning()) return;
      this.retryToken();
      if (this.answerLocked()) {
        this.answerControl.setValue(String(this.question().correctAnswer));
        this.answerControl.disable();
      } else {
        this.answerControl.reset();
        this.answerControl.enable();
        this.focus();
      }
    });
    // Each card is rendered for the first time when it becomes the active question: focus its input.
    // (Scrolling is handled by the App, which knows about the sticky header and the mobile keyboard.)
    afterNextRender(() => {
      if (this.active()) {
        this.focus();
      }
    });
  }

  get element(): HTMLElement {
    return this.host.nativeElement;
  }

  focus(): void {
    this.answerInput()?.nativeElement.focus({ preventScroll: true });
  }

  /** Accept only digits (plus editing keys); ENTER submits the answer. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submit();
      return;
    }

    const isDigit = /^\d$/.test(event.key);
    // 'Unidentified' is reported by some mobile virtual keyboards; the input sanitizer handles those.
    const isAllowed =
      isDigit || EDITING_KEYS.has(event.key) || event.key === 'Unidentified' || event.ctrlKey || event.metaKey;

    if (!isAllowed) {
      event.preventDefault();
    }
  }

  /**
   * Keeps only digits (e.g. pasted text or mobile keyboard input) and drops leading zeros
   * ("05" -> "5", "000" -> "0"; a single "0" stays, it's a valid subtraction result).
   */
  protected sanitize(): void {
    const value = this.answerControl.value;
    const digitsOnly = value
      .replace(/\D/g, '')
      .replace(/^0+(?=\d)/, '')
      .slice(0, MAX_ANSWER_LENGTH);
    if (digitsOnly !== value) {
      this.answerControl.setValue(digitsOnly);
    }
  }

  submit(): void {
    if (!this.active() || this.answerLocked() || this.answerControl.disabled || this.status() !== 'pending') {
      return;
    }
    if (this.answerControl.invalid) {
      this.triggerShake();
      return;
    }

    if (!this.learning()) this.answerControl.disable();
    this.answered.emit(Number(this.answerControl.value));
  }

  private triggerShake(): void {
    this.shake.set(true);
    setTimeout(() => this.shake.set(false), 450);
  }
}
