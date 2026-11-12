import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mateventura:adventure:rocket';
const PIECE_COUNT = 5;

@Injectable({ providedIn: 'root' })
export class AdventureService {
  private readonly progress = signal(this.load());
  readonly repaired = this.progress.asReadonly();

  repair(): void {
    this.save(Math.min(PIECE_COUNT, this.progress() + 1));
  }

  restart(): void {
    this.save(0);
  }

  private save(value: number): void {
    this.progress.set(value);
    try { localStorage.setItem(STORAGE_KEY, String(value)); } catch { /* Play still works without storage. */ }
  }

  private load(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const value = Number(raw);
      return raw !== null && Number.isInteger(value) && value >= 0 && value <= PIECE_COUNT ? value : 0;
    } catch { return 0; }
  }
}