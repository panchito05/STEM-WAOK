import React from 'react';

interface ClickableNumberProps {
  value: number;
  onClick: () => void;
}

/**
 * Componente para mostrar un número clickeable que destacará
 * visualmente que puede ser clickeado para mostrar en grande
 */
const ClickableNumber: React.FC<ClickableNumberProps> = ({ 
  value, 
  onClick 
}) => {
  // Formatear número con separadores de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div 
      className="relative inline-block"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="relative group bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900 border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 transition-colors"
      >
        {/* Número formateado */}
        <span className="font-mono text-xl font-bold">{formatNumber(value)}</span>
        
        {/* Área ampliada para mejor clickabilidad */}
        <div className="absolute inset-0" title="Haz clic para ver este número en grande"></div>
      </div>
      
      {/* Indicador visual de que es clickeable */}
      <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full shadow-md text-xs animate-pulse">
        <span role="img" aria-label="Ver">👁️</span>
      </div>

      {/* Área adicional extendida para mejorar clickabilidad */}
      <div className="absolute inset-0 cursor-pointer z-10" aria-label="Ver número en grande"></div>
    </div>
  );
};

export default ClickableNumber;