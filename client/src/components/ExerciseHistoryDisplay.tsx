import React from 'react';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';

// Tipos para el historial de ejercicios
export interface ExerciseHistoryItem {
  id?: number;
  operationId: string;
  date?: string;
  createdAt?: string;
  score: number;
  totalProblems: number;
  timeSpent: number;
  difficulty: string;
  extraData?: any;
  problems?: any[];
}

interface ExerciseHistoryDisplayProps {
  exercise: ExerciseHistoryItem;
}

/**
 * Componente para mostrar los detalles de un ejercicio del historial
 */
const ExerciseHistoryDisplay: React.FC<ExerciseHistoryDisplayProps> = ({ exercise }) => {
  if (!exercise) {
    return (
      <div className="p-3 rounded-md border border-gray-200">
        <p className="text-center text-gray-500 italic">
          No hay ejercicio seleccionado
        </p>
      </div>
    );
  }

  // Obtener problemas del ejercicio
  const getProblems = () => {
    let problems: any[] = [];
    
    try {
      // Primero intentamos extraer de la nueva estructura
      if (exercise.extraData?.problemDetails && Array.isArray(exercise.extraData.problemDetails)) {
        return exercise.extraData.problemDetails;
      }
      
      // Luego verificamos si hay problemas directamente
      if (exercise.problems && Array.isArray(exercise.problems)) {
        return exercise.problems;
      }
      
      // Finalmente buscamos en otras posibles ubicaciones
      if (exercise.extraData?.problems) {
        return exercise.extraData.problems;
      }
      
      if (exercise.extraData?.userAnswers) {
        return exercise.extraData.userAnswers;
      }
    } catch (error) {
      console.error("Error al procesar los problemas:", error);
    }
    
    // Si no hay problemas disponibles, retornamos un array vacío
    return problems;
  };

  const problems = getProblems();

  // Si no hay problemas disponibles, mostrar un mensaje
  if (!problems || problems.length === 0) {
    return (
      <div className="p-3 rounded-md border border-gray-200">
        <p className="text-center text-gray-500 italic">
          Ejercicio de {exercise.operationId === 'addition' ? 'Suma' :
                       exercise.operationId === 'fractions' ? 'Fracciones' :
                       exercise.operationId === 'counting' ? 'Conteo' : 'Matemáticas'} 
          completado con puntuación {exercise.score}/{exercise.totalProblems}
        </p>
        <p className="text-center text-sm text-gray-400 mt-1">
          Los detalles completos no se guardaron para este ejercicio anterior.
        </p>
      </div>
    );
  }

  // Renderizar cada problema con soporte para scroll cuando hay muchos problemas
  return (
    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
      {problems.map((problem, idx) => {
        // Determinar si el problema fue respondido correctamente
        const isCorrect = problem.isCorrect || problem.status === "correct";
        
        // Intentar obtener el texto del problema
        let problemText = null;
        
        if (problem.problem) {
          problemText = problem.problem;
        } else if (problem.displayText) {
          problemText = problem.displayText;
        } else if (problem.operands && problem.operacion) {
          problemText = `${problem.operands.join(' ' + problem.operacion + ' ')} = ${problem.correctAnswer}`;
        } else if (problem.operands && Array.isArray(problem.operands)) {
          problemText = `${problem.operands.join(' + ')} = ${problem.correctAnswer}`;
        }

        if (!problemText && problem.question) {
          problemText = problem.question;
        }

        // Si no hay texto del problema, usar un placeholder
        if (!problemText) {
          problemText = "Problema de matemáticas";
        }

        // Obtener la respuesta del usuario
        let userAnswer = null;
        if (problem.userAnswer !== undefined) {
          userAnswer = problem.userAnswer;
        } else if (problem.userAnswer === null && problem.status === "revealed") {
          userAnswer = "Revelada";
        } else if (problem.status === "timeout") {
          userAnswer = "Tiempo agotado";
        }
        
        // Obtener la respuesta correcta
        let correctAnswer = null;
        if (problem.correctAnswer !== undefined) {
          correctAnswer = problem.correctAnswer;
        } else if (problem.answer !== undefined) {
          correctAnswer = problem.answer;
        }

        return (
          <div key={idx} className={`p-3 rounded-md border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Problema {idx + 1}</span>
              <span>
                {isCorrect ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-red-600" />
                )}
              </span>
            </div>
            <p className="text-lg font-bold mb-2">{problemText}</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <p className="text-xs text-gray-500">Tu respuesta</p>
                <p className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {userAnswer !== null && userAnswer !== undefined ? String(userAnswer) : 'Sin respuesta'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Respuesta correcta</p>
                <p className="font-medium text-blue-600">
                  {correctAnswer !== null ? String(correctAnswer) : 'No disponible'}
                </p>
              </div>
            </div>
            {problem.info && (
              <p className="text-xs text-gray-500 mt-2">
                {problem.info}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseHistoryDisplay;