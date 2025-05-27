/**
 * Sistema de middleware para el módulo de suma
 * 
 * Este archivo centraliza todo el middleware para validación,
 * registro y aplicación de reglas de negocio.
 */

import { AdditionProblem, DifficultyLevel, Problem, UserAnswer } from '../types';
import { validateAdditionProblem, validateProblem, validateUserAnswer, ValidationResult } from './validators';

// Tipo para las funciones de middleware
type MiddlewareFunction<T> = (data: T) => T;

// Clase que implementa el patrón Observable para eventos del módulo
export class AdditionObserver {
  private static instance: AdditionObserver;
  private listeners: Map<string, Function[]> = new Map();
  
  private constructor() {}
  
  public static getInstance(): AdditionObserver {
    if (!AdditionObserver.instance) {
      AdditionObserver.instance = new AdditionObserver();
    }
    return AdditionObserver.instance;
  }
  
  public subscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  public unsubscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  
  public notify(event: string, data: any): void {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event)!.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en listener del evento ${event}:`, error);
      }
    });
  }
}

/**
 * Servicio central de middleware del módulo de suma
 */
export class AdditionMiddleware {
  private static instance: AdditionMiddleware;
  private observer: AdditionObserver;
  
  // Cadenas de middleware para cada tipo de operación
  private problemMiddlewares: MiddlewareFunction<AdditionProblem>[] = [];
  private userAnswerMiddlewares: MiddlewareFunction<UserAnswer>[] = [];
  
  private constructor() {
    this.observer = AdditionObserver.getInstance();
    
    // Agregar middleware de validación por defecto
    this.problemMiddlewares.push(this.validateProblemMiddleware);
    this.userAnswerMiddlewares.push(this.validateUserAnswerMiddleware);
    
    // Agregar middleware de registro por defecto
    this.problemMiddlewares.push(this.logProblemMiddleware);
    this.userAnswerMiddlewares.push(this.logUserAnswerMiddleware);
  }
  
  public static getInstance(): AdditionMiddleware {
    if (!AdditionMiddleware.instance) {
      AdditionMiddleware.instance = new AdditionMiddleware();
    }
    return AdditionMiddleware.instance;
  }
  
  /**
   * Agrega un middleware a la cadena de procesamiento de problemas
   */
  public addProblemMiddleware(middleware: MiddlewareFunction<AdditionProblem>): void {
    this.problemMiddlewares.push(middleware);
  }
  
  /**
   * Agrega un middleware a la cadena de procesamiento de respuestas de usuario
   */
  public addUserAnswerMiddleware(middleware: MiddlewareFunction<UserAnswer>): void {
    this.userAnswerMiddlewares.push(middleware);
  }
  
  /**
   * Procesa un problema a través de toda la cadena de middleware
   */
  public processProblem(problem: AdditionProblem): AdditionProblem {
    let processedProblem = { ...problem };
    
    for (const middleware of this.problemMiddlewares) {
      processedProblem = middleware(processedProblem);
    }
    
    // Notificar que se ha procesado un problema
    this.observer.notify('problem_processed', processedProblem);
    
    return processedProblem;
  }
  
  /**
   * Procesa una respuesta de usuario a través de toda la cadena de middleware
   */
  public processUserAnswer(answer: UserAnswer): UserAnswer {
    let processedAnswer = { ...answer };
    
    for (const middleware of this.userAnswerMiddlewares) {
      processedAnswer = middleware(processedAnswer);
    }
    
    // Notificar que se ha procesado una respuesta
    this.observer.notify('user_answer_processed', processedAnswer);
    
    return processedAnswer;
  }
  
  /**
   * Middleware de validación para problemas
   */
  private validateProblemMiddleware: MiddlewareFunction<AdditionProblem> = (problem) => {
    const validation = validateAdditionProblem(problem);
    
    if (!validation.isValid) {
      // Notificar error de validación
      this.observer.notify('validation_error', {
        type: 'problem',
        errors: validation.errors,
        data: problem
      });
      
      console.error('Error de validación en problema:', validation.errors);
      // Lanzar error en modo desarrollo, pero en producción continuar con el problema original
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Problema inválido: ${JSON.stringify(validation.errors)}`);
      }
    }
    
    return problem;
  };
  
  /**
   * Middleware de validación para respuestas de usuario
   */
  private validateUserAnswerMiddleware: MiddlewareFunction<UserAnswer> = (answer) => {
    const validation = validateUserAnswer(answer);
    
    if (!validation.isValid) {
      // Notificar error de validación
      this.observer.notify('validation_error', {
        type: 'user_answer',
        errors: validation.errors,
        data: answer
      });
      
      console.error('Error de validación en respuesta de usuario:', validation.errors);
      // Lanzar error en modo desarrollo, pero en producción continuar con la respuesta original
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Respuesta de usuario inválida: ${JSON.stringify(validation.errors)}`);
      }
    }
    
    return answer;
  };
  
  /**
   * Middleware de registro para problemas
   */
  private logProblemMiddleware: MiddlewareFunction<AdditionProblem> = (problem) => {
    try {
      // Registrar solo información relevante para debugging
      const simplifiedProblem = {
        id: problem.id,
        operands: problem.operands,
        layout: problem.layout,
        hasDecimals: problem.answerDecimalPosition !== undefined
      };
      
      console.log('[ADDITION MIDDLEWARE] Problema procesado:', simplifiedProblem);
    } catch (error) {
      console.error('Error al registrar problema:', error);
    }
    
    return problem;
  };
  
  /**
   * Middleware de registro para respuestas de usuario
   */
  private logUserAnswerMiddleware: MiddlewareFunction<UserAnswer> = (answer) => {
    try {
      // Registrar solo información relevante para debugging
      const simplifiedAnswer = {
        problemId: answer.problemId,
        isCorrect: answer.isCorrect,
        attempts: answer.attempts,
        status: answer.status
      };
      
      console.log('[ADDITION MIDDLEWARE] Respuesta de usuario procesada:', simplifiedAnswer);
    } catch (error) {
      console.error('Error al registrar respuesta de usuario:', error);
    }
    
    return answer;
  };
}

// Funciones de conveniencia para uso en componentes

/**
 * Procesa un problema a través del middleware
 */
export function processProblem(problem: AdditionProblem): AdditionProblem {
  return AdditionMiddleware.getInstance().processProblem(problem);
}

/**
 * Procesa una respuesta de usuario a través del middleware
 */
export function processUserAnswer(answer: UserAnswer): UserAnswer {
  return AdditionMiddleware.getInstance().processUserAnswer(answer);
}

/**
 * Registra un callback para un evento específico
 */
export function on(event: string, callback: Function): void {
  AdditionObserver.getInstance().subscribe(event, callback);
}

/**
 * Elimina un callback para un evento específico
 */
export function off(event: string, callback: Function): void {
  AdditionObserver.getInstance().unsubscribe(event, callback);
}

/**
 * Middleware auxiliar para aplicar reglas de negocio a problemas según su dificultad
 */
export function applyDifficultyRules(problem: AdditionProblem, difficulty: DifficultyLevel): AdditionProblem {
  let modifiedProblem = { ...problem };
  
  switch (difficulty) {
    case 'beginner':
      // Principiante: Siempre horizontal, sin decimales, números pequeños
      modifiedProblem.layout = 'horizontal';
      modifiedProblem.answerDecimalPosition = undefined;
      break;
      
    case 'elementary':
      // Elemental: Puede ser vertical, sin decimales
      modifiedProblem.answerDecimalPosition = undefined;
      break;
      
    case 'intermediate':
      // No necesita modificaciones específicas
      break;
      
    case 'advanced':
      // Avanzado: Si no tiene decimales y es muy simple, hacerlo más desafiante
      if (!modifiedProblem.answerDecimalPosition && modifiedProblem.operands.length < 3) {
        // Agregar un operando adicional para hacerlo más desafiante
        const newOperand = Math.floor(Math.random() * 10) + 1;
        modifiedProblem.operands = [...modifiedProblem.operands, newOperand];
        modifiedProblem.correctAnswer += newOperand;
      }
      break;
      
    case 'expert':
      // Experto: Si es demasiado simple, hacerlo más desafiante
      if (modifiedProblem.operands.length < 3) {
        // Agregar operandos adicionales para expertos
        const newOperands = [
          Math.floor(Math.random() * 100) + 1,
          Math.floor(Math.random() * 50) + 1
        ];
        modifiedProblem.operands = [...modifiedProblem.operands, ...newOperands];
        modifiedProblem.correctAnswer *= newOperands.reduce((product, val) => product * val, 1);
      }
      break;
  }
  
  return modifiedProblem;
}