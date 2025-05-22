/**
 * Servicio de Almacenamiento para el Modo Profesor
 * 
 * Este módulo proporciona funcionalidades para gestionar
 * la persistencia de datos del Modo Profesor, permitiendo
 * guardar y restaurar sesiones.
 */

import { ProfessorModeState } from '../domain/ProfessorModeTypes';

// Clave usada para almacenar la sesión actual en localStorage
const STORAGE_KEY = 'professor_mode_current_session';

/**
 * Servicio para gestionar el almacenamiento de datos del Modo Profesor
 */
export class ProfessorModeStorageService {
  /**
   * Guarda el estado actual en localStorage
   */
  saveState(state: ProfessorModeState): void {
    try {
      // Guardamos el estado actual con un timestamp
      const stateWithTimestamp = {
        ...state,
        savedAt: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
      console.log("✅ Estado del Modo Profesor guardado correctamente");
    } catch (error) {
      console.error("❌ Error al guardar estado del Modo Profesor:", error);
    }
  }
  
  /**
   * Carga el estado guardado desde localStorage
   */
  loadState(): ProfessorModeState | null {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState) {
        return null;
      }
      
      const parsedState = JSON.parse(savedState);
      console.log("✅ Estado del Modo Profesor cargado correctamente");
      
      // Verificar integridad del estado cargado
      if (!this.validateState(parsedState)) {
        console.warn("⚠️ El estado cargado no pasó la validación de integridad");
        return null;
      }
      
      return parsedState as ProfessorModeState;
    } catch (error) {
      console.error("❌ Error al cargar estado del Modo Profesor:", error);
      return null;
    }
  }
  
  /**
   * Verifica si existe una sesión guardada
   */
  hasCurrentSession(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }
  
  /**
   * Elimina la sesión guardada actual
   */
  clearCurrentSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log("✅ Sesión del Modo Profesor eliminada correctamente");
    } catch (error) {
      console.error("❌ Error al eliminar sesión del Modo Profesor:", error);
    }
  }
  
  /**
   * Valida la integridad del estado cargado
   */
  private validateState(state: any): boolean {
    // Verificar que el estado tiene los campos necesarios
    if (!state || 
        !Array.isArray(state.problems) || 
        !Array.isArray(state.studentAnswers) ||
        typeof state.currentProblemIndex !== 'number' ||
        !state.settings) {
      return false;
    }
    
    // Verificar que no es un estado muy antiguo (más de 24 horas)
    const savedAt = state.savedAt || 0;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - savedAt > twentyFourHours) {
      console.warn("⚠️ El estado cargado es demasiado antiguo");
      return false;
    }
    
    return true;
  }
}

// Exportar instancia singleton para uso en toda la aplicación
export const professorModeStorage = new ProfessorModeStorageService();