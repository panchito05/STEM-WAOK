// RewardsStore.ts - Wrapper del sistema de recompensas
// Este archivo sirve como puente para acceder a la funcionalidad del sistema de recompensas

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Reward, 
  RewardCollection,
  RewardTier,
  RewardTheme,
  RewardCategory 
} from '@/lib/rewards-system';

// Estado de la tienda de recompensas
interface RewardsState {
  earnedRewards: Reward[];
  collections: RewardCollection[];
  totalRewardsCount: number;
  newRewardsCount: number;
  recentReward: Reward | null;
  showRewardAnimation: boolean;
  rewardsAlbumOpened: boolean;
  
  // Métodos
  addReward: (reward: Reward) => void;
  updateCollectionProgress: (collectionId: string) => void;
  setShowRewardAnimation: (show: boolean) => void;
  setRewardsAlbumOpened: (opened: boolean) => void;
  resetNewRewardsCount: () => void;
  markRewardAsSeen?: (rewardId: string) => void;
}

// Hook para usar la tienda de recompensas
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
      },
      
      updateCollectionProgress: (collectionId: string) => {
        const collections = get().collections;
        const collectionIndex = collections.findIndex(c => c.id === collectionId);
        
        if (collectionIndex < 0) return;
        
        // Lógica simplificada para actualizar el progreso de la colección
        // Normalmente aquí verificaríamos cuántas recompensas de la colección tiene el usuario
        const collection = collections[collectionIndex];
        const updatedCollection = {
          ...collection,
          progress: Math.min(collection.progress + 10, 100), // Incremento simple para ejemplo
          isComplete: collection.progress + 10 >= 100
        };
        
        const updatedCollections = [...collections];
        updatedCollections[collectionIndex] = updatedCollection;
        
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
      },
      
      markRewardAsSeen: (rewardId: string) => {
        set(state => ({
          earnedRewards: state.earnedRewards.map(r => 
            r.id === rewardId ? { ...r, isNew: false } : r
          )
        }));
      }
    }),
    {
      name: 'rewards-storage', // Nombre para localStorage
    }
  )
);

export default useRewardsStore;