import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ModuleSettings {
  difficulty: "beginner" | "intermediate" | "advanced";
  problemCount: number;
  timeLimit: "none" | "per-problem" | "total";
  timeValue: number;
  showImmediateFeedback: boolean;
  enableSoundEffects: boolean;
  showSolution: boolean;
}

export interface GlobalSettings {
  darkMode: boolean;
  fontSize: "small" | "medium" | "large";
  highContrast: boolean;
  language: string;
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
};

const defaultModuleSettings: ModuleSettings = {
  difficulty: "beginner",
  problemCount: 10,
  timeLimit: "none",
  timeValue: 30,
  showImmediateFeedback: true,
  enableSoundEffects: true,
  showSolution: false,
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
    
    if (isAuthenticated) {
      try {
        await apiRequest("PUT", `/api/settings/module/${moduleId}`, updatedSettings);
      } catch (error) {
        toast({
          title: "Failed to Save Module Settings",
          description: "Your settings will only be saved locally",
          variant: "destructive",
        });
        console.error(`Error saving settings for module ${moduleId}:`, error);
      }
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
