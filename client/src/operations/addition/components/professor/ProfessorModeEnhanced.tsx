import React, { useEffect, useCallback } from 'react';
import { AdditionProblem } from '../../types';
import { CloseButton } from './CloseButton';
import { DrawingArea } from './DrawingArea';
import { ControlPanel } from './ControlPanel';
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
        
        {/* Panel de control mejorado */}
        <ControlPanel
          problem={problem}
          position={state.position}
          onPositionChange={(pos) => {
            // Persistir posición automáticamente
            try {
              localStorage.setItem('professor_position', pos);
            } catch (error) {
              ErrorHandler.logError('PositionSave', error);
            }
          }}
          userAnswer={state.userAnswer}
          onAnswerChange={setUserAnswer}
          attempts={state.attempts}
          maxAttempts={settings.maxAttempts}
          isCorrect={state.isCorrect}
          onCheck={checkAnswer}
          showVerticalFormat={showVerticalFormat}
        />
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