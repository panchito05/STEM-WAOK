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
   * Guarda el estado actual del modo profesor con mecanismo de reintentos
   * @param state Estado a guardar
   * @param retryOptions Opciones de reintento
   * @returns Promise que se resuelve cuando el guardado se completa o falla definitivamente
   */
  saveState(
    state: ProfessorModeState, 
    retryOptions: { maxAttempts?: number, delayMs?: number } = {}
  ): Promise<boolean> {
    const { maxAttempts = 3, delayMs = 1000 } = retryOptions;
    
    // Implementar función de reintento recursiva
    const attemptSave = async (remainingAttempts: number, delay: number): Promise<boolean> => {
      try {
        const sessionId = this.getCurrentSessionId() || this.createNewSessionId();
        
        // Verificar si hay espacio disponible en localStorage
        if (!this.hasEnoughStorageSpace(state)) {
          // Si no hay espacio, intentar limpiar datos antiguos
          this.cleanupOldSessions();
          
          // Verificar nuevamente después de la limpieza
          if (!this.hasEnoughStorageSpace(state)) {
            throw new Error('Not enough storage space available');
          }
        }
        
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
        
        return true;
      } catch (error) {
        console.error(`Error al guardar el estado (intento ${maxAttempts - remainingAttempts + 1}/${maxAttempts}):`, error);
        
        // Si quedan intentos, reintentar después de un delay
        if (remainingAttempts > 1) {
          // Emitir evento de reintento
          professorModeEvents.emit('settings:updated', { 
            action: 'save_retry', 
            remainingAttempts: remainingAttempts - 1
          });
          
          // Esperar antes de reintentar con backoff exponencial
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptSave(remainingAttempts - 1, delay * 1.5);
        }
        
        // Si ya no quedan intentos, emitir evento de error
        professorModeEvents.emit('error', { 
          message: 'Error al guardar la sesión después de múltiples intentos',
          error
        });
        
        return false;
      }
    };
    
    // Iniciar el proceso de reintento y devolver la promesa
    return attemptSave(maxAttempts, delayMs);
  }
  
  /**
   * Comprueba si hay suficiente espacio en localStorage para guardar el estado
   */
  private hasEnoughStorageSpace(state: ProfessorModeState): boolean {
    try {
      // Estimar el tamaño del estado serializado (aproximado)
      const serializedState = JSON.stringify({
        timestamp: Date.now(),
        state
      });
      
      // Calcular espacio aproximado requerido en bytes (añadiendo un margen)
      const requiredSpace = serializedState.length * 2;
      
      // Verificar espacio disponible (estimación)
      const testKey = `${STORAGE_PREFIX}space_test_${Date.now()}`;
      const testValue = 'A'.repeat(requiredSpace);
      
      try {
        localStorage.setItem(testKey, testValue);
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    } catch (e) {
      console.error('Error al verificar espacio disponible:', e);
      return false;
    }
  }
  
  /**
   * Limpia sesiones antiguas para liberar espacio
   */
  private cleanupOldSessions(): void {
    try {
      // Recopilar todas las claves de sesión
      const sessionKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${STORAGE_PREFIX}session_`)) {
          sessionKeys.push(key);
        }
      }
      
      // Si hay menos de 2 sesiones, no eliminar nada
      if (sessionKeys.length < 2) return;
      
      // Ordenar por antigüedad (basado en timestamp en el nombre o en los datos)
      sessionKeys.sort((a, b) => {
        try {
          const dataA = JSON.parse(localStorage.getItem(a) || '{}');
          const dataB = JSON.parse(localStorage.getItem(b) || '{}');
          return (dataA.timestamp || 0) - (dataB.timestamp || 0);
        } catch {
          // Si hay error al parsear, ordenar por nombre de clave
          return a.localeCompare(b);
        }
      });
      
      // Eliminar las sesiones más antiguas (dejar solo la más reciente)
      for (let i = 0; i < sessionKeys.length - 1; i++) {
        localStorage.removeItem(sessionKeys[i]);
      }
      
      // Emitir evento de limpieza
      professorModeEvents.emit('settings:updated', { 
        action: 'old_sessions_cleaned', 
        count: sessionKeys.length - 1
      });
    } catch (e) {
      console.error('Error al limpiar sesiones antiguas:', e);
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