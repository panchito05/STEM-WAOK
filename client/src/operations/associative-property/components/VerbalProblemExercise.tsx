import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface VerbalProblemExerciseProps {
  operands: number[];
  onAnswer: (isCorrect: boolean) => void;
}

const VerbalProblemExercise: React.FC<VerbalProblemExerciseProps> = ({ operands, onAnswer }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [currentExerciseType, setCurrentExerciseType] = useState<'strategy' | 'verbal'>('strategy');

  // Generar problemas basados en los operandos
  const correctAnswer = operands.reduce((sum, num) => sum + num, 0);

  // Estrategias de agrupación para facilitar cálculo mental
  const generateStrategies = () => {
    const [a, b, c] = operands;
    
    // Buscar pares que sumen números redondos
    const strategies = [];
    
    if ((a + b) % 10 === 0 || (a + b) === 10 || (a + b) === 20) {
      strategies.push({
        id: 'ab_first',
        text: `Agrupa ${a} + ${b} = ${a + b} primero, luego suma ${c}`,
        calculation: `(${a} + ${b}) + ${c} = ${a + b} + ${c} = ${correctAnswer}`,
        isOptimal: true
      });
    }
    
    if ((b + c) % 10 === 0 || (b + c) === 10 || (b + c) === 20) {
      strategies.push({
        id: 'bc_first',
        text: `Agrupa ${b} + ${c} = ${b + c} primero, luego suma ${a}`,
        calculation: `${a} + (${b} + ${c}) = ${a} + ${b + c} = ${correctAnswer}`,
        isOptimal: true
      });
    }
    
    if ((a + c) % 10 === 0 || (a + c) === 10 || (a + c) === 20) {
      strategies.push({
        id: 'ac_first',
        text: `Agrupa ${a} + ${c} = ${a + c} primero, luego suma ${b}`,
        calculation: `(${a} + ${c}) + ${b} = ${a + c} + ${b} = ${correctAnswer}`,
        isOptimal: true
      });
    }
    
    // Siempre incluir al menos una estrategia básica
    if (strategies.length === 0) {
      strategies.push({
        id: 'ab_first',
        text: `Agrupa ${a} + ${b} = ${a + b} primero, luego suma ${c}`,
        calculation: `(${a} + ${b}) + ${c} = ${a + b} + ${c} = ${correctAnswer}`,
        isOptimal: false
      });
    }
    
    return strategies;
  };

  // Generar problema verbal
  const generateVerbalProblem = () => {
    const [a, b, c] = operands;
    const contexts = [
      {
        scenario: `Luis tiene ${a} canicas, Ana tiene ${b} y Carlos tiene ${c}.`,
        question: "¿Cómo puedes agruparlos para hacer la cuenta más fácil?",
        hint: "Busca números que sumen 10, 20 o otro número redondo"
      },
      {
        scenario: `En una tienda hay ${a} manzanas en una caja, ${b} en otra caja y ${c} sueltas.`,
        question: "¿Cuál es la mejor manera de contar todas las manzanas?",
        hint: "Agrupa las que te den un número fácil de recordar"
      },
      {
        scenario: `Un estudiante resolvió ${a} problemas en la mañana, ${b} en la tarde y ${c} en la noche.`,
        question: "¿Cómo puede calcular el total más rápidamente?",
        hint: "Busca pares que sumen números redondos"
      }
    ];
    
    return contexts[Math.floor(Math.random() * contexts.length)];
  };

  const strategies = generateStrategies();
  const verbalProblem = generateVerbalProblem();

  const handleStrategySubmit = () => {
    const isCorrect = selectedStrategy !== '';
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const handleAnswerSubmit = () => {
    const numericAnswer = parseInt(userAnswer);
    const isCorrect = numericAnswer === correctAnswer;
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const renderStrategyExercise = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
        <h3 className="text-lg font-semibold text-orange-800 mb-4">
          Estrategia de Cálculo Mental
        </h3>
        
        <div className="mb-6 text-center">
          <div className="text-xl font-medium mb-2">Resolver:</div>
          <div className="text-2xl font-bold text-orange-600 bg-orange-100 p-3 rounded-lg inline-block">
            {operands[0]} + {operands[1]} + {operands[2]} = ?
          </div>
        </div>

        <div className="mb-4">
          <p className="text-orange-700 font-medium mb-3">
            ¿Cuál es la mejor estrategia para resolver esto mentalmente?
          </p>
        </div>

        <div className="space-y-3">
          {strategies.map((strategy) => (
            <label
              key={strategy.id}
              className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedStrategy === strategy.id
                  ? 'border-orange-400 bg-orange-100'
                  : 'border-gray-200 hover:border-orange-300'
              } ${showResult && strategy.isOptimal ? 'bg-green-100 border-green-400' : ''}`}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  name="strategy"
                  value={strategy.id}
                  checked={selectedStrategy === strategy.id}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="mr-3"
                  disabled={showResult}
                />
                <span className="text-lg font-medium">
                  {strategy.text}
                </span>
              </div>
              <div className="text-sm text-gray-600 ml-6">
                {strategy.calculation}
              </div>
            </label>
          ))}
        </div>
      </div>

      {!showResult && (
        <div className="text-center">
          <Button 
            onClick={handleStrategySubmit}
            className="bg-orange-600 hover:bg-orange-700"
            disabled={!selectedStrategy}
          >
            Verificar Estrategia
          </Button>
        </div>
      )}
    </div>
  );

  const renderVerbalExercise = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 mb-4">
          Problema Verbal
        </h3>
        
        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
            <p className="text-lg text-gray-800 mb-2">
              {verbalProblem.scenario}
            </p>
            <p className="text-lg font-medium text-purple-700">
              {verbalProblem.question}
            </p>
          </div>
          
          <div className="bg-purple-100 p-3 rounded-lg">
            <p className="text-sm text-purple-600">
              💡 Pista: {verbalProblem.hint}
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-medium mb-3">¿Cuál es el total?</div>
          <div className="flex items-center justify-center gap-3">
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-24 h-12 text-xl font-bold text-center border-2 border-purple-300 rounded-md focus:border-purple-500 focus:outline-none"
              disabled={showResult}
              placeholder="?"
            />
          </div>
        </div>
      </div>

      {!showResult && (
        <div className="text-center">
          <Button 
            onClick={handleAnswerSubmit}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!userAnswer}
          >
            Verificar Respuesta
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {currentExerciseType === 'strategy' ? renderStrategyExercise() : renderVerbalExercise()}
      
      {showResult && (
        <div className="mt-6 text-center">
          <div className="text-lg font-semibold text-green-600 mb-4">
            {currentExerciseType === 'strategy' 
              ? '¡Excelente! La propiedad asociativa nos ayuda a agrupar números estratégicamente.'
              : `¡Correcto! El total es ${correctAnswer}. La propiedad asociativa nos permite cambiar la agrupación para facilitar el cálculo.`
            }
          </div>
          
          {currentExerciseType === 'strategy' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-700 font-medium">
                Estrategia óptima: Buscar números que sumen 10, 20, o números redondos facilita el cálculo mental.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerbalProblemExercise;