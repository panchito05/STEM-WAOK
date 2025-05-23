import React from 'react';
import { AdditionProblem } from '../../types';

interface ProblemDisplayProps {
  problem: AdditionProblem;
  showVerticalFormat?: boolean;
  attempts: number;
  maxAttempts: number;
}

export const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  showVerticalFormat = true,
  attempts,
  maxAttempts
}) => {
  // Format the problem for display
  const renderProblem = () => {
    // Siempre mostrar formato vertical mejorado para cualquier número de operandos
    if (showVerticalFormat) {
      // Formatear todos los operandos como strings con decimales
      const formattedOperands = problem.operands.map(op => op.toFixed(1));
      
      // Dividir cada operando en parte entera y decimal
      const parts = formattedOperands.map(str => {
        const [intPart, decPart = '0'] = str.split('.');
        return { intPart, decPart };
      });
      
      // Calcular el ancho máximo de la parte entera para alinear correctamente
      const maxIntWidth = Math.max(...parts.map(p => p.intPart.length));
      
      return (
        <div className="font-mono text-xl whitespace-pre">
          {/* Mostrar todos los operandos excepto el último */}
          {parts.slice(0, -1).map((part, idx) => (
            <div key={idx} className="text-right">
              {part.intPart.padStart(maxIntWidth, ' ')}.{part.decPart}
            </div>
          ))}
          
          {/* Mostrar el último operando con el signo + */}
          <div className="flex items-center justify-end">
            <span className="mr-2">+</span>
            <span>
              {parts[parts.length - 1].intPart.padStart(maxIntWidth, ' ')}.
              {parts[parts.length - 1].decPart}
            </span>
          </div>
          
          {/* Línea divisoria */}
          <div className="border-t border-black mt-1 w-full"></div>
        </div>
      );
    } else {
      // Formato horizontal (alternativa)
      return (
        <div className="font-mono text-xl">
          {problem.operands.map((op, index) => (
            <React.Fragment key={index}>
              <span>{op.toFixed(1)}</span>
              {index < problem.operands.length - 1 && <span> + </span>}
            </React.Fragment>
          ))}
          <span> = ?</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-md mb-2">
      {/* Contador de problema e intentos */}
      <div className="flex justify-between mb-2 text-xs font-medium text-gray-600">
        <span>Problema {(problem.index ?? 0) + 1} de {problem.total ?? 1}</span>
        <span>Intentos: {attempts}/{maxAttempts}</span>
      </div>
      {renderProblem()}
    </div>
  );
};

export default ProblemDisplay;