// ExerciseContext.tsx - Contexto para gestionar el estado del ejercicio
import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/store/store';
import { saveExerciseResult } from '@/services/progressService';
import { 
  Problem, UserAnswer, ExerciseState, ModuleSettings, 
  ExerciseContextType, ExerciseEvent 
} from '../types';
import { useExerciseTimer } from '../hooks/useExerciseTimer';
import { generateProblems } from '../utils/problemGenerator';

// Estado inicial del ejercicio
const initialState: ExerciseState = {
  isActive: false,
  isComplete: false,
  currentProblemIndex: 0,
  score: 0,
  problems: [],
  userAnswers: [],
  currentAnswer: '',
  attempts: 0,
  showExplanation: false,
  timeRemaining: 0,
  problemTimeRemaining: 0,
  settings: {
    language: 'es',
    problemCount: 5,
    difficulty: 'beginner',
    hasTimeLimit: false,
    timeLimit: 300,
    hasPerProblemTimer: false,
    maxOperands: 2,
    minValue: 1,
    maxValue: 10,
    allowNegatives: false,
    allowDecimals: false,
    decimalPlaces: 1,
    maxAttemptsPerProblem: 2,
    showHints: true,
    showExplanations: true,
    preferredDisplayFormat: 'horizontal',
    adaptiveMode: false,
    consecutiveCorrectThreshold: 3,
    consecutiveIncorrectThreshold: 2
  }
};

// Tipo de acciones para el reducer
type ActionType = 
  | { type: 'START_EXERCISE'; settings: ModuleSettings }
  | { type: 'END_EXERCISE' }
  | { type: 'SET_PROBLEMS'; problems: Problem[] }
  | { type: 'NEXT_PROBLEM' }
  | { type: 'UPDATE_ANSWER'; value: string | number }
  | { type: 'SUBMIT_ANSWER'; isCorrect: boolean }
  | { type: 'SKIP_PROBLEM' }
  | { type: 'SHOW_SOLUTION' }
  | { type: 'UPDATE_TIMER'; timeRemaining: number }
  | { type: 'UPDATE_PROBLEM_TIMER'; timeRemaining: number }
  | { type: 'TIMER_EXPIRED'; timerType: 'global' | 'problem' };

