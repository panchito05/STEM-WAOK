import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import ProblemReplayViewer from './ProblemReplayViewer';
import { format, parseISO } from 'date-fns';

interface ExerciseDetailsModalProps {
  exercise: any;
  isOpen: boolean;
  onClose: () => void;
}

const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({ 
  exercise, 
  isOpen,
  onClose
}) => {
  const [problems, setProblems] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !exercise) return;
    
    // Buscar los problemas disponibles
    const findProblems = () => {
      let foundProblems: any[] = [];
      
      if (exercise.extra_data) {
        // Orden de búsqueda de problemas (de mayor a menor prioridad)
        const searchPaths = [
          'uiProblems',
          'exactProblems',
          'capturedProblems',
          'problemReview',
          'screenshot.problemReview',
          'screenshot.exactProblems',
          'problemDetails'
        ];
        
        for (const path of searchPaths) {
          const parts = path.split('.');
          let data = exercise.extra_data;
          
          for (const part of parts) {
            if (data && data[part]) {
              data = data[part];
            } else {
              data = null;
              break;
            }
          }
          
          if (data && Array.isArray(data) && data.length > 0) {
            console.log(`✅ Encontrados problemas en extra_data.${path}`);
            foundProblems = data;
            break;
          }
        }
      }
      
      // Si no se encontraron problemas, crear un placeholder
      if (foundProblems.length === 0) {
        console.log("⚠️ No se encontraron problemas en ninguna estructura conocida");
        const operationName = 
          exercise.operationId === 'addition' ? 'Suma' : 
          exercise.operationId === 'fractions' ? 'Fracciones' :
          exercise.operationId === 'counting' ? 'Conteo' : 'Matemáticas';
        
        foundProblems = [{
          isPlaceholder: true,
          problem: `Ejercicio de ${operationName}`,
          info: `${exercise.score}/${exercise.totalProblems} correctos`
        }];
      }
      
      setProblems(foundProblems);
    };
    
    findProblems();
  }, [isOpen, exercise]);
  
  if (!exercise) return null;
  
  // Formatear la fecha con hora
  const formattedDate = exercise.date ? 
    format(parseISO(exercise.date), "dd MMM yyyy HH:mm:ss") : 
    "Fecha desconocida";
  
  // Mapear dificultad a texto en español
  const difficultyLabels: Record<string, string> = {
    'beginner': 'Principiante',
    'elementary': 'Elemental',
    'intermediate': 'Intermedio',
    'advanced': 'Avanzado',
    'expert': 'Experto'
  };
  
  // Formatear nombre de operación
  const operationLabels: Record<string, string> = {
    'addition': 'Suma',
    'fractions': 'Fracciones',
    'counting': 'Conteo',
    'subtraction': 'Resta',
    'multiplication': 'Multiplicación',
    'division': 'División'
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Detalles del Ejercicio</DialogTitle>
          <DialogDescription>
            {operationLabels[exercise.operationId] || exercise.operationId} - {formattedDate}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Resumen del ejercicio */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-md text-center">
              <p className="text-sm text-blue-700">Puntuación</p>
              <p className="text-xl font-bold text-blue-900">{exercise.score}/{exercise.totalProblems}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md text-center">
              <p className="text-sm text-green-700">Precisión</p>
              <p className="text-xl font-bold text-green-900">
                {Math.round((exercise.score / exercise.totalProblems) * 100)}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-md text-center">
              <p className="text-sm text-purple-700">Tiempo</p>
              <p className="text-xl font-bold text-purple-900">{exercise.timeSpent}s</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-md text-center">
              <p className="text-sm text-amber-700">Nivel</p>
              <p className="text-xl font-bold text-amber-900">
                {difficultyLabels[exercise.difficulty] || exercise.difficulty}
              </p>
            </div>
          </div>
          
          {/* DOM Snapshot Viewer */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Revisión de Problemas</h3>
            
            <ProblemReplayViewer 
              exercise={exercise} 
              fallbackContent={
                <div className="space-y-3 mt-4">
                  {problems.map((problem, idx) => {
                    // Determinar si el problema es correcto
                    const isCorrect = 
                      problem.isCorrect !== undefined ? problem.isCorrect :
                      problem.status === 'correct';
                    
                    // Formatear el texto del problema
                    let problemText = '';
                    if (typeof problem.problem === 'string') {
                      problemText = problem.problem;
                    } else if (problem.problem && problem.problem.operands) {
                      problemText = problem.problem.operands.join(' + ') + ' = ' + problem.problem.correctAnswer;
                    } else if (problem.text) {
                      problemText = problem.text;
                    } else {
                      problemText = `Problema ${idx + 1}`;
                    }
                    
                    // Si es un placeholder
                    if (problem.isPlaceholder) {
                      return (
                        <div key={idx} className="bg-gray-50 p-3 rounded-md">
                          <p className="text-center text-gray-500 italic">
                            {problemText}
                          </p>
                          <p className="text-xs text-center text-gray-400 mt-1">
                            Los detalles completos no se guardaron para este ejercicio anterior
                          </p>
                        </div>
                      );
                    }
                    
                    // Para problemas normales
                    return (
                      <div key={idx} className={`${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} p-3 rounded-md flex items-start`}>
                        <div className="flex-grow">
                          <div className="font-medium">
                            (#{idx + 1}) {problemText}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {problem.info || `${problem.level ? `Lvl: ${problem.level}, ` : ''}${problem.attempts ? `Att: ${problem.attempts}, ` : ''}${problem.timeSpent ? `T: ${problem.timeSpent}s` : ''}`}
                          </div>
                        </div>
                        <div className="ml-4">
                          {isCorrect ? (
                            <div className="text-green-600">✓</div>
                          ) : (
                            <div className="text-red-600">✗</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            />
          </div>
          
          {/* Datos adicionales */}
          {exercise.extra_data && (
            <div className="text-xs text-gray-500 mt-4">
              <details>
                <summary className="cursor-pointer">Datos técnicos</summary>
                <div className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40">
                  <pre className="whitespace-pre-wrap break-all">
                    ID: {exercise.id}
                    Fecha ISO: {exercise.date}
                    Operación: {exercise.operationId}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseDetailsModal;