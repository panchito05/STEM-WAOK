import React, { useEffect } from 'react';
import eventBus, { on, off } from '../lib/eventBus';

/**
 * Componente que escucha eventos de subida de nivel
 * Versión modificada que omite la visualización del modal
 */
const LevelUpHandler: React.FC = () => {
  
  // Escuchar eventos de levelUp
  useEffect(() => {
    // Definir manejador de evento
    const handleLevelUp = (data: { previousLevel: string; newLevel: string }) => {
      console.log('[LEVEL UP HANDLER] Evento de nivel superado recibido:', data);
      console.log('[LEVEL UP HANDLER] Omitiendo mostrar el modal - procesando evento directamente');
      
      // Ejecutar callbacks directamente
      if (typeof window.levelUpCallback === 'function') {
        console.log('[LEVEL UP HANDLER] Ejecutando callback especial registrado');
        window.levelUpCallback();
        window.levelUpCallback = undefined;
      } else {
        console.log('[LEVEL UP HANDLER] No se encontró callback especial, usando método alternativo');
        
        // Usar eventBus como respaldo
        eventBus.emit('levelUpModalClosed', { unblockAutoAdvance: true });
        
        // Mantener el CustomEvent para compatibilidad con código existente
        const event = new CustomEvent('levelUpModalClosed', {
          detail: { stayOnCurrentProblem: true }
        });
        document.dispatchEvent(event);
      }
    };
    
    // Registrar el manejador de evento
    on('levelUp', handleLevelUp);
    
    // Limpiar al desmontar
    return () => {
      off('levelUp', handleLevelUp);
    };
  }, []);
  
  // No renderizamos nada visible
  return null;
};

// Asegurarnos que TypeScript reconoce la propiedad levelUpCallback en window
declare global {
  interface Window {
    levelUpCallback?: (() => void) | undefined;
  }
}

export default LevelUpHandler;