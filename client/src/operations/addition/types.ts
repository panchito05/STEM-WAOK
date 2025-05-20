// types.ts - Definiciones de tipos para el módulo de suma

// Niveles de dificultad disponibles
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Estados del ejercicio
export enum ExerciseState {
  LOADING = 'loading',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// Problema de suma
export interface Problem {
  id: string;
  operands: number[];
  result: number;
  difficulty: DifficultyLevel;
}

// Respuesta del usuario a un problema
export interface UserAnswer {
  problemId: string;
  problem: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  attempt: number;
  timeTaken: number;
  pointsEarned: number;
}

// Configuración del ejercicio
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
  rewardType: 'stars' | 'trophies' | 'badges';
  language: 'english' | 'spanish';
}

// Resultados del ejercicio
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
  levelsImproved: number;
}

// Retroalimentación de cambio de nivel
export interface LevelFeedback {
  previousLevel: DifficultyLevel;
  newLevel: DifficultyLevel;
  consecutiveCorrectAnswers: number;
}

// Resultado del sistema de compensación
export interface CompensationResult {
  originalPoints: number;
  bonusPoints: number;
  finalPoints: number;
  reason: string;
}