// useTranslation.ts - Hook para manejo de idiomas
import { useCallback } from 'react';
import { useStore } from '@/store/store';

// Traducciones básicas
const translations = {
  es: {
    'exercise.completed': 'Ejercicio completado',
    'exercise.accuracy': 'Precisión',
    'exercise.continue': 'Continuar',
    'exercise.restart': 'Reiniciar',
    'exercise.return': 'Volver al menú',
    'common.timeRemaining': 'Tiempo restante',
    'common.correct': 'Correcto',
    'common.incorrect': 'Incorrecto',
    'common.skip': 'Saltar',
    'common.check': 'Comprobar',
    'common.next': 'Siguiente',
    'common.loading': 'Cargando',
    'common.error': 'Error',
    'hint.title': 'Pista',
    'hint.startSimpler': 'Intenta descomponer el problema en partes más simples',
    'hint.tryAgain': 'Inténtalo de nuevo'
  },
  en: {
    'exercise.completed': 'Exercise completed',
    'exercise.accuracy': 'Accuracy',
    'exercise.continue': 'Continue',
    'exercise.restart': 'Restart',
    'exercise.return': 'Return to menu',
    'common.timeRemaining': 'Time remaining',
    'common.correct': 'Correct',
    'common.incorrect': 'Incorrect',
    'common.skip': 'Skip',
    'common.check': 'Check',
    'common.next': 'Next',
    'common.loading': 'Loading',
    'common.error': 'Error',
    'hint.title': 'Hint',
    'hint.startSimpler': 'Try breaking down the problem into simpler parts',
    'hint.tryAgain': 'Try again'
  }
};

/**
 * Hook personalizado para manejo de traducciones
 */
export function useTranslation() {
  // Obtener el idioma actual del store (o usar español por defecto)
  const moduleSettings = useStore(state => state.activeProfile?.moduleSettings?.addition);
  const language = moduleSettings?.language || 'es';
  
  // Función para traducir una clave
  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    // Buscar la traducción
    const translation = translations[language as keyof typeof translations]?.[key as keyof (typeof translations)['es']] || key;
    
    // Aplicar reemplazos si existen
    if (replacements) {
      return Object.entries(replacements).reduce(
        (result, [placeholder, value]) => result.replace(`{{${placeholder}}}`, value),
        translation
      );
    }
    
    return translation;
  }, [language]);
  
  return { t, language };
}