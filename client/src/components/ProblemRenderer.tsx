/**
 * Componente para renderizar problemas matemáticos de manera estandarizada
 * 
 * Este componente facilita la representación uniforme de problemas matemáticos
 * independientemente del tipo de operación (suma, fracciones, etc.)
 */

import React from 'react';

// Tipo estándar para problemas matemáticos en toda la aplicación
export interface MathProblem {
  id: string;
  moduleId: string;
  operation: string;
  operands: number[];
  expectedAnswer: number;
  difficulty: string;
  originalProblem: any; // El problema original para acceder a propiedades específicas
}

interface ProblemRendererProps {
  problem: MathProblem;
  showAnswer?: boolean;
  vertical?: boolean;
  className?: string;
}

const ProblemRenderer: React.FC<ProblemRendererProps> = ({
  problem,
  showAnswer = false,
  vertical = false,
  className = ''
}) => {
  // Estilos base para la visualización
  const baseClassName = 'font-mono text-xl';
  const finalClassName = `${baseClassName} ${className}`;

  // Generar representación según el tipo de operación
  const renderProblem = () => {
    switch (problem.operation) {
      case '+':
        return renderAddition();
      case '-':
        return renderSubtraction();
      case '×':
      case '*':
        return renderMultiplication();
      case '÷':
      case '/':
        return renderDivision();
      case 'fraction':
        return renderFraction();
      case 'count':
        return renderCounting();
      default:
        return <span>Problema no soportado</span>;
    }
  };

  // Renderizar suma
  const renderAddition = () => {
    if (vertical) {
      return (
        <div className="flex flex-col items-end">
          <div>{problem.operands[0]}</div>
          <div className="flex items-center">
            <span className="mr-2">+</span>
            <span>{problem.operands[1]}</span>
          </div>
          <div className="w-full border-t border-gray-700 mt-1 mb-1"></div>
          {showAnswer && <div>{problem.expectedAnswer}</div>}
        </div>
      );
    }

    return (
      <div>
        <span>{problem.operands[0]}</span>
        <span className="mx-1">+</span>
        <span>{problem.operands[1]}</span>
        {showAnswer && (
          <>
            <span className="mx-1">=</span>
            <span>{problem.expectedAnswer}</span>
          </>
        )}
      </div>
    );
  };

  // Renderizar resta
  const renderSubtraction = () => {
    if (vertical) {
      return (
        <div className="flex flex-col items-end">
          <div>{problem.operands[0]}</div>
          <div className="flex items-center">
            <span className="mr-2">-</span>
            <span>{problem.operands[1]}</span>
          </div>
          <div className="w-full border-t border-gray-700 mt-1 mb-1"></div>
          {showAnswer && <div>{problem.expectedAnswer}</div>}
        </div>
      );
    }

    return (
      <div>
        <span>{problem.operands[0]}</span>
        <span className="mx-1">-</span>
        <span>{problem.operands[1]}</span>
        {showAnswer && (
          <>
            <span className="mx-1">=</span>
            <span>{problem.expectedAnswer}</span>
          </>
        )}
      </div>
    );
  };

  // Renderizar multiplicación
  const renderMultiplication = () => {
    if (vertical) {
      return (
        <div className="flex flex-col items-end">
          <div>{problem.operands[0]}</div>
          <div className="flex items-center">
            <span className="mr-2">×</span>
            <span>{problem.operands[1]}</span>
          </div>
          <div className="w-full border-t border-gray-700 mt-1 mb-1"></div>
          {showAnswer && <div>{problem.expectedAnswer}</div>}
        </div>
      );
    }

    return (
      <div>
        <span>{problem.operands[0]}</span>
        <span className="mx-1">×</span>
        <span>{problem.operands[1]}</span>
        {showAnswer && (
          <>
            <span className="mx-1">=</span>
            <span>{problem.expectedAnswer}</span>
          </>
        )}
      </div>
    );
  };

  // Renderizar división
  const renderDivision = () => {
    if (vertical) {
      return (
        <div className="flex items-center">
          <div className="text-center">
            <div>{problem.operands[1]}</div>
            <div className="border-t border-gray-700"></div>
            <div>{problem.operands[0]}</div>
          </div>
          {showAnswer && (
            <>
              <span className="mx-2">=</span>
              <span>{problem.expectedAnswer}</span>
            </>
          )}
        </div>
      );
    }

    return (
      <div>
        <span>{problem.operands[0]}</span>
        <span className="mx-1">÷</span>
        <span>{problem.operands[1]}</span>
        {showAnswer && (
          <>
            <span className="mx-1">=</span>
            <span>{problem.expectedAnswer}</span>
          </>
        )}
      </div>
    );
  };

  // Renderizar fracciones (implementación básica)
  const renderFraction = () => {
    // Acceder a propiedades específicas de fracciones a través de originalProblem
    const { numerator1, denominator1, numerator2, denominator2, operation } = 
      problem.originalProblem;

    return (
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center mx-1">
          <div className="border-b border-gray-700">{numerator1}</div>
          <div>{denominator1}</div>
        </div>
        <span className="mx-2">{operation}</span>
        <div className="flex flex-col items-center mx-1">
          <div className="border-b border-gray-700">{numerator2}</div>
          <div>{denominator2}</div>
        </div>
        {showAnswer && (
          <>
            <span className="mx-2">=</span>
            <div className="flex flex-col items-center">
              <div className="border-b border-gray-700">{problem.expectedAnswer}</div>
              <div>{/* Denominador de respuesta */}</div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Renderizar problemas de conteo (implementación básica)
  const renderCounting = () => {
    // Acceder a propiedades específicas de conteo a través de originalProblem
    const { itemCount, itemType } = problem.originalProblem;

    return (
      <div className="flex flex-col items-center">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className="w-6 h-6 bg-blue-500 rounded-full"></div>
          ))}
        </div>
        {showAnswer && (
          <div className="mt-2">
            Respuesta: {problem.expectedAnswer} {itemType}
          </div>
        )}
      </div>
    );
  };

  // Renderizar el componente completo
  return <div className={finalClassName}>{renderProblem()}</div>;
};

export default ProblemRenderer;