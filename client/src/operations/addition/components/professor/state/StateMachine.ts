// Máquina de estados para el Modo Profesor
export type ProfessorState = 
  | 'idle'                    // Esperando que el usuario empiece
  | 'waiting_answer'          // Esperando respuesta del estudiante
  | 'checking'                // Verificando la respuesta
  | 'correct_feedback'        // Mostrando feedback de respuesta correcta
  | 'incorrect_feedback'      // Mostrando feedback de respuesta incorrecta
  | 'max_attempts_reached'    // Se agotaron los intentos
  | 'transitioning'           // Cambiando al siguiente problema
  | 'complete';               // Ejercicio completado

export type ProfessorEvent = 
  | 'START'                   // Iniciar el ejercicio
  | 'SUBMIT_ANSWER'           // Enviar respuesta
  | 'ANSWER_CORRECT'          // La respuesta es correcta
  | 'ANSWER_INCORRECT'        // La respuesta es incorrecta
  | 'MAX_ATTEMPTS'            // Se alcanzó el máximo de intentos
  | 'CONTINUE'                // Continuar al siguiente problema
  | 'TIMEOUT'                 // Se agotó el tiempo
  | 'RESET'                   // Reiniciar todo
  | 'COMPLETE';               // Terminar ejercicio

// Definición de transiciones válidas
const stateTransitions: Record<ProfessorState, Record<ProfessorEvent, ProfessorState | null>> = {
  idle: {
    START: 'waiting_answer',
    SUBMIT_ANSWER: null,
    ANSWER_CORRECT: null,
    ANSWER_INCORRECT: null,
    MAX_ATTEMPTS: null,
    CONTINUE: null,
    TIMEOUT: null,
    RESET: 'idle',
    COMPLETE: null,
  },

  waiting_answer: {
    START: null,
    SUBMIT_ANSWER: 'checking',
    ANSWER_CORRECT: null,
    ANSWER_INCORRECT: null,
    MAX_ATTEMPTS: null,
    CONTINUE: null,
    TIMEOUT: 'max_attempts_reached',
    RESET: 'idle',
    COMPLETE: 'complete',
  },

  checking: {
    START: null,
    SUBMIT_ANSWER: null,
    ANSWER_CORRECT: 'correct_feedback',
    ANSWER_INCORRECT: 'incorrect_feedback',
    MAX_ATTEMPTS: 'max_attempts_reached',
    CONTINUE: null,
    TIMEOUT: null,
    RESET: 'idle',
    COMPLETE: null,
  },

  correct_feedback: {
    START: null,
    SUBMIT_ANSWER: null,
    ANSWER_CORRECT: null,
    ANSWER_INCORRECT: null,
    MAX_ATTEMPTS: null,
    CONTINUE: 'transitioning',
    TIMEOUT: 'transitioning', // Auto-continuar
    RESET: 'idle',
    COMPLETE: 'complete',
  },

  incorrect_feedback: {
    START: null,
    SUBMIT_ANSWER: null,
    ANSWER_CORRECT: null,
    ANSWER_INCORRECT: null,
    MAX_ATTEMPTS: 'max_attempts_reached',
    CONTINUE: 'waiting_answer',
    TIMEOUT: 'waiting_answer',
    RESET: 'idle',
    COMPLETE: null,
  },

  max_attempts_reached: {
    START: null,
    SUBMIT_ANSWER: null,
    ANSWER_CORRECT: null,
    ANSWER_INCORRECT: null,
    MAX_ATTEMPTS: null,
    CONTINUE: 'transitioning',
    TIMEOUT: 'transitioning',
    RESET: 'idle',
    COMPLETE: 'complete',
  },

  transitioning: {
    START: 'waiting_answer',
    SUBMIT_ANSWER: null,
    ANSWER_CORRECT: null,
    ANSWER_INCORRECT: null,
    MAX_ATTEMPTS: null,
    CONTINUE: null,
    TIMEOUT: null,
    RESET: 'idle',
    COMPLETE: 'complete',
  },

  complete: {
    START: null,
    SUBMIT_ANSWER: null,
    ANSWER_CORRECT: null,
    ANSWER_INCORRECT: null,
    MAX_ATTEMPTS: null,
    CONTINUE: null,
    TIMEOUT: null,
    RESET: 'idle',
    COMPLETE: null,
  },
};

