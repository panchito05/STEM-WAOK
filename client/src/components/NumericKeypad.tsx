/**
 * Componente de teclado numérico estandarizado
 * 
 * Este componente proporciona un teclado numérico consistente
 * que se puede usar en diferentes módulos para la entrada de respuestas.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight, CornerDownLeft } from 'lucide-react';

interface NumericKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigitPress,
  onBackspace,
  onClear,
  onSubmit,
  onMoveLeft,
  onMoveRight,
  allowDecimal = false,
  allowNegative = false,
  disabled = false,
  compact = false,
  className = ''
}) => {
  // Definir estilos base para los botones
  const baseButtonClass = "font-bold";
  const numberButtonClass = `${baseButtonClass} ${compact ? 'text-lg' : 'text-xl'}`;
  const actionButtonClass = `${baseButtonClass} ${compact ? 'text-sm' : 'text-md'}`;
  
  // Definir el tamaño para los botones
  const buttonSize = compact ? "sm" : "default";
  
  // Crear matriz con la disposición de botones
  const buttonRows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    [allowNegative ? '-' : '', '0', allowDecimal ? '.' : '']
  ];
  
  return (
    <div className={`grid grid-cols-3 gap-1 ${compact ? 'max-w-xs' : 'max-w-md'} ${className}`}>
      {buttonRows.map((row, rowIndex) => (
        <React.Fragment key={`row-${rowIndex}`}>
          {row.map((digit, colIndex) => (
            <Button
              key={`digit-${rowIndex}-${colIndex}`}
              variant="outline"
              size={buttonSize}
              className={numberButtonClass}
              disabled={disabled || digit === ''}
              onClick={() => digit && onDigitPress(digit)}
            >
              {digit}
            </Button>
          ))}
        </React.Fragment>
      ))}
      
      {/* Fila de botones de acción */}
      <Button
        variant="ghost"
        size={buttonSize}
        className={actionButtonClass}
        disabled={disabled}
        onClick={onClear}
      >
        Borrar
      </Button>
      
      <Button
        variant="ghost"
        size={buttonSize}
        className={actionButtonClass}
        disabled={disabled}
        onClick={onBackspace}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <Button
        variant="default"
        size={buttonSize}
        className={actionButtonClass}
        disabled={disabled}
        onClick={onSubmit}
      >
        <CornerDownLeft className="h-4 w-4" />
      </Button>
      
      {/* Controles de navegación (opcional) */}
      {(onMoveLeft || onMoveRight) && (
        <div className="col-span-3 flex justify-center space-x-2 mt-1">
          {onMoveLeft && (
            <Button
              variant="outline"
              size={buttonSize}
              className={actionButtonClass}
              disabled={disabled}
              onClick={onMoveLeft}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          {onMoveRight && (
            <Button
              variant="outline"
              size={buttonSize}
              className={actionButtonClass}
              disabled={disabled}
              onClick={onMoveRight}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default NumericKeypad;