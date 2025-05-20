import React, { useState, useEffect } from 'react';

interface NumberDuplicatorProps {
  numbers: number[];
  visible: boolean;
  onClose: () => void;
}

const NumberDuplicator: React.FC<NumberDuplicatorProps> = ({
  numbers,
  visible,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  
  // Actualizar visibilidad cuando cambia el prop
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  // Cerrar al hacer clic en cualquier parte
  const handleContainerClick = () => {
    setIsVisible(false);
    onClose();
  };
  
  // Evitar que los clics en los números se propaguen
  const handleNumbersClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-40 bg-black bg-opacity-5"
      onClick={handleContainerClick}
    >
      <div 
        className={`bg-white rounded-lg shadow-lg p-6 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={handleNumbersClick}
      >
        <div className="text-center">
          {/* Mostrar números en formato vertical para facilitar la suma */}
          <div className="inline-block text-left">
            {numbers.map((num, index) => (
              <div key={index} className="text-5xl font-mono font-bold mb-2 text-right">
                {index < numbers.length - 1 ? num : (
                  <>
                    <div className="border-b-2 border-black my-2"></div>
                    <span>{num}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberDuplicator;