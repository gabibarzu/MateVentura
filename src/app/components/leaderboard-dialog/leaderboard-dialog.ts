import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LeaderboardDialogData } from '../../models/game.models';
import { LeaderboardCard } from '../leaderboard-card/leaderboard-card';

@Component({
  selector: 'app-leaderboard-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, LeaderboardCard],
  template: `
    <h2 mat-dialog-title class="leaderboard-dialog__title">
      <mat-icon svgIcon="emoji_events" />
      Clasament
    </h2>
    <mat-dialog-content class="leaderboard-dialog__content">
      <app-leaderboard-card [preferredLevel]="data.level" [showTitle]="false" />
    </mat-dialog-content>
    <mat-dialog-actions class="leaderboard-dialog__actions">
      <button mat-flat-button type="button" class="big-btn btn-purple" mat-dialog-close>
        <mat-icon svgIcon="close" />
        Închide
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .leaderboard-dialog__title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .leaderboard-dialog__content {
      padding-top: 24px;
    }

    .leaderboard-dialog__actions {
      justify-content: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardDialog {
  protected readonly data = inject<LeaderboardDialogData>(MAT_DIALOG_DATA);
}
