// ProblemDisplay.tsx - Muestra el problema actual de suma
import React from 'react';
import { Problem } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { formatProblemToString } from '../utils/problemGenerator';

interface ProblemDisplayProps {
  problem: Problem;
  userAnswer: string;
  isShowingAnswer?: boolean;
  timeLeft?: number | null;
  isTimerActive?: boolean;
  maxTime?: number;
  remainingAttempts?: number;
  showHint?: boolean;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  userAnswer,
  isShowingAnswer = false,
  timeLeft = null,
  isTimerActive = false,
  maxTime = 0,
  remainingAttempts,
  showHint = false
}) => {
  const { t } = useTranslation();
  
  // Función para renderizar el problema según el formato
  const renderProblem = () => {
    if (problem.displayText) {
      return <div className="text-lg font-medium">{problem.displayText}</div>;
    }
    
    const operands = problem.operands || [];
    if (operands.length === 0) {
      return <div className="text-lg font-medium">No hay problema para mostrar</div>;
    }
    
    if (problem.displayFormat === 'vertical') {
      return (
        <div className="flex justify-center">
          <pre className="text-xl font-mono">
            {operands.map((op, index) => (
              <div key={index} className="text-right">
                {index > 0 && '+ '}
                {op.toString()}
              </div>
            ))}
            <div className="border-t border-gray-400 mt-1 pt-1">?</div>
          </pre>
        </div>
      );
    } else if (problem.displayFormat === 'word') {
      return (
        <div className="text-lg">
          Suma los siguientes números: {operands.join(', ')}
        </div>
      );
    } else {
      // Para problemas simples de 2 operandos, usar visualización grande
      if (operands.length === 2) {
        return (
          <div className="problem-content text-3xl sm:text-5xl md:text-6xl text-center font-bold my-6 flex items-center justify-center flex-wrap">
            <span className="operand">{operands[0]}</span>
            <span className="operation-symbol mx-3">+</span>
            <span className="operand">{operands[1]}</span>
            <span className="equals-symbol mx-3">=</span>
            
            {isShowingAnswer ? (
              <span className="correct-answer text-green-600">{problem.correctAnswer}</span>
            ) : (
              <span className="user-answer-container bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-1 min-w-16 text-center">
                {userAnswer || '?'}
              </span>
            )}
          </div>
        );
      } else {
        // Para problemas más complejos, formato estándar
        return (
          <div className="text-2xl font-bold text-center">
            {operands.join(' + ')} = {isShowingAnswer ? problem.correctAnswer : '?'}
          </div>
        );
      }
    }
  };
  
  return (
    <div className="problem-display mb-6">
      {/* Temporizador visual (si está habilitado) */}
      {timeLeft !== null && isTimerActive && maxTime > 0 && (
        <div className="timer-bar-container mb-4">
          <div 
            className="timer-bar h-2 bg-green-500 rounded-full transition-all"
            style={{ 
              width: `${Math.max(0, (timeLeft / maxTime) * 100)}%`,
              backgroundColor: timeLeft < (maxTime * 0.3) ? '#ef4444' : 
                              timeLeft < (maxTime * 0.6) ? '#f97316' : '#22c55e'
            }}
          />
          <div className="timer-text text-sm text-center mt-1 text-muted-foreground">
            {t('common.timeRemaining')}: {Math.ceil(timeLeft)}s
          </div>
        </div>
      )}
      
      <div className="p-6 border rounded-lg bg-card shadow-sm">
        {/* Renderizar problema */}
        {renderProblem()}
        
        {/* Si no muestra dentro del problema, mostrar entrada del usuario por separado */}
        {!isShowingAnswer && problem.operands && problem.operands.length > 2 && (
          <div className="mt-4 text-center">
            <div className="text-lg font-medium">Tu respuesta:</div>
            <div className="mt-2 p-2 min-h-10 w-32 border-2 border-primary rounded-md text-2xl font-bold mx-auto flex items-center justify-center">
              {userAnswer || "\u00A0"}
            </div>
          </div>
        )}
        
        {/* Intentos restantes */}
        {remainingAttempts !== undefined && (
          <div className="mt-4 text-sm text-center text-muted-foreground">
            Intentos restantes: {remainingAttempts}
          </div>
        )}
        
        {/* Pista opcional */}
        {showHint && problem.operands && problem.operands.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm">
            <span className="font-medium">Pista: </span>
            {problem.operands.length === 2 ? (
              <span>
                Piensa en sumar {problem.operands[0]} unidades y luego añadir {problem.operands[1]} más.
              </span>
            ) : (
              <span>
                Empieza sumando los dos primeros números y luego añade el resto.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemDisplay;