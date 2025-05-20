import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Delete } from 'lucide-react';
import { NumericKeypadProps } from '../types';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Teclado numérico para ingresar respuestas a problemas
 */
const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onNumberClick,
  onSubmit,
  disabled = false,
  answer,
  allowDecimals = false
}) => {
  const { t } = useTranslation();
  
  const handleNumberClick = (value: string | number) => {
    if (disabled) return;
    
    // Si es borrar, eliminar el último carácter
    if (value === 'backspace') {
      const currentAnswer = answer.toString();
      if (currentAnswer.length > 0) {
        onNumberClick(currentAnswer.slice(0, -1));
      }
      return;
    }
    
    // Si es decimal, verificar si ya existe un punto
    if (value === '.' && allowDecimals) {
      const currentAnswer = answer.toString();
      if (currentAnswer.includes('.')) {
        return; // No agregar otro punto decimal
      }
    }
    
    // Evitar agregar decimal si no está permitido
    if (value === '.' && !allowDecimals) {
      return;
    }
    
    // Limitar la longitud de la respuesta (prevenir desbordamiento)
    const currentAnswer = answer.toString();
    if (currentAnswer.length >= 12) {
      return;
    }
    
    // Agregar el número a la respuesta actual
    const newAnswer = currentAnswer === '0' ? value.toString() : currentAnswer + value.toString();
    onNumberClick(newAnswer);
  };
  
  const handleSubmit = () => {
    if (disabled || !onSubmit) return;
    onSubmit();
  };
  
  return (
    <Card className="p-2 shadow-md bg-white dark:bg-gray-800">
      <div className="grid grid-cols-3 gap-2">
        {/* Fila 1 */}
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(7)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          7
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(8)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          8
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(9)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          9
        </Button>
        
        {/* Fila 2 */}
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(4)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          4
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(5)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          5
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(6)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          6
        </Button>
        
        {/* Fila 3 */}
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(1)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          1
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(2)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          2
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(3)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          3
        </Button>
        
        {/* Fila 4 */}
        {allowDecimals ? (
          <Button 
            variant="outline" 
            onClick={() => handleNumberClick('.')} 
            disabled={disabled}
            className="h-14 text-xl font-bold"
          >
            .
          </Button>
        ) : (
          <Button 
            variant="outline" 
            disabled={true}
            className="h-14 text-xl font-bold opacity-50"
          >
            .
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick(0)} 
          disabled={disabled}
          className="h-14 text-xl font-bold"
        >
          0
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleNumberClick('backspace')} 
          disabled={disabled}
          className="h-14 flex items-center justify-center"
        >
          <Delete className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Botón de Enviar */}
      <Button 
        className="w-full mt-2 h-14 text-lg font-bold"
        onClick={handleSubmit}
        disabled={disabled || answer.toString().length === 0}
      >
        {t('submit', { defaultValue: 'Enviar' })}
      </Button>
    </Card>
  );
};

export default NumericKeypad;