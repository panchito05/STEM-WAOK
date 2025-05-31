import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AssociativeGrouping } from '../types';

interface InteractiveExerciseProps {
  operands: number[];
  grouping1?: AssociativeGrouping;
  grouping2?: AssociativeGrouping;
  onAnswer: (answers: number[]) => void;
  interactiveAnswers: string[];
  setInteractiveAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  activeInteractiveField: number;
  setActiveInteractiveField: React.Dispatch<React.SetStateAction<number>>;
}

const InteractiveExercise: React.FC<InteractiveExerciseProps> = ({ 
  operands, 
  grouping1,
  grouping2,
  onAnswer,
  interactiveAnswers,
  setInteractiveAnswers,
  activeInteractiveField,
  setActiveInteractiveField
}) => {
  const [showResult, setShowResult] = useState(false);

  // Verificar que tenemos las agrupaciones necesarias
  if (!grouping1 || !grouping2) {
    return (
      <div className="text-center text-red-600">
        Error: No se pudieron generar las agrupaciones matemáticas.
      </div>
    );
  }

  // Inicializar respuestas si está vacío
  useEffect(() => {
    if (interactiveAnswers.length === 0) {
      setInteractiveAnswers(new Array(6).fill(''));
    }
  }, [interactiveAnswers.length, setInteractiveAnswers]);

  // Auto-seleccionar el primer campo al inicializar
  useEffect(() => {
    if (activeInteractiveField === -1 && !showResult) {
      setActiveInteractiveField(0);
    }
  }, [activeInteractiveField, showResult, setActiveInteractiveField]);

  // Manejar entrada de teclado
  useEffect(() => {
    if (showResult) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeInteractiveField === -1) return;

      const key = event.key;
      
      if (key >= '0' && key <= '9') {
        event.preventDefault();
        const newAnswers = [...interactiveAnswers];
        newAnswers[activeInteractiveField] = (newAnswers[activeInteractiveField] || '') + key;
        setInteractiveAnswers(newAnswers);
      } else if (key === 'Backspace') {
        event.preventDefault();
        const newAnswers = [...interactiveAnswers];
        newAnswers[activeInteractiveField] = (newAnswers[activeInteractiveField] || '').slice(0, -1);
        setInteractiveAnswers(newAnswers);
      } else if (key === 'Tab' || key === 'Enter') {
        event.preventDefault();
        const nextField = activeInteractiveField + 1;
        if (nextField < 6) {
          setActiveInteractiveField(nextField);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeInteractiveField, interactiveAnswers, setInteractiveAnswers, setActiveInteractiveField, showResult]);

  // Manejar cambio en campo de entrada
  const handleFieldChange = (index: number, value: string) => {
    const newAnswers = [...interactiveAnswers];
    newAnswers[index] = value;
    setInteractiveAnswers(newAnswers);
  };

  // Manejar clic en campo
  const handleFieldClick = (index: number) => {
    setActiveInteractiveField(index);
  };

  // Verificar respuestas
  const handleCheckAnswers = () => {
    const answers = interactiveAnswers.map(answer => parseFloat(answer) || 0);
    const expectedAnswers = [
      grouping1.leftSum,    // (a + b)
      grouping1.totalSum,   // (a + b) + c
      operands[0],          // a
      grouping2.rightSum,   // (b + c)
      grouping2.totalSum,   // a + (b + c)
      grouping1.totalSum    // Resultado final
    ];

    const allCorrect = answers.every((answer, index) => Math.abs(answer - expectedAnswers[index]) < 0.001);
    
    if (allCorrect) {
      setShowResult(true);
      onAnswer(answers);
    } else {
      alert('Algunas respuestas son incorrectas. Revisa tus cálculos.');
    }
  };

  const renderInputField = (index: number, placeholder: string) => {
    return (
      <Input
        type="number"
        value={interactiveAnswers[index] || ''}
        onChange={(e) => handleFieldChange(index, e.target.value)}
        onClick={() => handleFieldClick(index)}
        placeholder={placeholder}
        className={`w-16 h-10 text-center font-bold border-2 ${
          activeInteractiveField === index 
            ? 'border-blue-500 ring-2 ring-blue-300' 
            : 'border-gray-300'
        }`}
      />
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-6 text-center text-gray-800 dark:text-white">
        Ejercicio Interactivo: Propiedad Asociativa
      </h3>
      
      <div className="space-y-8">
        {/* Primera agrupación: (a + b) + c */}
        <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="font-semibold mb-4 text-blue-800 dark:text-blue-200">
            Primera agrupación: ({operands[0]} + {operands[1]}) + {operands[2]}
          </h4>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-lg">({operands[0]} + {operands[1]}) =</span>
            {renderInputField(0, '?')}
          </div>
          
          <div className="flex items-center justify-center gap-4">
            {renderInputField(0, '?')} + {operands[2]} = {renderInputField(1, '?')}
          </div>
        </div>

        {/* Segunda agrupación: a + (b + c) */}
        <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
          <h4 className="font-semibold mb-4 text-green-800 dark:text-green-200">
            Segunda agrupación: {operands[0]} + ({operands[1]} + {operands[2]})
          </h4>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-lg">({operands[1]} + {operands[2]}) =</span>
            {renderInputField(3, '?')}
          </div>
          
          <div className="flex items-center justify-center gap-4">
            {operands[0]} + {renderInputField(3, '?')} = {renderInputField(4, '?')}
          </div>
        </div>

        {/* Verificación de la propiedad */}
        <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
          <h4 className="font-semibold mb-4 text-purple-800 dark:text-purple-200">
            Verificación: ¿Son iguales ambos resultados?
          </h4>
          
          <div className="flex items-center justify-center gap-4">
            {renderInputField(1, '?')} = {renderInputField(4, '?')} = {renderInputField(5, '?')}
          </div>
        </div>
      </div>

      {!showResult && (
        <div className="text-center mt-6">
          <Button 
            onClick={handleCheckAnswers}
            disabled={interactiveAnswers.some(answer => !answer)}
            className="px-8 py-2"
          >
            Verificar Respuestas
          </Button>
        </div>
      )}

      {showResult && (
        <div className="text-center mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            ¡Excelente trabajo!
          </h4>
          <p className="text-green-700 dark:text-green-300">
            Has demostrado correctamente que la propiedad asociativa se cumple:
          </p>
          <p className="text-lg font-mono mt-2">
            ({operands[0]} + {operands[1]}) + {operands[2]} = {operands[0]} + ({operands[1]} + {operands[2]}) = {grouping1.totalSum}
          </p>
        </div>
      )}
    </div>
  );
};

export default InteractiveExercise;