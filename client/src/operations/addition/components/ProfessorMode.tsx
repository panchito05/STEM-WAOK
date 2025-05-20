import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash, Move } from 'lucide-react';
import { AdditionProblem } from '../types';
import { DrawingCanvas } from './DrawingCanvas';
import NumericKeypad from './SimpleNumericKeypad';
import { useTheme } from '@/context/ThemeContext';

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
  const [position, setPosition] = useState<'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'>('topLeft');
  const canvasRef = useRef<any>(null);
  
  // Obtener el tema actual del contexto global
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
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
    if (showVerticalFormat && problem.operands.length === 2) {
      // Vertical format (for addition with 2 operands)
      const firstOperand = problem.operands[0];
      const secondOperand = problem.operands[1];
      
      return (
        <div className="font-mono text-2xl whitespace-pre text-right">
          <div className="pr-1">{firstOperand.toFixed(1)}</div>
          <div className="flex items-center justify-end">
            <span className="mr-2">+</span>
            <span>{secondOperand.toFixed(1)}</span>
          </div>
          <div className="border-t border-black dark:border-white mt-1 w-full"></div>
        </div>
      );
    } else {
      // Horizontal format (fallback)
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

  // Función para cambiar a la siguiente posición
  const rotatePosition = () => {
    const positions: Array<'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'> = [
      'topLeft', 'topRight', 'bottomRight', 'bottomLeft'
    ];
    const currentIndex = positions.indexOf(position);
    const nextIndex = (currentIndex + 1) % positions.length;
    setPosition(positions[nextIndex]);
  };

  return (
    <div className={`fixed inset-0 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'} z-50`}>
      {/* Close button X rojo en la parte superior (más pequeño) */}
      <button
        onClick={onClose}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors z-50"
        aria-label="Cerrar modo profesor"
        style={{zIndex: 9999}}
      >
        <X className="h-3 w-3 text-white" />
      </button>
      
      {/* Main layout with drawing area taking most of the screen */}
      <div className="h-full w-full">
        {/* Full screen drawing canvas as background - expanded to full screen */}
        <div className="absolute inset-0 w-full h-full">
          <DrawingCanvas width={window.innerWidth} height={window.innerHeight} className="w-full h-full" />
        </div>
        
        {/* Problem and keypad container with dynamic positioning */}
        <div 
          className="absolute z-10 w-[280px]" 
          style={getPositionStyles()}
        >
          {/* Move button para cambiar la posición (en el lado izquierdo) */}
          <button
            onClick={rotatePosition}
            className="absolute top-1 left-1 p-1.5 rounded-full bg-blue-100 dark:bg-blue-700 hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors"
            title="Cambiar posición"
          >
            <Move className="h-4 w-4 text-blue-600 dark:text-blue-200" />
          </button>
          
          {/* Problem display */}
          <div className={`${isDarkTheme ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'} p-4 shadow-sm border rounded-md mb-2`}>
            {renderProblem()}
          </div>
          
          {/* Answer input */}
          <div className="flex items-center mb-2">
            <div className={`font-medium mr-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Respuesta:</div>
            <div className="flex-1 flex">
              <div className={`flex-1 ${isDarkTheme ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded p-2 text-lg text-center min-h-[40px]`}>
                {userAnswer}
              </div>
              <button
                onClick={() => setUserAnswer('')}
                className={`ml-2 p-2 rounded ${isDarkTheme ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-100'} border`}
                title="Borrar respuesta"
              >
                <Trash className={`h-4 w-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
          
          {/* Check answer button */}
          <button
            onClick={checkAnswer}
            disabled={!userAnswer}
            className={`w-full mb-2 py-3 px-4 rounded-md text-white font-medium text-base
              ${!userAnswer 
                ? `${isDarkTheme ? 'bg-gray-600' : 'bg-gray-300'} cursor-not-allowed` 
                : isCorrect === null 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : isCorrect 
                    ? 'bg-green-600' 
                    : 'bg-red-600'}`}
          >
            {isCorrect === null ? (
              <>Comprobar</>
            ) : isCorrect ? (
              <>¡Correcto! <Check className="ml-1 h-5 w-5 inline" /></>
            ) : (
              <>Incorrecto</>
            )}
          </button>
          
          {/* Numeric keypad */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-md p-2">
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