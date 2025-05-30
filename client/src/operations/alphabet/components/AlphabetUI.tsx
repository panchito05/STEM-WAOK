import React, { useMemo } from 'react';
import { useAlphabetLanguageContext } from '../context/AlphabetLanguageContext';

interface AlphabetUIContextType {
  ui: {
    title: string;
    subtitle: string;
    settings: string;
    progress: string;
    previous: string;
    next: string;
    playSound: string;
    letter: string;
    letterFor: (word: string) => string;
  };
}

const translations = {
  english: {
    title: 'Alphabet Learning',
    subtitle: 'Explore each letter of the alphabet',
    settings: 'Settings',
    progress: 'Progress',
    previous: 'Previous',
    next: 'Next',
    playSound: 'Play Sound',
    letter: 'Letter',
    letterFor: (word: string) => `for ${word}`
  },
  spanish: {
    title: 'Aprendizaje del Alfabeto',
    subtitle: 'Explora cada letra del alfabeto',
    settings: 'Configuración',
    progress: 'Progreso',
    previous: 'Anterior',
    next: 'Siguiente',
    playSound: 'Reproducir Sonido',
    letter: 'Letra',
    letterFor: (word: string) => `para ${word}`
  }
};

export function useAlphabetUI(): AlphabetUIContextType {
  const { language } = useAlphabetLanguageContext();
  
  const ui = useMemo(() => {
    console.log('[ALPHABET UI] Generating UI text for language:', language);
    return translations[language];
  }, [language]);

  return { ui };
}