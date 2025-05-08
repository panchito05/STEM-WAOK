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
      
      // En nivel experto, tenemos tres formatos posibles: horizontal normal, vertical, o multi-vertical
      // Elegir aleatoriamente uno de estos formatos
      const formatMode = getRandomInt(1, 3);
      
      // Formato multi-vertical (números apilados)
      if (formatMode === 3) {
        layout = 'multi-vertical';
        
        // Determinar cuántos números apilar (de 2 a 5)
        const numberCount = getRandomInt(2, 5);
        
        // Array para números adicionales (además de num1 y num2)
        const additionalNums: number[] = [];
        
        // Generar números con diversos dígitos para apilar
        num1 = getRandomInt(1, 99); // primer número (pequeño)
        num2 = getRandomInt(10, 9999); // segundo número (más grande)
        
        // Generar números adicionales si se necesitan más de 2
        if (numberCount > 2) {
          for (let i = 0; i < numberCount - 2; i++) {
            // Generar números de diferentes longitudes
            let addNum: number;
            
            switch (getRandomInt(1, 4)) {
              case 1: addNum = getRandomInt(1, 9); break; // 1 dígito
              case 2: addNum = getRandomInt(10, 99); break; // 2 dígitos
              case 3: addNum = getRandomInt(100, 999); break; // 3 dígitos
              case 4: addNum = getRandomInt(1000, 9999); break; // 4 dígitos
              default: addNum = getRandomInt(1, 99);
            }
            
            additionalNums.push(addNum);
          }
        }
        
        // Calcular la suma total incluyendo todos los números
        const allNumbers = [num1, num2, ...additionalNums];
        const total = allNumbers.reduce((sum, num) => sum + num, 0);
        
        // Registrar los detalles para depuración
        console.log("[MULTI-VERTICAL] Generando problema con números:", allNumbers);
        console.log("[MULTI-VERTICAL] Suma total:", total);
        
        // Usar la suma total como la respuesta correcta
        const totalAnswer = total;
        
        // Retornar problema multi-vertical especial
        return {
          num1,
          num2, 
          correctAnswer: totalAnswer,
          layout,
          additionalNumbers: additionalNums
        };
      }
      // Para formatos tradicionales (horizontal o vertical)
      else {
        // 35% de probabilidad de usar decimales en nivel experto
        useDecimals = Math.random() < 0.35;
        
        // 60% probabilidad de formato vertical en nivel experto (para formato tradicional)
        if (formatMode === 2) {
          layout = 'vertical';
        }
        
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
    correctAnswer,
    layout
  };
}

export function checkAnswer(problem: Problem, userAnswer: number): boolean {
  // TRUCO ESPECIAL: Si la respuesta del usuario es exactamente igual a la respuesta correcta
  // esto significa que nuestro componente MultiVerticalExercise ha verificado la respuesta 
  // y ha decidido que es correcta, así que aceptamos sin más comprobaciones
  if (userAnswer === problem.correctAnswer) {
    console.log(`[CHECK] Respuesta idéntica a la correcta, aceptando automáticamente.`);
    return true;
  }
  
  // Para formato multi-vertical, hacer una comprobación especial con logs para depuración
  if ((problem as AdditionProblem).layout === 'multi-vertical') {
    const additionalNumbers = (problem as AdditionProblem).additionalNumbers || [];
    const allNumbers = [problem.num1, problem.num2, ...additionalNumbers];
    
    // Recalcular la suma total para verificar
    const calculatedSum = allNumbers.reduce((sum, num) => sum + num, 0);
    
    console.log(`[MULTI-VERTICAL] Verificando respuesta multi-vertical:`);
    console.log(`[MULTI-VERTICAL] - Números:`, allNumbers);
    console.log(`[MULTI-VERTICAL] - Suma calculada:`, calculatedSum);
    console.log(`[MULTI-VERTICAL] - Respuesta correcta almacenada:`, problem.correctAnswer);
    console.log(`[MULTI-VERTICAL] - Respuesta del usuario:`, userAnswer);
    
    // Usar el valor calculado para la comparación con una pequeña tolerancia
    return Math.abs(calculatedSum - userAnswer) < 0.01;
  }
  
  // Para números enteros, comparación directa
  if (Number.isInteger(problem.correctAnswer) && Number.isInteger(userAnswer)) {
    return problem.correctAnswer === userAnswer;
  } 
  
  // Para números decimales, permitir una pequeña tolerancia debido a errores de punto flotante
  // Redondear ambos números a 2 decimales para la comparación
  const correctRounded = parseFloat(problem.correctAnswer.toFixed(2));
  const userRounded = parseFloat(userAnswer.toFixed(2));
  
  console.log(`[DECIMALS] Comparando respuestas: Correcta=${correctRounded}, Usuario=${userRounded}`);
  
  return correctRounded === userRounded;
}
