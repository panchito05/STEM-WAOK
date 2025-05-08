import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
// Temporal mientras arreglamos el problema con i18n
const useTranslation = () => ({ t: (key: string) => key.includes('.') ? key.split('.')[1] : key });
import { DifficultyLevel, AdditionProblem, UserAnswer } from "./types";

interface MultiVerticalExerciseProps {
  problem: AdditionProblem;
  onSubmit: (answer: number) => void;
  isActive: boolean;
  currentAttempts: number;
  maxAttempts: number;
  waitingForContinue: boolean;
  difficultyLevel: DifficultyLevel;
}

/**
 * Componente que muestra un ejercicio de adición en formato multi-vertical
 * Apilando múltiples números (2-5) para sumar, como en el ejemplo de la imagen
 * Los números están alineados en columnas y el usuario debe ingresar la respuesta
 */
export default function MultiVerticalExercise({
  problem,
  onSubmit,
  isActive,
  currentAttempts,
  maxAttempts,
  waitingForContinue,
  difficultyLevel
}: MultiVerticalExerciseProps) {
  const { t } = useTranslation();
  const [userAnswer, setUserAnswer] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Acceder a todos los números que se deben sumar
  const { num1, num2, additionalNumbers = [] } = problem;
  
  // Convertir todos los números a strings
  const allNumbers = [num1, num2, ...additionalNumbers];
  const allNumbersStr = allNumbers.map(num => num.toString());
  
  // Encontrar el número con más dígitos para alinear correctamente
  const maxLength = Math.max(...allNumbersStr.map(num => num.length));
  
  // Enfocar el input cuando el ejercicio está activo
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);
  
  // Manejar cambios en el input de respuesta
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (waitingForContinue) return;
    
    // Solo permitir dígitos y un punto decimal
    const value = e.target.value;
    if (/^[0-9]*\.?[0-9]*$/.test(value) || value === "") {
      setUserAnswer(value);
    }
  };
  
  // Enviar la respuesta
  const handleSubmit = () => {
    if (waitingForContinue) return;
    
    // Convertir la respuesta del usuario a número
    const numericAnswer = userAnswer === "" ? 0 : parseFloat(userAnswer);
    onSubmit(numericAnswer);
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
        {/* Contenedor principal para el formato multi-vertical */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-2 text-xl font-medium">
            {/* Filas de números apilados */}
            <div className="flex justify-end space-x-2 border-b-2 border-gray-400 pb-1">
              {allNumbersStr.map((numStr, numIndex) => (
                <div key={`number-${numIndex}`} className="flex justify-end items-center">
                  {/* Alinear cada número a la derecha con padding */}
                  <div className={`text-right ${getDifficultyTextColor()}`}>
                    {numStr.padStart(maxLength, ' ')}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input para la respuesta */}
            <div className="flex justify-end space-x-2 pt-1">
              <Input
                type="text"
                className={`w-24 h-10 text-center font-bold text-xl p-2 ${
                  waitingForContinue ? getDifficultyColor() : 'bg-white'
                }`}
                value={userAnswer}
                onChange={handleInputChange}
                ref={inputRef}
                disabled={waitingForContinue}
                readOnly={waitingForContinue}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={t('exercises.enterAnswer')}
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
      </div>
    </div>
  );
}