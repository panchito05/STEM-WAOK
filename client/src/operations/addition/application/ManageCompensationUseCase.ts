import { v4 as uuidv4 } from 'uuid';
import { AdditionProblem } from '../domain/AdditionProblem';
import { AdditionSettings, ProfessorModeSettings } from '../domain/AdditionSettings';
import { GenerateProblemUseCase, generateProblemUseCase } from './GenerateProblemUseCase';
import { EventBus, eventBus } from '../infrastructure/EventBus';

/**
 * Caso de uso para gestionar problemas de compensación
 */
export class ManageCompensationUseCase {
  constructor(
    private problemGenerator: GenerateProblemUseCase,
    private eventBus: EventBus
  ) {}

  /**
   * Genera un problema de compensación
   * @param settings Configuración del ejercicio
   * @param currentProblems Lista actual de problemas
   * @param reason Razón de la compensación
   * @returns Nuevo problema y lista actualizada
   */
  generateCompensationProblem(
    settings: AdditionSettings,
    currentProblems: AdditionProblem[],
    reason: 'incorrect_answer' | 'skipped' | 'revealed' = 'incorrect_answer'
  ): {
    newProblem: AdditionProblem;
    updatedProblems: AdditionProblem[];
  } {
    // Verificar si la compensación está habilitada
    this.assertCompensationEnabled(settings);

    // Determinar dificultad para el problema de compensación
    const difficultyForCompensation = this.getCompensationDifficulty(settings);

    // Generar problema básico
    const basicProblem = this.problemGenerator.execute({
      ...settings,
      difficulty: difficultyForCompensation
    });

    // Marcar como problema de compensación
    const newProblem: AdditionProblem = {
      ...basicProblem,
      isCompensation: true,
      compensationReason: reason
    };

    // Actualizar lista de problemas
    const updatedProblems = [...currentProblems, newProblem];

    // Emitir evento
    this.emitCompensationEvent(newProblem, reason, updatedProblems.length);

    return { newProblem, updatedProblems };
  }

  /**
   * Determina si se debe añadir un problema de compensación
   * @param settings Configuración del ejercicio
   * @param isCorrect Si la respuesta fue correcta
   * @param status Estado del problema
   * @returns Si se debe añadir compensación
   */
  shouldAddCompensation(
    settings: AdditionSettings,
    isCorrect: boolean,
    status?: string
  ): boolean {
    // Verificar si la compensación está habilitada en la configuración
    if (!this.isCompensationEnabled(settings)) {
      return false;
    }

    // Añadir problema de compensación si:
    // 1. La respuesta es incorrecta
    // 2. El problema fue omitido
    // 3. La respuesta fue revelada
    return (
      !isCorrect ||
      status === 'skipped' ||
      status === 'revealed'
    );
  }

  /**
   * Cuenta el número de problemas de compensación
   * @param problems Lista de problemas
   * @returns Número de problemas de compensación
   */
  countCompensationProblems(problems: AdditionProblem[]): number {
    return problems.filter(p => p.isCompensation).length;
  }

  /**
   * Verifica si la compensación está habilitada
   * @param settings Configuración del ejercicio
   * @returns Si la compensación está habilitada
   */
  private isCompensationEnabled(settings: AdditionSettings): boolean {
    // Verificar si es configuración del modo profesor
    if ('enableCompensation' in settings) {
      return (settings as ProfessorModeSettings).enableCompensation;
    }
    return false;
  }

  /**
   * Verifica que la compensación esté habilitada, lanzando error si no
   * @param settings Configuración del ejercicio
   */
  private assertCompensationEnabled(settings: AdditionSettings): void {
    if (!this.isCompensationEnabled(settings)) {
      throw new Error('Compensation is not enabled in settings');
    }
  }

  /**
   * Determina la dificultad para el problema de compensación
   * @param settings Configuración del ejercicio
   * @returns Nivel de dificultad
   */
  private getCompensationDifficulty(settings: AdditionSettings): any {
    // Si es configuración del modo profesor y tiene dificultad adaptativa
    if (
      'enableAdaptiveDifficulty' in settings &&
      (settings as ProfessorModeSettings).enableAdaptiveDifficulty &&
      (settings as ProfessorModeSettings).adaptiveDifficulty
    ) {
      return (settings as ProfessorModeSettings).adaptiveDifficulty;
    }
    
    // Usar dificultad normal
    return settings.difficulty;
  }

  /**
   * Emite un evento cuando se añade un problema de compensación
   * @param problem Problema añadido
   * @param reason Razón de la compensación
   * @param totalProblems Total de problemas
   */
  private emitCompensationEvent(
    problem: AdditionProblem,
    reason: string,
    totalProblems: number
  ): void {
    this.eventBus.emit('problem:compensation', {
      problemId: problem.id,
      reason,
      currentProblemCount: totalProblems,
      difficulty: problem.difficulty
    });
  }
}

// Exportar una instancia única del caso de uso
export const manageCompensationUseCase = new ManageCompensationUseCase(
  generateProblemUseCase,
  eventBus
);