export type AssociativeLanguage = 'english' | 'spanish';

export type AssociativeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type AssociativeLevel = 1 | 2 | 3 | 4 | 5;

export type OperationType = 'addition' | 'multiplication';

export interface AssociativeExpressionGroup {
  values: number[];
  grouping: 'left' | 'right'; // (a + b) + c vs a + (b + c)
}

export interface AssociativeProblem {
  id: string;
  operation: OperationType;
  leftExpression: AssociativeExpressionGroup;
  rightExpression: AssociativeExpressionGroup;
  correctAnswer: number;
  level: AssociativeLevel;
  difficulty: AssociativeDifficulty;
  values: number[]; // [a, b, c] for expressions like (a + b) + c
  displayFormat: 'numeric' | 'visual' | 'mixed';
}

export interface AssociativeSettings {
  language: AssociativeLanguage;
  difficulty: AssociativeDifficulty;
  level: AssociativeLevel;
  operation: OperationType;
  showSteps: boolean;
  showVisualAids: boolean;
  enableHints: boolean;
  maxProblems: number;
  timeLimit: number; // in seconds, 0 means no limit
  autoAdvance: boolean;
  soundEnabled: boolean;
}

export interface AssociativeProgress {
  currentLevel: AssociativeLevel;
  currentProblemIndex: number;
  completedProblems: string[];
  totalCorrectAnswers: number;
  totalAttempts: number;
  longestStreak: number;
  currentStreak: number;
  timeSpent: number; // in seconds
  lastActivity: Date;
  levelProgress: {
    [key in AssociativeLevel]: {
      completed: boolean;
      score: number;
      timeSpent: number;
    }
  };
}

export interface AssociativeAnswer {
  problemId: string;
  userAnswer: number | string;
  isCorrect: boolean;
  attempts: number;
  timeSpent: number;
  timestamp: Date;
  method?: 'calculation' | 'grouping' | 'pattern_recognition';
}

export interface VisualElement {
  id: string;
  type: 'animal' | 'object' | 'number';
  value: number;
  emoji: string;
  color: string;
}

export interface GroupingDisplay {
  leftGroup: VisualElement[];
  rightGroup: VisualElement[];
  operation: OperationType;
  result: number;
}

// Level-specific types
export interface Level1Activity {
  type: 'visual_grouping';
  elements: VisualElement[];
  groupings: GroupingDisplay[];
  question: string;
}

export interface Level2Activity {
  type: 'numeric_introduction';
  expression1: string;
  expression2: string;
  showCalculation: boolean;
  question: string;
}

export interface Level3Activity {
  type: 'guided_practice';
  incompleteExpression: string;
  options: string[];
  correctOption: string;
  question: string;
}

export interface Level4Activity {
  type: 'mental_calculation';
  numbers: number[];
  hint: string;
  strategy: string;
  question: string;
}

export interface Level5Activity {
  type: 'creative_expression';
  targetResult: number;
  availableNumbers: number[];
  requiredExpressions: number; // how many equivalent expressions to create
  question: string;
}

export type ActivityType = Level1Activity | Level2Activity | Level3Activity | Level4Activity | Level5Activity;