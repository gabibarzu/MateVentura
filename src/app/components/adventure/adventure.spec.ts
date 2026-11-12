import { Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideIcons } from '../../icons';
import { AdventureLevelId } from '../../models/adventure.models';
import { QuestionState } from '../../models/game.models';
import { AdventureService } from '../../services/adventure.service';
import { ConfettiService } from '../../services/confetti.service';
import { Adventure } from './adventure';

// Test the protected UI actions without widening the component's public API.
interface MissionActions {
  enterMission(level: AdventureLevelId): void;
  start(): void;
  answer(value: number): void;
  backToMap(): void;
  launch(): void;
  replay(): void;
  state: Signal<QuestionState>;
  onMap: Signal<boolean>;
  finale: Signal<boolean>;
  countdown: Signal<number | null>;
  launched: Signal<boolean>;
  exerciseIndex: Signal<number>;
  stepIndex: Signal<number>;
}

describe('Adventure mission flow', () => {
  let fixture: ComponentFixture<Adventure>;
  let mission: MissionActions;
  let service: AdventureService;
  const clearProgress = () => {
    for (const id of ['rocket', 'forest', 'bridge']) localStorage.removeItem(`mateventura:adventure:${id}`);
    localStorage.removeItem('mateventura:adventure:unlocked');
  };
  const enter = (level: AdventureLevelId) => {
    mission.enterMission(level);
    mission.start();
    // Let the initial focus callback finish before sending answers.
    vi.advanceTimersByTime(0);
  };
  const solve = () => {
    mission.answer(mission.state().question.correctAnswer);
    vi.advanceTimersByTime(1100);
  };

  beforeEach(async () => {
    clearProgress();
    // Exercise individual mission flows after the map has been unlocked.
    localStorage.setItem('mateventura:adventure:unlocked', '3');
    vi.stubGlobal('matchMedia', (media: string) => ({
      media, matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(),
    }));
    await TestBed.configureTestingModule({
      imports: [Adventure], providers: [provideIcons(), { provide: ConfettiService, useValue: { celebrate: vi.fn(async () => {}) } }],
    }).compileComponents();
    vi.useFakeTimers();
    fixture = TestBed.createComponent(Adventure);
    mission = fixture.componentInstance as unknown as MissionActions;
    service = TestBed.inject(AdventureService);
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    clearProgress();
  });

  it('opens previously unlocked map levels and renders a missing operand with no dots', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('button.map-level')).toHaveLength(3);
    enter('forest');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.forest-scene')).not.toBeNull();
    const field = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    expect(field.getAttribute('aria-label')).toContain('2 + ? = 5');
    expect((fixture.nativeElement as HTMLElement).querySelector('.card__dots')).toBeNull();
  });

  it('auto-progresses through five forest lanterns and reveals fireflies', () => {
    enter('forest');
    for (let i = 0; i < 5; i++) solve();
    expect(service.getProgress('forest')).toEqual({ completed: 5, step: 0 });
    expect(service.repaired()).toBe(0);
    expect(mission.finale()).toBe(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.lantern--lit')).toHaveLength(5);
    expect((fixture.nativeElement as HTMLElement).querySelector('.fireflies')).not.toBeNull();
  });

  it('requires both scaffold steps before mounting each board and finishes with 13−5', () => {
    enter('bridge');
    expect(mission.state().question.correctAnswer).toBe(2);
    solve();
    expect(service.getProgress('bridge')).toEqual({ completed: 0, step: 1 });
    expect(mission.state().question.correctAnswer).toBe(13);
    solve();
    expect(service.getProgress('bridge')).toEqual({ completed: 1, step: 0 });
    for (let i = 0; i < 6; i++) solve();
    expect(mission.state().question.correctAnswer).toBe(3);
    solve();
    expect(mission.state().question.correctAnswer).toBe(8);
    solve();
    expect(service.getProgress('bridge')).toEqual({ completed: 5, step: 0 });
    expect(mission.finale()).toBe(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.bridge-board--ready')).toHaveLength(5);
    expect((fixture.nativeElement as HTMLElement).querySelector('.bridge-scene--complete')).not.toBeNull();
  });

  it('brings each board above the bridge after step one and mounts it after step two', () => {
    enter('bridge');
    for (let board = 0; board < 5; board++) {
      mission.answer(mission.state().question.correctAnswer);
      fixture.detectChanges();
      const scene = fixture.nativeElement as HTMLElement;
      expect(scene.querySelectorAll('.bridge-board--staged')).toHaveLength(1);
      expect(scene.querySelector('.bridge-board--staged')?.textContent?.trim()).toBe(String(board + 1));
      expect(scene.querySelectorAll('.bridge-board--ready')).toHaveLength(board);
      vi.advanceTimersByTime(1100);
      fixture.detectChanges();
      expect(scene.querySelectorAll('.bridge-board--staged')).toHaveLength(1);
      solve();
      fixture.detectChanges();
      expect(scene.querySelector('.bridge-board--staged')).toBeNull();
      expect(scene.querySelectorAll('.bridge-board--ready')).toHaveLength(board + 1);
    }
  });

  it('shows red for mistakes, helps after three and automatically continues just one step', () => {
    enter('bridge');
    for (let i = 0; i < 3; i++) {
      mission.answer(99);
      expect(mission.state().status).toBe('wrong');
      expect(service.getProgress('bridge')).toEqual({ completed: 0, step: 0 });
      vi.advanceTimersByTime(900);
    }
    expect(mission.state().status).toBe('correct');
    expect(service.getProgress('bridge')).toEqual({ completed: 0, step: 1 });
    mission.answer(13);
    expect(service.getProgress('bridge').completed).toBe(0);
    vi.advanceTimersByTime(2600);
    expect(mission.stepIndex()).toBe(1);
    expect(mission.state().status).toBe('pending');
  });

  it('ignores repeated submits and invalid numeric values', () => {
    enter('forest');
    for (const answer of [NaN, Infinity, -1, 1.5]) mission.answer(answer);
    expect(mission.state().status).toBe('pending');
    const answer = mission.state().question.correctAnswer;
    mission.answer(answer);
    mission.answer(answer);
    expect(service.getProgress('forest').completed).toBe(1);
    vi.advanceTimersByTime(1100);
    expect(mission.exerciseIndex()).toBe(1);
  });

  it('cancels pending assistance on the map without granting progress', () => {
    enter('forest');
    for (let i = 0; i < 2; i++) { mission.answer(99); vi.advanceTimersByTime(900); }
    mission.answer(99);
    mission.backToMap();
    vi.advanceTimersByTime(10000);
    expect(mission.onMap()).toBe(true);
    expect(service.getProgress('forest')).toEqual({ completed: 0, step: 0 });
    enter('bridge');
    expect(mission.state().status).toBe('pending');
    expect(service.getProgress('bridge')).toEqual({ completed: 0, step: 0 });
  });

  it('preserves a solved bridge step when leaving during green feedback', () => {
    enter('bridge');
    mission.answer(2);
    mission.backToMap();
    vi.advanceTimersByTime(10000);
    enter('bridge');
    expect(mission.exerciseIndex()).toBe(0);
    expect(mission.stepIndex()).toBe(1);
    expect(mission.state().question.correctAnswer).toBe(13);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.bridge-board--staged')).not.toBeNull();
  });

  it('cancels a rocket countdown on the map and leaves launch replayable', () => {
    for (let i = 0; i < 5; i++) service.repair();
    mission.enterMission('rocket');
    mission.launch();
    expect(mission.countdown()).toBe(3);
    mission.backToMap();
    vi.advanceTimersByTime(10000);
    expect(mission.launched()).toBe(false);
    expect(service.repaired()).toBe(5);
    mission.enterMission('rocket');
    mission.launch();
    vi.advanceTimersByTime(2400);
    expect(mission.launched()).toBe(true);
  });

  it('replays only the selected level and cancels timers on destroy', () => {
    service.repair();
    enter('forest');
    solve();
    mission.replay();
    expect(service.getProgress('forest').completed).toBe(0);
    expect(service.repaired()).toBe(1);
    mission.answer(99);
    fixture.destroy();
    vi.advanceTimersByTime(10000);
    expect(service.getProgress('forest').completed).toBe(0);
  });
});