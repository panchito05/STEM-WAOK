// utils.ts
import { DivisionProblem, DifficultyLevel, ExerciseLayout, Problem, Operand } from "./types";

// --- Funciones auxiliares ---
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomBool = (probability: number = 0.5): boolean => Math.random() < probability;

function getRandomDecimal(min: number, max: number, maxDecimals: 0 | 1 | 2): number {
  if (maxDecimals === 0) {
    return getRandomInt(min, max);
  }
  const range = max - min;
  let value = Math.random() * range + min;
  const factor = Math.pow(10, maxDecimals);
  value = Math.round(value * factor) / factor;
  const fixedString = value.toFixed(maxDecimals); // Importante para mantener ceros finales para el conteo de dígitos
  return parseFloat(fixedString);
}

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Convierte un problema de tipo DivisionProblem al tipo genérico Problem
 * Este adaptador garantiza la compatibilidad entre los dos tipos
 */
export function divisionProblemToProblem(problem: DivisionProblem, difficulty: DifficultyLevel = 'beginner'): Problem {
  // Convertir operandos simples a tipo Operand
  const operands: Operand[] = problem.operands.map(value => ({ value }));
  
  return {
    id: problem.id,
    operands,
    operator: "÷",
    displayFormat: problem.layout, // El layout de DivisionProblem es el displayFormat de Problem
    correctAnswer: problem.correctAnswer,
    difficulty, // Usamos el parámetro de dificultad o el predeterminado
    allowDecimals: problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0,
    maxAttempts: 3 // Por defecto permitimos 3 intentos
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico DivisionProblem
 * Este adaptador se usa cuando necesitamos utilizar funciones que requieren DivisionProblem
 */
export function problemToDivisionProblem(problem: Problem): DivisionProblem {
  const operands = problem.operands.map(op => op.value);
  let answerDecimalPosition: number | undefined = undefined;
  
  if (problem.allowDecimals) {
    // Determinar el número de decimales a partir del cociente
    const quotient = operands[0] / operands[1];
    const strQuotient = quotient.toString();
    const dotIndex = strQuotient.indexOf('.');
    if (dotIndex >= 0) {
      answerDecimalPosition = Math.min(2, strQuotient.length - dotIndex - 1);
    }
  }
  
  return {
    id: problem.id,
    num1: operands[0] || 0, // dividendo
    num2: operands[1] || 1, // divisor
    operands,
    correctAnswer: problem.correctAnswer,
    remainder: operands[0] % operands[1], // resto de la división
    layout: problem.displayFormat as ExerciseLayout, // Solo horizontal o vertical, no 'word'
    answerMaxDigits: problem.correctAnswer.toString().replace('.', '').length,
    answerDecimalPosition
  };
}

// --- Generación del Problema ---
export function generateDivisionProblem(difficulty: DifficultyLevel): DivisionProblem {
  const id = generateUniqueId();
  let operands: number[] = [];
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;
  let dividend: number, divisor: number, quotient: number;

  switch (difficulty) {
    case "beginner": // Divisiones simples, ej: 8÷2, 9÷3 (divisiones exactas)
      divisor = getRandomInt(2, 9);
      quotient = getRandomInt(1, 9);
      dividend = divisor * quotient; // Asegurar división exacta
      operands = [dividend, divisor];
      layout = 'horizontal';
      break;
      
    case "elementary": // Divisiones de dos dígitos entre un dígito, ej: 24÷3, 48÷6
      divisor = getRandomInt(2, 9);
      quotient = getRandomInt(2, 12);
      dividend = divisor * quotient; // Asegurar división exacta
      operands = [dividend, divisor];
      layout = 'horizontal';
      break;
      
    case "intermediate": // Divisiones con posibles decimales, layout variable
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal'; // 75% vertical
      divisor = getRandomInt(2, 12);
      
      if (layout === 'vertical' && getRandomBool(0.4)) { // 40% de chance de resultado decimal
        problemMaxDecimals = 1;
        dividend = getRandomInt(10, 99);
        // No asegurar división exacta para permitir decimales
      } else { // Divisiones exactas
        quotient = getRandomInt(5, 20);
        dividend = divisor * quotient;
      }
      operands = [dividend, divisor];
      break;
      
    case "advanced": // Divisiones complejas con decimales
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1; // 60% chance de 2 decimales
      divisor = getRandomInt(5, 25);
      dividend = getRandomInt(50, 500);
      operands = [dividend, divisor];
      break;
      
    case "expert": // Divisiones muy complejas con decimales
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1; // 75% chance de 2 decimales
      divisor = getRandomInt(10, 50);
      dividend = getRandomInt(100, 1000);
      operands = [dividend, divisor];
      break;
      
    default: // Fallback a beginner si la dificultad no es reconocida
      divisor = getRandomInt(2, 5);
      quotient = getRandomInt(1, 5);
      dividend = divisor * quotient;
      operands = [dividend, divisor];
      layout = 'horizontal';
  }

  if (operands.length === 0) { // Salvaguarda final
    operands = [10, 2]; // 10 ÷ 2 = 5
  }

  const result = operands[0] / operands[1];
  const remainder = operands[0] % operands[1];

  let effectiveMaxDecimalsInAnswer = 0;
  if (problemMaxDecimals > 0) {
    effectiveMaxDecimalsInAnswer = problemMaxDecimals;
  } else {
    // Para divisiones, verificar si el resultado es decimal
    if (remainder === 0) {
      effectiveMaxDecimalsInAnswer = 0;
    } else {
      effectiveMaxDecimalsInAnswer = 1; // Por defecto 1 decimal si no es exacta
    }
  }
  
  const correctAnswer = parseFloat(result.toFixed(effectiveMaxDecimalsInAnswer));

  const correctAnswerStr = correctAnswer.toFixed(effectiveMaxDecimalsInAnswer);
  const [integerPartOfResultStr, decimalPartOfResultStr = ""] = correctAnswerStr.split('.');

  const answerMaxDigits = integerPartOfResultStr.length + decimalPartOfResultStr.length;

  let answerDecimalPosition: number | undefined = undefined;
  if (effectiveMaxDecimalsInAnswer > 0 && decimalPartOfResultStr.length > 0) {
    answerDecimalPosition = decimalPartOfResultStr.length;
  }

  return {
    id,
    num1: operands[0], // dividendo
    num2: operands[1], // divisor
    operands,
    correctAnswer,
    remainder,
    layout,
    answerMaxDigits,
    answerDecimalPosition,
  };
}

// --- Validación de la Respuesta ---
export function checkAnswer(problem: DivisionProblem, userAnswer: number): boolean {
  if (isNaN(userAnswer)) return false;

  const precisionForComparison = problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0
    ? problem.answerDecimalPosition
    : 0;

  const factor = Math.pow(10, precisionForComparison);
  const roundedCorrectAnswer = Math.round(problem.correctAnswer * factor) / factor;
  const roundedUserAnswer = Math.round(userAnswer * factor) / factor;

  return roundedUserAnswer === roundedCorrectAnswer;
}

// --- Funciones auxiliares para formatear números para la vista vertical ---
export function getVerticalAlignmentInfo(
    operands: number[],
    problemOverallDecimalPrecision?: number
): {
    maxIntLength: number;
    maxDecLength: number;
    operandsFormatted: Array<{ original: number, intStr: string, decStr: string }>;
    sumLineTotalCharWidth: number;
} {
    const effectiveDecimalPlacesToShow = problemOverallDecimalPrecision || 0;

    const operandsDisplayInfo = operands.map(op => {
        const s = op.toFixed(effectiveDecimalPlacesToShow);
        const parts = s.split('.');
        return {
            original: op,
            intPart: parts[0],
            decPart: parts[1] || ""
        };
    });

    const maxIntLength = Math.max(1, ...operandsDisplayInfo.map(info => info.intPart.length));
    const maxDecLength = effectiveDecimalPlacesToShow;

    const operandsFormatted = operandsDisplayInfo.map(info => ({
        original: info.original,
        intStr: info.intPart.padStart(maxIntLength, ' '),
        decStr: info.decPart.padEnd(maxDecLength, '0')
    }));

    const sumLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 : 0) + maxDecLength;

    return { maxIntLength, maxDecLength, operandsFormatted, sumLineTotalCharWidth };
}