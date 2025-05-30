export interface AlphabetProblem {
  id: string;
  letter: string;
  letterCase: 'upper' | 'lower' | 'both';
  associatedWord: {
    english: string;
    spanish: string;
  };
  associatedImage: string;
  color: string;
  position: number; // Position in alphabet (0-25)
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  correctAnswer?: string;
  answerMaxDigits: number;
}

export interface AlphabetSettings {
  language: 'english' | 'spanish';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  showLowercase: boolean;
  coloredLetters: boolean;
  audioEnabled: boolean;
  animationsEnabled: boolean;
  letterStyle: 'basic' | 'decorative' | 'manuscript';
  learningMode: 'exploration' | 'guided' | 'quiz';
  timerDuration: number;
  problemCount: number;
  enableHints: boolean;
  autoAdvance: boolean;
}

export interface LetterData {
  letter: string;
  words: {
    english: string;
    spanish: string;
  };
  color: string;
  svgPath: string;
}

export interface UserAnswerType {
  problemId: string;
  problem: AlphabetProblem;
  userAnswer: string | number;
  isCorrect: boolean;
  status: 'active' | 'completed' | 'revealed';
  attempts: number;
  timestamp: number;
}