import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import confetti from 'canvas-confetti';
// Importar traducciones directamente para evitar problemas de contexto
import { translations } from '@/utils/translations';

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
  const hasPlayedAnimation = useRef(false);
  
  // Traducciones estáticas para simplificar
  const t = (key: string): string => {
    if (key === 'levelUp.previousLevel') return 'Nivel Anterior';
    if (key === 'levelUp.newLevel') return 'Nuevo Nivel';
    if (key === 'levelUp.adaptiveDifficultyEnabled') return 'La dificultad adaptativa está activada. Tu nivel cambiará según tu desempeño.';
    if (key === 'levelUp.continue') return 'Continuar';
    if (key === 'difficulty.beginner') return 'Principiante';
    if (key === 'difficulty.elementary') return 'Elemental';
    if (key === 'difficulty.intermediate') return 'Intermedio';
    if (key === 'difficulty.advanced') return 'Avanzado';
    if (key === 'difficulty.expert') return 'Experto';
    return key;
  };
  
  // Función para disparar la animación de confeti
  const triggerConfetti = () => {
    if (typeof window === 'undefined' || !confetti) return;
    
    // Explosión principal (centro)
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 }
    });
    
    // Explosiones adicionales con retraso (izquierda y derecha)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.65 }
      });
    }, 250);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.65 }
      });
    }, 400);
  };
  
  // Ejecutar animación cuando se abre el modal
  useEffect(() => {
    if (isOpen && !hasPlayedAnimation.current) {
      triggerConfetti();
      hasPlayedAnimation.current = true;
    }
    
    if (!isOpen) {
      hasPlayedAnimation.current = false;
    }
  }, [isOpen]);
  
  // Obtener la traducción del nivel actual y anterior
  const getPreviousLevelName = () => {
    const levelKey = `difficulty.${previousLevel}`;
    return t(levelKey) || previousLevel;
  };
  
  const getNewLevelName = () => {
    const levelKey = `difficulty.${newLevel}`;
    return t(levelKey) || newLevel;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            ¡NIVEL SUPERADO!
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className="text-center">
            <p className="text-lg mb-4">
              ¡Has completado 10 respuestas correctas consecutivas y has avanzado de nivel!
            </p>
            
            <div className="flex items-center justify-center space-x-3 mt-6">
              <div className="text-center p-3 border rounded bg-gray-100 opacity-60">
                <p className="text-sm uppercase font-semibold text-gray-500">
                  {t('levelUp.previousLevel')}
                </p>
                <p className="text-xl font-bold">
                  {getPreviousLevelName()}
                </p>
              </div>
              
              <div className="text-4xl font-bold text-green-500">→</div>
              
              <div className="text-center p-3 border-2 border-green-500 rounded bg-green-50 shadow-md transform scale-110">
                <p className="text-sm uppercase font-semibold text-green-600">
                  {t('levelUp.newLevel')}
                </p>
                <p className="text-xl font-bold">
                  {getNewLevelName()}
                </p>
              </div>
            </div>
            
            <p className="mt-6 text-sm text-gray-600">
              {t('levelUp.adaptiveDifficultyEnabled')}
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={onClose}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {t('levelUp.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelUpModal;