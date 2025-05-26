// utils.ts
import { MultiplicationProblem, DifficultyLevel, ExerciseLayout, Problem, Operand, DisplayFormat } from "./types";

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
 * Convierte un problema de tipo MultiplicationProblem al tipo genérico Problem
 * Este adaptador garantiza la compatibilidad entre los dos tipos
 */
export function multiplicationProblemToProblem(problem: MultiplicationProblem, difficulty: DifficultyLevel = 'beginner'): Problem {
  // Convertir operandos simples a tipo Operand
  const operands: Operand[] = problem.operands.map(value => ({ value }));
  
  return {
    id: problem.id,
    operands,
    displayFormat: problem.layout, // El layout de MultiplicationProblem es el displayFormat de Problem
    correctAnswer: problem.correctAnswer,
    difficulty, // Usamos el parámetro de dificultad o el predeterminado
    allowDecimals: problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0,
    maxAttempts: 3 // Por defecto permitimos 3 intentos
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico MultiplicationProblem
 * Este adaptador se usa cuando necesitamos utilizar funciones que requieren MultiplicationProblem
 */
export function problemToMultiplicationProblem(problem: Problem): MultiplicationProblem {
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
export function generateMultiplicationProblem(difficulty: DifficultyLevel): MultiplicationProblem {
  const id = generateUniqueId();
  let operands: number[] = [];
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner": // Multiplicaciones simples, ej: 1×1 a 9×9
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
      break;
    case "elementary": // Un dígito × dos dígitos, ej: 3×12
      operands = [getRandomInt(2, 9), getRandomInt(10, 99)];
      layout = 'horizontal';
      break;
    case "intermediate": // Dos dígitos × un dígito, formato vertical o horizontal
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal'; // 75% vertical
      operands = [getRandomInt(10, 99), getRandomInt(2, 9)];
      break;
    case "advanced": // Dos dígitos × dos dígitos, con decimales ocasionales
      layout = 'vertical';
      // Aproximadamente 2 de cada 6 ejercicios tendrán decimales (33% chance)
      if (getRandomBool(0.33)) {
        problemMaxDecimals = 1; // Un decimal para nivel avanzado
        operands = [getRandomDecimal(10, 99, 1), getRandomInt(10, 99)];
      } else {
        operands = [getRandomInt(10, 99), getRandomInt(10, 99)];
      }
      break;
    case "expert": // Multiplicaciones más grandes con decimales ocasionales
      layout = 'vertical';
      // Aproximadamente 2 de cada 6 ejercicios tendrán decimales (33% chance)
      if (getRandomBool(0.33)) {
        problemMaxDecimals = getRandomBool(0.5) ? 2 : 1; // 1 o 2 decimales
        operands = [getRandomDecimal(50, 199, problemMaxDecimals), getRandomInt(10, 99)];
      } else {
        operands = [getRandomInt(50, 199), getRandomInt(10, 99)];
      }
      break;
    default: // Fallback a beginner si la dificultad no es reconocida
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
  }

  if (operands.length === 0) { // Salvaguarda final
    operands = [getRandomInt(1,5), getRandomInt(1,5)];
  }

  const product = operands.reduce((acc, val) => acc * val, 1);

  let effectiveMaxDecimalsInAnswer = 0;
  if (problemMaxDecimals > 0) {
      effectiveMaxDecimalsInAnswer = problemMaxDecimals;
  } else {
      effectiveMaxDecimalsInAnswer = Math.max(0, ...operands.map(op => {
          const opStr = String(op);
          return (opStr.split('.')[1] || '').length;
      }));
  }
  const correctAnswer = parseFloat(product.toFixed(effectiveMaxDecimalsInAnswer));

  const correctAnswerStr = correctAnswer.toFixed(effectiveMaxDecimalsInAnswer);
  const [integerPartOfProductStr, decimalPartOfProductStr = ""] = correctAnswerStr.split('.');

  const answerMaxDigits = integerPartOfProductStr.length + decimalPartOfProductStr.length;

  let answerDecimalPosition: number | undefined = undefined;
  if (effectiveMaxDecimalsInAnswer > 0 && decimalPartOfProductStr.length > 0) {
    answerDecimalPosition = decimalPartOfProductStr.length;
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
export function checkAnswer(problem: MultiplicationProblem, userAnswer: number): boolean {
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
    productLineTotalCharWidth: number;
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

    const productLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 : 0) + maxDecLength;

    return { maxIntLength, maxDecLength, operandsFormatted, productLineTotalCharWidth };
}