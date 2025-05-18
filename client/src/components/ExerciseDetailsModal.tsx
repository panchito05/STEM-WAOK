import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findDOMSnapshotsByDate, renderDOMSnapshot } from '@/services/DOMCapture';

interface ExerciseDetailsModalProps {
  exercise: any;
  isOpen: boolean;
  onClose: () => void;
}

const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({ exercise, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [snapshotFound, setSnapshotFound] = useState(false);
  
  useEffect(() => {
    if (isOpen && exercise) {
      setLoading(true);
      
      try {
        // Intentar encontrar un snapshot para este ejercicio por fecha
        if (exercise.date) {
          const exerciseDate = new Date(exercise.date).toISOString().split('T')[0];
          const snapshotKeys = findDOMSnapshotsByDate(exerciseDate, exercise.operationId);
          
          if (snapshotKeys && snapshotKeys.length > 0) {
            // Encontrar el contenedor donde vamos a renderizar
            const container = document.getElementById('snapshot-container');
            if (container) {
              // Renderizar el primer snapshot encontrado (idealmente el más reciente)
              const rendered = renderDOMSnapshot(snapshotKeys[0], container);
              setSnapshotFound(rendered);
            }
          } else {
            console.log("No se encontraron snapshots para esta fecha:", exerciseDate);
            setSnapshotFound(false);
          }
        }
      } catch (error) {
        console.error("Error buscando snapshots:", error);
        setSnapshotFound(false);
      }
      
      setLoading(false);
    }
  }, [isOpen, exercise]);
  
  if (!exercise) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[90%]">
        <DialogHeader>
          <DialogTitle>Detalles del Ejercicio</DialogTitle>
          <DialogDescription>
            Completado el {new Date(exercise.date).toLocaleString('es-ES')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
            <div>
              <span className="font-semibold">Operación:</span> {exercise.operationId}
            </div>
            <div>
              <span className="font-semibold">Nivel:</span> {exercise.difficulty}
            </div>
            <div>
              <span className="font-semibold">Puntuación:</span> {exercise.score}/{exercise.totalProblems}
            </div>
            <div>
              <span className="font-semibold">Tiempo total:</span> {Math.round(exercise.timeSpent)} segundos
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900">
            <h3 className="text-lg font-semibold mb-2">Problemas Resueltos</h3>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : snapshotFound ? (
              <div id="snapshot-container" className="problems-container"></div>
            ) : (
              <div>
                {exercise.extra_data && exercise.extra_data.exactProblems ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exercise.extra_data.exactProblems.map((problem: any, index: number) => (
                      <div key={index} className="border p-3 rounded bg-white dark:bg-slate-800">
                        <div className="text-lg font-mono">
                          {problem.problem}
                        </div>
                        <div className="mt-2 text-sm">
                          <span className={problem.isCorrect ? "text-green-600" : "text-red-600"}>
                            {problem.isCorrect ? "✓ Correcto" : "✗ Incorrecto"}
                          </span>
                          <div className="text-slate-500 mt-1">
                            {problem.info}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-500">
                    No se encontraron detalles específicos para este ejercicio.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseDetailsModal;