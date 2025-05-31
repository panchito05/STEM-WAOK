import React from 'react';
import { Problem } from '../types';
import { Check, X } from 'lucide-react';

export interface ProblemDisplayProps {
  problem: Problem;
  answer: string | number;
  isAnswered?: boolean;
  isCorrect?: boolean;
}

/**
 * Componente para mostrar un problema de propiedad asociativa
 */
const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ 
  problem, 
  answer = '',
  isAnswered = false,
  isCorrect = false
}) => {
  // Función para formatear un número
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  // Renderizar formato vertical
  const renderVertical = () => {
    return (
      <div className="flex flex-col items-end border rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm font-mono">
        {/* Mostrar cada operando en una línea */}
        {problem.operands.map((op, index) => (
          <div key={index} className="flex items-center mb-1">
            {index < problem.operands.length - 1 ? (
              <span className="mr-4">+</span>
            ) : (
              <span className="mr-4 border-t border-black dark:border-white pt-1">+</span>
            )}
            <span>{formatNumber(op.value)}</span>
          </div>
        ))}
        
        {/* Línea de separación */}
        <div className="w-full border-t border-black dark:border-white my-2"></div>
        
        {/* Mostrar la respuesta del usuario o línea para responder */}
        <div className="flex items-center">
          <div className="w-6"></div>
          <div className="text-lg font-semibold min-w-[80px] text-right">
            {answer !== '' ? formatNumber(Number(answer)) : '_____'}
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar formato horizontal
  const renderHorizontal = () => {
    return (
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm font-mono">
        <div className="flex items-center flex-wrap">
          {/* Mostrar operandos separados por + */}
          {problem.operands.map((op, index) => (
            <React.Fragment key={index}>
              <span className="text-lg">{formatNumber(op.value)}</span>
              {index < problem.operands.length - 1 && (
                <span className="mx-2 text-lg">+</span>
              )}
            </React.Fragment>
          ))}
          
          {/* Mostrar signo igual y respuesta */}
          <span className="mx-2 text-lg">=</span>
          <div className="text-lg font-semibold min-w-[60px] text-center px-2 border-b-2 border-dashed border-gray-300 dark:border-gray-600">
            {answer !== '' ? formatNumber(Number(answer)) : '?'}
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar formato de problema de palabra
  const renderWordProblem = () => {
    // Crear una descripción del problema basada en los operandos
    const description = problem.operands.map((op, index) => {
      return op.label ? 
        `${formatNumber(op.value)} ${op.label}` : 
        formatNumber(op.value);
    }).join(' + ');
    
    return (
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <p className="mb-4 text-lg">
          Si tenemos {description}, ¿cuál es el resultado total?
        </p>
        <div className="flex items-center">
          <span className="mr-2 text-lg">Respuesta:</span>
          <div className="text-lg font-semibold min-w-[60px] border-b-2 border-dashed border-gray-300 dark:border-gray-600 px-2 text-center">
            {answer !== '' ? formatNumber(Number(answer)) : '?'}
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar el componente según el formato del problema
  return (
    <div className="w-full">
      {/* Contenido principal del problema */}
      <div className="relative">
        {/* Mostrar el problema según su formato */}
        {problem.displayFormat === 'vertical' && renderVertical()}
        {problem.displayFormat === 'horizontal' && renderHorizontal()}
        {problem.displayFormat === 'word' && renderWordProblem()}
        
        {/* Mostrar indicador de correcto/incorrecto cuando se ha respondido */}
        {isAnswered && (
          <div className={`absolute -right-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center ${
            isCorrect ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {isCorrect ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <X className="w-5 h-5 text-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemDisplay;