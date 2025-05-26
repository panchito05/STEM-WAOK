import React from 'react';
import { Move } from 'lucide-react';
import { useSynchronizedLayout } from './context/SynchronizedLayoutContext';

type Position = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

interface PositionControlProps {
  position: Position;
  onPositionChange: (newPosition: Position) => void;
}

export const PositionControl: React.FC<PositionControlProps> = ({ 
  position, 
  onPositionChange 
}) => {
  // Usar el contexto de layout sincronizado
  const { moveToNextLayout } = useSynchronizedLayout();

  // Función mejorada que usa el sistema sincronizado
  const rotatePosition = () => {
    console.log(`🔍 [POSITION-CONTROL] ===== INICIO CLIC BOTÓN MOVER =====`);
    console.log(`🔍 [POSITION-CONTROL] Position actual: "${position}"`);
    console.log(`🔍 [POSITION-CONTROL] Timestamp: ${Date.now()}`);
    
    // Usar el sistema de layout sincronizado que ya funciona
    moveToNextLayout();
    
    console.log(`🔍 [POSITION-CONTROL] moveToNextLayout() ejecutado`);
    console.log(`🔍 [POSITION-CONTROL] ===== FIN CLIC BOTÓN MOVER =====`);
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