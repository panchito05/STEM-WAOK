/**
 * Servicio de Almacenamiento para el Modo Profesor
 * 
 * Componente encargado de gestionar la persistencia de datos para el Modo Profesor,
 * incluyendo el almacenamiento y recuperación de estados, y la generación de
 * resultados finales para el historial.
 * 
 * @author Equipo de Desarrollo Math-W-A-O-K
 * @version 2.0.0
 */

import { AdditionProblem } from "../../domain/AdditionProblem";
import { ProfessorModeSettings } from "../../domain/AdditionSettings";
import { 
  ProfessorModeState, 
  ProfessorStudentAnswer, 
  ProfessorModeResult,
  ProfessorModeDiagnostic,
  NormalizedProblemResult
} from "../domain/ProfessorModeTypes";
import { ProfessorModeDataIntegrity } from "./ProfessorModeDataIntegrity";

/**
 * Servicio que proporciona funcionalidades para la persistencia
 * y la normalización de datos del Modo Profesor.
 */
export class ProfessorModeStorageService {
  /**
   * Versión del componente para diagnóstico
   */
  static readonly VERSION = "2.0.0";
  
  /**
   * Identificador del componente para logs
   */
  static readonly COMPONENT_ID = "StorageService";
  
  /**
   * Clave usada para el almacenamiento en localStorage
   */
  private static readonly STORAGE_KEY = "professor_mode_state";
  
  /**
   * Guarda el estado actual en localStorage
   */
  static saveState(state: ProfessorModeState): void {
    try {
      // Añadir metadatos antes de guardar
      const stateWithMetadata = {
        ...state,
        _version: this.VERSION,
        _lastUpdated: Date.now()
      };
      
      localStorage.setItem(
        this.STORAGE_KEY, 
        JSON.stringify(stateWithMetadata)
      );
      
      console.log(`✅ Estado del Modo Profesor guardado con éxito. Problemas: ${state.problems.length}, Respuestas: ${state.studentAnswers.length}`);
    } catch (error) {
      console.error("❌ Error al guardar estado del Modo Profesor:", error);
    }
  }
  
  /**
   * Recupera el estado guardado desde localStorage
   */
  static loadState(): ProfessorModeState | null {
    try {
      const savedStateJson = localStorage.getItem(this.STORAGE_KEY);
      
      if (!savedStateJson) {
        console.log("⚠️ No se encontró estado guardado para el Modo Profesor");
        return null;
      }
      
      const savedState = JSON.parse(savedStateJson) as ProfessorModeState;
      console.log(`✅ Estado del Modo Profesor cargado. Problemas: ${savedState.problems.length}, Respuestas: ${savedState.studentAnswers.length}`);
      
      return savedState;
    } catch (error) {
      console.error("❌ Error al cargar estado del Modo Profesor:", error);
      return null;
    }
  }
  
  /**
   * Limpia el estado guardado
   */
  static clearState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log("🧹 Estado del Modo Profesor eliminado");
    } catch (error) {
      console.error("❌ Error al eliminar estado del Modo Profesor:", error);
    }
  }
  
  /**
   * Crea un diagnóstico para el servicio de almacenamiento
   */
  private static createDiagnostic(
    level: "info" | "warning" | "error" | "critical",
    message: string,
    details?: Record<string, any>
  ): ProfessorModeDiagnostic {
    return {
      level,
      message,
      timestamp: Date.now(),
      source: this.COMPONENT_ID,
      details
    };
  }
  
  /**
   * Crea un objeto de resultado final normalizado para guardar en el historial
   */
  static createFinalResult(
    problems: AdditionProblem[],
    answers: ProfessorStudentAnswer[],
    settings: ProfessorModeSettings,
    totalTime: number
  ): {
    result: ProfessorModeResult;
    diagnostics: ProfessorModeDiagnostic[];
  } {
    const diagnostics: ProfessorModeDiagnostic[] = [];
    diagnostics.push(this.createDiagnostic('info', 
      `Creando resultado final para ${problems.length} problemas con ${answers.length} respuestas`
    ));
    
    // Paso 1: Normalizar respuestas para asegurar integridad
    const normalizedData = ProfessorModeDataIntegrity.normalizeAnswers(
      problems, 
      answers
    );
    
    // Añadir diagnósticos de la normalización
    diagnostics.push(...normalizedData.diagnostics);
    
    // Paso 2: Validar y corregir el puntaje si es necesario
    const scoreValidation = ProfessorModeDataIntegrity.validateScore(
      problems,
      normalizedData.normalizedAnswers
    );
    
    // Añadir diagnósticos de la validación de puntaje
    diagnostics.push(...scoreValidation.diagnostics);
    
    // Paso 3: Crear resultados normalizados para cada problema
    const normalizedResults = ProfessorModeDataIntegrity.createNormalizedResults(
      problems,
      normalizedData.normalizedAnswers
    );
    
    // Añadir diagnósticos de la normalización de resultados
    diagnostics.push(...normalizedResults.diagnostics);
    
    // Determinar el puntaje final (usar el forzado si es necesario)
    const finalScore = scoreValidation.needsCorrection 
      ? scoreValidation.forcedScore
      : scoreValidation.calculatedScore;
    
    // Crear el resultado final estandarizado
    const result: ProfessorModeResult = {
      // Identificadores
      module: "addition",
      operationId: "professor",
      
      // Métricas principales
      score: finalScore,
      totalProblems: problems.length,
      timeSpent: Math.round(totalTime),
      
      // Metadata
      settings: settings,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      difficulty: settings.difficulty || "custom",
      
      // Detalles del problema (formato estandarizado)
      problemDetails: normalizedResults.normalizedResults,
      
      // Datos adicionales (formato extensible)
      extraData: {
        // Detalles normalizados
        problemDetails: normalizedResults.normalizedResults,
        userAnswers: normalizedData.normalizedAnswers.map(a => ({
          problemId: a.problemId,
          userAnswer: a.answer,
          isCorrect: a.isCorrect,
          attempts: a.attempts,
          time: 0 // No tenemos tiempo individual por problema en Modo Profesor
        })),
        
        // Metadatos
        mode: 'professor',
        version: this.VERSION,
        totalTime: Math.round(totalTime),
        
        // Diagnóstico detallado
        diagnostico: {
          timestamp_guardado: Date.now(),
          version_feature: this.VERSION,
          total_problemas_originales: problems.length,
          total_respuestas_originales: answers.length,
          total_respuestas_sinteticas: normalizedData.syntheticAnswers.length,
          total_respuestas_normalizadas: normalizedData.normalizedAnswers.length,
          puntaje_final: finalScore
        }
      },
      
      // Formato heredado (para compatibilidad)
      extra_data: {
        mode: 'professor',
        version: this.VERSION,
        problems: normalizedData.normalizedAnswers,
        totalTime: Math.round(totalTime),
        diagnostico: {
          respuestas_originales: answers.length,
          respuestas_sinteticas: normalizedData.syntheticAnswers.length,
          respuestas_normalizadas: normalizedData.normalizedAnswers.length,
          problemas_totales: problems.length,
          normalizacion_aplicada: normalizedData.syntheticAnswers.length > 0,
          puntaje_final: finalScore,
          timestamp: Date.now(),
          version_feature: this.VERSION
        }
      }
    };
    
    diagnostics.push(this.createDiagnostic('info', 
      `✅ Resultado final creado con éxito: ${finalScore}/${problems.length} puntos`
    ));
    
    return { result, diagnostics };
  }
}