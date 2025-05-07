import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
  isOpen: boolean;
  previousLevel: string;
  newLevel: string;
  onClose: () => void;
}

/**
 * Componente independiente que maneja exclusivamente la notificación de subida de nivel
 * Completamente separado de la lógica del ejercicio
 */
const LevelUpModal: React.FC<LevelUpModalProps> = ({ 
  isOpen, 
  previousLevel, 
  newLevel,
  onClose 
}) => {
  const [showModal, setShowModal] = useState(false);
  
  // Efecto para manejar la animación de entrada
  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      
      // Lanzar confetti cuando se muestra el modal
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Lanzar confetti desde diferentes ángulos
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Manejar el cierre del modal
  const handleClose = () => {
    setShowModal(false);
    // Pequeño retraso para permitir la animación de salida
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 transition-opacity duration-300 ${
        showModal ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => {
        // Solo cerrar si se hace clic fuera del modal
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className={`bg-blue-100 rounded-3xl p-8 shadow-2xl text-center transform transition-all duration-300 max-w-md w-full border-4 border-indigo-300 ${
          showModal ? 'scale-100' : 'scale-95'
        }`}
      >
        <h3 className="text-5xl font-bold text-indigo-600 mb-6">¡NIVEL SUPERADO!</h3>
        
        <div className="flex justify-center mb-6">
          <Trophy 
            className="h-32 w-32 text-indigo-500 drop-shadow-xl animate-bounce" 
            fill="#818cf8"
            strokeWidth={1}
          />
        </div>
   
        <p className="text-2xl font-medium text-indigo-800 mb-2">
          ¡Has demostrado excelentes habilidades matemáticas!
        </p>
        <p className="text-xl font-medium mb-8 text-indigo-700">
          Has avanzado al siguiente nivel de dificultad
        </p>
        
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-xl"
          onClick={handleClose}
        >
          ¡Continuar el Desafío!
        </Button>
      </div>
    </div>
  );
};

export default LevelUpModal;