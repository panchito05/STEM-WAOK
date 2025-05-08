import { Problem, AdditionProblem, DifficultyLevel, ExerciseLayout } from "./types";
import { getRandomInt } from "@/lib/utils";

// Función para generar un número decimal aleatorio con 1 o 2 decimales
function getRandomDecimal(min: number, max: number, decimals: 1 | 2): number {
  const base = getRandomInt(min, max);
  const decimalPart = decimals === 1 
    ? getRandomInt(1, 9) / 10  // Para 1 decimal: 0.1, 0.2, ..., 0.9
    : getRandomInt(10, 99) / 100; // Para 2 decimales: 0.10, 0.11, ..., 0.99
  
  return base + decimalPart;
}

export function generateAdditionProblem(difficulty: string): AdditionProblem {
  let num1: number;
  let num2: number;
  let useDecimals = false;
  let layout: ExerciseLayout = 'horizontal'; // Por defecto

  switch (difficulty) {
    case "beginner":
      // Single-digit addition (1+1 to 9+9)
      // Ejemplo: 1 + 8 = ?, 7 + 5 = ?
      num1 = getRandomInt(1, 9);
      num2 = getRandomInt(1, 9);
      // Formato horizontal siempre para principiantes
      layout = 'horizontal';
      break;
      
    case "elementary":
      // Two-digit + single-digit, no carrying (21+3, 45+4)
      // Ejemplo: 12 + 15 = ?, 24 + 13 = ?
      // Nota: los ejemplos no coinciden exactamente con la descripción, ajustamos para que coincida con los ejemplos
      num1 = getRandomInt(10, 30);
      num2 = getRandomInt(10, 20);
      // Formato horizontal siempre para nivel elemental
      layout = 'horizontal';
      break;
      
    case "intermediate":
      // Two-digit + two-digit, no carrying (21+34, 45+54)
      // Ejemplo: 65 + 309 = ?, 392 + 132 = ?
      // Nota: los ejemplos no coinciden exactamente con la descripción, ajustamos para que coincida con los ejemplos
      num1 = getRandomInt(50, 400);
      num2 = getRandomInt(100, 400);
      // 50% de probabilidad de usar formato vertical desde nivel intermedio
      layout = Math.random() < 0.5 ? 'vertical' : 'horizontal';
      break;
      
    case "advanced":
      // Two-digit + two-digit with carrying (27+85, 38+67)
      // Ejemplo: 1247 + 3568 = ?, 5934 + 8742 = ?
      // Nota: los ejemplos son números grandes de 4 dígitos, ajustamos para que coincida
      
      // 20% de probabilidad de usar decimales en nivel avanzado
      useDecimals = Math.random() < 0.2;
      
      // 60% de probabilidad de usar formato vertical en nivel avanzado
      layout = Math.random() < 0.6 ? 'vertical' : 'horizontal';
      
      if (useDecimals) {
        // Decisión aleatoria sobre qué número tendrá decimales (o ambos)
        const decimalMode = getRandomInt(1, 3);
        const decimalPlaces = Math.random() < 0.5 ? 1 : 2; // 50% chance for 1 decimal, 50% for 2
        
        if (decimalMode === 1 || decimalMode === 3) { // Primer número o ambos
          num1 = getRandomDecimal(100, 1000, decimalPlaces as 1 | 2);
        } else {
          num1 = getRandomInt(100, 1000);
        }
        
        if (decimalMode === 2 || decimalMode === 3) { // Segundo número o ambos
          num2 = getRandomDecimal(100, 1000, decimalPlaces as 1 | 2);
        } else {
          num2 = getRandomInt(100, 1000);
        }
        
        console.log(`[DECIMALS] Generando problema con decimales: ${num1} + ${num2}`);
      } else {
        num1 = getRandomInt(1000, 6000);
        num2 = getRandomInt(1000, 9000);
      }
      break;
      
    case "expert":
      // Three-digit addition with carrying (238+347, 581+629)
      // Ejemplo: 70960 + 11650 = ?, 28730 + 59436 = ?
      // Nota: los ejemplos son números muy grandes, ajustamos para que coincida
      
      // 35% de probabilidad de usar decimales en nivel experto
      useDecimals = Math.random() < 0.35;
      
      // 70% de probabilidad de usar formato vertical en nivel experto
      layout = Math.random() < 0.7 ? 'vertical' : 'horizontal';
      
      if (useDecimals) {
        // Decisión aleatoria sobre qué número tendrá decimales (o ambos)
        const decimalMode = getRandomInt(1, 3);
        const decimalPlaces = Math.random() < 0.5 ? 1 : 2; // 50% chance for 1 decimal, 50% for 2
        
        if (decimalMode === 1 || decimalMode === 3) { // Primer número o ambos
          num1 = getRandomDecimal(1000, 10000, decimalPlaces as 1 | 2);
        } else {
          num1 = getRandomInt(1000, 10000);
        }
        
        if (decimalMode === 2 || decimalMode === 3) { // Segundo número o ambos
          num2 = getRandomDecimal(1000, 10000, decimalPlaces as 1 | 2);
        } else {
          num2 = getRandomInt(1000, 10000);
        }
        
        console.log(`[DECIMALS] Generando problema con decimales: ${num1} + ${num2}`);
      } else {
        num1 = getRandomInt(10000, 80000);
        num2 = getRandomInt(10000, 60000);
      }
      break;
      
    default:
      // Default to beginner level
      num1 = getRandomInt(1, 9);
      num2 = getRandomInt(1, 9);
  }

  // Si estamos usando decimales, manejar cuidadosamente para evitar errores de punto flotante
  let correctAnswer: number;
  
  if (useDecimals) {
    // Para operaciones con decimales, calcular con precisión
    // Convertir a cadena, aplicar toFixed(2) y luego volver a convertir a número
    const sum = num1 + num2;
    const preciseSum = parseFloat(sum.toFixed(2));
    
    // Registrar el cálculo para debug
    console.log(`[DECIMALS] Cálculo decimal: ${num1} + ${num2} = ${sum} → ${preciseSum}`);
    
    correctAnswer = preciseSum;
  } else {
    // Para números enteros, la suma directa es suficiente
    correctAnswer = num1 + num2;
  }

  return {
    num1,
    num2,
    correctAnswer,
    layout
  };
}

