import { 
  ProfessorModeState, 
  ProfessorModeDisplayMode, 
  ProfessorModeEvent,
  createInitialState,
  isValidState,
  canTransitionTo,
  calculateSessionStats
} from '../domain/ProfessorModeStateMachine';
import { AdditionProblem } from '../../domain/AdditionProblem';
import { ProfessorModeSettings } from '../../domain/AdditionSettings';
import { ProfessorStudentAnswer } from '../../domain/AdditionResult';
import { generateProblemUseCase } from '../../application/GenerateProblemUseCase';
import { manageCompensationUseCase } from '../../application/ManageCompensationUseCase';
import { eventBus } from '../../infrastructure/EventBus';
import { storageService } from '../../infrastructure/StorageService';

/**
 * Clave para almacenar el estado del modo profesor
 */
const STORAGE_KEY = 'professor_mode_state';

/**
 * Opciones para la creación del gestor de estado
 */
export interface StateManagerOptions {
  /**
   * Si se debe cargar automáticamente el estado anterior 
   */
  autoLoadLastState?: boolean;
  
  /**
   * Si se debe guardar automáticamente el estado en cada cambio
   */
  autoSaveState?: boolean;
  
  /**
   * Intervalo para guardar el estado (en ms)
   */
  autoSaveInterval?: number;
  
  /**
   * Si se deben registrar todas las transiciones de estado
   */
  enableStateLogging?: boolean;
  
  /**
   * Callback cuando el estado cambia
   */
  onStateChange?: (state: ProfessorModeState) => void;
}

/**
 * Acción para modificar el estado
 */
export interface StateAction {
  /**
   * Tipo de acción
   */
  type: string;
  
  /**
   * Datos para la acción
   */
  payload?: any;
}

/**
 * Gestor centralizado del estado para el Modo Profesor
 * Implementa un patrón mediador para gestionar todas las comunicaciones
 */
export class ProfessorModeStateManager {
  /**
   * Estado actual
   */
  private state: ProfessorModeState;
  
  /**
   * Historial de estados para deshacer/rehacer
   */
  private stateHistory: ProfessorModeState[] = [];
  
  /**
   * Posición actual en el historial
   */
  private historyPosition: number = -1;
  
  /**
   * ID del intervalo de auto-guardado
   */
  private autoSaveIntervalId?: NodeJS.Timeout;
  
  /**
   * Opciones de configuración
   */
  private options: Required<StateManagerOptions>;
  
  /**
   * Constructor
   */
  constructor(
    initialSettings: ProfessorModeSettings,
    options: StateManagerOptions = {}
  ) {
    // Opciones por defecto
    this.options = {
      autoLoadLastState: true,
      autoSaveState: true,
      autoSaveInterval: 30000, // 30 segundos
      enableStateLogging: false,
      onStateChange: () => {},
      ...options
    };
    
    // Crear estado inicial
    this.state = createInitialState(initialSettings);
    
    // Registrar eventos
    this.setupEventListeners();
    
    // Cargar estado anterior si está habilitado
    if (this.options.autoLoadLastState) {
      this.loadState();
    }
    
    // Configurar auto-guardado si está habilitado
    if (this.options.autoSaveState) {
      this.setupAutoSave();
    }
  }
  
  /**
   * Obtiene el estado actual
   */
  getState(): ProfessorModeState {
    return this.state;
  }
  
  /**
   * Despacha una acción para modificar el estado
   */
  dispatch(action: StateAction): void {
    // Crear copia del estado actual para el historial
    const previousState = { ...this.state };
    
    // Aplicar la acción
    const newState = this.reducer(this.state, action);
    
    // Verificar que el nuevo estado sea válido
    if (!isValidState(newState)) {
      this.logError(`Estado inválido después de acción ${action.type}`, {
        action,
        invalidState: newState
      });
      return;
    }
    
    // Actualizar estado
    this.state = newState;
    
    // Registro de cambio de estado si está habilitado
    if (this.options.enableStateLogging) {
      this.logStateTransition(previousState, newState, action);
    }
    
    // Guardar en historial
    this.addToHistory(newState);
    
    // Notificar cambio de estado
    this.options.onStateChange(newState);
    
    // Emitir evento de cambio de estado
    eventBus.emit('professorMode:stateChanged', {
      previousState,
      currentState: newState,
      action
    });
    
    // Guardar estado si auto-guardado está habilitado
    if (this.options.autoSaveState) {
      this.saveState();
    }
  }
  
