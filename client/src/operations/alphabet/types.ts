// Types for Alphabet Learning Module
export type AlphabetLanguage = 'spanish' | 'english';
export type AlphabetLevel = 1 | 2 | 3 | 4 | 5;

export interface AlphabetLetter {
  id: string;
  letter: string;
  lowercase: string;
  words: {
    spanish: string;
    english: string;
  };
  images: {
    spanish: string; // SVG or image path
    english: string; // SVG or image path
  };
  pronunciation: {
    spanish: string; // Audio file path or phonetic
    english: string; // Audio file path or phonetic
  };
  color: string;
}

export interface AlphabetSettings {
  language: AlphabetLanguage;
  level: AlphabetLevel;
  showBothLanguages: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  audioEnabled: boolean;
  showImages: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  celebrateCompletion: boolean;
}

export interface AlphabetProgress {
  currentLevel: AlphabetLevel;
  currentLetterIndex: number;
  completedLetters: string[];
  totalCorrectAnswers: number;
  totalAttempts: number;
  longestStreak: number;
  currentStreak: number;
  timeSpent: number;
  lastActivity: Date;
}

export interface AlphabetExerciseProps {
  settings: AlphabetSettings;
  onOpenSettings: () => void;
}

export interface AlphabetSettingsProps {
  settings: AlphabetSettings;
  onBack: () => void;
}

// Level-specific interfaces
export interface Level1Activity {
  type: 'recognition';
  letter: AlphabetLetter;
  showWord: boolean;
  showImage: boolean;
}

export interface Level2Activity {
  type: 'ordering';
  letters: AlphabetLetter[];
  targetSequence: string[];
}

export interface Level3Activity {
  type: 'completion';
  word: string;
  missingLetterIndex: number;
  options: string[];
  image: string;
  language: AlphabetLanguage;
}

export interface Level4Activity {
  type: 'association';
  stimulus: 'sound' | 'image';
  content: string; // Audio file path or image path
  options: AlphabetLetter[];
  correctAnswer: string;
}

export interface Level5Activity {
  type: 'formation';
  targetWord: string;
  scrambledLetters: string[];
  image: string;
  language: AlphabetLanguage;
}

export type AlphabetActivity = 
  | Level1Activity 
  | Level2Activity 
  | Level3Activity 
  | Level4Activity 
  | Level5Activity;

export interface AlphabetGameState {
  currentActivity: AlphabetActivity | null;
  userAnswer: string;
  isCorrect: boolean | null;
  attempts: number;
  isProcessing: boolean;
  showFeedback: boolean;
  completedActivities: number;
  totalActivities: number;
}