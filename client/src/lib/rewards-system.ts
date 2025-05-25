// Sistema de recompensas mejorado para Math W+A+O+K
// Este archivo contiene la lógica y tipos para el sistema de recompensas

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos de recompensas
export type RewardTier = 'common' | 'rare' | 'epic' | 'legendary';
export type RewardCategory = 'achievement' | 'milestone' | 'streak' | 'level-up' | 'collection';
export type RewardTheme = 
  'addition' | 'subtraction' | 'multiplication' | 'division' | 
  'fractions' | 'alphabet' | 'general' | 'seasonal';

// Definición de una recompensa
export interface Reward {
  id: string;
  name: string;
  description: string;
  tier: RewardTier;
  category: RewardCategory;
  theme: RewardTheme;
  icon: string;  // Nombre del icono o ruta a la imagen
  animation?: string; // Tipo de animación a mostrar
  sound?: string;  // Nombre del efecto de sonido
  color?: string;  // Color principal para la recompensa
  dateEarned: Date;
  isNew?: boolean; // Para marcar nuevas recompensas no vistas
}

// Condiciones para desbloquear recompensas
export interface RewardCondition {
  type: 'problemsCompleted' | 'streak' | 'levelUp' | 'timeSpent' | 'specificAchievement' | 'improvedPerformance';
  value: number; // Valor numérico requerido
  theme?: RewardTheme; // Tema específico si es necesario
  module?: string; // Módulo específico si es necesario
}

// Definición de las colecciones de recompensas
export interface RewardCollection {
  id: string;
  name: string;
  description: string;
  theme: RewardTheme;
  rewards: string[]; // IDs de las recompensas que forman parte de la colección
  isComplete: boolean;
  progress: number; // Porcentaje de la colección completada (0-100)
}

// Definición del estado de recompensas para el usuario
interface RewardsState {
  earnedRewards: Reward[];
  collections: RewardCollection[];
  totalRewardsCount: number;
  newRewardsCount: number;
  recentReward: Reward | null;
  showRewardAnimation: boolean;
  rewardsAlbumOpened: boolean;
  
  // Acciones
  addReward: (reward: Reward) => void;
  markRewardAsSeen: (rewardId: string) => void;
  updateCollection: (collectionId: string) => void;
  setShowRewardAnimation: (show: boolean) => void;
  setRewardsAlbumOpened: (opened: boolean) => void;
  resetNewRewardsCount: () => void;
  resetAllRewards: () => void;
}

