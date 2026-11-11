import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  GameSettings,
  HINTS_MAX_SUM,
  MAX_SUM_OPTIONS,
  MaxSumOption,
  OPERATION_OPTIONS,
  OperationType,
  QUESTION_COUNT_OPTIONS,
  QuestionCountOption,
  SetupDialogData,
} from '../../models/game.models';

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
  protected readonly data = inject<SetupDialogData>(MAT_DIALOG_DATA);

  protected readonly maxSumOptions = MAX_SUM_OPTIONS;
  protected readonly questionCountOptions = QUESTION_COUNT_OPTIONS;
  protected readonly operationOptions = OPERATION_OPTIONS;
  protected readonly hintsMaxSum = HINTS_MAX_SUM;

  protected readonly form = new FormGroup({
    maxSum: new FormControl<MaxSumOption>(this.data.settings.maxSum, {
      nonNullable: true,
      validators: Validators.required,
    }),
    operation: new FormControl<OperationType>(this.data.settings.operation, {
      nonNullable: true,
      validators: Validators.required,
    }),
    questionCount: new FormControl<QuestionCountOption>(this.data.settings.questionCount, {
      nonNullable: true,
      validators: Validators.required,
    }),
    showHints: new FormControl<boolean>(this.data.settings.showHints, { nonNullable: true }),
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

  protected start(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Disabled controls are included on purpose: the kid's hint preference is kept for smaller sums.
    this.dialogRef.close(this.form.getRawValue());
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
