// Tipos específicos para el Modo Profesor
import { AdditionProblem } from './types';

/**
 * Estado específico para el modo profesor que separa claramente
 * los problemas, respuestas y estado de explicación
 */
export interface ProfessorModeState {
  // Problemas generados para la sesión
  problems: AdditionProblem[];
  
  // Respuestas del estudiante con la explicación del profesor
  studentAnswers: ProfessorStudentAnswer[];
  
  // Índice del problema actual que se está mostrando
  currentProblemIndex: number;
  
  // Modo de visualización actual
  displayMode: 'problem' | 'explanation' | 'results';
  
  // Configuración aplicada a esta sesión
  settings: ProfessorModeSettings;
  
  // Tiempo total de la sesión
  totalTime: number;
}

/**
 * Representa la respuesta de un estudiante en el modo profesor,
 * incluyendo los dibujos o explicaciones hechas por el profesor
 */
export interface ProfessorStudentAnswer {
  // ID único del problema
  problemId: string;
  
  // Referencia al problema completo
  problem: AdditionProblem;
  
  // Respuesta dada por el estudiante (puede ser null si no ha respondido)
  answer: number | null;
  
  // Si la respuesta fue correcta
  isCorrect: boolean;
  
  // Número de intentos realizados
  attempts: number;
  
  // Timestamp de cuando se registró la respuesta
  timestamp: number;
  
  // Estado de la respuesta: pendiente, respondida, omitida, revelada
  status: 'pending' | 'answered' | 'skipped' | 'revealed';
  
  // Imagen en base64 de la explicación dibujada por el profesor
  explanationDrawing?: string;
}

/**
 * Configuración específica para el modo profesor
 */
export interface ProfessorModeSettings {
  // Número de problemas a generar
  problemCount: number;
  
  // Nivel de dificultad
  difficulty: string;
  
  // Si se muestran las explicaciones automáticamente
  autoShowExplanations: boolean;
  
  // Si se agregan problemas de compensación
  enableCompensation: boolean;
}

/**
 * Resultado final de una sesión en modo profesor
 * para guardar en el historial de progreso
 */
export interface ProfessorModeResult {
  module: string;
  operationId: string;
  score: number;
  totalProblems: number;
  timeSpent: number;
  settings: ProfessorModeSettings;
  timestamp: number;
  date: string;
  difficulty: string;
  // Problemas detallados con sus respuestas y explicaciones
  problemDetails: ProfessorStudentAnswer[];
  
  // Campo extraData compatible con el formato estándar de ExerciseHistoryDisplay
  extraData?: {
    problemDetails?: any[];
    userAnswers?: any[];
    mode: 'professor';
    version: string;
    totalTime: number;
  };
  
  // Mantener campo original para compatibilidad
  extra_data: {
    mode: 'professor';
    version: string;
    problems: ProfessorStudentAnswer[];
    totalTime?: number;
  };
}