// Clase de la máquina de estados
export class ProfessorStateMachine {
  private currentState: ProfessorState;
  private onStateChange?: (state: ProfessorState, event: ProfessorEvent) => void;

  constructor(initialState: ProfessorState = 'idle') {
    this.currentState = initialState;
  }

  // Obtener el estado actual
  getState(): ProfessorState {
    return this.currentState;
  }

  // Verificar si una transición es válida
  canTransition(event: ProfessorEvent): boolean {
    const nextState = stateTransitions[this.currentState][event];
    return nextState !== null;
  }

  // Ejecutar una transición
  transition(event: ProfessorEvent): boolean {
    const nextState = stateTransitions[this.currentState][event];
    
    if (nextState === null) {
      console.warn(`Transición inválida: ${this.currentState} -> ${event}`);
      return false;
    }

    const previousState = this.currentState;
    this.currentState = nextState;
    
    // Notificar cambio de estado
    if (this.onStateChange) {
      this.onStateChange(this.currentState, event);
    }

    console.log(`Estado: ${previousState} -> ${this.currentState} (evento: ${event})`);
    return true;
  }

  // Configurar callback para cambios de estado
  onStateChanged(callback: (state: ProfessorState, event: ProfessorEvent) => void) {
    this.onStateChange = callback;
  }

  // Reiniciar a estado inicial
  reset() {
    this.currentState = 'idle';
    if (this.onStateChange) {
      this.onStateChange(this.currentState, 'RESET');
    }
  }

  // Verificar si el estado permite enviar respuestas
  canSubmitAnswer(): boolean {
    return this.currentState === 'waiting_answer';
  }

  // Verificar si se está procesando algo
  isProcessing(): boolean {
    return this.currentState === 'checking' || this.currentState === 'transitioning';
  }

  // Verificar si se puede continuar
  canContinue(): boolean {
    return ['correct_feedback', 'incorrect_feedback', 'max_attempts_reached'].includes(this.currentState);
  }

  // Verificar si el ejercicio está completado
  isComplete(): boolean {
    return this.currentState === 'complete';
  }

  // Obtener mensaje de estado para el usuario
  getStatusMessage(): string {
    switch (this.currentState) {
      case 'idle':
        return 'Presiona el botón para comenzar';
      case 'waiting_answer':
        return 'Escribe tu respuesta';
      case 'checking':
        return 'Verificando respuesta...';
      case 'correct_feedback':
        return '¡Correcto! Excelente trabajo';
      case 'incorrect_feedback':
        return 'Incorrecto. Inténtalo de nuevo';
      case 'max_attempts_reached':
        return 'Se agotaron los intentos';
      case 'transitioning':
        return 'Preparando siguiente problema...';
      case 'complete':
        return 'Ejercicio completado';
      default:
        return '';
    }
  }
}

// Hook personalizado para usar la máquina de estados
import { useState, useEffect, useCallback } from 'react';

export const useProfessorStateMachine = (initialState: ProfessorState = 'idle') => {
  const [stateMachine] = useState(() => new ProfessorStateMachine(initialState));
  const [currentState, setCurrentState] = useState<ProfessorState>(stateMachine.getState());

  // Configurar listener para cambios de estado
  useEffect(() => {
    stateMachine.onStateChanged((newState) => {
      setCurrentState(newState);
    });
  }, [stateMachine]);

  // Funciones de conveniencia
  const transition = useCallback((event: ProfessorEvent): boolean => {
    return stateMachine.transition(event);
  }, [stateMachine]);

  const canTransition = useCallback((event: ProfessorEvent): boolean => {
    return stateMachine.canTransition(event);
  }, [stateMachine]);

  const reset = useCallback(() => {
    stateMachine.reset();
  }, [stateMachine]);

  return {
    currentState,
    transition,
    canTransition,
    reset,
    canSubmitAnswer: stateMachine.canSubmitAnswer(),
    isProcessing: stateMachine.isProcessing(),
    canContinue: stateMachine.canContinue(),
    isComplete: stateMachine.isComplete(),
    statusMessage: stateMachine.getStatusMessage(),
  };
};