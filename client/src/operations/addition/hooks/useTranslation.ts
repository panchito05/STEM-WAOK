// useTranslation.ts - Hook simplificado para traducciones
import { useState, useEffect } from 'react';

// Traducciones básicas para el módulo de suma
const translations = {
  es: {
    'common.timeRemaining': 'Tiempo restante',
    'common.check': 'Verificar',
    'common.next': 'Siguiente',
    'common.loading': 'Cargando',
    'common.loadingProblems': 'Cargando problemas',
    'common.reloadingProblem': 'Recargando problema',
    'exercise.correct': 'Correcto',
    'exercise.incorrect': 'Incorrecto',
    'exercise.timeUp': 'Tiempo agotado',
    'exercise.completed': '¡Ejercicio Completado!',
    'exercise.finalScore': 'Puntuación Final',
    'exercise.help': 'Ayuda',
    'exercise.tryAgain': 'Intentar otra vez',
    'exercise.showAnswer': 'Mostrar Respuesta',
    'exercise.continue': 'Continuar',
    'exercise.seconds': 's',
    'exercise.restart': 'Reiniciar',
    'exercise.feedback': 'Retroalimentación',
    'exercise.accuracy': 'Precisión',
  },
  en: {
    'common.timeRemaining': 'Time remaining',
    'common.check': 'Check',
    'common.next': 'Next',
    'common.loading': 'Loading',
    'common.loadingProblems': 'Loading problems',
    'common.reloadingProblem': 'Reloading problem',
    'exercise.correct': 'Correct',
    'exercise.incorrect': 'Incorrect',
    'exercise.timeUp': 'Time is up',
    'exercise.completed': 'Exercise Completed!',
    'exercise.finalScore': 'Final Score',
    'exercise.help': 'Help',
    'exercise.tryAgain': 'Try Again',
    'exercise.showAnswer': 'Show Answer',
    'exercise.continue': 'Continue',
    'exercise.seconds': 's',
    'exercise.restart': 'Restart',
    'exercise.feedback': 'Feedback',
    'exercise.accuracy': 'Accuracy',
  }
};

// Hook simplificado para traducción
export function useTranslation() {
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  
  // Intentar obtener el idioma de localStorage o settings al iniciar
  useEffect(() => {
    try {
      // Buscar preferencia de idioma en configuración de módulo
      const settingsStr = localStorage.getItem('moduleSettings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings && settings.addition && settings.addition.language) {
          const lang = settings.addition.language === 'spanish' ? 'es' : 'en';
          setLanguage(lang);
        }
      }
    } catch (error) {
      console.error("Error loading language preference:", error);
    }
  }, []);
  
  // Función de traducción
  const t = (key: string): string => {
    if (translations[language] && key in translations[language]) {
      return translations[language][key as keyof typeof translations[typeof language]];
    }
    return key;
  };
  
  return { t, language, setLanguage };
}