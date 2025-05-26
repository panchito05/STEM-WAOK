import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface CheckButtonProps {
  onCheck: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
  isProcessing?: boolean;
  statusMessage?: string;
}

export const CheckButton: React.FC<CheckButtonProps> = ({
  onCheck,
  disabled,
  isCorrect,
  isProcessing = false,
  statusMessage
}) => {
  // Determinar estado visual
  const getButtonState = () => {
    if (isProcessing) return 'processing';
    if (disabled) return 'disabled';
    if (isCorrect === true) return 'correct';
    if (isCorrect === false) return 'incorrect';
    return 'ready';
  };

  const buttonState = getButtonState();

  // Estilos mejorados con animaciones
  const getButtonStyles = () => {
    const baseStyles = "w-full mb-2 py-3 px-4 rounded-md font-medium text-base transition-all duration-200 flex items-center justify-center";
    
    switch (buttonState) {
      case 'processing':
        return `${baseStyles} bg-blue-500 text-white cursor-wait`;
      case 'disabled':
        return `${baseStyles} bg-gray-300 text-gray-500 cursor-not-allowed`;
      case 'correct':
        return `${baseStyles} bg-green-600 text-white transform scale-105 shadow-lg`;
      case 'incorrect':
        return `${baseStyles} bg-red-600 text-white`;
      case 'ready':
      default:
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:transform active:scale-95`;
    }
  };

  // Contenido del botón mejorado
  const getButtonContent = () => {
    if (isProcessing) {
      return (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Verificando...
        </>
      );
    }

    if (isCorrect === true) {
      return (
        <>
          <Check className="mr-2 h-5 w-5" />
          ¡Correcto! Excelente trabajo
        </>
      );
    }

    if (isCorrect === false) {
      return (
        <>
          <span className="mr-2 text-xl">✕</span>
          Incorrecto. Inténtalo de nuevo
        </>
      );
    }

    return statusMessage || 'Comprobar Respuesta';
  };

  return (
    <button
      onClick={onCheck}
      disabled={disabled || isProcessing}
      className={getButtonStyles()}
      aria-label={`Verificar respuesta - Estado: ${buttonState}`}
    >
      {getButtonContent()}
    </button>
  );
};

export default CheckButton;