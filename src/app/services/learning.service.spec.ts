import { TestBed } from '@angular/core/testing';
import { LEARNING_STAGES, LearningService } from './learning.service';
import { STORAGE_PREFIX } from '../utils/storage-migration';

describe('LearningService', () => {
  const key = `${STORAGE_PREFIX}learning`;
  let service: LearningService;

  beforeEach(() => {
    localStorage.removeItem(key);
    TestBed.configureTestingModule({});
    service = TestBed.inject(LearningService);
  });

  afterEach(() => localStorage.removeItem(key));

  it('advances only after four independent answers', () => {
    for (let i = 0; i < 3; i++) service.complete(false, false);
    expect(service.progress().stage).toBe(0);
    service.complete(false, false);
    expect(service.progress().stage).toBe(1);
    expect(service.progress().streak).toBe(0);
  });

  it('does not count warmup answers towards mastery', () => {
    service.complete(false, true);
    expect(service.progress().streak).toBe(0);
  });

  it('breaks an independent streak after assistance and steps back after repeated assistance', () => {
    for (let i = 0; i < 4; i++) service.complete(false, false);
    service.complete(false, false);
    service.complete(true, false);
    expect(service.progress().streak).toBe(0);
    expect(service.progress().stage).toBe(1);
    service.complete(true, false);
    expect(service.progress().stage).toBe(0);
  });

  it('persists learning independently of leaderboard scores and resets it', () => {
    service.complete(false, false);
    expect(JSON.parse(localStorage.getItem(key)!).streak).toBe(1);
    service.reset();
    expect(service.progress()).toEqual({ version: 1, stage: 0, streak: 0, supported: 0 });
  });

  it('rejects invalid stored stages', () => {
    localStorage.setItem(key, JSON.stringify({ version: 1, stage: 500, streak: 0, supported: 0 }));
    TestBed.resetTestingModule();
    expect(TestBed.inject(LearningService).progress().stage).toBe(0);
  });

  it('generates nonnegative exercises within every stage range', () => {
    for (const [index, stage] of LEARNING_STAGES.entries()) {
      for (let i = 0; i < 30; i++) {
        const q = service.question(index);
        expect(q.correctAnswer).toBe(q.operator === '+' ? q.operandA + q.operandB : q.operandA - q.operandB);
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(Math.max(q.operandA, q.operandB, q.correctAnswer)).toBeLessThanOrEqual(stage.max);
        if (stage.operation !== 'mix') expect(q.operator).toBe(stage.operation === 'add' ? '+' : '-');
      }
    }
  });
});