import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash } from 'lucide-react';
import { AdditionProblem } from '../types';
import { DrawingCanvas } from './DrawingCanvas';
import NumericKeypad from './SimpleNumericKeypad';

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
        <div className="font-mono text-2xl whitespace-pre">
          {problem.operands.map((op, index) => (
            <React.Fragment key={index}>
              {index === problem.operands.length - 1 && (
                <div className="flex items-center">
                  <span className="mr-2">+</span>
                  <span>{op.toFixed(1)}</span>
                </div>
              )} 
              {index !== problem.operands.length - 1 && (
                <div>{op.toFixed(1)}</div>
              )}
            </React.Fragment>
          ))}
          <div className="border-t border-black mt-1 w-full"></div>
        </div>
      );
    } else {
      // Horizontal format
      return (
        <div className="font-mono text-2xl">
          {problem.operands.map((op, index) => (
            <React.Fragment key={index}>
              <span>{op.toFixed(1)}</span>
              {index < problem.operands.length - 1 && <span> + </span>}
            </React.Fragment>
          ))}
          <span> = ?</span>
        </div>
      );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Cerrar modo profesor"
      >
        <X className="h-5 w-5 text-gray-800" />
      </button>
      
      {/* Main layout with problem in top-left and drawing area taking most of the screen */}
      <div className="h-full w-full flex flex-col">
        <div className="flex w-full">
          {/* Problem display in top-left corner */}
          <div className="absolute top-2 left-2 bg-white p-2 shadow-sm border border-gray-200 rounded-md">
            {renderProblem()}
          </div>
          
          {/* Drawing canvas taking full screen */}
          <div className="w-full h-[calc(100vh-160px)]" ref={canvasRef}>
            <DrawingCanvas height={window.innerHeight - 160} />
          </div>
        </div>
        
        {/* Simple numeric keypad at bottom */}
        <div className="fixed bottom-0 left-0 w-full bg-gray-50 border-t border-gray-200">
          <div className="flex items-center px-4 py-2">
            <div className="mr-2">Respuesta:</div>
            <div className="flex-1 mx-2">
              <div className="p-2 bg-white rounded border border-gray-200 text-xl text-center">
                {userAnswer}
              </div>
            </div>
            <button
              onClick={() => setUserAnswer('')}
              className="p-1 rounded hover:bg-gray-200 transition-colors mr-2"
              title="Borrar respuesta"
            >
              <Trash className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={checkAnswer}
              disabled={!userAnswer}
              className={`py-2 px-4 rounded flex items-center text-white text-sm
                ${!userAnswer 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : isCorrect === null 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : isCorrect 
                      ? 'bg-green-600' 
                      : 'bg-red-600'}`}
            >
              {isCorrect === null ? (
                <>Comprobar</>
              ) : isCorrect ? (
                <>¡Correcto! <Check className="ml-1 h-4 w-4" /></>
              ) : (
                <>Incorrecto</>
              )}
            </button>
          </div>
          
          <div className="px-2 pb-2">
            <NumericKeypad
              onNumberClick={(num: number | string) => setUserAnswer(prev => `${prev}${num}`)}
              onBackspaceClick={() => setUserAnswer(prev => prev.slice(0, -1))}
              onDotClick={() => setUserAnswer(prev => prev.includes('.') ? prev : `${prev}.`)}
              hideArrows={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorMode;