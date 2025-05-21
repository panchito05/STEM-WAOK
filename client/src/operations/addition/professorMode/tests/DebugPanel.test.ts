import { ProfessorModeDebugPanel } from '../infrastructure/DebugPanel';
import { ProfessorModeDisplayMode } from '../domain/ProfessorModeStateMachine';
import { stateManager } from '../application/ProfessorModeStateManager';
import { eventBus } from '../../infrastructure/EventBus';

// Mock para localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Mock para stateManager
jest.mock('../application/ProfessorModeStateManager', () => ({
  stateManager: {
    getState: jest.fn(),
    dispatch: jest.fn()
  }
}));

// Mock para eventBus
jest.mock('../../infrastructure/EventBus', () => ({
  eventBus: {
    emit: jest.fn(),
    on: jest.fn().mockReturnValue(() => {})
  }
}));

describe('ProfessorModeDebugPanel', () => {
  // Restablecer mocks antes de cada test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Asignar mock a window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Limpiar localStorage
    localStorageMock.clear();
  });

  test('debe activar y desactivar el panel correctamente', () => {
    const debugPanel = new ProfessorModeDebugPanel();
    
    // Activar
    debugPanel.enable();
    
    // Verificar notificación
    expect(eventBus.emit).toHaveBeenCalledWith(
      'professorMode:debugEnabled',
      expect.any(Object)
    );
    
    // Desactivar
    debugPanel.disable();
    
    // Verificar notificación
    expect(eventBus.emit).toHaveBeenCalledWith(
      'professorMode:debugDisabled',
      expect.any(Object)
    );
  });

  test('debe registrar acciones y manejar logs', () => {
    const debugPanel = new ProfessorModeDebugPanel({
      persistLogs: false
    });
    
    // Activar panel
    debugPanel.enable();
    
    // Simular evento de cambio de estado
    const mockHandler = (eventBus.on as jest.Mock).mock.calls.find(
      call => call[0] === 'professorMode:stateChanged'
    )[1];
    
    // Disparar handler simulando cambio de estado
    mockHandler({
      action: {
        type: 'TEST_ACTION',
        payload: { test: true }
      },
      previousState: { displayMode: ProfessorModeDisplayMode.PROBLEM },
      currentState: { displayMode: ProfessorModeDisplayMode.EXPLANATION }
    });
    
    // Verificar logs
    const logs = debugPanel.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].actionType).toBe('TEST_ACTION');
    
    // Limpiar logs
    debugPanel.clearLogs();
    
    // Verificar que se limpiaron
    expect(debugPanel.getLogs().length).toBe(0);
  });

  test('debe generar informe de estado', () => {
    const mockState = {
      displayMode: ProfessorModeDisplayMode.PROBLEM,
      problems: [
        { 
          id: 'test1', 
          operands: [5, 10], 
          correctAnswer: 15,
          difficulty: 'easy',
          displayFormat: 'standard',
          maxAttempts: 1,
          allowDecimals: false
        }
      ],
      studentAnswers: [
        { 
          problemId: 'test1', 
          userAnswer: 15, 
          isCorrect: true, 
          timestamp: Date.now(),
          showExplanation: false
        }
      ],
      currentProblemIndex: 0,
      settings: {
        difficulty: 'easy',
        displayFormat: 'standard',
        enableCompensation: true,
        enableReview: true,
        enableExplanationBank: false,
        problemCount: 5,
        allowNegatives: false,
        allowDecimals: false,
        maxOperandValue: 20
      },
      totalTime: 1000
    };
    
    // Configurar mock para obtener el estado
    (stateManager.getState as jest.Mock).mockReturnValue(mockState);
    
    const debugPanel = new ProfessorModeDebugPanel();
    
    // Generar informe
    const report = debugPanel.generateStateReport();
    
    // Verificar contenido del informe
    expect(report).toContain('INFORME DE ESTADO DEL MODO PROFESOR');
    expect(report).toContain('Modo de visualización: problem');
    expect(report).toContain('Total de problemas: 1');
    expect(report).toContain('Respuestas correctas: 1');
    expect(report).toContain('Tasa de éxito: 100%');
  });

  test('debe modificar el estado cuando está permitido', () => {
    const mockState = {
      displayMode: ProfessorModeDisplayMode.PROBLEM,
      currentProblemIndex: 0
    };
    
    (stateManager.getState as jest.Mock).mockReturnValue(mockState);
    
    const debugPanel = new ProfessorModeDebugPanel({
      allowStateManipulation: true
    });
    
    // Activar panel
    debugPanel.enable();
    
    // Modificar estado
    const result = debugPanel.modifyState({
      currentProblemIndex: 1
    });
    
    // Verificar resultado
    expect(result).toBe(true);
    
    // Verificar que se despachó una acción
    expect(stateManager.dispatch).toHaveBeenCalledWith({
      type: 'DEBUG_OVERRIDE_STATE',
      payload: {
        displayMode: ProfessorModeDisplayMode.PROBLEM,
        currentProblemIndex: 1
      }
    });
  });

  test('debe rechazar modificaciones si no están permitidas', () => {
    const debugPanel = new ProfessorModeDebugPanel({
      allowStateManipulation: false
    });
    
    // Activar panel
    debugPanel.enable();
    
    // Intentar modificar estado
    const result = debugPanel.modifyState({
      currentProblemIndex: 1
    });
    
    // Verificar resultado
    expect(result).toBe(false);
    
    // Verificar que no se despachó ninguna acción
    expect(stateManager.dispatch).not.toHaveBeenCalled();
  });

  test('debe guardar y cargar logs de localStorage', () => {
    // Crear panel que persista logs
    const debugPanel = new ProfessorModeDebugPanel({
      persistLogs: true,
      logStorageKey: 'test_log_key'
    });
    
    // Activar panel
    debugPanel.enable();
    
    // Simular evento de error
    const mockHandler = (eventBus.on as jest.Mock).mock.calls.find(
      call => call[0] === 'professorMode:error'
    )[1];
    
    // Disparar handler simulando error
    mockHandler({
      message: 'Test error',
      data: { code: 500 },
      timestamp: Date.now()
    });
    
    // Verificar que se guardaron logs
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test_log_key',
      expect.any(String)
    );
    
    // Crear nuevo panel para cargar logs
    (localStorageMock.getItem as jest.Mock).mockReturnValue(
      JSON.stringify([
        {
          id: 'log_123',
          timestamp: Date.now(),
          actionType: 'ERROR',
          details: { message: 'Test error', details: { code: 500 } }
        }
      ])
    );
    
    const newDebugPanel = new ProfessorModeDebugPanel({
      persistLogs: true,
      logStorageKey: 'test_log_key'
    });
    
    // Verificar que se cargaron logs
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test_log_key');
    expect(newDebugPanel.getLogs().length).toBe(1);
  });

  test('debe simular acciones correctamente', () => {
    const mockState = {
      displayMode: ProfessorModeDisplayMode.PROBLEM,
      currentProblemIndex: 0
    };
    
    (stateManager.getState as jest.Mock).mockReturnValue(mockState);
    
    // Requerimos implementar mockShowExplanation para verificar llamada
    const mockShowExplanation = jest.fn();
    (stateManager as any).showExplanation = mockShowExplanation;
    
    const debugPanel = new ProfessorModeDebugPanel({
      allowStateManipulation: true
    });
    
    // Activar panel
    debugPanel.enable();
    
    // Simular acción
    const result = debugPanel.simulateAction('SHOW_EXPLANATION', {
      explanationText: 'Test explanation'
    });
    
    // Verificar resultado
    expect(result).toBe(true);
    
    // Verificar que se llamó a showExplanation
    expect(mockShowExplanation).toHaveBeenCalledWith(
      'Test explanation',
      undefined
    );
  });
});