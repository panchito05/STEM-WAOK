// Exercise.tsx - Subtraction module
import React, { useState, useEffect, useRef } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateSubtractionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { SubtractionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

export default function SubtractionExercise({ settings, onOpenSettings }: ExerciseProps) {
  // Estados principales
  const [problems, setProblems] = useState<SubtractionProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [exerciseStartTime] = useState(Date.now());
  const [singleProblemStartTime, setSingleProblemStartTime] = useState(Date.now());
  
  // Estados del temporizador
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [singleProblemTimeElapsed, setSingleProblemTimeElapsed] = useState(0);
  
  // Estados de interacción
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  
  // Estados de progreso
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Array<{
    problemId: string;
    userAnswer: number;
    isCorrect: boolean;
    attempts: number;
    timeTaken: number;
  }>>([]);
  
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

  // Iniciar temporizador del problema individual
  useEffect(() => {
    if (currentProblem && !showFeedback && !revealedAnswer) {
      startSingleProblemTimer();
    }
    return () => {
      if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
      }
    };
  }, [currentProblemIndex, showFeedback, revealedAnswer]);

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

  const handleSubmitAnswer = () => {
    if (!currentProblem || userAnswer.trim() === "") return;

    const numericAnswer = parseFloat(userAnswer);
    const isCorrect = checkAnswer(currentProblem, numericAnswer);
    const currentAttempts = attempts + 1;
    
    stopSingleProblemTimer();

    const answerData = {
      problemId: currentProblem.id,
      userAnswer: numericAnswer,
      isCorrect,
      attempts: currentAttempts,
      timeTaken: singleProblemTimeElapsed
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
    } else {
      setTotalIncorrect(prev => prev + 1);
    }

    setShowFeedback(true);
    setAttempts(currentAttempts);

    // Auto-continuar si la respuesta es correcta
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
      resetProblemState();
    }
  };

  const handlePreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1);
      resetProblemState();
    }
  };

  const resetProblemState = () => {
    setUserAnswer("");
    setShowFeedback(false);
    setAttempts(0);
    setRevealedAnswer(false);
    setSingleProblemTimeElapsed(0);
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
    setUserAnswer(currentProblem.correctAnswer.toString());
    stopSingleProblemTimer();
    setShowFeedback(true);
  };

  const renderProblemDisplay = () => {
    if (!currentProblem) return null;

    const minuend = currentProblem.operands[0];
    const subtrahend = currentProblem.operands[1];

    if (currentProblem.layout === 'vertical') {
      return (
        <div className="text-center space-y-2">
          <div className="inline-block font-mono text-right">
            <div className="font-mono text-2xl sm:text-3xl text-right tracking-wider">
              {minuend}
            </div>
            <div className="flex items-center justify-end">
              <span className="font-mono text-2xl sm:text-3xl text-gray-600 mr-2">-</span>
              <span className="font-mono text-2xl sm:text-3xl text-right tracking-wider">
                {subtrahend}
              </span>
            </div>
            <div className="border-t-2 border-gray-700 my-1"></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            {minuend} - {subtrahend} = ?
          </div>
        </div>
      );
    }
  };

  const renderAnswerInput = () => {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !showFeedback) {
                handleSubmitAnswer();
              }
            }}
            disabled={showFeedback || revealedAnswer}
            className="w-24 h-12 text-xl text-center font-bold"
            placeholder="?"
            autoFocus
          />
        </div>
      </div>
    );
  };

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

  const renderActionButtons = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {!showFeedback && !revealedAnswer && (
          <>
            <Button
              onClick={handleSubmitAnswer}
              disabled={userAnswer.trim() === ""}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Verificar
            </Button>
            
            {settings.showAnswerWithExplanation && attempts < settings.maxAttempts && (
              <Button
                onClick={handleRevealAnswer}
                variant="outline"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                Mostrar Respuesta
              </Button>
            )}
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

  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={handlePreviousProblem}
          disabled={currentProblemIndex === 0}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        
        <Button
          onClick={onOpenSettings}
          variant="outline"
          size="sm"
        >
          <Settings className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={handleNextProblem}
          disabled={isLastProblem}
          variant="outline"
          size="sm"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  };

  const renderProgressBar = () => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Problema {currentProblemIndex + 1} de {problems.length}
          </span>
          <span className="text-sm text-gray-500">
            {formatTime(timeElapsed)}
          </span>
        </div>
        <ProgressBarUI value={progress} className="h-2" />
      </div>
    );
  };

  const renderStats = () => {
    return (
      <div className="flex justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalCorrect}</div>
          <div className="text-xs text-gray-500">Correctas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{totalIncorrect}</div>
          <div className="text-xs text-gray-500">Incorrectas</div>
        </div>
      </div>
    );
  };

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

  return (
    <div className="max-w-2xl mx-auto p-6">
      {renderProgressBar()}
      {renderNavigationButtons()}
      {renderStats()}
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {renderProblemDisplay()}
        {renderAnswerInput()}
        {renderFeedback()}
        {renderActionButtons()}
      </div>
    </div>
  );
}