import { v4 as uuidv4 } from 'uuid';
import { AdditionProblem, DifficultyLevel, ProblemStatus } from '../domain/AdditionProblem';
import { ProfessorModeSettings } from '../domain/AdditionSettings';
import { generateProblemUseCase } from './GenerateProblemUseCase';
import { eventBus } from '../infrastructure/EventBus';

/**
 * Caso de uso para gestionar problemas de compensación
 * Los problemas de compensación se generan cuando un estudiante contesta 
 * incorrectamente o salta un problema.
 */
class ManageCompensationUseCase {
  /**
   * Verifica si se debe añadir un problema de compensación
   * @param settings Configuración del modo profesor
   * @param isCorrect Si la respuesta fue correcta
   * @param status Estado opcional del problema
   * @returns Si se debe añadir un problema de compensación
   */
  shouldAddCompensation(
    settings: ProfessorModeSettings,
    isCorrect: boolean,
    status?: string
  ): boolean {
    // Requisitos para generar problema de compensación:
    // 1. La compensación debe estar habilitada en la configuración
    // 2. La respuesta debe ser incorrecta, o el problema fue omitido o revelado
    
    // Verificar si la compensación está habilitada
    if (!settings.enableCompensation) {
      return false;
    }
    
    // Si la respuesta es correcta, no necesita compensación
    if (isCorrect) {
      return false;
    }
    
    // Estados que requieren compensación
    const requiresCompensation = status === ProblemStatus.SKIPPED || 
                               status === ProblemStatus.REVEALED ||
                               status === ProblemStatus.TIMED_OUT ||
                               status === undefined;
    
    return requiresCompensation;
  }

  /**
   * Genera un problema de compensación y actualiza la lista de problemas
   * @param settings Configuración del modo profesor
   * @param currentProblems Lista actual de problemas
   * @param reason Motivo de la compensación
   * @returns Nuevo problema y lista actualizada
   */
  generateCompensationProblem(
    settings: ProfessorModeSettings,
    currentProblems: AdditionProblem[],
    reason: string = 'incorrect_answer'
  ): { newProblem: AdditionProblem; updatedProblems: AdditionProblem[] } {
    // Verificar si la compensación está habilitada
    if (!settings.enableCompensation) {
      throw new Error('Compensation is not enabled in settings');
    }
    
    // Generar un nuevo problema con la misma configuración
    const baseProblem = generateProblemUseCase.execute(settings);
    
    // Adaptar el problema como compensación
    const compensationProblem: AdditionProblem = {
      ...baseProblem,
      isCompensation: true,
      compensationReason: reason
    };
    
    // Actualizar lista de problemas
    const updatedProblems = [...currentProblems, compensationProblem];
    
    // Emitir evento de compensación generada
    eventBus.emit('problem:compensation', {
      problemId: compensationProblem.id,
      reason,
      currentProblemCount: updatedProblems.length
    });
    
    return {
      newProblem: compensationProblem,
      updatedProblems
    };
  }

  /**
   * Cuenta la cantidad de problemas de compensación en una lista
   * @param problems Lista de problemas
   * @returns Cantidad de problemas de compensación
   */
  countCompensationProblems(problems: AdditionProblem[]): number {
    return problems.filter(problem => problem.isCompensation).length;
  }

  /**
   * Calcula la proporción de problemas de compensación
   * @param problems Lista de problemas
   * @returns Proporción como porcentaje
   */
  getCompensationRatio(problems: AdditionProblem[]): number {
    if (problems.length === 0) return 0;
    
    const compensationCount = this.countCompensationProblems(problems);
    return (compensationCount / problems.length) * 100;
  }

  /**
   * Decide si se deben aplicar adaptaciones adicionales
   * @param settings Configuración actual
   * @param problems Lista de problemas actual
   * @returns Configuración adaptada
   */
  adaptDifficulty(
    settings: ProfessorModeSettings,
    problems: AdditionProblem[]
  ): ProfessorModeSettings {
    // Este es un ejemplo de cómo se podría adaptar la dificultad
    // basándose en el rendimiento del estudiante
    
    // Si no hay problemas o la adaptación no está habilitada, devolver configuración original
    if (problems.length === 0 || !(settings as any).enableAdaptiveDifficulty) {
      return settings;
    }
    
    // Calcular ratio de compensación
    const compensationRatio = this.getCompensationRatio(problems);
    
    // Copiar configuración para modificar
    const adaptedSettings = { ...settings };
    
    // Adaptación basada en el desempeño
    if (compensationRatio > 30 && (adaptedSettings as any).adaptiveDifficulty) {
      // Muchos problemas de compensación - Reducir dificultad
      const currentIndex = Object.values(DifficultyLevel).indexOf(settings.difficulty);
      if (currentIndex > 0) {
        const lowerDifficulty = Object.values(DifficultyLevel)[currentIndex - 1];
        (adaptedSettings as any).adaptedDifficulty = lowerDifficulty;
      }
    } else if (compensationRatio < 10 && (adaptedSettings as any).adaptiveDifficulty) {
      // Pocos problemas de compensación - Aumentar dificultad
      const currentIndex = Object.values(DifficultyLevel).indexOf(settings.difficulty);
      if (currentIndex < Object.values(DifficultyLevel).length - 1) {
        const higherDifficulty = Object.values(DifficultyLevel)[currentIndex + 1];
        (adaptedSettings as any).adaptedDifficulty = higherDifficulty;
      }
    }
    
    return adaptedSettings;
  }
}

// Exportar una instancia única del caso de uso
export const manageCompensationUseCase = new ManageCompensationUseCase();