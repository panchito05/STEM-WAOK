import { useSettings } from "@/context/SettingsContext";

export function useGlobalLanguage() {
  const { moduleSettings } = useSettings();
  
  // Buscar primero en la configuración global
  const globalLanguage = moduleSettings.global?.language || "english";
  
  // Buscar en la configuración de adición (para retrocompatibilidad)
  const additionLanguage = moduleSettings.addition?.language;
  
  // Usar la configuración global, o si no existe, la de adición, o por defecto inglés
  const language = globalLanguage || additionLanguage || "english";
  
  // Es español si el idioma es "spanish"
  const isSpanish = language === "spanish";
  
  // Indicador más intuitivo
  const isEnglish = !isSpanish;
  
  return {
    language,
    isSpanish,
    isEnglish
  };
}