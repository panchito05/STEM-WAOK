import { Problem } from "./types";
import { getRandomInt } from "@/lib/utils";

export function generateDivisionProblem(difficulty: string): Problem {
  let dividend: number;
  let divisor: number;
  let quotient: number;
  let remainder: number;

  switch (difficulty) {
    case "beginner":
      // Simple division without remainders
      divisor = getRandomInt(2, 10);
      quotient = getRandomInt(1, 10);
      remainder = 0;
      dividend = divisor * quotient;
      break;
    case "intermediate":
      // Division with potential remainders
      divisor = getRandomInt(2, 12);
      quotient = getRandomInt(2, 12);
      remainder = getRandomInt(0, divisor - 1); // Remainder should be less than divisor
      dividend = divisor * quotient + remainder;
      break;
    case "advanced":
      // Complex division with larger numbers
      divisor = getRandomInt(5, 20);
      quotient = getRandomInt(5, 15);
      remainder = getRandomInt(0, divisor - 1);
      dividend = divisor * quotient + remainder;
      break;
    default:
      // Default to beginner level
      divisor = getRandomInt(2, 10);
      quotient = getRandomInt(1, 10);
      remainder = 0;
      dividend = divisor * quotient;
  }

  return {
    dividend,
    divisor,
    quotient,
    remainder
  };
}

export function checkAnswer(problem: Problem, userQuotient: number, userRemainder: number): boolean {
  return problem.quotient === userQuotient && problem.remainder === userRemainder;
}
