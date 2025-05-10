import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
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
      
      // Variable para definir si debemos cargar desde localStorage o no
      // Solo usaremos localStorage si no podemos obtener datos del servidor
      let useLocalStorage = true;
      let serverData = null;
      
      // Si está autenticado, intentar primero cargar desde el servidor
      if (isAuthenticated) {
        try {
          const endpoint = activeProfile 
            ? `/api/child-profiles/${activeProfile.id}/settings` 
            : "/api/settings";
          
          console.log(`Intentando obtener configuraciones del servidor (${endpoint})`);
          const res = await fetch(endpoint, {
            credentials: "include",
            headers: { 'Cache-Control': 'no-cache' } // Evitar caché
          });
          
          if (res.ok) {
            serverData = await res.json();
            console.log("✅ Datos recibidos exitosamente del servidor:", serverData);
            
            // Si hemos obtenido datos del servidor, no necesitamos localStorage
            useLocalStorage = false;
          } else {
            console.warn(`⚠️ Error al obtener configuraciones del servidor: ${res.status}`);
          }
        } catch (serverError) {
          console.error("⚠️ Error al comunicarse con el servidor:", serverError);
        }
      }
      
      // Si debemos usar localStorage (porque no hay datos del servidor)
      if (useLocalStorage) {
        console.log("Usando datos de localStorage como respaldo");
        
        // Try to load from local storage
        const storedGlobalSettings = localStorage.getItem(globalSettingsKey);
        const storedModuleSettings = localStorage.getItem(moduleSettingsKey);
        const storedFavorites = localStorage.getItem(favoritesKey);

        // Cargar configuraciones globales
        if (storedGlobalSettings) {
          try {
            const parsedSettings = JSON.parse(storedGlobalSettings);
            setGlobalSettings({...defaultGlobalSettings, ...parsedSettings});
            console.log("Configuraciones globales cargadas de localStorage:", parsedSettings);
          } catch (e) {
            console.error("Error al parsear configuraciones globales:", e);
            setGlobalSettings(defaultGlobalSettings);
          }
        } else {
          setGlobalSettings(defaultGlobalSettings);
        }

        // Cargar configuraciones de módulos
        if (storedModuleSettings) {
          try {
            const parsedSettings = JSON.parse(storedModuleSettings);
            // Nos aseguramos de que cada módulo tenga todos los campos por defecto
            const enhancedSettings: Record<string, ModuleSettings> = {};
            
            Object.entries(parsedSettings).forEach(([moduleId, settings]) => {
              enhancedSettings[moduleId] = {
                ...defaultModuleSettings,
                ...(settings as ModuleSettings)
              };
            });
            
            setModuleSettings(enhancedSettings);
            console.log("Configuraciones de módulos cargadas de localStorage:", enhancedSettings);
          } catch (e) {
            console.error("Error al parsear configuraciones de módulos:", e);
            setModuleSettings({});
          }
        } else {
          setModuleSettings({});
        }
        
        // Cargar favoritos
        if (storedFavorites) {
          try {
            const parsedFavorites = JSON.parse(storedFavorites);
            setFavoriteModules(parsedFavorites);
            console.log("Favoritos cargados de localStorage:", parsedFavorites);
          } catch (e) {
            console.error("Error al parsear favoritos:", e);
            setFavoriteModules([]);
          }
        } else {
          setFavoriteModules([]);
        }
      } else {
        // Usar datos del servidor (serverData ya está validado como no nulo aquí)
        
        // Procesar configuraciones de módulos
        if (serverData.moduleSettings) {
          const enhancedModuleSettings: Record<string, ModuleSettings> = {};
          
          // Procesar cada módulo en los ajustes recibidos
          Object.entries(serverData.moduleSettings).forEach(([moduleId, settings]) => {
            // Combinar con valores por defecto para asegurar que todas las propiedades existan
            enhancedModuleSettings[moduleId] = {
              ...defaultModuleSettings,
              ...settings as ModuleSettings
            };
          });
          
          console.log("Configuraciones mejoradas de módulos:", enhancedModuleSettings);
          setModuleSettings(enhancedModuleSettings);
          localStorage.setItem(moduleSettingsKey, JSON.stringify(enhancedModuleSettings));
        } else {
          setModuleSettings({});
          localStorage.removeItem(moduleSettingsKey);
        }
        
        // Procesar configuraciones globales
        if (serverData.globalSettings) {
          const enhancedGlobalSettings = {
            ...defaultGlobalSettings,
            ...serverData.globalSettings
          };
          setGlobalSettings(enhancedGlobalSettings);
          localStorage.setItem(globalSettingsKey, JSON.stringify(enhancedGlobalSettings));
        } else {
          setGlobalSettings(defaultGlobalSettings);
          localStorage.removeItem(globalSettingsKey);
        }
        
        // Procesar favoritos
        if (serverData.favoriteModules) {
          setFavoriteModules(serverData.favoriteModules);
          localStorage.setItem(favoritesKey, JSON.stringify(serverData.favoriteModules));
        } else {
          setFavoriteModules([]);
          localStorage.removeItem(favoritesKey);
        }
      }
    } catch (error) {
      console.error("⚠️ Error al cargar configuraciones:", error);
      // Usar valores por defecto como último recurso
      setGlobalSettings(defaultGlobalSettings);
      setModuleSettings({});
      setFavoriteModules([]);
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
    console.log(`🔄 Actualizando configuración global:`, updatedSettings);
    
    // Actualizar estado inmediatamente
    setGlobalSettings(updatedSettings);
    
    // Crear clave para esta petición global
    const syncId = Date.now().toString();
    pendingSyncs.current['global'] = syncId;
    
    // Si no está autenticado, solo guardamos localmente
    if (!isAuthenticated) {
      console.log(`⚠️ Usuario no autenticado, configuración global guardada solo localmente`);
      return;
    }
    
    // Determinar la URL del endpoint correcto
    const endpoint = activeProfile
      ? `/api/child-profiles/${activeProfile.id}/settings/global`
      : "/api/settings/global";
    
    // Crear una clave única para esta petición global
    const requestKey = `${endpoint}-global`;
    
    // Evitar peticiones duplicadas
    if (pendingRequests.current[requestKey]) {
      console.log(`⏱️ Petición global ya en curso, evitando duplicado`);
      return;
    }
    
    // Marcar esta petición como en curso
    pendingRequests.current[requestKey] = true;
    
    try {
      // Pequeña pausa para permitir que cambios rápidos consecutivos se agrupen
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Verificar si esta sincronización sigue siendo la más reciente
      if (pendingSyncs.current['global'] !== syncId) {
        console.log(`⏭️ Sincronización ${syncId} para configuración global ha sido reemplazada por una más reciente`);
        pendingRequests.current[requestKey] = false;
        return;
      }
      
      console.log(`📤 Enviando configuración global al servidor (${endpoint})`);
      
      // Obtener la configuración global más actualizada
      const currentGlobalSettings = globalSettings;
      
      // Hacer la petición al servidor
      const response = await apiRequest("PUT", endpoint, currentGlobalSettings);
      
      if (response.ok) {
        console.log(`✅ Configuración global guardada exitosamente en el servidor`);
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error guardando configuración global:`, error);
      
      toast({
        title: "Error al guardar configuración",
        description: "Tus ajustes solo se han guardado localmente. Se intentará sincronizar más tarde.",
        variant: "destructive",
      });
      
      // Programar un reintento después de un tiempo
      setTimeout(() => {
        // Verificar si la configuración global sigue siendo la misma
        const currentState = globalSettings;
        if (JSON.stringify(currentState) === JSON.stringify(currentState)) {
          console.log(`🔄 Reintentando sincronización para configuración global`);
          updateGlobalSettings({}); // Reintento con los mismos ajustes
        }
      }, 10000); // Reintentar en 10 segundos
    } finally {
      // Liberar la petición una vez completada o fallida
      pendingRequests.current[requestKey] = false;
      
      // Limpiar el ID de sincronización si sigue siendo el actual
      if (pendingSyncs.current['global'] === syncId) {
        delete pendingSyncs.current['global'];
      }
    }
  };

  // Control de peticiones HTTP para evitar múltiples llamadas simultáneas
  const pendingRequests = useRef<Record<string, boolean>>({});
  
  // Control de sincronizaciones pendientes para saber cuál es la última
  const pendingSyncs = useRef<Record<string, string>>({});
  
  const updateModuleSettings = async (moduleId: string, settings: Partial<ModuleSettings>) => {
    // Asegurarse de que siempre tenemos todos los valores por defecto
    const currentSettings = moduleSettings[moduleId] || { ...defaultModuleSettings };
    const updatedSettings = { ...currentSettings, ...settings };
    
    console.log(`🔄 Actualizando configuración para ${moduleId}:`, updatedSettings);
    
    // Crear referencia para el controlador de sincronización con servidor
    const syncId = Date.now().toString();
    pendingSyncs.current[moduleId] = syncId;
    
    // Actualizar estado local inmediatamente
    setModuleSettings(prev => {
      const newSettings = {
        ...prev,
        [moduleId]: updatedSettings,
      };
      
      // Guardar inmediatamente en localStorage para persistencia
      try {
        const { moduleSettingsKey } = getStorageKeys();
        localStorage.setItem(moduleSettingsKey, JSON.stringify(newSettings));
        console.log(`💾 Guardado en localStorage: ${moduleSettingsKey}`);
      } catch (e) {
        console.error("❌ Error guardando en localStorage:", e);
      }
      
      return newSettings;
    });
    
    // Si no está autenticado, terminar aquí (solo localStorage)
    if (!isAuthenticated) {
      console.log(`⚠️ Usuario no autenticado, configuración de ${moduleId} guardada solo localmente`);
      return;
    }
    
    // Determinar la URL del endpoint correcto
    const endpoint = activeProfile
      ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
      : `/api/settings/module/${moduleId}`;
    
    // Crear una clave única para esta petición para evitar duplicados
    const requestKey = `${endpoint}-${moduleId}`;
    
    // Control de peticiones duplicadas con un pequeño retraso para agrupar cambios rápidos
    if (pendingRequests.current[requestKey]) {
      console.log(`⏱️ Petición ya en curso para ${moduleId}, evitando duplicado`);
      
      // No cancelamos inmediatamente - esperamos a que la sincronización actual termine
      // y verificamos si es la última solicitud
      return;
    }
    
    // Marcar esta petición como en curso
    pendingRequests.current[requestKey] = true;
    
    try {
      // Pequeña pausa para permitir que cambios rápidos consecutivos se agrupen
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Verificar si esta sincronización sigue siendo la más reciente
      if (pendingSyncs.current[moduleId] !== syncId) {
        console.log(`⏭️ Sincronización ${syncId} para ${moduleId} ha sido reemplazada por una más reciente`);
        pendingRequests.current[requestKey] = false;
        return;
      }
      
      console.log(`📤 Enviando configuración al servidor (${endpoint})`);
      
      // Obtener la configuración más actualizada desde el estado
      const currentModuleSettings = moduleSettings[moduleId];
      
      // Hacer la petición al servidor
      const response = await apiRequest("PUT", endpoint, currentModuleSettings);
      
      if (response.ok) {
        console.log(`✅ Configuración guardada exitosamente en el servidor para ${moduleId}`);
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      // Solo mostrar una notificación si hay un error real (no error de autenticación)
      if (error instanceof Error && !error.message.includes("401")) {
        console.error(`❌ Error guardando configuración para ${moduleId}:`, error);
        
        toast({
          title: "Error al guardar configuración",
          description: "Tus ajustes solo se han guardado localmente. Se intentará sincronizar más tarde.",
          variant: "destructive",
        });
        
        // Programar un reintento después de un tiempo
        setTimeout(() => {
          // Verificar si la configuración sigue siendo la misma
          const currentState = moduleSettings[moduleId];
          if (JSON.stringify(currentState) === JSON.stringify(currentModuleSettings)) {
            console.log(`🔄 Reintentando sincronización para ${moduleId}`);
            updateModuleSettings(moduleId, {}); // Reintento con los mismos ajustes
          }
        }, 10000); // Reintentar en 10 segundos
      } else {
        console.warn(`⚠️ Error de autenticación al guardar configuración para ${moduleId}`);
      }
    } finally {
      // Liberar la petición una vez completada o fallida
      pendingRequests.current[requestKey] = false;
      
      // Limpiar el ID de sincronización si sigue siendo el actual
      if (pendingSyncs.current[moduleId] === syncId) {
        delete pendingSyncs.current[moduleId];
      }
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
