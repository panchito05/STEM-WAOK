// types.ts - Tipos compartidos para el módulo de suma

// Niveles de dificultad disponibles
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Estructura de un problema de suma
export interface Problem {
  id?: string;
  operands?: number[];
  correctAnswer?: any; // Puede ser string o number
  answerMaxDigits?: number;
  answerDecimalPosition?: number;
  displayText?: string;
  operacion?: string;
  tipo?: string;
}

// Estructura de respuesta del usuario
export interface UserAnswer {
  userAnswer: any; // Puede ser string o number
  isCorrect: boolean;
  problem?: string;
  attempts?: number;
  status?: string;
  problemId?: string;
}

// Configuración del módulo de suma
export interface ModuleSettings {
  difficulty: DifficultyLevel;
  problemCount: number;
  timeLimit: string;
  timeValue: number;
  maxAttempts: number;
  showImmediateFeedback: boolean;
  enableSoundEffects: boolean;
  showAnswerWithExplanation: boolean;
  enableAdaptiveDifficulty: boolean;
  enableCompensation: boolean;
  enableRewards: boolean;
  rewardType: string;
  language: string;
}

// Estructura de resultados para guardar en el historial
export interface ExerciseResult {
  operationId: string;
  date: string;
  score: number;
  totalProblems: number;
  timeSpent: number;
  difficulty: string;
  accuracy: number;
  avgTimePerProblem: number;
  avgAttempts: number;
  revealedAnswers: number;
  extra_data: Record<string, any>;
}