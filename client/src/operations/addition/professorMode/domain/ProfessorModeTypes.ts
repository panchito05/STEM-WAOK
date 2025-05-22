/**
 * Definición de tipos para el Modo Profesor
 * 
 * Este archivo centraliza todas las definiciones de tipos
 * utilizadas en el Modo Profesor, facilitando la consistencia
 * y el mantenimiento del código.
 * 
 * Versión 2.0: Implementación mejorada con integridad de datos reforzada
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
 * Niveles de diagnóstico para mensajes y logs
 */
export type DiagnosticLevel = 
  | 'info'        // Información general
  | 'warning'     // Advertencias (posibles problemas)
  | 'error'       // Errores importantes
  | 'critical';   // Errores críticos que requieren intervención inmediata

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
  
  // Metadatos para diagnóstico y depuración
  _syntheticAnswer?: boolean;     // Indica si es una respuesta generada automáticamente
  _generatedAt?: string;          // Timestamp de generación automática
  _processingVersion?: string;    // Versión del sistema que procesó esta respuesta
  _normalizedBy?: string;         // Componente que aplicó normalización
}

/**
 * Diagnóstico generado durante la normalización o validación
 */
export interface ProfessorModeDiagnostic {
  level: DiagnosticLevel;
  message: string;
  timestamp: number;
  source: string;
  details?: Record<string, any>;
}

/**
 * Estado completo del Modo Profesor con manejo de diagnóstico
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
  
  // Diagnóstico y metadatos
  _version?: string;
  _diagnostics?: ProfessorModeDiagnostic[];
  _lastUpdated?: number;
}

/**
 * Estructura de datos normalizados para resultado final
 */
export interface NormalizedProblemResult {
  // Identificadores
  id: string;
  problemId: string;
  
  // Datos del problema
  problem?: AdditionProblem;
  operands: number[];
  correctAnswer: number;
  
  // Respuesta del usuario
  userAnswer: number | null;
  isCorrect: boolean;
  attempts: number;
  
  // Metadatos
  timestamp: number;
  explanationDrawing?: string;
  
  // Diagnóstico interno
  _synthetic?: boolean;
  _diagnostics?: ProfessorModeDiagnostic[];
}

/**
 * Resultado de una sesión del Modo Profesor
 */
export interface ProfessorModeResult {
  // Identificadores
  module: string;
  operationId: string;
  
  // Métricas principales
  score: number;              // Número de problemas correctos
  totalProblems: number;      // Número total de problemas
  timeSpent: number;          // Tiempo total en segundos
  
  // Metadata
  settings: ProfessorModeSettings;
  timestamp: number;          // Timestamp de generación
  date: string;               // Fecha en formato ISO
  difficulty: string;         // Dificultad del ejercicio (string)
  
  // Detalles del problema (formato estandarizado)
  problemDetails: NormalizedProblemResult[];
  
  // Datos adicionales (formato extensible)
  extraData: {
    // Datos del problema normalizados
    problemDetails?: NormalizedProblemResult[];
    userAnswers?: {
      problemId: string;
      userAnswer: number | null;
      isCorrect: boolean;
      attempts: number;
      time: number;          // Tiempo en segundos
    }[];
    
    // Metadatos
    mode: 'professor';
    version: string;
    totalTime: number;
    
    // Diagnóstico
    diagnostico?: {
      timestamp_guardado: number;
      version_feature: string;
      total_problemas_originales: number;
      total_respuestas_originales: number;
      total_respuestas_sinteticas: number;
      total_respuestas_normalizadas: number;
      puntaje_final: number;
    }
  };
  
  // Formato heredado (para compatibilidad)
  extra_data: {
    mode: 'professor';
    version: string;
    problems: any[];         // Problemas normalizados
    totalTime: number;
    diagnostico: {
      respuestas_originales: number;
      respuestas_sinteticas: number;
      respuestas_normalizadas: number;
      problemas_totales: number;
      normalizacion_aplicada: boolean;
      puntaje_final: number;
      timestamp: number;
      version_feature: string;
    }
  };
}

/**
 * Eventos del Modo Profesor
 */
export interface ProfessorModeEvents {
  // Eventos de configuración
  'settings:updated': {
    action: string;
    problemCount?: number;
  };
  
  // Eventos de problemas
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
    attempts?: number;
    _synthetic?: boolean;
  };
  'problem:skipped': {
    problemId?: string;
    problemIndex: number;
  };
  
  // Eventos de explicación
  'explanation:saved': {
    problemId: string;
    drawingData: string;
  };
  
  // Eventos de finalización
  'exercise:finished': {
    totalProblems: number;
    answeredProblems: number;
    correctAnswers: number;
    processedAnswers?: number;
    syntheticAnswers?: number;
  };
  
  // Eventos de diagnóstico
  'diagnostics:warning': {
    message: string;
    source: string;
    details?: Record<string, any>;
  };
  'diagnostics:error': {
    message: string;
    source: string;
    details?: Record<string, any>;
  };
  
  // Eventos de integridad de datos
  'data:normalized': {
    source: string;
    problemCount: number;
    originalAnswers: number;
    syntheticAnswers: number;
    normalizedAnswers: number;
  };
}