// problemGenerator.ts - Utilidad para generar problemas de suma
import { v4 as uuidv4 } from 'uuid';
import { 
  Problem, 
  ProblemGeneratorConfig, 
  DifficultyLevel, 
  DisplayFormat 
} from '../types';

/**
 * Genera un conjunto de problemas de suma según la configuración especificada
 * @param config Configuración para generar problemas
 */
export function generateProblems(config: ProblemGeneratorConfig): Problem[] {
  const problems: Problem[] = [];
  const displayFormat = config.preferredDisplayFormat || 'horizontal';
  
  // Generar la cantidad especificada de problemas
  for (let i = 0; i < config.count; i++) {
    // Alternar el formato de visualización si se desea variedad
    const currentFormat: DisplayFormat = 
      Array.isArray(displayFormat)
        ? displayFormat[i % displayFormat.length]
        : displayFormat;
    
    // Generar un problema individual con los parámetros especificados
    const problem = generateProblem({
      ...config,
      preferredDisplayFormat: currentFormat
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
    difficulty = 'easy',
    minValue = 1,
    maxValue = 10,
    maxOperands = 2,
    allowNegatives = false,
    allowDecimals = false,
    decimalPlaces = 1,
    preferredDisplayFormat = 'horizontal'
  } = params;

  // Determinar la cantidad de operandos según la dificultad
  let operandCount = 2; // Por defecto
  
  if (difficulty === 'easy') {
    operandCount = 2;
  } else if (difficulty === 'medium') {
    operandCount = Math.min(3, maxOperands);
  } else if (difficulty === 'hard' || difficulty === 'expert') {
    operandCount = Math.min(Math.floor(Math.random() * 2) + 3, maxOperands);
  }
  
  // Generar operandos
  const operands: number[] = [];
  for (let i = 0; i < operandCount; i++) {
    operands.push(generateRandomNumber(minValue, maxValue, allowNegatives, allowDecimals, decimalPlaces));
  }
  
  // Calcular la suma
  const correctAnswer = calculateSum(operands, allowDecimals, decimalPlaces);
  
  // Determinar si se usa un problema de palabra
  const useWordProblem = preferredDisplayFormat === 'word' || 
    (Math.random() < 0.2 && difficulty !== 'easy'); // 20% de probabilidad para niveles no fáciles
  
  const displayText = useWordProblem ? generateWordProblem(operands) : undefined;
  
  // Crear el problema
  const problem: Problem = {
    id: uuidv4(),
    operands,
    correctAnswer,
    displayFormat: useWordProblem ? 'word' : preferredDisplayFormat,
    displayText,
    allowDecimals,
    decimalPlaces
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
  // Ajustar el rango si se permiten negativos
  if (allowNegatives) {
    const temp = Math.max(Math.abs(min), Math.abs(max));
    min = -temp;
    max = temp;
  }
  
  // Generar un número base
  let result = Math.random() * (max - min) + min;
  
  if (allowDecimals) {
    // Limitar a los lugares decimales especificados
    const factor = Math.pow(10, decimalPlaces);
    result = Math.round(result * factor) / factor;
  } else {
    // Redondear a entero
    result = Math.round(result);
  }
  
  return result;
}

/**
 * Calcula la suma de los operandos
 */
function calculateSum(operands: number[], allowDecimals: boolean, decimalPlaces: number): number {
  let sum = operands.reduce((acc, val) => acc + val, 0);
  
  if (allowDecimals) {
    // Ajustar a los lugares decimales especificados
    const factor = Math.pow(10, decimalPlaces);
    sum = Math.round(sum * factor) / factor;
  } else {
    // Asegurar que sea un entero
    sum = Math.round(sum);
  }
  
  return sum;
}

/**
 * Genera un problema en formato de texto
 */
function generateWordProblem(operands: number[]): string {
  const templates = [
    "María tiene {0} manzanas y Pedro tiene {1} manzanas. ¿Cuántas manzanas tienen en total?",
    "Juan caminó {0} kilómetros el lunes y {1} kilómetros el martes. ¿Cuántos kilómetros caminó en total?",
    "En una fiesta hay {0} niños y {1} niñas. ¿Cuántos niños hay en total?",
    "Ana compró {0} lápices y {1} bolígrafos. ¿Cuántos útiles compró en total?",
    "El lunes vendimos {0} pasteles y el martes vendimos {1} pasteles. ¿Cuántos pasteles vendimos en total?"
  ];
  
  // Seleccionar una plantilla al azar
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
  correctThreshold = 3,
  incorrectThreshold = 2
): DifficultyLevel {
  // Niveles de dificultad ordenados
  const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
  
  const currentIndex = levels.indexOf(previousLevel);
  
  // Subir de nivel si hay suficientes respuestas correctas consecutivas
  if (consecutiveCorrect >= correctThreshold && currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  }
  
  // Bajar de nivel si hay suficientes respuestas incorrectas consecutivas
  if (consecutiveIncorrect >= incorrectThreshold && currentIndex > 0) {
    return levels[currentIndex - 1];
  }
  
  // Mantener el mismo nivel si no se cumplen las condiciones
  return previousLevel;
}