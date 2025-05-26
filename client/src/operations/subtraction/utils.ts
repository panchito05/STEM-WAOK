// utils.ts - Módulo de Resta (Subtraction)
import { SubtractionProblem, DifficultyLevel, ExerciseLayout } from "./types";

// --- Funciones auxiliares ---
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Función para detectar si una resta requiere préstamo
function requiresBorrow(minuend: number, subtrahend: number): boolean {
  const minuendStr = minuend.toString();
  const subtrahendStr = subtrahend.toString();
  const maxLength = Math.max(minuendStr.length, subtrahendStr.length);
  
  // Rellenar con ceros a la izquierda para comparar dígito por dígito
  const paddedMinuend = minuendStr.padStart(maxLength, '0');
  const paddedSubtrahend = subtrahendStr.padStart(maxLength, '0');
  
  for (let i = maxLength - 1; i >= 0; i--) {
    const digitMinuend = parseInt(paddedMinuend[i]);
    const digitSubtrahend = parseInt(paddedSubtrahend[i]);
    
    if (digitMinuend < digitSubtrahend) {
      return true;
    }
  }
  return false;
}

// Función para obtener las posiciones donde se produce el préstamo
function getBorrowPositions(minuend: number, subtrahend: number): number[] {
  const positions: number[] = [];
  const minuendStr = minuend.toString();
  const subtrahendStr = subtrahend.toString();
  const maxLength = Math.max(minuendStr.length, subtrahendStr.length);
  
  const paddedMinuend = minuendStr.padStart(maxLength, '0');
  const paddedSubtrahend = subtrahendStr.padStart(maxLength, '0');
  
  for (let i = maxLength - 1; i >= 0; i--) {
    const digitMinuend = parseInt(paddedMinuend[i]);
    const digitSubtrahend = parseInt(paddedSubtrahend[i]);
    
    if (digitMinuend < digitSubtrahend) {
      positions.push(maxLength - 1 - i);
    }
  }
  return positions;
}

/**
 * Genera problemas de resta específicos según el nivel de dificultad
 * Cada nivel tiene características específicas para operaciones de sustracción:
 * 
 * - Beginner: Restas simples de 1 dígito, sin préstamo (0-9)
 * - Elementary: Restas de 2 dígitos, algunas con préstamo simple
 * - Intermediate: Restas de 2-3 dígitos con préstamo múltiple
 * - Advanced: Restas de 3-4 dígitos con préstamos complejos y ceros
 * - Expert: Restas de números grandes con múltiples préstamos y decimales
 */
