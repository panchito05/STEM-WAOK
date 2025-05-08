import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { AdditionProblem } from '../operations/addition/types';
import { superRobustNumberComparison } from './super-robust-number-comparison';

// Define una acción atómica
interface AtomicAction {
  id: string;
  type: 'CHECK_ANSWER' | 'GENERATE_PROBLEM' | 'SUBMIT_ANSWER' | 'VALIDATE_VISUALIZATION';
  payload: any;
  timestamp: number;
  completed: boolean;
  result?: any;
}

interface ActionQueueContextType {
  queueAction: <T>(type: AtomicAction['type'], payload: any) => Promise<T>;
  currentState: 'idle' | 'processing';
}

const ActionQueueContext = createContext<ActionQueueContextType>({
  queueAction: async () => null as any,
  currentState: 'idle'
});

/**
 * Proveedor de sistema de cola de acciones para garantizar ejecución
 * secuencial y atómica de operaciones críticas
 */
export function ActionQueueProvider({ children }: { children: ReactNode }) {
  // Cola de acciones a procesar en secuencia
  const [actionQueue, setActionQueue] = useState<AtomicAction[]>([]);
  const [currentState, setCurrentState] = useState<'idle' | 'processing'>('idle');
  
  const isProcessing = useRef(false);
  
  // Añadir una acción a la cola con sistema de promesas
  const queueAction = useCallback(async <T,>(type: AtomicAction['type'], payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      const newAction: AtomicAction = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        payload,
        timestamp: Date.now(),
        completed: false
      };
      
      console.log(`[ACTION-QUEUE] Encolando acción: ${type} (${newAction.id})`);
      
      setActionQueue(prev => [...prev, newAction]);
      
      // Configurar un timeout de seguridad (30 segundos)
      const timeoutId = setTimeout(() => {
        console.error(`[ACTION-QUEUE] Acción ${newAction.id} cancelada por timeout después de 30 segundos`);
        reject(new Error(`Action ${newAction.id} timed out after 30 seconds`));
        
        // Retirar la acción de la cola
        setActionQueue(prev => prev.filter(a => a.id !== newAction.id));
      }, 30000);
      
      // Configurar un intervalo para comprobar cuando la acción se complete
      const checkInterval = setInterval(() => {
        setActionQueue(prev => {
          const action = prev.find(a => a.id === newAction.id);
          if (action?.completed) {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            console.log(`[ACTION-QUEUE] Acción completada: ${action.type} (${action.id})`);
            resolve(action.result);
            return prev;
          }
          return prev;
        });
      }, 100);
    });
  }, []);
  
  // Procesar la cola de acciones
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessing.current || actionQueue.length === 0) return;
      
      isProcessing.current = true;
      setCurrentState('processing');
      
      try {
        // Obtener la primera acción no completada
        const action = actionQueue.find(a => !a.completed);
        if (!action) {
          isProcessing.current = false;
          setCurrentState('idle');
          return;
        }
        
        console.log(`[ACTION-QUEUE] Procesando acción: ${action.type} (${action.id})`);
        
        // Realizar la acción según su tipo
        let result;
        
        switch (action.type) {
          case 'CHECK_ANSWER':
            // Implementar lógica de verificación de respuesta
            const { problem, answer } = action.payload;
            result = checkAnswerSafely(problem, answer);
            break;
            
          case 'GENERATE_PROBLEM':
            // Generar un problema de forma segura
            const { difficulty } = action.payload;
            result = generateProblemSafely(difficulty);
            break;
            
          case 'SUBMIT_ANSWER':
            // Manejar la presentación de respuesta
            const { problemId, answer: userAnswer } = action.payload;
            result = submitAnswerSafely(problemId, userAnswer);
            break;
            
          case 'VALIDATE_VISUALIZATION':
            // Verificar que la visualización coincide con los datos
            const { displayedNumbers, originalNumbers } = action.payload;
            result = validateVisualization(displayedNumbers, originalNumbers);
            break;
            
          default:
            console.error(`[ACTION-QUEUE] Tipo de acción desconocido: ${action.type}`);
            result = false;
        }
        
        // Marcar la acción como completada con su resultado
        setActionQueue(prev => prev.map(a => 
          a.id === action.id 
            ? { ...a, completed: true, result } 
            : a
        ));
        
        // Esperar un poco antes de procesar la siguiente acción
        // para garantizar la actualización de estado
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } finally {
        isProcessing.current = false;
        setCurrentState('idle');
      }
    };
    
    processQueue();
  }, [actionQueue]);
  
  // Usar un efecto para iniciar el procesamiento de la cola cuando cambia
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isProcessing.current && actionQueue.length > 0) {
        const pendingAction = actionQueue.find(a => !a.completed);
        if (pendingAction) {
          console.log(`[ACTION-QUEUE] Procesando cola con ${actionQueue.length} acciones en espera`);
          setCurrentState('processing');
          isProcessing.current = false; // Forzar el reinicio
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [actionQueue]);
  
  return (
    <ActionQueueContext.Provider value={{ queueAction, currentState }}>
      {children}
    </ActionQueueContext.Provider>
  );
}

