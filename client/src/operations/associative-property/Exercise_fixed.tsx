import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Lightbulb } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssociativePropertyProblem, type ModuleSettings } from './types';
import { generateProblems } from './utils';
import { useProgress } from "@/context/ProgressContext";
import ProfessorMode from './ProfessorMode';

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

  const { updateProgress } = useProgress();

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
        updateProgress('associative-property', problemIndex + 1, problems.length);
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
    <div className="associative-property-exercise bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Propiedad Asociativa</h2>
          <Button
            onClick={onOpenSettings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">
              {currentTranslations.settings}
            </span>
          </Button>
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
      </div>

      {/* Professor Mode */}
      {showProfessorMode && (
        <ProfessorMode
          problem={currentProblem}
          onClose={() => setShowProfessorMode(false)}
          onCorrectAnswer={(wasCorrect: boolean) => {
            if (wasCorrect && !exerciseCompleted) {
              setExerciseCompleted(true);
              updateProgress('associative-property', problemIndex + 1, problems.length);
            }
          }}
        />
      )}
    </div>
  );
}