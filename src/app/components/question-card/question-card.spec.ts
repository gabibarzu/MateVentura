import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideIcons } from '../../icons';
import { QuestionState } from '../../models/game.models';
import { QuestionCard } from './question-card';

describe('QuestionCard equation positions', () => {
  let fixture: ComponentFixture<QuestionCard>;
  const pending: QuestionState = {
    question: { id: 1, operandA: 2, operandB: 3, operator: '+', correctAnswer: 5 },
    userAnswer: null, status: 'pending',
  };
  const input = () => (fixture.nativeElement as HTMLElement).querySelector('input')!;
  const equation = () => Array.from((fixture.nativeElement as HTMLElement).querySelector('.card__equation')!.children)
    .map(child => child.querySelector('input') ? '?' : child.textContent?.trim());

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', (media: string) => ({
      media, matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(),
    }));
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    await TestBed.configureTestingModule({ imports: [QuestionCard], providers: [provideIcons()] }).compileComponents();
    fixture = TestBed.createComponent(QuestionCard);
    fixture.componentRef.setInput('state', pending);
    fixture.componentRef.setInput('index', 0);
    fixture.componentRef.setInput('active', true);
    await fixture.whenStable();
  });

  afterEach(() => { fixture.destroy(); vi.unstubAllGlobals(); });

  it('retains the default game equation and emits only once after submitting', async () => {
    const answers: number[] = [];
    fixture.componentInstance.answered.subscribe(value => answers.push(value));
    expect(equation()).toEqual(['2', '+', '3', '=', '?']);
    input().value = '5';
    input().dispatchEvent(new Event('input', { bubbles: true }));
    fixture.componentInstance.submit();
    fixture.componentInstance.submit();
    await fixture.whenStable();
    expect(answers).toEqual([5]);
    expect(input().disabled).toBe(true);
  });

  it('moves the real input between addends without exposing the missing answer', async () => {
    fixture.componentRef.setInput('learning', true);
    fixture.componentRef.setInput('state', { ...pending, question: { ...pending.question, correctAnswer: 3 } });
    fixture.componentRef.setInput('equation', { operandA: 2, operandB: 3, operator: '+', result: 5 });
    fixture.componentRef.setInput('answerPosition', 'operandB');
    await fixture.whenStable();
    expect(equation()).toEqual(['2', '+', '?', '=', '5']);
    expect(input().getAttribute('aria-label')).toContain('2 + ? = 5');
    expect(input().value).toBe('');

    fixture.componentRef.setInput('answerPosition', 'operandA');
    fixture.componentRef.setInput('state', { ...pending, question: { ...pending.question, correctAnswer: 2 } });
    fixture.componentRef.setInput('retryToken', 1);
    await fixture.whenStable();
    expect(equation()).toEqual(['?', '+', '3', '=', '5']);
    expect(input().getAttribute('aria-label')).toContain('? + 3 = 5');
    expect(input().value).toBe('');
    expect(input().disabled).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.card__dots')).toBeNull();
  });

  it('keeps red/green feedback and fills the missing operand only when assistance locks it', async () => {
    fixture.componentRef.setInput('learning', true);
    fixture.componentRef.setInput('answerPosition', 'operandB');
    fixture.componentRef.setInput('equation', { operandA: 8, operandB: 2, operator: '+', result: 10 });
    const question = { id: 2, operandA: 8, operandB: 2, operator: '+' as const, correctAnswer: 2 };
    fixture.componentRef.setInput('state', { question, userAnswer: null, status: 'wrong' });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('.card--wrong')).not.toBeNull();
    fixture.componentRef.setInput('state', { question, userAnswer: null, status: 'correct' });
    fixture.componentRef.setInput('answerLocked', true);
    await fixture.whenStable();
    expect(input().value).toBe('2');
    expect(input().disabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('.card--correct')).not.toBeNull();

    fixture.componentRef.setInput('answerPosition', 'result');
    fixture.componentRef.setInput('equation', null);
    fixture.componentRef.setInput('state', pending);
    fixture.componentRef.setInput('answerLocked', false);
    fixture.componentRef.setInput('retryToken', 2);
    await fixture.whenStable();
    expect(equation()).toEqual(['2', '+', '3', '=', '?']);
    expect(input().value).toBe('');
    expect(input().disabled).toBe(false);
  });

  it('still offers counting dots when explicitly enabled in game mode', async () => {
    fixture.componentRef.setInput('showDots', true);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.card__dot')).toHaveLength(5);
  });

  it('cancels a pending invalid-answer shake when destroyed', () => {
    vi.useFakeTimers();
    try {
      fixture.componentInstance.submit();
      const timer = (fixture.componentInstance as any).shakeTimer;
      const clear = vi.spyOn(globalThis, 'clearTimeout');
      fixture.destroy();
      expect(clear).toHaveBeenCalledWith(timer);
      clear.mockRestore();
    } finally { vi.useRealTimers(); }
  });

  it('offers accessible comparison choices and highlights the demonstrated answer', async () => {
    fixture.componentRef.setInput('learning', true);
    fixture.componentRef.setInput('comparison', [8, 12]);
    const state = { ...pending, question: { ...pending.question, correctAnswer: 0 } };
    fixture.componentRef.setInput('state', state);
    await fixture.whenStable();
    const answers: number[] = [];
    fixture.componentInstance.answered.subscribe(value => answers.push(value));
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.card__choice');
    expect(buttons).toHaveLength(3);
    expect(buttons[0].getAttribute('aria-label')).toBe('Mai mic decât');
    expect((fixture.nativeElement as HTMLElement).querySelector('input')).toBeNull();
    buttons[0].click();
    expect(answers).toEqual([0]);
    fixture.componentRef.setInput('state', { ...state, status: 'correct' });
    fixture.componentRef.setInput('answerLocked', true);
    await fixture.whenStable();
    expect(buttons[0].classList.contains('card__choice--correct')).toBe(true);
    expect(Array.from(buttons).every(button => button.disabled)).toBe(true);
  });

  it('renders the missing sequence number in a real input with a descriptive label', async () => {
    fixture.componentRef.setInput('sequence', [15, null, 11, 9]);
    await fixture.whenStable();
    expect(input().getAttribute('aria-label')).toContain('15, ?, 11, 9');
    expect((fixture.nativeElement as HTMLElement).querySelector('.card__equation--sequence')).not.toBeNull();
  });
});