// Funciones seguras implementadas para cada tipo de acción

/**
 * Verificar la respuesta de forma segura con múltiples capas de comprobación
 */
function checkAnswerSafely(problem: AdditionProblem, answer: number): boolean {
  try {
    console.log(`[ACTION-QUEUE] Verificando respuesta: ${answer} para problema:`, problem);
    
    // Triple verificación
    // 1. Verificación estándar - comparación directa
    const standardCheck = answer === problem.correctAnswer;
    
    // 2. Verificación con cálculo manual
    let manualCheck = false;
    try {
      const numbers = [problem.num1, problem.num2, ...(problem.additionalNumbers || [])];
      const calculatedSum = numbers.reduce((sum, num) => sum + num, 0);
      manualCheck = superRobustNumberComparison(answer, calculatedSum);
      
      console.log(`[ACTION-QUEUE] Verificación manual: ${manualCheck} (${answer} vs ${calculatedSum})`);
    } catch (err) {
      console.error("[ACTION-QUEUE] Error en verificación manual:", err);
    }
    
    // 3. Verificación aproximada (tolerancia)
    let approximateCheck = false;
    try {
      // Comparar con tolerancia para errores de punto flotante
      approximateCheck = Math.abs(answer - problem.correctAnswer) < 0.01;
      console.log(`[ACTION-QUEUE] Verificación aproximada: ${approximateCheck}`);
    } catch (err) {
      console.error("[ACTION-QUEUE] Error en verificación aproximada:", err);
    }
    
    // Considerar correcto si cualquiera de las verificaciones es positiva
    const isCorrect = standardCheck || manualCheck || approximateCheck;
    console.log(`[ACTION-QUEUE] Resultado final de verificación: ${isCorrect} (Standard: ${standardCheck}, Manual: ${manualCheck}, Approx: ${approximateCheck})`);
    
    return isCorrect;
  } catch (err) {
    console.error("[ACTION-QUEUE] Error crítico en checkAnswerSafely:", err);
    // En caso de error crítico, por defecto aceptamos la respuesta
    // para evitar frustrar al usuario por problemas técnicos
    return true;
  }
}

/**
 * Generar un problema de forma segura 
 */
function generateProblemSafely(difficulty: string): AdditionProblem {
  try {
    console.log(`[ACTION-QUEUE] Generando problema con dificultad: ${difficulty}`);
    // Implementación simplificada - en producción se usaría la función real
    const problem: AdditionProblem = {
      num1: 5,
      num2: 10,
      correctAnswer: 15,
      layout: 'horizontal'
    };
    
    return problem;
  } catch (err) {
    console.error("[ACTION-QUEUE] Error generando problema:", err);
    // Problema de respaldo en caso de error
    return {
      num1: 1,
      num2: 1,
      correctAnswer: 2,
      layout: 'horizontal'
    };
  }
}

/**
 * Enviar respuesta de forma segura
 */
function submitAnswerSafely(problemId: string, answer: number): boolean {
  try {
    console.log(`[ACTION-QUEUE] Enviando respuesta ${answer} para problema ${problemId}`);
    // Implementación simplificada - en producción obtendría el problema del sistema de congelación
    return true;
  } catch (err) {
    console.error("[ACTION-QUEUE] Error enviando respuesta:", err);
    return false;
  }
}

/**
 * Validar que los números mostrados coinciden con los originales
 */
function validateVisualization(displayedNumbers: number[], originalNumbers: number[]): boolean {
  try {
    console.log(`[ACTION-QUEUE] Validando visualización:`, { 
      displayed: displayedNumbers, 
      original: originalNumbers 
    });
    
    if (displayedNumbers.length !== originalNumbers.length) {
      console.error("[ACTION-QUEUE] Longitudes de arrays no coinciden");
      return false;
    }
    
    const allMatch = displayedNumbers.every((num, idx) => {
      const originalNum = originalNumbers[idx];
      const match = superRobustNumberComparison(num, originalNum);
      
      if (!match) {
        console.error(`[ACTION-QUEUE] Discrepancia en número ${idx}: ${num} vs ${originalNum}`);
      }
      
      return match;
    });
    
    return allMatch;
  } catch (err) {
    console.error("[ACTION-QUEUE] Error en validación visual:", err);
    return false;
  }
}

// Hook para acceder al sistema de cola
export function useActionQueue() {
  const context = useContext(ActionQueueContext);
  if (!context) {
    throw new Error("useActionQueue debe usarse dentro de un ActionQueueProvider");
  }
  return context;
}