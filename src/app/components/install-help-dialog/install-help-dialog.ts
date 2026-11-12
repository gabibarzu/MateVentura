import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type { InstallMethod } from '../../services/install.service';

/** Step-by-step install instructions where the browser can't show its own install dialog. */
@Component({
  selector: 'app-install-help-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="install__title">
      <img class="install__title-icon" src="mascot-head.svg" alt="" aria-hidden="true" />
      Ia-l pe Cifrel pe telefon!
    </h2>

    <mat-dialog-content>
      @if (method === 'in-app-browser') {
        <p class="install__intro">Aici (în Messenger, Facebook...) aplicația nu se poate instala. Deschide-o în browser:</p>
        <ol class="install__steps">
          <li>
            Apasă <mat-icon svgIcon="more_vert" aria-label="meniul" /> sau <strong>⋯</strong>, sus în colț.
          </li>
          <li>
            Alege <mat-icon svgIcon="open_in_browser" aria-hidden="true" /> <strong>Deschide în browser</strong>
            (Chrome sau Safari).
          </li>
          <li>Acolo apasă din nou butonul <strong>Instalează</strong> din aplicație.</li>
        </ol>
      } @else {
        <p class="install__intro">Pe iPhone și iPad se instalează din Safari:</p>
        <ol class="install__steps">
          <li>
            Apasă butonul <mat-icon svgIcon="ios_share" aria-hidden="true" /> <strong>Partajează</strong>
            (jos sau sus în bara Safari).
          </li>
          <li>
            Alege <mat-icon svgIcon="add_box" aria-hidden="true" /> <strong>Adaugă pe ecranul principal</strong>.
          </li>
          <li>Apasă <strong>Adaugă</strong>. Cifrel apare pe ecran, ca orice aplicație!</li>
        </ol>
      }
    </mat-dialog-content>

    <mat-dialog-actions class="install__actions">
      <button mat-flat-button type="button" class="big-btn btn-purple" mat-dialog-close>
        <mat-icon svgIcon="check_circle" />
        Am înțeles
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .install__title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #6c5ce7;
      font-size: 1.8rem;
      font-weight: 700;
    }

    .install__title-icon {
      width: 3rem;
      height: 3rem;
      margin: -0.4rem 0;
    }

    .install__intro {
      margin: 0 0 12px;
      font-size: 1.15rem;
      color: #2d3436;
    }

    .install__steps {
      display: grid;
      gap: 10px;
      margin: 0;
      padding-left: 1.6rem;
      font-size: 1.15rem;
      line-height: 1.5;
      color: #2d3436;

      mat-icon {
        width: 1.4rem;
        height: 1.4rem;
        vertical-align: -0.3rem;
        color: #0984e3;
      }
    }

    .install__actions {
      justify-content: center;
      padding: 8px 24px 24px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallHelpDialog {
  protected readonly method = inject<InstallMethod>(MAT_DIALOG_DATA);
}