// Reducer para manejar las acciones
function exerciseReducer(state: ExerciseState, action: ActionType): ExerciseState {
  switch (action.type) {
    case 'START_EXERCISE':
      return {
        ...initialState,
        isActive: true,
        timeRemaining: action.settings.hasTimeLimit ? (action.settings.timeLimit || 300) : 0,
        problemTimeRemaining: action.settings.hasPerProblemTimer ? 30 : 0,
        settings: { ...action.settings }
      };
      
    case 'END_EXERCISE':
      return {
        ...state,
        isActive: false,
        isComplete: true
      };
      
    case 'SET_PROBLEMS':
      return {
        ...state,
        problems: action.problems
      };
      
    case 'NEXT_PROBLEM':
      const nextIndex = state.currentProblemIndex + 1;
      const isLastProblem = nextIndex >= state.problems.length;
      
      return {
        ...state,
        currentProblemIndex: isLastProblem ? state.currentProblemIndex : nextIndex,
        currentAnswer: '',
        attempts: 0,
        showExplanation: false,
        isComplete: isLastProblem
      };
      
    case 'UPDATE_ANSWER':
      return {
        ...state,
        currentAnswer: action.value
      };
      
    case 'SUBMIT_ANSWER':
      const currentProblem = state.problems[state.currentProblemIndex];
      const newAttempts = state.attempts + 1;
      const userAnswer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: state.currentAnswer,
        isCorrect: action.isCorrect,
        status: action.isCorrect ? 'correct' : 'incorrect',
        attempts: newAttempts,
        timeTaken: state.settings.hasPerProblemTimer 
          ? (30 - state.problemTimeRemaining) 
          : 0,
        timestamp: Date.now()
      };
      
      // Actualizar respuestas del usuario
      const updatedUserAnswers = [...state.userAnswers];
      const existingAnswerIndex = updatedUserAnswers.findIndex(
        answer => answer.problemId === currentProblem.id
      );
      
      if (existingAnswerIndex >= 0) {
        updatedUserAnswers[existingAnswerIndex] = userAnswer;
      } else {
        updatedUserAnswers.push(userAnswer);
      }
      
      // Calcular puntuación
      const correctAnswers = updatedUserAnswers.filter(answer => answer.isCorrect).length;
      const newScore = Math.round((correctAnswers / state.problems.length) * 100);
      
      return {
        ...state,
        userAnswers: updatedUserAnswers,
        attempts: newAttempts,
        score: newScore,
        showExplanation: action.isCorrect 
          ? false 
          : (newAttempts >= (state.settings.maxAttemptsPerProblem || 2) && state.settings.showExplanations)
      };
      
    case 'SKIP_PROBLEM':
      const skippedProblem = state.problems[state.currentProblemIndex];
      const skippedAnswer: UserAnswer = {
        problemId: skippedProblem.id,
        problem: skippedProblem,
        userAnswer: '',
        isCorrect: false,
        status: 'skipped',
        attempts: state.attempts,
        timeTaken: state.settings.hasPerProblemTimer 
          ? (30 - state.problemTimeRemaining) 
          : 0,
        timestamp: Date.now()
      };
      
      // Actualizar respuestas del usuario
      const updatedSkippedAnswers = [...state.userAnswers];
      const existingSkippedIndex = updatedSkippedAnswers.findIndex(
        answer => answer.problemId === skippedProblem.id
      );
      
      if (existingSkippedIndex >= 0) {
        updatedSkippedAnswers[existingSkippedIndex] = skippedAnswer;
      } else {
        updatedSkippedAnswers.push(skippedAnswer);
      }
      
      // Recalcular puntuación
      const correctAfterSkip = updatedSkippedAnswers.filter(answer => answer.isCorrect).length;
      const scoreAfterSkip = Math.round((correctAfterSkip / state.problems.length) * 100);
      
      return {
        ...state,
        userAnswers: updatedSkippedAnswers,
        score: scoreAfterSkip,
        showExplanation: state.settings.showExplanations
      };
      
    case 'SHOW_SOLUTION':
      const revealedProblem = state.problems[state.currentProblemIndex];
      const revealedAnswer: UserAnswer = {
        problemId: revealedProblem.id,
        problem: revealedProblem,
        userAnswer: revealedProblem.correctAnswer,
        isCorrect: false,
        status: 'revealed',
        attempts: state.attempts,
        timeTaken: state.settings.hasPerProblemTimer 
          ? (30 - state.problemTimeRemaining) 
          : 0,
        timestamp: Date.now()
      };
      
      // Actualizar respuestas del usuario
      const updatedRevealedAnswers = [...state.userAnswers];
      const existingRevealedIndex = updatedRevealedAnswers.findIndex(
        answer => answer.problemId === revealedProblem.id
      );
      
      if (existingRevealedIndex >= 0) {
        updatedRevealedAnswers[existingRevealedIndex] = revealedAnswer;
      } else {
        updatedRevealedAnswers.push(revealedAnswer);
      }
      
      return {
        ...state,
        userAnswers: updatedRevealedAnswers,
        currentAnswer: revealedProblem.correctAnswer.toString(),
        showExplanation: true
      };
      
    case 'UPDATE_TIMER':
      return {
        ...state,
        timeRemaining: action.timeRemaining
      };
      
    case 'UPDATE_PROBLEM_TIMER':
      return {
        ...state,
        problemTimeRemaining: action.timeRemaining
      };
      
    case 'TIMER_EXPIRED':
      if (action.timerType === 'global') {
        // Si el temporizador global expira, finalizar ejercicio
        return {
          ...state,
          isActive: false,
          isComplete: true
        };
      } else {
        // Si el temporizador del problema expira, marcar como timeout
        const timeoutProblem = state.problems[state.currentProblemIndex];
        const timeoutAnswer: UserAnswer = {
          problemId: timeoutProblem.id,
          problem: timeoutProblem,
          userAnswer: state.currentAnswer,
          isCorrect: false,
          status: 'timeout',
          attempts: state.attempts,
          timeTaken: 30, // Tiempo máximo por problema
          timestamp: Date.now()
        };
        
        // Actualizar respuestas del usuario
        const updatedTimeoutAnswers = [...state.userAnswers];
        const existingTimeoutIndex = updatedTimeoutAnswers.findIndex(
          answer => answer.problemId === timeoutProblem.id
        );
        
        if (existingTimeoutIndex >= 0) {
          updatedTimeoutAnswers[existingTimeoutIndex] = timeoutAnswer;
        } else {
          updatedTimeoutAnswers.push(timeoutAnswer);
        }
        
        // Recalcular puntuación
        const correctAfterTimeout = updatedTimeoutAnswers.filter(answer => answer.isCorrect).length;
        const scoreAfterTimeout = Math.round((correctAfterTimeout / state.problems.length) * 100);
        
        return {
          ...state,
          userAnswers: updatedTimeoutAnswers,
          score: scoreAfterTimeout,
          showExplanation: state.settings.showExplanations
        };
      }
      
    default:
      return state;
  }
}

// Crear contexto
const ExerciseContext = createContext<ExerciseContextType | null>(null);

// Hook para usar el contexto
export const useExerciseContext = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExerciseContext debe ser usado dentro de un ExerciseProvider');
  }
  return context;
};

// Proveedor del contexto
export const ExerciseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(exerciseReducer, initialState);
  const timer = useExerciseTimer();
  
  // Tracking de analíticas
  const trackEvent = useCallback((event: ExerciseEvent) => {
    // Aquí podríamos implementar analíticas
    console.log('Exercise Event:', event);
  }, []);
  
  // Iniciar ejercicio
  const startExercise = useCallback((settings: ModuleSettings) => {
    dispatch({ type: 'START_EXERCISE', settings });
    
    // Generar problemas según configuración
    const problems = generateProblems({
      count: settings.problemCount || 5,
      difficulty: settings.difficulty || 'beginner',
      format: settings.preferredDisplayFormat,
      maxOperands: settings.maxOperands,
      minValue: settings.minValue,
      maxValue: settings.maxValue,
      allowNegatives: settings.allowNegatives,
      allowDecimals: settings.allowDecimals,
      decimalPlaces: settings.decimalPlaces
    });
    
    // Asignar ID único a cada problema
    const problemsWithIds = problems.map(problem => ({
      ...problem,
      id: uuidv4()
    }));
    
    dispatch({ type: 'SET_PROBLEMS', problems: problemsWithIds });
    
    // Si hay límite de tiempo, iniciar temporizador
    if (settings.hasTimeLimit && settings.timeLimit) {
      timer.startTimer();
    }
    
    // Registrar evento de inicio
    trackEvent({
      type: 'exercise_started',
      config: settings
    });
  }, [timer, trackEvent]);
  
  // Finalizar ejercicio
  const endExercise = useCallback(() => {
    // Detener temporizadores
    timer.pauseTimer();
    
    dispatch({ type: 'END_EXERCISE' });
    
    // Guardar resultado
    const { problems, userAnswers, score, settings } = state;
    
    const result = {
      module: 'addition',
      score,
      totalProblems: problems.length,
      timeSpent: settings.hasTimeLimit 
        ? (settings.timeLimit || 300) - state.timeRemaining 
        : 0,
      settings,
      userAnswers,
      timestamp: Date.now()
    };
    
    // Guardar en el servicio de progreso
    saveExerciseResult(result);
    
    // Registrar evento de finalización
    trackEvent({
      type: 'exercise_completed',
      score,
      totalProblems: problems.length
    });
  }, [state, timer, trackEvent]);
  
  // Pasar al siguiente problema
  const nextProblem = useCallback(() => {
    const nextIndex = state.currentProblemIndex + 1;
    
    // Si es el último problema, finalizar ejercicio
    if (nextIndex >= state.problems.length) {
      endExercise();
      return;
    }
    
    dispatch({ type: 'NEXT_PROBLEM' });
    
    // Si tiene temporizador por problema, reiniciarlo
    if (state.settings.hasPerProblemTimer) {
      timer.resetTimer();
      timer.startTimer();
    }
    
    // Registrar evento de nuevo problema
    const nextProblem = state.problems[nextIndex];
    if (nextProblem) {
      trackEvent({
        type: 'problem_displayed',
        problem: nextProblem
      });
    }
  }, [state, endExercise, timer, trackEvent]);
  
  // Actualizar respuesta
  const updateAnswer = useCallback((value: string | number) => {
    dispatch({ type: 'UPDATE_ANSWER', value });
  }, []);
  
  // Enviar respuesta
  const submitAnswer = useCallback(() => {
    const { currentProblemIndex, problems, currentAnswer } = state;
    const currentProblem = problems[currentProblemIndex];
    
    // Verificar si la respuesta es correcta
    const userAnswerNum = parseFloat(currentAnswer.toString());
    const correctAnswerNum = parseFloat(currentProblem.correctAnswer.toString());
    const isCorrect = !isNaN(userAnswerNum) && userAnswerNum === correctAnswerNum;
    
    dispatch({ type: 'SUBMIT_ANSWER', isCorrect });
    
    // Registrar evento de respuesta
    trackEvent({
      type: 'answer_submitted',
      problem: currentProblem,
      answer: currentAnswer,
      isCorrect,
      attemptCount: state.attempts + 1
    });
    
    return isCorrect;
  }, [state, trackEvent]);
  
  // Saltar problema
  const skipProblem = useCallback(() => {
    const { currentProblemIndex, problems } = state;
    const currentProblem = problems[currentProblemIndex];
    
    dispatch({ type: 'SKIP_PROBLEM' });
    
    // Registrar evento de respuesta saltada
    trackEvent({
      type: 'answer_submitted',
      problem: currentProblem,
      answer: '',
      isCorrect: false,
      attemptCount: state.attempts
    });
  }, [state, trackEvent]);
  
  // Mostrar solución
  const showSolution = useCallback(() => {
    const { currentProblemIndex, problems } = state;
    const currentProblem = problems[currentProblemIndex];
    
    dispatch({ type: 'SHOW_SOLUTION' });
    
    // Registrar evento de explicación
    trackEvent({
      type: 'explanation_shown',
      problem: currentProblem
    });
  }, [state, trackEvent]);
  
  // Efecto para actualizar el temporizador
  useEffect(() => {
    if (state.isActive && state.settings.hasTimeLimit) {
      const interval = setInterval(() => {
        dispatch({ type: 'UPDATE_TIMER', timeRemaining: state.timeRemaining - 1 });
        
        // Si el tiempo se acaba
        if (state.timeRemaining <= 1) {
          clearInterval(interval);
          dispatch({ type: 'TIMER_EXPIRED', timerType: 'global' });
          endExercise();
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [state.isActive, state.timeRemaining, state.settings.hasTimeLimit, endExercise]);
  
  // Efecto para temporizador de problema individual
  useEffect(() => {
    if (state.isActive && state.settings.hasPerProblemTimer && state.problemTimeRemaining > 0) {
      const interval = setInterval(() => {
        dispatch({ type: 'UPDATE_PROBLEM_TIMER', timeRemaining: state.problemTimeRemaining - 1 });
        
        // Si el tiempo del problema se acaba
        if (state.problemTimeRemaining <= 1) {
          clearInterval(interval);
          dispatch({ type: 'TIMER_EXPIRED', timerType: 'problem' });
          
          // Registrar evento de tiempo agotado
          const currentProblem = state.problems[state.currentProblemIndex];
          trackEvent({
            type: 'timer_ended',
            problem: currentProblem
          });
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [state.isActive, state.problemTimeRemaining, state.settings.hasPerProblemTimer, state.currentProblemIndex, state.problems, trackEvent]);
  
  // Valor del contexto
  const contextValue: ExerciseContextType = {
    state,
    startExercise,
    endExercise,
    nextProblem,
    updateAnswer,
    submitAnswer,
    skipProblem,
    showSolution,
    startTimer: timer.startTimer,
    pauseTimer: timer.pauseTimer,
    resumeTimer: timer.startTimer,
    resetTimer: timer.resetTimer
  };
  
  return (
    <ExerciseContext.Provider value={contextValue}>
      {children}
    </ExerciseContext.Provider>
  );
};