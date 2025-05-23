import React from 'react';
import { Move } from 'lucide-react';

type Position = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

interface PositionControlProps {
  position: Position;
  onPositionChange: (newPosition: Position) => void;
}

export const PositionControl: React.FC<PositionControlProps> = ({ 
  position, 
  onPositionChange 
}) => {
  // Función para cambiar a la siguiente posición
  const rotatePosition = () => {
    const positions: Position[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
    const currentIndex = positions.indexOf(position);
    const nextIndex = (currentIndex + 1) % positions.length;
    onPositionChange(positions[nextIndex]);
  };

  return (
    <button
      onClick={rotatePosition}
      className="absolute top-1 left-1 p-1.5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
      title="Cambiar posición"
    >
      <Move className="h-4 w-4 text-blue-600" />
    </button>
  );
};

export default PositionControl;