  /**
   * Inicializa una nueva sesión con problemas
   */
  initSession(settings: ProfessorModeSettings, problemCount: number): void {
    // Generar problemas
    const problems = generateProblemUseCase.executeMultiple(settings, problemCount);
    
    // Actualizar estado
    this.dispatch({
      type: 'INIT_SESSION',
      payload: { settings, problems }
    });
  }
  
  /**
   * Registra una respuesta a un problema
   */
  submitAnswer(answer: ProfessorStudentAnswer): void {
    this.dispatch({
      type: 'SUBMIT_ANSWER',
      payload: { answer }
    });
    
    // Verificar si se necesita compensación
    const needsCompensation = manageCompensationUseCase.shouldAddCompensation(
      this.state.settings,
      answer.isCorrect
    );
    
    if (needsCompensation) {
      this.generateCompensation(answer.isCorrect ? undefined : 'incorrect_answer');
    }
  }
  
  /**
   * Genera un problema de compensación
   */
  generateCompensation(reason: string = 'generic'): void {
    try {
      const { newProblem, updatedProblems } = manageCompensationUseCase.generateCompensationProblem(
        this.state.settings,
        [...this.state.problems],
        reason
      );
      
      this.dispatch({
        type: 'ADD_COMPENSATION_PROBLEM',
        payload: { problem: newProblem, problems: updatedProblems }
      });
    } catch (error) {
      this.logError('Error al generar problema de compensación', { error, reason });
    }
  }
  
  /**
   * Cambia al modo de explicación
   */
  showExplanation(explanationText?: string, activeDrawing?: string): void {
    if (!canTransitionTo(this.state, ProfessorModeDisplayMode.EXPLANATION)) {
      this.logError('No se puede transicionar a modo explicación', {
        currentMode: this.state.displayMode
      });
      return;
    }
    
    this.dispatch({
      type: 'SHOW_EXPLANATION',
      payload: { explanationText, activeDrawing }
    });
  }
  
  /**
   * Cambia al siguiente problema
   */
  nextProblem(): void {
    const nextIndex = this.state.currentProblemIndex + 1;
    
    // Verificar si hay más problemas
    if (nextIndex >= this.state.problems.length) {
      // Si no hay más problemas, mostrar resultados
      if (canTransitionTo(this.state, ProfessorModeDisplayMode.RESULTS)) {
        this.showResults();
      } else {
        this.logError('No hay más problemas y no se puede mostrar resultados');
      }
      return;
    }
    
    this.dispatch({
      type: 'NEXT_PROBLEM',
      payload: { index: nextIndex }
    });
  }
  
  /**
   * Cambia al problema anterior
   */
  previousProblem(): void {
    const prevIndex = this.state.currentProblemIndex - 1;
    
    // Verificar si hay problemas anteriores
    if (prevIndex < 0) {
      this.logError('No hay problemas anteriores');
      return;
    }
    
    this.dispatch({
      type: 'PREVIOUS_PROBLEM',
      payload: { index: prevIndex }
    });
  }
  
  /**
   * Muestra la pantalla de resultados
   */
  showResults(): void {
    if (!canTransitionTo(this.state, ProfessorModeDisplayMode.RESULTS)) {
      this.logError('No se puede transicionar a modo resultados', {
        currentMode: this.state.displayMode
      });
      return;
    }
    
    // Calcular estadísticas
    const statistics = calculateSessionStats(this.state);
    
    this.dispatch({
      type: 'SHOW_RESULTS',
      payload: { statistics }
    });
  }
  
  /**
   * Inicia modo de revisión
   */
  startReview(): void {
    if (!canTransitionTo(this.state, ProfessorModeDisplayMode.REVIEW)) {
      this.logError('No se puede transicionar a modo revisión', {
        currentMode: this.state.displayMode
      });
      return;
    }
    
    this.dispatch({
      type: 'START_REVIEW',
      payload: { index: 0 }
    });
  }
  
