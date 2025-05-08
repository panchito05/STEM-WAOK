import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { operationModules } from '@/utils/operationComponents';
import { useSettings } from '@/context/SettingsContext';

// Función para obtener los favoritos del SettingsContext
// Esta se usará en componentes para integrar los favoritos del perfil activo
export function useModuleFavorites() {
  const { favoriteModules, toggleFavoriteModule, isFavorite } = useSettings();
  
  return {
    favoriteModules,
    toggleFavorite: toggleFavoriteModule,
    isFavorite
  };
}

// Estado para configuraciones que no son favoritos
// (orden, visibilidad, filtros, etc.)
interface ModuleState {
  // Custom order of modules (if reordered by user)
  customModuleOrder: string[];
  // Modules marked as hidden
  hiddenModules: string[];
  // Whether to show only favorites
  showOnlyFavorites: boolean;
  // Whether to show hidden modules
  showHidden: boolean;
  
  // Actions
  moveModule: (fromIndex: number, toIndex: number) => void;
  toggleHidden: (moduleId: string) => void;
  toggleShowOnlyFavorites: () => void;
  toggleShowHidden: () => void;
  resetModuleOrder: () => void;
  resetHiddenModules: () => void;
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set) => ({
      customModuleOrder: operationModules.map(module => module.id),
      hiddenModules: [],
      showOnlyFavorites: false,
      showHidden: false,
      
      moveModule: (fromIndex, toIndex) => 
        set(state => {
          const newOrder = [...state.customModuleOrder];
          const [movedModule] = newOrder.splice(fromIndex, 1);
          newOrder.splice(toIndex, 0, movedModule);
          return { customModuleOrder: newOrder };
        }),
      
      toggleHidden: (moduleId) =>
        set(state => {
          const isHidden = state.hiddenModules.includes(moduleId);
          return {
            hiddenModules: isHidden
              ? state.hiddenModules.filter(id => id !== moduleId)
              : [...state.hiddenModules, moduleId]
          };
        }),
      
      toggleShowOnlyFavorites: () =>
        set(state => ({ showOnlyFavorites: !state.showOnlyFavorites })),
      
      toggleShowHidden: () =>
        set(state => ({ showHidden: !state.showHidden })),
      
      resetModuleOrder: () =>
        set({ customModuleOrder: operationModules.map(module => module.id) }),
        
      resetHiddenModules: () =>
        set({ hiddenModules: [] }),
    }),
    {
      name: 'math-waok-module-storage',
    }
  )
);
