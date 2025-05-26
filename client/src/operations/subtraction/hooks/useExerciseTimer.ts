import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerOptions {
  initialTime: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

/**
 * Hook personalizado para manejar temporizadores en ejercicios
 * @param options Opciones de configuración del temporizador
 */
export const useExerciseTimer = (options: TimerOptions) => {
  const { initialTime, onExpire, autoStart = false } = options;
  
  // Estado para el tiempo restante
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTime);
  // Estado para controlar si el temporizador está activo
  const [isActive, setIsActive] = useState<boolean>(autoStart);
  // Estado para controlar si el temporizador ha expirado
  const [isExpired, setIsExpired] = useState<boolean>(false);
  
  // Referencia para el intervalo del temporizador
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Función para iniciar el temporizador
  const startTimer = useCallback(() => {
    if (!isActive && !isExpired) {
      setIsActive(true);
    }
  }, [isActive, isExpired]);
  
  // Función para pausar el temporizador
  const pauseTimer = useCallback(() => {
    if (isActive) {
      setIsActive(false);
    }
  }, [isActive]);
  
  // Función para reiniciar el temporizador
  const resetTimer = useCallback((newTime?: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setTimeRemaining(newTime !== undefined ? newTime : initialTime);
    setIsActive(autoStart);
    setIsExpired(false);
  }, [initialTime, autoStart]);
  
  // Formatear el tiempo para mostrar
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Efecto para manejar el temporizador
  useEffect(() => {
    if (isActive && !isExpired) {
      // Crear un intervalo para decrementar el tiempo cada segundo
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Si el tiempo ha expirado
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            setIsActive(false);
            setIsExpired(true);
            
            // Llamar al callback onExpire si existe
            if (onExpire) {
              onExpire();
            }
            
            return 0;
          }
          
          return prev - 1;
        });
      }, 1000);
    } else if (!isActive && timerRef.current) {
      // Si el temporizador se pausó, limpiar el intervalo
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isExpired, onExpire]);
  
  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isActive,
    isExpired,
    startTimer,
    pauseTimer,
    resetTimer
  };
};