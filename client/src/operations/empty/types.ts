// Definición de tipos para Empty Module - plantilla para nuevos módulos

// Niveles de dificultad estandarizados para todos los módulos
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Formatos de visualización para los problemas
export type ExerciseLayout = 'horizontal' | 'vertical';

// Definición de un problema genérico - personaliza según tu necesidad
export interface EmptyProblem {
  id: string;
  content: any;             // Contenido del problema - personalízalo según tu módulo
  correctAnswer: any;       // Respuesta correcta - puede ser string, number, array, etc.
  layout: ExerciseLayout;   // Formato de visualización
  metadata?: any;           // Metadatos adicionales para el problema
  index?: number;           // Índice del problema en la secuencia
  total?: number;           // Total de problemas en el ejercicio
}

// Tipo genérico para un operando
export interface Operand {
  value: number;
  // Podríamos añadir más propiedades en el futuro como:
  // label?: string;
  // displayType?: string;
}

// Tipo genérico para cualquier problema matemático
export interface Problem {
  id: string;
  operands: Operand[];
  operator?: string;       // El operador matemático (no usado en suma, pero útil para otros módulos)
  correctAnswer: number;
  displayFormat: string;   // Cómo mostrar el problema (horizontal, vertical, word)
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
  status: string;          // 'correct', 'incorrect', 'skipped', etc.
  attempts: number;
  timestamp: number;
  timeTaken?: number;      // Tiempo que le tomó al usuario responder
  mistakes?: number[];     // Lista de respuestas incorrectas
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