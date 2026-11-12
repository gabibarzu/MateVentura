import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdventureService } from './adventure.service';

const KEY = 'mateventura:adventure:rocket';

describe('AdventureService', () => {
  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => { vi.restoreAllMocks(); localStorage.removeItem(KEY); });

  it('saves repaired pieces and restores them in a new session', () => {
    const service = new AdventureService();
    service.repair();
    service.repair();
    expect(new AdventureService().repaired()).toBe(2);
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
    for (const value of ['-1', '6', '1.5', 'oops']) {
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
  });
});