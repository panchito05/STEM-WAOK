// utils.ts - Subtraction module utilities
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
  const fixedString = value.toFixed(maxDecimals);
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
  const operands: Operand[] = problem.operands.map(value => ({ value }));
  
  return {
    id: problem.id,
    operands,
    operator: '-',
    displayFormat: problem.layout,
    correctAnswer: problem.correctAnswer,
    difficulty,
    allowDecimals: problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0,
    maxAttempts: 3
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico SubtractionProblem
 */
export function problemToSubtractionProblem(problem: Problem): SubtractionProblem {
  const operands = problem.operands.map(op => op.value);
  let answerDecimalPosition: number | undefined = undefined;
  
  if (problem.allowDecimals) {
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
    layout: problem.displayFormat as ExerciseLayout,
    answerMaxDigits: problem.correctAnswer.toString().replace('.', '').length,
    answerDecimalPosition
  };
}

// --- Generación del Problema de Resta ---
export function generateSubtractionProblem(difficulty: DifficultyLevel): SubtractionProblem {
  const id = generateUniqueId();
  let minuend: number = 0;
  let subtrahend: number = 0;
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner": // Restas de 1 dígito (5 - 3, 8 - 2)
      minuend = getRandomInt(5, 9);
      subtrahend = getRandomInt(1, minuend - 1);
      layout = 'horizontal';
      break;

    case "elementary": // Restas de 2 dígitos sin prestar (25 - 12, 38 - 15)
      minuend = getRandomInt(25, 89);
      // Asegurar que no se necesite prestar
      const minuendTens = Math.floor(minuend / 10);
      const minuendOnes = minuend % 10;
      const subtrahendTens = getRandomInt(1, minuendTens);
      const subtrahendOnes = getRandomInt(0, minuendOnes);
      subtrahend = subtrahendTens * 10 + subtrahendOnes;
      layout = 'horizontal';
      break;

    case "intermediate": // Restas de 2 dígitos con prestar (53 - 28, 72 - 49)
      minuend = getRandomInt(30, 99);
      subtrahend = getRandomInt(15, minuend - 5);
      // Forzar que se necesite prestar
      while ((minuend % 10) >= (subtrahend % 10) && minuend - subtrahend > 10) {
        subtrahend = getRandomInt(15, minuend - 5);
      }
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal';
      if (layout === 'vertical' && getRandomBool(0.4)) {
        problemMaxDecimals = 1;
        minuend = getRandomDecimal(30, 99, problemMaxDecimals);
        subtrahend = getRandomDecimal(15, minuend - 5, problemMaxDecimals);
      }
      break;

    case "advanced": // Restas de 3 dígitos (125 - 87, 234 - 156)
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1;
      minuend = getRandomDecimal(200, 999, problemMaxDecimals);
      subtrahend = getRandomDecimal(50, minuend - 10, problemMaxDecimals);
      break;

    case "expert": // Restas de 3 dígitos con decimales (123.5 - 67.8, 456.7 - 123.4)
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1;
      minuend = getRandomDecimal(500, 9999, problemMaxDecimals);
      subtrahend = getRandomDecimal(100, minuend - 50, problemMaxDecimals);
      break;

    default:
      minuend = getRandomInt(5, 9);
      subtrahend = getRandomInt(1, minuend - 1);
      layout = 'horizontal';
  }

  const operands = [minuend, subtrahend];
  const difference = minuend - subtrahend;

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
  const [integerPartStr, decimalPartStr = ""] = correctAnswerStr.split('.');
  const answerMaxDigits = integerPartStr.length + decimalPartStr.length;

  let answerDecimalPosition: number | undefined = undefined;
  if (effectiveMaxDecimalsInAnswer > 0 && decimalPartStr.length > 0) {
    answerDecimalPosition = decimalPartStr.length;
  }

  return {
    id,
    num1: minuend,
    num2: subtrahend,
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
    if (!operands || operands.length === 0) {
        console.error('getVerticalAlignmentInfo: problema inválido', operands);
        return {
            maxIntLength: 1,
            maxDecLength: 0,
            operandsFormatted: [],
            sumLineTotalCharWidth: 1
        };
    }

    const effectiveDecimalPlacesToShow = problemOverallDecimalPrecision || 0;

    const operandsDisplayInfo = operands.map(op => {
        const s = op.toFixed(effectiveDecimalPlacesToShow);
        const parts = s.split('.');
        return {
            original: op,
            intStr: parts[0] || '0',
            decStr: parts[1] || ''
        };
    });

    const maxIntLength = Math.max(...operandsDisplayInfo.map(info => info.intStr.length));
    const maxDecLength = effectiveDecimalPlacesToShow > 0 ? effectiveDecimalPlacesToShow : 0;

    const sumLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 + maxDecLength : 0);

    return {
        maxIntLength,
        maxDecLength,
        operandsFormatted: operandsDisplayInfo,
        sumLineTotalCharWidth
    };
}

// Función para formatear número con espaciado específico
export function formatNumberWithSpacing(
    value: number,
    targetIntLength: number,
    targetDecLength: number,
    decimalPrecision: number = 0
): string {
    const formatted = value.toFixed(decimalPrecision);
    const [intPart, decPart = ''] = formatted.split('.');
    
    const paddedIntPart = intPart.padStart(targetIntLength, ' ');
    
    if (targetDecLength > 0) {
        const paddedDecPart = decPart.padEnd(targetDecLength, '0');
        return `${paddedIntPart}.${paddedDecPart}`;
    }
    
    return paddedIntPart;
}

// Función auxiliar para determinar si una resta requiere "prestar"
export function requiresBorrowing(minuend: number, subtrahend: number): boolean {
    const minuendStr = minuend.toString();
    const subtrahendStr = subtrahend.toString();
    
    // Convertir a mismo número de dígitos para comparar
    const maxLength = Math.max(minuendStr.length, subtrahendStr.length);
    const paddedMinuend = minuendStr.padStart(maxLength, '0');
    const paddedSubtrahend = subtrahendStr.padStart(maxLength, '0');
    
    // Verificar dígito por dígito de derecha a izquierda
    for (let i = maxLength - 1; i >= 0; i--) {
        const minuendDigit = parseInt(paddedMinuend[i]);
        const subtrahendDigit = parseInt(paddedSubtrahend[i]);
        
        if (minuendDigit < subtrahendDigit) {
            return true;
        }
    }
    
    return false;
}

// Función para generar explicación paso a paso
export function generateStepByStepExplanation(problem: SubtractionProblem): string[] {
    const steps: string[] = [];
    const minuend = problem.operands[0];
    const subtrahend = problem.operands[1];
    
    steps.push(`Problema: ${minuend} - ${subtrahend}`);
    
    if (requiresBorrowing(minuend, subtrahend)) {
        steps.push("Esta resta requiere 'prestar' de la columna siguiente.");
    }
    
    steps.push(`Resultado: ${problem.correctAnswer}`);
    
    return steps;
}