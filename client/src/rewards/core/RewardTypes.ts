// Sistema de Tipos para el Sistema de Recompensas Modular
// Arquitectura: Strategy + Observer + Factory

export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RewardCategory = 'achievement' | 'milestone' | 'streak' | 'level_up' | 'collection' | 'special';
export type RewardTheme = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'alphabet' | 'general' | 'seasonal';

// Interfaz base para todas las recompensas
export interface BaseReward {
  id: string;
  name: string;
  description: string;
  rarity: RewardRarity;
  category: RewardCategory;
  theme: RewardTheme;
  points: number;
  unlockedAt?: Date;
  isNew?: boolean;
  icon?: string;
  color?: string;
  animationType?: 'pulse' | 'confetti' | 'glow' | 'bounce';
  soundEffect?: 'achievement' | 'level_up' | 'celebration' | 'coin';
}

// Criterios específicos para otorgar recompensas
export interface RewardCriteria {
  type: 'milestone' | 'streak' | 'level_up' | 'perseverance' | 'improvement' | 'seasonal';
  threshold: number;
  moduleId?: string; // Para recompensas específicas de módulo
  metadata?: Record<string, any>;
}

// Datos de progreso del usuario para validación
export interface UserProgressData {
  totalProblemsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  currentLevel: string;
  moduleProgress: Record<string, {
    problemsCompleted: number;
    accuracy: number;
    avgTimePerProblem: number;
    consecutiveCorrect: number;
  }>;
  lastActivity: Date;
}

// Evidencia recolectada de múltiples fuentes para validación
export interface RewardEvidence {
  source: 'database' | 'localStorage' | 'context' | 'api';
  data: UserProgressData;
  timestamp: Date;
  reliability: number; // 0-1, qué tan confiable es esta fuente
}

// Candidato a recompensa antes de validación
export interface RewardCandidate {
  reward: BaseReward;
  criteria: RewardCriteria;
  triggeredBy: 'problem_completed' | 'streak_achieved' | 'level_up' | 'manual';
  evidence: RewardEvidence[];
}

// Recompensa validada lista para mostrar
export interface ValidatedReward extends BaseReward {
  validatedAt: Date;
  validationScore: number; // 0-1, qué tan segura es la validación
  shouldShow: boolean;
}

// Configuración de recompensas por módulo
export interface ModuleRewardConfig {
  moduleId: string;
  enabledCategories: RewardCategory[];
  customCriteria?: RewardCriteria[];
  pointMultiplier: number;
  customRewards?: BaseReward[];
}

// Estado global del sistema de recompensas
export interface RewardSystemState {
  unlockedRewards: BaseReward[];
  newRewards: string[]; // IDs de recompensas no vistas
  totalPoints: number;
  isEnabled: boolean;
  lastCheck: Date;
  moduleConfigs: Record<string, ModuleRewardConfig>;
}

// Evento de recompensa para el sistema Observer
export interface RewardEvent {
  type: 'reward_unlocked' | 'reward_viewed' | 'collection_completed' | 'milestone_reached';
  rewardId?: string;
  moduleId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Colección de recompensas (grupos temáticos)
export interface RewardCollection {
  id: string;
  name: string;
  description: string;
  theme: RewardTheme;
  rewards: string[]; // IDs de recompensas
  completionReward?: BaseReward;
  isCompleted: boolean;
  progress: number; // 0-1
}

// Filtros para el álbum de recompensas
export interface RewardFilters {
  rarity?: RewardRarity[];
  category?: RewardCategory[];
  theme?: RewardTheme[];
  isUnlocked?: boolean;
  isNew?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Configuración de animaciones para recompensas
export interface RewardAnimation {
  type: 'pulse' | 'confetti' | 'glow' | 'bounce' | 'sparkle';
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  colors?: string[];
  soundEnabled: boolean;
}

// Métricas del sistema de recompensas
export interface RewardMetrics {
  totalRewardsUnlocked: number;
  rewardsByRarity: Record<RewardRarity, number>;
  rewardsByCategory: Record<RewardCategory, number>;
  averageTimeToUnlock: number;
  engagementScore: number; // Basado en frecuencia de uso
  lastRewardDate?: Date;
}

// Constantes del sistema
export const REWARD_RARITIES: Record<RewardRarity, { color: string; pointsMultiplier: number }> = {
  common: { color: '#9CA3AF', pointsMultiplier: 1 },
  rare: { color: '#3B82F6', pointsMultiplier: 2 },
  epic: { color: '#8B5CF6', pointsMultiplier: 3 },
  legendary: { color: '#F59E0B', pointsMultiplier: 5 }
};

export const REWARD_CATEGORIES: Record<RewardCategory, { icon: string; description: string }> = {
  achievement: { icon: '🏆', description: 'Logros específicos completados' },
  milestone: { icon: '🎯', description: 'Hitos de cantidad alcanzados' },
  streak: { icon: '🔥', description: 'Respuestas consecutivas correctas' },
  level_up: { icon: '⬆️', description: 'Progresión en dificultad' },
  collection: { icon: '📚', description: 'Grupos temáticos completados' },
  special: { icon: '⭐', description: 'Eventos únicos y estacionales' }
};

// Configuración por defecto para módulos
export const DEFAULT_MODULE_REWARD_CONFIG: ModuleRewardConfig = {
  moduleId: 'default',
  enabledCategories: ['achievement', 'milestone', 'streak', 'level_up'],
  pointMultiplier: 1,
  customCriteria: []
};