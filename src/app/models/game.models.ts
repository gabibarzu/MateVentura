export const MAX_SUM_OPTIONS = [10, 20, 50, 100] as const;
export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;

export type MaxSumOption = (typeof MAX_SUM_OPTIONS)[number];
export type QuestionCountOption = (typeof QUESTION_COUNT_OPTIONS)[number];

export type OperationType = 'add' | 'subtract' | 'mix';
export type Operator = '+' | '-';

export interface OperationOption {
  value: OperationType;
  label: string;
}

export const OPERATION_OPTIONS: readonly OperationOption[] = [
  { value: 'add', label: 'Adunare (+)' },
  { value: 'subtract', label: 'Scădere (-)' },
  { value: 'mix', label: 'Mix (+/-)' },
];

export interface GameSettings {
  mode: GameMode;
  maxSum: MaxSumOption;
  operation: OperationType;
  questionCount: QuestionCountOption;
  showHints: boolean;
}

/** Counting-dot hints are only offered for small numbers. */
export const HINTS_MAX_SUM = 20;

export type LevelId = 'easy' | 'medium' | 'hard';
/** Levels have fixed settings (and a leaderboard); `quick` and `custom` games don't. */
export type GameMode = LevelId | 'quick' | 'custom';

export interface LevelPreset {
  id: LevelId;
  name: string;
  icon: string;
  age: string;
  description: string;
  settings: GameSettings;
}

export const LEVELS: readonly LevelPreset[] = [
  {
    id: 'easy',
    name: 'Ușor',
    icon: 'eco',
    age: '5–6 ani',
    description: 'Adunări până la 10 · 5 exerciții · cu bulinuțe',
    settings: { mode: 'easy', maxSum: 10, operation: 'add', questionCount: 5, showHints: true },
  },
  {
    id: 'medium',
    name: 'Mediu',
    icon: 'star',
    age: '6–7 ani',
    description: 'Adunări și scăderi până la 20 · 10 exerciții',
    settings: { mode: 'medium', maxSum: 20, operation: 'mix', questionCount: 10, showHints: false },
  },
  {
    id: 'hard',
    name: 'Greu',
    icon: 'local_fire_department',
    age: '7–8 ani',
    description: 'Adunări și scăderi până la 100 · 10 exerciții',
    settings: { mode: 'hard', maxSum: 100, operation: 'mix', questionCount: 10, showHints: false },
  },
];

export const QUICK_GAME_SETTINGS: GameSettings = {
  mode: 'quick',
  maxSum: 20,
  operation: 'mix',
  questionCount: 5,
  showHints: false,
};

/** Initial values of the custom game form when nothing was played yet. */
export const DEFAULT_SETTINGS: GameSettings = LEVELS[0].settings;

export const MODE_LABELS: Record<GameMode, string> = {
  easy: 'Nivel Ușor',
  medium: 'Nivel Mediu',
  hard: 'Nivel Greu',
  quick: 'Joc rapid',
  custom: 'Joc personalizat',
};

export function isLevel(mode: GameMode): mode is LevelId {
  return LEVELS.some((level) => level.id === mode);
}

export interface MathQuestion {
  id: number;
  operandA: number;
  operandB: number;
  operator: Operator;
  correctAnswer: number;
}

export type AnswerStatus = 'pending' | 'correct' | 'wrong';

export interface QuestionState {
  question: MathQuestion;
  userAnswer: number | null;
  status: AnswerStatus;
}

export type GameStatus = 'idle' | 'playing' | 'finished';

export interface SetupDialogData {
  /** Settings of the last game, if any (highlights the last level and pre-fills the custom form). */
  settings: GameSettings | null;
  canCancel: boolean;
}

export interface GameResult {
  correct: number;
  total: number;
  elapsedSeconds: number;
  settings: GameSettings;
}

export type ResultsDialogAction = 'new-game' | 'retry';

export interface LeaderboardEntry {
  id: string;
  name: string;
  correct: number;
  total: number;
  elapsedSeconds: number;
  operation: OperationType;
  maxSum: MaxSumOption;
  /** Missing on scores saved before levels existed; derived from the settings when they match a level. */
  level?: LevelId;
  /** ISO date string. */
  date: string;
}

export interface LeaderboardDialogData {
  level: LevelId | null;
}
