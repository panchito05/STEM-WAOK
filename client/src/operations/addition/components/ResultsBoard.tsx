import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Home, RefreshCw, Trophy, Clock } from 'lucide-react';
import { DifficultyLevel, UserAnswer } from '../types';
import { useTranslation } from '../hooks/useTranslation';

export interface ResultsBoardProps {
  score: number;
  totalProblems: number;
  userAnswers: UserAnswer[];
  difficulty: DifficultyLevel;
  timeSpent: number;
  onRetry: () => void;
  onHome: () => void;
}

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
  
  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Obtener mensaje según el desempeño
  const getPerformanceMessage = (): string => {
    if (percentage >= 90) return t('excellentJob');
    if (percentage >= 75) return t('greatJob');
    if (percentage >= 50) return t('goodEffort');
    return t('keepPracticing');
  };
  
  // Obtener nombre de la dificultad en texto
  const getDifficultyText = (): string => {
    switch (difficulty) {
      case 'easy': return t('difficultyEasy');
      case 'medium': return t('difficultyMedium');
      case 'hard': return t('difficultyHard');
      case 'expert': return t('difficultyExpert');
      default: return t('difficultyUnknown');
    }
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Encabezado con resultado */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{getPerformanceMessage()}</h2>
        <div className="text-4xl font-bold flex items-center justify-center">
          <Trophy className="text-yellow-500 w-8 h-8 mr-2" />
          <span>
            {t('score', { 
              values: { score, total: totalProblems } 
            })}
          </span>
        </div>
        <p className="text-xl mt-2">{percentage}%</p>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="font-semibold">{t('timeSpent')}</h3>
          </div>
          <p className="text-xl font-mono">{formatTime(timeSpent)}</p>
        </div>
        
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 mr-2 text-purple-500"
            >
              <path d="M2 20h.01m4 0h.01m4 0h.01m4 0h.01m4 0h.01" />
              <path d="M5 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              <path d="M21 2v14a5 5 0 0 1-5 5" />
              <path d="M9 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              <path d="M13 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              <path d="M17 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              <path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
            </svg>
            <h3 className="font-semibold">{t('difficulty')}</h3>
          </div>
          <p className="text-xl">{getDifficultyText()}</p>
        </div>
      </div>
      
      {/* Resumen de problemas */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-6">
        <h3 className="font-semibold mb-4">{t('problemSummary')}</h3>
        
        <div className="space-y-3">
          {userAnswers.map((answer, index) => (
            <div 
              key={answer.problemId}
              className={`p-3 rounded-md ${
                answer.isCorrect 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {answer.isCorrect ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  )}
                  <span className="font-medium">
                    {index + 1}. {renderProblemText(answer.problem)}
                  </span>
                </div>
                
                <div>
                  {t('youAnswered', { 
                    values: { answer: answer.userAnswer || '?' } 
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={onHome}
        >
          <Home className="w-4 h-4 mr-2" />
          {t('home')}
        </Button>
        
        <Button 
          className="flex-1" 
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('tryAgain')}
        </Button>
      </div>
    </div>
  );
};

// Función auxiliar para renderizar el texto del problema
function renderProblemText(problem: any): string {
  if (!problem || !problem.operands) return 'N/A';
  
  // Convertir los operandos a texto
  return problem.operands
    .map((op: any) => op.value)
    .join(' + ') + ' = ' + problem.correctAnswer;
}

export default ResultsBoard;