import React, { useState, useEffect, useRef } from 'react';
import { AdditionProblem } from './types';
import { superRobustNumberComparison } from '@/lib/super-robust-number-comparison';

interface UltraReliableMultiVerticalDisplayProps {
  problem: AdditionProblem;
  onDataVerified?: (isVerified: boolean, displayedSum: number) => void;
}

/**
 * Componente ultra-confiable para mostrar problemas multi-verticales
 * con verificación continua y reconstrucción segura
 */
export function UltraReliableMultiVerticalDisplay({ 
  problem,
  onDataVerified 
}: UltraReliableMultiVerticalDisplayProps) {
  // Identificador único para este componente
  const instanceId = useRef(`display_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  
  // Referencia al contenedor principal para verificación DOM
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estado para seguimiento de verificación
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    lastChecked: number;
    displayedSum: number;
    reconstructedNumbers: number[];
  }>({
    verified: false,
    lastChecked: 0,
    displayedSum: 0,
    reconstructedNumbers: []
  });
  
  // Obtener los números del problema
  const numbers = [
    problem.num1, 
    problem.num2, 
    ...(problem.additionalNumbers || [])
  ];
  
  // Calcular la suma esperada para verificación
  const expectedSum = numbers.reduce((sum, num) => sum + num, 0);
  
  // Convertir números a strings para manipulación de formato
  const numberStrings = numbers.map(num => String(num));
  
  // Encontrar la longitud máxima para alinear dígitos
  const maxLength = Math.max(...numberStrings.map(str => str.length));
  
  // Crear matriz de dígitos alineados a la derecha
  const alignedDigits = numberStrings.map(numStr => {
    const padded = numStr.padStart(maxLength, ' ');
    return padded.split('');
  });
  
  // Valor de backup para correctAnswer
  const correctAnswerBackup = useRef(problem.correctAnswer);
  
  // Intentar modificar el obj del problema para detectar mutaciones
  useEffect(() => {
    // Almacenar una copia segura del correctAnswer original
    correctAnswerBackup.current = problem.correctAnswer;
    
    // Crear un objeto frozen como copia inmutable
    const frozenProblem = Object.freeze({...problem});
    
    // Comprobación periódica de posibles modificaciones del objeto
    const mutationCheckInterval = setInterval(() => {
      const currentAnswer = problem.correctAnswer;
      const storedAnswer = correctAnswerBackup.current;
      
      // Si detectamos una modificación, restaurar desde backup
      if (currentAnswer !== storedAnswer) {
        console.warn(`[ULTRA-RELIABLE] Detectada modificación no autorizada de la respuesta correcta: 
          Original=${storedAnswer}, Modificada=${currentAnswer}. Restaurando...`);
        
        // Intentar restaurar (puede no funcionar si el objeto es inmutable)
        try {
          (problem as any).correctAnswer = storedAnswer;
        } catch (e) {
          console.error('[ULTRA-RELIABLE] No se pudo restaurar la respuesta correcta:', e);
        }
      }
    }, 500);
    
    return () => clearInterval(mutationCheckInterval);
  }, [problem]);
  
  // Sistema de verificación visual
  useEffect(() => {
    // Solo verificar si hay un callback para reportar resultados
    if (!onDataVerified) return;
    
    // Función para verificar lo que se muestra en pantalla
    const verifyVisualRepresentation = () => {
      if (!containerRef.current) return;
      
      try {
        // Obtener todas las filas de números
        const numberRows = containerRef.current.querySelectorAll('.number-row');
        
        // Reconstruir los números a partir del DOM
        const reconstructedNumbers: number[] = [];
        
        numberRows.forEach(row => {
          // Obtener todos los dígitos de esta fila
          const digitCells = row.querySelectorAll('.digit-cell');
          const digits: string[] = [];
          
          digitCells.forEach((cell) => {
            const digitText = (cell as HTMLElement).innerText.trim();
            digits.push(digitText || '0');
          });
          
          // Reconstruir el número a partir de los dígitos
          const numStr = digits.join('').trim().replace(/\s+/g, '');
          const parsedNum = numStr ? parseFloat(numStr) : 0;
          
          if (!isNaN(parsedNum)) {
            reconstructedNumbers.push(parsedNum);
          }
        });
        
        // Calcular la suma de los números reconstruidos
        const displayedSum = reconstructedNumbers.reduce((sum, num) => sum + num, 0);
        
        // Verificar si lo que se muestra coincide con lo que se espera
        let allMatch = reconstructedNumbers.length === numbers.length;
        
        if (allMatch) {
          for (let i = 0; i < numbers.length; i++) {
            if (!superRobustNumberComparison(reconstructedNumbers[i], numbers[i])) {
              allMatch = false;
              break;
            }
          }
        }
        
        // Verificar también la suma total
        const sumMatch = superRobustNumberComparison(displayedSum, expectedSum);
        
        // Verificación final: números individuales o al menos la suma debe coincidir
        const isVerified = allMatch || sumMatch;
        
        // Actualizar estado de verificación
        setVerificationStatus({
          verified: isVerified,
          lastChecked: Date.now(),
          displayedSum,
          reconstructedNumbers
        });
        
        // Reportar resultado de verificación
        onDataVerified(isVerified, displayedSum);
        
        console.log(`[ULTRA-RELIABLE] Verificación visual: ${isVerified ? 'EXITOSA' : 'FALLIDA'}`);
        console.log('[ULTRA-RELIABLE] Detalles de verificación:', {
          expectedNumbers: numbers,
          reconstructedNumbers,
          expectedSum,
          displayedSum,
          allMatch,
          sumMatch
        });
      } catch (error) {
        console.error('[ULTRA-RELIABLE] Error en verificación visual:', error);
        onDataVerified(false, 0);
      }
    };
    
    // Verificar después de un breve retraso para asegurar renderizado
    const initialTimeout = setTimeout(() => {
      verifyVisualRepresentation();
      
      // Configurar verificación periódica
      const verificationIntervalId = setInterval(verifyVisualRepresentation, 1000);
      
      // Limpiar intervalo cuando el componente se desmonte
      return () => clearInterval(verificationIntervalId);
    }, 100);
    
    // Limpiar timeout si el componente se desmonta antes
    return () => clearTimeout(initialTimeout);
  }, [numbers, expectedSum, onDataVerified]);
  
  return (
    <div 
      className="ultra-reliable-display"
      ref={containerRef}
      data-instance-id={instanceId.current}
      data-expected-sum={expectedSum}
      data-verified={verificationStatus.verified.toString()}
    >
      <div className="grid grid-cols-1 gap-2 text-xl font-medium">
        {/* Mostrar los múltiples números apilados */}
        {alignedDigits.map((digits, numIndex) => (
          <div 
            key={`num-${numIndex}`}
            className={`number-row flex justify-end space-x-2 ${
              numIndex === numbers.length - 1 ? 'border-b-2 border-gray-400 pb-1' : ''
            }`}
            data-number-index={numIndex}
            data-number-value={numbers[numIndex]}
          >
            {/* Mostrar signo más para todos excepto el primero */}
            {numIndex !== 0 && (
              <div className="w-8 h-10 flex items-center justify-center text-gray-700">
                +
              </div>
            )}
            
            {/* Mostrar los dígitos del número actual */}
            {digits.map((digit, digitIndex) => (
              <div 
                key={`num${numIndex}-digit${digitIndex}`}
                className="digit-cell w-8 h-10 flex items-center justify-center text-gray-700"
                data-digit-index={digitIndex}
                data-digit-value={digit}
              >
                {digit === ' ' ? '' : digit}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Datos ocultos para debugging y verificación - no visibles pero disponibles en el DOM */}
      <div className="debug-data" style={{ display: 'none' }}>
        <div data-original-numbers={JSON.stringify(numbers)}></div>
        <div data-expected-sum={expectedSum}></div>
        <div data-correct-answer={problem.correctAnswer}></div>
        <div data-instance-id={instanceId.current}></div>
        <div data-verification-status={JSON.stringify(verificationStatus)}></div>
      </div>
    </div>
  );
}