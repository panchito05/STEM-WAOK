import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
import { useTranslation } from '@/lib/translation';
import { AdditionProblem } from './types';
import { superRobustNumberComparison } from '@/lib/super-robust-number-comparison';

// Props para el componente verificado
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
  const { t } = useTranslation();
  
  // Referencia al input para enfocar automáticamente
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Estado para la respuesta del usuario
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  // Almacenar una "foto" de los datos visualizados para verificación
  const [visualSnapshot, setVisualSnapshot] = useState<{
    displayedNumbers: number[];
    alignedDigits: string[][];
    expectedSum: number;
    renderedAt: number;
  } | null>(null);
  
  // Referencia para los contenedores de dígitos mostrados
  const displayContainerRef = useRef<HTMLDivElement>(null);
  
  // Preparar los números para visualización
  const numbers = [
    problem.num1, 
    problem.num2, 
    ...(problem.additionalNumbers || [])
  ];
  
  // Calcular la suma esperada manualmente (para verificación)
  const calculatedSum = numbers.reduce((sum, num) => sum + num, 0);
  
  // Convertir números a strings para manipulación de formato
  const numberStrings = numbers.map(num => String(num));
  
  // Encontrar la longitud máxima para alinear dígitos
  const maxLength = Math.max(...numberStrings.map(str => str.length));
  
  // Crear matriz de dígitos alineados a la derecha
  const alignedDigits = numberStrings.map(numStr => {
    const padded = numStr.padStart(maxLength, ' ');
    return padded.split('');
  });
  
  // Enfocar el input al montar el componente
  useEffect(() => {
    if (inputRef.current && !waitingForContinue) {
      inputRef.current.focus();
    }
  }, [waitingForContinue]);
  
  // Crear snapshot visual cuando se monta el componente
  useEffect(() => {
    console.log('[VERIFIED-COMPONENT] Creando snapshot visual para verificación');
    
    // Capturar los números exactamente como se visualizan
    setTimeout(() => {
      if (displayContainerRef.current) {
        // Intentar capturar los elementos numéricos visualizados
        const numberRows = displayContainerRef.current.querySelectorAll('.number-row');
        const capturedDigits: string[][] = [];
        
        numberRows.forEach(row => {
          const digits = Array.from(row.querySelectorAll('.digit-cell'))
            .map(cell => (cell as HTMLElement).innerText.trim() || ' ');
          
          if (digits.length > 0) {
            capturedDigits.push(digits);
          }
        });
        
        // Reconstruir los números a partir de los dígitos capturados
        const reconstructedNumbers = capturedDigits.map(digits => {
          // Filtrar espacios y unir los dígitos
          const numStr = digits.join('').trim();
          return numStr ? parseFloat(numStr) : 0;
        });
        
        // Calcular la suma esperada de los números reconstruidos
        const visualSum = reconstructedNumbers.reduce((sum, num) => sum + num, 0);
        
        setVisualSnapshot({
          displayedNumbers: reconstructedNumbers,
          alignedDigits: capturedDigits,
          expectedSum: visualSum,
          renderedAt: Date.now()
        });
        
        console.log('[VERIFIED-COMPONENT] Snapshot visual creado:', {
          displayedNumbers: reconstructedNumbers,
          calculatedSum: visualSum,
          expectedSum: calculatedSum,
          match: Math.abs(visualSum - calculatedSum) < 0.001
        });
      }
    }, 50);
  }, [problem, calculatedSum]);
  
  // Manejar cambios en la respuesta
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permitir solo dígitos, punto decimal y un solo signo menos al principio
    const isValid = /^-?\d*\.?\d*$/.test(value);
    
    if (value === '' || isValid) {
      setUserAnswer(value);
    }
  };
  
  // Versión super robusta de handleSubmit
  const handleSubmit = () => {
    if (waitingForContinue) return;
    
    const parsedAnswer = parseFloat(userAnswer);
    if (isNaN(parsedAnswer)) {
      onSubmit(0);
      return;
    }
    
    console.log('[VERIFIED-COMPONENT] Verificando respuesta:', parsedAnswer);
    
    // Opciones para la respuesta correcta
    const options = [
      problem.correctAnswer, // Valor almacenado originalmente
      calculatedSum,         // Calculado en tiempo real
    ];
    
    // Añadir la suma de la representación visual si está disponible
    if (visualSnapshot) {
      options.push(visualSnapshot.expectedSum);
    }
    
    console.log('[VERIFIED-COMPONENT] Posibles respuestas correctas:', options);
    
    // Comprobar si la respuesta coincide con alguna de las opciones
    // usando nuestra función super robusta
    const isCorrect = options.some(option => 
      superRobustNumberComparison(parsedAnswer, option)
    );
    
    if (isCorrect) {
      console.log('[VERIFIED-COMPONENT] Respuesta CORRECTA - Enviando respuesta correcta almacenada');
      onSubmit(problem.correctAnswer);
    } else {
      console.log('[VERIFIED-COMPONENT] Respuesta INCORRECTA - Enviando respuesta del usuario');
      onSubmit(parsedAnswer);
    }
  };
  
  // Procesar tecla Enter para enviar respuesta
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  // Obtener el color de fondo según el nivel de dificultad
  const getDifficultyColor = () => {
    switch (difficultyLevel) {
      case "beginner": return "bg-blue-50 border-blue-300";
      case "elementary": return "bg-emerald-50 border-emerald-300";
      case "intermediate": return "bg-orange-50 border-orange-300";
      case "advanced": return "bg-purple-50 border-purple-300";
      case "expert": return "bg-indigo-50 border-indigo-300";
      default: return "bg-gray-50 border-gray-300";
    }
  };
  
  // Color del texto según dificultad
  const getDifficultyTextColor = () => {
    switch (difficultyLevel) {
      case "beginner": return "text-blue-700";
      case "elementary": return "text-emerald-700";
      case "intermediate": return "text-orange-700";
      case "advanced": return "text-purple-700";
      case "expert": return "text-indigo-700";
      default: return "text-gray-700";
    }
  };
  
  // Crear un ID para debugging
  const exerciseId = useRef(`${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  
  return (
    <div className="flex flex-col items-center">
      <div className={`p-6 rounded-xl ${getDifficultyColor()} shadow-sm mb-6 max-w-sm`}>
        {/* Contenedor principal para el formato multi-vertical */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-2 text-xl font-medium" ref={displayContainerRef}>
            {/* Mostrar los múltiples números apilados con ids para debugging */}
            {alignedDigits.map((digits, numIndex) => (
              <div 
                key={`num-${numIndex}`} 
                className={`number-row flex justify-end space-x-2 ${
                  numIndex === numbers.length - 1 ? 'border-b-2 border-gray-400 pb-1' : ''
                }`}
                data-number-value={numbers[numIndex]}
                data-row-index={numIndex}
                data-exercise-id={exerciseId.current}
              >
                {/* Mostrar signo más para todos excepto el primero */}
                {numIndex !== 0 && (
                  <div className={`w-8 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>
                    +
                  </div>
                )}
                
                {/* Mostrar los dígitos del número actual */}
                {digits.map((digit, digitIndex) => (
                  <div 
                    key={`num${numIndex}-digit${digitIndex}`} 
                    className={`digit-cell w-8 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                    data-digit-index={digitIndex}
                    data-digit-value={digit}
                    data-number-index={numIndex}
                  >
                    {digit === ' ' ? '' : digit}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Input para la respuesta */}
            <div className="flex justify-end mt-2">
              <Input
                type="text"
                className={`w-full text-right py-2 px-4 text-xl ${
                  waitingForContinue ? getDifficultyColor() : 'bg-white'
                }`}
                value={userAnswer}
                onChange={handleAnswerChange}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                disabled={waitingForContinue}
                readOnly={waitingForContinue}
                placeholder="Escribe tu respuesta..."
                data-expected-answer={calculatedSum}
                data-exercise-id={exerciseId.current}
              />
            </div>
          </div>
        </div>
        
        {/* Botones de control */}
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={handleSubmit}
            disabled={waitingForContinue}
            className="px-6"
          >
            {t('exercises.check')}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {/* Datos ocultos para debugging - no visibles pero disponibles en el DOM */}
        <div className="debug-data" style={{ display: 'none' }}>
          <div data-original-numbers={JSON.stringify(numbers)}></div>
          <div data-calculated-sum={calculatedSum}></div>
          <div data-problem-correct-answer={problem.correctAnswer}></div>
          <div data-exercise-id={exerciseId.current}></div>
          {visualSnapshot && (
            <div data-visual-snapshot={JSON.stringify(visualSnapshot)}></div>
          )}
        </div>
      </div>
    </div>
  );
}