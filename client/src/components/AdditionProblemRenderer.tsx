// AdditionProblemRenderer.tsx - Componente para renderizar problemas de suma en diferentes partes de la aplicación
import React from 'react';

interface Problem {
  operands: number[];
  result: number;
}

interface AdditionProblemRendererProps {
  problem: {
    operands: number[];
    result: number;
  } | string;
  isCompact?: boolean;
  showAnswer?: boolean;
  highlightCorrect?: boolean;
}

/**
 * Componente para renderizar de forma consistente un problema de suma
 * en diferentes partes de la aplicación (ejercicios, historial, etc.)
 */
const AdditionProblemRenderer: React.FC<AdditionProblemRendererProps> = ({
  problem,
  isCompact = false,
  showAnswer = true,
  highlightCorrect = false
}) => {
  // Si el problema es una cadena, intentar extraer los números
  let operands: number[] = [];
  let result: number | null = null;
  
  if (typeof problem === 'string') {
    // Intentar analizar la cadena del problema (formato típico: "5 + 7 = 12")
    const parts = problem.split('=');
    if (parts.length === 2) {
      // Extraer resultado
      result = parseInt(parts[1].trim());
      
      // Extraer operandos
      const operandParts = parts[0].split('+');
      operands = operandParts.map(op => parseInt(op.trim())).filter(n => !isNaN(n));
    }
  } else {
    // Si ya es un objeto problema, usarlo directamente
    operands = problem.operands;
    result = problem.result;
  }
  
  // Determinar clases según configuración
  const containerClasses = isCompact 
    ? 'text-sm inline-flex items-center'
    : 'text-lg md:text-xl flex items-center justify-center';
    
  const resultClasses = highlightCorrect && showAnswer
    ? 'font-bold text-green-600'
    : 'font-medium';
    
  return (
    <div className={containerClasses}>
      {operands.map((operand, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-1">+</span>}
          <span className="font-mono">{operand}</span>
        </React.Fragment>
      ))}
      <span className="mx-1">=</span>
      {showAnswer ? (
        <span className={`font-mono ${resultClasses}`}>{result}</span>
      ) : (
        <span className="font-mono text-gray-400">?</span>
      )}
    </div>
  );
};

export default AdditionProblemRenderer;