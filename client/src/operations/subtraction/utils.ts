// utils.ts
import { SubtractionProblem, DifficultyLevel, ExerciseLayout, Problem, Operand } from "./types";

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
 * Convierte un problema de tipo SubtractionProblem al tipo genérico Problem
 * Este adaptador garantiza la compatibilidad entre los dos tipos
 */
export function subtractionProblemToProblem(problem: SubtractionProblem, difficulty: DifficultyLevel = 'beginner'): Problem {
  // Convertir operandos simples a tipo Operand
  const operands: Operand[] = problem.operands.map((value: number) => ({ value }));
  
  return {
    id: problem.id,
    operands,
    operator: "-", // Especificamos que es una resta
    displayFormat: problem.layout, // El layout de SubtractionProblem es el displayFormat de Problem
    correctAnswer: problem.correctAnswer,
    difficulty, // Usamos el parámetro de dificultad o el predeterminado
    allowDecimals: problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0,
    maxAttempts: 3 // Por defecto permitimos 3 intentos
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico SubtractionProblem
 * Este adaptador se usa cuando necesitamos utilizar funciones que requieren SubtractionProblem
 */
export function problemToSubtractionProblem(problem: Problem): SubtractionProblem {
  const operands = problem.operands.map(op => op.value);
  let answerDecimalPosition: number | undefined = undefined;
  
  if (problem.allowDecimals) {
    // Determinar el número de decimales a partir de los operandos
    const decimals = Math.max(...operands.map(op => {
      const strOp = op.toString();
      const dotIndex = strOp.indexOf('.');
      return dotIndex >= 0 ? strOp.length - dotIndex - 1 : 0;
    }));
    if (decimals > 0) {
      answerDecimalPosition = decimals;
    }
  }
  
  return {
    id: problem.id,
    num1: operands[0] || 0, // Minuendo
    num2: operands[1] || 0, // Sustraendo
    operands,
    correctAnswer: problem.correctAnswer,
    layout: problem.displayFormat as ExerciseLayout, // Solo horizontal o vertical, no 'word'
    answerMaxDigits: problem.correctAnswer.toString().replace('.', '').length,
    answerDecimalPosition
  };
}

// --- Generación del Problema de Resta ---
export function generateSubtractionProblem(difficulty: DifficultyLevel): SubtractionProblem {
  const id = generateUniqueId();
  let minuendo: number = 0;  // El número del cual se resta
  let sustraendo: number = 0; // El número que se resta
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner": // Restas simples, ej: 9-1 a 9-8 (sin resultados negativos)
      minuendo = getRandomInt(2, 9);
      sustraendo = getRandomInt(1, minuendo); // Garantiza resultado positivo
      layout = 'horizontal';
      break;
    case "elementary": // Dos dígitos - un dígito, sin préstamo (adaptado)
      minuendo = getRandomInt(11, 99);
      // Asegurar que no necesite préstamo en las unidades
      const unidadesMinuendo = minuendo % 10;
      sustraendo = getRandomInt(1, Math.min(9, unidadesMinuendo));
      if (getRandomBool(0.5)) { // 50% chance de dos dígitos - dos dígitos simples
        minuendo = getRandomInt(20, 50);
        sustraendo = getRandomInt(10, minuendo - 5); // Garantiza resultado positivo
      }
      layout = 'horizontal';
      break;
    case "intermediate": // 2 líneas, aleatoriamente vertical, posible 1 decimal
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal'; // 75% vertical
      if (layout === 'vertical' && getRandomBool(0.4)) { // 40% de chance de 1 decimal si es vertical
        problemMaxDecimals = 1;
        minuendo = getRandomDecimal(10, 99, problemMaxDecimals);
        sustraendo = getRandomDecimal(1, minuendo - 1, problemMaxDecimals);
      } else { // Enteros o formato horizontal
        minuendo = getRandomInt(20, 99);
        sustraendo = getRandomInt(1, minuendo - 1);
      }
      break;
    case "advanced": // Números más grandes, siempre vertical, 1 o 2 decimales
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1; // 60% chance de 2 decimales
      minuendo = getRandomDecimal(100, 999, problemMaxDecimals);
      sustraendo = getRandomDecimal(10, minuendo - 1, problemMaxDecimals);
      break;
    case "expert": // Números muy grandes, siempre vertical, 1 o 2 decimales
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1; // 75% chance de 2 decimales
      minuendo = getRandomDecimal(1000, 9999, problemMaxDecimals);
      sustraendo = getRandomDecimal(100, minuendo - 1, problemMaxDecimals);
      break;
    default: // Fallback a beginner si la dificultad no es reconocida
      minuendo = getRandomInt(2, 9);
      sustraendo = getRandomInt(1, minuendo);
      layout = 'horizontal';
  }

  // Salvaguarda final para evitar resultados negativos
  if (sustraendo >= minuendo) {
    const temp = minuendo;
    minuendo = sustraendo;
    sustraendo = temp;
  }

  const operands = [minuendo, sustraendo];
  const difference = minuendo - sustraendo;

  let effectiveMaxDecimalsInAnswer = 0;
  if (problemMaxDecimals > 0) {
      effectiveMaxDecimalsInAnswer = problemMaxDecimals;
  } else {
      effectiveMaxDecimalsInAnswer = Math.max(0, ...operands.map(op => {
          const opStr = String(op);
          return (opStr.split('.')[1] || '').length;
      }));
  }
  const correctAnswer = parseFloat(difference.toFixed(effectiveMaxDecimalsInAnswer));

  const correctAnswerStr = correctAnswer.toFixed(effectiveMaxDecimalsInAnswer);
  const [integerPartOfDifferenceStr, decimalPartOfDifferenceStr = ""] = correctAnswerStr.split('.');

  const answerMaxDigits = integerPartOfDifferenceStr.length + decimalPartOfDifferenceStr.length;

  let answerDecimalPosition: number | undefined = undefined;
  if (effectiveMaxDecimalsInAnswer > 0 && decimalPartOfDifferenceStr.length > 0) {
    answerDecimalPosition = decimalPartOfDifferenceStr.length;
  }

  return {
    id,
    num1: minuendo, // Mantener por compatibilidad
    num2: sustraendo, // Mantener por compatibilidad
    operands,
    correctAnswer,
    layout,
    answerMaxDigits,
    answerDecimalPosition,
  };
}

// --- Validación de la Respuesta ---
export function checkAnswer(problem: SubtractionProblem, userAnswer: number): boolean {
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