import { ProfessorModeState, ProfessorStudentAnswer } from '../ProfessorModeTypes';
import { professorModeEvents } from './ProfessorModeEventSystem';

// Prefijo para las claves en localStorage
const STORAGE_PREFIX = 'math_waok_professor_';

// Tiempo máximo para considerar una sesión válida (en milisegundos)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Servicio para gestionar la persistencia de datos del Modo Profesor
 * - Guardado automático
 * - Recuperación de sesiones
 * - Exportación/importación de explicaciones
 */
export class ProfessorModeStorage {
  
  /**
   * Guarda el estado actual del modo profesor
   */
  saveState(state: ProfessorModeState): void {
    try {
      const sessionId = this.getCurrentSessionId() || this.createNewSessionId();
      
      // Guardar el estado completo
      localStorage.setItem(
        `${STORAGE_PREFIX}session_${sessionId}`,
        JSON.stringify({
          timestamp: Date.now(),
          state
        })
      );
      
      // Emitir evento de guardado exitoso
      professorModeEvents.emit('settings:updated', { 
        action: 'state_saved', 
        sessionId 
      });
    } catch (error) {
      console.error('Error al guardar el estado del modo profesor:', error);
      professorModeEvents.emit('error', { 
        message: 'Error al guardar la sesión',
        error
      });
    }
  }
  
  /**
   * Recupera el estado guardado del modo profesor
   */
  loadState(): ProfessorModeState | null {
    try {
      const sessionId = this.getCurrentSessionId();
      if (!sessionId) return null;
      
      const sessionData = localStorage.getItem(`${STORAGE_PREFIX}session_${sessionId}`);
      if (!sessionData) return null;
      
      const { timestamp, state } = JSON.parse(sessionData);
      
      // Verificar si la sesión ha caducado
      if (Date.now() - timestamp > SESSION_TIMEOUT) {
        this.clearCurrentSession();
        return null;
      }
      
      // Emitir evento de carga exitosa
      professorModeEvents.emit('settings:updated', { 
        action: 'state_loaded', 
        sessionId 
      });
      
      return state;
    } catch (error) {
      console.error('Error al cargar el estado del modo profesor:', error);
      professorModeEvents.emit('error', { 
        message: 'Error al cargar la sesión',
        error
      });
      return null;
    }
  }
  
  /**
   * Crea un nuevo ID de sesión y lo establece como actual
   */
  createNewSessionId(): string {
    const sessionId = `profesor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(`${STORAGE_PREFIX}current_session`, sessionId);
    return sessionId;
  }
  
  /**
   * Obtiene el ID de la sesión actual
   */
  getCurrentSessionId(): string | null {
    return localStorage.getItem(`${STORAGE_PREFIX}current_session`);
  }
  
  /**
   * Elimina la sesión actual
   */
  clearCurrentSession(): void {
    const sessionId = this.getCurrentSessionId();
    if (sessionId) {
      localStorage.removeItem(`${STORAGE_PREFIX}session_${sessionId}`);
      localStorage.removeItem(`${STORAGE_PREFIX}current_session`);
    }
  }
  
  /**
   * Guarda una explicación en el banco de explicaciones
   * para reutilizarla en futuras sesiones
   */
  saveExplanationToBank(
    problemType: string,
    difficulty: string,
    operands: number[],
    drawingData: string,
    title?: string
  ): string {
    try {
      // Crear un ID único para la explicación
      const explanationId = `explanation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Datos a guardar
      const explanationData = {
        id: explanationId,
        timestamp: Date.now(),
        problemType,
        difficulty,
        operands,
        drawingData,
        title: title || `${operands.join(' + ')} = ${operands.reduce((a, b) => a + b, 0)}`
      };
      
      // Obtener el banco de explicaciones actual
      const explanationBank = this.getExplanationBank();
      
      // Añadir la nueva explicación
      explanationBank.push(explanationData);
      
      // Guardar el banco actualizado
      localStorage.setItem(`${STORAGE_PREFIX}explanation_bank`, JSON.stringify(explanationBank));
      
      // Emitir evento de guardado exitoso
      professorModeEvents.emit('drawing:updated', { 
        action: 'saved_to_bank', 
        explanationId 
      });
      
      return explanationId;
    } catch (error) {
      console.error('Error al guardar explicación en el banco:', error);
      professorModeEvents.emit('error', { 
        message: 'Error al guardar explicación',
        error
      });
      return '';
    }
  }
  
  /**
   * Obtiene todas las explicaciones guardadas en el banco
   */
  getExplanationBank(): any[] {
    try {
      const bankData = localStorage.getItem(`${STORAGE_PREFIX}explanation_bank`);
      return bankData ? JSON.parse(bankData) : [];
    } catch (error) {
      console.error('Error al obtener el banco de explicaciones:', error);
      return [];
    }
  }
  
  /**
   * Busca explicaciones similares a un problema dado
   */
  findSimilarExplanations(operands: number[]): any[] {
    try {
      const bank = this.getExplanationBank();
      const result = operands.reduce((a, b) => a + b, 0);
      
      // Encontrar explicaciones para problemas con el mismo resultado
      return bank.filter(explanation => 
        explanation.operands.reduce((a: number, b: number) => a + b, 0) === result
      );
    } catch (error) {
      console.error('Error al buscar explicaciones similares:', error);
      return [];
    }
  }
  
  /**
   * Exporta todas las explicaciones a un archivo JSON
   */
  exportExplanations(): string {
    try {
      const explanations = this.getExplanationBank();
      return JSON.stringify(explanations);
    } catch (error) {
      console.error('Error al exportar explicaciones:', error);
      return '';
    }
  }
  
  /**
   * Importa explicaciones desde un archivo JSON
   */
  importExplanations(jsonData: string): boolean {
    try {
      const explanations = JSON.parse(jsonData);
      if (!Array.isArray(explanations)) return false;
      
      // Obtener el banco actual
      const currentBank = this.getExplanationBank();
      
      // Añadir las nuevas explicaciones, evitando duplicados por ID
      const existingIds = new Set(currentBank.map(e => e.id));
      const newExplanations = explanations.filter(e => !existingIds.has(e.id));
      
      // Guardar el banco combinado
      localStorage.setItem(
        `${STORAGE_PREFIX}explanation_bank`,
        JSON.stringify([...currentBank, ...newExplanations])
      );
      
      return true;
    } catch (error) {
      console.error('Error al importar explicaciones:', error);
      return false;
    }
  }
}

// Exportar una única instancia del servicio
export const professorModeStorage = new ProfessorModeStorage();