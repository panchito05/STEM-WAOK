import { ProfessorModeState, ProfessorModeDisplayMode } from '../domain/ProfessorModeStateMachine';
import { eventBus } from '../../infrastructure/EventBus';
import { stateManager } from '../application/ProfessorModeStateManager';

/**
 * Interfaz para registros de acciones del Modo Profesor
 */
interface ActionLog {
  id: string;
  timestamp: number;
  actionType: string;
  details: any;
  stateBeforeAction?: ProfessorModeState;
  stateAfterAction?: ProfessorModeState;
}

/**
 * Opciones de configuración para el panel de depuración
 */
interface DebugPanelOptions {
  maxLogEntries?: number;
  captureStateWithLogs?: boolean;
  persistLogs?: boolean;
  allowStateManipulation?: boolean;
  logStorageKey?: string;
}

/**
 * Panel de depuración para el Modo Profesor
 * Permite monitorear y manipular el estado en tiempo real
 */
export class ProfessorModeDebugPanel {
  /**
   * Registro de acciones realizadas
   */
  private actionLogs: ActionLog[] = [];
  
  /**
   * Si el panel está activado
   */
  private enabled: boolean = false;
  
  /**
   * Opciones de configuración
   */
  private options: Required<DebugPanelOptions>;
  
  /**
   * Constructor
   */
  constructor(options: DebugPanelOptions = {}) {
    // Opciones por defecto
    this.options = {
      maxLogEntries: 100,
      captureStateWithLogs: true,
      persistLogs: true,
      allowStateManipulation: true,
      logStorageKey: 'professor_mode_debug_logs',
      ...options
    };
    
    // Registrar escuchas de eventos
    this.setupEventListeners();
    
    // Cargar registros anteriores si está habilitado
    if (this.options.persistLogs) {
      this.loadLogs();
    }
  }
  
  /**
   * Activa el panel de depuración
   */
  enable(): void {
    this.enabled = true;
    console.log('Panel de depuración del Modo Profesor activado');
    
    // Notificar a otros componentes
    eventBus.emit('professorMode:debugEnabled', {
      timestamp: Date.now()
    });
  }
  
  /**
   * Desactiva el panel de depuración
   */
  disable(): void {
    this.enabled = false;
    console.log('Panel de depuración del Modo Profesor desactivado');
    
    // Notificar a otros componentes
    eventBus.emit('professorMode:debugDisabled', {
      timestamp: Date.now()
    });
  }
  
  /**
   * Obtiene los registros de acciones
   */
  getLogs(): ActionLog[] {
    return [...this.actionLogs];
  }
  
  /**
   * Limpia los registros de acciones
   */
  clearLogs(): void {
    this.actionLogs = [];
    
    // Si está habilitado, guardar logs
    if (this.options.persistLogs) {
      this.saveLogs();
    }
    
    console.log('Registros de depuración limpiados');
  }
  
  /**
   * Exporta los registros como JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.actionLogs, null, 2);
  }
  
  /**
   * Obtiene un snapshot del estado actual
   */
  getStateSnapshot(): ProfessorModeState {
    return stateManager.getState();
  }
  
  /**
   * Modifica el estado manualmente
   */
  modifyState(stateUpdates: Partial<ProfessorModeState>): boolean {
    if (!this.options.allowStateManipulation) {
      console.warn('Manipulación de estado deshabilitada en el panel de depuración');
      return false;
    }
    
    try {
      // Obtener estado actual
      const currentState = stateManager.getState();
      
      // Crear nuevo estado con las actualizaciones
      const updatedState = { ...currentState, ...stateUpdates };
      
      // Enviar acción para modificar estado
      stateManager.dispatch({
        type: 'DEBUG_OVERRIDE_STATE',
        payload: updatedState
      });
      
      console.log('Estado modificado manualmente:', stateUpdates);
      
      // Agregar registro
      this.addLog('DEBUG_OVERRIDE_STATE', stateUpdates, currentState, updatedState);
      
      return true;
    } catch (error) {
      console.error('Error al modificar estado:', error);
      return false;
    }
  }
  
