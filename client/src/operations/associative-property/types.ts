// Definición de tipos para el módulo de propiedad asociativa

// Niveles de dificultad estandarizados para todos los módulos
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Tipos de ejercicios para el nivel avanzado
export type AdvancedExerciseType = 'fill-blank' | 'verification' | 'multiple-choice';

// Formatos de visualización para los problemas
export type ExerciseLayout = 'horizontal' | 'vertical';
export type DisplayFormat = 'horizontal' | 'vertical' | 'word';

// Objeto visual para representar cantidades
export interface VisualObject {
  emoji: string;            // Emoji del objeto (🍎, 🍊, 🍌, etc.)
  count: number;            // Cantidad de este objeto
  color: string;            // Color de fondo para agrupación
}

// Estructura para representar una agrupación en la propiedad asociativa
export interface AssociativeGrouping {
  leftGroup: number[];   // Números del grupo izquierdo: (a + b)
  rightGroup: number[];  // Números del grupo derecho: + c
  leftSum: number;       // Suma del grupo izquierdo
  rightSum: number;      // Suma del grupo derecho (si hay más de un número)
  totalSum: number;      // Suma total de ambos grupos
  expression: string;    // Expresión matemática: "(2 + 3) + 4"
}

// Definición de un problema de propiedad asociativa específico
// La propiedad asociativa establece que: (a + b) + c = a + (b + c)
export interface AssociativePropertyProblem extends BaseProblem {
  operands: number[];       // Operandos para demostrar la propiedad asociativa (mínimo 3 números)
  layout: ExerciseLayout;   // Formato de visualización
  answerMaxDigits: number;  // Número máximo de dígitos en la respuesta
  answerDecimalPosition?: number; // Posición del decimal en la respuesta (si aplica)
  visualObjects?: VisualObject[]; // Objetos visuales para nivel principiante
  showVisualMode?: boolean; // Si debe mostrar modo visual
  interactiveMode?: boolean; // Si debe mostrar campos de entrada interactivos (nivel intermedio)
  blankPositions?: number[]; // Posiciones de los espacios en blanco para completar
  // Propiedades específicas para enseñar la propiedad asociativa
  grouping1?: AssociativeGrouping; // Primera agrupación: (a + b) + c
  grouping2?: AssociativeGrouping; // Segunda agrupación: a + (b + c)
  // Tipo de ejercicio para nivel avanzado
  advancedExerciseType?: AdvancedExerciseType;
  // Propiedades de compatibilidad con Problem - REQUIRED
  displayFormat: string;
  allowDecimals: boolean;
  operator?: string;
  // Campos legacy para compatibilidad
  num1?: number;
  num2?: number;
}

// Tipo genérico para un operando
export interface Operand {
  value: number;
  // Podríamos añadir más propiedades en el futuro como:
  // label?: string;
  // displayType?: string;
}

// Tipo base para cualquier problema matemático
export interface BaseProblem {
  id: string;
  correctAnswer: number;
  difficulty: DifficultyLevel;
  maxAttempts: number;
  index?: number;
  total?: number;
}

// Tipo genérico para problemas simples (compatibilidad)
export interface Problem extends BaseProblem {
  operands: Operand[];
  operator?: string;
  displayFormat: string;
  allowDecimals: boolean;
}

// Tipo base para respuestas de usuario
export interface BaseUserAnswer {
  problemId: string;
  userAnswer: number;
  isCorrect: boolean;
  status: string;          // 'correct', 'incorrect', 'skipped', etc.
  attempts: number;
  timestamp: number;
  timeTaken?: number;      // Tiempo que le tomó al usuario responder
  mistakes?: number[];     // Lista de respuestas incorrectas
}

// Respuesta del usuario a un problema de propiedad asociativa
export interface AssociativePropertyUserAnswer extends BaseUserAnswer {
  problem: AssociativePropertyProblem;
}

// Respuesta del usuario a un problema genérico (compatibilidad)
export interface UserAnswer extends BaseUserAnswer {
  problem: Problem;
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