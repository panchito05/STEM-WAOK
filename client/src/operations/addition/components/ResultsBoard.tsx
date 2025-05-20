import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Timer, Award, Home, Repeat } from 'lucide-react';
import { ResultsBoardProps } from '../types';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Tablero de resultados que muestra al finalizar un ejercicio
 */
const ResultsBoard: React.FC<ResultsBoardProps> = ({
  score,
  totalProblems,
  userAnswers,
  difficulty,
  timeSpent,
  onRetry,
  onHome
}) => {
  const { t } = useTranslation();
  
  // Calcular porcentaje de aciertos
  const percentage = Math.round((score / totalProblems) * 100);
  
  // Determinar mensaje basado en el porcentaje
  const getMessage = () => {
    if (percentage >= 90) {
      return t('excellentJob', { defaultValue: '¡Excelente trabajo!' });
    } else if (percentage >= 70) {
      return t('greatJob', { defaultValue: '¡Buen trabajo!' });
    } else if (percentage >= 50) {
      return t('goodEffort', { defaultValue: '¡Buen esfuerzo!' });
    } else {
      return t('keepPracticing', { defaultValue: 'Sigue practicando' });
    }
  };
  
  // Formatear el tiempo transcurrido
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Obtener texto del nivel de dificultad
  const getDifficultyText = () => {
    switch (difficulty) {
      case 'easy':
        return t('difficultyEasy', { defaultValue: 'Fácil' });
      case 'medium':
        return t('difficultyMedium', { defaultValue: 'Medio' });
      case 'hard':
        return t('difficultyHard', { defaultValue: 'Difícil' });
      case 'expert':
        return t('difficultyExpert', { defaultValue: 'Experto' });
      default:
        return t('difficultyUnknown', { defaultValue: 'Desconocido' });
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
        <CardTitle className="text-center text-xl md:text-2xl">
          {getMessage()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Puntuación */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-bold">
            {t('score', { 
              defaultValue: 'Puntuación: {{score}} / {{total}}',
              values: { score, total: totalProblems }
            })}
          </h3>
          <div className="mt-2 text-lg">
            {percentage}%
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <Timer className="h-6 w-6 mb-2 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('timeSpent', { defaultValue: 'Tiempo' })}
            </div>
            <div className="text-lg font-medium">
              {formatTime(timeSpent)}
            </div>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <Award className="h-6 w-6 mb-2 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('difficulty', { defaultValue: 'Dificultad' })}
            </div>
            <div className="text-lg font-medium">
              {getDifficultyText()}
            </div>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="flex mb-2">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-1" />
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('correctIncorrect', { defaultValue: 'Correcto/Incorrecto' })}
            </div>
            <div className="text-lg font-medium">
              {score} / {totalProblems - score}
            </div>
          </div>
        </div>
        
        {/* Resumen de problemas */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">
            {t('problemSummary', { defaultValue: 'Resumen de problemas' })}
          </h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {userAnswers.map((answer, index) => (
              <div 
                key={answer.problemId}
                className={`flex flex-col p-3 rounded-md border ${
                  answer.isCorrect 
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' 
                    : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'
                }`}
              >
                <div className="text-sm font-medium">
                  #{index + 1}
                </div>
                <div className="flex items-center mt-1">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
                  )}
                  <span className="text-sm">
                    {answer.isCorrect ? 
                      t('correct', { defaultValue: 'Correcto' }) : 
                      t('incorrect', { defaultValue: 'Incorrecto' })
                    }
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {answer.problem.operands.join(' + ')} = {answer.problem.correctAnswer}
                </div>
                {!answer.isCorrect && (
                  <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {t('youAnswered', { 
                      defaultValue: 'Tu respuesta: {{answer}}',
                      values: { answer: answer.userAnswer }
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 pb-4">
        <Button 
          variant="outline" 
          onClick={onHome}
          className="flex items-center"
        >
          <Home className="h-4 w-4 mr-2" />
          {t('home', { defaultValue: 'Inicio' })}
        </Button>
        <Button 
          onClick={onRetry}
          className="flex items-center"
        >
          <Repeat className="h-4 w-4 mr-2" />
          {t('tryAgain', { defaultValue: 'Intentar de nuevo' })}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResultsBoard;