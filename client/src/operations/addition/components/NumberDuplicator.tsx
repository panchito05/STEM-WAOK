import React, { useState, useEffect } from 'react';

interface NumberDuplicatorProps {
  numbers: number[];
  visible: boolean;
  onClose: () => void;
}

/**
 * Componente que muestra números alineados verticalmente para facilitar la suma
 * Los números se muestran en un formato vertical con una línea de separación
 * para facilitar la visualización de operaciones matemáticas
 */
const NumberDuplicator: React.FC<NumberDuplicatorProps> = ({
  numbers,
  visible,
  onClose
}) => {
  // No usamos estado local para evitar problemas de sincronización
  // Usamos directamente la prop visible para determinar si mostramos o no
  
  // Formatear número con separadores de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  // Si no es visible, no renderizamos nada
  if (!visible || !numbers.length) return null;

  const handleBackdropClick = () => {
    onClose();
  };
  
  const handleModalClick = (e: React.MouseEvent) => {
    // Evitar que el clic se propague al backdrop
    e.stopPropagation();
  };
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in"
        onClick={handleModalClick}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Visualización de números</h2>
          <button 
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="flex justify-center mb-4">
          <div className="inline-block">
            {numbers.map((num, index) => (
              <div key={index} className="flex justify-end mb-4">
                {index === numbers.length - 1 && (
                  <div className="w-full border-t-2 border-black dark:border-white -mt-2 mb-2"></div>
                )}
                <div className="text-5xl font-mono font-bold text-right dark:text-white">
                  {formatNumber(num)}
                </div>
                {index < numbers.length - 1 && index % 2 === 1 && (
                  <div className="text-4xl ml-4">+</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Define una animación de fade-in para el tailwind.config.ts
// Asegúrate de que esta animación esté definida en tu configuración
const animationStyles = `
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
`;

export default NumberDuplicator;