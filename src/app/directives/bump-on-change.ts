import { Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';
import { MotionService } from '../services/motion.service';

const KEYFRAMES: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.5)', color: '#ffeaa7', offset: 0.4 },
  { transform: 'scale(1)' },
];
const OPTIONS: KeyframeAnimationOptions = { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' };

/** Plays a short "bump" animation on the host element whenever the bound value changes. */
@Directive({
  selector: '[appBumpOnChange]',
  host: { style: 'display: inline-block' },
})
export class BumpOnChange {
  readonly appBumpOnChange = input.required<unknown>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);
  private initialized = false;

  constructor() {
    effect(() => {
      this.appBumpOnChange();
      if (!this.initialized) {
        this.initialized = true;
        return;
      }
      if (!untracked(this.motion.enabled)) {
        return;
      }
      this.host.nativeElement.animate(KEYFRAMES, OPTIONS);
    });
  }
}
