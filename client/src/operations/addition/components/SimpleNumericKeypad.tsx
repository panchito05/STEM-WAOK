import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface SimpleNumericKeypadProps {
  onNumberClick: (value: number | string) => void;
  onBackspaceClick: () => void;
  onDotClick: () => void;
  hideArrows?: boolean;
}

/**
 * Versión simplificada del teclado numérico específicamente para modo profesor
 */
export const NumericKeypad: React.FC<SimpleNumericKeypadProps> = (props) => {
  const { onNumberClick, onBackspaceClick, onDotClick, hideArrows = false } = props;
  
  // Clase común para todos los botones numéricos en modo oscuro
  const darkButtonClass = "h-10 text-base font-medium dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600";
  
  return (
    <div className="grid grid-cols-3 gap-1 max-w-[240px] mx-auto">
      {/* Fila 1 */}
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(1)}
      >
        1
      </Button>
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(2)}
      >
        2
      </Button>
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(3)}
      >
        3
      </Button>
      
      {/* Fila 2 */}
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(4)}
      >
        4
      </Button>
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(5)}
      >
        5
      </Button>
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(6)}
      >
        6
      </Button>
      
      {/* Fila 3 */}
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(7)}
      >
        7
      </Button>
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(8)}
      >
        8
      </Button>
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(9)}
      >
        9
      </Button>
      
      {/* Fila 4 */}
      {hideArrows ? (
        <Button
          variant="outline"
          className={darkButtonClass}
          onClick={onDotClick}
        >
          .
        </Button>
      ) : (
        <Button
          variant="outline"
          className="h-10 text-base font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
        >
          <span className="text-xl font-bold">&gt;</span>
        </Button>
      )}
      <Button
        variant="outline"
        className={darkButtonClass}
        onClick={() => onNumberClick(0)}
      >
        0
      </Button>
      {hideArrows ? (
        <Button
          variant="outline"
          className="h-10 text-base font-medium bg-red-50 hover:bg-red-100 dark:bg-red-800 dark:text-white dark:hover:bg-red-700 dark:border-red-700"
          onClick={onBackspaceClick}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          className={darkButtonClass}
          onClick={onBackspaceClick}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default NumericKeypad;