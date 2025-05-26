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
  // Convertir dividendo y divisor a tipo Operand
  const operands: Operand[] = [
    { value: problem.dividend },
    { value: problem.divisor }
  ];
  
  return {
    id: problem.id,
    operands,
    operator: '÷',
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
    // Determinar el número de decimales a partir de la respuesta
    const answerStr = problem.correctAnswer.toString();
    const dotIndex = answerStr.indexOf('.');
    if (dotIndex >= 0) {
      answerDecimalPosition = answerStr.length - dotIndex - 1;
    }
  }
  
  return {
    id: problem.id,
    dividend: operands[0] || 0,
    divisor: operands[1] || 0,
    correctAnswer: problem.correctAnswer,
    remainder: problem.correctAnswer % 1 === 0 ? (operands[0] || 0) % (operands[1] || 1) : undefined,
    layout: problem.displayFormat as ExerciseLayout, // Solo horizontal o vertical, no 'word'
    answerMaxDigits: problem.correctAnswer.toString().replace('.', '').length,
    answerDecimalPosition
  };
}

// --- Generación del Problema ---
export function generateDivisionProblem(difficulty: DifficultyLevel): DivisionProblem {
  const id = generateUniqueId();
  let dividend: number;
  let divisor: number;
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner": // Divisiones simples, ej: 8÷2, 9÷3
      divisor = getRandomInt(2, 9);
      const quotient = getRandomInt(2, 9);
      dividend = divisor * quotient; // Asegurar división exacta
      layout = 'horizontal';
      break;
    case "elementary": // Dos dígitos entre un dígito, ej: 24÷3, 48÷6
      divisor = getRandomInt(2, 9);
      const quotient2 = getRandomInt(3, 12);
      dividend = divisor * quotient2; // Asegurar división exacta
      layout = 'horizontal';
      break;
    case "intermediate": // Divisiones con posibles decimales, formato vertical aleatorio
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal'; // 75% vertical
      divisor = getRandomInt(2, 15);
      if (getRandomBool(0.4)) { // 40% de chance de división con decimales
        problemMaxDecimals = 1;
        const quotient3 = getRandomDecimal(2, 20, problemMaxDecimals);
        dividend = Math.round(divisor * quotient3 * 10) / 10;
      } else { // División exacta
        const quotient3 = getRandomInt(3, 25);
        dividend = divisor * quotient3;
      }
      break;
    case "advanced": // Divisiones complejas con decimales
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1; // 60% chance de 2 decimales
      divisor = getRandomInt(3, 25);
      const quotient4 = getRandomDecimal(5, 50, problemMaxDecimals);
      dividend = Math.round(divisor * quotient4 * Math.pow(10, problemMaxDecimals)) / Math.pow(10, problemMaxDecimals);
      break;
    case "expert": // Divisiones muy complejas con decimales
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1; // 75% chance de 2 decimales
      divisor = getRandomInt(5, 50);
      const quotient5 = getRandomDecimal(10, 100, problemMaxDecimals);
      dividend = Math.round(divisor * quotient5 * Math.pow(10, problemMaxDecimals)) / Math.pow(10, problemMaxDecimals);
      break;
    default: // Fallback a beginner si la dificultad no es reconocida
      divisor = getRandomInt(2, 5);
      const quotientDefault = getRandomInt(2, 5);
      dividend = divisor * quotientDefault;
      layout = 'horizontal';
  }

  // Salvaguarda para evitar división por cero
  if (divisor === 0) {
    divisor = 2;
    dividend = 4;
  }

  const quotientResult = dividend / divisor;

  let effectiveMaxDecimalsInAnswer = 0;
  if (problemMaxDecimals > 0) {
      effectiveMaxDecimalsInAnswer = problemMaxDecimals;
  } else {
      const quotientStr = String(quotientResult);
      effectiveMaxDecimalsInAnswer = (quotientStr.split('.')[1] || '').length;
  }
  const correctAnswer = parseFloat(quotientResult.toFixed(effectiveMaxDecimalsInAnswer));

  const correctAnswerStr = correctAnswer.toFixed(effectiveMaxDecimalsInAnswer);
  const [integerPartOfSumStr, decimalPartOfSumStr = ""] = correctAnswerStr.split('.');

  const answerMaxDigits = integerPartOfSumStr.length + decimalPartOfSumStr.length;

  let answerDecimalPosition: number | undefined = undefined;
  if (effectiveMaxDecimalsInAnswer > 0 && decimalPartOfSumStr.length > 0) {
    answerDecimalPosition = decimalPartOfSumStr.length;
  }

  const remainder = correctAnswer % 1 === 0 ? dividend % divisor : undefined;

  return {
    id,
    dividend,
    divisor,
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

// --- Funciones auxiliares para formatear números para la vista vertical de división ---
export function getVerticalAlignmentInfo(
    dividend: number,
    divisor: number,
    problemOverallDecimalPrecision?: number
): {
    maxIntLength: number;
    maxDecLength: number;
    dividendFormatted: { original: number, intStr: string, decStr: string };
    divisorFormatted: { original: number, intStr: string, decStr: string };
    divisionLineTotalCharWidth: number;
} {
    const effectiveDecimalPlacesToShow = problemOverallDecimalPrecision || 0;

    const dividendDisplayInfo = {
        original: dividend,
        ...(() => {
            const s = dividend.toFixed(effectiveDecimalPlacesToShow);
            const parts = s.split('.');
            return {
                intPart: parts[0],
                decPart: parts[1] || ""
            };
        })()
    };

    const divisorDisplayInfo = {
        original: divisor,
        ...(() => {
            const s = divisor.toFixed(effectiveDecimalPlacesToShow);
            const parts = s.split('.');
            return {
                intPart: parts[0],
                decPart: parts[1] || ""
            };
        })()
    };

    const maxIntLength = Math.max(1, dividendDisplayInfo.intPart.length, divisorDisplayInfo.intPart.length);
    const maxDecLength = effectiveDecimalPlacesToShow;

    const dividendFormatted = {
        original: dividendDisplayInfo.original,
        intStr: dividendDisplayInfo.intPart.padStart(maxIntLength, ' '),
        decStr: dividendDisplayInfo.decPart.padEnd(maxDecLength, '0')
    };

    const divisorFormatted = {
        original: divisorDisplayInfo.original,
        intStr: divisorDisplayInfo.intPart.padStart(maxIntLength, ' '),
        decStr: divisorDisplayInfo.decPart.padEnd(maxDecLength, '0')
    };

    const divisionLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 : 0) + maxDecLength;

    return { maxIntLength, maxDecLength, dividendFormatted, divisorFormatted, divisionLineTotalCharWidth };
}