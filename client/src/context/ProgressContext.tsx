import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ExerciseResult {
  id?: number;            // ID del registro en la base de datos
  operationId: string;
  date: string;
  score: number;
  totalProblems: number;
  timeSpent: number; // in seconds
  difficulty: string;
  createdAt?: string;     // Fecha de creación del registro
  
  // Additional field for storing screenshot-like data
  extra_data?: {
    screenshot?: any;
    [key: string]: any;
  };
  
  // Campos adicionales para estadísticas detalladas
  accuracy?: number;
  avgTimePerProblem?: number;
  avgAttempts?: number;
  revealedAnswers?: number;
  problemDetails?: Array<{
    problemId?: string | number;
    problem?: any;
    isCorrect: boolean;
    userAnswer?: any;
    correctAnswer?: any;
    attempts?: number;
    timeSpent?: number;
    level?: string;
  }>;
}

export interface ModuleProgress {
  operationId: string;
  totalCompleted: number;
  bestScore: number;
  averageScore: number;
  averageTime: number;
  lastAttempt: string;
}

interface ProgressContextType {
  exerciseHistory: ExerciseResult[];
  moduleProgress: Record<string, ModuleProgress>;
  isLoading: boolean;
  saveExerciseResult: (result: ExerciseResult) => Promise<void>;
  getModuleProgress: (operationId: string) => ModuleProgress | undefined;
  clearProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseResult[]>([]);
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
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
    
    // Verificación periódica de autenticación cada 30 segundos
    const authCheckInterval = setInterval(checkAuth, 30000);
    
    return () => {
      clearInterval(authCheckInterval);
    };
  }, []);
  
  // Escuchar eventos de cierre de sesión desde AuthContext
  useEffect(() => {
    const handleUserLogout = () => {
      console.log("🔄 Evento de cierre de sesión recibido en ProgressContext");
      setIsAuthenticated(false);
      
      // Limpiar datos de progreso al cerrar sesión
      setExerciseHistory([]);
      setModuleProgress({});
    };
    
    window.addEventListener("user-logout", handleUserLogout);
    
    // Limpieza al desmontar
    return () => {
      window.removeEventListener("user-logout", handleUserLogout);
    };
  }, []);

  const fetchProgress = async () => {
    if (!isAuthenticated) {
      setExerciseHistory([]);
      setModuleProgress({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Primero, verificamos si hay un perfil de niño activo
      const activeProfileRes = await fetch("/api/child-profiles/active", {
        credentials: "include"
      });
      
      let progressData;
      
      if (activeProfileRes.ok) {
        const activeProfile = await activeProfileRes.json();
        
        if (activeProfile && activeProfile.id) {
          console.log("Cargando progreso para perfil activo:", activeProfile.name, "ID:", activeProfile.id);
          
          // Obtenemos el progreso específico del perfil activo
          const profileProgressRes = await fetch(`/api/child-profiles/${activeProfile.id}/progress`, {
            credentials: "include",
            cache: "no-store", // Evitar caché
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
          });
          
          if (profileProgressRes.ok) {
            const profileData = await profileProgressRes.json();
            
            // Verificar el formato de los datos
            if (Array.isArray(profileData)) {
              // Si es un array, es el historial de ejercicios pero falta moduleProgress
              console.log("Datos de perfil recibidos como array, procesando...");
              
              // Construir moduleProgress desde los datos del historial
              const moduleProgress: Record<string, any> = {};
              
              profileData.forEach(entry => {
                const opId = entry.operationId;
                if (!moduleProgress[opId]) {
                  moduleProgress[opId] = {
                    operationId: opId,
                    totalCompleted: 0,
                    bestScore: 0,
                    averageScore: 0,
                    totalScore: 0,
                    averageTime: 0,
                    totalTime: 0,
                    lastAttempt: null
                  };
                }
                
                // Actualizar métricas
                moduleProgress[opId].totalCompleted += 1;
                
                // Calcular el puntaje como porcentaje (0-1)
                const scorePercentage = entry.totalProblems > 0 ? entry.score / entry.totalProblems : 0;
                
                // Usar porcentaje en vez del puntaje bruto
                moduleProgress[opId].bestScore = Math.max(moduleProgress[opId].bestScore, scorePercentage);
                moduleProgress[opId].totalScore += scorePercentage;
                moduleProgress[opId].totalTime += entry.timeSpent;
                
                // Actualizar última fecha de intento
                const entryDate = new Date(entry.createdAt);
                const lastDate = moduleProgress[opId].lastAttempt ? new Date(moduleProgress[opId].lastAttempt) : null;
                
                if (!lastDate || entryDate > lastDate) {
                  moduleProgress[opId].lastAttempt = entry.createdAt;
                }
              });
              
              // Calcular promedios
              Object.keys(moduleProgress).forEach(opId => {
                const module = moduleProgress[opId];
                if (module.totalCompleted > 0) {
                  module.averageScore = module.totalScore / module.totalCompleted;
                  module.averageTime = module.totalTime / module.totalCompleted;
                }
              });
              
              // Construir el objeto en el formato esperado
              progressData = {
                exerciseHistory: profileData,
                moduleProgress
              };
              
              console.log("Datos procesados:", progressData.exerciseHistory.length, "ejercicios,", 
                Object.keys(progressData.moduleProgress).length, "módulos");
            } else {
              // Ya tiene el formato esperado
              progressData = profileData;
            }
          } else {
            console.error("Error al cargar progreso del perfil de niño");
          }
        }
      }
      
      // Si no hay perfil activo o hubo error, cargar progreso del usuario principal
      if (!progressData) {
        const res = await fetch("/api/progress", {
          credentials: "include",
          cache: "no-store", // Evitar caché
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        
        if (res.ok) {
          progressData = await res.json();
        } else {
          throw new Error("Failed to fetch progress data");
        }
      }
      
      if (progressData) {
        setExerciseHistory(progressData.exerciseHistory || []);
        setModuleProgress(progressData.moduleProgress || {});
        console.log("Datos de progreso cargados:", 
          progressData.exerciseHistory?.length, "ejercicios,", 
          Object.keys(progressData.moduleProgress || {}).length, "módulos");
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
      // Initialize with empty data
      setExerciseHistory([]);
      setModuleProgress({});
    } finally {
      setIsLoading(false);
    }
  };

  // Load progress data initially and when auth state changes
  useEffect(() => {
    fetchProgress();
  }, [isAuthenticated]);

  const saveExerciseResult = async (result: ExerciseResult) => {
    if (!isAuthenticated) {
      toast({
        title: "Progress Not Saved",
        description: "Log in to save your progress",
        variant: "destructive",
      });
      return;
    }

    try {
      // MEJORA V3: Sistema robusto para garantizar que los problemas se guarden correctamente
      if (!result.extra_data) {
        result.extra_data = {};
      }
      
      // Asegurar que hay una versión para mejor compatibilidad
      result.extra_data.version = "3.0";
      result.extra_data.timestamp = Date.now();
      
      // NUEVA SOLUCIÓN: Unificar formato de almacenamiento para evitar inconsistencias
      // Identificar dónde están los problemas en la estructura actual
      let problemasEncontrados: any[] = [];
      
      // Buscar en todos los posibles lugares donde pueden estar los problemas
      if (result.problemDetails && Array.isArray(result.problemDetails)) {
        problemasEncontrados = result.problemDetails;
      } 
      else if (result.extra_data.problems && Array.isArray(result.extra_data.problems)) {
        problemasEncontrados = result.extra_data.problems;
      }
      else if (result.extra_data.exactProblems && Array.isArray(result.extra_data.exactProblems)) {
        problemasEncontrados = result.extra_data.exactProblems;
      }
      else if (result.extra_data.capturedProblems && Array.isArray(result.extra_data.capturedProblems)) {
        problemasEncontrados = result.extra_data.capturedProblems;
      }
      else if (result.extra_data.mathProblems && Array.isArray(result.extra_data.mathProblems)) {
        problemasEncontrados = result.extra_data.mathProblems;
      }
      else if (result.extra_data.problemDetails && Array.isArray(result.extra_data.problemDetails)) {
        problemasEncontrados = result.extra_data.problemDetails;
      }
      
      // Si encontramos problemas, los guardamos en TODOS los campos posibles para asegurar compatibilidad
      if (problemasEncontrados.length > 0) {
        // Guardar en múltiples ubicaciones para máxima compatibilidad
        result.extra_data.problems = [...problemasEncontrados];
        result.extra_data.exactProblems = [...problemasEncontrados];
        result.extra_data.capturedProblems = [...problemasEncontrados];
        result.extra_data.mathProblems = [...problemasEncontrados];
        result.extra_data.problemDetails = [...problemasEncontrados];
        result.extra_data.problemas = [...problemasEncontrados];
        
        // Guardar también en la estructura principal para asegurar
        result.problemDetails = [...problemasEncontrados];
      }
      
      // Crear respaldo redundante de los problemas para evitar pérdida
      // Esto permite recuperar los problemas correctamente en la página de historial
      try {
        const backupKey = `backup_problemas_${Date.now()}`;
        if (result.extra_data.problems) {
          localStorage.setItem(backupKey, JSON.stringify(result.extra_data.problems));
        } else if (result.extra_data.mathProblems) {
          localStorage.setItem(backupKey, JSON.stringify(result.extra_data.mathProblems));
        } else if (result.extra_data.capturedProblems) {
          localStorage.setItem(backupKey, JSON.stringify(result.extra_data.capturedProblems));
        }
      } catch (err) {
        console.error("Error creando respaldo de problemas:", err);
      }
      
      console.log("Enviando progreso al servidor:", result);
      
      // Primero, verificamos si hay un perfil de niño activo
      const activeProfileRes = await fetch("/api/child-profiles/active", {
        credentials: "include"
      });
      
      let res;
      
      if (activeProfileRes.ok) {
        const activeProfile = await activeProfileRes.json();
        console.log("Perfil activo detectado:", activeProfile.name, "ID:", activeProfile.id);
        
        // Si hay un perfil activo, enviamos el progreso a ese perfil
        res = await apiRequest("POST", `/api/child-profiles/${activeProfile.id}/progress`, result);
      } else {
        // Si no hay perfil activo o hubo error, guardamos el progreso en la cuenta principal
        console.log("No se detectó perfil activo, guardando en cuenta principal");
        res = await apiRequest("POST", "/api/progress", result);
      }
      
      if (res.ok) {
        const data = await res.json();
        
        // Actualizamos los datos en el estado
        // Necesitamos volver a cargar los datos para ver el ejercicio actualizado
        fetchProgress();
        
        // Verificar si el puntaje parece correcto
        console.log(`📊 Verificando puntaje guardado:
        - Score enviado al servidor: ${result.score}
        - Total problemas: ${result.totalProblems}`);
        
        // Forzar el puntaje a un valor correcto si parece incorrecto
        // Usando una comparación proporcional con la precisión
        const puntajeEsperado = Math.round((result.accuracy || 0) * result.totalProblems / 100);
        const puntajeFinal = puntajeEsperado > result.score ? puntajeEsperado : result.score;
        
        toast({
          title: "Progress Saved",
          description: `Score: ${puntajeFinal}/${result.totalProblems}`,
        });
      } else {
        // Capturar y mostrar error específico
        const errorData = await res.json();
        console.error("Error del servidor al guardar progreso:", errorData);
        
        toast({
          title: "Failed to Save Progress",
          description: errorData.error || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Save Progress",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error("Error saving progress:", error);
    }
  };

  const getModuleProgress = (operationId: string): ModuleProgress | undefined => {
    return moduleProgress[operationId];
  };

  const clearProgress = async () => {
    if (!isAuthenticated) return;
    
    try {
      setExerciseHistory([]);
      setModuleProgress({});
      
      // PASO 1: BORRADO EXTREMO DE LOCALSTORAGE 
      console.log("🧨 BORRADO RADICAL MEJORADO V2 - Fase 1: Limpieza completa del localStorage");
      
      // Lista ampliada de palabras clave para detectar datos relacionados
      const palabrasClave = [
        // Progreso y ejercicios
        'progress', 'progreso', 'exercise', 'ejercicio', 'history', 'historial',
        'completed', 'completado', 'score', 'puntaje', 'result', 'resultado', 
        'data', 'datos', 'stats', 'estadisticas', 'timer', 'tiempo',
        
        // Recompensas
        'rewards', 'recompensas', 'trophy', 'trofeo', 'achievement', 'logro',
        'album', 'álbum', 'collection', 'colección', 'unlock', 'desbloqueado',
        'badge', 'medalla', 'prize', 'premio', 'rewards-storage',
        
        // Respaldos y backups
        'backup', 'respaldo', 'saved', 'guardado', 'math', 'matemáticas',
        'operation', 'operación', 'user', 'usuario', 'profile', 'perfil',
        
        // Formato específico usado en la app
        'mathApp_', 'math_', 'mathwaok_', 'waok_', 'problemDetails'
      ];
      
      // Enfoque exhaustivo: múltiples pasadas para asegurar borrado total
      let totalBorradas = 0;
      
      // PRIMERA FASE: Borrado por palabras clave en nombre de clave
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Verificar si la clave contiene alguna palabra clave
        const matchesKeyword = palabrasClave.some(keyword => 
          key.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (matchesKeyword) {
          keysToRemove.push(key);
          console.log(`🗑️ [Fase 1] Borrar: ${key}`);
        }
      }
      
      // Eliminar todas las claves identificadas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        totalBorradas++;
      });
      
      console.log(`✅ [Fase 1] Borradas ${keysToRemove.length} claves`);
      
      // NUEVA FASE: Borrado directo del sistema de recompensas de Zustand
      try {
        // Borrar específicamente la clave de almacenamiento de recompensas
        localStorage.removeItem('rewards-storage');
        console.log("✅ [Nueva Fase] Borrado directo de rewards-storage");
        
        // Intentar limpiar la memoria del sistema de recompensas si está disponible
        // Esta parte se ejecutará en el cliente, no en el servidor
        if (typeof window !== 'undefined') {
          // Publicar un evento global para que otros componentes sepan que las recompensas se han reiniciado
          const resetEvent = new CustomEvent('rewards-reset');
          window.dispatchEvent(resetEvent);
          console.log("✅ [Nueva Fase] Evento de reinicio de recompensas emitido");
        }
      } catch (rewardsError) {
        console.error("Error al reiniciar sistema de recompensas:", rewardsError);
      }
      
      // SEGUNDA FASE: Búsqueda en contenido y borrado específico de recompensas
      // Eliminar explícitamente todas las claves conocidas de recompensas
      const keysRewards = [
        // Claves principales conocidas de recompensas
        'rewards-storage', 'user_rewards', 'user_default_rewards', 
        'rewards_collection', 'album-rewards', 'rewards-unlocked',
        'achievements-unlocked', 'trophies-earned', 'badges-collection',
        
        // Claves de configuración de recompensas
        'rewards-settings', 'album-config', 'collection-settings',
        
        // Claves específicas para cada tipo de recompensa
        'addition-rewards', 'subtraction-rewards', 'multiplication-rewards',
        'division-rewards', 'fractions-rewards', 'algebra-rewards',
        
        // Claves de progreso general
        'all-progress', 'full-history', 'completed-exercises',
        'learning-path', 'user-journey',
      ];
      
      // Borrar claves conocidas explícitamente
      keysRewards.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🏆 [Fase 2] Borrada clave específica: ${key}`);
        totalBorradas++;
      });
      
      // TERCERA FASE: Búsqueda en contenido
      // Buscar palabras clave dentro del contenido de localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        try {
          const value = localStorage.getItem(key);
          if (!value) continue;
          
          // Verificar si el contenido incluye palabras relacionadas con recompensas o progreso
          const contentMatches = ['reward', 'recompensa', 'progress', 'problem', 'ejercicio', 'score', 'trophy']
            .some(term => value.toLowerCase().includes(term.toLowerCase()));
            
          if (contentMatches) {
            localStorage.removeItem(key);
            console.log(`🔍 [Fase 3] Borrada por contenido: ${key}`);
            totalBorradas++;
            i--; // Ajustar índice ya que se eliminó un elemento
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      }
      
      console.log(`🏆 Borrada toda la información del Álbum de Recompensas y colecciones`);
      
      // PASO 2: BORRAR DATOS DEL SERVIDOR DE FORMA AGRESIVA
      console.log("🔥 BORRADO RADICAL - Paso 2: Borrado en el servidor");
      
      // Obtener perfil activo para borrado específico
      const activeProfileRes = await fetch("/api/child-profiles/active", {
        credentials: "include",
        cache: "no-store",
        headers: { 'Pragma': 'no-cache' }
      });
      
      // Variable para rastrear si el borrado tuvo éxito
      let serverDeleteSuccess = false;
      
      if (activeProfileRes.ok) {
        const activeProfile = await activeProfileRes.json();
        
        if (activeProfile && activeProfile.id) {
          console.log("🎯 Borrando progreso para el perfil:", activeProfile.name, "ID:", activeProfile.id);
          
          // Múltiples intentos de borrado
          for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`Intento ${attempt} de borrado para perfil ${activeProfile.id}...`);
            
            try {
              // Usar cache: no-store para asegurarnos que no haya caching
              const response = await fetch(`/api/child-profiles/${activeProfile.id}/progress`, {
                method: "DELETE",
                credentials: "include",
                cache: "no-store",
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache'
                }
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log(`✅ Borrado exitoso en intento ${attempt}:`, result);
                serverDeleteSuccess = true;
                break; // Salir del bucle de intentos
              } else {
                console.log(`❌ Falló intento ${attempt}, código:`, response.status);
              }
            } catch (err) {
              console.error(`❌ Error en intento ${attempt}:`, err);
            }
            
            // Pequeña pausa entre intentos
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // Si el borrado para el perfil falló o no hay perfil, intentar borrado general
      if (!serverDeleteSuccess) {
        console.log("🔄 Intentando borrado de progreso de usuario principal");
        try {
          const response = await fetch("/api/progress", {
            method: "DELETE",
            credentials: "include",
            cache: "no-store",
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          
          if (response.ok) {
            console.log("✅ Borrado de progreso de usuario principal exitoso");
            serverDeleteSuccess = true;
          }
        } catch (err) {
          console.error("❌ Error al borrar progreso de usuario principal:", err);
        }
      }
      
      // PASO 3: FORZAR RECARGA COMPLETA DE DATOS
      console.log("🔄 BORRADO RADICAL - Paso 3: Forzar recarga de datos");
      
      // Pequeña pausa para asegurarnos que los cambios en el servidor se propaguen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Forzar recarga de datos desde el servidor con banderas anti-caché
      await fetchProgress();
      
      // Verificación final
      if (exerciseHistory.length === 0 && Object.keys(moduleProgress).length === 0) {
        console.log("✅✅✅ BORRADO COMPLETO EXITOSO - No se encontraron datos después del borrado");
      } else {
        console.log("⚠️ ADVERTENCIA: Aún hay datos después del borrado:", 
          exerciseHistory.length, "ejercicios,", 
          Object.keys(moduleProgress).length, "módulos");
      }
      
      toast({
        title: serverDeleteSuccess ? "Progreso Eliminado" : "Borrado Parcial",
        description: serverDeleteSuccess 
          ? "Todos los datos han sido eliminados completamente del servidor y almacenamiento local" 
          : "Los datos locales fueron borrados pero hubo un problema con el servidor",
        variant: serverDeleteSuccess ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error catastrófico al borrar progreso:", error);
      toast({
        title: "Error al Borrar Progreso",
        description: "Se produjo un error inesperado. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Función para refrescar datos de progreso manualmente
  const refreshProgress = async () => {
    try {
      setIsLoading(true);
      await fetchProgress();
    } catch (error) {
      console.error("Error refreshing progress data:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos de progreso",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProgressContext.Provider
      value={{
        exerciseHistory,
        moduleProgress,
        isLoading,
        saveExerciseResult,
        getModuleProgress,
        clearProgress,
        refreshProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
