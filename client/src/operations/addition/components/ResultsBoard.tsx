// ResultsBoard.tsx - Componente para mostrar los resultados del ejercicio
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, ArrowRight } from 'lucide-react';
import { Problem, UserAnswer, ExerciseResults } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ResultsBoardProps {
  results: ExerciseResults;
  problems: Problem[];
  userAnswers: UserAnswer[];
  onRestart: () => void;
}

/**
 * Componente para mostrar los resultados del ejercicio
 */
export const ResultsBoard: React.FC<ResultsBoardProps> = ({
  results,
  problems,
  userAnswers,
  onRestart
}) => {
  const { t } = useTranslation();
  
  // Determinar mensaje según el rendimiento
  const getPerformanceMessage = () => {
    const { accuracy } = results;
    
    if (accuracy >= 0.9) {
      return t('results.excellent');
    } else if (accuracy >= 0.7) {
      return t('results.good');
    } else if (accuracy >= 0.5) {
      return t('results.average');
    } else {
      return t('results.needsPractice');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Cabecera con resultado general */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 rounded-lg text-white text-center">
        <h2 className="text-2xl font-bold mb-2">{t('results.completed')}</h2>
        <div className="flex justify-center items-center mb-4">
          <Trophy className="w-10 h-10 text-yellow-300 mr-3" />
          <span className="text-3xl font-bold">{results.totalPoints} {t('results.points')}</span>
        </div>
        <p className="text-xl">{getPerformanceMessage()}</p>
      </div>
      
      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label={t('results.totalProblems')} 
          value={results.totalProblems.toString()} 
        />
        <StatCard 
          label={t('results.correctAnswers')} 
          value={results.correctAnswers.toString()}
          valueColor="text-green-600"
        />
        <StatCard 
          label={t('results.wrongAnswers')} 
          value={results.wrongAnswers.toString()} 
          valueColor="text-red-600"
        />
        <StatCard 
          label={t('results.accuracy')} 
          value={`${Math.round(results.accuracy * 100)}%`}
          valueColor={results.accuracy >= 0.7 ? 'text-green-600' : 'text-orange-600'}
        />
      </div>
      
      {/* Lista de problemas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-100 p-3 border-b border-gray-200">
          <h3 className="font-medium">{t('results.problemList')}</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {problems.map((problem, index) => {
            const userAnswer = userAnswers.find(a => a.problemId === problem.id);
            const isCorrect = userAnswer?.isCorrect || false;
            
            return (
              <div 
                key={problem.id}
                className={`p-3 flex justify-between items-center ${
                  isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="bg-gray-200 text-gray-700 w-7 h-7 flex items-center justify-center rounded-full mr-3">
                    {index + 1}
                  </span>
                  <span className="font-mono">
                    {problem.operands[0]} + {problem.operands[1]} = {problem.result}
                  </span>
                </div>
                
                <div className="flex items-center">
                  {userAnswer && (
                    <span className={`font-mono mr-3 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {userAnswer.userAnswer || '-'}
                    </span>
                  )}
                  
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onRestart}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {t('results.tryAgain')}
        </Button>
        
        <Button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t('results.backToHome')} <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Componente auxiliar para las tarjetas de estadísticas
const StatCard: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
}> = ({ label, value, valueColor = 'text-blue-600' }) => (
  <Card className="p-3 text-center">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
  </Card>
);