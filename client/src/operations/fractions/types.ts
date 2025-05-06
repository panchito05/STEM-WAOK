export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface Problem {
  type: "addition" | "subtraction" | "comparison";
  fraction1: Fraction;
  fraction2: Fraction;
  correctAnswer: Fraction;
  // For comparison type, we use 0 for <, 1 for =, 2 for >
  comparisonResult?: number;
}

export interface UserAnswer {
  problem: Problem;
  userNumerator: number;
  userDenominator: number;
  isCorrect: boolean;
}
