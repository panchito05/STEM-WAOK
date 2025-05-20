// types.ts - Tipos para el módulo de sumas

// Tipos de dificultad
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// Formatos de visualización
export type DisplayFormat = 'horizontal' | 'vertical' | 'word';

/**
 * Representa un problema de suma
 */
export interface Problem {
  id: string;                        // ID único del problema
  operands: number[];                // Lista de operandos
  correctAnswer: number;             // Respuesta correcta
  displayFormat: DisplayFormat;      // Formato de visualización 
  displayText?: string;              // Texto para problemas de palabra
  allowDecimals?: boolean;           // Permitir decimales
  decimalPlaces?: number;            // Número de lugares decimales
}

/**
 * Respuesta del usuario a un problema
 */
export interface UserAnswer {
  problemId: string;                 // ID del problema
  problem: Problem;                  // Referencia al problema completo
  userAnswer: string | number;       // Respuesta dada por el usuario
  isCorrect: boolean;                // Si la respuesta es correcta
  attempts: number;                  // Número de intentos realizados
  timestamp: number;                 // Timestamp de cuándo se respondió
  status: 'correct' | 'incorrect' | 'timeout' | 'skipped' | 'revealed';  // Estado de la respuesta
}

/**
 * Configuración para generar problemas
 */
export interface ProblemGeneratorConfig {
  count: number;                      // Número de problemas a generar
  difficulty: DifficultyLevel;        // Nivel de dificultad
  minValue: number;                   // Valor mínimo para operandos
  maxValue: number;                   // Valor máximo para operandos
  maxOperands: number;                // Máximo número de operandos
  allowNegatives: boolean;            // Permitir números negativos
  allowDecimals: boolean;             // Permitir números decimales
  decimalPlaces: number;              // Lugares decimales (si allowDecimals es true)
  preferredDisplayFormat: DisplayFormat | DisplayFormat[]; // Formato preferido de visualización
}

/**
 * Estado del ejercicio
 */
export interface ExerciseState {
  isActive: boolean;                  // Si el ejercicio está en curso
  isComplete: boolean;                // Si el ejercicio está completado
  problems: Problem[];                // Lista de problemas para el ejercicio
  currentProblemIndex: number;        // Índice del problema actual
  currentAnswer: string | number;     // Respuesta actual del usuario
  userAnswers: UserAnswer[];          // Respuestas del usuario
  score: number;                      // Puntuación del usuario
  attempts: number;                   // Intentos en el problema actual
  showExplanation: boolean;           // Si se muestra explicación
  consecutive: {                      // Seguimiento de respuestas consecutivas
    correct: number;                  // Correctas consecutivas
    incorrect: number;                // Incorrectas consecutivas
  };
  settings: {                         // Configuración del ejercicio
    problemCount: number;             // Número de problemas
    difficulty: DifficultyLevel;      // Nivel de dificultad
    hasTimeLimit: boolean;            // Si hay límite de tiempo global
    timeLimit: number;                // Tiempo límite en segundos
    hasPerProblemTimer: boolean;      // Si hay tiempo por problema
    problemTimeLimit: number;         // Tiempo por problema en segundos
    maxOperands: number;              // Máximo número de operandos
    minValue: number;                 // Valor mínimo para operandos
    maxValue: number;                 // Valor máximo para operandos
    allowNegatives: boolean;          // Permitir números negativos
    allowDecimals: boolean;           // Permitir números decimales
    decimalPlaces: number;            // Lugares decimales
    maxAttemptsPerProblem: number;    // Máximo de intentos por problema
    showHints: boolean;               // Mostrar pistas
    showExplanations: boolean;        // Mostrar explicaciones
    preferredDisplayFormat: DisplayFormat; // Formato preferido
    adaptiveMode: boolean;            // Modo adaptativo
    language: string;                 // Idioma de la interfaz
    consecutiveCorrectThreshold: number; // Umbral para aumentar dificultad
    consecutiveIncorrectThreshold: number; // Umbral para disminuir dificultad
  };
  timeRemaining: number;              // Tiempo restante global
  problemTimeRemaining: number;       // Tiempo restante para problema actual
}

/**
 * Contexto para el ejercicio
 */
export interface ExerciseContextType {
  state: ExerciseState;
  startExercise: (settings: any) => void;
  endExercise: () => void;
  updateAnswer: (value: string | number) => void;
  submitAnswer: () => boolean;
  skipProblem: () => void;
  showSolution: () => void;
  nextProblem: () => void;
  updateTimer: (timeRemaining: number) => void;
  updateProblemTimer: (timeRemaining: number) => void;
  timerExpired: (timerType: 'global' | 'problem') => void;
}

/**
 * Eventos del ejercicio para análisis y seguimiento
 */
export interface ExerciseEvent {
  type: 'start' | 'end' | 'answer' | 'skip' | 'solution' | 'timer_expired';
  data?: any;
}

/**
 * Resultado del ejercicio para guardar en la base de datos
 */
export interface ExerciseResult {
  id: string;                         // ID único del ejercicio
  moduleId: string;                   // ID del módulo (ej. 'addition')
  date: number;                       // Timestamp de la fecha
  problems: Problem[];                // Lista de problemas
  userAnswers: UserAnswer[];          // Respuestas del usuario
  score: number;                      // Puntuación
  totalProblems: number;              // Total de problemas
  settings: ExerciseState['settings']; // Configuración usada
  timeSpent: number;                  // Tiempo total en segundos
  difficulty: DifficultyLevel;        // Dificultad final
  initialDifficulty: DifficultyLevel; // Dificultad inicial
}

/**
 * Props para el componente NumericKeypad
 */
export interface NumericKeypadProps {
  onNumberClick: (value: string | number) => void;
  disabled?: boolean;
  answer: string | number;
  allowDecimals?: boolean;
}

/**
 * Props para el componente ProblemDisplay
 */
export interface ProblemDisplayProps {
  problem: Problem;
  answer: string | number;
}

/**
 * Props para el componente ResultsBoard
 */
export interface ResultsBoardProps {
  score: number;
  totalProblems: number;
  userAnswers: UserAnswer[];
  difficulty: DifficultyLevel;
  timeSpent: number;
  onRetry: () => void;
  onHome: () => void;
}

/**
 * Props para el componente ExplanationPanel
 */
export interface ExplanationPanelProps {
  problem: Problem;
  userAnswer?: string | number;
  isCorrect: boolean;
  onContinue: () => void;
}

// Añadir aquí otros tipos según sea necesario