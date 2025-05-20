// types.ts - Definición de tipos para el módulo de suma

// Tipo de nivel de dificultad
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// Tipo de formato de visualización del problema
export type DisplayFormat = 'horizontal' | 'vertical' | 'word';

// Interfaz para problemas de suma
export interface Problem {
  id: string;                        // ID único del problema
  operands: number[];                // Lista de operandos
  correctAnswer: number;             // Respuesta correcta
  displayFormat: DisplayFormat;      // Formato de visualización 
  displayText?: string;              // Texto para problemas de palabra
  allowDecimals?: boolean;           // Permitir decimales
  decimalPlaces?: number;            // Número de lugares decimales
}

// Interfaz para respuestas del usuario
export interface UserAnswer {
  problemId: string;                 // ID del problema
  problem: Problem;                  // Referencia al problema completo
  userAnswer: string | number;       // Respuesta dada por el usuario
  isCorrect: boolean;                // Si la respuesta es correcta
  attempts: number;                  // Número de intentos realizados
  timestamp: number;                 // Timestamp de cuándo se respondió
  status: 'correct' | 'incorrect' | 'timeout' | 'skipped' | 'revealed';  // Estado de la respuesta
}

// Interfaz para la configuración del generador de problemas
export interface ProblemGeneratorConfig {
  count: number;                      // Número de problemas a generar
  difficulty: DifficultyLevel;        // Nivel de dificultad
  minValue: number;                   // Valor mínimo para operandos
  maxValue: number;                   // Valor máximo para operandos
  maxOperands: number;                // Máximo número de operandos
  allowNegatives: boolean;            // Permitir números negativos
  allowDecimals: boolean;             // Permitir números decimales
  decimalPlaces: number;              // Lugares decimales (si allowDecimals es true)
  preferredDisplayFormat: DisplayFormat; // Formato preferido de visualización
}

// Interfaz para el estado del ejercicio
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

// Interfaz para el contexto del ejercicio
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

// Interfaz para eventos de ejercicio
export interface ExerciseEvent {
  type: 'start' | 'end' | 'answer' | 'skip' | 'solution' | 'timer_expired';
  data?: any;
}

// Resultado del ejercicio para guardar
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