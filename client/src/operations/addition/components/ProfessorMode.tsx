import React, { useState, useCallback, useEffect } from 'react';
import { AdditionProblem } from '../types';
import { CloseButton } from './professor/CloseButton';
import { DrawingArea } from './professor/DrawingArea';

interface ProfessorModeProps {
  problem: AdditionProblem;
  onClose: () => void;
  onCorrectAnswer: (wasCorrect: boolean) => void;
  showVerticalFormat?: boolean;
  settings: {
    maxAttempts: number;
    enableCompensation: boolean;
  };
}

// Componente completamente refactorizado que funciona
export const ProfessorMode: React.FC<ProfessorModeProps> = ({
  problem,
  onClose,
  onCorrectAnswer,
  showVerticalFormat = true,
  settings
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [position, setPosition] = useState('bottom-right');

  // Calcular respuesta correcta
  const calculateCorrectAnswer = useCallback((prob: AdditionProblem): number => {
    return prob.operands.reduce((sum, operand) => {
      const num = typeof operand === 'number' ? operand : parseFloat(operand.toString());
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, []);

  // Función de verificación mejorada
  const checkAnswer = useCallback(() => {
    if (!userAnswer.trim() || isProcessing) return;

    setIsProcessing(true);
    setAttempts(prev => prev + 1);

    // Validar entrada
    const userNum = parseFloat(userAnswer);
    if (isNaN(userNum)) {
      setIsCorrect(false);
      setIsProcessing(false);
      return;
    }

    const correctAnswer = calculateCorrectAnswer(problem);
    const correct = Math.abs(userNum - correctAnswer) < 0.01;
    
    setIsCorrect(correct);

    if (correct) {
      setTimeout(() => {
        setIsProcessing(false);
        onCorrectAnswer(true);
      }, 1000);
    } else {
      if (attempts + 1 >= settings.maxAttempts) {
        setTimeout(() => {
          setIsProcessing(false);
          onCorrectAnswer(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setIsProcessing(false);
        }, 1500);
      }
    }
  }, [userAnswer, isProcessing, attempts, settings.maxAttempts, problem, calculateCorrectAnswer, onCorrectAnswer]);

  // Reiniciar cuando cambia el problema
  useEffect(() => {
    setUserAnswer('');
    setAttempts(0);
    setIsCorrect(null);
    setIsProcessing(false);
  }, [problem.id]);

  // Teclas de atajo
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && userAnswer.trim() && !isProcessing) {
        event.preventDefault();
        checkAnswer();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [checkAnswer, userAnswer, isProcessing, onClose]);

  return (
    <div className="fixed inset-0 bg-white z-50">
      <CloseButton onClose={onClose} />
      
      <div className="h-full w-full">
        <DrawingArea position={position} problem={problem} />
        
        {/* Panel de control mejorado */}
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full z-40">
          {/* Mostrar problema */}
          <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-md mb-2">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <span>Problema {(problem.index ?? 0) + 1} de {problem.total ?? 1}</span>
              </div>
              <div className={`text-sm font-medium ${
                attempts === 0 ? 'text-gray-600' :
                attempts >= settings.maxAttempts ? 'text-red-600 font-bold' :
                attempts > settings.maxAttempts * 0.7 ? 'text-orange-600' :
                'text-blue-600'
              }`}>
                Intentos: {attempts}/{settings.maxAttempts}
              </div>
            </div>
            
            {/* Problema matemático */}
            <div className="bg-gray-50 p-3 rounded border-2 border-dashed border-gray-200">
              <div className="font-mono text-xl whitespace-pre select-none text-center">
                {problem.operands.map((op, index) => (
                  <span key={index}>
                    <span className="mx-1">{typeof op === 'number' ? op : parseFloat(op.toString())}</span>
                    {index < problem.operands.length - 1 && (
                      <span className="mx-2 text-blue-600 font-bold">+</span>
                    )}
                  </span>
                ))}
                <span className="mx-2">=</span>
                <span className="text-gray-400 italic">?</span>
              </div>
            </div>
          </div>
          
          {/* Campo de respuesta */}
          <div className="mb-2">
            <div className="flex items-center mb-1">
              <div className="font-medium mr-2">Respuesta:</div>
              {userAnswer.trim() && !isNaN(parseFloat(userAnswer)) && (
                <span className="text-green-600">✓</span>
              )}
            </div>
            
            <div className="flex">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isProcessing}
                placeholder={isProcessing ? 'Esperando...' : 'Escribe tu respuesta'}
                className={`flex-1 border rounded p-2 text-lg text-center min-h-[40px] transition-all duration-200 ${
                  isProcessing 
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                    : userAnswer.trim() && !isNaN(parseFloat(userAnswer))
                      ? 'bg-green-50 border-green-300 text-green-900 focus:border-green-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                autoFocus
              />
              
              <button
                onClick={() => setUserAnswer('')}
                disabled={isProcessing || !userAnswer.trim()}
                className="ml-2 p-2 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Borrar respuesta"
              >
                🗑️
              </button>
            </div>
          </div>
          
          {/* Botón de verificar */}
          <button
            onClick={checkAnswer}
            disabled={!userAnswer.trim() || isProcessing}
            className={`w-full mb-2 py-3 px-4 rounded-md font-medium text-base transition-all duration-200 flex items-center justify-center ${
              isProcessing
                ? 'bg-blue-500 text-white cursor-wait'
                : !userAnswer.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isCorrect === true
                    ? 'bg-green-600 text-white transform scale-105 shadow-lg'
                    : isCorrect === false
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:transform active:scale-95'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : isCorrect === true ? (
              <>✓ ¡Correcto! Excelente trabajo</>
            ) : isCorrect === false ? (
              <>✕ Incorrecto. Inténtalo de nuevo</>
            ) : (
              !userAnswer.trim() ? 'Escribe una respuesta primero' : 'Comprobar Respuesta'
            )}
          </button>
          
          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => setUserAnswer(userAnswer + num.toString())}
                disabled={isProcessing}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded p-3 text-lg font-medium text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            
            <button
              onClick={() => setUserAnswer(userAnswer + '.')}
              disabled={isProcessing || userAnswer.includes('.')}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-3 text-lg font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Punto decimal"
            >
              .
            </button>
            
            <button
              onClick={() => setUserAnswer(userAnswer + '0')}
              disabled={isProcessing}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded p-3 text-lg font-medium text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </button>
            
            <button
              onClick={() => setUserAnswer(userAnswer.slice(0, -1))}
              disabled={isProcessing || !userAnswer}
              className="bg-red-50 hover:bg-red-100 border border-red-200 rounded p-3 text-lg font-medium text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Borrar último dígito"
            >
              ⌫
            </button>
          </div>

          {/* Mensaje de progreso */}
          {attempts > 0 && attempts < settings.maxAttempts && !isProcessing && (
            <div className="mt-2 text-center text-sm text-gray-600">
              {settings.maxAttempts - attempts} intento{settings.maxAttempts - attempts !== 1 ? 's' : ''} restante{settings.maxAttempts - attempts !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorMode;