// RewardStore: Estado Global del Sistema de Recompensas usando Zustand
// Maneja el estado sin interferir con otros contextos de la aplicación

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BaseReward, 
  RewardSystemState, 
  ValidatedReward,
  RewardMetrics,
  ModuleRewardConfig,
  DEFAULT_MODULE_REWARD_CONFIG
} from './RewardTypes';

interface RewardStoreState extends RewardSystemState {
  // Acciones para manejar recompensas
  addReward: (reward: ValidatedReward) => void;
  markRewardAsViewed: (rewardId: string) => void;
  markAllRewardsAsViewed: () => void;
  
  // Acciones para configuración de módulos
  setModuleConfig: (moduleId: string, config: ModuleRewardConfig) => void;
  getModuleConfig: (moduleId: string) => ModuleRewardConfig;
  
  // Acciones para gestión del sistema
  enableRewards: () => void;
  disableRewards: () => void;
  addPoints: (points: number) => void;
  
  // Getters para métricas
  getMetrics: () => RewardMetrics;
  getNewRewardsCount: () => number;
  getRewardsByCategory: (category: string) => BaseReward[];
  getRewardsByRarity: (rarity: string) => BaseReward[];
  
  // Acciones para limpieza
  clearAllRewards: () => void;
  resetSystem: () => void;
}

const initialState: RewardSystemState = {
  unlockedRewards: [],
  newRewards: [],
  totalPoints: 0,
  isEnabled: true,
  lastCheck: new Date(),
  moduleConfigs: {
    addition: {
      ...DEFAULT_MODULE_REWARD_CONFIG,
      moduleId: 'addition'
    }
  }
};

