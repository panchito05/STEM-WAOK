import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface AdvancedExerciseProps {
  operands: number[];
  onAnswer: (isCorrect: boolean) => void;
  interactiveAnswers: { [key: string]: string };
  setInteractiveAnswers: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  activeInteractiveField: string | null;
  setActiveInteractiveField: React.Dispatch<React.SetStateAction<string | null>>;
  validationTrigger: number;
  exerciseStarted: boolean;
}

type ExerciseType = 'fill-blank' | 'verification' | 'multiple-choice';

const AdvancedExercise: React.FC<AdvancedExerciseProps> = ({ 
  operands, 
  onAnswer,
  interactiveAnswers,
  setInteractiveAnswers,
  activeInteractiveField,
  setActiveInteractiveField,
  validationTrigger,
  exerciseStarted
}) => {
  const [exercise, setExercise] = useState<ExerciseType>('fill-blank');
  const [showResult, setShowResult] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [verificationAnswer, setVerificationAnswer] = useState<string>('');
  const [shuffledChoices, setShuffledChoices] = useState<any[]>([]);

  useEffect(() => {
    // Reiniciar estado cuando cambian los operandos
    setShowResult(false);
    setSelectedChoice('');
    setVerificationAnswer('');
    setInteractiveAnswers({ blank1: '', blank2: '', blank3: '', blank4: '' });
    setActiveInteractiveField(null);
    
    // Seleccionar tipo de ejercicio aleatoriamente
    const exercises: ExerciseType[] = ['fill-blank', 'verification', 'multiple-choice'];
    const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
    setExercise(randomExercise);

    // Generar opciones para multiple choice una sola vez
    if (randomExercise === 'multiple-choice') {
      const choices = [
        { id: 'a', text: `${operands[0]} + (${operands[1]} + ${operands[2]})`, correct: true },
        { id: 'b', text: `(${operands[0]} + ${operands[2]}) + ${operands[1]}`, correct: true },
        { id: 'c', text: `${operands[0]} × (${operands[1]} + ${operands[2]})`, correct: false }
      ];
      // Mezclar una sola vez
      const shuffled = [...choices].sort(() => Math.random() - 0.5);
      setShuffledChoices(shuffled);
    }
  }, [operands, setInteractiveAnswers, setActiveInteractiveField]);

  // Handle validation trigger from main "Check Answer" button
  useEffect(() => {
    if (validationTrigger > 0) {
      handleValidation();
    }
  }, [validationTrigger]);

  const handleValidation = () => {
    switch (exercise) {
      case 'fill-blank':
        handleFillBlankSubmit();
        break;
      case 'verification':
        handleVerificationSubmit();
        break;
      case 'multiple-choice':
        handleMultipleChoiceSubmit();
        break;
    }
  };

  const handleFieldClick = (fieldName: string) => {
    setActiveInteractiveField(fieldName);
  };

  const handleFillBlankSubmit = () => {
    const blank1Correct = parseInt(interactiveAnswers.blank1) === operands[1];
    const blank2Correct = parseInt(interactiveAnswers.blank2) === operands[2];
    const blank3Correct = parseInt(interactiveAnswers.blank3) === operands.reduce((sum, val) => sum + val, 0);
    
    const isCorrect = blank1Correct && blank2Correct && blank3Correct;
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const handleVerificationSubmit = () => {
    const isCorrect = verificationAnswer.toLowerCase() === 'verdadero' || verificationAnswer.toLowerCase() === 'true';
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const handleMultipleChoiceSubmit = () => {
    const isCorrect = selectedChoice === 'a';
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const renderFillBlankExercise = () => {
    const hasDecimals = operands.some(num => num % 1 !== 0);
    
    return (
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
            <div className="text-2xl font-bold flex items-center justify-center gap-2 flex-wrap">
              <span>{operands[0]} +</span>
              <span>(</span>
              <div
                className={`w-20 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${
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
                className={`w-20 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${
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
                className={`w-24 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${
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


      </div>
    );
  };

  const renderVerificationExercise = () => {
    // Generar una segunda expresión que puede ser correcta o incorrecta
    const isCorrectExpression = Math.random() > 0.5;
    let secondExpression: string;
    
    if (isCorrectExpression) {
      // Expresión correcta: otra forma válida de agrupar
      secondExpression = `${operands[0]} + (${operands[1]} + ${operands[2]})`;
    } else {
      // Expresión incorrecta: cambiar uno de los números
      const wrongOperands = [...operands];
      wrongOperands[Math.floor(Math.random() * wrongOperands.length)] += Math.floor(Math.random() * 5) + 1;
      secondExpression = `${wrongOperands[0]} + (${wrongOperands[1]} + ${wrongOperands[2]})`;
    }

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">
            ¿Son estas expresiones equivalentes?
          </h3>
          
          <div className="space-y-4 text-center">
            <div className="text-xl font-bold text-purple-600 bg-purple-100 p-3 rounded-lg">
              ({operands[0]} + {operands[1]}) + {operands[2]}
            </div>
            
            <div className="text-lg font-medium text-gray-600">es igual a</div>
            
            <div className="text-xl font-bold text-purple-600 bg-purple-100 p-3 rounded-lg">
              {secondExpression}
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <Button
              onClick={() => setVerificationAnswer('verdadero')}
              className={`px-6 py-3 ${verificationAnswer === 'verdadero' ? 'bg-green-600' : 'bg-gray-300'}`}
              disabled={showResult}
            >
              Verdadero
            </Button>
            <Button
              onClick={() => setVerificationAnswer('falso')}
              className={`px-6 py-3 ${verificationAnswer === 'falso' ? 'bg-red-600' : 'bg-gray-300'}`}
              disabled={showResult}
            >
              Falso
            </Button>
          </div>
        </div>


      </div>
    );
  };

  const renderMultipleChoiceExercise = () => {
    const sum = operands.reduce((acc, val) => acc + val, 0);
    const choices = [
      { id: 'a', text: `${operands[0]} + (${operands[1]} + ${operands[2]})`, correct: true },
      { id: 'b', text: `(${operands[0]} + ${operands[2]}) + ${operands[1]}`, correct: true }, // También correcto
      { id: 'c', text: `${operands[0]} × (${operands[1]} + ${operands[2]})`, correct: false }
    ];

    // Mezclar las opciones para variar el orden
    const shuffledChoices = [...choices].sort(() => Math.random() - 0.5);

    return (
      <div className="space-y-6">
        <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
          <div className="mb-6 text-center">
            <div className="text-xl font-medium mb-2">¿Cuál es igual a:</div>
            <div className="text-2xl font-bold text-orange-600 bg-orange-100 p-3 rounded-lg inline-block">
              ({operands[0]} + {operands[1]}) + {operands[2]}?
            </div>
          </div>

          <div className="space-y-3">
            {shuffledChoices.map((choice, index) => (
              <label
                key={choice.id}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedChoice === choice.id
                    ? 'border-orange-400 bg-orange-100'
                    : 'border-gray-200 hover:border-orange-300'
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
                  {String.fromCharCode(65 + index)}) {choice.text}
                </span>
              </label>
            ))}
          </div>
        </div>


      </div>
    );
  };

  const renderExercise = () => {
    switch (exercise) {
      case 'fill-blank':
        return renderFillBlankExercise();
      case 'verification':
        return renderVerificationExercise();
      case 'multiple-choice':
        return renderMultipleChoiceExercise();
      default:
        return renderFillBlankExercise();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {renderExercise()}
      
      {showResult && (
        <div className="mt-6 text-center">
          <div className={`text-lg font-semibold ${
            (exercise === 'fill-blank' 
              ? parseInt(interactiveAnswers.blank1) === operands[1] && 
                parseInt(interactiveAnswers.blank2) === operands[2] && 
                parseInt(interactiveAnswers.blank3) === operands.reduce((sum, val) => sum + val, 0)
              : exercise === 'verification'
              ? verificationAnswer === 'verdadero'
              : selectedChoice === 'a' || selectedChoice === 'b' // Múltiples respuestas correctas
            ) ? 'text-green-600' : 'text-red-600'
          }`}>
            {(exercise === 'fill-blank' 
              ? parseInt(interactiveAnswers.blank1) === operands[1] && 
                parseInt(interactiveAnswers.blank2) === operands[2] && 
                parseInt(interactiveAnswers.blank3) === operands.reduce((sum, val) => sum + val, 0)
              : exercise === 'verification'
              ? verificationAnswer === 'verdadero'
              : selectedChoice === 'a' || selectedChoice === 'b'
            ) ? '¡Correcto!' : 'Incorrecto. La propiedad asociativa permite cambiar la agrupación manteniendo el mismo resultado.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedExercise;