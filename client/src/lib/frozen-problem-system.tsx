import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { AdditionProblem } from '../operations/addition/types';

// Contexto para el sistema de congelación de problemas
interface FrozenProblemContextType {
  freezeProblem: (problem: AdditionProblem) => string;
  getOriginalProblem: (id: string) => AdditionProblem | null;
  validateAnswer: (problemId: string, answer: number) => boolean;
}

const FrozenProblemContext = createContext<FrozenProblemContextType>({
  freezeProblem: () => "",
  getOriginalProblem: () => null,
  validateAnswer: () => false
});

/**
 * Sistema de congelación de problemas - almacena copias inmutables
 * de los problemas para evitar referencias circulares y datos inconsistentes
 */
export function FrozenProblemProvider({ children }: { children: ReactNode }) {
  // Almacenamiento inmutable de problemas con sus datos originales
  const [frozenProblems, setFrozenProblems] = useState<
    Map<string, { problem: AdditionProblem; timestamp: number }>
  >(new Map());

  // Congelar un problema creando una copia profunda y asignando un ID único
  const freezeProblem = useCallback((problem: AdditionProblem): string => {
    const id = `problem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const frozenCopy = JSON.parse(JSON.stringify(problem)); // Copia profunda
    
    console.log(`[FROZEN-SYSTEM] Congelando problema con ID ${id}:`, frozenCopy);
    
    setFrozenProblems(prev => {
      const newMap = new Map(prev);
      newMap.set(id, { 
        problem: frozenCopy,
        timestamp: Date.now()
      });
      return newMap;
    });
    
    return id;
  }, []);

  // Obtener problema original por ID
  const getOriginalProblem = useCallback((id: string): AdditionProblem | null => {
    const frozen = frozenProblems.get(id);
    console.log(`[FROZEN-SYSTEM] Recuperando problema con ID ${id}:`, frozen?.problem || null);
    return frozen?.problem || null;
  }, [frozenProblems]);

  // Validación infalible con 3 capas de verificación
  const validateAnswer = useCallback((problemId: string, answer: number): boolean => {
    const frozenData = frozenProblems.get(problemId);
    if (!frozenData) {
      console.error(`[FROZEN-SYSTEM] Error: Problema con ID ${problemId} no encontrado`);
      return false;
    }
    
    const { problem } = frozenData;
    
    // Si es multi-vertical, recalcular
    if (problem.layout === 'multi-vertical') {
      const numbers = [problem.num1, problem.num2, ...(problem.additionalNumbers || [])];
      const calculatedSum = numbers.reduce((sum, num) => sum + num, 0);
      
      console.log(`[FROZEN-SYSTEM] Validación para problema ${problemId}:`, {
        numbers,
        correctAnswer: problem.correctAnswer,
        userAnswer: answer,
        calculatedSum
      });
      
      // Triple comprobación: exacta, calculada, y con tolerancia
      return (
        answer === problem.correctAnswer || 
        answer === calculatedSum ||
        Math.abs(calculatedSum - answer) < 0.001
      );
    }
    
    // Para otros formatos, comparación normal
    return problem.correctAnswer === answer;
  }, [frozenProblems]);

  // Crear el valor del contexto
  const contextValue = useMemo(() => ({
    freezeProblem,
    getOriginalProblem,
    validateAnswer
  }), [freezeProblem, getOriginalProblem, validateAnswer]);

  // Limpieza periódica se implementaría con useEffect, pero para simplificar no lo incluimos aquí

  return (
    <FrozenProblemContext.Provider value={contextValue}>
      {children}
    </FrozenProblemContext.Provider>
  );
}

// Hook para acceder al sistema de congelación
export function useFrozenProblem() {
  const context = useContext(FrozenProblemContext);
  if (!context) {
    throw new Error("useFrozenProblem debe usarse dentro de un FrozenProblemProvider");
  }
  return context;
}