// Catálogo de recompensas disponibles en el sistema
export const rewardsCatalog: Record<string, Omit<Reward, 'dateEarned' | 'isNew'>> = {
  // Recompensas de Suma (Adición)
  'addition-novice': {
    id: 'addition-novice',
    name: 'Aprendiz de Suma',
    description: 'Completaste tus primeros 10 problemas de suma',
    tier: 'common',
    category: 'milestone',
    theme: 'addition',
    icon: 'Calculator',
    color: '#4CAF50'
  },
  'addition-enthusiast': {
    id: 'addition-enthusiast',
    name: 'Entusiasta de Sumas',
    description: 'Completaste 25 problemas de suma',
    tier: 'common',
    category: 'milestone',
    theme: 'addition',
    icon: 'Plus',
    color: '#4CAF50'
  },
  'addition-expert': {
    id: 'addition-expert',
    name: 'Experto en Sumas',
    description: 'Completaste 50 problemas de suma',
    tier: 'rare',
    category: 'milestone',
    theme: 'addition',
    icon: 'Award',
    animation: 'pulse',
    color: '#2E7D32'
  },
  'addition-master': {
    id: 'addition-master',
    name: 'Maestro de la Suma',
    description: 'Completaste 100 problemas de suma',
    tier: 'epic',
    category: 'milestone',
    theme: 'addition',
    icon: 'Trophy',
    animation: 'confetti',
    sound: 'achievement',
    color: '#1B5E20'
  },
  
  // Recompensas de racha
  'streak-5': {
    id: 'streak-5',
    name: 'Racha de 5',
    description: '¡5 respuestas correctas consecutivas!',
    tier: 'common',
    category: 'streak',
    theme: 'general',
    icon: 'Flame',
    animation: 'bounce',
    color: '#FF9800'
  },
  'streak-10': {
    id: 'streak-10',
    name: 'Racha de 10',
    description: '¡10 respuestas correctas consecutivas!',
    tier: 'rare',
    category: 'streak',
    theme: 'general',
    icon: 'Flame',
    animation: 'pulse',
    sound: 'streak',
    color: '#F57C00'
  },
  'streak-20': {
    id: 'streak-20',
    name: 'Racha Imparable',
    description: '¡20 respuestas correctas consecutivas!',
    tier: 'epic',
    category: 'streak',
    theme: 'general',
    icon: 'Zap',
    animation: 'confetti',
    sound: 'achievement',
    color: '#E65100'
  },
  
  // Recompensas de subida de nivel
  'level-elementary': {
    id: 'level-elementary',
    name: 'Nivel Elemental',
    description: '¡Desbloqueaste el nivel Elemental!',
    tier: 'rare',
    category: 'level-up',
    theme: 'general',
    icon: 'ArrowUp',
    animation: 'levelUp',
    sound: 'levelUp',
    color: '#2196F3'
  },
  'level-intermediate': {
    id: 'level-intermediate',
    name: 'Nivel Intermedio',
    description: '¡Desbloqueaste el nivel Intermedio!',
    tier: 'epic',
    category: 'level-up',
    theme: 'general',
    icon: 'ArrowUpCircle',
    animation: 'levelUp',
    sound: 'levelUp',
    color: '#1976D2'
  },
  'level-advanced': {
    id: 'level-advanced',
    name: 'Nivel Avanzado',
    description: '¡Desbloqueaste el nivel Avanzado!',
    tier: 'epic',
    category: 'level-up',
    theme: 'general',
    icon: 'Award',
    animation: 'levelUp',
    sound: 'levelUp',
    color: '#0D47A1'
  },
  'level-expert': {
    id: 'level-expert',
    name: 'Nivel Experto',
    description: '¡Desbloqueaste el nivel Experto!',
    tier: 'legendary',
    category: 'level-up',
    theme: 'general',
    icon: 'Crown',
    animation: 'levelUp',
    sound: 'levelUp',
    color: '#6200EA'
  },
  
  // Recompensas por mejora de rendimiento
  'improvement-star': {
    id: 'improvement-star',
    name: 'Estrella de Mejora',
    description: 'Mejoraste tu rendimiento considerablemente',
    tier: 'rare',
    category: 'achievement',
    theme: 'general',
    icon: 'Star',
    animation: 'pulse',
    color: '#FFC107'
  },
  'perseverance': {
    id: 'perseverance',
    name: 'Perseverancia',
    description: 'Seguiste intentándolo hasta lograrlo',
    tier: 'rare',
    category: 'achievement',
    theme: 'general',
    icon: 'Heart',
    animation: 'heartbeat',
    color: '#E91E63'
  },
  
  // Recompensas sorpresa
  'surprise-gift': {
    id: 'surprise-gift',
    name: 'Regalo Sorpresa',
    description: '¡Una recompensa inesperada!',
    tier: 'rare',
    category: 'achievement',
    theme: 'general',
    icon: 'Gift',
    animation: 'bounce',
    color: '#9C27B0'
  },
  
  // Recompensas por completar sesiones
  'session-complete': {
    id: 'session-complete',
    name: 'Sesión Completada',
    description: 'Completaste toda una sesión de ejercicios',
    tier: 'common',
    category: 'milestone',
    theme: 'general',
    icon: 'CheckCircle',
    animation: 'bounce',
    color: '#00BCD4'
  },
  'perfect-session': {
    id: 'perfect-session',
    name: 'Sesión Perfecta',
    description: 'Completaste una sesión sin errores',
    tier: 'epic',
    category: 'achievement',
    theme: 'general',
    icon: 'Award',
    animation: 'confetti',
    sound: 'achievement',
    color: '#FFD700'
  }
};

// Definición de las colecciones disponibles
export const collectionsCatalog: Record<string, Omit<RewardCollection, 'isComplete' | 'progress'>> = {
  'addition-collection': {
    id: 'addition-collection',
    name: 'Colección de Suma',
    description: 'Colecciona todas las recompensas relacionadas con sumas',
    theme: 'addition',
    rewards: ['addition-novice', 'addition-enthusiast', 'addition-expert', 'addition-master']
  },
  'streak-collection': {
    id: 'streak-collection',
    name: 'Colección de Rachas',
    description: 'Demuestra tu consistencia logrando todas las rachas',
    theme: 'general',
    rewards: ['streak-5', 'streak-10', 'streak-20']
  },
  'levels-collection': {
    id: 'levels-collection',
    name: 'Colección de Niveles',
    description: 'Domina todos los niveles de dificultad',
    theme: 'general',
    rewards: ['level-elementary', 'level-intermediate', 'level-advanced', 'level-expert']
  }
};

