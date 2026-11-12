import { describe, expect, it } from 'vitest';
import { ADVENTURE_LEVELS, adventureLevel } from './adventure.models';

describe('Adventure exercises', () => {
  it('defines five scene pieces per level and mathematically valid answers in every position', () => {
    for (const level of ADVENTURE_LEVELS) {
      expect(level.tasks).toHaveLength(5);
      for (const task of level.tasks) {
        for (const step of task) {
          const q = step.equation;
          expect(q.result).toBe(q.operator === '+' ? q.operandA + q.operandB : q.operandA - q.operandB);
          expect(step.question.correctAnswer).toBe(step.answerPosition === 'result' ? q.result : q[step.answerPosition]);
          expect(step.question.correctAnswer).toBeGreaterThanOrEqual(0);
          expect(step.hint).not.toBe('');
        }
      }
    }
  });

  it('keeps the five original rocket calculations', () => {
    expect(adventureLevel('rocket').tasks.map(task => task[0].question.correctAnswer)).toEqual([5, 6, 4, 9, 8]);
    expect(adventureLevel('rocket').tasks.every(task => task.length === 1 && task[0].answerPosition === 'result')).toBe(true);
  });

  it('defines train place values, comparisons, sequence gaps and illustrated stories', () => {
    expect(ADVENTURE_LEVELS.map(level => level.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const [first, second] of adventureLevel('train').tasks) {
      expect(first.answerPosition).toBe('operandB');
      expect(first.question.correctAnswer).toBeLessThan(10);
      expect(second.question.correctAnswer).toBe(10 + first.question.correctAnswer);
    }
    for (const [step] of adventureLevel('balloons').tasks) {
      const [a, b] = step.comparison!;
      expect(step.question.correctAnswer).toBe(a < b ? 0 : a === b ? 1 : 2);
    }
    for (const [step] of adventureLevel('crystals').tasks) {
      const values = step.sequence!.map(n => n ?? step.question.correctAnswer);
      expect(step.sequence!.filter(n => n === null)).toHaveLength(1);
      expect(values[2] - values[1]).toBe(values[1] - values[0]);
      expect(values[3] - values[2]).toBe(values[1] - values[0]);
    }
    expect(adventureLevel('village').tasks.every(([step]) => step.prompt && step.illustration)).toBe(true);
  });

  it('uses missing addends on either side in forest additions up to ten', () => {
    const steps = adventureLevel('forest').tasks.map(task => task[0]);
    expect(new Set(steps.map(step => step.answerPosition))).toEqual(new Set(['operandA', 'operandB']));
    for (const step of steps) {
      expect(step.equation.operator).toBe('+');
      expect(step.equation.result).toBeLessThanOrEqual(10);
      expect(step.question.correctAnswer).toBeLessThanOrEqual(10);
    }
  });

  it('scaffolds 8+5, 9+4, 7+6 and 6+7 through ten before adding the remainder', () => {
    const tasks = adventureLevel('bridge').tasks;
    for (const [index, [a, b]] of [[8, 5], [9, 4], [7, 6], [6, 7]].entries()) {
      const [first, second] = tasks[index];
      expect(tasks[index]).toHaveLength(2);
      expect(first.answerPosition).toBe('operandB');
      expect(first.equation).toEqual({ operandA: a, operandB: 10 - a, operator: '+', result: 10 });
      expect(second.equation).toEqual({ operandA: 10, operandB: b - (10 - a), operator: '+', result: a + b });
      expect(second.answerPosition).toBe('result');
    }
  });

  it('scaffolds 13−5 as 13−3=10 followed by 10−2=8', () => {
    const [first, second] = adventureLevel('bridge').tasks[4];
    expect(first.question.correctAnswer).toBe(3);
    expect(first.equation).toEqual({ operandA: 13, operandB: 3, operator: '-', result: 10 });
    expect(second.equation).toEqual({ operandA: 10, operandB: 2, operator: '-', result: 8 });
    expect(second.question.correctAnswer).toBe(8);
  });

  it('consolidates addition, subtraction and missing numbers up to twenty at the lighthouse', () => {
    const steps = adventureLevel('lighthouse').tasks.flat();
    expect(new Set(steps.map(step => step.equation.operator))).toEqual(new Set(['+', '-']));
    expect(new Set(steps.map(step => step.answerPosition))).toEqual(new Set(['result', 'operandB', 'operandA']));
    for (const step of steps) {
      expect(Math.max(step.equation.operandA, step.equation.operandB, step.equation.result)).toBeLessThanOrEqual(20);
    }
  });
});