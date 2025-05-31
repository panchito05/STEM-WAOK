import { AssociativePropertyProblem, DifficultyLevel } from '../types';

// Resultado de validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validador para respuestas numéricas del usuario
export function validateUserAnswer(input: string | number): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Convertir a string para validación
  const inputStr = String(input).trim();

  // Verificar entrada vacía
  if (!inputStr) {
    result.isValid = false;
    result.errors.push('La respuesta no puede estar vacía');
    return result;
  }

  // Verificar que sea un número válido
  const numericValue = parseFloat(inputStr);
  if (isNaN(numericValue)) {
    result.isValid = false;
    result.errors.push('La respuesta debe ser un número válido');
    return result;
  }

  // Verificar límites razonables
  if (numericValue < -999999 || numericValue > 999999) {
    result.isValid = false;
    result.errors.push('La respuesta debe estar entre -999,999 y 999,999');
    return result;
  }

  // Verificar precisión decimal excesiva
  const decimalPlaces = (inputStr.split('.')[1] || '').length;
  if (decimalPlaces > 6) {
    result.warnings.push('Se recomienda usar máximo 6 decimales');
  }

  // Verificar caracteres extraños
  if (!/^-?\d*\.?\d*$/.test(inputStr)) {
    result.isValid = false;
    result.errors.push('La respuesta contiene caracteres no válidos');
    return result;
  }

  return result;
}

// Validador para problemas de propiedad asociativa
export function validateAssociativePropertyProblem(problem: AssociativePropertyProblem): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validar ID del problema
  if (!problem.id || typeof problem.id !== 'string') {
    result.isValid = false;
    result.errors.push('El problema debe tener un ID válido');
  }

  // Validar operandos
  if (!Array.isArray(problem.operands)) {
    result.isValid = false;
    result.errors.push('Los operandos deben ser un array');
  } else {
    if (problem.operands.length < 3) {
      result.isValid = false;
      result.errors.push('La propiedad asociativa requiere al menos 3 operandos');
    }

    // Validar cada operando
    problem.operands.forEach((operand, index) => {
      if (typeof operand !== 'number' || isNaN(operand)) {
        result.isValid = false;
        result.errors.push(`El operando ${index + 1} no es un número válido`);
      }
    });
  }

  // Validar respuesta correcta
  if (typeof problem.correctAnswer !== 'number' || isNaN(problem.correctAnswer)) {
    result.isValid = false;
    result.errors.push('La respuesta correcta debe ser un número válido');
  } else {
    // Verificar que la respuesta correcta sea la suma de los operandos
    const expectedSum = problem.operands.reduce((sum, operand) => sum + operand, 0);
    if (Math.abs(problem.correctAnswer - expectedSum) > 0.001) {
      result.isValid = false;
      result.errors.push(`La respuesta correcta (${problem.correctAnswer}) no coincide con la suma de operandos (${expectedSum})`);
    }
  }

  // Validar dificultad
  const validDifficulties: DifficultyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
  if (!validDifficulties.includes(problem.difficulty)) {
    result.isValid = false;
    result.errors.push('Nivel de dificultad no válido');
  }

  // Validar máximo de intentos
  if (!Number.isInteger(problem.maxAttempts) || problem.maxAttempts < 1 || problem.maxAttempts > 10) {
    result.isValid = false;
    result.errors.push('El máximo de intentos debe ser un entero entre 1 y 10');
  }

  // Validar layout
  if (!['horizontal', 'vertical'].includes(problem.layout)) {
    result.isValid = false;
    result.errors.push('El layout debe ser "horizontal" o "vertical"');
  }

  // Validar answerMaxDigits
  if (!Number.isInteger(problem.answerMaxDigits) || problem.answerMaxDigits < 1) {
    result.isValid = false;
    result.errors.push('answerMaxDigits debe ser un entero positivo');
  }

  return result;
}

// Validador para configuración del ejercicio
export function validateExerciseSettings(settings: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validar número de problemas
  if (!Number.isInteger(settings.problemCount) || settings.problemCount < 1 || settings.problemCount > 100) {
    result.isValid = false;
    result.errors.push('El número de problemas debe ser un entero entre 1 y 100');
  }

  // Validar tiempo límite
  if (settings.hasTimerEnabled) {
    if (!Number.isInteger(settings.timeValue) || settings.timeValue < 1 || settings.timeValue > 3600) {
      result.isValid = false;
      result.errors.push('El tiempo límite debe ser un entero entre 1 y 3600 segundos');
    }

    if (!['per-problem', 'exercise'].includes(settings.timeLimit)) {
      result.isValid = false;
      result.errors.push('El tipo de tiempo límite debe ser "per-problem" o "exercise"');
    }
  }

  // Validar máximo de intentos
  if (!Number.isInteger(settings.maxAttempts) || settings.maxAttempts < 1 || settings.maxAttempts > 10) {
    result.isValid = false;
    result.errors.push('El máximo de intentos debe ser un entero entre 1 y 10');
  }

  return result;
}

// Validador sanitizador para entrada de texto
export function sanitizeTextInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres potencialmente peligrosos
    .substring(0, 1000); // Limitar longitud
}