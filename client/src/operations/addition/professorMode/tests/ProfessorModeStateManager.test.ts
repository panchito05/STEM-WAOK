import { ProfessorModeStateManager } from '../application/ProfessorModeStateManager';
import { ProfessorModeDisplayMode } from '../domain/ProfessorModeStateMachine';
import { DifficultyLevel, DisplayFormat } from '../../domain/AdditionProblem';
import { ProfessorModeSettings } from '../../domain/AdditionSettings';
import { ProfessorStudentAnswer } from '../../domain/AdditionResult';

// Mock para manageCompensationUseCase
jest.mock('../../application/ManageCompensationUseCase', () => ({
  manageCompensationUseCase: {
    shouldAddCompensation: jest.fn(),
    generateCompensationProblem: jest.fn()
  }
}));

// Mock para generateProblemUseCase
jest.mock('../../application/GenerateProblemUseCase', () => ({
  generateProblemUseCase: {
    executeMultiple: jest.fn()
  }
}));

// Mock para storageService
jest.mock('../../infrastructure/StorageService', () => ({
  storageService: {
    save: jest.fn().mockResolvedValue(true),
    load: jest.fn(),
    remove: jest.fn().mockResolvedValue(true)
  }
}));

// Mock para eventBus
jest.mock('../../infrastructure/EventBus', () => ({
  eventBus: {
    emit: jest.fn(),
    on: jest.fn().mockReturnValue(() => {})
  }
}));

