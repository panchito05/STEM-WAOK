import React, { useState } from 'react';
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

  // Función para manejar el clic en un campo
  const handleFieldClick = (fieldName: string) => {
    if (showResult) return;
    setActiveInteractiveField(fieldName);
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
            ({operands[0]} + {operands[1]}) + {operands[2]} = {operands[0] + operands[1] + operands[2]}
          </div>
        </div>

        {/* Ejercicio a completar */}
        <div className="text-center">
          <div className="text-xl font-medium mb-2">Completa la otra forma:</div>
          <div className="text-2xl font-bold flex items-center justify-center gap-2">
            <span>{operands[0]} +</span>
            <span>(</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${
                activeInteractiveField === 'blank1' 
                  ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                  : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md'
              }`}
              onClick={() => handleFieldClick('blank1')}
            >
              {interactiveAnswers.blank1 || <span className="text-gray-400">?</span>}
            </div>
            <span>+</span>
            <div
              className={`w-16 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${
                activeInteractiveField === 'blank2' 
                  ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                  : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md'
              }`}
              onClick={() => handleFieldClick('blank2')}
            >
              {interactiveAnswers.blank2 || <span className="text-gray-400">?</span>}
            </div>
            <span>) =</span>
            <div
              className={`w-20 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${
                activeInteractiveField === 'blank3' 
                  ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                  : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md'
              }`}
              onClick={() => handleFieldClick('blank3')}
            >
              {interactiveAnswers.blank3 || <span className="text-gray-400">?</span>}
            </div>
          </div>
        </div>
      </div>



      {!showResult && (
        <div className="text-center mt-4">
          <Button 
            onClick={handleFillBlankSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!interactiveAnswers.blank1 || !interactiveAnswers.blank2 || !interactiveAnswers.blank3}
          >
            Verificar Respuesta
          </Button>
        </div>
      )}
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
          <h3 className="text-lg font-semibold text-purple-800 mb-4">
            Elige la opción correcta
          </h3>
          
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