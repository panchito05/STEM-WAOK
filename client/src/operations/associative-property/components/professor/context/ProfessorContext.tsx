import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AssociativePropertyProblem } from '../../../types';

// Tipos para el estado global
type Position = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

interface ProfessorState {
  // Estado del problema actual
  currentProblem: AssociativePropertyProblem | null;
  userAnswer: string;
  isCorrect: boolean | null;
  attempts: number;
  
  // Estado de la interfaz
  position: Position;
  isProcessing: boolean;
  showVerticalFormat: boolean;
  
  // Configuraciones
  settings: {
    maxAttempts: number;
    enableCompensation: boolean;
    autoAdvanceDelay: number;
  };
  
  // Canvas y dibujo
  canvasCleared: boolean;
}

// Acciones disponibles
type ProfessorAction =
  | { type: 'SET_PROBLEM'; payload: AssociativePropertyProblem }
  | { type: 'SET_USER_ANSWER'; payload: string }
  | { type: 'SET_CORRECT'; payload: boolean }
  | { type: 'INCREMENT_ATTEMPTS' }
  | { type: 'SET_POSITION'; payload: Position }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_VERTICAL_FORMAT'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ProfessorState['settings']> }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'RESET_FOR_NEW_PROBLEM' }
  | { type: 'RESET_ALL' };

// Estado inicial
const initialState: ProfessorState = {
  currentProblem: null,
  userAnswer: '',
  isCorrect: null,
  attempts: 0,
  position: 'topLeft',
  isProcessing: false,
  showVerticalFormat: true,
  settings: {
    maxAttempts: 3,
    enableCompensation: false,
    autoAdvanceDelay: 1000,
  },
  canvasCleared: false,
};

// Reducer para manejar las acciones
function professorReducer(state: ProfessorState, action: ProfessorAction): ProfessorState {
  switch (action.type) {
    case 'SET_PROBLEM':
      return {
        ...state,
        currentProblem: action.payload,
        // Auto-reset cuando cambia el problema
        userAnswer: '',
        isCorrect: null,
        attempts: 0,
        isProcessing: false,
        canvasCleared: false,
      };

    case 'SET_USER_ANSWER':
      return {
        ...state,
        userAnswer: action.payload,
      };

    case 'SET_CORRECT':
      return {
        ...state,
        isCorrect: action.payload,
      };

    case 'INCREMENT_ATTEMPTS':
      return {
        ...state,
        attempts: state.attempts + 1,
      };

    case 'SET_POSITION':
      return {
        ...state,
        position: action.payload,
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };

    case 'SET_VERTICAL_FORMAT':
      return {
        ...state,
        showVerticalFormat: action.payload,
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case 'CLEAR_CANVAS':
      return {
        ...state,
        canvasCleared: true,
      };

    case 'RESET_FOR_NEW_PROBLEM':
      return {
        ...state,
        userAnswer: '',
        isCorrect: null,
        attempts: 0,
        isProcessing: false,
        canvasCleared: false,
      };

    case 'RESET_ALL':
      return {
        ...initialState,
        // Mantener configuraciones persistentes
        position: state.position,
        showVerticalFormat: state.showVerticalFormat,
        settings: state.settings,
      };

    default:
      return state;
  }
}

// Context
interface ProfessorContextType {
  state: ProfessorState;
  dispatch: React.Dispatch<ProfessorAction>;
  
  // Acciones de conveniencia
  setProblem: (problem: AssociativePropertyProblem) => void;
  setUserAnswer: (answer: string) => void;
  setCorrect: (correct: boolean) => void;
  incrementAttempts: () => void;
  setPosition: (position: Position) => void;
  setProcessing: (processing: boolean) => void;
  setVerticalFormat: (vertical: boolean) => void;
  updateSettings: (settings: Partial<ProfessorState['settings']>) => void;
  clearCanvas: () => void;
  resetForNewProblem: () => void;
  resetAll: () => void;
}

const ProfessorContext = createContext<ProfessorContextType | undefined>(undefined);

// Provider
interface ProfessorProviderProps {
  children: React.ReactNode;
  initialProblem?: AssociativePropertyProblem;
  initialSettings?: Partial<ProfessorState['settings']>;
}

export const ProfessorProvider: React.FC<ProfessorProviderProps> = ({
  children,
  initialProblem,
  initialSettings,
}) => {
  const [state, dispatch] = useReducer(professorReducer, {
    ...initialState,
    currentProblem: initialProblem || null,
    settings: {
      ...initialState.settings,
      ...initialSettings,
    },
  });

  // Persistir posición en localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('professor_position') as Position;
    if (savedPosition && ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'].includes(savedPosition)) {
      dispatch({ type: 'SET_POSITION', payload: savedPosition });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('professor_position', state.position);
  }, [state.position]);

  // Acciones de conveniencia
  const contextValue: ProfessorContextType = {
    state,
    dispatch,
    
    setProblem: (problem: AssociativePropertyProblem) => 
      dispatch({ type: 'SET_PROBLEM', payload: problem }),
    
    setUserAnswer: (answer: string) => 
      dispatch({ type: 'SET_USER_ANSWER', payload: answer }),
    
    setCorrect: (correct: boolean) => 
      dispatch({ type: 'SET_CORRECT', payload: correct }),
    
    incrementAttempts: () => 
      dispatch({ type: 'INCREMENT_ATTEMPTS' }),
    
    setPosition: (position: Position) => 
      dispatch({ type: 'SET_POSITION', payload: position }),
    
    setProcessing: (processing: boolean) => 
      dispatch({ type: 'SET_PROCESSING', payload: processing }),
    
    setVerticalFormat: (vertical: boolean) => 
      dispatch({ type: 'SET_VERTICAL_FORMAT', payload: vertical }),
    
    updateSettings: (settings: Partial<ProfessorState['settings']>) => 
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    
    clearCanvas: () => 
      dispatch({ type: 'CLEAR_CANVAS' }),
    
    resetForNewProblem: () => 
      dispatch({ type: 'RESET_FOR_NEW_PROBLEM' }),
    
    resetAll: () => 
      dispatch({ type: 'RESET_ALL' }),
  };

  return (
    <ProfessorContext.Provider value={contextValue}>
      {children}
    </ProfessorContext.Provider>
  );
};

// Hook para usar el context
export const useProfessorContext = (): ProfessorContextType => {
  const context = useContext(ProfessorContext);
  if (context === undefined) {
    throw new Error('useProfessorContext debe ser usado dentro de un ProfessorProvider');
  }
  return context;
};

export default ProfessorContext;