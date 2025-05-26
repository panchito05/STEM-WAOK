// utils.ts - División
import { DivisionProblem, DifficultyLevel, DivisionDisplayFormat, Problem, Operand } from "./types";

// --- Constants ---
const MAX_DIFFICULTY = 5;
const DECIMAL_PRECISION = 2;
const EPSILON = 1 / (10 ** (DECIMAL_PRECISION + 1));
const SAME_RANGE_DIVISOR_PROBABILITY = 0.6;

const DISPLAY_FORMATS: DivisionDisplayFormat[] = ['slash', 'obelus', 'long'];

// --- Utility Functions ---
const getRandomInt = (minNum: number, maxNum: number): number => {
    minNum = Math.ceil(minNum); 
    maxNum = Math.floor(maxNum);
    if (maxNum < minNum) [minNum, maxNum] = [maxNum, minNum];
    return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
}

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Convierte un problema de tipo DivisionProblem al tipo genérico Problem
 */
export function divisionProblemToProblem(problem: DivisionProblem, difficulty: DifficultyLevel = 'beginner'): Problem {
  const operands: Operand[] = [
    { value: problem.num1 }, // Dividendo
    { value: problem.num2 }  // Divisor
  ];
  
  return {
    id: problem.id,
    operands,
    operator: problem.operator,
    displayFormat: problem.displayFormat,
    correctAnswer: problem.correctAnswer,
    difficulty,
    allowDecimals: !Number.isInteger(problem.correctAnswer),
    maxAttempts: 3
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico DivisionProblem
 */
export function problemToDivisionProblem(problem: Problem): DivisionProblem {
  const operands = problem.operands.map(op => op.value);
  
  return {
    id: problem.id,
    num1: operands[0] || 0, // Dividendo
    num2: operands[1] || 1, // Divisor (evitar división por cero)
    operator: problem.operator || '\u00F7',
    correctAnswer: problem.correctAnswer,
    displayFormat: problem.displayFormat as DivisionDisplayFormat
  };
}

// --- Generación del Problema ---
export function generateDivisionProblem(difficulty: DifficultyLevel): DivisionProblem {
    const validDifficulty = Math.max(1, Math.min(MAX_DIFFICULTY, getDifficultyNumber(difficulty)));
    const id = generateUniqueId();
    let num1: number, num2: number, correctAnswer: number;
    const operator = '\u00F7';

    if (validDifficulty < 4) { // División exacta
        let minDivisor: number, maxDivisor: number, minQuotient: number, maxQuotient: number;
        switch (validDifficulty) {
            case 1: minDivisor = 1; maxDivisor = 5; minQuotient = 1; maxQuotient = 9; break;
            case 2: minDivisor = 2; maxDivisor = 10; minQuotient = 2; maxQuotient = 12; break;
            case 3: minDivisor = 2; maxDivisor = 20; minQuotient = 5; maxQuotient = 25; break;
            default: minDivisor = 1; maxDivisor = 5; minQuotient = 1; maxQuotient = 9;
        }
        do { num2 = getRandomInt(minDivisor, maxDivisor); } while (num2 === 0);
        correctAnswer = getRandomInt(minQuotient, maxQuotient);
        num1 = num2 * correctAnswer;
    } else { // Potencialmente decimal
        let min1: number, max1: number, min2Main: number, max2Main: number, min2Lower: number, max2Lower: number;
        switch (validDifficulty) {
            case 4: min1=20; max1=500; min2Main=2; max2Main=25; min2Lower=2; max2Lower=10; break;
            case 5: min1=100; max1=2000; min2Main=5; max2Main=50; min2Lower=2; max2Lower=20; break;
            default: min1=20; max1=500; min2Main=2; max2Main=25; min2Lower=2; max2Lower=10;
        }
        num1 = getRandomInt(min1, max1);
        const useMainRangeDivisor = Math.random() < SAME_RANGE_DIVISOR_PROBABILITY;
        if (useMainRangeDivisor) do { num2 = getRandomInt(min2Main, max2Main); } while (num2 === 0);
        else do { num2 = getRandomInt(min2Lower, max2Lower); } while (num2 === 0);
        const rawAnswer = num1 / num2;
        correctAnswer = Math.round(rawAnswer * (10**DECIMAL_PRECISION)) / (10**DECIMAL_PRECISION);
        if (Number.isInteger(correctAnswer) && validDifficulty >= 4) {
             const adjustment = Math.random() < 0.5 ? 1 : -1;
             num1 = Math.max(1, num1 + adjustment);
             const newRawAnswer = num1 / num2;
             correctAnswer = Math.round(newRawAnswer * (10**DECIMAL_PRECISION)) / (10**DECIMAL_PRECISION);
        }
    }

    // Elegir formato de visualización aleatorio
    const displayFormat = DISPLAY_FORMATS[Math.floor(Math.random() * DISPLAY_FORMATS.length)];

    return { 
        id, 
        num1, 
        num2, 
        operator, 
        correctAnswer,
        displayFormat
    };
}

// --- Validación de la Respuesta ---
export function checkAnswer(problem: DivisionProblem, userAnswer: number): boolean {
  if (userAnswer === null || isNaN(userAnswer)) return false;
  return Math.abs(userAnswer - problem.correctAnswer) < EPSILON;
}

// Helper function to convert difficulty level to number
function getDifficultyNumber(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'beginner': return 1;
    case 'elementary': return 2;
    case 'intermediate': return 3;
    case 'advanced': return 4;
    case 'expert': return 5;
    default: return 1;
  }
}

// Helper function to choose random display format
export function chooseRandomFormat(): DivisionDisplayFormat {
  return DISPLAY_FORMATS[Math.floor(Math.random() * DISPLAY_FORMATS.length)];
}