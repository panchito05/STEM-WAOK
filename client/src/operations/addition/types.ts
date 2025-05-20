// types.ts - Definición de tipos para el módulo de suma

// Define los niveles de dificultad posibles
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Define el tipo de problema de suma
export interface Problem {
  id: number;
  operands: number[];
  result: number;
  explanation?: string;
  difficultyLevel: DifficultyLevel;
  hasRegrouping?: boolean;
  problemType?: string;
}

// Define la configuración del ejercicio
export interface ExerciseSettings {
  difficulty: DifficultyLevel;
  problemCount: number;
  timeLimit: 'none' | 'global' | 'per-problem';
  timeValue: number;
  maxAttempts: number;
  showImmediateFeedback: boolean;
  enableSoundEffects: boolean;
  showAnswerWithExplanation: boolean;
  enableAdaptiveDifficulty: boolean;
  enableCompensation: boolean;
  enableRewards: boolean;
  rewardType: string;
  language: 'spanish' | 'english';
}

// Define la respuesta del usuario para un problema
export interface UserAnswer {
  problemId: number;
  problem: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  attempt: number;
  timeTaken: number;
  pointsEarned: number;
}

// Define los resultados del ejercicio
export interface ExerciseResults {
  totalProblems: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  timeOutAnswers: number;
  totalPoints: number;
  accuracy: number;
  totalTimeTaken: number;
  averageTimePerProblem: number;
  userAnswers: UserAnswer[];
  difficulty: DifficultyLevel;
  levelsImproved?: number;
}

// Define el estado actual del ejercicio
export enum ExerciseState {
  LOADING = 'loading',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  REVIEW_PROBLEM = 'review_problem',
  COMPLETED = 'completed',
}

// Define el resultado de la compensación adaptativa
export interface CompensationResult {
  compensated: boolean;
  newPoints: number;
  bonusPoints: number;
  reason: string;
}

// Define la información para la retroalimentación del nivel
export interface LevelFeedback {
  previousLevel: string;
  newLevel: string;
  consecutiveCorrectAnswers: number;
}