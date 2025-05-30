// utils.ts
import { AssociativePropertyProblem, DifficultyLevel, ExerciseLayout, Problem, Operand, DisplayFormat } from "./types";

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
 * Convierte un problema de tipo AssociativePropertyProblem al tipo genérico Problem
 * Este adaptador garantiza la compatibilidad entre los dos tipos
 */
export function additionProblemToProblem(problem: AssociativePropertyProblem, difficulty: DifficultyLevel = 'beginner'): Problem {
  // Convertir operandos simples a tipo Operand
  const operands: Operand[] = problem.operands.map(value => ({ value }));
  
  return {
    id: problem.id,
    operands,
    displayFormat: problem.layout, // El layout de AssociativePropertyProblem es el displayFormat de Problem
    correctAnswer: problem.correctAnswer,
    difficulty, // Usamos el parámetro de dificultad o el predeterminado
    allowDecimals: problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0,
    maxAttempts: 3 // Por defecto permitimos 3 intentos
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico AssociativePropertyProblem
 * Este adaptador se usa cuando necesitamos utilizar funciones que requieren AssociativePropertyProblem
 */
export function problemToAssociativePropertyProblem(problem: Problem): AssociativePropertyProblem {
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
// La Propiedad Asociativa de la Suma establece que:
// (a + b) + c = a + (b + c)
// El resultado es el mismo independientemente de cómo se agrupen los números
export function generateAssociativePropertyProblem(difficulty: DifficultyLevel): AssociativePropertyProblem {
  const id = generateUniqueId();
  let operands: number[] = [];
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner": 
      // NIVEL PRINCIPIANTE: Agrupar objetos visuales para entender la propiedad asociativa
      // Ejemplo: 🍎🍎 + 🍊🍊🍊 + 🍌 = 6 frutas
      // El niño puede agrupar como (🍎🍎 + 🍊🍊🍊) + 🍌 = 5 + 1 = 6
      // O como 🍎🍎 + (🍊🍊🍊 + 🍌) = 2 + 4 = 6
      // Números muy pequeños (1-3) para facilitar la visualización y conteo
      operands = [getRandomInt(1, 3), getRandomInt(1, 3), getRandomInt(1, 3)];
      layout = 'horizontal';
      break;
      
    case "elementary": 
      // NIVEL ELEMENTAL: Refuerzo del concepto con números ligeramente mayores
      // Ejemplo: 4 + 6 + 3 = 13 (puede agruparse como (4+6)+3=10+3=13 o 4+(6+3)=4+9=13)
      // Números de un dígito (2-8) que permiten diferentes estrategias de agrupación
      operands = [getRandomInt(2, 8), getRandomInt(2, 8), getRandomInt(2, 8)];
      layout = 'horizontal';
      break;
      
    case "intermediate": 
      // NIVEL INTERMEDIO: Aplicación con números mixtos y posible formato vertical
      // Ejemplo: 12 + 8 + 15 = 35 (agrupación: (12+8)+15=20+15=35 o 12+(8+15)=12+23=35)
      // Introduce variación en el formato de presentación
      layout = getRandomBool(0.6) ? 'horizontal' : 'vertical';
      operands = [
        getRandomInt(5, 15),
        getRandomInt(5, 15), 
        getRandomInt(5, 15)
      ];
      // 30% de probabilidad de añadir un cuarto número para mayor complejidad
      // Ejemplo: 8 + 12 + 6 + 9 = 35 (múltiples formas de agrupar)
      if (getRandomBool(0.3)) {
        operands.push(getRandomInt(5, 10));
      }
      break;
      
    case "advanced": 
      // NIVEL AVANZADO: Números más grandes con posibles decimales
      // Ejemplo: 25.5 + 34.2 + 18.7 = 78.4 (agrupación estratégica para facilitar cálculo)
      // Enfoque en estrategias de agrupación para simplificar operaciones
      layout = getRandomBool(0.7) ? 'vertical' : 'horizontal';
      problemMaxDecimals = getRandomBool(0.4) ? 1 : 0; // 40% chance de decimales
      
      if (problemMaxDecimals > 0) {
        operands = [
          getRandomDecimal(10, 50, problemMaxDecimals),
          getRandomDecimal(10, 50, problemMaxDecimals),
          getRandomDecimal(10, 50, problemMaxDecimals)
        ];
      } else {
        operands = [
          getRandomInt(15, 75),
          getRandomInt(15, 75),
          getRandomInt(15, 75)
        ];
      }
      
      // 50% de probabilidad de cuarto operando para demostrar agrupaciones múltiples
      if (getRandomBool(0.5)) {
        if (problemMaxDecimals > 0) {
          operands.push(getRandomDecimal(10, 30, problemMaxDecimals));
        } else {
          operands.push(getRandomInt(10, 40));
        }
      }
      break;
      
    case "expert": 
      // NIVEL EXPERTO: Máxima complejidad con 4-5 números y decimales
      // Ejemplo: 45.75 + 62.25 + 38.50 + 29.75 + 33.25 = 209.50
      // Requiere planificación estratégica de agrupaciones para optimizar el cálculo
      layout = 'vertical';
      const numOperands = getRandomBool(0.6) ? 4 : 5; // 60% cuatro números, 40% cinco números
      problemMaxDecimals = getRandomBool(0.7) ? 2 : 1; // 70% dos decimales, 30% un decimal
      
      for (let i = 0; i < numOperands; i++) {
        operands.push(getRandomDecimal(20, 150, problemMaxDecimals));
      }
      break;
      
    default: // Fallback a beginner
      operands = [getRandomInt(1, 5), getRandomInt(1, 5), getRandomInt(1, 5)];
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
export function checkAnswer(problem: AssociativePropertyProblem, userAnswer: number): boolean {
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