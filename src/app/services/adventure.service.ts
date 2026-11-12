import { computed, Injectable, signal } from '@angular/core';
import { AdventureLevelId, AdventureProgress, adventureLevel } from '../models/adventure.models';
import { STORAGE_PREFIX } from '../utils/storage-migration';

@Injectable({ providedIn: 'root' })
export class AdventureService {
  private readonly current = signal<Record<AdventureLevelId, AdventureProgress>>({
    rocket: this.load('rocket'), forest: this.load('forest'), bridge: this.load('bridge'),
  });
  readonly progress = this.current.asReadonly();
  private readonly unlockedThrough = signal(this.loadUnlocks());
  // Retain the original rocket API and scalar storage key for existing saves.
  readonly repaired = computed(() => this.current().rocket.completed);

  getProgress(level: AdventureLevelId): AdventureProgress {
    return this.current()[level];
  }

  isUnlocked(level: AdventureLevelId): boolean {
    return adventureLevel(level).number <= this.unlockedThrough();
  }

  private loadUnlocks(): number {
    // Existing Beta progress must remain accessible after introducing locks.
    let unlocked = 1;
    for (const id of ['rocket', 'forest', 'bridge'] as const) {
      const saved = this.getProgress(id);
      const level = adventureLevel(id);
      if (saved.completed || saved.step) unlocked = Math.max(unlocked, level.number);
      if (saved.completed === level.tasks.length) unlocked = Math.max(unlocked, Math.min(3, level.number + 1));
    }
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}adventure:unlocked`);
      if (stored && /^[1-3]$/.test(stored)) unlocked = Math.max(unlocked, Number(stored));
    } catch { /* Derive unlocks from available progress when storage is blocked. */ }
    return unlocked;
  }

  advance(level: AdventureLevelId): void {
    const saved = this.getProgress(level);
    const mission = adventureLevel(level);
    if (saved.completed >= mission.tasks.length) return;
    const nextStep = saved.step + 1;
    this.save(level, nextStep < mission.tasks[saved.completed].length
      ? { completed: saved.completed, step: nextStep }
      : { completed: saved.completed + 1, step: 0 });
  }

  repair(): void {
    this.advance('rocket');
  }

  restart(level: AdventureLevelId = 'rocket'): void {
    this.save(level, { completed: 0, step: 0 });
  }

  private save(level: AdventureLevelId, value: AdventureProgress): void {
    this.current.update(progress => ({ ...progress, [level]: value }));
    if (value.completed === adventureLevel(level).tasks.length) {
      this.unlockedThrough.update(current => Math.max(current, Math.min(3, adventureLevel(level).number + 1)));
    }
    try {
      localStorage.setItem(`${STORAGE_PREFIX}adventure:unlocked`, String(this.unlockedThrough()));
      localStorage.setItem(`${STORAGE_PREFIX}adventure:${level}`, level === 'rocket'
        ? String(value.completed) : JSON.stringify({ version: 1, ...value }));
    } catch { /* Play still works without storage. */ }
  }

  private load(level: AdventureLevelId): AdventureProgress {
    const empty = { completed: 0, step: 0 };
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}adventure:${level}`);
      if (raw === null) return empty;
      if (level === 'rocket') return /^[0-5]$/.test(raw) ? { completed: Number(raw), step: 0 } : empty;
      const value: unknown = JSON.parse(raw);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return empty;
      const { version, completed, step } = value as Record<string, unknown>;
      const tasks = adventureLevel(level).tasks;
      if (version !== 1 || typeof completed !== 'number' || !Number.isInteger(completed)
        || completed < 0 || completed > tasks.length || typeof step !== 'number' || !Number.isInteger(step)
        || step < 0 || step >= (tasks[completed]?.length ?? 1)) return empty;
      return { completed, step };
    } catch { return empty; }
  }
}