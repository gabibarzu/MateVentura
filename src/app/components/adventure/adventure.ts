import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QuestionState } from '../../models/game.models';
import { ADVENTURE_LEVELS, AdventureLevelId, adventureLevel, ROCKET_PARTS } from '../../models/adventure.models';
import { AdventureService } from '../../services/adventure.service';
import { ConfettiService } from '../../services/confetti.service';
import { Cifrel } from '../cifrel/cifrel';
import { QuestionCard } from '../question-card/question-card';

@Component({
  selector: 'app-adventure',
  imports: [MatButtonModule, MatIconModule, QuestionCard, Cifrel],
  templateUrl: './adventure.html',
  styleUrl: './adventure.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Adventure {
  protected readonly adventure = inject(AdventureService);
  private readonly confetti = inject(ConfettiService);
  private readonly card = viewChild(QuestionCard);
  private readonly map = viewChild<ElementRef<HTMLElement>>('worldMap');
  protected readonly mapRoute = signal('');
  protected readonly mapViewBox = signal('0 0 1 1');
  protected readonly levels = ADVENTURE_LEVELS;
  protected readonly symbols: Record<AdventureLevelId, string> = { rocket: '🚀', forest: '🌳', bridge: '🌉', train: '🚂', balloons: '🎈', crystals: '💎', village: '🏡', lighthouse: '🗼' };
  protected readonly friends = ['🦔', '🐰', '🐿️', '🐻', '🦊'];
  protected readonly goods = ['🍎', '🥕', '🌰', '🧁', '🌼'];
  protected readonly endings: Partial<Record<AdventureLevelId, string>> = {
    train: 'Toți la bord! Trenul lui Cifrel pleacă din gară.',
    balloons: 'Parada baloanelor colorează cerul poienii!',
    crystals: 'Cristalele au dezvăluit pictura Număriliei!',
    village: 'Toți prietenii sunt gata. Să înceapă sărbătoarea!',
    lighthouse: 'Farul strălucește, corăbiile ajung acasă! Ai străbătut toate cele opt ținuturi ale Număriliei.',
  };
  protected readonly pieces = [0, 1, 2, 3, 4];
  protected readonly fireflies = [0, 1, 2, 3, 4, 5, 6, 7];
  protected readonly selectedLevel = signal<AdventureLevelId>('rocket');
  protected readonly level = computed(() => adventureLevel(this.selectedLevel()));
  protected readonly progress = computed(() => this.adventure.getProgress(this.selectedLevel()));
  protected readonly onMap = signal(true);
  protected readonly started = signal(false);
  protected readonly solved = signal(false);
  protected readonly launched = signal(false);
  protected readonly countdown = signal<number | null>(null);
  protected readonly landed = signal(false);
  protected readonly finale = signal(false);
  protected readonly wrong = signal(false);
  protected readonly retryToken = signal(0);
  protected readonly mistakes = signal(0);
  protected readonly message = signal('');
  protected readonly complete = computed(() => this.progress().completed === this.level().tasks.length);
  protected readonly nextLevel = computed(() => this.levels.find(level => level.number === this.level().number + 1));
  protected readonly canContinue = computed(() => this.complete() && !this.solved()
    && (this.selectedLevel() === 'rocket' ? this.landed() : this.finale()));
  private timer: ReturnType<typeof setTimeout> | undefined;
  // Keep the solved calculation visible while progress is saved and its scene updates.
  protected readonly exerciseIndex = signal(this.adventure.repaired());
  protected readonly stepIndex = signal(0);
  protected readonly exercise = computed(() => {
    const tasks = this.level().tasks;
    const task = tasks[Math.min(this.exerciseIndex(), tasks.length - 1)];
    return task[Math.min(this.stepIndex(), task.length - 1)];
  });
  protected readonly badge = computed(() => {
    const index = this.exerciseIndex();
    if (this.selectedLevel() === 'rocket') return `Piesa ${index + 1} / 5 · ${ROCKET_PARTS[index]}`;
    if (this.selectedLevel() === 'forest') return `Felinarul ${index + 1} / 5`;
    const name = this.selectedLevel() === 'bridge' ? 'Scândura' : this.selectedLevel() === 'train' ? 'Vagonul'
      : this.selectedLevel() === 'balloons' ? 'Balonul' : this.selectedLevel() === 'crystals' ? 'Cristalul' : this.selectedLevel() === 'lighthouse' ? 'Lumina' : 'Prietenul';
    return `${name} ${index + 1} / 5` + (this.level().tasks[index]?.length === 2 ? ` · Pasul ${this.stepIndex() + 1} / 2` : '');
  });
  protected readonly instruction = computed(() => this.selectedLevel() === 'rocket'
    ? 'Scrie răspunsul și apasă Enter.' : this.exercise().hint);
  protected readonly state = computed<QuestionState>(() => {
    return {
      question: { ...this.exercise().question, id: this.level().number * 100 + this.exerciseIndex() * 2 + this.stepIndex() },
      status: this.solved() ? 'correct' : this.wrong() ? 'wrong' : 'pending',
      userAnswer: null,
    };
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    afterRenderEffect(onCleanup => {
      const map = this.map()?.nativeElement;
      if (!map) return;
      const draw = () => this.drawMapRoute(map);
      if (typeof ResizeObserver === 'undefined') {
        draw();
        window.addEventListener('resize', draw);
        onCleanup(() => window.removeEventListener('resize', draw));
        return;
      }
      const observer = new ResizeObserver(draw);
      observer.observe(map);
      map.querySelectorAll('.map-level').forEach(node => observer.observe(node));
      draw();
      onCleanup(() => observer.disconnect());
    });
  }

  private drawMapRoute(map: HTMLElement): void {
    const bounds = map.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    // Measure the islands, not the labels, so the route follows every responsive layout.
    const points = Array.from(map.querySelectorAll('.map-level__island')).map(node => {
      const rect = node.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - bounds.left - map.clientLeft,
        y: rect.top + rect.height / 2 - bounds.top - map.clientTop };
    });
    let path = '';
    points.forEach((point, index) => {
      if (!index) { path = `M${point.x} ${point.y}`; return; }
      const previous = points[index - 1];
      if (Math.abs(point.x - previous.x) < 20) {
        const bend = point.x > map.clientWidth / 2 ? Math.min(map.clientWidth - 14, point.x + 65) : Math.max(14, point.x - 65);
        path += `C${bend} ${previous.y} ${bend} ${point.y} ${point.x} ${point.y}`;
      } else {
        const middle = (previous.x + point.x) / 2;
        path += `C${middle} ${previous.y - 20} ${middle} ${point.y + 20} ${point.x} ${point.y}`;
      }
    });
    this.mapViewBox.set(`0 0 ${map.clientWidth} ${map.clientHeight}`);
    this.mapRoute.set(path);
  }

  protected enterMission(level: AdventureLevelId = 'rocket'): void {
    if (!this.adventure.isUnlocked(level)) return;
    this.cancelTimers();
    this.selectedLevel.set(level);
    this.onMap.set(false);
    this.started.set(false);
    this.resetScene();
    this.next();
    // Completed missions remain independently replayable without resetting their saves.
    this.finale.set(this.complete() && level !== 'rocket');
  }

  protected backToMap(): void {
    this.cancelTimers();
    this.onMap.set(true);
    this.started.set(false);
    this.countdown.set(null);
  }

  protected continueToNextLevel(): void {
    const next = this.nextLevel();
    if (!this.canContinue() || !next || !this.adventure.isUnlocked(next.id)) return;
    this.enterMission(next.id);
  }

  protected start(): void {
    this.started.set(true);
    this.later(() => this.card()?.focus(), 0);
  }

  protected answer(value: number): void {
    if (this.onMap() || !this.started() || this.solved() || this.wrong() || this.complete()) return;
    if (!Number.isSafeInteger(value) || value < 0) return;
    if (value !== this.state().question.correctAnswer) {
      this.mistakes.update(n => n + 1);
      this.wrong.set(true);
      if (this.mistakes() >= 3) {
        this.message.set('Rezolvăm împreună. Cifrel îți arată calculul.');
        this.later(() => { this.wrong.set(false); this.finishStep(true); }, 900);
      } else {
        this.message.set(this.mistakes() === 1 ? 'Mai încercăm! Nu pierzi progresul.'
          : 'Cifrel te ajută: ' + this.exercise().hint);
        this.later(() => {
          this.wrong.set(false);
          this.retryToken.update(n => n + 1);
        }, 900);
      }
      return;
    }
    this.finishStep(false);
  }

  private finishStep(withHelp: boolean): void {
    this.solved.set(true);
    this.adventure.advance(this.selectedLevel());
    const taskDone = this.progress().completed > this.exerciseIndex();
    const success = this.selectedLevel() === 'train' ? taskDone ? 'Vagon cuplat!' : 'Vagonul a sosit! Acum îl cuplăm.'
      : this.selectedLevel() === 'balloons' ? 'Balonul se ridică!'
      : this.selectedLevel() === 'crystals' ? 'Cristal aprins! Pictura se vede tot mai bine.'
      : this.selectedLevel() === 'village' ? 'Prieten ajutat! Darurile ajung la sărbătoare.'
      : this.selectedLevel() === 'lighthouse' ? 'Încă o lumină aprinsă în far!'
      : this.selectedLevel() === 'rocket' ? `${ROCKET_PARTS[this.exerciseIndex()]}: gata!`
      : this.selectedLevel() === 'forest' ? 'Felinar aprins!' : taskDone ? 'Scândura este montată!'
        : 'Am ajuns la 10 și am adus scândura! Calculăm restul ca să o fixăm.';
    this.message.set(withHelp
      ? `Împreună: ${this.exercise().explanation}. ${success}`
      : `${this.selectedLevel() === 'rocket' ? '' : this.exercise().explanation + '. '}${success}`);
    this.later(() => {
      this.next();
      if (this.complete()) {
        if (this.selectedLevel() === 'rocket') this.launch();
        else this.finale.set(true);
      }
    }, withHelp ? 2600 : 1100);
  }

  private next(): void {
    this.exerciseIndex.set(this.progress().completed);
    this.stepIndex.set(this.progress().step);
    this.solved.set(false);
    this.wrong.set(false);
    this.mistakes.set(0);
    this.message.set('');
    this.retryToken.update(n => n + 1);
  }

  protected launch(): void {
    if (this.onMap() || this.selectedLevel() !== 'rocket' || !this.complete() || this.launched() || this.countdown() !== null) return;
    this.countdown.set(3);
    const tick = () => {
      const count = this.countdown()!;
      if (count > 1) {
        this.countdown.set(count - 1);
        this.later(tick, 800);
      } else {
        this.countdown.set(null);
        this.launched.set(true);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          void this.confetti.celebrate(1600).catch(() => { /* Launch works without confetti. */ });
        }
        this.later(() => this.landed.set(true), 3200);
      }
    };
    this.later(tick, 800);
  }

  protected replay(): void {
    this.cancelTimers();
    this.adventure.restart(this.selectedLevel());
    this.resetScene();
    this.next();
    this.started.set(true);
  }

  private resetScene(): void {
    this.launched.set(false);
    this.landed.set(false);
    this.countdown.set(null);
    this.finale.set(false);
  }

  private cancelTimers(): void {
    clearTimeout(this.timer);
  }

  private later(action: () => void, delay: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(action, delay);
  }
}