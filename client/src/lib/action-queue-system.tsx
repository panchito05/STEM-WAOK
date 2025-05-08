import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { superRobustNumberComparison } from './super-robust-number-comparison';
import { AdditionProblem } from '../operations/addition/types';

// Tipo de estado
type QueueState = 'idle' | 'processing';

// Crear el tipo básico para el contexto
interface ActionQueueContext {
  queueAction: (type: string, data: any) => Promise<any>;
  currentState: QueueState;
}

// Crear el contexto
const ActionQueueContext = createContext<ActionQueueContext | null>(null);

// Proveedor del contexto
export function ActionQueueProvider({ children }: { children: ReactNode }) {
  // Estado para rastrear el estado actual de la cola
  const [state, setState] = useState<QueueState>('idle');
  
  // Función para encolar y procesar una acción
  const queueAction = useCallback(async (type: string, data: any): Promise<any> => {
    // Cambiar el estado a procesando
    setState('processing');
    
    console.log(`[ACTION-QUEUE] Procesando acción: ${type}`);
    
    try {
      // Simulación de procesamiento asíncrono
      await new Promise(resolve => setTimeout(resolve, 50));
      
      let result: any;
      
      // Procesar la acción según su tipo
      switch (type) {
        case 'CHECK_ANSWER': {
          const { problem, answer } = data;
          
          // Calcular la suma correcta
          const numbers = [
            problem.num1, 
            problem.num2, 
            ...(problem.additionalNumbers || [])
          ];
          
          const correctSum = numbers.reduce((sum, num) => sum + num, 0);
          
          // Verificar usando la comparación super robusta
          const isCorrect = superRobustNumberComparison(answer, correctSum) || 
                           superRobustNumberComparison(answer, problem.correctAnswer);
          
          console.log(`[ACTION-QUEUE] Verificación de respuesta: ${isCorrect ? 'CORRECTA' : 'INCORRECTA'}`);
          console.log(`[ACTION-QUEUE] Detalles: Respuesta=${answer}, Suma correcta=${correctSum}, Respuesta esperada=${problem.correctAnswer}`);
          
          result = isCorrect;
          break;
        }
        
        case 'VERIFY_DISPLAY': {
          const { displayedNumbers, originalNumbers } = data;
          
          // Verificar si las longitudes coinciden
          if (displayedNumbers.length !== originalNumbers.length) {
            console.log(`[ACTION-QUEUE] Verificación visual FALLIDA: longitudes diferentes`);
            result = false;
            break;
          }
          
          // Verificar cada número individualmente
          let allMatch = true;
          for (let i = 0; i < displayedNumbers.length; i++) {
            const match = superRobustNumberComparison(displayedNumbers[i], originalNumbers[i]);
            if (!match) {
              allMatch = false;
              console.log(`[ACTION-QUEUE] Discrepancia en número ${i}: Mostrado=${displayedNumbers[i]}, Original=${originalNumbers[i]}`);
            }
          }
          
          console.log(`[ACTION-QUEUE] Verificación visual: ${allMatch ? 'EXITOSA' : 'FALLIDA'}`);
          result = allMatch;
          break;
        }
        
        case 'SAVE_PROGRESS': {
          const { score, difficulty, moduleId } = data;
          
          // Simulación de guardado exitoso
          console.log(`[ACTION-QUEUE] Progreso guardado para módulo ${moduleId}: Puntuación=${score}, Dificultad=${difficulty}`);
          
          result = true;
          break;
        }
        
        default:
          throw new Error(`Tipo de acción no soportado: ${type}`);
      }
      
      // Retornar a estado inactivo
      setState('idle');
      
      console.log(`[ACTION-QUEUE] Acción ${type} completada con éxito`);
      return result;
    } catch (error) {
      // En caso de error, también retornar a estado inactivo
      setState('idle');
      
      console.error(`[ACTION-QUEUE] Error procesando acción ${type}:`, error);
      throw error;
    }
  }, []);
  
  // Valores del contexto
  const value = {
    queueAction,
    currentState: state
  };
  
  return (
    <ActionQueueContext.Provider value={value}>
      {children}
    </ActionQueueContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useActionQueue() {
  const context = useContext(ActionQueueContext);
  if (!context) {
    throw new Error('useActionQueue debe usarse dentro de un ActionQueueProvider');
  }
  return context;
}