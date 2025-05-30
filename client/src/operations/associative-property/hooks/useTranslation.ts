import { useCallback } from 'react';
import { useStore } from '@/store/store';

// Tipo para parámetros de traducción
interface TranslationParams {
  [key: string]: string | number;
}

// Formato de mensajes para el idioma español
const esMessages: Record<string, string> = {
  submit: 'Enviar',
  answer: 'Respuesta',
  correct: '¡Correcto!',
  incorrect: 'Incorrecto',
  continue: 'Continuar',
  explanationStart: 'Para sumar {{operand1}} y {{operand2}}',
  explanationWrong: 'Tú respondiste {{answer}}',
  explanationMultipleOperands: 'Para resolver este problema, sumamos todos los números:',
  explanationStepByStep: 'Paso a paso:',
  score: 'Puntuación: {{score}} / {{total}}',
  timeSpent: 'Tiempo',
  difficulty: 'Dificultad',
  difficultyEasy: 'Fácil',
  difficultyMedium: 'Medio',
  difficultyHard: 'Difícil',
  difficultyExpert: 'Experto',
  difficultyUnknown: 'Desconocido',
  correctIncorrect: 'Correcto/Incorrecto',
  problemSummary: 'Resumen de problemas',
  youAnswered: 'Tu respuesta: {{answer}}',
  home: 'Inicio',
  tryAgain: 'Intentar de nuevo',
  excellentJob: '¡Excelente trabajo!',
  greatJob: '¡Buen trabajo!',
  goodEffort: '¡Buen esfuerzo!',
  keepPracticing: 'Sigue practicando',
  timeRemaining: 'Tiempo restante: {{time}}',
  skip: 'Saltar',
  showSolution: 'Mostrar solución'
};

// Formato de mensajes para el idioma inglés
const enMessages: Record<string, string> = {
  submit: 'Submit',
  answer: 'Answer',
  correct: 'Correct!',
  incorrect: 'Incorrect',
  continue: 'Continue',
  explanationStart: 'To add {{operand1}} and {{operand2}}',
  explanationWrong: 'You answered {{answer}}',
  explanationMultipleOperands: 'To solve this problem, we add all the numbers:',
  explanationStepByStep: 'Step by step:',
  score: 'Score: {{score}} / {{total}}',
  timeSpent: 'Time Spent',
  difficulty: 'Difficulty',
  difficultyEasy: 'Easy',
  difficultyMedium: 'Medium',
  difficultyHard: 'Hard',
  difficultyExpert: 'Expert',
  difficultyUnknown: 'Unknown',
  correctIncorrect: 'Correct/Incorrect',
  problemSummary: 'Problem Summary',
  youAnswered: 'Your answer: {{answer}}',
  home: 'Home',
  tryAgain: 'Try Again',
  excellentJob: 'Excellent job!',
  greatJob: 'Great job!',
  goodEffort: 'Good effort!',
  keepPracticing: 'Keep practicing',
  timeRemaining: 'Time remaining: {{time}}',
  skip: 'Skip',
  showSolution: 'Show Solution'
};

// Mensajes por idioma
const messages: Record<string, Record<string, string>> = {
  en: enMessages,
  es: esMessages
};

/**
 * Hook para manejar traducciones en el módulo de suma
 */
export const useTranslation = () => {
  // Obtener el idioma actual de la store global
  const language = useStore(state => 
    state.currentProfile?.moduleSettings?.addition?.language || 
    state.settings?.language || 
    'es'
  );
  
  /**
   * Traduce una clave a texto según el idioma actual
   * @param key Clave de traducción
   * @param params Parámetros para reemplazar en el texto
   * @returns Texto traducido
   */
  const t = useCallback((key: string, options?: { defaultValue?: string; values?: TranslationParams }): string => {
    // Obtener los mensajes para el idioma actual
    const currentMessages = messages[language] || messages['es'];
    
    // Intentar obtener la traducción
    let translation = currentMessages[key];
    
    // Si no existe la traducción, usar el valor por defecto o la clave
    if (!translation) {
      translation = options?.defaultValue || key;
    }
    
    // Reemplazar los parámetros en el texto
    if (options?.values) {
      Object.entries(options.values).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }
    
    return translation;
  }, [language]);
  
  return { t, language };
};