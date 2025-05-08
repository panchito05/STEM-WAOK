export type DifficultyLevel = "beginner" | "elementary" | "intermediate" | "advanced" | "expert";

export type ExerciseLayout = "horizontal" | "vertical";

export interface Problem {
  num1: number;
  num2: number;
  correctAnswer: number;
}

export interface AdditionProblem extends Problem {
  // Para posibles extensiones específicas de adición
  layout?: ExerciseLayout;
}

export interface UserAnswer {
  problem: Problem;
  userAnswer: number;
  isCorrect: boolean;
}
