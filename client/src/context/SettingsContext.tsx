import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  enableAdaptiveDifficulty: false, // Desactivado por defecto
  enableCompensation: false, // Desactivado por defecto
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

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

  const fetchSettings = async () => {
    try {
      // Try to load from local storage first
      const storedGlobalSettings = localStorage.getItem("globalSettings");
      const storedModuleSettings = localStorage.getItem("moduleSettings");

      if (storedGlobalSettings) {
        setGlobalSettings(JSON.parse(storedGlobalSettings));
      }

      if (storedModuleSettings) {
        setModuleSettings(JSON.parse(storedModuleSettings));
      }

      // If authenticated, fetch from server and override local
      if (isAuthenticated) {
        const res = await fetch("/api/settings", {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.globalSettings) {
            setGlobalSettings(data.globalSettings);
            localStorage.setItem("globalSettings", JSON.stringify(data.globalSettings));
          }
          
          if (data.moduleSettings) {
            setModuleSettings(data.moduleSettings);
            localStorage.setItem("moduleSettings", JSON.stringify(data.moduleSettings));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Keep using whatever was loaded from localStorage or the defaults
    }
  };

  // Load settings initially and when auth state changes
  useEffect(() => {
    fetchSettings();
  }, [isAuthenticated]);

  const saveSettingsToLocalStorage = () => {
    localStorage.setItem("globalSettings", JSON.stringify(globalSettings));
    localStorage.setItem("moduleSettings", JSON.stringify(moduleSettings));
  };

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveSettingsToLocalStorage();
  }, [globalSettings, moduleSettings]);
  
  // Verificar si hay cambios en almacenamiento local (otro tab o ventana)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "globalSettings" && e.newValue) {
        setGlobalSettings(JSON.parse(e.newValue));
      }
      
      if (e.key === "moduleSettings" && e.newValue) {
        setModuleSettings(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateGlobalSettings = async (settings: Partial<GlobalSettings>) => {
    const updatedSettings = { ...globalSettings, ...settings };
    setGlobalSettings(updatedSettings);
    
    if (isAuthenticated) {
      try {
        await apiRequest("PUT", "/api/settings/global", updatedSettings);
      } catch (error) {
        toast({
          title: "Failed to Save Settings",
          description: "Your settings will only be saved locally",
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
    // y evitar peticiones innecesarias
    if (isAuthenticated) {
      try {
        await apiRequest("PUT", `/api/settings/module/${moduleId}`, updatedSettings);
      } catch (error) {
        // Solo mostrar una notificación si hay un error real (no error de autenticación)
        if (error instanceof Error && !error.message.includes("401")) {
          toast({
            title: "Failed to Save Module Settings",
            description: "Your settings will only be saved locally",
            variant: "destructive",
          });
        }
        console.error(`Error saving settings for module ${moduleId}:`, error);
      }
    } else {
      // Si no está autenticado, simplemente guardar en localStorage
      // y no intentar hacer peticiones al servidor
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
        await apiRequest("DELETE", `/api/settings/module/${moduleId}`, {});
        toast({
          title: "Settings Reset",
          description: `Default settings restored for ${moduleId}`,
        });
      } catch (error) {
        console.error(`Error resetting settings for module ${moduleId}:`, error);
      }
    }
  };

  const resetAllSettings = async () => {
    setGlobalSettings(defaultGlobalSettings);
    setModuleSettings({});
    
    if (isAuthenticated) {
      try {
        await apiRequest("DELETE", "/api/settings", {});
        toast({
          title: "All Settings Reset",
          description: "Default settings have been restored",
        });
      } catch (error) {
        console.error("Error resetting all settings:", error);
      }
    }
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
