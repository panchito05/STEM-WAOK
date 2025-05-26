// utils.ts - Utilidades genéricas para el módulo vacío
import { EmptyModuleProblem, DifficultyLevel, ExerciseLayout, Problem, Operand } from "./types";

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
 * Convierte un problema de tipo EmptyModuleProblem al tipo genérico Problem
 * Este adaptador garantiza la compatibilidad entre los dos tipos
 */
export function emptyModuleProblemToProblem(problem: EmptyModuleProblem, difficulty: DifficultyLevel = 'beginner'): Problem {
  // Convertir operandos simples a tipo Operand
  const operands: Operand[] = problem.operands.map(value => ({ value }));
  
  return {
    id: problem.id,
    operands,
    displayFormat: problem.layout, // El layout de EmptyModuleProblem es el displayFormat de Problem
    correctAnswer: problem.correctAnswer,
    difficulty, // Usamos el parámetro de dificultad o el predeterminado
    allowDecimals: problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0,
    maxAttempts: 3 // Por defecto permitimos 3 intentos
  };
}

/**
 * Convierte un problema de tipo Problem al tipo específico EmptyModuleProblem
 * Este adaptador se usa cuando necesitamos utilizar funciones que requieren EmptyModuleProblem
 */
export function problemToEmptyModuleProblem(problem: Problem): EmptyModuleProblem {
  // Extraer valores simples de los operandos
  const operands = problem.operands.map(operand => operand.value);
  
  return {
    id: problem.id,
    operands,
    correctAnswer: problem.correctAnswer,
    layout: problem.displayFormat as ExerciseLayout,
    answerMaxDigits: problem.correctAnswer.toString().length,
    answerDecimalPosition: problem.allowDecimals ? 1 : undefined
  };
}

/**
 * Genera problemas genéricos basados en la dificultad
 * Esta función se puede personalizar para diferentes tipos de operaciones
 */
export function generateEmptyModuleProblems(
  difficulty: DifficultyLevel, 
  count: number
): EmptyModuleProblem[] {
  const problems: EmptyModuleProblem[] = [];
  
  for (let i = 0; i < count; i++) {
    const problem = generateSingleEmptyModuleProblem(difficulty, i + 1, count);
    problems.push(problem);
  }
  
  return problems;
}

/**
 * Genera un problema individual basado en la dificultad
 */
function generateSingleEmptyModuleProblem(
  difficulty: DifficultyLevel, 
  index: number, 
  total: number
): EmptyModuleProblem {
  // Aquí se puede personalizar la lógica según el tipo de operación deseada
  // Por ahora, genero problemas genéricos simples
  
  const difficultyConfig = getDifficultyConfig(difficulty);
  const operands = generateOperands(difficultyConfig);
  const correctAnswer = calculateAnswer(operands); // Aquí se implementaría la lógica específica
  
  return {
    id: generateUniqueId(),
    operands,
    correctAnswer,
    layout: difficultyConfig.layout,
    answerMaxDigits: correctAnswer.toString().length,
    answerDecimalPosition: difficultyConfig.allowDecimals ? 1 : undefined,
    index,
    total
  };
}

/**
 * Configuración por dificultad
 */
function getDifficultyConfig(difficulty: DifficultyLevel) {
  const configs = {
    beginner: {
      operandCount: 2,
      minValue: 1,
      maxValue: 10,
      layout: 'horizontal' as ExerciseLayout,
      allowDecimals: false
    },
    elementary: {
      operandCount: 2,
      minValue: 1,
      maxValue: 50,
      layout: 'vertical' as ExerciseLayout,
      allowDecimals: false
    },
    intermediate: {
      operandCount: 2,
      minValue: 10,
      maxValue: 100,
      layout: 'vertical' as ExerciseLayout,
      allowDecimals: false
    },
    advanced: {
      operandCount: 3,
      minValue: 50,
      maxValue: 500,
      layout: 'vertical' as ExerciseLayout,
      allowDecimals: true
    },
    expert: {
      operandCount: 3,
      minValue: 100,
      maxValue: 1000,
      layout: 'vertical' as ExerciseLayout,
      allowDecimals: true
    }
  };
  
  return configs[difficulty];
}

/**
 * Genera operandos basados en la configuración
 */
function generateOperands(config: ReturnType<typeof getDifficultyConfig>): number[] {
  const operands: number[] = [];
  
  for (let i = 0; i < config.operandCount; i++) {
    if (config.allowDecimals) {
      operands.push(getRandomDecimal(config.minValue, config.maxValue, 1));
    } else {
      operands.push(getRandomInt(config.minValue, config.maxValue));
    }
  }
  
  return operands;
}

/**
 * Calcula la respuesta - Esta función debe personalizarse según la operación
 * Por defecto, hace una suma (se puede cambiar por la operación deseada)
 */
function calculateAnswer(operands: number[]): number {
  // PLACEHOLDER: Aquí se implementaría la lógica específica de la operación
  // Por ahora, simplemente suma los operandos
  return operands.reduce((sum, operand) => sum + operand, 0);
}

/**
 * Valida si una respuesta del usuario es correcta
 */
export function validateAnswer(problem: EmptyModuleProblem, userAnswer: number): boolean {
  // Permitir pequeñas diferencias para números decimales
  const tolerance = 0.001;
  return Math.abs(problem.correctAnswer - userAnswer) < tolerance;
}

/**
 * Formatea un número para mostrar en la interfaz
 */
export function formatNumber(num: number): string {
  // Si es un entero, no mostrar decimales
  if (Number.isInteger(num)) {
    return num.toString();
  }
  
  // Para decimales, mostrar hasta 2 lugares decimales y eliminar ceros innecesarios
  return parseFloat(num.toFixed(2)).toString();
}

/**
 * Obtiene información de alineación vertical para el diseño
 */
export function getVerticalAlignmentInfo(problem: EmptyModuleProblem | null) {
  if (!problem) {
    console.log("getVerticalAlignmentInfo: problema inválido", problem);
    return null;
  }

  const operands = problem.operands || [];
  const answer = problem.correctAnswer;
  
  if (operands.length === 0) {
    console.log("getVerticalAlignmentInfo: operandos vacíos");
    return null;
  }

  // Encontrar el número con más dígitos
  const allNumbers = [...operands, answer];
  const maxDigits = Math.max(...allNumbers.map(num => num.toString().length));
  
  return {
    maxDigits,
    operands: operands.map(num => ({
      value: num,
      digits: num.toString().length,
      padding: maxDigits - num.toString().length
    })),
    answer: {
      value: answer,
      digits: answer.toString().length,
      padding: maxDigits - answer.toString().length
    }
  };
}

export { getRandomInt, getRandomBool, getRandomDecimal, generateUniqueId };