export function generateSubtractionProblem(
  level: DifficultyLevel = 'beginner',
  layout: ExerciseLayout = 'vertical'
): SubtractionProblem {
  let minuend: number;
  let subtrahend: number;
  let maxDigits: number;
  
  switch (level) {
    case 'beginner':
      // Nivel Principiante: Restas simples de 1 dígito sin préstamo
      // Ejemplos: 9-3=6, 8-5=3, 7-2=5
      minuend = getRandomInt(5, 9);
      subtrahend = getRandomInt(1, minuend);
      maxDigits = 1;
      break;
      
    case 'elementary':
      // Nivel Elemental: Restas de 2 dígitos, algunas con préstamo simple
      // Ejemplos: 25-13=12, 42-18=24, 30-15=15
      if (Math.random() < 0.6) {
        // 60% con préstamo para practicar
        minuend = getRandomInt(20, 99);
        subtrahend = getRandomInt(10, minuend - 1);
        // Asegurar que requiera préstamo
        while (!requiresBorrow(minuend, subtrahend)) {
          subtrahend = getRandomInt(10, minuend - 1);
        }
      } else {
        // 40% sin préstamo
        minuend = getRandomInt(20, 99);
        subtrahend = getRandomInt(10, minuend - 1);
        // Asegurar que NO requiera préstamo
        while (requiresBorrow(minuend, subtrahend)) {
          subtrahend = getRandomInt(10, minuend - 1);
        }
      }
      maxDigits = 2;
      break;
      
    case 'intermediate':
      // Nivel Intermedio: Restas de 2-3 dígitos con préstamo múltiple
      // Ejemplos: 203-157=46, 400-263=137, 125-89=36
      if (Math.random() < 0.5) {
        // Números de 3 dígitos
        minuend = getRandomInt(100, 999);
        subtrahend = getRandomInt(50, minuend - 1);
      } else {
        // Números de 2 dígitos con préstamo garantizado
        minuend = getRandomInt(50, 99);
        subtrahend = getRandomInt(25, minuend - 1);
        while (!requiresBorrow(minuend, subtrahend)) {
          subtrahend = getRandomInt(25, minuend - 1);
        }
      }
      maxDigits = 3;
      break;
      
    case 'advanced':
      // Nivel Avanzado: Restas de 3-4 dígitos con préstamos complejos y ceros
      // Ejemplos: 1000-567=433, 2003-1456=547, 5000-2847=2153
      if (Math.random() < 0.4) {
        // Números con ceros en el medio (más difícil)
        const bases = [1000, 2000, 3000, 4000, 5000];
        minuend = bases[Math.floor(Math.random() * bases.length)] + getRandomInt(0, 99);
        subtrahend = getRandomInt(500, minuend - 100);
      } else {
        // Números de 4 dígitos normales
        minuend = getRandomInt(1000, 9999);
        subtrahend = getRandomInt(500, minuend - 100);
      }
      maxDigits = 4;
      break;
      
    case 'expert':
      // Nivel Experto: Restas de números grandes con múltiples préstamos y decimales
      // Ejemplos: 10000-7834=2166, 15.75-8.92=6.83, 25000-18467=6533
      if (Math.random() < 0.3) {
        // Números decimales
        minuend = parseFloat((getRandomInt(1000, 9999) / 100).toFixed(2));
        subtrahend = parseFloat((getRandomInt(500, Math.floor(minuend * 100) - 100) / 100).toFixed(2));
        maxDigits = 4;
      } else {
        // Números enteros grandes
        minuend = getRandomInt(10000, 99999);
        subtrahend = getRandomInt(5000, minuend - 1000);
        maxDigits = 5;
      }
      break;
      
    default:
      minuend = getRandomInt(5, 9);
      subtrahend = getRandomInt(1, minuend);
      maxDigits = 1;
  }
  
  const correctAnswer = minuend - subtrahend;
  const hasBorrow = requiresBorrow(minuend, subtrahend);
  const borrowPositions = hasBorrow ? getBorrowPositions(minuend, subtrahend) : [];
  
  // Calcular dígitos máximos de la respuesta
  const answerMaxDigits = correctAnswer.toString().length;
  
  return {
    id: generateUniqueId(),
    minuend,
    subtrahend,
    num1: minuend,    // Compatibilidad legacy
    num2: subtrahend, // Compatibilidad legacy
    correctAnswer,
    layout,
    answerMaxDigits,
    hasBorrow,
    borrowPositions,
    answerDecimalPosition: (minuend % 1 !== 0 || subtrahend % 1 !== 0) ? 2 : undefined
  };
}

// Función para verificar si una respuesta es correcta
export function checkAnswer(problem: SubtractionProblem, userAnswer: number): boolean {
  return Math.abs(userAnswer - problem.correctAnswer) < 0.01; // Tolerancia para decimales
}

// Función para obtener información de alineación vertical (similar al módulo Addition)
export function getVerticalAlignmentInfo(problem: SubtractionProblem) {
  // Verificar que el problema tenga las propiedades necesarias
  if (!problem || typeof problem.minuend === 'undefined' || typeof problem.subtrahend === 'undefined') {
    console.error('getVerticalAlignmentInfo: problema inválido', problem);
    return {
      minuendPadding: 0,
      subtrahendPadding: 0,
      answerPadding: 0,
      maxLength: 1,
      maxDigits: 1,
      digitPositions: [0]
    };
  }
  
  const minuendStr = problem.minuend.toString();
  const subtrahendStr = problem.subtrahend.toString();
  const answerStr = problem.correctAnswer.toString();
  
  const maxLength = Math.max(minuendStr.length, subtrahendStr.length, answerStr.length);
  
  return {
    minuendPadding: maxLength - minuendStr.length,
    subtrahendPadding: maxLength - subtrahendStr.length,
    answerPadding: maxLength - answerStr.length,
    maxDigits: maxLength,
    digitPositions: Array.from({ length: maxLength }, (_, i) => i)
  };
}

// Función de utilidad para formatear problemas de resta
export function formatSubtractionProblem(problem: SubtractionProblem, layout: ExerciseLayout = 'horizontal'): string {
  if (layout === 'horizontal') {
    return `${problem.minuend} - ${problem.subtrahend} = ?`;
  } else {
    const alignInfo = getVerticalAlignmentInfo(problem);
    const maxDigits = alignInfo.maxDigits || 1;
    const minuendPadded = problem.minuend.toString().padStart(maxDigits, ' ');
    const subtrahendPadded = problem.subtrahend.toString().padStart(maxDigits, ' ');
    
    return `  ${minuendPadded}\n- ${subtrahendPadded}\n${'='.repeat(maxDigits + 2)}`;
  }
}

// Alias para mantener compatibilidad con el sistema existente
export const generateAdditionProblem = generateSubtractionProblem;
export type AdditionProblem = SubtractionProblem;