export const useRewardStore = create<RewardStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Agregar una nueva recompensa validada
      addReward: (reward: ValidatedReward) => {
        set((state) => {
          // Verificar si la recompensa ya existe
          const exists = state.unlockedRewards.some(r => r.id === reward.id);
          if (exists) {
            console.warn(`⚠️ RewardStore: Recompensa ${reward.id} ya existe`);
            return state;
          }

          const newReward = {
            ...reward,
            unlockedAt: new Date(),
            isNew: true
          };

          console.log(`✨ RewardStore: Nueva recompensa agregada: ${reward.name} (+${reward.points} puntos)`);

          return {
            ...state,
            unlockedRewards: [...state.unlockedRewards, newReward],
            newRewards: [...state.newRewards, reward.id],
            totalPoints: state.totalPoints + reward.points,
            lastCheck: new Date()
          };
        });
      },

      // Marcar una recompensa como vista
      markRewardAsViewed: (rewardId: string) => {
        set((state) => ({
          ...state,
          unlockedRewards: state.unlockedRewards.map(reward =>
            reward.id === rewardId ? { ...reward, isNew: false } : reward
          ),
          newRewards: state.newRewards.filter(id => id !== rewardId)
        }));
      },

      // Marcar todas las recompensas como vistas
      markAllRewardsAsViewed: () => {
        set((state) => ({
          ...state,
          unlockedRewards: state.unlockedRewards.map(reward => ({ ...reward, isNew: false })),
          newRewards: []
        }));
      },

      // Configurar un módulo
      setModuleConfig: (moduleId: string, config: ModuleRewardConfig) => {
        set((state) => ({
          ...state,
          moduleConfigs: {
            ...state.moduleConfigs,
            [moduleId]: config
          }
        }));
      },

      // Obtener configuración de un módulo
      getModuleConfig: (moduleId: string) => {
        const state = get();
        return state.moduleConfigs[moduleId] || {
          ...DEFAULT_MODULE_REWARD_CONFIG,
          moduleId
        };
      },

      // Habilitar sistema de recompensas
      enableRewards: () => {
        set((state) => ({
          ...state,
          isEnabled: true
        }));
        console.log('🎯 Sistema de recompensas habilitado');
      },

      // Deshabilitar sistema de recompensas
      disableRewards: () => {
        set((state) => ({
          ...state,
          isEnabled: false
        }));
        console.log('⏸️ Sistema de recompensas deshabilitado');
      },

      // Agregar puntos directamente
      addPoints: (points: number) => {
        set((state) => ({
          ...state,
          totalPoints: state.totalPoints + points
        }));
      },

      // Obtener métricas del sistema
      getMetrics: (): RewardMetrics => {
        const state = get();
        
        const rewardsByRarity = state.unlockedRewards.reduce((acc, reward) => {
          acc[reward.rarity] = (acc[reward.rarity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const rewardsByCategory = state.unlockedRewards.reduce((acc, reward) => {
          acc[reward.category] = (acc[reward.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const timestamps = state.unlockedRewards
          .map(r => r.unlockedAt?.getTime())
          .filter(t => t !== undefined) as number[];
        
        const averageTimeToUnlock = timestamps.length > 1 
          ? (Math.max(...timestamps) - Math.min(...timestamps)) / (timestamps.length - 1)
          : 0;

        const engagementScore = Math.min(1, state.unlockedRewards.length / 20); // 20 recompensas = engagement completo

        const lastRewardDate = state.unlockedRewards.length > 0
          ? new Date(Math.max(...timestamps))
          : undefined;

        return {
          totalRewardsUnlocked: state.unlockedRewards.length,
          rewardsByRarity: rewardsByRarity as any,
          rewardsByCategory: rewardsByCategory as any,
          averageTimeToUnlock,
          engagementScore,
          lastRewardDate
        };
      },

      // Obtener cantidad de recompensas nuevas
      getNewRewardsCount: () => {
        const state = get();
        return state.newRewards.length;
      },

      // Obtener recompensas por categoría
      getRewardsByCategory: (category: string) => {
        const state = get();
        return state.unlockedRewards.filter(reward => reward.category === category);
      },

      // Obtener recompensas por rareza
      getRewardsByRarity: (rarity: string) => {
        const state = get();
        return state.unlockedRewards.filter(reward => reward.rarity === rarity);
      },

      // Limpiar todas las recompensas (para testing/debug)
      clearAllRewards: () => {
        set((state) => ({
          ...state,
          unlockedRewards: [],
          newRewards: [],
          totalPoints: 0,
          lastCheck: new Date()
        }));
        console.log('🧹 Todas las recompensas han sido limpiadas');
      },

      // Resetear todo el sistema
      resetSystem: () => {
        set(() => ({
          ...initialState,
          lastCheck: new Date()
        }));
        console.log('🔄 Sistema de recompensas reseteado completamente');
      }
    }),
    {
      name: 'reward-system-storage',
      // Solo persistir datos esenciales, no funciones
      partialize: (state) => ({
        unlockedRewards: state.unlockedRewards,
        newRewards: state.newRewards,
        totalPoints: state.totalPoints,
        isEnabled: state.isEnabled,
        lastCheck: state.lastCheck,
        moduleConfigs: state.moduleConfigs
      }),
      // Migración de versiones si es necesario en el futuro
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migración de versión 0 a 1 si es necesario
          return {
            ...persistedState,
            moduleConfigs: persistedState.moduleConfigs || {
              addition: {
                ...DEFAULT_MODULE_REWARD_CONFIG,
                moduleId: 'addition'
              }
            }
          };
        }
        return persistedState;
      }
    }
  )
);

// Selectores específicos para optimizar re-renders
export const useRewardSelectors = {
  // Solo recompensas nuevas
  useNewRewards: () => useRewardStore((state) => 
    state.unlockedRewards.filter(reward => state.newRewards.includes(reward.id))
  ),
  
  // Solo puntos totales
  useTotalPoints: () => useRewardStore((state) => state.totalPoints),
  
  // Solo estado de habilitado
  useIsEnabled: () => useRewardStore((state) => state.isEnabled),
  
  // Solo cantidad de recompensas nuevas
  useNewRewardsCount: () => useRewardStore((state) => state.newRewards.length),
  
  // Recompensas por rareza específica
  useRewardsByRarity: (rarity: string) => useRewardStore((state) => 
    state.unlockedRewards.filter(reward => reward.rarity === rarity)
  ),
  
  // Últimas N recompensas
  useRecentRewards: (limit: number = 5) => useRewardStore((state) => 
    state.unlockedRewards
      .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
      .slice(0, limit)
  )
};