import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveExerciseResult } from '@/services/progressService';
import { useStore } from '@/store/store';
import { ExerciseState, Problem, UserAnswer, ModuleSettings, AnswerStatus } from '../types';
import { generateProblems, ProblemGeneratorConfig } from '../utils/problemGenerator';

// Tipos de eventos para el reducer
export type ExerciseEvent =
  | { type: 'UPDATE_ANSWER'; payload: string }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'SKIP_PROBLEM' }
  | { type: 'SHOW_SOLUTION' }
  | { type: 'NEXT_PROBLEM' }
  | { type: 'COMPLETE_EXERCISE' }
  | { type: 'RESET_EXERCISE'; payload?: Partial<ModuleSettings> };

// Tipo para el contexto del ejercicio
export interface ExerciseContextType {
  state: ExerciseState;
  updateAnswer: (value: string | number) => void;
  submitAnswer: () => boolean;
  skipProblem: () => void;
  showSolution: () => void;
  nextProblem: () => void;
  resetExercise: (settings?: Partial<ModuleSettings>) => void;
}

// Estado inicial del ejercicio
const createInitialState = (settings: ModuleSettings): ExerciseState => {
  // Configuración para generar problemas
  const problemGeneratorConfig: ProblemGeneratorConfig = {
    difficulty: settings.difficulty,
    problemCount: settings.problemCount,
    maxOperands: 3, // Por defecto, ajustar según dificultad después
    minValue: 1,
    maxValue: 100,
    allowNegatives: false,
    allowDecimals: false,
    decimalPlaces: 0,
    preferredDisplayFormat: 'horizontal'
  };
  
  // Ajustar la configuración según la dificultad
  switch (settings.difficulty) {
    case 'easy':
      problemGeneratorConfig.maxOperands = 2;
      problemGeneratorConfig.maxValue = 10;
      break;
    case 'medium':
      problemGeneratorConfig.maxOperands = 3;
      problemGeneratorConfig.maxValue = 50;
      break;
    case 'hard':
      problemGeneratorConfig.maxOperands = 4;
      problemGeneratorConfig.maxValue = 100;
      problemGeneratorConfig.allowNegatives = true;
      break;
    case 'expert':
      problemGeneratorConfig.maxOperands = 5;
      problemGeneratorConfig.maxValue = 1000;
      problemGeneratorConfig.allowNegatives = true;
      problemGeneratorConfig.allowDecimals = true;
      problemGeneratorConfig.decimalPlaces = 2;
      break;
  }
  
  // Generar problemas
  const problems = generateProblems(problemGeneratorConfig);
  
  // Crear estado inicial
  return {
    problems,
    userAnswers: [],
    currentProblemIndex: 0,
    currentAnswer: '',
    settings,
    score: 0,
    isComplete: false,
    isActive: true,
    showExplanation: false,
    startTime: Date.now(),
    endTime: null,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    attempts: 0
  };
};

// Crear el contexto
const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

