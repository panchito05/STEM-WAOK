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
      <DialogContent className="w-full h-[95vh] max-w-[90vw] p-0 bg-white overflow-hidden">
        <div className="fixed top-2 right-2 z-50">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Cerrar modo profesor"
          >
            <X className="h-8 w-8 text-gray-800" />
          </button>
        </div>
        
        <div className="w-full h-full bg-white p-4">
          {/* Área de trabajo en blanco del profesor */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-bold mb-4">Modo Profesor</h2>
              <p className="text-lg">Utilice este espacio en blanco para explicar conceptos matemáticos</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}