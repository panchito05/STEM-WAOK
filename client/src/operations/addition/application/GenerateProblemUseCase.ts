import { v4 as uuidv4 } from 'uuid';
import {
  AdditionProblem,
  DifficultyLevel,
  DisplayFormat,
  createBasicAdditionProblem
} from '../domain/AdditionProblem';
import {
  AdditionSettings,
  DIFFICULTY_RANGES
} from '../domain/AdditionSettings';
import { eventBus } from '../infrastructure/EventBus';

/**
 * Caso de uso para generar problemas de suma
 * Utiliza los parámetros de la configuración para crear problemas adaptados
 */
class GenerateProblemUseCase {
  /**
   * Genera un único problema de suma basado en la configuración
   * @param settings Configuración para generar el problema
   * @returns Problema de suma generado
   */
  execute(settings: AdditionSettings): AdditionProblem {
    const {
      difficulty,
      allowNegatives,
      allowDecimals,
      displayFormat,
      maxOperandValue
    } = settings;

    // Obtener rango de valores según dificultad
    const range = DIFFICULTY_RANGES[difficulty] || DIFFICULTY_RANGES[DifficultyLevel.EASY];
    
    // Ajustar valores según configuración
    const minValue = range.minValue;
    const maxValue = Math.min(range.maxValue, maxOperandValue);
    const operandCount = range.operandCount;
    
    // Generar operandos aleatorios
    const operands = this.generateOperands(
      minValue,
      maxValue,
      operandCount,
      allowNegatives,
      allowDecimals,
      range.decimalPlaces
    );
    
    // Calcular suma correcta
    const correctAnswer = operands.reduce((sum, val) => sum + val, 0);
    
    // Crear ID único para el problema
    const id = uuidv4();
    
    // Crear problema
    const problem: AdditionProblem = {
      id,
      operands,
      correctAnswer,
      difficulty,
      displayFormat: displayFormat || DisplayFormat.STANDARD,
      maxAttempts: 1,
      allowDecimals: allowDecimals
    };
    
    // Emitir evento de problema generado
    eventBus.emit('problem:generated', { problem });
    
    return problem;
  }

  /**
   * Genera múltiples problemas de suma
   * @param settings Configuración para generar los problemas
   * @param count Cantidad de problemas a generar
   * @returns Lista de problemas generados
   */
  executeMultiple(settings: AdditionSettings, count: number): AdditionProblem[] {
    const problems: AdditionProblem[] = [];
    
    // Generar la cantidad requerida de problemas
    for (let i = 0; i < count; i++) {
      problems.push(this.execute(settings));
    }
    
    return problems;
  }

  /**
   * Genera operandos aleatorios según los parámetros especificados
   */
  private generateOperands(
    minValue: number,
    maxValue: number,
    count: number,
    allowNegatives: boolean,
    allowDecimals: boolean,
    decimalPlaces: number = 1
  ): number[] {
    const operands: number[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generar valor base
      let operand = this.getRandomNumber(minValue, maxValue);
      
      // Aplicar signo negativo con cierta probabilidad si está permitido
      if (allowNegatives && Math.random() < 0.3) {
        operand = -operand;
      }
      
      // Aplicar decimales con cierta probabilidad si está permitido
      if (allowDecimals && Math.random() < 0.4) {
        const decimal = Math.random();
        const factor = Math.pow(10, decimalPlaces);
        operand = Math.round((operand + decimal) * factor) / factor;
      }
      
      operands.push(operand);
    }
    
    return operands;
  }

  /**
   * Genera un número aleatorio en el rango especificado
   */
  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Exportar una instancia única del caso de uso
export const generateProblemUseCase = new GenerateProblemUseCase();