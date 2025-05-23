import { useSettings } from "@/context/SettingsContext";
import { translations, SupportedLanguage } from "@/utils/translations";
import { useCallback } from "react";

// Proporcionar traducciones fallback para tests y desarrollo
const FALLBACK_LANGUAGE: SupportedLanguage = "en";

// Hook para obtener traducciones basadas en el idioma seleccionado
export function useTranslations() {
  const { globalSettings } = useSettings();
  
  // Asegurarse de que el idioma seleccionado es uno de los soportados
  // Si no, por defecto usar inglés
  const language = (globalSettings.language as SupportedLanguage) in translations 
    ? (globalSettings.language as SupportedLanguage) 
    : FALLBACK_LANGUAGE;
  
  // Función para obtener una traducción usando una clave compuesta (por ejemplo "exercises.start")
  const t = useCallback((key: string) => {
    // Dividir la clave en partes para acceder a la estructura anidada
    const parts = key.split(".");
    
    // Comenzar con las traducciones del idioma actual
    let translation: any = translations[language];
    
    // Recorrer la estructura para obtener la traducción anidada
    for (const part of parts) {
      if (translation && part in translation) {
        translation = translation[part];
      } else {
        // Si no se encuentra, intentar en inglés como fallback
        translation = getFallbackTranslation(key);
        break;
      }
    }
    
    // Devolver la traducción (o la clave original si no se encuentra)
    return typeof translation === "string" ? translation : key;
  }, [language]);
  
  // Buscar una traducción en el idioma por defecto (inglés) como fallback
  const getFallbackTranslation = (key: string): string => {
    const parts = key.split(".");
    let fallback: any = translations["en"];
    
    for (const part of parts) {
      if (fallback && part in fallback) {
        fallback = fallback[part];
      } else {
        return key;
      }
    }
    
    return typeof fallback === "string" ? fallback : key;
  };
  
  return { t, language };
}