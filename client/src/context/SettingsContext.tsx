import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useChildProfiles } from "@/context/ChildProfilesContext";

export interface ModuleSettings {
  difficulty: "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
  problemCount: number;
  timeLimit: "per-problem"; // Simplificado para solo usar un tipo
  timeValue: number; // 0 para sin límite
  maxAttempts: number; // 0 para intentos ilimitados
  showImmediateFeedback: boolean;
  enableSoundEffects: boolean;
  showAnswerWithExplanation: boolean; // Botón de ayuda que muestra respuesta con explicación
  enableAdaptiveDifficulty: boolean; // Ajusta automáticamente la dificultad según desempeño
  enableCompensation: boolean; // Añade problemas adicionales por respuestas incorrectas/reveladas
  enableRewards: boolean; // Activar sistema de recompensas/premios
  rewardType: "medals" | "trophies" | "stars"; // Tipo de premio a mostrar
  language?: "english" | "spanish"; // Idioma para el módulo
  
  // Campos adicionales para tipos específicos de módulos
  fractionType?: "addition" | "subtraction" | "comparison" | "mixed";
  requireSimplified?: boolean;
}

export interface GlobalSettings {
  darkMode: boolean;
  fontSize: "small" | "medium" | "large";
  highContrast: boolean;
  language: string;
  soundEffects: boolean;
  immediateFeedback: boolean;
  showSolutions: boolean;
  extendedTime: boolean;
}

interface SettingsContextType {
  globalSettings: GlobalSettings;
  moduleSettings: Record<string, ModuleSettings>;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
  updateModuleSettings: (moduleId: string, settings: Partial<ModuleSettings>) => Promise<void>;
  getModuleSettings: (moduleId: string) => ModuleSettings;
  resetModuleSettings: (moduleId: string) => Promise<void>;
  resetAllSettings: () => Promise<void>;
  favoriteModules: string[];
  toggleFavoriteModule: (moduleId: string) => Promise<void>;
  isFavorite: (moduleId: string) => boolean;
}

const defaultGlobalSettings: GlobalSettings = {
  darkMode: false,
  fontSize: "medium",
  highContrast: false,
  language: "en",
  soundEffects: true,
  immediateFeedback: true,
  showSolutions: true,
  extendedTime: false,
};

const defaultModuleSettings: ModuleSettings = {
  difficulty: "beginner",
  problemCount: 12,
  timeLimit: "per-problem",
  timeValue: 0, // 0 para sin límite
  maxAttempts: 2, // Por defecto, 3 intentos por problema
  showImmediateFeedback: true,
  enableSoundEffects: true,
  showAnswerWithExplanation: true, // Botón de ayuda que muestra respuesta con explicación
  enableAdaptiveDifficulty: true, // Activado por defecto
  enableCompensation: true, // Activado por defecto
  enableRewards: true, // Sistema de recompensas activado por defecto
  rewardType: "stars", // Por defecto, usar estrellas como recompensa
  language: "english", // Idioma por defecto: inglés
};

