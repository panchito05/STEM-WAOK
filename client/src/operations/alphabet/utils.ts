import { AlphabetProblem, AlphabetSettings, LetterData } from './types';

// Complete alphabet data with associated words and colors
export const ALPHABET_DATA: LetterData[] = [
  { letter: 'A', words: { english: 'Apple', spanish: 'Abeja' }, color: '#FF6B6B', svgPath: 'apple' },
  { letter: 'B', words: { english: 'Ball', spanish: 'Barco' }, color: '#4ECDC4', svgPath: 'ball' },
  { letter: 'C', words: { english: 'Cat', spanish: 'Casa' }, color: '#45B7D1', svgPath: 'cat' },
  { letter: 'D', words: { english: 'Dog', spanish: 'Delfín' }, color: '#96CEB4', svgPath: 'dog' },
  { letter: 'E', words: { english: 'Elephant', spanish: 'Estrella' }, color: '#FECA57', svgPath: 'elephant' },
  { letter: 'F', words: { english: 'Fish', spanish: 'Flor' }, color: '#FF9FF3', svgPath: 'fish' },
  { letter: 'G', words: { english: 'Giraffe', spanish: 'Gato' }, color: '#F0932B', svgPath: 'giraffe' },
  { letter: 'H', words: { english: 'Horse', spanish: 'Hormiga' }, color: '#EB4D4B', svgPath: 'horse' },
  { letter: 'I', words: { english: 'Ice cream', spanish: 'Iguana' }, color: '#6C5CE7', svgPath: 'icecream' },
  { letter: 'J', words: { english: 'Jellyfish', spanish: 'Jirafa' }, color: '#A29BFE', svgPath: 'jellyfish' },
  { letter: 'K', words: { english: 'Kite', spanish: 'Koala' }, color: '#FD79A8', svgPath: 'kite' },
  { letter: 'L', words: { english: 'Lion', spanish: 'Luna' }, color: '#00B894', svgPath: 'lion' },
  { letter: 'M', words: { english: 'Mouse', spanish: 'Mariposa' }, color: '#E17055', svgPath: 'mouse' },
  { letter: 'N', words: { english: 'Nest', spanish: 'Naranja' }, color: '#81ECEC', svgPath: 'nest' },
  { letter: 'O', words: { english: 'Ocean', spanish: 'Oso' }, color: '#74B9FF', svgPath: 'ocean' },
  { letter: 'P', words: { english: 'Penguin', spanish: 'Pez' }, color: '#55A3FF', svgPath: 'penguin' },
  { letter: 'Q', words: { english: 'Queen', spanish: 'Queso' }, color: '#A55EEA', svgPath: 'queen' },
  { letter: 'R', words: { english: 'Rainbow', spanish: 'Ratón' }, color: '#FD6C6C', svgPath: 'rainbow' },
  { letter: 'S', words: { english: 'Sun', spanish: 'Sol' }, color: '#FDCB6E', svgPath: 'sun' },
  { letter: 'T', words: { english: 'Tiger', spanish: 'Tortuga' }, color: '#E84393', svgPath: 'tiger' },
  { letter: 'U', words: { english: 'Umbrella', spanish: 'Uva' }, color: '#00CEC9', svgPath: 'umbrella' },
  { letter: 'V', words: { english: 'Violin', spanish: 'Vaca' }, color: '#2D3436', svgPath: 'violin' },
  { letter: 'W', words: { english: 'Whale', spanish: 'Waffles' }, color: '#636E72', svgPath: 'whale' },
  { letter: 'X', words: { english: 'Xylophone', spanish: 'Xilófono' }, color: '#DDA0DD', svgPath: 'xylophone' },
  { letter: 'Y', words: { english: 'Yacht', spanish: 'Yogur' }, color: '#FDCB6E', svgPath: 'yacht' },
  { letter: 'Z', words: { english: 'Zebra', spanish: 'Zapato' }, color: '#F39C12', svgPath: 'zebra' }
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

// SVG definitions for educational images
const SVG_IMAGES = {
  apple: `<circle cx="12" cy="14" r="8" fill="#FF6B6B" stroke="#FF3B3B" stroke-width="2"/>
          <path d="M12 6 Q10 4 8 6 Q10 8 12 6" fill="#4CAF50"/>
          <circle cx="10" cy="12" r="1" fill="#FFF" opacity="0.7"/>`,
  
  ball: `<circle cx="12" cy="12" r="9" fill="#4ECDC4" stroke="#2EAAA8" stroke-width="2"/>
         <path d="M6 12 Q12 8 18 12" stroke="#FFF" stroke-width="2" fill="none"/>
         <path d="M6 12 Q12 16 18 12" stroke="#FFF" stroke-width="2" fill="none"/>`,
  
  cat: `<ellipse cx="12" cy="15" rx="8" ry="6" fill="#FF9800"/>
        <circle cx="9" cy="12" r="2" fill="#333"/>
        <circle cx="15" cy="12" r="2" fill="#333"/>
        <path d="M7 8 L9 4 M17 8 L15 4" stroke="#FF9800" stroke-width="3"/>
        <path d="M12 16 Q10 18 8 16 M12 16 Q14 18 16 16" stroke="#333" stroke-width="2" fill="none"/>`,
  
  dog: `<ellipse cx="12" cy="16" rx="9" ry="5" fill="#8D6E63"/>
        <circle cx="9" cy="12" r="2" fill="#333"/>
        <circle cx="15" cy="12" r="2" fill="#333"/>
        <ellipse cx="6" cy="10" rx="3" ry="5" fill="#8D6E63"/>
        <ellipse cx="18" cy="10" rx="3" ry="5" fill="#8D6E63"/>
        <circle cx="12" cy="15" r="1" fill="#333"/>`,
  
  elephant: `<ellipse cx="12" cy="16" rx="10" ry="6" fill="#9E9E9E"/>
             <circle cx="12" cy="10" r="6" fill="#9E9E9E"/>
             <circle cx="10" cy="8" r="1" fill="#333"/>
             <circle cx="14" cy="8" r="1" fill="#333"/>
             <path d="M12 12 Q8 20 6 22" stroke="#9E9E9E" stroke-width="4" fill="none"/>
             <circle cx="5" cy="6" r="2" fill="#FFF"/>
             <circle cx="19" cy="6" r="2" fill="#FFF"/>`,
  
  fish: `<ellipse cx="12" cy="12" rx="8" ry="4" fill="#03A9F4"/>
         <path d="M4 12 L8 8 L8 16 Z" fill="#03A9F4"/>
         <circle cx="16" cy="10" r="1" fill="#333"/>
         <path d="M20 8 L22 12 L20 16 Z" fill="#03A9F4"/>`,
  
  giraffe: `<ellipse cx="12" cy="18" rx="6" ry="4" fill="#FFB74D"/>
            <rect x="10" y="6" width="4" height="12" fill="#FFB74D"/>
            <circle cx="12" cy="6" r="3" fill="#FFB74D"/>
            <circle cx="10" cy="5" r="0.5" fill="#333"/>
            <circle cx="14" cy="5" r="0.5" fill="#333"/>
            <circle cx="8" cy="15" r="1" fill="#D84315"/>
            <circle cx="16" cy="10" r="1" fill="#D84315"/>
            <circle cx="10" cy="8" r="0.5" fill="#D84315"/>`,
  
  horse: `<ellipse cx="12" cy="17" rx="8" ry="5" fill="#8D4E2A"/>
          <ellipse cx="12" cy="10" rx="5" ry="4" fill="#8D4E2A"/>
          <circle cx="10" cy="9" r="1" fill="#333"/>
          <circle cx="14" cy="9" r="1" fill="#333"/>
          <path d="M9 6 Q12 2 15 6" stroke="#654321" stroke-width="2" fill="none"/>
          <rect x="8" y="20" width="2" height="3" fill="#333"/>
          <rect x="14" y="20" width="2" height="3" fill="#333"/>`,
  
  icecream: `<path d="M12 20 L8 12 L16 12 Z" fill="#F4A261"/>
             <circle cx="12" cy="10" r="4" fill="#E76F51"/>
             <circle cx="12" cy="6" r="3" fill="#F4A261"/>
             <circle cx="12" cy="4" r="2" fill="#E9C46A"/>`,
  
  jellyfish: `<ellipse cx="12" cy="8" rx="8" ry="4" fill="#E1BEE7"/>
              <path d="M8 12 Q6 18 8 20 M10 12 Q8 18 10 20 M14 12 Q16 18 14 20 M16 12 Q18 18 16 20" 
                    stroke="#E1BEE7" stroke-width="2" fill="none"/>
              <circle cx="10" cy="7" r="1" fill="#9C27B0"/>
              <circle cx="14" cy="7" r="1" fill="#9C27B0"/>`,
  
  kite: `<path d="M12 2 L18 8 L12 12 L6 8 Z" fill="#E91E63"/>
         <path d="M12 12 Q14 16 12 20" stroke="#333" stroke-width="2" fill="none"/>
         <circle cx="13" cy="16" r="1" fill="#FFC107"/>
         <circle cx="11" cy="18" r="1" fill="#4CAF50"/>`,
  
  lion: `<circle cx="12" cy="12" r="9" fill="#FFB74D"/>
         <circle cx="12" cy="12" r="6" fill="#FFA726"/>
         <circle cx="9" cy="10" r="1" fill="#333"/>
         <circle cx="15" cy="10" r="1" fill="#333"/>
         <path d="M12 14 Q10 16 8 14 M12 14 Q14 16 16 14" stroke="#333" stroke-width="2" fill="none"/>
         <circle cx="12" cy="13" r="0.5" fill="#333"/>`,
  
  mouse: `<ellipse cx="12" cy="15" rx="6" ry="4" fill="#9E9E9E"/>
          <circle cx="12" cy="10" r="4" fill="#9E9E9E"/>
          <circle cx="10" cy="9" r="1" fill="#333"/>
          <circle cx="14" cy="9" r="1" fill="#333"/>
          <circle cx="6" cy="8" r="2" fill="#FFB6C1"/>
          <circle cx="18" cy="8" r="2" fill="#FFB6C1"/>
          <path d="M16 10 Q20 12 22 8" stroke="#9E9E9E" stroke-width="2" fill="none"/>`,
  
  nest: `<ellipse cx="12" cy="16" rx="8" ry="3" fill="#8D6E63"/>
         <path d="M6 16 Q8 12 10 16 M10 16 Q12 12 14 16 M14 16 Q16 12 18 16" stroke="#8D6E63" stroke-width="2" fill="none"/>
         <circle cx="10" cy="14" r="2" fill="#87CEEB"/>
         <circle cx="14" cy="14" r="2" fill="#87CEEB"/>
         <circle cx="12" cy="12" r="1.5" fill="#87CEEB"/>`,
  
  ocean: `<rect x="0" y="12" width="24" height="12" fill="#1976D2"/>
          <path d="M0 14 Q6 10 12 14 Q18 18 24 14" fill="#42A5F5"/>
          <path d="M0 16 Q8 12 16 16 Q20 18 24 16" fill="#64B5F6"/>
          <circle cx="6" cy="8" r="2" fill="#FFD54F"/>`,
  
  penguin: `<ellipse cx="12" cy="16" rx="5" ry="6" fill="#333"/>
            <ellipse cx="12" cy="16" rx="3" ry="5" fill="#FFF"/>
            <circle cx="12" cy="8" r="3" fill="#333"/>
            <circle cx="10" cy="7" r="0.5" fill="#FFF"/>
            <circle cx="14" cy="7" r="0.5" fill="#FFF"/>
            <path d="M12 9 L10 10 L12 11" fill="#FF9800"/>`,
  
  queen: `<circle cx="12" cy="16" r="6" fill="#FFB6C1"/>
          <circle cx="12" cy="10" r="4" fill="#FFCDD2"/>
          <circle cx="10" cy="9" r="0.5" fill="#333"/>
          <circle cx="14" cy="9" r="0.5" fill="#333"/>
          <path d="M8 6 L10 4 L12 6 L14 4 L16 6" stroke="#FFD700" stroke-width="2" fill="none"/>
          <circle cx="8" cy="6" r="1" fill="#FFD700"/>
          <circle cx="12" cy="6" r="1" fill="#FFD700"/>
          <circle cx="16" cy="6" r="1" fill="#FFD700"/>`,
  
  rainbow: `<path d="M4 18 Q12 8 20 18" stroke="#FF0000" stroke-width="2" fill="none"/>
            <path d="M5 18 Q12 9 19 18" stroke="#FF9800" stroke-width="2" fill="none"/>
            <path d="M6 18 Q12 10 18 18" stroke="#FFEB3B" stroke-width="2" fill="none"/>
            <path d="M7 18 Q12 11 17 18" stroke="#4CAF50" stroke-width="2" fill="none"/>
            <path d="M8 18 Q12 12 16 18" stroke="#2196F3" stroke-width="2" fill="none"/>
            <path d="M9 18 Q12 13 15 18" stroke="#9C27B0" stroke-width="2" fill="none"/>`,
  
  sun: `<circle cx="12" cy="12" r="6" fill="#FFD54F"/>
        <path d="M12 2 L12 6 M12 18 L12 22 M22 12 L18 12 M6 12 L2 12" stroke="#FFD54F" stroke-width="2"/>
        <path d="M18.4 5.6 L16 8 M8 16 L5.6 18.4 M18.4 18.4 L16 16 M8 8 L5.6 5.6" stroke="#FFD54F" stroke-width="2"/>`,
  
  tiger: `<ellipse cx="12" cy="16" rx="8" ry="5" fill="#FF9800"/>
          <circle cx="12" cy="10" r="5" fill="#FF9800"/>
          <circle cx="9" cy="9" r="1" fill="#333"/>
          <circle cx="15" cy="9" r="1" fill="#333"/>
          <path d="M8 12 L8 14 M10 11 L10 13 M14 11 L14 13 M16 12 L16 14" stroke="#333" stroke-width="2"/>
          <path d="M12 12 Q10 14 8 12 M12 12 Q14 14 16 12" stroke="#333" stroke-width="2" fill="none"/>`,
  
  umbrella: `<path d="M4 12 Q12 4 20 12 L20 14 Q12 8 4 14 Z" fill="#E91E63"/>
             <rect x="11" y="12" width="2" height="8" fill="#8D6E63"/>
             <path d="M13 20 Q15 20 15 18" stroke="#8D6E63" stroke-width="2" fill="none"/>`,
  
  violin: `<ellipse cx="12" cy="16" rx="5" ry="6" fill="#8D6E63"/>
           <ellipse cx="12" cy="16" rx="2" ry="3" fill="#333"/>
           <rect x="11" y="4" width="2" height="12" fill="#654321"/>
           <path d="M9 6 L15 6 M9 8 L15 8 M9 10 L15 10 M9 12 L15 12" stroke="#333" stroke-width="1"/>`,
  
  whale: `<ellipse cx="12" cy="14" rx="10" ry="5" fill="#607D8B"/>
          <circle cx="12" cy="10" r="6" fill="#607D8B"/>
          <circle cx="8" cy="9" r="1" fill="#333"/>
          <path d="M2 14 Q4 8 6 12" stroke="#607D8B" stroke-width="3" fill="none"/>
          <path d="M12 6 L10 2 L12 4 L14 2" stroke="#87CEEB" stroke-width="2" fill="none"/>`,
  
  xylophone: `<rect x="4" y="12" width="16" height="6" fill="#8D6E63"/>
              <rect x="6" y="10" width="2" height="4" fill="#F44336"/>
              <rect x="9" y="10" width="2" height="4" fill="#FF9800"/>
              <rect x="12" y="10" width="2" height="4" fill="#FFEB3B"/>
              <rect x="15" y="10" width="2" height="4" fill="#4CAF50"/>
              <rect x="18" y="10" width="2" height="4" fill="#2196F3"/>`,
  
  yacht: `<path d="M6 18 L18 18 L16 14 L8 14 Z" fill="#FFF"/>
          <rect x="11" y="6" width="2" height="8" fill="#8D6E63"/>
          <path d="M13 6 L18 8 L13 12 Z" fill="#F44336"/>
          <path d="M4 18 Q6 20 8 18 M16 18 Q18 20 20 18" stroke="#2196F3" stroke-width="2" fill="none"/>`,
  
  zebra: `<ellipse cx="12" cy="16" rx="8" ry="5" fill="#FFF"/>
          <ellipse cx="12" cy="10" rx="5" ry="4" fill="#FFF"/>
          <circle cx="10" cy="9" r="1" fill="#333"/>
          <circle cx="14" cy="9" r="1" fill="#333"/>
          <path d="M8 12 L8 14 M10 11 L10 13 M14 11 L14 13 M16 12 L16 14" stroke="#333" stroke-width="3"/>
          <path d="M8 16 L16 16 M9 18 L15 18" stroke="#333" stroke-width="3"/>`
};

// Generate SVG image for letter
export function generateSVGImage(letter: string, color: string): string {
  const letterData = ALPHABET_DATA.find(l => l.letter === letter);
  if (!letterData) return '';

  const imageName = letterData.svgPath;
  const svgContent = SVG_IMAGES[imageName as keyof typeof SVG_IMAGES] || '';

  return `
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="22" rx="4" fill="${color}15" stroke="${color}40" stroke-width="1"/>
      ${svgContent}
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