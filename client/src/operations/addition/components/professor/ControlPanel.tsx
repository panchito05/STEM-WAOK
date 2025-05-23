import React from 'react';
import { PositionControl } from './PositionControl';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { CheckButton } from './CheckButton';
import { KeypadContainer } from './KeypadContainer';
import { AdditionProblem } from '../../types';

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
  // Función para obtener la posición correcta del ejercicio
  const getPositionStyles = () => {
    switch (position) {
      case 'topRight':
        return { top: '4px', right: '4px', left: 'auto', bottom: 'auto' };
      case 'bottomRight':
        return { bottom: '4px', right: '4px', top: 'auto', left: 'auto' };
      case 'bottomLeft':
        return { bottom: '4px', left: '4px', top: 'auto', right: 'auto' };
      case 'topLeft':
      default:
        return { top: '4px', left: '4px', right: 'auto', bottom: 'auto' };
    }
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