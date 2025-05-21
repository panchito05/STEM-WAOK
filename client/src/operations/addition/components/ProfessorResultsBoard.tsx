import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfessorStudentAnswer } from '../ProfessorModeTypes';

interface ProfessorResultsBoardProps {
  studentAnswers: ProfessorStudentAnswer[];
  timeSpent: number;
  onFinish: () => void;
  onViewHistory: () => void;
}

/**
 * Componente para mostrar los resultados finales del ejercicio en modo profesor
 * Responsabilidad: Mostrar estadísticas y opciones al finalizar
 */
export const ProfessorResultsBoard: React.FC<ProfessorResultsBoardProps> = ({
  studentAnswers,
  timeSpent,
  onFinish,
  onViewHistory
}) => {
  const { t } = useTranslation();
  
  // Calcular estadísticas
  const totalProblems = studentAnswers.length;
  const correctAnswers = studentAnswers.filter(answer => answer.isCorrect).length;
  const incorrectAnswers = totalProblems - correctAnswers;
  const percentageCorrect = Math.round((correctAnswers / totalProblems) * 100);
  
  // Formatear el tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-xl">
            {t('exercises.exerciseCompleted')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-background p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-2">{t('exercises.score')}</h3>
              <div className="text-3xl font-bold">
                {correctAnswers} / {totalProblems}
              </div>
              <div className="text-sm text-muted-foreground">
                {percentageCorrect}% {t('exercises.correct')}
              </div>
            </div>
            
            <div className="bg-background p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-2">{t('exercises.timeSpent')}</h3>
              <div className="text-3xl font-bold">
                {formatTime(timeSpent)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('exercises.averagePerProblem')}: {formatTime(timeSpent / totalProblems)}
              </div>
            </div>
          </div>
          
          {/* Detalles de problemas */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">{t('exercises.problemDetails')}</h3>
            <div className="space-y-2">
              {studentAnswers.map((answer, index) => (
                <div 
                  key={answer.problemId} 
                  className={`p-3 rounded-lg ${answer.isCorrect ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{t('exercises.problem')} {index + 1}: </span>
                      <span>
                        {answer.problem.operands[0]} + {answer.problem.operands[1]} = {answer.problem.correctAnswer}
                      </span>
                    </div>
                    <div>
                      {answer.isCorrect ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">✓</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium">✗</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Información de la respuesta */}
                  <div className="text-sm text-muted-foreground mt-1">
                    {answer.answer !== null ? (
                      <span>
                        {t('exercises.studentAnswered')}: {answer.answer}
                        {!answer.isCorrect && (
                          <span className="ml-2">
                            ({t('exercises.correctAnswerIs')}: {answer.problem.correctAnswer})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>{t('exercises.noAnswer')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Botones de acción */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={onFinish} variant="default" className="min-w-[200px]">
          {t('exercises.finishExercise')}
        </Button>
        
        <Button onClick={onViewHistory} variant="outline" className="min-w-[200px]">
          {t('exercises.viewHistory')}
        </Button>
      </div>
    </div>
  );
};