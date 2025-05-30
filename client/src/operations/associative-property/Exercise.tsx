import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lightbulb, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssociativePropertyProblem, type ModuleSettings } from './types';
import { generateProblems } from './utils';
import { useProgress } from "@/context/ProgressContext";

// Animales para el Nivel 1
const ANIMALS = [
  { emoji: '🐶', name: 'perro', color: '#FED7D7' },
  { emoji: '🐱', name: 'gato', color: '#BEE3F8' },
  { emoji: '🐰', name: 'conejo', color: '#C6F6D5' },
  { emoji: '🐻', name: 'oso', color: '#FEEBC8' },
  { emoji: '🦊', name: 'zorro', color: '#FECACA' },
  { emoji: '🐼', name: 'panda', color: '#E2E8F0' },
  { emoji: '🐯', name: 'tigre', color: '#FED7AA' },
  { emoji: '🦁', name: 'león', color: '#FEF3C7' }
];

// Level 1 Component - Visual grouping with draggable animals
const Level1Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [draggedAnimal, setDraggedAnimal] = useState<string | null>(null);
  const [groupA, setGroupA] = useState<string[]>([]);
  const [groupB, setGroupB] = useState<string[]>([]);
  const [groupC, setGroupC] = useState<string[]>([]);
  const [currentGrouping, setCurrentGrouping] = useState<'first' | 'second'>('first');

  useEffect(() => {
    // Initialize animals for each operand
    const animalsA = Array(problem.operands[0]).fill(0).map((_, i) => `${ANIMALS[0].emoji}-${i}`);
    const animalsB = Array(problem.operands[1]).fill(0).map((_, i) => `${ANIMALS[1].emoji}-${i}`);
    const animalsC = Array(problem.operands[2]).fill(0).map((_, i) => `${ANIMALS[2].emoji}-${i}`);
    
    setGroupA(animalsA);
    setGroupB(animalsB);
    setGroupC(animalsC);
  }, [problem]);

  const handleGroupingChange = () => {
    setCurrentGrouping(prev => prev === 'first' ? 'second' : 'first');
    onAnswer(problem.correctAnswer);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Nivel 1: Agrupar Objetos Visuales</h3>
        <p className="text-gray-600">Observa cómo podemos agrupar los animales de diferentes maneras</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center items-center gap-4">
          <div className={`p-4 rounded-lg border-2 ${currentGrouping === 'first' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <div className="flex gap-2">
              {groupA.map((animal) => (
                <span key={animal} className="text-2xl">{animal.split('-')[0]}</span>
              ))}
              <span className="text-xl">+</span>
              {groupB.map((animal) => (
                <span key={animal} className="text-2xl">{animal.split('-')[0]}</span>
              ))}
            </div>
          </div>
          <span className="text-xl">+</span>
          <div className="p-4 rounded-lg border-2 border-gray-300">
            {groupC.map((animal) => (
              <span key={animal} className="text-2xl">{animal.split('-')[0]}</span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg">= {problem.operands[0] + problem.operands[1]} + {problem.operands[2]} = {problem.correctAnswer}</p>
        </div>

        <div className="text-center">
          <Button onClick={handleGroupingChange} disabled={disabled}>
            Ver agrupación alternativa
          </Button>
        </div>

        {currentGrouping === 'second' && (
          <div className="space-y-4">
            <div className="flex justify-center items-center gap-4">
              <div className="p-4 rounded-lg border-2 border-gray-300">
                {groupA.map((animal) => (
                  <span key={animal} className="text-2xl">{animal.split('-')[0]}</span>
                ))}
              </div>
              <span className="text-xl">+</span>
              <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50">
                <div className="flex gap-2">
                  {groupB.map((animal) => (
                    <span key={animal} className="text-2xl">{animal.split('-')[0]}</span>
                  ))}
                  <span className="text-xl">+</span>
                  {groupC.map((animal) => (
                    <span key={animal} className="text-2xl">{animal.split('-')[0]}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg">= {problem.operands[0]} + {problem.operands[1] + problem.operands[2]} = {problem.correctAnswer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Level 2 Component - Simple numbers with movable parentheses
const Level2Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [selectedGrouping, setSelectedGrouping] = useState<'first' | 'second' | null>(null);

  const handleGroupingSelect = (grouping: 'first' | 'second') => {
    setSelectedGrouping(grouping);
    onAnswer(problem.correctAnswer);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Nivel 2: Números Simples con Paréntesis Móviles</h3>
        <p className="text-gray-600">Elige dónde colocar los paréntesis para agrupar los números</p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <p className="text-2xl font-mono">{problem.operands[0]} + {problem.operands[1]} + {problem.operands[2]} = ?</p>
        </div>

        <div className="flex justify-center gap-8">
          <Button
            variant={selectedGrouping === 'first' ? 'default' : 'outline'}
            onClick={() => handleGroupingSelect('first')}
            disabled={disabled}
            className="text-lg p-4"
          >
            ({problem.operands[0]} + {problem.operands[1]}) + {problem.operands[2]}
          </Button>
          
          <Button
            variant={selectedGrouping === 'second' ? 'default' : 'outline'}
            onClick={() => handleGroupingSelect('second')}
            disabled={disabled}
            className="text-lg p-4"
          >
            {problem.operands[0]} + ({problem.operands[1]} + {problem.operands[2]})
          </Button>
        </div>

        {selectedGrouping && (
          <div className="text-center space-y-2">
            <p className="text-xl text-green-600">
              {selectedGrouping === 'first' 
                ? `(${problem.operands[0]} + ${problem.operands[1]}) + ${problem.operands[2]} = ${problem.operands[0] + problem.operands[1]} + ${problem.operands[2]} = ${problem.correctAnswer}`
                : `${problem.operands[0]} + (${problem.operands[1]} + ${problem.operands[2]}) = ${problem.operands[0]} + ${problem.operands[1] + problem.operands[2]} = ${problem.correctAnswer}`
              }
            </p>
            <p className="text-gray-600">¡Ambas formas dan el mismo resultado!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Level 3 Component - Larger numbers
const Level3Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    const answer = parseInt(userAnswer);
    if (!isNaN(answer)) {
      onAnswer(answer);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Nivel 3: Números Más Grandes</h3>
        <p className="text-gray-600">Calcula el resultado usando la propiedad asociativa</p>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-mono">{problem.operands[0]} + {problem.operands[1]} + {problem.operands[2]} = ?</p>
        </div>

        <div className="flex justify-center gap-4">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="border rounded px-3 py-2 text-center text-xl"
            placeholder="Tu respuesta"
            disabled={disabled}
          />
          <Button onClick={handleSubmit} disabled={disabled || !userAnswer}>
            Comprobar
          </Button>
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => setShowHint(!showHint)}>
            {showHint ? 'Ocultar' : 'Mostrar'} pista
          </Button>
        </div>

        {showHint && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              Pista: Puedes agrupar de dos formas:<br/>
              • ({problem.operands[0]} + {problem.operands[1]}) + {problem.operands[2]} = {problem.operands[0] + problem.operands[1]} + {problem.operands[2]}<br/>
              • {problem.operands[0]} + ({problem.operands[1]} + {problem.operands[2]}) = {problem.operands[0]} + {problem.operands[1] + problem.operands[2]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Level 4 Component - Decimals and fractions
const Level4Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'first' | 'second' | null>(null);

  const handleMethodSelect = (method: 'first' | 'second') => {
    setSelectedMethod(method);
    onAnswer(problem.correctAnswer);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Nivel 4: Decimales y Fracciones</h3>
        <p className="text-gray-600">Trabaja con números decimales usando la propiedad asociativa</p>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-mono">{problem.operands[0]} + {problem.operands[1]} + {problem.operands[2]} = ?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer ${selectedMethod === 'first' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onClick={() => handleMethodSelect('first')}
          >
            <h4 className="font-semibold mb-2">Método 1:</h4>
            <p>({problem.operands[0]} + {problem.operands[1]}) + {problem.operands[2]}</p>
            <p>= {problem.operands[0] + problem.operands[1]} + {problem.operands[2]}</p>
            <p>= {problem.correctAnswer}</p>
          </div>

          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer ${selectedMethod === 'second' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
            onClick={() => handleMethodSelect('second')}
          >
            <h4 className="font-semibold mb-2">Método 2:</h4>
            <p>{problem.operands[0]} + ({problem.operands[1]} + {problem.operands[2]})</p>
            <p>= {problem.operands[0]} + {problem.operands[1] + problem.operands[2]}</p>
            <p>= {problem.correctAnswer}</p>
          </div>
        </div>

        {selectedMethod && (
          <div className="text-center bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 font-semibold">
              ¡Excelente! Ambos métodos dan el mismo resultado: {problem.correctAnswer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Level 5 Component - Multiple operands and complex expressions
const Level5Component: React.FC<{ problem: AssociativePropertyProblem; onAnswer: (answer: number) => void; disabled: boolean }> = ({ problem, onAnswer, disabled }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedGrouping, setSelectedGrouping] = useState<number | null>(null);

  const groupingOptions = [
    { 
      label: "((a + b) + c) + d", 
      calculation: `((${problem.operands[0]} + ${problem.operands[1]}) + ${problem.operands[2]}) + ${problem.operands[3] || 0}`,
      steps: [
        `(${problem.operands[0]} + ${problem.operands[1]}) = ${problem.operands[0] + problem.operands[1]}`,
        `(${problem.operands[0] + problem.operands[1]} + ${problem.operands[2]}) = ${problem.operands[0] + problem.operands[1] + problem.operands[2]}`,
        `${problem.operands[0] + problem.operands[1] + problem.operands[2]} + ${problem.operands[3] || 0} = ${problem.correctAnswer}`
      ]
    },
    { 
      label: "(a + b) + (c + d)", 
      calculation: `(${problem.operands[0]} + ${problem.operands[1]}) + (${problem.operands[2]} + ${problem.operands[3] || 0})`,
      steps: [
        `(${problem.operands[0]} + ${problem.operands[1]}) = ${problem.operands[0] + problem.operands[1]}`,
        `(${problem.operands[2]} + ${problem.operands[3] || 0}) = ${problem.operands[2] + (problem.operands[3] || 0)}`,
        `${problem.operands[0] + problem.operands[1]} + ${problem.operands[2] + (problem.operands[3] || 0)} = ${problem.correctAnswer}`
      ]
    }
  ];

  const handleGroupingSelect = (index: number) => {
    setSelectedGrouping(index);
    onAnswer(problem.correctAnswer);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Nivel 5: Múltiples Operandos y Expresiones Complejas</h3>
        <p className="text-gray-600">Explora diferentes formas de agrupar múltiples números</p>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-mono">
            {problem.operands[0]} + {problem.operands[1]} + {problem.operands[2]}
            {problem.operands[3] !== undefined && ` + ${problem.operands[3]}`} = ?
          </p>
        </div>

        <div className="space-y-4">
          {groupingOptions.map((option, index) => (
            <div 
              key={index}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedGrouping === index ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleGroupingSelect(index)}
            >
              <h4 className="font-semibold mb-2">{option.label}</h4>
              <p className="text-lg mb-2">{option.calculation}</p>
              
              {selectedGrouping === index && (
                <div className="mt-3 space-y-1 text-sm text-blue-800">
                  <p className="font-semibold">Pasos:</p>
                  {option.steps.map((step, stepIndex) => (
                    <p key={stepIndex}>• {step}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedGrouping !== null && (
          <div className="text-center bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 font-semibold">
              ¡Perfecto! El resultado es {problem.correctAnswer} sin importar cómo agrupemos los números.
            </p>
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

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const [problems, setProblems] = useState<AssociativePropertyProblem[]>([]);
  const [problemIndex, setProblemIndex] = useState(0);
  const [userAnswerHistory, setUserAnswerHistory] = useState<UserAnswerType[]>([]);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [showProfessorMode, setShowProfessorMode] = useState(false);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(settings.difficulty);

  const waitingRef = useRef(false);
  const digitBoxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const boxRefsArrayRef = useRef<(HTMLDivElement | null)[]>([]);

  const progressContext = useProgress();

  const currentProblem = problems[problemIndex] || null;
  const currentTranslations = {
    settings: 'Configuración',
    previous: 'Anterior',
    next: 'Siguiente',
    showProfessorMode: 'Mostrar Modo Profesor',
    hideProfessorMode: 'Ocultar Modo Profesor',
    showProfessorModeTooltip: 'Ver explicación detallada',
    hideProfessorModeTooltip: 'Ocultar explicación'
  };

  useEffect(() => {
    const newProblems = generateProblems(settings);
    setProblems(newProblems);
    setProblemIndex(0);
    setUserAnswerHistory([]);
    setExerciseCompleted(false);
  }, [settings]);

  const handleAnswer = useCallback((userAnswer: number) => {
    if (!currentProblem || exerciseCompleted || waitingRef.current) return;

    waitingRef.current = true;
    const isCorrect = userAnswer === currentProblem.correctAnswer;

    const newAnswerEntry: UserAnswerType = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer,
      isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      attempts: 1,
      timestamp: Date.now()
    };

    setUserAnswerHistory(prev => [...prev, newAnswerEntry]);
    setExerciseCompleted(true);

    setTimeout(() => {
      waitingRef.current = false;
    }, 1000);
  }, [currentProblem, exerciseCompleted]);

  const goToPreviousProblem = () => {
    if (problemIndex > 0) {
      setProblemIndex(problemIndex - 1);
      setExerciseCompleted(false);
    }
  };

  const goToNextProblem = () => {
    if (problemIndex < problems.length - 1) {
      setProblemIndex(problemIndex + 1);
      setExerciseCompleted(false);
    }
  };

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Generando problemas...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
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
                Level: {settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)}
              </span>
          </div>
      </div>

      {/* Second row - More controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 order-2 sm:order-1">
              <button className="flex items-center gap-1 py-1 px-2 text-xs text-blue-600 hover:bg-blue-50 border border-blue-300 bg-blue-50 rounded">
                  Problem: {problemIndex + 1} de {problems.length}
              </button>
              <span className="text-xs text-gray-600">Score 0</span>
              <button 
                onClick={() => setShowProfessorMode(!showProfessorMode)}
                className="flex items-center gap-1 py-1 px-2 text-xs text-blue-600 hover:bg-blue-50 border border-blue-300 bg-blue-50 rounded"
              >
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
          switch (settings.difficulty) {
            case 'beginner':
              return <Level1Component problem={currentProblem} onAnswer={handleAnswer} disabled={exerciseCompleted} />;
            case 'elementary':
              return <Level2Component problem={currentProblem} onAnswer={handleAnswer} disabled={exerciseCompleted} />;
            case 'intermediate':
              return <Level3Component problem={currentProblem} onAnswer={handleAnswer} disabled={exerciseCompleted} />;
            case 'advanced':
              return <Level4Component problem={currentProblem} onAnswer={handleAnswer} disabled={exerciseCompleted} />;
            case 'expert':
              return <Level5Component problem={currentProblem} onAnswer={handleAnswer} disabled={exerciseCompleted} />;
            default:
              return <Level1Component problem={currentProblem} onAnswer={handleAnswer} disabled={exerciseCompleted} />;
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
              
              {currentProblem && (
                <div className="space-y-2">
                  <div className="text-lg">
                    <span className="font-semibold">Primera forma:</span> ({currentProblem.operands[0]} + {currentProblem.operands[1]}) + {currentProblem.operands[2]} = {currentProblem.operands[0] + currentProblem.operands[1]} + {currentProblem.operands[2]} = {currentProblem.correctAnswer}
                  </div>
                  <div className="text-lg">
                    <span className="font-semibold">Segunda forma:</span> {currentProblem.operands[0]} + ({currentProblem.operands[1]} + {currentProblem.operands[2]}) = {currentProblem.operands[0]} + {currentProblem.operands[1] + currentProblem.operands[2]} = {currentProblem.correctAnswer}
                  </div>
                </div>
              )}
              
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