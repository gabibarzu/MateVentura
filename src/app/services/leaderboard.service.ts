import { computed, Injectable, signal } from '@angular/core';
import {
  GameResult,
  LeaderboardEntry,
  LEVELS,
  LevelId,
  MAX_SUM_OPTIONS,
  MaxSumOption,
  OPERATION_OPTIONS,
} from '../models/game.models';

const STORAGE_KEY = 'mate-aventura:leaderboard';
const PLAYER_KEY = 'mate-aventura:player';
const MAX_ENTRIES_PER_LEVEL = 10;
export const PLAYER_NAME_MAX_LENGTH = 20;

/**
 * Leaderboard persisted in localStorage: one list per level (Ușor / Mediu / Greu),
 * ranked by correct answers (desc) then time (asc).
 */
@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly entriesState = signal<LeaderboardEntry[]>(this.load());
  private readonly lastSavedIdState = signal<string | null>(null);

  readonly entries = this.entriesState.asReadonly();
  readonly lastSavedId = this.lastSavedIdState.asReadonly();

  /** Levels that have at least one score. */
  readonly levelsWithScores = computed(() => {
    const levels = new Set<LevelId>();
    for (const entry of this.entriesState()) {
      const level = levelOf(entry);
      if (level) {
        levels.add(level);
      }
    }
    return levels;
  });

  ranked(level: LevelId): LeaderboardEntry[] {
    return this.entriesState()
      .filter((e) => levelOf(e) === level)
      .sort(compareEntries);
  }

  /** Saves a score and returns its 1-based rank in the level, or `null` if it didn't make the top list. */
  save(result: GameResult, rawName: string, level: LevelId): number | null {
    const name = rawName.trim().slice(0, PLAYER_NAME_MAX_LENGTH);
    const entry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      correct: result.correct,
      total: result.total,
      elapsedSeconds: result.elapsedSeconds,
      operation: result.settings.operation,
      maxSum: result.settings.maxSum,
      level,
      date: new Date().toISOString(),
    };

    // Keep only the top entries of this level (entries that don't belong to any level are left untouched).
    const others = this.entriesState().filter((e) => levelOf(e) !== level);
    const top = [...this.ranked(level), entry].sort(compareEntries).slice(0, MAX_ENTRIES_PER_LEVEL);

    this.entriesState.set([...others, ...top]);
    this.persist();
    this.savePlayerName(name);

    const index = top.findIndex((e) => e.id === entry.id);
    if (index === -1) {
      return null;
    }
    this.lastSavedIdState.set(entry.id);
    return index + 1;
  }

  loadPlayerName(): string {
    try {
      return localStorage.getItem(PLAYER_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private savePlayerName(name: string): void {
    try {
      localStorage.setItem(PLAYER_KEY, name);
    } catch {
      // Storage unavailable: the name just won't be remembered.
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entriesState()));
    } catch {
      // Storage unavailable or full: keep the leaderboard in memory for this session.
    }
  }

  private load(): LeaderboardEntry[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
    } catch {
      return [];
    }
  }
}

function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return b.correct - a.correct || a.elapsedSeconds - b.elapsedSeconds || a.date.localeCompare(b.date);
}

/** Level of a score; older scores (saved before levels existed) count only if their settings match a level. */
function levelOf(entry: LeaderboardEntry): LevelId | null {
  if (entry.level) {
    return entry.level;
  }
  const match = LEVELS.find(
    (level) =>
      level.settings.operation === entry.operation &&
      level.settings.maxSum === entry.maxSum &&
      level.settings.questionCount === entry.total,
  );
  return match?.id ?? null;
}

/** Data comes from localStorage, which the user can edit: validate every field. */
function isValidEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const e = value as Record<string, unknown>;
  return (
    typeof e['id'] === 'string' &&
    typeof e['name'] === 'string' &&
    e['name'].length <= PLAYER_NAME_MAX_LENGTH &&
    Number.isInteger(e['correct']) &&
    Number.isInteger(e['total']) &&
    Number.isInteger(e['elapsedSeconds']) &&
    (e['correct'] as number) >= 0 &&
    (e['correct'] as number) <= (e['total'] as number) &&
    (e['elapsedSeconds'] as number) >= 0 &&
    OPERATION_OPTIONS.some((o) => o.value === e['operation']) &&
    MAX_SUM_OPTIONS.includes(e['maxSum'] as MaxSumOption) &&
    (e['level'] === undefined || LEVELS.some((level) => level.id === e['level'])) &&
    typeof e['date'] === 'string' &&
    !Number.isNaN(Date.parse(e['date']))
  );
}
