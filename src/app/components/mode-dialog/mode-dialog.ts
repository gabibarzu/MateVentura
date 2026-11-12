import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { InstallService } from '../../services/install.service';
import { Cifrel } from '../cifrel/cifrel';
import { loadCifrelStoryDialog } from '../lazy-dialogs';

export type PlayMode = 'learning' | 'game';

@Component({
  selector: 'app-mode-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, Cifrel],
  template: `
    <h2 mat-dialog-title class="mode-title">
      <app-cifrel mood="happy" class="mode-mascot" aria-hidden="true" />
      <span>MateVentura <small>cu Cifrel</small></span>
    </h2>
    <mat-dialog-content>
      <p class="intro">Cum vrei să ne jucăm astăzi?</p>
      <div class="modes">
        <button type="button" class="mode mode--learning" [mat-dialog-close]="'learning'">
          <span class="mode-icon"><mat-icon svgIcon="eco" /></span>
          <strong>Învățare</strong>
          <span class="mode-description">Exersăm împreună, în ritmul tău.</span>
          <small>Fără timp sau scor · Ajutor pas cu pas</small>
        </button>
        <button type="button" class="mode mode--game" [mat-dialog-close]="'game'">
          <span class="mode-icon"><mat-icon svgIcon="rocket_launch" /></span>
          <strong>Joc</strong>
          <span class="mode-description">Alege provocarea și bate-ți recordul!</span>
          <small>Joc rapid · Niveluri · Clasament</small>
        </button>
        <button type="button" class="mode mode--soon" disabled>
          <span class="mode-icon"><mat-icon svgIcon="stars" /></span>
          <strong>Aventură</strong>
          <span class="mode-description">O hartă cu noi niveluri de descoperit.</span>
          <small>Va apărea în curând</small>
        </button>
      </div>
      <section class="mode-welcome" aria-label="Despre Cifrel">
        <div class="mode-welcome-portrait" aria-hidden="true">
          <app-cifrel full mood="happy" />
        </div>
        <div class="mode-welcome-copy">
          <span class="mode-eyebrow">Numere mici. Aventuri mari.</span>
          <h3>Eu sunt Cifrel. Facem echipă?</h3>
          <p>Un robot curios, câteva bulinuțe și o mulțime de „Aha!”.
            Învățăm, ne jucăm și mai greșim — împreună.</p>
          <button #storyButton mat-button type="button" class="mode-story" (click)="openStory()" [disabled]="storyLoading()">
            <mat-icon svgIcon="info" />
            Hai să-l cunoaștem pe Cifrel
          </button>
        </div>
      </section>
    </mat-dialog-content>
      <mat-dialog-actions align="center" class="mode-actions">
        @if (canCancel) {
          <button mat-raised-button class="big-btn btn-gray" mat-dialog-close>
            <mat-icon svgIcon="arrow_back" />
            Înapoi
          </button>
        }
        @if (install.method()) {
          <button mat-button type="button" class="mode-install" (click)="install.install()">
            <mat-icon svgIcon="install_mobile" />
            Instalează aplicația
          </button>
        }
      </mat-dialog-actions>
  `,
  styles: `
    .mode-title {
      display: flex; align-items: center; gap: 16px;
      padding-block: 24px 20px; line-height: 1.25;
      color: #6c5ce7; font-size: 2rem; font-weight: 800;
    }
    .mode-mascot { display: block; width: 72px; height: 72px; flex-shrink: 0; }
    .mode-title small { display: block; margin-top: 4px; color: #007f76; font-size: 1rem; font-weight: 700; }
    .mode-welcome {
      display: grid; grid-template-columns: 140px minmax(0, 1fr); align-items: center;
      gap: 20px; margin-top: 12px; padding: 18px 22px; border: 2px solid #d5ccff;
      border-radius: 24px;
      background: radial-gradient(circle at 8% 50%, #fff8cc, transparent 55%), linear-gradient(120deg, #f5efff, #eefbfa);
    }
    .mode-welcome-portrait app-cifrel { display: block; width: 100%; }
    .mode-eyebrow { color: #007f76; font-size: 0.9rem; font-weight: 800; }
    .mode-welcome-copy h3 { margin: 6px 0 8px; color: #6c5ce7; font-size: 1.5rem; font-weight: 800; line-height: 1.3; }
    .mode-welcome-copy p { margin: 0 0 8px; color: #2d3436; line-height: 1.6; }
    .mode-actions { flex-direction: column; gap: 8px; padding: 8px 24px 24px; }
    .mode-install { --mat-button-text-label-text-size: 1rem; }
    .mode-story {
      height: auto; min-height: 44px; padding-block: 8px; white-space: normal;
      --mat-button-text-label-text-size: 1.05rem; --mat-button-text-label-text-weight: 800;
    }
    .intro { margin: 0 0 20px; text-align: center; color: #6c5ce7; font-size: 1.2rem; font-weight: 700; }
    .modes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding: 4px 4px 16px; }
    .mode {
      --mode-color: #636e72; --mode-tint: #edf0f1; --mode-hover: #e2e7e9;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 24px 16px; border: 3px solid currentColor; border-radius: 24px;
      color: var(--mode-color); background: var(--mode-tint);
      box-shadow: 0 6px 0 var(--mode-color);
      font: inherit; text-align: center; cursor: pointer;
      transition: background-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
    }
    .mode-icon {
      display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%;
      color: white; background: var(--mode-color); flex-shrink: 0;
    }
    .mode mat-icon { width: 34px; height: 34px; }
    .mode strong { font-size: 1.65rem; font-weight: 800; }
    .mode-description { color: #2d3436; line-height: 1.45; }
    .mode small { padding: 6px 10px; border-radius: 12px; background: #fff; font-weight: 700; }
    .mode--learning { --mode-color: #00a88a; --mode-tint: #e5faf3; --mode-hover: #cef5e8; }
    .mode--game { --mode-color: #0984e3; --mode-tint: #eaf5ff; --mode-hover: #d7ecff; }
    .mode:not(:disabled):hover { background: var(--mode-hover); }
    .mode:focus-visible { outline: 3px solid #0984e3; outline-offset: 4px; }
    .mode--soon { --mode-color: #8a969a; border-style: dashed; box-shadow: 0 6px 0 #c6cfd2; cursor: not-allowed; }
    .mode--soon strong, .mode--soon small { color: #636e72; }
    .mode--soon .mode-icon { background: #b2bec3; }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      .mode:not(:disabled):hover { transform: translateY(-3px); box-shadow: 0 9px 0 var(--mode-color); }
      .mode:not(:disabled):active { transform: translateY(3px); box-shadow: 0 3px 0 var(--mode-color); }
    }
    @media (prefers-reduced-motion: reduce) { .mode { transition: background-color 200ms ease; } }
    @media (max-width: 650px) {
      .mode-title { gap: 10px; font-size: 1.6rem; padding-block: 20px 16px; }
      .mode-mascot { width: 56px; height: 56px; }
      .mode-welcome { grid-template-columns: 88px minmax(0, 1fr); gap: 12px; padding: 14px; }
      .mode-welcome-copy h3 { font-size: 1.2rem; }
      .modes { grid-template-columns: 1fr; }
      .mode { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 6px 14px; padding: 16px; text-align: left; }
      .mode-icon { grid-row: span 3; width: 52px; height: 52px; }
      .mode mat-icon { width: 28px; height: 28px; }
      .mode small { justify-self: start; }
    }
    @media (max-width: 380px) {
      .mode-welcome { grid-template-columns: 1fr; text-align: center; }
      .mode-welcome-portrait { width: 88px; margin: auto; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeDialog {
  protected readonly canCancel = inject<boolean>(MAT_DIALOG_DATA);
  protected readonly install = inject(InstallService);
  protected readonly storyLoading = signal(false);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<ModeDialog>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storyButton = viewChild<ElementRef<HTMLButtonElement>>('storyButton');

  protected async openStory(): Promise<void> {
    if (this.storyLoading()) return;
    this.storyLoading.set(true);
    try {
      const component = await loadCifrelStoryDialog();
      if (this.destroyRef.destroyed) return;
      // Reuse the mode picker's backdrop instead of stacking two dimmed surfaces.
      const disableClose = this.dialogRef.disableClose;
      this.dialogRef.disableClose = true;
      this.dialogRef.addPanelClass('kid-dialog--hidden');
      this.dialog.open(component, {
        width: '780px',
        maxWidth: '95vw',
        maxHeight: '95dvh',
        hasBackdrop: false,
        restoreFocus: false,
        autoFocus: 'dialog',
        panelClass: 'kid-dialog',
      }).afterClosed().subscribe(() => {
        if (this.destroyRef.destroyed) return;
        this.dialogRef.removePanelClass('kid-dialog--hidden');
        this.dialogRef.disableClose = disableClose;
        this.storyButton()?.nativeElement.focus();
      });
    } finally {
      this.storyLoading.set(false);
    }
  }
}