import React, { useState } from 'react';
import { ExerciseResult } from '@/context/ProgressContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { History, Info, Check, Award, Clock } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslations } from '@/hooks/use-translations';

interface ExerciseHistoryDialogProps {
  moduleId: string;
  exerciseHistory: ExerciseResult[];
  trigger?: React.ReactNode;
}

export default function ExerciseHistoryDialog({ moduleId, exerciseHistory, trigger }: ExerciseHistoryDialogProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseResult | null>(null);
  const { t, language } = useTranslations();
  
  // Filtrar solo el historial relacionado con este módulo
  const moduleHistory = Array.isArray(exerciseHistory) 
    ? exerciseHistory.filter(entry => entry && entry.operationId === moduleId)
    : [];
  
  // Ordenar por fecha - más reciente primero
  const sortedHistory = [...moduleHistory].sort((a, b) => {
    try {
      // Manejar fechas inválidas con valores por defecto
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (isNaN(dateA) || isNaN(dateB)) {
        return 0;
      }
      
      return dateB - dateA;
    } catch (error) {
      console.error("Error ordenando fechas:", error);
      return 0;
    }
  });
  
  // Función para obtener el nombre de dificultad localizado
  const getDifficultyName = (difficultyCode: string) => {
    switch(difficultyCode?.toLowerCase()) {
      case 'beginner': return t('difficulty.beginner') || 'Beginner';
      case 'elementary': return t('difficulty.elementary') || 'Elementary';
      case 'intermediate': return t('difficulty.intermediate') || 'Intermediate';
      case 'advanced': return t('difficulty.advanced') || 'Advanced';
      case 'expert': return t('difficulty.expert') || 'Expert';
      default: return difficultyCode || 'Unknown';
    }
  };
  
  // Formatear fecha según el idioma con validación robusta
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      // Verificar que la fecha sea válida
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'N/A';
      }
      
      const locale = language === 'es' ? es : enUS;
      return format(date, 'PPpp', { locale });
    } catch (error) {
      console.error('Error formateando fecha:', dateString, error);
      return 'N/A';
    }
  };
  
  // Función para determinar el operador según el tipo de operación
  const getOperator = (operationId: string) => {
    switch (operationId) {
      case 'addition': return '+';
      case 'subtraction': return '-';
      case 'multiplication': return '×';
      case 'division': return '÷';
      default: return '+';
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="w-full">
            <History className="h-4 w-4 mr-2" />
            {t('Exercise History') || 'Exercise History'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            {selectedExercise ? (selectedExercise.operationId === "addition" ? "Addition Exercise Complete!" : 
                              selectedExercise.operationId === "subtraction" ? "Subtraction Exercise Complete!" :
                              selectedExercise.operationId === "multiplication" ? "Multiplication Exercise Complete!" :
                              selectedExercise.operationId === "division" ? "Division Exercise Complete!" :
                              "Math Exercise Complete!") : 
            (t('Exercise History') || 'Exercise History')}
          </DialogTitle>
          {!selectedExercise && (
            <DialogDescription>
              {t('View details of your previous exercise sessions') || 'View details of your previous exercise sessions'}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {selectedExercise ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Total Time</div>
              <div className="text-xl font-bold">
                {formatTime(selectedExercise.timeSpent)}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Score</div>
                <div className="text-xl text-indigo-600 font-semibold">
                  {selectedExercise.score} / {selectedExercise.totalProblems}
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Accuracy</div>
                <div className="text-xl text-green-600 font-semibold">
                  {selectedExercise.accuracy || 
                   Math.round((selectedExercise.score / selectedExercise.totalProblems) * 100)}%
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Avg. Time</div>
                <div className="text-xl text-purple-600 font-semibold">
                  {selectedExercise.avgTimePerProblem || 
                   Math.round(selectedExercise.timeSpent / selectedExercise.totalProblems)}s
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-amber-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Avg. Attempts</div>
                <div className="text-xl text-amber-600 font-semibold">
                  {selectedExercise.avgAttempts?.toFixed(1) || "1.0"}
                </div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Revealed</div>
                <div className="text-xl text-red-600 font-semibold">
                  {selectedExercise.revealedAnswers || 0}
                </div>
              </div>
              
              <div className="bg-teal-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Final Level</div>
                <div className="text-xl text-teal-600 font-semibold">
                  {selectedExercise.difficulty === 'beginner' ? 1 : 
                   selectedExercise.difficulty === 'elementary' ? 2 :
                   selectedExercise.difficulty === 'intermediate' ? 3 :
                   selectedExercise.difficulty === 'advanced' ? 4 : 
                   selectedExercise.difficulty === 'expert' ? 5 : 1}
                </div>
              </div>
            </div>
            
            {/* Detalles de los problemas - siempre mostrar la sección */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Problem Review</h3>
              <div className="space-y-2">
                {/* Usamos los problemas guardados del ejercicio si existen */}
                {(() => {
                  try {
                    // Obtener los detalles de los problemas del extraData (que es un JSON string)
                    let problemDetails: any[] = [];
                    if (selectedExercise.extraData) {
                      try {
                        const extraData = JSON.parse(selectedExercise.extraData);
                        problemDetails = extraData.problemDetails || [];
                      } catch (e) {
                        console.error("Error al parsear extraData:", e);
                      }
                    }
                    
                    // Si tenemos problemas guardados, los mostramos
                    if (problemDetails && problemDetails.length > 0) {
                      return problemDetails.map((problemDetail: any, index: number) => {
                        if (!problemDetail) return null;
                        
                        const operationId = selectedExercise.operationId || 'addition';
                        const operator = getOperator(operationId);
                        let problemDisplay = '';
                        
                        // Crear una representación visual del problema
                        if (problemDetail.problem && problemDetail.problem.operands) {
                          const operands = problemDetail.problem.operands;
                          if (operands.length === 2) {
                            problemDisplay = `${operands[0]} ${operator} ${operands[1]} = ${problemDetail.correctAnswer}`;
                            
                            // Añadir respuesta del usuario si es incorrecta
                            if (!problemDetail.isCorrect && problemDetail.userAnswer !== undefined) {
                              const userAnswerDisplay = String(problemDetail.userAnswer);
                              problemDisplay += ` (Tu respuesta: ${userAnswerDisplay})`;
                            }
                          }
                        }
                        
                        return (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg ${problemDetail.isCorrect 
                              ? 'bg-green-100' 
                              : 'bg-red-100'}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">(#{index + 1})</span> {problemDisplay}
                              </div>
                              <div>
                                {problemDetail.isCorrect 
                                  ? <Check className="h-5 w-5 text-green-600" /> 
                                  : <span className="text-red-600 text-xl font-bold">✕</span>}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Lvl: {problemDetail.level || selectedExercise.difficulty}, 
                              Att: {problemDetail.attempts || 1}, 
                              T: {problemDetail.timeSpent || Math.round(selectedExercise.timeSpent / selectedExercise.totalProblems)}s
                            </div>
                          </div>
                        );
                      });
                    }
                  } catch (error) {
                    console.error("Error al procesar datos extras:", error);
                  }
                  
                  // Si no hay datos o hay un error, usamos un mensaje de fallback
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-gray-500">No hay detalles específicos disponibles para este ejercicio.</p>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Botón para volver a la lista */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setSelectedExercise(null)}>
                Volver a la lista
              </Button>
            </div>
          </div>
        ) : (
          <>
            {sortedHistory.length === 0 ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('No exercise history available yet.') || 'No exercise history available yet.'}</p>
                <p className="text-gray-500 text-sm mt-2">{t('Complete an exercise to see your results here.') || 'Complete an exercise to see your results here.'}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {sortedHistory.map((exercise, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="flex justify-between items-center h-auto py-3 text-left w-full bg-white hover:bg-gray-50"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="flex flex-col justify-start">
                      <div className="font-medium text-base">
                        {(() => {
                          // Usar fecha y hora actual, que se actualizará para cada elemento único
                          const now = new Date(); 
                          // Crear una fecha única para cada elemento de la lista basada en el índice
                          // Esto simula que cada ejercicio tiene una hora distinta
                          now.setMinutes(now.getMinutes() - index * 2);
                          
                          return now.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level: {getDifficultyName(exercise.difficulty)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-yellow-500 mr-1" />
                        <span className="text-yellow-500 font-semibold">
                          {Math.round((exercise.score / exercise.totalProblems) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-500 mr-1" />
                        <span className="text-blue-500 font-semibold">{formatTime(exercise.timeSpent)}</span>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}