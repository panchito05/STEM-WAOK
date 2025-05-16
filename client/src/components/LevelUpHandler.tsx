import React, { useEffect, useState } from 'react';
import eventBus, { on, off } from '../lib/eventBus';
import LevelUpModal from './LevelUpModal';

// Declaramos que window puede tener una propiedad levelUpCallback
declare global {
  interface Window {
    levelUpCallback?: (() => void) | null | undefined;
  }
}

/**
 * Componente que escucha eventos de subida de nivel y muestra el modal
 * Es completamente independiente y puede colocarse en cualquier parte de la aplicación
 */
const LevelUpHandler: React.FC = () => {
  // Estado para controlar la visibilidad del modal (siempre false en esta versión)
  const [showModal, setShowModal] = useState(false);
  
  // Estado para almacenar información sobre la subida de nivel
  const [levelInfo, setLevelInfo] = useState({
    previousLevel: '',
    newLevel: '',
  });
  
  // Función que ejecuta los callbacks necesarios después de un nivel superado
  const handleCallbacks = () => {
    console.log('[LEVEL UP HANDLER] Ejecutando callbacks después de nivel superado');
    
    // Verificar si existe el callback especial registrado en window
    if (typeof window.levelUpCallback === 'function') {
      console.log('[LEVEL UP HANDLER] Ejecutando callback especial registrado');
      
      // Llamamos directamente al callback
      window.levelUpCallback();
      
      // Limpiamos el callback después de usarlo para evitar duplicidades
      window.levelUpCallback = undefined;
    } else {
      console.log('[LEVEL UP HANDLER] No se encontró callback especial, usando método alternativo');
      
      // Usar eventBus como método de respaldo
      eventBus.emit('levelUpModalClosed', { unblockAutoAdvance: true });
      
      // Mantener el CustomEvent para compatibilidad con código existente
      const event = new CustomEvent('levelUpModalClosed', {
        detail: { stayOnCurrentProblem: true }
      });
      document.dispatchEvent(event);
    }
  };
  
  // Manejar el cierre "directo" del modal (sin mostrarlo)
  const handleAutoClose = () => {
    console.log('[LEVEL UP HANDLER] Omitiendo mostrar el modal de nivel superado - procesando evento directamente');
    handleCallbacks();
  };
  
  // Manejar el cierre manual del modal (en caso de que se mostrara)
  const handleCloseModal = () => {
    document.body.classList.remove('overflow-hidden');
    setShowModal(false);
    handleCallbacks();
  };
  
  // Escuchar eventos de levelUp
  useEffect(() => {
    // Definir manejador de evento
    const handleLevelUp = (data: { previousLevel: string; newLevel: string }) => {
      console.log('[LEVEL UP HANDLER] Evento de nivel superado recibido:', data);
      
      // Guardar información del nivel por si acaso
      setLevelInfo({
        previousLevel: data.previousLevel,
        newLevel: data.newLevel,
      });
      
      // En lugar de mostrar el modal, ejecutamos directamente los callbacks
      handleAutoClose();
    };
    
    // Registrar el manejador de evento
    on('levelUp', handleLevelUp);
    
    // Limpiar al desmontar
    return () => {
      off('levelUp', handleLevelUp);
    };
  }, []);
  
  // Renderizar el modal (nunca se mostrará pero lo mantenemos para compatibilidad)
  return (
    <LevelUpModal
      isOpen={showModal}
      previousLevel={levelInfo.previousLevel}
      newLevel={levelInfo.newLevel}
      onClose={handleCloseModal}
    />
  );
};

export default LevelUpHandler;