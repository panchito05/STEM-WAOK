import React, { useState } from 'react';

interface VerbalProblemExerciseProps {
  operands: number[];
  onAnswer: (isCorrect: boolean) => void;
}

const VerbalProblemExercise: React.FC<VerbalProblemExerciseProps> = ({ operands, onAnswer }) => {
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});

  // Generar problemas basados en los operandos
  const [a, b, c] = operands;
  const correctAnswer = operands.reduce((sum, num) => sum + num, 0);

  // Determinar qué agrupación mostrar como dada y cuál completar
  const showFirstGrouping = Math.random() > 0.5;
  
  const givenExpression = showFirstGrouping 
    ? `(${a} + ${b}) + ${c}`
    : `${a} + (${b} + ${c})`;

  const correctBlank1 = showFirstGrouping ? b : a;
  const correctBlank2 = showFirstGrouping ? c : b;

  const handleInputChange = (fieldName: string, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderExpression = () => {
    if (showFirstGrouping) {
      // Mostrar: a + (__ + __) = __
      return (
        <div className="text-2xl font-bold text-center bg-white p-4 rounded border">
          <span className="text-purple-800">{a}</span>
          <span className="mx-2">+</span>
          <span>(</span>
          <input
            type="text"
            value={userAnswers['blank1'] || ''}
            onChange={(e) => handleInputChange('blank1', e.target.value)}
            className="w-16 h-10 text-center border-2 border-purple-300 rounded mx-1 text-lg"
            placeholder="?"
            maxLength={3}
          />
          <span className="mx-2">+</span>
          <input
            type="text"
            value={userAnswers['blank2'] || ''}
            onChange={(e) => handleInputChange('blank2', e.target.value)}
            className="w-16 h-10 text-center border-2 border-purple-300 rounded mx-1 text-lg"
            placeholder="?"
            maxLength={3}
          />
          <span>)</span>
          <span className="mx-2">=</span>
          <input
            type="text"
            value={userAnswers['finalAnswer'] || ''}
            onChange={(e) => handleInputChange('finalAnswer', e.target.value)}
            className="w-20 h-10 text-center border-2 border-purple-300 rounded mx-1 text-lg"
            placeholder="?"
            maxLength={4}
          />
        </div>
      );
    } else {
      // Mostrar: (__ + __) + c = __
      return (
        <div className="text-2xl font-bold text-center bg-white p-4 rounded border">
          <span>(</span>
          <input
            type="text"
            value={userAnswers['blank1'] || ''}
            onChange={(e) => handleInputChange('blank1', e.target.value)}
            className="w-16 h-10 text-center border-2 border-purple-300 rounded mx-1 text-lg"
            placeholder="?"
            maxLength={3}
          />
          <span className="mx-2">+</span>
          <input
            type="text"
            value={userAnswers['blank2'] || ''}
            onChange={(e) => handleInputChange('blank2', e.target.value)}
            className="w-16 h-10 text-center border-2 border-purple-300 rounded mx-1 text-lg"
            placeholder="?"
            maxLength={3}
          />
          <span>)</span>
          <span className="mx-2">+</span>
          <span className="text-purple-800">{c}</span>
          <span className="mx-2">=</span>
          <input
            type="text"
            value={userAnswers['finalAnswer'] || ''}
            onChange={(e) => handleInputChange('finalAnswer', e.target.value)}
            className="w-20 h-10 text-center border-2 border-purple-300 rounded mx-1 text-lg"
            placeholder="?"
            maxLength={4}
          />
        </div>
      );
    }
  };

  const checkAnswers = () => {
    const blank1Correct = parseInt(userAnswers['blank1'] || '0') === correctBlank1;
    const blank2Correct = parseInt(userAnswers['blank2'] || '0') === correctBlank2;
    const answerCorrect = parseInt(userAnswers['finalAnswer'] || '0') === correctAnswer;
    
    const isCorrect = blank1Correct && blank2Correct && answerCorrect;
    onAnswer(isCorrect);
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
        <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">
          🔢 Aplicación de la Propiedad Asociativa
        </h3>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg mb-4">
              <strong>Dada:</strong> <span className="bg-green-100 px-2 py-1 rounded">{givenExpression} = {correctAnswer}</span>
            </p>
            <p className="text-lg mb-4">
              <strong>Completa la forma equivalente:</strong>
            </p>
          </div>

          {renderExpression()}
          
          <div className="text-center">
            <button
              onClick={checkAnswers}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={!userAnswers['blank1'] || !userAnswers['blank2'] || !userAnswers['finalAnswer']}
            >
              Verificar Respuestas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerbalProblemExercise;