import React from 'react';
import { Check, X } from 'lucide-react';

// Definición de tipos para problemas matemáticos
export interface MathProblem {
  problemNumber?: number;
  problem: string;
  isCorrect: boolean;
  info?: string;
  attempts?: string;
  timeSpent?: number;
  level?: string;
  userAnswer?: string | number;
}

interface ProblemRendererProps {
  problems: MathProblem[];
  showProblemNumbers?: boolean;
  showInfoDetails?: boolean;
  className?: string;
}

/**
 * Componente para renderizar problemas matemáticos con un formato consistente
 */
const ProblemRenderer: React.FC<ProblemRendererProps> = ({
  problems,
  showProblemNumbers = true,
  showInfoDetails = true,
  className = ''
}) => {
  if (!problems || problems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No hay problemas para mostrar
      </div>
    );
  }

  return (
    <div className={`problems-container space-y-3 ${className}`}>
      {problems.map((problem, index) => (
        <div 
          key={`problem-${index}`}
          className={`problem-item p-3 rounded-lg border relative ${
            problem.isCorrect 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}
        >
          {showProblemNumbers && (
            <div className="text-sm font-medium text-gray-600 mb-1">
              Problema #{problem.problemNumber || index + 1}
            </div>
          )}

          <div className="problem-text text-lg font-bold">
            {/* Eliminar cualquier texto entre paréntesis que pueda aparecer al final */}
            {typeof problem.problem === 'string' 
              ? problem.problem.replace(/\s*\(\d+\)$/, '') 
              : problem.problem}
          </div>

          <div className={`problem-status text-sm mt-1 ${
            problem.isCorrect ? 'text-green-600' : 'text-red-600'
          }`}>
            {problem.isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
            
            {/* Solo mostrar la respuesta dada si es incorrecta */}
            {!problem.isCorrect && problem.userAnswer !== undefined && (
              <span className="ml-2">
                (Respuesta dada: {problem.userAnswer})
              </span>
            )}
          </div>

          {showInfoDetails && problem.info && (
            <div className="info-text text-xs text-gray-500 mt-1">
              {problem.info}
            </div>
          )}
          
          <span className="absolute right-3 top-3">
            {problem.isCorrect ? 
              <Check className="h-5 w-5 text-green-500" /> : 
              <X className="h-5 w-5 text-red-500" />
            }
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProblemRenderer;