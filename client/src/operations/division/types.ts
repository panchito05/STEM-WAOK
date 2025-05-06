export interface Problem {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
}

export interface UserAnswer {
  problem: Problem;
  userQuotient: number;
  userRemainder: number;
  isCorrect: boolean;
}
