// problemGenerator.ts - Generador de problemas de suma
import { Problem, ProblemGeneratorConfig, DifficultyLevel, DisplayFormat } from '../types';

/**
 * Genera un conjunto de problemas de suma según la configuración especificada
 * @param config Configuración para generar problemas
 */
export function generateProblems(config: ProblemGeneratorConfig): Problem[] {
  const {
    count = 5,
    difficulty = 'beginner',
    format = 'horizontal',
    maxOperands = 2,
    minValue = 1,
    maxValue = 10,
    allowNegatives = false,
    allowDecimals = false,
    decimalPlaces = 1
  } = config;
  
  const problems: Problem[] = [];
  
  // Generar la cantidad especificada de problemas
  for (let i = 0; i < count; i++) {
    // Crear problema según dificultad
    const problem = generateProblem({
      difficulty,
      format,
      maxOperands,
      minValue,
      maxValue,
      allowNegatives,
      allowDecimals,
      decimalPlaces
    });
    
    problems.push(problem);
  }
  
  return problems;
}

/**
 * Genera un problema individual según los parámetros especificados
 */
function generateProblem(params: Omit<ProblemGeneratorConfig, 'count'>): Problem {
  const {
    difficulty,
    format = 'horizontal',
    maxOperands = 2,
    minValue = 1,
    maxValue = 10,
    allowNegatives = false,
    allowDecimals = false,
    decimalPlaces = 1
  } = params;
  
  // Ajustar rangos según la dificultad
  let operandCount = 2;
  let min = minValue;
  let max = maxValue;
  
  if (difficulty === 'beginner') {
    max = Math.min(max, 10);
    operandCount = 2;
  } else if (difficulty === 'easy') {
    max = Math.min(max, 20);
    operandCount = Math.min(maxOperands, 2);
  } else if (difficulty === 'medium') {
    max = Math.min(max, 50);
    operandCount = Math.min(maxOperands, 3);
  } else if (difficulty === 'hard') {
    max = Math.min(max, 100);
    operandCount = Math.min(maxOperands, 3);
  } else if (difficulty === 'expert') {
    max = Math.min(max, 500);
    operandCount = Math.min(maxOperands, 4);
  }
  
  // Generar operandos
  const operands: number[] = [];
  
  for (let i = 0; i < operandCount; i++) {
    const operand = generateRandomNumber(min, max, allowNegatives, allowDecimals, decimalPlaces);
    operands.push(operand);
  }
  
  // Calcular respuesta correcta
  const correctAnswer = calculateSum(operands, allowDecimals, decimalPlaces);
  
  // Generar texto de visualización
  let displayText = '';
  
  if (format === 'horizontal') {
    displayText = operands.join(' + ') + ' = ?';
  } else if (format === 'vertical') {
    displayText = operands.join('\\n+') + '\\n–––––\\n?';
  } else if (format === 'word') {
    displayText = generateWordProblem(operands);
  }
  
  // Crear problema con ID temporal (se asignará uno definitivo al agregarlo al contexto)
  const problem: Problem = {
    id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    operands,
    correctAnswer,
    displayFormat: format,
    displayText,
    difficulty
  };
  
  return problem;
}

/**
 * Genera un número aleatorio según los parámetros
 */
function generateRandomNumber(
  min: number,
  max: number,
  allowNegatives: boolean,
  allowDecimals: boolean,
  decimalPlaces: number
): number {
  // Ajustar rango si se permiten negativos
  if (allowNegatives) {
    const range = Math.abs(min) + Math.abs(max);
    const randomValue = Math.random() * range - Math.abs(min);
    
    if (allowDecimals) {
      return parseFloat(randomValue.toFixed(decimalPlaces));
    } else {
      return Math.round(randomValue);
    }
  } else {
    // Números positivos
    const randomValue = min + Math.random() * (max - min);
    
    if (allowDecimals) {
      return parseFloat(randomValue.toFixed(decimalPlaces));
    } else {
      return Math.floor(randomValue);
    }
  }
}

/**
 * Calcula la suma de los operandos
 */
function calculateSum(operands: number[], allowDecimals: boolean, decimalPlaces: number): number {
  const sum = operands.reduce((total, current) => total + current, 0);
  
  if (allowDecimals) {
    return parseFloat(sum.toFixed(decimalPlaces));
  } else {
    return sum;
  }
}

/**
 * Genera un problema en formato de texto
 */
function generateWordProblem(operands: number[]): string {
  const templates = [
    "Maria tiene {0} manzanas y Pedro le da {1} más. ¿Cuántas manzanas tiene Maria ahora?",
    "Juan compró {0} dulces el lunes y {1} más el martes. ¿Cuántos dulces tiene en total?",
    "En una caja hay {0} lápices rojos y {1} lápices azules. ¿Cuántos lápices hay en total?"
  ];
  
  // Seleccionar plantilla aleatoria
  const templateIndex = Math.floor(Math.random() * templates.length);
  let template = templates[templateIndex];
  
  // Reemplazar marcadores con operandos
  operands.forEach((operand, index) => {
    template = template.replace(`{${index}}`, operand.toString());
  });
  
  return template;
}

/**
 * Adapta la dificultad según el desempeño del usuario
 */
export function adaptDifficulty(
  previousLevel: DifficultyLevel, 
  consecutiveCorrect: number, 
  consecutiveIncorrect: number,
  correctThreshold: number = 3,
  incorrectThreshold: number = 2
): DifficultyLevel {
  const levels: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
  const currentIndex = levels.indexOf(previousLevel);
  
  // Aumentar dificultad
  if (consecutiveCorrect >= correctThreshold && currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  }
  
  // Disminuir dificultad
  if (consecutiveIncorrect >= incorrectThreshold && currentIndex > 0) {
    return levels[currentIndex - 1];
  }
  
  // Mantener igual
  return previousLevel;
}