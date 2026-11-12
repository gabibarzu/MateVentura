import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdventureService } from './adventure.service';
import { ADVENTURE_LEVELS, AdventureLevelId } from '../models/adventure.models';
import { migrateStorageKeys } from '../utils/storage-migration';

const KEY = 'mateventura:adventure:rocket';
const LEVELS: AdventureLevelId[] = ['rocket', 'forest', 'bridge'];
const clearProgress = () => {
  for (const level of ADVENTURE_LEVELS) localStorage.removeItem(`mateventura:adventure:${level.id}`);
  localStorage.removeItem('mateventura:adventure:unlocked');
  localStorage.removeItem('mate-aventura:adventure:rocket');
};

describe('AdventureService', () => {
  beforeEach(clearProgress);
  afterEach(() => { vi.restoreAllMocks(); clearProgress(); });

  it('unlocks levels sequentially and keeps them unlocked after replay and reload', () => {
    const service = new AdventureService();
    expect(LEVELS.map(level => service.isUnlocked(level))).toEqual([true, false, false]);
    for (let i = 0; i < 4; i++) service.repair();
    expect(service.isUnlocked('forest')).toBe(false);
    service.repair();
    expect(service.isUnlocked('forest')).toBe(true);
    expect(service.isUnlocked('bridge')).toBe(false);
    for (let i = 0; i < 5; i++) service.advance('forest');
    expect(service.isUnlocked('bridge')).toBe(true);
    service.restart('rocket');
    service.restart('forest');
    expect(LEVELS.map(level => new AdventureService().isUnlocked(level))).toEqual([true, true, true]);
  });

  it('keeps existing Beta progress accessible and ignores malformed unlock saves', () => {
    localStorage.setItem('mateventura:adventure:unlocked', '99');
    expect(new AdventureService().isUnlocked('forest')).toBe(false);
    localStorage.setItem('mateventura:adventure:bridge', JSON.stringify({ version: 1, completed: 0, step: 1 }));
    const service = new AdventureService();
    expect(service.isUnlocked('forest')).toBe(true);
    expect(service.isUnlocked('bridge')).toBe(true);
  });

  it('saves repaired pieces and restores them in a new session', () => {
    const service = new AdventureService();
    service.repair();
    service.repair();
    expect(new AdventureService().repaired()).toBe(2);
  });

  it('resets all campaign progress and unlocks persistently without clearing other app data', () => {
    const service = new AdventureService();
    localStorage.setItem('mateventura:test-preserved', 'keep');
    try {
      for (const level of ADVENTURE_LEVELS) for (let i = 0; i < 10; i++) service.advance(level.id);
      service.restartAll();
      const restored = new AdventureService();
      for (const level of ADVENTURE_LEVELS) {
        expect(restored.getProgress(level.id)).toEqual({ completed: 0, step: 0 });
        expect(restored.isUnlocked(level.id)).toBe(level.id === 'rocket');
      }
      expect(localStorage.getItem('mateventura:test-preserved')).toBe('keep');
    } finally { localStorage.removeItem('mateventura:test-preserved'); }
  });

  it('caps the mission at five pieces and supports explicit replay', () => {
    const service = new AdventureService();
    for (let i = 0; i < 8; i++) service.repair();
    expect(service.repaired()).toBe(5);
    service.restart();
    expect(service.repaired()).toBe(0);
    expect(new AdventureService().repaired()).toBe(0);
  });

  it('rejects invalid stored progress', () => {
    for (const value of ['-1', '6', '1.5', 'oops', '', ' ', '0x3', '3e0', 'null', 'true']) {
      localStorage.setItem(KEY, value);
      expect(new AdventureService().repaired()).toBe(0);
    }
  });

  it('keeps the mission playable when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const service = new AdventureService();
    service.repair();
    expect(service.repaired()).toBe(1);
    service.advance('forest');
    service.advance('bridge');
    expect(service.getProgress('forest')).toEqual({ completed: 1, step: 0 });
    expect(service.getProgress('bridge')).toEqual({ completed: 0, step: 1 });
  });

  it('persists each level independently, including an unfinished bridge board', () => {
    const service = new AdventureService();
    service.repair();
    service.advance('forest');
    service.advance('forest');
    service.advance('bridge');
    const restored = new AdventureService();
    expect(restored.progress()).toMatchObject({
      rocket: { completed: 1, step: 0 }, forest: { completed: 2, step: 0 }, bridge: { completed: 0, step: 1 },
    });
    restored.advance('bridge');
    expect(restored.getProgress('bridge')).toEqual({ completed: 1, step: 0 });
    restored.restart('forest');
    const afterReset = new AdventureService();
    expect(afterReset.getProgress('forest')).toEqual({ completed: 0, step: 0 });
    expect(afterReset.repaired()).toBe(1);
    expect(afterReset.getProgress('bridge')).toEqual({ completed: 1, step: 0 });
  });

  it('caps all levels, with two steps per bridge board, and resets bridge steps', () => {
    const service = new AdventureService();
    for (const level of LEVELS) {
      for (let i = 0; i < 15; i++) service.advance(level);
      expect(service.getProgress(level)).toEqual({ completed: 5, step: 0 });
    }
    service.restart('bridge');
    service.advance('bridge');
    expect(service.getProgress('bridge')).toEqual({ completed: 0, step: 1 });
    service.restart('bridge');
    expect(new AdventureService().getProgress('bridge')).toEqual({ completed: 0, step: 0 });
  });

  it('unlocks and restores all eight missions, including a half-coupled train wagon', () => {
    const service = new AdventureService();
    for (const level of ADVENTURE_LEVELS) {
      expect(service.isUnlocked(level.id)).toBe(true);
      for (const task of level.tasks) task.forEach(() => service.advance(level.id));
    }
    const restored = new AdventureService();
    for (const level of ADVENTURE_LEVELS) {
      expect(restored.isUnlocked(level.id)).toBe(true);
      expect(restored.getProgress(level.id)).toEqual({ completed: 5, step: 0 });
    }
    restored.restart('train');
    restored.advance('train');
    expect(new AdventureService().getProgress('train')).toEqual({ completed: 0, step: 1 });
    expect(new AdventureService().isUnlocked('village')).toBe(true);
  });

  it('rejects malformed, out-of-range and incompatible versioned saves independently', () => {
    localStorage.setItem(KEY, '4');
    const invalid = [
      'oops', 'null', '[]', '3', '{}',
      ...[
        { version: 2, completed: 1, step: 0 }, { version: 1, completed: -1, step: 0 },
        { version: 1, completed: 6, step: 0 }, { version: 1, completed: 1.5, step: 0 },
        { version: 1, completed: '2', step: 0 }, { version: 1, completed: 0, step: -1 },
        { version: 1, completed: 0, step: 2 }, { version: 1, completed: 0, step: .5 },
        { version: 1, completed: 0, step: '0' }, { version: 1, completed: 5, step: 1 },
      ].map(value => JSON.stringify(value)),
    ];
    for (const value of invalid) {
      for (const level of ['forest', 'bridge'] as const) localStorage.setItem(`mateventura:adventure:${level}`, value);
      const service = new AdventureService();
      expect(service.repaired()).toBe(4);
      expect(service.getProgress('forest')).toEqual({ completed: 0, step: 0 });
      expect(service.getProgress('bridge')).toEqual({ completed: 0, step: 0 });
    }
    localStorage.setItem('mateventura:adventure:forest', JSON.stringify({ version: 1, completed: 0, step: 1 }));
    expect(new AdventureService().getProgress('forest')).toEqual({ completed: 0, step: 0 });
  });

  it('preserves legacy rocket progress through the existing prefix migration', () => {
    localStorage.setItem('mate-aventura:adventure:rocket', '3');
    migrateStorageKeys();
    const service = new AdventureService();
    expect(service.repaired()).toBe(3);
    service.repair();
    expect(localStorage.getItem(KEY)).toBe('4');
    expect(localStorage.getItem('mate-aventura:adventure:rocket')).toBeNull();
  });

  it('does not replace a current rocket save with an older legacy save', () => {
    localStorage.setItem(KEY, '4');
    localStorage.setItem('mate-aventura:adventure:rocket', '2');
    migrateStorageKeys();
    expect(new AdventureService().repaired()).toBe(4);
  });
});