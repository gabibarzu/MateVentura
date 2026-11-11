import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mate-aventura:animations';
const REDUCE_MOTION_CLASS = 'reduce-motion';

/**
 * Controls whether animations are shown.
 * Defaults to the OS "reduce motion" setting, but can be overridden in the app (remembered in localStorage).
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly document = inject(DOCUMENT);
  private readonly enabledState = signal(this.readInitial());

  readonly enabled = this.enabledState.asReadonly();

  constructor() {
    effect(() => {
      this.document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, !this.enabledState());
    });
  }

  toggle(): void {
    this.enabledState.update((enabled) => !enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(this.enabledState()));
    } catch {
      // Storage unavailable: the choice just won't be remembered.
    }
  }

  private readInitial(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true' || stored === 'false') {
        return stored === 'true';
      }
    } catch {
      // Fall through to the system preference.
    }
    return !this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
