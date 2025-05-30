import React from 'react';
import { RatiosFractionsPercentsDecimalsProblem } from '../types';

interface VisualProblemDisplayProps {
  problem: RatiosFractionsPercentsDecimalsProblem;
  className?: string;
}

export default function VisualProblemDisplay({ problem, className = "" }: VisualProblemDisplayProps) {
  if (!problem) {
    return <div className={`text-center ${className}`}>No hay problema para mostrar</div>;
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="mb-4">
        <div className="text-lg text-gray-600 mb-2">Resuelve el problema:</div>
        <div className="text-3xl font-mono font-bold">
          {problem.operands[0]} ○ {problem.operands[1]} = ?
        </div>
      </div>
      
      {/* Placeholder para visualización específica del tipo de problema */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-500">
          Área de visualización para el tipo específico de problema
        </p>
      </div>
    </div>
  );
}