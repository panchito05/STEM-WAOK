// problemGenerator.ts - Generador de problemas para el módulo de suma
import { Problem, DifficultyLevel } from '../types';

// Configuración para generar problemas según nivel de dificultad
interface ProblemGeneratorConfig {
  count: number;
  difficulty: DifficultyLevel;
  format?: 'horizontal' | 'vertical' | 'word';
  maxOperands?: number;
  minValue?: number;
  maxValue?: number;
  allowNegatives?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
}

// Genera un ID único para un problema
function generateProblemId(): string {
  return `prob-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Genera un número aleatorio dentro de un rango
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Determina los límites según nivel de dificultad
function getDifficultyLimits(difficulty: DifficultyLevel): {
  maxOperands: number;
  minValue: number;
  maxValue: number;
  allowNegatives: boolean;
  allowDecimals: boolean;
  decimalPlaces: number;
} {
  switch (difficulty) {
    case 'beginner':
      return {
        maxOperands: 2,
        minValue: 0,
        maxValue: 10,
        allowNegatives: false,
        allowDecimals: false,
        decimalPlaces: 0
      };
    case 'elementary':
      return {
        maxOperands: 2,
        minValue: 0,
        maxValue: 20,
        allowNegatives: false,
        allowDecimals: false,
        decimalPlaces: 0
      };
    case 'intermediate':
      return {
        maxOperands: 3,
        minValue: 0,
        maxValue: 50,
        allowNegatives: false,
        allowDecimals: false,
        decimalPlaces: 0
      };
    case 'advanced':
      return {
        maxOperands: 4,
        minValue: -20,
        maxValue: 100,
        allowNegatives: true,
        allowDecimals: true,
        decimalPlaces: 1
      };
    case 'expert':
      return {
        maxOperands: 5,
        minValue: -50,
        maxValue: 200,
        allowNegatives: true,
        allowDecimals: true,
        decimalPlaces: 2
      };
    default:
      return {
        maxOperands: 2,
        minValue: 0,
        maxValue: 20,
        allowNegatives: false,
        allowDecimals: false,
        decimalPlaces: 0
      };
  }
}

// Genera un número aleatorio que puede tener decimales
function getRandomNumber(
  min: number, 
  max: number, 
  allowDecimals: boolean, 
  decimalPlaces: number
): number {
  if (!allowDecimals) {
    return getRandomInt(min, max);
  }
  
  const rand = Math.random() * (max - min) + min;
  return parseFloat(rand.toFixed(decimalPlaces));
}

// Genera los operandos para un problema según dificultad
function generateOperands(
  numOperands: number,
  minValue: number,
  maxValue: number,
  allowNegatives: boolean,
  allowDecimals: boolean,
  decimalPlaces: number
): number[] {
  const operands: number[] = [];
  
  for (let i = 0; i < numOperands; i++) {
    const finalMin = allowNegatives ? minValue : Math.max(0, minValue);
    const num = getRandomNumber(finalMin, maxValue, allowDecimals, decimalPlaces);
    operands.push(num);
  }
  
  return operands;
}

// Calcula el resultado de una suma
function calculateSum(operands: number[]): number {
  return operands.reduce((sum, current) => sum + current, 0);
}

// Genera un texto explicativo para la solución
function generateExplanation(operands: number[], result: number): string {
  if (operands.length === 2) {
    return `Para resolver ${operands[0]} + ${operands[1]}, sumamos los valores:\n
${operands[0]} + ${operands[1]} = ${result}\n
La respuesta correcta es ${result}.`;
  }
  
  let explanation = `Para resolver `;
  explanation += operands.join(' + ');
  explanation += `, sumamos todos los valores:\n\n`;
  
  // Explicación paso a paso si hay más de 2 operandos
  if (operands.length > 2) {
    let runningSum = operands[0];
    explanation += `Empezamos con ${operands[0]}\n`;
    
    for (let i = 1; i < operands.length; i++) {
      const newSum = runningSum + operands[i];
      explanation += `${runningSum} + ${operands[i]} = ${newSum}\n`;
      runningSum = newSum;
    }
  } else {
    explanation += `${operands[0]} + ${operands[1]} = ${result}\n`;
  }
  
  explanation += `\nLa respuesta correcta es ${result}.`;
  return explanation;
}

// Genera un problema individual
function generateProblem(config: ProblemGeneratorConfig): Problem {
  const difficultyLimits = getDifficultyLimits(config.difficulty);
  
  // Determinar número de operandos
  const maxOperands = config.maxOperands || difficultyLimits.maxOperands;
  const numOperands = getRandomInt(2, maxOperands);
  
  // Generar operandos
  const operands = generateOperands(
    numOperands,
    config.minValue || difficultyLimits.minValue,
    config.maxValue || difficultyLimits.maxValue,
    config.allowNegatives || difficultyLimits.allowNegatives,
    config.allowDecimals || difficultyLimits.allowDecimals,
    config.decimalPlaces || difficultyLimits.decimalPlaces
  );
  
  // Calcular resultado
  const result = calculateSum(operands);
  
  // Generar explicación
  const explanation = generateExplanation(operands, result);
  
  // Crear problema
  const problem: Problem = {
    id: generateProblemId(),
    operands,
    correctAnswer: result,
    explanation,
    displayFormat: config.format || 'horizontal',
    operacion: 'suma',
    tipo: 'enteros',
    difficulty: config.difficulty,
    createdAt: Date.now()
  };
  
  // Si hay decimales, establecer propiedades adicionales
  if (config.allowDecimals || difficultyLimits.allowDecimals) {
    problem.answerDecimalPosition = config.decimalPlaces || difficultyLimits.decimalPlaces;
  }
  
  // Establecer límite de dígitos para la respuesta
  const resultStr = result.toString();
  problem.answerMaxDigits = resultStr.replace(/\D/g, '').length;
  
  return problem;
}

// Función principal para generar múltiples problemas
export async function generateProblems(config: ProblemGeneratorConfig): Promise<Problem[]> {
  const problems: Problem[] = [];
  
  // Generar la cantidad solicitada de problemas
  for (let i = 0; i < config.count; i++) {
    const problem = generateProblem(config);
    problems.push(problem);
  }
  
  return problems;
}

// Convierte un problema a formato legible
export function formatProblemToString(problem: Problem): string {
  if (!problem.operands) return '';
  
  if (problem.displayFormat === 'horizontal') {
    return problem.operands.join(' + ') + ' = ?';
  } else if (problem.displayFormat === 'vertical') {
    let result = '';
    for (let i = 0; i < problem.operands.length; i++) {
      const op = problem.operands[i];
      if (i === 0) {
        result += op.toString().padStart(5, ' ') + '\n';
      } else {
        const sign = '+';
        result += sign + ' ' + op.toString().padStart(3, ' ') + '\n';
      }
    }
    result += '-----\n';
    result += '  ?\n';
    return result;
  } else if (problem.displayFormat === 'word') {
    const operators = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto'];
    let result = `Suma los siguientes números: `;
    
    for (let i = 0; i < problem.operands.length; i++) {
      if (i === problem.operands.length - 1) {
        result += `y ${problem.operands[i]}.`;
      } else {
        result += `${problem.operands[i]}, `;
      }
    }
    
    return result;
  }
  
  return problem.operands.join(' + ') + ' = ?';
}