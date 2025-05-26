// Este archivo es una copia adaptada del Exercise.tsx de addition-independent
// Convertido para manejar operaciones de sustracción

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Play, Pause, StopCircle, RotateCcw, CheckCircle, XCircle, Eye, EyeOff, Clock, Target, Award, Zap, Lightbulb, ChevronLeft, ChevronRight, Volume2, VolumeX, Plus, Minus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { generateSubtractionProblem, checkAnswer, getVerticalAlignmentInfo, subtractionProblemToProblem, problemToSubtractionProblem } from "./utils";
import { SubtractionProblem, ExerciseProps, ExerciseResult, UserAnswer, DifficultyLevel } from "./types";
import { useSettings } from "@/context/SettingsContext";
import { DataSync } from "@/lib/dataSync";

const Exercise: React.FC<ExerciseProps> = ({ settings, onOpenSettings }) => {
  // Estados principales
  const [currentProblem, setCurrentProblem] = useState<SubtractionProblem | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [isExerciseActive, setIsExerciseActive] = useState<boolean>(false);
  const [isExercisePaused, setIsExercisePaused] = useState<boolean>(false);
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  
  // Estados de tiempo
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [problemStartTime, setProblemStartTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);
  
  // Estados de interfaz
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">("");
  const [currentAttempts, setCurrentAttempts] = useState<number>(0);
  const [revealedAnswersCount, setRevealedAnswersCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.enableSoundEffects);
  
  // Estados para manejo de entrada inteligente
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [lastUserAction, setLastUserAction] = useState<'typing' | 'navigation' | 'none'>('none');
  
  // Referencias
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const singleProblemTimerRef = useRef<NodeJS.Timeout>();
  
  const dataSync = new DataSync();
  const { settings: contextSettings } = useSettings();

  // Funciones de temporizador
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startSingleProblemTimer = useCallback(() => {
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    
    const timeLimit = parseInt(settings.timeValue.toString()) * 1000; // Convertir a milisegundos
    
    singleProblemTimerRef.current = setTimeout(() => {
      if (currentProblem && !showAnswer) {
        handleTimeUp();
      }
    }, timeLimit);
  }, [settings.timeValue, currentProblem, showAnswer]);

  const handleTimeUp = useCallback(() => {
    if (!currentProblem) return;
    
    const timeTaken = Date.now() - problemStartTime;
    
    const newAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: subtractionProblemToProblem(currentProblem, settings.difficulty as DifficultyLevel),
      userAnswer: 0,
      isCorrect: false,
      status: 'timeout',
      attempts: currentAttempts + 1,
      timestamp: Date.now(),
      timeTaken
    };
    
    setUserAnswers(prev => [...prev, newAnswer]);
    setFeedback("¡Tiempo agotado!");
    setFeedbackType("error");
    
    setTimeout(() => {
      if (currentProblemIndex + 1 < settings.problemCount) {
        generateNextProblem();
      } else {
        finishExercise();
      }
    }, 1500);
  }, [currentProblem, problemStartTime, currentAttempts, currentProblemIndex, settings]);

  // Generar siguiente problema
  const generateNextProblem = useCallback(() => {
    const newProblem = generateSubtractionProblem(settings.difficulty as DifficultyLevel);
    newProblem.index = currentProblemIndex + 1;
    newProblem.total = settings.problemCount;
    
    setCurrentProblem(newProblem);
    setCurrentProblemIndex(prev => prev + 1);
    setUserInput("");
    setShowAnswer(false);
    setCurrentAttempts(0);
    setFeedback("");
    setFeedbackType("");
    setProblemStartTime(Date.now());
    
    // Aplicar lógica de entrada inteligente
    applyIntelligentInputLogic(newProblem);
    
    // Iniciar temporizador por problema si está habilitado
    if (settings.hasTimerEnabled && settings.timeLimit === 'per-problem') {
      startSingleProblemTimer();
    }
    
    // Enfocar input después de un breve delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [settings, currentProblemIndex, startSingleProblemTimer]);

  // Lógica de entrada inteligente
  const applyIntelligentInputLogic = useCallback((problem: SubtractionProblem) => {
    if (problem.layout === 'vertical') {
      setInputDirection('rtl');
      // Para problemas verticales, empezar desde la derecha (método tradicional)
      setTimeout(() => {
        if (inputRef.current) {
          const maxDigits = problem.answerMaxDigits;
          inputRef.current.setSelectionRange(maxDigits, maxDigits);
          setCursorPosition(maxDigits);
        }
      }, 150);
    } else {
      setInputDirection('ltr');
      // Para problemas horizontales, empezar desde la izquierda
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(0, 0);
          setCursorPosition(0);
        }
      }, 150);
    }
  }, []);

  // Iniciar ejercicio
  const startExercise = useCallback(() => {
    setIsExerciseActive(true);
    setIsExercisePaused(false);
    setCurrentProblemIndex(0);
    setUserAnswers([]);
    setRevealedAnswersCount(0);
    setStartTime(Date.now());
    setTotalElapsedTime(0);
    
    // Configurar temporizador total si está habilitado
    if (settings.hasTimerEnabled && settings.timeLimit === 'total') {
      const totalTime = settings.timeValue * 60; // Convertir minutos a segundos
      setTimeLeft(totalTime);
      startTimer();
    }
    
    // Generar primer problema
    const firstProblem = generateSubtractionProblem(settings.difficulty as DifficultyLevel);
    firstProblem.index = 1;
    firstProblem.total = settings.problemCount;
    
    setCurrentProblem(firstProblem);
    setProblemStartTime(Date.now());
    
    applyIntelligentInputLogic(firstProblem);
    
    // Iniciar temporizador por problema si está habilitado
    if (settings.hasTimerEnabled && settings.timeLimit === 'per-problem') {
      startSingleProblemTimer();
    }
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);
  }, [settings, startTimer, startSingleProblemTimer, applyIntelligentInputLogic]);

  // Pausar/reanudar ejercicio
  const togglePause = useCallback(() => {
    if (isExercisePaused) {
      setIsExercisePaused(false);
      if (settings.hasTimerEnabled && settings.timeLimit === 'total') {
        startTimer();
      }
      if (settings.hasTimerEnabled && settings.timeLimit === 'per-problem') {
        startSingleProblemTimer();
      }
    } else {
      setIsExercisePaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
    }
  }, [isExercisePaused, settings, startTimer, startSingleProblemTimer]);

  // Detener ejercicio
  const stopExercise = useCallback(() => {
    setIsExerciseActive(false);
    setIsExercisePaused(false);
    setCurrentProblem(null);
    setUserInput("");
    setCurrentProblemIndex(0);
    setUserAnswers([]);
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
  }, []);

  // Finalizar ejercicio
  const finishExercise = useCallback(() => {
    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);
    
    // Calcular estadísticas
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const accuracy = userAnswers.length > 0 ? (correctAnswers / userAnswers.length) * 100 : 0;
    const avgTimePerProblem = userAnswers.length > 0 ? totalTime / userAnswers.length : 0;
    const totalAttempts = userAnswers.reduce((sum, answer) => sum + answer.attempts, 0);
    const avgAttempts = userAnswers.length > 0 ? totalAttempts / userAnswers.length : 0;
    
    // Crear resultado del ejercicio
    const exerciseResult: ExerciseResult = {
      operationId: 'subtraction',
      date: new Date().toISOString(),
      score: correctAnswers,
      totalProblems: settings.problemCount,
      timeSpent: totalTime,
      difficulty: settings.difficulty,
      accuracy: Math.round(accuracy * 100) / 100,
      avgTimePerProblem: Math.round(avgTimePerProblem * 100) / 100,
      avgAttempts: Math.round(avgAttempts * 100) / 100,
      revealedAnswers: revealedAnswersCount,
      extra_data: {
        version: "1.0",
        timestamp: Date.now(),
        exerciseId: `subtraction_${Date.now()}`,
        problemDetails: userAnswers.map(answer => ({
          problemId: answer.problemId,
          userAnswer: answer.userAnswer,
          correctAnswer: answer.problem.correctAnswer,
          isCorrect: answer.isCorrect,
          attempts: answer.attempts,
          timeTaken: answer.timeTaken || 0
        })),
        problems: userAnswers.map(answer => answer.problem),
        capturedProblems: userAnswers,
        exerciseType: 'subtraction'
      }
    };
    
    // Guardar progreso
    dataSync.saveProgress('subtraction', exerciseResult);
    
    setIsExerciseActive(false);
    setIsExercisePaused(false);
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
  }, [startTime, userAnswers, settings, revealedAnswersCount, saveProgress]);

  // Verificar respuesta
  const checkUserAnswer = useCallback(() => {
    if (!currentProblem || userInput.trim() === "") return;
    
    const userAnswer = parseFloat(userInput.trim());
    const isCorrect = checkAnswer(currentProblem, userAnswer);
    const timeTaken = Date.now() - problemStartTime;
    
    const newAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: subtractionProblemToProblem(currentProblem, settings.difficulty as DifficultyLevel),
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      attempts: currentAttempts + 1,
      timestamp: Date.now(),
      timeTaken
    };
    
    setUserAnswers(prev => [...prev, newAnswer]);
    setCurrentAttempts(prev => prev + 1);
    
    if (isCorrect) {
      setFeedback("¡Correcto!");
      setFeedbackType("success");
      
      if (soundEnabled) {
        // Reproducir sonido de éxito
      }
      
      setTimeout(() => {
        if (currentProblemIndex + 1 < settings.problemCount) {
          generateNextProblem();
        } else {
          finishExercise();
        }
      }, 1500);
    } else {
      setFeedback(`Incorrecto. La respuesta correcta es ${currentProblem.correctAnswer}`);
      setFeedbackType("error");
      
      if (soundEnabled) {
        // Reproducir sonido de error
      }
      
      if (currentAttempts + 1 >= settings.maxAttempts) {
        setTimeout(() => {
          if (currentProblemIndex + 1 < settings.problemCount) {
            generateNextProblem();
          } else {
            finishExercise();
          }
        }, 2500);
      } else {
        setUserInput("");
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 1500);
      }
    }
  }, [currentProblem, userInput, problemStartTime, currentAttempts, settings, soundEnabled, currentProblemIndex, generateNextProblem, finishExercise]);

  // Revelar respuesta
  const revealAnswer = useCallback(() => {
    if (!currentProblem) return;
    
    setShowAnswer(true);
    setRevealedAnswersCount(prev => prev + 1);
    setUserInput(currentProblem.correctAnswer.toString());
    
    const timeTaken = Date.now() - problemStartTime;
    
    const newAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: subtractionProblemToProblem(currentProblem, settings.difficulty as DifficultyLevel),
      userAnswer: currentProblem.correctAnswer,
      isCorrect: false,
      status: 'revealed',
      attempts: currentAttempts + 1,
      timestamp: Date.now(),
      timeTaken
    };
    
    setUserAnswers(prev => [...prev, newAnswer]);
    setFeedback("Respuesta revelada");
    setFeedbackType("");
  }, [currentProblem, problemStartTime, currentAttempts, settings]);

  // Continuar al siguiente problema después de revelar respuesta
  const continueAfterReveal = useCallback(() => {
    if (currentProblemIndex + 1 < settings.problemCount) {
      generateNextProblem();
    } else {
      finishExercise();
    }
  }, [currentProblemIndex, settings.problemCount, generateNextProblem, finishExercise]);

  // Manejar entrada de teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showAnswer) {
        continueAfterReveal();
      } else {
        checkUserAnswer();
      }
    }
  }, [showAnswer, continueAfterReveal, checkUserAnswer]);

  // Manejar cambio de input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Validar que solo contenga números y decimales
    if (!/^\d*\.?\d*$/.test(value)) return;
    
    setUserInput(value);
    setLastUserAction('typing');
  }, []);

  // Renderizar problema vertical
  const renderVerticalProblem = (problem: SubtractionProblem) => {
    const { operandRows, lineWidth, alignmentInfo } = getVerticalAlignmentInfo(problem);
    
    return (
      <div className="font-mono text-2xl leading-relaxed">
        <div className="text-center space-y-2">
          {operandRows.map((operand, index) => (
            <div key={index} className="flex justify-end items-center" style={{ width: `${lineWidth}ch` }}>
              {index === 1 && (
                <Minus className="w-6 h-6 mr-2 text-red-600" />
              )}
              {index > 1 && (
                <Minus className="w-6 h-6 mr-2 text-red-600" />
              )}
              <span className="tabular-nums">{operand}</span>
            </div>
          ))}
          <div className="border-t-2 border-gray-800 dark:border-gray-200" style={{ width: `${lineWidth}ch` }}></div>
          <div className="h-8 flex items-center justify-end" style={{ width: `${lineWidth}ch` }}>
            <Input
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full text-right tabular-nums text-2xl border-none bg-transparent p-0"
              style={{ direction: inputDirection }}
              disabled={isExercisePaused || showAnswer}
              placeholder="?"
            />
          </div>
        </div>
      </div>
    );
  };

  // Renderizar problema horizontal
  const renderHorizontalProblem = (problem: SubtractionProblem) => {
    return (
      <div className="flex items-center justify-center gap-4 text-3xl font-mono">
        <span className="tabular-nums">{problem.operands[0]}</span>
        <Minus className="w-8 h-8 text-red-600" />
        <span className="tabular-nums">{problem.operands[1]}</span>
        <span className="text-4xl">=</span>
        <Input
          ref={inputRef}
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-32 text-center tabular-nums text-3xl"
          style={{ direction: inputDirection }}
          disabled={isExercisePaused || showAnswer}
          placeholder="?"
        />
      </div>
    );
  };

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
    };
  }, []);

  // Renderizar interfaz principal
  if (!isExerciseActive) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Minus className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold">Ejercicios de Sustracción</h1>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Configuración del Ejercicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Dificultad:</span>
                  <Badge variant="outline" className="ml-2">
                    {settings.difficulty}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Problemas:</span>
                  <span className="ml-2">{settings.problemCount}</span>
                </div>
                <div>
                  <span className="font-medium">Tiempo:</span>
                  <span className="ml-2">
                    {settings.hasTimerEnabled ? `${settings.timeValue}${settings.timeLimit === 'total' ? ' min total' : ' seg/problema'}` : 'Sin límite'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Intentos:</span>
                  <span className="ml-2">{settings.maxAttempts}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button onClick={startExercise} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Comenzar
                </Button>
                <Button onClick={onOpenSettings} variant="outline">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Barra superior con información */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            Problema {currentProblemIndex + 1} de {settings.problemCount}
          </Badge>
          {settings.hasTimerEnabled && settings.timeLimit === 'total' && (
            <Badge variant={timeLeft <= 60 ? "destructive" : "secondary"}>
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            size="sm"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            onClick={togglePause}
            variant="outline"
            size="sm"
          >
            {isExercisePaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          <Button
            onClick={stopExercise}
            variant="outline"
            size="sm"
          >
            <StopCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Problema principal */}
      {currentProblem && (
        <Card className="min-h-[300px]">
          <CardContent className="flex items-center justify-center p-8">
            {isExercisePaused ? (
              <div className="text-center">
                <Pause className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg text-gray-600">Ejercicio pausado</p>
              </div>
            ) : (
              <div className="w-full">
                {currentProblem.layout === 'vertical' 
                  ? renderVerticalProblem(currentProblem) 
                  : renderHorizontalProblem(currentProblem)
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {feedback && (
        <Alert className={feedbackType === "success" ? "border-green-200 bg-green-50" : feedbackType === "error" ? "border-red-200 bg-red-50" : ""}>
          <AlertDescription className="flex items-center gap-2">
            {feedbackType === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
            {feedbackType === "error" && <XCircle className="w-4 h-4 text-red-600" />}
            {feedback}
          </AlertDescription>
        </Alert>
      )}

      {/* Controles inferiores */}
      {!isExercisePaused && currentProblem && (
        <div className="flex justify-center gap-4">
          {!showAnswer ? (
            <>
              <Button onClick={checkUserAnswer} disabled={!userInput.trim()}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verificar
              </Button>
              <Button onClick={revealAnswer} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Ver Respuesta
              </Button>
            </>
          ) : (
            <Button onClick={continueAfterReveal}>
              <ChevronRight className="w-4 h-4 mr-2" />
              Continuar
            </Button>
          )}
        </div>
      )}

      {/* Progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progreso</span>
          <span>{Math.round(((currentProblemIndex) / settings.problemCount) * 100)}%</span>
        </div>
        <Progress value={((currentProblemIndex) / settings.problemCount) * 100} />
      </div>
    </div>
  );
};

export default Exercise;