export interface AlphabetItem {
  id: string;
  letter: string;
  lowercase: string;
  word: {
    english: string;
    spanish: string;
  };
  image: {
    svg: string;
    alt: {
      english: string;
      spanish: string;
    };
  };
  color: string;
  pronunciation: {
    english: string;
    spanish: string;
  };
}

export interface AlphabetProgress {
  letterVisited: boolean;
  completed: boolean;
  attempts: number;
  correctAnswers: number;
  lastVisited: number;
  mode: 'exploration' | 'guided' | 'quiz';
}

export interface AlphabetSettings {
  level: 'beginner' | 'intermediate' | 'advanced';
  showLowercase: boolean;
  showColors: boolean;
  audioEnabled: boolean;
  fontStyle: 'basic' | 'decorative' | 'handwriting';
  autoAdvance: boolean;
  celebrateCompletion: boolean;
  quizFrequency: 'never' | 'occasionally' | 'frequent';
  language: 'english' | 'spanish';
}

export interface AlphabetAnswer {
  id: string;
  letterId: string;
  letter: AlphabetItem;
  userAnswer?: string;
  isCorrect?: boolean;
  mode: 'exploration' | 'guided' | 'quiz';
  timestamp: number;
  attempts: number;
  timeSpent: number;
}

export type AlphabetMode = 'exploration' | 'guided' | 'quiz';

export interface AlphabetState {
  currentLetterIndex: number;
  mode: AlphabetMode;
  progress: Record<string, AlphabetProgress>;
  history: AlphabetAnswer[];
  completedLetters: string[];
  isCompleted: boolean;
}