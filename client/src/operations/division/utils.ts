// utils.ts
import { DivisionProblem, DifficultyLevel, ExerciseLayout, Problem, Operand } from "./types";

// --- Funciones auxiliares ---
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomBool = (probability: number = 0.5): boolean => Math.random() < probability;

const getRandomDecimal = (min: number, max: number, maxDecimals: 0 | 1 | 2): number => {
  if (maxDecimals === 0) {
    return getRandomInt(min, max);
  }
  const range = max - min;
  let value = Math.random() * range + min;
  const factor = Math.pow(10, maxDecimals);
  value = Math.round(value * factor) / factor;
  const fixedString = value.toFixed(maxDecimals);
  return parseFloat(fixedString);
};

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Convierte un problema de tipo DivisionProblem al tipo genérico Problem
 * Este adaptador garantiza la compatibilidad entre los dos tipos
 */
export function divisionProblemToProblem(problem: DivisionProblem, difficulty: DifficultyLevel = 'beginner'): Problem {
  // Convertir operandos de división a tipo Operand
  const operands: Operand[] = [
    { value: problem.dividend },
    { value: problem.divisor }
  ];
  
  return {
    id: problem.id,
    operands,
    operator: "÷",
    displayFormat: problem.layout,
    correctAnswer: problem.correctAnswer,
    difficulty,
    allowDecimals: problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0,
    maxAttempts: 3
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico DivisionProblem
 */
export function problemToDivisionProblem(problem: Problem): DivisionProblem {
  const dividend = problem.operands[0]?.value || 0;
  const divisor = problem.operands[1]?.value || 1;
  const quotient = dividend / divisor;
  const remainder = dividend % divisor;
  
  let answerDecimalPosition: number | undefined = undefined;
  
  if (problem.allowDecimals) {
    const quotientStr = quotient.toString();
    const dotIndex = quotientStr.indexOf('.');
    if (dotIndex >= 0) {
      answerDecimalPosition = quotientStr.length - dotIndex - 1;
    }
  }
  
  return {
    id: problem.id,
    dividend,
    divisor,
    quotient,
    remainder: remainder > 0 ? remainder : undefined,
    correctAnswer: problem.correctAnswer,
    layout: problem.displayFormat as ExerciseLayout,
    answerMaxDigits: problem.correctAnswer.toString().replace('.', '').length,
    answerDecimalPosition,
    hasRemainder: remainder > 0
  };
}

// --- Generación del Problema ---
export function generateDivisionProblem(difficulty: DifficultyLevel): DivisionProblem {
  const id = generateUniqueId();
  let dividend: number;
  let divisor: number;
  let layout: ExerciseLayout = 'horizontal';
  let allowDecimals = false;
  let exactDivision = true; // Para niveles básicos, preferir divisiones exactas

  switch (difficulty) {
    case "beginner": // Divisiones simples, ej: 8÷2, 9÷3
      divisor = getRandomInt(2, 9);
      dividend = divisor * getRandomInt(1, 9); // Asegurar división exacta
      layout = 'horizontal';
      break;
      
    case "elementary": // Divisiones de dos dígitos entre un dígito, ej: 24÷3, 48÷6
      divisor = getRandomInt(2, 9);
      const quotient = getRandomInt(2, 12);
      dividend = divisor * quotient; // Asegurar división exacta
      layout = 'horizontal';
      break;
      
    case "intermediate": // Divisiones más complejas, posibles decimales
      layout = getRandomBool(0.6) ? 'vertical' : 'horizontal'; // 60% vertical
      exactDivision = getRandomBool(0.7); // 70% divisiones exactas
      
      if (exactDivision) {
        divisor = getRandomInt(2, 12);
        const quotient = getRandomInt(5, 20);
        dividend = divisor * quotient;
      } else {
        allowDecimals = true;
        divisor = getRandomInt(2, 12);
        dividend = getRandomInt(15, 100);
      }
      break;
      
    case "advanced": // Divisiones con decimales más complejas
      layout = 'vertical';
      allowDecimals = true;
      exactDivision = getRandomBool(0.3); // 30% divisiones exactas
      
      if (exactDivision) {
        divisor = getRandomInt(3, 25);
        const quotient = getRandomDecimal(2, 50, 1);
        dividend = divisor * quotient;
      } else {
        divisor = getRandomInt(3, 25);
        dividend = getRandomInt(50, 500);
      }
      break;
      
    case "expert": // Divisiones muy complejas con decimales
      layout = 'vertical';
      allowDecimals = true;
      exactDivision = getRandomBool(0.2); // 20% divisiones exactas
      
      if (exactDivision) {
        divisor = getRandomInt(5, 50);
        const quotient = getRandomDecimal(5, 100, 2);
        dividend = divisor * quotient;
      } else {
        divisor = getRandomInt(5, 50);
        dividend = getRandomInt(100, 2000);
      }
      break;
      
    default:
      divisor = getRandomInt(2, 5);
      dividend = divisor * getRandomInt(1, 5);
      layout = 'horizontal';
  }

  // Calcular resultado
  const quotient = dividend / divisor;
  const remainder = dividend % divisor;
  
  let correctAnswer: number;
  let answerDecimalPosition: number | undefined = undefined;
  
  if (allowDecimals && remainder > 0) {
    // Calcular con decimales (máximo 2 decimales para simplicidad)
    correctAnswer = Math.round(quotient * 100) / 100;
    const answerStr = correctAnswer.toString();
    const dotIndex = answerStr.indexOf('.');
    if (dotIndex >= 0) {
      answerDecimalPosition = answerStr.length - dotIndex - 1;
    }
  } else {
    // División exacta o solo parte entera
    correctAnswer = Math.floor(quotient);
  }

  const answerMaxDigits = correctAnswer.toString().replace('.', '').length;

  return {
    id,
    dividend,
    divisor,
    quotient,
    remainder: remainder > 0 && !allowDecimals ? remainder : undefined,
    correctAnswer,
    layout,
    answerMaxDigits,
    answerDecimalPosition,
    hasRemainder: remainder > 0 && !allowDecimals
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

    const formatNumber = (num: number) => {
        const s = num.toFixed(effectiveDecimalPlacesToShow);
        const parts = s.split('.');
        return {
            original: num,
            intPart: parts[0],
            decPart: parts[1] || ""
        };
    };

    const dividendInfo = formatNumber(dividend);
    const divisorInfo = formatNumber(divisor);

    const maxIntLength = Math.max(
        dividendInfo.intPart.length,
        divisorInfo.intPart.length,
        1
    );
    const maxDecLength = effectiveDecimalPlacesToShow;

    const dividendFormatted = {
        original: dividendInfo.original,
        intStr: dividendInfo.intPart.padStart(maxIntLength, ' '),
        decStr: dividendInfo.decPart.padEnd(maxDecLength, '0')
    };

    const divisorFormatted = {
        original: divisorInfo.original,
        intStr: divisorInfo.intPart.padStart(maxIntLength, ' '),
        decStr: divisorInfo.decPart.padEnd(maxDecLength, '0')
    };

    const divisionLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 : 0) + maxDecLength;

    return { 
        maxIntLength, 
        maxDecLength, 
        dividendFormatted, 
        divisorFormatted, 
        divisionLineTotalCharWidth 
    };
}