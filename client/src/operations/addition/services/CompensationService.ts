import { v4 as uuidv4 } from 'uuid';
import { generateAdditionProblem } from '../problemGenerator';
import { AdditionProblem } from '../types';
import { ProfessorModeSettings } from '../ProfessorModeTypes';
import { professorModeEvents } from './ProfessorModeEventSystem';

/**
 * Servicio centralizado para manejar los problemas de compensación
 * en el modo profesor y modo estándar
 */
class CompensationService {
  /**
   * Genera un problema de compensación basado en la configuración actual
   * 
   * @param settings Configuración actual del ejercicio
   * @param currentProblems Lista actual de problemas
   * @param reason Razón por la que se añade el problema de compensación
   * @returns El nuevo problema y la lista actualizada de problemas
   */
  generateCompensationProblem(
    settings: ProfessorModeSettings | any,
    currentProblems: AdditionProblem[],
    reason: 'incorrect_answer' | 'skipped' | 'revealed' = 'incorrect_answer'
  ): { 
    newProblem: AdditionProblem,
    updatedProblems: AdditionProblem[] 
  } {
    // Verificar si la compensación está habilitada
    if (!settings.enableCompensation) {
      throw new Error('Compensation is not enabled in settings');
    }

    // Determinar dificultad para el problema de compensación
    const difficultyForCompensation = settings.enableAdaptiveDifficulty
      ? settings.adaptiveDifficulty || settings.difficulty
      : settings.difficulty;

    // Generar el nuevo problema
    const newProblem = {
      ...generateAdditionProblem(difficultyForCompensation),
      id: uuidv4(),
      isCompensation: true,
      compensationReason: reason
    };

    // Actualizar la lista de problemas
    const updatedProblems = [...currentProblems, newProblem];

    // Emitir el evento de problema de compensación añadido
    professorModeEvents.emit('problem:compensation', {
      problemId: newProblem.id,
      reason,
      currentProblemCount: updatedProblems.length,
      difficulty: difficultyForCompensation
    });

    return { newProblem, updatedProblems };
  }

  /**
   * Determina si se debe añadir un problema de compensación
   * 
   * @param settings Configuración actual del ejercicio
   * @param isCorrect Si la respuesta actual fue correcta
   * @param problemStatus Estado del problema ('skipped', 'revealed', etc.)
   * @returns Si se debe añadir un problema de compensación
   */
  shouldAddCompensation(
    settings: ProfessorModeSettings | any,
    isCorrect: boolean,
    problemStatus?: string
  ): boolean {
    // Si la compensación no está habilitada, nunca añadir
    if (!settings.enableCompensation) {
      return false;
    }

    // Añadir problema de compensación si:
    // 1. La respuesta es incorrecta
    // 2. El problema fue omitido
    // 3. La respuesta fue revelada
    return (
      !isCorrect ||
      problemStatus === 'skipped' ||
      problemStatus === 'revealed'
    );
  }

  /**
   * Obtiene la razón para añadir un problema de compensación
   * 
   * @param isCorrect Si la respuesta actual fue correcta
   * @param problemStatus Estado del problema ('skipped', 'revealed', etc.)
   * @returns La razón para añadir el problema de compensación
   */
  getCompensationReason(
    isCorrect: boolean,
    problemStatus?: string
  ): 'incorrect_answer' | 'skipped' | 'revealed' {
    if (problemStatus === 'skipped') return 'skipped';
    if (problemStatus === 'revealed') return 'revealed';
    return 'incorrect_answer';
  }

  /**
   * Calcula cuántos problemas de compensación se han añadido
   * 
   * @param problems Lista de problemas
   * @returns Número de problemas de compensación
   */
  countCompensationProblems(problems: AdditionProblem[]): number {
    return problems.filter(p => p.isCompensation).length;
  }
}

// Exportar una única instancia del servicio
export const compensationService = new CompensationService();