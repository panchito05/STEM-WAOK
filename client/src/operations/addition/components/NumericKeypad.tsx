import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CornerDownLeft } from 'lucide-react';

export interface NumericKeypadProps {
  onNumberClick: (value: string | number) => void;
  onSubmit: () => void;
  disabled?: boolean;
  answer: string | number;
  allowDecimals?: boolean;
}

/**
 * Componente para teclado numérico
 */
const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onNumberClick,
  onSubmit,
  disabled = false,
  answer = '',
  allowDecimals = false
}) => {
  // Manejar click en números
  const handleNumberClick = (value: string | number) => {
    if (disabled) return;
    
    // Si ya hay un punto decimal y se intenta agregar otro, ignorar
    if (value === '.' && String(answer).includes('.')) {
      return;
    }
    
    // Si la respuesta es 0 y se ingresa un número, reemplazar el 0
    if (answer === '0' && typeof value === 'number') {
      onNumberClick(value);
      return;
    }
    
    // Si es decimal y aún no hay un punto, agregar "0."
    if (value === '.' && answer === '') {
      onNumberClick('0.');
      return;
    }
    
    // Concatenar el valor al final
    const newValue = answer + value;
    onNumberClick(newValue);
  };
  
  // Manejar click en borrar
  const handleBackspace = () => {
    if (disabled || !answer) return;
    
    // Eliminar el último carácter
    const newValue = String(answer).slice(0, -1);
    onNumberClick(newValue);
  };
  
  // Manejar click en enviar
  const handleSubmit = () => {
    if (disabled || !answer) return;
    onSubmit();
  };
  
  return (
    <div className="w-full">
      {/* Respuesta actual */}
      <div className="text-center mb-4">
        <div className="text-2xl font-mono bg-white dark:bg-slate-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
          {answer || '0'}
        </div>
      </div>
      
      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-2">
        {/* Fila 1 */}
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(7)}
          disabled={disabled}
        >
          7
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(8)}
          disabled={disabled}
        >
          8
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(9)}
          disabled={disabled}
        >
          9
        </Button>
        
        {/* Fila 2 */}
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(4)}
          disabled={disabled}
        >
          4
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(5)}
          disabled={disabled}
        >
          5
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(6)}
          disabled={disabled}
        >
          6
        </Button>
        
        {/* Fila 3 */}
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(1)}
          disabled={disabled}
        >
          1
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(2)}
          disabled={disabled}
        >
          2
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(3)}
          disabled={disabled}
        >
          3
        </Button>
        
        {/* Fila 4 */}
        {allowDecimals ? (
          <Button
            variant="outline"
            className="h-12 text-lg font-medium"
            onClick={() => handleNumberClick('.')}
            disabled={disabled}
          >
            .
          </Button>
        ) : (
          <div></div> // Espacio vacío si no se permiten decimales
        )}
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={() => handleNumberClick(0)}
          disabled={disabled}
        >
          0
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg font-medium"
          onClick={handleBackspace}
          disabled={disabled}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Botón de enviar */}
      <Button
        className="w-full mt-3 h-12"
        onClick={handleSubmit}
        disabled={disabled || answer === ''}
      >
        <CornerDownLeft className="h-5 w-5 mr-2" />
        Enviar
      </Button>
    </div>
  );
};

export default NumericKeypad;