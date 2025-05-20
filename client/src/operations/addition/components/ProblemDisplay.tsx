import React, { useState } from 'react';
import { Problem } from '../types';
import { Check, X } from 'lucide-react';
import NumberDuplicator from './NumberDuplicator';

export interface ProblemDisplayProps {
  problem: Problem;
  answer: string | number;
  isAnswered?: boolean;
  isCorrect?: boolean;
}

/**
 * Componente para mostrar un problema de suma
 */
const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ 
  problem, 
  answer = '',
  isAnswered = false,
  isCorrect = false
}) => {
  const [showDuplicator, setShowDuplicator] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  
  // Función para manejar el clic en un número y duplicarlo
  const handleNumberClick = () => {
    console.log("Número clickeado, mostrando duplicador");
    // Extraer solo los valores numéricos de los operandos
    const numberValues = problem.operands.map(op => op.value);
    setSelectedNumbers(numberValues);
    setShowDuplicator(true);
  };
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
            <button 
              className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 p-2 rounded transition-colors border border-gray-300 dark:border-gray-700 flex items-center gap-1"
              onClick={() => handleNumberClick()}
              title="Haz clic para ver en grande" 
              aria-label="Ver número en grande"
            >
              {formatNumber(op.value)}
              <span className="text-xs text-blue-500">⇱</span>
            </button>
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
              <button 
                className="text-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 p-2 rounded transition-colors border border-gray-300 dark:border-gray-700 flex items-center gap-1"
                onClick={() => handleNumberClick()}
                title="Haz clic para ver en grande"
                aria-label="Ver número en grande"
              >
                {formatNumber(op.value)}
                <span className="text-xs text-blue-500">⇱</span>
              </button>
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
      // Usar valor directamente ya que no todas las implementaciones tienen etiqueta
      return formatNumber(op.value);
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
        
        {/* Duplicador de números que aparece al hacer clic */}
        <NumberDuplicator 
          numbers={selectedNumbers} 
          visible={showDuplicator} 
          onClose={() => setShowDuplicator(false)} 
        />
      </div>
    </div>
  );
};

export default ProblemDisplay;