// Función para evaluar si una recompensa debe ser otorgada
export function checkRewardCondition(
  condition: RewardCondition, 
  currentValue: number,
  moduleTheme?: RewardTheme,
  moduleName?: string
): boolean {
  if (condition.theme && moduleTheme && condition.theme !== moduleTheme) {
    return false;
  }
  
  if (condition.module && moduleName && condition.module !== moduleName) {
    return false;
  }
  
  return currentValue >= condition.value;
}

// Hook para mantener el estado y lógica de las recompensas
export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      earnedRewards: [],
      collections: [],
      totalRewardsCount: 0,
      newRewardsCount: 0,
      recentReward: null,
      showRewardAnimation: false,
      rewardsAlbumOpened: false,
      
      // Método para resetear completamente todas las recompensas
      resetAllRewards: () => {
        console.log("🔄 Reseteando todo el sistema de recompensas");
        set({
          earnedRewards: [],
          collections: [],
          totalRewardsCount: 0,
          newRewardsCount: 0,
          recentReward: null,
          showRewardAnimation: false,
          rewardsAlbumOpened: false
        });
      },
      
      addReward: (reward: Reward) => {
        // No añadir recompensas duplicadas
        if (get().earnedRewards.some(r => r.id === reward.id)) {
          return;
        }
        
        set(state => ({
          earnedRewards: [...state.earnedRewards, reward],
          totalRewardsCount: state.totalRewardsCount + 1,
          newRewardsCount: state.newRewardsCount + 1,
          recentReward: reward,
          showRewardAnimation: true,
        }));
        
        // Actualizar colecciones automáticamente
        const rewardId = reward.id;
        const collections = get().collections;
        const updatedCollections = [...collections];
        
        // Para cada colección, verificar si la recompensa pertenece a ella
        Object.values(collectionsCatalog).forEach(catalogCollection => {
          if (catalogCollection.rewards.includes(rewardId)) {
            // Buscar si ya existe la colección 
            const existingCollectionIndex = collections.findIndex(c => c.id === catalogCollection.id);
            
            if (existingCollectionIndex >= 0) {
              // Actualizar colección existente
              const existingCollection = collections[existingCollectionIndex];
              const updatedRewards = [...existingCollection.rewards, rewardId];
              const progress = Math.round((updatedRewards.length / catalogCollection.rewards.length) * 100);
              const isComplete = progress === 100;
              
              updatedCollections[existingCollectionIndex] = {
                ...existingCollection,
                rewards: updatedRewards,
                progress,
                isComplete
              };
            } else {
              // Crear nueva colección
              const progress = Math.round((1 / catalogCollection.rewards.length) * 100);
              updatedCollections.push({
                ...catalogCollection,
                rewards: [rewardId],
                progress,
                isComplete: progress === 100
              });
            }
          }
        });
        
        set({ collections: updatedCollections });
      },
      
      markRewardAsSeen: (rewardId: string) => {
        set(state => ({
          earnedRewards: state.earnedRewards.map(r => 
            r.id === rewardId ? { ...r, isNew: false } : r
          ),
          newRewardsCount: Math.max(0, state.newRewardsCount - 1)
        }));
      },
      
      updateCollection: (collectionId: string) => {
        const collections = get().collections;
        const collectionIndex = collections.findIndex(c => c.id === collectionId);
        
        if (collectionIndex < 0) return;
        
        const collection = collections[collectionIndex];
        const earnedRewards = get().earnedRewards;
        const earnedRewardIds = earnedRewards.map(r => r.id);
        
        // Obtener el catálogo de la colección
        const catalogCollection = collectionsCatalog[collectionId];
        if (!catalogCollection) return;
        
        // Actualizar los IDs de recompensas ganadas que pertenecen a esta colección
        const updatedRewardIds = catalogCollection.rewards.filter(id => earnedRewardIds.includes(id));
        const progress = Math.round((updatedRewardIds.length / catalogCollection.rewards.length) * 100);
        
        const updatedCollections = [...collections];
        updatedCollections[collectionIndex] = {
          ...collection,
          rewards: updatedRewardIds,
          progress,
          isComplete: progress === 100
        };
        
        set({ collections: updatedCollections });
      },
      
      setShowRewardAnimation: (show: boolean) => {
        set({ showRewardAnimation: show });
      },
      
      setRewardsAlbumOpened: (opened: boolean) => {
        set({ rewardsAlbumOpened: opened });
      },
      
      resetNewRewardsCount: () => {
        set(state => ({
          newRewardsCount: 0,
          earnedRewards: state.earnedRewards.map(r => ({ ...r, isNew: false }))
        }));
      }
    }),
    {
      name: 'rewards-storage', // Nombre para localStorage
      partialize: (state) => ({ 
        earnedRewards: state.earnedRewards,
        collections: state.collections,
        totalRewardsCount: state.totalRewardsCount,
        newRewardsCount: state.newRewardsCount
      }),
    }
  )
);

