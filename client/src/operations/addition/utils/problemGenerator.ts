// problemGenerator.ts - Funciones para generar problemas de suma
import { Problem, DifficultyLevel } from '../types';

/**
 * Genera un número aleatorio en un rango determinado
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Devuelve los rangos de números para cada nivel de dificultad
 */
export function getOperandRanges(difficulty: DifficultyLevel): { min: number; max: number } {
  switch (difficulty) {
    case 'beginner':
      return { min: 1, max: 10 }; // Números del 1 al 10
    case 'elementary':
      return { min: 10, max: 50 }; // Números del 10 al 50
    case 'intermediate':
      return { min: 50, max: 100 }; // Números del 50 al 100
    case 'advanced':
      return { min: 100, max: 500 }; // Números del 100 al 500
    case 'expert':
      return { min: 500, max: 1000 }; // Números del 500 al 1000
    default:
      return { min: 1, max: 20 };
  }
}

/**
 * Determina el número máximo de dígitos permitidos para la respuesta según la dificultad
 */
export function getAnswerMaxDigits(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'beginner':
      return 2; // Máximo 2 dígitos (hasta 99)
    case 'elementary':
      return 2; // Máximo 2 dígitos 
    case 'intermediate':
      return 3; // Máximo 3 dígitos (hasta 999)
    case 'advanced':
    case 'expert':
      return 4; // Máximo 4 dígitos (hasta 9999)
    default:
      return 3;
  }
}

/**
 * Genera un nuevo problema de suma según el nivel de dificultad
 */
export function generateAdditionProblem(difficulty: DifficultyLevel): Problem {
  const { min, max } = getOperandRanges(difficulty);
  const operand1 = getRandomNumber(min, max);
  const operand2 = getRandomNumber(min, max);
  const correctAnswer = operand1 + operand2;
  const answerMaxDigits = getAnswerMaxDigits(difficulty);
  
  return {
    id: `prob-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    operands: [operand1, operand2],
    correctAnswer: correctAnswer.toString(),
    answerMaxDigits,
    answerDecimalPosition: 0, // Para suma básica no hay decimales
    operacion: '+',
    tipo: 'suma'
  };
}

/**
 * Genera un conjunto de problemas de suma para un ejercicio
 */
export function generateProblems(difficulty: DifficultyLevel, count: number): Problem[] {
  const problems: Problem[] = [];
  
  for (let i = 0; i < count; i++) {
    problems.push(generateAdditionProblem(difficulty));
  }
  
  return problems;
}