describe('ProfessorModeStateManager', () => {
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

  // Reiniciar mocks antes de cada test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe crear un estado inicial válido', () => {
    const settings = createTestSettings();
    const stateManager = new ProfessorModeStateManager(settings, {
      autoLoadLastState: false,
      autoSaveState: false
    });
    
    const state = stateManager.getState();
    
    expect(state.displayMode).toBe(ProfessorModeDisplayMode.PROBLEM);
    expect(state.problems).toEqual([]);
    expect(state.studentAnswers).toEqual([]);
    expect(state.currentProblemIndex).toBe(0);
    expect(state.settings).toEqual(settings);
  });

  test('debe inicializar una sesión con problemas generados', () => {
    // Mock de problemas generados
    const mockProblems = [
      { id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false },
      { id: 'test2', operands: [4, 5], correctAnswer: 9, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }
    ];
    
    // Configurar mock
    const { generateProblemUseCase } = require('../../application/GenerateProblemUseCase');
    generateProblemUseCase.executeMultiple.mockReturnValue(mockProblems);
    
    // Crear gestor de estado
    const settings = createTestSettings();
    const stateManager = new ProfessorModeStateManager(settings, {
      autoLoadLastState: false,
      autoSaveState: false
    });
    
    // Inicializar sesión
    stateManager.initSession(settings, 2);
    
    // Verificar estado
    const state = stateManager.getState();
    expect(state.problems).toEqual(mockProblems);
    expect(state.studentAnswers).toEqual([]);
    expect(state.displayMode).toBe(ProfessorModeDisplayMode.PROBLEM);
    
    // Verificar que se llamó a generateProblemUseCase
    expect(generateProblemUseCase.executeMultiple).toHaveBeenCalledWith(settings, 2);
  });

  test('debe procesar correctamente las respuestas a problemas', () => {
    // Configurar mock para compensación
    const { manageCompensationUseCase } = require('../../application/ManageCompensationUseCase');
    manageCompensationUseCase.shouldAddCompensation.mockReturnValue(false);
    
    // Crear gestor de estado con problemas
    const settings = createTestSettings();
    const stateManager = new ProfessorModeStateManager(settings, {
      autoLoadLastState: false,
      autoSaveState: false
    });
    
    // Inicializar con problemas manualmente
    stateManager.dispatch({
      type: 'INIT_SESSION',
      payload: {
        settings,
        problems: [
          { id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false },
          { id: 'test2', operands: [4, 5], correctAnswer: 9, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }
        ]
      }
    });
    
    // Enviar respuesta
    const answer = createTestAnswer('test1');
    stateManager.submitAnswer(answer);
    
    // Verificar estado
    const state = stateManager.getState();
    expect(state.studentAnswers).toContainEqual(answer);
    
    // Verificar llamada a shouldAddCompensation
    expect(manageCompensationUseCase.shouldAddCompensation).toHaveBeenCalledWith(
      settings,
      answer.isCorrect
    );
  });

  test('debe generar problemas de compensación cuando sea necesario', () => {
    // Configurar mock para compensación
    const { manageCompensationUseCase } = require('../../application/ManageCompensationUseCase');
    manageCompensationUseCase.shouldAddCompensation.mockReturnValue(true);
    
    const mockCompensationResult = {
      newProblem: { 
        id: 'comp1', 
        operands: [2, 3], 
        correctAnswer: 5, 
        difficulty: DifficultyLevel.EASY, 
        displayFormat: DisplayFormat.STANDARD, 
        maxAttempts: 1, 
        allowDecimals: false, 
        isCompensation: true 
      },
      updatedProblems: [
        { id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false },
        { id: 'comp1', operands: [2, 3], correctAnswer: 5, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false, isCompensation: true }
      ]
    };
    
    manageCompensationUseCase.generateCompensationProblem.mockReturnValue(mockCompensationResult);
    
    // Crear gestor de estado con problemas
    const settings = createTestSettings();
    const stateManager = new ProfessorModeStateManager(settings, {
      autoLoadLastState: false,
      autoSaveState: false
    });
    
    // Inicializar con un problema
    stateManager.dispatch({
      type: 'INIT_SESSION',
      payload: {
        settings,
        problems: [{ id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }]
      }
    });
    
    // Enviar respuesta incorrecta
    const answer: ProfessorStudentAnswer = {
      problemId: 'test1',
      userAnswer: 5, // Respuesta incorrecta
      isCorrect: false,
      timestamp: Date.now(),
      showExplanation: false
    };
    
    stateManager.submitAnswer(answer);
    
    // Verificar estado
    const state = stateManager.getState();
    expect(state.problems).toEqual(mockCompensationResult.updatedProblems);
    
    // Verificar llamadas a manageCompensationUseCase
    expect(manageCompensationUseCase.shouldAddCompensation).toHaveBeenCalledWith(
      settings,
      false
    );
    
    expect(manageCompensationUseCase.generateCompensationProblem).toHaveBeenCalledWith(
      settings,
      [{ id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }],
      'incorrect_answer'
    );
  });

  test('debe manejar transiciones de estado correctamente', () => {
    // Crear gestor de estado
    const settings = createTestSettings();
    const stateManager = new ProfessorModeStateManager(settings, {
      autoLoadLastState: false,
      autoSaveState: false
    });
    
    // Inicializar con problemas
    stateManager.dispatch({
      type: 'INIT_SESSION',
      payload: {
        settings,
        problems: [
          { id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false },
          { id: 'test2', operands: [4, 5], correctAnswer: 9, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }
        ]
      }
    });
    
    // Enviar respuesta
    stateManager.submitAnswer(createTestAnswer('test1'));
    
    // Mostrar explicación
    stateManager.showExplanation('Ejemplo de explicación');
    
    // Verificar estado
    let state = stateManager.getState();
    expect(state.displayMode).toBe(ProfessorModeDisplayMode.EXPLANATION);
    expect(state.explanationText).toBe('Ejemplo de explicación');
    
    // Pasar al siguiente problema
    stateManager.nextProblem();
    
    state = stateManager.getState();
    expect(state.displayMode).toBe(ProfessorModeDisplayMode.PROBLEM);
    expect(state.currentProblemIndex).toBe(1);
    
    // Enviar respuesta para segundo problema
    stateManager.submitAnswer(createTestAnswer('test2'));
    
    // Mostrar resultados
    stateManager.showResults();
    
    state = stateManager.getState();
    expect(state.displayMode).toBe(ProfessorModeDisplayMode.RESULTS);
    
    // Iniciar revisión
    stateManager.startReview();
    
    state = stateManager.getState();
    expect(state.displayMode).toBe(ProfessorModeDisplayMode.REVIEW);
    expect(state.currentProblemIndex).toBe(0);
  });

  test('debe guardar y cargar el estado correctamente', async () => {
    // Mock para storageService.load
    const { storageService } = require('../../infrastructure/StorageService');
    const savedState = {
      displayMode: ProfessorModeDisplayMode.PROBLEM,
      problems: [{ id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }],
      studentAnswers: [],
      currentProblemIndex: 0,
      settings: createTestSettings(),
      totalTime: 0
    };
    
    storageService.load.mockReturnValue(savedState);
    
    // Crear gestor de estado con auto-carga deshabilitada
    const settings = createTestSettings();
    const stateManager = new ProfessorModeStateManager(settings, {
      autoLoadLastState: false,
      autoSaveState: false
    });
    
    // Guardar estado
    await stateManager.saveState();
    
    // Verificar llamada a storageService.save
    expect(storageService.save).toHaveBeenCalledWith('professor_mode_state', expect.any(Object));
    
    // Cargar estado
    stateManager.loadState();
    
    // Verificar llamada a storageService.load
    expect(storageService.load).toHaveBeenCalledWith('professor_mode_state');
    
    // Verificar estado cargado
    const state = stateManager.getState();
    expect(state).toEqual(savedState);
  });

  test('debe soportar operaciones de deshacer/rehacer', () => {
    // Crear gestor de estado
    const settings = createTestSettings();
    const stateManager = new ProfessorModeStateManager(settings, {
      autoLoadLastState: false,
      autoSaveState: false
    });
    
    // Estado inicial
    const initialState = stateManager.getState();
    
    // Inicializar con problemas
    stateManager.dispatch({
      type: 'INIT_SESSION',
      payload: {
        settings,
        problems: [{ id: 'test1', operands: [1, 2], correctAnswer: 3, difficulty: DifficultyLevel.EASY, displayFormat: DisplayFormat.STANDARD, maxAttempts: 1, allowDecimals: false }]
      }
    });
    
    // Estado después de inicializar
    const stateWithProblems = stateManager.getState();
    
    // Enviar respuesta
    stateManager.submitAnswer(createTestAnswer('test1'));
    
    // Estado después de respuesta
    const stateWithAnswer = stateManager.getState();
    
    // Deshacer (volver a estado con problemas)
    const undoResult = stateManager.undo();
    
    // Verificar resultado y estado
    expect(undoResult).toBe(true);
    expect(stateManager.getState()).toEqual(stateWithProblems);
    
    // Deshacer otra vez (volver a estado inicial)
    stateManager.undo();
    expect(stateManager.getState()).toEqual(initialState);
    
    // No se puede deshacer más
    const undoAgainResult = stateManager.undo();
    expect(undoAgainResult).toBe(false);
    
    // Rehacer (volver a estado con problemas)
    const redoResult = stateManager.redo();
    expect(redoResult).toBe(true);
    expect(stateManager.getState()).toEqual(stateWithProblems);
    
    // Rehacer otra vez (volver a estado con respuesta)
    stateManager.redo();
    expect(stateManager.getState()).toEqual(stateWithAnswer);
    
    // No se puede rehacer más
    const redoAgainResult = stateManager.redo();
    expect(redoAgainResult).toBe(false);
  });
});