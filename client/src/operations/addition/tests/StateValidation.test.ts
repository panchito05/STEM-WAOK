import { AdditionProblem, DifficultyLevel, DisplayFormat } from '../domain/AdditionProblem';
import { ProfessorModeSettings } from '../domain/AdditionSettings';
import { ProfessorStudentAnswer } from '../domain/AdditionResult';

/**
 * Test para verificar la validez de estados en el modo profesor
 */
describe('Validación de Estado de Modo Profesor', () => {
  // Tipos de estado discriminados para el modo profesor
  type ProblemMode = {
    displayMode: 'problem';
    problems: AdditionProblem[];
    studentAnswers: ProfessorStudentAnswer[];
    currentProblemIndex: number;
    settings: ProfessorModeSettings;
    totalTime: number;
  };

  type ExplanationMode = {
    displayMode: 'explanation';
    problems: AdditionProblem[];
    studentAnswers: ProfessorStudentAnswer[];
    currentProblemIndex: number;
    settings: ProfessorModeSettings;
    totalTime: number;
    explanationText?: string;
  };

  type ResultsMode = {
    displayMode: 'results';
    problems: AdditionProblem[];
    studentAnswers: ProfessorStudentAnswer[];
    currentProblemIndex: number;
    settings: ProfessorModeSettings;
    totalTime: number;
  };

  type ReviewMode = {
    displayMode: 'review';
    problems: AdditionProblem[];
    studentAnswers: ProfessorStudentAnswer[];
    currentProblemIndex: number;
    settings: ProfessorModeSettings;
    totalTime: number;
  };

  // Tipo discriminado para todos los estados posibles
  type ProfessorModeState = 
    | ProblemMode 
    | ExplanationMode 
    | ResultsMode
    | ReviewMode;

  // Configuraciones para pruebas
  const createTestSettings = (): ProfessorModeSettings => ({
    difficulty: DifficultyLevel.EASY,
    problemCount: 5,
    displayFormat: DisplayFormat.STANDARD,
    allowNegatives: false,
    allowDecimals: false,
    maxOperandValue: 20,
    enableCompensation: true,
    enableReview: true,
    enableExplanationBank: false
  });

  // Problema de muestra
  const createTestProblem = (id: string = 'test-problem'): AdditionProblem => ({
    id,
    operands: [5, 7],
    correctAnswer: 12,
    difficulty: DifficultyLevel.EASY,
    displayFormat: DisplayFormat.STANDARD,
    maxAttempts: 1,
    allowDecimals: false
  });

  // Respuesta de muestra
  const createTestAnswer = (problemId: string = 'test-problem'): ProfessorStudentAnswer => ({
    problemId,
    userAnswer: 12,
    isCorrect: true,
    timestamp: Date.now(),
    showExplanation: false
  });

  // Funciones de validación de estado
  const isValidProblemMode = (state: ProfessorModeState): state is ProblemMode => {
    return (
      state.displayMode === 'problem' &&
      Array.isArray(state.problems) &&
      state.problems.length > 0 &&
      Array.isArray(state.studentAnswers) &&
      state.currentProblemIndex >= 0 &&
      state.currentProblemIndex < state.problems.length
    );
  };

  const isValidExplanationMode = (state: ProfessorModeState): state is ExplanationMode => {
    return (
      state.displayMode === 'explanation' &&
      Array.isArray(state.problems) &&
      state.problems.length > 0 &&
      Array.isArray(state.studentAnswers) &&
      state.currentProblemIndex >= 0 &&
      state.currentProblemIndex < state.problems.length
    );
  };

  const isValidResultsMode = (state: ProfessorModeState): state is ResultsMode => {
    return (
      state.displayMode === 'results' &&
      Array.isArray(state.problems) &&
      state.problems.length > 0 &&
      Array.isArray(state.studentAnswers) &&
      state.studentAnswers.length === state.problems.length
    );
  };
  
  const isValidReviewMode = (state: ProfessorModeState): state is ReviewMode => {
    return (
      state.displayMode === 'review' &&
      Array.isArray(state.problems) &&
      state.problems.length > 0 &&
      Array.isArray(state.studentAnswers) &&
      state.studentAnswers.length === state.problems.length &&
      state.currentProblemIndex >= 0 &&
      state.currentProblemIndex < state.problems.length
    );
  };

  const isValidState = (state: ProfessorModeState): boolean => {
    return (
      isValidProblemMode(state) ||
      isValidExplanationMode(state) ||
      isValidResultsMode(state) ||
      isValidReviewMode(state)
    );
  };

  // Tests
  test('debe validar un estado de problema válido', () => {
    const problemState: ProfessorModeState = {
      displayMode: 'problem',
      problems: [createTestProblem()],
      studentAnswers: [],
      currentProblemIndex: 0,
      settings: createTestSettings(),
      totalTime: 0
    };
    
    expect(isValidProblemMode(problemState)).toBe(true);
    expect(isValidState(problemState)).toBe(true);
  });

  test('debe rechazar un estado de problema inválido', () => {
    const invalidProblemState: ProfessorModeState = {
      displayMode: 'problem',
      problems: [],  // Sin problemas
      studentAnswers: [],
      currentProblemIndex: 0,
      settings: createTestSettings(),
      totalTime: 0
    };
    
    expect(isValidProblemMode(invalidProblemState)).toBe(false);
    expect(isValidState(invalidProblemState)).toBe(false);
  });

  test('debe validar un estado de explicación válido', () => {
    const explanationState: ProfessorModeState = {
      displayMode: 'explanation',
      problems: [createTestProblem()],
      studentAnswers: [createTestAnswer()],
      currentProblemIndex: 0,
      settings: createTestSettings(),
      totalTime: 0,
      explanationText: 'Esta es una explicación'
    };
    
    expect(isValidExplanationMode(explanationState)).toBe(true);
    expect(isValidState(explanationState)).toBe(true);
  });

  test('debe rechazar un estado de explicación inválido', () => {
    const invalidExplanationState: ProfessorModeState = {
      displayMode: 'explanation',
      problems: [createTestProblem()],
      studentAnswers: [createTestAnswer()],
      currentProblemIndex: 5, // Índice fuera de rango
      settings: createTestSettings(),
      totalTime: 0
    };
    
    expect(isValidExplanationMode(invalidExplanationState)).toBe(false);
    expect(isValidState(invalidExplanationState)).toBe(false);
  });

  test('debe validar un estado de resultados válido', () => {
    const resultsState: ProfessorModeState = {
      displayMode: 'results',
      problems: [createTestProblem('1'), createTestProblem('2')],
      studentAnswers: [createTestAnswer('1'), createTestAnswer('2')],
      currentProblemIndex: 0,
      settings: createTestSettings(),
      totalTime: 120
    };
    
    expect(isValidResultsMode(resultsState)).toBe(true);
    expect(isValidState(resultsState)).toBe(true);
  });

  test('debe rechazar un estado de resultados inválido', () => {
    const invalidResultsState: ProfessorModeState = {
      displayMode: 'results',
      problems: [createTestProblem('1'), createTestProblem('2')],
      studentAnswers: [createTestAnswer('1')], // Falta una respuesta
      currentProblemIndex: 0,
      settings: createTestSettings(),
      totalTime: 120
    };
    
    expect(isValidResultsMode(invalidResultsState)).toBe(false);
    expect(isValidState(invalidResultsState)).toBe(false);
  });

  test('debe validar un estado de revisión válido', () => {
    const reviewState: ProfessorModeState = {
      displayMode: 'review',
      problems: [createTestProblem('1'), createTestProblem('2')],
      studentAnswers: [createTestAnswer('1'), createTestAnswer('2')],
      currentProblemIndex: 0,
      settings: createTestSettings(),
      totalTime: 120
    };
    
    expect(isValidReviewMode(reviewState)).toBe(true);
    expect(isValidState(reviewState)).toBe(true);
  });

  test('debe rechazar un estado de revisión inválido', () => {
    const invalidReviewState: ProfessorModeState = {
      displayMode: 'review',
      problems: [createTestProblem('1'), createTestProblem('2')],
      studentAnswers: [createTestAnswer('1'), createTestAnswer('2')],
      currentProblemIndex: -1, // Índice inválido
      settings: createTestSettings(),
      totalTime: 120
    };
    
    expect(isValidReviewMode(invalidReviewState)).toBe(false);
    expect(isValidState(invalidReviewState)).toBe(false);
  });

  test('debe validar correctamente las transiciones de estado', () => {
    // Estado inicial: modo problema
    const initialState: ProfessorModeState = {
      displayMode: 'problem',
      problems: [createTestProblem('1'), createTestProblem('2')],
      studentAnswers: [],
      currentProblemIndex: 0,
      settings: createTestSettings(),
      totalTime: 0
    };
    
    expect(isValidState(initialState)).toBe(true);
    
    // Transición a explicación (después de contestar)
    const explanationState: ProfessorModeState = {
      ...initialState,
      displayMode: 'explanation',
      studentAnswers: [createTestAnswer('1')],
      explanationText: 'Explicación para el problema 1'
    };
    
    expect(isValidState(explanationState)).toBe(true);
    
    // Transición a siguiente problema
    const nextProblemState: ProfessorModeState = {
      ...explanationState,
      displayMode: 'problem',
      currentProblemIndex: 1
    };
    
    expect(isValidState(nextProblemState)).toBe(true);
    
    // Contestar y completar todos los problemas
    const allAnsweredState: ProfessorModeState = {
      ...nextProblemState,
      studentAnswers: [createTestAnswer('1'), createTestAnswer('2')]
    };
    
    // Transición a resultados
    const resultsState: ProfessorModeState = {
      ...allAnsweredState,
      displayMode: 'results'
    };
    
    expect(isValidState(resultsState)).toBe(true);
    
    // Transición a revisión
    const reviewState: ProfessorModeState = {
      ...resultsState,
      displayMode: 'review',
      currentProblemIndex: 0
    };
    
    expect(isValidState(reviewState)).toBe(true);
  });
});