/**
 * Tipo para funciones de escucha de eventos
 */
type EventListener = (data: any) => void;

/**
 * Implementación de un bus de eventos simple y tipado
 */
export class EventBus {
  // Mapa de eventos y sus escuchas
  private listeners: Map<string, EventListener[]> = new Map();

  /**
   * Emite un evento a todos los escuchas registrados
   * @param eventName Nombre del evento
   * @param data Datos adicionales del evento
   */
  emit(eventName: string, data: any = {}): void {
    const eventListeners = this.listeners.get(eventName);
    
    if (eventListeners && eventListeners.length > 0) {
      // Notificar a todos los escuchas
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error en escucha de evento '${eventName}':`, error);
        }
      });
    }
    
    // También emitir al escucha global '*' si existe
    const globalListeners = this.listeners.get('*');
    if (globalListeners && globalListeners.length > 0) {
      globalListeners.forEach(listener => {
        try {
          listener({ event: eventName, data });
        } catch (error) {
          console.error(`Error en escucha global para evento '${eventName}':`, error);
        }
      });
    }
  }

  /**
   * Registra un escucha para un evento específico
   * @param eventName Nombre del evento o '*' para todos
   * @param listener Función a ejecutar cuando ocurra el evento
   * @returns Función para eliminar el escucha
   */
  on(eventName: string, listener: EventListener): () => void {
    // Obtener lista de escuchas existente o crear una nueva
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    // Añadir nuevo escucha
    const eventListeners = this.listeners.get(eventName)!;
    eventListeners.push(listener);
    
    // Devolver función para eliminar el escucha
    return () => {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Registra un escucha para un solo evento
   * @param eventName Nombre del evento
   * @param listener Función a ejecutar
   * @returns Función para eliminar el escucha
   */
  once(eventName: string, listener: EventListener): () => void {
    // Crear un wrapper que se eliminará después de ejecutarse
    const wrapper = (data: any) => {
      // Eliminar el escucha antes de ejecutarlo
      removeListener();
      // Ejecutar el escucha original
      listener(data);
    };
    
    // Registrar el wrapper
    const removeListener = this.on(eventName, wrapper);
    
    return removeListener;
  }

  /**
   * Elimina todos los escuchas de un evento
   * @param eventName Nombre del evento
   */
  removeAllListeners(eventName?: string): void {
    if (eventName) {
      // Eliminar escuchas para un evento específico
      this.listeners.delete(eventName);
    } else {
      // Eliminar todos los escuchas
      this.listeners.clear();
    }
  }
}

// Exportar una instancia única del bus de eventos
export const eventBus = new EventBus();