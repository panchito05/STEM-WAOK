import { useState, useEffect, useCallback } from 'react';
import { MultiplicationProblem } from '../../../types';

interface ProfessorSettings {
  maxAttempts: number;
  enableCompensation: boolean;
  autoAdvanceDelay?: number;
}

interface UseProfessorLogicReturn {
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  isCorrect: boolean | null;
  attempts: number;
  isProcessing: boolean;
  checkAnswer: () => void;
  resetForNewProblem: () => void;
  canSubmit: boolean;
  isComplete: boolean;
}

export const useProfessorLogic = (
  problem: MultiplicationProblem,
  settings: ProfessorSettings,
  onComplete: (wasCorrect: boolean) => void
): UseProfessorLogicReturn => {
  // Estados principales
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Validación robusta de entrada
  const validateInput = useCallback((input: string): boolean => {
    if (!input.trim()) return false;
    
    // Verificar que sea un número válido
    const numValue = parseFloat(input);
    return !isNaN(numValue) && isFinite(numValue);
  }, []);

  // Calcular respuesta correcta de forma segura
  const getCorrectAnswer = useCallback((prob: MultiplicationProblem): number => {
    try {
      return prob.operands.reduce((product, operand) => {
        const num = typeof operand === 'number' ? operand : parseFloat(operand.toString());
        return product * (isNaN(num) ? 1 : num);
      }, 1);
    } catch (error) {
      console.error('Error calculando respuesta correcta:', error);
      return 0;
    }
  }, []);

  // Función principal de verificación
  const checkAnswer = useCallback(() => {
    if (!validateInput(userAnswer) || isProcessing) return;

    setIsProcessing(true);
    
    try {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      const userNum = parseFloat(userAnswer);
      const correctAnswer = getCorrectAnswer(problem);
      const result = Math.abs(userNum - correctAnswer) < 0.001; // Tolerancia para decimales
      
      setIsCorrect(result);
      
      // Auto-avance si es correcto o se agotaron intentos
      const shouldComplete = result || newAttempts >= settings.maxAttempts;
      
      if (shouldComplete) {
        const delay = settings.autoAdvanceDelay || 1000;
        setTimeout(() => {
          setIsProcessing(false);
          onComplete(result);
        }, delay);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error verificando respuesta:', error);
      setIsProcessing(false);
    }
  }, [
    userAnswer, 
    attempts, 
    problem, 
    settings.maxAttempts, 
    settings.autoAdvanceDelay,
    isProcessing,
    validateInput,
    getCorrectAnswer,
    onComplete
  ]);

  // Reset para nuevo problema
  const resetForNewProblem = useCallback(() => {
    setUserAnswer('');
    setIsCorrect(null);
    setAttempts(0);
    setIsProcessing(false);
  }, []);

  // Reset automático cuando cambia el problema
  useEffect(() => {
    resetForNewProblem();
  }, [problem.id, resetForNewProblem]);

  // Estados derivados
  const canSubmit = validateInput(userAnswer) && !isProcessing;
  const isComplete = isCorrect !== null && (isCorrect || attempts >= settings.maxAttempts);

  return {
    userAnswer,
    setUserAnswer,
    isCorrect,
    attempts,
    isProcessing,
    checkAnswer,
    resetForNewProblem,
    canSubmit,
    isComplete
  };
};