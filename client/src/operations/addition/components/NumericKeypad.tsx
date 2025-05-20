// NumericKeypad.tsx - Teclado numérico para el ingreso de respuestas
import React from 'react';
import { Button } from '@/components/ui/button';
import { Backspace, ArrowRight } from 'lucide-react';

interface NumericKeypadProps {
  onNumberClick: (value: string | number) => void;
  onEnterClick: () => void;
  disabled?: boolean;
  answer: string;
  allowDecimals?: boolean;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ 
  onNumberClick, 
  onEnterClick, 
  disabled = false,
  answer,
  allowDecimals = false
}) => {
  // Manejar clic en número
  const handleNumberClick = (num: number | string) => {
    if (disabled) return;
    
    if (num === 'clear') {
      onNumberClick('');
      return;
    }
    
    if (num === 'backspace') {
      if (answer.length > 0) {
        onNumberClick(answer.slice(0, -1));
      }
      return;
    }
    
    // Evitar múltiples puntos decimales
    if (num === '.' && (answer.includes('.') || !allowDecimals)) {
      return;
    }
    
    // Limitar longitud a 10 caracteres para evitar desbordamientos
    if (answer.length >= 10) {
      return;
    }
    
    // No permitir cero inicial seguido de otro dígito (excepto después del punto decimal)
    if (answer === '0' && num !== '.') {
      onNumberClick(num.toString());
    } else {
      onNumberClick(answer + num.toString());
    }
  };
  
  return (
    <div className="numeric-keypad">
      <div className="grid grid-cols-3 gap-2">
        {/* Números 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-14 text-xl"
            onClick={() => handleNumberClick(num)}
            disabled={disabled}
          >
            {num}
          </Button>
        ))}
        
        {/* Botón de punto decimal */}
        <Button
          variant="outline"
          className="h-14 text-xl"
          onClick={() => handleNumberClick('.')}
          disabled={disabled || !allowDecimals}
        >
          .
        </Button>
        
        {/* Número 0 */}
        <Button
          variant="outline"
          className="h-14 text-xl"
          onClick={() => handleNumberClick(0)}
          disabled={disabled}
        >
          0
        </Button>
        
        {/* Botón de borrar */}
        <Button
          variant="outline"
          className="h-14"
          onClick={() => handleNumberClick('backspace')}
          disabled={disabled}
        >
          <Backspace className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Fila adicional para acciones */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Button
          variant="secondary"
          className="h-14"
          onClick={() => handleNumberClick('clear')}
          disabled={disabled}
        >
          Borrar
        </Button>
        
        <Button
          variant="default"
          className="h-14"
          onClick={onEnterClick}
          disabled={disabled || answer === ''}
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          Enviar
        </Button>
      </div>
    </div>
  );
};

export default NumericKeypad;