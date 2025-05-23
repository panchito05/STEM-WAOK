import React from 'react';
import { Check } from 'lucide-react';

interface CheckButtonProps {
  onCheck: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

export const CheckButton: React.FC<CheckButtonProps> = ({
  onCheck,
  disabled,
  isCorrect
}) => {
  return (
    <button
      onClick={onCheck}
      disabled={disabled}
      className={`w-full mb-2 py-3 px-4 rounded-md text-white font-medium text-base
        ${disabled 
          ? 'bg-gray-300 cursor-not-allowed' 
          : isCorrect === null 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : isCorrect 
              ? 'bg-green-600' 
              : 'bg-red-600'}`}
    >
      {isCorrect === null ? (
        <>Comprobar</>
      ) : isCorrect ? (
        <>¡Correcto! <Check className="ml-1 h-5 w-5 inline" /></>
      ) : (
        <>Incorrecto</>
      )}
    </button>
  );
};

export default CheckButton;