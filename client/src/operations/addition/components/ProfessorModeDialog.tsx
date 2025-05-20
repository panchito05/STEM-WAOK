import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProfessorModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfessorModeDialog({ isOpen, onClose }: ProfessorModeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full h-[95vh] max-w-[95vw] p-0 overflow-hidden border-none">
        <div className="absolute top-2 right-2 z-50">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-md"
            aria-label="Cerrar modo profesor"
          >
            <X className="h-6 w-6 text-gray-800" />
          </button>
        </div>
        
        <div className="w-full h-full bg-white p-6">
          {/* Área de trabajo en blanco del profesor */}
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="text-center text-gray-600 max-w-2xl">
              <h2 className="text-3xl font-bold mb-6">Modo Profesor</h2>
              <p className="text-xl mb-8">Utilice este espacio en blanco para explicar conceptos matemáticos a sus estudiantes</p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 w-full mb-6">
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
      </DialogContent>
    </Dialog>
  );
}