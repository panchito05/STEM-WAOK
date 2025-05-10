// utils.ts
import { AdditionProblem, DifficultyLevel, ExerciseLayout } from "./types"; // Asegúrate que la ruta y el contenido de types.ts sean correctos

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

// --- Generación del Problema ---
export function generateAdditionProblem(difficulty: DifficultyLevel): AdditionProblem {
  const id = generateUniqueId();
  let operands: number[] = [];
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner": // Sumas simples, ej: 1+1 a 9+9 (del código original)
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
      break;
    case "elementary": // Dos dígitos + un dígito, sin acarreo (adaptado) ej: 12+5, o dos dígitos simples
      operands = [getRandomInt(10, 30), getRandomInt(1, 9)]; // ej: 23 + 7
      if (getRandomBool(0.5)) { // 50% chance de dos dígitos + dos dígitos simples
          operands = [getRandomInt(10, 20), getRandomInt(10, 20)]; // ej: 12 + 15
      }
      layout = 'horizontal';
      break;
    case "intermediate": // 2 líneas, aleatoriamente vertical, posible 1 decimal
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal'; // 75% vertical
      if (layout === 'vertical' && getRandomBool(0.4)) { // 40% de chance de 1 decimal si es vertical
        problemMaxDecimals = 1;
        operands = [
          getRandomDecimal(10, 99, problemMaxDecimals),
          getRandomDecimal(10, 99, problemMaxDecimals)
        ];
      } else { // Enteros o formato horizontal
        operands = [getRandomInt(10, 99), getRandomInt(10, 99)];
      }
      break;
    case "advanced": // 3 líneas, siempre vertical, 1 o 2 decimales
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1; // 60% chance de 2 decimales
      for (let i = 0; i < 3; i++) {
        operands.push(getRandomDecimal(10, getRandomInt(200, 999), problemMaxDecimals));
      }
      break;
    case "expert": // 4 o 5 líneas, siempre vertical, 1 o 2 decimales
      layout = 'vertical';
      const numLines = getRandomBool() ? 4 : 5;
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1; // 75% chance de 2 decimales
      for (let i = 0; i < numLines; i++) {
        operands.push(getRandomDecimal(100, getRandomInt(2000, 9999), problemMaxDecimals));
      }
      break;
    default: // Fallback a beginner si la dificultad no es reconocida
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
  }

  if (operands.length === 0) { // Salvaguarda final
    operands = [getRandomInt(1,5), getRandomInt(1,5)];
  }

  const sum = operands.reduce((acc, val) => acc + val, 0);

  let effectiveMaxDecimalsInAnswer = 0;
  if (problemMaxDecimals > 0) {
      effectiveMaxDecimalsInAnswer = problemMaxDecimals;
  } else {
      effectiveMaxDecimalsInAnswer = Math.max(0, ...operands.map(op => {
          const opStr = String(op);
          return (opStr.split('.')[1] || '').length;
      }));
  }
  const correctAnswer = parseFloat(sum.toFixed(effectiveMaxDecimalsInAnswer));

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
export function checkAnswer(problem: AdditionProblem, userAnswer: number): boolean {
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