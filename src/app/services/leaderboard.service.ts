import { computed, Injectable, signal } from '@angular/core';
import {
  GameResult,
  LeaderboardCategory,
  LeaderboardEntry,
  MAX_SUM_OPTIONS,
  MaxSumOption,
  OPERATION_OPTIONS,
  OperationType,
} from '../models/game.models';

const STORAGE_KEY = 'mate-aventura:leaderboard';
const PLAYER_KEY = 'mate-aventura:player';
const MAX_ENTRIES_PER_CATEGORY = 10;
export const PLAYER_NAME_MAX_LENGTH = 20;

/** Leaderboard persisted in localStorage, ranked by correct answers (desc) then time (asc). */
@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly entriesState = signal<LeaderboardEntry[]>(this.load());
  private readonly lastSavedIdState = signal<string | null>(null);

  readonly entries = this.entriesState.asReadonly();
  readonly lastSavedId = this.lastSavedIdState.asReadonly();

  /** Categories that have at least one score, most recently played first. */
  readonly categories = computed<LeaderboardCategory[]>(() => {
    const byKey = new Map<string, { category: LeaderboardCategory; lastPlayed: string }>();
    for (const entry of this.entriesState()) {
      const key = this.categoryKey(entry.operation, entry.maxSum, entry.total);
      const existing = byKey.get(key);
      if (!existing || entry.date > existing.lastPlayed) {
        byKey.set(key, {
          category: { key, operation: entry.operation, maxSum: entry.maxSum, total: entry.total },
          lastPlayed: entry.date,
        });
      }
    }
    return [...byKey.values()].sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed)).map((c) => c.category);
  });

  categoryKey(operation: OperationType, maxSum: number, total: number): string {
    return `${operation}-${maxSum}-${total}`;
  }

  categoryLabel(category: LeaderboardCategory): string {
    const operation = OPERATION_OPTIONS.find((o) => o.value === category.operation)?.label ?? category.operation;
    return `${operation} · max ${category.maxSum} · ${category.total} întrebări`;
  }

  ranked(categoryKey: string): LeaderboardEntry[] {
    return this.entriesState()
      .filter((e) => this.categoryKey(e.operation, e.maxSum, e.total) === categoryKey)
      .sort(compareEntries);
  }

  /** Saves a score and returns its 1-based rank, or `null` if it didn't make the top list. */
  save(result: GameResult, rawName: string): number | null {
    const name = rawName.trim().slice(0, PLAYER_NAME_MAX_LENGTH);
    const entry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      correct: result.correct,
      total: result.total,
      elapsedSeconds: result.elapsedSeconds,
      operation: result.settings.operation,
      maxSum: result.settings.maxSum,
      date: new Date().toISOString(),
    };
    const key = this.categoryKey(entry.operation, entry.maxSum, entry.total);

    // Keep only the top entries of this category.
    const others = this.entriesState().filter((e) => this.categoryKey(e.operation, e.maxSum, e.total) !== key);
    const category = [...this.ranked(key), entry].sort(compareEntries).slice(0, MAX_ENTRIES_PER_CATEGORY);

    this.entriesState.set([...others, ...category]);
    this.persist();
    this.savePlayerName(name);

    const index = category.findIndex((e) => e.id === entry.id);
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
    typeof e['date'] === 'string' &&
    !Number.isNaN(Date.parse(e['date']))
  );
}