  /**
   * Termina la sesión actual
   */
  endSession(): void {
    // Guardar historial de sesión antes de terminar
    this.saveSessionHistory();
    
    // Crear nuevo estado inicial
    const newState = createInitialState(this.state.settings);
    
    // Reemplazar estado actual
    this.state = newState;
    this.clearHistory();
    
    // Notificar cambio
    this.options.onStateChange(newState);
    
    // Emitir evento
    eventBus.emit('professorMode:sessionEnded', {
      finalState: this.state
    });
  }
  
  /**
   * Deshace la última acción
   */
  undo(): boolean {
    if (this.historyPosition <= 0) {
      return false;
    }
    
    this.historyPosition--;
    this.state = this.stateHistory[this.historyPosition];
    
    // Notificar cambio
    this.options.onStateChange(this.state);
    
    // Emitir evento
    eventBus.emit('professorMode:stateChanged', {
      currentState: this.state,
      action: { type: 'UNDO' }
    });
    
    return true;
  }
  
  /**
   * Rehace la última acción deshecha
   */
  redo(): boolean {
    if (this.historyPosition >= this.stateHistory.length - 1) {
      return false;
    }
    
    this.historyPosition++;
    this.state = this.stateHistory[this.historyPosition];
    
    // Notificar cambio
    this.options.onStateChange(this.state);
    
    // Emitir evento
    eventBus.emit('professorMode:stateChanged', {
      currentState: this.state,
      action: { type: 'REDO' }
    });
    
    return true;
  }
  
  /**
   * Guarda el estado actual
   */
  saveState(): Promise<boolean> {
    return storageService.save(STORAGE_KEY, this.state);
  }
  
  /**
   * Carga el estado anterior
   */
  loadState(): void {
    try {
      const savedState = storageService.load<ProfessorModeState>(STORAGE_KEY);
      
      if (savedState && isValidState(savedState)) {
        this.state = savedState;
        this.clearHistory();
        this.addToHistory(savedState);
        
        // Notificar cambio
        this.options.onStateChange(this.state);
        
        // Emitir evento
        eventBus.emit('professorMode:stateLoaded', {
          loadedState: this.state
        });
      }
    } catch (error) {
      this.logError('Error al cargar estado anterior', { error });
    }
  }
  
  /**
   * Limpia todos los datos del modo profesor
   */
  clearAllData(): Promise<boolean> {
    // Eliminar estado guardado
    const removePromise = storageService.remove(STORAGE_KEY);
    
    // Reiniciar estado
    this.state = createInitialState(this.state.settings);
    this.clearHistory();
    
    // Notificar cambio
    this.options.onStateChange(this.state);
    
    // Emitir evento
    eventBus.emit('professorMode:dataCleared');
    
    return removePromise;
  }
  
  /**
   * Exporta todos los datos como JSON
   */
  exportData(): string {
    const exportData = {
      currentState: this.state,
      history: this.stateHistory,
      timestamp: Date.now()
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Importa datos desde JSON
   */
  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData);
      
      if (importedData.currentState && isValidState(importedData.currentState)) {
        this.state = importedData.currentState;
        
        if (Array.isArray(importedData.history)) {
          this.stateHistory = importedData.history.filter(state => isValidState(state));
          this.historyPosition = this.stateHistory.length - 1;
        } else {
          this.clearHistory();
          this.addToHistory(this.state);
        }
        
        // Notificar cambio
        this.options.onStateChange(this.state);
        
        // Emitir evento
        eventBus.emit('professorMode:dataImported', {
          importedState: this.state
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      this.logError('Error al importar datos', { error });
      return false;
    }
  }
  
  /**
   * Configura los escuchas de eventos
   */
  private setupEventListeners(): void {
    // Escuchar eventos globales que puedan afectar al estado
    eventBus.on('storage:error', (data) => {
      if (data.metadata?.key === STORAGE_KEY) {
        this.logError('Error de almacenamiento', data);
      }
    });
  }
  
  /**
   * Configura el auto-guardado
   */
  private setupAutoSave(): void {
    // Limpiar intervalo anterior si existe
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId);
    }
    
    // Configurar nuevo intervalo
    this.autoSaveIntervalId = setInterval(() => {
      this.saveState();
    }, this.options.autoSaveInterval);
  }
  
