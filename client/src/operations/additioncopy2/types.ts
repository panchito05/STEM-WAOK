// Definición de tipos para el módulo de división

// Niveles de dificultad estandarizados para todos los módulos
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Formatos de visualización para los problemas de división
export type DivisionDisplayFormat = 'slash' | 'obelus' | 'long';

// Definición de un problema de división específico
export interface DivisionProblem {
  id: string;
  num1: number;              // Dividendo
  num2: number;              // Divisor
  operator: string;          // Siempre ÷
  correctAnswer: number;     // Respuesta correcta
  displayFormat: DivisionDisplayFormat; // Formato de visualización
  index?: number;            // Índice del problema en la secuencia
  total?: number;            // Total de problemas en el ejercicio
}

// Tipo genérico para un operando
export interface Operand {
  value: number;
  label?: string;
  displayType?: string;
}

// Tipo genérico para cualquier problema matemático
export interface Problem {
  id: string;
  operands: Operand[];
  operator?: string;
  correctAnswer: number;
  displayFormat: string;
  difficulty: DifficultyLevel;
  allowDecimals: boolean;
  maxAttempts: number;
}

// Respuesta del usuario a un problema
export interface UserAnswer {
  problemId: string;
  problem: Problem;
  userAnswer: number;
  isCorrect: boolean;
  status: string;
  attempts: number;
  timestamp: number;
  timeTaken?: number;
  mistakes?: number[];
}

// Resultado de un ejercicio completo
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
  extra_data?: {
    version?: string;
    timestamp?: number;
    exerciseId?: string;
    problemDetails?: any[];
    problems?: any[];
    capturedProblems?: any[];
    exerciseType?: string;
    [key: string]: any;
  };
}

// Props para el componente Exercise
export interface ExerciseProps {
  settings: {
    difficulty: string;
    problemCount: number;
    timeValue: number;
    hasTimerEnabled: boolean;
    timeLimit?: string;
    maxAttempts: number;
    showImmediateFeedback: boolean;
    enableSoundEffects: boolean;
    showAnswerWithExplanation: boolean;
    enableAdaptiveDifficulty: boolean;
    enableCompensation: boolean;
    enableRewards: boolean;
    rewardType: string;
    language: string;
  };
  onOpenSettings: () => void;
}