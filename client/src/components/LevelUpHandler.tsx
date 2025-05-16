import React, { useEffect, useState } from 'react';
import eventBus, { on, off } from '../lib/eventBus';
import LevelUpModal from './LevelUpModal';

/**
 * Componente que escucha eventos de subida de nivel y muestra el modal
 * Es completamente independiente y puede colocarse en cualquier parte de la aplicación
 */
const LevelUpHandler: React.FC = () => {
  // Estado para controlar la visibilidad del modal
  const [showModal, setShowModal] = useState(false);
  // Estado para almacenar información sobre la subida de nivel
  const [levelInfo, setLevelInfo] = useState({
    previousLevel: '',
    newLevel: '',
  });
  
  // Escuchar eventos de levelUp
  useEffect(() => {
    // Definir manejador de evento
    const handleLevelUp = (data: { previousLevel: string; newLevel: string }) => {
      console.log('[LEVEL UP HANDLER] Evento de nivel superado recibido:', data);
      
      // Bloquear cualquier otra operación
      document.body.classList.add('overflow-hidden');
      
      // Guardar información del nivel
      setLevelInfo({
        previousLevel: data.previousLevel,
        newLevel: data.newLevel,
      });
      
      // Mostrar el modal
      setShowModal(true);
    };
    
    // Registrar el manejador de evento
    on('levelUp', handleLevelUp);
    
    // Limpiar al desmontar
    return () => {
      off('levelUp', handleLevelUp);
    };
  }, []);
  
  // Manejar el cierre del modal
  const handleCloseModal = () => {
    // Desbloquear otras operaciones
    document.body.classList.remove('overflow-hidden');
    
    // Ocultar el modal
    setShowModal(false);
    
    console.log('[LEVEL UP HANDLER] Modal cerrado por el usuario - ejecutando callback especial');
    
    // MÉTODO RADICAL Y DIRECTO:
    // 1. Verificar si existe el callback especial registrado en window
    // Este callback habrá sido registrado por el componente Exercise.tsx
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
  
  // Renderizar el modal cuando sea necesario
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