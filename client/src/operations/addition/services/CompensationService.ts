import { ProblemStatus, AdditionProblem } from '../domain/AdditionProblem';
import { ProfessorModeSettings } from '../domain/AdditionSettings';
import { ProfessorStudentAnswer } from '../domain/AdditionResult';
import { manageCompensationUseCase } from '../application/ManageCompensationUseCase';
import { eventBus } from '../infrastructure/EventBus';

/**
 * Servicio centralizado para la gestión de problemas de compensación
 * Este servicio es usado por componentes de la capa de presentación
 * para determinar cuándo y cómo generar problemas de compensación
 */
export class CompensationService {
  /**
   * Verifica si es necesario generar un problema de compensación
   * @param settings Configuración del modo profesor
   * @param answer Respuesta del estudiante
   * @returns Si se debe generar compensación
   */
  needsCompensation(
    settings: ProfessorModeSettings, 
    answer: ProfessorStudentAnswer
  ): boolean {
    // Verificar si la compensación está habilitada
    if (!settings.enableCompensation) {
      return false;
    }
    
    // Si la respuesta es correcta, no se necesita compensación
    if (answer.isCorrect) {
      return false;
    }
    
    // Estados que requieren compensación
    const compensationStates = [
      ProblemStatus.INCORRECT,
      ProblemStatus.SKIPPED,
      ProblemStatus.REVEALED,
      ProblemStatus.TIMED_OUT
    ];
    
    // Verificar si el estado requiere compensación
    return answer.status !== undefined && compensationStates.includes(answer.status as ProblemStatus);
  }

  /**
   * Genera problemas de compensación según sea necesario
   * @param settings Configuración del modo profesor
   * @param problems Lista actual de problemas
   * @param answers Lista de respuestas de estudiantes
   * @returns Lista actualizada de problemas
   */
  processAndGenerateCompensations(
    settings: ProfessorModeSettings,
    problems: AdditionProblem[],
    answers: ProfessorStudentAnswer[]
  ): AdditionProblem[] {
    // Verificar si la compensación está habilitada
    if (!settings.enableCompensation) {
      return problems;
    }
    
    let updatedProblems = [...problems];
    
    // Procesar cada respuesta
    for (const answer of answers) {
      // Verificar si se necesita compensación
      if (this.needsCompensation(settings, answer)) {
        try {
          // Determinar razón de compensación
          let reason = 'incorrect_answer';
          if (answer.status === ProblemStatus.SKIPPED) {
            reason = 'skipped';
          } else if (answer.status === ProblemStatus.REVEALED) {
            reason = 'revealed_answer';
          } else if (answer.status === ProblemStatus.TIMED_OUT) {
            reason = 'timed_out';
          }
          
          // Generar problema de compensación
          const { updatedProblems: newProblems } = manageCompensationUseCase.generateCompensationProblem(
            settings,
            updatedProblems,
            reason
          );
          
          updatedProblems = newProblems;
          
        } catch (error) {
          console.error('Error generating compensation problem:', error);
          // Emitir error para ser mostrado en la UI
          eventBus.emit('compensation:error', { 
            error: error instanceof Error ? error.message : String(error),
            problemId: answer.problemId
          });
        }
      }
    }
    
    return updatedProblems;
  }

  /**
   * Calcula estadísticas de compensación
   * @param problems Lista de problemas
   * @returns Estadísticas
   */
  getCompensationStats(problems: AdditionProblem[]): {
    total: number;
    compensationCount: number;
    ratio: number;
  } {
    const total = problems.length;
    const compensationCount = problems.filter(p => p.isCompensation).length;
    const ratio = total > 0 ? (compensationCount / total) * 100 : 0;
    
    return {
      total,
      compensationCount,
      ratio
    };
  }

  /**
   * Filtra problemas para mostrar o excluir compensaciones
   * @param problems Lista de problemas
   * @param includeCompensations Si se deben incluir las compensaciones
   * @returns Lista filtrada
   */
  filterProblems(
    problems: AdditionProblem[],
    includeCompensations: boolean = true
  ): AdditionProblem[] {
    if (includeCompensations) {
      return problems;
    }
    
    return problems.filter(problem => !problem.isCompensation);
  }
}

// Exportar una instancia única del servicio
export const compensationService = new CompensationService();