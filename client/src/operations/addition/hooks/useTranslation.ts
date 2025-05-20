// useTranslation.ts - Hook para manejar traducciones en el módulo de suma
import { useContext, useCallback } from 'react';
import { SettingsContext } from '@/context/SettingsContext';

// Traducciones disponibles
const translations = {
  english: {
    'common.loading': 'Loading...',
    'common.timeRemaining': 'Time:',
    
    'exercise.start': 'Start',
    'exercise.problem': 'Problem',
    'exercise.seconds': 's',
    'exercise.explanation': 'Explanation',
    'exercise.explanationText': 'To add {first} + {second}, we count {first} units and then add {second} more units, which gives us {result} units in total.',
    'exercise.visualRepresentation': 'Visual Representation',
    'exercise.tips': 'Tips',
    'exercise.tipBreakdown': 'Break down large numbers into smaller parts to make addition easier.',
    'exercise.tipPractice': 'Regular practice makes mental addition faster and more accurate.',
    
    'results.completed': 'Exercise Completed',
    'results.points': 'points',
    'results.excellent': 'Excellent Work!',
    'results.good': 'Good Job!',
    'results.average': 'Not Bad!',
    'results.needsPractice': 'Keep Practicing!',
    'results.totalProblems': 'Total Problems',
    'results.correctAnswers': 'Correct',
    'results.wrongAnswers': 'Incorrect',
    'results.accuracy': 'Accuracy',
    'results.problemList': 'Problem List',
    'results.tryAgain': 'Try Again',
    'results.backToHome': 'Back to Home'
  },
  spanish: {
    'common.loading': 'Cargando...',
    'common.timeRemaining': 'Tiempo:',
    
    'exercise.start': 'Comenzar',
    'exercise.problem': 'Problema',
    'exercise.seconds': 's',
    'exercise.explanation': 'Explicación',
    'exercise.explanationText': 'Para sumar {first} + {second}, contamos {first} unidades y luego agregamos {second} unidades más, lo que nos da un total de {result} unidades.',
    'exercise.visualRepresentation': 'Representación Visual',
    'exercise.tips': 'Consejos',
    'exercise.tipBreakdown': 'Descompón números grandes en partes más pequeñas para facilitar la suma.',
    'exercise.tipPractice': 'La práctica regular hace que la suma mental sea más rápida y precisa.',
    
    'results.completed': 'Ejercicio Completado',
    'results.points': 'puntos',
    'results.excellent': '¡Excelente Trabajo!',
    'results.good': '¡Buen Trabajo!',
    'results.average': '¡No Está Mal!',
    'results.needsPractice': '¡Sigue Practicando!',
    'results.totalProblems': 'Total de Problemas',
    'results.correctAnswers': 'Correctos',
    'results.wrongAnswers': 'Incorrectos',
    'results.accuracy': 'Precisión',
    'results.problemList': 'Lista de Problemas',
    'results.tryAgain': 'Intentar de Nuevo',
    'results.backToHome': 'Volver al Inicio'
  }
};

// Tipo de parámetros de traducción
type TranslationParams = Record<string, string | number>;

/**
 * Hook personalizado para manejar traducciones en el módulo de suma
 */
export function useTranslation() {
  // Obtener configuración de idioma del contexto global
  const { getModuleSettings } = useContext(SettingsContext);
  const settings = getModuleSettings('addition');
  
  // Determinar el idioma a usar
  const language = settings?.language || 'spanish';
  const currentTranslations = language === 'english' ? translations.english : translations.spanish;
  
  /**
   * Función para traducir una clave con parámetros opcionales
   */
  const t = useCallback((key: string, params?: TranslationParams): string => {
    let text = currentTranslations[key] || key;
    
    // Reemplazar parámetros si existen
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return text;
  }, [currentTranslations]);
  
  return { t, language };
}