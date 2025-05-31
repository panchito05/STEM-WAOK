import React from 'react';
import { Button } from '@/components/ui/button';
import { Problem } from '../types';
import { CheckCircle, XCircle } from 'lucide-react';

export interface ExplanationPanelProps {
  problem: Problem;
  userAnswer: string | number;
  isCorrect: boolean;
  onContinue: () => void;
}

/**
 * Panel de explicación para mostrar después de responder un problema
 */
const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  problem,
  userAnswer,
  isCorrect,
  onContinue
}) => {
  // Función para formatear números
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  // Crear explicación de propiedad asociativa básica
  const renderBasicExplanation = () => {
    // Si solo hay dos operandos, mostrar explicación simple
    if (problem.operands.length === 2) {
      return (
        <p className="text-lg mb-4">
          Tienes {formatNumber(problem.operands[0].value)} + {formatNumber(problem.operands[1].value)}. 
          Vamos paso a paso para resolver este problema.
        </p>
      );
    }
    
    // Para más de dos operandos, mostrar explicación más detallada
    return (
      <p className="text-lg mb-4">
        Este problema tiene múltiples operandos. Veamos paso a paso cómo resolverlo.
      </p>
    );
  };
  
  // Crear explicación detallada paso a paso
  const renderDetailedExplanation = () => {
    const steps = [];
    let runningSum = 0;
    
    problem.operands.forEach((operand, index) => {
      runningSum += operand.value;
      if (index === 0) {
        steps.push(
          <div key={index} className="mb-2">
            <span className="font-semibold">Paso {index + 1}:</span> Comenzamos con {formatNumber(operand.value)}
          </div>
        );
      } else {
        steps.push(
          <div key={index} className="mb-2">
            <span className="font-semibold">Paso {index + 1}:</span> {formatNumber(runningSum - operand.value)} + {formatNumber(operand.value)} = {formatNumber(runningSum)}
          </div>
        );
      }
    });
    
    return (
      <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Solución paso a paso:</h4>
        {steps}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
            Respuesta final: {formatNumber(problem.correctAnswer)}
          </span>
        </div>
      </div>
    );
  };
  
  // Crear mensaje de retroalimentación
  const renderFeedback = () => {
    if (isCorrect) {
      return (
        <div className="flex items-center mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="text-green-600 dark:text-green-400 mr-3" size={24} />
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">¡Correcto!</h3>
            <p className="text-green-700 dark:text-green-300">Tu respuesta {formatNumber(Number(userAnswer))} es correcta.</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <XCircle className="text-red-600 dark:text-red-400 mr-3" size={24} />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">Respuesta incorrecta</h3>
            <p className="text-red-700 dark:text-red-300">
              Tu respuesta fue {formatNumber(Number(userAnswer))}, pero la respuesta correcta es {formatNumber(problem.correctAnswer)}.
            </p>
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      {renderFeedback()}
      {renderBasicExplanation()}
      {renderDetailedExplanation()}
      
      <div className="flex justify-center mt-6">
        <Button 
          onClick={onContinue}
          className="px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default ExplanationPanel;