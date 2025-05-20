import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ProblemDisplayProps } from '../types';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Componente para mostrar problemas de suma en diferentes formatos
 */
const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ problem, answer }) => {
  const { t } = useTranslation();
  
  // Renderizar problema en formato horizontal (ej: 5 + 3 = ?)
  const renderHorizontalFormat = () => {
    return (
      <div className="flex items-center justify-center text-3xl md:text-4xl font-bold space-x-2">
        {problem.operands.map((operand, index) => (
          <React.Fragment key={`operand-${index}`}>
            <span>{operand}</span>
            {index < problem.operands.length - 1 && <span>+</span>}
          </React.Fragment>
        ))}
        <span>=</span>
        <span className="text-blue-600 dark:text-blue-400 min-w-[40px] text-center">
          {answer || '?'}
        </span>
      </div>
    );
  };
  
  // Renderizar problema en formato vertical
  const renderVerticalFormat = () => {
    return (
      <div className="flex flex-col items-end text-3xl md:text-4xl font-bold">
        {/* Operandos */}
        {problem.operands.map((operand, index) => (
          <div 
            key={`operand-${index}`}
            className={index === 0 ? '' : 'border-t-0'}
          >
            {index === problem.operands.length - 1 && (
              <span className="pr-2">+</span>
            )}
            <span>{operand}</span>
          </div>
        ))}
        
        {/* Línea divisoria */}
        <div className="border-t-2 border-black dark:border-white py-1 w-full" />
        
        {/* Respuesta */}
        <div className="text-blue-600 dark:text-blue-400 min-w-[40px] text-center">
          {answer || '?'}
        </div>
      </div>
    );
  };

  // Renderizar problema en formato de texto (problema de palabra)
  const renderWordProblem = () => {
    if (!problem.displayText) {
      return renderHorizontalFormat(); // Fallback
    }
    
    return (
      <div className="flex flex-col space-y-4">
        <p className="text-lg md:text-xl font-medium">
          {problem.displayText}
        </p>
        <div className="flex items-center justify-center">
          <span className="text-xl mr-2">{t('answer', { defaultValue: 'Respuesta' })}:</span>
          <span className="text-blue-600 dark:text-blue-400 text-2xl font-bold min-w-[40px] text-center">
            {answer || '?'}
          </span>
        </div>
      </div>
    );
  };
  
  // Renderizar el problema según el formato especificado
  const renderProblem = () => {
    switch (problem.displayFormat) {
      case 'horizontal':
        return renderHorizontalFormat();
      case 'vertical':
        return renderVerticalFormat();
      case 'word':
        return renderWordProblem();
      default:
        return renderHorizontalFormat();
    }
  };
  
  return (
    <Card className="w-full bg-white dark:bg-gray-800">
      <CardContent className="flex items-center justify-center min-h-[150px] p-6">
        {renderProblem()}
      </CardContent>
    </Card>
  );
};

export default ProblemDisplay;