import React, { useState, useEffect, useRef } from 'react';
import { AdditionProblem } from '../../types';
import { CloseButton } from './CloseButton';
import { DrawingArea } from './DrawingArea';
import { ControlPanel } from './ControlPanel';

type Position = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

interface ProfessorModeModularProps {
  problem: AdditionProblem;
  onClose: () => void;
  onCorrectAnswer: (wasCorrect: boolean) => void;
  showVerticalFormat?: boolean;
  settings: {
    maxAttempts: number;
    enableCompensation: boolean;
  };
}

export const ProfessorModeModular: React.FC<ProfessorModeModularProps> = ({
  problem,
  onClose,
  onCorrectAnswer,
  showVerticalFormat = true,
  settings
}) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [position, setPosition] = useState<Position>('topLeft');
  const [attempts, setAttempts] = useState<number>(0);
  const canvasRef = useRef<any>(null);
  
  // Reset state when problem changes
  useEffect(() => {
    setUserAnswer('');
    setIsCorrect(null);
    setAttempts(0);
    
    // Clear canvas when problem changes
    if (canvasRef.current && canvasRef.current.clear) {
      canvasRef.current.clear();
    }
  }, [problem]);
  
  // Handle answer submission
  const checkAnswer = () => {
    if (!userAnswer) return;
    
    // Incrementar número de intentos
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    const numAnswer = Number(userAnswer);
    const correctAnswer = problem.operands.reduce((a, b) => a + b, 0);
    const result = numAnswer === correctAnswer;
    
    setIsCorrect(result);
    
    // Si la respuesta es correcta o se agotaron los intentos
    if (result || newAttempts >= settings.maxAttempts) {
      setTimeout(() => {
        // Reset state
        setUserAnswer('');
        setIsCorrect(null);
        setAttempts(0);
        
        // Clear canvas
        if (canvasRef.current && canvasRef.current.clear) {
          canvasRef.current.clear();
        }
        
        // Move to next problem, indicando si fue correcto para compensación si es necesario
        onCorrectAnswer(result);
      }, 1000); // Short delay before moving to next problem
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Close button - Módulo independiente */}
      <CloseButton onClose={onClose} />
      
      {/* Main layout with drawing area taking most of the screen */}
      <div className="h-full w-full">
        {/* Full screen drawing canvas as background - Módulo independiente */}
        <DrawingArea 
          position={position}
          problem={problem}
        />
        
        {/* Problem and control panel container - Módulo independiente */}
        <ControlPanel
          problem={problem}
          position={position}
          onPositionChange={setPosition}
          userAnswer={userAnswer}
          onAnswerChange={setUserAnswer}
          attempts={attempts}
          maxAttempts={settings.maxAttempts}
          isCorrect={isCorrect}
          onCheck={checkAnswer}
          showVerticalFormat={showVerticalFormat}
        />
      </div>
    </div>
  );
};

export default ProfessorModeModular;