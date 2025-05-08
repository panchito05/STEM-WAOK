import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { AdditionProblem } from '../operations/addition/types';
import { superRobustNumberComparison } from './super-robust-number-comparison';

// Crear el tipo básico para el contexto
interface FrozenProblemContext {
  freezeProblem: (problem: AdditionProblem) => string;
  getOriginalProblem: (id: string) => AdditionProblem | null;
  validateAnswer: (id: string, answer: number) => boolean;
}

// Crear el contexto
const FrozenProblemContext = createContext<FrozenProblemContext | null>(null);

// Proveedor del contexto
export function FrozenProblemProvider({ children }: { children: ReactNode }) {
  // Almacén de problemas congelados
  const frozenProblems = useRef<{
    [id: string]: {
      problem: AdditionProblem;
      timestamp: number;
    }
  }>({});
  
  // Congelar un problema para evitar modificaciones
  const freezeProblem = (problem: AdditionProblem): string => {
    // Generar ID único
    const id = `problem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Crear una copia profunda y congelarla
    const frozenProblem = JSON.parse(JSON.stringify(problem));
    Object.freeze(frozenProblem);
    
    // Guardar junto con timestamp
    frozenProblems.current[id] = {
      problem: frozenProblem,
      timestamp: Date.now()
    };
    
    console.log(`[FROZEN-PROBLEM] Problema congelado con ID: ${id}`);
    
    return id;
  };
  
  // Recuperar un problema original por ID
  const getOriginalProblem = (id: string): AdditionProblem | null => {
    if (!frozenProblems.current[id]) {
      console.error(`[FROZEN-PROBLEM] Problema no encontrado con ID: ${id}`);
      return null;
    }
    
    return frozenProblems.current[id].problem;
  };
  
  // Validar una respuesta contra un problema congelado
  const validateAnswer = (id: string, answer: number): boolean => {
    // Verificar si el problema existe
    if (!frozenProblems.current[id]) {
      console.error(`[FROZEN-PROBLEM] Validación fallida - Problema no encontrado con ID: ${id}`);
      return false;
    }
    
    const { problem } = frozenProblems.current[id];
    
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
    
    console.log(`[FROZEN-PROBLEM] Validación (ID: ${id}): ${isCorrect ? 'CORRECTA' : 'INCORRECTA'}`);
    console.log(`[FROZEN-PROBLEM] Detalles: Respuesta=${answer}, Suma correcta=${correctSum}, Respuesta esperada=${problem.correctAnswer}`);
    
    return isCorrect;
  };
  
  // Valores del contexto
  const value = {
    freezeProblem,
    getOriginalProblem,
    validateAnswer
  };
  
  return (
    <FrozenProblemContext.Provider value={value}>
      {children}
    </FrozenProblemContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useFrozenProblem() {
  const context = useContext(FrozenProblemContext);
  if (!context) {
    throw new Error('useFrozenProblem debe usarse dentro de un FrozenProblemProvider');
  }
  return context;
}