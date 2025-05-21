/**
 * Tipos del dominio para problemas de suma
 * Define la estructura central de los problemas y sus estados
 */

/**
 * Tipo discriminado para los estados posibles de un problema
 */
export type ProblemStatus = 
  | { type: 'pending' }
  | { type: 'answered', answer: number, isCorrect: boolean, attempts: number }
  | { type: 'skipped' }
  | { type: 'revealed' };

/**
 * Tipo discriminado para las razones de compensación
 */
export type CompensationReason = 
  | { type: 'incorrect_answer' }
  | { type: 'skipped' }
  | { type: 'revealed' };

/**
 * Niveles de dificultad para problemas de suma
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  EASY = 'easy',
  MEDIUM = 'medium', 
  HARD = 'hard',
  EXPERT = 'expert'
}

/**
 * Opciones de formato para visualización de problemas
 */
export enum DisplayFormat {
  STANDARD = 'standard', // Formato normal: 1 + 2 = ?
  HORIZONTAL = 'horizontal', // Formato horizontal: 1 + 2 = ?
  VERTICAL = 'vertical' // Formato vertical (columnas)
}

/**
 * Problema básico de adición con tipo inmutable
 */
export interface ImmutableAdditionProblem {
  readonly id: string;
  readonly operands: readonly number[];
  readonly correctAnswer: number;
  readonly difficulty: DifficultyLevel;
  readonly displayFormat: DisplayFormat;
  readonly maxAttempts: number;
  readonly allowDecimals: boolean;
}

/**
 * Problema de adición con información de compensación
 */
export interface AdditionProblem extends ImmutableAdditionProblem {
  readonly isCompensation?: boolean;
  readonly compensationReason?: 'incorrect_answer' | 'skipped' | 'revealed';
}

/**
 * Respuesta a un problema de adición
 */
export interface AdditionAnswer {
  readonly problemId: string;
  readonly problem: AdditionProblem;
  readonly status: ProblemStatus;
  readonly explanationDrawing?: string;
  readonly timestamp: number;
}