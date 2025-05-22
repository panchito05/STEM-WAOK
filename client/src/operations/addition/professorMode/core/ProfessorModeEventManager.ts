/**
 * Gestor de Eventos para el Modo Profesor
 * 
 * Este módulo implementa un sistema de eventos que permite
 * la comunicación desacoplada entre los distintos componentes
 * del Modo Profesor, mejorando la arquitectura y mantenibilidad.
 */

import { ProfessorModeEvents } from '../domain/ProfessorModeTypes';

type EventCallback = (data: any) => void;

/**
 * Gestor de eventos para permitir comunicación entre componentes
 * sin acoplamiento directo, implementando un patrón pub/sub.
 */
export class ProfessorModeEventManager {
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private debugMode: boolean = false;
  
  /**
   * Activa o desactiva el modo debug para registrar todos los eventos
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Suscribe una función callback a un tipo de evento específico
   */
  on<K extends keyof ProfessorModeEvents>(
    eventType: K, 
    callback: (data: ProfessorModeEvents[K]) => void
  ): () => void {
    if (!this.eventListeners.has(eventType as string)) {
      this.eventListeners.set(eventType as string, []);
    }
    
    const callbacks = this.eventListeners.get(eventType as string) || [];
    callbacks.push(callback as EventCallback);
    
    // Retornar función para cancelar la suscripción
    return () => {
      const updatedCallbacks = (this.eventListeners.get(eventType as string) || [])
        .filter(cb => cb !== callback);
      this.eventListeners.set(eventType as string, updatedCallbacks);
    };
  }
  
  /**
   * Emite un evento con datos específicos
   */
  emit<K extends keyof ProfessorModeEvents>(
    eventType: K, 
    data: ProfessorModeEvents[K]
  ): void {
    if (this.debugMode) {
      console.log(`[ProfessorModeEvents] Emitiendo evento "${eventType}"`, data);
    }
    
    const callbacks = this.eventListeners.get(eventType as string) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error al procesar evento "${eventType}":`, error);
      }
    });
  }
  
  /**
   * Elimina todos los listeners de un tipo de evento específico
   */
  removeAllListeners(eventType?: keyof ProfessorModeEvents): void {
    if (eventType) {
      this.eventListeners.delete(eventType as string);
    } else {
      this.eventListeners.clear();
    }
  }
}

// Exportar una instancia singleton para uso en toda la aplicación
export const professorModeEvents = new ProfessorModeEventManager();