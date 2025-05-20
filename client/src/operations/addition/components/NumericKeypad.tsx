// NumericKeypad.tsx - Teclado numérico para ingresar respuestas
import React from 'react';
import { Button } from '@/components/ui/button';
import { Backspace } from 'lucide-react';

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

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onNumberClick,
  onBackspaceClick,
  onClearClick,
  onCheckClick,
  disabled = false,
  showCheckButton = true,
  answerMaxDigits = 5,
  currentAnswer
}) => {
  // Determinar si el usuario ha alcanzado el máximo de dígitos permitidos
  const isMaxDigitsReached = currentAnswer.length >= answerMaxDigits;
  
  return (
    <div className="numeric-keypad mt-4">
      <div className="grid grid-cols-3 gap-2">
        {/* Números 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            className="h-14 text-xl font-bold"
            onClick={() => onNumberClick(num.toString())}
            disabled={disabled || isMaxDigitsReached}
          >
            {num}
          </Button>
        ))}
        
        {/* Botón Borrar Todo (C) */}
        <Button
          variant="outline"
          size="lg"
          className="h-14 text-xl font-bold bg-red-50 text-red-700 hover:bg-red-100"
          onClick={onClearClick}
          disabled={disabled}
        >
          C
        </Button>
        
        {/* Botón 0 */}
        <Button
          variant="outline"
          size="lg"
          className="h-14 text-xl font-bold"
          onClick={() => onNumberClick('0')}
          disabled={disabled || isMaxDigitsReached}
        >
          0
        </Button>
        
        {/* Botón Borrar (Backspace) */}
        <Button
          variant="outline"
          size="lg"
          className="h-14 flex items-center justify-center"
          onClick={onBackspaceClick}
          disabled={disabled || currentAnswer.length === 0}
        >
          <Backspace className="h-6 w-6" />
        </Button>
        
        {/* Botón Verificar (opcional) */}
        {showCheckButton && (
          <Button
            variant="default"
            size="lg"
            className="h-14 mt-2 text-lg font-medium col-span-3 bg-green-600 hover:bg-green-700"
            onClick={onCheckClick}
            disabled={disabled || currentAnswer.length === 0}
          >
            Verificar
          </Button>
        )}
      </div>
    </div>
  );
};

export default NumericKeypad;