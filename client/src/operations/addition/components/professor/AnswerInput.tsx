import React from 'react';
import { Trash } from 'lucide-react';

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  value,
  onChange,
  onClear
}) => {
  return (
    <div className="flex items-center mb-2">
      <div className="font-medium mr-2">Respuesta:</div>
      <div className="flex-1 flex">
        <div className="flex-1 bg-white border border-gray-300 rounded p-2 text-lg text-center min-h-[40px]">
          {value}
        </div>
        <button
          onClick={onClear}
          className="ml-2 p-2 rounded bg-white border border-gray-200 hover:bg-gray-100"
          title="Borrar respuesta"
        >
          <Trash className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default AnswerInput;