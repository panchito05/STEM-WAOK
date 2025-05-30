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

    // Check module settings first
    if (moduleSettings.language === 'spanish' || moduleSettings.language === 'español') {
      detectedLanguage = 'spanish';
    }
    // Check global settings
    else if (globalSettings.language === 'es' || globalSettings.language === 'spanish' || globalSettings.language === 'español') {
      detectedLanguage = 'spanish';
    }

    console.log(`[ALPHABET LANGUAGE] Detected: ${detectedLanguage} (Global: ${globalSettings.language}, Module: ${moduleSettings.language})`);
    setLanguage(detectedLanguage);
  }, [globalSettings.language, moduleSettings.language]);

  return language;
};