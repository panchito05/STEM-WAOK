import { v4 as uuidv4 } from 'uuid';
import { 
  Problem, 
  DifficultyLevel, 
  DisplayFormat, 
  Operand
} from '../types';

// Configuración para el generador de problemas
export interface ProblemGeneratorConfig {
  difficulty: DifficultyLevel;
  problemCount: number;
  maxOperands?: number;
  minValue?: number;
  maxValue?: number;
  allowNegatives?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  preferredDisplayFormat?: DisplayFormat | DisplayFormat[];
}

/**
 * Genera un conjunto de problemas de suma basado en la configuración proporcionada
 * @param config Configuración para generar problemas
 * @returns Array de problemas generados
 */
export function generateProblems(config: ProblemGeneratorConfig): Problem[] {
  const problems: Problem[] = [];
  
  // Determinar los valores mínimos y máximos según la dificultad
  const {
    difficulty,
    problemCount,
    maxOperands = getMaxOperandsByDifficulty(difficulty),
    minValue = getMinValueByDifficulty(difficulty),
    maxValue = getMaxValueByDifficulty(difficulty),
    allowNegatives = difficulty === 'hard' || difficulty === 'expert',
    allowDecimals = difficulty === 'hard' || difficulty === 'expert',
    decimalPlaces = difficulty === 'expert' ? 2 : 1,
    preferredDisplayFormat
  } = config;
  
  // Generar el número requerido de problemas
  for (let i = 0; i < problemCount; i++) {
    // Determinar cuántos operandos usar para este problema
    const operandCount = Math.floor(
      Math.random() * (maxOperands - 2 + 1) + 2
    );
    
    // Generar los operandos
    const operands: Operand[] = [];
    for (let j = 0; j < operandCount; j++) {
      // Crear un valor aleatorio dentro del rango
      let value: number;
      
      if (allowDecimals) {
        // Generar un número decimal
        const wholeNumber = Math.floor(
          Math.random() * (maxValue - minValue + 1) + minValue
        );
        
        // Generar la parte decimal
        const decimalPart = Math.floor(
          Math.random() * Math.pow(10, decimalPlaces)
        ) / Math.pow(10, decimalPlaces);
        
        value = wholeNumber + decimalPart;
        
        // Si se permiten negativos, decidir si este operando será negativo
        if (allowNegatives && Math.random() < 0.3) {
          value = -value;
        }
      } else {
        // Generar un número entero
        value = Math.floor(
          Math.random() * (maxValue - minValue + 1) + minValue
        );
        
        // Si se permiten negativos, decidir si este operando será negativo
        if (allowNegatives && Math.random() < 0.3) {
          value = -value;
        }
      }
      
      // Redondear a la cantidad correcta de decimales si es necesario
      if (allowDecimals) {
        value = parseFloat(value.toFixed(decimalPlaces));
      }
      
      // Añadir el operando
      operands.push({ value });
    }
    
    // Calcular la respuesta correcta
    const correctAnswer = operands.reduce((sum, op) => sum + op.value, 0);
    
    // Determinar el formato de visualización
    const displayFormat = getDisplayFormat(preferredDisplayFormat);
    
    // Añadir etiquetas a los operandos para problemas de palabras
    if (displayFormat === 'word') {
      addLabelsToOperands(operands);
    }
    
    // Crear el problema
    const problem: Problem = {
      id: uuidv4(),
      operands,
      displayFormat,
      correctAnswer,
      difficulty,
      allowDecimals,
      maxAttempts: getMaxAttemptsByDifficulty(difficulty)
    };
    
    problems.push(problem);
  }
  
  return problems;
}

/**
 * Obtiene el número máximo de operandos según la dificultad
 */
function getMaxOperandsByDifficulty(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'easy': return 2;
    case 'medium': return 3;
    case 'hard': return 4;
    case 'expert': return 5;
    default: return 2;
  }
}

/**
 * Obtiene el valor mínimo según la dificultad
 */
function getMinValueByDifficulty(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'easy': return 1;
    case 'medium': return 1;
    case 'hard': return 1;
    case 'expert': return 1;
    default: return 1;
  }
}

/**
 * Obtiene el valor máximo según la dificultad
 */
function getMaxValueByDifficulty(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'easy': return 10;
    case 'medium': return 50;
    case 'hard': return 100;
    case 'expert': return 1000;
    default: return 10;
  }
}

/**
 * Obtiene el número máximo de intentos según la dificultad
 */
function getMaxAttemptsByDifficulty(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'easy': return 3;
    case 'medium': return 2;
    case 'hard': return 2;
    case 'expert': return 1;
    default: return 3;
  }
}

/**
 * Obtiene un formato de visualización aleatorio o específico
 */
function getDisplayFormat(format?: DisplayFormat | DisplayFormat[]): DisplayFormat {
  if (!format) {
    // Si no se especifica, elegir uno aleatorio
    const formats: DisplayFormat[] = ['vertical', 'horizontal', 'word'];
    const randomIndex = Math.floor(Math.random() * formats.length);
    return formats[randomIndex];
  }
  
  if (Array.isArray(format)) {
    // Si es un array, elegir uno aleatorio del array
    const randomIndex = Math.floor(Math.random() * format.length);
    return format[randomIndex];
  }
  
  // Si es un formato específico, usarlo
  return format;
}

/**
 * Añade etiquetas a los operandos para problemas de palabras
 */
function addLabelsToOperands(operands: Operand[]): void {
  // Lista de posibles etiquetas para problemas de palabra
  const labels = [
    'manzanas', 'naranjas', 'peras', 'plátanos', 'lápices',
    'libros', 'pelotas', 'caramelos', 'galletas', 'monedas',
    'estrellas', 'coches', 'flores', 'árboles', 'casas'
  ];
  
  // Elegir una etiqueta aleatoria
  const randomIndex = Math.floor(Math.random() * labels.length);
  const label = labels[randomIndex];
  
  // Asignar la misma etiqueta a todos los operandos para consistencia
  operands.forEach(op => {
    op.label = label;
  });
}