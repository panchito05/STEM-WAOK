// ResultsBoard.tsx - Muestra los resultados al finalizar un ejercicio
import React from 'react';
import { UserAnswer, Problem, DifficultyLevel } from '../types';
import { CheckCircle, XCircle, Clock, Award, BarChart3, TrendingUp } from 'lucide-react';

interface ResultsBoardProps {
  userAnswersHistory: UserAnswer[];
  problemsList: Problem[];
  finalScore: number;
  timer: number;
  finalLevel: DifficultyLevel;
  revealedAnswers: number;
  avgTimePerProblem: number;
  avgAttemptsValue: number;
}

const ResultsBoard: React.FC<ResultsBoardProps> = ({
  userAnswersHistory,
  problemsList,
  finalScore,
  timer,
  finalLevel,
  revealedAnswers,
  avgTimePerProblem,
  avgAttemptsValue
}) => {
  // Calcular la precisión
  const accuracy = Math.round((finalScore / problemsList.length) * 100);
  
  return (
    <div className="results-board py-4">
      <h2 className="text-2xl font-bold text-center mb-6">¡Ejercicio Completado!</h2>
      
      {/* Puntuación Principal */}
      <div className="score-display flex items-center justify-center mb-6">
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
          <div className="text-gray-600 text-sm mb-1">Puntuación Final</div>
          <div className="text-4xl font-bold text-green-600">
            {finalScore} <span className="text-gray-400 text-xl">/ {problemsList.length}</span>
          </div>
        </div>
      </div>
      
      {/* Estadísticas del Ejercicio */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg shadow-sm text-center border border-blue-100">
          <div className="text-sm text-gray-600 mb-1 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 mr-1" />
            <span>Precisión</span>
          </div>
          <div className="text-xl text-blue-600 font-semibold">{accuracy}%</div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg shadow-sm text-center border border-purple-100">
          <div className="text-sm text-gray-600 mb-1 flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Tiempo</span>
          </div>
          <div className="text-xl text-purple-600 font-semibold">{Math.round(timer)}s</div>
        </div>
        
        <div className="bg-amber-50 p-3 rounded-lg shadow-sm text-center border border-amber-100">
          <div className="text-sm text-gray-600 mb-1 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>Intentos</span>
          </div>
          <div className="text-xl text-amber-600 font-semibold">{avgAttemptsValue.toFixed(1)}</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg shadow-sm text-center border border-red-100">
          <div className="text-sm text-gray-600 mb-1">Reveladas</div>
          <div className="text-xl text-red-600 font-semibold">{revealedAnswers}</div>
        </div>
        
        <div className="bg-teal-50 p-3 rounded-lg shadow-sm text-center border border-teal-100">
          <div className="text-sm text-gray-600 mb-1">Nivel Final</div>
          <div className="text-xl text-teal-600 font-semibold">{finalLevel === "beginner" ? "1" :
                                                      finalLevel === "elementary" ? "2" :
                                                      finalLevel === "intermediate" ? "3" :
                                                      finalLevel === "advanced" ? "4" : "5"}</div>
        </div>
        
        <div className="bg-indigo-50 p-3 rounded-lg shadow-sm text-center border border-indigo-100">
          <div className="text-sm text-gray-600 mb-1">Tiempo/Prob</div>
          <div className="text-xl text-indigo-600 font-semibold">{avgTimePerProblem}s</div>
        </div>
      </div>
      
      {/* Resumen de Problemas */}
      <div className="problem-summary">
        <h3 className="text-lg font-semibold mb-3">Resumen de Problemas</h3>
        <div className="space-y-2">
          {userAnswersHistory.map((answer, index) => {
            if (!answer) return null;
            
            const problem = problemsList[index];
            if (!problem) return null;
            
            const operands = problem.operands || [];
            
            return (
              <div 
                key={`summary-${index}`} 
                className={`p-3 rounded-lg flex justify-between items-center ${
                  answer.isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                }`}
              >
                <div>
                  <span className="font-medium">{operands[0]} + {operands[1]}</span>
                  <span className="mx-2">=</span>
                  <span className="font-bold">{problem.correctAnswer}</span>
                  
                  {!answer.isCorrect && answer.userAnswer && (
                    <span className="text-red-600 ml-3">({answer.userAnswer})</span>
                  )}
                  
                  {answer.attempts && answer.attempts > 1 && (
                    <span className="text-gray-500 text-xs ml-2">
                      {answer.attempts} intentos
                    </span>
                  )}
                </div>
                
                <div>
                  {answer.isCorrect 
                    ? <CheckCircle className="h-5 w-5 text-green-600" /> 
                    : <XCircle className="h-5 w-5 text-red-600" />
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultsBoard;