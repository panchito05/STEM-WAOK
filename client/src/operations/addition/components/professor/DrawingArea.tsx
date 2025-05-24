import React from 'react';
import { DrawingCanvas } from '../DrawingCanvas';
import { AdditionProblem } from '../../types';

type Position = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

interface DrawingAreaProps {
  position: Position;
  problem: AdditionProblem;
}

export const DrawingArea: React.FC<DrawingAreaProps> = ({
  position,
  problem
}) => {
  // Determinar la posición de la paleta de colores según donde esté el panel
  const getColorPalettePosition = () => {
    // Si el panel está a la izquierda, colores a la derecha
    if (position === 'top-left' || position === 'bottom-left') {
      return 'right';
    }
    // Si el panel está a la derecha, colores a la izquierda
    if (position === 'top-right' || position === 'bottom-right') {
      return 'left';
    }
    // Por defecto, colores a la izquierda
    return 'left';
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <DrawingCanvas 
        width={window.innerWidth} 
        height={window.innerHeight} 
        className="w-full h-full" 
        position={getColorPalettePosition()} 
        currentProblem={problem}
      />
    </div>
  );
};

export default DrawingArea;