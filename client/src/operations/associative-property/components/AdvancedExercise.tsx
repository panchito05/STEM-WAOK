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
  const [verificationExpression, setVerificationExpression] = useState<{ expression: string; isCorrect: boolean } | null>(null);

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
        { id: 'b', text: `(${operands[0]} + ${operands[2]}) + ${operands[1]}`, correct: false },
        { id: 'c', text: `${operands[0]} × (${operands[1]} + ${operands[2]})`, correct: false }
      ];
      // Mezclar una sola vez
      const shuffled = [...choices].sort(() => Math.random() - 0.5);
      setShuffledChoices(shuffled);
    }

    // Generar expresión de verificación una sola vez
    if (randomExercise === 'verification') {
      const isCorrectExpression = Math.random() > 0.5;
      let expression: string;
      
      if (isCorrectExpression) {
        // Expresión correcta: otra forma válida de agrupar (propiedad asociativa)
        expression = `${operands[0]} + (${operands[1]} + ${operands[2]})`;
      } else {
        // Expresión incorrecta: cambiar uno de los números o usar operación diferente
        const wrongType = Math.random();
        if (wrongType < 0.5) {
          // Cambiar uno de los números
          const wrongOperands = [...operands];
          const indexToChange = Math.floor(Math.random() * wrongOperands.length);
          wrongOperands[indexToChange] += Math.floor(Math.random() * 10) + 1;
          expression = `${wrongOperands[0]} + (${wrongOperands[1]} + ${wrongOperands[2]})`;
        } else {
          // Usar multiplicación en lugar de suma (operación incorrecta)
          expression = `${operands[0]} × (${operands[1]} + ${operands[2]})`;
        }
      }
      
      setVerificationExpression({ expression, isCorrect: isCorrectExpression });
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
    if (exerciseStarted) {
      setActiveInteractiveField(fieldName);
    }
  };

  const handleNumberInput = (number: string) => {
    if (activeInteractiveField && exerciseStarted) {
      setInteractiveAnswers(prev => ({
        ...prev,
        [activeInteractiveField]: prev[activeInteractiveField] + number
      }));
    }
  };

  const handleBackspace = () => {
    if (activeInteractiveField && exerciseStarted) {
      setInteractiveAnswers(prev => ({
        ...prev,
        [activeInteractiveField]: prev[activeInteractiveField].slice(0, -1)
      }));
    }
  };

  const handleClear = () => {
    if (activeInteractiveField && exerciseStarted) {
      setInteractiveAnswers(prev => ({
        ...prev,
        [activeInteractiveField]: ''
      }));
    }
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
    const userAnsweredTrue = verificationAnswer.toLowerCase() === 'verdadero' || verificationAnswer.toLowerCase() === 'true';
    const actuallyCorrect = verificationExpression?.isCorrect ?? true;
    const isCorrect = userAnsweredTrue === actuallyCorrect;
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const handleMultipleChoiceSubmit = () => {
    // Find the selected choice from the shuffled choices
    const selectedChoiceData = shuffledChoices.find(choice => choice.id === selectedChoice);
    const isCorrect = selectedChoiceData?.correct || false;
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
                className={`w-20 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold transition-all duration-200 ${
                  !exerciseStarted 
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                    : activeInteractiveField === 'blank1' 
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200 cursor-pointer' 
                      : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer'
                }`}
                onClick={() => handleFieldClick('blank1')}
              >
                {interactiveAnswers.blank1 || <span className="text-gray-400">?</span>}
              </div>
              <span>+</span>
              <div
                className={`w-20 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold transition-all duration-200 ${
                  !exerciseStarted 
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                    : activeInteractiveField === 'blank2' 
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200 cursor-pointer' 
                      : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer'
                }`}
                onClick={() => handleFieldClick('blank2')}
              >
                {interactiveAnswers.blank2 || <span className="text-gray-400">?</span>}
              </div>
              <span>) =</span>
              <div
                className={`w-24 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold transition-all duration-200 ${
                  !exerciseStarted 
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                    : activeInteractiveField === 'blank3' 
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200 cursor-pointer' 
                      : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer'
                }`}
                onClick={() => handleFieldClick('blank3')}
              >
                {interactiveAnswers.blank3 || <span className="text-gray-400">?</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Number Pad */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === '<') {
                    handleBackspace();
                  } else {
                    handleNumberInput(btn);
                  }
                }}
                disabled={!exerciseStarted || !activeInteractiveField}
                className={`h-12 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  !exerciseStarted || !activeInteractiveField
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : btn === '<'
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300'
                } shadow-sm hover:shadow-md`}
              >
                {btn === '<' ? '←' : btn}
              </button>
            ))}
          </div>
          
          {activeInteractiveField && (
            <div className="mt-3 text-center">
              <button
                onClick={handleClear}
                disabled={!exerciseStarted}
                className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 active:bg-orange-300 font-medium transition-all duration-200"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

      </div>
    );
  };

  const renderVerificationExercise = () => {
    // Usar la expresión estable del estado
    const secondExpression = verificationExpression?.expression || `${operands[0]} + (${operands[1]} + ${operands[2]})`;

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
              onClick={() => exerciseStarted ? setVerificationAnswer('verdadero') : null}
              className={`px-6 py-3 ${verificationAnswer === 'verdadero' ? 'bg-green-600' : 'bg-gray-300'}`}
              disabled={showResult || !exerciseStarted}
            >
              Verdadero
            </Button>
            <Button
              onClick={() => exerciseStarted ? setVerificationAnswer('falso') : null}
              className={`px-6 py-3 ${verificationAnswer === 'falso' ? 'bg-red-600' : 'bg-gray-300'}`}
              disabled={showResult || !exerciseStarted}
            >
              Falso
            </Button>
          </div>
        </div>


      </div>
    );
  };

  const renderMultipleChoiceExercise = () => {
    // Usar las opciones estables guardadas en el estado
    const choicesToUse = shuffledChoices.length > 0 ? shuffledChoices : [
      { id: 'a', text: `${operands[0]} + (${operands[1]} + ${operands[2]})`, correct: true },
      { id: 'b', text: `(${operands[0]} + ${operands[2]}) + ${operands[1]}`, correct: true },
      { id: 'c', text: `${operands[0]} × (${operands[1]} + ${operands[2]})`, correct: false }
    ];

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
            {choicesToUse.map((choice, index) => (
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
                  onChange={(e) => exerciseStarted ? setSelectedChoice(e.target.value) : null}
                  className="mr-3"
                  disabled={showResult || !exerciseStarted}
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
              ? (verificationAnswer.toLowerCase() === 'verdadero' || verificationAnswer.toLowerCase() === 'true') === (verificationExpression?.isCorrect ?? true)
              : selectedChoice === 'a' || selectedChoice === 'b' // Múltiples respuestas correctas
            ) ? 'text-green-600' : 'text-red-600'
          }`}>
            {(exercise === 'fill-blank' 
              ? parseInt(interactiveAnswers.blank1) === operands[1] && 
                parseInt(interactiveAnswers.blank2) === operands[2] && 
                parseInt(interactiveAnswers.blank3) === operands.reduce((sum, val) => sum + val, 0)
              : exercise === 'verification'
              ? (verificationAnswer.toLowerCase() === 'verdadero' || verificationAnswer.toLowerCase() === 'true') === (verificationExpression?.isCorrect ?? true)
              : selectedChoice === 'a' || selectedChoice === 'b'
            ) ? '¡Correcto!' : 'Incorrecto. La propiedad asociativa permite cambiar la agrupación manteniendo el mismo resultado.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedExercise;