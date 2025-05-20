// ResultsBoard.tsx - Muestra los resultados finales del ejercicio
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Problem, UserAnswer, ExerciseResults } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ResultsBoardProps {
  results: ExerciseResults;
  problems: Problem[];
  userAnswers: UserAnswer[];
  onRestart: () => void;
}

/**
 * Componente que muestra los resultados del ejercicio
 */
export function ResultsBoard({ results, problems, userAnswers, onRestart }: ResultsBoardProps) {
  const { t } = useTranslation();
  
  // Calcular puntuaciones
  const accuracyPercentage = Math.round(results.accuracy * 100);
  const scoreClass = getScoreClass(accuracyPercentage);
  
  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-2xl font-bold text-blue-700">
            {t('exercise.completed')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
            {/* Precisión */}
            <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-700">{t('exercise.accuracy')}</h3>
              <div className="w-full mt-2">
                <Progress value={accuracyPercentage} className="h-2.5" />
              </div>
              <p className={`text-2xl font-bold mt-2 ${scoreClass}`}>
                {accuracyPercentage}%
              </p>
            </div>
            
            {/* Puntuación total */}
            <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-700">{t('exercise.finalScore')}</h3>
              <p className={`text-3xl font-bold mt-2 ${scoreClass}`}>
                {results.totalPoints}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {results.correctAnswers} / {results.totalProblems} {t('exercise.correct').toLowerCase()}
              </p>
            </div>
          </div>
          
          {/* Resumen de tiempo */}
          <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm mt-3">
            <h3 className="text-lg font-medium text-gray-700 mb-2">{t('exercise.timeStats')}</h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-sm text-gray-500">{t('exercise.totalTime')}</p>
                <p className="text-lg font-semibold">
                  {formatTime(results.totalTimeTaken)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('exercise.avgTimePerProblem')}</p>
                <p className="text-lg font-semibold">
                  {formatTime(results.averageTimePerProblem)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Lista de problemas */}
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">{t('exercise.problemList')}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {userAnswers.map((answer, index) => {
                const problem = problems.find(p => p.id === answer.problemId);
                
                return (
                  <div 
                    key={answer.problemId} 
                    className={`p-3 rounded-md 
                      ${answer.isCorrect 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'}`
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono">
                          {problem?.operands[0]} + {problem?.operands[1]} = {problem?.result}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Badge 
                          className={`ml-2 ${answer.isCorrect ? "bg-green-500" : "bg-red-500"} text-white`}
                        >
                          {answer.isCorrect 
                            ? t('exercise.correct') 
                            : t('exercise.incorrect')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>
                        {t('exercise.yourAnswer')}: <b>{answer.userAnswer || t('exercise.noAnswer')}</b>
                      </span>
                      <span>
                        {t('exercise.attempt')}: {answer.attempt}
                      </span>
                      <span>
                        {formatTime(answer.timeTaken)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Botón de reinicio */}
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={onRestart}
              className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('exercise.restart')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Determina la clase CSS para la puntuación según el porcentaje
 */
function getScoreClass(percentage: number): string {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 70) return 'text-blue-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Formatea el tiempo en segundos a mm:ss
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}