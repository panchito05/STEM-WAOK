import { DifficultyLevel, RatiosFractionsPercentsDecimalsProblem } from './types';

// Función para generar un problema genérico del módulo
export function generateRatiosFractionsPercentsDecimalsProblem(
  difficulty: DifficultyLevel
): RatiosFractionsPercentsDecimalsProblem {
  // Configuración básica por dificultad
  const configs = {
    beginner: { min: 1, max: 10, maxDigits: 2 },
    elementary: { min: 1, max: 50, maxDigits: 2 },
    intermediate: { min: 1, max: 100, maxDigits: 3 },
    advanced: { min: 1, max: 500, maxDigits: 3 },
    expert: { min: 1, max: 1000, maxDigits: 4 }
  };

  const config = configs[difficulty];
  
  // Generar operandos básicos (placeholder - implementar lógica específica aquí)
  const operand1 = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
  const operand2 = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
  
  // Placeholder para la respuesta correcta (implementar cálculo específico aquí)
  const correctAnswer = operand1 + operand2; // Placeholder - cambiar según la operación deseada
  
  return {
    id: `ratios-fractions-percents-decimals-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    operands: [operand1, operand2],
    correctAnswer,
    layout: Math.random() > 0.5 ? 'horizontal' : 'vertical',
    answerMaxDigits: config.maxDigits
  };
}

// Función para formatear números según el contexto del módulo
export function formatNumber(num: number): string {
  return num.toString();
}

// Función para validar respuestas
export function validateAnswer(userAnswer: number, correctAnswer: number): boolean {
  return Math.abs(userAnswer - correctAnswer) < 0.001; // Tolerancia para decimales
}

// Función para obtener el rango de números según la dificultad
export function getNumberRange(difficulty: DifficultyLevel): { min: number; max: number } {
  const ranges = {
    beginner: { min: 1, max: 10 },
    elementary: { min: 1, max: 50 },
    intermediate: { min: 1, max: 100 },
    advanced: { min: 1, max: 500 },
    expert: { min: 1, max: 1000 }
  };
  
  return ranges[difficulty];
}