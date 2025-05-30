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
    console.log('[🔍 ALPHABET CONTEXT] === INICIANDO DETECCIÓN DE IDIOMA ===');
    console.log('[🔍 ALPHABET CONTEXT] moduleSettings completo:', JSON.stringify(moduleSettings, null, 2));
    console.log('[🔍 ALPHABET CONTEXT] globalSettings completo:', JSON.stringify(globalSettings, null, 2));
    console.log('[🔍 ALPHABET CONTEXT] moduleSettings.language:', moduleSettings.language);
    console.log('[🔍 ALPHABET CONTEXT] globalSettings.language:', globalSettings.language);

    // Función para detectar idioma español
    const isSpanish = (lang: any): boolean => {
      if (!lang) return false;
      const langStr = String(lang).toLowerCase().trim();
      console.log('[🔍 ALPHABET CONTEXT] Evaluating language string:', langStr);
      
      const spanishVariants = ['spanish', 'español', 'es', 'spa', 'castellano', 'castilian'];
      const isSpanishResult = spanishVariants.includes(langStr);
      console.log('[🔍 ALPHABET CONTEXT] Is Spanish?', isSpanishResult);
      return isSpanishResult;
    };

    // Función para detectar idioma inglés
    const isEnglish = (lang: any): boolean => {
      if (!lang) return false;
      const langStr = String(lang).toLowerCase().trim();
      const englishVariants = ['english', 'en', 'eng', 'inglés', 'ingles'];
      const isEnglishResult = englishVariants.includes(langStr);
      console.log('[🔍 ALPHABET CONTEXT] Is English?', isEnglishResult);
      return isEnglishResult;
    };

    let detectedLanguage: AlphabetLanguage = 'english'; // Default fallback

    console.log('[🔍 ALPHABET CONTEXT] === PRIORITY 1: MODULE SETTINGS ===');
    if (moduleSettings.language) {
      console.log('[🔍 ALPHABET CONTEXT] Module language exists:', moduleSettings.language);
      if (isSpanish(moduleSettings.language)) {
        detectedLanguage = 'spanish';
        console.log('[✅ ALPHABET CONTEXT] ✓ DETECTED SPANISH from module settings');
      } else if (isEnglish(moduleSettings.language)) {
        detectedLanguage = 'english';
        console.log('[✅ ALPHABET CONTEXT] ✓ DETECTED ENGLISH from module settings');
      }
    } else {
      console.log('[❌ ALPHABET CONTEXT] No module language found');
    }

    console.log('[🔍 ALPHABET CONTEXT] === PRIORITY 2: GLOBAL SETTINGS ===');
    if (!moduleSettings.language && globalSettings.language) {
      console.log('[🔍 ALPHABET CONTEXT] Global language exists:', globalSettings.language);
      if (isSpanish(globalSettings.language)) {
        detectedLanguage = 'spanish';
        console.log('[✅ ALPHABET CONTEXT] ✓ DETECTED SPANISH from global settings');
      } else if (isEnglish(globalSettings.language)) {
        detectedLanguage = 'english';
        console.log('[✅ ALPHABET CONTEXT] ✓ DETECTED ENGLISH from global settings');
      }
    } else if (!globalSettings.language) {
      console.log('[❌ ALPHABET CONTEXT] No global language found');
    }

    console.log('[🎯 ALPHABET CONTEXT] === FINAL DECISION ===');
    console.log('[🎯 ALPHABET CONTEXT] Detected language:', detectedLanguage);
    console.log('[🎯 ALPHABET CONTEXT] Setting language to:', detectedLanguage);
    
    setLanguage(detectedLanguage);
    setIsReady(true);
    
    console.log('[✅ ALPHABET CONTEXT] === DETECCIÓN COMPLETADA ===');
  }, [moduleSettings.language, globalSettings.language, moduleSettings, globalSettings]);

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