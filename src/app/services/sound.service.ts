import { Injectable, signal } from '@angular/core';

interface ToneOptions {
  frequency: number;
  endFrequency?: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

const MUTED_STORAGE_KEY = 'mate-aventura:muted';

/** Generates cheerful feedback sounds with the Web Audio API (no audio files needed). */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly mutedState = signal(this.readStoredMuted());
  readonly muted = this.mutedState.asReadonly();

  private context: AudioContext | null = null;

  toggleMute(): void {
    this.mutedState.update((muted) => !muted);
    try {
      localStorage.setItem(MUTED_STORAGE_KEY, String(this.mutedState()));
    } catch {
      // Storage may be unavailable (e.g. private mode); the setting just won't be remembered.
    }
  }

  /** Bright two-note "ding". */
  playSuccess(): void {
    this.play([
      { frequency: 1046.5, start: 0, duration: 0.18, type: 'sine', volume: 0.3 },
      { frequency: 1568, start: 0.09, duration: 0.35, type: 'sine', volume: 0.25 },
    ]);
  }

  /** Soft descending "oops". */
  playError(): void {
    this.play([
      { frequency: 392, endFrequency: 330, start: 0, duration: 0.16, type: 'triangle', volume: 0.22 },
      { frequency: 311, endFrequency: 233, start: 0.15, duration: 0.3, type: 'triangle', volume: 0.22 },
    ]);
  }

  /** Short happy fanfare for the end of the game. */
  playFanfare(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    this.play([
      ...notes.map((frequency, i) => ({ frequency, start: i * 0.12, duration: 0.2, type: 'square' as const, volume: 0.08 })),
      { frequency: 1046.5, start: 0.5, duration: 0.6, type: 'sine', volume: 0.25 },
    ]);
  }

  private play(tones: ToneOptions[]): void {
    if (this.mutedState()) {
      return;
    }
    const ctx = this.getContext();
    if (!ctx) {
      return;
    }
    const now = ctx.currentTime;
    for (const tone of tones) {
      this.scheduleTone(ctx, now, tone);
    }
  }

  private scheduleTone(ctx: AudioContext, now: number, tone: ToneOptions): void {
    const { frequency, endFrequency, start, duration, type = 'sine', volume = 0.25 } = tone;
    const startAt = now + start;
    const endAt = startAt + duration;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, endAt);
    }

    // Quick attack + exponential decay avoids audible clicks.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.05);
  }

  private readStoredMuted(): boolean {
    try {
      return localStorage.getItem(MUTED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || !('AudioContext' in window)) {
      return null;
    }
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    return this.context;
  }
}
