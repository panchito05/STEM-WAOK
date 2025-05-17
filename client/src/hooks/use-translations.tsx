import { useSettings } from "@/context/SettingsContext";
import { translations, SupportedLanguage } from "@/utils/translations";
import { useCallback } from "react";

// Proporcionar traducciones fallback para tests y desarrollo
const FALLBACK_LANGUAGE: SupportedLanguage = "en";

// Función para convertir los idiomas de la configuración al formato de traducciones
export function mapConfigLanguageToSupported(configLang: string): SupportedLanguage {
  const langMap: Record<string, SupportedLanguage> = {
    "english": "en",
    "spanish": "es",
    // Añadir más mapeos según se añadan idiomas
  };
  
  return langMap[configLang] || FALLBACK_LANGUAGE;
}

// Hook para obtener traducciones basadas en el idioma seleccionado
export function useTranslations(moduleLanguage?: SupportedLanguage) {
  const { globalSettings } = useSettings();
  
  // Asegurarse de que el idioma seleccionado es uno de los soportados
  // Si se proporciona un idioma específico para el módulo, usarlo
  // Si no, usar el idioma global, y si no está soportado, usar inglés como fallback
  const language = moduleLanguage 
    ? moduleLanguage 
    : ((globalSettings.language as SupportedLanguage) in translations 
      ? (globalSettings.language as SupportedLanguage) 
      : FALLBACK_LANGUAGE);
  
  // Función para obtener una traducción usando una clave compuesta (por ejemplo "exercises.start")
  // y reemplazar parámetros en el formato { paramName }
  const t = useCallback((key: string, params?: Record<string, any>) => {
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
    
    // Si no hay parámetros, devolver la traducción tal cual
    if (!params || typeof translation !== 'string') {
      return typeof translation === "string" ? translation : key;
    }
    
    // Reemplazar los parámetros en la traducción
    let result = translation;
    Object.entries(params).forEach(([paramName, value]) => {
      result = result.replace(`{${paramName}}`, value);
    });
    
    return result;
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