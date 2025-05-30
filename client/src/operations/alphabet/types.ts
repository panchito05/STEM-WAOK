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
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  audioEnabled: boolean;
  showBothLanguages: boolean;
  autoContinue: boolean;
  letterDisplay: 'uppercase' | 'lowercase' | 'both';
}

export interface AlphabetProgress {
  currentLevel: AlphabetLevel;
  currentLetterIndex: number;
  completedLetters: string[];
  completedLevels: number[];
  totalScore: number;
  accuracy: number;
  timeSpent: number;
  activities: {
    level1: Level1Activity[];
    level2: Level2Activity[];
    level3: Level3Activity[];
    level4: Level4Activity[];
    level5: Level5Activity[];
  };
}

export interface AlphabetExerciseProps {
  settings: AlphabetSettings;
  onOpenSettings: () => void;
}

export interface AlphabetSettingsProps {
  settings: AlphabetSettings;
  onBack: () => void;
  onSettingsChange: (settings: AlphabetSettings) => void;
}

// Level-specific interfaces
export interface Level1Activity {
  letterId: string;
  timestamp: number;
  completed: boolean;
}

export interface Level2Activity {
  sequence: string[];
  userSequence: string[];
  completed: boolean;
  timestamp: number;
  attempts: number;
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
  wordId: string;
  word: string;
  missingIndices: number[];
  userAnswers: string[];
  completed: boolean;
  timestamp: number;
}

export interface Level5Activity {
  targetLetter: string;
  selectedLetter: string;
  completed: boolean;
  timestamp: number;
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

// Drag and drop types for Level 2
export interface DragItem {
  id: string;
  letter: string;
  index: number;
  isPlaced: boolean;
}

export interface DropZone {
  id: string;
  expectedLetter: string;
  currentLetter: string | null;
  isCorrect: boolean;
  position: number;
}

export interface DragDropState {
  dragItems: DragItem[];
  dropZones: DropZone[];
  draggedItem: DragItem | null;
  isComplete: boolean;
  correctPlacements: number;
}

// Word completion types for Level 3
export interface WordCompletionData {
  word: string;
  language: AlphabetLanguage;
  image: string;
  missingPositions: number[];
  completedWord: string[];
  selectedOptions: (string | null)[];
  isComplete: boolean;
}

export interface LetterOption {
  id: number;
  letter: string;
}