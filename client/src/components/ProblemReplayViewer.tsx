import React, { useEffect, useRef, useState } from 'react';
import { snapshotService } from '../services/SnapshotService';

interface ProblemReplayViewerProps {
  exercise: any;
  fallbackContent?: React.ReactNode;
}

export const ProblemReplayViewer: React.FC<ProblemReplayViewerProps> = ({ 
  exercise, 
  fallbackContent 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [snapshotFound, setSnapshotFound] = useState(false);
  
  useEffect(() => {
    const loadSnapshot = async () => {
      if (!containerRef.current || !exercise) {
        setIsLoading(false);
        setHasError(true);
        return;
      }
      
      setIsLoading(true);
      setHasError(false);
      setSnapshotFound(false);
      
      try {
        let snapshotId = '';
        
        // Verificar si tenemos una referencia directa al ID del snapshot
        if (exercise.extra_data?.domSnapshot?.snapshotId) {
          snapshotId = exercise.extra_data.domSnapshot.snapshotId;
          console.log("📋 Usando ID de snapshot disponible:", snapshotId);
        } 
        // Si no, intentar buscar por fecha
        else if (exercise.date) {
          console.log("🔍 Buscando snapshot por fecha:", exercise.date);
          const foundId = await snapshotService.findSnapshotByExerciseDate(
            exercise.operationId, 
            exercise.date
          );
          
          if (foundId) {
            snapshotId = foundId;
            console.log("🔍 Encontrado snapshot por fecha:", snapshotId);
          }
        }
        
        if (snapshotId) {
          // Intentar renderizar el snapshot desde IndexedDB
          const success = await snapshotService.renderSnapshot(
            snapshotId,
            containerRef.current
          );
          
          setSnapshotFound(success);
          
          if (!success) {
            console.error("❌ No se pudo renderizar el snapshot");
            setHasError(true);
          }
        } else {
          console.error("❌ No se encontró ID de snapshot para este ejercicio");
          setHasError(true);
        }
      } catch (error) {
        console.error('❌ Error al cargar snapshot:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSnapshot();
  }, [exercise]);
  
  return (
    <div className="problem-replay-container">
      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-2 text-indigo-600">Cargando la visualización del ejercicio...</span>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className={`snapshot-container min-h-[200px] ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* El snapshot se renderizará aquí */}
      </div>
      
      {/* Mostrar error si hay problema */}
      {!isLoading && hasError && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mt-4">
          <h3 className="font-semibold text-yellow-700 mb-2">No se encontró la visualización exacta</h3>
          <p className="text-sm text-yellow-600">
            No se pudo recuperar la vista exacta de este ejercicio.
          </p>
        </div>
      )}
      
      {/* Contenido alternativo si no hay snapshot y está configurado */}
      {!isLoading && hasError && fallbackContent && (
        <div className="fallback-content mt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Datos disponibles del ejercicio:</h3>
          {fallbackContent}
        </div>
      )}
    </div>
  );
};

export default ProblemReplayViewer;