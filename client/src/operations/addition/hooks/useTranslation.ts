// useTranslation.ts - Hook para manejar traducciones en el módulo
import { useCallback } from 'react';
import { useStore } from '@/store/store';

interface TranslationParams {
  [key: string]: string | number;
}

export const useTranslation = () => {
  const store = useStore();
  const language = store.activeProfile?.moduleSettings?.addition?.language || 'es';
  
  // Traducciones disponibles
  const translations: Record<string, Record<string, string>> = {
    es: {
      // Mensajes comunes
      'common.correct': 'Correcto',
      'common.incorrect': 'Incorrecto',
      'common.skip': 'Saltar',
      'common.showSolution': 'Ver solución',
      'common.tryAgain': 'Intentar de nuevo',
      'common.returnToMenu': 'Volver al menú',
      'common.continue': 'Continuar',
      
      // Ejercicio
      'exercise.addition': 'Ejercicio de suma',
      'exercise.wordProblem': 'Problema de texto',
      'exercise.progress': 'Progreso',
      'exercise.timeRemaining': 'Tiempo restante',
      
      // Resultados
      'results.exerciseComplete': '¡Ejercicio completado!',
      'results.excellent': '¡Excelente trabajo!',
      'results.good': '¡Buen trabajo!',
      'results.fair': 'Buen intento',
      'results.needsPractice': 'Necesitas más práctica',
      'results.correct': 'correctas',
      'results.problemReview': 'Revisión de problemas',
      'results.yourAnswer': 'Tu respuesta',
      
      // Explicaciones
      'explanation.title': 'Explicación',
      'explanation.wordProblemIntro': 'Este es un problema de texto que requiere identificar los números y realizar una suma.',
      'explanation.extractNumbers': 'Los números que debemos sumar son: {numbers}.',
      'explanation.performAddition': 'Al sumar {operands}, obtenemos {result}.',
      'explanation.additionIntro': 'Para resolver {operands}, seguimos estos pasos:',
      'explanation.decimalAlignment': 'Debemos alinear los números por el punto decimal para sumar correctamente.',
      'explanation.groupingNumbers': 'Podemos agrupar los números para facilitar el cálculo.',
      'explanation.addingNumbers': 'Sumamos {current} + {next} = {result}.',
      'explanation.additionResult': 'Por lo tanto, {operands} = {result}.'
    },
    en: {
      // Common messages
      'common.correct': 'Correct',
      'common.incorrect': 'Incorrect',
      'common.skip': 'Skip',
      'common.showSolution': 'Show solution',
      'common.tryAgain': 'Try again',
      'common.returnToMenu': 'Return to menu',
      'common.continue': 'Continue',
      
      // Exercise
      'exercise.addition': 'Addition Exercise',
      'exercise.wordProblem': 'Word Problem',
      'exercise.progress': 'Progress',
      'exercise.timeRemaining': 'Time remaining',
      
      // Results
      'results.exerciseComplete': 'Exercise completed!',
      'results.excellent': 'Excellent work!',
      'results.good': 'Good job!',
      'results.fair': 'Nice try',
      'results.needsPractice': 'Needs more practice',
      'results.correct': 'correct',
      'results.problemReview': 'Problem Review',
      'results.yourAnswer': 'Your answer',
      
      // Explanations
      'explanation.title': 'Explanation',
      'explanation.wordProblemIntro': 'This is a word problem that requires identifying numbers and performing addition.',
      'explanation.extractNumbers': 'The numbers we need to add are: {numbers}.',
      'explanation.performAddition': 'By adding {operands}, we get {result}.',
      'explanation.additionIntro': 'To solve {operands}, we follow these steps:',
      'explanation.decimalAlignment': 'We need to align the decimal points to add correctly.',
      'explanation.groupingNumbers': 'We can group numbers to make the calculation easier.',
      'explanation.addingNumbers': 'We add {current} + {next} = {result}.',
      'explanation.additionResult': 'Therefore, {operands} = {result}.'
    }
  };
  
  // Función para obtener la traducción según el idioma actual
  const t = useCallback((key: string, params?: TranslationParams): string => {
    const lang = language in translations ? language : 'es'; // Fallback a español
    let text = translations[lang][key] || key; // Si no hay traducción, usar la clave
    
    // Reemplazar parámetros en el texto si existen
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return text;
  }, [language]);
  
  return { t, language };
};