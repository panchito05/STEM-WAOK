import { AdditionAnswer, AdditionProblem } from './AdditionProblem';
import { ProfessorModeSettings, StandardModeSettings } from './AdditionSettings';

/**
 * Resultado base de un ejercicio de suma
 */
export interface AdditionExerciseResult {
  readonly module: string;
  readonly operationId: string;
  readonly score: number;
  readonly totalProblems: number;
  readonly timeSpent: number;
  readonly timestamp: number;
  readonly date: string;
}

/**
 * Resultado específico del modo profesor
 */
export interface ProfessorModeResult extends AdditionExerciseResult {
  readonly settings: ProfessorModeSettings;
  readonly difficulty: string;
  readonly problemDetails: readonly AdditionAnswer[];
  readonly extra_data: {
    readonly mode: 'professor';
    readonly version: string;
    readonly problems: readonly AdditionAnswer[];
  };
}

/**
 * Resultado específico del modo estándar
 */
export interface StandardModeResult extends AdditionExerciseResult {
  readonly settings: StandardModeSettings;
  readonly difficulty: string;
  readonly averageTimePerProblem: number;
  readonly problemDetails: readonly AdditionAnswer[];
  readonly extra_data: {
    readonly mode: 'standard';
    readonly version: string;
    readonly problems: readonly AdditionAnswer[];
    readonly consecutiveCorrect: number;
  };
}

/**
 * Estadísticas de rendimiento
 */
export interface PerformanceStats {
  readonly totalProblems: number;
  readonly correctProblems: number;
  readonly incorrectProblems: number;
  readonly skippedProblems: number;
  readonly revealedProblems: number;
  readonly compensationProblems: number;
  readonly averageTimePerProblem: number;
  readonly accuracy: number;
  readonly totalTime: number;
}