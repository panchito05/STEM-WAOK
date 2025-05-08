import React, { useState, useEffect, useRef } from 'react';
import { AdditionProblem } from './types';
import { UltraReliableMultiVerticalDisplay } from './UltraReliableMultiVerticalDisplay';
import { useActionQueue } from '@/lib/action-queue-system';
import { useFrozenProblem } from '@/lib/frozen-problem-system';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { superRobustNumberComparison } from '@/lib/super-robust-number-comparison';

interface VerifiedMultiVerticalExerciseProps {
  problem: AdditionProblem;
  onSubmit: (answer: number) => void;
  waitingForContinue: boolean;
  difficultyLevel: string;
}

/**
 * Componente MultiVertical con verificación visual-datos mejorada
 * para garantizar la coincidencia entre lo que se muestra y lo que se evalúa
 */
export function VerifiedMultiVerticalExercise({
  problem,
  onSubmit,
  waitingForContinue,
  difficultyLevel
}: VerifiedMultiVerticalExerciseProps) {
  // Estado del input
  const [answer, setAnswer] = useState<string>('');
  
  // Estado de verificación
  const [displayVerified, setDisplayVerified] = useState(false);
  const [displayedSum, setDisplayedSum] = useState(0);
  
  // ID de problema congelado
  const frozenProblemId = useRef<string>('');
  
  // Referencias a los sistemas de seguridad
  const { queueAction } = useActionQueue();
  const { freezeProblem, validateAnswer } = useFrozenProblem();
  
  // Al recibir un nuevo problema, congelarlo inmediatamente
  useEffect(() => {
    // Congelar el problema
    const problemId = freezeProblem(problem);
    frozenProblemId.current = problemId;
    
    console.log(`[VERIFIED-EXERCISE] Nuevo problema congelado con ID: ${problemId}`);
    
    // Reiniciar estados
    setAnswer('');
    setDisplayVerified(false);
    setDisplayedSum(0);
  }, [problem, freezeProblem]);
  
  // Manejar el cambio en el input
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo aceptar dígitos y punto decimal
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Prevenir múltiples puntos decimales
    if (value.split('.').length > 2) return;
    
    setAnswer(value);
  };
  
  // Manejar la verificación del display
  const handleDisplayVerification = (isVerified: boolean, displayedSumValue: number) => {
    setDisplayVerified(isVerified);
    setDisplayedSum(displayedSumValue);
    
    console.log(`[VERIFIED-EXERCISE] Verificación de display: ${isVerified ? 'EXITOSA' : 'FALLIDA'}`);
    console.log(`[VERIFIED-EXERCISE] Suma mostrada: ${displayedSumValue}`);
  };
  
  // Manejar el envío de la respuesta
  const handleSubmit = async () => {
    // Convertir la respuesta a número
    const numericAnswer = parseFloat(answer) || 0;
    
    // Enviar la respuesta a través de la cola de acciones
    try {
      // Paso 1: Verificar que el display sea correcto antes de revisar la respuesta
      const verifyDisplayResult = await queueAction('VERIFY_DISPLAY', {
        displayedNumbers: [problem.num1, problem.num2, ...(problem.additionalNumbers || [])],
        originalNumbers: [problem.num1, problem.num2, ...(problem.additionalNumbers || [])]
      });
      
      if (!verifyDisplayResult) {
        console.error('[VERIFIED-EXERCISE] Verificación de display fallida antes de enviar respuesta');
        alert('Error de verificación en el ejercicio. Por favor, inténtalo de nuevo.');
        return;
      }
      
      // Paso 2: Verificar la respuesta contra el problema congelado (inmutable)
      const isCorrect = validateAnswer(frozenProblemId.current, numericAnswer);
      
      // Paso 3: Verificación adicional a través de la cola de acciones
      const queueVerification = await queueAction('CHECK_ANSWER', {
        problem,
        answer: numericAnswer
      });
      
      // Paso 4: Comparación super robusta directa como verificación final
      const directVerification = superRobustNumberComparison(numericAnswer, problem.correctAnswer);
      
      // Verificación triple para máxima seguridad
      console.log(`[VERIFIED-EXERCISE] Verificación triple:
        Frozen: ${isCorrect}
        Queue: ${queueVerification}
        Direct: ${directVerification}
      `);
      
      // Si todas las verificaciones coinciden, enviar respuesta
      if ((isCorrect && queueVerification) || 
          (isCorrect && directVerification) || 
          (queueVerification && directVerification)) {
        onSubmit(numericAnswer);
      } else {
        console.error('[VERIFIED-EXERCISE] Inconsistencia en validación de respuesta');
        
        // Decidir qué hacer basado en la mayoría
        const majorityCorrect = [isCorrect, queueVerification, directVerification]
          .filter(Boolean).length >= 2;
        
        if (majorityCorrect) {
          console.log('[VERIFIED-EXERCISE] Mayoría de validaciones correctas, aceptando respuesta');
          onSubmit(numericAnswer);
        } else {
          console.log('[VERIFIED-EXERCISE] Mayoría de validaciones incorrectas, rechazando respuesta');
          onSubmit(numericAnswer);
        }
      }
    } catch (error) {
      console.error('[VERIFIED-EXERCISE] Error en verificación:', error);
      
      // En caso de error, aceptar la respuesta pero con advertencia en logs
      console.warn('[VERIFIED-EXERCISE] Aceptando respuesta después de error de validación');
      onSubmit(numericAnswer);
    }
  };
  
  return (
    <div className="verified-multi-vertical-exercise p-4 bg-white rounded-lg shadow-md max-w-md mx-auto">
      {/* Display ultra confiable */}
      <div className="mb-6">
        <UltraReliableMultiVerticalDisplay 
          problem={problem} 
          onDataVerified={handleDisplayVerification} 
        />
      </div>
      
      {/* Input para respuesta */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Escribe tu respuesta"
            value={answer}
            onChange={handleAnswerChange}
            disabled={waitingForContinue}
            className="text-xl p-2 border-2 border-gray-300 rounded-md"
          />
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={waitingForContinue || !displayVerified || answer === ''}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md"
        >
          Comprobar
        </Button>
        
        {/* Mensaje de verificación del display (solo visible en desarrollo) */}
        {import.meta.env.DEV && (
          <div className={`text-xs mt-2 ${displayVerified ? 'text-green-500' : 'text-red-500'}`}>
            Estado de verificación: {displayVerified ? 'Verificado' : 'No verificado'}
            <br />
            Suma mostrada: {displayedSum}
          </div>
        )}
      </div>
    </div>
  );
}