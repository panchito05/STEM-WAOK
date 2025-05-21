import { AdditionProblem } from '../../domain/AdditionProblem';
import { ProfessorModeSettings } from '../../domain/AdditionSettings';
import { ProfessorStudentAnswer } from '../../domain/AdditionResult';

/**
 * Modos de visualización posibles en el Modo Profesor
 */
export enum ProfessorModeDisplayMode {
  PROBLEM = 'problem',
  EXPLANATION = 'explanation',
  RESULTS = 'results',
  REVIEW = 'review'
}

/**
 * Estado para el modo de problema
 */
export interface ProblemModeState {
  readonly displayMode: ProfessorModeDisplayMode.PROBLEM;
  readonly problems: ReadonlyArray<AdditionProblem>;
  readonly studentAnswers: ReadonlyArray<ProfessorStudentAnswer>;
  readonly currentProblemIndex: number;
  readonly settings: ProfessorModeSettings;
  readonly totalTime: number;
}

/**
 * Estado para el modo de explicación
 */
export interface ExplanationModeState {
  readonly displayMode: ProfessorModeDisplayMode.EXPLANATION;
  readonly problems: ReadonlyArray<AdditionProblem>;
  readonly studentAnswers: ReadonlyArray<ProfessorStudentAnswer>;
  readonly currentProblemIndex: number;
  readonly settings: ProfessorModeSettings;
  readonly totalTime: number;
  readonly explanationText?: string;
  readonly activeDrawing?: string;
}

/**
 * Estado para el modo de resultados
 */
export interface ResultsModeState {
  readonly displayMode: ProfessorModeDisplayMode.RESULTS;
  readonly problems: ReadonlyArray<AdditionProblem>;
  readonly studentAnswers: ReadonlyArray<ProfessorStudentAnswer>;
  readonly currentProblemIndex: number;
  readonly settings: ProfessorModeSettings;
  readonly totalTime: number;
  readonly statistics?: {
    readonly correctCount: number;
    readonly incorrectCount: number;
    readonly averageTime: number;
  };
}

/**
 * Estado para el modo de revisión
 */
export interface ReviewModeState {
  readonly displayMode: ProfessorModeDisplayMode.REVIEW;
  readonly problems: ReadonlyArray<AdditionProblem>;
  readonly studentAnswers: ReadonlyArray<ProfessorStudentAnswer>;
  readonly currentProblemIndex: number;
  readonly settings: ProfessorModeSettings;
  readonly totalTime: number;
}

/**
 * Tipo discriminado para cualquier estado del Modo Profesor
 */
export type ProfessorModeState = 
  | ProblemModeState 
  | ExplanationModeState 
  | ResultsModeState 
  | ReviewModeState;

/**
 * Eventos que pueden ocurrir en el Modo Profesor
 */
export enum ProfessorModeEvent {
  PROBLEM_SOLVED = 'problemSolved',
  CONTINUE_TO_NEXT = 'continueToNext',
  SHOW_EXPLANATION = 'showExplanation',
  FINISH_SESSION = 'finishSession',
  START_REVIEW = 'startReview',
  END_REVIEW = 'endReview'
}

/**
 * Transiciones permitidas entre estados
 */
const ALLOWED_TRANSITIONS: Record<ProfessorModeDisplayMode, ProfessorModeDisplayMode[]> = {
  [ProfessorModeDisplayMode.PROBLEM]: [
    ProfessorModeDisplayMode.EXPLANATION,
    ProfessorModeDisplayMode.RESULTS
  ],
  [ProfessorModeDisplayMode.EXPLANATION]: [
    ProfessorModeDisplayMode.PROBLEM,
    ProfessorModeDisplayMode.RESULTS
  ],
  [ProfessorModeDisplayMode.RESULTS]: [
    ProfessorModeDisplayMode.REVIEW,
    ProfessorModeDisplayMode.PROBLEM
  ],
  [ProfessorModeDisplayMode.REVIEW]: [
    ProfessorModeDisplayMode.RESULTS
  ]
};

/**
 * Crea un estado inicial para el Modo Profesor
 */
export function createInitialState(settings: ProfessorModeSettings): ProfessorModeState {
  return {
    displayMode: ProfessorModeDisplayMode.PROBLEM,
    problems: [],
    studentAnswers: [],
    currentProblemIndex: 0,
    settings,
    totalTime: 0
  };
}

/**
 * Verifica si un estado del Modo Profesor es válido
 */
