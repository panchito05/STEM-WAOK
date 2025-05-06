import { Problem, Fraction } from "./types";
import { getRandomInt } from "@/lib/utils";

// Function to find the greatest common divisor (GCD)
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b > a) {
    const temp = a;
    a = b;
    b = temp;
  }
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// Function to find the least common multiple (LCM)
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

// Function to simplify a fraction
export function simplifyFraction(fraction: Fraction): Fraction {
  const divisor = gcd(fraction.numerator, fraction.denominator);
  
  // Handle negative fractions - ensure the negative sign is in the numerator
  if (fraction.denominator < 0) {
    return {
      numerator: -fraction.numerator / divisor,
      denominator: -fraction.denominator / divisor
    };
  }
  
  return {
    numerator: fraction.numerator / divisor,
    denominator: fraction.denominator / divisor
  };
}

// Function to add fractions
export function addFractions(fraction1: Fraction, fraction2: Fraction): Fraction {
  const commonDenominator = lcm(fraction1.denominator, fraction2.denominator);
  const newNumerator1 = fraction1.numerator * (commonDenominator / fraction1.denominator);
  const newNumerator2 = fraction2.numerator * (commonDenominator / fraction2.denominator);
  
  return simplifyFraction({
    numerator: newNumerator1 + newNumerator2,
    denominator: commonDenominator
  });
}

// Function to subtract fractions
export function subtractFractions(fraction1: Fraction, fraction2: Fraction): Fraction {
  const commonDenominator = lcm(fraction1.denominator, fraction2.denominator);
  const newNumerator1 = fraction1.numerator * (commonDenominator / fraction1.denominator);
  const newNumerator2 = fraction2.numerator * (commonDenominator / fraction2.denominator);
  
  return simplifyFraction({
    numerator: newNumerator1 - newNumerator2,
    denominator: commonDenominator
  });
}

// Function to compare fractions
export function compareFractions(fraction1: Fraction, fraction2: Fraction): number {
  const commonDenominator = lcm(fraction1.denominator, fraction2.denominator);
  const newNumerator1 = fraction1.numerator * (commonDenominator / fraction1.denominator);
  const newNumerator2 = fraction2.numerator * (commonDenominator / fraction2.denominator);
  
  if (newNumerator1 < newNumerator2) {
    return 0; // fraction1 < fraction2
  } else if (newNumerator1 > newNumerator2) {
    return 2; // fraction1 > fraction2
  } else {
    return 1; // fraction1 = fraction2
  }
}

// Generate a random fraction based on difficulty
export function generateRandomFraction(difficulty: string): Fraction {
  let numerator: number;
  let denominator: number;
  
  switch (difficulty) {
    case "beginner":
      numerator = getRandomInt(1, 5);
      denominator = getRandomInt(2, 6);
      break;
    case "intermediate":
      numerator = getRandomInt(1, 8);
      denominator = getRandomInt(2, 10);
      break;
    case "advanced":
      numerator = getRandomInt(1, 12);
      denominator = getRandomInt(2, 16);
      // Occasionally use negative numbers for advanced
      if (getRandomInt(1, 10) > 7) {
        numerator *= -1;
      }
      break;
    default:
      numerator = getRandomInt(1, 5);
      denominator = getRandomInt(2, 6);
  }
  
  return simplifyFraction({ numerator, denominator });
}

// Generate a fraction problem based on difficulty and type
export function generateFractionProblem(difficulty: string, type?: string): Problem {
  // If type is not provided, randomly select one
  if (!type || type === "mixed") {
    const types = ["addition", "subtraction", "comparison"];
    type = types[getRandomInt(0, 2)];
  }
  
  const fraction1 = generateRandomFraction(difficulty);
  const fraction2 = generateRandomFraction(difficulty);
  let correctAnswer: Fraction;
  let comparisonResult: number | undefined;
  
  switch (type) {
    case "addition":
      correctAnswer = addFractions(fraction1, fraction2);
      break;
    case "subtraction":
      correctAnswer = subtractFractions(fraction1, fraction2);
      break;
    case "comparison":
      comparisonResult = compareFractions(fraction1, fraction2);
      // For comparison problems, the "correctAnswer" is a code for the result
      // 0: <, 1: =, 2: >
      correctAnswer = {
        numerator: comparisonResult,
        denominator: 1
      };
      break;
    default:
      correctAnswer = addFractions(fraction1, fraction2);
  }
  
  return {
    type: type as "addition" | "subtraction" | "comparison",
    fraction1,
    fraction2,
    correctAnswer,
    comparisonResult
  };
}

export function checkAnswer(problem: Problem, userNumerator: number, userDenominator: number): boolean {
  if (problem.type === "comparison") {
    // For comparison problems, we check if the user selected the correct relation
    return userNumerator === problem.correctAnswer.numerator;
  }
  
  // For addition and subtraction, we need to check if the user's answer is equivalent
  // to the correct answer (might be in a different but equivalent form)
  
  // First, ensure the user's denominator is not zero
  if (userDenominator === 0) {
    return false;
  }
  
  // Simplify the user's answer
  const userAnswer = simplifyFraction({
    numerator: userNumerator,
    denominator: userDenominator
  });
  
  // Compare the simplified fractions
  return (
    userAnswer.numerator === problem.correctAnswer.numerator &&
    userAnswer.denominator === problem.correctAnswer.denominator
  );
}
