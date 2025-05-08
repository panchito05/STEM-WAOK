import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { VerticalExerciseProps } from './types';

// COMPONENTE SÚPER SIMPLIFICADO SIN ESTADO COMPLICADO PARA RESOLVER EL PROBLEMA DE VALIDACIÓN
export default function VerticalExercise({
  problem,
  onSubmit,
  isActive,
  waitingForContinue,
  difficultyLevel
}: VerticalExerciseProps) {
  // -------- ESTADO --------
  const [userAnswer, setUserAnswer] = useState('');
  
  // -------- DATOS DEL PROBLEMA --------
  const num1 = problem.num1.toString();
  const num2 = problem.num2.toString();
  const expectedAnswer = problem.correctAnswer;
  
  // -------- FORMATEO PARA PANTALLA --------
  // Determinar si hay decimales en el problema
  const hasDecimal = num1.includes('.') || num2.includes('.');
  
  // Separar partes enteras y decimales
  const [int1 = "", dec1 = ""] = num1.split('.');
  const [int2 = "", dec2 = ""] = num2.split('.');
  
  // Calcular máximas longitudes para alineación
  const maxIntLength = Math.max(int1.length, int2.length);
  const maxDecLength = hasDecimal ? Math.max(dec1.length, dec2.length) : 0;
  
  // Preparar números para visualización
  const num1Integers = int1.padStart(maxIntLength, ' ').split('');
  const num2Integers = int2.padStart(maxIntLength, ' ').split('');
  const num1Decimals = hasDecimal ? dec1.padEnd(maxDecLength, '0').split('') : [];
  const num2Decimals = hasDecimal ? dec2.padEnd(maxDecLength, '0').split('') : [];
  
  // -------- EFECTOS --------
  // Limpiar la entrada cuando cambia el problema
  useEffect(() => {
    setUserAnswer('');
    console.log('[VERTICAL_SIMPLE] Problema cargado:', {
      num1, num2, 
      expectedAnswer,
      hasDecimal
    });
  }, [problem]);
  
  // -------- MANEJO DE ENTRADA --------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir solo dígitos y un punto decimal
    const value = e.target.value;
    const isValidInput = /^[0-9]*\.?[0-9]*$/.test(value);
    
    if (isValidInput) {
      setUserAnswer(value);
    }
  };
  
  // -------- VALIDACIÓN --------
  const handleSubmit = () => {
    if (waitingForContinue) return;
    
    // Convertir la entrada del usuario a número
    let userNumericAnswer: number;
    
    // Tratar valores vacíos como 0
    if (!userAnswer.trim()) {
      userNumericAnswer = 0;
    } else {
      // Convertir a número, manteniendo decimales si existen
      userNumericAnswer = userAnswer.includes('.') 
        ? parseFloat(userAnswer) 
        : parseInt(userAnswer);
        
      // Si hay error de conversión, usar 0
      if (isNaN(userNumericAnswer)) {
        userNumericAnswer = 0;
      }
    }
    
    // Validar respuesta con tolerancia para decimales
    const isCorrect = Math.abs(userNumericAnswer - expectedAnswer) < 0.001;
    
    console.log('[VERTICAL_SIMPLE] Validando respuesta:', {
      userAnswerString: userAnswer,
      userAnswerNumber: userNumericAnswer,
      expectedAnswer,
      isCorrect
    });
    
    // Devolver el valor correcto si es correcto, o la respuesta del usuario si es incorrecta
    onSubmit(isCorrect ? expectedAnswer : userNumericAnswer);
  };
  
  // Manejar tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  // -------- ESTILOS Y RENDERIZADO --------
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
            <div className="flex justify-end items-center">
              {/* Parte entera del primer número */}
              <div className="flex space-x-2">
                {num1Integers.map((digit, index) => (
                  <div 
                    key={`num1-int-${index}`} 
                    className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                  >
                    {digit === ' ' ? '' : digit}
                  </div>
                ))}
              </div>
              
              {/* Punto decimal y parte decimal del primer número */}
              {hasDecimal && (
                <>
                  <div className={`w-6 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>
                    .
                  </div>
                  <div className="flex space-x-2">
                    {num1Decimals.map((digit, index) => (
                      <div 
                        key={`num1-dec-${index}`} 
                        className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Segunda fila - Operador y segundo número */}
            <div className="flex justify-end items-center border-b-2 border-gray-400 pb-1">
              <div className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>+</div>
              
              {/* Parte entera del segundo número */}
              <div className="flex space-x-2">
                {num2Integers.map((digit, index) => (
                  <div 
                    key={`num2-int-${index}`} 
                    className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                  >
                    {digit === ' ' ? '' : digit}
                  </div>
                ))}
              </div>
              
              {/* Punto decimal y parte decimal del segundo número */}
              {hasDecimal && (
                <>
                  <div className={`w-6 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>
                    .
                  </div>
                  <div className="flex space-x-2">
                    {num2Decimals.map((digit, index) => (
                      <div 
                        key={`num2-dec-${index}`} 
                        className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Tercera fila - Campo de entrada unificado (nuevo enfoque) */}
            <div className="flex justify-end items-center pt-1">
              <Input
                type="text"
                placeholder="Escribe tu respuesta"
                className={`w-48 h-10 text-center font-bold text-xl ${
                  waitingForContinue ? getDifficultyColor() : 'bg-white'
                }`}
                value={userAnswer}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoFocus={isActive}
                disabled={waitingForContinue}
                readOnly={waitingForContinue}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
