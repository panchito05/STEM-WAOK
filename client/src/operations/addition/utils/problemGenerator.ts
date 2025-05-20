// problemGenerator.ts - Utilidad para generar problemas de suma
import { DifficultyLevel, Problem } from '../types';

/**
 * Genera un número aleatorio entre min y max (inclusive)
 */
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Obtiene los rangos de números según el nivel de dificultad
 */
function getNumberRangeForDifficulty(difficulty: DifficultyLevel): { min: number, max: number } {
  switch (difficulty) {
    case 'beginner':
      return { min: 1, max: 9 }; // Sumas simples de un dígito (1-9)
    case 'elementary':
      return { min: 10, max: 50 }; // Números entre 10-50
    case 'intermediate':
      return { min: 50, max: 99 }; // Números hasta 99
    case 'advanced':
      return { min: 100, max: 999 }; // Números de tres dígitos
    case 'expert':
      return { min: 1000, max: 9999 }; // Números de cuatro dígitos
    default:
      return { min: 1, max: 20 };
  }
}

/**
 * Determina si la suma tendrá reagrupación (llevadas)
 */
function shouldHaveRegrouping(difficulty: DifficultyLevel): boolean {
  switch (difficulty) {
    case 'beginner':
      return false; // Sin reagrupación en nivel principiante
    case 'elementary':
      return Math.random() < 0.3; // 30% de probabilidad
    case 'intermediate':
      return Math.random() < 0.6; // 60% de probabilidad
    case 'advanced':
    case 'expert':
      return Math.random() < 0.8; // 80% de probabilidad
    default:
      return false;
  }
}

/**
 * Genera un problema de suma basado en la dificultad
 */
export function generateAdditionProblem(difficulty: DifficultyLevel, id: number): Problem {
  const { min, max } = getNumberRangeForDifficulty(difficulty);
  const hasRegrouping = shouldHaveRegrouping(difficulty);
  
  let firstNumber: number;
  let secondNumber: number;
  
  if (hasRegrouping) {
    // Generar números que requieran reagrupación (al menos en una columna)
    const digitCount = difficulty === 'advanced' ? 3 : (difficulty === 'expert' ? 4 : 2);
    
    do {
      firstNumber = getRandomNumber(min, max);
      secondNumber = getRandomNumber(min, max);
      
      // Verificar si hay reagrupación en alguna columna
    } while (!hasAtLeastOneRegrouping(firstNumber, secondNumber, digitCount));
  } else {
    // Generar números que no requieran reagrupación
    do {
      firstNumber = getRandomNumber(min, max);
      secondNumber = getRandomNumber(min, max);
      
      // Verificar que no hay reagrupación en ninguna columna
    } while (hasAnyRegrouping(firstNumber, secondNumber));
  }
  
  const result = firstNumber + secondNumber;
  
  // Generar explicación según la dificultad
  const explanation = generateExplanation(firstNumber, secondNumber, result, hasRegrouping, difficulty);
  
  return {
    id,
    operands: [firstNumber, secondNumber],
    result,
    explanation,
    difficultyLevel: difficulty,
    hasRegrouping,
    problemType: 'addition'
  };
}

/**
 * Verifica si hay al menos una reagrupación en la suma
 */
function hasAtLeastOneRegrouping(a: number, b: number, digitCount: number): boolean {
  let hasRegrouping = false;
  let carry = 0;
  
  // Verificar dígito por dígito si hay reagrupación
  for (let i = 0; i < digitCount; i++) {
    const digitA = Math.floor(a / Math.pow(10, i)) % 10;
    const digitB = Math.floor(b / Math.pow(10, i)) % 10;
    
    if (digitA + digitB + carry >= 10) {
      hasRegrouping = true;
      break;
    }
    
    carry = Math.floor((digitA + digitB + carry) / 10);
  }
  
  return hasRegrouping;
}

/**
 * Verifica si hay alguna reagrupación en la suma
 */
function hasAnyRegrouping(a: number, b: number): boolean {
  let carry = 0;
  let tempA = a;
  let tempB = b;
  
  while (tempA > 0 || tempB > 0) {
    const digitA = tempA % 10;
    const digitB = tempB % 10;
    
    if (digitA + digitB + carry >= 10) {
      return true;
    }
    
    carry = Math.floor((digitA + digitB + carry) / 10);
    tempA = Math.floor(tempA / 10);
    tempB = Math.floor(tempB / 10);
  }
  
  return false;
}

/**
 * Genera una explicación del problema
 */
function generateExplanation(a: number, b: number, result: number, hasRegrouping: boolean, difficulty: DifficultyLevel): string {
  let explanation = '';
  
  if (hasRegrouping) {
    if (difficulty === 'elementary' || difficulty === 'intermediate') {
      explanation = `Para sumar ${a} + ${b}, sumamos dígito por dígito de derecha a izquierda. En algunas columnas, la suma es mayor o igual a 10, por lo que llevamos 1 a la siguiente columna. El resultado es ${result}.`;
    } else if (difficulty === 'advanced' || difficulty === 'expert') {
      explanation = `Para sumar ${a} + ${b}, sumamos cada columna empezando por la derecha. Cuando la suma en una columna es mayor o igual a 10, llevamos 1 a la columna siguiente. El resultado final es ${result}.`;
    }
  } else {
    if (difficulty === 'beginner') {
      explanation = `Para sumar ${a} + ${b}, contamos ${a} y luego ${b} más para llegar a ${result}.`;
    } else {
      explanation = `Para sumar ${a} + ${b}, sumamos dígito por dígito. El resultado es ${result}.`;
    }
  }
  
  return explanation;
}

/**
 * Genera un conjunto de problemas para un ejercicio
 */
export function generateProblemsSet(difficulty: DifficultyLevel, count: number): Problem[] {
  const problems: Problem[] = [];
  
  for (let i = 0; i < count; i++) {
    problems.push(generateAdditionProblem(difficulty, i + 1));
  }
  
  return problems;
}