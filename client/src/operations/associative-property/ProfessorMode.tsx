import React from 'react';
import { AssociativePropertyProblem } from './types';

interface ProfessorModeProps {
  problem: AssociativePropertyProblem;
  onClose: () => void;
  onCorrectAnswer: (wasCorrect: boolean) => void;
}

const ProfessorMode: React.FC<ProfessorModeProps> = ({ problem, onClose, onCorrectAnswer }) => {
  const operands = problem.operands.slice(0, 3);
  
  return (
    <div className="professor-mode bg-purple-50 border border-purple-200 rounded-lg p-6 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-purple-700">Modo Profesor</h3>
        <button
          onClick={onClose}
          className="text-purple-600 hover:text-purple-800 text-xl font-bold"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-700 mb-2">Explicación de la Propiedad Asociativa:</h4>
          <p className="text-gray-700 mb-3">
            La propiedad asociativa dice que cuando sumamos tres o más números, 
            podemos agruparlos de diferentes maneras sin cambiar el resultado.
          </p>
          
          <div className="space-y-2">
            <div className="text-lg">
              <span className="font-semibold">Primera forma:</span> ({operands[0]} + {operands[1]}) + {operands[2]} = {operands[0] + operands[1]} + {operands[2]} = {problem.correctAnswer}
            </div>
            <div className="text-lg">
              <span className="font-semibold">Segunda forma:</span> {operands[0]} + ({operands[1]} + {operands[2]}) = {operands[0]} + {operands[1] + operands[2]} = {problem.correctAnswer}
            </div>
          </div>
          
          <p className="text-gray-600 mt-3 text-sm">
            ¡Ambas formas dan el mismo resultado! Esto es lo que nos enseña la propiedad asociativa.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfessorMode;