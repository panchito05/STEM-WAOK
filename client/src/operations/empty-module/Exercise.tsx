import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Eye,
  EyeOff,
  Timer,
  Target,
  Zap,
  Award,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";
import { EmptyModuleProblem, ExerciseProps, UserAnswer, ExerciseResult, DifficultyLevel } from "./types";
import { 
  generateEmptyModuleProblems, 
  validateAnswer, 
  formatNumber, 
  getVerticalAlignmentInfo,
  emptyModuleProblemToProblem
} from "./utils";
import { useToast } from "@/hooks/use-toast";
import { useChildProfiles } from "@/context/ChildProfilesContext";
import { useSettings } from "@/context/SettingsContext";
import { incrementConsecutiveCorrect, incrementConsecutiveIncorrect, updateLongestStreak } from "@/lib/progressCounters";

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Estados principales
  const [problems, setProblems] = useState<EmptyModuleProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de timing
  const [startTime, setStartTime] = useState<number | null>(null);
  const [problemStartTime, setProblemStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  
  // Estados de respuestas y progreso
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState(new Set<string>());
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Referencias
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const problemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const { activeProfile } = useChildProfiles();
  const { updateModuleSettings } = useSettings();
  
  // Configuraciones computadas
  const hasTimerEnabled = settings.timeValue > 0;
  const timeLimit = settings.timeValue;
  const currentProblem = problems[currentProblemIndex];
  
  // Cálculo de progreso
  const progress = problems.length > 0 ? ((currentProblemIndex + 1) / problems.length) * 100 : 0;
  const completedProblems = userAnswers.filter(answer => answer.status !== 'skipped').length;
  
  // Función para generar nuevos problemas
  const generateNewProblems = useCallback(() => {
    const newProblems = generateEmptyModuleProblems(
      settings.difficulty as DifficultyLevel,
      settings.problemCount
    );
    setProblems(newProblems);
    return newProblems;
  }, [settings.difficulty, settings.problemCount]);
  
  // Inicializar ejercicio
  const initializeExercise = useCallback(() => {
    console.log("[EMPTY-MODULE] Inicializando ejercicio con configuración:", settings);
    
    setIsLoading(true);
    setCurrentProblemIndex(0);
    setUserInput("");
    setUserAnswers([]);
    setIsCompleted(false);
    setShowResults(false);
    setShowFeedback(false);
    setFeedbackType(null);
    setAttempts(0);
    setRevealedAnswers(new Set());
    setShowAnswer(false);
    setStartTime(Date.now());
    setProblemStartTime(Date.now());
    setTotalTimeSpent(0);
    
    // Limpiar timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (problemTimerRef.current) clearInterval(problemTimerRef.current);
    if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
    
    // Generar problemas
    const newProblems = generateNewProblems();
    
    // Configurar timer si está habilitado
    if (hasTimerEnabled && timeLimit > 0) {
      setTimeLeft(timeLimit);
      startProblemTimer();
    } else {
      setTimeLeft(null);
    }
    
    setIsLoading(false);
    
    // Enfocar input después de un breve delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    console.log("[EMPTY-MODULE] Ejercicio inicializado con", newProblems.length, "problemas");
  }, [settings, hasTimerEnabled, timeLimit, generateNewProblems]);
  
  // Función para iniciar timer de problema individual
  const startProblemTimer = useCallback(() => {
    if (!hasTimerEnabled || timeLimit <= 0) return;
    
    setProblemStartTime(Date.now());
    setTimeLeft(timeLimit);
    
    // Limpiar timer anterior si existe
    if (singleProblemTimerRef.current) {
      clearTimeout(singleProblemTimerRef.current);
    }
    
    // Timer por problema individual
    singleProblemTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          // Tiempo agotado - marcar como incorrecto y avanzar
          handleTimeUp();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    console.log("[EMPTY-MODULE] Timer iniciado para problema:", currentProblemIndex + 1, "con", timeLimit, "segundos");
  }, [hasTimerEnabled, timeLimit, currentProblemIndex]);
  
  // Función para manejar tiempo agotado
  const handleTimeUp = useCallback(() => {
    console.log("[EMPTY-MODULE] Tiempo agotado para problema:", currentProblemIndex + 1);
    
    if (singleProblemTimerRef.current) {
      clearTimeout(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
    
    // Marcar respuesta como tiempo agotado
    const newAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: emptyModuleProblemToProblem(currentProblem),
      userAnswer: 0,
      isCorrect: false,
      status: 'timeout',
      attempts: attempts + 1,
      timestamp: Date.now(),
      timeTaken: timeLimit
    };
    
    setUserAnswers(prev => [...prev, newAnswer]);
    
    // Mostrar feedback
    if (settings.showImmediateFeedback) {
      setFeedbackType('incorrect');
      setShowFeedback(true);
      
      setTimeout(() => {
        setShowFeedback(false);
        moveToNextProblem();
      }, 1500);
    } else {
      moveToNextProblem();
    }
    
    // Incrementar contador de incorrectas
    incrementConsecutiveIncorrect();
    
    toast({
      title: "⏱️ Tiempo agotado",
      description: "Se acabó el tiempo para este problema",
      variant: "destructive"
    });
  }, [currentProblem, attempts, timeLimit, settings.showImmediateFeedback]);
  
  // Función para procesar respuesta del usuario
  const handleSubmitAnswer = useCallback(() => {
    if (!currentProblem || userInput.trim() === "") return;
    
    const userAnswer = parseFloat(userInput.trim());
    
    if (isNaN(userAnswer)) {
      toast({
        title: "Respuesta inválida",
        description: "Por favor ingresa un número válido",
        variant: "destructive"
      });
      return;
    }
    
    const isCorrect = validateAnswer(currentProblem, userAnswer);
    const timeTaken = problemStartTime ? (Date.now() - problemStartTime) / 1000 : 0;
    
    // Detener timer del problema actual
    if (singleProblemTimerRef.current) {
      clearTimeout(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
    
    const newAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: emptyModuleProblemToProblem(currentProblem),
      userAnswer,
      isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      attempts: attempts + 1,
      timestamp: Date.now(),
      timeTaken
    };
    
    console.log("[EMPTY-MODULE] Respuesta procesada:", newAnswer);
    
    setUserAnswers(prev => [...prev, newAnswer]);
    
    // Actualizar contadores de progreso
    if (isCorrect) {
      incrementConsecutiveCorrect();
      updateLongestStreak();
    } else {
      incrementConsecutiveIncorrect();
    }
    
    // Mostrar feedback inmediato si está habilitado
    if (settings.showImmediateFeedback) {
      setFeedbackType(isCorrect ? 'correct' : 'incorrect');
      setShowFeedback(true);
      
      if (isCorrect && settings.enableSoundEffects) {
        // Aquí se puede añadir sonido de éxito
      }
      
      setTimeout(() => {
        setShowFeedback(false);
        
        if (isCorrect) {
          moveToNextProblem();
        } else {
          handleIncorrectAnswer();
        }
      }, 1500);
    } else {
      if (isCorrect) {
        moveToNextProblem();
      } else {
        handleIncorrectAnswer();
      }
    }
  }, [currentProblem, userInput, attempts, problemStartTime, settings]);
  
  // Función para manejar respuesta incorrecta
  const handleIncorrectAnswer = useCallback(() => {
    const maxAttempts = settings.maxAttempts || 3;
    
    if (attempts + 1 >= maxAttempts && maxAttempts > 0) {
      // Se agotaron los intentos, mostrar respuesta y continuar
      setShowAnswer(true);
      setRevealedAnswers(prev => new Set([...prev, currentProblem.id]));
      
      setTimeout(() => {
        setShowAnswer(false);
        moveToNextProblem();
      }, 3000);
    } else {
      // Permitir otro intento
      setAttempts(prev => prev + 1);
      setUserInput("");
      inputRef.current?.focus();
      
      toast({
        title: "Respuesta incorrecta",
        description: `Intentos restantes: ${maxAttempts - attempts - 1}`,
        variant: "destructive"
      });
    }
  }, [attempts, settings.maxAttempts, currentProblem]);
  
  // Función para avanzar al siguiente problema
  const moveToNextProblem = useCallback(() => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setUserInput("");
      setAttempts(0);
      setShowAnswer(false);
      setProblemStartTime(Date.now());
      
      // Reiniciar timer para el siguiente problema
      if (hasTimerEnabled) {
        startProblemTimer();
      }
      
      // Enfocar input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Ejercicio completado
      completeExercise();
    }
  }, [currentProblemIndex, problems.length, hasTimerEnabled, startProblemTimer]);
  
  // Función para completar ejercicio
  const completeExercise = useCallback(() => {
    setIsCompleted(true);
    setShowResults(true);
    
    // Limpiar todos los timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (problemTimerRef.current) clearInterval(problemTimerRef.current);
    if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
    
    const endTime = Date.now();
    const totalTime = startTime ? (endTime - startTime) / 1000 : 0;
    setTotalTimeSpent(totalTime);
    
    // Calcular estadísticas
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const score = Math.round((correctAnswers / problems.length) * 100);
    const accuracy = correctAnswers / problems.length;
    
    // Mostrar confetti si el rendimiento es bueno
    if (score >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    console.log("[EMPTY-MODULE] Ejercicio completado. Score:", score);
    
    // Guardar resultado en el progreso
    saveExerciseResult({
      operationId: "empty-module",
      date: new Date().toISOString(),
      score,
      totalProblems: problems.length,
      timeSpent: totalTime,
      difficulty: settings.difficulty,
      accuracy,
      avgTimePerProblem: totalTime / problems.length,
      avgAttempts: userAnswers.reduce((sum, answer) => sum + answer.attempts, 0) / userAnswers.length,
      revealedAnswers: revealedAnswers.size
    });
    
    toast({
      title: "¡Ejercicio completado! 🎉",
      description: `Puntuación: ${score}% (${correctAnswers}/${problems.length})`,
      variant: score >= 70 ? "default" : "destructive"
    });
  }, [userAnswers, problems.length, startTime, settings.difficulty, revealedAnswers.size]);
  
  // Función para guardar resultado del ejercicio
  const saveExerciseResult = async (result: ExerciseResult) => {
    try {
      if (activeProfile) {
        // Aquí se implementaría el guardado en el backend
        console.log("[EMPTY-MODULE] Guardando resultado:", result);
        
        // Simular guardado exitoso
        toast({
          title: "Progreso guardado",
          description: "Tu progreso ha sido guardado exitosamente",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error guardando resultado:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar tu progreso",
        variant: "destructive"
      });
    }
  };
  
  // Función para revelar respuesta
  const revealAnswer = useCallback(() => {
    if (!currentProblem) return;
    
    setShowAnswer(true);
    setRevealedAnswers(prev => new Set([...prev, currentProblem.id]));
    
    // Crear respuesta "revelada"
    const revealedAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: emptyModuleProblemToProblem(currentProblem),
      userAnswer: currentProblem.correctAnswer,
      isCorrect: false, // Marcamos como incorrecta porque fue revelada
      status: 'revealed',
      attempts: attempts + 1,
      timestamp: Date.now(),
      timeTaken: problemStartTime ? (Date.now() - problemStartTime) / 1000 : 0
    };
    
    setUserAnswers(prev => [...prev, revealedAnswer]);
    
    setTimeout(() => {
      setShowAnswer(false);
      moveToNextProblem();
    }, 3000);
  }, [currentProblem, attempts, problemStartTime, moveToNextProblem]);
  
  // Función para reiniciar ejercicio
  const restartExercise = useCallback(() => {
    initializeExercise();
  }, [initializeExercise]);
  
  // Efecto para inicializar ejercicio al cargar
  useEffect(() => {
    initializeExercise();
    
    // Cleanup al desmontar
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (problemTimerRef.current) clearInterval(problemTimerRef.current);
      if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
    };
  }, []);
  
  // Efecto para manejar teclas
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isCompleted && !showResults) {
        e.preventDefault();
        handleSubmitAnswer();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleSubmitAnswer, isCompleted, showResults]);
  
  // Información de alineación para problemas verticales
  const alignmentInfo = useMemo(() => {
    return getVerticalAlignmentInfo(currentProblem);
  }, [currentProblem]);
  
  // Renderizado del problema
  const renderProblem = () => {
    if (!currentProblem) return null;
    
    return (
      <div className="text-center space-y-4">
        <div className="text-lg text-gray-600">
          Problema {currentProblemIndex + 1} de {problems.length}
        </div>
        
        {/* Aquí se renderizaría el problema específico según el tipo de operación */}
        <div className="text-4xl font-mono bg-gray-50 p-6 rounded-lg">
          {/* PLACEHOLDER: Aquí se implementaría la visualización específica del problema */}
          <div className="text-gray-500">
            [Problema genérico #{currentProblem.id}]
          </div>
          <div className="text-2xl mt-2">
            Respuesta esperada: {formatNumber(currentProblem.correctAnswer)}
          </div>
        </div>
        
        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-100 border border-blue-300 rounded-lg p-4"
          >
            <div className="text-lg font-semibold text-blue-800">
              💡 Respuesta: {formatNumber(currentProblem.correctAnswer)}
            </div>
          </motion.div>
        )}
      </div>
    );
  };
  
  // Renderizado de feedback
  const renderFeedback = () => {
    if (!showFeedback) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-lg shadow-lg ${
          feedbackType === 'correct' 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {feedbackType === 'correct' ? (
            <CheckCircle className="h-8 w-8" />
          ) : (
            <XCircle className="h-8 w-8" />
          )}
          <div className="text-xl font-semibold">
            {feedbackType === 'correct' ? '¡Correcto!' : '¡Incorrecto!'}
          </div>
        </div>
      </motion.div>
    );
  };
  
  // Renderizado de resultados finales
  const renderResults = () => {
    if (!showResults) return null;
    
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const score = Math.round((correctAnswers / problems.length) * 100);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2" />
              ¡Ejercicio Completado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{score}%</div>
              <div className="text-gray-600">
                {correctAnswers} de {problems.length} correctas
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">Tiempo Total</div>
                <div>{Math.round(totalTimeSpent)} segundos</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Respuestas Reveladas</div>
                <div>{revealedAnswers.size}</div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button onClick={restartExercise} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reintentar
              </Button>
              <Button variant="outline" onClick={onOpenSettings} className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div>Generando problemas...</div>
        </div>
      </div>
    );
  }
  
  if (showResults) {
    return renderResults();
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header con progreso */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Empty Module - {settings.difficulty}</h1>
          <div className="flex items-center gap-2">
            {hasTimerEnabled && timeLeft !== null && (
              <Badge variant="outline" className="gap-1">
                <Timer className="h-3 w-3" />
                {timeLeft}s
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Progress value={progress} className="w-full" />
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progreso: {currentProblemIndex + 1}/{problems.length}</span>
          <span>Completadas: {completedProblems}/{problems.length}</span>
        </div>
      </div>
      
      {/* Problema actual */}
      <Card>
        <CardContent className="pt-6">
          {renderProblem()}
          
          {/* Input de respuesta */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 max-w-xs mx-auto">
              <Input
                ref={inputRef}
                type="number"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Tu respuesta..."
                className="text-center text-lg"
                disabled={showAnswer || isCompleted}
              />
              <Button
                onClick={handleSubmitAnswer}
                disabled={!userInput.trim() || showAnswer || isCompleted}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Enviar
              </Button>
            </div>
            
            {/* Botones de ayuda */}
            {settings.showAnswerWithExplanation && !showAnswer && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revealAnswer}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Mostrar respuesta
                </Button>
              </div>
            )}
            
            {attempts > 0 && !showAnswer && (
              <div className="text-center text-sm text-gray-600">
                Intento {attempts + 1} de {settings.maxAttempts || "∞"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Controles adicionales */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={restartExercise} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reiniciar
        </Button>
      </div>
      
      {/* Feedback overlay */}
      <AnimatePresence>
        {renderFeedback()}
      </AnimatePresence>
    </div>
  );
}