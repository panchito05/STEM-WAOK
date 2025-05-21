/**
 * Sistema de eventos para el Modo Profesor
 * Permite una mejor depuración y comunicación entre componentes
 */

// Tipos de eventos disponibles en el Modo Profesor
export type ProfessorModeEventType = 
  | 'problem:start'            // Inicio de un nuevo problema
  | 'problem:explanation'      // Mostrar explicación del profesor
  | 'problem:answered'         // Problema respondido por el estudiante
  | 'problem:revealed'         // Respuesta revelada
  | 'problem:skipped'          // Problema omitido
  | 'drawing:updated'          // Dibujo actualizado
  | 'exercise:finished'        // Ejercicio completado
  | 'problem:compensation'     // Se añadió un problema de compensación
  | 'settings:updated'         // Configuración actualizada
  | 'error';                   // Error en el sistema

// Estructura de eventos
export interface ProfessorModeEvent {
  type: ProfessorModeEventType;
  timestamp: number;
  payload?: any;
}

// Tipo para los oyentes de eventos
type EventListener = (event: ProfessorModeEvent) => void;

/**
 * Clase que implementa un sistema de eventos para el Modo Profesor
 */
class ProfessorModeEventSystem {
  private listeners: Map<ProfessorModeEventType, EventListener[]> = new Map();
  private eventLog: ProfessorModeEvent[] = [];
  private isLogEnabled: boolean = true;

  /**
   * Registra un oyente para un tipo de evento específico
   */
  subscribe(eventType: ProfessorModeEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const eventListeners = this.listeners.get(eventType) as EventListener[];
    eventListeners.push(listener);
    
    // Devuelve una función para cancelar la suscripción
    return () => {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Emite un evento para notificar a todos los oyentes registrados
   */
  emit(eventType: ProfessorModeEventType, payload?: any): void {
    const event: ProfessorModeEvent = {
      type: eventType,
      timestamp: Date.now(),
      payload
    };
    
    // Registrar el evento en el log
    if (this.isLogEnabled) {
      this.eventLog.push(event);
      console.log(`[PROFESOR-EVENTO] ${eventType}`, payload);
    }
    
    // Notificar a los oyentes específicos del evento
    const listeners = this.listeners.get(eventType);
    if (listeners && listeners.length > 0) {
      listeners.forEach(listener => listener(event));
    }
    
    // Notificar a los oyentes que escuchan todos los eventos
    const allListeners = this.listeners.get('*' as ProfessorModeEventType);
    if (allListeners && allListeners.length > 0) {
      allListeners.forEach(listener => listener(event));
    }
  }

  /**
   * Obtiene el historial de eventos
   */
  getEventLog(): ProfessorModeEvent[] {
    return [...this.eventLog];
  }

  /**
   * Habilita o deshabilita el registro de eventos
   */
  setLoggingEnabled(enabled: boolean): void {
    this.isLogEnabled = enabled;
  }

  /**
   * Limpia el historial de eventos
   */
  clearEventLog(): void {
    this.eventLog = [];
  }
}

// Exportar una única instancia para toda la aplicación
export const professorModeEvents = new ProfessorModeEventSystem();