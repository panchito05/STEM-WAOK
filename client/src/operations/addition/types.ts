// Tipos compartidos para el módulo de suma

// Nivel de dificultad
export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

// Formato de visualización
export type DisplayFormat = 'horizontal' | 'vertical' | 'word';

// Estado de respuesta
export type AnswerStatus = 'correct' | 'incorrect' | 'timeout' | 'skipped' | 'revealed';

// Estructura de un problema matemático
export interface Problem {
  id: string;
  operands: number[];
  correctAnswer: number | string;
  displayFormat?: DisplayFormat;
  displayText?: string;
  explanation?: string;
  difficulty?: DifficultyLevel;
  imageUrl?: string;
}

// Estructura de una respuesta de usuario
export interface UserAnswer {
  problemId: string;
  problem: Problem | string; // Puede ser el problema completo o solo texto
  userAnswer: string | number;
  isCorrect: boolean;
  status?: AnswerStatus;
  attempts: number;
  timeTaken?: number;
  timestamp: number;
}

// Resultado de un ejercicio
export interface ExerciseResult {
  module: string;
  score: number;
  totalProblems: number;
  timeSpent: number;
  settings: any;
  userAnswers: UserAnswer[];
  timestamp: number;
}

// Configuración para generar problemas
export interface ProblemGeneratorConfig {
  count: number;
  difficulty: DifficultyLevel;
  format?: DisplayFormat;
  maxOperands?: number;
  minValue?: number;
  maxValue?: number;
  allowNegatives?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
}

// Evento para tracking de ejercicio
export type ExerciseEvent = 
  | { type: 'exercise_started'; config: any }
  | { type: 'problem_displayed'; problem: Problem }
  | { type: 'answer_submitted'; problem: Problem; answer: string | number; isCorrect: boolean; attemptCount: number }
  | { type: 'explanation_shown'; problem: Problem }
  | { type: 'timer_ended'; problem: Problem }
  | { type: 'exercise_completed'; score: number; totalProblems: number };