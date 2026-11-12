import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { LEVELS, LevelId } from '../../models/game.models';
import { LeaderboardService } from '../../services/leaderboard.service';
import { formatTime } from '../../utils/format-time';

@Component({
  selector: 'app-leaderboard-card',
  imports: [DatePipe, MatCardModule, MatIconModule, MatTabsModule],
  templateUrl: './leaderboard-card.html',
  styleUrl: './leaderboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardCard {
  private readonly leaderboard = inject(LeaderboardService);

  /** Level shown first (e.g. the level of the current game). */
  readonly preferredLevel = input<LevelId | null>(null);

  protected readonly levels = LEVELS;
  protected readonly lastSavedId = this.leaderboard.lastSavedId;

  /** Preferred level, otherwise the first level that has scores, otherwise Ușor. */
  protected readonly selectedLevel = linkedSignal<LevelId>(() => {
    const preferred = this.preferredLevel();
    if (preferred) {
      return preferred;
    }
    const withScores = this.leaderboard.levelsWithScores();
    return LEVELS.find((level) => withScores.has(level.id))?.id ?? LEVELS[0].id;
  });

  protected readonly selectedLevelIndex = computed(
    () => LEVELS.findIndex((level) => level.id === this.selectedLevel()),
  );

  protected readonly levelBoards = computed(() =>
    LEVELS.map((level) => ({ ...level, rows: this.leaderboard.ranked(level.id) })),
  );

  protected readonly formatTime = formatTime;
}
