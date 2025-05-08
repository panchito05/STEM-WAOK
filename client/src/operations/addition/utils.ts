import { Problem } from "./types";
import { getRandomInt } from "@/lib/utils";

// Función para generar un número decimal aleatorio con 1 o 2 decimales
function getRandomDecimal(min: number, max: number, decimals: 1 | 2): number {
  const base = getRandomInt(min, max);
  const decimalPart = decimals === 1 
    ? getRandomInt(1, 9) / 10  // Para 1 decimal: 0.1, 0.2, ..., 0.9
    : getRandomInt(10, 99) / 100; // Para 2 decimales: 0.10, 0.11, ..., 0.99
  
  return base + decimalPart;
}

export function generateAdditionProblem(difficulty: string): Problem {
  let num1: number;
  let num2: number;
  let useDecimals = false;

  switch (difficulty) {
    case "beginner":
      // Single-digit addition (1+1 to 9+9)
      // Ejemplo: 1 + 8 = ?, 7 + 5 = ?
      num1 = getRandomInt(1, 9);
      num2 = getRandomInt(1, 9);
      break;
      
    case "elementary":
      // Two-digit + single-digit, no carrying (21+3, 45+4)
      // Ejemplo: 12 + 15 = ?, 24 + 13 = ?
      // Nota: los ejemplos no coinciden exactamente con la descripción, ajustamos para que coincida con los ejemplos
      num1 = getRandomInt(10, 30);
      num2 = getRandomInt(10, 20);
      break;
      
    case "intermediate":
      // Two-digit + two-digit, no carrying (21+34, 45+54)
      // Ejemplo: 65 + 309 = ?, 392 + 132 = ?
      // Nota: los ejemplos no coinciden exactamente con la descripción, ajustamos para que coincida con los ejemplos
      num1 = getRandomInt(50, 400);
      num2 = getRandomInt(100, 400);
      break;
      
    case "advanced":
      // Two-digit + two-digit with carrying (27+85, 38+67)
      // Ejemplo: 1247 + 3568 = ?, 5934 + 8742 = ?
      // Nota: los ejemplos son números grandes de 4 dígitos, ajustamos para que coincida
      
      // 20% de probabilidad de usar decimales en nivel avanzado
      useDecimals = Math.random() < 0.2;
      
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

  // Si estamos usando decimales, asegurarse de que la respuesta se redondee a 2 decimales 
  // para evitar errores de punto flotante
  const correctAnswer = useDecimals 
    ? parseFloat((num1 + num2).toFixed(2)) 
    : num1 + num2;

  return {
    num1,
    num2,
    correctAnswer
  };
}

export function checkAnswer(problem: Problem, userAnswer: number): boolean {
  return problem.correctAnswer === userAnswer;
}
