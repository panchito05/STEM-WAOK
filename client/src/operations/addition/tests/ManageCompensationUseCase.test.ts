import { manageCompensationUseCase } from '../application/ManageCompensationUseCase';
import { AdditionProblem, DifficultyLevel, DisplayFormat } from '../domain/AdditionProblem';
import { ProfessorModeSettings } from '../domain/AdditionSettings';
import { EventBus } from '../infrastructure/EventBus';

// Mock para EventBus para evitar dependencias
jest.mock('../infrastructure/EventBus', () => {
  return {
    eventBus: {
      emit: jest.fn()
    },
    EventBus: jest.fn().mockImplementation(() => ({
      emit: jest.fn()
    }))
  };
});

describe('ManageCompensationUseCase', () => {
  // Configuración para las pruebas
  const createTestSettings = (enableCompensation: boolean = true): ProfessorModeSettings => ({
    difficulty: DifficultyLevel.EASY,
    problemCount: 5,
    displayFormat: DisplayFormat.STANDARD,
    allowNegatives: false,
    allowDecimals: false,
    maxOperandValue: 20,
    enableCompensation,
    enableReview: true,
    enableExplanationBank: false
  });

  // Problema de muestra para pruebas
  const sampleProblem: AdditionProblem = {
    id: 'test-id-1',
    operands: [5, 7],
    correctAnswer: 12,
    difficulty: DifficultyLevel.EASY,
    displayFormat: DisplayFormat.STANDARD,
    maxAttempts: 1,
    allowDecimals: false
  };

  // Reset mocks después de cada test
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shouldAddCompensation - debe devolver true cuando la compensación está habilitada y la respuesta es incorrecta', () => {
    const settings = createTestSettings(true);
    const result = manageCompensationUseCase.shouldAddCompensation(settings, false);
    expect(result).toBe(true);
  });

  test('shouldAddCompensation - debe devolver false cuando la compensación está deshabilitada', () => {
    const settings = createTestSettings(false);
    const result = manageCompensationUseCase.shouldAddCompensation(settings, false);
    expect(result).toBe(false);
  });

  test('shouldAddCompensation - debe devolver false para respuestas correctas independientemente de la configuración', () => {
    const settings = createTestSettings(true);
    const result = manageCompensationUseCase.shouldAddCompensation(settings, true);
    expect(result).toBe(false);
  });

  test('shouldAddCompensation - debe devolver true para problemas omitidos o revelados', () => {
    const settings = createTestSettings(true);
    
    const skippedResult = manageCompensationUseCase.shouldAddCompensation(settings, false, 'skipped');
    expect(skippedResult).toBe(true);
    
    const revealedResult = manageCompensationUseCase.shouldAddCompensation(settings, false, 'revealed');
    expect(revealedResult).toBe(true);
  });

  test('generateCompensationProblem - debe generar un problema marcado como compensación', () => {
    const settings = createTestSettings(true);
    const currentProblems = [sampleProblem];
    
    const { newProblem, updatedProblems } = manageCompensationUseCase.generateCompensationProblem(
      settings, 
      currentProblems, 
      'incorrect_answer'
    );
    
    // Verificar propiedades del nuevo problema
    expect(newProblem.isCompensation).toBe(true);
    expect(newProblem.compensationReason).toBe('incorrect_answer');
    expect(newProblem.id).toBeDefined();
    
    // Verificar lista actualizada
    expect(updatedProblems.length).toBe(2);
    expect(updatedProblems[0]).toBe(sampleProblem);
    expect(updatedProblems[1]).toBe(newProblem);
  });

  test('generateCompensationProblem - debe lanzar error si la compensación está deshabilitada', () => {
    const settings = createTestSettings(false);
    const currentProblems = [sampleProblem];
    
    // Debe lanzar error
    expect(() => {
      manageCompensationUseCase.generateCompensationProblem(settings, currentProblems);
    }).toThrow('Compensation is not enabled in settings');
  });

  test('countCompensationProblems - debe contar correctamente los problemas de compensación', () => {
    // Crear una lista de problemas con algunos marcados como compensación
    const problems: AdditionProblem[] = [
      { ...sampleProblem, id: 'p1' },
      { ...sampleProblem, id: 'p2', isCompensation: true },
      { ...sampleProblem, id: 'p3' },
      { ...sampleProblem, id: 'p4', isCompensation: true },
      { ...sampleProblem, id: 'p5', isCompensation: true }
    ];
    
    const count = manageCompensationUseCase.countCompensationProblems(problems);
    expect(count).toBe(3);
  });

  test('countCompensationProblems - debe devolver 0 si no hay problemas de compensación', () => {
    const problems: AdditionProblem[] = [
      { ...sampleProblem, id: 'p1' },
      { ...sampleProblem, id: 'p2' },
      { ...sampleProblem, id: 'p3' }
    ];
    
    const count = manageCompensationUseCase.countCompensationProblems(problems);
    expect(count).toBe(0);
  });

  test('generateCompensationProblem - debe emitir evento cuando se genera un problema', () => {
    const settings = createTestSettings(true);
    const currentProblems = [sampleProblem];
    
    const { newProblem } = manageCompensationUseCase.generateCompensationProblem(
      settings, 
      currentProblems, 
      'skipped'
    );
    
    // Verificar que se emitió el evento
    expect(require('../infrastructure/EventBus').eventBus.emit).toHaveBeenCalledWith(
      'problem:compensation',
      expect.objectContaining({
        problemId: newProblem.id,
        reason: 'skipped',
        currentProblemCount: 2
      })
    );
  });
});