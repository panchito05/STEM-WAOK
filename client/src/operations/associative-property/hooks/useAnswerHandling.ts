import { useCallback } from 'react';
import { AssociativePropertyProblem, AssociativePropertyUserAnswer } from '../types';
import { checkAnswer } from '../utils';

interface UseAnswerHandlingProps {
  currentProblem: AssociativePropertyProblem;
  currentAttempt: number;
  maxAttempts: number;
  userAnswersHistory: AssociativePropertyUserAnswer[];
  setUserAnswersHistory: (value: React.SetStateAction<AssociativePropertyUserAnswer[]>) => void;
  setCurrentAttempt: (value: React.SetStateAction<number>) => void;
  setFeedbackMessage: (message: string) => void;
  setFeedbackColor: (color: "green" | "red" | "blue") => void;
  setShowFeedback: (show: boolean) => void;
  setConsecutiveCorrectAnswers: (value: React.SetStateAction<number>) => void;
  setConsecutiveIncorrectAnswers: (value: React.SetStateAction<number>) => void;
  consecutiveCorrectAnswers: number;
  consecutiveIncorrectAnswers: number;
  problemStartTime: number | null;
  showImmediateFeedback: boolean;
  t: (key: string) => string;
}

export function useAnswerHandling({
  currentProblem,
  currentAttempt,
  maxAttempts,
  userAnswersHistory,
  setUserAnswersHistory,
  setCurrentAttempt,
  setFeedbackMessage,
  setFeedbackColor,
  setShowFeedback,
  setConsecutiveCorrectAnswers,
  setConsecutiveIncorrectAnswers,
  consecutiveCorrectAnswers,
  consecutiveIncorrectAnswers,
  problemStartTime,
  showImmediateFeedback,
  t
}: UseAnswerHandlingProps) {

  const submitAnswer = useCallback((userNumericAnswer: number) => {
    if (!currentProblem) return;

    const isCorrect = checkAnswer(currentProblem, userNumericAnswer);
    const timeTaken = problemStartTime ? Date.now() - problemStartTime : 0;
    const currentProblemIndex = userAnswersHistory.length;

    // Crear entrada del historial
    const newHistoryEntry: AssociativePropertyUserAnswer = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer: userNumericAnswer,
      isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      attempts: currentAttempt,
      timestamp: Date.now(),
      timeTaken,
      mistakes: isCorrect ? [] : [userNumericAnswer]
    };

    // Actualizar historial
    setUserAnswersHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentProblemIndex] = newHistoryEntry;
      return newHistory;
    });

    if (isCorrect) {
      setFeedbackMessage(t('exercises.correct'));
      setFeedbackColor("green");
      setConsecutiveCorrectAnswers(consecutiveCorrectAnswers + 1);
      setConsecutiveIncorrectAnswers(0);
    } else {
      setFeedbackMessage(t('exercises.incorrect'));
      setFeedbackColor("red");
      setConsecutiveIncorrectAnswers(consecutiveIncorrectAnswers + 1);
      setConsecutiveCorrectAnswers(0);
    }

    if (showImmediateFeedback) {
      setShowFeedback(true);
    }

    return isCorrect;
  }, [
    currentProblem,
    currentAttempt,
    maxAttempts,
    userAnswersHistory,
    setUserAnswersHistory,
    setCurrentAttempt,
    setFeedbackMessage,
    setFeedbackColor,
    setShowFeedback,
    setConsecutiveCorrectAnswers,
    setConsecutiveIncorrectAnswers,
    consecutiveCorrectAnswers,
    consecutiveIncorrectAnswers,
    problemStartTime,
    showImmediateFeedback,
    t
  ]);

  const handleCorrectAnswer = useCallback(() => {
    // Lógica adicional para respuestas correctas
    setCurrentAttempt(1); // Reset attempts for next problem
  }, [setCurrentAttempt]);

  const handleIncorrectAnswer = useCallback(() => {
    // Lógica adicional para respuestas incorrectas
    if (currentAttempt < maxAttempts) {
      setCurrentAttempt(prev => prev + 1);
    }
  }, [currentAttempt, maxAttempts, setCurrentAttempt]);

  const handleSkipProblem = useCallback(() => {
    if (!currentProblem) return;

    const currentProblemIndex = userAnswersHistory.length;
    const skippedEntry: AssociativePropertyUserAnswer = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer: 0,
      isCorrect: false,
      status: 'skipped',
      attempts: currentAttempt,
      timestamp: Date.now(),
      timeTaken: problemStartTime ? Date.now() - problemStartTime : 0
    };

    setUserAnswersHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentProblemIndex] = skippedEntry;
      return newHistory;
    });

    setFeedbackMessage(t('exercises.skipped'));
    setFeedbackColor("blue");
    setConsecutiveIncorrectAnswers(consecutiveIncorrectAnswers + 1);
    setConsecutiveCorrectAnswers(0);
  }, [
    currentProblem,
    currentAttempt,
    userAnswersHistory,
    setUserAnswersHistory,
    setFeedbackMessage,
    setFeedbackColor,
    setConsecutiveIncorrectAnswers,
    setConsecutiveCorrectAnswers,
    consecutiveIncorrectAnswers,
    problemStartTime,
    t
  ]);

  const revealAnswer = useCallback(() => {
    if (!currentProblem) return;

    const currentProblemIndex = userAnswersHistory.length;
    const revealedEntry: AssociativePropertyUserAnswer = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer: currentProblem.correctAnswer,
      isCorrect: false,
      status: 'revealed',
      attempts: currentAttempt,
      timestamp: Date.now(),
      timeTaken: problemStartTime ? Date.now() - problemStartTime : 0
    };

    setUserAnswersHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentProblemIndex] = revealedEntry;
      return newHistory;
    });

    setFeedbackMessage(`${t('exercises.answer_revealed')}: ${currentProblem.correctAnswer}`);
    setFeedbackColor("blue");
    setConsecutiveIncorrectAnswers(consecutiveIncorrectAnswers + 1);
    setConsecutiveCorrectAnswers(0);
  }, [
    currentProblem,
    currentAttempt,
    userAnswersHistory,
    setUserAnswersHistory,
    setFeedbackMessage,
    setFeedbackColor,
    setConsecutiveIncorrectAnswers,
    setConsecutiveCorrectAnswers,
    consecutiveIncorrectAnswers,
    problemStartTime,
    t
  ]);

  return {
    submitAnswer,
    handleCorrectAnswer,
    handleIncorrectAnswer,
    handleSkipProblem,
    revealAnswer
  };
}