// ExplanationPanel.tsx - Componente para mostrar explicaciones de los problemas de suma
import React from 'react';
import { Problem } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ExplanationPanelProps {
  problem: Problem;
  isVisible: boolean;
}

/**
 * Componente para mostrar explicaciones visuales de los problemas de suma
 */
export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  problem,
  isVisible
}) => {
  const { t } = useTranslation();
  
  if (!isVisible) {
    return null;
  }
  
  // Extraer los operandos para la explicación
  const [firstNumber, secondNumber] = problem.operands;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h3 className="font-bold text-blue-800 mb-2">{t('exercise.explanation')}</h3>
      
      <div className="space-y-3">
        {/* Explicación textual de la operación */}
        <p className="text-gray-700">
          {t('exercise.explanationText', {
            first: firstNumber,
            second: secondNumber,
            result: problem.result
          })}
        </p>
        
        {/* Representación visual */}
        <div className="mt-3 p-3 bg-white rounded-md">
          <h4 className="font-semibold mb-2 text-sm text-gray-600">
            {t('exercise.visualRepresentation')}:
          </h4>
          
          <div className="flex space-x-4 items-start">
            {/* Primer número */}
            <div className="text-center">
              <div className="font-mono font-bold mb-1">{firstNumber}</div>
              <NumberVisualizer value={firstNumber} color="bg-blue-200" />
            </div>
            
            <div className="flex items-center h-full pt-8">
              <span className="text-xl">+</span>
            </div>
            
            {/* Segundo número */}
            <div className="text-center">
              <div className="font-mono font-bold mb-1">{secondNumber}</div>
              <NumberVisualizer value={secondNumber} color="bg-green-200" />
            </div>
            
            <div className="flex items-center h-full pt-8">
              <span className="text-xl">=</span>
            </div>
            
            {/* Resultado */}
            <div className="text-center">
              <div className="font-mono font-bold mb-1">{problem.result}</div>
              <NumberVisualizer value={problem.result} color="bg-purple-200" />
            </div>
          </div>
        </div>
        
        {/* Consejos adicionales */}
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-semibold">{t('exercise.tips')}:</p>
          <ul className="list-disc pl-5">
            <li>{t('exercise.tipBreakdown')}</li>
            <li>{t('exercise.tipPractice')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente auxiliar para visualizar un número
 */
const NumberVisualizer: React.FC<{
  value: number;
  color: string;
}> = ({ value, color }) => {
  // Crear un array con el número de elementos igual al valor
  const elements = Array.from({ length: value }, (_, i) => i);
  
  return (
    <div className="flex flex-wrap justify-center max-w-[100px]">
      {elements.map((_, i) => (
        <div
          key={i}
          className={`${color} w-4 h-4 m-0.5 rounded-full`}
        />
      ))}
    </div>
  );
};