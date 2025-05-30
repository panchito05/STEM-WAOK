/**
 * Sistema de validación para el módulo de suma
 * 
 * Este middleware se encarga de validar todos los datos de entrada
 * y garantizar que sean correctos antes de ser procesados.
 */
import { AssociativePropertyProblem, DifficultyLevel, Problem, UserAnswer } from '../types';

// Constantes para validación
const MAX_SAFE_VALUE = 9999999; // Valor máximo que se puede manejar con seguridad
const MIN_SAFE_VALUE = -9999999; // Valor mínimo que se puede manejar con seguridad
const MAX_OPERANDS = 10; // Número máximo de operandos permitidos
const VALID_LAYOUTS = ['horizontal', 'vertical'] as const;
const VALID_DIFFICULTIES: DifficultyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];

// Tipos para los resultados de validación
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Valida un número para asegurarse de que esté dentro de los límites seguros
 */
export function validateNumber(value: number, fieldName: string = 'value'): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      code: 'INVALID_TYPE',
      message: `El valor debe ser un número`,
      field: fieldName,
      value
    });
    return errors;
  }
  
  if (value > MAX_SAFE_VALUE) {
    errors.push({
      code: 'VALUE_TOO_LARGE',
      message: `El valor ${value} es demasiado grande (máximo: ${MAX_SAFE_VALUE})`,
      field: fieldName,
      value
    });
  }
  
  if (value < MIN_SAFE_VALUE) {
    errors.push({
      code: 'VALUE_TOO_SMALL',
      message: `El valor ${value} es demasiado pequeño (mínimo: ${MIN_SAFE_VALUE})`,
      field: fieldName,
      value
    });
  }
  
  return errors;
}

/**
 * Valida un nivel de dificultad
 */
export function validateDifficulty(difficulty: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!VALID_DIFFICULTIES.includes(difficulty as DifficultyLevel)) {
    errors.push({
      code: 'INVALID_DIFFICULTY',
      message: `El nivel de dificultad '${difficulty}' no es válido. Valores permitidos: ${VALID_DIFFICULTIES.join(', ')}`,
      field: 'difficulty',
      value: difficulty
    });
  }
  
  return errors;
}

/**
 * Valida un layout (formato de visualización)
 */
export function validateLayout(layout: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!VALID_LAYOUTS.includes(layout as any)) {
    errors.push({
      code: 'INVALID_LAYOUT',
      message: `El layout '${layout}' no es válido. Valores permitidos: ${VALID_LAYOUTS.join(', ')}`,
      field: 'layout',
      value: layout
    });
  }
  
  return errors;
}

/**
 * Valida un problema de suma completo
 */
export function validateAssociativePropertyProblem(problem: AssociativePropertyProblem): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar ID
  if (!problem.id || typeof problem.id !== 'string' || problem.id.trim() === '') {
    errors.push({
      code: 'INVALID_ID',
      message: 'El ID del problema es requerido y debe ser una cadena no vacía',
      field: 'id',
      value: problem.id
    });
  }
  
  // Validar operandos
  if (!Array.isArray(problem.operands) || problem.operands.length < 2) {
    errors.push({
      code: 'INVALID_OPERANDS',
      message: 'Se requieren al menos 2 operandos',
      field: 'operands',
      value: problem.operands
    });
  } else if (problem.operands.length > MAX_OPERANDS) {
    errors.push({
      code: 'TOO_MANY_OPERANDS',
      message: `Demasiados operandos (máximo: ${MAX_OPERANDS})`,
      field: 'operands',
      value: problem.operands.length
    });
  } else {
    // Validar cada operando
    problem.operands.forEach((operand, index) => {
      const operandErrors = validateNumber(operand, `operands[${index}]`);
      errors.push(...operandErrors);
    });
  }
  
  // Validar respuesta correcta
  errors.push(...validateNumber(problem.correctAnswer, 'correctAnswer'));
  
  // Validar layout
  errors.push(...validateLayout(problem.layout));
  
  // Validar answerMaxDigits
  if (typeof problem.answerMaxDigits !== 'number' || problem.answerMaxDigits <= 0) {
    errors.push({
      code: 'INVALID_MAX_DIGITS',
      message: 'El número máximo de dígitos debe ser un número positivo',
      field: 'answerMaxDigits',
      value: problem.answerMaxDigits
    });
  }
  
  // Validar answerDecimalPosition (si está presente)
  if (problem.answerDecimalPosition !== undefined) {
    if (typeof problem.answerDecimalPosition !== 'number' || problem.answerDecimalPosition < 0) {
      errors.push({
        code: 'INVALID_DECIMAL_POSITION',
        message: 'La posición decimal debe ser un número no negativo',
        field: 'answerDecimalPosition',
        value: problem.answerDecimalPosition
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un problema genérico
 */
export function validateProblem(problem: Problem): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar ID
  if (!problem.id || typeof problem.id !== 'string' || problem.id.trim() === '') {
    errors.push({
      code: 'INVALID_ID',
      message: 'El ID del problema es requerido y debe ser una cadena no vacía',
      field: 'id',
      value: problem.id
    });
  }
  
  // Validar operandos
  if (!Array.isArray(problem.operands) || problem.operands.length < 2) {
    errors.push({
      code: 'INVALID_OPERANDS',
      message: 'Se requieren al menos 2 operandos',
      field: 'operands',
      value: problem.operands
    });
  } else if (problem.operands.length > MAX_OPERANDS) {
    errors.push({
      code: 'TOO_MANY_OPERANDS',
      message: `Demasiados operandos (máximo: ${MAX_OPERANDS})`,
      field: 'operands',
      value: problem.operands.length
    });
  } else {
    // Validar cada operando
    problem.operands.forEach((operand, index) => {
      const operandErrors = validateNumber(operand.value, `operands[${index}].value`);
      errors.push(...operandErrors);
    });
  }
  
  // Validar respuesta correcta
  errors.push(...validateNumber(problem.correctAnswer, 'correctAnswer'));
  
  // Validar dificultad
  errors.push(...validateDifficulty(problem.difficulty));
  
  // Validar maxAttempts
  if (typeof problem.maxAttempts !== 'number' || problem.maxAttempts <= 0) {
    errors.push({
      code: 'INVALID_MAX_ATTEMPTS',
      message: 'El número máximo de intentos debe ser un número positivo',
      field: 'maxAttempts',
      value: problem.maxAttempts
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida una respuesta de usuario
 */
export function validateUserAnswer(answer: UserAnswer): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar problemId
  if (!answer.problemId || typeof answer.problemId !== 'string' || answer.problemId.trim() === '') {
    errors.push({
      code: 'INVALID_PROBLEM_ID',
      message: 'El ID del problema es requerido y debe ser una cadena no vacía',
      field: 'problemId',
      value: answer.problemId
    });
  }
  
  // Validar problema
  const problemValidation = validateProblem(answer.problem);
  if (!problemValidation.isValid) {
    errors.push({
      code: 'INVALID_PROBLEM',
      message: 'El problema contiene errores de validación',
      field: 'problem',
      value: problemValidation.errors
    });
  }
  
  // Validar userAnswer
  errors.push(...validateNumber(answer.userAnswer, 'userAnswer'));
  
  // Validar isCorrect
  if (typeof answer.isCorrect !== 'boolean') {
    errors.push({
      code: 'INVALID_IS_CORRECT',
      message: 'El campo isCorrect debe ser un booleano',
      field: 'isCorrect',
      value: answer.isCorrect
    });
  }
  
  // Validar status
  if (typeof answer.status !== 'string' || answer.status.trim() === '') {
    errors.push({
      code: 'INVALID_STATUS',
      message: 'El estado es requerido y debe ser una cadena no vacía',
      field: 'status',
      value: answer.status
    });
  }
  
  // Validar attempts
  if (typeof answer.attempts !== 'number' || answer.attempts < 0) {
    errors.push({
      code: 'INVALID_ATTEMPTS',
      message: 'El número de intentos debe ser un número no negativo',
      field: 'attempts',
      value: answer.attempts
    });
  }
  
  // Validar timestamp
  if (typeof answer.timestamp !== 'number' || answer.timestamp <= 0) {
    errors.push({
      code: 'INVALID_TIMESTAMP',
      message: 'El timestamp debe ser un número positivo',
      field: 'timestamp',
      value: answer.timestamp
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}