import { Injectable } from '@angular/core';

const COLORS = ['#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#fdcb6e', '#ff7675', '#fd79a8', '#e84393'];

// Only needed at the end of a game: kept out of the initial bundle.
const loadConfetti = () => import('canvas-confetti').then((m) => m.default);

@Injectable({ providedIn: 'root' })
export class ConfettiService {
  /** Starts downloading the library ahead of the celebration. */
  preload(): void {
    void loadConfetti();
  }

  async celebrate(durationMs = 2500): Promise<void> {
    const confetti = await loadConfetti();
    const end = Date.now() + durationMs;

    confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 }, colors: COLORS });

    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  }
}
