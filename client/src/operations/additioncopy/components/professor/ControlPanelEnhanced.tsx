import React from 'react';
import { AdditionProblem } from '../../types';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { CheckButton } from './CheckButton';
import { KeypadContainer } from './KeypadContainer';
import { PositionControl } from './PositionControl';
import { useProfessorContext } from './context/ProfessorContext';

interface ControlPanelEnhancedProps {
  problem: AdditionProblem;
  position: string;
  onPositionChange: (position: string) => void;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  attempts: number;
  maxAttempts: number;
  isCorrect: boolean | null;
  onCheck: () => void;
  showVerticalFormat?: boolean;
}

export const ControlPanelEnhanced: React.FC<ControlPanelEnhancedProps> = ({
  problem,
  position,
  onPositionChange,
  userAnswer,
  onAnswerChange,
  attempts,
  maxAttempts,
  isCorrect,
  onCheck,
  showVerticalFormat = true
}) => {
  const { state } = useProfessorContext();
  
  // Determinar si el botón debe estar deshabilitado
  const isCheckDisabled = !userAnswer.trim() || state.isProcessing;

  // Función para limpiar respuesta
  const handleClearAnswer = () => {
    onAnswerChange('');
  };

  // Función para agregar dígito desde el teclado
  const handleKeypadInput = (value: string) => {
    if (value === 'clear') {
      handleClearAnswer();
    } else if (value === 'backspace') {
      onAnswerChange(userAnswer.slice(0, -1));
    } else {
      onAnswerChange(userAnswer + value);
    }
  };

  // Estilos del panel según la posición
  const getPanelStyles = () => {
    const baseStyles = "bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full transition-all duration-300";
    
    switch (position) {
      case 'top-left':
        return `${baseStyles} fixed top-4 left-4 z-40`;
      case 'top-right':
        return `${baseStyles} fixed top-4 right-4 z-40`;
      case 'bottom-left':
        return `${baseStyles} fixed bottom-4 left-4 z-40`;
      case 'bottom-right':
        return `${baseStyles} fixed bottom-4 right-4 z-40`;
      case 'center':
        return `${baseStyles} fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40`;
      default:
        return `${baseStyles} fixed bottom-4 right-4 z-40`;
    }
  };

  return (
    <div className={getPanelStyles()}>
      {/* Control de posición */}
      <PositionControl
        currentPosition={position}
        onPositionChange={onPositionChange}
      />
      
      {/* Mostrar problema */}
      <ProblemDisplay
        problem={problem}
        showVerticalFormat={showVerticalFormat}
        attempts={attempts}
        maxAttempts={maxAttempts}
        isProcessing={state.isProcessing}
      />
      
      {/* Campo de respuesta */}
      <AnswerInput
        value={userAnswer}
        onChange={onAnswerChange}
        onClear={handleClearAnswer}
        isDisabled={state.isProcessing}
        showValidation={true}
      />
      
      {/* Botón de verificar */}
      <CheckButton
        onCheck={onCheck}
        disabled={isCheckDisabled}
        isCorrect={isCorrect}
        isProcessing={state.isProcessing}
        statusMessage={
          !userAnswer.trim() 
            ? 'Escribe una respuesta primero' 
            : attempts >= maxAttempts 
              ? 'Sin más intentos'
              : undefined
        }
      />
      
      {/* Teclado numérico */}
      <KeypadContainer
        onInput={handleKeypadInput}
        disabled={state.isProcessing}
      />
      
      {/* Indicadores de estado */}
      {state.isProcessing && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
            Verificando...
          </div>
        </div>
      )}
      
      {/* Mensaje de progreso */}
      {attempts > 0 && attempts < maxAttempts && !state.isProcessing && (
        <div className="mt-2 text-center text-sm text-gray-600">
          {maxAttempts - attempts} intento{maxAttempts - attempts !== 1 ? 's' : ''} restante{maxAttempts - attempts !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default ControlPanelEnhanced;