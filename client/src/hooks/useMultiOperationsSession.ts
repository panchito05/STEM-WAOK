import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

interface ModuleInfo {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

interface SessionConfig {
  modules: ModuleInfo[];
  totalProblems: number;
  currentProblem: number;
  currentModule: string;
}

interface SessionProgress {
  moduleId: string;
  completed: boolean;
  correctAnswers: number;
  totalAnswers: number;
  timeSpent: number;
  userAnswers: any[];
}

export function useMultiOperationsSession() {
  const [, setLocation] = useLocation();
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress[]>([]);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  useEffect(() => {
    // Verificar si estamos en modo multi-operaciones
    const urlParams = new URLSearchParams(window.location.search);
    const multiMode = urlParams.get('multiMode') === 'true';
    const sessionData = urlParams.get('session');
    
    setIsMultiMode(multiMode);
    
    if (multiMode && sessionData) {
      try {
        const config: SessionConfig = JSON.parse(decodeURIComponent(sessionData));
        setSessionConfig(config);
        
        // Determinar el índice del módulo actual
        const currentIndex = config.modules.findIndex(m => m.id === config.currentModule);
        setCurrentModuleIndex(currentIndex);
        
        // Inicializar progreso si no existe
        if (sessionProgress.length === 0) {
          const initialProgress = config.modules.map(module => ({
            moduleId: module.id,
            completed: false,
            correctAnswers: 0,
            totalAnswers: 0,
            timeSpent: 0,
            userAnswers: []
          }));
          setSessionProgress(initialProgress);
        }
      } catch (error) {
        console.error('Error parsing session data:', error);
        setIsMultiMode(false);
      }
    }
  }, []);

  const updateModuleProgress = useCallback((moduleId: string, progress: Partial<SessionProgress>) => {
    setSessionProgress(prev => prev.map(p => 
      p.moduleId === moduleId ? { ...p, ...progress } : p
    ));
  }, []);

  const completeCurrentModule = useCallback((results: {
    correctAnswers: number;
    totalAnswers: number;
    timeSpent: number;
    userAnswers: any[];
  }) => {
    if (!sessionConfig || !isMultiMode) return;

    const currentModule = sessionConfig.modules[currentModuleIndex];
    
    // Actualizar progreso del módulo actual
    updateModuleProgress(currentModule.id, {
      completed: true,
      correctAnswers: results.correctAnswers,
      totalAnswers: results.totalAnswers,
      timeSpent: results.timeSpent,
      userAnswers: results.userAnswers
    });

    // Verificar si hay más módulos
    const nextIndex = currentModuleIndex + 1;
    
    if (nextIndex < sessionConfig.modules.length) {
      // Continuar al siguiente módulo
      const nextModule = sessionConfig.modules[nextIndex];
      const updatedConfig = {
        ...sessionConfig,
        currentModule: nextModule.id,
        currentProblem: sessionProgress.reduce((total, p) => total + p.totalAnswers, 0) + results.totalAnswers + 1
      };
      
      setCurrentModuleIndex(nextIndex);
      setSessionConfig(updatedConfig);
      
      // Navegar al siguiente módulo
      const sessionParam = encodeURIComponent(JSON.stringify(updatedConfig));
      setLocation(`/operation/${nextModule.id}?multiMode=true&session=${sessionParam}`);
    } else {
      // Todos los módulos completados - mostrar resumen final
      setLocation(`/multi-operations/summary?session=${encodeURIComponent(JSON.stringify({
        config: sessionConfig,
        progress: sessionProgress
      }))}`);
    }
  }, [sessionConfig, isMultiMode, currentModuleIndex, sessionProgress, updateModuleProgress, setLocation]);

  const getSessionSummary = useCallback(() => {
    if (!sessionConfig || !isMultiMode) return null;

    const totalCorrect = sessionProgress.reduce((sum, p) => sum + p.correctAnswers, 0);
    const totalAnswers = sessionProgress.reduce((sum, p) => sum + p.totalAnswers, 0);
    const totalTime = sessionProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    const accuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

    return {
      totalModules: sessionConfig.modules.length,
      completedModules: sessionProgress.filter(p => p.completed).length,
      totalCorrect,
      totalAnswers,
      totalTime,
      accuracy,
      moduleDetails: sessionProgress.map(p => {
        const module = sessionConfig.modules.find(m => m.id === p.moduleId);
        return {
          ...p,
          moduleName: module?.name || p.moduleId,
          moduleColor: module?.color || '#4287f5'
        };
      })
    };
  }, [sessionConfig, sessionProgress, isMultiMode]);

  return {
    isMultiMode,
    sessionConfig,
    sessionProgress,
    currentModuleIndex,
    completeCurrentModule,
    updateModuleProgress,
    getSessionSummary
  };
}