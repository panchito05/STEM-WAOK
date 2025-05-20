// store.ts - Almacén global de estado con Zustand
import { create } from 'zustand';
import { ChildProfile } from '@/types/settings';
import { ExerciseResult } from '@/operations/addition/types';

interface AppState {
  // Estado de autenticación
  isAuthenticated: boolean;
  currentUser: any | null;
  setCurrentUser: (user: any | null) => void;
  
  // Perfiles de niños
  childProfiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  setChildProfiles: (profiles: ChildProfile[]) => void;
  setActiveProfile: (profile: ChildProfile | null) => void;
  
  // Historial y progreso
  exerciseHistory: ExerciseResult[];
  addExerciseToHistory: (exercise: ExerciseResult) => void;
  clearExerciseHistory: () => void;
  
  // Configuraciones
  updateModuleSettings: (module: string, settings: any) => void;
  updateGlobalSettings: (settings: any) => void;
}

// Creación del store
export const useStore = create<AppState>((set) => ({
  // Estado inicial de autenticación
  isAuthenticated: false,
  currentUser: null,
  setCurrentUser: (user) => set({ 
    isAuthenticated: !!user, 
    currentUser: user 
  }),
  
  // Estado inicial de perfiles
  childProfiles: [],
  activeProfile: null,
  setChildProfiles: (profiles) => set({ childProfiles: profiles }),
  setActiveProfile: (profile) => set({ activeProfile: profile }),
  
  // Estado inicial de historial
  exerciseHistory: [],
  addExerciseToHistory: (exercise) => set((state) => ({
    exerciseHistory: [...state.exerciseHistory, exercise]
  })),
  clearExerciseHistory: () => set({ exerciseHistory: [] }),
  
  // Métodos para actualizar configuraciones
  updateModuleSettings: (module, settings) => set((state) => {
    if (!state.activeProfile) return state;
    
    // Crear una copia profunda del perfil activo para modificar
    const updatedProfile = JSON.parse(JSON.stringify(state.activeProfile));
    
    // Asegurar que existe el objeto moduleSettings
    if (!updatedProfile.moduleSettings) {
      updatedProfile.moduleSettings = {};
    }
    
    // Actualizar las configuraciones específicas del módulo
    updatedProfile.moduleSettings[module] = {
      ...(updatedProfile.moduleSettings[module] || {}),
      ...settings
    };
    
    // Actualizar perfil activo y lista de perfiles
    return {
      activeProfile: updatedProfile,
      childProfiles: state.childProfiles.map(profile => 
        profile.id === updatedProfile.id ? updatedProfile : profile
      )
    };
  }),
  
  updateGlobalSettings: (settings) => set((state) => {
    if (!state.activeProfile) return state;
    
    // Crear una copia profunda del perfil activo para modificar
    const updatedProfile = JSON.parse(JSON.stringify(state.activeProfile));
    
    // Asegurar que existe el objeto moduleSettings
    if (!updatedProfile.moduleSettings) {
      updatedProfile.moduleSettings = {};
    }
    
    // Actualizar las configuraciones globales
    updatedProfile.moduleSettings.global = {
      ...(updatedProfile.moduleSettings.global || {}),
      ...settings
    };
    
    // Actualizar perfil activo y lista de perfiles
    return {
      activeProfile: updatedProfile,
      childProfiles: state.childProfiles.map(profile => 
        profile.id === updatedProfile.id ? updatedProfile : profile
      )
    };
  })
}));