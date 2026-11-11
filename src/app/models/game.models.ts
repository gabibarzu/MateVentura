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
  maxSum: MaxSumOption;
  operation: OperationType;
  questionCount: QuestionCountOption;
  showHints: boolean;
}

/** Counting-dot hints are only offered for small numbers. */
export const HINTS_MAX_SUM = 20;

export const DEFAULT_SETTINGS: GameSettings = {
  maxSum: 10,
  operation: 'add',
  questionCount: 10,
  showHints: true,
};

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
  settings: GameSettings;
  canCancel: boolean;
}

export interface GameResult {
  correct: number;
  total: number;
  elapsedSeconds: number;
  settings: GameSettings;
}

export type ResultsDialogAction = 'new-game' | 'retry';

/** Scores are only compared between games with the same operation, max sum and number of questions. */
export interface LeaderboardCategory {
  key: string;
  operation: OperationType;
  maxSum: MaxSumOption;
  total: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  correct: number;
  total: number;
  elapsedSeconds: number;
  operation: OperationType;
  maxSum: MaxSumOption;
  /** ISO date string. */
  date: string;
}

export interface LeaderboardDialogData {
  categoryKey: string | null;
}
