import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { ModuleSettings } from '@/context/SettingsContext';

export type AlphabetLanguage = 'english' | 'spanish';

export const useAlphabetLanguage = (moduleSettings: ModuleSettings) => {
  const { globalSettings } = useSettings();
  const [language, setLanguage] = useState<AlphabetLanguage>('english');

  useEffect(() => {
    // Priority order: Module settings > Global settings > Default to English
    let detectedLanguage: AlphabetLanguage = 'english';

    console.log('[ALPHABET LANGUAGE DEBUG] Raw values:', {
      moduleLanguage: moduleSettings.language,
      globalLanguage: globalSettings.language,
      moduleType: typeof moduleSettings.language,
      globalType: typeof globalSettings.language
    });

    // Check module settings first (supports multiple formats)
    const moduleLang = String(moduleSettings.language || '').toLowerCase();
    if (moduleLang === 'spanish' || moduleLang === 'español' || moduleLang === 'es') {
      detectedLanguage = 'spanish';
      console.log('[ALPHABET LANGUAGE] Using module language: spanish');
    }
    // Check global settings (supports multiple formats)
    else if (globalSettings.language) {
      const globalLang = String(globalSettings.language).toLowerCase();
      if (globalLang === 'es' || globalLang === 'spanish' || globalLang === 'español') {
        detectedLanguage = 'spanish';
        console.log('[ALPHABET LANGUAGE] Using global language: spanish');
      } else if (globalLang === 'en' || globalLang === 'english') {
        detectedLanguage = 'english';
        console.log('[ALPHABET LANGUAGE] Using global language: english');
      }
    }

    console.log(`[ALPHABET LANGUAGE] Final decision: ${detectedLanguage}`);
    setLanguage(detectedLanguage);
  }, [globalSettings.language, moduleSettings.language]);

  return language;
};