  /**
   * Simula una acción de usuario
   */
  simulateAction(actionType: string, payload?: any): boolean {
    if (!this.options.allowStateManipulation) {
      console.warn('Simulación de acciones deshabilitada en el panel de depuración');
      return false;
    }
    
    try {
      // Obtener estado antes de la acción
      const stateBefore = stateManager.getState();
      
      // Ejecutar acción según tipo
      switch (actionType) {
        case 'SUBMIT_ANSWER':
          if (!payload?.answer) {
            throw new Error('Se requiere una respuesta para simular SUBMIT_ANSWER');
          }
          stateManager.submitAnswer(payload.answer);
          break;
          
        case 'NEXT_PROBLEM':
          stateManager.nextProblem();
          break;
          
        case 'PREVIOUS_PROBLEM':
          stateManager.previousProblem();
          break;
          
        case 'SHOW_EXPLANATION':
          stateManager.showExplanation(payload?.explanationText, payload?.activeDrawing);
          break;
          
        case 'SHOW_RESULTS':
          stateManager.showResults();
          break;
          
        case 'START_REVIEW':
          stateManager.startReview();
          break;
          
        default:
          // Despachar acción directamente
          stateManager.dispatch({
            type: actionType,
            payload
          });
      }
      
      // Obtener estado después de la acción
      const stateAfter = stateManager.getState();
      
      console.log(`Acción simulada: ${actionType}`, payload);
      
      // Agregar registro
      this.addLog(actionType, payload, stateBefore, stateAfter);
      
      return true;
    } catch (error) {
      console.error(`Error al simular acción ${actionType}:`, error);
      return false;
    }
  }
  
  /**
   * Restaura un estado anterior
   */
  restoreState(state: ProfessorModeState): boolean {
    if (!this.options.allowStateManipulation) {
      console.warn('Restauración de estado deshabilitada en el panel de depuración');
      return false;
    }
    
    try {
      // Obtener estado actual
      const currentState = stateManager.getState();
      
      // Despachar acción para restaurar estado
      stateManager.dispatch({
        type: 'DEBUG_RESTORE_STATE',
        payload: state
      });
      
      console.log('Estado restaurado:', state);
      
      // Agregar registro
      this.addLog('DEBUG_RESTORE_STATE', { restoredState: state }, currentState, state);
      
      return true;
    } catch (error) {
      console.error('Error al restaurar estado:', error);
      return false;
    }
  }
  
  /**
   * Genera un informe detallado del estado actual
   */
  generateStateReport(): string {
    const state = stateManager.getState();
    
    // Calcular estadísticas
    const problemCount = state.problems.length;
    const answerCount = state.studentAnswers.length;
    const correctAnswers = state.studentAnswers.filter(a => a.isCorrect).length;
    const incorrectAnswers = answerCount - correctAnswers;
    const compensationProblems = state.problems.filter(p => (p as any).isCompensation).length;
    
    // Crear informe
    const report = `
INFORME DE ESTADO DEL MODO PROFESOR
===================================
Generado: ${new Date().toISOString()}

Información General:
-------------------
Modo de visualización: ${state.displayMode}
Índice de problema actual: ${state.currentProblemIndex}
Tiempo total: ${state.totalTime}ms

Configuración:
-------------
Dificultad: ${state.settings.difficulty}
Formato de visualización: ${state.settings.displayFormat}
Compensación habilitada: ${state.settings.enableCompensation ? 'Sí' : 'No'}
Revisión habilitada: ${state.settings.enableReview ? 'Sí' : 'No'}
Banco de explicaciones habilitado: ${state.settings.enableExplanationBank ? 'Sí' : 'No'}

Estadísticas:
------------
Total de problemas: ${problemCount}
Problemas de compensación: ${compensationProblems}
Total de respuestas: ${answerCount}
Respuestas correctas: ${correctAnswers}
Respuestas incorrectas: ${incorrectAnswers}
Tasa de éxito: ${answerCount > 0 ? Math.round((correctAnswers / answerCount) * 100) : 0}%

Estado de la sesión:
-------------------
${problemCount === 0 ? 'No hay problemas cargados' : 
  `Problema actual: ${state.currentProblemIndex + 1} de ${problemCount}
  ID: ${state.problems[state.currentProblemIndex].id}
  Operandos: ${state.problems[state.currentProblemIndex].operands.join(' + ')}
  Respuesta correcta: ${state.problems[state.currentProblemIndex].correctAnswer}`}

${answerCount === 0 ? 'No hay respuestas registradas' : 
  `Última respuesta: 
  Problema: ${state.studentAnswers[answerCount - 1].problemId}
  Respuesta: ${state.studentAnswers[answerCount - 1].userAnswer}
  Correcta: ${state.studentAnswers[answerCount - 1].isCorrect ? 'Sí' : 'No'}`}
`;
    
    return report;
  }
  
