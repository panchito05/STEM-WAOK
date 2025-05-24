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
  return (
    <div className="absolute inset-0 w-full h-full">
      <DrawingCanvas 
        width={window.innerWidth} 
        height={window.innerHeight} 
        className="w-full h-full" 
        position="left" 
        currentProblem={problem}
      />
    </div>
  );
};

export default DrawingArea;