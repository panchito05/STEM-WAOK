import { v4 as uuidv4 } from 'uuid';
import { 
  AdditionProblem, 
  DifficultyLevel, 
  DisplayFormat 
} from '../domain/AdditionProblem';
import { AdditionSettings } from '../domain/AdditionSettings';

/**
 * Caso de uso para generar problemas de suma
 */
export class GenerateProblemUseCase {
  /**
   * Genera un problema de suma basado en la configuración
   * @param settings Configuración del ejercicio
   * @returns Un problema de suma
   */
  execute(settings: AdditionSettings): AdditionProblem {
    // Determinar el rango de valores para los operandos según dificultad
    const range = this.getOperandRangeByDifficulty(settings.difficulty, settings.maxOperandValue);
    
    // Determinar si se permiten negativos
    const allowNegatives = settings.allowNegatives;
    
    // Generar los operandos
    const operands = this.generateOperands(range, allowNegatives, settings.allowDecimals);
    
    // Calcular la respuesta correcta
    const correctAnswer = operands.reduce((sum, operand) => sum + operand, 0);
    
    // Crear el problema
    return {
      id: uuidv4(),
      operands,
      correctAnswer,
      difficulty: settings.difficulty,
      displayFormat: settings.displayFormat || DisplayFormat.STANDARD,
      maxAttempts: 1,
      allowDecimals: settings.allowDecimals
    };
  }
  
  /**
   * Genera múltiples problemas de suma
   * @param settings Configuración del ejercicio
   * @param count Número de problemas a generar
   * @returns Lista de problemas de suma
   */
  executeMultiple(settings: AdditionSettings, count: number): AdditionProblem[] {
    return Array.from({ length: count }, () => this.execute(settings));
  }
  
  /**
   * Determina el rango de valores para los operandos según dificultad
   * @param difficulty Nivel de dificultad
   * @param maxValue Valor máximo configurado (opcional)
   * @returns Rango de valores [min, max]
   */
  private getOperandRangeByDifficulty(
    difficulty: DifficultyLevel, 
    maxValue?: number
  ): [number, number] {
    // Valores por defecto según dificultad
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        return [1, maxValue || 10];
      case DifficultyLevel.EASY:
        return [1, maxValue || 20];
      case DifficultyLevel.MEDIUM:
        return [1, maxValue || 50];
      case DifficultyLevel.HARD:
        return [1, maxValue || 100];
      case DifficultyLevel.EXPERT:
        return [10, maxValue || 1000];
      default:
        return [1, maxValue || 20];
    }
  }
  
  /**
   * Genera operandos aleatorios según el rango y configuración
   * @param range Rango de valores [min, max]
   * @param allowNegatives Si se permiten valores negativos
   * @param allowDecimals Si se permiten valores decimales
   * @returns Lista de operandos
   */
  private generateOperands(
    range: [number, number], 
    allowNegatives: boolean,
    allowDecimals: boolean
  ): number[] {
    // Por defecto, generar 2 operandos
    const operandCount = 2;
    
    // Generar operandos aleatorios
    return Array.from({ length: operandCount }, () => {
      let value = this.getRandomNumber(range[0], range[1], allowDecimals);
      
      // Aplicar negativos si está permitido (con 30% de probabilidad)
      if (allowNegatives && Math.random() < 0.3) {
        value = -value;
      }
      
      return value;
    });
  }
  
  /**
   * Genera un número aleatorio en un rango
   * @param min Valor mínimo
   * @param max Valor máximo
   * @param allowDecimals Si se permiten valores decimales
   * @returns Número aleatorio
   */
  private getRandomNumber(min: number, max: number, allowDecimals: boolean): number {
    if (allowDecimals) {
      // Generar valor decimal con máximo 1 decimal
      const value = Math.random() * (max - min) + min;
      return Math.round(value * 10) / 10;
    } else {
      // Generar valor entero
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }
}

// Exportar una instancia única del caso de uso
export const generateProblemUseCase = new GenerateProblemUseCase();