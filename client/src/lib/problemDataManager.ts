/**
 * ProblemDataManager
 * 
 * Este módulo proporciona una forma estandarizada de almacenar, recuperar
 * y gestionar datos de problemas matemáticos en toda la aplicación.
 * 
 * Permite una gestión coherente de la información de problemas matemáticos
 * independientemente del tipo de operación (suma, fracciones, etc.)
 */

import { MathProblem } from '../components/ProblemRenderer';
import eventBus from './eventBus';

export type ProblemStatus = 'correct' | 'incorrect' | 'timeout' | 'revealed' | 'partial' | 'in-progress';

// Interface base para los detalles de un problema
export interface ProblemDetails {
  id: string;
  moduleId: string;
  type: string;
  difficulty: string;
  userAnswer: number | null;
  isCorrect: boolean;
  status: ProblemStatus;
  attempts: number;
  timeElapsed: number;
  timestamp: number; // Cuando se completó el problema
  rawProblem: any; // El objeto de problema original
}

/**
 * Almacena los detalles completos de un problema en localStorage
 */
export function storeProblemDetails(details: ProblemDetails): void {
  try {
    // Guardar en localStorage
    const key = `problem_${details.moduleId}_${details.id}`;
    localStorage.setItem(key, JSON.stringify(details));
    
    // Actualizar lista de problemas para este módulo
    const moduleProblemsKey = `module_problems_${details.moduleId}`;
    let problemIds: string[] = [];
    
    try {
      const storedIds = localStorage.getItem(moduleProblemsKey);
      if (storedIds) {
        problemIds = JSON.parse(storedIds);
      }
    } catch (e) {
      console.error("Error parsing stored problem IDs:", e);
    }
    
    // Añadir ID si no existe
    if (!problemIds.includes(details.id)) {
      problemIds.push(details.id);
      localStorage.setItem(moduleProblemsKey, JSON.stringify(problemIds));
    }
    
    // Emitir evento de problema completado
    eventBus.emit('problemCompleted', {
      problemId: details.id,
      isCorrect: details.isCorrect,
      moduleId: details.moduleId,
      userAnswer: details.userAnswer,
      elapsedTime: details.timeElapsed
    });
    
    console.log(`[Problem Data] Almacenados detalles de problema ${details.id}`);
  } catch (error) {
    console.error("Error storing problem details:", error);
  }
}

/**
 * Recupera los detalles de un problema específico
 */
export function getProblemDetails(moduleId: string, problemId: string): ProblemDetails | null {
  try {
    const key = `problem_${moduleId}_${problemId}`;
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      return JSON.parse(storedData);
    }
    
    return null;
  } catch (error) {
    console.error("Error retrieving problem details:", error);
    return null;
  }
}

/**
 * Recupera todos los IDs de problemas para un módulo específico
 */
export function getAllProblemIds(moduleId: string): string[] {
  try {
    const moduleProblemsKey = `module_problems_${moduleId}`;
    const storedIds = localStorage.getItem(moduleProblemsKey);
    
    if (storedIds) {
      return JSON.parse(storedIds);
    }
    
    return [];
  } catch (error) {
    console.error("Error retrieving problem IDs:", error);
    return [];
  }
}

/**
 * Recupera todos los detalles de problemas para un módulo específico
 */
export function getAllProblemsForModule(moduleId: string): ProblemDetails[] {
  try {
    const problemIds = getAllProblemIds(moduleId);
    const problems: ProblemDetails[] = [];
    
    for (const id of problemIds) {
      const problem = getProblemDetails(moduleId, id);
      if (problem) {
        problems.push(problem);
      }
    }
    
    // Ordenar por timestamp (más recientes primero)
    return problems.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error retrieving all problems:", error);
    return [];
  }
}

/**
 * Elimina todos los datos de problemas para un módulo específico
 */
export function clearModuleProblems(moduleId: string): void {
  try {
    // Obtener todos los IDs de problemas para este módulo
    const problemIds = getAllProblemIds(moduleId);
    
    // Eliminar cada problema individualmente
    for (const id of problemIds) {
      const key = `problem_${moduleId}_${id}`;
      localStorage.removeItem(key);
    }
    
    // Eliminar la lista de problemas del módulo
    const moduleProblemsKey = `module_problems_${moduleId}`;
    localStorage.removeItem(moduleProblemsKey);
    
    console.log(`[Problem Data] Eliminados todos los problemas del módulo ${moduleId}`);
  } catch (error) {
    console.error("Error clearing module problems:", error);
  }
}

/**
 * Elimina todos los datos de problemas para todos los módulos
 */
export function clearAllProblems(): void {
  try {
    // Buscar todas las claves de localStorage que empiezan con "problem_" o "module_problems_"
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('problem_') || key?.startsWith('module_problems_')) {
        keysToRemove.push(key);
      }
    }
    
    // Eliminar cada clave
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    
    console.log(`[Problem Data] Eliminados todos los datos de problemas (${keysToRemove.length} entradas)`);
  } catch (error) {
    console.error("Error clearing all problems:", error);
  }
}

/**
 * Obtiene estadísticas para un módulo específico
 */
export function getModuleStats(moduleId: string) {
  try {
    const problems = getAllProblemsForModule(moduleId);
    
    if (problems.length === 0) {
      return {
        totalProblems: 0,
        correctProblems: 0,
        incorrectProblems: 0,
        accuracy: 0,
        averageAttempts: 0,
        averageTime: 0
      };
    }
    
    const correctProblems = problems.filter(p => p.isCorrect).length;
    const totalAttempts = problems.reduce((sum, p) => sum + p.attempts, 0);
    const totalTime = problems.reduce((sum, p) => sum + p.timeElapsed, 0);
    
    return {
      totalProblems: problems.length,
      correctProblems,
      incorrectProblems: problems.length - correctProblems,
      accuracy: (correctProblems / problems.length) * 100,
      averageAttempts: totalAttempts / problems.length,
      averageTime: totalTime / problems.length
    };
  } catch (error) {
    console.error("Error calculating module stats:", error);
    return null;
  }
}

/**
 * Función auxiliar para convertir un problema específico de un módulo al formato estándar
 * Esto permite que cualquier tipo de problema se pueda representar de manera uniforme
 * en la aplicación, independientemente de su estructura interna
 */
export function convertToStandardProblem(problem: any, moduleId: string): MathProblem {
  // Esta es una implementación base que debe expandirse según las necesidades de cada módulo
  let operation = '';
  let operands: number[] = [];
  let expectedAnswer = 0;
  
  // Detectar el tipo de problema según el moduleId
  if (moduleId === 'addition') {
    operation = '+';
    operands = [problem.firstNumber, problem.secondNumber];
    expectedAnswer = problem.firstNumber + problem.secondNumber;
  } else if (moduleId === 'fractions') {
    // Implementar según la estructura de problemas de fracciones
    operation = 'fraction';
    // ... lógica específica para fracciones
  } else if (moduleId === 'counting') {
    // Implementar según la estructura de problemas de conteo
    operation = 'count';
    // ... lógica específica para conteo
  }
  
  return {
    id: problem.id || String(Date.now()),
    moduleId,
    operation,
    operands,
    expectedAnswer,
    difficulty: problem.difficulty || 'beginner',
    originalProblem: problem
  };
}

// Exportar un objeto que agrupe todas las funciones
const problemDataManager = {
  storeProblemDetails,
  getProblemDetails,
  getAllProblemIds,
  getAllProblemsForModule,
  clearModuleProblems,
  clearAllProblems,
  getModuleStats,
  convertToStandardProblem
};

export default problemDataManager;