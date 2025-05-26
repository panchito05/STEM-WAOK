// Exercise.tsx - Subtraction Module (copied from Addition)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateSubtractionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, SubtractionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube, X, Minus, Maximize2, Minimize2, Play } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
const digitBoxFocusStyle = "border-red-500 ring-2 ring-red-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300";
const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const minusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const sumLineStyle = "border-t-2 border-gray-700 my-1";

// Interface para los metadatos de videos de YouTube
interface YoutubeVideoMetadata {
  url: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
  loading: boolean;
  error: boolean;
}

// Componente para gestionar videos explicativos de YouTube
const YoutubeExplanatoryVideoManager: React.FC<{ 
  problem?: SubtractionProblem, 
  difficulty: DifficultyLevel, 
  onVideoFound?: (metadata: YoutubeVideoMetadata) => void 
}> = ({ problem, difficulty, onVideoFound }) => {
  const [videoMetadata, setVideoMetadata] = useState<YoutubeVideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return null; // Simplified for now
};

// Define UserAnswer interface for subtraction
interface UserAnswer {
  problemId: string;
  problem: SubtractionProblem;
  userAnswer: number;
  isCorrect: boolean;
  status: string;
  attempts: number;
  timestamp: number;
}

export default function SubtractionExercise({ settings, onOpenSettings }: ExerciseProps) {
  // Estados principales
  const [problems, setProblems] = useState<SubtractionProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [exerciseStartTime] = useState(Date.now());
  
  // Estados del temporizador
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [singleProblemTimeElapsed, setSingleProblemTimeElapsed] = useState(0);
  const [singleProblemStartTime, setSingleProblemStartTime] = useState(Date.now());
  
  // Estados de entrada de dígitos
  const [digitInputs, setDigitInputs] = useState<string[]>([]);
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
  
  // Estados de interacción
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  
  // Estados de progreso y estadísticas
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(0);
  const [maxConsecutiveStreak, setMaxConsecutiveStreak] = useState(0);
  
  // Estados de UI
  const [isExerciseHistoryDialogOpen, setIsExerciseHistoryDialogOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [showLevelUpDialog, setShowLevelUpDialog] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ previousLevel: "", newLevel: "", consecutiveCorrectAnswers: 0 });
  
  // Referencias
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Contextos
  const { saveExerciseResult } = useProgress();

  const currentProblem = problems[currentProblemIndex];
  const isLastProblem = currentProblemIndex === problems.length - 1;
  const progress = problems.length > 0 ? ((currentProblemIndex + 1) / problems.length) * 100 : 0;

  // Generar problemas al iniciar
  useEffect(() => {
    generateProblems();
    startExerciseTimer();
    return () => {
      if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    };
  }, [settings.difficulty, settings.problemCount]);

  // Inicializar entrada de dígitos cuando cambia el problema
  useEffect(() => {
    if (currentProblem) {
      const correctAnswer = currentProblem.correctAnswer;
      const numDigits = correctAnswer.toString().length;
      setDigitInputs(new Array(numDigits).fill(''));
      setCurrentDigitIndex(inputDirection === 'rtl' ? numDigits - 1 : 0);
      setSingleProblemStartTime(Date.now());
      setSingleProblemTimeElapsed(0);
      setAttempts(0);
      setShowFeedback(false);
      setRevealedAnswer(false);
      startSingleProblemTimer();
    }
  }, [currentProblemIndex, inputDirection]);

  // Temporizador del ejercicio completo
  useEffect(() => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    
    exerciseTimerRef.current = setInterval(() => {
      setTimeElapsed(Date.now() - exerciseStartTime);
    }, 1000);
    
    return () => {
      if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    };
  }, [exerciseStartTime]);

  // Temporizador por problema individual
  useEffect(() => {
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    
    singleProblemTimerRef.current = setInterval(() => {
      setSingleProblemTimeElapsed(Date.now() - singleProblemStartTime);
    }, 1000);
    
    return () => {
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    };
  }, [singleProblemStartTime]);

  const generateProblems = () => {
    const newProblems: SubtractionProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      const problem = generateSubtractionProblem(settings.difficulty as DifficultyLevel);
      problem.index = i + 1;
      problem.total = settings.problemCount;
      newProblems.push(problem);
    }
    setProblems(newProblems);
    setCurrentProblemIndex(0);
    setUserAnswers([]);
    setIsComplete(false);
    setTotalCorrect(0);
    setTotalIncorrect(0);
    setCurrentStreak(0);
    setConsecutiveCorrectAnswers(0);
    setConsecutiveIncorrectAnswers(0);
  };

  const startExerciseTimer = () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    
    exerciseTimerRef.current = setInterval(() => {
      setTimeElapsed(Date.now() - exerciseStartTime);
    }, 1000);
  };

  const startSingleProblemTimer = () => {
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    
    setSingleProblemStartTime(Date.now());
    setSingleProblemTimeElapsed(0);
    
    singleProblemTimerRef.current = setInterval(() => {
      setSingleProblemTimeElapsed(Date.now() - singleProblemStartTime);
    }, 1000);
  };

  const stopSingleProblemTimer = () => {
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
  };

  // Manejo de entrada de dígitos
  const handleDigitInput = (digit: string) => {
    if (showFeedback || revealedAnswer) return;

    const newDigitInputs = [...digitInputs];
    newDigitInputs[currentDigitIndex] = digit;
    setDigitInputs(newDigitInputs);

    // Mover al siguiente dígito
    if (inputDirection === 'rtl') {
      if (currentDigitIndex > 0) {
        setCurrentDigitIndex(currentDigitIndex - 1);
      }
    } else {
      if (currentDigitIndex < digitInputs.length - 1) {
        setCurrentDigitIndex(currentDigitIndex + 1);
      }
    }
  };

  const handleBackspace = () => {
    if (showFeedback || revealedAnswer) return;

    const newDigitInputs = [...digitInputs];
    newDigitInputs[currentDigitIndex] = '';
    setDigitInputs(newDigitInputs);

    // Mover al dígito anterior
    if (inputDirection === 'rtl') {
      if (currentDigitIndex < digitInputs.length - 1) {
        setCurrentDigitIndex(currentDigitIndex + 1);
      }
    } else {
      if (currentDigitIndex > 0) {
        setCurrentDigitIndex(currentDigitIndex - 1);
      }
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentProblem) return;

    const userAnswer = parseInt(digitInputs.join(''));
    if (isNaN(userAnswer)) return;

    const isCorrect = checkAnswer(currentProblem, userAnswer);
    const currentAttempts = attempts + 1;
    
    stopSingleProblemTimer();

    const answerData: UserAnswer = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer,
      isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      attempts: currentAttempts,
      timestamp: Date.now()
    };

    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const existingIndex = newAnswers.findIndex(a => a.problemId === currentProblem.id);
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = answerData;
      } else {
        newAnswers.push(answerData);
      }
      return newAnswers;
    });

    if (isCorrect) {
      setTotalCorrect(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
      setConsecutiveCorrectAnswers(prev => prev + 1);
      setConsecutiveIncorrectAnswers(0);
      setLongestStreak(prev => Math.max(prev, currentStreak + 1));
    } else {
      setTotalIncorrect(prev => prev + 1);
      setCurrentStreak(0);
      setConsecutiveCorrectAnswers(0);
      setConsecutiveIncorrectAnswers(prev => prev + 1);
    }

    setShowFeedback(true);
    setAttempts(currentAttempts);

    // Auto-continuar si está habilitado y la respuesta es correcta
    if (isCorrect) {
      setTimeout(() => {
        handleNextProblem();
      }, 1500);
    }
  };

  const handleNextProblem = () => {
    if (isLastProblem) {
      completeExercise();
    } else {
      setCurrentProblemIndex(prev => prev + 1);
    }
  };

  const handlePreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1);
    }
  };

  const completeExercise = () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    
    setIsComplete(true);

    // Calcular estadísticas del ejercicio
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = userAnswers.length > 0 ? (correctAnswers / userAnswers.length) * 100 : 0;
    const avgTimePerProblem = userAnswers.length > 0 ? timeElapsed / userAnswers.length : 0;

    const exerciseResult = {
      operationId: 'subtraction',
      date: new Date().toISOString(),
      score: correctAnswers,
      totalProblems: problems.length,
      timeSpent: timeElapsed,
      difficulty: settings.difficulty,
      accuracy,
      avgTimePerProblem,
      avgAttempts: userAnswers.length > 0 ? userAnswers.reduce((sum, a) => sum + a.attempts, 0) / userAnswers.length : 0,
      revealedAnswers: 0,
      extra_data: {
        version: '1.0',
        timestamp: Date.now(),
        exerciseId: `subtraction_${Date.now()}`,
        problemDetails: userAnswers,
        problems: problems,
        exerciseType: 'subtraction'
      }
    };

    // Guardar resultado
    saveExerciseResult(exerciseResult);
  };

  const handleRevealAnswer = () => {
    if (!currentProblem) return;
    
    setRevealedAnswer(true);
    const correctAnswer = currentProblem.correctAnswer.toString();
    setDigitInputs(correctAnswer.split(''));
    stopSingleProblemTimer();
    setShowFeedback(true);
  };

  // Renderizado de la interfaz de número pad
  const renderNumberPad = () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        {numbers.map((num) => (
          <Button
            key={num}
            onClick={() => handleDigitInput(num.toString())}
            disabled={showFeedback || revealedAnswer}
            className="h-12 text-lg font-bold bg-white border-2 border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-red-400 disabled:opacity-50"
          >
            {num}
          </Button>
        ))}
        
        {/* Fila inferior con controles especiales */}
        <Button
          onClick={handleBackspace}
          disabled={showFeedback || revealedAnswer}
          className="h-12 text-lg font-bold bg-white border-2 border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-red-400"
        >
          &lt;
        </Button>
        
        <Button
          onClick={() => handleDigitInput('0')}
          disabled={showFeedback || revealedAnswer}
          className="h-12 text-lg font-bold bg-white border-2 border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-red-400"
        >
          0
        </Button>
        
        <Button
          onClick={() => {
            if (inputDirection === 'rtl') {
              if (currentDigitIndex < digitInputs.length - 1) {
                setCurrentDigitIndex(currentDigitIndex + 1);
              }
            } else {
              if (currentDigitIndex > 0) {
                setCurrentDigitIndex(currentDigitIndex - 1);
              }
            }
          }}
          disabled={showFeedback || revealedAnswer}
          className="h-12 text-lg font-bold bg-white border-2 border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-red-400"
        >
          &gt;
        </Button>
      </div>
    );
  };

  // Renderizado de la visualización del problema
  const renderProblemDisplay = () => {
    if (!currentProblem) return null;

    const minuend = currentProblem.operands[0];
    const subtrahend = currentProblem.operands[1];

    if (currentProblem.layout === 'vertical') {
      return (
        <div className="text-center space-y-2 mb-6">
          <div className="inline-block font-mono text-right">
            <div className={verticalOperandStyle}>
              {minuend}
            </div>
            <div className="flex items-center justify-end">
              <span className={minusSignVerticalStyle}>-</span>
              <span className={verticalOperandStyle}>
                {subtrahend}
              </span>
            </div>
            <div className={sumLineStyle}></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center mb-6">
          <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            {minuend} - {subtrahend} = ?
          </div>
        </div>
      );
    }
  };

  // Renderizado de las cajas de entrada de dígitos
  const renderDigitInputBoxes = () => {
    return (
      <div className="flex justify-center gap-1 mb-6">
        {digitInputs.map((digit, index) => (
          <div
            key={index}
            className={`${digitBoxBaseStyle} ${
              index === currentDigitIndex ? digitBoxFocusStyle : digitBoxBlurStyle
            } ${showFeedback || revealedAnswer ? digitBoxDisabledStyle : ''} cursor-pointer`}
            onClick={() => !showFeedback && !revealedAnswer && setCurrentDigitIndex(index)}
          >
            {digit || (index === currentDigitIndex ? '|' : '')}
          </div>
        ))}
      </div>
    );
  };

  // Renderizado del feedback
  const renderFeedback = () => {
    if (!showFeedback) return null;

    const currentAnswer = userAnswers.find(a => a.problemId === currentProblem?.id);
    const isCorrect = currentAnswer?.isCorrect;

    return (
      <div className={`text-center p-4 rounded-lg mb-4 ${
        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          {isCorrect ? (
            <Check className="w-6 h-6" />
          ) : (
            <X className="w-6 h-6" />
          )}
          <span className="font-semibold text-lg">
            {isCorrect ? '¡Correcto!' : 'Incorrecto'}
          </span>
        </div>
        
        {!isCorrect && (
          <div className="text-sm">
            <p>La respuesta correcta es: <strong>{currentProblem?.correctAnswer}</strong></p>
          </div>
        )}
        
        <div className="text-xs text-gray-600 mt-2">
          Intentos: {attempts} | Tiempo: {formatTime(singleProblemTimeElapsed)}
        </div>
      </div>
    );
  };

  // Renderizado de la barra de herramientas superior
  const renderTopToolbar = () => {
    return (
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Información del ejercicio */}
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-red-500 text-white text-sm">
              Problema: {currentProblemIndex + 1} de {problems.length}
            </Button>
            <Button variant="outline" className="text-sm">
              Score: {totalCorrect}
            </Button>
          </div>

          {/* Información del temporizador y nivel */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              🕐 {formatTime(timeElapsed)}
            </span>
            <span className="text-sm text-gray-600">
              Intentos: {attempts}/5
            </span>
            <span className="text-sm text-gray-600">
              🔥 Racha: {currentStreak} (3)
            </span>
            <span className="text-sm text-gray-600">
              Level: {settings.difficulty}
            </span>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              🏆 View Rewards (⭐0 pts)
            </Button>
            <Button variant="outline" size="sm">
              🎓 Professor Mode ✏️
            </Button>
            <Button variant="outline" size="sm">
              📺 Watch Explanatory Video ▶️
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsExerciseHistoryDialogOpen(true)}>
              📊 Exercise History
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado de botones de acción principales
  const renderActionButtons = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {!showFeedback && !revealedAnswer && (
          <>
            <Button
              onClick={handleSubmitAnswer}
              disabled={digitInputs.some(d => d === '')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              ✓ Verificar
            </Button>
            
            <Button
              onClick={handleRevealAnswer}
              variant="outline"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              Mostrar Respuesta
            </Button>
          </>
        )}
        
        {showFeedback && (
          <Button
            onClick={handleNextProblem}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLastProblem ? 'Finalizar' : 'Siguiente'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    );
  };

  // Renderizado de botones de navegación
  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={handlePreviousProblem}
          disabled={currentProblemIndex === 0}
          variant="outline"
          size="sm"
        >
          ← Anterior
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalCorrect}</div>
            <div className="text-xs text-gray-500">Correctas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalIncorrect}</div>
            <div className="text-xs text-gray-500">Incorrectas</div>
          </div>
        </div>
        
        <Button
          onClick={() => setCurrentProblemIndex(prev => Math.min(prev + 1, problems.length - 1))}
          disabled={isLastProblem}
          variant="outline"
          size="sm"
        >
          Siguiente →
        </Button>
      </div>
    );
  };

  // Renderizado de la barra de progreso
  const renderProgressBar = () => {
    return (
      <div className="mb-6">
        <ProgressBarUI value={progress} className="h-2" />
      </div>
    );
  };

  // Vista de finalización del ejercicio
  if (isComplete) {
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = (correctAnswers / problems.length) * 100;
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800">¡Ejercicio de Resta Completado!</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{correctAnswers}</div>
              <div className="text-sm text-green-600">Correctas</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{problems.length - correctAnswers}</div>
              <div className="text-sm text-red-600">Incorrectas</div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{accuracy.toFixed(1)}%</div>
              <div className="text-sm text-blue-600">Precisión</div>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{formatTime(timeElapsed)}</div>
              <div className="text-sm text-purple-600">Tiempo Total</div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={generateProblems} className="bg-red-600 hover:bg-red-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Nuevo Ejercicio de Resta
            </Button>
            <Link href="/">
              <Button variant="outline">
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Vista de carga
  if (problems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Generando problemas de resta...</p>
        </div>
      </div>
    );
  }

  // Vista principal del ejercicio
  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderTopToolbar()}
      {renderProgressBar()}
      {renderNavigationButtons()}
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {renderProblemDisplay()}
        {renderDigitInputBoxes()}
        {renderFeedback()}
        {renderActionButtons()}
        {renderNumberPad()}
      </div>
      
      {/* Show Answer Button */}
      <div className="flex justify-center mb-4">
        <Button 
          onClick={handleRevealAnswer}
          variant="outline"
          disabled={showFeedback || revealedAnswer}
          className="text-sm"
        >
          ℹ️ Show Answer
        </Button>
      </div>

      {/* Start Exercise Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => generateProblems()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          Start Exercise
        </Button>
      </div>
    </div>
  );
}