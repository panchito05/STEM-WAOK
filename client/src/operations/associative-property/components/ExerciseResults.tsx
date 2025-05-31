import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Target, TrendingUp, RotateCcw } from 'lucide-react';
import { AssociativePropertyUserAnswer, ExerciseResult } from '../types';

interface ExerciseResultsProps {
  userAnswersHistory: AssociativePropertyUserAnswer[];
  exerciseStats: {
    score: number;
    totalProblems: number;
    accuracy: number;
    avgTimePerProblem: number;
    avgAttempts: number;
    revealedAnswers: number;
    totalTimeSpent: number;
  };
  onRestart: () => void;
  onGoHome: () => void;
  t: (key: string) => string;
}

const ExerciseResults: React.FC<ExerciseResultsProps> = ({
  userAnswersHistory,
  exerciseStats,
  onRestart,
  onGoHome,
  t
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'text-green-600';
      case 'incorrect': return 'text-red-600';
      case 'skipped': return 'text-blue-600';
      case 'revealed': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'incorrect': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'revealed': return <Target className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { label: 'Excelente', color: 'bg-green-100 text-green-800' };
    if (accuracy >= 80) return { label: 'Muy Bien', color: 'bg-blue-100 text-blue-800' };
    if (accuracy >= 70) return { label: 'Bien', color: 'bg-yellow-100 text-yellow-800' };
    if (accuracy >= 60) return { label: 'Regular', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Necesita Mejorar', color: 'bg-red-100 text-red-800' };
  };

  const performance = getPerformanceLevel(exerciseStats.accuracy);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Resumen Principal */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            ¡Ejercicio Completado!
          </CardTitle>
          <div className="flex justify-center">
            <Badge className={performance.color} variant="secondary">
              {performance.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">
                {exerciseStats.score}
              </div>
              <div className="text-sm text-gray-600">Correctas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {exerciseStats.accuracy}%
              </div>
              <div className="text-sm text-gray-600">Precisión</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {formatTime(exerciseStats.avgTimePerProblem)}
              </div>
              <div className="text-sm text-gray-600">Tiempo/Problema</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {exerciseStats.totalTimeSpent}s
              </div>
              <div className="text-sm text-gray-600">Tiempo Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Detalladas */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estadísticas del Ejercicio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Problemas totales:</span>
              <span className="font-semibold">{exerciseStats.totalProblems}</span>
            </div>
            <div className="flex justify-between">
              <span>Respuestas correctas:</span>
              <span className="font-semibold text-green-600">{exerciseStats.score}</span>
            </div>
            <div className="flex justify-between">
              <span>Respuestas incorrectas:</span>
              <span className="font-semibold text-red-600">
                {exerciseStats.totalProblems - exerciseStats.score}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Intentos promedio:</span>
              <span className="font-semibold">{exerciseStats.avgAttempts}</span>
            </div>
            {exerciseStats.revealedAnswers > 0 && (
              <div className="flex justify-between">
                <span>Respuestas reveladas:</span>
                <span className="font-semibold text-orange-600">{exerciseStats.revealedAnswers}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desglose por Problema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {userAnswersHistory.map((answer, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(answer.status)}
                    <span className="text-sm font-medium">Problema {index + 1}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={getStatusColor(answer.status)}>
                      {answer.status === 'correct' ? 'Correcto' : 
                       answer.status === 'incorrect' ? 'Incorrecto' : 
                       answer.status === 'skipped' ? 'Omitido' : 'Revelado'}
                    </span>
                    <span className="text-gray-500">
                      {answer.timeTaken ? formatTime(answer.timeTaken / 1000) : '-'}
                    </span>
                    <span className="text-gray-500">
                      {answer.attempts} intento{answer.attempts !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onRestart} size="lg" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Repetir Ejercicio
        </Button>
        <Button onClick={onGoHome} variant="outline" size="lg">
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
};

export default ExerciseResults;