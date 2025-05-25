import React, { useEffect } from 'react';
import { PositionControl } from './PositionControl';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { CheckButton } from './CheckButton';
import { KeypadContainer } from './KeypadContainer';
import { AdditionProblem } from '../../types';
import { useSynchronizedLayout } from './context/SynchronizedLayoutContext';

type Position = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

interface ControlPanelProps {
  problem: AdditionProblem;
  position: Position;
  onPositionChange: (newPosition: Position) => void;
  userAnswer: string;
  onAnswerChange: (value: string) => void;
  attempts: number;
  maxAttempts: number;
  isCorrect: boolean | null;
  onCheck: () => void;
  showVerticalFormat?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
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
  // Usar el contexto de layout sincronizado
  const { currentLayout, getPanelCSSClasses } = useSynchronizedLayout();

  // Sincronizar la posición local con el layout sincronizado
  useEffect(() => {
    console.log(`🔍 [CONTROL-PANEL] Layout sincronizado cambió:`, currentLayout);
    console.log(`🔍 [CONTROL-PANEL] Position local actual: "${position}"`);
    console.log(`🔍 [CONTROL-PANEL] Position del layout: "${currentLayout.panelPosition}"`);
    
    // Solo actualizar si la posición local es diferente
    if (position !== currentLayout.panelPosition) {
      console.log(`🔍 [CONTROL-PANEL] Sincronizando position: "${position}" -> "${currentLayout.panelPosition}"`);
      onPositionChange(currentLayout.panelPosition);
    }
  }, [currentLayout, position, onPositionChange]);

  // Función para obtener la posición correcta del ejercicio usando el sistema sincronizado
  const getPositionStyles = () => {
    // Usar las clases CSS del sistema sincronizado
    const cssClasses = getPanelCSSClasses();
    console.log(`🔍 [CONTROL-PANEL] CSS classes del sistema sincronizado:`, cssClasses);
    
    // Convertir clases CSS a styles inline para compatibilidad
    if (cssClasses.includes('lg:top-4') && cssClasses.includes('lg:right-4')) {
      return { top: '4px', right: '4px', left: 'auto', bottom: 'auto' };
    }
    if (cssClasses.includes('lg:bottom-4') && cssClasses.includes('lg:right-4')) {
      return { bottom: '4px', right: '4px', top: 'auto', left: 'auto' };
    }
    if (cssClasses.includes('lg:bottom-4') && cssClasses.includes('lg:left-4')) {
      return { bottom: '4px', left: '4px', top: 'auto', right: 'auto' };
    }
    // topLeft por defecto
    return { top: '4px', left: '4px', right: 'auto', bottom: 'auto' };
  };

  return (
    <div 
      className="absolute z-10 w-[280px]" 
      style={getPositionStyles()}
    >
      {/* Move button para cambiar la posición */}
      <PositionControl 
        position={position} 
        onPositionChange={onPositionChange} 
      />
      
      {/* Problem display with information about attempts and problem count */}
      <ProblemDisplay
        problem={problem}
        showVerticalFormat={showVerticalFormat}
        attempts={attempts}
        maxAttempts={maxAttempts}
      />
      
      {/* Answer input */}
      <AnswerInput
        value={userAnswer}
        onChange={onAnswerChange}
        onClear={() => onAnswerChange('')}
      />
      
      {/* Check answer button */}
      <CheckButton
        onCheck={onCheck}
        disabled={!userAnswer}
        isCorrect={isCorrect}
      />
      
      {/* Numeric keypad */}
      <KeypadContainer
        onNumberClick={(num: number | string) => onAnswerChange(`${userAnswer}${num}`)}
        onBackspaceClick={() => onAnswerChange(userAnswer.slice(0, -1))}
        onDotClick={() => onAnswerChange(userAnswer.includes('.') ? userAnswer : `${userAnswer}.`)}
      />
    </div>
  );
};

export default ControlPanel;