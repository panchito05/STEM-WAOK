import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Lightbulb } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssociativePropertyProblem, type ModuleSettings } from './types';
import { generateProblems } from './utils';
// import { useProgress } from "@/context/ProgressContext";
// import ProfessorMode from './ProfessorMode';

// Animales para el Nivel 1
const ANIMALS = [
  { emoji: '🐶', name: 'perro', color: '#FED7D7' },
  { emoji: '🐱', name: 'gato', color: '#D7F4FD' },
  { emoji: '🐰', name: 'conejo', color: '#D7FDD7' },
  { emoji: '🐸', name: 'rana', color: '#FDF7D7' },
  { emoji: '🐺', name: 'lobo', color: '#E7D7FD' },
  { emoji: '🦊', name: 'zorro', color: '#FDD7E7' },
  { emoji: '🐯', name: 'tigre', color: '#D7E7FD' },
  { emoji: '🐨', name: 'koala', color: '#FDD7A7' }
];

// Nivel 1: Principiante - Agrupar Objetos Visuales
const Level1Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [selectedGrouping, setSelectedGrouping] = useState<'first' | 'second' | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const operands = problem.operands.slice(0, 3);
  const totalAnimals = operands[0] + operands[1] + operands[2];
  const allAnimals = Array(totalAnimals).fill(0).map((_, i) => ANIMALS[i % ANIMALS.length]);
  
  const groupings = {
    first: {
      group1: allAnimals.slice(0, operands[0] + operands[1]),
      group2: allAnimals.slice(operands[0] + operands[1]),
      ungrouped: allAnimals.slice(operands[0] + operands[1])
    },
    second: {
      group1: allAnimals.slice(0, operands[0]),
      group2: allAnimals.slice(operands[0]),
      ungrouped: []
    }
  };
  
  const handleGroupingSelect = (grouping: 'first' | 'second') => {
    if (disabled) return;
    setSelectedGrouping(grouping);
    setShowResult(true);
    onAnswer(problem.correctAnswer);
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-blue-600 mb-2">Nivel 1: Agrupar Objetos</h3>
        <p className="text-gray-600">Agrupa los animales de dos formas diferentes y verifica que el total es el mismo</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="text-lg font-semibold mb-4">
            Tienes {operands[0]} + {operands[1]} + {operands[2]} = {totalAnimals} animales
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Primera agrupación: (a + b) + c */}
            <button
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedGrouping === 'first' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => handleGroupingSelect('first')}
              disabled={disabled}
            >
              <div className="text-center mb-3">
                <div className="font-semibold">({operands[0]} + {operands[1]}) + {operands[2]}</div>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-yellow-100 rounded border-2 border-dashed border-yellow-400">
                  <div className="text-xs text-yellow-700 mb-1">Grupo 1: {operands[0]} + {operands[1]} = {operands[0] + operands[1]}</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {groupings.first.group1.map((animal, i) => (
                      <span key={i} className="text-2xl">{animal.emoji}</span>
                    ))}
                  </div>
                </div>
                <div className="text-lg font-bold">+</div>
                <div className="p-2 bg-blue-100 rounded border-2 border-dashed border-blue-400">
                  <div className="text-xs text-blue-700 mb-1">Grupo 2: {operands[2]}</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {groupings.first.group2.map((animal, i) => (
                      <span key={i} className="text-2xl">{animal.emoji}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
            
            {/* Segunda agrupación: a + (b + c) */}
            <button
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedGrouping === 'second' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => handleGroupingSelect('second')}
              disabled={disabled}
            >
              <div className="text-center mb-3">
                <div className="font-semibold">{operands[0]} + ({operands[1]} + {operands[2]})</div>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-green-100 rounded border-2 border-dashed border-green-400">
                  <div className="text-xs text-green-700 mb-1">Grupo 1: {operands[0]}</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {groupings.second.group1.map((animal, i) => (
                      <span key={i} className="text-2xl">{animal.emoji}</span>
                    ))}
                  </div>
                </div>
                <div className="text-lg font-bold">+</div>
                <div className="p-2 bg-purple-100 rounded border-2 border-dashed border-purple-400">
                  <div className="text-xs text-purple-700 mb-1">Grupo 2: {operands[1]} + {operands[2]} = {operands[1] + operands[2]}</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {groupings.second.group2.map((animal, i) => (
                      <span key={i} className="text-2xl">{animal.emoji}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        {showResult && (
          <div className="text-center mt-6 p-4 bg-white border-2 border-blue-400 rounded-lg">
            <div className="text-xl font-bold text-blue-700 mb-2">
              ¡Perfecto! Ambas formas dan el mismo resultado: {totalAnimals}
            </div>
            <div className="text-sm text-gray-600">
              La propiedad asociativa nos permite agrupar de diferentes maneras
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Nivel 2: Elemental - Mover Paréntesis con Números Simples
const Level2Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [leftParenPos, setLeftParenPos] = useState<number>(0);
  const [rightParenPos, setRightParenPos] = useState<number>(1);
  const [showResult, setShowResult] = useState(false);
  
  const operands = problem.operands.slice(0, 3);
  const correctAnswer = problem.correctAnswer;
  
  const leftExpression = `(${operands[0]} + ${operands[1]}) + ${operands[2]}`;
  const rightExpression = `${operands[0]} + (${operands[1]} + ${operands[2]})`;
  
  const leftAnswer = (operands[0] + operands[1]) + operands[2];
  const rightAnswer = operands[0] + (operands[1] + operands[2]);
  
  const handleVerify = () => {
    if (disabled) return;
    setShowResult(true);
    onAnswer(correctAnswer);
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-green-600 mb-2">Nivel 2: Mover Paréntesis</h3>
        <p className="text-gray-600">Mueve los paréntesis y observa que el resultado no cambia</p>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Primera expresión */}
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                <span className="text-red-500 text-3xl">(</span>
                <span>{operands[0]} + {operands[1]}</span>
                <span className="text-red-500 text-3xl">)</span>
                <span className="text-gray-600">+</span>
                <span>{operands[2]}</span>
              </div>
              <div className="text-lg text-gray-600 mb-2">Primero calcula:</div>
              <div className="text-xl font-semibold mb-2">
                <span className="bg-yellow-200 px-2 py-1 rounded">{operands[0]} + {operands[1]} = {operands[0] + operands[1]}</span>
              </div>
              <div className="text-lg text-gray-600 mb-2">Luego:</div>
              <div className="text-xl font-semibold mb-4">
                <span className="bg-blue-200 px-2 py-1 rounded">{operands[0] + operands[1]} + {operands[2]} = {leftAnswer}</span>
              </div>
            </div>
          </div>
          
          {/* Segunda expresión */}
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                <span>{operands[0]}</span>
                <span className="text-gray-600">+</span>
                <span className="text-red-500 text-3xl">(</span>
                <span>{operands[1]} + {operands[2]}</span>
                <span className="text-red-500 text-3xl">)</span>
              </div>
              <div className="text-lg text-gray-600 mb-2">Primero calcula:</div>
              <div className="text-xl font-semibold mb-2">
                <span className="bg-yellow-200 px-2 py-1 rounded">{operands[1]} + {operands[2]} = {operands[1] + operands[2]}</span>
              </div>
              <div className="text-lg text-gray-600 mb-2">Luego:</div>
              <div className="text-xl font-semibold mb-4">
                <span className="bg-blue-200 px-2 py-1 rounded">{operands[0]} + {operands[1] + operands[2]} = {rightAnswer}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <button
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-semibold"
            onClick={handleVerify}
            disabled={disabled}
          >
            Verificar que son iguales
          </button>
        </div>
        
        {showResult && (
          <div className="text-center mt-6 p-4 bg-white border-2 border-green-400 rounded-lg">
            <div className="text-xl font-bold text-green-700 mb-2">
              ¡Correcto! Ambas expresiones dan {correctAnswer}
            </div>
            <div className="text-md text-green-600 mb-2">
              {leftExpression} = {leftAnswer}
            </div>
            <div className="text-md text-green-600 mb-2">
              {rightExpression} = {rightAnswer}
            </div>
            <div className="text-sm text-gray-600">
              Los paréntesis cambian el orden pero no el resultado
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Nivel 3: Intermedio – Aplicar la Propiedad en Ejercicios Guiados
const Level3Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [exerciseType, setExerciseType] = useState<'complete' | 'choice'>('complete');
  
  const operands = problem.operands.slice(0, 3);
  const correctAnswer = problem.correctAnswer;
  
  // Ejercicio tipo completar
  const leftExpression = `(${operands[0]} + ${operands[1]}) + ${operands[2]}`;
  const rightIncomplete = `${operands[0]} + (___ + ___)`;
  const correctCompletion = `${operands[0]} + (${operands[1]} + ${operands[2]})`;
  
  // Ejercicio tipo opción múltiple
  const questionExpression = `(${operands[0]} + ${operands[1]}) + ${operands[2]}`;
  const options = [
    `${operands[0]} + (${operands[1]} + ${operands[2]})`, // Correcto
    `(${operands[0]} + ${operands[2]}) + ${operands[1]}`, // Incorrecto pero válido
    `${operands[0]} × (${operands[1]} + ${operands[2]})`, // Incorrecto
  ];
  
  const handleComplete = () => {
    if (disabled) return;
    const inputNumbers = userAnswer.split('+').map(n => parseInt(n.trim()));
    if (inputNumbers.length === 2 && inputNumbers[0] === operands[1] && inputNumbers[1] === operands[2]) {
      setShowResult(true);
      onAnswer(correctAnswer);
    }
  };
  
  const handleOptionSelect = (option: string) => {
    if (disabled) return;
    setSelectedOption(option);
    if (option === options[0]) {
      setShowResult(true);
      onAnswer(correctAnswer);
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-orange-600 mb-2">Nivel 3: Ejercicios Guiados</h3>
        <p className="text-gray-600">Practica la propiedad asociativa con ejercicios estructurados</p>
      </div>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        {/* Selector de tipo de ejercicio */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              exerciseType === 'complete' ? 'border-orange-500 bg-orange-100' : 'border-gray-300 hover:border-orange-300'
            }`}
            onClick={() => setExerciseType('complete')}
            disabled={disabled}
          >
            Completar expresión
          </button>
          <button
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              exerciseType === 'choice' ? 'border-orange-500 bg-orange-100' : 'border-gray-300 hover:border-orange-300'
            }`}
            onClick={() => setExerciseType('choice')}
            disabled={disabled}
          >
            Opción múltiple
          </button>
        </div>
        
        {exerciseType === 'complete' ? (
          // Ejercicio de completar
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-4">
                {leftExpression} = {correctAnswer}
              </div>
              <p className="text-lg mb-4">Completa la otra forma:</p>
              <div className="text-2xl font-bold mb-4">
                {operands[0]} + (
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-20 mx-2 px-2 py-1 border-2 border-gray-300 rounded text-center"
                  placeholder="a + b"
                  disabled={disabled}
                />
                ) = ___
              </div>
              <button
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                onClick={handleComplete}
                disabled={disabled}
              >
                Verificar
              </button>
            </div>
          </div>
        ) : (
          // Ejercicio de opción múltiple
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg mb-4">¿Cuál es igual a {questionExpression}?</p>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <button
                    key={index}
                    className={`w-full p-4 text-lg border-2 rounded-lg transition-all ${
                      selectedOption === option 
                        ? (option === options[0] ? 'border-green-500 bg-green-100' : 'border-red-500 bg-red-100')
                        : 'border-gray-300 hover:border-orange-400 bg-white'
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    disabled={disabled}
                  >
                    {String.fromCharCode(97 + index)}) {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {showResult && (
          <div className="text-center mt-6 p-4 bg-white border-2 border-orange-400 rounded-lg">
            <div className="text-xl font-bold text-orange-700 mb-2">
              ¡Correcto! Las expresiones son equivalentes
            </div>
            <div className="text-md text-orange-600 mb-2">
              {leftExpression} = {correctAnswer}
            </div>
            <div className="text-md text-orange-600 mb-2">
              {correctCompletion} = {correctAnswer}
            </div>
            <div className="text-sm text-gray-600">
              Refuerza la identificación de expresiones equivalentes
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Nivel 4: Avanzado – Resolver Problemas Verbales y Mentales
const Level4Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<'mental' | 'verbal'>('mental');
  
  const operands = problem.operands.slice(0, 3);
  const correctAnswer = problem.correctAnswer;
  
  // Problema de cálculo mental
  const mentalExpression = `${operands[0]} + ${operands[1]} + ${operands[2]}`;
  const strategies = [
    {
      name: `Agrupar (${operands[0]} + ${operands[1]}) + ${operands[2]}`,
      calculation: `(${operands[0]} + ${operands[1]}) + ${operands[2]} = ${operands[0] + operands[1]} + ${operands[2]} = ${correctAnswer}`,
      isEfficient: (operands[0] + operands[1]) % 10 === 0
    },
    {
      name: `Agrupar ${operands[0]} + (${operands[1]} + ${operands[2]})`,
      calculation: `${operands[0]} + (${operands[1]} + ${operands[2]}) = ${operands[0]} + ${operands[1] + operands[2]} = ${correctAnswer}`,
      isEfficient: (operands[1] + operands[2]) % 10 === 0
    }
  ];
  
  const handleStrategySelect = (strategy: string) => {
    if (disabled) return;
    setSelectedStrategy(strategy);
    setShowSolution(true);
    onAnswer(correctAnswer);
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-red-600 mb-2">Nivel 4: Problemas Verbales y Mentales</h3>
        <p className="text-gray-600">Usa la propiedad asociativa para facilitar cálculos mentales</p>
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        {/* Selector de tipo de problema */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              currentProblem === 'mental' ? 'border-red-500 bg-red-100' : 'border-gray-300 hover:border-red-300'
            }`}
            onClick={() => setCurrentProblem('mental')}
            disabled={disabled}
          >
            Cálculo Mental
          </button>
          <button
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              currentProblem === 'verbal' ? 'border-red-500 bg-red-100' : 'border-gray-300 hover:border-red-300'
            }`}
            onClick={() => setCurrentProblem('verbal')}
            disabled={disabled}
          >
            Problema Verbal
          </button>
        </div>
        
        {currentProblem === 'mental' ? (
          // Problema de cálculo mental
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-4">{mentalExpression}</div>
              <p className="text-lg mb-4">Agrupa los números que sumen 10 primero (si es posible):</p>
              <div className="space-y-3">
                {strategies.map((strategy, index) => (
                  <button
                    key={index}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                      strategy.isEfficient 
                        ? 'border-green-400 bg-green-50 hover:border-green-500'
                        : 'border-gray-300 bg-white hover:border-red-400'
                    }`}
                    onClick={() => handleStrategySelect(strategy.name)}
                    disabled={disabled}
                  >
                    <div className="font-semibold">{strategy.name}</div>
                    {strategy.isEfficient && (
                      <div className="text-sm text-green-600 mt-1">✓ Estrategia recomendada</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Problema verbal
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-lg text-gray-800">
                "Luis tiene {operands[0]} canicas, Ana tiene {operands[1]} y Carlos tiene {operands[2]}. 
                ¿Cómo puedes agruparlos para hacer la cuenta más fácil?"
              </p>
            </div>
            <div className="space-y-3">
              {strategies.map((strategy, index) => (
                <button
                  key={index}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                    strategy.isEfficient 
                      ? 'border-green-400 bg-green-50 hover:border-green-500'
                      : 'border-gray-300 bg-white hover:border-red-400'
                  }`}
                  onClick={() => handleStrategySelect(strategy.name)}
                  disabled={disabled}
                >
                  <div className="font-semibold">{strategy.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{strategy.calculation}</div>
                  {strategy.isEfficient && (
                    <div className="text-sm text-green-600 mt-1">✓ Más fácil de calcular</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {showSolution && (
          <div className="text-center mt-6 p-4 bg-white border-2 border-red-400 rounded-lg">
            <div className="text-xl font-bold text-red-700 mb-2">
              ¡Excelente estrategia! Resultado: {correctAnswer}
            </div>
            <div className="text-md text-red-600 mb-2">
              Estrategia seleccionada: {selectedStrategy}
            </div>
            <div className="text-sm text-gray-600">
              La propiedad asociativa te permite elegir la agrupación más conveniente para calcular mentalmente
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Nivel 5: Experto – Crear y Justificar Expresiones Equivalentes
const Level5Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [userExpressions, setUserExpressions] = useState<{expr1: string, expr2: string}>({expr1: '', expr2: ''});
  const [openQuestion, setOpenQuestion] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [currentTask, setCurrentTask] = useState<'create' | 'justify'>('create');
  const [includeLevel4, setIncludeLevel4] = useState(Math.random() < 0.5); // 50% probabilidad
  
  const operands = problem.operands.slice(0, 3);
  const targetTotal = problem.correctAnswer;
  
  const handleCreateExpressions = () => {
    if (disabled) return;
    // Verificar que las expresiones sean correctas
    const expr1Expected = `(${operands[0]} + ${operands[1]}) + ${operands[2]}`;
    const expr2Expected = `${operands[0]} + (${operands[1]} + ${operands[2]})`;
    
    const isCorrect = (
      userExpressions.expr1.replace(/\s/g, '') === expr1Expected.replace(/\s/g, '') &&
      userExpressions.expr2.replace(/\s/g, '') === expr2Expected.replace(/\s/g, '')
    ) || (
      userExpressions.expr1.replace(/\s/g, '') === expr2Expected.replace(/\s/g, '') &&
      userExpressions.expr2.replace(/\s/g, '') === expr1Expected.replace(/\s/g, '')
    );
    
    if (isCorrect) {
      setShowResult(true);
      onAnswer(targetTotal);
    }
  };
  
  const handleJustification = () => {
    if (disabled) return;
    if (openQuestion.length > 20) { // Respuesta mínima
      setShowResult(true);
      onAnswer(targetTotal);
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-purple-600 mb-2">Nivel 5: Crear y Justificar</h3>
        <p className="text-gray-600">Demuestra dominio completo aplicando la propiedad de forma autónoma</p>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        {/* Nota: Combina ejercicios de nivel 4 aleatoriamente */}
        {includeLevel4 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              📝 Este nivel incluye ejercicios del Nivel 4 combinados aleatoriamente
            </div>
          </div>
        )}
        
        {/* Selector de tarea */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              currentTask === 'create' ? 'border-purple-500 bg-purple-100' : 'border-gray-300 hover:border-purple-300'
            }`}
            onClick={() => setCurrentTask('create')}
            disabled={disabled}
          >
            Crear Expresiones
          </button>
          <button
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              currentTask === 'justify' ? 'border-purple-500 bg-purple-100' : 'border-gray-300 hover:border-purple-300'
            }`}
            onClick={() => setCurrentTask('justify')}
            disabled={disabled}
          >
            Justificar Propiedad
          </button>
        </div>
        
        {currentTask === 'create' ? (
          // Tarea de crear expresiones
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-4">Total objetivo: {targetTotal}</div>
              <div className="text-lg mb-4">Y tres números: {operands.join(', ')}</div>
              <p className="text-md mb-4">Crea dos expresiones asociativas que den {targetTotal}:</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expresión 1:</label>
                  <input
                    type="text"
                    value={userExpressions.expr1}
                    onChange={(e) => setUserExpressions(prev => ({...prev, expr1: e.target.value}))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center"
                    placeholder="(a + b) + c"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expresión 2:</label>
                  <input
                    type="text"
                    value={userExpressions.expr2}
                    onChange={(e) => setUserExpressions(prev => ({...prev, expr2: e.target.value}))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center"
                    placeholder="a + (b + c)"
                    disabled={disabled}
                  />
                </div>
              </div>
              
              <button
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                onClick={handleCreateExpressions}
                disabled={disabled}
              >
                Verificar Expresiones
              </button>
            </div>
          </div>
        ) : (
          // Tarea de justificación
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-lg text-gray-800">
                "¿Es cierto que (a + b) + c siempre da lo mismo que a + (b + c)? ¿Por qué?"
              </p>
            </div>
            
            <textarea
              value={openQuestion}
              onChange={(e) => setOpenQuestion(e.target.value)}
              className="w-full h-32 px-3 py-2 border-2 border-gray-300 rounded-lg"
              placeholder="Explica con tus propias palabras por qué la propiedad asociativa funciona..."
              disabled={disabled}
            />
            
            <button
              className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              onClick={handleJustification}
              disabled={disabled}
            >
              Enviar Justificación
            </button>
          </div>
        )}
        
        {showResult && (
          <div className="text-center mt-6 p-4 bg-white border-2 border-purple-400 rounded-lg">
            <div className="text-xl font-bold text-purple-700 mb-2">
              ¡Excelente trabajo! Dominio completo demostrado
            </div>
            {currentTask === 'create' ? (
              <div className="space-y-2">
                <div className="text-md text-purple-600">Expresiones creadas correctamente:</div>
                <div className="text-sm text-gray-600">{userExpressions.expr1} = {targetTotal}</div>
                <div className="text-sm text-gray-600">{userExpressions.expr2} = {targetTotal}</div>
              </div>
            ) : (
              <div className="text-md text-purple-600">
                Justificación recibida. La propiedad asociativa es fundamental en matemáticas.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

type UserAnswerType = {
  problemId: string;
  problem: AssociativePropertyProblem;
  userAnswer: number;
  isCorrect: boolean;
  status: 'correct' | 'incorrect' | 'revealed';
  attempts: number;
  timestamp: number;
};

interface YoutubeVideoMetadata {
  url: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
  loading: boolean;
  error: boolean;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const [problems, setProblems] = useState<AssociativePropertyProblem[]>([]);
  const [problemIndex, setProblemIndex] = useState(0);
  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  const [userAnswerHistory, setUserAnswerHistory] = useState<UserAnswerType[]>([]);
  const [answerFeedback, setAnswerFeedback] = useState<string>('');
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [showProfessorMode, setShowProfessorMode] = useState(false);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(settings.difficulty);

  const waitingRef = useRef(false);
  const digitBoxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const boxRefsArrayRef = useRef<(HTMLDivElement | null)[]>([]);

  // const { updateProgress } = useProgress();

  const currentProblem = problems[problemIndex] || null;
  const currentTranslations = {
    settings: 'Configuración',
    previous: 'Anterior',
    next: 'Siguiente',
    submit: 'Enviar',
    check: 'Verificar',
    correctAnswer: '¡Respuesta correcta!',
    correctAnswerAfterReview: 'Correcto después de revisar',
    checkingAnswer: 'Verificando respuesta...',
    correctShort: 'Correcto',
    attempts: 'Intentos',
    showProfessorMode: 'Modo Profesor',
    hideProfessorMode: 'Ocultar Profesor',
    showProfessorModeTooltip: 'Activar explicación detallada',
    hideProfessorModeTooltip: 'Ocultar explicación detallada'
  };

  useEffect(() => {
    const newProblems = generateProblems(settings);
    setProblems(newProblems);
    setProblemIndex(0);
    setUserAnswerHistory([]);
    setAdaptiveDifficulty(settings.difficulty);
  }, [settings]);

  useEffect(() => {
    if (currentProblem) {
      setDigitAnswers(Array(currentProblem.answerMaxDigits).fill(""));
      setFocusedDigitIndex(null);
      setAnswerFeedback('');
      setExerciseCompleted(false);
      setViewingPrevious(false);
      
      const existingAnswer = userAnswerHistory[problemIndex];
      if (existingAnswer) {
        setExerciseCompleted(true);
        setViewingPrevious(true);
        const answerStr = existingAnswer.userAnswer.toString();
        const newDigitAnswers = Array(currentProblem.answerMaxDigits).fill("");
        for (let i = 0; i < answerStr.length && i < newDigitAnswers.length; i++) {
          newDigitAnswers[i] = answerStr[i];
        }
        setDigitAnswers(newDigitAnswers);
      }
    }
  }, [currentProblem, problemIndex, userAnswerHistory]);

  const getCurrentAnswer = useCallback((): number => {
    const answerStr = digitAnswers.join('');
    return answerStr ? parseInt(answerStr, 10) : 0;
  }, [digitAnswers]);

  const goToNextProblem = () => {
    if (problemIndex < problems.length - 1) {
      setProblemIndex(problemIndex + 1);
    }
  };

  const goToPreviousProblem = () => {
    if (problemIndex > 0) {
      setProblemIndex(problemIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (!currentProblem || waitingRef.current || viewingPrevious) return;
    
    waitingRef.current = true;
    const userAnswer = getCurrentAnswer();
    const isCorrect = userAnswer === currentProblem.correctAnswer;
    
    setTimeout(() => {
      const existingEntry = userAnswerHistory[problemIndex];
      const attempts = existingEntry ? existingEntry.attempts + 1 : 1;
      
      const newHistoryEntry: UserAnswerType = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        status: isCorrect ? 'correct' : 'incorrect',
        attempts: attempts,
        timestamp: Date.now()
      };

      setUserAnswerHistory(prev => {
        const newHistory = [...prev];
        newHistory[problemIndex] = newHistoryEntry;
        return newHistory;
      });

      if (isCorrect) {
        setAnswerFeedback(currentTranslations.correctShort);
        setExerciseCompleted(true);
        // updateProgress('associative-property', problemIndex + 1, problems.length);
      } else {
        setAnswerFeedback(`Incorrecto. La respuesta es ${currentProblem.correctAnswer}`);
      }
      
      waitingRef.current = false;
    }, 1000);
  };

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-gray-600">Cargando ejercicios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-2 py-3 sm:px-4 sm:py-5 rounded-xl shadow-lg min-h-[calc(100vh-8rem)] md:min-h-0 flex flex-col ${
      settings.difficulty === "beginner" ? "bg-blue-50 border-blue-200" :
      settings.difficulty === "elementary" ? "bg-emerald-50 border-emerald-200" :
      settings.difficulty === "intermediate" ? "bg-orange-50 border-orange-200" :
      settings.difficulty === "advanced" ? "bg-purple-50 border-purple-200" :
      settings.difficulty === "expert" ? "bg-rose-50 border-rose-200" :
      "bg-indigo-50 border-indigo-200"
    } border-2`}>
      {/* Header - Responsive Design: Stack vertically on mobile, horizontal on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex flex-row justify-between items-center sm:flex-col sm:items-start">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Associative Property</h2>
            <span className="sm:hidden font-medium text-sm bg-[#3b82f6] text-[#f9fafb] px-2 py-1 rounded">
              Problem {problemIndex + 1} de {problems.length}
            </span>
          </div>
          
          {/* Top row info - Timer and basic stats */}
          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
              {/* Rewards button - Desktop only, left of timer */}
              <button className="hidden sm:flex items-center gap-1 py-1 px-2 text-xs text-yellow-600 hover:bg-yellow-50 border border-yellow-300 bg-yellow-50 rounded">
                <span>⭐</span>
                <span>View Rewards (⭐105 pts)</span>
              </button>
              
              <span className="font-medium text-gray-700 flex items-center">
                <span className="mr-1">🕐</span>
                00:00
              </span>
              
              <span className="font-medium p-1 rounded bg-gray-100 text-gray-700">
                Attempts: 0/2
              </span>
              
              <span className="font-medium p-1 rounded bg-gray-100 text-gray-700">
                Racha: 0 (10)
              </span>
              
              <span className="font-medium p-1 rounded bg-gray-100 text-gray-700">
                Level: Intermediate
              </span>
          </div>
      </div>

      {/* Second row - More controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 order-2 sm:order-1">
              <button className="flex items-center gap-1 py-1 px-2 text-xs text-blue-600 hover:bg-blue-50 border border-blue-300 bg-blue-50 rounded">
                  Problem: 1 de 10
              </button>
              <span className="text-xs text-gray-600">Score 0</span>
              <button className="flex items-center gap-1 py-1 px-2 text-xs text-blue-600 hover:bg-blue-50 border border-blue-300 bg-blue-50 rounded">
                  Professor Mode 📘
              </button>
              <button className="flex items-center gap-1 py-1 px-2 text-xs text-gray-600 hover:bg-gray-50 border border-gray-300 bg-gray-50 rounded">
                  Watch Explanatory Video 📺
              </button>
          </div>
          
          <div className="flex items-center gap-2 order-1 sm:order-2">
              <button className="flex items-center gap-1 py-1 px-2 text-xs text-gray-600 hover:bg-gray-50 border border-gray-300 bg-gray-50 rounded">
                  📊 Exercise History
              </button>
              <button 
                onClick={onOpenSettings}
                className="flex items-center gap-1 py-1 px-2 text-xs text-gray-600 hover:bg-gray-50 border border-gray-300 bg-gray-50 rounded"
              >
                  ⚙️ Settings
              </button>
          </div>
      </div>

      {/* Problem Display Area - Level-Specific Components */}
      <div className="rounded-lg mb-4 shadow-sm bg-white border">
          {(() => {
            const currentDifficulty = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
            const isDisabled = viewingPrevious || exerciseCompleted || waitingRef.current;
            
            const handleLevelAnswer = (answer: number) => {
              if (isDisabled) return;
              
              // Simular el input de respuesta automáticamente
              const answerString = answer.toString();
              const newDigitAnswers = Array(currentProblem.answerMaxDigits).fill("");
              for (let i = 0; i < answerString.length && i < newDigitAnswers.length; i++) {
                newDigitAnswers[i] = answerString[i];
              }
              setDigitAnswers(newDigitAnswers);
              
              // Trigger automatic verification after a brief delay
              setTimeout(() => {
                handleSubmit();
              }, 500);
            };
            
            // Renderizar componente específico según el nivel de dificultad
            switch (currentDifficulty) {
              case 'beginner':
                return <Level1Component problem={currentProblem} onAnswer={handleLevelAnswer} disabled={isDisabled} />;
              case 'elementary':
                return <Level2Component problem={currentProblem} onAnswer={handleLevelAnswer} disabled={isDisabled} />;
              case 'intermediate':
                return <Level3Component problem={currentProblem} onAnswer={handleLevelAnswer} disabled={isDisabled} />;
              case 'advanced':
                return <Level4Component problem={currentProblem} onAnswer={handleLevelAnswer} disabled={isDisabled} />;
              case 'expert':
                return <Level5Component problem={currentProblem} onAnswer={handleLevelAnswer} disabled={isDisabled} />;
              default:
                // Fallback para mostrar formato tradicional si es necesario
                return (
                  <div className="p-4">
                    <div className="text-2xl font-bold flex items-center justify-center gap-2">
                      <span>{currentProblem.operands[0]}</span>
                      <span className="text-gray-600">+</span>
                      <span>{currentProblem.operands.length > 1 ? currentProblem.operands[1] : '?'}</span>
                      {currentProblem.operands.length > 2 && (
                        <>
                          <span className="text-gray-600">+</span>
                          <span>{currentProblem.operands[2]}</span>
                        </>
                      )}
                      <span className="text-gray-600">=</span>
                    </div>
                  </div>
                );
            }
          })()}
      </div>

      {/* Navigation and Controls */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <Button
              onClick={goToPreviousProblem}
              disabled={problemIndex === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">
                {currentTranslations.previous}
              </span>
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                {problemIndex + 1} / {problems.length}
              </span>
              <div className="flex gap-1">
                {problems.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index < problemIndex
                        ? (userAnswerHistory?.[index]?.isCorrect ? 'bg-green-500' : 'bg-red-500')
                        : index === problemIndex
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={exerciseCompleted ? goToNextProblem : () => {}}
              disabled={!exerciseCompleted || problemIndex === problems.length - 1}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <span className="text-xs">
                {currentTranslations.next}
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowProfessorMode(!showProfessorMode)}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm">
                    {showProfessorMode ? currentTranslations.hideProfessorMode : currentTranslations.showProfessorMode}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showProfessorMode ? currentTranslations.hideProfessorModeTooltip : currentTranslations.showProfessorModeTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Professor Mode */}
        {showProfessorMode && (
          <div className="professor-mode bg-purple-50 border border-purple-200 rounded-lg p-6 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-700">Modo Profesor</h3>
              <button
                onClick={() => setShowProfessorMode(false)}
                className="text-purple-600 hover:text-purple-800 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-700 mb-2">Explicación de la Propiedad Asociativa:</h4>
                <p className="text-gray-700 mb-3">
                  La propiedad asociativa dice que cuando sumamos tres o más números, 
                  podemos agruparlos de diferentes maneras sin cambiar el resultado.
                </p>
                
                <div className="space-y-2">
                  <div className="text-lg">
                    <span className="font-semibold">Primera forma:</span> ({currentProblem.operands[0]} + {currentProblem.operands[1]}) + {currentProblem.operands[2]} = {currentProblem.operands[0] + currentProblem.operands[1]} + {currentProblem.operands[2]} = {currentProblem.correctAnswer}
                  </div>
                  <div className="text-lg">
                    <span className="font-semibold">Segunda forma:</span> {currentProblem.operands[0]} + ({currentProblem.operands[1]} + {currentProblem.operands[2]}) = {currentProblem.operands[0]} + {currentProblem.operands[1] + currentProblem.operands[2]} = {currentProblem.correctAnswer}
                  </div>
                </div>
                
                <p className="text-gray-600 mt-3 text-sm">
                  ¡Ambas formas dan el mismo resultado! Esto es lo que nos enseña la propiedad asociativa.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }