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
    const correctAnswer = operands[0] + operands[1] + operands[2];
    const isCorrect = parseInt(selectedChoice) === correctAnswer;
    setShowResult(true);
    onAnswer(isCorrect);
  };

  if (exercise === 'fill-blank') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Completa la otra forma:</h3>
          <div className="flex items-center justify-center space-x-2 text-xl">
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

        {showResult && (
          <div className="text-center mt-4">
            <div className={`p-4 rounded-lg ${
              parseInt(interactiveAnswers.blank1) === operands[1] &&
              parseInt(interactiveAnswers.blank2) === operands[2] &&
              parseInt(interactiveAnswers.blank3) === operands[0] + operands[1] + operands[2]
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {parseInt(interactiveAnswers.blank1) === operands[1] &&
               parseInt(interactiveAnswers.blank2) === operands[2] &&
               parseInt(interactiveAnswers.blank3) === operands[0] + operands[1] + operands[2]
                ? '¡Correcto!' 
                : `Incorrecto. La respuesta correcta es: ${operands[0]} + (${operands[1]} + ${operands[2]}) = ${operands[0] + operands[1] + operands[2]}`}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    // Multiple choice exercise
    const correctAnswer = operands[0] + operands[1] + operands[2];
    const choices = [
      correctAnswer,
      correctAnswer + Math.floor(Math.random() * 5) + 1,
      correctAnswer - Math.floor(Math.random() * 3) - 1,
      correctAnswer + Math.floor(Math.random() * 3) + 6
    ].sort(() => Math.random() - 0.5);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">¿Cuál es el resultado?</h3>
          <div className="text-xl mb-4">
            ({operands[0]} + {operands[1]}) + {operands[2]} = ?
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => setSelectedChoice(choice.toString())}
                disabled={showResult}
                className={`p-3 rounded-lg border-2 font-semibold transition-all duration-200 ${
                  selectedChoice === choice.toString()
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                } ${showResult ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>

        {!showResult && selectedChoice && (
          <div className="text-center mt-4">
            <Button 
              onClick={handleMultipleChoiceSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Verificar Respuesta
            </Button>
          </div>
        )}

        {showResult && (
          <div className="text-center mt-4">
            <div className={`p-4 rounded-lg ${
              parseInt(selectedChoice) === correctAnswer
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {parseInt(selectedChoice) === correctAnswer
                ? '¡Correcto!' 
                : `Incorrecto. La respuesta correcta es: ${correctAnswer}`}
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default InteractiveExercise;