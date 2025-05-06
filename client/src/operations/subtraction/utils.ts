import { Problem } from "./types";
import { getRandomInt } from "@/lib/utils";

export function generateSubtractionProblem(difficulty: string): Problem {
  let num1: number;
  let num2: number;

  switch (difficulty) {
    case "beginner":
      // Single-digit subtraction with positive answers
      num2 = getRandomInt(1, 9);
      num1 = getRandomInt(num2, 9); // Ensure num1 >= num2 for positive results
      break;
    case "intermediate":
      // Two-digit subtraction without borrowing (each digit of num1 is >= corresponding digit of num2)
      const ones1 = getRandomInt(0, 9);
      const ones2 = getRandomInt(0, ones1); // Ensure ones1 >= ones2
      
      const tens1 = getRandomInt(1, 9);
      const tens2 = getRandomInt(0, tens1); // Ensure tens1 >= tens2
      
      num1 = tens1 * 10 + ones1;
      num2 = tens2 * 10 + ones2;
      break;
    case "advanced":
      // Two-digit subtraction with borrowing
      num1 = getRandomInt(11, 99);
      
      // Force borrowing by ensuring at least one digit requires borrowing
      // Make sure ones digit of num2 > ones digit of num1
      const onesDigit1 = num1 % 10;
      const tensDigit1 = Math.floor(num1 / 10);
      
      if (tensDigit1 > 0) { // Ensure we can borrow
        const onesDigit2 = getRandomInt(onesDigit1 + 1, 9); // Ones digit of num2 > ones digit of num1
        const tensDigit2 = getRandomInt(0, tensDigit1 - 1); // Tens digit of num2 < tens digit of num1
        
        num2 = tensDigit2 * 10 + onesDigit2;
      } else {
        // If tensDigit1 is 0, we can't do borrowing, so fall back to intermediate
        const ones1 = getRandomInt(0, 9);
        const ones2 = getRandomInt(0, ones1);
        
        const tens1 = getRandomInt(1, 9);
        const tens2 = getRandomInt(0, tens1);
        
        num1 = tens1 * 10 + ones1;
        num2 = tens2 * 10 + ones2;
      }
      break;
    default:
      // Default to beginner level
      num2 = getRandomInt(1, 9);
      num1 = getRandomInt(num2, 9);
  }

  return {
    num1,
    num2,
    correctAnswer: num1 - num2
  };
}

export function checkAnswer(problem: Problem, userAnswer: number): boolean {
  return problem.correctAnswer === userAnswer;
}
