import { MediaMatcher } from '@angular/cdk/layout';
import {
  ApplicationConfig,
  Injectable,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideIcons } from './icons';
import { provideServiceWorker } from '@angular/service-worker';

/**
 * Angular Material disables all its transitions (`_mat-animation-noopable` + `transition: none !important`)
 * when the OS asks for reduced motion, and offers no setting to keep them. The app's animations are
 * intentionally subtle, so Material is told the preference is never set.
 */
@Injectable()
class AnimationsAlwaysOnMediaMatcher extends MediaMatcher {
  override matchMedia(query: string): MediaQueryList {
    // 'not all' never matches.
    return super.matchMedia(query.includes('prefers-reduced-motion') ? 'not all' : query);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: MediaMatcher, useClass: AnimationsAlwaysOnMediaMatcher },
    provideIcons(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
