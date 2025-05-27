import { v4 as uuidv4 } from 'uuid';
import { 
  MultiplicationProblem, 
  DifficultyLevel, 
  DisplayFormat
} from '../types';

// Configuración para el generador de problemas de multiplicación
export interface MultiplicationGeneratorConfig {
  difficulty: DifficultyLevel;
  problemCount: number;
  preferredDisplayFormat?: DisplayFormat | DisplayFormat[];
}

// Configuraciones específicas por nivel de dificultad
interface DifficultyConfig {
  firstOperandRange: [number, number];
  secondOperandRange: [number, number];
  allowDecimals: boolean;
  decimalProbabilities: {
    bothDecimals: number;
    firstOnly: number;
    secondOnly: number;
    bothIntegers: number;
  };
}

// Configuraciones por nivel de dificultad
const difficultyConfigs: Record<DifficultyLevel, DifficultyConfig> = {
  beginner: {
    firstOperandRange: [2, 9],
    secondOperandRange: [2, 9],
    allowDecimals: false,
    decimalProbabilities: { bothDecimals: 0, firstOnly: 0, secondOnly: 0, bothIntegers: 100 }
  },
  elementary: {
    firstOperandRange: [10, 99],
    secondOperandRange: [2, 12],
    allowDecimals: false,
    decimalProbabilities: { bothDecimals: 0, firstOnly: 0, secondOnly: 0, bothIntegers: 100 }
  },
  intermediate: {
    firstOperandRange: [10, 999],
    secondOperandRange: [10, 99],
    allowDecimals: false,
    decimalProbabilities: { bothDecimals: 0, firstOnly: 0, secondOnly: 0, bothIntegers: 100 }
  },
  advanced: {
    firstOperandRange: [1, 99],
    secondOperandRange: [1, 99],
    allowDecimals: true,
    decimalProbabilities: { bothDecimals: 25, firstOnly: 25, secondOnly: 25, bothIntegers: 25 }
  },
  expert: {
    firstOperandRange: [1, 99],
    secondOperandRange: [1, 99],
    allowDecimals: true,
    decimalProbabilities: { bothDecimals: 30, firstOnly: 20, secondOnly: 20, bothIntegers: 30 }
  }
};

/**
 * Genera un conjunto de problemas de multiplicación basado en la configuración proporcionada
 */
export function generateMultiplicationProblems(config: MultiplicationGeneratorConfig): MultiplicationProblem[] {
  const problems: MultiplicationProblem[] = [];
  const diffConfig = difficultyConfigs[config.difficulty];
  
  for (let i = 0; i < config.problemCount; i++) {
    problems.push(generateSingleMultiplicationProblem(diffConfig, config.preferredDisplayFormat));
  }
  
  return problems;
}

/**
 * Genera un solo problema de multiplicación
 */
function generateSingleMultiplicationProblem(
  config: DifficultyConfig, 
  preferredDisplayFormat?: DisplayFormat | DisplayFormat[]
): MultiplicationProblem {
  // Determinar qué tipo de decimales usar
  const decimalType = determineDecimalType(config.decimalProbabilities);
  
  // Generar operandos
  const operand1 = generateOperand(config.firstOperandRange, decimalType === 'first' || decimalType === 'both');
  const operand2 = generateOperand(config.secondOperandRange, decimalType === 'second' || decimalType === 'both');
  
  // Calcular resultado
  const result = operand1 * operand2;
  
  const finalResult = parseFloat(result.toFixed(4)); // Limitar decimales para evitar errores de precisión
  const resultString = finalResult.toString();
  // Contar solo los dígitos necesarios para la respuesta (incluyendo punto decimal si existe)
  const answerDigits = resultString.length;
  
  return {
    id: uuidv4(),
    operands: [operand1, operand2],
    num1: operand1,
    num2: operand2,
    correctAnswer: finalResult,
    layout: getDisplayFormat(preferredDisplayFormat),
    answerMaxDigits: answerDigits,
    createdAt: new Date()
  };
}

/**
 * Determina qué tipo de combinación de decimales usar
 */
function determineDecimalType(probabilities: DifficultyConfig['decimalProbabilities']): 'both' | 'first' | 'second' | 'none' {
  const random = Math.random() * 100;
  
  if (random < probabilities.bothDecimals) return 'both';
  if (random < probabilities.bothDecimals + probabilities.firstOnly) return 'first';
  if (random < probabilities.bothDecimals + probabilities.firstOnly + probabilities.secondOnly) return 'second';
  return 'none';
}

/**
 * Genera un operando individual
 */
function generateOperand(range: [number, number], useDecimals: boolean): number {
  const [min, max] = range;
  const baseNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  
  if (!useDecimals) {
    return baseNumber;
  }
  
  // Para nivel avanzado: generar 1-2 decimales aleatorios (0.1 a 0.99)
  const decimalPlaces = Math.random() < 0.5 ? 1 : 2;
  let decimalPart: number;
  
  if (decimalPlaces === 1) {
    // Generar decimal de 1 dígito: 0.1 a 0.9
    decimalPart = (Math.floor(Math.random() * 9) + 1) / 10;
  } else {
    // Generar decimal de 2 dígitos: 0.01 a 0.99
    decimalPart = (Math.floor(Math.random() * 99) + 1) / 100;
  }
  
  return parseFloat((baseNumber + decimalPart).toFixed(decimalPlaces));
}

/**
 * Obtiene un formato de visualización aleatorio o específico
 */
function getDisplayFormat(format?: DisplayFormat | DisplayFormat[]): DisplayFormat {
  if (!format) {
    // Para multiplicación, preferir formato vertical
    return 'vertical';
  }
  
  if (Array.isArray(format)) {
    return format[Math.floor(Math.random() * format.length)];
  }
  
  return format;
}

// Función de compatibilidad para el código existente
export function generateProblems(config: any): MultiplicationProblem[] {
  return generateMultiplicationProblems({
    difficulty: config.difficulty,
    problemCount: config.problemCount,
    preferredDisplayFormat: config.preferredDisplayFormat
  });
}