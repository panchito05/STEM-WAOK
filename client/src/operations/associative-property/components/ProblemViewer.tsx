import React from 'react';
import { AssociativePropertyProblem } from '../types';

interface ProblemViewerProps {
  problem: AssociativePropertyProblem;
  onClose: () => void;
}

// Componente para mostrar el problema de propiedad asociativa en grande y centrado
export const ProblemViewer: React.FC<ProblemViewerProps> = ({ problem, onClose }) => {
  // Extraer los operandos del problema
  const { operands } = problem;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl transform scale-125"
        onClick={(e) => e.stopPropagation()} // Evitar que el clic se propague al fondo
      >
        <div className="relative">
          <button
            className="absolute -top-6 -right-6 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
            onClick={onClose}
          >
            ×
          </button>
          
          <div className="font-mono text-2xl text-center space-y-4">
            {/* Título */}
            <div className="text-lg text-gray-600 mb-4">Completa la expresión equivalente</div>
            
            {/* Primera agrupación */}
            <div className="text-blue-700 font-bold">
              ({operands[0]} + {operands[1]}) + {operands[2]} = ?
            </div>
            
            {/* Segunda agrupación con espacios en blanco */}
            <div className="text-green-700 font-bold mt-6">
              {operands[0]} + (_____ + _____) = _____
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};