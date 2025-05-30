import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAlphabetLanguageContext, AlphabetLanguage } from '../context/AlphabetLanguageContext';
import { alphabetData } from '../alphabetData';

interface AlphabetEntry {
  id: string;
  letter: string;
  lowercase: string;
  word: string;
  image: string;
  color: string;
  pronunciation: string;
}

interface AlphabetDataContextType {
  alphabet: AlphabetEntry[];
  currentLanguage: AlphabetLanguage;
  isReady: boolean;
}

const AlphabetDataContext = createContext<AlphabetDataContextType | null>(null);

interface AlphabetDataProviderProps {
  children: ReactNode;
}

export function AlphabetDataProvider({ children }: AlphabetDataProviderProps) {
  const { language, isReady } = useAlphabetLanguageContext();

  const processedAlphabet = useMemo(() => {
    console.log('[ALPHABET DATA] Processing alphabet for language:', language);
    
    return alphabetData.map(item => ({
      id: item.id,
      letter: item.letter,
      lowercase: item.lowercase,
      word: item.word[language] || item.word.english,
      image: item.image.svg,
      color: item.color,
      pronunciation: item.pronunciation[language] || item.pronunciation.english
    }));
  }, [language]);

  const value: AlphabetDataContextType = {
    alphabet: processedAlphabet,
    currentLanguage: language,
    isReady
  };

  return (
    <AlphabetDataContext.Provider value={value}>
      {children}
    </AlphabetDataContext.Provider>
  );
}

export function useAlphabetData(): AlphabetDataContextType {
  const context = useContext(AlphabetDataContext);
  if (!context) {
    throw new Error('useAlphabetData must be used within AlphabetDataProvider');
  }
  return context;
}