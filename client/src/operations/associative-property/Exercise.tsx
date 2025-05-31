// Exercise.tsx - Módulo de Propiedades Asociativas Corregido
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateAssociativePropertyProblem, checkAnswer } from "./utils";
import { Problem, UserAnswer as UserAnswerType, AssociativePropertyProblem, AssociativePropertyUserAnswer, DifficultyLevel } from "./types";
import VisualProblemDisplay from "./components/VisualProblemDisplay";
import InteractiveExercise from "./components/InteractiveExercise";
import AdvancedExercise from "./components/AdvancedExercise";
import ProgressiveGroupingDisplay from "./components/ProgressiveGroupingDisplay";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube, X, Plus, Maximize2, Minimize2, Play } from "lucide-react";
import { ProfessorModeWithSync as ProfessorMode } from "./components/professor/ProfessorModeWithSync";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MathProblem } from '../../components/ProblemRenderer';
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import LevelUpHandler from "@/components/LevelUpHandler";
import { Link } from "wouter";
import ExerciseHistoryDialog from "@/components/ExerciseHistoryDialog";
import { useRewards, RewardModal, useRewardQueue, RewardUtils } from '@/rewards';
import { useMultiOperationsSession } from '@/hooks/useMultiOperationsSession';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
const digitBoxFocusStyle = "border-blue-500 ring-2 ring-blue-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300";
const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const plusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const sumLineStyle = "border-t-2 border-gray-700 my-1";

interface YoutubeVideoMetadata {
  url: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
}

