import React, { useMemo } from 'react';
import { AdditionProblem } from '../../types';
import { InputValidator } from './utils/ValidationUtils';
import { Calculator, AlertTriangle } from 'lucide-react';

interface ProblemDisplayProps {
  problem: AdditionProblem;
  showVerticalFormat?: boolean;
  attempts: number;
  maxAttempts: number;
  isProcessing?: boolean;
}

export const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  showVerticalFormat = true,
  attempts,
  maxAttempts,
  isProcessing = false
}) => {
  // Validar problema y calcular respuesta correcta de forma segura
  const problemData = useMemo(() => {
    const isValid = InputValidator.validateProblem(problem);
    const correctAnswer = isValid 
      ? problem.operands.reduce((product, op) => product * (typeof op === 'number' ? op : parseFloat(op.toString())), 1)
      : 0;
    
    return {
      isValid,
      correctAnswer,
      formattedAnswer: isValid ? InputValidator.formatNumber(correctAnswer) : 'Error'
    };
  }, [problem]);

  // Formatear operandos de forma segura
  const formattedOperands = useMemo(() => {
    if (!problemData.isValid) return [];
    
    return problem.operands.map(op => {
      const num = typeof op === 'number' ? op : parseFloat(op.toString());
      if (isNaN(num)) return '0';
      // Mostrar números enteros sin decimales
      return Number.isInteger(num) ? num.toString() : InputValidator.formatNumber(num);
    });
  }, [problem.operands, problemData.isValid]);

  // Renderizar problema vertical mejorado
  const renderVerticalProblem = () => {
    if (!problemData.isValid) {
      return (
        <div className="flex items-center justify-center text-red-600 p-4">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Problema inválido</span>
        </div>
      );
    }

    // Dividir números en parte entera y decimal
    const parts = formattedOperands.map(str => {
      const [intPart, decPart] = str.includes('.') ? str.split('.') : [str, ''];
      return { intPart, decPart };
    });

    // Calcular ancho máximo para alineación
    const maxIntWidth = Math.max(...parts.map(p => p.intPart.length));
    const hasDecimals = parts.some(p => p.decPart);

    return (
      <div className="font-mono text-xl whitespace-pre select-none" aria-label="Problema de suma vertical">
        {/* Mostrar todos los operandos excepto el último */}
        {parts.slice(0, -1).map((part, idx) => (
          <div key={idx} className="text-right leading-relaxed">
            <span className="inline-block text-right" style={{ minWidth: `${maxIntWidth + 1}ch` }}>
              {part.intPart}
            </span>
            {hasDecimals && (
              <span>{part.decPart ? `.${part.decPart}` : ''}</span>
            )}
          </div>
        ))}
        
        {/* Último operando con signo × */}
        <div className="flex items-center justify-end leading-relaxed">
          <span className="mr-2 text-blue-600 font-bold">×</span>
          <span className="inline-block text-right" style={{ minWidth: `${maxIntWidth + 1}ch` }}>
            {parts[parts.length - 1].intPart}
          </span>
          {hasDecimals && (
            <span>{parts[parts.length - 1].decPart ? `.${parts[parts.length - 1].decPart}` : ''}</span>
          )}
        </div>
        
        {/* Línea divisoria mejorada */}
        <div className="border-t-2 border-gray-800 mt-2 mb-1" style={{ width: '100%' }}></div>
        
        {/* Área para la respuesta */}
        <div className="text-right text-gray-400 italic text-sm">
          = ?
        </div>
      </div>
    );
  };

  // Renderizar problema horizontal
  const renderHorizontalProblem = () => {
    if (!problemData.isValid) {
      return (
        <div className="flex items-center justify-center text-red-600">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Problema inválido</span>
        </div>
      );
    }

    return (
      <div className="font-mono text-xl text-center select-none" aria-label="Problema de suma horizontal">
        {formattedOperands.map((op, index) => (
          <React.Fragment key={index}>
            <span className="mx-1">{op}</span>
            {index < formattedOperands.length - 1 && (
              <span className="mx-2 text-blue-600 font-bold">×</span>
            )}
          </React.Fragment>
        ))}
        <span className="mx-2">=</span>
        <span className="text-gray-400 italic">?</span>
      </div>
    );
  };

  // Determinar color del contador de intentos
  const getAttemptsColor = () => {
    if (attempts === 0) return 'text-gray-600';
    if (attempts >= maxAttempts) return 'text-red-600 font-bold';
    if (attempts > maxAttempts * 0.7) return 'text-orange-600';
    return 'text-blue-600';
  };

  return (
    <div className={`bg-white p-4 shadow-sm border border-gray-200 rounded-md mb-2 transition-all duration-200 ${
      isProcessing ? 'opacity-75' : ''
    }`}>
      {/* Header con información del problema */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center text-sm font-medium text-gray-700">
          <Calculator className="h-4 w-4 mr-1" />
          <span>Problema {(problem.index ?? 0) + 1} de {problem.total ?? 1}</span>
        </div>
        
        <div className={`text-sm font-medium ${getAttemptsColor()}`}>
          Intentos: {attempts}/{maxAttempts}
        </div>
      </div>
      
      {/* Problema matemático */}
      <div className="bg-gray-50 p-3 rounded border-2 border-dashed border-gray-200">
        {showVerticalFormat ? renderVerticalProblem() : renderHorizontalProblem()}
      </div>
      
      {/* Información adicional para debugging (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-2">
          ID: {problem.id} | Respuesta: {problemData.formattedAnswer}
        </div>
      )}
    </div>
  );
};

export default ProblemDisplay;