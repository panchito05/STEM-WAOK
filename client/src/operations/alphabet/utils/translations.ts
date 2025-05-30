export type AlphabetLanguage = 'english' | 'spanish';

export interface AlphabetTranslations {
  // UI Labels
  currentLetter: string;
  nextLetter: string;
  previousLetter: string;
  playAudio: string;
  letterProgress: string;
  exploreMode: string;
  practiceMode: string;
  settings: string;
  
  // Letter display
  upperCase: string;
  lowerCase: string;
  
  // Level descriptions
  beginnerLevel: string;
  intermediateLevel: string;
  advancedLevel: string;
}

const translations: Record<AlphabetLanguage, AlphabetTranslations> = {
  english: {
    currentLetter: 'Current Letter',
    nextLetter: 'Next Letter',
    previousLetter: 'Previous Letter',
    playAudio: 'Play Audio',
    letterProgress: 'Letter Progress',
    exploreMode: 'Explore Mode',
    practiceMode: 'Practice Mode',
    settings: 'Settings',
    upperCase: 'Uppercase',
    lowerCase: 'Lowercase',
    beginnerLevel: 'Beginner',
    intermediateLevel: 'Intermediate',
    advancedLevel: 'Advanced'
  },
  spanish: {
    currentLetter: 'Letra Actual',
    nextLetter: 'Siguiente Letra',
    previousLetter: 'Letra Anterior',
    playAudio: 'Reproducir Audio',
    letterProgress: 'Progreso de Letras',
    exploreMode: 'Modo Exploración',
    practiceMode: 'Modo Práctica',
    settings: 'Configuración',
    upperCase: 'Mayúscula',
    lowerCase: 'Minúscula',
    beginnerLevel: 'Principiante',
    intermediateLevel: 'Intermedio',
    advancedLevel: 'Avanzado'
  }
};

export const getTranslations = (language: AlphabetLanguage): AlphabetTranslations => {
  return translations[language];
};

export const t = (language: AlphabetLanguage, key: keyof AlphabetTranslations): string => {
  return translations[language][key];
};