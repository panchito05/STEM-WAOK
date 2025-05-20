// ResultsBoard.tsx - Componente para mostrar resultados finales del ejercicio
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAnswer } from '../types';
import { formatProblemToString } from '../utils/problemGenerator';
import { useTranslation } from '../hooks/useTranslation';

interface ResultsBoardProps {
  userAnswers: UserAnswer[];
  totalProblems: number;
  score: number;
  onRestart: () => void;
  onReturn?: () => void;
}

const ResultsBoard: React.FC<ResultsBoardProps> = ({
  userAnswers,
  totalProblems,
  score,
  onRestart,
  onReturn
}) => {
  const { t } = useTranslation();
  
  // Calcular estadísticas
  const accuracy = totalProblems > 0 
    ? Math.round((score / totalProblems) * 100) 
    : 0;
    
  const totalTime = userAnswers.reduce((total, answer) => 
    total + (answer.timeTaken || 0), 0);
    
  const averageTime = totalProblems > 0 
    ? Math.round((totalTime / totalProblems) * 10) / 10 
    : 0;
    
  const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
  const incorrectAnswers = totalProblems - correctAnswers;

  return (
    <div className="results-board">
      <h2 className="text-2xl font-bold text-center mb-4">
        {t('exercise.completed')}
      </h2>
      
      {/* Resumen de puntuación */}
      <div className="score-summary text-center mb-6">
        <div className="text-4xl font-bold mb-2">
          {score} / {totalProblems}
        </div>
        <div className="text-lg">
          {t('exercise.accuracy')}: {accuracy}%
        </div>
        <div className="text-sm text-muted-foreground">
          Tiempo promedio: {averageTime}s por problema
        </div>
      </div>
      
      {/* Detalles de cada problema */}
      <div className="problem-details mb-6">
        <h3 className="text-lg font-medium mb-3">Detalles por problema:</h3>
        
        <div className="space-y-3">
          {userAnswers.map((answer, index) => {
            // Asegurar que problem es un objeto de tipo Problem
            const problem = typeof answer.problem === 'string' 
              ? { id: answer.problemId, operands: [], correctAnswer: '', displayText: answer.problem }
              : answer.problem;
              
            return (
              <Card key={answer.problemId || index} className={`
                ${answer.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}
                dark:${answer.isCorrect ? 'border-green-800 bg-green-950' : 'border-red-800 bg-red-950'}
              `}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {problem.displayText || formatProblemToString(problem)}
                      </div>
                      <div className="text-sm mt-1">
                        Tu respuesta: {answer.userAnswer}
                      </div>
                      {!answer.isCorrect && (
                        <div className="text-sm mt-1">
                          Respuesta correcta: {problem.correctAnswer}
                        </div>
                      )}
                    </div>
                    <div className={`
                      px-2 py-1 rounded text-sm
                      ${answer.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}
                      dark:${answer.isCorrect ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}
                    `}>
                      {answer.isCorrect ? 'Correcto' : 'Incorrecto'}
                    </div>
                  </div>
                  {answer.timeTaken && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Tiempo: {Math.round(answer.timeTaken * 10) / 10}s
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Acciones */}
      <div className="flex justify-center gap-4">
        <Button onClick={onRestart} className="min-w-[120px]">
          Reintentar
        </Button>
        {onReturn && (
          <Button variant="outline" onClick={onReturn} className="min-w-[120px]">
            Volver al menú
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResultsBoard;