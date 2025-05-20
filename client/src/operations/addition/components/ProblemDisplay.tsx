// ProblemDisplay.tsx - Componente para visualizar el problema actual de suma
import React from 'react';
import { Problem } from '../types';
import { Progress } from '@/components/ui/progress';

interface ProblemDisplayProps {
  problem: Problem;
  userAnswer: string;
  isShowingAnswer?: boolean;
  timeLeft?: number | null;
  isTimerActive?: boolean;
  hasTimeLimit?: boolean;
  isPerProblemTimer?: boolean;
  maxTime?: number;
}

/**
 * Componente para visualizar el problema de suma actual
 */
const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  userAnswer,
  isShowingAnswer = false,
  timeLeft = null,
  isTimerActive = false,
  hasTimeLimit = false,
  isPerProblemTimer = false,
  maxTime = 10
}) => {
  // Calcular el porcentaje restante del tiempo si hay un temporizador activo
  const timePercentage = timeLeft && maxTime 
    ? Math.max(0, Math.min(100, (timeLeft / maxTime) * 100)) 
    : 100;
  
  // Determinar clases CSS según estado
  const answerBoxClasses = `
    flex justify-center items-center
    min-h-[3rem] md:min-h-[4rem]
    text-xl md:text-3xl font-mono font-bold
    border-2 rounded-md px-4 py-2
    ${isShowingAnswer 
      ? userAnswer === problem.result.toString()
          ? 'bg-green-100 border-green-500 text-green-800' // Respuesta correcta
          : 'bg-red-100 border-red-500 text-red-800' // Respuesta incorrecta
      : 'bg-white border-blue-300'
    }
  `;
  
  return (
    <div className="p-6 space-y-4">
      {/* Barra de tiempo */}
      {hasTimeLimit && isPerProblemTimer && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Tiempo:</span>
            <span>{timeLeft ? Math.ceil(timeLeft) : 0}s</span>
          </div>
          <Progress
            value={timePercentage}
            className={`h-2 ${
              timePercentage < 30 
                ? 'bg-red-200' 
                : timePercentage < 60 
                  ? 'bg-yellow-200' 
                  : 'bg-blue-200'
            }`}
          />
        </div>
      )}
      
      {/* Problema de suma */}
      <div className="text-center">
        <div className="flex flex-col items-center text-2xl md:text-4xl font-mono mb-6">
          {/* Primer operando */}
          <div className="mb-2">
            {problem.operands[0]}
          </div>
          
          {/* Operación y segundo operando */}
          <div className="flex items-center">
            <span className="mr-3">+</span>
            <span>{problem.operands[1]}</span>
          </div>
          
          {/* Línea divisoria */}
          <div className="w-24 md:w-32 h-0.5 bg-gray-800 my-3"></div>
          
          {/* Respuesta del usuario o placeholder */}
          <div className={answerBoxClasses}>
            {isShowingAnswer ? problem.result : userAnswer || '?'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDisplay;