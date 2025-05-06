import { Problem } from "./types";
import { getRandomInt } from "@/lib/utils";

export function generateAdditionProblem(difficulty: string): Problem {
  let num1: number;
  let num2: number;

  switch (difficulty) {
    case "beginner":
      // Single-digit addition (1-9)
      num1 = getRandomInt(1, 9);
      num2 = getRandomInt(1, 9);
      break;
    case "intermediate":
      // Two-digit addition without carrying (no sum > 9 in any column)
      // First, generate the ones digit ensuring their sum is < 10
      const ones1 = getRandomInt(0, 8);
      const ones2 = getRandomInt(0, 9 - ones1);
      
      // Then, generate the tens digit
      const tens1 = getRandomInt(1, 9);
      const tens2 = getRandomInt(1, 9);
      
      num1 = tens1 * 10 + ones1;
      num2 = tens2 * 10 + ones2;
      break;
    case "advanced":
      // Two-digit addition with carrying
      num1 = getRandomInt(10, 99);
      num2 = getRandomInt(10, 99);
      
      // Force carrying by ensuring the ones digits sum to at least 10
      if ((num1 % 10) + (num2 % 10) < 10) {
        // Adjust the ones digit of num2 to force a carry
        const onesDigit1 = num1 % 10;
        const tensDigit2 = Math.floor(num2 / 10);
        num2 = tensDigit2 * 10 + (10 - onesDigit1 + getRandomInt(0, 9));
      }
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
