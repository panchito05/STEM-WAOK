// useExerciseTimer.ts - Hook para gestionar temporizadores en ejercicios
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseExerciseTimerProps {
  timerType: 'global' | 'per-problem';
  timeValue: number;
  active: boolean;
  onTimerComplete: () => void;
}

/**
 * Hook personalizado para gestionar temporizadores en ejercicios
 */
export function useExerciseTimer({
  timerType,
  timeValue,
  active,
  onTimerComplete
}: UseExerciseTimerProps) {
  // Estado para el tiempo restante
  const [timeLeft, setTimeLeft] = useState<number>(timeValue);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [globalTimer, setGlobalTimer] = useState<number>(0);
  
  // Referencias para los intervalos
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Iniciar temporizador
  const startTimer = useCallback(() => {
    // Limpiar temporizadores existentes
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
    }
    
    // Si no hay límite de tiempo, no iniciar temporizador
    if (timeValue <= 0) {
      return;
    }
    
    setIsTimerActive(true);
    
    // Inicializar timer dependiendo del tipo
    if (timerType === 'global') {
      setTimeLeft(timeValue);
      
      // Iniciar temporizador global
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            onTimerComplete();
            return 0;
          }
          return newTime;
        });
      }, 100);
    } else {
      // Timer por problema
      setTimeLeft(timeValue);
      
      // Iniciar temporizador por problema
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            onTimerComplete();
            return 0;
          }
          return newTime;
        });
      }, 100);
    }
    
    // Iniciar temporizador global para tracking
    globalTimerRef.current = setInterval(() => {
      setGlobalTimer(prev => prev + 0.1);
    }, 100);
  }, [timeValue, timerType, onTimerComplete]);
  
  // Pausar temporizador
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsTimerActive(false);
  }, []);
  
  // Resetear temporizador para un nuevo problema
  const resetProblemTimer = useCallback(() => {
    // Solo aplicable para timer por problema
    if (timerType !== 'per-problem') return;
    
    // Pausar timer actual
    pauseTimer();
    
    // Reiniciar tiempo
    setTimeLeft(timeValue);
    
    // Iniciar timer si está activo
    if (active) {
      startTimer();
    }
  }, [timerType, timeValue, active, pauseTimer, startTimer]);
  
  // Detener todos los temporizadores
  const stopAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
      globalTimerRef.current = null;
    }
    
    setIsTimerActive(false);
  }, []);
  
  // Efecto para iniciar/detener temporizador cuando cambia el estado de activo
  useEffect(() => {
    if (active) {
      startTimer();
    } else {
      pauseTimer();
    }
    
    // Limpiar temporizadores al desmontar
    return () => {
      stopAllTimers();
    };
  }, [active, startTimer, pauseTimer, stopAllTimers]);
  
  // Efecto para actualizar el tiempo cuando cambia el valor del tiempo
  useEffect(() => {
    if (!isTimerActive) {
      setTimeLeft(timeValue);
    }
  }, [timeValue, isTimerActive]);
  
  return {
    timeLeft,
    isTimerActive,
    globalTimer,
    startTimer,
    pauseTimer,
    resetProblemTimer,
    stopAllTimers
  };
}