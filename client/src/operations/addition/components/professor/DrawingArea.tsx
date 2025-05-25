import React from 'react';
import { DrawingCanvas } from '../DrawingCanvas';
import { AdditionProblem } from '../../types';

interface DrawingAreaProps {
  problem: AdditionProblem;
  colorsPosition: 'left' | 'right';
}

export const DrawingArea: React.FC<DrawingAreaProps> = ({
  problem,
  colorsPosition
}) => {
  console.log(`🎨 [NEW ARCH] DrawingArea renderizado con colores en: ${colorsPosition}`);
  
  return (
    <div className="absolute inset-0 w-full h-full">
      <DrawingCanvas 
        width={window.innerWidth} 
        height={window.innerHeight} 
        className="w-full h-full" 
        position={colorsPosition} 
        currentProblem={problem}
      />
    </div>
  );
};

export default DrawingArea;