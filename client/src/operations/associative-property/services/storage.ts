/**
 * Servicio de almacenamiento para el módulo de suma
 * 
 * Este servicio proporciona una interfaz unificada para todas
 * las operaciones de almacenamiento relacionadas con el módulo.
 */

import { ExerciseResult, UserAnswer } from '../types';
import { on, off } from '../middleware';

// Definición de interfaces para desacoplar la implementación
export interface StorageProvider {
  saveResult(result: ExerciseResult): Promise<void>;
  getResults(): Promise<ExerciseResult[]>;
  saveUserProgress(userId: string, data: any): Promise<void>;
  getUserProgress(userId: string): Promise<any>;
  clearUserProgress(userId: string): Promise<void>;
}

// Implementación que usa el almacenamiento existente en el sistema
class SystemStorageProvider implements StorageProvider {
  // Función importada del sistema existente
  private saveExerciseResultToSystem = async (result: ExerciseResult): Promise<void> => {
    try {
      // Intentar usar la API del servidor si está disponible
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });
      
      if (!response.ok) {
        throw new Error(`Error al guardar en servidor: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error al guardar en servidor, usando localStorage:', error);
      
      // Respaldo: guardar en localStorage
      try {
        const existingResultsStr = localStorage.getItem('exercise_results') || '[]';
        const existingResults: ExerciseResult[] = JSON.parse(existingResultsStr);
        
        existingResults.push(result);
        
        localStorage.setItem('exercise_results', JSON.stringify(existingResults));
      } catch (localError) {
        console.error('Error al guardar en localStorage:', localError);
        throw new Error('No se pudo guardar el resultado del ejercicio');
      }
    }
  };
  
  async saveResult(result: ExerciseResult): Promise<void> {
    return this.saveExerciseResultToSystem(result);
  }
  
  async getResults(): Promise<ExerciseResult[]> {
    try {
      // Intentar obtener desde la API del servidor
      const response = await fetch('/api/progress');
      
      if (!response.ok) {
        throw new Error(`Error al obtener del servidor: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener del servidor, usando localStorage:', error);
      
      // Respaldo: obtener de localStorage
      try {
        const resultsStr = localStorage.getItem('exercise_results') || '[]';
        return JSON.parse(resultsStr);
      } catch (localError) {
        console.error('Error al leer de localStorage:', localError);
        return [];
      }
    }
  }
  
  async saveUserProgress(userId: string, data: any): Promise<void> {
    try {
      const key = `user_${userId}_associative-property_progress`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error al guardar progreso del usuario:', error);
      throw new Error('No se pudo guardar el progreso del usuario');
    }
  }
  
  async getUserProgress(userId: string): Promise<any> {
    try {
      const key = `user_${userId}_associative-property_progress`;
      const dataStr = localStorage.getItem(key);
      
      if (!dataStr) {
        return null;
      }
      
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('Error al obtener progreso del usuario:', error);
      return null;
    }
  }
  
  async clearUserProgress(userId: string): Promise<void> {
    try {
      const key = `user_${userId}_associative-property_progress`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al borrar progreso del usuario:', error);
      throw new Error('No se pudo borrar el progreso del usuario');
    }
  }
}

// Clase Singleton para el servicio de almacenamiento
export class StorageService {
  private static instance: StorageService;
  private provider: StorageProvider;
  
  private constructor(provider: StorageProvider) {
    this.provider = provider;
    
    // Registrar con el middleware para guardar respuestas automáticamente
    on('user_answer_processed', this.handleUserAnswer.bind(this));
  }
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      // Usar el proveedor de almacenamiento del sistema por defecto
      const provider = new SystemStorageProvider();
      StorageService.instance = new StorageService(provider);
    }
    return StorageService.instance;
  }
  
  /**
   * Cambia el proveedor de almacenamiento (útil para pruebas o cambios en el sistema)
   */
  public setProvider(provider: StorageProvider): void {
    this.provider = provider;
  }
  
  /**
   * Guarda un resultado de ejercicio
   */
  public async saveResult(result: ExerciseResult): Promise<void> {
    await this.provider.saveResult(result);
  }
  
  /**
   * Obtiene todos los resultados de ejercicios
   */
  public async getResults(): Promise<ExerciseResult[]> {
    return this.provider.getResults();
  }
  
  /**
   * Guarda el progreso específico de un usuario
   */
  public async saveUserProgress(userId: string, data: any): Promise<void> {
    await this.provider.saveUserProgress(userId, data);
  }
  
  /**
   * Obtiene el progreso específico de un usuario
   */
  public async getUserProgress(userId: string): Promise<any> {
    return this.provider.getUserProgress(userId);
  }
  
  /**
   * Borra el progreso específico de un usuario
   */
  public async clearUserProgress(userId: string): Promise<void> {
    await this.provider.clearUserProgress(userId);
  }
  
  /**
   * Manejador automático para respuestas de usuario
   */
  private async handleUserAnswer(answer: UserAnswer): Promise<void> {
    try {
      // Solo guardar respuestas finales (status === 'completed' o 'skipped')
      if (answer.status === 'completed' || answer.status === 'skipped') {
        // No necesitamos hacer nada específico aquí, ya que la lógica principal
        // del componente ya guarda los resultados completos
        console.log('[StorageService] Respuesta de usuario registrada:', answer.status);
      }
    } catch (error) {
      console.error('Error al manejar respuesta de usuario:', error);
    }
  }
}

// Funciones de conveniencia para usar en componentes

/**
 * Guarda un resultado de ejercicio
 */
export async function saveResult(result: ExerciseResult): Promise<void> {
  await StorageService.getInstance().saveResult(result);
}

/**
 * Obtiene todos los resultados de ejercicios
 */
export async function getResults(): Promise<ExerciseResult[]> {
  return StorageService.getInstance().getResults();
}

/**
 * Guarda el progreso específico de un usuario
 */
export async function saveUserProgress(userId: string, data: any): Promise<void> {
  await StorageService.getInstance().saveUserProgress(userId, data);
}

/**
 * Obtiene el progreso específico de un usuario
 */
export async function getUserProgress(userId: string): Promise<any> {
  return StorageService.getInstance().getUserProgress(userId);
}

/**
 * Borra el progreso específico de un usuario
 */
export async function clearUserProgress(userId: string): Promise<void> {
  await StorageService.getInstance().clearUserProgress(userId);
}