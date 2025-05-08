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
  
  // Determinar el número máximo de dígitos (incluyendo decimales)
  const hasDecimals = num1Str.includes('.') || num2Str.includes('.');
  
  // Separar la parte entera y decimal de cada número
  const [num1Int, num1Dec = ''] = num1Str.split('.');
  const [num2Int, num2Dec = ''] = num2Str.split('.');
  
  // Calcular la longitud máxima de cada parte
  const maxIntLength = Math.max(num1Int.length, num2Int.length);
  const maxDecLength = Math.max(num1Dec.length, num2Dec.length);
  
  // Calcular la suma exacta para determinar el número correcto de posiciones
  const exactSum = problem.num1 + problem.num2;
  const exactSumStr = exactSum.toString();
  const [exactSumInt, exactSumDec = ''] = exactSumStr.split('.');
  
  // Determinar la longitud máxima de la parte entera considerando la suma
  const resultIntLength = exactSumInt.length;
  const displayIntLength = Math.max(resultIntLength, maxIntLength);
  
  // Crear arrays con los dígitos alineados correctamente
  const num1Digits: string[] = [];
  const num2Digits: string[] = [];
  
  // Añadir dígitos enteros uno por uno, garantizando espacio para la suma completa
  for (let i = 0; i < displayIntLength; i++) {
    num1Digits.push(i < num1Int.padStart(displayIntLength, ' ').length ? num1Int.padStart(displayIntLength, ' ')[i] : ' ');
    num2Digits.push(i < num2Int.padStart(displayIntLength, ' ').length ? num2Int.padStart(displayIntLength, ' ')[i] : ' ');
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
  
  // Calcular el número de posiciones que necesitamos para el resultado basado en la suma real
  // Asegurarnos de tener al menos una posición más que la longitud máxima de los operandos
  // para manejar posibles acarreos
  const totalPositions = hasDecimals
    ? Math.max(exactSumInt.length, maxIntLength + 1) + Math.max(exactSumDec.length, maxDecLength) + 1 // +1 para el punto decimal
    : Math.max(exactSumInt.length, maxIntLength + 1);
  
  // Inicializar los dígitos del usuario si están vacíos
  // Resetear los campos cuando cambia el problema o se inicia un nuevo problema
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
      totalPositions,
      hasDecimals
    });
    
    // Enfocar el último input (el de la derecha) cuando se activa,
    // ya que la suma se realiza de derecha a izquierda empezando por las unidades
    if (isActive && inputRefs.current[totalPositions - 1]) {
      setTimeout(() => {
        inputRefs.current[totalPositions - 1]?.focus();
      }, 100); // pequeño retraso para asegurar que el DOM se actualice
    }
  }, [isActive, totalPositions, problem.num1, problem.num2, hasDecimals]);
  
  // Manejar el cambio en un dígito específico
  const handleDigitChange = (index: number, value: string) => {
    if (waitingForContinue) return;
    
    // Solo permitir dígitos y punto decimal
    if (!/^[0-9]$/.test(value) && value !== '.') {
      return;
    }
    
    // Si es un punto decimal, manejarlo con cuidado
    if (value === '.') {
      // Si ya hay un punto decimal en la entrada, no permitir otro
      if (userDigits.includes('.')) {
        return;
      }
      
      // Especial: si se está ingresando un punto decimal, permitirlo solo si tiene sentido
      // (debe haber dígitos válidos a la izquierda o a la derecha)
      const hasDigitsLeft = userDigits.slice(0, index).some(d => /^[0-9]$/.test(d));
      const hasDigitsRight = userDigits.slice(index + 1).some(d => /^[0-9]$/.test(d));
      
      if (!hasDigitsLeft && !hasDigitsRight) {
        // Si no hay dígitos a la izquierda ni a la derecha, añadir un 0 a la izquierda automáticamente
        const newDigits = [...userDigits];
        if (index > 0) {
          newDigits[index - 1] = '0';
        }
        newDigits[index] = '.';
        setUserDigits(newDigits);
        
        // No movemos el foco aquí para permitir ingresar los decimales
        return;
      }
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
    // Convertir el array de dígitos a un formato más estructurado para debug
    console.log('[VERTICAL_EXERCISE] Dígitos ingresados por el usuario:', 
      userDigits.map((d, i) => `[${i}]: "${d}"`).join(', '));
      
    // Si no hay entrada o todos son espacios vacíos, devolver 0
    if (userDigits.every(digit => digit === '' || digit === ' ')) {
      console.log('[VERTICAL_EXERCISE] No hay respuesta del usuario, devolviendo 0');
      return 0;
    }
    
    // Asegurarnos de que haya a lo sumo un punto decimal
    const decimalPoints = userDigits.filter(digit => digit === '.').length;
    if (decimalPoints > 1) {
      console.log('[VERTICAL_EXERCISE] Formato incorrecto: múltiples puntos decimales');
      return 0;
    }
    
    // Crear la cadena de respuesta correctamente
    let userAnswerStr = '';
    
    // Primero, unimos todos los dígitos en una cadena, eliminando espacios vacíos
    for (let i = 0; i < userDigits.length; i++) {
      const digit = userDigits[i];
      if (digit !== '' && digit !== ' ') {
        userAnswerStr += digit;
      }
    }
    
    // Si no hay punto decimal pero el problema es decimal, podríamos asumir que el usuario
    // ingresó un número entero y convertirlo a la precisión correcta
    if (hasDecimals && !userAnswerStr.includes('.')) {
      console.log('[VERTICAL_EXERCISE] Usuario ingresó un número entero para un problema decimal');
      
      // Intentar determinar si la respuesta es un entero válido
      // y compararla con el entero más cercano a la respuesta correcta
      const userInt = parseInt(userAnswerStr);
      const correctInt = Math.round(exactSum);
      
      if (userInt === correctInt) {
        console.log('[VERTICAL_EXERCISE] La respuesta entera coincide con el redondeo de la correcta');
        return exactSum; // Devolver el valor exacto en lugar del redondeado
      }
    }
    
    // Manejar respuestas que comienzan con punto decimal (agregar 0 al inicio)
    if (userAnswerStr.startsWith('.')) {
      userAnswerStr = '0' + userAnswerStr;
    }
    
    // Asegurarnos de que no hay ceros iniciales innecesarios
    if (userAnswerStr.startsWith('0') && userAnswerStr.length > 1 && userAnswerStr[1] !== '.') {
      userAnswerStr = userAnswerStr.replace(/^0+/, '');
    }
    
    // Si la respuesta sigue siendo un string vacío después de procesar todo, devolver 0
    if (!userAnswerStr) {
      console.log('[VERTICAL_EXERCISE] Después de procesar, no hay respuesta válida');
      return 0;
    }
    
    // Convertir a número y registrar para depuración
    const numericAnswer = parseFloat(userAnswerStr) || 0;
    
    console.log('[VERTICAL_EXERCISE] Respuesta procesada:', {
      userAnswerStr,
      numericAnswer,
      exactSum,
      diff: Math.abs(numericAnswer - exactSum)
    });
    
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