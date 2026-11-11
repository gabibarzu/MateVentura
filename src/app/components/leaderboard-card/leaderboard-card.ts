import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { LeaderboardService } from '../../services/leaderboard.service';
import { formatTime } from '../../utils/format-time';

@Component({
  selector: 'app-leaderboard-card',
  imports: [DatePipe, MatCardModule, MatIconModule, MatSelectModule],
  templateUrl: './leaderboard-card.html',
  styleUrl: './leaderboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardCard {
  private readonly leaderboard = inject(LeaderboardService);

  /** Category shown first (e.g. the one matching the current game settings), if it has scores. */
  readonly preferredCategory = input<string | null>(null);

  protected readonly categories = this.leaderboard.categories;
  protected readonly lastSavedId = this.leaderboard.lastSavedId;

  protected readonly selectedKey = linkedSignal<string | null>(() => {
    const preferred = this.preferredCategory();
    const categories = this.categories();
    return categories.some((c) => c.key === preferred) ? preferred : (categories[0]?.key ?? null);
  });

  protected readonly rows = computed(() => {
    const key = this.selectedKey();
    return key ? this.leaderboard.ranked(key) : [];
  });

  protected readonly formatTime = formatTime;

  protected label(key: string): string {
    const category = this.categories().find((c) => c.key === key);
    return category ? this.leaderboard.categoryLabel(category) : '';
  }
}
