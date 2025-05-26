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
  const operands: Operand[] = problem.operands.map(value => ({ value }));
  
  return {
    id: problem.id,
    operands,
    displayFormat: problem.layout, // El layout de AdditionProblem es el displayFormat de Problem
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
    num1: operands[0] || 0,
    num2: operands[1] || 0,
    operands,
    correctAnswer: problem.correctAnswer,
    layout: problem.displayFormat as ExerciseLayout, // Solo horizontal o vertical, no 'word'
    answerMaxDigits: problem.correctAnswer.toString().replace('.', '').length,
    answerDecimalPosition
  };
}

// --- Generación del Problema ---
export function generateSubtractionProblem(difficulty: DifficultyLevel): SubtractionProblem {
  const id = generateUniqueId();
  let operands: number[] = [];
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner": // Restas simples, ej: 9-1 a 9-9 (minuendo >= sustraendo)
      const minuend1 = getRandomInt(2, 9);
      const subtrahend1 = getRandomInt(1, minuend1);
      operands = [minuend1, subtrahend1];
      layout = 'horizontal';
      break;
    case "elementary": // Dos dígitos menos un dígito o dos dígitos
      const minuend2 = getRandomInt(10, 30);
      const subtrahend2 = getRandomInt(1, Math.min(9, minuend2));
      operands = [minuend2, subtrahend2];
      if (getRandomBool(0.5)) { // 50% chance de dos dígitos - dos dígitos
          const minuend2b = getRandomInt(15, 30);
          const subtrahend2b = getRandomInt(10, minuend2b);
          operands = [minuend2b, subtrahend2b];
      }
      layout = 'horizontal';
      break;
    case "intermediate": // 2 líneas, aleatoriamente vertical, posible 1 decimal
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal'; // 75% vertical
      if (layout === 'vertical' && getRandomBool(0.4)) { // 40% de chance de 1 decimal si es vertical
        problemMaxDecimals = 1;
        const minuend3 = getRandomDecimal(50, 99, problemMaxDecimals);
        const subtrahend3 = getRandomDecimal(10, minuend3 - 5, problemMaxDecimals);
        operands = [minuend3, subtrahend3];
      } else { // Enteros o formato horizontal
        const minuend3b = getRandomInt(50, 99);
        const subtrahend3b = getRandomInt(10, minuend3b - 5);
        operands = [minuend3b, subtrahend3b];
      }
      break;
    case "advanced": // 3 operandos: minuendo - sustraendo1 - sustraendo2, vertical, decimales
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1; // 60% chance de 2 decimales
      const minuend4 = getRandomDecimal(500, 999, problemMaxDecimals);
      const subtrahend4a = getRandomDecimal(50, minuend4 * 0.3, problemMaxDecimals);
      const subtrahend4b = getRandomDecimal(50, minuend4 * 0.3, problemMaxDecimals);
      // Asegurar que minuendo > suma de sustraendos
      const maxSubtrahend = (minuend4 - subtrahend4a) * 0.8;
      operands = [minuend4, subtrahend4a, Math.min(subtrahend4b, maxSubtrahend)];
      break;
    case "expert": // 4 o 5 operandos: múltiples sustraendos, vertical, decimales
      layout = 'vertical';
      const numLines = getRandomBool() ? 4 : 5;
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1; // 75% chance de 2 decimales
      const minuend5 = getRandomDecimal(2000, 9999, problemMaxDecimals);
      operands = [minuend5];
      let remainingValue = minuend5 * 0.8; // Reservar 20% para evitar negativos
      for (let i = 1; i < numLines; i++) {
        const maxSubtrahend = remainingValue / (numLines - i); // Distribuir equitativamente
        const subtrahend = getRandomDecimal(100, maxSubtrahend * 0.8, problemMaxDecimals);
        operands.push(subtrahend);
        remainingValue -= subtrahend;
      }
      break;
    default: // Fallback a beginner si la dificultad no es reconocida
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
  }

  if (operands.length === 0) { // Salvaguarda final
    operands = [getRandomInt(1,5), getRandomInt(1,5)];
  }

  // Para resta: el primer operando (minuendo) menos la suma de los demás (sustraendos)
  const difference = operands.length > 1 
    ? operands[0] - operands.slice(1).reduce((acc, val) => acc + val, 0)
    : operands[0];

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
  const [integerPartOfSumStr, decimalPartOfSumStr = ""] = correctAnswerStr.split('.');

  const answerMaxDigits = integerPartOfSumStr.length + decimalPartOfSumStr.length;

  let answerDecimalPosition: number | undefined = undefined;
  if (effectiveMaxDecimalsInAnswer > 0 && decimalPartOfSumStr.length > 0) {
    answerDecimalPosition = decimalPartOfSumStr.length;
  }

  return {
    id,
    num1: operands[0], // Mantener por compatibilidad o uso simple
    num2: operands.length > 1 ? operands[1] : 0, // Mantener por compatibilidad
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