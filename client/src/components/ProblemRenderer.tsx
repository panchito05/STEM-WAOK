import React from 'react';

// Definimos un tipo estándar para los problemas de matemáticas
export interface MathProblem {
  problemNumber?: number;
  problem: string; // El texto del problema (ej: "2 + 3 = 5")
  isCorrect: boolean; // Si fue respondido correctamente
  info?: string; // Información adicional (nivel, intentos, tiempo)
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
 * Componente dedicado para renderizar problemas matemáticos
 * Proporciona una visualización consistente independiente de la fuente de datos
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
          className={`problem-item p-3 rounded-lg border ${
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
            {problem.problem}
          </div>

          <div className={`problem-status text-sm mt-1 ${
            problem.isCorrect ? 'text-green-600' : 'text-red-600'
          }`}>
            {problem.isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
            
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
        </div>
      ))}
    </div>
  );
};

export default ProblemRenderer;