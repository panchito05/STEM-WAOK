import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AssociativeGrouping } from '../types';

interface InteractiveExerciseProps {
  operands: number[];
  grouping1?: AssociativeGrouping;
  grouping2?: AssociativeGrouping;
  onAnswer: (answers: number[]) => void;
  interactiveAnswers: { [key: string]: string };
  setInteractiveAnswers: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  activeInteractiveField: string | null;
  setActiveInteractiveField: React.Dispatch<React.SetStateAction<string | null>>;
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

  // Auto-seleccionar el primer campo al inicializar
  useEffect(() => {
    if (!activeInteractiveField && !showResult) {
      setActiveInteractiveField('leftSum1');
    }
  }, [activeInteractiveField, showResult, setActiveInteractiveField]);

  // Manejar entrada de teclado
  useEffect(() => {
    if (showResult) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeInteractiveField) return;

      const key = event.key;
      
      // Solo permitir números y algunas teclas especiales
      if (!/^[0-9]$/.test(key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        return;
      }

      event.preventDefault();

      if (key === 'Backspace' || key === 'Delete') {
        // Limpiar el campo activo
        setInteractiveAnswers(prev => ({
          ...prev,
          [activeInteractiveField]: ''
        }));
      } else if (/^[0-9]$/.test(key)) {
        // Agregar dígito al campo activo
        setInteractiveAnswers(prev => {
          const currentValue = prev[activeInteractiveField] || '';
          const newValue = currentValue + key;
          
          // Verificar si el nuevo valor es correcto y avanzar si es necesario
          setTimeout(() => checkAndAdvanceField(activeInteractiveField, newValue), 0);
          
          return {
            ...prev,
            [activeInteractiveField]: newValue
          };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, activeInteractiveField, setInteractiveAnswers]);

  // Función para manejar el clic en un campo
  const handleFieldClick = (fieldName: string) => {
    if (showResult) return;
    setActiveInteractiveField(fieldName);
  };

  // Función para verificar si un valor es correcto y decidir si avanzar
  const checkAndAdvanceField = (fieldName: string, value: string) => {
    if (!value || isNaN(parseInt(value))) return;
    
    let isFieldCorrect = false;
    const intValue = parseInt(value);
    
    // Validar según la nueva lógica de la propiedad asociativa
    if (fieldName === 'leftSum1' && intValue === grouping1.leftSum) {
      isFieldCorrect = true;
    } else if (fieldName === 'leftSum2' && intValue === grouping2.leftSum) {
      isFieldCorrect = true;
    } else if (fieldName === 'rightSum2' && intValue === grouping2.rightSum) {
      isFieldCorrect = true;
    } else if (fieldName === 'final1' && intValue === grouping1.totalSum) {
      isFieldCorrect = true;
    } else if (fieldName === 'final2' && intValue === grouping2.totalSum) {
      isFieldCorrect = true;
    }

    // Solo avanzar al siguiente campo si el valor es correcto
    if (isFieldCorrect) {
      if (fieldName === 'leftSum1') {
        setActiveInteractiveField('final1');
      } else if (fieldName === 'final1') {
        setActiveInteractiveField('leftSum2');
      } else if (fieldName === 'leftSum2') {
        setActiveInteractiveField('rightSum2');
      } else if (fieldName === 'rightSum2') {
        setActiveInteractiveField('final2');
      }
      // Si es final2, mantener el foco ahí
    }
  };

  // Función para obtener el estilo del campo (sin mostrar colores de validación)
  const getFieldStyle = (fieldName: string) => {
    const value = interactiveAnswers[fieldName];
    
    if (activeInteractiveField === fieldName) {
      return 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200';
    }
    
    if (value) {
      return 'border-gray-400 bg-gray-50';
    }
    
    return 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md';
  };

  const handleFillBlankSubmit = () => {
    const correctSum = operands[0] + operands[1] + operands[2];
    
    // Formato que espera el componente padre: [form1Result, blank1, blank2, form2Result]
    const answers = [
      correctSum, // form1 result
      parseInt(interactiveAnswers.blank1) || 0, // blank1
      parseInt(interactiveAnswers.blank2) || 0, // blank2  
      parseInt(interactiveAnswers.blank3) || 0  // form2 result
    ];

    setShowResult(true);
    onAnswer(answers);
  };

  const handleMultipleChoiceSubmit = () => {
    const correctSum = operands[0] + operands[1] + operands[2];
    
    // Formato que espera el componente padre: [form1Result, blank1, blank2, form2Result]
    const answers = [
      correctSum, // form1 result
      operands[1], // blank1 - valor correcto
      operands[2], // blank2 - valor correcto
      correctSum  // form2 result
    ];
    
    setShowResult(true);
    onAnswer(answers);
  };

  const renderAssociativePropertyExercise = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-6 text-center">
          Demuestra que la Propiedad Asociativa funciona
        </h3>
        
        {/* Primera agrupación: (a + b) + c */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-lg font-medium text-green-700 mb-3">Primera agrupación:</div>
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <span>(</span>
            <span>{grouping1.leftGroup[0]}</span>
            <span>+</span>
            <span>{grouping1.leftGroup[1]}</span>
            <span>) +</span>
            <span>{grouping1.rightGroup[0]}</span>
            <span>=</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${getFieldStyle('leftSum1')}`}
              onClick={() => handleFieldClick('leftSum1')}
            >
              {interactiveAnswers.leftSum1 || <span className="text-gray-400">?</span>}
            </div>
            <span>+</span>
            <span>{grouping1.rightGroup[0]}</span>
            <span>=</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${getFieldStyle('final1')}`}
              onClick={() => handleFieldClick('final1')}
            >
              {interactiveAnswers.final1 || <span className="text-gray-400">?</span>}
            </div>
          </div>
        </div>

        {/* Segunda agrupación: a + (b + c) */}
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-lg font-medium text-purple-700 mb-3">Segunda agrupación:</div>
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <span>{grouping2.leftGroup[0]}</span>
            <span>+ (</span>
            <span>{grouping2.rightGroup[0]}</span>
            <span>+</span>
            <span>{grouping2.rightGroup[1]}</span>
            <span>) =</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${getFieldStyle('leftSum2')}`}
              onClick={() => handleFieldClick('leftSum2')}
            >
              {interactiveAnswers.leftSum2 || <span className="text-gray-400">?</span>}
            </div>
            <span>+</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${getFieldStyle('rightSum2')}`}
              onClick={() => handleFieldClick('rightSum2')}
            >
              {interactiveAnswers.rightSum2 || <span className="text-gray-400">?</span>}
            </div>
            <span>=</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${getFieldStyle('final2')}`}
              onClick={() => handleFieldClick('final2')}
            >
              {interactiveAnswers.final2 || <span className="text-gray-400">?</span>}
            </div>
          </div>
        </div>

        {/* Demostración de equivalencia */}
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-lg font-medium text-yellow-700 mb-2">¿Los resultados son iguales?</div>
          <div className="text-xl font-bold text-yellow-800">
            {interactiveAnswers.final1 && interactiveAnswers.final2 
              ? `${interactiveAnswers.final1} ${interactiveAnswers.final1 === interactiveAnswers.final2 ? '=' : '≠'} ${interactiveAnswers.final2}`
              : "Completa ambas agrupaciones para ver"}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {renderAssociativePropertyExercise()}
    </div>
  );
};

export default InteractiveExercise;