import React from 'react';
import NumericKeypad from '../SimpleNumericKeypad';

interface KeypadContainerProps {
  onNumberClick: (num: number | string) => void;
  onBackspaceClick: () => void;
  onDotClick: () => void;
}

export const KeypadContainer: React.FC<KeypadContainerProps> = ({
  onNumberClick,
  onBackspaceClick,
  onDotClick
}) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-md p-2">
      <NumericKeypad
        onNumberClick={onNumberClick}
        onBackspaceClick={onBackspaceClick}
        onDotClick={onDotClick}
        hideArrows={true}
      />
    </div>
  );
};

export default KeypadContainer;