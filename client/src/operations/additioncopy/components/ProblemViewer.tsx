import React from 'react';
import { AdditionCopyProblem } from '../types';

interface ProblemViewerProps {
  problem: AdditionCopyProblem;
  onClose: () => void;
}

// Componente para mostrar los números del problema de suma en grande y centrado
export const ProblemViewer: React.FC<ProblemViewerProps> = ({ problem, onClose }) => {
  // Extraer los operandos del problema
  const { operands } = problem;
  const operator = '+';

  // Función para formatear los números con el punto decimal alineado
  const formatNumberWithAlignment = (num: number) => {
    // Convertir a string para manipulación
    const numStr = num.toString();
    
    // Dividir en parte entera y decimal
    const parts = numStr.split('.');
    const integerPart = parts[0] || '0';
    const decimalPart = parts[1] || '';
    
    return {
      integerPart,
      decimalPart,
      hasDecimal: parts.length > 1
    };
  };

  // Procesar los números para alinearlos correctamente
  const processedOperands = operands.map(num => formatNumberWithAlignment(num));
  
  // Encontrar la longitud máxima de la parte entera y decimal para alineación
  const maxIntegerLength = Math.max(...processedOperands.map(op => op.integerPart.length));
  const maxDecimalLength = Math.max(...processedOperands.map(op => op.decimalPart.length));
  
  // Para saber si cualquier número tiene decimales
  const hasAnyDecimal = processedOperands.some(op => op.hasDecimal);

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
          
          <div className="font-mono text-4xl">
            {/* Operandos con alineación decimal */}
            <div className="flex flex-col items-end mb-2">
              {processedOperands.map((op, index) => (
                <div key={index} className="flex items-center">
                  {/* Mostrar el operador antes del segundo operando */}
                  {index === 1 && (
                    <span className="mr-4">{operator}</span>
                  )}
                  
                  {/* Parte entera con espaciado para alineación */}
                  <span className="inline-block text-right" style={{ minWidth: `${maxIntegerLength * 0.6}em` }}>
                    {op.integerPart}
                  </span>
                  
                  {/* Punto decimal y parte decimal (si corresponde) */}
                  {hasAnyDecimal && (
                    <>
                      <span className="mx-1">{op.hasDecimal ? '.' : ''}</span>
                      <span className="inline-block" style={{ minWidth: `${maxDecimalLength * 0.6}em` }}>
                        {op.decimalPart}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {/* Línea horizontal */}
            <div className="border-t-2 border-black dark:border-white mb-2" style={{ width: '100%' }}></div>
            
            {/* Espacio para el resultado (sin mostrar el valor) */}
            <div className="flex items-center">
              <span className="mr-4">=</span>
              <span className="inline-block" style={{ minWidth: `${(maxIntegerLength + maxDecimalLength + 1) * 0.6}em` }}>&nbsp;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};