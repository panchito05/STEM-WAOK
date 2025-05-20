// problemGenerator.ts - Utilidades para generar problemas de suma
import { Problem, DifficultyLevel } from '../types';

/**
 * Genera un conjunto de problemas de suma basado en la dificultad
 * @param difficulty - Nivel de dificultad
 * @param count - Número de problemas a generar
 * @returns Array de problemas generados
 */
export function generateProblemsSet(
  difficulty: DifficultyLevel,
  count: number
): Problem[] {
  // Generar el conjunto de problemas
  const problems: Problem[] = [];
  
  for (let i = 0; i < count; i++) {
    problems.push(generateProblem(difficulty));
  }
  
  return problems;
}

/**
 * Genera un único problema de suma basado en la dificultad
 * @param difficulty - Nivel de dificultad
 * @returns Problema generado
 */
function generateProblem(difficulty: DifficultyLevel): Problem {
  // Configurar rangos según dificultad
  const ranges = {
    beginner: { min: 1, max: 10 },
    elementary: { min: 5, max: 20 },
    intermediate: { min: 10, max: 50 },
    advanced: { min: 20, max: 100 },
    expert: { min: 50, max: 999 }
  };
  
  const range = ranges[difficulty];
  
  // Generar operandos aleatorios dentro del rango
  const operand1 = getRandomInt(range.min, range.max);
  const operand2 = getRandomInt(range.min, range.max);
  
  // Calcular resultado
  const result = operand1 + operand2;
  
  return {
    id: generateId(),
    operands: [operand1, operand2],
    result: result,
    difficulty
  };
}

/**
 * Genera un número entero aleatorio entre min y max (inclusive)
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Genera un ID único para un problema
 */
function generateId(): string {
  return `addition_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}