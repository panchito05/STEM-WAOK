// useExerciseTimer.ts - Hook personalizado para gestionar el temporizador del ejercicio
import { useState, useEffect, useRef } from 'react';

interface TimerConfig {
  timerType: 'global' | 'per-problem'; // Tipo de temporizador
  timeValue: number;                   // Valor del tiempo en segundos
  active: boolean;                     // Si el temporizador está activo
  onTimerComplete?: () => void;        // Callback cuando el tiempo se acaba
}

export function useExerciseTimer({ timerType, timeValue, active, onTimerComplete }: TimerConfig) {
  // Estado principal del temporizador
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [globalTimer, setGlobalTimer] = useState(0);
  
  // Referencias para manejar intervalos y timeouts
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const globalTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Inicializar temporizador
  const initializeTimer = () => {
    if (timerType === 'global') {
      // Si es temporizador global, inicializar con el valor total
      setTimeLeft(timeValue);
    } else if (timerType === 'per-problem') {
      // Si es por problema, inicializar con el tiempo por problema
      setTimeLeft(timeValue);
    }
  };
  
  // Iniciar temporizador
  const startTimer = () => {
    if (!active) return;
    
    setIsTimerActive(true);
    
    // Iniciar temporizador global para medir el tiempo total
    if (!globalTimerIntervalRef.current) {
      globalTimerIntervalRef.current = setInterval(() => {
        setGlobalTimer(prev => prev + 0.1);
      }, 100);
    }
    
    // Iniciar temporizador específico (global o por problema)
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    if (timeLeft === null) {
      initializeTimer();
    }
    
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        
        // Si el tiempo llega a cero, ejecutar callback y detener
        if (prev <= 0.1) {
          if (onTimerComplete) {
            onTimerComplete();
          }
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return 0;
        }
        
        return prev - 0.1;
      });
    }, 100);
  };
  
  // Pausar temporizador
  const pauseTimer = () => {
    setIsTimerActive(false);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };
  
  // Reiniciar temporizador para un nuevo problema
  const resetProblemTimer = () => {
    if (timerType === 'per-problem') {
      setTimeLeft(timeValue);
      
      if (active && isTimerActive) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        startTimer();
      }
    }
  };
  
  // Detener todos los temporizadores
  const stopAllTimers = () => {
    setIsTimerActive(false);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (globalTimerIntervalRef.current) {
      clearInterval(globalTimerIntervalRef.current);
      globalTimerIntervalRef.current = null;
    }
  };
  
  // Efecto para inicializar el temporizador cuando cambian las propiedades
  useEffect(() => {
    initializeTimer();
    
    // Limpiar cuando el componente se desmonta
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (globalTimerIntervalRef.current) {
        clearInterval(globalTimerIntervalRef.current);
      }
    };
  }, [timerType, timeValue]);
  
  // Efecto para manejar activación/desactivación
  useEffect(() => {
    if (active) {
      startTimer();
    } else {
      pauseTimer();
    }
  }, [active]);
  
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