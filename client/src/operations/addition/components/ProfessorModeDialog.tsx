import React from 'react';
import { X } from 'lucide-react';

interface ProfessorModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfessorModeDialog({ isOpen, onClose }: ProfessorModeDialogProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col p-6 overflow-auto">
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Cerrar modo profesor"
        >
          <X className="h-8 w-8 text-gray-800" />
        </button>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        <div className="text-center text-gray-600 w-full">
          <h2 className="text-3xl font-bold mb-6">Modo Profesor</h2>
          <p className="text-xl mb-8">Utilice este espacio en blanco para explicar conceptos matemáticos a sus estudiantes</p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 w-full mb-6 min-h-[200px] flex items-center justify-center">
            <p className="text-gray-500 italic">Área para dibujar o escribir explicaciones</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-700 mb-2">Beneficios del modo profesor</h3>
              <ul className="text-left text-sm text-gray-700 space-y-2">
                <li>• Explicar paso a paso problemas complejos</li>
                <li>• Visualizar conceptos matemáticos</li>
                <li>• Pantalla completa para mejor visibilidad</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-700 mb-2">Consejos de uso</h3>
              <ul className="text-left text-sm text-gray-700 space-y-2">
                <li>• Dibuje en una pizarra física mientras muestra esta pantalla</li>
                <li>• Use para sesiones de preguntas y respuestas</li>
                <li>• Explique métodos alternativos de resolución</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}