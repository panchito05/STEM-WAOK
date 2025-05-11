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
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        // Avoid caching the authentication status
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      
      const newAuthStatus = res.ok;
      if (newAuthStatus !== isAuthenticated) {
        console.log(`🔐 Estado de autenticación cambiado: ${isAuthenticated} -> ${newAuthStatus}`);
        setIsAuthenticated(newAuthStatus);
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error);
      if (isAuthenticated) {
        console.log("❌ Error de conexión, considerando usuario como no autenticado");
        setIsAuthenticated(false);
      }
    }
  };
  
  // Verificar estado de autenticación al cargar y cada 30 segundos
  useEffect(() => {
    // Verificar al inicio
    checkAuth();
    
    // Verificar periódicamente
    const intervalId = setInterval(checkAuth, 30000);
    
    return () => clearInterval(intervalId);
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
      
      // Estrategia simplificada:
      // 1. Si el usuario está autenticado -> Usar SOLO datos del servidor
      // 2. Si el usuario NO está autenticado -> Usar SOLO datos locales
      
      if (isAuthenticated) {
        // USUARIO AUTENTICADO - Usar solo datos del servidor
        console.log(`🔐 Usuario autenticado: prioridad a datos del servidor`);
        
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
            
            // Aplicar configuraciones globales del servidor
            if (serverData.globalSettings) {
              const enhancedGlobalSettings = {
                ...defaultGlobalSettings,
                ...serverData.globalSettings
              };
              
              setGlobalSettings(enhancedGlobalSettings);
              console.log("✅ Configuraciones globales cargadas desde servidor");
            } else {
              // Si no hay datos en el servidor, usar valores predeterminados
              setGlobalSettings(defaultGlobalSettings);
              console.log("ℹ️ Sin datos globales en servidor, usando valores predeterminados");
            }
            
            // Aplicar configuraciones de módulos del servidor
            if (serverData.moduleSettings) {
              const enhancedModuleSettings: Record<string, ModuleSettings> = {};
              
              // Procesar cada módulo asegurando valores predeterminados
              Object.entries(serverData.moduleSettings).forEach(([moduleId, serverModuleSettings]) => {
                enhancedModuleSettings[moduleId] = {
                  ...defaultModuleSettings,
                  ...serverModuleSettings as ModuleSettings
                };
              });
              
              setModuleSettings(enhancedModuleSettings);
              console.log("✅ Configuraciones de módulos cargadas desde servidor");
            } else {
              // Si no hay datos en el servidor, usar objeto vacío
              setModuleSettings({});
              console.log("ℹ️ Sin datos de módulos en servidor");
            }
            
            // Aplicar lista de favoritos del servidor
            if (serverData.favoriteModules) {
              setFavoriteModules(serverData.favoriteModules);
              console.log("✅ Lista de favoritos cargada desde servidor");
            } else {
              // Si no hay favoritos en el servidor, usar array vacío
              setFavoriteModules([]);
              console.log("ℹ️ Sin favoritos en servidor");
            }
            
            // Marcar como completada la carga inicial
            initialLoadComplete.current = true;
            
          } else {
            console.warn(`⚠️ Error del servidor ${res.status}. Usando valores predeterminados.`);
            // En caso de error, cargar valores predeterminados
            setGlobalSettings(defaultGlobalSettings);
            setModuleSettings({});
            setFavoriteModules([]);
          }
        } catch (serverError) {
          console.error("⚠️ Error al comunicarse con el servidor:", serverError);
          console.log("⚠️ Usuario autenticado pero sin acceso al servidor, usando valores predeterminados");
          
          // En caso de error de conexión, cargar valores predeterminados
          setGlobalSettings(defaultGlobalSettings);
          setModuleSettings({});
          setFavoriteModules([]);
        }
        
      } else {
        // USUARIO NO AUTENTICADO - Usar solo datos locales
        console.log(`🔓 Usuario no autenticado: usando datos locales`);
        
        // Cargar desde localStorage
        const localGlobalSettings = getTimestampedData<GlobalSettings>(
          globalSettingsKey, defaultGlobalSettings
        );
        
        const localModuleSettings = getTimestampedData<Record<string, ModuleSettings>>(
          moduleSettingsKey, {}
        );
        
        const localFavorites = getTimestampedData<string[]>(
          favoritesKey, []
        );
        
        // Aplicar configuraciones globales locales
        setGlobalSettings({...defaultGlobalSettings, ...localGlobalSettings.data});
        console.log("✅ Configuraciones globales cargadas desde localStorage");
        
        // Aplicar configuraciones de módulos locales
        const enhancedModuleSettings: Record<string, ModuleSettings> = {};
        
        Object.entries(localModuleSettings.data).forEach(([moduleId, settings]) => {
          enhancedModuleSettings[moduleId] = {
            ...defaultModuleSettings,
            ...(settings as ModuleSettings)
          };
        });
        
        setModuleSettings(enhancedModuleSettings);
        console.log("✅ Configuraciones de módulos cargadas desde localStorage");
        
        // Aplicar favoritos locales
        setFavoriteModules(localFavorites.data);
        console.log("✅ Lista de favoritos cargada desde localStorage");
        
        // Marcar como completada la carga inicial
        initialLoadComplete.current = true;
      }
      
    } catch (error) {
      console.error("❌ Error general al cargar configuraciones:", error);
      // En caso de error catastrófico, usar valores predeterminados
      setGlobalSettings(defaultGlobalSettings);
      setModuleSettings({});
      setFavoriteModules([]);
    }
  };

  // Load settings initially and when auth state or active profile changes
  useEffect(() => {
    fetchSettings();
  }, [isAuthenticated, activeProfile]);

  // Al cambiar las configuraciones, guardarlas de forma diferente según si está autenticado o no
  useEffect(() => {
    if (initialLoadComplete.current) {
      // Si NO está autenticado -> guardar en localStorage
      // Si está autenticado -> NO guardar en localStorage (el servidor es la única fuente de verdad)
      if (!isAuthenticated) {
        // Usuario NO autenticado: guardamos en localStorage
        const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
        saveTimestampedData(globalSettingsKey, globalSettings);
        saveTimestampedData(moduleSettingsKey, moduleSettings);
        saveTimestampedData(favoritesKey, favoriteModules);
        console.log("🔄 Usuario no autenticado: cambios guardados en localStorage");
      } else {
        console.log("🔐 Usuario autenticado: cambios solo se guardan en servidor, no en localStorage");
      }
    }
  }, [globalSettings, moduleSettings, favoriteModules, activeProfile, isAuthenticated]);
  
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
    
    // ESTRATEGIA SIMPLIFICADA:
    // - Usuario autenticado: Solo guardar en servidor
    // - Usuario no autenticado: Solo guardar en localStorage
    
    // Si no está autenticado, terminar aquí (localStorage se maneja en useEffect)
    if (!isAuthenticated) {
      console.log(`🔓 Usuario no autenticado: configuraciones solo se guardan en localStorage`);
      return;
    }
    
    // A partir de aquí solo ejecuta si el usuario está autenticado
    console.log(`🔐 Usuario autenticado: enviando configuración global al servidor`);
    
    // Determinar la URL del endpoint correcto
    const endpoint = activeProfile
      ? `/api/child-profiles/${activeProfile.id}/settings/global`
      : "/api/settings/global";
    
    // Crear una clave única para esta petición
    const requestKey = `${endpoint}-global`;
    
    // Evitar peticiones duplicadas
    if (pendingRequests.current[requestKey]) {
      console.log(`⏱️ Petición para global ya en curso, evitando duplicado`);
      return;
    }
    
    // Marcar esta petición como en curso
    pendingRequests.current[requestKey] = true;
    
    try {
      // Pequeña pausa para permitir que cambios rápidos se agrupen
      await new Promise(resolve => setTimeout(resolve, 250));
      
      console.log(`📤 Enviando configuración global al servidor (${endpoint})`);
      
      // Obtener la configuración más actualizada
      const currentSettings = { ...updatedSettings };
      
      // Hacer la petición al servidor
      const response = await apiRequest("PUT", endpoint, currentSettings);
      
      if (response.ok) {
        console.log(`✅ Configuración global guardada exitosamente en el servidor`);
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error al guardar configuración global:`, error);
      
      // Verificar si el error es por falta de autenticación (401)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
        setIsAuthenticated(false);
        // No mostrar error al usuario ya que probablemente acaba de cerrar sesión
      } else {
        // Solo mostrar el toast para otros tipos de errores
        toast({
          title: "Error de conexión",
          description: "No se pudieron guardar los cambios en el servidor",
          variant: "destructive",
        });
      }
    } finally {
      // Liberar la petición una vez completada
      pendingRequests.current[requestKey] = false;
    }
  };

  const updateModuleSettings = async (moduleId: string, settings: Partial<ModuleSettings>) => {
    // Asegurarse de que siempre tenemos todos los valores por defecto
    const currentSettings = moduleSettings[moduleId] || { ...defaultModuleSettings };
    const updatedSettings = { ...currentSettings, ...settings };
    
    console.log(`🔄 Actualizando configuración para ${moduleId}:`, updatedSettings);
    
    // Actualizar estado local inmediatamente
    setModuleSettings(prev => {
      const newSettings = {
        ...prev,
        [moduleId]: updatedSettings,
      };
      return newSettings;
    });
    
    // ESTRATEGIA SIMPLIFICADA:
    // - Usuario autenticado: Solo guardar en servidor
    // - Usuario no autenticado: Solo guardar en localStorage
    
    // Si no está autenticado, terminar aquí (localStorage se maneja en useEffect)
    if (!isAuthenticated) {
      console.log(`🔓 Usuario no autenticado: configuración de ${moduleId} guardada solo en localStorage`);
      return;
    }
    
    // A partir de aquí solo ejecuta si el usuario está autenticado
    console.log(`🔐 Usuario autenticado: enviando configuración de ${moduleId} al servidor`);
    
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
      // Pequeña pausa para permitir que cambios rápidos se agrupen
      await new Promise(resolve => setTimeout(resolve, 250));
      
      console.log(`📤 Enviando configuración al servidor (${endpoint})`);
      
      // Hacer la petición al servidor con la configuración actualizada
      const response = await apiRequest("PUT", endpoint, updatedSettings);
      
      if (response.ok) {
        console.log(`✅ Configuración guardada exitosamente en el servidor para ${moduleId}`);
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error al guardar configuración de ${moduleId} en servidor:`, error);
      
      // Verificar si el error es por falta de autenticación (401)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
        setIsAuthenticated(false);
        // No mostrar error al usuario ya que probablemente acaba de cerrar sesión
      } else {
        // Solo mostrar el toast para otros tipos de errores
        toast({
          title: "Error de conexión",
          description: "No se pudieron guardar los cambios en el servidor",
          variant: "destructive",
        });
      }
    } finally {
      // Liberar la petición una vez completada
      pendingRequests.current[requestKey] = false;
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
    console.log(`🧹 Restableciendo configuración para ${moduleId} a valores predeterminados`);
    
    // Actualizar estado local con valores predeterminados (no eliminar)
    setModuleSettings(prev => {
      const newSettings = { ...prev };
      // En lugar de eliminar, asignar valores predeterminados
      newSettings[moduleId] = { ...defaultModuleSettings };
      
      return newSettings;
    });
    
    // ESTRATEGIA SIMPLIFICADA:
    // - Usuario autenticado: Solo guardar en servidor
    // - Usuario no autenticado: Solo guardar en localStorage (a través del useEffect)
    
    // Si no está autenticado, terminar aquí (localStorage se maneja en useEffect)
    if (!isAuthenticated) {
      console.log(`🔓 Usuario no autenticado: restablecimiento guardado solo en localStorage`);
      
      toast({
        title: "Configuración restablecida",
        description: "Se han aplicado los valores predeterminados",
      });
      return;
    }
    
    // A partir de aquí solo ejecuta si está autenticado
    console.log(`🔐 Usuario autenticado: enviando restablecimiento de ${moduleId} al servidor`);
    
    try {
      const endpoint = activeProfile
        ? `/api/child-profiles/${activeProfile.id}/settings/module/${moduleId}`
        : `/api/settings/module/${moduleId}`;
      
      // PUT para actualizar con valores predeterminados
      const response = await apiRequest("PUT", endpoint, defaultModuleSettings);
      
      if (response.ok) {
        console.log(`✅ Valores predeterminados guardados exitosamente en servidor para ${moduleId}`);
        
        toast({
          title: "Configuración restablecida",
          description: "Se han aplicado los valores predeterminados",
        });
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error al restablecer valores en servidor:`, error);
      
      // Verificar si el error es por falta de autenticación (401)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
        setIsAuthenticated(false);
        
        // Mostrar notificación de éxito local aunque el servidor falló
        toast({
          title: "Configuración restablecida",
          description: "Se han aplicado los valores predeterminados localmente",
        });
      } else {
        // Solo mostrar el toast para otros tipos de errores
        toast({
          title: "Error de conexión",
          description: "No se pudieron guardar los cambios en el servidor",
          variant: "destructive",
        });
      }
    }
  };

  const resetAllSettings = async () => {
    console.log(`🧹 Restableciendo todas las configuraciones a valores predeterminados`);
    
    // Reset local state
    setGlobalSettings(defaultGlobalSettings);
    setModuleSettings({});
    setFavoriteModules([]);
    
    // Reset localStorage con timestamps
    try {
      const { globalSettingsKey, moduleSettingsKey, favoritesKey } = getStorageKeys();
      
      // Guardar valores predeterminados con nuevos timestamps
      saveTimestampedData(globalSettingsKey, defaultGlobalSettings);
      saveTimestampedData(moduleSettingsKey, {});
      saveTimestampedData(favoritesKey, []);
      
      console.log(`✅ Todas las configuraciones restablecidas a valores predeterminados en localStorage`);
    } catch (e) {
      console.error(`❌ Error al restablecer configuraciones en localStorage:`, e);
    }
    
    // Reset en el servidor si está autenticado
    if (isAuthenticated) {
      try {
        console.log(`📤 Enviando solicitud de restablecimiento de todas las configuraciones al servidor`);
        
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
    
    // ESTRATEGIA SIMPLIFICADA:
    // - Usuario autenticado: Solo guardar en servidor
    // - Usuario no autenticado: Solo guardar en localStorage (a través del useEffect)
    
    // Si no está autenticado, terminar aquí (localStorage se maneja en useEffect)
    if (!isAuthenticated) {
      console.log(`🔓 Usuario no autenticado: favoritos guardados solo en localStorage`);
      return;
    }
    
    // A partir de aquí solo ejecuta si está autenticado
    console.log(`🔐 Usuario autenticado: guardando favoritos en servidor`);
    
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
      // Pequeña pausa para permitir que cambios rápidos se agrupen
      await new Promise(resolve => setTimeout(resolve, 250));
      
      console.log(`📤 Enviando favoritos al servidor (${endpoint})`);
      
      // Hacer la petición al servidor
      const response = await apiRequest("PUT", endpoint, { favorites: updatedFavorites });
      
      if (response.ok) {
        console.log(`✅ Favoritos guardados exitosamente en el servidor`);
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error al guardar favoritos en servidor:`, error);
      
      // Verificar si el error es por falta de autenticación (401)
      if (error instanceof Error && error.message.includes('401')) {
        console.log("⚠️ Error 401: Usuario ya no está autenticado, actualizando estado");
        setIsAuthenticated(false);
        // No mostrar error al usuario ya que probablemente acaba de cerrar sesión
      } else {
        // Solo mostrar el toast para otros tipos de errores
        toast({
          title: "Error de conexión",
          description: "No se pudieron guardar los cambios en el servidor",
          variant: "destructive",
        });
      }
    } finally {
      // Liberar la petición una vez completada
      pendingRequests.current[requestKey] = false;
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