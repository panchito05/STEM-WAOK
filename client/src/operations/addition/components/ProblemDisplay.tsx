// ProblemDisplay.tsx - Muestra el problema actual de suma
import React from 'react';
import { Problem } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ProblemDisplayProps {
  problem: Problem;
  userAnswer: string;
  isShowingAnswer: boolean;
  timeLeft: number | null;
  isTimerActive: boolean;
  hasTimeLimit: boolean;
  isPerProblemTimer: boolean;
  maxTime: number;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  userAnswer,
  isShowingAnswer,
  timeLeft,
  isTimerActive,
  hasTimeLimit,
  isPerProblemTimer,
  maxTime
}) => {
  const { t } = useTranslation();
  
  // Extraer operandos del problema
  const operands = problem.operands || [];
  const firstOperand = operands[0] || 0;
  const secondOperand = operands[1] || 0;
  
  return (
    <div className="problem-display">
      {/* Temporizador visual (si está habilitado) */}
      {hasTimeLimit && isTimerActive && timeLeft !== null && (
        <div className="timer-bar-container mb-4">
          <div 
            className="timer-bar h-2 bg-green-500 rounded-full transition-all"
            style={{ 
              width: `${Math.max(0, (timeLeft / maxTime) * 100)}%`,
              backgroundColor: timeLeft < (maxTime * 0.3) ? '#ef4444' : 
                            timeLeft < (maxTime * 0.6) ? '#f97316' : '#22c55e'
            }}
          />
          {isPerProblemTimer && (
            <div className="timer-text text-sm text-center mt-1 text-gray-700">
              {t('common.timeRemaining')}: {Math.ceil(timeLeft)}s
            </div>
          )}
        </div>
      )}
      
      {/* Visualización del problema */}
      <div className="problem-content text-3xl sm:text-5xl md:text-6xl text-center font-bold my-6 flex items-center justify-center">
        <span className="operand">{firstOperand}</span>
        <span className="operation-symbol mx-3">+</span>
        <span className="operand">{secondOperand}</span>
        <span className="equals-symbol mx-3">=</span>
        
        {isShowingAnswer ? (
          <span className="correct-answer text-green-600">{problem.result}</span>
        ) : (
          <span className="user-answer-container bg-gray-100 rounded-lg px-4 py-1 min-w-16 text-center">
            {userAnswer || '?'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProblemDisplay;