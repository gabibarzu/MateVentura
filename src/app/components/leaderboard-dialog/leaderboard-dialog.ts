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
    <mat-dialog-content class="leaderboard-dialog__content">
      <app-leaderboard-card [preferredCategory]="data.categoryKey" />
    </mat-dialog-content>
    <mat-dialog-actions class="leaderboard-dialog__actions">
      <button mat-flat-button type="button" class="big-btn btn-purple" mat-dialog-close cdkFocusInitial>
        <mat-icon>close</mat-icon>
        Închide
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .leaderboard-dialog__content {
      max-height: calc(95vh - 120px);
      padding-top: 24px;
    }

    .leaderboard-dialog__actions {
      justify-content: center;
      padding: 8px 24px 24px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardDialog {
  protected readonly data = inject<LeaderboardDialogData>(MAT_DIALOG_DATA);
}
