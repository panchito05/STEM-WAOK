// Utilidades de validación robustas para el Modo Profesor

export interface ValidationResult {
  isValid: boolean;
  value: number | null;
  error: string | null;
}

export class InputValidator {
  // Validar entrada numérica con tolerancia para decimales
  static validateNumericInput(input: string): ValidationResult {
    if (!input || input.trim() === '') {
      return {
        isValid: false,
        value: null,
        error: 'La respuesta no puede estar vacía'
      };
    }

    // Limpiar entrada de espacios y caracteres inválidos
    const cleanInput = input.trim().replace(/[^\d.-]/g, '');
    
    if (cleanInput === '') {
      return {
        isValid: false,
        value: null,
        error: 'Por favor ingresa solo números'
      };
    }

    // Verificar múltiples puntos decimales
    const decimalPoints = (cleanInput.match(/\./g) || []).length;
    if (decimalPoints > 1) {
      return {
        isValid: false,
        value: null,
        error: 'Solo se permite un punto decimal'
      };
    }

    // Verificar múltiples signos negativos
    const negativeCount = (cleanInput.match(/-/g) || []).length;
    if (negativeCount > 1 || (negativeCount === 1 && !cleanInput.startsWith('-'))) {
      return {
        isValid: false,
        value: null,
        error: 'Formato de número inválido'
      };
    }

    const numValue = parseFloat(cleanInput);
    
    if (isNaN(numValue) || !isFinite(numValue)) {
      return {
        isValid: false,
        value: null,
        error: 'No es un número válido'
      };
    }

    // Verificar rango razonable para problemas de suma
    if (Math.abs(numValue) > 1000000) {
      return {
        isValid: false,
        value: null,
        error: 'El número es demasiado grande'
      };
    }

    return {
      isValid: true,
      value: numValue,
      error: null
    };
  }

  // Comparar respuestas con tolerancia para decimales
  static compareAnswers(userAnswer: number, correctAnswer: number, tolerance: number = 0.01): boolean {
    return Math.abs(userAnswer - correctAnswer) <= tolerance;
  }

  // Validar problema antes de usarlo
  static validateProblem(problem: any): boolean {
    if (!problem || typeof problem !== 'object') return false;
    if (!Array.isArray(problem.operands)) return false;
    if (problem.operands.length < 2) return false;
    
    return problem.operands.every((operand: any) => {
      const num = typeof operand === 'number' ? operand : parseFloat(operand);
      return !isNaN(num) && isFinite(num);
    });
  }

  // Formatear número para mostrar al usuario
  static formatNumber(num: number): string {
    // Redondear a 2 decimales y eliminar ceros innecesarios
    const rounded = Math.round(num * 100) / 100;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, '');
  }
}

// Utilidades para manejo de errores
export class ErrorHandler {
  private static errors: string[] = [];

  static logError(context: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = `[${context}] ${errorMessage}`;
    
    console.error(fullMessage);
    this.errors.push(fullMessage);
    
    // Mantener solo los últimos 10 errores
    if (this.errors.length > 10) {
      this.errors.shift();
    }
  }

  static getRecentErrors(): string[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }

  static createSafeFunction<T extends (...args: any[]) => any>(
    fn: T,
    context: string,
    fallback?: ReturnType<T>
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        this.logError(context, error);
        return fallback;
      }
    }) as T;
  }
}

// Utilidades de tiempo y delay
export class TimingUtils {
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  static createDelayedAction(
    id: string,
    action: () => void,
    delay: number,
    replace: boolean = true
  ): void {
    // Cancelar timer existente si se especifica reemplazar
    if (replace && this.timers.has(id)) {
      const existingTimer = this.timers.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
    }

    const timer = setTimeout(() => {
      this.timers.delete(id);
      try {
        action();
      } catch (error) {
        ErrorHandler.logError('DelayedAction', error);
      }
    }, delay);

    this.timers.set(id, timer);
  }

  static cancelDelayedAction(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
      return true;
    }
    return false;
  }

  static cancelAllDelayedActions(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }

  static formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Utilidades de persistencia
export class PersistenceUtils {
  private static readonly PREFIX = 'professor_mode_';

  static save(key: string, data: any): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.PREFIX + key, serialized);
      return true;
    } catch (error) {
      ErrorHandler.logError('PersistenceUtils.save', error);
      return false;
    }
  }

  static load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (item === null) return defaultValue;
      
      const parsed = JSON.parse(item);
      return parsed !== null ? parsed : defaultValue;
    } catch (error) {
      ErrorHandler.logError('PersistenceUtils.load', error);
      return defaultValue;
    }
  }

  static remove(key: string): boolean {
    try {
      localStorage.removeItem(this.PREFIX + key);
      return true;
    } catch (error) {
      ErrorHandler.logError('PersistenceUtils.remove', error);
      return false;
    }
  }

  static clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      ErrorHandler.logError('PersistenceUtils.clear', error);
      return false;
    }
  }
}