// utils.ts
import { AssociativePropertyProblem, DifficultyLevel, ExerciseLayout, Problem, Operand, DisplayFormat, VisualObject } from "./types";

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
      // NIVEL INTERMEDIO: Ejercicios guiados para completar espacios en blanco
      // Ejemplo: (6 + 1) + 3 = ___ y 6 + (___ + ___) = ___
      // Los estudiantes deben completar los valores faltantes
      layout = 'horizontal';
      operands = [
        getRandomInt(5, 15),
        getRandomInt(5, 15), 
        getRandomInt(5, 15)
      ];
      break;
      
    case "advanced": 
      // NIVEL AVANZADO: Problemas verbales y cálculo mental estratégico
      // Enfoque en usar la propiedad asociativa para facilitar cálculos mentales
      // Ejemplos: 8 + 2 + 5 (agrupa 8+2=10 primero), problemas con contexto verbal
      layout = 'horizontal';
      
      // Generar números que permitan agrupaciones estratégicas
      // Patrón 1: Un número que se acerque a 10, 20, 50, etc.
      const targetNumbers = [10, 20, 50, 100];
      const target = targetNumbers[getRandomInt(0, targetNumbers.length - 1)];
      
      if (getRandomBool(0.6)) {
        // Patrón: hacer sumas que lleguen a números redondos
        const complement = getRandomInt(1, 9);
        const firstNum = target - complement;
        operands = [firstNum, complement, getRandomInt(3, 15)];
      } else {
        // Patrón: números que se pueden agrupar para facilitar cálculo mental
        operands = [
          getRandomInt(6, 15),  // Primer número
          getRandomInt(2, 8),   // Segundo número (para agrupar)
          getRandomInt(3, 12)   // Tercer número
        ];
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

  // Crear objetos visuales para el nivel principiante
  const visualObjects = difficulty === 'beginner' ? generateVisualObjects(operands) : undefined;
  const showVisualMode = difficulty === 'beginner';
  const interactiveMode = difficulty === 'intermediate';
  const verbalMode = difficulty === 'advanced';

  return {
    id,
    num1: operands[0], // Mantener por compatibilidad o uso simple
    num2: operands.length > 1 ? operands[1] : 0, // Mantener por compatibilidad
    operands,
    correctAnswer,
    layout,
    answerMaxDigits,
    answerDecimalPosition,
    visualObjects,
    showVisualMode,
    interactiveMode,
    verbalMode,
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