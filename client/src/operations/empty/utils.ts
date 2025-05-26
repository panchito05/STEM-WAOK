// Utilidades para el módulo Empty Module
import { EmptyProblem, DifficultyLevel } from './types';

/**
 * Genera un problema simple - personaliza esta función según tu módulo
 */
export function generateEmptyProblem(
  id: string,
  difficulty: DifficultyLevel,
  index?: number,
  total?: number
): EmptyProblem {
  // PERSONALIZA AQUÍ: Cambia la lógica de generación según tu módulo
  const difficultyMultiplier = {
    beginner: 1,
    elementary: 2,
    intermediate: 3,
    advanced: 4,
    expert: 5
  }[difficulty];

  return {
    id,
    content: `Ejemplo de problema nivel ${difficulty} #${index || 1}`,
    correctAnswer: `Respuesta correcta ${difficultyMultiplier}`,
    layout: 'horizontal',
    index,
    total,
    metadata: {
      difficulty,
      generatedAt: Date.now(),
      // Añade metadatos específicos aquí
    }
  };
}

/**
 * Valida una respuesta del usuario
 */
export function validateAnswer(userAnswer: any, correctAnswer: any): boolean {
  // PERSONALIZA AQUÍ: Implementa tu lógica de validación
  if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }
  
  return userAnswer === correctAnswer;
}

/**
 * Calcula la puntuación basada en precisión y tiempo
 */
export function calculateScore(
  isCorrect: boolean,
  timeSpent: number,
  maxTime: number = 60000 // 1 minuto por defecto
): number {
  if (!isCorrect) return 0;
  
  // Puntuación base por respuesta correcta
  let score = 100;
  
  // Bonus por velocidad (máximo 50% extra)
  if (maxTime > 0) {
    const timeRatio = Math.max(0, 1 - (timeSpent / maxTime));
    score += Math.floor(timeRatio * 50);
  }
  
  return Math.min(score, 150); // Máximo 150 puntos
}

/**
 * Genera múltiples problemas para un ejercicio
 */
export function generateProblemSet(
  count: number,
  difficulty: DifficultyLevel
): EmptyProblem[] {
  const problems: EmptyProblem[] = [];
  
  for (let i = 0; i < count; i++) {
    problems.push(generateEmptyProblem(
      `empty-${difficulty}-${i + 1}`,
      difficulty,
      i + 1,
      count
    ));
  }
  
  return problems;
}

/**
 * Función de utilidad para formatear tiempo
 */
export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  
  return `${seconds}s`;
}

/**
 * Función para determinar el nivel de rendimiento
 */
export function getPerformanceLevel(accuracy: number): {
  level: string;
  color: string;
  message: string;
} {
  if (accuracy >= 90) {
    return {
      level: 'Excelente',
      color: 'green',
      message: '¡Increíble trabajo! Dominas este tema perfectamente.'
    };
  } else if (accuracy >= 75) {
    return {
      level: 'Muy Bien',
      color: 'blue',
      message: '¡Buen trabajo! Estás progresando muy bien.'
    };
  } else if (accuracy >= 60) {
    return {
      level: 'Bien',
      color: 'yellow',
      message: 'Vas por buen camino. ¡Sigue practicando!'
    };
  } else {
    return {
      level: 'Necesita Práctica',
      color: 'orange',
      message: 'No te desanimes. La práctica hace la perfección.'
    };
  }
}