// types.ts - Empty Module
export type DifficultyLevel = "beginner" | "elementary" | "intermediate" | "advanced" | "expert";

export interface Problem {
  id: string;
  operands: number[];
  correctAnswer: number;
  layout: 'horizontal' | 'vertical';
  difficulty: DifficultyLevel;
  index?: number;
  total?: number;
  displayFormat?: string;
  allowDecimals?: boolean;
  maxAttempts?: number;
  answerMaxDigits?: number;
  answerDecimalPosition?: number;
}

export interface EmptyProblem extends Problem {
  // Specific properties for empty module problems
  problemType: 'empty';
  instructions?: string;
}

export interface UserAnswer {
  problemId: string;
  problem: EmptyProblem;
  userAnswer: number;
  isCorrect: boolean;
  status: 'correct' | 'incorrect' | 'revealed' | 'skipped';
  attempts: number;
  timestamp: number;
  timeTaken?: number;
}

export type UserAnswerType = UserAnswer;

export interface ModuleStats {
  totalProblems: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageTime: number;
  streak: number;
  longestStreak: number;
}

export interface ExerciseConfig {
  difficulty: DifficultyLevel;
  problemCount: number;
  timeLimit?: number;
  showHints?: boolean;
  allowRetries?: boolean;
}