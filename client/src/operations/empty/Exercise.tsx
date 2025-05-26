// Exercise.tsx - Empty Module (exact copy from Addition with generic changes)
import React, { useState, useEffect, useRef } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateEmptyProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { EmptyProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, Check, Info, Star, RotateCcw, History, Play } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Link } from "wouter";

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

// UserAnswer interface for empty module
interface UserAnswer {
  problemId: string;
  problem: EmptyProblem;
  userAnswer: number;
  isCorrect: boolean;
  status: string;
  attempts: number;
  timestamp: number;
}

export default function EmptyExercise({ settings, onOpenSettings }: ExerciseProps) {
  // Estados principales - exactamente como addition
  const [problemsList, setProblemsList] = useState<EmptyProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswersHistory, setUserAnswersHistory] = useState<(UserAnswer | null)[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [exerciseStartTime] = useState(Date.now());
  
  // Estados de UI - exactamente como addition
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState(0);
  
  // Estados del temporizador - exactamente como addition
  const [timer, setTimer] = useState(0);
  const [problemStartTime, setProblemStartTime] = useState(Date.now());
  const [problemTimer, setProblemTimer] = useState(0);
  const [problemTimerValue, setProblemTimerValue] = useState(settings.timeValue || 0);
  
  // Estados de entrada de dígitos - exactamente como addition
  const [digitValues, setDigitValues] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState(0);
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
  
  // Estados de interacción - exactamente como addition
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("gray");
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [autoContinue, setAutoContinue] = useState(false);
  
  // Estados de progreso y estadísticas - exactamente como addition
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [maxConsecutiveStreak, setMaxConsecutiveStreak] = useState(0);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel>(settings.difficulty as DifficultyLevel);
  
  // Estados de UI adicionales - exactamente como addition
  const [showProfessorMode, setShowProfessorMode] = useState(false);
  const [isExerciseHistoryDialogOpen, setIsExerciseHistoryDialogOpen] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>([]);
  const [rewardStats, setRewardStats] = useState({
    totalPoints: 0,
    showRewardModal: false,
    lastReward: null as any
  });
  
  // Referencias - exactamente como addition
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const waitingRef = useRef(false);
  const boxRefsArrayRef = useRef<(HTMLInputElement | null)[]>([]);
  
  // Contextos
  const { saveExerciseResult } = useProgress();

  const currentProblem = problemsList[currentProblemIndex];
  const isLastProblem = currentProblemIndex === problemsList.length - 1;
  const score = userAnswersHistory.filter(a => a && a.isCorrect).length;
  const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;
  const progressValue = problemsList.length > 0 ? (attemptedProblemsCount / problemsList.length) * 100 : 0;

  // Generar problemas al iniciar - exactamente como addition
  useEffect(() => {
    generateNewProblemSet();
  }, [settings.difficulty, settings.problemCount]);

  const generateNewProblemSet = () => {
    const newProblems: EmptyProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      const problem = generateEmptyProblem(adaptiveDifficulty);
      problem.index = i + 1;
      problem.total = settings.problemCount;
      newProblems.push(problem);
    }
    setProblemsList(newProblems);
    setCurrentProblemIndex(0);
    setUserAnswersHistory(new Array(newProblems.length).fill(null));
    setExerciseCompleted(false);
    setExerciseStarted(false);
    setViewingPrevious(false);
    setTimer(0);
    setConsecutiveCorrectAnswers(0);
    setConsecutiveIncorrectAnswers(0);
  };

  const startExercise = () => {
    setExerciseStarted(true);
    setProblemStartTime(Date.now());
    startTimers();
  };

  const startTimers = () => {
    // Timer principal del ejercicio
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    exerciseTimerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    // Timer por problema
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    singleProblemTimerRef.current = setInterval(() => {
      setProblemTimer(prev => prev + 1);
      if (settings.timeValue > 0) {
        setProblemTimerValue(prev => Math.max(0, prev - 1));
      }
    }, 1000);
  };

  // Inicializar entrada de dígitos cuando cambia el problema - exactamente como addition
  useEffect(() => {
    if (currentProblem) {
      const correctAnswer = currentProblem.correctAnswer;
      const numDigits = correctAnswer.toString().length;
      setDigitValues(new Array(numDigits).fill(''));
      setFocusedDigitIndex(inputDirection === 'rtl' ? numDigits - 1 : 0);
      setCurrentAttempts(0);
      setFeedbackMessage("");
      setWaitingForContinue(false);
      waitingRef.current = false;
      
      if (exerciseStarted) {
        setProblemStartTime(Date.now());
        setProblemTimer(0);
        setProblemTimerValue(settings.timeValue || 0);
      }
    }
  }, [currentProblemIndex, inputDirection, exerciseStarted]);

  // Manejo de entrada de dígitos - exactamente como addition
  const handleDigitInput = (digit: string) => {
    if (waitingRef.current || exerciseCompleted || viewingPrevious) return;
    
    if (!exerciseStarted) startExercise();

    const newDigitValues = [...digitValues];
    newDigitValues[focusedDigitIndex] = digit;
    setDigitValues(newDigitValues);

    // Mover al siguiente dígito
    if (inputDirection === 'rtl') {
      if (focusedDigitIndex > 0) {
        setFocusedDigitIndex(focusedDigitIndex - 1);
      }
    } else {
      if (focusedDigitIndex < digitValues.length - 1) {
        setFocusedDigitIndex(focusedDigitIndex + 1);
      }
    }
  };

  const handleBackspace = () => {
    if (waitingRef.current || exerciseCompleted || viewingPrevious) return;

    const newDigitValues = [...digitValues];
    newDigitValues[focusedDigitIndex] = '';
    setDigitValues(newDigitValues);

    // Mover al dígito anterior
    if (inputDirection === 'rtl') {
      if (focusedDigitIndex < digitValues.length - 1) {
        setFocusedDigitIndex(focusedDigitIndex + 1);
      }
    } else {
      if (focusedDigitIndex > 0) {
        setFocusedDigitIndex(focusedDigitIndex - 1);
      }
    }
  };

  const checkCurrentAnswer = () => {
    if (!currentProblem || waitingRef.current) return;

    if (!exerciseStarted) {
      startExercise();
      return;
    }

    const userAnswer = parseInt(digitValues.join(''));
    if (isNaN(userAnswer) && digitValues.some(d => d !== '')) return;

    const isCorrect = checkAnswer(currentProblem, userAnswer);
    const newAttempts = currentAttempts + 1;
    
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);

    const answerData: UserAnswer = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer,
      isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      attempts: newAttempts,
      timestamp: Date.now()
    };

    setUserAnswersHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentProblemIndex] = answerData;
      return newHistory;
    });

    if (isCorrect) {
      setConsecutiveCorrectAnswers(prev => prev + 1);
      setConsecutiveIncorrectAnswers(0);
      setFeedbackMessage("¡Correcto!");
      setFeedbackColor("green");
    } else {
      setConsecutiveCorrectAnswers(0);
      setConsecutiveIncorrectAnswers(prev => prev + 1);
      setFeedbackMessage(`Incorrecto. La respuesta correcta es: ${currentProblem.correctAnswer}`);
      setFeedbackColor("red");
    }

    setCurrentAttempts(newAttempts);
    setWaitingForContinue(true);
    waitingRef.current = true;

    // Auto-continuar si está habilitado y la respuesta es correcta
    if (isCorrect && autoContinue) {
      setTimeout(() => {
        handleContinue();
      }, 1500);
    }
  };

  const handleContinue = () => {
    setWaitingForContinue(false);
    waitingRef.current = false;
    setFeedbackMessage("");
    
    if (currentProblemIndex < problemsList.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
    } else {
      completeExercise();
    }
  };

  const completeExercise = () => {
    setExerciseCompleted(true);
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);

    // Calcular estadísticas del ejercicio
    const correctAnswers = userAnswersHistory.filter(a => a && a.isCorrect).length;
    const accuracy = userAnswersHistory.length > 0 ? (correctAnswers / userAnswersHistory.length) * 100 : 0;
    const avgTimePerProblem = userAnswersHistory.length > 0 ? timer / userAnswersHistory.length : 0;

    const exerciseResult = {
      operationId: 'empty',
      date: new Date().toISOString(),
      score: correctAnswers,
      totalProblems: problemsList.length,
      timeSpent: timer,
      difficulty: adaptiveDifficulty,
      accuracy,
      avgTimePerProblem,
      avgAttempts: userAnswersHistory.length > 0 ? userAnswersHistory.reduce((sum, a) => sum + (a?.attempts || 0), 0) / userAnswersHistory.length : 0,
      revealedAnswers: 0,
      extra_data: {
        version: '4.0',
        timestamp: Date.now(),
        exerciseId: `empty_${Date.now()}`,
        problemDetails: userAnswersHistory,
        problems: problemsList,
        exerciseType: 'empty',
        summary: {
          operation: 'empty',
          level: adaptiveDifficulty,
          score: {
            correct: correctAnswers,
            total: problemsList.length
          },
          time: timer
        }
      }
    };

    saveExerciseResult(exerciseResult);
  };

  const moveToPreviousProblem = () => {
    if (currentProblemIndex > 0) {
      if (!viewingPrevious) {
        setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
        setViewingPrevious(true);
      }
      setCurrentProblemIndex(prev => prev - 1);
    }
  };

  const returnToActiveProblem = () => {
    setViewingPrevious(false);
    setCurrentProblemIndex(actualActiveProblemIndexBeforeViewingPrevious);
  };

  // Renderizado de las cajas de entrada de dígitos - exactamente como addition
  const renderDigitInputBoxes = () => {
    if (!currentProblem) return null;

    return (
      <div className="flex justify-center gap-1 mb-6">
        {digitValues.map((digit, index) => (
          <input
            key={index}
            ref={el => boxRefsArrayRef.current[index] = el}
            type="text"
            value={digit}
            onChange={() => {}} // Controlado por el teclado numérico
            onFocus={() => setFocusedDigitIndex(index)}
            className={`w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md text-center transition-all select-none ${
              index === focusedDigitIndex ? 'border-purple-500 ring-2 ring-purple-300 shadow-lg' : 'border-gray-300'
            } ${waitingRef.current || exerciseCompleted || viewingPrevious ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-default' : ''}`}
            disabled={waitingRef.current || exerciseCompleted || viewingPrevious}
            readOnly
          />
        ))}
      </div>
    );
  };

  // Renderizado del teclado numérico - exactamente como addition
  const renderNumberPad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'], 
      ['7', '8', '9'],
      ['<', '0', '>']
    ];

    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        {keys.flat().map((key, index) => (
          <Button
            key={index}
            className={`h-12 sm:h-16 text-lg sm:text-xl font-bold transition-all duration-200 ${
              key === ">" 
                ? "bg-white hover:bg-purple-50 text-purple-600 active:bg-purple-100 shadow-sm border-purple-200 hover:border-purple-300" 
                : key === "<" 
                  ? "bg-white hover:bg-blue-50 text-blue-600 active:bg-blue-100 shadow-sm border-blue-200 hover:border-blue-300"
                  : "bg-white hover:bg-gray-50 shadow-sm active:bg-gray-100 border-gray-300 hover:border-gray-400 hover:shadow-md"
            }`}
            onClick={() => {
              if (viewingPrevious || exerciseCompleted || waitingRef.current || !key || key === "") return;
              
              if (key === ">" || key === "sequential_backspace") {
                handleBackspace();
              } else if (key === "<" || key === "backspace") {
                handleBackspace();
              } else {
                handleDigitInput(key);
              }
            }}
            disabled={waitingRef.current || exerciseCompleted || viewingPrevious || key === "" || (!exerciseStarted && key !== "" && key !== "backspace" && key !== "sequential_backspace" && (key < '0' || key > '9'))}
          >
            {key === "backspace" 
              ? <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" /> 
              : key === "sequential_backspace" 
                ? <span className="text-xl sm:text-2xl md:text-3xl font-bold">&gt;</span>
                : key
            }
          </Button>
        ))}
      </div>
    );
  };

  // Renderizado de la visualización del problema - exactamente como addition
  const renderProblemDisplay = () => {
    if (!currentProblem) return null;

    // For empty module, display generic problem format
    const operand1 = currentProblem.operands[0];
    const operand2 = currentProblem.operands[1];

    if (currentProblem.layout === 'vertical') {
      return (
        <div className="text-center space-y-2 mb-6">
          <div className="inline-block font-mono text-right">
            <div className="font-mono text-2xl sm:text-3xl text-right tracking-wider">
              {operand1}
            </div>
            <div className="flex items-center justify-end">
              <span className="font-mono text-2xl sm:text-3xl text-gray-600 mr-2">+</span>
              <span className="font-mono text-2xl sm:text-3xl text-right tracking-wider">
                {operand2}
              </span>
            </div>
            <div className="border-t-2 border-gray-700 my-1"></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center mb-6">
          <div className="text-3xl sm:text-4xl font-bold text-gray-800">
            {operand1} + {operand2} = ?
          </div>
        </div>
      );
    }
  };

  // Vista de ejercicio completado - exactamente como addition
  if (exerciseCompleted) {
    const finalLevel = adaptiveDifficulty;
    const revealedAnswers = 0;
    const avgTimePerProblem = Math.round(timer / problemsList.length);
    
    return (
      <div className="text-center space-y-6 p-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold text-gray-800">¡Ejercicio Completado!</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-green-50 p-3 rounded-lg shadow-sm text-center border border-green-100">
            <div className="text-sm text-gray-600 mb-1">Score</div>
            <div className="text-xl text-green-600 font-semibold">{score}/{problemsList.length}</div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg shadow-sm text-center border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Accuracy</div>
            <div className="text-xl text-blue-600 font-semibold">{Math.round((score / problemsList.length) * 100)}%</div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg shadow-sm text-center border border-yellow-100">
            <div className="text-sm text-gray-600 mb-1">Tiempo Total</div>
            <div className="text-xl text-yellow-600 font-semibold">{formatTime(timer * 1000)}</div>
          </div>

          <div className="bg-teal-50 p-3 rounded-lg shadow-sm text-center border border-teal-100">
            <div className="text-sm text-gray-600 mb-1">Final Level</div>
            <div className="text-xl text-teal-600 font-semibold">{finalLevel === "beginner" ? "1" :
                                                          finalLevel === "elementary" ? "2" :
                                                          finalLevel === "intermediate" ? "3" :
                                                          finalLevel === "advanced" ? "4" : "5"}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <Button onClick={generateNewProblemSet} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
            <RotateCcw className="mr-2 h-4 w-4" />
            Nuevo Ejercicio
          </Button>
          <Button variant="outline" onClick={onOpenSettings} className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </div>
      </div>
    );
  }

  if (!currentProblem) return <div className="p-8 text-center">Error al cargar el problema</div>;

  // Vista principal del ejercicio - ESTRUCTURA EXACTA de addition
  return (
    <div className="relative">
      {/* Header exactamente como addition pero con colores púrpura */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link href="/rewards">
              <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7">
                <Star className="h-3 w-3 mr-1" />
                <span>
                  Ver Recompensas (⭐{rewardStats.totalPoints} pts)
                </span>
              </Button>
            </Link>
            
            <span className="font-medium text-gray-700 flex items-center">
              <Info className="h-4 w-4 mr-1 opacity-70"/>
              {formatTime(timer * 1000)}
            </span>

            {settings.timeValue > 0 && !viewingPrevious && !waitingRef.current && exerciseStarted && (settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts) && (
              <span className={`font-medium p-1 rounded ${problemTimerValue <= 5 && problemTimerValue > 0 ? "text-red-600 animate-pulse bg-red-100" : "text-gray-700 bg-gray-100"}`}>
                P: {problemTimerValue}s
              </span>
            )}

            {settings.maxAttempts > 0 && !viewingPrevious && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`font-medium p-1 rounded ${currentAttempts > 0 && currentAttempts < settings.maxAttempts ? "bg-amber-100 text-amber-800" : currentAttempts >= settings.maxAttempts ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                      Intentos: {currentAttempts}/{settings.maxAttempts}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Intentos máximos por problema</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {!viewingPrevious && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`font-medium p-1 rounded border-2 ${
                      consecutiveCorrectAnswers >= 8 
                        ? "bg-green-100 text-green-800 border-green-400 animate-pulse" 
                        : consecutiveCorrectAnswers >= 5 
                        ? "bg-blue-100 text-blue-800 border-blue-400" 
                        : consecutiveCorrectAnswers >= 3
                        ? "bg-purple-100 text-purple-800 border-purple-400"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}>
                      🔥 Racha: {consecutiveCorrectAnswers} ({maxConsecutiveStreak})
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Racha actual: {consecutiveCorrectAnswers} | Récord máximo: {maxConsecutiveStreak}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
              adaptiveDifficulty === "beginner" ? "bg-blue-100 text-blue-800" :
              adaptiveDifficulty === "elementary" ? "bg-emerald-100 text-emerald-800" :
              adaptiveDifficulty === "intermediate" ? "bg-orange-100 text-orange-800" :
              adaptiveDifficulty === "advanced" ? "bg-purple-100 text-purple-800" :
              adaptiveDifficulty === "expert" ? "bg-rose-100 text-rose-800" :
              "bg-indigo-100 text-indigo-800"
            }`}>
              Level: {adaptiveDifficulty}
            </span>
          </div>
        </div>
        
        <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1 bg-[#c5dbeb]" />
        
        {/* Unified Controls Row - exactamente como addition */}
        <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 flex-wrap">
          {/* Problem Progress - Desktop only */}
          <span className="hidden sm:inline font-semibold px-2 py-1 border border-gray-300 rounded-md text-xs bg-[#9333ea] text-[#ffffff]">
            Problem : {currentProblemIndex + 1} de {problemsList.length}
          </span>
          
          {/* Score - First item */}
          <div className="flex flex-col items-center">
            <span className="font-semibold px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-xs">
              Score: {score}
            </span>
            <span className="text-xs mt-1 sm:hidden text-gray-500">Score</span>
          </div>
          
          {/* Modo Profesor button - Second item */}
          <div className="flex flex-col items-center">
            <button
              className="px-2 py-1 flex items-center justify-center text-indigo-600 border border-gray-300 rounded-md h-7 hover:bg-indigo-50"
              onClick={() => setShowProfessorMode(true)}
              title="Modo Profesor"
            >
              <span className="text-xs font-medium mr-1 hidden sm:inline">
                Modo Profesor
              </span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <span className="text-xs mt-1 sm:hidden text-gray-500">Profesor</span>
          </div>

          {/* Watch Explanatory Video button - Third item */}
          <div className="flex flex-col items-center">
            <button
              className="px-2 py-1 flex items-center justify-center text-purple-600 border border-gray-300 rounded-md h-7 hover:bg-purple-50"
              title="Ver Video Explicativo"
            >
              <span className="text-xs font-medium mr-1 hidden sm:inline">
                Watch Explanatory Video
              </span>
              <Play className="h-3 w-3" />
            </button>
            <span className="text-xs mt-1 sm:hidden text-gray-500">Video</span>
          </div>

          {/* Exercise History button - Fourth item */}
          <div className="flex flex-col items-center">
            <button
              className="px-2 py-1 flex items-center justify-center text-gray-600 border border-gray-300 rounded-md h-7 hover:bg-gray-50"
              onClick={() => setIsExerciseHistoryDialogOpen(true)}
              title="Historial de Ejercicios"
            >
              <span className="text-xs font-medium mr-1 hidden sm:inline">
                Exercise History
              </span>
              <History className="h-3 w-3" />
            </button>
            <span className="text-xs mt-1 sm:hidden text-gray-500">History</span>
          </div>

          {/* Settings button - Fifth item */}
          <div className="flex flex-col items-center">
            <button
              className="px-2 py-1 flex items-center justify-center text-gray-600 border border-gray-300 rounded-md h-7 hover:bg-gray-50"
              onClick={onOpenSettings}
              title="Configuración"
            >
              <span className="text-xs font-medium mr-1 hidden sm:inline">
                Settings
              </span>
              <Settings className="h-3 w-3" />
            </button>
            <span className="text-xs mt-1 sm:hidden text-gray-500">Settings</span>
          </div>
        </div>
      </div>

      {/* Problem Display and Input - exactamente como addition */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-4">
        {renderProblemDisplay()}
        {renderDigitInputBoxes()}
        
        {/* Feedback Message - exactamente como addition */}
        {feedbackMessage && (
          <div className={`text-center p-3 rounded-lg mb-4 ${
            feedbackColor === 'green' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <span className="font-semibold">{feedbackMessage}</span>
          </div>
        )}

        {renderNumberPad()}

        {/* Bottom Control Buttons - exactamente como addition */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          {/* Mobile/Tablet: Previous and Show Answer in same row */}
          <div className="flex sm:hidden w-full gap-3">
            <Button
              variant="outline" 
              size="sm"
              disabled={(viewingPrevious ? currentProblemIndex === 0 : actualActiveProblemIndexBeforeViewingPrevious === 0 && currentProblemIndex === 0 && !viewingPrevious) || exerciseCompleted}
              onClick={moveToPreviousProblem}
              className="flex-1 text-xs h-12"
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> Previous
            </Button>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="outline" size="sm"
                      disabled={(!settings.showAnswerWithExplanation && !viewingPrevious) || viewingPrevious || exerciseCompleted || waitingRef.current || !exerciseStarted}
                      onClick={() => {
                          if(currentProblem && !viewingPrevious && !exerciseCompleted && !waitingRef.current) {
                              if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                              
                              setConsecutiveCorrectAnswers(0);
                              
                              setFeedbackMessage(`La respuesta correcta es: ${currentProblem.correctAnswer}`);
                              setFeedbackColor("blue");
                              setWaitingForContinue(true);
                              waitingRef.current = true;
                              
                              const answerEntry = userAnswersHistory[currentProblemIndex];
                              if (!answerEntry || (!answerEntry.isCorrect && answerEntry.status !== 'revealed')) {
                                  setUserAnswersHistory(prev => {
                                      const newHistory = [...prev];
                                      newHistory[currentProblemIndex] = {
                                          problemId: currentProblem.id,
                                          problem: currentProblem,
                                          userAnswer: NaN,
                                          isCorrect: false,
                                          status: 'revealed',
                                          attempts: currentAttempts + 1,
                                          timestamp: Date.now()
                                      };
                                      return newHistory;
                                  });
                              }
                              
                              if (settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts) {
                                  setCurrentAttempts(prev => prev + 1);
                              }
                          }
                      }}
                      className="flex-1 text-xs h-12"
                  >
                      <Info className="mr-1 h-3 w-3" /> Show Answer
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{(!settings.showAnswerWithExplanation && !viewingPrevious && !waitingRef.current) ? "Activar en configuración" : viewingPrevious ? "Deshabilitado en historial" : waitingRef.current ? "Deshabilitado mientras esperas" : null}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Desktop: Original layout */}
          <Button
            variant="outline" 
            size="sm"
            disabled={(viewingPrevious ? currentProblemIndex === 0 : actualActiveProblemIndexBeforeViewingPrevious === 0 && currentProblemIndex === 0 && !viewingPrevious) || exerciseCompleted}
            onClick={moveToPreviousProblem}
            className="hidden sm:flex w-auto text-xs sm:text-sm md:text-base h-12 sm:h-10 order-1 sm:order-1"
          >
            <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Previous
          </Button>

          {viewingPrevious ? (
            <Button 
              onClick={returnToActiveProblem} 
              className="w-full sm:w-auto px-4 sm:px-5 text-sm sm:text-base md:text-lg bg-orange-500 hover:bg-orange-600 text-white h-12 sm:h-10 order-2 sm:order-2"
            >
                <RotateCcw className="mr-1 h-4 w-4" /> Volver al Activo
            </Button>
          ) : waitingRef.current ? (
            <Button
                ref={continueButtonRef}
                onClick={handleContinue}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 text-base sm:text-lg md:text-xl animate-pulse bg-green-500 hover:bg-green-600 text-white flex items-center justify-center h-12 sm:h-10 order-2 sm:order-2"
            >
              <span className="flex-grow text-center font-medium">Continue</span>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="ml-2 sm:ml-3 flex items-center bg-black/20 py-1 px-2 rounded-md cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAutoContinue(prev => !prev);
                      }}
                    >
                      <div className={`h-4 w-4 border border-white rounded-sm flex items-center justify-center mr-1.5 ${autoContinue ? 'bg-white' : ''}`}>
                        {autoContinue && <Check className="h-3 w-3 text-green-700" />}
                      </div>
                      <span className="text-xs font-medium">Auto</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{autoContinue ? "Desactivar auto-continuar" : "Activar auto-continuar"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>
          ) : (
            <Button 
              onClick={checkCurrentAnswer} 
              disabled={exerciseCompleted || waitingRef.current} 
              className="w-full sm:w-auto px-5 sm:px-6 text-sm sm:text-base md:text-lg bg-purple-500 hover:bg-purple-600 text-white h-12 sm:h-10 order-2 sm:order-2"
            >
              {!exerciseStarted ? "Start Exercise" : <><Check className="mr-1 h-4 w-4" />Verificar</>}
            </Button>
          )}

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="outline" size="sm"
                    disabled={(!settings.showAnswerWithExplanation && !viewingPrevious) || viewingPrevious || exerciseCompleted || waitingRef.current || !exerciseStarted}
                    onClick={() => {
                        if(currentProblem && !viewingPrevious && !exerciseCompleted && !waitingRef.current) {
                            if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                            
                            setConsecutiveCorrectAnswers(0);
                            
                            setFeedbackMessage(`La respuesta correcta es: ${currentProblem.correctAnswer}`);
                            setFeedbackColor("blue");
                            setWaitingForContinue(true);
                            waitingRef.current = true;
                            
                            const answerEntry = userAnswersHistory[currentProblemIndex];
                            if (!answerEntry || (!answerEntry.isCorrect && answerEntry.status !== 'revealed')) {
                                setUserAnswersHistory(prev => {
                                    const newHistory = [...prev];
                                    newHistory[currentProblemIndex] = {
                                        problemId: currentProblem.id,
                                        problem: currentProblem,
                                        userAnswer: NaN,
                                        isCorrect: false,
                                        status: 'revealed',
                                        attempts: currentAttempts + 1,
                                        timestamp: Date.now()
                                    };
                                    return newHistory;
                                });
                            }
                            
                            if (settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts) {
                                setCurrentAttempts(prev => prev + 1);
                            }
                        }
                    }}
                    className="hidden sm:flex w-auto text-xs sm:text-sm h-12 sm:h-10"
                >
                    <Info className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Show Answer
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{(!settings.showAnswerWithExplanation && !viewingPrevious && !waitingRef.current) ? "Activar en configuración" : viewingPrevious ? "Deshabilitado en historial" : waitingRef.current ? "Deshabilitado mientras esperas" : null}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}