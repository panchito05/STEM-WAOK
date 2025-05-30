import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { ModuleSettings } from '@/context/SettingsContext';

export type AlphabetLanguage = 'english' | 'spanish';

interface AlphabetLanguageContextType {
  language: AlphabetLanguage;
  setLanguage: (lang: AlphabetLanguage) => void;
  isReady: boolean;
}

const AlphabetLanguageContext = createContext<AlphabetLanguageContextType | null>(null);

interface AlphabetLanguageProviderProps {
  children: ReactNode;
  moduleSettings: ModuleSettings;
}

export function AlphabetLanguageProvider({ children, moduleSettings }: AlphabetLanguageProviderProps) {
  const { globalSettings } = useSettings();
  const [language, setLanguage] = useState<AlphabetLanguage>('english');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('[ALPHABET CONTEXT] Evaluating language settings...');
    console.log('[ALPHABET CONTEXT] Module settings:', moduleSettings.language);
    console.log('[ALPHABET CONTEXT] Global settings:', globalSettings.language);

    // Determine language with clear priority
    let detectedLanguage: AlphabetLanguage = 'english';

    // Priority 1: Module settings (direct alphabet module configuration)
    if (moduleSettings.language) {
      const moduleLang = String(moduleSettings.language).toLowerCase();
      if (moduleLang === 'spanish' || moduleLang === 'español' || moduleLang === 'es') {
        detectedLanguage = 'spanish';
        console.log('[ALPHABET CONTEXT] ✓ Using module language: spanish');
      } else if (moduleLang === 'english' || moduleLang === 'en') {
        detectedLanguage = 'english';
        console.log('[ALPHABET CONTEXT] ✓ Using module language: english');
      }
    }
    // Priority 2: Global settings (app-wide language)
    else if (globalSettings.language) {
      const globalLang = String(globalSettings.language).toLowerCase();
      if (globalLang === 'spanish' || globalLang === 'español' || globalLang === 'es') {
        detectedLanguage = 'spanish';
        console.log('[ALPHABET CONTEXT] ✓ Using global language: spanish');
      } else if (globalLang === 'english' || globalLang === 'en') {
        detectedLanguage = 'english';
        console.log('[ALPHABET CONTEXT] ✓ Using global language: english');
      }
    }

    console.log('[ALPHABET CONTEXT] Final language decision:', detectedLanguage);
    setLanguage(detectedLanguage);
    setIsReady(true);
  }, [moduleSettings.language, globalSettings.language]);

  const value: AlphabetLanguageContextType = {
    language,
    setLanguage,
    isReady
  };

  return (
    <AlphabetLanguageContext.Provider value={value}>
      {children}
    </AlphabetLanguageContext.Provider>
  );
}

export function useAlphabetLanguageContext(): AlphabetLanguageContextType {
  const context = useContext(AlphabetLanguageContext);
  if (!context) {
    throw new Error('useAlphabetLanguageContext must be used within AlphabetLanguageProvider');
  }
  return context;
}