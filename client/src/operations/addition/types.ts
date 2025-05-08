import { Problem } from './utils';

export interface AdditionExerciseProps {
  totalProblems: number;
  difficulty: "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
  timeLimit?: string;
  problemCount?: number;
  onComplete: (result: {
    score: number;
    totalProblems: number;
    timeSpent: number;
    difficulty: string;
  }) => void;
  showFeedbackMessage?: boolean;
  showImmediateFeedback?: boolean;
  enableCompensation?: boolean;
  showAnswerWithExplanation?: boolean;
  maxAttempts?: number;
  useTouchscreen?: boolean;
  enableSoundEffects?: boolean;
  enableAdaptiveDifficulty?: boolean;
  enableRewards?: boolean;
}

export interface VerticalProblem extends Problem {
  // Propiedades específicas para formato vertical
  maxIntLength: number;
  maxDecLength?: number;
  useDecimalFormat?: boolean;
}

export interface VerticalExerciseProps {
  problem: VerticalProblem;
  onSubmit: (userAnswer: number) => void;
  isActive: boolean;
  currentAttempts?: number;
  maxAttempts?: number;
  waitingForContinue: boolean;
  difficultyLevel: string;
}
