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
  // Determinar la posición de la paleta de colores según la secuencia sincronizada
  const getColorPalettePosition = () => {
    // Secuencia sincronizada en sentido horario:
    // Posición 1: Panel=top-left + Colores=right
    // Posición 2: Panel=top-right + Colores=right  
    // Posición 3: Panel=bottom-right + Colores=left
    // Posición 4: Panel=bottom-left + Colores=left
    
    if (position === 'topLeft' || position === 'topRight') {
      return 'right'; // Colores en lado derecho
    }
    if (position === 'bottomRight' || position === 'bottomLeft') {
      return 'left'; // Colores en lado izquierdo
    }
    
    // Por defecto, colores a la derecha
    return 'right';
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