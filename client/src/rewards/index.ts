// Sistema de Recompensas Modular - Exportaciones Principales
// Punto de entrada único para usar el sistema desde cualquier módulo

// Core System
export { RewardEngine } from './core/RewardEngine';
export { RewardGuardian } from './core/RewardGuardian';
export { useRewardStore, useRewardSelectors } from './core/RewardStore';

// Types
export type {
  BaseReward,
  ValidatedReward,
  RewardRarity,
  RewardCategory,
  RewardTheme,
  RewardCriteria,
  UserProgressData,
  RewardEvidence,
  ModuleRewardConfig,
  RewardSystemState,
  RewardEvent,
  RewardMetrics
} from './core/RewardTypes';

export {
  REWARD_RARITIES,
  REWARD_CATEGORIES,
  DEFAULT_MODULE_REWARD_CONFIG
} from './core/RewardTypes';

// Data Collectors
export {
  DatabaseCollector,
  LocalStorageCollector,
  ContextCollector,
  CollectorCoordinator
} from './collectors/DataCollectors';

export type { RewardDataCollector } from './collectors/DataCollectors';

// React Hooks
export { useRewards } from './hooks/useRewards';
export type { UseRewardsOptions, UseRewardsReturn } from './hooks/useRewards';

// UI Components
export { RewardModal, useRewardQueue } from './presentation/RewardModal';

// Utility Functions
export const RewardUtils = {
  /**
   * Convierte progreso de ejercicio a formato UserProgressData
   */
  transformExerciseProgress: (exerciseData: any): UserProgressData => {
    return {
      totalProblemsCompleted: exerciseData.totalProblems || 0,
      currentStreak: exerciseData.currentStreak || 0,
      longestStreak: exerciseData.longestStreak || 0,
      currentLevel: exerciseData.difficulty || 'beginner',
      moduleProgress: {
        [exerciseData.operationId || 'addition']: {
          problemsCompleted: exerciseData.totalProblems || 0,
          accuracy: exerciseData.accuracy || 0,
          avgTimePerProblem: exerciseData.avgTimePerProblem || 0,
          consecutiveCorrect: exerciseData.currentStreak || 0
        }
      },
      lastActivity: new Date()
    };
  },

  /**
   * Calcula el nivel basado en problemas completados
   */
  calculateLevel: (problemsCompleted: number): string => {
    if (problemsCompleted >= 100) return 'expert';
    if (problemsCompleted >= 50) return 'advanced';
    if (problemsCompleted >= 25) return 'intermediate';
    if (problemsCompleted >= 10) return 'elementary';
    return 'beginner';
  },

  /**
   * Obtiene el color de una rareza
   */
  getRarityColor: (rarity: RewardRarity): string => {
    return REWARD_RARITIES[rarity]?.color || '#9CA3AF';
  },

  /**
   * Obtiene el icono de una categoría
   */
  getCategoryIcon: (category: RewardCategory): string => {
    return REWARD_CATEGORIES[category]?.icon || '🏆';
  }
};