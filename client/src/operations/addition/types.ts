// Niveles de dificultad para los ejercicios
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// Formatos de visualización para los problemas
export type DisplayFormat = 'vertical' | 'horizontal' | 'word';

// Interfaz para los operandos de un problema de suma
export interface Operand {
  value: number;
  label?: string;
}

// Interfaz para un problema de suma
export interface Problem {
  id: string;
  operands: Operand[];
  displayFormat: DisplayFormat;
  correctAnswer: number;
  difficulty: DifficultyLevel;
  allowDecimals?: boolean;
  timeLimit?: number;
  maxAttempts?: number;
}

// Interfaz para las configuraciones del módulo
export interface ModuleSettings {
  difficulty: DifficultyLevel;
  problemCount: number;
  hasTimeLimit: boolean;
  timeLimit: number;
  hasPerProblemTimer: boolean;
  problemTimeLimit: number;
  showExplanations: boolean;
  language: string;
  maxConsecutiveIncorrect?: number;
  allowMultipleAttempts?: boolean;
  maxAttemptCount?: number;
  consecutiveCorrectThreshold?: number;
  consecutiveIncorrectThreshold?: number;
}

// Estado de una respuesta
export type AnswerStatus = 'correct' | 'incorrect' | 'timeout' | 'revealed' | 'skipped';

// Interfaz para una respuesta del usuario
export interface UserAnswer {
  problemId: string;
  problem: Problem;
  userAnswer: number | null;
  isCorrect: boolean;
  status: AnswerStatus;
  attempts: number;
  timestamp: number;
}

// Interfaz para el estado del ejercicio
export interface ExerciseState {
  problems: Problem[];
  userAnswers: UserAnswer[];
  currentProblemIndex: number;
  currentAnswer: string;
  settings: ModuleSettings;
  score: number;
  isComplete: boolean;
  isActive: boolean;
  showExplanation: boolean;
  startTime: number;
  endTime: number | null;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

// Interfaz para el resultado de un ejercicio
export interface ExerciseResult {
  id: string;
  moduleId: string;
  score: number;
  totalProblems: number;
  timeSpent: number;
  date: string;
  problems: Problem[];
  settings: ModuleSettings;
  userAnswers: UserAnswer[];
}

// Interfaz para estadísticas de un módulo
export interface ModuleStats {
  moduleId: string;
  totalExercises: number;
  averageScore: number;
  totalProblemsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeoutAnswers: number;
  revealedAnswers: number;
  skippedAnswers: number;
  averageTimePerProblem: number;
  lastActivity: string;
  difficultyProgression: {
    easy: number;
    medium: number;
    hard: number;
    expert: number;
  };
}