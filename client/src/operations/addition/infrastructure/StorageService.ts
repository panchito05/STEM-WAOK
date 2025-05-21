import { EventBus, eventBus } from './EventBus';

// Prefijo para todas las claves de almacenamiento
const STORAGE_PREFIX = 'math_waok_addition_';

/**
 * Opciones para reintentos de operaciones
 */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
}

/**
 * Servicio para manejar operaciones de almacenamiento local
 * con políticas de reintentos y manejo de errores
 */
export class StorageService {
  constructor(private eventBus: EventBus) {}

  /**
   * Guarda datos en el almacenamiento local con reintentos
   * @param key Clave para almacenar los datos
   * @param data Datos a almacenar
   * @param options Opciones de reintento
   * @returns Promesa que se resuelve cuando el guardado es exitoso
   */
  async save(
    key: string,
    data: any,
    options: RetryOptions = {}
  ): Promise<boolean> {
    const { 
      maxAttempts = 3, 
      delayMs = 1000, 
      backoffFactor = 1.5 
    } = options;

    return this.executeWithRetry(
      async () => {
        // Verificar si hay espacio disponible
        if (!this.hasEnoughSpace(data)) {
          // Intentar liberar espacio
          this.cleanupOldData();
          
          // Verificar nuevamente
          if (!this.hasEnoughSpace(data)) {
            throw new Error('Insufficient storage space');
          }
        }
        
        // Guardar los datos
        const fullKey = this.getFullKey(key);
        localStorage.setItem(fullKey, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
        
        return true;
      },
      {
        maxAttempts,
        delayMs,
        backoffFactor,
        operationName: 'save',
        metadata: { key }
      }
    );
  }

  /**
   * Carga datos desde el almacenamiento local
   * @param key Clave de los datos a cargar
   * @param defaultValue Valor predeterminado si no se encuentran datos
   * @returns Datos cargados o valor predeterminado
   */
  load<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const storedValue = localStorage.getItem(fullKey);
      
      // Si no hay valor almacenado, devolver valor predeterminado
      if (!storedValue) {
        return defaultValue;
      }
      
      // Intentar parsear el valor almacenado
      const parsed = JSON.parse(storedValue);
      return parsed.data || defaultValue;
    } catch (error) {
      this.emitStorageError('load', error, { key });
      return defaultValue;
    }
  }

  /**
   * Elimina datos del almacenamiento local
   * @param key Clave de los datos a eliminar
   * @returns Si la operación fue exitosa
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      this.emitStorageError('remove', error, { key });
      return false;
    }
  }

  /**
   * Obtiene todas las claves que coinciden con un patrón
   * @param pattern Patrón para filtrar claves (opcional)
   * @returns Lista de claves que coinciden
   */
  getKeys(pattern?: string): string[] {
    try {
      const keys: string[] = [];
      
      // Iterar todas las claves en localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(STORAGE_PREFIX)) {
          // Obtener la clave sin el prefijo
          const cleanKey = key.substring(STORAGE_PREFIX.length);
          
          // Filtrar por patrón si se proporciona
          if (!pattern || cleanKey.includes(pattern)) {
            keys.push(cleanKey);
          }
        }
      }
      
      return keys;
    } catch (error) {
      this.emitStorageError('getKeys', error, { pattern });
      return [];
    }
  }

  /**
   * Exporta múltiples valores a un solo objeto JSON
   * @param keys Claves a exportar
   * @returns Objeto con los datos exportados
   */
  exportData(keys: string[]): { [key: string]: any } {
    const exportedData: { [key: string]: any } = {};
    
    // Cargar cada clave
    for (const key of keys) {
      const data = this.load(key);
      if (data !== null) {
        exportedData[key] = data;
      }
    }
    
    return exportedData;
  }

  /**
   * Importa datos desde un objeto JSON
   * @param data Objeto con datos a importar
   * @returns Promesa que se resuelve cuando la importación es exitosa
   */
  async importData(data: { [key: string]: any }): Promise<boolean> {
    try {
      // Guardar cada clave
      for (const key in data) {
        await this.save(key, data[key]);
      }
      
      return true;
    } catch (error) {
      this.emitStorageError('importData', error);
      return false;
    }
  }

  /**
   * Limpia datos antiguos para liberar espacio
   * @param olderThan Eliminar datos más antiguos que esta cantidad de milisegundos
   * @returns Número de items eliminados
   */
  cleanupOldData(olderThan: number = 7 * 24 * 60 * 60 * 1000): number {
    try {
      const now = Date.now();
      let removedCount = 0;
      
      // Obtener todas las claves
      const keys = this.getKeys();
      
      // Verificar cada clave
      for (const key of keys) {
        try {
          const fullKey = this.getFullKey(key);
          const value = localStorage.getItem(fullKey);
          
          if (value) {
            const parsed = JSON.parse(value);
            
            // Verificar si los datos son antiguos
            if (parsed.timestamp && (now - parsed.timestamp) > olderThan) {
              localStorage.removeItem(fullKey);
              removedCount++;
            }
          }
        } catch {
          // Ignorar errores individuales para continuar con otras claves
        }
      }
      
      // Emitir evento de limpieza
      this.eventBus.emit('storage:cleanup', {
        removedCount,
        threshold: olderThan
      });
      
      return removedCount;
    } catch (error) {
      this.emitStorageError('cleanupOldData', error);
      return 0;
    }
  }

  /**
   * Verifica si hay suficiente espacio para almacenar datos
   * @param data Datos a almacenar
   * @returns Si hay suficiente espacio
   */
  private hasEnoughSpace(data: any): boolean {
    try {
      // Estimación del tamaño serializado
      const serialized = JSON.stringify({
        timestamp: Date.now(),
        data
      });
      
      // Espacio requerido con margen de seguridad
      const requiredSpace = serialized.length * 2;
      
      // Probar almacenamiento temporal
      const testKey = `${STORAGE_PREFIX}test_${Date.now()}`;
      const testValue = 'A'.repeat(requiredSpace);
      
      try {
        localStorage.setItem(testKey, testValue);
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Ejecuta una operación con política de reintentos
   * @param operation Operación a ejecutar
   * @param options Opciones de reintento
   * @returns Promesa con el resultado de la operación
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts: number;
      delayMs: number;
      backoffFactor: number;
      operationName: string;
      metadata?: any;
    }
  ): Promise<T> {
    const { 
      maxAttempts, 
      delayMs,
      backoffFactor,
      operationName,
      metadata
    } = options;
    
    let lastError: any;
    let currentDelay = delayMs;
    
    // Intentar la operación varias veces
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Si es exitoso en un reintento, emitir evento
        if (attempt > 1) {
          this.eventBus.emit('storage:retry_success', {
            operation: operationName,
            attempts: attempt,
            metadata
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Emitir evento de reintento
        this.eventBus.emit('storage:retry', {
          operation: operationName,
          attempt,
          maxAttempts,
          delay: currentDelay,
          error,
          metadata
        });
        
        // Si quedan intentos, esperar y continuar
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= backoffFactor; // Aumentar el delay para el siguiente intento
        }
      }
    }
    
    // Si llega aquí, todos los intentos fallaron
    this.emitStorageError(operationName, lastError, metadata);
    throw lastError;
  }

  /**
   * Obtiene la clave completa con prefijo
   * @param key Clave base
   * @returns Clave con prefijo
   */
  private getFullKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  /**
   * Emite un evento de error
   * @param operation Nombre de la operación
   * @param error Error ocurrido
   * @param metadata Metadatos adicionales
   */
  private emitStorageError(
    operation: string,
    error: any,
    metadata?: any
  ): void {
    this.eventBus.emit('storage:error', {
      operation,
      error: error?.message || String(error),
      timestamp: Date.now(),
      metadata
    });
  }
}

// Exportar una instancia única del servicio
export const storageService = new StorageService(eventBus);