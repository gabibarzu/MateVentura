import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import type { InstallHelpDialog } from '../components/install-help-dialog/install-help-dialog';
import { loadInstallHelpDialog } from '../components/lazy-dialogs';

/** Chrome/Edge/Samsung Internet event offering the install prompt (not in the standard DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** How the app can be installed on the current browser. */
export type InstallMethod = 'prompt' | 'ios' | 'in-app-browser';

/** Installing the app (PWA) on the phone or computer. */
@Injectable({ providedIn: 'root' })
export class InstallService {
  private readonly dialog = inject(MatDialog);
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly installed = signal(isStandalone());

  /** `null` when the app is already installed or the browser can't install it. */
  readonly method = computed<InstallMethod | null>(() => {
    if (this.installed()) {
      return null;
    }
    if (this.deferredPrompt()) {
      return 'prompt';
    }
    // Checked before iOS: Messenger/Facebook/Instagram browsers can't install, on any phone.
    if (isInAppBrowser()) {
      return 'in-app-browser';
    }
    return isIos() ? 'ios' : null;
  });

  constructor() {
    const onBeforeInstallPrompt = (event: Event) => {
      // Keep the event to show the browser's install dialog from our own button.
      event.preventDefault();
      this.deferredPrompt.set(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      this.installed.set(true);
      this.deferredPrompt.set(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    });
  }

  /** Android/desktop: the browser's own install dialog. iPhone / in-app browsers: step-by-step help. */
  async install(): Promise<void> {
    const method = this.method();
    if (method === 'prompt') {
      await this.promptInstall();
    } else if (method) {
      const component = await loadInstallHelpDialog();
      this.dialog.open<InstallHelpDialog, InstallMethod>(component, {
        data: method,
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '95dvh',
        restoreFocus: false,
        autoFocus: 'dialog',
        panelClass: 'kid-dialog',
      });
    }
  }

  /** Shows the browser's install dialog (only for the `prompt` method). */
  private async promptInstall(): Promise<void> {
    const event = this.deferredPrompt();
    if (!event) {
      return;
    }
    // The event can only be used once.
    this.deferredPrompt.set(null);
    await event.prompt();
    if ((await event.userChoice).outcome === 'accepted') {
      this.installed.set(true);
    }
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari on iOS (non-standard).
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  // iPadOS reports itself as a Mac, but with touch support.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function isInAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram/i.test(navigator.userAgent);
}
