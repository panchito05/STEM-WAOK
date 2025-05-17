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
import { History, Info, Check, ThumbsDown, Award, Clock } from 'lucide-react';
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
  
  // Filtrar solo el historial relacionado con este módulo (asegurando que exerciseHistory existe)
  const moduleHistory = exerciseHistory ? exerciseHistory.filter(entry => entry.operationId === moduleId) : [];
  
  // Ordenar el historial por fecha, más reciente primero (protegerse contra moduleHistory vacío)
  const sortedHistory = moduleHistory && moduleHistory.length > 0 
    ? [...moduleHistory].sort((a, b) => {
        try {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA; // Orden descendente (más reciente primero)
        } catch (error) {
          console.error('Error ordenando por fecha:', error);
          return 0;
        }
      })
    : [];
  
  // Función para obtener el nombre de dificultad localizado
  const getDifficultyName = (difficultyCode: string) => {
    switch(difficultyCode) {
      case 'beginner': return t('difficulty.beginner');
      case 'elementary': return t('difficulty.elementary');
      case 'intermediate': return t('difficulty.intermediate');
      case 'advanced': return t('difficulty.advanced');
      case 'expert': return t('difficulty.expert');
      default: return difficultyCode;
    }
  };
  
  // Formatear fecha según el idioma con validación
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const locale = language === 'es' ? es : enUS;
      return format(date, 'PPpp', { locale });
    } catch (error) {
      console.error('Error al formatear fecha:', dateString, error);
      return 'Fecha inválida';
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="w-full">
            <History className="h-4 w-4 mr-2" />
            {t('Exercise History')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Exercise History')}</DialogTitle>
          <DialogDescription>
            {t('View details of your previous exercise sessions')}
          </DialogDescription>
        </DialogHeader>
        
        {selectedExercise ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => setSelectedExercise(null)}>
                {t('Back to List')}
              </Button>
              <div className="text-sm text-gray-500">
                {formatDate(selectedExercise.date)}
              </div>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-lg mb-4 text-center">
              <div className="text-sm text-gray-600 mb-1">{t('Total Time')}</div>
              <div className="text-xl font-bold">
                {formatTime(selectedExercise.timeSpent)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg shadow-sm text-center border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">{t('Score')}</div>
                <div className="text-xl text-indigo-600 font-semibold">
                  {selectedExercise.score} / {selectedExercise.totalProblems}
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg shadow-sm text-center border border-green-100">
                <div className="text-sm text-gray-600 mb-1">{t('Accuracy')}</div>
                <div className="text-xl text-green-600 font-semibold">
                  {selectedExercise.accuracy || 
                   Math.round((selectedExercise.score / selectedExercise.totalProblems) * 100)}%
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg shadow-sm text-center border border-purple-100">
                <div className="text-sm text-gray-600 mb-1">{t('Avg. Time')}</div>
                <div className="text-xl text-purple-600 font-semibold">
                  {selectedExercise.avgTimePerProblem || 
                   Math.round(selectedExercise.timeSpent / selectedExercise.totalProblems)}s
                </div>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg shadow-sm text-center border border-amber-100">
                <div className="text-sm text-gray-600 mb-1">{t('Avg. Attempts')}</div>
                <div className="text-xl text-amber-600 font-semibold">
                  {selectedExercise.avgAttempts?.toFixed(1) || "1.0"}
                </div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg shadow-sm text-center border border-red-100">
                <div className="text-sm text-gray-600 mb-1">{t('Revealed')}</div>
                <div className="text-xl text-red-600 font-semibold">
                  {selectedExercise.revealedAnswers || 0}
                </div>
              </div>
              
              <div className="bg-teal-50 p-3 rounded-lg shadow-sm text-center border border-teal-100">
                <div className="text-sm text-gray-600 mb-1">{t('Level')}</div>
                <div className="text-xl text-teal-600 font-semibold">
                  {getDifficultyName(selectedExercise.difficulty)}
                </div>
              </div>
            </div>
            
            {/* Detalles de los problemas si existen */}
            {selectedExercise.problemDetails && selectedExercise.problemDetails.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">{t('Problem Review')}</h3>
                <div className="space-y-2">
                  {selectedExercise.problemDetails.map((problem, index) => {
                    if (!problem) return null;
                    
                    // Mostrar el problema en formato legible
                    let problemDisplay = '';
                    if (problem.problem?.operands && problem.problem.operands.length > 0) {
                      if (problem.problem.operands.length === 2) {
                        problemDisplay = `${problem.problem.operands[0]} + ${problem.problem.operands[1]} = ${problem.correctAnswer}`;
                        if (problem.userAnswer !== problem.correctAnswer && !isNaN(Number(problem.userAnswer))) {
                          problemDisplay += ` (${problem.userAnswer})`;
                        }
                      }
                    }
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg ${problem.isCorrect 
                          ? 'bg-green-100 border border-green-200' 
                          : 'bg-red-100 border border-red-200'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">(#{index + 1})</span> {problemDisplay}
                          </div>
                          <div>
                            {problem.isCorrect 
                              ? <Check className="h-5 w-5 text-green-600" /> 
                              : <span className="text-red-600">✕</span>}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {t('Level')}: {getDifficultyName(problem.level || selectedExercise.difficulty)}, 
                          {t('Attempts')}: {problem.attempts || 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {sortedHistory.length === 0 ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('No exercise history available yet.')}</p>
                <p className="text-gray-500 text-sm mt-2">{t('Complete an exercise to see your results here.')}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {sortedHistory.map((exercise, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="flex justify-between items-center h-auto py-3 text-left"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">
                        {formatDate(exercise.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('Level')}: {getDifficultyName(exercise.difficulty)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-yellow-500 mr-1" />
                        <span>{exercise.score}/{exercise.totalProblems}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-500 mr-1" />
                        <span>{formatTime(exercise.timeSpent)}</span>
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