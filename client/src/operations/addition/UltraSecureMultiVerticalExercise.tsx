import React, { useState, useEffect, useMemo } from 'react';
import { AdditionProblem } from './types';
import { VerifiedMultiVerticalExercise } from './VerifiedMultiVerticalExercise';
import { FrozenProblemProvider } from '@/lib/frozen-problem-system';
import { ActionQueueProvider } from '@/lib/action-queue-system';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { superRobustNumberComparison } from '@/lib/super-robust-number-comparison';

interface UltraSecureMultiVerticalExerciseProps {
  problem: AdditionProblem;
  onCorrect: () => void;
  onIncorrect: () => void;
  difficultyLevel: string;
}

/**
 * Componente ultra-seguro para ejercicios multi-verticales
 * Implementa múltiples capas de seguridad:
 * 1. Congelamiento de problema (frozen-problem-system)
 * 2. Cola de acciones sincronizada (action-queue-system)
 * 3. Comparación super robusta (super-robust-number-comparison)
 * 4. Verificación visual continua (UltraReliableMultiVerticalDisplay)
 * 5. Sistema de redundancia y validación triple (VerifiedMultiVerticalExercise)
 */
export function UltraSecureMultiVerticalExercise({
  problem,
  onCorrect,
  onIncorrect,
  difficultyLevel
}: UltraSecureMultiVerticalExerciseProps) {
  // Estados del ejercicio
  const [answer, setAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generar un ID único para este problema
  const problemId = useMemo(() => {
    return `problem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }, [problem]);
  
  // Manejar envío de respuesta
  const handleSubmit = (submittedAnswer: number) => {
    try {
      // Guardar la respuesta
      setAnswer(submittedAnswer);
      
      // Calcular la suma correcta con múltiples métodos
      const numbers = [
        problem.num1, 
        problem.num2, 
        ...(problem.additionalNumbers || [])
      ];
      
      const calculatedSum = numbers.reduce((sum, num) => sum + num, 0);
      const storedAnswer = problem.correctAnswer;
      
      // Verificar usando comparación super robusta
      const isAnswerCorrect = superRobustNumberComparison(submittedAnswer, calculatedSum) || 
                              superRobustNumberComparison(submittedAnswer, storedAnswer);
      
      // Actualizar estado
      setIsCorrect(isAnswerCorrect);
      setWaitingForContinue(true);
      
      // Invocar callbacks según resultado
      if (isAnswerCorrect) {
        onCorrect();
      } else {
        onIncorrect();
      }
    } catch (err) {
      console.error('[ULTRA-SECURE] Error procesando respuesta:', err);
      setError('Ocurrió un error al procesar tu respuesta. Por favor, inténtalo de nuevo.');
      setWaitingForContinue(true);
      onIncorrect();
    }
  };
  
  // Limpiar error cuando cambia el problema
  useEffect(() => {
    setError(null);
    setIsCorrect(null);
    setAnswer(null);
    setWaitingForContinue(false);
  }, [problem]);
  
  return (
    <div
      className="ultra-secure-exercise relative"
      data-problem-id={problemId}
      data-difficulty={difficultyLevel}
    >
      {/* Capas de seguridad - Providers anidados */}
      <FrozenProblemProvider>
        <ActionQueueProvider>
          {/* Componente principal de ejercicio verificado */}
          <VerifiedMultiVerticalExercise
            problem={problem}
            onSubmit={handleSubmit}
            waitingForContinue={waitingForContinue}
            difficultyLevel={difficultyLevel}
          />
          
          {/* Mostrar resultado después de enviar respuesta */}
          {waitingForContinue && isCorrect !== null && (
            <div className="mt-4">
              {isCorrect ? (
                <Alert className="bg-green-50 border-green-500">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <AlertTitle className="text-green-700">¡Correcto!</AlertTitle>
                  <AlertDescription className="text-green-600">
                    {answer} es la respuesta correcta. ¡Buen trabajo!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-red-50 border-red-500">
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  <AlertTitle className="text-red-700">¡Incorrecto!</AlertTitle>
                  <AlertDescription className="text-red-600">
                    La respuesta correcta es {problem.correctAnswer}.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Mostrar error si ocurre */}
          {error && (
            <Alert className="mt-4 bg-orange-50 border-orange-500">
              <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
              <AlertTitle className="text-orange-700">Error</AlertTitle>
              <AlertDescription className="text-orange-600">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </ActionQueueProvider>
      </FrozenProblemProvider>
      
      {/* Datos ocultos para debugging y verificación - no visibles pero disponibles en el DOM */}
      <div className="debug-data" style={{ display: 'none' }}>
        <div data-problem-id={problemId}></div>
        <div data-problem-num1={problem.num1}></div>
        <div data-problem-num2={problem.num2}></div>
        <div data-problem-correct-answer={problem.correctAnswer}></div>
        <div data-submitted-answer={answer || ''}></div>
        <div data-is-correct={isCorrect === null ? '' : isCorrect.toString()}></div>
      </div>
    </div>
  );
}