// Función para otorgar una recompensa
export function awardReward(
  rewardId: string,
  moduleData?: {
    theme?: RewardTheme,
    module?: string
  }
) {
  console.log(`🎁 [RECOMPENSAS-AWARD] Intentando otorgar recompensa: ${rewardId}`);
  console.log(`🎁 [RECOMPENSAS-AWARD] Datos del módulo:`, moduleData);
  
  const { addReward, earnedRewards } = useRewardsStore.getState();
  
  console.log(`🎁 [RECOMPENSAS-AWARD] Total de recompensas ya obtenidas: ${earnedRewards.length}`);
  console.log(`🎁 [RECOMPENSAS-AWARD] IDs de recompensas ya obtenidas:`, earnedRewards.map(r => r.id));
  
  // Verificar si ya tiene esta recompensa
  const alreadyHas = earnedRewards.some(r => r.id === rewardId);
  console.log(`🎁 [RECOMPENSAS-AWARD] ¿Ya tiene la recompensa ${rewardId}? ${alreadyHas}`);
  
  if (alreadyHas) {
    console.log(`🎁 [RECOMPENSAS-AWARD] ABORTANDO: Recompensa ${rewardId} ya obtenida`);
    return false;
  }
  
  // Obtener la recompensa del catálogo
  const rewardTemplate = rewardsCatalog[rewardId];
  if (!rewardTemplate) {
    console.error(`🎁 [RECOMPENSAS-AWARD] ERROR: Recompensa con ID ${rewardId} no encontrada en el catálogo`);
    console.log(`🎁 [RECOMPENSAS-AWARD] IDs disponibles en catálogo:`, Object.keys(rewardsCatalog));
    return false;
  }
  
  console.log(`🎁 [RECOMPENSAS-AWARD] ✅ Recompensa encontrada en catálogo:`, rewardTemplate.name);
  
  // Crear la recompensa con fecha actual
  const reward: Reward = {
    ...rewardTemplate,
    dateEarned: new Date(),
    isNew: true
  };
  
  console.log(`🎁 [RECOMPENSAS-AWARD] ✅ OTORGANDO RECOMPENSA:`, reward);
  
  // Añadir la recompensa
  addReward(reward);
  
  console.log(`🎁 [RECOMPENSAS-AWARD] ✅ Recompensa ${rewardId} añadida al store exitosamente`);
  return true;
}

