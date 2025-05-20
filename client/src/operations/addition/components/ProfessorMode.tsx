import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash } from 'lucide-react';
import { AdditionProblem } from '../types';
import { DrawingCanvas } from './DrawingCanvas';
import { NumericKeypad } from './SimpleNumericKeypad';

interface ProfessorModeProps {
  problem: AdditionProblem;
  onClose: () => void;
  onCorrectAnswer: () => void;
  showVerticalFormat?: boolean;
}

export const ProfessorMode: React.FC<ProfessorModeProps> = ({
  problem,
  onClose,
  onCorrectAnswer,
  showVerticalFormat = true
}) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const canvasRef = useRef<any>(null);
  
  // Reset state when problem changes
  useEffect(() => {
    setUserAnswer('');
    setIsCorrect(null);
    
    // Clear canvas when problem changes
    if (canvasRef.current && canvasRef.current.clear) {
      canvasRef.current.clear();
    }
  }, [problem]);
  
  // Handle answer submission
  const checkAnswer = () => {
    if (!userAnswer) return;
    
    const numAnswer = Number(userAnswer);
    const correctAnswer = problem.operands.reduce((a, b) => a + b, 0);
    const result = numAnswer === correctAnswer;
    
    setIsCorrect(result);
    
    if (result) {
      setTimeout(() => {
        // Reset state
        setUserAnswer('');
        setIsCorrect(null);
        
        // Clear canvas
        if (canvasRef.current && canvasRef.current.clear) {
          canvasRef.current.clear();
        }
        
        // Move to next problem
        onCorrectAnswer();
      }, 1000); // Short delay before moving to next problem
    }
  };
  
  // Format the problem for display
  const renderProblem = () => {
    if (showVerticalFormat) {
      // Vertical format (for addition)
      return (
        <div className="font-mono text-3xl whitespace-pre text-center">
          {problem.operands.map((op, index) => (
            <React.Fragment key={index}>
              {index === problem.operands.length - 1 && (
                <div className="flex items-center">
                  <span className="mr-2">+</span>
                  <span>{op.toFixed(2)}</span>
                </div>
              )} 
              {index !== problem.operands.length - 1 && (
                <div>{op.toFixed(2)}</div>
              )}
            </React.Fragment>
          ))}
          <div className="border-t border-black mt-2 mb-4 w-full"></div>
        </div>
      );
    } else {
      // Horizontal format
      return (
        <div className="font-mono text-3xl text-center">
          {problem.operands.map((op, index) => (
            <React.Fragment key={index}>
              <span>{op.toFixed(2)}</span>
              {index < problem.operands.length - 1 && <span> + </span>}
            </React.Fragment>
          ))}
          <span> = ?</span>
        </div>
      );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Cerrar modo profesor"
      >
        <X className="h-6 w-6 text-gray-800" />
      </button>
      
      {/* Main content */}
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 py-16">
        {/* Problem display */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-4">
          {renderProblem()}
        </div>
        
        {/* Drawing canvas */}
        <div className="flex-grow relative mb-4" ref={canvasRef}>
          <DrawingCanvas height={window.innerHeight * 0.5} />
        </div>
        
        {/* Answer input and keypad */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-medium">Tu respuesta:</div>
            <div className="flex-1 mx-4">
              <div className="p-3 bg-white rounded border border-gray-200 text-2xl text-center min-h-[3rem]">
                {userAnswer}
              </div>
            </div>
            <button
              onClick={() => setUserAnswer('')}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              title="Borrar respuesta"
            >
              <Trash className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <NumericKeypad
              onNumberClick={(num) => setUserAnswer(prev => `${prev}${num}`)}
              onBackspaceClick={() => setUserAnswer(prev => prev.slice(0, -1))}
              onDotClick={() => setUserAnswer(prev => prev.includes('.') ? prev : `${prev}.`)}
              hideArrows={true}
            />
            
            <button
              onClick={checkAnswer}
              disabled={!userAnswer}
              className={`mt-4 p-4 rounded-lg flex items-center justify-center text-white font-medium text-lg
                ${!userAnswer 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : isCorrect === null 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : isCorrect 
                      ? 'bg-green-600' 
                      : 'bg-red-600'}`}
            >
              {isCorrect === null ? (
                <>Comprobar respuesta</>
              ) : isCorrect ? (
                <>¡Correcto! <Check className="ml-2 h-5 w-5" /></>
              ) : (
                <>Incorrecto, intenta de nuevo</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorMode;