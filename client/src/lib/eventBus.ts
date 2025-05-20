/**
 * Sistema de eventos centralizado para la comunicación entre componentes
 * 
 * Este enfoque desacopla completamente los componentes y evita problemas de estado
 * al permitir que cualquier componente emita o escuche eventos sin depender
 * directamente de otros componentes.
 */

// Tipos de eventos soportados por el sistema
export type EventName = 
  | 'levelUp' 
  | 'levelChanged'
  | 'levelUpModalClosed'
  | 'exerciseCompleted' 
  | 'streakAchieved' 
  | 'showReward'
  | 'problemCompleted'
  | 'problemViewed'
  | 'historyRequested';

// Tipo para los datos específicos de cada evento
export interface EventData {
  levelUp: {
    previousLevel: string;
    newLevel: string;
    consecutiveCorrectAnswers: number;
  };
  levelChanged: {
    previousLevel: string;
    newLevel: string;
    consecutiveCorrectAnswers: number;
  };
  levelUpModalClosed: {
    unblockAutoAdvance: boolean;
  };
  exerciseCompleted: {
    score: number;
    totalProblems: number;
    timeSpent: number;
  };
  streakAchieved: {
    streakCount: number;
  };
  showReward: {
    rewardType: 'medals' | 'trophies' | 'stars';
  };
  problemCompleted: {
    problemId: string;
    isCorrect: boolean;
    moduleId: string;
    userAnswer: number | null;
    elapsedTime: number;
  };
  problemViewed: {
    problemId: string;
    moduleId: string;
    fromHistory: boolean;
  };
  historyRequested: {
    moduleId: string;
  };
}

// Tipo para los manejadores de eventos
type EventHandler<T extends EventName> = (data: EventData[T]) => void;

// Almacén de manejadores de eventos
const eventHandlers: {
  [E in EventName]?: EventHandler<E>[];
} = {};

/**
 * Registra un manejador para un evento específico
 */
export function on<T extends EventName>(event: T, handler: EventHandler<T>): void {
  if (!eventHandlers[event]) {
    eventHandlers[event] = [];
  }
  // Asegurarse de que es el tipo correcto (TypeScript no puede inferirlo correctamente aquí)
  (eventHandlers[event] as EventHandler<T>[]).push(handler);
}

/**
 * Elimina un manejador previamente registrado
 */
export function off<T extends EventName>(event: T, handler: EventHandler<T>): void {
  if (!eventHandlers[event]) return;
  
  // Filtrar el manejador específico
  const index = (eventHandlers[event] as EventHandler<T>[]).indexOf(handler);
  if (index >= 0) {
    (eventHandlers[event] as EventHandler<T>[]).splice(index, 1);
  }
}

/**
 * Emite un evento con los datos proporcionados
 */
export function emit<T extends EventName>(event: T, data: EventData[T]): void {
  console.log(`[EVENT BUS] Emitiendo evento '${event}':`, data);
  
  if (!eventHandlers[event]) return;
  
  // Notificar a todos los manejadores registrados
  (eventHandlers[event] as EventHandler<T>[]).forEach(handler => {
    try {
      handler(data);
    } catch (error) {
      console.error(`[EVENT BUS] Error en manejador de '${event}':`, error);
    }
  });
}

// Exportar un objeto único para acceder al sistema de eventos
const eventBus = { on, off, emit };
export default eventBus;