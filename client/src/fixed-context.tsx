import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";

// Definiciones de tipos para el contexto de progreso
export interface UserAnswer {
  problem: Problem;
  userAnswer: string;
  isCorrect: boolean;
  attemptCount?: number;
  timeSpent?: number;
  status?: 'correct' | 'incorrect' | 'skipped' | 'timeout';
}

export interface Problem {
  id?: string;
  operation?: string;
  operands?: number[];
  correctAnswer?: string;
  difficulty?: string;
  answerMaxDigits?: number;
  answerDecimalPosition?: number;
}

export interface ExerciseResult {
  id: string;
  operationId: string;
  moduleId?: string;
  difficulty: string;
  score: number;
  totalProblems: number;
  correctProblems: number;
  timeSpent?: number;
  date: string;
  extra_data?: any;
}

export interface ModuleProgress {
  totalCompleted: number;
  totalCorrect: number;
  averageScore: number;
  highestScore: number;
  streakDays: number;
  lastPlayed: string;
}

interface ProgressContextType {
  exerciseHistory: ExerciseResult[];
  moduleProgress: Record<string, ModuleProgress>;
  saveExerciseResult: (result: ExerciseResult) => Promise<void>;
  getModuleProgress: (operationId: string) => ModuleProgress | undefined;
  clearProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  isLoading: boolean;
}

