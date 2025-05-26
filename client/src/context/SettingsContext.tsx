import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useChildProfiles } from "@/context/ChildProfilesContext";
import {
  getFromLocalStorage,
  saveToLocalStorage,
  TimestampedData
} from "@/lib/localStorage";
import { debouncePromise } from "@/lib/debounce";

// Interfaces de datos
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

// Valores predeterminados
const defaultGlobalSettings: GlobalSettings = {
  darkMode: false,
  fontSize: "medium",
  highContrast: false,
  language: "en",
  soundEffects: true,
  immediateFeedback: true,
  showSolutions: true,
  extendedTime: false
};

const defaultModuleSettings: ModuleSettings = {
  difficulty: "beginner",
  problemCount: 10,
  timeLimit: "per-problem",
  timeValue: 0, // Sin límite por defecto
  maxAttempts: 2,
  showImmediateFeedback: true,
  enableSoundEffects: true,
  showAnswerWithExplanation: true,
  enableAdaptiveDifficulty: true,
  enableCompensation: true,
  enableRewards: true,
  rewardType: "stars",
  language: "english"
};

// Claves constantes para localStorage
const GLOBAL_SETTINGS_KEY = 'globalSettings';
const MODULE_SETTINGS_KEY = 'moduleSettings';
const FAVORITES_KEY = 'favoriteModules';

