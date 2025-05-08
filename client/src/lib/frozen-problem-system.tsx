import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AdditionProblem } from '../operations/addition/types';
import { superRobustNumberComparison } from './super-robust-number-comparison';

// Definir el tipo para nuestro contexto
interface FrozenProblemContextType {
  freezeProblem: (problem: AdditionProblem) => string;
  getOriginalProblem: (id: string) => AdditionProblem | null;
  validateAnswer: (id: string, answer: number) => boolean;
}

// Crear el contexto
const FrozenProblemContext = createContext<FrozenProblemContextType | null>(null);

// Proveedor del contexto
export function FrozenProblemProvider({ children }: { children: ReactNode }) {
  // Estado para almacenar los problemas congelados
  const [frozenProblems, setFrozenProblems] = useState<Record<string, AdditionProblem>>({});

  // Congelar un problema y asignarle un ID único
  const freezeProblem = (problem: AdditionProblem): string => {
    // Crear un ID único para el problema
    const id = `problem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Almacenar una copia profunda del problema (inmutable)
    const frozenProblemCopy = JSON.parse(JSON.stringify(problem));
    
    // Guardar en el estado
    setFrozenProblems(prev => ({
      ...prev,
      [id]: frozenProblemCopy
    }));
    
    console.log(`[FROZEN-PROBLEM] Problema congelado con ID: ${id}`);
    return id;
  };

  // Recuperar un problema congelado por su ID
  const getOriginalProblem = (id: string): AdditionProblem | null => {
    if (!id || !frozenProblems[id]) {
      console.warn(`[FROZEN-PROBLEM] No se encontró problema con ID: ${id}`);
      return null;
    }
    
    return frozenProblems[id];
  };

  // Validar una respuesta contra un problema congelado
  const validateAnswer = (id: string, answer: number): boolean => {
    const problem = getOriginalProblem(id);
    if (!problem) return false;
    
    // Calcular la suma correcta del problema original
    const numbers = [
      problem.num1, 
      problem.num2, 
      ...(problem.additionalNumbers || [])
    ];
    
    const correctSum = numbers.reduce((sum, num) => sum + num, 0);
    
    // Comparación super robusta
    const isCorrect = superRobustNumberComparison(answer, correctSum) || 
                     superRobustNumberComparison(answer, problem.correctAnswer);
    
    console.log(`[FROZEN-PROBLEM] Validación para problema ${id}: ${isCorrect ? 'CORRECTO' : 'INCORRECTO'}`);
    console.log(`[FROZEN-PROBLEM] Detalles: Respuesta=${answer}, Suma correcta=${correctSum}, Respuesta esperada=${problem.correctAnswer}`);
    
    return isCorrect;
  };

  // Proporcionar los valores del contexto
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