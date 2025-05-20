// ExerciseContext.tsx - Contexto para compartir estado entre componentes del ejercicio
import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { 
  Problem, 
  UserAnswer, 
  ExerciseState,
  ModuleSettings,
  ExerciseContextType,
  ExerciseEvent
} from '../types';
import { generateProblems } from '../utils/problemGenerator';
import { useExerciseTimer } from '../hooks/useExerciseTimer';

// Valor por defecto para el contexto
const defaultContextValue: ExerciseContextType = {
  state: 'loading',
  currentProblem: null,
  currentAnswer: '',
  userAnswers: [],
  problemIndex: 0,
  totalProblems: 0,
  remainingAttempts: 0,
  timeLeft: null,
  score: 0,
  
  // Funciones vacías (se inicializarán después)
  setAnswer: () => {},
  submitAnswer: () => {},
  goToNextProblem: () => {},
  restartExercise: () => {},
  showExplanation: () => {}
};

// Crear el contexto
const ExerciseContext = createContext<ExerciseContextType>(defaultContextValue);

// Estado inicial del reducer
interface ExerciseReducerState {
  state: ExerciseState;
  problems: Problem[];
  currentProblemIndex: number;
  userAnswers: UserAnswer[];
  currentAnswer: string;
  remainingAttempts: number;
  score: number;
  events: ExerciseEvent[];
}

// Acciones para el reducer
type ExerciseReducerAction = 
  | { type: 'INITIALIZE', payload: { problems: Problem[], settings: ModuleSettings } }
  | { type: 'SET_ANSWER', payload: string }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'NEXT_PROBLEM' }
  | { type: 'SHOW_EXPLANATION' }
  | { type: 'TIMEOUT' }
  | { type: 'COMPLETE_EXERCISE' }
  | { type: 'RESTART' };

// Reducer para manejar el estado del ejercicio
function exerciseReducer(state: ExerciseReducerState, action: ExerciseReducerAction): ExerciseReducerState {
  switch (action.type) {
    case 'INITIALIZE': {
      const { problems, settings } = action.payload;
      return {
        ...state,
        state: 'problem-display',
        problems,
        currentProblemIndex: 0,
        userAnswers: [],
        currentAnswer: '',
        remainingAttempts: settings.maxAttempts,
        score: 0,
        events: [
          ...state.events,
          { 
            type: 'exercise_started', 
            config: settings 
          }
        ]
      };
    }
      
    case 'SET_ANSWER': {
      return {
        ...state,
        currentAnswer: action.payload
      };
    }
      
    case 'SUBMIT_ANSWER': {
      const currentProblem = state.problems[state.currentProblemIndex];
      const isCorrect = String(state.currentAnswer).trim() === String(currentProblem.correctAnswer).trim();
      
      // Crear una nueva respuesta
      const newAnswer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: state.currentAnswer,
        isCorrect,
        attempts: state.remainingAttempts === 0 ? 
                   1 : 
                   (state.userAnswers[state.currentProblemIndex]?.attempts || 0) + 1,
        timestamp: Date.now(),
        status: isCorrect ? 'correct' : 'incorrect'
      };
      
      // Actualizar respuestas
      const updatedAnswers = [...state.userAnswers];
      updatedAnswers[state.currentProblemIndex] = newAnswer;
      
      // Actualizar puntuación
      const newScore = isCorrect ? state.score + 1 : state.score;
      
      // Registrar evento
      const newEvents = [
        ...state.events,
        {
          type: 'answer_submitted',
          problem: currentProblem,
          answer: state.currentAnswer,
          isCorrect,
          attemptCount: newAnswer.attempts
        }
      ];
      
      return {
        ...state,
        userAnswers: updatedAnswers,
        remainingAttempts: isCorrect ? 0 : state.remainingAttempts - 1,
        score: newScore,
        state: isCorrect || state.remainingAttempts <= 1 ? 'feedback' : 'problem-display',
        events: newEvents
      };
    }
      
    case 'NEXT_PROBLEM': {
      // ¿Es el último problema?
      const isLastProblem = state.currentProblemIndex >= state.problems.length - 1;
      
      if (isLastProblem) {
        // Completar ejercicio
        return {
          ...state,
          state: 'completed'
        };
      } else {
        // Ir al siguiente problema
        const nextProblem = state.problems[state.currentProblemIndex + 1];
        return {
          ...state,
          state: 'problem-display',
          currentProblemIndex: state.currentProblemIndex + 1,
          currentAnswer: '',
          remainingAttempts: state.userAnswers[state.currentProblemIndex + 1] ? 
                            0 : state.remainingAttempts,
          events: [
            ...state.events,
            {
              type: 'problem_displayed',
              problem: nextProblem
            }
          ]
        };
      }
    }
      
    case 'SHOW_EXPLANATION': {
      return {
        ...state,
        state: 'explanation'
      };
    }
      
    case 'TIMEOUT': {
      const currentProblem = state.problems[state.currentProblemIndex];
      
      // Crear una nueva respuesta de timeout
      const newAnswer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: state.currentAnswer || '',
        isCorrect: false,
        attempts: (state.userAnswers[state.currentProblemIndex]?.attempts || 0) + 1,
        timestamp: Date.now(),
        status: 'timeout'
      };
      
      // Actualizar respuestas
      const updatedAnswers = [...state.userAnswers];
      updatedAnswers[state.currentProblemIndex] = newAnswer;
      
      return {
        ...state,
        userAnswers: updatedAnswers,
        remainingAttempts: 0,
        state: 'feedback'
      };
    }
      
    case 'COMPLETE_EXERCISE': {
      return {
        ...state,
        state: 'completed'
      };
    }
      
    case 'RESTART': {
      return {
        ...state,
        state: 'loading',
        currentProblemIndex: 0,
        userAnswers: [],
        currentAnswer: '',
        score: 0
      };
    }
      
    default:
      return state;
  }
}

// Provider del contexto
export function ExerciseProvider({ 
  children, 
  settings
}: { 
  children: React.ReactNode, 
  settings: ModuleSettings 
}) {
  // Estado inicial
  const initialState: ExerciseReducerState = {
    state: 'loading',
    problems: [],
    currentProblemIndex: 0,
    userAnswers: [],
    currentAnswer: '',
    remainingAttempts: settings.maxAttempts,
    score: 0,
    events: []
  };
  
  const [state, dispatch] = useReducer(exerciseReducer, initialState);
  
  // Temporizador
  const { 
    timeLeft,
    isTimerActive,
    globalTimer,
    startTimer,
    pauseTimer,
    resetProblemTimer,
    stopAllTimers
  } = useExerciseTimer({
    timerType: settings.timeLimit === 'global' ? 'global' : 'per-problem',
    timeValue: settings.timeValue,
    active: state.state === 'problem-display',
    onTimerComplete: () => dispatch({ type: 'TIMEOUT' })
  });
  
  // Cargar problemas al iniciar
  useEffect(() => {
    const loadProblems = async () => {
      try {
        // Generar problemas basados en la configuración
        const problems = await generateProblems({
          count: settings.problemCount,
          difficulty: settings.difficulty
        });
        
        // Añadir IDs a los problemas que no los tengan
        const problemsWithIds = problems.map(p => ({
          ...p,
          id: p.id || `prob-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        }));
        
        // Inicializar ejercicio
        dispatch({ 
          type: 'INITIALIZE', 
          payload: { 
            problems: problemsWithIds, 
            settings 
          } 
        });
      } catch (error) {
        console.error("Error al generar problemas:", error);
      }
    };
    
    loadProblems();
  }, [settings]);
  
  // Reiniciar temporizador por problema cuando cambia el problema
  useEffect(() => {
    if (state.state === 'problem-display' && 
        settings.timeLimit === 'per-problem') {
      resetProblemTimer();
    }
  }, [state.currentProblemIndex, state.state]);
  
  // Parar temporizador cuando se completa el ejercicio
  useEffect(() => {
    if (state.state === 'completed') {
      stopAllTimers();
    }
  }, [state.state]);
  
  // Funciones para la interfaz de usuario
  const setAnswer = (value: string) => {
    dispatch({ type: 'SET_ANSWER', payload: value });
  };
  
  const submitAnswer = () => {
    dispatch({ type: 'SUBMIT_ANSWER' });
  };
  
  const goToNextProblem = () => {
    dispatch({ type: 'NEXT_PROBLEM' });
  };
  
  const restartExercise = () => {
    dispatch({ type: 'RESTART' });
  };
  
  const showExplanation = () => {
    dispatch({ type: 'SHOW_EXPLANATION' });
  };
  
  // Valores para el contexto
  const contextValue: ExerciseContextType = {
    state: state.state,
    currentProblem: state.problems[state.currentProblemIndex] || null,
    currentAnswer: state.currentAnswer,
    userAnswers: state.userAnswers,
    problemIndex: state.currentProblemIndex,
    totalProblems: state.problems.length,
    remainingAttempts: state.remainingAttempts,
    timeLeft,
    score: state.score,
    
    // Acciones
    setAnswer,
    submitAnswer,
    goToNextProblem,
    restartExercise,
    showExplanation
  };
  
  return (
    <ExerciseContext.Provider value={contextValue}>
      {children}
    </ExerciseContext.Provider>
  );
}

// Hook para usar el contexto
export const useExercise = () => useContext(ExerciseContext);