export function isValidState(state: ProfessorModeState): boolean {
  // Verificaciones comunes
  if (!state.settings) return false;
  
  // Verificaciones específicas según el modo
  switch (state.displayMode) {
    case ProfessorModeDisplayMode.PROBLEM:
      return isProblemModeValid(state);
    
    case ProfessorModeDisplayMode.EXPLANATION:
      return isExplanationModeValid(state);
    
    case ProfessorModeDisplayMode.RESULTS:
      return isResultsModeValid(state);
    
    case ProfessorModeDisplayMode.REVIEW:
      return isReviewModeValid(state);
    
    default:
      return false;
  }
}

/**
 * Verifica si se puede transicionar a un modo específico
 */
export function canTransitionTo(
  currentState: ProfessorModeState,
  targetMode: string
): boolean {
  // Verificar si la transición está permitida por la matriz de transiciones
  const isAllowed = ALLOWED_TRANSITIONS[currentState.displayMode]
    .includes(targetMode as ProfessorModeDisplayMode);
  
  if (!isAllowed) return false;
  
  // Verificaciones adicionales según el modo destino
  switch (targetMode) {
    case ProfessorModeDisplayMode.RESULTS:
      // Solo se puede ir a resultados si se han contestado todos los problemas
      return currentState.problems.length > 0 && 
             currentState.studentAnswers.length >= currentState.problems.length;
    
    case ProfessorModeDisplayMode.REVIEW:
      // Solo se puede revisar después de ver los resultados
      return currentState.displayMode === ProfessorModeDisplayMode.RESULTS &&
             currentState.problems.length > 0 && 
             currentState.studentAnswers.length >= currentState.problems.length;
    
    default:
      return true;
  }
}

/**
 * Valida un estado en modo problema
 */
function isProblemModeValid(state: ProfessorModeState): boolean {
  // Debe haber al menos un problema si hay respuestas
  if (state.studentAnswers.length > 0 && state.problems.length === 0) {
    return false;
  }
  
  // El índice del problema actual debe estar en rango
  if (state.problems.length > 0 && 
      (state.currentProblemIndex < 0 || state.currentProblemIndex >= state.problems.length)) {
    return false;
  }
  
  return true;
}

/**
 * Valida un estado en modo explicación
 */
function isExplanationModeValid(state: ProfessorModeState): boolean {
  // Debe haber al menos un problema y una respuesta
  if (state.problems.length === 0 || state.studentAnswers.length === 0) {
    return false;
  }
  
  // El índice del problema actual debe estar en rango
  if (state.currentProblemIndex < 0 || state.currentProblemIndex >= state.problems.length) {
    return false;
  }
  
  // Debe existir una respuesta para el problema actual
  const currentProblemId = state.problems[state.currentProblemIndex].id;
  const hasAnswer = state.studentAnswers.some(answer => answer.problemId === currentProblemId);
  
  return hasAnswer;
}

/**
 * Valida un estado en modo resultados
 */
function isResultsModeValid(state: ProfessorModeState): boolean {
  // Debe haber al menos un problema
  if (state.problems.length === 0) {
    return false;
  }
  
  // Debe haber una respuesta para cada problema
  if (state.studentAnswers.length < state.problems.length) {
    return false;
  }
  
  // Cada problema debe tener una respuesta
  const answeredProblemIds = new Set(state.studentAnswers.map(a => a.problemId));
  const allProblemsAnswered = state.problems.every(p => answeredProblemIds.has(p.id));
  
  return allProblemsAnswered;
}

/**
 * Valida un estado en modo revisión
 */
function isReviewModeValid(state: ProfessorModeState): boolean {
  // Debe haber al menos un problema
  if (state.problems.length === 0) {
    return false;
  }
  
  // Debe haber una respuesta para cada problema
  if (state.studentAnswers.length < state.problems.length) {
    return false;
  }
  
  // El índice del problema actual debe estar en rango
  if (state.currentProblemIndex < 0 || state.currentProblemIndex >= state.problems.length) {
    return false;
  }
  
  return true;
}

/**
 * Calcula las estadísticas de una sesión basado en el estado
 */
export function calculateSessionStats(state: ProfessorModeState): { 
  correctCount: number; 
  incorrectCount: number; 
  averageTime: number;
} {
  const correctCount = state.studentAnswers.filter(answer => answer.isCorrect).length;
  const incorrectCount = state.studentAnswers.length - correctCount;
  
  // Calcular tiempo promedio (asumiendo que cada respuesta tiene timestamp)
  let averageTime = 0;
  if (state.studentAnswers.length > 0) {
    const totalAnswerTime = state.totalTime;
    averageTime = totalAnswerTime / state.studentAnswers.length;
  }
  
  return {
    correctCount,
    incorrectCount,
    averageTime
  };
}