export function checkAnswer(problem: Problem, userAnswer: number): boolean {
  console.log(`[CHECK_ANSWER] Verificando respuesta: Correcta=${problem.correctAnswer}, Usuario=${userAnswer}`);
  
  // Para números enteros, comparación directa
  if (Number.isInteger(problem.correctAnswer) && Number.isInteger(userAnswer)) {
    const result = problem.correctAnswer === userAnswer;
    console.log(`[CHECK_ANSWER] Comparación de enteros: ${result ? "CORRECTA" : "INCORRECTA"}`);
    return result;
  }
  
  // Si la respuesta correcta es decimal pero el usuario ingresó un entero,
  // podemos verificar si el entero es un redondeo válido de la respuesta decimal
  if (!Number.isInteger(problem.correctAnswer) && Number.isInteger(userAnswer)) {
    const roundedCorrect = Math.round(problem.correctAnswer);
    
    if (roundedCorrect === userAnswer) {
      console.log(`[CHECK_ANSWER] Usuario ingresó el valor redondeado correcto: ${userAnswer} vs ${problem.correctAnswer}`);
      // Podemos ser flexibles si el usuario ingresó el redondeo correcto
      return true;
    }
  }
  
  // Para números decimales, permitir una pequeña tolerancia debido a errores de punto flotante
  // Redondear ambos números a 2 decimales para la comparación
  const correctRounded = parseFloat(problem.correctAnswer.toFixed(2));
  const userRounded = parseFloat(userAnswer.toFixed(2));
  
  console.log(`[CHECK_ANSWER] Comparando respuestas decimales: Correcta=${correctRounded}, Usuario=${userRounded}`);
  
  // Primera verificación: exactamente igual después de redondear a 2 decimales
  if (correctRounded === userRounded) {
    console.log(`[CHECK_ANSWER] Respuestas exactamente iguales con 2 decimales`);
    return true;
  }
  
  // Segunda verificación: permitir un margen de error muy pequeño para problemas de punto flotante
  const tolerance = 0.005; // Tolerancia de ±0.005 (medio centésimo)
  const areApproximatelyEqual = Math.abs(correctRounded - userRounded) < tolerance;
  
  console.log(`[CHECK_ANSWER] Diferencia: ${Math.abs(correctRounded - userRounded)}, Tolerancia: ${tolerance}`);
  console.log(`[CHECK_ANSWER] Comparación con tolerancia: ${areApproximatelyEqual ? "CORRECTA" : "INCORRECTA"}`);
  
  return areApproximatelyEqual;
}
