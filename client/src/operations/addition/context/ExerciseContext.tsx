// ExerciseContext.tsx - Contexto para el estado del ejercicio
import React, { createContext, useReducer, useContext, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  ExerciseState, Problem, UserAnswer, ExerciseContextType, 
  ExerciseEvent, ExerciseResult, ProblemGeneratorConfig, DifficultyLevel 
} from '../types';
import { generateProblems, adaptDifficulty } from '../utils/problemGenerator';
import { saveExerciseResult } from '@/services/progressService';
import { ModuleSettings } from '@/types/settings';

// Estado inicial del contexto
const initialState: ExerciseState = {
  isActive: false,
  isComplete: false,
  problems: [],
  currentProblemIndex: 0,
  currentAnswer: '',
  userAnswers: [],
  score: 0,
  attempts: 0,
  showExplanation: false,
  consecutive: {
    correct: 0,
    incorrect: 0
  },
  settings: {
    problemCount: 5,
    difficulty: 'easy',
    hasTimeLimit: false,
    timeLimit: 300,
    hasPerProblemTimer: false,
    problemTimeLimit: 30,
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
    language: 'es',
    consecutiveCorrectThreshold: 3,
    consecutiveIncorrectThreshold: 2
  },
  timeRemaining: 0,
  problemTimeRemaining: 0
};

// Tipos de acciones para el reducer
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

