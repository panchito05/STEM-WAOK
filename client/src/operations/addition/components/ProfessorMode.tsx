import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProfessorModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfessorMode: React.FC<ProfessorModeProps> = ({ isOpen, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Manejar tecla escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Si está abierto, bloquear el scroll del body
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Si no está abierto, no renderizamos
  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Botón de cerrar en la esquina superior derecha */}
      <div className="p-4 w-full flex justify-end">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Cerrar modo profesor"
        >
          <X className="h-8 w-8 text-gray-800" />
        </button>
      </div>
      
      {/* Área de trabajo en blanco (ocupa todo el espacio restante) */}
      <div className="flex-grow w-full h-full">
        {/* Aquí puede ir contenido adicional del modo profesor en el futuro */}
      </div>
    </div>
  );
};