  /**
   * Guarda el historial de sesión para análisis posterior
   */
  private saveSessionHistory(): Promise<boolean> {
    const sessionData = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      settings: this.state.settings,
      problems: this.state.problems,
      answers: this.state.studentAnswers,
      statistics: calculateSessionStats(this.state),
      totalTime: this.state.totalTime
    };
    
    return storageService.save(`professor_session_${sessionData.id}`, sessionData);
  }
  
  /**
   * Agrega un estado al historial
   */
  private addToHistory(state: ProfessorModeState): void {
    // Si estamos en medio del historial, eliminar estados futuros
    if (this.historyPosition < this.stateHistory.length - 1) {
      this.stateHistory = this.stateHistory.slice(0, this.historyPosition + 1);
    }
    
    // Agregar estado al historial
    this.stateHistory.push({ ...state });
    this.historyPosition = this.stateHistory.length - 1;
    
    // Limitar tamaño del historial (mantener últimos 50 estados)
    const maxHistorySize = 50;
    if (this.stateHistory.length > maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-maxHistorySize);
      this.historyPosition = this.stateHistory.length - 1;
    }
  }
  
  /**
   * Limpia el historial de estados
   */
  private clearHistory(): void {
    this.stateHistory = [];
    this.historyPosition = -1;
  }
  
  /**
   * Función reductora para aplicar acciones al estado
   */
  private reducer(state: ProfessorModeState, action: StateAction): ProfessorModeState {
    switch (action.type) {
      case 'INIT_SESSION':
        return {
          ...state,
          displayMode: ProfessorModeDisplayMode.PROBLEM,
          problems: action.payload.problems,
          studentAnswers: [],
          currentProblemIndex: 0,
          settings: action.payload.settings,
          totalTime: 0
        };
      
      case 'SUBMIT_ANSWER':
        return {
          ...state,
          studentAnswers: [...state.studentAnswers, action.payload.answer]
        };
      
      case 'ADD_COMPENSATION_PROBLEM':
        return {
          ...state,
          problems: action.payload.problems
        };
      
      case 'SHOW_EXPLANATION':
        return {
          ...state,
          displayMode: ProfessorModeDisplayMode.EXPLANATION,
          explanationText: action.payload.explanationText,
          activeDrawing: action.payload.activeDrawing
        };
      
      case 'NEXT_PROBLEM':
        return {
          ...state,
          displayMode: ProfessorModeDisplayMode.PROBLEM,
          currentProblemIndex: action.payload.index
        };
      
      case 'PREVIOUS_PROBLEM':
        return {
          ...state,
          displayMode: ProfessorModeDisplayMode.PROBLEM,
          currentProblemIndex: action.payload.index
        };
      
      case 'SHOW_RESULTS':
        return {
          ...state,
          displayMode: ProfessorModeDisplayMode.RESULTS,
          statistics: action.payload.statistics
        };
      
      case 'START_REVIEW':
        return {
          ...state,
          displayMode: ProfessorModeDisplayMode.REVIEW,
          currentProblemIndex: action.payload.index
        };
      
      case 'UPDATE_TOTAL_TIME':
        return {
          ...state,
          totalTime: action.payload.totalTime
        };
      
      default:
        return state;
    }
  }
  
  /**
   * Registra una transición de estado
   */
  private logStateTransition(
    previousState: ProfessorModeState,
    newState: ProfessorModeState,
    action: StateAction
  ): void {
    console.group('Estado Modo Profesor: Transición');
    console.log('Acción:', action.type);
    console.log('Estado anterior:', previousState);
    console.log('Nuevo estado:', newState);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
  
  /**
   * Registra un error
   */
  private logError(message: string, data?: any): void {
    console.error(`Error Modo Profesor: ${message}`, data);
    
    // Emitir evento de error
    eventBus.emit('professorMode:error', {
      message,
      data,
      timestamp: Date.now()
    });
  }
}

// Exportar instancia única del gestor de estado
export const stateManager = new ProfessorModeStateManager({
  difficulty: 'easy',
  problemCount: 5,
  displayFormat: 'standard',
  allowNegatives: false,
  allowDecimals: false,
  maxOperandValue: 20,
  enableCompensation: true,
  enableReview: true,
  enableExplanationBank: false
} as ProfessorModeSettings);