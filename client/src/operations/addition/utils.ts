import { Problem } from "./types";
import { getRandomInt } from "@/lib/utils";

export function generateAdditionProblem(difficulty: string): Problem {
  let num1: number;
  let num2: number;

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
      num1 = getRandomInt(1000, 6000);
      num2 = getRandomInt(1000, 9000);
      break;
      
    case "expert":
      // Three-digit addition with carrying (238+347, 581+629)
      // Ejemplo: 70960 + 11650 = ?, 28730 + 59436 = ?
      // Nota: los ejemplos son números muy grandes, ajustamos para que coincida
      num1 = getRandomInt(10000, 80000);
      num2 = getRandomInt(10000, 60000);
      break;
      
    default:
      // Default to beginner level
      num1 = getRandomInt(1, 9);
      num2 = getRandomInt(1, 9);
  }

  return {
    num1,
    num2,
    correctAnswer: num1 + num2
  };
}

export function checkAnswer(problem: Problem, userAnswer: number): boolean {
  return problem.correctAnswer === userAnswer;
}
