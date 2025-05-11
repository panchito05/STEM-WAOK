// Exercise.tsx - Componente principal del módulo unificado de adición
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSettings, ModuleSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';
import { useTranslations } from '@/hooks/use-translations';
import { useRewardsStore, awardReward, getRewardProbability } from '@/lib/rewards-system';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBarUI } from '@/components/ui/progress';
import { formatTime } from '@/lib/utils';
import { Settings as SettingsIcon, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import LevelUpHandler from '@/components/LevelUpHandler';
import RewardAnimation from '@/components/rewards/RewardAnimation';

// Definición de tipos
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';
export type ExerciseLayout = 'horizontal' | 'vertical';

export interface Problem {
  id: string;
  operands: number[];
  answer: number;
  answerMaxDigits: number;
  answerDecimalPosition?: number;
}

export interface AdditionProblem extends Problem {
  type: 'addition';
}

export interface UserAnswer {
  problem: Problem;
  userAnswer: number | null;
  isCorrect: boolean;
  attemptCount: number;
  timeSpent: number;
  status: 'pending' | 'correct' | 'incorrect';
}

// Funciones auxiliares para generar problemas
export function generateAdditionProblem(difficulty: DifficultyLevel): AdditionProblem {
  let operands: number[] = [];
  let decimal = false;
  let answerMaxDigits = 0;
  let answerDecimalPosition: number | undefined = undefined;
  
  // Generamos problemas según el nivel de dificultad
  switch (difficulty) {
    case 'beginner':
      // Números de un dígito (1-9)
      operands = [
        Math.floor(Math.random() * 9) + 1,
        Math.floor(Math.random() * 9) + 1
      ];
      answerMaxDigits = 2;
      break;
      
    case 'elementary':
      // Números de dos dígitos (10-99)
      operands = [
        Math.floor(Math.random() * 90) + 10, 
        Math.floor(Math.random() * 90) + 10
      ];
      answerMaxDigits = 3;
      break;
      
    case 'intermediate':
      // Números de tres dígitos (100-999)
      operands = [
        Math.floor(Math.random() * 900) + 100,
        Math.floor(Math.random() * 900) + 100
      ];
      answerMaxDigits = 4;
      break;
      
    case 'advanced':
      // Números de cuatro dígitos (1000-9999)
      operands = [
        Math.floor(Math.random() * 9000) + 1000,
        Math.floor(Math.random() * 9000) + 1000
      ];
      answerMaxDigits = 5;
      break;
      
    case 'expert':
      // Números decimales (con 2 decimales)
      decimal = true;
      operands = [
        Math.round((Math.random() * 900 + 100) * 100) / 100,
        Math.round((Math.random() * 900 + 100) * 100) / 100
      ];
      answerMaxDigits = 7; // Incluye punto decimal
      answerDecimalPosition = 2;
      break;
  }
  
  // Calculamos la respuesta
  const answer = operands.reduce((sum, operand) => sum + operand, 0);
  
  return {
    id: Math.random().toString(36).substring(2, 10),
    type: 'addition',
    operands,
    answer,
    answerMaxDigits,
    answerDecimalPosition
  };
}

// Props para el componente Exercise
interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

// Componente para el ejercicio de Adición
function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const { t } = useTranslations();
  const { saveModuleSettings } = useSettings();
  const { recordProgress } = useProgress();
  const { showReward } = useRewardsStore();
  
  // Configuración del módulo
  const moduleId = 'unified-addition';
  
  // Estado para controlar si se muestra la configuración
  const [showSettings, setShowSettings] = useState(false);
  
  // Estado de los problemas
  const [problems, setProblems] = useState<AdditionProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [problemStartTime, setProblemStartTime] = useState<number>(Date.now());
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [showingExplanation, setShowingExplanation] = useState(false);
  const [displayTimer, setDisplayTimer] = useState<number | null>(null);
  
  // Referencias para los temporizadores
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Función para generar problemas basados en la configuración
  const generateProblems = useCallback(() => {
    if (!settings) return [];
    
    const difficulty = settings.difficulty || 'beginner';
    const problemCount = settings.problemCount || 10;
    
    const newProblems: AdditionProblem[] = [];
    for (let i = 0; i < problemCount; i++) {
      newProblems.push(generateAdditionProblem(difficulty as DifficultyLevel));
    }
    
    return newProblems;
  }, [settings]);
  
  // Inicialización del ejercicio
  useEffect(() => {
    // Verifica que settings no sea undefined antes de usarlo
    if (!settings) return;
    
    const newProblems = generateProblems();
    setProblems(newProblems);
    
    // Inicializar userAnswers con respuestas vacías para cada problema
    setUserAnswers(newProblems.map(problem => ({
      problem,
      userAnswer: null,
      isCorrect: false,
      attemptCount: 0,
      timeSpent: 0,
      status: 'pending'
    })));
    
    setCurrentProblemIndex(0);
    setExerciseCompleted(false);
    setProblemStartTime(Date.now());
    setUserInput('');
    
    // Configurar temporizador para todo el ejercicio si está habilitado
    if (settings.timeLimit === 'total' && settings.timeValue) {
      const totalTimeLimit = settings.timeValue * 1000;
      setDisplayTimer(totalTimeLimit);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setDisplayTimer(prev => {
          if (prev === null) return null;
          const newValue = prev - 1000;
          if (newValue <= 0) {
            // Tiempo agotado para todo el ejercicio
            if (timerRef.current) clearInterval(timerRef.current);
            completeExercise();
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
      }
    };
  }, [settings, generateProblems]);
  
  // Configurar temporizador para problema individual cuando cambia el índice del problema actual
  useEffect(() => {
    if (!settings) return;
    
    // Reiniciar el tiempo de inicio para el nuevo problema
    setProblemStartTime(Date.now());
    
    // Limpiar temporizador anterior si existe
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
    
    // Configurar temporizador para problema individual si está habilitado
    if (settings.timeLimit === 'per-problem' && settings.timeValue) {
      const problemTimeLimit = settings.timeValue * 1000;
      setDisplayTimer(problemTimeLimit);
      
      singleProblemTimerRef.current = setInterval(() => {
        setDisplayTimer(prev => {
          if (prev === null) return null;
          const newValue = prev - 1000;
          if (newValue <= 0) {
            // Tiempo agotado para este problema
            if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
            
            // Marcar como incorrecto y pasar al siguiente si todavía está pendiente
            handleTimeOut();
            return 0;
          }
          return newValue;
        });
      }, 1000);
    } else if (settings.timeLimit === 'no-limit') {
      setDisplayTimer(null);
    }
    
    return () => {
      if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
      }
    };
  }, [currentProblemIndex, settings]);
  
  // Función para manejar cuando se agota el tiempo
  const handleTimeOut = useCallback(() => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      if (newAnswers[currentProblemIndex] && newAnswers[currentProblemIndex].status === 'pending') {
        const timeSpent = Date.now() - problemStartTime;
        newAnswers[currentProblemIndex] = {
          ...newAnswers[currentProblemIndex],
          isCorrect: false,
          timeSpent,
          status: 'incorrect'
        };
      }
      return newAnswers;
    });
    
    // Pasar al siguiente problema con un pequeño retraso
    setTimeout(() => {
      if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(prev => prev + 1);
        setUserInput('');
      } else {
        completeExercise();
      }
    }, 1000);
  }, [currentProblemIndex, problems.length, problemStartTime]);
  
  // Función para completar el ejercicio
  const completeExercise = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
    
    // Marcar problemas pendientes como incorrectos
    const finalAnswers = userAnswers.map((answer, index) => {
      if (answer.status === 'pending') {
        return {
          ...answer,
          isCorrect: false,
          status: 'incorrect'
        };
      }
      return answer;
    });
    
    setUserAnswers(finalAnswers);
    setExerciseCompleted(true);
    
    // Calcular estadísticas
    const correctCount = finalAnswers.filter(a => a.isCorrect).length;
    const totalTime = finalAnswers.reduce((total, a) => total + a.timeSpent, 0);
    const score = Math.round((correctCount / finalAnswers.length) * 100);
    
    // Registrar progreso
    recordProgress({
      operationId: moduleId,
      score,
      totalProblems: finalAnswers.length,
      timeSpent: totalTime,
      difficulty: settings?.difficulty || 'beginner'
    });
    
    // Determinar si mostrar una recompensa
    if (score >= 70 && Math.random() < getRewardProbability(score)) {
      const rewardType = score >= 90 ? 'gold' : score >= 80 ? 'silver' : 'bronze';
      awardReward({
        id: `${moduleId}-${Date.now()}`,
        type: rewardType,
        title: t('rewards.addition.title'),
        description: `${t('rewards.addition.description')} ${score}% ${t('rewards.addition.score')}`,
        date: new Date(),
        operation: 'addition'
      });
      
      // Mostrar animación de recompensa
      showReward(rewardType);
    }
    
    // Determinar si el usuario ha subido de nivel (implementación básica)
    const currentDifficulty = settings?.difficulty || 'beginner';
    const consecutiveCorrectAnswers = correctCount;
    
    // Verificar si el usuario califica para subir de nivel
    if (consecutiveCorrectAnswers >= CORRECT_ANSWERS_FOR_LEVEL_UP && currentDifficulty !== 'expert') {
      const difficultyLevels: DifficultyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
      const currentIndex = difficultyLevels.indexOf(currentDifficulty as DifficultyLevel);
      
      if (currentIndex < difficultyLevels.length - 1 && settings?.enableAdaptiveDifficulty) {
        const newDifficulty = difficultyLevels[currentIndex + 1];
        
        // Actualizar configuración con nuevo nivel de dificultad
        const updatedSettings = {
          ...settings,
          difficulty: newDifficulty
        };
        
        // Guardar la configuración actualizada
        if (saveModuleSettings) {
          saveModuleSettings(moduleId, updatedSettings);
        }
        
        // Notificar al usuario de la subida de nivel
        eventBus.emit('levelUp', {
          previousLevel: currentDifficulty,
          newLevel: newDifficulty,
          consecutiveCorrectAnswers
        });
      }
    }
  }, [moduleId, settings, userAnswers, problems.length, recordProgress, showReward, t, saveModuleSettings]);
  
  // Función para verificar la respuesta del usuario
  const checkAnswer = useCallback(() => {
    if (exerciseCompleted || currentProblemIndex >= problems.length) return;
    
    const currentProblem = problems[currentProblemIndex];
    const numericAnswer = parseFloat(userInput);
    const isCorrect = !isNaN(numericAnswer) && numericAnswer === currentProblem.answer;
    const timeSpent = Date.now() - problemStartTime;
    
    // Actualizar respuestas del usuario
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentProblemIndex] = {
        ...newAnswers[currentProblemIndex],
        userAnswer: isNaN(numericAnswer) ? null : numericAnswer,
        isCorrect,
        attemptCount: prev[currentProblemIndex].attemptCount + 1,
        timeSpent,
        status: isCorrect ? 'correct' : 'incorrect'
      };
      return newAnswers;
    });
    
    // Mostrar explicación o pasar al siguiente problema
    if (settings?.showAnswerWithExplanation && !isCorrect) {
      setShowingExplanation(true);
    } else {
      // Esperar un momento para mostrar la retroalimentación antes de continuar
      setTimeout(() => {
        if (currentProblemIndex < problems.length - 1) {
          setCurrentProblemIndex(prev => prev + 1);
          setUserInput('');
          setShowingExplanation(false);
        } else {
          completeExercise();
        }
      }, isCorrect ? 1000 : 2000);
    }
    
    // Limpiar temporizador del problema actual si existe
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
  }, [userInput, problems, currentProblemIndex, exerciseCompleted, problemStartTime, completeExercise, settings?.showAnswerWithExplanation]);
  
  // Manejar la entrada del usuario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Validar entrada para permitir solo dígitos y un punto decimal
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setUserInput(value);
    }
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkAnswer();
  };
  
  // Pasar a la siguiente explicación
  const handleNextAfterExplanation = () => {
    setShowingExplanation(false);
    
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setUserInput('');
    } else {
      completeExercise();
    }
  };
  
  // Reiniciar el ejercicio
  const handleReset = () => {
    // Reiniciar temporizadores
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
    
    // Generar nuevos problemas y reiniciar estado
    const newProblems = generateProblems();
    setProblems(newProblems);
    
    // Inicializar userAnswers con respuestas vacías para cada problema
    setUserAnswers(newProblems.map(problem => ({
      problem,
      userAnswer: null,
      isCorrect: false,
      attemptCount: 0,
      timeSpent: 0,
      status: 'pending'
    })));
    
    setCurrentProblemIndex(0);
    setExerciseCompleted(false);
    setProblemStartTime(Date.now());
    setUserInput('');
    setShowingExplanation(false);
    
    // Configurar temporizador para todo el ejercicio si está habilitado
    if (settings?.timeLimit === 'exercise' && settings?.timeValue) {
      const totalTimeLimit = settings.timeValue * 1000;
      setDisplayTimer(totalTimeLimit);
      
      timerRef.current = setInterval(() => {
        setDisplayTimer(prev => {
          if (prev === null) return null;
          const newValue = prev - 1000;
          if (newValue <= 0) {
            // Tiempo agotado para todo el ejercicio
            if (timerRef.current) clearInterval(timerRef.current);
            completeExercise();
            return 0;
          }
          return newValue;
        });
      }, 1000);
    } else {
      setDisplayTimer(null);
    }
  };
  
  // Funciones de navegación para revisar problemas después de completar el ejercicio
  const goToPreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1);
    }
  };
  
  const goToNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
    }
  };
  
  // Renderizado condicional para Settings
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  // Verificar si hay problemas generados
  if (problems.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">{t('exercise.loading')}</p>
      </div>
    );
  }
  
  const currentProblem = problems[currentProblemIndex];
  const currentAnswer = userAnswers[currentProblemIndex];
  
  // Estilos para el layout de la operación
  const operandStyle = "text-lg sm:text-xl md:text-2xl font-medium";
  const plusSignStyle = "text-lg sm:text-xl md:text-2xl mx-2 text-gray-600";
  const plusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
  const sumLineStyle = "border-t-2 border-gray-700 my-1";
  
  return (
    <div className="exercise-container max-w-3xl mx-auto p-4">
      {/* Control de Settings */}
      {showSettings ? (
        <div>
          <Button variant="ghost" size="icon" onClick={toggleSettings} className="absolute top-4 right-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {/* El componente Settings se importa desde su propio archivo */}
        </div>
      ) : (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('exercise.addition.title')}</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleSettings}>
                  <Cog className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('exercise.settings')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {!showSettings && (
        <>
          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span>
                {t('exercise.problem')} {currentProblemIndex + 1} / {problems.length}
              </span>
              
              {displayTimer !== null && (
                <span className={`font-medium ${displayTimer < 5000 ? 'text-red-500' : 'text-primary'}`}>
                  {formatTime(displayTimer)}
                </span>
              )}
            </div>
            <ProgressBarUI value={(currentProblemIndex / problems.length) * 100} className="h-2" />
          </div>
          
          {!exerciseCompleted ? (
            /* Vista de ejercicio activo */
            <div className="exercise-active space-y-6">
              {/* Problema de adición */}
              <div className="problem-display p-6 rounded-lg bg-card border shadow-sm mx-auto max-w-sm">
                <div className="flex justify-center">
                  <div className="text-center">
                    {currentProblem.answerMaxDigits > 4 ? (
                      /* Presentación vertical para problemas grandes */
                      <div className="text-right font-mono">
                        {currentProblem.operands.map((operand, idx) => (
                          <div key={idx} className={operandStyle}>
                            {idx === 0 ? ' ' : '+'}{' '}
                            {currentProblem.answerDecimalPosition 
                              ? operand.toFixed(currentProblem.answerDecimalPosition)
                              : operand.toLocaleString()}
                          </div>
                        ))}
                        <div className={sumLineStyle}></div>
                      </div>
                    ) : (
                      /* Presentación horizontal para problemas pequeños */
                      <div className="flex items-center justify-center flex-wrap">
                        {currentProblem.operands.map((operand, idx) => (
                          <React.Fragment key={idx}>
                            <span className={operandStyle}>
                              {currentProblem.answerDecimalPosition 
                                ? operand.toFixed(currentProblem.answerDecimalPosition)
                                : operand.toLocaleString()}
                            </span>
                            {idx < currentProblem.operands.length - 1 && (
                              <span className={plusSignStyle}>+</span>
                            )}
                          </React.Fragment>
                        ))}
                        <span className={plusSignStyle}>=</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Formulario para respuesta */}
              {!showingExplanation ? (
                <form onSubmit={handleSubmit} className="answer-form">
                  <div className="flex flex-col items-center space-y-4">
                    <input
                      type="text"
                      value={userInput}
                      onChange={handleInputChange}
                      className="answer-input px-4 py-2 border rounded-md text-center text-lg w-40"
                      placeholder={t('exercise.enterAnswer')}
                      autoFocus
                    />
                    <Button type="submit" className="w-40">
                      {t('exercise.check')}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Explicación de la respuesta */
                <div className="explanation-container space-y-4 p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold text-lg text-primary">
                    {t('exercise.explanation')}
                  </h3>
                  <p>
                    {t('exercise.addition.explanation.part1')}
                    <span className="font-medium">
                      {currentProblem.operands.join(' + ')} = {currentProblem.answer}
                    </span>
                    {t('exercise.addition.explanation.part2')}
                  </p>
                  <Button onClick={handleNextAfterExplanation} className="w-full">
                    {t('exercise.next')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Vista de resumen del ejercicio completado */
            <div className="exercise-summary space-y-6">
              <div className="summary-card p-6 rounded-lg bg-card border shadow-sm">
                <h3 className="text-xl font-bold mb-4">{t('exercise.summary')}</h3>
                
                <div className="summary-stats grid grid-cols-2 gap-4 mb-6">
                  <div className="stat-item">
                    <p className="text-sm text-muted-foreground">{t('exercise.correctAnswers')}</p>
                    <p className="text-2xl font-bold">
                      {userAnswers.filter(a => a.isCorrect).length} / {userAnswers.length}
                    </p>
                  </div>
                  <div className="stat-item">
                    <p className="text-sm text-muted-foreground">{t('exercise.score')}</p>
                    <p className="text-2xl font-bold">
                      {Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100)}%
                    </p>
                  </div>
                  <div className="stat-item">
                    <p className="text-sm text-muted-foreground">{t('exercise.totalTime')}</p>
                    <p className="text-2xl font-bold">
                      {formatTime(userAnswers.reduce((total, a) => total + a.timeSpent, 0))}
                    </p>
                  </div>
                  <div className="stat-item">
                    <p className="text-sm text-muted-foreground">{t('exercise.averageTime')}</p>
                    <p className="text-2xl font-bold">
                      {formatTime(userAnswers.reduce((total, a) => total + a.timeSpent, 0) / userAnswers.length)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" /> {t('exercise.restart')}
                  </Button>
                </div>
              </div>
              
              {/* Revisión de problemas */}
              <div className="review-container p-6 rounded-lg bg-card border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{t('exercise.review')}</h3>
                
                <div className="review-problem max-w-sm mx-auto">
                  <div className="problem-display text-center mb-4">
                    <div className="text-right font-mono inline-block">
                      {problems[currentProblemIndex].operands.map((operand, idx) => (
                        <div key={idx} className={operandStyle}>
                          {idx === 0 ? ' ' : '+'}{' '}
                          {problems[currentProblemIndex].answerDecimalPosition 
                            ? operand.toFixed(problems[currentProblemIndex].answerDecimalPosition)
                            : operand.toLocaleString()}
                        </div>
                      ))}
                      <div className={sumLineStyle}></div>
                      <div className={`${operandStyle} ${
                        userAnswers[currentProblemIndex].isCorrect 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {userAnswers[currentProblemIndex].userAnswer !== null
                          ? problems[currentProblemIndex].answerDecimalPosition
                            ? userAnswers[currentProblemIndex].userAnswer.toFixed(
                                problems[currentProblemIndex].answerDecimalPosition
                              )
                            : userAnswers[currentProblemIndex].userAnswer.toLocaleString()
                          : '?'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="answer-explanation">
                    {userAnswers[currentProblemIndex].isCorrect ? (
                      <div className="text-green-600 flex items-center justify-center gap-2 mb-4">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">{t('exercise.correctAnswer')}</span>
                      </div>
                    ) : (
                      <div className="bg-muted p-3 rounded-md mb-4">
                        <p className="text-red-600 font-medium mb-2">{t('exercise.incorrectAnswer')}</p>
                        <p>
                          {t('exercise.correctAnswerWas')}{' '}
                          <span className="font-bold">
                            {problems[currentProblemIndex].answerDecimalPosition
                              ? problems[currentProblemIndex].answer.toFixed(
                                  problems[currentProblemIndex].answerDecimalPosition
                                )
                              : problems[currentProblemIndex].answer.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="navigation-buttons flex justify-between mt-4">
                    <Button 
                      variant="outline" 
                      onClick={goToPreviousProblem}
                      disabled={currentProblemIndex === 0}
                      className="w-20"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="problem-number">
                      <span className="text-sm text-muted-foreground">
                        {currentProblemIndex + 1} / {problems.length}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={goToNextProblem}
                      disabled={currentProblemIndex === problems.length - 1}
                      className="w-20"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Componente para manejar la subida de nivel */}
          <LevelUpHandler />
          
          {/* Componente para mostrar animación de recompensa */}
          <RewardAnimation />
        </>
      )}
    </div>
  );
}

export default Exercise;