import { useCallback, useRef } from 'react';

interface UseTimerLogicProps {
  timeValue: number;
  hasTimerEnabled: boolean;
  timeLimit: string;
  setTotalTimeSpent: (value: React.SetStateAction<number>) => void;
  onTimeUp?: () => void;
}

export function useTimerLogic({
  timeValue,
  hasTimerEnabled,
  timeLimit,
  setTotalTimeSpent,
  onTimeUp
}: UseTimerLogicProps) {
  const problemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseStartTimeRef = useRef<number | null>(null);

  const startExerciseTimer = useCallback(() => {
    if (!hasTimerEnabled) return;

    exerciseStartTimeRef.current = Date.now();

    if (timeLimit === 'exercise') {
      // Timer para todo el ejercicio
      const timeInMs = timeValue * 60 * 1000;
      problemTimerRef.current = setTimeout(() => {
        if (onTimeUp) onTimeUp();
      }, timeInMs);
    }
  }, [hasTimerEnabled, timeLimit, timeValue, onTimeUp]);

  const startProblemTimer = useCallback(() => {
    if (!hasTimerEnabled || timeLimit !== 'per-problem') return;

    // Limpiar timer anterior si existe
    if (singleProblemTimerRef.current) {
      clearTimeout(singleProblemTimerRef.current);
    }

    const timeInMs = timeValue * 1000;
    singleProblemTimerRef.current = setTimeout(() => {
      if (onTimeUp) onTimeUp();
    }, timeInMs);
  }, [hasTimerEnabled, timeLimit, timeValue, onTimeUp]);

  const clearTimers = useCallback(() => {
    if (problemTimerRef.current) {
      clearTimeout(problemTimerRef.current);
      problemTimerRef.current = null;
    }
    if (singleProblemTimerRef.current) {
      clearTimeout(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
  }, []);

  const stopExerciseTimer = useCallback(() => {
    if (exerciseStartTimeRef.current) {
      const timeSpent = (Date.now() - exerciseStartTimeRef.current) / 1000;
      setTotalTimeSpent(prev => prev + timeSpent);
      exerciseStartTimeRef.current = null;
    }
    clearTimers();
  }, [setTotalTimeSpent, clearTimers]);

  const getRemainingTime = useCallback((): number => {
    if (!hasTimerEnabled) return 0;
    
    if (timeLimit === 'exercise' && exerciseStartTimeRef.current) {
      const elapsed = (Date.now() - exerciseStartTimeRef.current) / 1000;
      const totalTime = timeValue * 60;
      return Math.max(0, totalTime - elapsed);
    }
    
    return timeValue;
  }, [hasTimerEnabled, timeLimit, timeValue]);

  return {
    startExerciseTimer,
    startProblemTimer,
    stopExerciseTimer,
    clearTimers,
    getRemainingTime,
    problemTimerRef,
    singleProblemTimerRef,
    exerciseStartTimeRef
  };
}