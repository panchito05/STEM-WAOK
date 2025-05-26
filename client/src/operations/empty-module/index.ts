// Punto de entrada principal para el módulo Empty Module
export { default as Exercise } from './Exercise';
export { default as Settings } from './Settings';
export * from './types';
export * from './utils';

// Configuración del módulo
export const moduleConfig = {
  id: 'empty-module',
  name: 'Empty Module',
  description: 'Módulo genérico de plantilla para nuevas operaciones',
  icon: '📝',
  category: 'math',
  difficulty: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
  features: [
    'Configuración adaptativa de dificultad',
    'Sistema de temporización por problema',
    'Retroalimentación inmediata',
    'Sistema de recompensas',
    'Soporte multiidioma',
    'Tracking detallado de progreso'
  ],
  defaultSettings: {
    difficulty: 'beginner',
    problemCount: 10,
    timeValue: 0,
    maxAttempts: 2,
    showImmediateFeedback: true,
    enableSoundEffects: true,
    showAnswerWithExplanation: true,
    enableAdaptiveDifficulty: true,
    enableCompensation: true,
    enableRewards: true,
    rewardType: 'stars',
    language: 'english'
  }
};