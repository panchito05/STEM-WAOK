import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface VerbalProblemExerciseProps {
  operands: number[];
  onAnswer: (isCorrect: boolean) => void;
}

const VerbalProblemExercise: React.FC<VerbalProblemExerciseProps> = ({ operands, onAnswer }) => {
  const [blank1, setBlank1] = useState<string>('');
  const [blank2, setBlank2] = useState<string>('');
  const [finalAnswer, setFinalAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [activeField, setActiveField] = useState<string>('');

  // Generar problemas basados en los operandos
  const [a, b, c] = operands;
  const correctAnswer = operands.reduce((sum, num) => sum + num, 0);

  // Determinar qué agrupación mostrar como dada y cuál completar
  const showFirstGrouping = Math.random() > 0.5;
  
  const givenExpression = showFirstGrouping 
    ? `(${a} + ${b}) + ${c}`
    : `${a} + (${b} + ${c})`;
    
  const completeExpression = showFirstGrouping
    ? `${a} + (__ + __) = __`
    : `(__ + __) + ${c} = __`;

  const correctBlank1 = showFirstGrouping ? b : a;
  const correctBlank2 = showFirstGrouping ? c : b;

  const handleFieldClick = (fieldName: string) => {
    setActiveField(fieldName);
  };

  const handleNumberInput = (digit: string) => {
    if (activeField === 'blank1') {
      setBlank1(prev => prev + digit);
    } else if (activeField === 'blank2') {
      setBlank2(prev => prev + digit);
    } else if (activeField === 'finalAnswer') {
      setFinalAnswer(prev => prev + digit);
    }
  };

  const handleSubmit = () => {
    const blank1Correct = parseInt(blank1) === correctBlank1;
    const blank2Correct = parseInt(blank2) === correctBlank2;
    const answerCorrect = parseInt(finalAnswer) === correctAnswer;
    
    const isCorrect = blank1Correct && blank2Correct && answerCorrect;
    setShowResult(true);
    onAnswer(isCorrect);
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
        <h3 className="text-xl font-bold text-purple-800 mb-4">
          🔢 Aplicación de la Propiedad Asociativa
        </h3>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border">
            <p className="text-lg mb-3">
              <strong>Dada:</strong> {givenExpression} = {correctAnswer}
            </p>
            <p className="text-lg mb-4">
              <strong>Completa:</strong> {completeExpression.replace('__', '_____')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Primer número:</label>
              <input
                type="text"
                value={blank1}
                onClick={() => handleFieldClick('blank1')}
                readOnly
                className={`w-full p-3 border rounded-lg text-lg text-center cursor-pointer ${
                  activeField === 'blank1' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                }`}
                placeholder="?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Segundo número:</label>
              <input
                type="text"
                value={blank2}
                onClick={() => handleFieldClick('blank2')}
                readOnly
                className={`w-full p-3 border rounded-lg text-lg text-center cursor-pointer ${
                  activeField === 'blank2' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                }`}
                placeholder="?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Resultado final:</label>
              <input
                type="text"
                value={finalAnswer}
                onClick={() => handleFieldClick('finalAnswer')}
                readOnly
                className={`w-full p-3 border rounded-lg text-lg text-center cursor-pointer ${
                  activeField === 'finalAnswer' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                }`}
                placeholder="?"
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
              <Button
                key={digit}
                variant="outline"
                onClick={() => handleNumberInput(digit.toString())}
                className="h-12 text-lg"
                disabled={!activeField}
              >
                {digit}
              </Button>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={() => {
                if (activeField === 'blank1') setBlank1('');
                else if (activeField === 'blank2') setBlank2('');
                else if (activeField === 'finalAnswer') setFinalAnswer('');
              }}
              variant="outline"
              disabled={!activeField}
              className="flex-1"
            >
              Borrar
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={!blank1 || !blank2 || !finalAnswer || showResult}
              className="flex-1"
            >
              {showResult ? 'Completado' : 'Verificar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerbalProblemExercise;