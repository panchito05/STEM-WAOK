import React from 'react';
import { DrawingCanvas } from '../DrawingCanvas';
import { AdditionCopyProblem } from '../../types';
import { ColorPosition } from './context/SynchronizedLayoutContext';

interface DrawingAreaProps {
  problem: AdditionCopyProblem;
  colorPosition: ColorPosition; // Nueva prop que viene del contexto sincronizado
}

export const DrawingArea: React.FC<DrawingAreaProps> = ({
  problem,
  colorPosition
}) => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <DrawingCanvas 
        width={window.innerWidth} 
        height={window.innerHeight} 
        className="w-full h-full" 
        position={colorPosition} // Usar directamente la posición sincronizada
        currentProblem={problem}
      />
    </div>
  );
};

export default DrawingArea;