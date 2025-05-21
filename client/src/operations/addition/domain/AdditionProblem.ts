/**
 * Definición de tipos para problemas de suma
 */

/**
 * Niveles de dificultad para los problemas
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

/**
 * Formatos de visualización para los problemas
 */
export enum DisplayFormat {
  STANDARD = 'standard',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  WORD_PROBLEM = 'word_problem'
}

/**
 * Estados de problemas
 */
export enum ProblemStatus {
  PENDING = 'pending',
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  SKIPPED = 'skipped',
  REVEALED = 'revealed',
  TIMED_OUT = 'timed_out'
}

/**
 * Interfaz para problemas de suma
 * - Inmutable para evitar modificaciones accidentales
 */
export interface AdditionProblem {
  readonly id: string;
  readonly operands: ReadonlyArray<number>;
  readonly correctAnswer: number;
  readonly difficulty: DifficultyLevel; 
  readonly displayFormat: DisplayFormat;
  readonly maxAttempts: number;
  readonly allowDecimals: boolean;
  readonly isCompensation?: boolean;
  readonly compensationReason?: string;
  readonly parentProblemId?: string;
}

/**
 * Función para validar un problema de suma
 */
export function isValidAdditionProblem(problem: any): problem is AdditionProblem {
  return (
    problem &&
    typeof problem.id === 'string' &&
    Array.isArray(problem.operands) &&
    problem.operands.length >= 2 &&
    problem.operands.every((op: any) => typeof op === 'number') &&
    typeof problem.correctAnswer === 'number' &&
    Object.values(DifficultyLevel).includes(problem.difficulty) &&
    Object.values(DisplayFormat).includes(problem.displayFormat) &&
    typeof problem.maxAttempts === 'number' &&
    typeof problem.allowDecimals === 'boolean'
  );
}

/**
 * Función para convertir un problema a formato inmutable
 */
export function toImmutableProblem(problem: AdditionProblem): AdditionProblem {
  return {
    ...problem,
    operands: [...problem.operands] // Crear copia de operandos
  };
}

/**
 * Función para crear un problema de adición básico
 * @param operands Operandos para la suma
 * @param id ID opcional para el problema
 */
export function createBasicAdditionProblem(
  operands: number[],
  id: string = `sum_${Date.now()}_${Math.floor(Math.random() * 1000)}`
): AdditionProblem {
  // Calcular la respuesta correcta
  const correctAnswer = operands.reduce((sum, operand) => sum + operand, 0);
  
  return {
    id,
    operands,
    correctAnswer,
    difficulty: DifficultyLevel.EASY,
    displayFormat: DisplayFormat.STANDARD,
    maxAttempts: 1,
    allowDecimals: false
  };
}

/**
 * Función para crear un problema de compensación
 */
export function createCompensationProblem(
  originalProblem: AdditionProblem,
  reason: string
): AdditionProblem {
  const compensationId = `comp_${originalProblem.id}_${Date.now()}`;
  
  return {
    ...toImmutableProblem(originalProblem), // Mantener características del original
    id: compensationId,
    isCompensation: true,
    compensationReason: reason,
    parentProblemId: originalProblem.id
  };
}