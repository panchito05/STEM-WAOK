/**
 * Definición de tipos para el Modo Profesor
 * 
 * Este archivo centraliza todas las definiciones de tipos
 * utilizadas en el Modo Profesor, facilitando la consistencia
 * y el mantenimiento del código.
 */

import { AdditionProblem } from "../../domain/AdditionProblem";
import { ProfessorModeSettings } from "../../domain/AdditionSettings";

/**
 * Estados posibles para la visualización del Modo Profesor
 */
export type ProfessorModeDisplayState = 
  | 'problem'      // Mostrando un problema para resolver
  | 'explanation'  // Mostrando/editando explicación
  | 'review'       // Revisando respuestas/explicaciones
  | 'results';     // Mostrando resultados finales

/**
 * Estados posibles para las respuestas de los estudiantes
 */
export type ProfessorAnswerStatus = 
  | 'pending'    // Sin responder
  | 'answered'   // Respondido
  | 'skipped'    // Omitido
  | 'revealed';  // Respuesta revelada

/**
 * Respuesta de un estudiante en el Modo Profesor
 */
export interface ProfessorStudentAnswer {
  // Identificadores
  problemId: string;
  problem?: AdditionProblem;
  
  // Datos de la respuesta
  answer: number | null;
  isCorrect: boolean;
  attempts: number;
  timestamp: number;
  status: ProfessorAnswerStatus;
  
  // Explicación opcional
  explanationDrawing?: string;
  
  // Metadatos para diagnóstico (opcionales)
  _syntheticAnswer?: boolean;
  _generatedAt?: string;
}

/**
 * Estado completo del Modo Profesor
 */
export interface ProfessorModeState {
  // Estado principal
  displayMode: ProfessorModeDisplayState;
  problems: AdditionProblem[];
  studentAnswers: ProfessorStudentAnswer[];
  currentProblemIndex: number;
  
  // Configuración
  settings: ProfessorModeSettings;
  
  // Datos adicionales
  totalTime: number;
}

/**
 * Resultado de una sesión del Modo Profesor
 */
export interface ProfessorModeResult {
  // Identificadores
  module: string;
  operationId: string;
  
  // Métricas principales
  score: number;
  totalProblems: number;
  timeSpent: number;
  
  // Metadata
  settings: ProfessorModeSettings;
  timestamp: number;
  date: string;
  difficulty: string;
  
  // Detalles del problema (formato estandarizado)
  problemDetails: any[];
  
  // Datos adicionales (formato extensible)
  extraData: {
    problemDetails?: any[];
    userAnswers?: any[];
    mode: 'professor';
    version: string;
    totalTime: number;
    metadata?: Record<string, any>;
  };
  
  // Formato heredado (para compatibilidad)
  extra_data: Record<string, any>;
}

/**
 * Eventos del Modo Profesor
 */
export interface ProfessorModeEvents {
  'settings:updated': {
    action: string;
    problemCount?: number;
  };
  'problem:start': {
    problemCount?: number;
    problemIndex?: number;
    problemId?: string;
    difficulty?: string;
  };
  'problem:answered': {
    problemId: string;
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
  };
  'problem:skipped': {
    problemId?: string;
    problemIndex: number;
  };
  'explanation:saved': {
    problemId: string;
    drawingData: string;
  };
  'exercise:finished': {
    totalProblems: number;
    answeredProblems: number;
    correctAnswers: number;
  };
}