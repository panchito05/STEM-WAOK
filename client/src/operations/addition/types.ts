// types.ts - Tipos compartidos para el módulo de suma
import { ReactNode } from 'react';

// Niveles de dificultad disponibles
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Configuración del temporizador
export type TimerType = 'global' | 'per-problem' | 'none';

// Estructura robusta de un problema de suma
export interface Problem {
  id: string;                         // Identificador único del problema (obligatorio para tracking)
  operands: number[];                 // Números a sumar/operar
  correctAnswer: number | string;     // Respuesta correcta (tipado más específico)
  answerMaxDigits?: number;           // Máximo de dígitos permitidos en la respuesta
  answerDecimalPosition?: number;     // Posición del decimal si aplica
  displayText?: string;               // Texto de visualización personalizado
  displayFormat?: 'horizontal' | 'vertical' | 'word'; // Formato de visualización  
  operacion?: string;                 // Tipo de operación (suma, resta, etc.)
  tipo?: string;                      // Categoría del problema
  explanation?: string;               // Explicación detallada de la solución
  difficulty?: DifficultyLevel;       // Nivel de dificultad específico del problema
  metadata?: Record<string, any>;     // Datos adicionales para análisis
  createdAt?: number;                 // Timestamp de creación
}

// Estructura de respuesta del usuario mejorada
export interface UserAnswer {
  problemId: string;                  // ID del problema (obligatorio para tracking)
  problem: Problem | string;          // Problema completo o su representación
  userAnswer: number | string;        // Respuesta proporcionada por el usuario
  isCorrect: boolean;                 // Si la respuesta es correcta
  attempts: number;                   // Número de intentos realizados
  timeTaken?: number;                 // Tiempo que tardó en responder (segundos)
  timestamp: number;                  // Timestamp de la respuesta
  status?: 'correct' | 'incorrect' | 'timeout' | 'skipped'; // Estado detallado
}

// Configuración del módulo de suma (tipada con precisión)
export interface ModuleSettings {
  difficulty: DifficultyLevel;        // Nivel de dificultad
  problemCount: number;               // Número de problemas por ejercicio
  timeLimit: TimerType;               // Tipo de límite de tiempo
  timeValue: number;                  // Valor del tiempo en segundos
  maxAttempts: number;                // Máximo de intentos permitidos
  showImmediateFeedback: boolean;     // Mostrar retroalimentación inmediata
  enableSoundEffects: boolean;        // Habilitar efectos de sonido
  showAnswerWithExplanation: boolean; // Mostrar respuesta con explicación
  enableAdaptiveDifficulty: boolean;  // Habilitar dificultad adaptativa
  enableCompensation: boolean;        // Habilitar compensación (ayuda adaptativa)
  enableRewards: boolean;             // Habilitar sistema de recompensas
  rewardType: 'stars' | 'points' | 'badges'; // Tipo de recompensa
  language: 'english' | 'spanish';    // Idioma de la interfaz
}

// Estados posibles de un ejercicio
export type ExerciseState = 
  | 'loading'               // Cargando ejercicio
  | 'problem-display'       // Mostrando problema actual
  | 'feedback'              // Mostrando retroalimentación
  | 'explanation'           // Mostrando explicación
  | 'completed'             // Ejercicio completado
  | 'error';                // Error en el ejercicio

// Estructura de resultados para guardar en el historial (mejorada)
export interface ExerciseResult {
  id?: string;                        // ID único para el resultado
  operationId: string;                // ID de la operación (suma, resta, etc)
  childProfileId?: number;            // ID del perfil del niño si aplica
  date: string;                       // Fecha del ejercicio (formato ISO)
  score: number;                      // Puntuación obtenida
  totalProblems: number;              // Total de problemas
  timeSpent: number;                  // Tiempo total en segundos
  difficulty: DifficultyLevel;        // Nivel de dificultad (tipado)
  accuracy: number;                   // Precisión (0-100%)
  avgTimePerProblem: number;          // Tiempo promedio por problema
  avgAttempts: number;                // Intentos promedio por problema
  revealedAnswers: number;            // Número de respuestas reveladas
  consecutiveCorrect?: number;        // Respuestas correctas consecutivas
  problemDetails?: Array<{            // Detalles de cada problema
    problemId: string;
    problemText: string;
    isCorrect: boolean;
    attempts: number;
    timeTaken: number;
  }>;
  extra_data: Record<string, any>;    // Datos adicionales
}

// Eventos de ejercicio para tracking
export type ExerciseEvent = 
  | { type: 'exercise_started', config: ModuleSettings }
  | { type: 'problem_displayed', problem: Problem }
  | { type: 'answer_submitted', problem: Problem, answer: string | number, isCorrect: boolean, attemptCount: number }
  | { type: 'exercise_completed', results: ExerciseResult }
  | { type: 'difficulty_changed', previousLevel: DifficultyLevel, newLevel: DifficultyLevel, consecutiveCorrectAnswers: number };

// Propiedades para componentes de ejercicio
export interface ExerciseComponentProps {
  config: ModuleSettings;
  onComplete?: (results: ExerciseResult) => void;
  onConfigChange?: (newConfig: Partial<ModuleSettings>) => void;
}

// Contexto para compartir estado entre componentes
export interface ExerciseContextType {
  state: ExerciseState;
  currentProblem: Problem | null;
  currentAnswer: string;
  userAnswers: UserAnswer[];
  problemIndex: number;
  totalProblems: number;
  remainingAttempts: number;
  timeLeft: number | null;
  score: number;
  
  // Acciones
  setAnswer: (value: string) => void;
  submitAnswer: () => void;
  goToNextProblem: () => void;
  restartExercise: () => void;
  showExplanation: () => void;
}