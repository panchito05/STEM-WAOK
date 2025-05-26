// Exportaciones principales del módulo Empty Module
export { default as EmptyExercise } from './Exercise';
export { default as EmptySettings, defaultEmptySettings } from './Settings';
export type { EmptyModuleSettings } from './Settings';
export type { EmptyProblem, DifficultyLevel, ExerciseLayout } from './types';
export * from './utils';

// Adaptadores para compatibilidad con el sistema
export { EmptyExerciseAdapter as Exercise, EmptySettingsAdapter as Settings } from './EmptyModuleAdapter';

// Información del módulo para el sistema
export const emptyModuleInfo = {
  id: 'empty',
  name: 'Empty Module',
  description: 'Plantilla base para crear nuevos módulos educativos',
  icon: '📝',
  category: 'template',
  version: '1.0.0',
  author: 'Math W+A+O+K',
  
  // Niveles de dificultad soportados
  supportedDifficulties: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'] as const,
  
  // Configuraciones por defecto
  get defaultSettings() {
    // Importación dinámica para evitar problemas de dependencias circulares
    const { defaultEmptySettings } = require('./Settings');
    return defaultEmptySettings;
  },
  
  // Metadatos adicionales
  metadata: {
    isTemplate: true,
    canBeCustomized: true,
    supportsMultipleLanguages: true,
    hasProgressTracking: true,
    hasSettings: true,
  }
};