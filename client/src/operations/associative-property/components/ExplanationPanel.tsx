import React from 'react';
import { Button } from '@/components/ui/button';
import { Problem } from '../types';
import { useTranslation } from '../hooks/useTranslation';
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
  const { t } = useTranslation();
  
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
          {t('explanationStart', { 
            values: { 
              operand1: formatNumber(problem.operands[0].value),
              operand2: formatNumber(problem.operands[1].value)
            }
          })}, {t('explanationStepByStep')}
        </p>
      );
    }
    
    // Para más de dos operandos, mostrar explicación más detallada
    return (
      <p className="text-lg mb-4">
        {t('explanationMultipleOperands')} {t('explanationStepByStep')}
      </p>
    );
  };
  
  // Crear pasos detallados de la solución
  const renderSolutionSteps = () => {
    // Array para acumular resultados parciales
    const steps = [];
    let runningSum = 0;
    
    // Crear pasos acumulativos
    for (let i = 0; i < problem.operands.length; i++) {
      const operand = problem.operands[i];
      
      // Actualizar resultado acumulado
      runningSum += operand.value;
      
      // Texto para paso actual
      let stepText = '';
      
      if (i === 0) {
        // Primer paso, simplemente iniciar con el valor
        stepText = `${formatNumber(operand.value)}`;
      } else {
        // Pasos siguientes, mostrar acumulación
        stepText = `${formatNumber(runningSum - operand.value)} + ${formatNumber(operand.value)} = ${formatNumber(runningSum)}`;
      }
      
      steps.push(
        <div key={i} className="mb-2 text-lg">
          {i > 0 && <span className="font-medium">Paso {i}: </span>}
          <span>{stepText}</span>
        </div>
      );
    }
    
    return steps;
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md">
      {/* Encabezado con resultado correcto/incorrecto */}
      <div className="flex items-center mb-4">
        {isCorrect ? (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="w-6 h-6 mr-2" />
            <span className="text-xl font-semibold">{t('correct')}</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <XCircle className="w-6 h-6 mr-2" />
            <span className="text-xl font-semibold">{t('incorrect')}</span>
          </div>
        )}
      </div>
      
      {/* Mostrar respuesta del usuario si fue incorrecta */}
      {!isCorrect && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-slate-700 rounded-md">
          <p className="text-red-600 dark:text-red-400">
            {t('explanationWrong', { values: { answer: userAnswer || '?' } })}
          </p>
          <p className="font-semibold mt-1">
            {t('answer')}: {formatNumber(problem.correctAnswer)}
          </p>
        </div>
      )}
      
      {/* Explicación básica */}
      {renderBasicExplanation()}
      
      {/* Pasos detallados */}
      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-md mb-4">
        {renderSolutionSteps()}
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 font-bold text-lg">
          {t('answer')}: {formatNumber(problem.correctAnswer)}
        </div>
      </div>
      
      {/* Botón para continuar */}
      <Button 
        className="w-full mt-2" 
        onClick={onContinue}
      >
        {t('continue')}
      </Button>
    </div>
  );
};

export default ExplanationPanel;