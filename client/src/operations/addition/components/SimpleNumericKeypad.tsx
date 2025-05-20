import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface SimpleNumericKeypadProps {
  onNumberClick: (value: number | string) => void;
  onBackspaceClick: () => void;
  onDotClick: () => void;
  hideArrows?: boolean;
  darkMode?: boolean;
}

/**
 * Versión simplificada del teclado numérico específicamente para modo profesor
 */
export const NumericKeypad: React.FC<SimpleNumericKeypadProps> = (props) => {
  const { onNumberClick, onBackspaceClick, onDotClick, hideArrows = false, darkMode = false } = props;
  
  // Clases de estilo para los botones que cambian según el modo
  const buttonClass = darkMode
    ? "h-10 text-base font-medium border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
    : "h-10 text-base font-medium";
    
  // Clase para el botón de borrar
  const backspaceClass = darkMode
    ? "h-10 text-base font-medium bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
    : "h-10 text-base font-medium bg-red-50 hover:bg-red-100";
    
  return (
    <div className="grid grid-cols-3 gap-1 max-w-[240px] mx-auto">
      {/* Fila 1 */}
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(1)}
      >
        1
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(2)}
      >
        2
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(3)}
      >
        3
      </Button>
      
      {/* Fila 2 */}
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(4)}
      >
        4
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(5)}
      >
        5
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(6)}
      >
        6
      </Button>
      
      {/* Fila 3 */}
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(7)}
      >
        7
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(8)}
      >
        8
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(9)}
      >
        9
      </Button>
      
      {/* Fila 4 */}
      {hideArrows ? (
        <Button
          variant="outline"
          className={buttonClass}
          onClick={onDotClick}
        >
          .
        </Button>
      ) : (
        <Button
          variant="outline"
          className={darkMode 
            ? "h-10 text-base font-medium bg-gray-700 text-blue-400 hover:bg-gray-600 border-gray-600" 
            : "h-10 text-base font-medium bg-red-50 text-red-600 hover:bg-red-100"
          }
        >
          <span className="text-xl font-bold">&gt;</span>
        </Button>
      )}
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => onNumberClick(0)}
      >
        0
      </Button>
      {hideArrows ? (
        <Button
          variant="outline"
          className={backspaceClass}
          onClick={onBackspaceClick}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          className={buttonClass}
          onClick={onBackspaceClick}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default NumericKeypad;