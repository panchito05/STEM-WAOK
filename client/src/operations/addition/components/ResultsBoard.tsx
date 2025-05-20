// ResultsBoard.tsx - Componente para mostrar resultados finales del ejercicio
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, Home } from 'lucide-react';
import { Problem, UserAnswer } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ResultsBoardProps {
  score: number;
  problems: Problem[];
  userAnswers: UserAnswer[];
  onRestart: () => void;
  onReturn: () => void;
}

const ResultsBoard: React.FC<ResultsBoardProps> = ({
  score,
  problems,
  userAnswers,
  onRestart,
  onReturn
}) => {
  const { t } = useTranslation();
  
  // Función para formatear problemas para mostrar
  const formatProblemToString = (problem: Problem): string => {
    if (problem.displayText) {
      return problem.displayText;
    }
    
    // Formato horizontal por defecto
    return `${problem.operands.join(' + ')} = ${problem.correctAnswer}`;
  };
  
  // Calcular porcentaje de aciertos
  const percentage = Math.round((score / problems.length) * 100);
  
  // Determinar mensaje según porcentaje
  const getMessage = (): string => {
    if (percentage >= 90) return t('results.excellent');
    if (percentage >= 70) return t('results.good');
    if (percentage >= 50) return t('results.fair');
    return t('results.needsPractice');
  };
  
  return (
    <div className="results-board flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">{t('results.exerciseComplete')}</h2>
        <p className="text-xl">{getMessage()}</p>
        
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold mb-2">
            {score} / {problems.length}
          </div>
          <div className="text-lg">
            {percentage}% {t('results.correct')}
          </div>
        </div>
      </div>
      
      <div className="results-list bg-card p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-3">{t('results.problemReview')}</h3>
        
        <div className="space-y-2">
          {problems.map((problem) => {
            const userAnswer = userAnswers.find(a => a.problemId === problem.id);
            const isCorrect = userAnswer?.isCorrect;
            
            return (
              <div 
                key={problem.id} 
                className={`p-3 rounded-md flex justify-between items-center ${
                  isCorrect 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium">
                      {formatProblemToString(problem)}
                    </span>
                  </div>
                  
                  {!isCorrect && (
                    <div className="mt-1 pl-7 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('results.yourAnswer')}: {userAnswer?.userAnswer}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <span className="text-lg font-mono">
                    {problem.correctAnswer}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between gap-4">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={onReturn}
        >
          <Home className="h-4 w-4 mr-2" />
          {t('common.returnToMenu')}
        </Button>
        
        <Button 
          variant="default" 
          className="flex-1" 
          onClick={onRestart}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('common.tryAgain')}
        </Button>
      </div>
    </div>
  );
};

export default ResultsBoard;