import React, { useState, useEffect } from 'react';

interface NumberDuplicatorProps {
  numbers: number[];
  visible: boolean;
  onClose: () => void;
}

/**
 * Componente que muestra números alineados verticalmente para facilitar la suma
 * Los números se muestran en un formato vertical con una línea de separación
 * y el último número (resultado) en la parte inferior
 */
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
  
  // Formatear número con separadores de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-40 bg-black bg-opacity-30 dark:bg-black dark:bg-opacity-50"
      onClick={handleContainerClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={handleNumbersClick}
      >
        <div className="flex justify-end mb-2">
          <button 
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            onClick={handleContainerClick}
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="text-center">
          {/* Mostrar números en formato vertical para facilitar la suma */}
          <div className="inline-block text-left">
            {numbers.map((num, index) => (
              <div key={index} className="text-5xl font-mono font-bold mb-2 text-right dark:text-white">
                {index < numbers.length - 1 ? (
                  formatNumber(num)
                ) : (
                  <>
                    <div className="border-b-2 border-black dark:border-white my-2"></div>
                    <span>{formatNumber(num)}</span>
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