// Función para verificar y otorgar recompensas basadas en condiciones
export function checkAndAwardRewards(
  conditions: Record<string, number>,
  moduleData?: {
    theme?: RewardTheme,
    module?: string
  }
) {
  console.log("🏆 [REWARD-CHECK-V2] ==================== INICIANDO VERIFICACIÓN DE RECOMPENSAS ====================");
  console.log("🏆 [REWARD-CHECK-V2] Timestamp:", new Date().toISOString());
  console.log("🏆 [REWARD-CHECK-V2] Condiciones recibidas:", JSON.stringify(conditions, null, 2));
  console.log("🏆 [REWARD-CHECK-V2] Datos del módulo:", JSON.stringify(moduleData, null, 2));
  
  const awardedRewards: Reward[] = [];
  const currentState = useRewardsStore.getState();
  
  console.log("🏆 [REWARD-CHECK-V2] Estado actual completo del store:", {
    earnedRewards: currentState.earnedRewards?.length || 0,
    totalRewardsCount: currentState.totalRewardsCount || 0,
    newRewardsCount: currentState.newRewardsCount || 0,
    showRewardAnimation: currentState.showRewardAnimation || false
  });
  
  if (currentState.earnedRewards && currentState.earnedRewards.length > 0) {
    console.log("🏆 [REWARD-CHECK-V2] Recompensas ya obtenidas ANTES de verificar:", 
      currentState.earnedRewards.map(r => ({
        id: r.id,
        name: r.name,
        dateEarned: r.dateEarned
      }))
    );
  } else {
    console.log("🏆 [REWARD-CHECK-V2] NO hay recompensas previas en el store");
  }
  
  // DIAGNÓSTICO CRÍTICO: Verificar localStorage
  const rewardStorageKey = 'rewards-storage';
  const rewardStorage = localStorage.getItem(rewardStorageKey);
  if (rewardStorage) {
    try {
      const parsedStorage = JSON.parse(rewardStorage);
      console.log("🏆 [REWARD-CHECK-V2] CRÍTICO: localStorage contiene datos de recompensas:", {
        key: rewardStorageKey,
        hasState: !!parsedStorage.state,
        hasEarnedRewards: !!parsedStorage.state?.earnedRewards,
        earnedRewardsCount: parsedStorage.state?.earnedRewards?.length || 0
      });
      
      if (parsedStorage.state?.earnedRewards) {
        console.log("🏆 [REWARD-CHECK-V2] Recompensas en localStorage:", 
          parsedStorage.state.earnedRewards.map(r => r.id || r.name || "unknown")
        );
      }
    } catch (e) {
      console.log("🏆 [REWARD-CHECK-V2] Error parseando localStorage de recompensas:", e);
    }
  } else {
    console.log("🏆 [REWARD-CHECK-V2] localStorage de recompensas está limpio");
  }
  
  // Verificar condiciones para las recompensas de problemas completados
  if (conditions.problemsCompleted) {
    console.log(`🏆 [RECOMPENSAS-SISTEMA] Verificando problemas completados: ${conditions.problemsCompleted}`);
    
    if (conditions.problemsCompleted >= 10) {
      console.log("🏆 [REWARD-CHECK-V2] Cumple condición para addition-novice (10+ problemas)");
      const alreadyHas = currentState.earnedRewards.some(r => r.id === 'addition-novice');
      console.log(`🏆 [REWARD-CHECK-V2] ¿Ya tiene addition-novice? ${alreadyHas}`);
      
      if (!alreadyHas) {
        const success = awardReward('addition-novice', moduleData);
        console.log(`🏆 [RECOMPENSAS-SISTEMA] Resultado otorgar addition-novice: ${success}`);
        if (success && rewardsCatalog['addition-novice']) {
          awardedRewards.push({
            ...rewardsCatalog['addition-novice'],
            dateEarned: new Date(),
            isNew: true
          });
        }
      }
    }
    
    if (conditions.problemsCompleted >= 25) {
      console.log("🏆 [RECOMPENSAS-SISTEMA] Cumple condición para addition-enthusiast (25+ problemas)");
      const alreadyHas = earnedRewards.some(r => r.id === 'addition-enthusiast');
      console.log(`🏆 [RECOMPENSAS-SISTEMA] ¿Ya tiene addition-enthusiast? ${alreadyHas}`);
      
      if (!alreadyHas) {
        const success = awardReward('addition-enthusiast', moduleData);
        console.log(`🏆 [RECOMPENSAS-SISTEMA] Resultado otorgar addition-enthusiast: ${success}`);
        if (success && rewardsCatalog['addition-enthusiast']) {
          awardedRewards.push({
            ...rewardsCatalog['addition-enthusiast'],
            dateEarned: new Date(),
            isNew: true
          });
        }
      }
    }
    
    if (conditions.problemsCompleted >= 50) {
      console.log("🏆 [RECOMPENSAS-SISTEMA] Cumple condición para addition-expert (50+ problemas)");
      const alreadyHas = earnedRewards.some(r => r.id === 'addition-expert');
      console.log(`🏆 [RECOMPENSAS-SISTEMA] ¿Ya tiene addition-expert? ${alreadyHas}`);
      
      if (!alreadyHas) {
        const success = awardReward('addition-expert', moduleData);
        console.log(`🏆 [RECOMPENSAS-SISTEMA] Resultado otorgar addition-expert: ${success}`);
        if (success && rewardsCatalog['addition-expert']) {
          awardedRewards.push({
            ...rewardsCatalog['addition-expert'],
            dateEarned: new Date(),
            isNew: true
          });
        }
      }
    }
    
    if (conditions.problemsCompleted >= 100) {
      console.log("🏆 [RECOMPENSAS-SISTEMA] Cumple condición para addition-master (100+ problemas)");
      const alreadyHas = earnedRewards.some(r => r.id === 'addition-master');
      console.log(`🏆 [RECOMPENSAS-SISTEMA] ¿Ya tiene addition-master? ${alreadyHas}`);
      
      if (!alreadyHas) {
        const success = awardReward('addition-master', moduleData);
        console.log(`🏆 [RECOMPENSAS-SISTEMA] Resultado otorgar addition-master: ${success}`);
        if (success && rewardsCatalog['addition-master']) {
          awardedRewards.push({
            ...rewardsCatalog['addition-master'],
            dateEarned: new Date(),
            isNew: true
          });
        }
      }
    }
  }
  
  // Verificar condiciones para las recompensas de rachas
  if (conditions.streak) {
    if (conditions.streak >= 5) {
      const success = awardReward('streak-5', moduleData);
      if (success && rewardsCatalog['streak-5']) {
        awardedRewards.push({
          ...rewardsCatalog['streak-5'],
          dateEarned: new Date(),
          isNew: true
        });
      }
    }
    
    if (conditions.streak >= 10) {
      const success = awardReward('streak-10', moduleData);
      if (success && rewardsCatalog['streak-10']) {
        awardedRewards.push({
          ...rewardsCatalog['streak-10'],
          dateEarned: new Date(),
          isNew: true
        });
      }
    }
    
    if (conditions.streak >= 20) {
      const success = awardReward('streak-20', moduleData);
      if (success && rewardsCatalog['streak-20']) {
        awardedRewards.push({
          ...rewardsCatalog['streak-20'],
          dateEarned: new Date(),
          isNew: true
        });
      }
    }
  }
  
  // Verificar condiciones para recompensas de nivel
  if (conditions.level) {
    const levelMap: Record<number, string> = {
      1: 'level-elementary',
      2: 'level-intermediate',
      3: 'level-advanced',
      4: 'level-expert'
    };
    
    const levelId = levelMap[conditions.level];
    if (levelId) {
      const success = awardReward(levelId, moduleData);
      if (success && rewardsCatalog[levelId]) {
        awardedRewards.push({
          ...rewardsCatalog[levelId],
          dateEarned: new Date(),
          isNew: true
        });
      }
    }
  }
  
  // Verificar condición para sesiones perfectas
  if (conditions.perfectSession && conditions.perfectSession >= 1) {
    const success = awardReward('perfect-session', moduleData);
    if (success && rewardsCatalog['perfect-session']) {
      awardedRewards.push({
        ...rewardsCatalog['perfect-session'],
        dateEarned: new Date(),
        isNew: true
      });
    }
  }
  
  // Verificar recompensa por mejora
  if (conditions.improvement && conditions.improvement >= 1) {
    const success = awardReward('improvement-star', moduleData);
    if (success && rewardsCatalog['improvement-star']) {
      awardedRewards.push({
        ...rewardsCatalog['improvement-star'],
        dateEarned: new Date(),
        isNew: true
      });
    }
  }
  
  // Verificar recompensa por perseverancia
  if (conditions.perseverance && conditions.perseverance >= 1) {
    const success = awardReward('perseverance', moduleData);
    if (success && rewardsCatalog['perseverance']) {
      awardedRewards.push({
        ...rewardsCatalog['perseverance'],
        dateEarned: new Date(),
        isNew: true
      });
    }
  }
  
  return awardedRewards;
}

