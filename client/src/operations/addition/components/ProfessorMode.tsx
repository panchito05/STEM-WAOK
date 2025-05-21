import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash, Move } from 'lucide-react';
import { AdditionProblem } from '../types';
import { DrawingCanvas } from './DrawingCanvas';
import NumericKeypad from './SimpleNumericKeypad';

interface ProfessorModeProps {
  problem: AdditionProblem;
  totalProblems: number; // Total actual de problemas para mostrar
  problemIndex: number;  // Índice actual del problema (0-based)
  onClose: () => void;
  onCorrectAnswer: (wasCorrect: boolean) => void;
  showVerticalFormat?: boolean;
  settings: {
    maxAttempts: number;
    enableCompensation: boolean;
  };
}

export const ProfessorMode: React.FC<ProfessorModeProps> = ({
  problem,
  totalProblems,
  problemIndex,
  onClose,
  onCorrectAnswer,
  showVerticalFormat = true,
  settings
}) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [position, setPosition] = useState<'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'>('topLeft');
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
  
  // Format the problem for display
  const renderProblem = () => {
    // Siempre mostrar formato vertical mejorado para cualquier número de operandos
    if (showVerticalFormat) {
      // Formatear todos los operandos como strings con decimales
      const formattedOperands = problem.operands.map(op => op.toFixed(1));
      
      // Dividir cada operando en parte entera y decimal
      const parts = formattedOperands.map(str => {
        const [intPart, decPart = '0'] = str.split('.');
        return { intPart, decPart };
      });
      
      // Calcular el ancho máximo de la parte entera para alinear correctamente
      const maxIntWidth = Math.max(...parts.map(p => p.intPart.length));
      
      return (
        <div className="font-mono text-xl whitespace-pre">
          {/* Mostrar todos los operandos excepto el último */}
          {parts.slice(0, -1).map((part, idx) => (
            <div key={idx} className="text-right">
              {part.intPart.padStart(maxIntWidth, ' ')}.{part.decPart}
            </div>
          ))}
          
          {/* Mostrar el último operando con el signo + */}
          <div className="flex items-center justify-end">
            <span className="mr-2">+</span>
            <span>
              {parts[parts.length - 1].intPart.padStart(maxIntWidth, ' ')}.
              {parts[parts.length - 1].decPart}
            </span>
          </div>
          
          {/* Línea divisoria */}
          <div className="border-t border-black mt-1 w-full"></div>
        </div>
      );
    } else {
      // Formato horizontal (alternativa)
      return (
        <div className="font-mono text-xl">
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
    <div className="fixed inset-0 bg-white z-50">
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
          <DrawingCanvas 
            width={window.innerWidth} 
            height={window.innerHeight} 
            className="w-full h-full" 
            position={position.includes('Right') ? 'left' : 'right'} 
            currentProblem={problem}
          />
        </div>
        
        {/* Problem and keypad container with dynamic positioning */}
        <div 
          className="absolute z-10 w-[280px]" 
          style={getPositionStyles()}
        >
          {/* Move button para cambiar la posición (en el lado izquierdo) */}
          <button
            onClick={rotatePosition}
            className="absolute top-1 left-1 p-1.5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
            title="Cambiar posición"
          >
            <Move className="h-4 w-4 text-blue-600" />
          </button>
          
          {/* Problem display */}
          <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-md mb-2">
            {renderProblem()}
          </div>
          
          {/* Answer input */}
          <div className="flex items-center mb-2">
            <div className="font-medium mr-2">Respuesta:</div>
            <div className="flex-1 flex">
              <div className="flex-1 bg-white border border-gray-300 rounded p-2 text-lg text-center min-h-[40px]">
                {userAnswer}
              </div>
              <button
                onClick={() => setUserAnswer('')}
                className="ml-2 p-2 rounded bg-white border border-gray-200 hover:bg-gray-100"
                title="Borrar respuesta"
              >
                <Trash className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Check answer button */}
          <button
            onClick={checkAnswer}
            disabled={!userAnswer}
            className={`w-full mb-2 py-3 px-4 rounded-md text-white font-medium text-base
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
              <>¡Correcto! <Check className="ml-1 h-5 w-5 inline" /></>
            ) : (
              <>Incorrecto</>
            )}
          </button>
          
          {/* Información de problema e intentos */}
          <div className="flex justify-between mb-2 text-xs font-medium bg-white p-2 border border-gray-200 rounded-md">
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#4b5df1" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="12" x2="16" y2="12"></line>
                <line x1="12" y1="16" x2="16" y2="16"></line>
                <line x1="8" y1="12" x2="8" y2="12"></line>
                <line x1="8" y1="16" x2="8" y2="16"></line>
              </svg>
              <span className="text-gray-700">Problema {problemIndex + 1} de {totalProblems}</span>
            </div>
            <span className="text-gray-700">Intentos: {attempts}/{settings.maxAttempts}</span>
          </div>
          
          {/* Numeric keypad */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-md p-2">
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