// Reducer para manejar acciones
function exerciseReducer(state: ExerciseState, action: ActionType): ExerciseState {
  switch (action.type) {
    case 'START_EXERCISE':
      return {
        ...initialState,
        isActive: true,
        settings: {
          ...initialState.settings,
          problemCount: action.settings.problemCount || initialState.settings.problemCount,
          difficulty: action.settings.difficulty as DifficultyLevel || initialState.settings.difficulty,
          hasTimeLimit: action.settings.hasTimeLimit || initialState.settings.hasTimeLimit,
          timeLimit: action.settings.timeLimit || initialState.settings.timeLimit,
          hasPerProblemTimer: action.settings.hasPerProblemTimer || initialState.settings.hasPerProblemTimer,
          problemTimeLimit: action.settings.problemTimeLimit || initialState.settings.problemTimeLimit,
          maxOperands: action.settings.maxOperands || initialState.settings.maxOperands,
          minValue: action.settings.minValue || initialState.settings.minValue,
          maxValue: action.settings.maxValue || initialState.settings.maxValue,
          allowNegatives: action.settings.allowNegatives || initialState.settings.allowNegatives,
          allowDecimals: action.settings.allowDecimals || initialState.settings.allowDecimals,
          decimalPlaces: action.settings.decimalPlaces || initialState.settings.decimalPlaces,
          maxAttemptsPerProblem: action.settings.maxAttemptsPerProblem || initialState.settings.maxAttemptsPerProblem,
          showHints: action.settings.showHints ?? initialState.settings.showHints,
          showExplanations: action.settings.showExplanations ?? initialState.settings.showExplanations,
          preferredDisplayFormat: action.settings.preferredDisplayFormat as any || initialState.settings.preferredDisplayFormat,
          adaptiveMode: action.settings.adaptiveMode || initialState.settings.adaptiveMode,
          language: action.settings.language || initialState.settings.language,
          consecutiveCorrectThreshold: action.settings.consecutiveCorrectThreshold || initialState.settings.consecutiveCorrectThreshold,
          consecutiveIncorrectThreshold: action.settings.consecutiveIncorrectThreshold || initialState.settings.consecutiveIncorrectThreshold
        },
        timeRemaining: action.settings.hasTimeLimit ? (action.settings.timeLimit || initialState.settings.timeLimit) : 0,
        problemTimeRemaining: action.settings.hasPerProblemTimer ? (action.settings.problemTimeLimit || initialState.settings.problemTimeLimit) : 0
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
        problems: action.problems,
        currentProblemIndex: 0,
        currentAnswer: '',
        attempts: 0,
        showExplanation: false
      };

    case 'NEXT_PROBLEM': {
      const nextIndex = state.currentProblemIndex + 1;
      const isComplete = nextIndex >= state.problems.length;

      return {
        ...state,
        currentProblemIndex: isComplete ? state.currentProblemIndex : nextIndex,
        currentAnswer: '',
        attempts: 0,
        showExplanation: false,
        isComplete: isComplete,
        problemTimeRemaining: state.settings.hasPerProblemTimer ? state.settings.problemTimeLimit : 0
      };
    }

    case 'UPDATE_ANSWER':
      return {
        ...state,
        currentAnswer: action.value
      };

    case 'SUBMIT_ANSWER': {
      const currentProblem = state.problems[state.currentProblemIndex];
      const attempts = state.attempts + 1;
      const isMaxAttempts = attempts >= state.settings.maxAttemptsPerProblem;
      const isCorrect = action.isCorrect;

      // Actualizar el conteo de respuestas consecutivas
      const consecutive = { ...state.consecutive };
      if (isCorrect) {
        consecutive.correct += 1;
        consecutive.incorrect = 0;
      } else {
        consecutive.correct = 0;
        consecutive.incorrect += 1;
      }

      // Actualizar la puntuación si la respuesta es correcta
      const score = isCorrect ? state.score + 1 : state.score;

      // Crear objeto de respuesta del usuario
      const userAnswer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: state.currentAnswer,
        isCorrect: isCorrect,
        attempts: attempts,
        timestamp: Date.now(),
        status: isCorrect ? 'correct' : 'incorrect'
      };

      // Actualizar o agregar la respuesta del usuario
      const userAnswers = [...state.userAnswers];
      const existingAnswerIndex = userAnswers.findIndex(a => a.problemId === currentProblem.id);

      if (existingAnswerIndex >= 0) {
        userAnswers[existingAnswerIndex] = userAnswer;
      } else {
        userAnswers.push(userAnswer);
      }

      // Mostrar explicación si se llegó al número máximo de intentos o si la respuesta es correcta
      const showExplanation = 
        (state.settings.showExplanations && isMaxAttempts && !isCorrect) || 
        (state.settings.showExplanations && isCorrect);

      // Adaptar la dificultad si está en modo adaptativo y es una respuesta correcta al primer intento
      let adaptedDifficulty = state.settings.difficulty;
      if (state.settings.adaptiveMode && isCorrect && attempts === 1) {
        adaptedDifficulty = adaptDifficulty(
          state.settings.difficulty,
          consecutive.correct,
          consecutive.incorrect,
          state.settings.consecutiveCorrectThreshold,
          state.settings.consecutiveIncorrectThreshold
        );
      }

      return {
        ...state,
        score,
        attempts,
        userAnswers,
        showExplanation,
        consecutive,
        settings: {
          ...state.settings,
          difficulty: adaptedDifficulty
        }
      };
    }

    case 'SKIP_PROBLEM': {
      const currentProblem = state.problems[state.currentProblemIndex];
      
      // Crear objeto de respuesta del usuario para el problema saltado
      const skippedAnswer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: '',
        isCorrect: false,
        attempts: state.attempts,
        timestamp: Date.now(),
        status: 'skipped'
      };

      // Actualizar o agregar la respuesta del usuario
      const userAnswers = [...state.userAnswers];
      const existingAnswerIndex = userAnswers.findIndex(a => a.problemId === currentProblem.id);

      if (existingAnswerIndex >= 0) {
        userAnswers[existingAnswerIndex] = skippedAnswer;
      } else {
        userAnswers.push(skippedAnswer);
      }

      // Resetear consecutivos correctos
      const consecutive = { ...state.consecutive, correct: 0 };

      return {
        ...state,
        userAnswers,
        consecutive,
        showExplanation: state.settings.showExplanations // Mostrar explicación después de saltar
      };
    }

    case 'SHOW_SOLUTION': {
      const currentProblem = state.problems[state.currentProblemIndex];
      
      // Crear objeto de respuesta del usuario para la solución revelada
      const revealedAnswer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: currentProblem.correctAnswer.toString(),
        isCorrect: false, // No cuenta como correcto aunque se revele la solución
        attempts: state.attempts,
        timestamp: Date.now(),
        status: 'revealed'
      };

      // Actualizar o agregar la respuesta del usuario
      const userAnswers = [...state.userAnswers];
      const existingAnswerIndex = userAnswers.findIndex(a => a.problemId === currentProblem.id);

      if (existingAnswerIndex >= 0) {
        userAnswers[existingAnswerIndex] = revealedAnswer;
      } else {
        userAnswers.push(revealedAnswer);
      }

      // Actualizar estado
      return {
        ...state,
        currentAnswer: currentProblem.correctAnswer.toString(),
        userAnswers,
        showExplanation: true,
        consecutive: { ...state.consecutive, correct: 0 } // Resetear consecutivos correctos
      };
    }

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

    case 'TIMER_EXPIRED': {
      if (action.timerType === 'global') {
        // Si expira el temporizador global, terminar el ejercicio
        return {
          ...state,
          isActive: false,
          isComplete: true
        };
      } else {
        // Si expira el temporizador del problema, registrar como tiempo agotado
        const currentProblem = state.problems[state.currentProblemIndex];
        
        // Crear objeto de respuesta del usuario para tiempo agotado
        const timeoutAnswer: UserAnswer = {
          problemId: currentProblem.id,
          problem: currentProblem,
          userAnswer: state.currentAnswer,
          isCorrect: false,
          attempts: state.attempts + 1,
          timestamp: Date.now(),
          status: 'timeout'
        };

        // Actualizar o agregar la respuesta del usuario
        const userAnswers = [...state.userAnswers];
        const existingAnswerIndex = userAnswers.findIndex(a => a.problemId === currentProblem.id);

        if (existingAnswerIndex >= 0) {
          userAnswers[existingAnswerIndex] = timeoutAnswer;
        } else {
          userAnswers.push(timeoutAnswer);
        }

        return {
          ...state,
          userAnswers,
          attempts: state.attempts + 1,
          showExplanation: state.settings.showExplanations,
          consecutive: { ...state.consecutive, correct: 0, incorrect: state.consecutive.incorrect + 1 }
        };
      }
    }

    default:
      return state;
  }
}

