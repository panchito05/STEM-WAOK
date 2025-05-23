// progressService.ts - Servicios para gestionar el progreso del usuario
import { useStore } from '@/store/store';
import { ExerciseResult, UserAnswer } from '@/operations/addition/types';

/**
 * Guarda el resultado de un ejercicio en el perfil activo
 * @param result Resultado del ejercicio
 */
export async function saveExerciseResult(result: ExerciseResult): Promise<void> {
  try {
    const store = useStore.getState();
    const activeProfileId = store.activeProfile?.id;
    
    if (!activeProfileId) {
      console.error('No hay perfil activo para guardar el resultado');
      return;
    }
    
    // Limpiar problemas para guardar solo lo esencial
    const sanitizedAnswers = result.userAnswers.map(answer => {
      // Si problem es un objeto Problem, convertirlo a una versión simplificada
      const simplifiedProblem = typeof answer.problem === 'string' 
        ? answer.problem 
        : `${answer.problem.operands?.join(' + ')} = ${answer.problem.correctAnswer}`;
        
      return {
        ...answer,
        problem: simplifiedProblem,
        problemId: typeof answer.problem === 'string' ? answer.problemId : answer.problem.id
      };
    });
    
    // Crear objeto de historial de ejercicio
    const exerciseHistory = {
      module: result.module,
      score: result.score,
      totalProblems: result.totalProblems,
      timeSpent: result.timeSpent,
      settings: result.settings,
      userAnswers: sanitizedAnswers,
      timestamp: result.timestamp || Date.now()
    };
    
    // Si hay conexión a servidor, guardar en DB
    if (store.isAuthenticated) {
      try {
        const response = await fetch(`/api/child-profiles/${activeProfileId}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ exercise: exerciseHistory }),
        });
        
        if (!response.ok) {
          throw new Error(`Error al guardar progreso: ${response.statusText}`);
        }
        
        console.log('Ejercicio guardado en servidor');
      } catch (err) {
        console.error('Error al guardar progreso en servidor:', err);
        // Guardar localmente como fallback
        saveExerciseResultLocally(activeProfileId, exerciseHistory);
      }
    } else {
      // Guardar localmente
      saveExerciseResultLocally(activeProfileId, exerciseHistory);
    }
    
    // Actualizar estado global
    store.addExerciseToHistory(exerciseHistory);
    
  } catch (err) {
    console.error('Error al guardar resultado del ejercicio:', err);
  }
}

/**
 * Guarda el resultado localmente (fallback cuando no hay conexión)
 */
function saveExerciseResultLocally(profileId: number, exerciseHistory: any): void {
  try {
    // Obtener datos existentes
    const key = `profile_${profileId}_exercises`;
    const existingDataStr = localStorage.getItem(key);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
    
    // Añadir nuevo ejercicio
    const updatedData = [...existingData, exerciseHistory];
    
    // Guardar en localStorage
    localStorage.setItem(key, JSON.stringify(updatedData));
    console.log('Ejercicio guardado localmente');
  } catch (err) {
    console.error('Error al guardar localmente:', err);
  }
}

/**
 * Carga el historial de ejercicios para el perfil activo
 */
export async function loadExerciseHistory(): Promise<ExerciseResult[]> {
  try {
    const store = useStore.getState();
    const activeProfileId = store.activeProfile?.id;
    
    if (!activeProfileId) {
      console.error('No hay perfil activo para cargar historial');
      return [];
    }
    
    // Si hay conexión a servidor, cargar desde DB
    if (store.isAuthenticated) {
      try {
        const response = await fetch(`/api/child-profiles/${activeProfileId}/progress`);
        
        if (!response.ok) {
          throw new Error(`Error al cargar progreso: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.exerciseHistory || [];
      } catch (err) {
        console.error('Error al cargar progreso del servidor:', err);
        // Cargar desde localStorage como fallback
        return loadExerciseHistoryLocally(activeProfileId);
      }
    } else {
      // Cargar desde localStorage
      return loadExerciseHistoryLocally(activeProfileId);
    }
  } catch (err) {
    console.error('Error al cargar historial de ejercicios:', err);
    return [];
  }
}

/**
 * Carga el historial desde localStorage
 */
function loadExerciseHistoryLocally(profileId: number): ExerciseResult[] {
  try {
    const key = `profile_${profileId}_exercises`;
    const dataStr = localStorage.getItem(key);
    return dataStr ? JSON.parse(dataStr) : [];
  } catch (err) {
    console.error('Error al cargar historial local:', err);
    return [];
  }
}

/**
 * Elimina todo el historial de ejercicios para el perfil activo
 */
export async function clearExerciseHistory(): Promise<boolean> {
  try {
    const store = useStore.getState();
    const activeProfileId = store.activeProfile?.id;
    
    if (!activeProfileId) {
      console.error('No hay perfil activo para limpiar historial');
      return false;
    }
    
    // Si hay conexión a servidor, eliminar en DB
    if (store.isAuthenticated) {
      try {
        const response = await fetch(`/api/child-profiles/${activeProfileId}/progress`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Error al eliminar progreso: ${response.statusText}`);
        }
        
        console.log('Historial eliminado en servidor');
      } catch (err) {
        console.error('Error al eliminar progreso en servidor:', err);
        return false;
      }
    }
    
    // Siempre eliminar localmente (por si acaso)
    const key = `profile_${activeProfileId}_exercises`;
    localStorage.removeItem(key);
    console.log('Historial eliminado localmente');
    
    // Actualizar estado global
    store.clearExerciseHistory();
    
    return true;
  } catch (err) {
    console.error('Error al eliminar historial de ejercicios:', err);
    return false;
  }
}