import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
// import { useTranslation } from "react-i18next";
// Temporal mientras arreglamos el problema con i18n
const useTranslation = () => ({ t: (key: string) => key.includes('.') ? key.split('.')[1] : key });
import { DifficultyLevel, AdditionProblem, UserAnswer } from "./types";

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
  
  // Determinar el número máximo de dígitos (incluyendo decimales)
  const hasDecimals = num1Str.includes('.') || num2Str.includes('.');
  
  // Separar la parte entera y decimal de cada número
  const [num1Int, num1Dec = ''] = num1Str.split('.');
  const [num2Int, num2Dec = ''] = num2Str.split('.');
  
  // Calcular la longitud máxima de cada parte
  const maxIntLength = Math.max(num1Int.length, num2Int.length);
  const maxDecLength = Math.max(num1Dec.length, num2Dec.length);
  
  // Crear arrays con los dígitos alineados correctamente
  const num1Digits: string[] = [];
  const num2Digits: string[] = [];
  
  // Añadir dígitos enteros uno por uno
  for (let i = 0; i < maxIntLength; i++) {
    num1Digits.push(i < num1Int.padStart(maxIntLength, ' ').length ? num1Int.padStart(maxIntLength, ' ')[i] : ' ');
    num2Digits.push(i < num2Int.padStart(maxIntLength, ' ').length ? num2Int.padStart(maxIntLength, ' ')[i] : ' ');
  }
  
  // Añadir punto decimal y dígitos decimales si es necesario
  if (hasDecimals) {
    num1Digits.push('.');
    num2Digits.push('.');
    
    // Añadir dígitos decimales
    for (let i = 0; i < maxDecLength; i++) {
      num1Digits.push(i < num1Dec.length ? num1Dec[i] : '0');
      num2Digits.push(i < num2Dec.length ? num2Dec[i] : '0');
    }
  }
  
  // Calcular el número de posiciones que necesitamos para el resultado
  const totalPositions = hasDecimals 
    ? maxIntLength + maxDecLength + 1 // +1 para el punto decimal
    : maxIntLength;
  
  // Inicializar los dígitos del usuario si están vacíos
  useEffect(() => {
    if (userDigits.length === 0) {
      setUserDigits(Array(totalPositions).fill(''));
    }
    
    // Enfocar el último input (el de la derecha) cuando se activa,
    // ya que la suma se realiza de derecha a izquierda empezando por las unidades
    if (isActive && inputRefs.current[totalPositions - 1]) {
      inputRefs.current[totalPositions - 1]?.focus();
    }
  }, [isActive, totalPositions, userDigits.length]);
  
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
    const userAnswerStr = userDigits.join('');
    return parseFloat(userAnswerStr) || 0;
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
  
  return (
    <div className="flex flex-col items-center">
      <div className={`p-6 rounded-xl ${getDifficultyColor()} shadow-sm mb-6 max-w-sm`}>
        {/* Contenedor principal para el formato vertical */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-2 text-xl font-medium">
            {/* Primera fila - Primer número */}
            <div className="flex justify-end space-x-2">
              {num1Digits.map((digit, index) => (
                <div 
                  key={`num1-${index}`} 
                  className={`w-8 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                >
                  {digit === ' ' ? '' : digit}
                </div>
              ))}
            </div>
            
            {/* Segunda fila - Operador y segundo número */}
            <div className="flex justify-end space-x-2 border-b-2 border-gray-400 pb-1">
              <div className={`w-8 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>+</div>
              {num2Digits.map((digit, index) => (
                <div 
                  key={`num2-${index}`} 
                  className={`w-8 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
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
                  className={`w-8 h-10 text-center font-bold text-xl p-0 ${
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