// Reducer para manejar las acciones del ejercicio
const exerciseReducer = (state: ExerciseState, event: ExerciseEvent): ExerciseState => {
  switch (event.type) {
    case 'UPDATE_ANSWER':
      return {
        ...state,
        currentAnswer: event.payload
      };
      
    case 'SUBMIT_ANSWER': {
      const currentProblem = state.problems[state.currentProblemIndex];
      
      if (!currentProblem || state.showExplanation) {
        return state;
      }
      
      // Convertir la respuesta actual a número
      const userAnswer = state.currentAnswer ? parseFloat(state.currentAnswer) : null;
      
      // Verificar si la respuesta es correcta
      const isCorrect = userAnswer === currentProblem.correctAnswer;
      
      // Incrementar los contadores de respuestas consecutivas
      let consecutiveCorrect = state.consecutiveCorrect;
      let consecutiveIncorrect = state.consecutiveIncorrect;
      
      if (isCorrect) {
        consecutiveCorrect += 1;
        consecutiveIncorrect = 0;
      } else {
        consecutiveIncorrect += 1;
        consecutiveCorrect = 0;
      }
      
      // Incrementar el contador de intentos
      const attempts = state.attempts + 1;
      
      // Actualizar el puntaje si la respuesta es correcta
      const score = isCorrect ? state.score + 1 : state.score;
      
      // Crear objeto de respuesta
      const answer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer,
        isCorrect,
        status: isCorrect ? 'correct' : 'incorrect',
        attempts,
        timestamp: Date.now()
      };
      
      // Añadir la respuesta al array de respuestas
      const userAnswers = [...state.userAnswers, answer];
      
      // Si hay explicaciones, mostrar el panel de explicación
      if (state.settings.showExplanations) {
        return {
          ...state,
          userAnswers,
          score,
          showExplanation: true,
          consecutiveCorrect,
          consecutiveIncorrect,
          attempts: 0
        };
      }
      
      // Si no hay explicaciones, prepara para el siguiente problema
      const isLastProblem = state.currentProblemIndex === state.problems.length - 1;
      
      if (isLastProblem) {
        // Finalizar el ejercicio
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - state.startTime) / 1000);
        
        // Guardar el resultado del ejercicio
        saveExerciseResult({
          id: uuidv4(),
          moduleId: 'addition',
          score,
          totalProblems: state.problems.length,
          timeSpent,
          date: new Date().toISOString(),
          problems: state.problems,
          settings: state.settings,
          userAnswers
        });
        
        return {
          ...state,
          userAnswers,
          score,
          isComplete: true,
          isActive: false,
          endTime,
          showExplanation: false,
          consecutiveCorrect,
          consecutiveIncorrect,
          attempts: 0
        };
      }
      
      // Pasar al siguiente problema
      return {
        ...state,
        userAnswers,
        score,
        currentProblemIndex: state.currentProblemIndex + 1,
        currentAnswer: '',
        showExplanation: false,
        consecutiveCorrect,
        consecutiveIncorrect,
        attempts: 0
      };
    }
    
    case 'SKIP_PROBLEM': {
      const currentProblem = state.problems[state.currentProblemIndex];
      
      if (!currentProblem || state.showExplanation) {
        return state;
      }
      
      // Crear objeto de respuesta para problema saltado
      const answer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: null,
        isCorrect: false,
        status: 'skipped',
        attempts: state.attempts,
        timestamp: Date.now()
      };
      
      // Añadir la respuesta al array de respuestas
      const userAnswers = [...state.userAnswers, answer];
      
      // Resetear contadores de respuestas consecutivas
      const consecutiveCorrect = 0;
      const consecutiveIncorrect = 0;
      
      // Si hay explicaciones, mostrar el panel de explicación
      if (state.settings.showExplanations) {
        return {
          ...state,
          userAnswers,
          showExplanation: true,
          currentAnswer: String(currentProblem.correctAnswer),
          consecutiveCorrect,
          consecutiveIncorrect,
          attempts: 0
        };
      }
      
      // Si no hay explicaciones, prepara para el siguiente problema
      const isLastProblem = state.currentProblemIndex === state.problems.length - 1;
      
      if (isLastProblem) {
        // Finalizar el ejercicio
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - state.startTime) / 1000);
        
        // Guardar el resultado del ejercicio
        saveExerciseResult({
          id: uuidv4(),
          moduleId: 'addition',
          score: state.score,
          totalProblems: state.problems.length,
          timeSpent,
          date: new Date().toISOString(),
          problems: state.problems,
          settings: state.settings,
          userAnswers
        });
        
        return {
          ...state,
          userAnswers,
          isComplete: true,
          isActive: false,
          endTime,
          showExplanation: false,
          consecutiveCorrect,
          consecutiveIncorrect,
          attempts: 0
        };
      }
      
      // Pasar al siguiente problema
      return {
        ...state,
        userAnswers,
        currentProblemIndex: state.currentProblemIndex + 1,
        currentAnswer: '',
        showExplanation: false,
        consecutiveCorrect,
        consecutiveIncorrect,
        attempts: 0
      };
    }
    
    case 'SHOW_SOLUTION': {
      const currentProblem = state.problems[state.currentProblemIndex];
      
      if (!currentProblem || state.showExplanation) {
        return state;
      }
      
      // Crear objeto de respuesta para solución mostrada
      const answer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: null,
        isCorrect: false,
        status: 'revealed',
        attempts: state.attempts,
        timestamp: Date.now()
      };
      
      // Añadir la respuesta al array de respuestas
      const userAnswers = [...state.userAnswers, answer];
      
      // Resetear contadores de respuestas consecutivas
      const consecutiveCorrect = 0;
      const consecutiveIncorrect = 0;
      
      return {
        ...state,
        userAnswers,
        showExplanation: true,
        currentAnswer: String(currentProblem.correctAnswer),
        consecutiveCorrect,
        consecutiveIncorrect,
        attempts: 0
      };
    }
    
    case 'NEXT_PROBLEM': {
      const isLastProblem = state.currentProblemIndex === state.problems.length - 1;
      
      if (isLastProblem) {
        // Finalizar el ejercicio
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - state.startTime) / 1000);
        
        // Guardar el resultado del ejercicio
        saveExerciseResult({
          id: uuidv4(),
          moduleId: 'addition',
          score: state.score,
          totalProblems: state.problems.length,
          timeSpent,
          date: new Date().toISOString(),
          problems: state.problems,
          settings: state.settings,
          userAnswers: state.userAnswers
        });
        
        return {
          ...state,
          isComplete: true,
          isActive: false,
          endTime,
          showExplanation: false
        };
      }
      
      // Pasar al siguiente problema
      return {
        ...state,
        currentProblemIndex: state.currentProblemIndex + 1,
        currentAnswer: '',
        showExplanation: false,
        attempts: 0
      };
    }
    
    case 'COMPLETE_EXERCISE': {
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - state.startTime) / 1000);
      
      // Guardar el resultado del ejercicio
      saveExerciseResult({
        id: uuidv4(),
        moduleId: 'addition',
        score: state.score,
        totalProblems: state.problems.length,
        timeSpent,
        date: new Date().toISOString(),
        problems: state.problems,
        settings: state.settings,
        userAnswers: state.userAnswers
      });
      
      return {
        ...state,
        isComplete: true,
        isActive: false,
        endTime
      };
    }
    
    case 'RESET_EXERCISE': {
      // Si hay configuraciones nuevas, actualizarlas
      const newSettings = event.payload
        ? { ...state.settings, ...event.payload }
        : state.settings;
        
      // Crear un nuevo estado inicial
      return createInitialState(newSettings);
    }
    
    default:
      return state;
  }
};

