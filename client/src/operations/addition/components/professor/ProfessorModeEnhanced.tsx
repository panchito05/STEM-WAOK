import React, { useEffect, useCallback } from 'react';
import { AdditionProblem } from '../../types';
import { CloseButton } from './CloseButton';
import { DrawingArea } from './DrawingArea';
import { ControlPanelEnhanced } from './ControlPanelEnhanced';
import { ProfessorProvider, useProfessorContext } from './context/ProfessorContext';
import { useProfessorStateMachine } from './state/StateMachine';
import { InputValidator, ErrorHandler, TimingUtils } from './utils/ValidationUtils';

interface ProfessorModeEnhancedProps {
  problem: AdditionProblem;
  onClose: () => void;
  onCorrectAnswer: (wasCorrect: boolean) => void;
  showVerticalFormat?: boolean;
  settings: {
    maxAttempts: number;
    enableCompensation: boolean;
  };
}

// Componente interno que utiliza el contexto
const ProfessorModeContent: React.FC<ProfessorModeEnhancedProps> = ({
  problem,
  onClose,
  onCorrectAnswer,
  showVerticalFormat = true,
  settings
}) => {
  const { state, setUserAnswer, incrementAttempts, setCorrect, setProcessing, clearCanvas } = useProfessorContext();
  const stateMachine = useProfessorStateMachine('waiting_answer');

  // Calcular respuesta correcta de forma segura
  const calculateCorrectAnswer = useCallback((prob: AdditionProblem): number => {
    if (!InputValidator.validateProblem(prob)) {
      ErrorHandler.logError('ProfessorMode', 'Problema inválido recibido');
      return 0;
    }
    
    return prob.operands.reduce((sum, operand) => {
      const num = typeof operand === 'number' ? operand : parseFloat(operand.toString());
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, []);

  // Función principal de verificación mejorada
  const checkAnswer = useCallback(() => {
    if (!stateMachine.canSubmitAnswer) {
      console.warn('Intento de envío en estado inválido:', stateMachine.currentState);
      return;
    }

    // Validar entrada
    const validation = InputValidator.validateNumericInput(state.userAnswer);
    if (!validation.isValid) {
      console.error('Entrada inválida:', validation.error);
      // Mostrar error al usuario sin contar como intento
      return;
    }

    stateMachine.transition('SUBMIT_ANSWER');
    setProcessing(true);
    incrementAttempts();

    const safeCheckAnswer = ErrorHandler.createSafeFunction(() => {
      const userNum = validation.value!;
      const correctAnswer = calculateCorrectAnswer(problem);
      const isCorrect = InputValidator.compareAnswers(userNum, correctAnswer);

      setCorrect(isCorrect);

      if (isCorrect) {
        stateMachine.transition('ANSWER_CORRECT');
        
        // Auto-avance con delay configurable
        TimingUtils.createDelayedAction(
          'auto-advance-correct',
          () => {
            clearCanvas();
            setProcessing(false);
            onCorrectAnswer(true);
          },
          state.settings.autoAdvanceDelay
        );
      } else {
        stateMachine.transition('ANSWER_INCORRECT');
        
        // Verificar si se agotaron los intentos
        if (state.attempts >= settings.maxAttempts) {
          stateMachine.transition('MAX_ATTEMPTS');
          
          TimingUtils.createDelayedAction(
            'auto-advance-max-attempts',
            () => {
              clearCanvas();
              setProcessing(false);
              onCorrectAnswer(false);
            },
            state.settings.autoAdvanceDelay
          );
        } else {
          // Continuar con siguiente intento
          TimingUtils.createDelayedAction(
            'clear-feedback',
            () => {
              setProcessing(false);
              stateMachine.transition('CONTINUE');
            },
            1500
          );
        }
      }
    }, 'checkAnswer');

    safeCheckAnswer();
  }, [
    stateMachine,
    state.userAnswer,
    state.attempts,
    state.settings.autoAdvanceDelay,
    settings.maxAttempts,
    problem,
    setProcessing,
    incrementAttempts,
    setCorrect,
    clearCanvas,
    onCorrectAnswer,
    calculateCorrectAnswer
  ]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      TimingUtils.cancelAllDelayedActions();
    };
  }, []);

  // Reiniciar estado cuando cambia el problema
  useEffect(() => {
    if (problem.id !== state.currentProblem?.id) {
      setUserAnswer('');
      setCorrect(null);
      setProcessing(false);
      clearCanvas();
      stateMachine.reset();
      stateMachine.transition('START');
    }
  }, [problem.id, state.currentProblem?.id, setUserAnswer, setCorrect, setProcessing, clearCanvas, stateMachine]);

  // Manejar teclas de atajo
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && stateMachine.canSubmitAnswer && state.userAnswer.trim()) {
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
  }, [checkAnswer, stateMachine.canSubmitAnswer, state.userAnswer, onClose]);

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Close button mejorado */}
      <CloseButton onClose={onClose} />
      
      {/* Indicador de estado para debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-16 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs z-50">
          Estado: {stateMachine.currentState}
        </div>
      )}
      
      {/* Main layout con área de dibujo */}
      <div className="h-full w-full">
        {/* Área de dibujo de pantalla completa */}
        <DrawingArea 
          position={state.position}
          problem={problem}
        />
        
        {/* Panel de control mejorado - Usando componentes existentes temporalmente */}
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full z-40">
          {/* Mostrar problema */}
          <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-md mb-2">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <span>Problema {(problem.index ?? 0) + 1} de {problem.total ?? 1}</span>
              </div>
              <div className="text-sm font-medium text-blue-600">
                Intentos: {state.attempts}/{settings.maxAttempts}
              </div>
            </div>
            
            {/* Problema matemático mejorado */}
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
          
          {/* Campo de respuesta mejorado */}
          <div className="mb-2">
            <div className="flex items-center mb-1">
              <div className="font-medium mr-2">Respuesta:</div>
              {state.userAnswer.trim() && !isNaN(parseFloat(state.userAnswer)) && (
                <span className="text-green-600">✓</span>
              )}
            </div>
            
            <div className="flex">
              <input
                type="text"
                value={state.userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={state.isProcessing}
                placeholder={state.isProcessing ? 'Esperando...' : 'Escribe tu respuesta'}
                className={`flex-1 border rounded p-2 text-lg text-center min-h-[40px] transition-all duration-200 ${
                  state.isProcessing 
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                    : state.userAnswer.trim() && !isNaN(parseFloat(state.userAnswer))
                      ? 'bg-green-50 border-green-300 text-green-900 focus:border-green-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && state.userAnswer.trim() && !state.isProcessing) {
                    checkAnswer();
                  }
                }}
                autoFocus
              />
              
              <button
                onClick={() => setUserAnswer('')}
                disabled={state.isProcessing || !state.userAnswer.trim()}
                className="ml-2 p-2 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Borrar respuesta"
              >
                🗑️
              </button>
            </div>
          </div>
          
          {/* Botón de verificar mejorado */}
          <button
            onClick={checkAnswer}
            disabled={!state.userAnswer.trim() || state.isProcessing}
            className={`w-full mb-2 py-3 px-4 rounded-md font-medium text-base transition-all duration-200 flex items-center justify-center ${
              state.isProcessing
                ? 'bg-blue-500 text-white cursor-wait'
                : !state.userAnswer.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : state.isCorrect === true
                    ? 'bg-green-600 text-white transform scale-105 shadow-lg'
                    : state.isCorrect === false
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:transform active:scale-95'
            }`}
          >
            {state.isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : state.isCorrect === true ? (
              <>
                ✓ ¡Correcto! Excelente trabajo
              </>
            ) : state.isCorrect === false ? (
              <>
                ✕ Incorrecto. Inténtalo de nuevo
              </>
            ) : (
              !state.userAnswer.trim() ? 'Escribe una respuesta primero' : 'Comprobar Respuesta'
            )}
          </button>
          
          {/* Indicadores de estado */}
          {state.isProcessing && (
            <div className="mt-2 text-center">
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Verificando...
              </div>
            </div>
          )}
          
          {/* Teclado numérico mejorado */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {/* Números 1-9 */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => setUserAnswer(state.userAnswer + num.toString())}
                disabled={state.isProcessing}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded p-3 text-lg font-medium text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            
            {/* Fila inferior: 0, punto decimal, borrar */}
            <button
              onClick={() => setUserAnswer(state.userAnswer + '.')}
              disabled={state.isProcessing || state.userAnswer.includes('.')}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-3 text-lg font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Punto decimal"
            >
              .
            </button>
            
            <button
              onClick={() => setUserAnswer(state.userAnswer + '0')}
              disabled={state.isProcessing}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded p-3 text-lg font-medium text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </button>
            
            <button
              onClick={() => setUserAnswer(state.userAnswer.slice(0, -1))}
              disabled={state.isProcessing || !state.userAnswer}
              className="bg-red-50 hover:bg-red-100 border border-red-200 rounded p-3 text-lg font-medium text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Borrar último dígito"
            >
              ⌫
            </button>
          </div>

          {/* Mensaje de progreso */}
          {state.attempts > 0 && state.attempts < settings.maxAttempts && !state.isProcessing && (
            <div className="mt-2 text-center text-sm text-gray-600">
              {settings.maxAttempts - state.attempts} intento{settings.maxAttempts - state.attempts !== 1 ? 's' : ''} restante{settings.maxAttempts - state.attempts !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente principal que provee el contexto
export const ProfessorModeEnhanced: React.FC<ProfessorModeEnhancedProps> = (props) => {
  return (
    <ProfessorProvider
      initialProblem={props.problem}
      initialSettings={{
        maxAttempts: props.settings.maxAttempts,
        enableCompensation: props.settings.enableCompensation,
        autoAdvanceDelay: 1000, // Configurable
      }}
    >
      <ProfessorModeContent {...props} />
    </ProfessorProvider>
  );
};

export default ProfessorModeEnhanced;