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
  problemCount: 10,
  timeLimit: "per-problem",
  timeValue: 30, // 0 para sin límite
  maxAttempts: 3, // Por defecto, 3 intentos por problema
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
        setGlobalSettings(JSON.parse(storedGlobalSettings));
      }

      if (storedModuleSettings) {
        setModuleSettings(JSON.parse(storedModuleSettings));
      }
      
      if (storedFavorites) {
        setFavoriteModules(JSON.parse(storedFavorites));
      }

      // If authenticated, fetch from server and override local
      if (isAuthenticated) {
        const endpoint = activeProfile 
          ? `/api/child-profiles/${activeProfile.id}/settings` 
          : "/api/settings";
        
        const res = await fetch(endpoint, {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.globalSettings) {
            setGlobalSettings(data.globalSettings);
            localStorage.setItem(globalSettingsKey, JSON.stringify(data.globalSettings));
          }
          
          if (data.moduleSettings) {
            setModuleSettings(data.moduleSettings);
            localStorage.setItem(moduleSettingsKey, JSON.stringify(data.moduleSettings));
          }
          
          if (data.favoriteModules) {
            setFavoriteModules(data.favoriteModules);
            localStorage.setItem(favoritesKey, JSON.stringify(data.favoriteModules));
          }
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
    const currentSettings = moduleSettings[moduleId] || { ...defaultModuleSettings };
    const updatedSettings = { ...currentSettings, ...settings };
    
    setModuleSettings(prev => ({
      ...prev,
      [moduleId]: updatedSettings,
    }));
    
    // Sólo intentar guardar en el servidor si el usuario está autenticado
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
          : `/api/settings/module/${moduleId}`;
          
        await apiRequest("PUT", endpoint, updatedSettings);
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
      console.log(`User not authenticated, saving settings for ${moduleId} locally only`);
    }
  };

  const getModuleSettings = (moduleId: string): ModuleSettings => {
    return moduleSettings[moduleId] || { ...defaultModuleSettings };
  };

  const resetModuleSettings = async (moduleId: string) => {
    setModuleSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[moduleId];
      return newSettings;
    });
    
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
          : `/api/settings/module/${moduleId}`;
          
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
    
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings`
          : "/api/settings";
          
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
