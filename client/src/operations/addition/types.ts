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

// Tipo alias para compatibilidad con código anterior
export type AdditionProblem = Problem;

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

// Estado del ejercicio para el contexto
export interface ExerciseState {
  // Estado general del ejercicio
  isActive: boolean;
  isComplete: boolean;
  currentProblemIndex: number;
  score: number;
  
  // Problemas y respuestas
  problems: Problem[];
  userAnswers: UserAnswer[];
  
  // Estado del problema actual
  currentAnswer: string | number;
  attempts: number;
  showExplanation: boolean;
  
  // Temporizadores
  timeRemaining: number;
  problemTimeRemaining: number;
  
  // Configuración
  settings: ModuleSettings;
}

// Configuración específica del módulo (reutilizada desde settings.ts)
export interface ModuleSettings {
  language?: string;
  problemCount?: number;
  difficulty?: DifficultyLevel;
  hasTimeLimit?: boolean;
  timeLimit?: number;
  hasPerProblemTimer?: boolean;
  maxOperands?: number;
  minValue?: number;
  maxValue?: number;
  allowNegatives?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  maxAttemptsPerProblem?: number;
  showHints?: boolean;
  showExplanations?: boolean;
  preferredDisplayFormat?: DisplayFormat;
  adaptiveMode?: boolean;
  consecutiveCorrectThreshold?: number;
  consecutiveIncorrectThreshold?: number;
}

// Tipo para el contexto del ejercicio
export interface ExerciseContextType {
  // Estado
  state: ExerciseState;
  
  // Acciones
  startExercise: (settings: ModuleSettings) => void;
  endExercise: () => void;
  nextProblem: () => void;
  updateAnswer: (value: string | number) => void;
  submitAnswer: () => void;
  skipProblem: () => void;
  showSolution: () => void;
  
  // Timer
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}