// Función para seleccionar una recompensa aleatoria según criterios
export function selectRandomReward(tier?: RewardTier, theme?: RewardTheme): string | null {
  const eligibleRewards = Object.values(rewardsCatalog).filter(reward => {
    if (tier && reward.tier !== tier) return false;
    if (theme && reward.theme !== theme) return false;
    return true;
  });
  
  if (eligibleRewards.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * eligibleRewards.length);
  return eligibleRewards[randomIndex].id;
}

// Función para obtener la probabilidad de una recompensa según el tipo y momento
export function getRewardProbability(
  context: {
    isFirstProblem?: boolean;
    isLastProblem?: boolean;
    isMidPoint?: boolean;
    problemIndex?: number;
    totalProblems?: number;
    streak?: number;
    correctAnswers?: number;
    incorrectAnswers?: number;
    difficulty?: string;
    previousRewardShown?: number; // Índice del problema donde se mostró la última recompensa
  }
): number {
  const {
    isFirstProblem = false,
    isLastProblem = false,
    isMidPoint = false,
    problemIndex = 0,
    totalProblems = 10,
    streak = 0,
    correctAnswers = 0,
    incorrectAnswers = 0,
    difficulty = 'beginner',
    previousRewardShown = -1
  } = context;
  
  // Probabilidad base según nivel de dificultad
  const difficultyBaseProbabilities: Record<string, number> = {
    'beginner': 0.18,      // 18% (mayor probabilidad para principiantes)
    'elementary': 0.15,    // 15%
    'intermediate': 0.12,  // 12%
    'advanced': 0.08,      // 8%
    'expert': 0.05         // 5%
  };
  
  let probability = difficultyBaseProbabilities[difficulty] || 0.12;
  
  // Contador de compasión: garantizar recompensa después de cierto número de problemas correctos
  const compassionThresholds: Record<string, number> = {
    'beginner': 8,      // Garantizar recompensa después de 8 respuestas correctas sin premio
    'elementary': 10,   // para principiantes
    'intermediate': 12,
    'advanced': 15,
    'expert': 18
  };
  
  // Siempre garantizar recompensa en el último problema solo si no se mostró recientemente
  if (isLastProblem && (problemIndex - previousRewardShown) > 2) {
    console.log('🏆 Garantizando recompensa en último problema');
    return 1.0; // 100% probabilidad
  }
  
  // Garantizar recompensa si se supera el umbral de compasión
  const problemsSinceLastReward = previousRewardShown === -1 ? 
    problemIndex + 1 : problemIndex - previousRewardShown;
    
  const compassionThreshold = compassionThresholds[difficulty] || 12;
  
  if (problemsSinceLastReward >= compassionThreshold && streak >= 3) {
    console.log(`🎁 Recompensa por compasión tras ${problemsSinceLastReward} problemas`);
    return 0.95; // 95% de probabilidad (casi garantizada)
  }
  
  // Incremento por racha correcta
  if (streak >= 3) {
    probability += 0.05; // +5% por cada 3 respuestas correctas
  }
  if (streak >= 5) {
    probability += 0.10; // +10% adicional al llegar a 5 correctas
  }
  if (streak >= 8) {
    probability += 0.15; // +15% adicional al llegar a 8 correctas
  }
  
  // Recompensa en punto medio del ejercicio (solo si no ha habido recompensa recientemente)
  if (isMidPoint && (problemIndex - previousRewardShown) > 3) {
    probability += 0.20; // +20% en punto medio del ejercicio
  }
  
  // Aumentar probabilidad si han pasado varios problemas sin mostrar recompensa
  if (problemsSinceLastReward >= 5) {
    probability += 0.10; // +10% cada 5 problemas sin recompensa
  }
  
  if (problemsSinceLastReward >= 10) {
    probability += 0.15; // +15% adicional cada 10 problemas sin recompensa
  }
  
  // Registrar en consola para depuración
  console.log(`🎲 Probabilidad de recompensa: ${(probability * 100).toFixed(1)}% [Dificultad: ${difficulty}, Racha: ${streak}, Problemas sin recompensa: ${problemsSinceLastReward}]`);
  
  // Limitar la probabilidad máxima al 95%
  return Math.min(probability, 0.95);
}

