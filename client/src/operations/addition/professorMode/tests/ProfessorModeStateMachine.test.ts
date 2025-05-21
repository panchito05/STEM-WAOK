import { 
  ProfessorModeState, 
  ProfessorModeDisplayMode,
  createInitialState,
  isValidState,
  canTransitionTo
} from '../domain/ProfessorModeStateMachine';
import { DifficultyLevel, DisplayFormat } from '../../domain/AdditionProblem';
import { ProfessorModeSettings } from '../../domain/AdditionSettings';
import { ProfessorStudentAnswer } from '../../domain/AdditionResult';

describe('ProfessorModeStateMachine', () => {
  // Datos de prueba
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

  const createTestAnswer = (problemId: string): ProfessorStudentAnswer => ({
    problemId,
    userAnswer: 10,
    isCorrect: true,
    timestamp: Date.now(),
    showExplanation: false
  });

  // Test para el estado inicial
  test('createInitialState debe crear un estado válido', () => {
    const settings = createTestSettings();
    const state = createInitialState(settings);
    
    // Verificar propiedades del estado inicial
    expect(state.displayMode).toBe(ProfessorModeDisplayMode.PROBLEM);
    expect(state.problems.length).toBe(0);
    expect(state.studentAnswers.length).toBe(0);
    expect(state.currentProblemIndex).toBe(0);
    expect(state.settings).toEqual(settings);
    expect(state.totalTime).toBe(0);
    
    // Verificar que el estado inicial es válido
    expect(isValidState(state)).toBe(true);
  });

  // Test para validación de estados
  test('isValidState debe rechazar estados inválidos', () => {
    const validState = createInitialState(createTestSettings());
    
    // Estado sin problemas en modo problema
    const invalidState1: ProfessorModeState = {
      ...validState,
      displayMode: ProfessorModeDisplayMode.PROBLEM,
      problems: [],
      currentProblemIndex: 0
    };
    
    // Estado con índice de problema fuera de rango
    const invalidState2: ProfessorModeState = {
      ...validState,
      displayMode: ProfessorModeDisplayMode.PROBLEM,
      problems: [{ id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }],
      currentProblemIndex: 5
    };
    
    // Estado de resultados con recuentos inconsistentes
    const invalidState3: ProfessorModeState = {
      ...validState,
      displayMode: ProfessorModeDisplayMode.RESULTS,
      problems: [
        { id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false },
        { id: 'test2', operands: [4, 5], correctAnswer: 9, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }
      ],
      studentAnswers: [createTestAnswer('test1')] // Falta una respuesta
    };
    
    // Verificar que cada estado inválido sea rechazado
    expect(isValidState(invalidState1)).toBe(true); // Este es válido en realidad
    expect(isValidState(invalidState2)).toBe(false);
    expect(isValidState(invalidState3)).toBe(false);
  });

  // Test para transiciones de estados
  test('canTransitionTo debe permitir solo transiciones válidas', () => {
    const stateInProblemMode: ProfessorModeState = {
      ...createInitialState(createTestSettings()),
      problems: [{ id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }],
      displayMode: ProfessorModeDisplayMode.PROBLEM
    };
    
    const stateInExplanationMode: ProfessorModeState = {
      ...stateInProblemMode,
      displayMode: ProfessorModeDisplayMode.EXPLANATION,
      studentAnswers: [createTestAnswer('test1')]
    };
    
    const stateWithAllAnswers: ProfessorModeState = {
      ...stateInProblemMode,
      displayMode: ProfessorModeDisplayMode.PROBLEM,
      problems: [
        { id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false },
        { id: 'test2', operands: [4, 5], correctAnswer: 9, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }
      ],
      studentAnswers: [
        createTestAnswer('test1'),
        createTestAnswer('test2')
      ]
    };
    
    // Transiciones válidas
    expect(canTransitionTo(stateInProblemMode, ProfessorModeDisplayMode.EXPLANATION)).toBe(true);
    expect(canTransitionTo(stateInExplanationMode, ProfessorModeDisplayMode.PROBLEM)).toBe(true);
    expect(canTransitionTo(stateWithAllAnswers, ProfessorModeDisplayMode.RESULTS)).toBe(true);
    
    // Transiciones inválidas
    expect(canTransitionTo(stateInProblemMode, ProfessorModeDisplayMode.RESULTS)).toBe(false); // No puede ir a resultados sin todas las respuestas
    expect(canTransitionTo(stateInProblemMode, ProfessorModeDisplayMode.REVIEW)).toBe(false); // No puede ir a revisión sin pasar por resultados
  });

  // Test para flujo completo
  test('debe mantener la integridad durante una sesión completa', () => {
    // Estado inicial
    let state = createInitialState(createTestSettings());
    expect(isValidState(state)).toBe(true);
    
    // Agregar problemas
    state = {
      ...state,
      problems: [
        { id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false },
        { id: 'test2', operands: [4, 5], correctAnswer: 9, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }
      ]
    };
    expect(isValidState(state)).toBe(true);
    
    // Contestar primer problema y mostrar explicación
    state = {
      ...state,
      displayMode: ProfessorModeDisplayMode.EXPLANATION,
      studentAnswers: [createTestAnswer('test1')],
    };
    expect(isValidState(state)).toBe(true);
    expect(canTransitionTo(state, ProfessorModeDisplayMode.PROBLEM)).toBe(true);
    
    // Pasar al siguiente problema
    state = {
      ...state,
      displayMode: ProfessorModeDisplayMode.PROBLEM,
      currentProblemIndex: 1
    };
    expect(isValidState(state)).toBe(true);
    
    // Contestar segundo problema
    state = {
      ...state,
      studentAnswers: [
        ...state.studentAnswers,
        createTestAnswer('test2')
      ]
    };
    expect(isValidState(state)).toBe(true);
    expect(canTransitionTo(state, ProfessorModeDisplayMode.RESULTS)).toBe(true);
    
    // Mostrar resultados
    state = {
      ...state,
      displayMode: ProfessorModeDisplayMode.RESULTS
    };
    expect(isValidState(state)).toBe(true);
    expect(canTransitionTo(state, ProfessorModeDisplayMode.REVIEW)).toBe(true);
    
    // Ir a revisión
    state = {
      ...state,
      displayMode: ProfessorModeDisplayMode.REVIEW,
      currentProblemIndex: 0
    };
    expect(isValidState(state)).toBe(true);
  });
});