import React, { useMemo } from 'react';
import { Trash, CheckCircle, AlertCircle } from 'lucide-react';
import { InputValidator } from './utils/ValidationUtils';

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isDisabled?: boolean;
  showValidation?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  value,
  onChange,
  onClear,
  isDisabled = false,
  showValidation = true
}) => {
  // Validación en tiempo real
  const validation = useMemo(() => {
    if (!value.trim()) return null;
    return InputValidator.validateNumericInput(value);
  }, [value]);

  // Determinar estado visual
  const getInputState = () => {
    if (isDisabled) return 'disabled';
    if (!value.trim()) return 'empty';
    if (validation?.isValid) return 'valid';
    return 'invalid';
  };

  const inputState = getInputState();

  // Estilos mejorados basados en estado
  const getInputStyles = () => {
    const baseStyles = "flex-1 border rounded p-2 text-lg text-center min-h-[40px] transition-all duration-200";
    
    switch (inputState) {
      case 'disabled':
        return `${baseStyles} bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed`;
      case 'valid':
        return `${baseStyles} bg-green-50 border-green-300 text-green-900 focus:border-green-500`;
      case 'invalid':
        return `${baseStyles} bg-red-50 border-red-300 text-red-900 focus:border-red-500`;
      case 'empty':
      default:
        return `${baseStyles} bg-white border-gray-300 text-gray-900 focus:border-blue-500`;
    }
  };

  return (
    <div className="mb-2">
      <div className="flex items-center mb-1">
        <div className="font-medium mr-2">Respuesta:</div>
        {showValidation && validation?.isValid && (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
        {showValidation && validation && !validation.isValid && (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
      </div>
      
      <div className="flex">
        <div className={getInputStyles()}>
          {value || (
            <span className="text-gray-400 italic">
              {isDisabled ? 'Esperando...' : 'Escribe tu respuesta'}
            </span>
          )}
        </div>
        
        <button
          onClick={onClear}
          disabled={isDisabled || !value.trim()}
          className="ml-2 p-2 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Borrar respuesta"
          aria-label="Limpiar campo de respuesta"
        >
          <Trash className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      
      {/* Mensaje de validación */}
      {showValidation && validation && !validation.isValid && (
        <div className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {validation.error}
        </div>
      )}
      
      {/* Indicador de valor válido */}
      {showValidation && validation?.isValid && validation.value !== null && (
        <div className="mt-1 text-sm text-green-600 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Valor: {InputValidator.formatNumber(validation.value)}
        </div>
      )}
    </div>
  );
};

export default AnswerInput;