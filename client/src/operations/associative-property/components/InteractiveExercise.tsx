import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface InteractiveExerciseProps {
  operands: number[];
  onAnswer: (isCorrect: boolean) => void;
  interactiveAnswers: { [key: string]: string };
  setInteractiveAnswers: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  activeInteractiveField: string | null;
  setActiveInteractiveField: React.Dispatch<React.SetStateAction<string | null>>;
}

const InteractiveExercise: React.FC<InteractiveExerciseProps> = ({ 
  operands, 
  onAnswer,
  interactiveAnswers,
  setInteractiveAnswers,
  activeInteractiveField,
  setActiveInteractiveField
}) => {
  const [exercise] = useState(() => Math.random() > 0.5 ? 'fill-blank' : 'multiple-choice');
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  // Auto-seleccionar el primer campo al inicializar
  useEffect(() => {
    if (exercise === 'fill-blank' && !activeInteractiveField && !showResult) {
      setActiveInteractiveField('blank1');
    }
  }, [exercise, activeInteractiveField, showResult, setActiveInteractiveField]);

  // Manejar entrada de teclado
  useEffect(() => {
    if (exercise !== 'fill-blank' || showResult) return;

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
  }, [exercise, showResult, activeInteractiveField, setInteractiveAnswers, operands]);

  // Función para manejar el clic en un campo
  const handleFieldClick = (fieldName: string) => {
    if (showResult) return;
    setActiveInteractiveField(fieldName);
  };

  // Función para verificar si un valor es correcto y decidir si avanzar
  const checkAndAdvanceField = (fieldName: string, value: string) => {
    if (!value || isNaN(parseInt(value))) return;
    
    let isFieldCorrect = false;
    
    if (fieldName === 'blank1' && parseInt(value) === operands[1]) {
      isFieldCorrect = true;
    } else if (fieldName === 'blank2' && parseInt(value) === operands[2]) {
      isFieldCorrect = true;
    } else if (fieldName === 'blank3' && parseInt(value) === (operands[0] + operands[1] + operands[2])) {
      isFieldCorrect = true;
    }

    // Solo avanzar al siguiente campo si el valor es correcto
    if (isFieldCorrect) {
      if (fieldName === 'blank1') {
        setActiveInteractiveField('blank2');
      } else if (fieldName === 'blank2') {
        setActiveInteractiveField('blank3');
      }
      // Si es blank3 y está correcto, mantener el foco ahí
    }
  };

  // Función para obtener el estilo del campo basado en si es correcto
  const getFieldStyle = (fieldName: string) => {
    const value = interactiveAnswers[fieldName];
    if (!value) {
      return activeInteractiveField === fieldName 
        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
        : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md';
    }

    let isCorrect = false;
    if (fieldName === 'blank1' && parseInt(value) === operands[1]) {
      isCorrect = true;
    } else if (fieldName === 'blank2' && parseInt(value) === operands[2]) {
      isCorrect = true;
    } else if (fieldName === 'blank3' && parseInt(value) === (operands[0] + operands[1] + operands[2])) {
      isCorrect = true;
    }

    if (isCorrect) {
      return 'border-green-500 bg-green-50 text-green-700';
    } else {
      return activeInteractiveField === fieldName 
        ? 'border-red-400 bg-red-50 shadow-lg ring-2 ring-red-200' 
        : 'border-red-300 bg-red-50 hover:border-red-400';
    }
  };

  const handleFillBlankSubmit = () => {
    const correctAnswer1 = operands[1];
    const correctAnswer2 = operands[2];
    const correctAnswer3 = operands[0] + operands[1] + operands[2];

    const isCorrect = 
      parseInt(interactiveAnswers.blank1) === correctAnswer1 &&
      parseInt(interactiveAnswers.blank2) === correctAnswer2 &&
      parseInt(interactiveAnswers.blank3) === correctAnswer3;

    setShowResult(true);
    onAnswer(isCorrect);
  };

  const handleMultipleChoiceSubmit = () => {
    const isCorrect = selectedChoice === 'a';
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const renderFillBlankExercise = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">
          Completa la expresión equivalente
        </h3>
        
        {/* Expresión dada */}
        <div className="mb-4 text-center">
          <div className="text-2xl font-bold text-green-600 bg-green-50 p-3 rounded-lg inline-block">
            ({operands[0]} + {operands[1]}) + {operands[2]} = ?
          </div>
        </div>

        {/* Ejercicio a completar */}
        <div className="text-center">
          <div className="text-xl font-medium mb-2">Completa la otra forma:</div>
          <div className="text-2xl font-bold flex items-center justify-center gap-2">
            <span>{operands[0]} +</span>
            <span>(</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${getFieldStyle('blank1')}`}
              onClick={() => handleFieldClick('blank1')}
            >
              {interactiveAnswers.blank1 || <span className="text-gray-400">?</span>}
            </div>
            <span>+</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${getFieldStyle('blank2')}`}
              onClick={() => handleFieldClick('blank2')}
            >
              {interactiveAnswers.blank2 || <span className="text-gray-400">?</span>}
            </div>
            <span>) =</span>
            <div
              className={`w-20 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${getFieldStyle('blank3')}`}
              onClick={() => handleFieldClick('blank3')}
            >
              {interactiveAnswers.blank3 || <span className="text-gray-400">?</span>}
            </div>
          </div>
        </div>
      </div>




    </div>
  );

  const renderMultipleChoiceExercise = () => {
    const choices = [
      { id: 'a', text: `${operands[0]} + (${operands[1]} + ${operands[2]})`, correct: true },
      { id: 'b', text: `(${operands[0]} + ${operands[2]}) + ${operands[1]}`, correct: false },
      { id: 'c', text: `${operands[0]} × (${operands[1]} + ${operands[2]})`, correct: false }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
          <div className="mb-6 text-center">
            <div className="text-xl font-medium mb-2">¿Cuál es igual a:</div>
            <div className="text-2xl font-bold text-purple-600 bg-purple-100 p-3 rounded-lg inline-block">
              ({operands[0]} + {operands[1]}) + {operands[2]}?
            </div>
          </div>

          <div className="space-y-3">
            {choices.map((choice) => (
              <label
                key={choice.id}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedChoice === choice.id
                    ? 'border-purple-400 bg-purple-100'
                    : 'border-gray-200 hover:border-purple-300'
                } ${showResult && choice.correct ? 'bg-green-100 border-green-400' : ''}
                ${showResult && selectedChoice === choice.id && !choice.correct ? 'bg-red-100 border-red-400' : ''}`}
              >
                <input
                  type="radio"
                  name="choice"
                  value={choice.id}
                  checked={selectedChoice === choice.id}
                  onChange={(e) => setSelectedChoice(e.target.value)}
                  className="mr-3"
                  disabled={showResult}
                />
                <span className="text-lg font-medium">
                  {choice.id}) {choice.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {!showResult && (
          <div className="text-center">
            <Button 
              onClick={handleMultipleChoiceSubmit}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!selectedChoice}
            >
              Verificar Respuesta
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {exercise === 'fill-blank' ? renderFillBlankExercise() : renderMultipleChoiceExercise()}
      
      {showResult && (
        <div className="mt-6 text-center">
          <div className={`text-lg font-semibold ${
            (exercise === 'fill-blank' 
              ? parseInt(interactiveAnswers.blank1) === operands[1] && 
                parseInt(interactiveAnswers.blank2) === operands[2] && 
                parseInt(interactiveAnswers.blank3) === operands[0] + operands[1] + operands[2]
              : selectedChoice === 'a'
            ) ? 'text-green-600' : 'text-red-600'
          }`}>
            {(exercise === 'fill-blank' 
              ? parseInt(interactiveAnswers.blank1) === operands[1] && 
                parseInt(interactiveAnswers.blank2) === operands[2] && 
                parseInt(interactiveAnswers.blank3) === operands[0] + operands[1] + operands[2]
              : selectedChoice === 'a'
            ) ? '¡Correcto!' : 'Incorrecto. La propiedad asociativa dice que podemos cambiar la agrupación sin cambiar el resultado.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveExercise;