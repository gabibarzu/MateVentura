import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Cifrel } from '../cifrel/cifrel';

const CIFREL_SECRETS = [
  'Am încercat să număr stelele. Am adormit la 12. Cred că una căsca!',
  'Nu mănânc teme. Am gustat una și mi-a rămas un 7 între rotițe.',
  'Când strănut, fac „A-pi-ciu!”. Nu știu cine este Pi, dar pare de treabă.',
  'Am căutat butonul de curaj. Era chiar lângă „Mai încerc o dată”.',
  'Mi-am pus parola „1234”. Până și prăjitorul de pâine a ghicit-o.',
];

@Component({
  selector: 'app-cifrel-story-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, Cifrel],
  templateUrl: './cifrel-story-dialog.html',
  styleUrl: './cifrel-story-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CifrelStoryDialog {
  protected readonly secretIndex = signal(-1);
  protected readonly secrets = CIFREL_SECRETS;

  protected tellSecret(): void {
    this.secretIndex.update(index => (index + 1) % CIFREL_SECRETS.length);
  }
}