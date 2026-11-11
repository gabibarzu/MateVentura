import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  DEFAULT_SETTINGS,
  GameSettings,
  HINTS_MAX_SUM,
  isLevel,
  LeaderboardDialogData,
  LEVELS,
  MAX_SUM_OPTIONS,
  MaxSumOption,
  OPERATION_OPTIONS,
  OperationType,
  QUESTION_COUNT_OPTIONS,
  QUICK_GAME_SETTINGS,
  QuestionCountOption,
  SetupDialogData,
} from '../../models/game.models';
import { LeaderboardDialog } from '../leaderboard-dialog/leaderboard-dialog';

/** Global class (styles.scss) that hides a dialog panel while another dialog replaces it. */
const HIDDEN_PANEL_CLASS = 'kid-dialog--hidden';

@Component({
  selector: 'app-setup-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './setup-dialog.html',
  styleUrl: './setup-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupDialog {
  private readonly dialogRef = inject<MatDialogRef<SetupDialog, GameSettings>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  protected readonly data = inject<SetupDialogData>(MAT_DIALOG_DATA);

  /** `levels`: quick game + level cards (default). `custom`: the full settings form. */
  protected readonly view = signal<'levels' | 'custom'>('levels');

  protected readonly levels = LEVELS;
  protected readonly quickGame = QUICK_GAME_SETTINGS;
  protected readonly lastMode = this.data.settings?.mode ?? null;

  protected readonly maxSumOptions = MAX_SUM_OPTIONS;
  protected readonly questionCountOptions = QUESTION_COUNT_OPTIONS;
  protected readonly operationOptions = OPERATION_OPTIONS;
  protected readonly hintsMaxSum = HINTS_MAX_SUM;

  /** The custom form starts from the last game's settings. */
  private readonly initial = this.data.settings ?? DEFAULT_SETTINGS;

  protected readonly form = new FormGroup({
    maxSum: new FormControl<MaxSumOption>(this.initial.maxSum, {
      nonNullable: true,
      validators: Validators.required,
    }),
    operation: new FormControl<OperationType>(this.initial.operation, {
      nonNullable: true,
      validators: Validators.required,
    }),
    questionCount: new FormControl<QuestionCountOption>(this.initial.questionCount, {
      nonNullable: true,
      validators: Validators.required,
    }),
    showHints: new FormControl<boolean>(this.initial.showHints, { nonNullable: true }),
  });

  private readonly maxSum = toSignal(this.form.controls.maxSum.valueChanges, {
    initialValue: this.form.controls.maxSum.value,
  });

  /** Hints (counting dots) are only available for small numbers. */
  protected readonly hintsAvailable = computed(() => this.maxSum() <= HINTS_MAX_SUM);

  constructor() {
    this.syncHintsAvailability(this.form.controls.maxSum.value);
    this.form.controls.maxSum.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((maxSum) => this.syncHintsAvailability(maxSum));
  }

  /** Quick game or a level: start immediately with fixed settings. */
  protected play(settings: GameSettings): void {
    this.dialogRef.close(settings);
  }

  protected startCustom(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Disabled controls are included on purpose: the kid's hint preference is kept for smaller sums.
    this.dialogRef.close({ ...this.form.getRawValue(), mode: 'custom' });
  }

  /**
   * Shows the leaderboard instead of the setup dialog (no stacked dialogs/backdrops):
   * the setup dialog is hidden while the leaderboard is open and shown again when it closes.
   */
  protected openLeaderboard(): void {
    // The hidden setup dialog's backdrop is still clickable: don't let it close underneath the leaderboard.
    const disableClose = this.dialogRef.disableClose;
    this.dialogRef.disableClose = true;
    this.dialogRef.addPanelClass(HIDDEN_PANEL_CLASS);
    this.dialog
      .open<LeaderboardDialog, LeaderboardDialogData>(LeaderboardDialog, {
        data: { level: this.lastMode && isLevel(this.lastMode) ? this.lastMode : null },
        width: '760px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        autoFocus: 'dialog',
        hasBackdrop: false,
        panelClass: 'kid-dialog',
      })
      .afterClosed()
      .subscribe(() => {
        this.dialogRef.removePanelClass(HIDDEN_PANEL_CLASS);
        this.dialogRef.disableClose = disableClose;
      });
  }

  private syncHintsAvailability(maxSum: MaxSumOption): void {
    const control = this.form.controls.showHints;
    if (maxSum <= HINTS_MAX_SUM) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
    }
  }
}
