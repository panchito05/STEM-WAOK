export interface Problem {
  num1: number;
  num2: number;
  correctAnswer: number;
}

export interface UserAnswer {
  problem: Problem;
  userAnswer: number;
  isCorrect: boolean;
}
