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

  // Control de peticiones HTTP para evitar múltiples llamadas simultáneas
  const pendingRequests = useRef<Record<string, boolean>>({});
  
  // Control de sincronizaciones pendientes para saber cuál es la última
  const pendingSyncs = useRef<Record<string, string>>({});

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

  // ====== Sistema mejorado de gestión de configuraciones ======
  
  // Estructura para mantener timestamps de última modificación
  interface TimestampedData<T> {
    data: T;
    lastModified: number;
  }
  
  // Función para guardar en localStorage con timestamp
  const saveTimestampedData = (key: string, data: any) => {
    try {
      const timestampedData: TimestampedData<any> = {
        data,
        lastModified: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(timestampedData));
      console.log(`✅ Datos guardados con timestamp en ${key}:`, timestampedData);
    } catch (e) {
      console.error(`❌ Error al guardar datos con timestamp en ${key}:`, e);
    }
  };
  
  // Función para obtener datos con timestamp de localStorage
  const getTimestampedData = <T,>(key: string, defaultValue: T): TimestampedData<T> => {
    try {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        const parsed = JSON.parse(storedData) as TimestampedData<T>;
        return parsed;
      }
    } catch (e) {
      console.error(`❌ Error al cargar datos con timestamp de ${key}:`, e);
    }
    
    // Si no hay datos o hay un error, usar valores por defecto con timestamp actual
    return {
      data: defaultValue,
      lastModified: Date.now()
    };
  };
  
  // Guardar el estado actual inmediatamente en localStorage con timestamp
  const persistCurrentStateToLocalStorage = () => {
    const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
    
    // Guardar cada tipo de configuración con su timestamp
    saveTimestampedData(globalSettingsKey, globalSettings);
    saveTimestampedData(moduleSettingsKey, moduleSettings);
    saveTimestampedData(favoritesKey, favoriteModules);
    
    console.log("🔄 Estado actual persistido forzosamente en localStorage con timestamps");
  };
  
  // Bandera para controlar operaciones secuenciales
  const initialLoadComplete = useRef(false);

  const fetchSettings = async () => {
    try {
      const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
      
      console.log(`📥 Cargando configuraciones para perfil ${activeProfile?.id || "usuario principal"}...`);
      
      // 1. Cargar desde localStorage con timestamps
      const localGlobalSettings = getTimestampedData<GlobalSettings>(
        globalSettingsKey, defaultGlobalSettings
      );
      
      const localModuleSettings = getTimestampedData<Record<string, ModuleSettings>>(
        moduleSettingsKey, {}
      );
      
      const localFavorites = getTimestampedData<string[]>(
        favoritesKey, []
      );
      
      // Aplicar configuraciones locales inmediatamente
      setGlobalSettings({...defaultGlobalSettings, ...localGlobalSettings.data});
      
      // Asegurarse de que los module settings tengan todos los campos por defecto
      const enhancedModuleSettings: Record<string, ModuleSettings> = {};
      
      Object.entries(localModuleSettings.data).forEach(([moduleId, settings]) => {
        enhancedModuleSettings[moduleId] = {
          ...defaultModuleSettings,
          ...(settings as ModuleSettings)
        };
      });
      
      setModuleSettings(enhancedModuleSettings);
      setFavoriteModules(localFavorites.data);
      
      console.log("✅ Estado local cargado con timestamps:", {
        globalSettings: localGlobalSettings,
        moduleSettings: localModuleSettings,
        favorites: localFavorites
      });
      
      // 2. Si está autenticado, intentar obtener datos del servidor
      if (isAuthenticated) {
        // Determinar el endpoint correcto
        const endpoint = activeProfile 
          ? `/api/child-profiles/${activeProfile.id}/settings` 
          : "/api/settings";
        
        console.log(`📡 Consultando datos del servidor (${endpoint})...`);
        
        try {
          const res = await fetch(endpoint, {
            credentials: "include",
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (res.ok) {
            const serverData = await res.json();
            console.log("📦 Datos recibidos del servidor:", serverData);
            
            // Utilizar fecha actual como timestamp para datos del servidor
            const serverTimestamp = Date.now();
            
            // 3. Comparar y fusionar datos (primero para configuraciones globales)
            if (serverData.globalSettings) {
              // Solo aplicar si los datos del servidor son más recientes o es la primera carga
              if (!initialLoadComplete.current || serverTimestamp > localGlobalSettings.lastModified) {
                console.log("🔄 Actualizando configuraciones globales desde servidor (más recientes)");
                
                const enhancedGlobalSettings = {
                  ...defaultGlobalSettings,
                  ...serverData.globalSettings
                };
                
                setGlobalSettings(enhancedGlobalSettings);
                saveTimestampedData(globalSettingsKey, enhancedGlobalSettings);
              } else {
                console.log("⏭️ Manteniendo configuraciones globales locales (más recientes)");
              }
            }
            
            // 4. Comparar y fusionar datos para configuraciones de módulos
            if (serverData.moduleSettings) {
              let updatedModuleSettings = {...enhancedModuleSettings};
              let requiresUpdate = false;
              
              // Revisar cada módulo del servidor
              Object.entries(serverData.moduleSettings).forEach(([moduleId, serverModuleSettings]) => {
                // Si el módulo no existe localmente o los datos del servidor son más recientes
                if (!initialLoadComplete.current || 
                    !enhancedModuleSettings[moduleId] || 
                    serverTimestamp > (localModuleSettings.lastModified)) {
                  console.log(`🔄 Actualizando configuración para ${moduleId} desde servidor (más reciente)`);
                  
                  updatedModuleSettings[moduleId] = {
                    ...defaultModuleSettings,
                    ...serverModuleSettings as ModuleSettings
                  };
                  
                  requiresUpdate = true;
                }
              });
              
              // Actualizar estado si es necesario
              if (requiresUpdate) {
                setModuleSettings(updatedModuleSettings);
                saveTimestampedData(moduleSettingsKey, updatedModuleSettings);
              }
            }
            
            // 5. Comparar y fusionar datos para favoritos
            if (serverData.favoriteModules) {
              if (!initialLoadComplete.current || serverTimestamp > localFavorites.lastModified) {
                console.log("🔄 Actualizando favoritos desde servidor (más recientes)");
                setFavoriteModules(serverData.favoriteModules);
                saveTimestampedData(favoritesKey, serverData.favoriteModules);
              } else {
                console.log("⏭️ Manteniendo favoritos locales (más recientes)");
              }
            }
          } else {
            console.warn(`⚠️ El servidor respondió con error ${res.status}. Usando datos locales.`);
          }
        } catch (serverError) {
          console.error("⚠️ Error al comunicarse con el servidor:", serverError);
          console.log("🛡️ Usando datos locales como respaldo");
        }
      }
      
      // Marcar como completada la carga inicial
      initialLoadComplete.current = true;
      
    } catch (error) {
      console.error("❌ Error general al cargar configuraciones:", error);
      // En caso de error, usar valores por defecto
      setGlobalSettings(defaultGlobalSettings);
      setModuleSettings({});
      setFavoriteModules([]);
    }
  };

  // Load settings initially and when auth state or active profile changes
  useEffect(() => {
    fetchSettings();
  }, [isAuthenticated, activeProfile]);

  // Al cambiar las configuraciones, guardarlas con timestamp
  useEffect(() => {
    if (initialLoadComplete.current) {
      const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
      saveTimestampedData(globalSettingsKey, globalSettings);
      saveTimestampedData(moduleSettingsKey, moduleSettings);
      saveTimestampedData(favoritesKey, favoriteModules);
      console.log("🔄 Cambios en configuraciones detectados y guardados con timestamp");
    }
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
      
      // Obtener la configuración global más actualizada y guardarla para comparación posterior
      const currentSettings = { ...updatedSettings };
      
      // Hacer la petición al servidor
      const response = await apiRequest("PUT", endpoint, currentSettings);
      
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
        // Verificar si aún necesitamos sincronizar (puede que el usuario haya cerrado sesión)
        if (isAuthenticated) {
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
    
    // Crear una clave única para evitar peticiones duplicadas
    const requestKey = `${endpoint}-${moduleId}`;
    
    // Evitar peticiones duplicadas
    if (pendingRequests.current[requestKey]) {
      console.log(`⏱️ Petición para ${moduleId} ya en curso, evitando duplicado`);
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
      
      // Guardar una copia de la configuración actualizada para comparación posterior
      const settingsSnapshot = { ...updatedSettings };
      
      // Hacer la petición al servidor con la configuración actualizada
      const response = await apiRequest("PUT", endpoint, updatedSettings);
      
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
          if (currentState) {
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
        ...moduleSettings[moduleId],
      };
    }
    
    // Si no tenemos configuraciones específicas para este módulo, usar los valores por defecto
    return { ...defaultModuleSettings };
  };

  const resetModuleSettings = async (moduleId: string) => {
    console.log(`Configuraciones eliminadas de localStorage para ${moduleId}`);
    
    // Actualizar estado local
    setModuleSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[moduleId];
      
      // Guardar en localStorage
      try {
        const { moduleSettingsKey } = getStorageKeys();
        localStorage.setItem(moduleSettingsKey, JSON.stringify(newSettings));
      } catch (e) {
        console.error("Error guardando en localStorage:", e);
      }
      
      return newSettings;
    });
    
    // Si está autenticado, también eliminar del servidor
    if (isAuthenticated) {
      try {
        console.log(`Eliminando configuraciones del servidor para ${moduleId}`);
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
          : `/api/settings/module/${moduleId}`;
        
        const response = await apiRequest("DELETE", endpoint);
        
        if (response.ok) {
          console.log(`Configuraciones eliminadas exitosamente del servidor para ${moduleId}`);
        } else {
          console.error(`Error eliminando configuraciones del servidor para ${moduleId}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error al comunicarse con el servidor:`, error);
      }
    }
  };

  const resetAllSettings = async () => {
    // Reset local state
    setGlobalSettings(defaultGlobalSettings);
    setModuleSettings({});
    setFavoriteModules([]);
    
    // Reset localStorage
    const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
    localStorage.removeItem(globalSettingsKey);
    localStorage.removeItem(moduleSettingsKey);
    localStorage.removeItem(favoritesKey);
    
    // If authenticated, also reset on server
    if (isAuthenticated) {
      try {
        const endpoint = activeProfile
          ? `/api/child-profiles/${activeProfile.id}/settings`
          : "/api/settings";
        
        const response = await apiRequest("DELETE", endpoint);
        
        if (response.ok) {
          console.log("All settings reset successfully on the server");
        } else {
          console.error(`Error resetting settings on server: ${response.status}`);
        }
      } catch (error) {
        console.error("Error communicating with server:", error);
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
      console.log(`⭐ Quitando ${moduleId} de favoritos`);
    } else {
      updatedFavorites = [...favoriteModules, moduleId];
      console.log(`⭐ Agregando ${moduleId} a favoritos`);
    }
    
    // Actualizar inmediatamente el estado local
    setFavoriteModules(updatedFavorites);
    
    // Crear una referencia para esta operación de favoritos
    const syncId = Date.now().toString();
    pendingSyncs.current['favorites'] = syncId;
    
    // Guardar inmediatamente en localStorage para persistencia
    try {
      const { favoritesKey } = getStorageKeys();
      localStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites));
      console.log(`💾 Favoritos actualizados en localStorage:`, updatedFavorites);
    } catch (e) {
      console.error("❌ Error guardando favoritos en localStorage:", e);
    }
    
    // Si no está autenticado, no continuar
    if (!isAuthenticated) {
      console.log(`⚠️ Usuario no autenticado, favoritos guardados solo localmente`);
      return;
    }
    
    // Determinar el endpoint correcto
    const endpoint = activeProfile
      ? `/api/child-profiles/${activeProfile.id}/favorites`
      : "/api/favorites";
      
    // Crear una clave única para evitar peticiones duplicadas
    const requestKey = `${endpoint}-favorites`;
    
    // Evitar peticiones duplicadas
    if (pendingRequests.current[requestKey]) {
      console.log(`⏱️ Petición de favoritos ya en curso, evitando duplicado`);
      return;
    }
    
    // Marcar esta petición como en curso
    pendingRequests.current[requestKey] = true;
    
    try {
      // Pequeña pausa para permitir que cambios rápidos consecutivos se agrupen
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Verificar si esta sincronización sigue siendo la más reciente
      if (pendingSyncs.current['favorites'] !== syncId) {
        console.log(`⏭️ Sincronización ${syncId} para favoritos ha sido reemplazada por una más reciente`);
        pendingRequests.current[requestKey] = false;
        return;
      }
      
      console.log(`📤 Enviando favoritos al servidor (${endpoint})`);
      
      // Guardar una copia de la lista actual de favoritos
      const favoritesSnapshot = [...updatedFavorites];
      
      // Hacer la petición al servidor
      const response = await apiRequest("PUT", endpoint, { favorites: favoritesSnapshot });
      
      if (response.ok) {
        console.log(`✅ Favoritos guardados exitosamente en el servidor`);
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error guardando favoritos:`, error);
      
      toast({
        title: "Error al guardar favoritos",
        description: "Tus favoritos solo se han guardado localmente. Se intentará sincronizar más tarde.",
        variant: "destructive",
      });
      
      // Programar un reintento después de un tiempo
      setTimeout(() => {
        // Verificar si la lista de favoritos sigue siendo la misma
        const currentState = favoriteModules;
        const favoritesSnapshot = [...updatedFavorites]; // Captura el estado actual
        
        if (JSON.stringify(currentState) === JSON.stringify(favoritesSnapshot)) {
          console.log(`🔄 Reintentando sincronización de favoritos`);
          toggleFavoriteModule(moduleId); // Reintento con el mismo módulo
        }
      }, 10000); // Reintentar en 10 segundos
    } finally {
      // Liberar la petición una vez completada o fallida
      pendingRequests.current[requestKey] = false;
      
      // Limpiar el ID de sincronización si sigue siendo el actual
      if (pendingSyncs.current['favorites'] === syncId) {
        delete pendingSyncs.current['favorites'];
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