// El sistema de recompensas ha sido actualizado con probabilidades progresivas

// Función EXTREMA para reiniciar completamente todas las recompensas
export function resetAllRewards(): void {
  console.log("🔄 [RESET-REWARDS-V2] ==================== INICIANDO REINICIO EXTREMO ====================");
  
  try {
    // FASE 1: Diagnóstico inicial
    const initialState = useRewardsStore.getState();
    console.log("📊 [RESET-REWARDS-V2] Estado inicial del store:", {
      earnedRewards: initialState.earnedRewards?.length || 0,
      collections: initialState.collections?.length || 0,
      totalRewardsCount: initialState.totalRewardsCount || 0
    });
    
    if (initialState.earnedRewards) {
      console.log("📋 [RESET-REWARDS-V2] Recompensas actuales:", initialState.earnedRewards.map(r => r.id));
    }
    
    // FASE 2: Limpiar el store de Zustand usando MULTIPLE métodos
    console.log("🧹 [RESET-REWARDS-V2] Limpiando store con método 1 (resetAllRewards)...");
    const { resetAllRewards: resetFunction } = useRewardsStore.getState();
    resetFunction();
    
    console.log("🧹 [RESET-REWARDS-V2] Limpiando store con método 2 (setState directo)...");
    useRewardsStore.setState({ 
      earnedRewards: [],
      collections: [],
      totalRewardsCount: 0,
      newRewardsCount: 0,
      recentReward: null,
      showRewardAnimation: false,
      rewardsAlbumOpened: false
    });
    
    // FASE 3: Limpiar localStorage AGRESIVAMENTE
    console.log("🗑️ [RESET-REWARDS-V2] Iniciando limpieza AGRESIVA de localStorage...");
    
    // Buscar TODAS las claves que contienen "reward"
    const allKeys = Object.keys(localStorage);
    const rewardKeys = allKeys.filter(key => 
      key.toLowerCase().includes('reward') ||
      key.toLowerCase().includes('album') ||
      key.toLowerCase().includes('achievement') ||
      key.toLowerCase().includes('trophy') ||
      key.toLowerCase().includes('badge')
    );
    
    console.log("🔍 [RESET-REWARDS-V2] Claves encontradas relacionadas con recompensas:", rewardKeys);
    
    rewardKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`🗑️ [RESET-REWARDS-V2] Eliminando ${key}:`, value ? value.substring(0, 100) + "..." : "null");
      localStorage.removeItem(key);
    });
    
    // FASE 4: Verificación EXHAUSTIVA
    console.log("🔍 [RESET-REWARDS-V2] Iniciando verificación exhaustiva...");
    
    const finalState = useRewardsStore.getState();
    console.log("📊 [RESET-REWARDS-V2] Estado final del store:", {
      earnedRewards: finalState.earnedRewards?.length || 0,
      collections: finalState.collections?.length || 0,
      totalRewardsCount: finalState.totalRewardsCount || 0
    });
    
    // Verificar localStorage final
    const remainingRewardKeys = Object.keys(localStorage).filter(key => 
      key.toLowerCase().includes('reward') ||
      key.toLowerCase().includes('album') ||
      key.toLowerCase().includes('achievement')
    );
    
    if (remainingRewardKeys.length > 0) {
      console.error("❌ [RESET-REWARDS-V2] CRÍTICO: Aún quedan claves de recompensas:", remainingRewardKeys);
      
      // Intentar eliminarlas una vez más
      remainingRewardKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🔧 [RESET-REWARDS-V2] Forzada eliminación final de: ${key}`);
      });
    }
    
    if (finalState.earnedRewards && finalState.earnedRewards.length > 0) {
      console.error("❌ [RESET-REWARDS-V2] ERROR CRÍTICO: Store aún contiene recompensas:", finalState.earnedRewards.map(r => r.id));
      
      // Último intento desesperado
      console.log("🚨 [RESET-REWARDS-V2] Ejecutando limpieza de emergencia...");
      useRewardsStore.setState(() => ({
        earnedRewards: [],
        collections: [],
        totalRewardsCount: 0,
        newRewardsCount: 0,
        recentReward: null,
        showRewardAnimation: false,
        rewardsAlbumOpened: false
      }));
      
      // Verificación final final
      const emergencyState = useRewardsStore.getState();
      console.log("🆘 [RESET-REWARDS-V2] Estado post-emergencia:", emergencyState.earnedRewards?.length || 0);
    } else {
      console.log("✅ [RESET-REWARDS-V2] ÉXITO: Sistema completamente limpio");
    }
    
    console.log("🔄 [RESET-REWARDS-V2] ==================== REINICIO COMPLETADO ====================");
    
  } catch (error) {
    console.error("❌ [RESET-REWARDS-V2] ERROR CATASTRÓFICO durante el reinicio:", error);
    console.error("❌ [RESET-REWARDS-V2] Stack trace:", error.stack);
  }
}