const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(defaultGlobalSettings);
  const [moduleSettings, setModuleSettings] = useState<Record<string, ModuleSettings>>({});
  const [favoriteModules, setFavoriteModules] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { activeProfile } = useChildProfiles();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        setIsAuthenticated(res.ok);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // Crear claves de almacenamiento basadas en el perfil activo
  const getStorageKeys = () => {
    const profileSuffix = activeProfile ? `-profile-${activeProfile.id}` : '';
    return {
      globalSettingsKey: `globalSettings${profileSuffix}`,
      moduleSettingsKey: `moduleSettings${profileSuffix}`,
      favoritesKey: `favoriteModules${profileSuffix}`
    };
  };

  const fetchSettings = async () => {
    try {
      const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
      
      // Try to load from local storage first
      const storedGlobalSettings = localStorage.getItem(globalSettingsKey);
      const storedModuleSettings = localStorage.getItem(moduleSettingsKey);
      const storedFavorites = localStorage.getItem(favoritesKey);

      if (storedGlobalSettings) {
        try {
          const parsedSettings = JSON.parse(storedGlobalSettings);
          setGlobalSettings(parsedSettings);
          console.log("Loaded global settings from localStorage:", parsedSettings);
        } catch (e) {
          console.error("Error parsing global settings from localStorage:", e);
        }
      }

      if (storedModuleSettings) {
        try {
          const parsedSettings = JSON.parse(storedModuleSettings);
          setModuleSettings(parsedSettings);
          console.log("Loaded module settings from localStorage:", parsedSettings);
        } catch (e) {
          console.error("Error parsing module settings from localStorage:", e);
        }
      }
      
      if (storedFavorites) {
        try {
          const parsedFavorites = JSON.parse(storedFavorites);
          setFavoriteModules(parsedFavorites);
          console.log("Loaded favorites from localStorage:", parsedFavorites);
        } catch (e) {
          console.error("Error parsing favorites from localStorage:", e);
        }
      }

      // If authenticated, fetch from server and override local
      if (isAuthenticated) {
        const endpoint = activeProfile 
          ? `/api/child-profiles/${activeProfile.id}/settings` 
          : "/api/settings";
        
        console.log(`Fetching settings from ${endpoint}`);
        const res = await fetch(endpoint, {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log("Received settings from server:", data);
          
          if (data.moduleSettings) {
            // Asegurarnos de que se preserven los valores por defecto
            // para aquellos ajustes que no estén definidos en el servidor
            const enhancedModuleSettings: Record<string, ModuleSettings> = {};
            
            // Procesar cada módulo en los ajustes recibidos
            Object.entries(data.moduleSettings).forEach(([moduleId, settings]) => {
              // Combinar con valores por defecto para asegurar que todas las propiedades existan
              enhancedModuleSettings[moduleId] = {
                ...defaultModuleSettings,
                ...settings as ModuleSettings
              };
            });
            
            console.log("Enhanced module settings:", enhancedModuleSettings);
            setModuleSettings(enhancedModuleSettings);
            localStorage.setItem(moduleSettingsKey, JSON.stringify(enhancedModuleSettings));
          }
          
          if (data.globalSettings) {
            const enhancedGlobalSettings = {
              ...defaultGlobalSettings,
              ...data.globalSettings
            };
            setGlobalSettings(enhancedGlobalSettings);
            localStorage.setItem(globalSettingsKey, JSON.stringify(enhancedGlobalSettings));
          }
          
          if (data.favoriteModules) {
            setFavoriteModules(data.favoriteModules);
            localStorage.setItem(favoritesKey, JSON.stringify(data.favoriteModules));
          }
        } else {
          console.warn(`Failed to fetch settings from server: ${res.status}`);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Keep using whatever was loaded from localStorage or the defaults
    }
  };

  // Load settings initially and when auth state or active profile changes
  useEffect(() => {
    fetchSettings();
  }, [isAuthenticated, activeProfile]);

  const saveSettingsToLocalStorage = () => {
    const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
    localStorage.setItem(globalSettingsKey, JSON.stringify(globalSettings));
    localStorage.setItem(moduleSettingsKey, JSON.stringify(moduleSettings));
    localStorage.setItem(favoritesKey, JSON.stringify(favoriteModules));
  };

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveSettingsToLocalStorage();
  }, [globalSettings, moduleSettings, favoriteModules, activeProfile]);
  
  // Verificar si hay cambios en almacenamiento local (otro tab o ventana)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
      
      if (e.key === globalSettingsKey && e.newValue) {
        setGlobalSettings(JSON.parse(e.newValue));
      }
      
      if (e.key === moduleSettingsKey && e.newValue) {
        setModuleSettings(JSON.parse(e.newValue));
      }
      
      if (e.key === favoritesKey && e.newValue) {
        setFavoriteModules(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [activeProfile]);

  const updateGlobalSettings = async (settings: Partial<GlobalSettings>) => {
    const updatedSettings = { ...globalSettings, ...settings };
    setGlobalSettings(updatedSettings);
    
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/global`
          : "/api/settings/global";
          
        await apiRequest("PUT", endpoint, updatedSettings);
      } catch (error) {
        toast({
          title: "Error al guardar configuración",
          description: "Tus ajustes solo se han guardado localmente",
          variant: "destructive",
        });
        console.error("Error saving global settings:", error);
      }
    }
  };

  const updateModuleSettings = async (moduleId: string, settings: Partial<ModuleSettings>) => {
    // Asegurarse de que siempre tenemos todos los valores por defecto
    const currentSettings = moduleSettings[moduleId] || { ...defaultModuleSettings };
    const updatedSettings = { ...currentSettings, ...settings };
    
    console.log(`Actualizando configuración para ${moduleId}:`, updatedSettings);
    
    // Actualizar estado
    setModuleSettings(prev => {
      const newSettings = {
        ...prev,
        [moduleId]: updatedSettings,
      };
      
      // Guardar inmediatamente en localStorage para persistencia
      try {
        const { moduleSettingsKey } = getStorageKeys();
        localStorage.setItem(moduleSettingsKey, JSON.stringify(newSettings));
        console.log(`Guardado en localStorage: ${moduleSettingsKey}`, newSettings);
      } catch (e) {
        console.error("Error guardando en localStorage:", e);
      }
      
      return newSettings;
    });
    
    // Sólo intentar guardar en el servidor si el usuario está autenticado
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
          : `/api/settings/module/${moduleId}`;
          
        console.log(`Guardando en servidor (${endpoint}):`, updatedSettings);
        await apiRequest("PUT", endpoint, updatedSettings);
        console.log(`Configuración guardada exitosamente en el servidor para ${moduleId}`);
      } catch (error) {
        // Solo mostrar una notificación si hay un error real (no error de autenticación)
        if (error instanceof Error && !error.message.includes("401")) {
          toast({
            title: "Error al guardar configuración",
            description: "Tus ajustes solo se han guardado localmente",
            variant: "destructive",
          });
        }
        console.error(`Error saving settings for module ${moduleId}:`, error);
      }
    } else {
      // Si no está autenticado, simplemente guardar en localStorage
      console.log(`Usuario no autenticado, configuración de ${moduleId} guardada solo localmente`);
    }
  };

  const getModuleSettings = (moduleId: string): ModuleSettings => {
    // Si tenemos configuraciones para este módulo, asegurarnos de que incluya todos los valores por defecto
    if (moduleSettings[moduleId]) {
      // Combinar con defaults para garantizar que tengamos todos los campos
      return {
        ...defaultModuleSettings,
        ...moduleSettings[moduleId]
      };
    }
    
    // Si no hay configuraciones, devolver los valores por defecto
    return { ...defaultModuleSettings };
  };

  const resetModuleSettings = async (moduleId: string) => {
    // Eliminar configuraciones personalizadas
    setModuleSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[moduleId];
      
      // Actualizar localStorage también para mantener la sincronización
      try {
        const { moduleSettingsKey } = getStorageKeys();
        localStorage.setItem(moduleSettingsKey, JSON.stringify(newSettings));
        console.log(`Configuraciones eliminadas de localStorage para ${moduleId}`);
      } catch (e) {
        console.error(`Error al eliminar configuraciones de localStorage para ${moduleId}:`, e);
      }
      
      return newSettings;
    });
    
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
          : `/api/settings/module/${moduleId}`;
          
        console.log(`Eliminando configuraciones del servidor para ${moduleId}`);
        await apiRequest("DELETE", endpoint, {});
        toast({
          title: "Configuración restablecida",
          description: `Configuración predeterminada restaurada para ${moduleId}`,
        });
      } catch (error) {
        console.error(`Error resetting settings for module ${moduleId}:`, error);
      }
    }
  };

  const resetAllSettings = async () => {
    setGlobalSettings(defaultGlobalSettings);
    setModuleSettings({});
    setFavoriteModules([]);
    
    // Actualizar también localStorage
    try {
      const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
      localStorage.setItem(globalSettingsKey, JSON.stringify(defaultGlobalSettings));
      localStorage.setItem(moduleSettingsKey, JSON.stringify({}));
      localStorage.setItem(favoritesKey, JSON.stringify([]));
      console.log("Todas las configuraciones restablecidas en localStorage");
    } catch (e) {
      console.error("Error al restablecer todas las configuraciones en localStorage:", e);
    }
    
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings`
          : "/api/settings";
          
        console.log(`Restableciendo todas las configuraciones en el servidor (${endpoint})`);
        await apiRequest("DELETE", endpoint, {});
        toast({
          title: "Configuración restablecida",
          description: "Se ha restaurado la configuración predeterminada",
        });
      } catch (error) {
        console.error("Error resetting all settings:", error);
      }
    }
  };
  
  // Functions for managing favorite modules
  const toggleFavoriteModule = async (moduleId: string) => {
    // Check if the module is already a favorite
    const isFavorited = favoriteModules.includes(moduleId);
    
    // Update favorites list
    let updatedFavorites: string[];
    if (isFavorited) {
      updatedFavorites = favoriteModules.filter(id => id !== moduleId);
    } else {
      updatedFavorites = [...favoriteModules, moduleId];
    }
    
    setFavoriteModules(updatedFavorites);
    
    // Guardar inmediatamente en localStorage para persistencia
    try {
      const { favoritesKey } = getStorageKeys();
      localStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites));
      console.log(`Favoritos actualizados en localStorage:`, updatedFavorites);
    } catch (e) {
      console.error("Error guardando favoritos en localStorage:", e);
    }
    
    // Save to server if authenticated
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/favorites`
          : "/api/favorites";
          
        await apiRequest("PUT", endpoint, { favorites: updatedFavorites });
      } catch (error) {
        console.error("Error saving favorites:", error);
        toast({
          title: "Error al guardar favoritos",
          description: "Tus favoritos solo se han guardado localmente",
          variant: "destructive",
        });
      }
    }
  };
  
  const isFavorite = (moduleId: string): boolean => {
    return favoriteModules.includes(moduleId);
  };

  return (
    <SettingsContext.Provider
      value={{
        globalSettings,
        moduleSettings,
        updateGlobalSettings,
        updateModuleSettings,
        getModuleSettings,
        resetModuleSettings,
        resetAllSettings,
        favoriteModules,
        toggleFavoriteModule,
        isFavorite
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
