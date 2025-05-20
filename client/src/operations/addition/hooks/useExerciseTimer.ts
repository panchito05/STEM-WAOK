// useExerciseTimer.ts - Hook personalizado para manejar el temporizador de ejercicios
import { useState, useRef, useEffect, useCallback } from 'react';

interface TimerOptions {
  autoStart?: boolean;
  onTimeEnd?: () => void;
}

/**
 * Hook personalizado para manejar un temporizador de ejercicios
 * @param maxTime Tiempo máximo en segundos
 * @param options Opciones adicionales (autoStart, onTimeEnd)
 */
export function useExerciseTimer(maxTime: number, options: TimerOptions = {}) {
  const [timeLeft, setTimeLeft] = useState<number>(maxTime);
  const [isActive, setIsActive] = useState<boolean>(options.autoStart || false);
  const timerRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  
  // Función para iniciar el temporizador
  const startTimer = useCallback(() => {
    if (timerRef.current !== null) return; // Ya está activo
    
    setIsActive(true);
    lastTickTimeRef.current = Date.now();
    
    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickTimeRef.current) / 1000; // Tiempo transcurrido en segundos
      lastTickTimeRef.current = now;
      
      setTimeLeft(prev => {
        const newTime = Math.max(0, prev - delta);
        
        // Si llegamos a 0, ejecutar callback si existe
        if (newTime === 0 && options.onTimeEnd) {
          options.onTimeEnd();
          pauseTimer();
        }
        
        return newTime;
      });
    }, 100); // Actualizar cada 100ms para un conteo más preciso
  }, [options.onTimeEnd]);
  
  // Función para pausar el temporizador
  const pauseTimer = useCallback(() => {
    if (timerRef.current === null) return; // Ya está pausado
    
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsActive(false);
  }, []);
  
  // Función para reiniciar el temporizador
  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimeLeft(maxTime);
  }, [maxTime, pauseTimer]);
  
  // Función para reiniciar y empezar
  const restartTimer = useCallback(() => {
    resetTimer();
    startTimer();
  }, [resetTimer, startTimer]);
  
  // Limpiar intervalo al desmontar componente
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Auto-iniciar si está configurado
  useEffect(() => {
    if (options.autoStart) {
      startTimer();
    }
    
    return () => pauseTimer();
  }, [options.autoStart, startTimer, pauseTimer]);
  
  // Cuando maxTime cambia, actualizar timeLeft
  useEffect(() => {
    setTimeLeft(maxTime);
  }, [maxTime]);
  
  return {
    timeLeft,
    isTimerActive: isActive,
    startTimer,
    pauseTimer,
    resetTimer,
    restartTimer
  };
}