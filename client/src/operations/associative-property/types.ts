// Definición de tipos para el módulo de Propiedad Asociativa

// Niveles de dificultad específicos para propiedad asociativa
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Tipos de actividades para cada nivel
export type AssociativeActivityLevel = 1 | 2 | 3 | 4 | 5;

// Formatos de visualización para los problemas
export type ExerciseLayout = 'horizontal' | 'vertical';

// Tipos de objetos visuales para el nivel 1
export type VisualObject = {
  id: string;
  emoji: string;
  name: string;
  color?: string;
};

// Configuración de agrupamiento para nivel 1
export interface GroupingConfiguration {
  objects: VisualObject[];
  groups: {
    first: number[];  // Índices de objetos en el primer grupo
    second: number[]; // Índices de objetos en el segundo grupo
    third?: number[]; // Índices de objetos en el tercer grupo (opcional)
  };
}

// Problema de nivel 1: Agrupar objetos visuales
export interface Level1Problem {
  id: string;
  level: 1;
  objects: VisualObject[];
  grouping1: GroupingConfiguration;
  grouping2: GroupingConfiguration;
  question: string;
  correctAnswer: boolean; // Siempre true para nivel 1
}

// Problema de nivel 2: Introducción numérica con sumas
export interface Level2Problem {
  id: string;
  level: 2;
  expression1: string; // "(2 + 3) + 4"
  expression2: string; // "2 + (3 + 4)"
  operands: number[];  // [2, 3, 4]
  correctAnswer: number;
  visualGroups?: string[]; // Colores o marcos para visualización
}

// Problema de nivel 3: Ejercicios guiados
export interface Level3Problem {
  id: string;
  level: 3;
  originalExpression: string; // "(6 + 1) + 3"
  incompleteExpression: string; // "6 + (___ + ___)"
  operands: number[]; // [6, 1, 3]
  correctAnswer: number;
  missingValues: number[]; // Valores que faltan completar
}

// Problema de nivel 4: Problemas verbales y cálculo mental
export interface Level4Problem {
  id: string;
  level: 4;
  problemText: string; // Problema verbal
  numbers: number[];   // Números involucrados
  suggestedStrategy?: string; // Estrategia sugerida
  correctAnswer: number;
  optimalGrouping: string; // Agrupamiento más eficiente
}

// Problema de nivel 5: Crear y justificar expresiones
export interface Level5Problem {
  id: string;
  level: 5;
  targetSum: number;     // Suma objetivo
  availableNumbers: number[]; // Números disponibles
  requiresCreation: boolean;  // Si debe crear expresiones
  requiresJustification: boolean; // Si debe justificar
  correctExpressions: string[]; // Expresiones válidas
}

// Unión de todos los tipos de problemas
export type AssociativePropertyProblem = 
  | Level1Problem 
  | Level2Problem 
  | Level3Problem 
  | Level4Problem 
  | Level5Problem;

// Configuración de nivel activo
export interface LevelConfiguration {
  currentLevel: AssociativeActivityLevel;
  isLocked: boolean;
  requiredCorrectAnswers: number;
  currentProgress: number;
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