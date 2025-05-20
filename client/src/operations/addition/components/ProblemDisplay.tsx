// ProblemDisplay.tsx - Componente para mostrar el problema actual
import React from 'react';
import { Problem } from '../types';

interface ProblemDisplayProps {
  problem: Problem;
  userAnswer: string | number;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ problem, userAnswer }) => {
  // Función para formatear problemas para mostrar
  const formatProblemToString = (problem: Problem): string => {
    if (problem.displayText) {
      return problem.displayText;
    }
    
    // Formato horizontal por defecto
    return `${problem.operands.join(' + ')} = ?`;
  };
  
  // Renderizar según el formato del problema
  if (problem.displayFormat === 'word') {
    return (
      <div className="problem-word-container">
        <p className="text-lg">{problem.displayText}</p>
        <div className="answer-container mt-4">
          <div className="flex items-center justify-center">
            <span className="text-xl mr-2">Respuesta:</span>
            <div className="border-b-2 border-primary px-2 min-w-[60px]">
              <span className="text-xl">{userAnswer || ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (problem.displayFormat === 'vertical') {
    // Mostrar operandos verticalmente
    return (
      <div className="problem-vertical-container flex justify-center">
        <div className="flex flex-col items-end">
          {problem.operands.map((operand, index) => (
            <div key={index} className="text-xl font-mono">
              {index === 0 ? operand : <span>+ {operand}</span>}
            </div>
          ))}
          <div className="border-t-2 border-gray-800 dark:border-gray-200 my-1 w-full"></div>
          <div className="text-xl font-mono min-w-[60px] text-right">
            {userAnswer || '?'}
          </div>
        </div>
      </div>
    );
  }
  
  // Formato horizontal por defecto
  return (
    <div className="problem-horizontal-container flex justify-center items-center">
      <div className="text-2xl font-bold">
        {problem.operands.join(' + ')} = {userAnswer || '?'}
      </div>
    </div>
  );
};

export default ProblemDisplay;