// Proveedor del contexto
export const ExerciseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Obtener la configuración del ejercicio de la store global
  const settings = useStore(state => 
    state.currentProfile?.moduleSettings?.addition || 
    { 
      difficulty: 'easy',
      problemCount: 5,
      hasTimeLimit: false,
      timeLimit: 300,
      hasPerProblemTimer: false,
      problemTimeLimit: 30,
      showExplanations: true,
      language: 'es'
    }
  );
  
  // Crear el estado inicial y el reducer
  const [state, dispatch] = useReducer(exerciseReducer, settings, createInitialState);
  
  // Guardar el resultado cuando el ejercicio se completa
  useEffect(() => {
    if (state.isComplete && state.endTime) {
      const timeSpent = Math.floor((state.endTime - state.startTime) / 1000);
      
      // Guardar el resultado del ejercicio
      saveExerciseResult({
        id: uuidv4(),
        moduleId: 'addition',
        score: state.score,
        totalProblems: state.problems.length,
        timeSpent,
        date: new Date().toISOString(),
        problems: state.problems,
        settings: state.settings,
        userAnswers: state.userAnswers
      });
    }
  }, [state.isComplete, state.endTime]);
  
  // Funciones para exponer a través del contexto
  const updateAnswer = (value: string | number) => {
    dispatch({ type: 'UPDATE_ANSWER', payload: String(value) });
  };
  
  const submitAnswer = (): boolean => {
    // Obtener el problema actual
    const currentProblem = state.problems[state.currentProblemIndex];
    
    if (!currentProblem || state.showExplanation || !state.currentAnswer) {
      return false;
    }
    
    // Convertir la respuesta actual a número
    const userAnswer = parseFloat(state.currentAnswer);
    
    // Verificar si la respuesta es correcta
    const isCorrect = userAnswer === currentProblem.correctAnswer;
    
    // Despachar la acción
    dispatch({ type: 'SUBMIT_ANSWER' });
    
    return isCorrect;
  };
  
  const skipProblem = () => {
    dispatch({ type: 'SKIP_PROBLEM' });
  };
  
  const showSolution = () => {
    dispatch({ type: 'SHOW_SOLUTION' });
  };
  
  const nextProblem = () => {
    dispatch({ type: 'NEXT_PROBLEM' });
  };
  
  const resetExercise = (newSettings?: Partial<ModuleSettings>) => {
    dispatch({ type: 'RESET_EXERCISE', payload: newSettings });
  };
  
  // Valor del contexto
  const value = {
    state,
    updateAnswer,
    submitAnswer,
    skipProblem,
    showSolution,
    nextProblem,
    resetExercise
  };
  
  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};

// Hook para usar el contexto
export const useExerciseContext = (): ExerciseContextType => {
  const context = useContext(ExerciseContext);
  
  if (context === undefined) {
    throw new Error('useExerciseContext must be used within an ExerciseProvider');
  }
  
  return context;
};