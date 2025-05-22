/**
 * Gestor de Eventos para el Modo Profesor
 * 
 * Implementa un sistema de publicación/suscripción (pub/sub) que facilita
 * la comunicación desacoplada entre componentes del Modo Profesor.
 * 
 * @author Equipo de Desarrollo Math-W-A-O-K
 * @version 2.0.0
 */

import { ProfessorModeEvents } from "../domain/ProfessorModeTypes";

/**
 * Tipo para los manejadores de eventos específicos
 */
type EventHandler<K extends keyof ProfessorModeEvents> = (data: ProfessorModeEvents[K]) => void;

/**
 * Implementación del gestor de eventos para el Modo Profesor
 */
export class ProfessorModeEventManager {
  /**
   * Versión del componente para diagnóstico
   */
  static readonly VERSION = "2.0.0";
  
  /**
   * Mapa de suscriptores a eventos
   */
  private static subscribers = new Map<
    keyof ProfessorModeEvents,
    Set<EventHandler<any>>
  >();
  
  /**
   * Registro cronológico de eventos para diagnóstico
   */
  private static eventLog: Array<{
    event: keyof ProfessorModeEvents;
    data: any;
    timestamp: number;
  }> = [];
  
  /**
   * Número máximo de eventos a mantener en el registro
   */
  private static readonly MAX_EVENT_LOG_SIZE = 100;
  
  /**
   * Suscribe un manejador a un tipo de evento específico
   */
  static subscribe<K extends keyof ProfessorModeEvents>(
    event: K,
    handler: EventHandler<K>
  ): () => void {
    // Obtener o crear el conjunto de manejadores para este evento
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    // Añadir el manejador al conjunto
    const handlers = this.subscribers.get(event)!;
    handlers.add(handler as EventHandler<any>);
    
    // Retornar función para cancelar suscripción
    return () => {
      handlers.delete(handler as EventHandler<any>);
      if (handlers.size === 0) {
        this.subscribers.delete(event);
      }
    };
  }
  
  /**
   * Publica un evento con datos asociados a todos los suscriptores
   */
  static publish<K extends keyof ProfessorModeEvents>(
    event: K,
    data: ProfessorModeEvents[K]
  ): void {
    // Registrar evento para diagnóstico
    this.logEvent(event, data);
    
    // Verificar si hay suscriptores para este evento
    if (!this.subscribers.has(event)) {
      return;
    }
    
    // Notificar a todos los suscriptores
    const handlers = this.subscribers.get(event)!;
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`❌ Error al manejar evento ${String(event)}:`, error);
      }
    });
  }
  
  /**
   * Registra un evento en el log cronológico
   */
  private static logEvent<K extends keyof ProfessorModeEvents>(
    event: K,
    data: ProfessorModeEvents[K]
  ): void {
    // Añadir evento al registro
    this.eventLog.push({
      event,
      data,
      timestamp: Date.now()
    });
    
    // Limitar tamaño del registro
    if (this.eventLog.length > this.MAX_EVENT_LOG_SIZE) {
      this.eventLog = this.eventLog.slice(-this.MAX_EVENT_LOG_SIZE);
    }
  }
  
  /**
   * Obtiene el registro de eventos para diagnóstico
   */
  static getEventLog(): Array<{
    event: keyof ProfessorModeEvents;
    data: any;
    timestamp: number;
  }> {
    return [...this.eventLog];
  }
  
  /**
   * Limpia todas las suscripciones
   */
  static clearAllSubscriptions(): void {
    this.subscribers.clear();
  }
  
  /**
   * Devuelve estadísticas de los eventos actuales
   */
  static getStats(): {
    eventTypes: string[];
    subscriberCounts: Record<string, number>;
    totalEvents: number;
  } {
    const eventTypes = Array.from(this.subscribers.keys()).map(String);
    
    const subscriberCounts: Record<string, number> = {};
    this.subscribers.forEach((handlers, event) => {
      subscriberCounts[String(event)] = handlers.size;
    });
    
    return {
      eventTypes,
      subscriberCounts,
      totalEvents: this.eventLog.length
    };
  }
}