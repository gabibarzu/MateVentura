import { Injectable } from '@angular/core';
import { GameSettings, MathQuestion, Operator } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class QuestionGeneratorService {
  private nextId = 1;

  generate(settings: GameSettings): MathQuestion[] {
    const questions: MathQuestion[] = [];

    for (let i = 0; i < settings.questionCount; i++) {
      const previous = questions.at(-1);
      let question = this.createQuestion(settings);

      // Avoid showing the exact same exercise twice in a row.
      for (let attempt = 0; attempt < 10 && previous && this.isSame(question, previous); attempt++) {
        question = this.createQuestion(settings);
      }
      questions.push(question);
    }

    return questions;
  }

  private createQuestion(settings: GameSettings): MathQuestion {
    const operator: Operator =
      settings.operation === 'add'
        ? '+'
        : settings.operation === 'subtract'
          ? '-'
          : Math.random() < 0.5
            ? '+'
            : '-';

    const max = settings.maxSum;

    if (operator === '+') {
      // The sum never exceeds the configured maximum.
      const sum = this.randomInt(2, max);
      const operandA = this.randomInt(1, sum - 1);
      const operandB = sum - operandA;
      return { id: this.nextId++, operandA, operandB, operator, correctAnswer: sum };
    }

    // Subtraction: operandA >= operandB, so the result is never negative.
    const operandA = this.randomInt(2, max);
    const operandB = this.randomInt(1, operandA);
    return { id: this.nextId++, operandA, operandB, operator, correctAnswer: operandA - operandB };
  }

  private isSame(a: MathQuestion, b: MathQuestion): boolean {
    return a.operandA === b.operandA && a.operandB === b.operandB && a.operator === b.operator;
  }

  /** Random integer between min and max (both inclusive). */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
