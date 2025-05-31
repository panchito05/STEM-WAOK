import { AssociativePropertyProblem, AssociativePropertyUserAnswer } from '../types';

// Estados del ejercicio
export interface ExerciseState {
  // Estado del ejercicio
  exerciseStarted: boolean;
  exerciseFinished: boolean;
  currentProblemIndex: number;
  problems: AssociativePropertyProblem[];
  
  // Estado del usuario
  userAnswer: string;
  userAnswersHistory: AssociativePropertyUserAnswer[];
  currentAttempt: number;
  
  // Estado de feedback
  showFeedback: boolean;
  feedbackMessage: string;
  feedbackColor: 'green' | 'red' | 'blue';
  
  // Estado de progreso
  consecutiveCorrectAnswers: number;
  consecutiveIncorrectAnswers: number;
  revealedAnswers: number;
  
  // Estado de tiempo
  totalTimeSpent: number;
  problemStartTime: number;
}

// Acciones del reducer
export type ExerciseAction =
  | { type: 'START_EXERCISE'; problems: AssociativePropertyProblem[] }
  | { type: 'FINISH_EXERCISE' }
  | { type: 'RESTART_EXERCISE' }
  | { type: 'SET_USER_ANSWER'; answer: string }
  | { type: 'SUBMIT_ANSWER'; userAnswer: AssociativePropertyUserAnswer }
  | { type: 'MOVE_TO_NEXT_PROBLEM' }
  | { type: 'SET_CURRENT_PROBLEM_INDEX'; index: number }
  | { type: 'SET_CURRENT_ATTEMPT'; attempt: number }
  | { type: 'INCREMENT_ATTEMPT' }
  | { type: 'SHOW_FEEDBACK'; message: string; color: 'green' | 'red' | 'blue' }
  | { type: 'HIDE_FEEDBACK' }
  | { type: 'INCREMENT_CORRECT_ANSWERS' }
  | { type: 'INCREMENT_INCORRECT_ANSWERS' }
  | { type: 'RESET_CONSECUTIVE_COUNTERS' }
  | { type: 'INCREMENT_REVEALED_ANSWERS' }
  | { type: 'SET_TOTAL_TIME_SPENT'; time: number }
  | { type: 'SET_PROBLEM_START_TIME'; time: number };

// Estado inicial
export const initialExerciseState: ExerciseState = {
  exerciseStarted: false,
  exerciseFinished: false,
  currentProblemIndex: 0,
  problems: [],
  userAnswer: '',
  userAnswersHistory: [],
  currentAttempt: 1,
  showFeedback: false,
  feedbackMessage: '',
  feedbackColor: 'blue',
  consecutiveCorrectAnswers: 0,
  consecutiveIncorrectAnswers: 0,
  revealedAnswers: 0,
  totalTimeSpent: 0,
  problemStartTime: 0
};

// Reducer para manejo del estado del ejercicio
export function exerciseReducer(state: ExerciseState, action: ExerciseAction): ExerciseState {
  switch (action.type) {
    case 'START_EXERCISE':
      return {
        ...state,
        exerciseStarted: true,
        exerciseFinished: false,
        problems: action.problems,
        currentProblemIndex: 0,
        currentAttempt: 1,
        problemStartTime: Date.now(),
        userAnswer: '',
        showFeedback: false
      };

    case 'FINISH_EXERCISE':
      return {
        ...state,
        exerciseFinished: true,
        exerciseStarted: false
      };

    case 'RESTART_EXERCISE':
      return {
        ...initialExerciseState,
        problems: [] // Los problemas se generarán nuevamente
      };

    case 'SET_USER_ANSWER':
      return {
        ...state,
        userAnswer: action.answer
      };

    case 'SUBMIT_ANSWER':
      return {
        ...state,
        userAnswersHistory: [...state.userAnswersHistory, action.userAnswer],
        userAnswer: '' // Limpiar respuesta después de enviar
      };

    case 'MOVE_TO_NEXT_PROBLEM':
      return {
        ...state,
        currentProblemIndex: state.currentProblemIndex + 1,
        currentAttempt: 1,
        userAnswer: '',
        showFeedback: false,
        problemStartTime: Date.now()
      };

    case 'SET_CURRENT_PROBLEM_INDEX':
      return {
        ...state,
        currentProblemIndex: action.index,
        currentAttempt: 1,
        userAnswer: '',
        showFeedback: false
      };

    case 'SET_CURRENT_ATTEMPT':
      return {
        ...state,
        currentAttempt: action.attempt
      };

    case 'INCREMENT_ATTEMPT':
      return {
        ...state,
        currentAttempt: state.currentAttempt + 1
      };

    case 'SHOW_FEEDBACK':
      return {
        ...state,
        showFeedback: true,
        feedbackMessage: action.message,
        feedbackColor: action.color
      };

    case 'HIDE_FEEDBACK':
      return {
        ...state,
        showFeedback: false,
        feedbackMessage: '',
        feedbackColor: 'blue'
      };

    case 'INCREMENT_CORRECT_ANSWERS':
      return {
        ...state,
        consecutiveCorrectAnswers: state.consecutiveCorrectAnswers + 1,
        consecutiveIncorrectAnswers: 0 // Reset contador incorrecto
      };

    case 'INCREMENT_INCORRECT_ANSWERS':
      return {
        ...state,
        consecutiveIncorrectAnswers: state.consecutiveIncorrectAnswers + 1,
        consecutiveCorrectAnswers: 0 // Reset contador correcto
      };

    case 'RESET_CONSECUTIVE_COUNTERS':
      return {
        ...state,
        consecutiveCorrectAnswers: 0,
        consecutiveIncorrectAnswers: 0
      };

    case 'INCREMENT_REVEALED_ANSWERS':
      return {
        ...state,
        revealedAnswers: state.revealedAnswers + 1
      };

    case 'SET_TOTAL_TIME_SPENT':
      return {
        ...state,
        totalTimeSpent: action.time
      };

    case 'SET_PROBLEM_START_TIME':
      return {
        ...state,
        problemStartTime: action.time
      };

    default:
      return state;
  }
}