// Crear contexto
const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useExerciseContext = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExerciseContext debe ser usado dentro de un ExerciseProvider');
  }
  return context;
};

// Provider para proveer contexto a la aplicación
export const ExerciseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(exerciseReducer, initialState);
  
  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const problemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseStartTimeRef = useRef<number | null>(null);
  
  // Rastrear eventos del ejercicio
  const trackEvent = useCallback((event: ExerciseEvent) => {
    // Aquí se podría implementar un sistema de análisis para rastrear eventos
    console.log('Exercise event:', event.type, event.data);
  }, []);
  
  // Función para iniciar el ejercicio
  const startExercise = useCallback((settings: ModuleSettings) => {
    dispatch({ type: 'START_EXERCISE', settings });
    
    // Generar problemas según la configuración
    const config: ProblemGeneratorConfig = {
      count: settings.problemCount || 5,
      difficulty: settings.difficulty as DifficultyLevel || 'easy',
      minValue: settings.minValue || 1,
      maxValue: settings.maxValue || 10,
      maxOperands: settings.maxOperands || 2,
      allowNegatives: settings.allowNegatives || false,
      allowDecimals: settings.allowDecimals || false,
      decimalPlaces: settings.decimalPlaces || 1,
      preferredDisplayFormat: settings.preferredDisplayFormat as any || 'horizontal'
    };
    
    const problems = generateProblems(config);
    dispatch({ type: 'SET_PROBLEMS', problems });
    
    // Registrar tiempo de inicio
    exerciseStartTimeRef.current = Date.now();
    
    // Registrar evento de inicio
    trackEvent({ 
      type: 'start', 
      data: { settings, problemCount: problems.length } 
    });
    
    // Iniciar temporizador global si es necesario
    if (settings.hasTimeLimit) {
      const timeLimit = settings.timeLimit || 300; // 5 minutos por defecto
      dispatch({ type: 'UPDATE_TIMER', timeRemaining: timeLimit });
      
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
      
      globalTimerRef.current = setInterval(() => {
        dispatch({ type: 'UPDATE_TIMER', timeRemaining: state.timeRemaining - 1 });
        
        if (state.timeRemaining <= 1) {
          // Tiempo agotado
          if (globalTimerRef.current) clearInterval(globalTimerRef.current);
          dispatch({ type: 'TIMER_EXPIRED', timerType: 'global' });
          
          // Registrar evento de tiempo agotado
          trackEvent({ type: 'timer_expired', data: { timerType: 'global' } });
          
          // Guardar resultado
          saveExerciseResults();
        }
      }, 1000);
    }
    
    // Iniciar temporizador de problema si es necesario
    if (settings.hasPerProblemTimer) {
      startProblemTimer();
    }
  }, [state.timeRemaining, trackEvent]);
  
  // Función para iniciar temporizador de problema
  const startProblemTimer = useCallback(() => {
    if (!state.settings.hasPerProblemTimer) return;
    
    const problemTimeLimit = state.settings.problemTimeLimit || 30; // 30 segundos por defecto
    dispatch({ type: 'UPDATE_PROBLEM_TIMER', timeRemaining: problemTimeLimit });
    
    if (problemTimerRef.current) clearInterval(problemTimerRef.current);
    
    problemTimerRef.current = setInterval(() => {
      dispatch({ type: 'UPDATE_PROBLEM_TIMER', timeRemaining: state.problemTimeRemaining - 1 });
      
      if (state.problemTimeRemaining <= 1) {
        // Tiempo agotado para este problema
        if (problemTimerRef.current) clearInterval(problemTimerRef.current);
        dispatch({ type: 'TIMER_EXPIRED', timerType: 'problem' });
        
        // Registrar evento de tiempo agotado
        trackEvent({ type: 'timer_expired', data: { timerType: 'problem' } });
      }
    }, 1000);
  }, [state.settings.hasPerProblemTimer, state.settings.problemTimeLimit, state.problemTimeRemaining, trackEvent]);
  
  // Función para finalizar el ejercicio
  const endExercise = useCallback(() => {
    // Detener temporizadores
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    if (problemTimerRef.current) clearInterval(problemTimerRef.current);
    
    dispatch({ type: 'END_EXERCISE' });
    
    // Registrar evento de finalización
    trackEvent({ type: 'end', data: { score: state.score, totalProblems: state.problems.length } });
    
    // Guardar resultado
    saveExerciseResults();
  }, [state.score, state.problems.length, trackEvent]);
  
  // Guardar resultados del ejercicio
  const saveExerciseResults = useCallback(() => {
    if (!state.isActive || state.problems.length === 0) return;
    
    const timeSpent = exerciseStartTimeRef.current 
      ? Math.floor((Date.now() - exerciseStartTimeRef.current) / 1000) 
      : 0;
    
    const result: ExerciseResult = {
      id: uuidv4(),
      moduleId: 'addition',
      date: Date.now(),
      problems: state.problems,
      userAnswers: state.userAnswers,
      score: state.score,
      totalProblems: state.problems.length,
      settings: state.settings,
      timeSpent,
      difficulty: state.settings.difficulty,
      initialDifficulty: initialState.settings.difficulty
    };
    
    saveExerciseResult(result);
  }, [state]);
  
  // Función para actualizar la respuesta actual
  const updateAnswer = useCallback((value: string | number) => {
    dispatch({ type: 'UPDATE_ANSWER', value });
  }, []);
  
  // Función para enviar una respuesta
  const submitAnswer = useCallback(() => {
    const currentProblem = state.problems[state.currentProblemIndex];
    const userAnswer = parseFloat(state.currentAnswer.toString());
    const correctAnswer = currentProblem.correctAnswer;
    
    // Comprobar si la respuesta es correcta
    const isCorrect = userAnswer === correctAnswer;
    
    dispatch({ type: 'SUBMIT_ANSWER', isCorrect });
    
    // Registrar evento de respuesta
    trackEvent({ 
      type: 'answer', 
      data: { 
        problemId: currentProblem.id, 
        userAnswer, 
        correctAnswer, 
        isCorrect,
        attempts: state.attempts + 1
      } 
    });
    
    return isCorrect;
  }, [state.problems, state.currentProblemIndex, state.currentAnswer, state.attempts, trackEvent]);
  
  // Función para saltar un problema
  const skipProblem = useCallback(() => {
    const currentProblem = state.problems[state.currentProblemIndex];
    
    dispatch({ type: 'SKIP_PROBLEM' });
    
    // Registrar evento de salto
    trackEvent({ 
      type: 'skip', 
      data: { problemId: currentProblem.id } 
    });
  }, [state.problems, state.currentProblemIndex, trackEvent]);
  
  // Función para mostrar la solución
  const showSolution = useCallback(() => {
    const currentProblem = state.problems[state.currentProblemIndex];
    
    dispatch({ type: 'SHOW_SOLUTION' });
    
    // Registrar evento de mostrar solución
    trackEvent({ 
      type: 'solution', 
      data: { problemId: currentProblem.id } 
    });
  }, [state.problems, state.currentProblemIndex, trackEvent]);
  
  // Función para pasar al siguiente problema
  const nextProblem = useCallback(() => {
    const isLastProblem = state.currentProblemIndex === state.problems.length - 1;
    
    dispatch({ type: 'NEXT_PROBLEM' });
    
    // Si era el último problema, finalizar el ejercicio
    if (isLastProblem) {
      endExercise();
    } else if (state.settings.hasPerProblemTimer) {
      // Reiniciar el temporizador de problema para el nuevo problema
      startProblemTimer();
    }
  }, [state.currentProblemIndex, state.problems.length, state.settings.hasPerProblemTimer, endExercise, startProblemTimer]);
  
  // Función para actualizar el temporizador global
  const updateTimer = useCallback((timeRemaining: number) => {
    dispatch({ type: 'UPDATE_TIMER', timeRemaining });
  }, []);
  
  // Función para actualizar el temporizador de problema
  const updateProblemTimer = useCallback((timeRemaining: number) => {
    dispatch({ type: 'UPDATE_PROBLEM_TIMER', timeRemaining });
  }, []);
  
  // Función para marcar que un temporizador ha expirado
  const timerExpired = useCallback((timerType: 'global' | 'problem') => {
    dispatch({ type: 'TIMER_EXPIRED', timerType });
  }, []);
  
  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
      if (problemTimerRef.current) clearInterval(problemTimerRef.current);
    };
  }, []);
  
  // Crear objeto de contexto
  const contextValue: ExerciseContextType = {
    state,
    startExercise,
    endExercise,
    updateAnswer,
    submitAnswer,
    skipProblem,
    showSolution,
    nextProblem,
    updateTimer,
    updateProblemTimer,
    timerExpired
  };
  
  return (
    <ExerciseContext.Provider value={contextValue}>
      {children}
    </ExerciseContext.Provider>
  );
};