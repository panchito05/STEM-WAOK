// NumericKeypad.tsx - Componente para el teclado numérico del ejercicio de suma
import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo as Backspace, X, Check } from 'lucide-react';

interface NumericKeypadProps {
  onNumberClick: (value: string) => void;
  onBackspaceClick: () => void;
  onClearClick: () => void;
  onCheckClick: () => void;
  disabled?: boolean;
  showCheckButton?: boolean;
  answerMaxDigits?: number;
  currentAnswer: string;
}

/**
 * Componente para el teclado numérico reutilizable
 */
const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onNumberClick,
  onBackspaceClick,
  onClearClick,
  onCheckClick,
  disabled = false,
  showCheckButton = true,
  answerMaxDigits = 3,
  currentAnswer
}) => {
  // Verificar si el usuario ha alcanzado el máximo de dígitos permitidos
  const isMaxDigitsReached = currentAnswer.length >= answerMaxDigits;

  // Determinar las clases base para todos los botones
  const buttonBaseClasses = "font-bold text-lg";
  
  // Clase específica para el botón de verificación
  const checkButtonClasses = `bg-green-600 hover:bg-green-700 text-white ${
    disabled || currentAnswer.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
  }`;
  
  // Clase específica para los botones numéricos
  const numberButtonClasses = `bg-gray-100 hover:bg-gray-200 ${
    disabled || isMaxDigitsReached ? 'opacity-50 cursor-not-allowed' : ''
  }`;
  
  // Clases específicas para botones de acción (borrar, limpiar)
  const actionButtonClasses = "bg-red-100 hover:bg-red-200 text-red-800";
  
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Primera fila */}
      <Button
        type="button"
        onClick={() => onNumberClick('7')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        7
      </Button>
      <Button
        type="button"
        onClick={() => onNumberClick('8')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        8
      </Button>
      <Button
        type="button"
        onClick={() => onNumberClick('9')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        9
      </Button>
      
      {/* Segunda fila */}
      <Button
        type="button"
        onClick={() => onNumberClick('4')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        4
      </Button>
      <Button
        type="button"
        onClick={() => onNumberClick('5')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        5
      </Button>
      <Button
        type="button"
        onClick={() => onNumberClick('6')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        6
      </Button>
      
      {/* Tercera fila */}
      <Button
        type="button"
        onClick={() => onNumberClick('1')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        1
      </Button>
      <Button
        type="button"
        onClick={() => onNumberClick('2')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        2
      </Button>
      <Button
        type="button"
        onClick={() => onNumberClick('3')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        3
      </Button>
      
      {/* Cuarta fila */}
      <Button
        type="button"
        onClick={onClearClick}
        className={`${buttonBaseClasses} ${actionButtonClasses}`}
        disabled={disabled}
      >
        <X className="w-5 h-5" />
      </Button>
      <Button
        type="button"
        onClick={() => onNumberClick('0')}
        className={`${buttonBaseClasses} ${numberButtonClasses}`}
        disabled={disabled || isMaxDigitsReached}
      >
        0
      </Button>
      <Button
        type="button"
        onClick={onBackspaceClick}
        className={`${buttonBaseClasses} ${actionButtonClasses}`}
        disabled={disabled}
      >
        <Backspace className="w-5 h-5" />
      </Button>
      
      {/* Botón de verificación (opcional) */}
      {showCheckButton && (
        <Button
          type="button"
          onClick={onCheckClick}
          className={`${buttonBaseClasses} ${checkButtonClasses} col-span-3 mt-2`}
          disabled={disabled || currentAnswer.length === 0}
        >
          <Check className="w-5 h-5 mr-2" /> Verificar
        </Button>
      )}
    </div>
  );
};

export default NumericKeypad;