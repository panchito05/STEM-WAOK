// utils.ts
import { AssociativePropertyProblem, DifficultyLevel, ExerciseLayout, Problem, Operand, DisplayFormat, VisualObject, AssociativeGrouping } from "./types";

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

// Función para generar objetos visuales para el nivel principiante
function generateVisualObjects(operands: number[]): VisualObject[] {
  const fruits = ['🍎', '🍊', '🍌'];
  const colors = ['#ffebee', '#e8f5e8', '#fff9c4'];
  
  return operands.map((count, index) => ({
    emoji: fruits[index % fruits.length],
    count,
    color: colors[index % colors.length]
  }));
}

/**
 * Convierte un problema de tipo AssociativePropertyProblem al tipo genérico Problem
 */
export function associativePropertyProblemToProblem(problem: AssociativePropertyProblem, difficulty: DifficultyLevel = 'beginner'): Problem {
  const operands: Operand[] = problem.operands.map(value => ({ value }));
  
  return {
    id: problem.id,
    operands,
    displayFormat: problem.displayFormat,
    correctAnswer: problem.correctAnswer,
    difficulty,
    allowDecimals: problem.allowDecimals,
    maxAttempts: problem.maxAttempts
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico AssociativePropertyProblem
 */
export function problemToAssociativePropertyProblem(problem: Problem): AssociativePropertyProblem {
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
    difficulty: problem.difficulty,
    maxAttempts: problem.maxAttempts,
    layout: problem.displayFormat as ExerciseLayout,
    answerMaxDigits: problem.correctAnswer.toString().replace('.', '').length,
    answerDecimalPosition,
    displayFormat: problem.displayFormat,
    allowDecimals: problem.allowDecimals
  };
}

/**
 * Genera las agrupaciones para demostrar la propiedad asociativa
 * (a + b) + c = a + (b + c)
 */
export function generateAssociativeGroupings(operands: number[]): { grouping1: AssociativeGrouping; grouping2: AssociativeGrouping } {
  if (operands.length < 3) {
    throw new Error('Se necesitan al menos 3 operandos para demostrar la propiedad asociativa');
  }

  const [a, b, c] = operands;
  
  // Primera agrupación: (a + b) + c
  const leftGroup = [a, b];
  const leftSum = a + b;
  const grouping1: AssociativeGrouping = {
    leftGroup,
    rightGroup: [c],
    leftSum,
    rightSum: c,
    totalSum: leftSum + c,
    expression: `(${a} + ${b}) + ${c}`
  };

  // Segunda agrupación: a + (b + c)
  const rightGroup = [b, c];
  const rightSum = b + c;
  const grouping2: AssociativeGrouping = {
    leftGroup: [a],
    rightGroup,
    leftSum: a,
    rightSum,
    totalSum: a + rightSum,
    expression: `${a} + (${b} + ${c})`
  };

  return { grouping1, grouping2 };
}

/**
 * Genera un problema de propiedad asociativa
 */
export function generateAssociativePropertyProblem(
  difficulty: DifficultyLevel,
  operandCount: number = 3,
  decimals: 0 | 1 | 2 = 0,
  maxOperandValue: number = 10
): AssociativePropertyProblem {
  const id = generateUniqueId();
  
  // Generar operandos basados en dificultad
  let operands: number[] = [];
  let maxValue = maxOperandValue;
  
  switch (difficulty) {
    case 'beginner':
      maxValue = Math.min(maxOperandValue, 5);
      break;
    case 'elementary':
      maxValue = Math.min(maxOperandValue, 10);
      break;
    case 'intermediate':
      maxValue = Math.min(maxOperandValue, 20);
      break;
    case 'advanced':
      maxValue = Math.min(maxOperandValue, 50);
      break;
    case 'expert':
      maxValue = Math.min(maxOperandValue, 100);
      break;
  }

  // Generar operandos
  for (let i = 0; i < operandCount; i++) {
    operands.push(getRandomDecimal(1, maxValue, decimals));
  }

  const correctAnswer = operands.reduce((sum, op) => sum + op, 0);
  const maxAttempts = 3;
  const layout: ExerciseLayout = 'horizontal';
  const answerMaxDigits = correctAnswer.toString().replace('.', '').length;
  const answerDecimalPosition = decimals > 0 ? decimals : undefined;
  
  // Generar objetos visuales para principiantes
  const visualObjects = difficulty === 'beginner' ? generateVisualObjects(operands) : undefined;
  const showVisualMode = difficulty === 'beginner';
  const interactiveMode = difficulty === 'intermediate';

  // Generar las agrupaciones para demostrar la propiedad asociativa
  let grouping1: AssociativeGrouping | undefined;
  let grouping2: AssociativeGrouping | undefined;
  
  if (operands.length >= 3) {
    const groupings = generateAssociativeGroupings(operands);
    grouping1 = groupings.grouping1;
    grouping2 = groupings.grouping2;
  }

  return {
    id,
    num1: operands[0],
    num2: operands.length > 1 ? operands[1] : 0,
    operands,
    correctAnswer,
    difficulty,
    maxAttempts,
    layout,
    answerMaxDigits,
    answerDecimalPosition,
    visualObjects,
    showVisualMode,
    interactiveMode,
    grouping1,
    grouping2,
    displayFormat: layout,
    allowDecimals: answerDecimalPosition !== undefined && answerDecimalPosition > 0
  };
}

/**
 * Valida la respuesta del usuario
 */
export function checkAnswer(problem: AssociativePropertyProblem, userAnswer: number): boolean {
  if (isNaN(userAnswer)) return false;
  
  const tolerance = problem.allowDecimals ? 0.001 : 0;
  return Math.abs(userAnswer - problem.correctAnswer) <= tolerance;
}

/**
 * Formatea un número para mostrar
 */
export function formatNumber(num: number, decimals?: number): string {
  if (decimals !== undefined) {
    return num.toFixed(decimals);
  }
  return num.toString();
}

/**
 * Calcula estadísticas de un conjunto de problemas
 */
export function calculateStats(problems: AssociativePropertyProblem[], answers: number[]): {
  accuracy: number;
  averageOperandValue: number;
  totalSum: number;
} {
  const accuracy = problems.length > 0 ? 
    (answers.filter((ans, i) => checkAnswer(problems[i], ans)).length / problems.length) * 100 : 0;
  
  const allOperands = problems.flatMap(p => p.operands);
  const averageOperandValue = allOperands.length > 0 ? 
    allOperands.reduce((sum, op) => sum + op, 0) / allOperands.length : 0;
  
  const totalSum = problems.reduce((sum, p) => sum + p.correctAnswer, 0);
  
  return { accuracy, averageOperandValue, totalSum };
}