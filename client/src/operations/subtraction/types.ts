export interface SubtractionProblem {
  id: string;
  operands: number[];
  correctAnswer: number;
  difficulty: "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
  created: number;
  allowsNegativeResults: boolean;
  requiresBorrowing: boolean;
  hasDecimals: boolean;
}

export interface SubtractionSettings {
  difficulty: "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
  problemCount: number;
  timeLimit: "per-problem";
  timeValue: number;
  maxAttempts: number;
  showImmediateFeedback: boolean;
  enableSoundEffects: boolean;
  showAnswerWithExplanation: boolean;
  enableAdaptiveDifficulty: boolean;
  enableCompensation: boolean;
  enableRewards: boolean;
  rewardType: "medals" | "trophies" | "stars";
  language: "english" | "spanish";
  allowNegativeResults: boolean;
}

export interface SubtractionExerciseState {
  currentProblemIndex: number;
  problems: SubtractionProblem[];
  userAnswers: Array<{
    problemId: string;
    userAnswer: number | null;
    isCorrect: boolean;
    attempts: number;
    timeSpent: number;
    hintsUsed: number;
    status: 'pending' | 'correct' | 'incorrect' | 'revealed' | 'skipped';
  }>;
  exerciseStartTime: number;
  isComplete: boolean;
  score: {
    correct: number;
    incorrect: number;
    revealed: number;
    total: number;
    percentage: number;
  };
}

export interface SubtractionStats {
  totalProblems: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageTime: number;
  streak: number;
  longestStreak: number;
  difficultyProgress: Record<string, {
    attempted: number;
    correct: number;
    percentage: number;
  }>;
}