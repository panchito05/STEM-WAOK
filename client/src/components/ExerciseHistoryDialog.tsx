import React, { useState, useEffect } from 'react';
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
import { useTranslations } from '@/hooks/use-translations';

interface ExerciseHistoryDialogProps {
  moduleId: string;
  exerciseHistory: ExerciseResult[];
  trigger?: React.ReactNode;
}

export default function ExerciseHistoryDialog({ moduleId, exerciseHistory, trigger }: ExerciseHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const { t, language } = useTranslations();

  const moduleExercises = exerciseHistory.filter(item => item.operationId === moduleId);

  const sortedHistory = moduleExercises
    .filter(item => item.extra_data?.screenshot)
    .sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

  const selectedExercise = selectedExerciseId 
    ? sortedHistory.find(ex => ex.id === selectedExerciseId) || null
    : null;

  useEffect(() => {
    if (!open) {
      setSelectedExerciseId(null);
    }
  }, [open]);

  const hasScreenshot = selectedExercise?.extra_data?.screenshot;

  const formatDate = (dateString: string | Date | null | undefined) => {
    try {
      const date = dateString ? new Date(dateString) : new Date();
      return date.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
        month: 'long',
        day: 'numeric', 
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            {selectedExercise ? (
              selectedExercise.extra_data?.screenshot?.title || "Exercise Complete!"
            ) : (
              t('Exercise History') || 'Exercise History'
            )}
          </DialogTitle>
          {!selectedExercise && (
            <DialogDescription>
              {t('View details of your previous exercise sessions') || 'View details of your previous exercise sessions'}
            </DialogDescription>
          )}
        </DialogHeader>
        {selectedExercise ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">Total Time</div>
              <div className="text-xl font-bold">
                {selectedExercise.extra_data?.screenshot?.scoreData.totalTime || formatTime(selectedExercise.timeSpent)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`${selectedExercise.extra_data?.screenshot?.scoreData.score.bgColor || 'bg-blue-50'} p-3 rounded-lg text-center`}>
                <div className="text-sm text-gray-600 mb-1">Score</div>
                <div className={`text-xl ${selectedExercise.extra_data?.screenshot?.scoreData.score.textColor || 'text-indigo-600'} font-semibold`}>
                  {selectedExercise.extra_data?.screenshot?.scoreData.score.value || `${selectedExercise.score} / ${selectedExercise.totalProblems}`}
                </div>
              </div>

              <div className={`${selectedExercise.extra_data?.screenshot?.scoreData.accuracy.bgColor || 'bg-green-50'} p-3 rounded-lg text-center`}>
                <div className="text-sm text-gray-600 mb-1">Accuracy</div>
                <div className={`text-xl ${selectedExercise.extra_data?.screenshot?.scoreData.accuracy.textColor || 'text-green-600'} font-semibold`}>
                  {selectedExercise.extra_data?.screenshot?.scoreData.accuracy.value || "100%"}
                </div>
              </div>

              <div className={`${selectedExercise.extra_data?.screenshot?.scoreData.avgTime.bgColor || 'bg-purple-50'} p-3 rounded-lg text-center`}>
                <div className="text-sm text-gray-600 mb-1">Avg. Time</div>
                <div className={`text-xl ${selectedExercise.extra_data?.screenshot?.scoreData.avgTime.textColor || 'text-purple-600'} font-semibold`}>
                  {selectedExercise.extra_data?.screenshot?.scoreData.avgTime.value || "3s"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`${selectedExercise.extra_data?.screenshot?.scoreData.avgAttempts.bgColor || 'bg-amber-50'} p-3 rounded-lg text-center`}>
                <div className="text-sm text-gray-600 mb-1">Avg. Attempts</div>
                <div className={`text-xl ${selectedExercise.extra_data?.screenshot?.scoreData.avgAttempts.textColor || 'text-amber-600'} font-semibold`}>
                  {selectedExercise.extra_data?.screenshot?.scoreData.avgAttempts.value || "1.0"}
                </div>
              </div>

              <div className={`${selectedExercise.extra_data?.screenshot?.scoreData.revealed.bgColor || 'bg-red-50'} p-3 rounded-lg text-center`}>
                <div className="text-sm text-gray-600 mb-1">Revealed</div>
                <div className={`text-xl ${selectedExercise.extra_data?.screenshot?.scoreData.revealed.textColor || 'text-red-600'} font-semibold`}>
                  {selectedExercise.extra_data?.screenshot?.scoreData.revealed.value || "0"}
                </div>
              </div>

              <div className={`${selectedExercise.extra_data?.screenshot?.scoreData.finalLevel.bgColor || 'bg-teal-50'} p-3 rounded-lg text-center`}>
                <div className="text-sm text-gray-600 mb-1">Final Level</div>
                <div className={`text-xl ${selectedExercise.extra_data?.screenshot?.scoreData.finalLevel.textColor || 'text-teal-600'} font-semibold`}>
                  {selectedExercise.extra_data?.screenshot?.scoreData.finalLevel.value || "1"}
                </div>
              </div>
            </div>

            {selectedExercise.extra_data?.screenshot?.problemReview && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Problem Review</h3>
                <div className="space-y-2">
                  {selectedExercise.extra_data.screenshot.problemReview.map((problem: any, index: number) => (
                    <div key={index} 
                         className={`p-3 rounded-lg ${problem.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">(#{index + 1})</span> {
                            // Si estamos en modo profesor, asegurarnos de que no se muestren los paréntesis
                            selectedExercise.extra_data?.mode === "professor" ? 
                              // Eliminar cualquier contenido entre paréntesis de la cadena del problema
                              problem.problem.replace(/\s*\(\d+\)$/, '') : 
                              problem.problem
                          }
                        </div>
                        <div>
                          {problem.isCorrect 
                            ? <Check className="h-5 w-5 text-green-600" /> 
                            : <span className="text-red-600 text-xl font-bold">✕</span>
                          }
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Lvl: {problem.level}, Att: {problem.attempts}, T: {problem.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              variant="ghost" 
              onClick={() => setSelectedExerciseId(null)}
              className="w-full mt-4"
            >
              {t('Back to History') || 'Back to History'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHistory.length === 0 ? (
              <div className="text-center py-4">
                <Info className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  {t('No history available for this module yet') || 'No history available for this module yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedHistory.map((exercise) => (
                  <Button 
                    key={exercise.id} 
                    variant="outline" 
                    className="flex justify-between items-center h-auto py-3 text-left w-full bg-white hover:bg-gray-50"
                    onClick={() => setSelectedExerciseId(exercise.id)}
                  >
                    <div className="flex flex-col justify-start">
                      <div className="font-medium text-base">
                        {formatDate(exercise.date || exercise.createdAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('Level')}: {getDifficultyName(exercise.difficulty)}
                      </div>
                    </div>
                    <div className="flex space-x-4 items-center">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-indigo-600">{exercise.score}%</span>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}