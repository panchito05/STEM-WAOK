// Tipos para el módulo de suma (addition)

// Niveles de dificultad disponibles
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Formato de visualización para problemas
export type ExerciseLayout = 'horizontal' | 'vertical';
export type DisplayFormat = ExerciseLayout | 'word';

// Estado de la respuesta del usuario
export type AnswerStatus = 'correct' | 'incorrect' | 'skipped' | 'timeout' | 'revealed';

// Estructura específica para problemas de suma
export interface AdditionProblem {
  id: string;
  num1: number;   // Primer operando (compatibilidad con código legacy)
  num2: number;   // Segundo operando (compatibilidad con código legacy)
  operands: number[];  // Todos los operandos del problema
  correctAnswer: number;  // La respuesta correcta (suma de operandos)
  layout: ExerciseLayout;  // Diseño del problema (horizontal/vertical)
  answerMaxDigits: number;  // Número máximo de dígitos en la respuesta
  answerDecimalPosition?: number;  // Posición del decimal en la respuesta (si aplica)
}

// Operando individual para un problema
export interface Operand {
  value: number;
  label?: string; // Para problemas de palabras
}

// Estructura de un problema matemático
export interface Problem {
  id: string;
  operands: Operand[];
  displayFormat: DisplayFormat;
  correctAnswer: number;
  difficulty: DifficultyLevel;
  allowDecimals: boolean;
  maxAttempts: number;
}

// Respuesta del usuario a un problema
export interface UserAnswer {
  problemId: string;
  problem: Problem;
  userAnswer: number | null;
  isCorrect: boolean;
  status: AnswerStatus;
  attempts: number;
  timestamp: number;
}

// Configuraciones para un módulo específico
export interface ModuleSettings {
  difficulty: DifficultyLevel;
  problemCount: number;
  hasTimeLimit: boolean;
  timeLimit: number;
  hasPerProblemTimer: boolean;
  problemTimeLimit?: number;
  showExplanations: boolean;
  language: string;
}

// Estado del ejercicio
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
  attempts: number;
}

// Resultado de un ejercicio completado
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

// Configuración para el generador de problemas
export interface ProblemGeneratorConfig {
  difficulty: DifficultyLevel;
  problemCount: number;
  maxOperands?: number;
  minValue?: number;
  maxValue?: number;
  allowNegatives?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  preferredDisplayFormat?: DisplayFormat | DisplayFormat[];
}

// Tipos para el contexto del ejercicio
export interface ExerciseContextType {
  state: ExerciseState;
  updateAnswer: (value: string | number) => void;
  submitAnswer: () => boolean;
  skipProblem: () => void;
  showSolution: () => void;
  nextProblem: () => void;
  resetExercise: (settings?: Partial<ModuleSettings>) => void;
}

// Eventos para el reducer del contexto
export type ExerciseEvent =
  | { type: 'UPDATE_ANSWER'; payload: string }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'SKIP_PROBLEM' }
  | { type: 'SHOW_SOLUTION' }
  | { type: 'NEXT_PROBLEM' }
  | { type: 'COMPLETE_EXERCISE' }
  | { type: 'RESET_EXERCISE'; payload?: Partial<ModuleSettings> };