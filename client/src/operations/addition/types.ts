export type DifficultyLevel = "beginner" | "elementary" | "intermediate" | "advanced" | "expert";

export type ExerciseLayout = "horizontal" | "vertical" | "multi-vertical";

export interface Problem {
  num1: number;
  num2: number;
  correctAnswer: number;
}

export interface AdditionProblem extends Problem {
  // Para posibles extensiones específicas de adición
  layout?: ExerciseLayout;
  // Para el formato multi-vertical, números adicionales opcionales
  additionalNumbers?: number[];
}

export interface UserAnswer {
  problem: Problem;
  userAnswer: number;
  isCorrect: boolean;
}
