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
    <button
      className="relative group cursor-pointer bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 transition-all duration-200 transform hover:scale-105 active:scale-95"
      onClick={onClick}
      title="Haz clic para ver este número en grande"
      aria-label="Ver número en grande"
    >
      <span className="font-mono">{formatNumber(value)}</span>
      
      {/* Icono indicador flotante */}
      <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full shadow-md text-xs animate-pulse">
        <span role="img" aria-label="Ver">👁️</span>
      </div>
    </button>
  );
};

export default ClickableNumber;