import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  Home, 
  RefreshCw,
  Save
} from 'lucide-react';
import { Problem, UserAnswer, DifficultyLevel } from '../types';
import { formatTime } from '@/utils/formatTime';

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
export const ResultsBoard: React.FC<ResultsBoardProps> = ({
  score,
  totalProblems,
  userAnswers,
  difficulty,
  timeSpent,
  onRetry,
  onHome
}) => {
  // Logs para diagnóstico
  console.log('ResultsBoard - Datos recibidos:', {
    scoreRecibido: score,
    totalProblemsRecibido: totalProblems,
    userAnswersLength: userAnswers.length,
    dificultad: difficulty
  });
  
  // Verificar que el score no sea mayor que totalProblems
  const validScore = Math.min(score, totalProblems);
  
  // Asegurar que totalProblems refleje el número real de problemas
  const actualTotalProblems = userAnswers.length;
  
  // Usar el máximo entre totalProblems y actualTotalProblems para asegurar precisión
  const finalTotalProblems = Math.max(totalProblems, actualTotalProblems);
  
  // Más logs para diagnóstico después del cálculo
  console.log('ResultsBoard - Valores calculados:', {
    validScore,
    actualTotalProblems,
    finalTotalProblems
  });
  
  // Calcular porcentaje de aciertos con valores corregidos
  const percentage = Math.round((validScore / finalTotalProblems) * 100);
  
  // Guardar los resultados en el almacenamiento local
  useEffect(() => {
    // Crear un objeto con los datos del resultado
    const resultData = {
      module: 'addition',
      date: new Date().toISOString(),
      score: validScore,
      totalProblems: finalTotalProblems,
      percentage,
      difficulty,
      timeSpent,
      userAnswers: userAnswers.map(answer => ({
        problemId: answer.problemId,
        problemText: renderProblemText(answer.problem),
        userAnswer: answer.userAnswer,
        correctAnswer: answer.problem.correctAnswer,
        isCorrect: answer.isCorrect,
        status: answer.status,
        attempts: answer.attempts
      }))
    };
    
    // Obtener los resultados anteriores del localStorage
    const storedResults = localStorage.getItem('math_results');
    const allResults = storedResults ? JSON.parse(storedResults) : [];
    
    // Añadir el nuevo resultado
    allResults.push(resultData);
    
    // Guardar la lista actualizada en localStorage
    localStorage.setItem('math_results', JSON.stringify(allResults));
    
    console.log('Resultados guardados localmente:', resultData);
  }, []);
  
  // Determinar color basado en el porcentaje
  const getColorClass = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Determinar mensaje según el desempeño
  const getMessage = () => {
    if (percentage >= 80) return '¡Excelente trabajo!';
    if (percentage >= 60) return '¡Buen trabajo!';
    if (percentage >= 40) return 'Sigue practicando.';
    return 'Necesitas más práctica.';
  };
  
  // Convertir nivel de dificultad a texto en español
  const getDifficultyText = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Medio';
      case 'hard': return 'Difícil';
      case 'expert': return 'Experto';
      default: return 'Desconocido';
    }
  };
  
  // Obtener color para el badge de dificultad
  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Renderizar el texto del problema
  function renderProblemText(problem: Problem): string {
    // Formato de visualización del problema
    switch (problem.displayFormat) {
      case 'horizontal':
        return problem.operands.map(op => op.value).join(' + ') + ' = ' + problem.correctAnswer;
        
      case 'vertical':
        return problem.operands.map(op => op.value).join(' + ') + ' = ' + problem.correctAnswer;
        
      case 'word':
        const label = problem.operands[0].label || 'elementos';
        const description = problem.operands.map(op => `${op.value} ${label}`).join(' y ');
        return `Si tienes ${description}, ¿cuántos ${label} tienes en total?`;
        
      default:
        return problem.operands.map(op => op.value).join(' + ') + ' = ' + problem.correctAnswer;
    }
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Resultados del Ejercicio
        </CardTitle>
        <CardDescription className="text-center">
          Has completado el ejercicio de suma
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumen principal */}
        <div className="flex flex-col sm:flex-row justify-around items-center gap-4 pb-4 border-b">
          <div className="text-center">
            <div className={`text-5xl font-bold ${getColorClass()}`}>
              {percentage}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Puntuación</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-semibold">
              {validScore} / {finalTotalProblems}
            </div>
            <div className="text-sm text-gray-500 mt-1">Problemas correctos</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-semibold flex items-center justify-center">
              <Clock className="mr-1 h-5 w-5" />
              {formatTime(timeSpent)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Tiempo total</div>
          </div>
        </div>
        
        {/* Mensaje motivacional */}
        <div className="text-center py-3 bg-gray-50 rounded-lg">
          <div className="flex justify-center mb-2">
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-semibold">{getMessage()}</h3>
          <p className="text-gray-600 mt-1">
            Completaste el ejercicio en nivel <Badge className={getDifficultyColor(difficulty)}>{getDifficultyText(difficulty)}</Badge>
          </p>
        </div>
        
        {/* Detalles de problemas */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Resumen de Problemas</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {userAnswers.map((answer, index) => (
              <div 
                key={answer.problemId} 
                className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <span className="text-gray-500 w-6 text-center">{index + 1}.</span>
                  <span className="ml-2">{renderProblemText(answer.problem)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{answer.userAnswer !== null ? answer.userAnswer : '—'}</span>
                  {answer.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center gap-4 pt-4">
        <Button 
          variant="outline" 
          onClick={onHome}
          className="flex items-center"
        >
          <Home className="mr-2 h-4 w-4" />
          Inicio
        </Button>
        <Button 
          onClick={onRetry}
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </CardFooter>
    </Card>
  );
};