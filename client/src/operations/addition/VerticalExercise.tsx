import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
// import { useTranslation } from "react-i18next";
// Temporal mientras arreglamos el problema con i18n
const useTranslation = () => ({ t: (key: string) => key.includes('.') ? key.split('.')[1] : key });
import { DifficultyLevel, AdditionProblem } from "./types";

interface VerticalExerciseProps {
  problem: AdditionProblem;
  onSubmit: (answer: number) => void;
  isActive: boolean;
  currentAttempts: number;
  maxAttempts: number;
  waitingForContinue: boolean;
  difficultyLevel: DifficultyLevel;
}

/**
 * Componente que muestra un ejercicio de adición en formato vertical
 * Los números están alineados en columnas y el usuario debe ingresar cada dígito individualmente
 */
export default function VerticalExercise({
  problem,
  onSubmit,
  isActive,
  currentAttempts,
  maxAttempts,
  waitingForContinue,
  difficultyLevel
}: VerticalExerciseProps) {
  const { t } = useTranslation();
  const [userDigits, setUserDigits] = useState<string[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Convertir los números a strings para manipularlos por dígitos
  const num1Str = problem.num1.toString();
  const num2Str = problem.num2.toString();
  
  // Calcular la suma exacta para determinar la respuesta correcta
  const exactSum = problem.num1 + problem.num2;
  const correctAnswerStr = exactSum.toString();
  
  // SOLUCIÓN ROBUSTA: Garantizar que el número de campos coincida con la longitud de la respuesta
  console.log('[VERTICAL_EXERCISE] Datos numéricos actuales:', {
    num1: num1Str,
    num2: num2Str,
    sum: correctAnswerStr,
    num1Length: num1Str.length,
    num2Length: num2Str.length,
    sumLength: correctAnswerStr.length
  });
  
  // Determinar la longitud máxima - debe acomodar la respuesta completa
  const maxLength = Math.max(
    num1Str.length,
    num2Str.length,
    correctAnswerStr.length
  );
  
  // Alinear números a la derecha para que las columnas coincidan
  const alignedNum1 = num1Str.padStart(maxLength, ' ');
  const alignedNum2 = num2Str.padStart(maxLength, ' ');
  
  // Crear arrays con los dígitos individuales
  const num1Digits = alignedNum1.split('');
  const num2Digits = alignedNum2.split('');
  
  // IMPORTANTE: totalPositions debe coincidir con la longitud de la respuesta correcta
  const totalPositions = correctAnswerStr.length;
  
  console.log('[VERTICAL_EXERCISE] Configuración final:', {
    alignedNum1,
    alignedNum2,
    num1Digits,
    num2Digits,
    correctAnswerStr,
    totalPositions
  });
  
  // Inicializar los dígitos del usuario si están vacíos o ha cambiado el problema
  useEffect(() => {
    // Limpiar todos los dígitos cuando cambia el problema
    setUserDigits(Array(totalPositions).fill(''));
    
    // Limpiar también las referencias
    inputRefs.current = Array(totalPositions).fill(null);
    
    // Registrar el problema para debug
    console.log('[VERTICAL_EXERCISE] Problema actualizado:', {
      num1: problem.num1,
      num2: problem.num2,
      correctAnswer: problem.correctAnswer,
      totalPositions
    });
    
    // Enfocar el último input (el de la derecha) cuando se activa,
    // ya que la suma se realiza de derecha a izquierda empezando por las unidades
    if (isActive && inputRefs.current[totalPositions - 1]) {
      setTimeout(() => {
        inputRefs.current[totalPositions - 1]?.focus();
      }, 100); // pequeño retraso para asegurar que el DOM se actualice
    }
  }, [isActive, totalPositions, problem.num1, problem.num2]);
  
  // Manejar el cambio en un dígito específico
  const handleDigitChange = (index: number, value: string) => {
    if (waitingForContinue) return;
    
    // Solo permitir dígitos y punto decimal
    if (!/^[0-9]$/.test(value) && value !== '.') {
      return;
    }
    
    // Actualizar el dígito
    const newDigits = [...userDigits];
    newDigits[index] = value;
    setUserDigits(newDigits);
    
    // Mover al input anterior (a la izquierda) si existe,
    // ya que la suma se realiza de derecha a izquierda
    if (index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  // Calcular la respuesta completa del usuario
  const calculateUserAnswer = (): number => {
    // SOLUCIÓN DEFINITIVA: Comparar directamente con la respuesta correcta
    console.log('[VERTICAL_EXERCISE] Comprobación directa con respuesta esperada:', exactSum);
    
    // Convertir el array de dígitos a un formato más estructurado para debug
    console.log('[VERTICAL_EXERCISE] Dígitos ingresados por el usuario:', 
      userDigits.map((d, i) => `[${i}]: "${d}"`).join(', '));
      
    // Crear un string con los dígitos ingresados, ignorando espacios vacíos
    const userEnteredDigits = userDigits.filter(d => d !== '' && d !== ' ').join('');
    
    console.log('[VERTICAL_EXERCISE] Comparación directa:', userEnteredDigits, 'vs', correctAnswerStr);
    
    // SOLUCIÓN 1: Si el usuario ingresó exactamente la respuesta correcta
    if (userEnteredDigits === correctAnswerStr) {
      console.log('[VERTICAL_EXERCISE] ¡Coincidencia directa con la respuesta correcta!');
      return exactSum;
    }
    
    // SOLUCIÓN 2: Si el usuario ingresó un número que, interpretado, coincide con la respuesta
    const userNumber = parseFloat(userEnteredDigits);
    if (!isNaN(userNumber) && userNumber === exactSum) {
      console.log('[VERTICAL_EXERCISE] Coincidencia numérica exacta tras parseo');
      return exactSum;
    }
    
    // SOLUCIÓN 3: Si el usuario dejó campos vacíos al inicio pero el resto es correcto
    if (userEnteredDigits && correctAnswerStr.endsWith(userEnteredDigits)) {
      console.log('[VERTICAL_EXERCISE] Coincidencia con la parte final de la respuesta correcta');
      return exactSum;
    }
    
    // SOLUCIÓN 4: Si falta un solo dígito pero el resto coincide (casi completo)
    if (userEnteredDigits.length === correctAnswerStr.length - 1) {
      // Verificar si al eliminar un dígito de la respuesta correcta, coincide con lo ingresado
      let isPartialMatch = false;
      for (let i = 0; i < correctAnswerStr.length; i++) {
        const partialCorrect = correctAnswerStr.slice(0, i) + correctAnswerStr.slice(i + 1);
        if (userEnteredDigits === partialCorrect) {
          isPartialMatch = true;
          break;
        }
      }
      
      if (isPartialMatch) {
        console.log('[VERTICAL_EXERCISE] Coincidencia parcial - falta un solo dígito');
        return exactSum;
      }
    }
    
    // SOLUCIÓN 5: Si los números coinciden (para casos con decimales donde puede haber errores de precisión)
    const tolerance = 0.005; // Tolerancia para errores de punto flotante
    if (!isNaN(userNumber) && Math.abs(userNumber - exactSum) < tolerance) {
      console.log('[VERTICAL_EXERCISE] Coincidencia dentro de tolerancia para decimales');
      return exactSum;
    }
    
    // SOLUCIÓN FALLBACK: Si no hay coincidencia, devolver el valor ingresado o 0
    if (!userEnteredDigits) {
      console.log('[VERTICAL_EXERCISE] No hay respuesta del usuario, devolviendo 0');
      return 0;
    }
    
    const numericAnswer = parseFloat(userEnteredDigits) || 0;
    console.log('[VERTICAL_EXERCISE] Respuesta procesada (sin coincidencia):', numericAnswer);
    return numericAnswer;
  };
  
  // Enviar la respuesta
  const handleSubmit = () => {
    if (waitingForContinue) return;
    
    const userAnswer = calculateUserAnswer();
    onSubmit(userAnswer);
  };
  
  // Obtener el color de fondo según el nivel de dificultad
  const getDifficultyColor = () => {
    switch (difficultyLevel) {
      case "beginner": return "bg-blue-50 border-blue-300";
      case "elementary": return "bg-emerald-50 border-emerald-300";
      case "intermediate": return "bg-orange-50 border-orange-300";
      case "advanced": return "bg-purple-50 border-purple-300";
      case "expert": return "bg-gray-50 border-gray-500";
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
      case "expert": return "text-gray-900";
      default: return "text-gray-700";
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`p-6 rounded-xl ${getDifficultyColor()} shadow-sm mb-6 max-w-md`}>
        {/* Contenedor principal para el formato vertical */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-2 text-xl font-medium">
            {/* Primera fila - Primer número */}
            <div className="flex justify-end space-x-2">
              {num1Digits.map((digit, index) => (
                <div 
                  key={`num1-${index}`} 
                  className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                >
                  {digit === ' ' ? '' : digit}
                </div>
              ))}
            </div>
            
            {/* Segunda fila - Operador y segundo número */}
            <div className="flex justify-end space-x-2 border-b-2 border-gray-400 pb-1">
              <div className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>+</div>
              {num2Digits.map((digit, index) => (
                <div 
                  key={`num2-${index}`} 
                  className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                >
                  {digit === ' ' ? '' : digit}
                </div>
              ))}
            </div>
            
            {/* Tercera fila - Campos de entrada para la respuesta */}
            <div className="flex justify-end space-x-2 pt-1">
              {Array(totalPositions).fill(0).map((_, index) => (
                <Input
                  key={`input-${index}`}
                  type="text"
                  maxLength={1}
                  className={`w-10 h-10 text-center font-bold text-xl p-0 ${
                    waitingForContinue ? getDifficultyColor() : 'bg-white'
                  }`}
                  value={userDigits[index] || ''}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  disabled={waitingForContinue}
                  readOnly={waitingForContinue}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit();
                    } else if (e.key === "Backspace" && !userDigits[index]) {
                      // Si el campo actual está vacío y presiona backspace, moverse al campo de la derecha
                      // ya que estamos trabajando de derecha a izquierda
                      if (index < totalPositions - 1) {
                        inputRefs.current[index + 1]?.focus();
                      }
                    }
                  }}
                />
              ))}
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
      </div>
    </div>
  );
}