// Servidor de almacenamiento
// Esta es una interfaz uniforme que puede usar localStorage y/o un servidor remoto
const serverStorage = {
  isAvailable: true,

  saveExerciseResult: async (result: ExerciseResult): Promise<void> => {
    try {
      // Primero intentamos guardar en el servidor
      const response = await fetch("/api/progress/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // También guardamos en localStorage como respaldo
      const localHistory = JSON.parse(localStorage.getItem("exercise_history") || "[]");
      localHistory.push(result);
      localStorage.setItem("exercise_history", JSON.stringify(localHistory));

      console.log("Guardado en servidor y localStorage:", result);
    } catch (error) {
      console.error("Error en servidor. Guardando solo en localStorage:", error);
      
      // Si falla el servidor, guardamos solo en localStorage
      const localHistory = JSON.parse(localStorage.getItem("exercise_history") || "[]");
      localHistory.push(result);
      localStorage.setItem("exercise_history", JSON.stringify(localHistory));
    }
  },

  getExerciseHistory: async (): Promise<ExerciseResult[]> => {
    try {
      // Intentar obtener del servidor
      const response = await fetch("/api/progress/history");
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const serverData = await response.json();
      
      // También obtener del localStorage como respaldo
      const localData = JSON.parse(localStorage.getItem("exercise_history") || "[]");
      
      // Combinar datos (evitando duplicados por ID)
      const combined = [...serverData];
      const serverIds = new Set(serverData.map((item: ExerciseResult) => item.id));
      
      for (const localItem of localData) {
        if (!serverIds.has(localItem.id)) {
          combined.push(localItem);
        }
      }
      
      return combined;
    } catch (error) {
      console.error("Error al obtener del servidor. Usando localStorage:", error);
      return JSON.parse(localStorage.getItem("exercise_history") || "[]");
    }
  },

  clearProgress: async (): Promise<void> => {
    try {
      // Limpiar en el servidor
      const response = await fetch("/api/progress/clear", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Limpiar en localStorage
      localStorage.removeItem("exercise_history");
      localStorage.removeItem("module_progress");
      
      // Limpiar todas las recompensas y datos relacionados
      localStorage.removeItem("rewards_collection");
      localStorage.removeItem("mathwaok_rewards");
      localStorage.removeItem("completed_achievements");

      console.log("Progreso eliminado del servidor y localStorage");
    } catch (error) {
      console.error("Error al limpiar en servidor. Limpiando solo localStorage:", error);
      
      // Si falla el servidor, limpiar solo localStorage
      localStorage.removeItem("exercise_history");
      localStorage.removeItem("module_progress");
      localStorage.removeItem("rewards_collection");
      localStorage.removeItem("mathwaok_rewards");
      localStorage.removeItem("completed_achievements");
    }
  }
};

// Crear contexto
const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Proveedor de contexto
export const ProgressProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { isSignedIn, user } = useUser();
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseResult[]>([]);
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = isSignedIn && !!user;
  
  // Función para calcular el progreso de los módulos a partir del historial
  const calculateModuleProgress = useCallback((history: ExerciseResult[]): Record<string, ModuleProgress> => {
    const progress: Record<string, ModuleProgress> = {};
    
    history.forEach(result => {
      const { operationId } = result;
      
      if (!progress[operationId]) {
        // Inicializar módulo si no existe
        progress[operationId] = {
          totalCompleted: 0,
          totalCorrect: 0,
          averageScore: 0,
          highestScore: 0,
          streakDays: 0,
          lastPlayed: result.date,
        };
      }
      
      // Actualizar estadísticas
      const moduleStats = progress[operationId];
      moduleStats.totalCompleted += 1;
      moduleStats.totalCorrect += result.correctProblems || 0;
      
      // Calcular puntaje promedio
      const scorePercent = result.score / result.totalProblems;
      const currentTotal = moduleStats.averageScore * (moduleStats.totalCompleted - 1);
      moduleStats.averageScore = (currentTotal + scorePercent) / moduleStats.totalCompleted;
      
      // Actualizar puntaje más alto
      if (scorePercent > moduleStats.highestScore) {
        moduleStats.highestScore = scorePercent;
      }
      
      // Actualizar última vez jugado
      const resultDate = new Date(result.date);
      const lastPlayedDate = new Date(moduleStats.lastPlayed);
      if (resultDate > lastPlayedDate) {
        moduleStats.lastPlayed = result.date;
      }
    });
    
    return progress;
  }, []);

  // Cargar datos al iniciar
  const refreshProgress = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Cargar historial
      const history = await serverStorage.getExerciseHistory();
      setExerciseHistory(history);
      
      // Calcular progreso de módulos
      const progress = calculateModuleProgress(history);
      setModuleProgress(progress);
    } catch (error) {
      console.error("Error al cargar datos de progreso:", error);
      toast({
        title: "Error al cargar datos",
        description: "No se pudo cargar tu historial de ejercicios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, calculateModuleProgress]);

  // Cargar datos al iniciar o cuando cambia el usuario
  useEffect(() => {
    refreshProgress();
  }, [refreshProgress, isAuthenticated]);

  // Guardar resultado de ejercicio
  const saveExerciseResult = async (result: ExerciseResult) => {
    if (!isAuthenticated) {
      toast({
        title: "No se pudo guardar el progreso",
        description: "Debes iniciar sesión para guardar tu progreso",
        variant: "destructive",
      });
      return;
    }

    try {
      // MEJORA: Asegurar que los problemas se guarden en un formato consistente
      if (!result.extra_data) {
        result.extra_data = {};
      }
      
      // Asegurar que hay una versión para mejor compatibilidad
      result.extra_data.version = "2.0";
      result.extra_data.timestamp = Date.now();
      
      // Crear respaldo redundante de los problemas para evitar pérdida
      // Esto permite recuperar los problemas correctamente en la página de historial
      try {
        const backupKey = `backup_problemas_${Date.now()}`;
        if (result.extra_data.problems) {
          localStorage.setItem(backupKey, JSON.stringify(result.extra_data.problems));
        } else if (result.extra_data.mathProblems) {
          localStorage.setItem(backupKey, JSON.stringify(result.extra_data.mathProblems));
        } else if (result.extra_data.exactProblems) {
          localStorage.setItem(backupKey, JSON.stringify(result.extra_data.exactProblems));
        } else if (result.extra_data.problemDetails) {
          localStorage.setItem(backupKey, JSON.stringify(result.extra_data.problemDetails));
        }
      } catch (error) {
        console.error("Error al crear respaldo de problemas:", error);
      }
      
      // Guardar resultado en servidor/localStorage
      await serverStorage.saveExerciseResult(result);
      
      // Actualizar estado local
      setExerciseHistory(prev => [...prev, result]);
      
      // Actualizar progreso del módulo
      setModuleProgress(prev => {
        const newProgress = { ...prev };
        const moduleId = result.operationId;
        
        if (!newProgress[moduleId]) {
          newProgress[moduleId] = {
            totalCompleted: 0,
            totalCorrect: 0,
            averageScore: 0,
            highestScore: 0,
            streakDays: 0,
            lastPlayed: result.date,
          };
        }
        
        // Actualizar estadísticas
        const moduleStats = newProgress[moduleId];
        moduleStats.totalCompleted += 1;
        moduleStats.totalCorrect += result.correctProblems || 0;
        
        // Calcular puntaje promedio
        const scorePercent = result.score / result.totalProblems;
        const currentTotal = moduleStats.averageScore * (moduleStats.totalCompleted - 1);
        moduleStats.averageScore = (currentTotal + scorePercent) / moduleStats.totalCompleted;
        
        // Actualizar puntaje más alto
        if (scorePercent > moduleStats.highestScore) {
          moduleStats.highestScore = scorePercent;
        }
        
        // Actualizar última vez jugado
        moduleStats.lastPlayed = result.date;
        
        return newProgress;
      });
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
      
      // PASO 1: BORRADO RADICAL DE LOCALSTORAGE - Borrado completo usando removeItem
      console.log("🧨 BORRADO RADICAL MEJORADO - Fase 1: Limpieza completa del localStorage");
      
      // Lista exhaustiva de palabras clave para detectar datos relacionados
      const palabrasClave = [
        // Progreso y ejercicios
        'progress', 'progreso', 'exercise', 'ejercicio', 'history', 'historial',
        'completed', 'completado', 'score', 'puntaje', 'result', 'resultado', 
        'data', 'datos', 'stats', 'estadisticas', 'timer', 'tiempo',
        
        // Recompensas
        'rewards', 'recompensas', 'trophy', 'trofeo', 'achievement', 'logro',
        'album', 'álbum', 'collection', 'colección', 'unlock', 'desbloqueado',
        'badge', 'medalla', 'prize', 'premio',
        
        // Respaldos y backups
        'backup', 'respaldo', 'saved', 'guardado', 'math', 'matemáticas',
        'operation', 'operación', 'user', 'usuario', 'profile', 'perfil',
        
        // Formato específico usado en la app
        'mathApp_', 'math_', 'mathwaok_', 'waok_', 'problemDetails'
      ];
      
      console.log("🔍 Buscando todas las claves en localStorage para eliminar...");
      
      // PASO 1: CREAR COPIA DE TODAS LAS CLAVES (para evitar problemas de modificación durante la iteración)
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) allKeys.push(key);
      }
      
      console.log(`📋 Total de ${allKeys.length} claves encontradas en localStorage`);
      
      // PASO 2: PRIMERA PASADA - Borrar por nombre de clave
      let totalBorradas = 0;
      
      allKeys.forEach(key => {
        // Verificar si la clave contiene alguna palabra clave
        const matchesKeyword = palabrasClave.some(keyword => 
          key.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (matchesKeyword) {
          localStorage.removeItem(key);
          totalBorradas++;
          console.log(`🗑️ Eliminada clave: ${key}`);
        }
      });
      
      // PASO 3: SEGUNDA PASADA - Revisar contenido de las claves restantes
      const remainingKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) remainingKeys.push(key);
      }
      
      // Verificar contenido de claves restantes
      remainingKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (!value) return;
          
          // Verificar si el contenido contiene alguna palabra clave
          const matchesContent = palabrasClave.some(keyword => 
            value.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (matchesContent) {
            localStorage.removeItem(key);
            totalBorradas++;
            console.log(`🗑️ Eliminada clave por contenido: ${key}`);
          }
        } catch (error) {
          console.error(`Error al revisar contenido de clave ${key}:`, error);
        }
      });
      
      // PASO 4: BORRADO EXPLÍCITO DE CLAVES CRÍTICAS
      // Lista de claves críticas que deben ser eliminadas sin importar si ya fueron borradas
      const criticalKeys = [
        'rewards_collection',
        'rewards_inventory',
        'mathwaok_rewards',
        'mathApp_rewards',
        'user_rewards',
        'rewardsCollection',
        'completed_achievements',
        'userRewards',
        'rewardsProgress',
        'rewardsData',
        'rewardsState',
        'achievementsData',
        'achievementsProgress',
        'rewards-collection',
        'rewards-state',
        'mathApp_storage',
        'mathwaok_storage',
        'exercise_history',
        'exerciseProgress',
        'mathAppStorage'
      ];
      
      criticalKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Eliminación explícita de clave crítica: ${key}`);
      });
      
      console.log(`🧹 Total de ${totalBorradas} claves borradas por detección automática`);
      console.log(`🧹 Además, ${criticalKeys.length} claves críticas fueron explícitamente eliminadas`);
      
      // PASO 5: ACTUALIZAR DATOS DEL SERVIDOR SI ESTÁ DISPONIBLE
      if (serverStorage.isAvailable) {
        console.log("🌐 Limpiando datos en el servidor...");
        await serverStorage.clearProgress();
        console.log("✅ Datos del servidor limpiados correctamente");
      }
      
      // PASO 6: RECARGAR DATOS LIMPIOS
      console.log("🔄 Recargando datos después de la limpieza...");
      await refreshProgress();
      
      toast({
        title: "Progreso borrado correctamente",
        description: "Se ha eliminado todo el historial de ejercicios y recompensas",
      });
      
      console.log("✅ Proceso de limpieza completado con éxito");
    } catch (error) {
      console.error("❌ Error durante el proceso de limpieza:", error);
      toast({
        title: "Error al borrar datos",
        description: "No se pudo borrar completamente el progreso. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const contextValue: ProgressContextType = {
    exerciseHistory,
    moduleProgress,
    saveExerciseResult,
    getModuleProgress,
    clearProgress,
    refreshProgress,
    isLoading,
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

// Hook para usar el contexto
export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress debe usarse dentro de un ProgressProvider");
  }
  return context;
};