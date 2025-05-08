import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ExerciseResult {
  operationId: string;
  date: string;
  score: number;
  totalProblems: number;
  timeSpent: number; // in seconds
  difficulty: string;
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
      const res = await fetch("/api/progress", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setExerciseHistory(data.exerciseHistory || []);
        setModuleProgress(data.moduleProgress || {});
      } else {
        throw new Error("Failed to fetch progress data");
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
      console.log("Enviando progreso al servidor:", result);
      
      // Enviamos directamente el objeto resultado, sin anidarlo dentro de otro objeto
      const res = await apiRequest("POST", "/api/progress", result);
      
      if (res.ok) {
        const data = await res.json();
        setExerciseHistory(data.exerciseHistory);
        setModuleProgress(data.moduleProgress);
        
        toast({
          title: "Progress Saved",
          description: `Score: ${result.score}/${result.totalProblems}`,
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
      await apiRequest("DELETE", "/api/progress", {});
      setExerciseHistory([]);
      setModuleProgress({});
      
      toast({
        title: "Progress Cleared",
        description: "All progress data has been reset",
      });
    } catch (error) {
      toast({
        title: "Failed to Clear Progress",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error("Error clearing progress:", error);
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
