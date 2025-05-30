import { AlphabetProblem, AlphabetSettings, LetterData } from './types';

// Complete alphabet data with associated words and colors
export const ALPHABET_DATA: LetterData[] = [
  { letter: 'A', words: { english: 'Apple', spanish: 'Abeja' }, color: '#FF6B6B', svgPath: 'M12 2L13.5 8.5L20 8.5L15 13L16.5 20L12 16L7.5 20L9 13L4 8.5L10.5 8.5Z' },
  { letter: 'B', words: { english: 'Ball', spanish: 'Barco' }, color: '#4ECDC4', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22H14C16 22 18 20 18 18C18 17 17.5 16 16.5 15.5C17.5 15 18 14 18 13C18 11 16 9 14 9H6V2Z' },
  { letter: 'C', words: { english: 'Cat', spanish: 'Casa' }, color: '#45B7D1', svgPath: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z' },
  { letter: 'D', words: { english: 'Dog', spanish: 'Delfín' }, color: '#96CEB4', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22H14C18 22 22 18 22 14V10C22 6 18 2 14 2H6Z' },
  { letter: 'E', words: { english: 'Elephant', spanish: 'Estrella' }, color: '#FECA57', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22H18C19 22 20 21 20 20C20 19 19 18 18 18H8V14H16V10H8V6H18C19 6 20 5 20 4C20 3 19 2 18 2H6Z' },
  { letter: 'F', words: { english: 'Fish', spanish: 'Flor' }, color: '#FF9FF3', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22C7 22 8 21 8 20V14H16V10H8V6H18C19 6 20 5 20 4C20 3 19 2 18 2H6Z' },
  { letter: 'G', words: { english: 'Giraffe', spanish: 'Gato' }, color: '#F0932B', svgPath: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C15.18 22 18.07 20.37 19.78 17.78L17.95 16.64C16.74 18.48 14.5 19.5 12 19.5C8.42 19.5 5.5 16.58 5.5 13H15V10H12C8.42 10 5.5 7.08 5.5 3.5C7.24 2.58 9.54 2 12 2Z' },
  { letter: 'H', words: { english: 'Horse', spanish: 'Hormiga' }, color: '#EB4D4B', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22C7 22 8 21 8 20V14H16V20C16 21 17 22 18 22C19 22 20 21 20 20V4C20 3 19 2 18 2C17 2 16 3 16 4V10H8V4C8 3 7 2 6 2Z' },
  { letter: 'I', words: { english: 'Ice cream', spanish: 'Iguana' }, color: '#6C5CE7', svgPath: 'M12 2C11 2 10 3 10 4V6H8C7 6 6 7 6 8C6 9 7 10 8 10H10V18H8C7 18 6 19 6 20C6 21 7 22 8 22H16C17 22 18 21 18 20C18 19 17 18 16 18H14V10H16C17 10 18 9 18 8C18 7 17 6 16 6H14V4C14 3 13 2 12 2Z' },
  { letter: 'J', words: { english: 'Jellyfish', spanish: 'Jirafa' }, color: '#A29BFE', svgPath: 'M16 2C17 2 18 3 18 4C18 5 17 6 16 6H14V16C14 19 11 22 8 22C5 22 2 19 2 16C2 15 3 14 4 14C5 14 6 15 6 16C6 17 7 18 8 18C9 18 10 17 10 16V6H8C7 6 6 5 6 4C6 3 7 2 8 2H16Z' },
  { letter: 'K', words: { english: 'Kite', spanish: 'Koala' }, color: '#FD79A8', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22C7 22 8 21 8 20V14L14 20C15 21 16 21 17 20C18 19 18 18 17 17L12 12L17 7C18 6 18 5 17 4C16 3 15 3 14 4L8 10V4C8 3 7 2 6 2Z' },
  { letter: 'L', words: { english: 'Lion', spanish: 'Luna' }, color: '#00B894', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22H18C19 22 20 21 20 20C20 19 19 18 18 18H8V4C8 3 7 2 6 2Z' },
  { letter: 'M', words: { english: 'Mouse', spanish: 'Mariposa' }, color: '#E17055', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22C7 22 8 21 8 20V13L10 11L12 13V20C12 21 13 22 14 22C15 22 16 21 16 20V13L18 11L20 13V20C20 21 21 22 22 22C23 22 24 21 24 20V4C24 3 23 2 22 2C21 2 20 3 20 4V9L16 5L12 9L8 5L4 9V4C4 3 5 2 6 2Z' },
  { letter: 'N', words: { english: 'Nest', spanish: 'Naranja' }, color: '#81ECEC', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22C7 22 8 21 8 20V8L16 16V20C16 21 17 22 18 22C19 22 20 21 20 20V4C20 3 19 2 18 2C17 2 16 3 16 4V16L8 8V4C8 3 7 2 6 2Z' },
  { letter: 'O', words: { english: 'Ocean', spanish: 'Oso' }, color: '#74B9FF', svgPath: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 18C8.42 18 5.5 15.08 5.5 11.5C5.5 7.92 8.42 5 12 5C15.58 5 18.5 7.92 18.5 11.5C18.5 15.08 15.58 18 12 18Z' },
  { letter: 'P', words: { english: 'Penguin', spanish: 'Pez' }, color: '#55A3FF', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22C7 22 8 21 8 20V14H14C17 14 20 11 20 8C20 5 17 2 14 2H6ZM8 6H14C15 6 16 7 16 8C16 9 15 10 14 10H8V6Z' },
  { letter: 'Q', words: { english: 'Queen', spanish: 'Queso' }, color: '#A55EEA', svgPath: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C14.69 22 17.07 20.86 18.72 19.14L20.14 20.56C20.73 21.15 21.67 21.15 22.26 20.56C22.85 19.97 22.85 19.03 22.26 18.44L20.84 17.02C21.57 15.37 22 13.53 22 12C22 6.48 17.52 2 12 2ZM12 18C8.42 18 5.5 15.08 5.5 11.5C5.5 7.92 8.42 5 12 5C15.58 5 18.5 7.92 18.5 11.5C18.5 15.08 15.58 18 12 18Z' },
  { letter: 'R', words: { english: 'Rainbow', spanish: 'Ratón' }, color: '#FD6C6C', svgPath: 'M6 2C5 2 4 3 4 4V20C4 21 5 22 6 22C7 22 8 21 8 20V14H12L16 20C17 21 18 21 19 20C20 19 20 18 19 17L15 12C17 11 19 9 19 7C19 4 16 2 13 2H6ZM8 6H13C14 6 15 7 15 8C15 9 14 10 13 10H8V6Z' },
  { letter: 'S', words: { english: 'Sun', spanish: 'Sol' }, color: '#FDCB6E', svgPath: 'M6 2C4 2 2 4 2 6C2 8 4 10 6 10H8C9 10 10 9 10 8C10 7 9 6 8 6H6C5 6 4 5 4 4C4 3 5 2 6 2H14C15 2 16 3 16 4C16 5 15 6 14 6H12C11 6 10 7 10 8C10 9 11 10 12 10H18C20 10 22 12 22 14C22 16 20 18 18 18H16C15 18 14 19 14 20C14 21 15 22 16 22H18C19 22 20 21 20 20C20 19 19 18 18 18C19 18 20 17 20 16C20 15 19 14 18 14H12C11 14 10 15 10 16C10 17 11 18 12 18H14C15 18 16 19 16 20C16 21 15 22 14 22H6C4 22 2 20 2 18C2 16 4 14 6 14H8C9 14 10 15 10 16C10 17 9 18 8 18H6C5 18 4 19 4 20C4 21 5 22 6 22Z' },
  { letter: 'T', words: { english: 'Tiger', spanish: 'Tortuga' }, color: '#E84393', svgPath: 'M12 2C11 2 10 3 10 4V6H4C3 6 2 7 2 8C2 9 3 10 4 10H10V20C10 21 11 22 12 22C13 22 14 21 14 20V10H20C21 10 22 9 22 8C22 7 21 6 20 6H14V4C14 3 13 2 12 2Z' },
  { letter: 'U', words: { english: 'Umbrella', spanish: 'Uva' }, color: '#00CEC9', svgPath: 'M6 2C5 2 4 3 4 4V14C4 18 7 22 12 22C17 22 20 18 20 14V4C20 3 19 2 18 2C17 2 16 3 16 4V14C16 16 14 18 12 18C10 18 8 16 8 14V4C8 3 7 2 6 2Z' },
  { letter: 'V', words: { english: 'Violin', spanish: 'Vaca' }, color: '#2D3436', svgPath: 'M6 2C5 2 4 3 4 4C4 5 5 6 6 6L10 14L12 18L14 14L18 6C19 6 20 5 20 4C20 3 19 2 18 2C17 2 16 3 16 4L12 12L8 4C8 3 7 2 6 2Z' },
  { letter: 'W', words: { english: 'Whale', spanish: 'Waffles' }, color: '#636E72', svgPath: 'M4 2C3 2 2 3 2 4C2 5 3 6 4 6L6 14L8 18L10 14L12 16L14 14L16 18L18 14L20 6C21 6 22 5 22 4C22 3 21 2 20 2C19 2 18 3 18 4L16 12L14 8L12 12L10 8L8 12L6 4C6 3 5 2 4 2Z' },
  { letter: 'X', words: { english: 'Xylophone', spanish: 'Xilófono' }, color: '#DDA0DD', svgPath: 'M6 2C5 2 4 3 4 4C4 5 5 6 6 6L10 10L6 14C5 15 5 16 6 17C7 18 8 18 9 17L12 14L15 17C16 18 17 18 18 17C19 16 19 15 18 14L14 10L18 6C19 5 19 4 18 3C17 2 16 2 15 3L12 6L9 3C8 2 7 2 6 2Z' },
  { letter: 'Y', words: { english: 'Yacht', spanish: 'Yogur' }, color: '#FDCB6E', svgPath: 'M6 2C5 2 4 3 4 4C4 5 5 6 6 6L10 10L12 12V20C12 21 13 22 14 22C15 22 16 21 16 20V12L18 10L22 6C23 6 24 5 24 4C24 3 23 2 22 2C21 2 20 3 20 4L16 8L12 4C12 3 11 2 10 2C9 2 8 3 8 4L10 6L6 2Z' },
  { letter: 'Z', words: { english: 'Zebra', spanish: 'Zapato' }, color: '#F39C12', svgPath: 'M6 2C5 2 4 3 4 4C4 5 5 6 6 6H14L6 16C5 17 5 18 6 19C7 20 8 20 9 19L18 6C19 6 20 5 20 4C20 3 19 2 18 2H6Z' }
];

// Generate alphabet problems based on difficulty
export function generateAlphabetProblem(
  settings: AlphabetSettings,
  currentPosition: number = 0
): AlphabetProblem {
  const letterData = ALPHABET_DATA[currentPosition % 26];
  const id = `${letterData.letter}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const problem: AlphabetProblem = {
    id,
    letter: letterData.letter,
    letterCase: settings.showLowercase ? 'both' : 'upper',
    associatedWord: letterData.words,
    associatedImage: generateSVGImage(letterData.letter, letterData.color),
    color: settings.coloredLetters ? letterData.color : '#333333',
    position: currentPosition,
    difficulty: settings.difficulty,
    answerMaxDigits: 1
  };

  // Add quiz elements based on difficulty
  if (settings.learningMode === 'quiz') {
    switch (settings.difficulty) {
      case 'beginner':
        // Simple letter recognition
        problem.correctAnswer = letterData.letter;
        break;
      case 'intermediate':
        // Next letter in sequence
        const nextLetter = ALPHABET_DATA[(currentPosition + 1) % 26]?.letter || 'A';
        problem.correctAnswer = nextLetter;
        break;
      case 'advanced':
        // Word association
        const word = settings.language === 'spanish' 
          ? letterData.words.spanish 
          : letterData.words.english;
        problem.correctAnswer = word.charAt(0).toUpperCase();
        break;
    }
  }

  return problem;
}

// Generate SVG image for letter
export function generateSVGImage(letter: string, color: string): string {
  const letterData = ALPHABET_DATA.find(l => l.letter === letter);
  if (!letterData) return '';

  return `
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="${color}20" stroke="${color}" stroke-width="2"/>
      <path d="${letterData.svgPath}" fill="${color}"/>
      <text x="12" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="${color}">
        ${letter}
      </text>
    </svg>
  `.trim();
}

// Speech synthesis for pronunciation
export function speakText(text: string, language: 'english' | 'spanish'): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'spanish' ? 'es-ES' : 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }
}

// Validate quiz answers
export function validateAnswer(
  problem: AlphabetProblem,
  userAnswer: string
): boolean {
  if (!problem.correctAnswer) return true; // Exploration mode
  
  return userAnswer.toUpperCase().trim() === problem.correctAnswer.toUpperCase().trim();
}

// Get progress percentage
export function getAlphabetProgress(completedLetters: string[]): number {
  return Math.round((completedLetters.length / 26) * 100);
}

// Generate letter sequence for guided mode
export function generateGuidedSequence(settings: AlphabetSettings): number[] {
  const sequence = Array.from({ length: 26 }, (_, i) => i);
  
  if (settings.difficulty === 'advanced') {
    // Randomize for advanced users
    return sequence.sort(() => Math.random() - 0.5);
  }
  
  return sequence; // Sequential for beginner/intermediate
}