  /**
   * Configura escuchas de eventos
   */
  private setupEventListeners(): void {
    // Escuchar cambios de estado
    eventBus.on('professorMode:stateChanged', (data) => {
      if (!this.enabled) return;
      
      this.addLog(
        data.action.type,
        data.action.payload,
        data.previousState,
        data.currentState
      );
    });
    
    // Escuchar errores
    eventBus.on('professorMode:error', (data) => {
      if (!this.enabled) return;
      
      this.addLog(
        'ERROR',
        {
          message: data.message,
          details: data.data
        }
      );
    });
  }
  
  /**
   * Agrega un registro de acción
   */
  private addLog(
    actionType: string,
    details: any,
    stateBeforeAction?: ProfessorModeState,
    stateAfterAction?: ProfessorModeState
  ): void {
    // Crear registro
    const log: ActionLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      actionType,
      details
    };
    
    // Agregar estados si está habilitado
    if (this.options.captureStateWithLogs) {
      log.stateBeforeAction = stateBeforeAction;
      log.stateAfterAction = stateAfterAction;
    }
    
    // Agregar al inicio de la lista (más recientes primero)
    this.actionLogs.unshift(log);
    
    // Limitar tamaño de logs
    if (this.actionLogs.length > this.options.maxLogEntries) {
      this.actionLogs = this.actionLogs.slice(0, this.options.maxLogEntries);
    }
    
    // Si está habilitado, guardar logs
    if (this.options.persistLogs) {
      this.saveLogs();
    }
  }
  
  /**
   * Guarda los registros en localStorage
   */
  private saveLogs(): void {
    try {
      // Si incluimos el estado completo, los logs pueden ser muy grandes
      // Crear una versión ligera para almacenar
      const logsToSave = this.options.captureStateWithLogs
        ? this.actionLogs.map(({ id, timestamp, actionType, details }) => ({
            id, timestamp, actionType, details
          }))
        : this.actionLogs;
      
      localStorage.setItem(
        this.options.logStorageKey,
        JSON.stringify(logsToSave)
      );
    } catch (error) {
      console.error('Error al guardar registros de depuración:', error);
    }
  }
  
  /**
   * Carga registros anteriores desde localStorage
   */
  private loadLogs(): void {
    try {
      const savedLogs = localStorage.getItem(this.options.logStorageKey);
      
      if (savedLogs) {
        this.actionLogs = JSON.parse(savedLogs);
        console.log(`${this.actionLogs.length} registros de depuración cargados`);
      }
    } catch (error) {
      console.error('Error al cargar registros de depuración:', error);
      // Inicializar con array vacío en caso de error
      this.actionLogs = [];
    }
  }
}

// Exportar una instancia única del panel de depuración
export const debugPanel = new ProfessorModeDebugPanel();