// Contexto
const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  // Estado
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(defaultGlobalSettings);
  const [moduleSettings, setModuleSettings] = useState<Record<string, ModuleSettings>>({});
  const [favoriteModules, setFavoriteModules] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Referencias
  const initialLoadComplete = useRef(false);
  
  // Hooks externos
  const { toast } = useToast();
  const { activeProfile } = useChildProfiles();
  
  // Comprobar estado de autenticación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include"
        });
        
        const wasAuthenticated = isAuthenticated;
        const nowAuthenticated = res.ok;
        
        if (wasAuthenticated !== nowAuthenticated) {
          console.log(`🔐 Estado de autenticación cambiado: ${wasAuthenticated} -> ${nowAuthenticated}`);
          setIsAuthenticated(nowAuthenticated);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    };
    
    // Comprobar al inicio
    checkAuth();
    
    // Comprobar periódicamente (cada 30 segundos)
    const interval = setInterval(checkAuth, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Cargar datos iniciales (desde localStorage o servidor según autenticación)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log(`📥 Cargando configuraciones ${activeProfile ? `para perfil ${activeProfile.name}` : 'para perfil usuario principal'}...`);
        
        const profileId = activeProfile?.id;
        
        if (isAuthenticated) {
          console.log("🔐 Usuario autenticado: intentando cargar datos del servidor");
          
          try {
            // Determinar endpoint basado en si hay un perfil activo
            const endpoint = activeProfile
              ? `/api/child-profiles/${activeProfile.id}/settings`
              : "/api/settings";
            
            console.log(`📡 Consultando datos del servidor (${endpoint})...`);
            
            const response = await fetch(endpoint, {
              credentials: "include",
            });
            
            if (response.ok) {
              const serverData = await response.json();
              
              // Aplicar configuración global
              if (serverData.globalSettings) {
                setGlobalSettings({
                  ...defaultGlobalSettings,
                  ...serverData.globalSettings
                });
                console.log("✅ Configuraciones globales cargadas desde servidor");
              }
              
              // Aplicar configuración de módulos
              if (serverData.moduleSettings) {
                const enhancedModuleSettings: Record<string, ModuleSettings> = {};
                
                Object.entries(serverData.moduleSettings).forEach(([moduleId, settings]) => {
                  enhancedModuleSettings[moduleId] = {
                    ...defaultModuleSettings,
                    ...(settings as Partial<ModuleSettings>)
                  };
                });
                
                setModuleSettings(enhancedModuleSettings);
                console.log("✅ Configuraciones de módulos cargadas desde servidor");
              }
              
              // Aplicar favoritos
              if (serverData.favorites && Array.isArray(serverData.favorites)) {
                setFavoriteModules(serverData.favorites);
                console.log("✅ Lista de favoritos cargada desde servidor");
              }
            } else {
              console.warn(`⚠️ Error del servidor ${response.status}. Cargando valores de localStorage.`);
              loadFromLocalStorage(profileId);
            }
          } catch (error) {
            console.error("❌ Error al cargar datos del servidor:", error);
            loadFromLocalStorage(profileId);
          }
        } else {
          console.log("🔓 Usuario no autenticado: usando datos locales");
          loadFromLocalStorage(profileId);
        }
        
        // Marcar como inicializado
        initialLoadComplete.current = true;
        setIsInitialized(true);
      } catch (error) {
        console.error("❌ Error general al cargar configuraciones:", error);
        // En caso de error catastrófico, usar valores predeterminados
        setGlobalSettings(defaultGlobalSettings);
        setModuleSettings({});
        setFavoriteModules([]);
        setIsInitialized(true);
      }
    };
    
    loadSettings();
  }, [isAuthenticated, activeProfile]);
  
  // Función para cargar desde localStorage
  const loadFromLocalStorage = useCallback((profileId?: number | null) => {
    // Cargar configuración global
    const globalData = getFromLocalStorage<GlobalSettings>(
      GLOBAL_SETTINGS_KEY, 
      defaultGlobalSettings,
      profileId
    );
    
    // Cargar configuraciones de módulos
    const moduleData = getFromLocalStorage<Record<string, ModuleSettings>>(
      MODULE_SETTINGS_KEY,
      {},
      profileId
    );
    
    // Cargar favoritos
    const favoritesData = getFromLocalStorage<string[]>(
      FAVORITES_KEY,
      [],
      profileId
    );
    
    // Aplicar configuraciones globales
    setGlobalSettings({...defaultGlobalSettings, ...globalData.data});
    console.log("✅ Configuraciones globales cargadas desde localStorage");
    
    // Aplicar configuraciones de módulos con valores predeterminados
    const enhancedModuleSettings: Record<string, ModuleSettings> = {};
    
    Object.entries(moduleData.data).forEach(([moduleId, settings]) => {
      enhancedModuleSettings[moduleId] = {
        ...defaultModuleSettings,
        ...settings
      };
    });
    
    setModuleSettings(enhancedModuleSettings);
    console.log("✅ Configuraciones de módulos cargadas desde localStorage");
    
    // Aplicar favoritos
    setFavoriteModules(favoritesData.data);
    console.log("✅ Lista de favoritos cargada desde localStorage");
  }, []);
  
  // Función para enviar configuraciones al servidor con debounce
  const saveToServer = useCallback(async (
    endpoint: string, 
    data: any
  ): Promise<Response> => {
    try {
      return await apiRequest("PUT", endpoint, data);
    } catch (error) {
      // Manejar error 401 (no autenticado)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
        setIsAuthenticated(false);
      }
      
      throw error;
    }
  }, []);
  
  // Versión con debounce de la función para enviar al servidor
  const debouncedSaveToServer = useMemo(() => 
    debouncePromise(saveToServer, 500), 
    [saveToServer]
  );
  
  // Escuchar eventos de cierre de sesión desde AuthContext
  useEffect(() => {
    const handleUserLogout = () => {
      console.log("🔄 Evento de cierre de sesión recibido en SettingsContext");
      setIsAuthenticated(false);
      
      // Recargar las configuraciones desde localStorage inmediatamente
      loadFromLocalStorage(activeProfile?.id);
    };
    
    window.addEventListener("user-logout", handleUserLogout);
    
    // Limpieza al desmontar
    return () => {
      window.removeEventListener("user-logout", handleUserLogout);
    };
  }, [activeProfile, loadFromLocalStorage]);
  
  // Guardar cambios de configuración global
  const updateGlobalSettings = async (newSettings: Partial<GlobalSettings>) => {
    // Actualizar estado local
    const updatedSettings = { ...globalSettings, ...newSettings };
    setGlobalSettings(updatedSettings);
    
    if (!initialLoadComplete.current) return;
    
    try {
      if (isAuthenticated) {
        console.log("🔐 Usuario autenticado: guardando configuración global en servidor");
        
        // Determinar endpoint basado en si hay un perfil activo
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/global`
          : "/api/settings/global";
        
        // Usar la versión con debounce para evitar múltiples llamadas al servidor
        await debouncedSaveToServer(endpoint, updatedSettings);
      } else {
        console.log("🔓 Usuario no autenticado: guardando configuración global en localStorage");
        
        // Guardar en localStorage
        saveToLocalStorage(
          GLOBAL_SETTINGS_KEY,
          updatedSettings,
          activeProfile?.id
        );
      }
    } catch (error) {
      console.error("❌ Error al guardar configuración global:", error);
      
      // Manejar error 401 (no autenticado)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, cambiando a almacenamiento local");
        setIsAuthenticated(false);
        
        // Guardar en localStorage como fallback
        saveToLocalStorage(
          GLOBAL_SETTINGS_KEY,
          updatedSettings,
          activeProfile?.id
        );
      } else {
        toast({
          title: "Error al guardar configuración",
          description: "No se pudo guardar la configuración global",
          variant: "destructive",
        });
      }
    }
  };
  
  // Guardar cambios de configuración de módulo
  const updateModuleSettings = async (moduleId: string, newSettings: Partial<ModuleSettings>) => {
    console.log(`🔄 Actualizando configuración para ${moduleId}:`, newSettings);
    
    // Obtener configuración actual del módulo o usar valores predeterminados
    const currentSettings = moduleSettings[moduleId] || { ...defaultModuleSettings };
    
    // Crear configuración actualizada
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    // Actualizar estado local inmediatamente
    setModuleSettings(prevSettings => ({
      ...prevSettings,
      [moduleId]: updatedSettings
    }));
    
    if (!initialLoadComplete.current) return;
    
    try {
      if (isAuthenticated) {
        console.log(`🔐 Usuario autenticado: guardando configuración de ${moduleId} en servidor`);
        
        // Determinar endpoint basado en si hay un perfil activo
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
          : `/api/settings/module/${moduleId}`;
        
        // Usar la versión con debounce para evitar múltiples llamadas al servidor
        await debouncedSaveToServer(endpoint, updatedSettings);
      } else {
        console.log(`🔓 Usuario no autenticado: configuración de ${moduleId} guardada solo en localStorage`);
        
        // Obtener configuraciones de módulos actuales
        const moduleData = getFromLocalStorage<Record<string, ModuleSettings>>(
          MODULE_SETTINGS_KEY,
          {},
          activeProfile?.id
        );
        
        // Actualizar configuración para este módulo
        const updatedModuleSettings = {
          ...moduleData.data,
          [moduleId]: updatedSettings
        };
        
        // Guardar en localStorage
        saveToLocalStorage(
          MODULE_SETTINGS_KEY,
          updatedModuleSettings,
          activeProfile?.id
        );
      }
    } catch (error) {
      console.error(`❌ Error al guardar configuración de ${moduleId}:`, error);
      
      // Manejar error 401 (no autenticado)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, cambiando a almacenamiento local");
        setIsAuthenticated(false);
        
        // Guardar en localStorage como fallback
        const moduleData = getFromLocalStorage<Record<string, ModuleSettings>>(
          MODULE_SETTINGS_KEY,
          {},
          activeProfile?.id
        );
        
        const updatedModuleSettings = {
          ...moduleData.data,
          [moduleId]: updatedSettings
        };
        
        saveToLocalStorage(
          MODULE_SETTINGS_KEY,
          updatedModuleSettings,
          activeProfile?.id
        );
      } else {
        toast({
          title: "Error al guardar configuración",
          description: `No se pudo guardar la configuración de ${moduleId}`,
          variant: "destructive",
        });
      }
    }
  };
  
  // Obtener configuración para un módulo específico
  const getModuleSettings = (moduleId: string): ModuleSettings => {
    // Si existe configuración específica para este módulo, usarla
    if (moduleSettings[moduleId]) {
      return moduleSettings[moduleId];
    }
    
    // Si no, devolver valores predeterminados
    return { ...defaultModuleSettings };
  };
  
  // Restablecer configuración para un módulo específico
  const resetModuleSettings = async (moduleId: string) => {
    console.log(`🧹 Restableciendo configuración para ${moduleId} a valores predeterminados`);
    
    // Actualizar estado local
    setModuleSettings(prevSettings => {
      const newSettings = { ...prevSettings };
      delete newSettings[moduleId];
      return newSettings;
    });
    
    try {
      if (isAuthenticated) {
        console.log(`🔐 Usuario autenticado: eliminando configuración de ${moduleId} del servidor`);
        
        // Determinar endpoint basado en si hay un perfil activo
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
          : `/api/settings/module/${moduleId}`;
        
        const response = await apiRequest("DELETE", endpoint);
        
        if (!response.ok && response.status === 401) {
          console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
          setIsAuthenticated(false);
        }
      } else {
        console.log(`🔓 Usuario no autenticado: eliminando configuración de ${moduleId} de localStorage`);
        
        // Obtener configuraciones de módulos actuales
        const moduleData = getFromLocalStorage<Record<string, ModuleSettings>>(
          MODULE_SETTINGS_KEY,
          {},
          activeProfile?.id
        );
        
        // Eliminar configuración para este módulo
        const updatedModuleSettings = { ...moduleData.data };
        delete updatedModuleSettings[moduleId];
        
        // Guardar en localStorage
        saveToLocalStorage(
          MODULE_SETTINGS_KEY,
          updatedModuleSettings,
          activeProfile?.id
        );
      }
    } catch (error) {
      console.error(`❌ Error al restablecer configuración de ${moduleId}:`, error);
      
      // Manejar error 401 (no autenticado)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
        setIsAuthenticated(false);
        
        // Obtener configuraciones de módulos actuales
        const moduleData = getFromLocalStorage<Record<string, ModuleSettings>>(
          MODULE_SETTINGS_KEY,
          {},
          activeProfile?.id
        );
        
        // Eliminar configuración para este módulo
        const updatedModuleSettings = { ...moduleData.data };
        delete updatedModuleSettings[moduleId];
        
        // Guardar en localStorage
        saveToLocalStorage(
          MODULE_SETTINGS_KEY,
          updatedModuleSettings,
          activeProfile?.id
        );
      } else {
        toast({
          title: "Error al restablecer configuración",
          description: `No se pudo restablecer la configuración de ${moduleId}`,
          variant: "destructive",
        });
      }
    }
  };
  
  // Restablecer todas las configuraciones
  const resetAllSettings = async () => {
    console.log(`🧹 Restableciendo todas las configuraciones a valores predeterminados`);
    
    // Reset local state
    setGlobalSettings(defaultGlobalSettings);
    setModuleSettings({});
    setFavoriteModules([]);
    
    try {
      if (isAuthenticated) {
        console.log(`🔐 Usuario autenticado: eliminando todas las configuraciones del servidor`);
        
        // Determinar endpoint basado en si hay un perfil activo
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings`
          : "/api/settings";
        
        const response = await apiRequest("DELETE", endpoint);
        
        if (!response.ok && response.status === 401) {
          console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
          setIsAuthenticated(false);
        }
      }
      
      // En todos los casos, restablecer valores en localStorage
      console.log(`🔓 Restableciendo configuraciones en localStorage`);
      
      // Guardar valores predeterminados
      saveToLocalStorage(
        GLOBAL_SETTINGS_KEY,
        defaultGlobalSettings,
        activeProfile?.id
      );
      
      saveToLocalStorage(
        MODULE_SETTINGS_KEY,
        {},
        activeProfile?.id
      );
      
      saveToLocalStorage(
        FAVORITES_KEY,
        [],
        activeProfile?.id
      );
      
      console.log(`✅ Todas las configuraciones restablecidas a valores predeterminados`);
      
      // Mostrar notificación de éxito
      toast({
        title: "Configuración restablecida",
        description: "Se han aplicado los valores predeterminados",
      });
    } catch (error) {
      console.error("❌ Error al restablecer todas las configuraciones:", error);
      
      // Manejar error 401 (no autenticado)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
        setIsAuthenticated(false);
        
        // Aplicar valores predeterminados a localStorage
        saveToLocalStorage(
          GLOBAL_SETTINGS_KEY,
          defaultGlobalSettings,
          activeProfile?.id
        );
        
        saveToLocalStorage(
          MODULE_SETTINGS_KEY,
          {},
          activeProfile?.id
        );
        
        saveToLocalStorage(
          FAVORITES_KEY,
          [],
          activeProfile?.id
        );
        
        toast({
          title: "Configuraciones restablecidas",
          description: "Se han aplicado los valores predeterminados localmente",
        });
      } else {
        toast({
          title: "Error de conexión",
          description: "No se pudieron guardar los cambios en el servidor",
          variant: "destructive",
        });
      }
    }
  };
  
  // Alternar un módulo como favorito
  const toggleFavoriteModule = async (moduleId: string) => {
    // Crear nueva lista de favoritos
    const newFavorites = favoriteModules.includes(moduleId)
      ? favoriteModules.filter(id => id !== moduleId)
      : [...favoriteModules, moduleId];
    
    // Actualizar estado local
    setFavoriteModules(newFavorites);
    
    if (!initialLoadComplete.current) return;
    
    try {
      if (isAuthenticated) {
        console.log(`🔐 Usuario autenticado: guardando lista de favoritos en servidor`);
        
        // Determinar endpoint basado en si hay un perfil activo
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/favorites`
          : "/api/settings/favorites";
        
        // Usar la versión con debounce para evitar múltiples llamadas al servidor
        await debouncedSaveToServer(endpoint, { favorites: newFavorites });
      } else {
        console.log(`🔓 Usuario no autenticado: guardando lista de favoritos en localStorage`);
        
        // Guardar en localStorage
        saveToLocalStorage(
          FAVORITES_KEY,
          newFavorites,
          activeProfile?.id
        );
      }
    } catch (error) {
      console.error("❌ Error al guardar lista de favoritos:", error);
      
      // Manejar error 401 (no autenticado)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
        setIsAuthenticated(false);
        
        // Guardar en localStorage como fallback
        saveToLocalStorage(
          FAVORITES_KEY,
          newFavorites,
          activeProfile?.id
        );
      } else {
        // Restaurar estado anterior si hay error
        setFavoriteModules(favoriteModules);
        
        toast({
          title: "Error al guardar favoritos",
          description: "No se pudo actualizar la lista de favoritos",
          variant: "destructive",
        });
      }
    }
  };
  
  // Verificar si un módulo es favorito
  const isFavorite = (moduleId: string): boolean => {
    return favoriteModules.includes(moduleId);
  };
  
  // Mientras se inicializa, mostrar un valor nulo para evitar renderizados parciales
  if (!isInitialized) {
    return null;
  }
  
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