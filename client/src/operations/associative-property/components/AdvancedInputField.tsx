import React from 'react';

interface AdvancedInputFieldProps {
  fieldId: string;
  value: string;
  isActive: boolean;
  isDisabled: boolean;
  onFocus: (fieldId: string) => void;
  placeholder?: string;
  className?: string;
}

const AdvancedInputField: React.FC<AdvancedInputFieldProps> = ({
  fieldId,
  value,
  isActive,
  isDisabled,
  onFocus,
  placeholder = "?",
  className = ""
}) => {
  const handleClick = () => {
    if (!isDisabled) {
      onFocus(fieldId);
    }
  };

  return (
    <input
      type="text"
      value={value}
      readOnly
      onClick={handleClick}
      placeholder={placeholder}
      disabled={isDisabled}
      className={`
        w-16 h-10 text-center text-lg font-semibold border-2 rounded-lg
        cursor-pointer transition-all duration-200
        ${isActive 
          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-300 bg-white hover:border-gray-400'
        }
        ${isDisabled 
          ? 'cursor-not-allowed bg-gray-100 text-gray-400' 
          : 'hover:shadow-md'
        }
        ${className}
      `}
    />
  );
};

export default AdvancedInputField;