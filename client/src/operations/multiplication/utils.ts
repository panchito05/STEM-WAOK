import { Problem } from "./types";
import { getRandomInt } from "@/lib/utils";

export function generateMultiplicationProblem(difficulty: string): Problem {
  let num1: number;
  let num2: number;

  switch (difficulty) {
    case "beginner":
      // Single-digit multiplication (1-9)
      num1 = getRandomInt(1, 9);
      num2 = getRandomInt(1, 9);
      break;
    case "intermediate":
      // Multiplication with tables up to 12
      num1 = getRandomInt(2, 12);
      num2 = getRandomInt(2, 12);
      break;
    case "advanced":
      // Multiplication with at least one two-digit number
      if (Math.random() < 0.5) {
        // One-digit × two-digit
        num1 = getRandomInt(2, 9);
        num2 = getRandomInt(10, 30);
      } else {
        // Two-digit × one-digit or two-digit
        num1 = getRandomInt(10, 30);
        num2 = getRandomInt(2, 15);
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
    correctAnswer: num1 * num2
  };
}

export function checkAnswer(problem: Problem, userAnswer: number): boolean {
  return problem.correctAnswer === userAnswer;
}
