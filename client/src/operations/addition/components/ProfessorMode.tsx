import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ProfessorModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfessorMode({ isOpen, onClose }: ProfessorModeProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      <div className="p-4 w-full flex justify-end">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Cerrar modo profesor"
        >
          <X className="h-8 w-8 text-gray-800" />
        </button>
      </div>
      
      <div className="flex-grow w-full h-full">
        {/* Contenido del modo profesor */}
      </div>
    </div>
  );
}