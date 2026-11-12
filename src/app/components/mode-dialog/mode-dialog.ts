import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { InstallService } from '../../services/install.service';
import { Cifrel } from '../cifrel/cifrel';

export type PlayMode = 'learning' | 'game';

@Component({
  selector: 'app-mode-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, Cifrel],
  template: `
    <h2 mat-dialog-title class="mode-title">
      <app-cifrel mood="happy" class="mode-mascot" aria-hidden="true" />
      <span>Alege aventura cu Cifrel!</span>
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
    </mat-dialog-content>
    @if (canCancel || install.method()) {
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
    }
  `,
  styles: `
    .mode-title {
      display: flex; align-items: center; gap: 16px;
      padding-block: 24px 20px; line-height: 1.25;
      color: #6c5ce7; font-size: 2rem; font-weight: 800;
    }
    .mode-mascot { display: block; width: 72px; height: 72px; flex-shrink: 0; }
    .mode-actions { flex-direction: column; gap: 8px; padding: 8px 24px 24px; }
    .mode-install { --mat-button-text-label-text-size: 1rem; }
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
      .modes { grid-template-columns: 1fr; }
      .mode { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 6px 14px; padding: 16px; text-align: left; }
      .mode-icon { grid-row: span 3; width: 52px; height: 52px; }
      .mode mat-icon { width: 28px; height: 28px; }
      .mode small { justify-self: start; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeDialog {
  protected readonly canCancel = inject<boolean>(MAT_DIALOG_DATA);
  protected readonly install = inject(InstallService);
}