// Selectores para computed values
export const exerciseSelectors = {
  getCurrentProblem: (state: ExerciseState): AssociativePropertyProblem | null => {
    return state.problems[state.currentProblemIndex] || null;
  },

  getIsLastProblem: (state: ExerciseState): boolean => {
    return state.currentProblemIndex >= state.problems.length - 1;
  },

  getProgress: (state: ExerciseState): { current: number; total: number; percentage: number } => {
    const current = state.currentProblemIndex + 1;
    const total = state.problems.length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return { current, total, percentage };
  },

  getExerciseStats: (state: ExerciseState) => {
    const totalProblems = state.problems.length;
    const answeredProblems = state.userAnswersHistory.length;
    const correctAnswers = state.userAnswersHistory.filter(answer => answer.isCorrect).length;
    const incorrectAnswers = answeredProblems - correctAnswers;
    const accuracy = answeredProblems > 0 ? Math.round((correctAnswers / answeredProblems) * 100) : 0;
    const averageTime = answeredProblems > 0 ? Math.round(state.totalTimeSpent / answeredProblems) : 0;

    return {
      totalProblems,
      answeredProblems,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      averageTime,
      revealedAnswers: state.revealedAnswers,
      consecutiveCorrectAnswers: state.consecutiveCorrectAnswers,
      consecutiveIncorrectAnswers: state.consecutiveIncorrectAnswers
    };
  },

  canSubmitAnswer: (state: ExerciseState): boolean => {
    return state.userAnswer.trim() !== '' && !state.showFeedback;
  },

  hasRemainingAttempts: (state: ExerciseState, maxAttempts: number): boolean => {
    return state.currentAttempt < maxAttempts;
  }
};

// Helper functions para crear acciones
export const exerciseActions = {
  startExercise: (problems: AssociativePropertyProblem[]): ExerciseAction => ({
    type: 'START_EXERCISE',
    problems
  }),

  finishExercise: (): ExerciseAction => ({
    type: 'FINISH_EXERCISE'
  }),

  restartExercise: (): ExerciseAction => ({
    type: 'RESTART_EXERCISE'
  }),

  setUserAnswer: (answer: string): ExerciseAction => ({
    type: 'SET_USER_ANSWER',
    answer
  }),

  submitAnswer: (userAnswer: AssociativePropertyUserAnswer): ExerciseAction => ({
    type: 'SUBMIT_ANSWER',
    userAnswer
  }),

  moveToNextProblem: (): ExerciseAction => ({
    type: 'MOVE_TO_NEXT_PROBLEM'
  }),

  setCurrentProblemIndex: (index: number): ExerciseAction => ({
    type: 'SET_CURRENT_PROBLEM_INDEX',
    index
  }),

  incrementAttempt: (): ExerciseAction => ({
    type: 'INCREMENT_ATTEMPT'
  }),

  showFeedback: (message: string, color: 'green' | 'red' | 'blue'): ExerciseAction => ({
    type: 'SHOW_FEEDBACK',
    message,
    color
  }),

  hideFeedback: (): ExerciseAction => ({
    type: 'HIDE_FEEDBACK'
  }),

  incrementCorrectAnswers: (): ExerciseAction => ({
    type: 'INCREMENT_CORRECT_ANSWERS'
  }),

  incrementIncorrectAnswers: (): ExerciseAction => ({
    type: 'INCREMENT_INCORRECT_ANSWERS'
  }),

  incrementRevealedAnswers: (): ExerciseAction => ({
    type: 'INCREMENT_REVEALED_ANSWERS'
  }),

  setTotalTimeSpent: (time: number): ExerciseAction => ({
    type: 'SET_TOTAL_TIME_SPENT',
    time
  }),

  setProblemStartTime: (time: number): ExerciseAction => ({
    type: 'SET_PROBLEM_START_TIME',
    time
  })
};