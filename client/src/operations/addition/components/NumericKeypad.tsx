// NumericKeypad.tsx - Teclado numérico para ingresar respuestas
import React from 'react';
import { Button } from '@/components/ui/button';

interface NumericKeypadProps {
  onNumberClick: (value: string) => void;
  onBackspaceClick: () => void;
  onSubmitClick?: () => void;
  currentAnswer: string;
  disabled?: boolean;
  showCheckButton?: boolean;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onNumberClick,
  onBackspaceClick,
  onSubmitClick,
  currentAnswer,
  disabled = false,
  showCheckButton = false
}) => {
  // Definir los botones del teclado
  const keypadButtons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '.', '<'
  ];
  
  // Gestionar el clic en los botones
  const handleButtonClick = (value: string) => {
    if (disabled) return;
    
    if (value === '<') {
      onBackspaceClick();
    } else {
      onNumberClick(value);
    }
  };
  
  // Gestionar teclas de teclado físico
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      // Permitir números, punto decimal y teclas de borrar/enter
      if (/^[0-9.]$/.test(e.key)) {
        onNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        onBackspaceClick();
      } else if (e.key === 'Enter' && onSubmitClick) {
        onSubmitClick();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNumberClick, onBackspaceClick, onSubmitClick, disabled]);
  
  return (
    <div className="numeric-keypad w-full max-w-xs mx-auto">
      {/* Cuadrícula de botones */}
      <div className="grid grid-cols-3 gap-2">
        {keypadButtons.map((btn) => (
          <Button
            key={btn}
            type="button"
            variant={btn === '<' ? "outline" : "secondary"}
            size="lg"
            className={`h-12 font-bold ${disabled ? 'opacity-50' : ''}`}
            onClick={() => handleButtonClick(btn)}
            disabled={disabled}
          >
            {btn === '<' ? (
              <span className="text-lg">⌫</span>
            ) : (
              btn
            )}
          </Button>
        ))}
      </div>
      
      {/* Botón de enviar */}
      {onSubmitClick && (
        <Button
          type="button"
          size="lg"
          className={`w-full mt-2 h-12 ${disabled ? 'opacity-50' : ''}`}
          onClick={onSubmitClick}
          disabled={disabled || (showCheckButton && currentAnswer === '')}
        >
          {showCheckButton ? 'Comprobar' : 'Enviar'}
        </Button>
      )}
    </div>
  );
};

export default NumericKeypad;