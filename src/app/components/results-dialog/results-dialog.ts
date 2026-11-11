import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { GameResult, isLevel, LEVELS, MODE_LABELS, ResultsDialogAction } from '../../models/game.models';
import { LeaderboardService, PLAYER_NAME_MAX_LENGTH } from '../../services/leaderboard.service';
import { formatTime } from '../../utils/format-time';

const MAX_STARS = 3;

@Component({
  selector: 'app-results-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './results-dialog.html',
  styleUrl: './results-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsDialog {
  protected readonly result = inject<GameResult>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ResultsDialog, ResultsDialogAction>>(MatDialogRef);
  private readonly leaderboard = inject(LeaderboardService);

  protected readonly newGameAction: ResultsDialogAction = 'new-game';
  protected readonly retryAction: ResultsDialogAction = 'retry';
  protected readonly nameMaxLength = PLAYER_NAME_MAX_LENGTH;

  protected readonly nameControl = new FormControl(this.leaderboard.loadPlayerName(), {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(PLAYER_NAME_MAX_LENGTH), Validators.pattern(/\S/)],
  });

  protected readonly saved = signal(false);
  /** Rank in the leaderboard after saving, `null` if outside the top list. */
  protected readonly rank = signal<number | null>(null);

  protected readonly modeLabel = MODE_LABELS[this.result.settings.mode];
  /** Only level games (Ușor / Mediu / Greu) go into the leaderboard. */
  protected readonly level = isLevel(this.result.settings.mode) ? this.result.settings.mode : null;
  protected readonly levelName = LEVELS.find((l) => l.id === this.level)?.name ?? '';

  protected readonly accuracy = computed(() =>
    this.result.total === 0 ? 0 : this.result.correct / this.result.total,
  );

  protected readonly starCount = computed(() => {
    const accuracy = this.accuracy();
    if (accuracy >= 0.9) return 3;
    if (accuracy >= 0.7) return 2;
    return 1;
  });

  protected readonly stars = computed(() =>
    Array.from({ length: MAX_STARS }, (_, i) => i < this.starCount()),
  );

  protected readonly message = computed(() => {
    switch (this.starCount()) {
      case 3:
        return 'Cifrel e super mândru: ești un campion la matematică!';
      case 2:
        return 'Foarte bine! Cifrel zice: încă puțin și ajungi la 3 stele!';
      default:
        return 'Bun început! Cifrel te ajută să mai exersezi!';
    }
  });

  protected readonly totalTime = formatTime(this.result.elapsedSeconds);

  protected save(): void {
    if (!this.level || this.saved() || this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      return;
    }
    this.rank.set(this.leaderboard.save(this.result, this.nameControl.value, this.level));
    this.saved.set(true);
  }

  /** Saves automatically (if a name was entered) so a forgotten click doesn't lose the score. */
  protected close(action: ResultsDialogAction): void {
    if (this.level && !this.saved() && this.nameControl.valid) {
      this.save();
    }
    this.dialogRef.close(action);
  }
}
