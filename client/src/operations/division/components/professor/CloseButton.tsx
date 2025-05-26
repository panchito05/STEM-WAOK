import React from 'react';
import { X } from 'lucide-react';

interface CloseButtonProps {
  onClose: () => void;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onClose }) => {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 left-1/2 transform -translate-x-1/2 p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors z-50"
      aria-label="Cerrar modo profesor"
      style={{zIndex: 9999}}
    >
      <X className="h-3 w-3 text-white" />
    </button>
  );
};

export default CloseButton;