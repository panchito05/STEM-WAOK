import { useState, useEffect, useRef } from 'react';
import { AssociativePropertyProblem, AssociativePropertyUserAnswer, DifficultyLevel } from '../types';

// Hook para manejar el estado principal del ejercicio
export function useExerciseState(
  difficulty: DifficultyLevel,
  problemCount: number,
  maxAttempts: number
) {
  const [problems, setProblems] = useState<AssociativePropertyProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswersHistory, setUserAnswersHistory] = useState<AssociativePropertyUserAnswer[]>([]);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseFinished, setExerciseFinished] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue">('blue');
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [problemStartTime, setProblemStartTime] = useState<number | null>(null);
  
  // Estadísticas del ejercicio
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  
  // Refs para temporizadores
  const problemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseStartTimeRef = useRef<number | null>(null);

  const currentProblem = problems[currentProblemIndex];
  const isLastProblem = currentProblemIndex >= problems.length - 1;

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (problemTimerRef.current) {
        clearTimeout(problemTimerRef.current);
      }
      if (singleProblemTimerRef.current) {
        clearTimeout(singleProblemTimerRef.current);
      }
    };
  }, []);

  // Calcular estadísticas del ejercicio
  const calculateStats = () => {
    const correctAnswers = userAnswersHistory.filter(answer => answer?.isCorrect).length;
    const totalAttempts = userAnswersHistory.reduce((sum, answer) => sum + (answer?.attempts || 0), 0);
    const accuracy = problems.length > 0 ? (correctAnswers / problems.length) * 100 : 0;
    const avgTimePerProblem = problems.length > 0 ? totalTimeSpent / problems.length : 0;
    const avgAttempts = problems.length > 0 ? totalAttempts / problems.length : 0;

    return {
      score: correctAnswers,
      totalProblems: problems.length,
      accuracy: Math.round(accuracy * 100) / 100,
      avgTimePerProblem: Math.round(avgTimePerProblem * 100) / 100,
      avgAttempts: Math.round(avgAttempts * 100) / 100,
      revealedAnswers,
      totalTimeSpent: Math.round(totalTimeSpent)
    };
  };

  return {
    // Estado
    problems,
    setProblems,
    currentProblemIndex,
    setCurrentProblemIndex,
    userAnswersHistory,
    setUserAnswersHistory,
    exerciseStarted,
    setExerciseStarted,
    exerciseFinished,
    setExerciseFinished,
    userAnswer,
    setUserAnswer,
    feedbackMessage,
    setFeedbackMessage,
    feedbackColor,
    setFeedbackColor,
    showFeedback,
    setShowFeedback,
    currentAttempt,
    setCurrentAttempt,
    problemStartTime,
    setProblemStartTime,
    
    // Estadísticas
    consecutiveCorrectAnswers,
    setConsecutiveCorrectAnswers,
    consecutiveIncorrectAnswers,
    setConsecutiveIncorrectAnswers,
    revealedAnswers,
    setRevealedAnswers,
    totalTimeSpent,
    setTotalTimeSpent,
    
    // Refs
    problemTimerRef,
    singleProblemTimerRef,
    exerciseStartTimeRef,
    
    // Propiedades calculadas
    currentProblem,
    isLastProblem,
    
    // Métodos
    calculateStats
  };
}