const Exercise: React.FC<ExerciseProps> = ({ settings, onOpenSettings }) => {
  // Estados principales
  const [problemsList, setProblemsList] = useState<AssociativePropertyProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswersHistory, setUserAnswersHistory] = useState<(AssociativePropertyUserAnswer | null)[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [exerciseState, setExerciseState] = useState<'ready' | 'in-progress' | 'completed' | 'review'>('ready');
  const [startTime, setStartTime] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [timeSpentOnCurrentProblem, setTimeSpentOnCurrentProblem] = useState<number>(0);
  const [isProfessorModeOpen, setIsProfessorModeOpen] = useState(false);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [interactiveAnswers, setInteractiveAnswers] = useState<string[]>([]);
  const [activeInteractiveField, setActiveInteractiveField] = useState<number>(0);
  const [digitInputs, setDigitInputs] = useState<string[]>([]);
  const [currentDigitPosition, setCurrentDigitPosition] = useState(0);

  // Referencias
  const inputRef = useRef<HTMLInputElement>(null);
  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { saveExerciseResult } = useProgress();
  const { updateModuleSettings } = useSettings();
  
  // Sistema de traducción simplificado
  const t = (key: string) => {
    const translations: { [key: string]: string } = {
      'common.errorLoadingProblem': 'Error al cargar el problema',
      'common.loading': 'Cargando...',
      'exercise.complete': 'Ejercicio completado',
      'exercise.timeUp': 'Se acabó el tiempo',
      'exercise.continue': 'Continuar',
      'exercise.retry': 'Reintentar',
      'exercises.tryAgain': 'Intentar de nuevo',
      'common.settings': 'Configuración'
    };
    return translations[key] || key;
  };

  // Sistema de recompensas simplificado
  const [rewardStats, setRewardStats] = useState(() => {
    const saved = localStorage.getItem('associative-property_rewards');
    const defaultStats = {
      totalProblems: 0,
      currentStreak: 0,
      showRewardModal: false,
      rewardMessage: ''
    };
    return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
  });

  // Función para generar un nuevo conjunto de problemas
  const generateNewProblemSet = useCallback(() => {
    try {
      const newProblems: AssociativePropertyProblem[] = [];
      const problemCount = settings.problemCount || 5;

      for (let i = 0; i < problemCount; i++) {
        const problem = generateAssociativePropertyProblem(
          settings.difficulty as DifficultyLevel,
          3, // Siempre 3 operandos para propiedad asociativa
          0, // Sin decimales por ahora
          50 // Valor máximo por operando
        );
        newProblems.push(problem);
      }

      setProblemsList(newProblems);
      setUserAnswersHistory(new Array(newProblems.length).fill(null));
      setCurrentProblemIndex(0);
      setCurrentInput("");
      setShowFeedback(false);
      setCurrentAttempts(0);
      setShowExplanation(false);
      setInteractiveAnswers([]);
      setActiveInteractiveField(0);
      setDigitInputs([]);
      setCurrentDigitPosition(0);
      setExerciseState('in-progress');
      setStartTime(Date.now());
      setTimeSpentOnCurrentProblem(0);

      // Reiniciar timers
      if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
      }
      if (generalTimerRef.current) {
        clearInterval(generalTimerRef.current);
      }

      // Iniciar timer general
      generalTimerRef.current = window.setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);

      // Iniciar timer del problema individual si está habilitado
      if (settings.timeLimit && parseInt(settings.timeLimit) > 0) {
        const timeLimit = parseInt(settings.timeLimit);
        let timeLeft = timeLimit;
        singleProblemTimerRef.current = window.setInterval(() => {
          timeLeft--;
          setTimeSpentOnCurrentProblem(timeLimit - timeLeft);
          if (timeLeft <= 0) {
            handleTimeUp();
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Error generando problemas:', error);
    }
  }, [settings]);

  // Función para manejar cuando se acaba el tiempo
  const handleTimeUp = useCallback(() => {
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }

    const currentProblem = problemsList[currentProblemIndex];
    if (currentProblem) {
      const timeUpAnswer: AssociativePropertyUserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: 0,
        isCorrect: false,
        status: 'timeout',
        attempts: currentAttempts + 1,
        timestamp: Date.now(),
        timeTaken: timeSpentOnCurrentProblem
      };

      setUserAnswersHistory(prev => {
        const newHistory = [...prev];
        newHistory[currentProblemIndex] = timeUpAnswer;
        return newHistory;
      });

      setShowFeedback(true);
      setIsCorrect(false);
      
      setTimeout(() => {
        handleNextProblem();
      }, 2000);
    }
  }, [problemsList, currentProblemIndex, currentAttempts, timeSpentOnCurrentProblem]);

  // Función para manejar el envío de respuesta
  const handleSubmitAnswer = useCallback(() => {
    if (!problemsList[currentProblemIndex] || showFeedback) return;

    const currentProblem = problemsList[currentProblemIndex];
    const userAnswer = parseFloat(currentInput);

    if (isNaN(userAnswer)) {
      alert('Por favor, ingresa un número válido');
      return;
    }

    const correct = checkAnswer(currentProblem, userAnswer);
    const newAttempts = currentAttempts + 1;

    const answer: AssociativePropertyUserAnswer = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer,
      isCorrect: correct,
      status: correct ? 'correct' : 'incorrect',
      attempts: newAttempts,
      timestamp: Date.now(),
      timeTaken: timeSpentOnCurrentProblem
    };

    setUserAnswersHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentProblemIndex] = answer;
      return newHistory;
    });

    setIsCorrect(correct);
    setShowFeedback(true);
    setCurrentAttempts(newAttempts);

    // Actualizar estadísticas de recompensas
    if (correct) {
      setRewardStats(prev => {
        const newStats = {
          ...prev,
          totalProblems: prev.totalProblems + 1,
          currentStreak: prev.currentStreak + 1
        };
        
        // Mostrar recompensa cada 5 respuestas correctas consecutivas
        if (newStats.currentStreak % 5 === 0) {
          newStats.showRewardModal = true;
          newStats.rewardMessage = `¡Increíble! ${newStats.currentStreak} respuestas correctas consecutivas`;
        }
        
        localStorage.setItem('associative-property_rewards', JSON.stringify(newStats));
        return newStats;
      });
    } else {
      setRewardStats(prev => {
        const newStats = { ...prev, currentStreak: 0 };
        localStorage.setItem('associative-property_rewards', JSON.stringify(newStats));
        return newStats;
      });
    }

    // Limpiar timer del problema actual
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }

    // Auto-continuar o mostrar explicación según configuración
    if (settings.showAnswerWithExplanation || !correct) {
      setShowExplanation(true);
    } else if (correct) {
      autoContinueTimerRef.current = setTimeout(() => {
        handleNextProblem();
      }, 1500);
    }
  }, [problemsList, currentProblemIndex, currentInput, showFeedback, currentAttempts, timeSpentOnCurrentProblem, settings]);

  // Función para ir al siguiente problema
  const handleNextProblem = useCallback(() => {
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }

    setShowFeedback(false);
    setShowExplanation(false);
    setCurrentInput("");
    setCurrentAttempts(0);
    setTimeSpentOnCurrentProblem(0);
    setInteractiveAnswers([]);
    setActiveInteractiveField(0);
    setDigitInputs([]);
    setCurrentDigitPosition(0);

    if (currentProblemIndex < problemsList.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      
      // Iniciar timer para el siguiente problema
      if (settings.hasTimerEnabled && settings.timeLimit) {
        const timeLimit = parseInt(settings.timeLimit);
        if (timeLimit > 0) {
          let timeLeft = timeLimit;
          singleProblemTimerRef.current = window.setInterval(() => {
            timeLeft--;
            setTimeSpentOnCurrentProblem(timeLimit - timeLeft);
            if (timeLeft <= 0) {
              handleTimeUp();
            }
          }, 1000);
        }
      }
    } else {
      // Ejercicio completado
      setExerciseState('completed');
      if (generalTimerRef.current) {
        clearInterval(generalTimerRef.current);
      }
      
      // Guardar resultados
      const score = userAnswersHistory.filter(a => a && a.isCorrect).length;
      const accuracy = problemsList.length > 0 ? (score / problemsList.length) * 100 : 0;
      
      saveExerciseResult({
        operationId: 'associative-property',
        date: new Date().toISOString(),
        score,
        totalProblems: problemsList.length,
        timeSpent,
        difficulty: settings.difficulty,
        accuracy,
        avgTimePerProblem: problemsList.length > 0 ? timeSpent / problemsList.length : 0,
        avgAttempts: userAnswersHistory.reduce((sum, a) => sum + (a?.attempts || 0), 0) / problemsList.length,
        revealedAnswers: 0,
        extra_data: {
          version: '1.0',
          timestamp: Date.now(),
          exerciseType: 'associative-property',
          problems: problemsList,
          userAnswers: userAnswersHistory
        }
      });
    }
  }, [currentProblemIndex, problemsList.length, userAnswersHistory, timeSpent, settings, saveExerciseResult]);

  // Inicializar ejercicio
  useEffect(() => {
    generateNewProblemSet();
    
    return () => {
      if (generalTimerRef.current) clearInterval(generalTimerRef.current);
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    };
  }, [generateNewProblemSet]);

  // Manejar teclas
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showFeedback && currentInput) {
        handleSubmitAnswer();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleSubmitAnswer, showFeedback, currentInput]);

  const currentProblem = problemsList[currentProblemIndex];

  // Renderizar pantalla de carga
  if (exerciseState === 'ready' || !currentProblem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar pantalla completada
  if (exerciseState === 'completed') {
    const score = userAnswersHistory.filter(a => a && a.isCorrect).length;
    const accuracy = problemsList.length > 0 ? (score / problemsList.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {t('exercise.complete')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Puntuación: {score}/{problemsList.length} ({accuracy.toFixed(1)}%)
              </p>
              <p className="text-md text-gray-500 dark:text-gray-400">
                Tiempo total: {formatTime(timeSpent)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {userAnswersHistory.map((answer, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    answer?.isCorrect 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}
                >
                  <div className="text-sm font-medium mb-2">Problema {index + 1}</div>
                  <div className="text-lg">
                    {problemsList[index]?.operands.join(' + ')} = {problemsList[index]?.correctAnswer}
                  </div>
                  <div className="text-sm mt-1">
                    Tu respuesta: {answer?.userAnswer || 'Sin responder'}
                    {answer?.isCorrect ? (
                      <Check className="inline ml-2 h-4 w-4 text-green-600" />
                    ) : (
                      <X className="inline ml-2 h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <Button onClick={generateNewProblemSet} className="w-full sm:w-auto">
                {t('exercises.tryAgain')}
              </Button>
              <Button variant="outline" onClick={onOpenSettings} className="w-full sm:w-auto">
                <Settings className="mr-2 h-4 w-4" />
                {t('common.settings')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calcular progreso
  const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;
  const progressValue = problemsList.length > 0 ? (attemptedProblemsCount / problemsList.length) * 100 : 0;
  const score = userAnswersHistory.filter(a => a && a.isCorrect).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Modal de recompensas */}
      {rewardStats.showRewardModal && (
        <RewardModal
          isOpen={rewardStats.showRewardModal}
          onClose={() => setRewardStats(prev => ({ ...prev, showRewardModal: false }))}
          message={rewardStats.rewardMessage}
          type="streak"
        />
      )}

      {/* Modo Profesor */}
      {isProfessorModeOpen && (
        <ProfessorMode
          isOpen={isProfessorModeOpen}
          onClose={() => setIsProfessorModeOpen(false)}
          problem={currentProblem}
        />
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Propiedades Asociativas
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Problema {currentProblemIndex + 1} de {problemsList.length}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProfessorModeOpen(true)}
            >
              <Cog className="h-4 w-4 mr-2" />
              Modo Profesor
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Progreso: {score}/{problemsList.length} correctas
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {formatTime(timeSpent)}
            </span>
          </div>
          <ProgressBarUI value={progressValue} className="h-2" />
        </div>

        {/* Área principal del problema */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
            {/* Mostrar el problema */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Demuestra que la propiedad asociativa se cumple:
              </h2>
              
              {/* Mostrar las dos agrupaciones */}
              {currentProblem.grouping1 && currentProblem.grouping2 && (
                <div className="space-y-6">
                  <div className="text-lg font-mono">
                    <div className="mb-2">
                      Agrupación 1: {currentProblem.grouping1.expression} = {currentProblem.grouping1.totalSum}
                    </div>
                    <div>
                      Agrupación 2: {currentProblem.grouping2.expression} = {currentProblem.grouping2.totalSum}
                    </div>
                  </div>
                  
                  <div className="text-lg">
                    <div className="text-gray-600 dark:text-gray-300 mb-2">
                      ¿Cuál es el resultado de ambas agrupaciones?
                    </div>
                    <div className="text-2xl font-bold">
                      {currentProblem.operands.join(' + ')} = ?
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Campo de entrada */}
            {!showFeedback && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-4">
                  <Input
                    ref={inputRef}
                    type="number"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Tu respuesta"
                    className="w-32 text-center text-xl font-semibold"
                    disabled={showFeedback}
                  />
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={!currentInput || showFeedback}
                    className="px-6"
                  >
                    Verificar
                  </Button>
                </div>
                
                {settings.hasTimerEnabled && settings.timeLimit && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    Tiempo restante: {Math.max(0, parseInt(settings.timeLimit) - timeSpentOnCurrentProblem)}s
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            {showFeedback && (
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isCorrect 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  {isCorrect ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                  </span>
                </div>
                
                {!isCorrect && (
                  <div className="mt-2 text-gray-600 dark:text-gray-300">
                    La respuesta correcta es: {currentProblem.correctAnswer}
                  </div>
                )}
                
                <Button 
                  onClick={handleNextProblem}
                  className="mt-4"
                >
                  {currentProblemIndex < problemsList.length - 1 ? 'Siguiente' : 'Finalizar'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exercise;