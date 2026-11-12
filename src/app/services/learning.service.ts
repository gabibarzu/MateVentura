import { Injectable, signal } from '@angular/core';
import { MathQuestion, OperationType } from '../models/game.models';
import { STORAGE_PREFIX } from '../utils/storage-migration';

export const LEARNING_STAGES: readonly { max: number; operation: OperationType; label: string }[] = [
  { max: 5, operation: 'add', label: 'Adunăm până la 5' },
  { max: 10, operation: 'add', label: 'Adunăm până la 10' },
  { max: 5, operation: 'subtract', label: 'Descoperim scăderea' },
  { max: 10, operation: 'subtract', label: 'Scădem până la 10' },
  { max: 10, operation: 'mix', label: 'Adunăm și scădem până la 10' },
  { max: 20, operation: 'add', label: 'Adunăm până la 20' },
  { max: 20, operation: 'subtract', label: 'Scădem până la 20' },
  { max: 20, operation: 'mix', label: 'Adunăm și scădem până la 20' },
];

const KEY = `${STORAGE_PREFIX}learning`;
interface LearningProgress { version: 1; stage: number; streak: number; supported: number; }
const initialProgress = (): LearningProgress => ({ version: 1, stage: 0, streak: 0, supported: 0 });

/** Learning progress is independent from timed games and leaderboard scores. */
@Injectable({ providedIn: 'root' })
export class LearningService {
  private readonly state = signal<LearningProgress>(this.load());
  readonly progress = this.state.asReadonly();
  private nextId = 1;

  reset(): void {
    this.state.set(initialProgress());
    this.persist();
  }

  complete(withHelp: boolean, warmup: boolean): void {
    if (warmup) return;
    const current = this.state();
    const streak = withHelp ? 0 : current.streak + 1;
    const supported = withHelp ? current.supported + 1 : 0;
    if (streak >= 4 && current.stage < LEARNING_STAGES.length - 1) {
      this.state.set({ version: 1, stage: current.stage + 1, streak: 0, supported: 0 });
    } else if (supported >= 2 && current.stage > 0) {
      this.state.set({ version: 1, stage: current.stage - 1, streak: 0, supported: 0 });
    } else {
      this.state.set({ ...current, streak: Math.min(streak, 4), supported: Math.min(supported, 2) });
    }
    this.persist();
  }

  question(stage: number, previous?: MathQuestion): MathQuestion {
    const config = LEARNING_STAGES[stage];
    let question: MathQuestion;
    let attempts = 0;
    do {
      const operator = config.operation === 'add' ? '+' : config.operation === 'subtract' ? '-' : Math.random() < 0.5 ? '+' : '-';
      const total = 2 + Math.floor(Math.random() * (config.max - 1));
      const operandB = 1 + Math.floor(Math.random() * (operator === '+' ? total - 1 : total));
      const operandA = operator === '+' ? total - operandB : total;
      question = { id: this.nextId++, operandA, operandB, operator, correctAnswer: operator === '+' ? total : operandA - operandB };
    } while (++attempts < 10 && previous?.operandA === question.operandA && previous?.operandB === question.operandB && previous?.operator === question.operator);
    return question;
  }

  private load(): LearningProgress {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (typeof value !== 'object' || value === null) return initialProgress();
      const p = value as Record<string, unknown>;
      if (p['version'] === 1 && Number.isInteger(p['stage']) && Number.isInteger(p['streak']) && Number.isInteger(p['supported']) &&
          Number(p['stage']) >= 0 && Number(p['stage']) < LEARNING_STAGES.length &&
          Number(p['streak']) >= 0 && Number(p['streak']) <= 4 && Number(p['supported']) >= 0 && Number(p['supported']) <= 2) {
        return { version: 1, stage: Number(p['stage']), streak: Number(p['streak']), supported: Number(p['supported']) };
      }
    } catch { /* Storage is optional; learning still works in memory. */ }
    return initialProgress();
  }

  private persist(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.state())); }
    catch { /* Storage unavailable: keep this session's progress in memory. */ }
  }
}