// Exercise.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateAdditionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, AdditionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/hooks/use-translations";
import { MathProblem } from '../../components/ProblemRenderer';
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import LevelUpHandler from "@/components/LevelUpHandler";
import { useRewardsStore, awardReward, getRewardProbability, selectRandomReward } from '@/lib/rewards-system';
import RewardAnimation from '@/components/rewards/RewardAnimation';
import ExerciseHistoryDialog from "@/components/ExerciseHistoryDialog";
import YoutubeVideoDialog from '@/components/YoutubeVideoDialog';

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

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Acceder a la información de historial mediante el contexto de progreso
  const { exerciseHistory } = useProgress();
  const moduleId = "addition"; // ID del módulo de suma

  const [problemsList, setProblemsList] = useState<AdditionProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<AdditionProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
  // Cambiar el tipo a HTMLDivElement, que es lo que realmente estamos usando
  const digitBoxRefs = useRef<HTMLDivElement[]>([]);
  // Referencia para mantener el arreglo de referencias actualizadas
  const boxRefsArrayRef = useRef<HTMLDivElement[]>([]);

  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswerType[]>([]);
  const [timer, setTimer] = useState(0);
  const [problemTimerValue, setProblemTimerValue] = useState(settings.timeValue);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [currentReward, setCurrentReward] = useState<string | null>(null);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel>(settings.difficulty as DifficultyLevel);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [recentScores, setRecentScores] = useState<boolean[]>([]); // Usamos un array de booleanos para mayor claridad
  const [levelChange, setLevelChange] = useState<{ previousLevel: DifficultyLevel, newLevel: DifficultyLevel } | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>([]);

  // Estado para cuando se está viendo un problema anterior
  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [previousProblemIndex, setPreviousProblemIndex] = useState<number | null>(null);
  
  // Referencia para los temporizadores
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const problemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waitingRef = useRef<boolean>(false);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Obtener las traducciones
  const { t } = useTranslations();
  const currentTranslations = t('operations.addition');
  
  // Acceder directamente al estado de recompensas
  const rewardsCollected = useRewardsStore(state => state.rewards);
  
  // Estado para controlar la animación de nivel subido/bajado
  const [showLevelChangeAnimation, setShowLevelChangeAnimation] = useState(false);
  const levelChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar temporizadores al desmontar el componente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (problemTimerRef.current) clearInterval(problemTimerRef.current);
      if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
      if (levelChangeTimeoutRef.current) clearTimeout(levelChangeTimeoutRef.current);
    };
  }, []);

  // Iniciar el temporizador cuando comienza el ejercicio
  useEffect(() => {
    if (exerciseStarted && !viewingPrevious) {
      startTimer();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [exerciseStarted, viewingPrevious]);

  // Actualizar el valor del temporizador por problema cuando cambia en la configuración
  useEffect(() => {
    setProblemTimerValue(settings.timeValue);
  }, [settings.timeValue]);

  // Actualizar la dificultad adaptativa cuando cambia en la configuración
  useEffect(() => {
    if (!settings.enableAdaptiveDifficulty) {
      setAdaptiveDifficulty(settings.difficulty as DifficultyLevel);
    }
  }, [settings.difficulty, settings.enableAdaptiveDifficulty]);

  // Inicializar la lista de problemas al montar el componente o cuando cambian las configuraciones relevantes
  useEffect(() => {
    if (!exerciseStarted) {
      initializeProblems();
    }
  }, [settings.numProblems, settings.difficulty, exerciseStarted]);

  // Actualizar el problema actual cuando cambia la lista de problemas o el índice
  useEffect(() => {
    if (problemsList.length > 0 && currentProblemIndex < problemsList.length) {
      setCurrentProblem(problemsList[currentProblemIndex]);
      
      // Reiniciar los estados relacionados con el problema actual
      resetProblemState();
      
      // Solo iniciar el temporizador por problema si está activado y no estamos viendo un problema anterior
      if (settings.enableTimeLimit && exerciseStarted && !viewingPrevious) {
        startProblemTimer();
      }
    }
  }, [problemsList, currentProblemIndex, viewingPrevious, exerciseStarted, settings.enableTimeLimit]);

  // Actualizar la longitud del array de respuestas cuando cambia el problema actual
  useEffect(() => {
    if (currentProblem) {
      const answerDigits = currentProblem.answerMaxDigits || 0;
      const hasDecimal = (currentProblem.answerDecimalPosition ?? -1) >= 0;
      
      // +1 para el signo de decimal si es necesario
      const totalLength = hasDecimal ? answerDigits + 1 : answerDigits;
      
      // Inicializar array de respuestas con cadenas vacías
      const newDigitAnswers = Array(totalLength).fill('');
      setDigitAnswers(newDigitAnswers);
      
      // Actualizar el arreglo de referencias
      boxRefsArrayRef.current = Array(totalLength).fill(null);
      digitBoxRefs.current = boxRefsArrayRef.current;
    }
  }, [currentProblem]);

  // Para detectar clics fuera de las cajas de dígitos (para quitar el foco)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (focusedDigitIndex !== null) {
        const target = e.target as Node;
        
        // Verificar si el clic fue dentro de alguna caja de dígitos
        const clickedInside = digitBoxRefs.current.some(
          (ref) => ref && ref.contains(target)
        );
        
        if (!clickedInside) {
          setFocusedDigitIndex(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [focusedDigitIndex]);

  // Inicializar los problemas basados en la configuración
  const initializeProblems = useCallback(() => {
    const difficultyToUse = settings.enableAdaptiveDifficulty
      ? adaptiveDifficulty
      : (settings.difficulty as DifficultyLevel);
    
    const newProblems: AdditionProblem[] = [];
    for (let i = 0; i < settings.numProblems; i++) {
      newProblems.push(generateAdditionProblem(difficultyToUse));
    }
    
    // Resetear estado
    setProblemsList(newProblems);
    setCurrentProblemIndex(0);
    setUserAnswersHistory(Array(newProblems.length).fill(null));
    setConsecutiveCorrectAnswers(0);
    setRecentScores([]);
    setTimer(0);
    // No iniciar el ejercicio automáticamente
    
    // Recuperar videos de YouTube guardados
    const savedVideos = localStorage.getItem(`mathwaok_videos_${moduleId}`);
    if (savedVideos) {
      try {
        setYoutubeVideos(JSON.parse(savedVideos));
      } catch (e) {
        console.error("Error parsing saved videos:", e);
        setYoutubeVideos([]);
      }
    }
    
  }, [settings.numProblems, settings.difficulty, settings.enableAdaptiveDifficulty, adaptiveDifficulty, moduleId]);

  // Iniciar el temporizador general del ejercicio
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  }, []);

  // Iniciar el temporizador para el problema actual
  const startProblemTimer = useCallback(() => {
    if (problemTimerRef.current) {
      clearInterval(problemTimerRef.current);
    }
    
    // Reiniciar el valor del temporizador
    setProblemTimerValue(settings.timeValue);
    
    // Crear un nuevo temporizador que decrementa cada segundo
    problemTimerRef.current = setInterval(() => {
      setProblemTimerValue(prev => {
        // Si llegamos a cero, manejar tiempo agotado
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings.timeValue]);

  // Manejar cuando se agota el tiempo
  const handleTimeUp = useCallback(() => {
    // Detener el temporizador
    if (problemTimerRef.current) {
      clearInterval(problemTimerRef.current);
      problemTimerRef.current = null;
    }
    
    // Si estamos viendo un problema anterior, no hacer nada
    if (viewingPrevious) return;
    
    // Marcar el problema como incorrecto por tiempo agotado
    const currentAnswer = parseFloat(digitAnswers.join('').replace('_', '.'));
    const isCorrect = false; // Siempre es incorrecto cuando se agota el tiempo
    
    // Actualizar historial de respuestas
    setUserAnswersHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentProblemIndex] = {
        problemId: currentProblem!.id,
        problem: currentProblem!,
        userAnswer: isNaN(currentAnswer) ? null : currentAnswer,
        isCorrect,
        status: 'timeout'
      };
      return newHistory;
    });
    
    // Actualizar estadísticas para dificultad adaptativa
    updateAdaptiveDifficulty(isCorrect);
    
    // Esperar un momento antes de continuar para que el usuario vea que se agotó el tiempo
    waitingRef.current = true;
    if (singleProblemTimerRef.current) clearTimeout(singleProblemTimerRef.current);
    
    singleProblemTimerRef.current = setTimeout(() => {
      // Ir al siguiente problema o finalizar si es el último
      if (currentProblemIndex < problemsList.length - 1) {
        setCurrentProblemIndex(prev => prev + 1);
        
        // Reiniciar intentos
        setCurrentAttempts(0);
      } else {
        // Finalizar el ejercicio
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Agregar una pequeña pausa antes de finalizar
        setTimeout(() => {
          setExerciseStarted(false);
        }, 500);
      }
      
      waitingRef.current = false;
    }, 1500);
  }, [currentProblem, currentProblemIndex, digitAnswers, problemsList.length, viewingPrevious]);

  // Función para actualizar la dificultad adaptativa
  function updateAdaptiveDifficulty(isCorrect: boolean) {
    if (!settings.enableAdaptiveDifficulty) return;
    
    // Agregar el resultado al historial reciente
    setRecentScores(prev => {
      // Mantener solo los últimos 5 resultados
      const newScores = [...prev, isCorrect].slice(-5);
      
      // Si tenemos suficientes datos, evaluar si hay que cambiar de nivel
      if (newScores.length >= 5) {
        const correctCount = newScores.filter(score => score).length;
        const incorrectCount = newScores.length - correctCount;
        
        // Calcular nivel de dificultad actual y posible siguiente nivel
        let currentLevel = adaptiveDifficulty;
        let newLevel = currentLevel;
        
        if (correctCount >= 4) {
          // 80% o más de aciertos = subir dificultad
          if (currentLevel === 'beginner') newLevel = 'intermediate';
          else if (currentLevel === 'intermediate') newLevel = 'advanced';
          
          if (currentLevel !== newLevel) {
            // Almacenar el cambio de nivel para mostrar la animación
            setLevelChange({ previousLevel: currentLevel, newLevel });
            setShowLevelChangeAnimation(true);
            
            // Temporizador para ocultar la animación después de unos segundos
            if (levelChangeTimeoutRef.current) clearTimeout(levelChangeTimeoutRef.current);
            levelChangeTimeoutRef.current = setTimeout(() => {
              setShowLevelChangeAnimation(false);
              setLevelChange(null);
            }, 3000);
            
            // Emitir evento para el componente LevelUpHandler
            eventBus.emit('levelChanged', {
              previousLevel: currentLevel,
              newLevel: newLevel,
              consecutiveCorrectAnswers: consecutiveCorrectAnswers
            });
          }
        } else if (incorrectCount >= 4) {
          // 80% o más de errores = bajar dificultad
          if (currentLevel === 'advanced') newLevel = 'intermediate';
          else if (currentLevel === 'intermediate') newLevel = 'beginner';
          
          if (currentLevel !== newLevel) {
            // Almacenar el cambio de nivel para mostrar la animación
            setLevelChange({ previousLevel: currentLevel, newLevel });
            setShowLevelChangeAnimation(true);
            
            // Temporizador para ocultar la animación después de unos segundos
            if (levelChangeTimeoutRef.current) clearTimeout(levelChangeTimeoutRef.current);
            levelChangeTimeoutRef.current = setTimeout(() => {
              setShowLevelChangeAnimation(false);
              setLevelChange(null);
            }, 3000);
            
            // Emitir evento para el componente LevelUpHandler
            eventBus.emit('levelChanged', {
              previousLevel: currentLevel,
              newLevel: newLevel,
              consecutiveCorrectAnswers: 0 // Reset al bajar de nivel
            });
          }
        }
        
        // Actualizar nivel de dificultad
        setAdaptiveDifficulty(newLevel);
      }
      
      return newScores;
    });
    
    // Actualizar contador de respuestas correctas consecutivas
    if (isCorrect) {
      setConsecutiveCorrectAnswers(prev => prev + 1);
      
      // Verificar si alcanzamos un objetivo para subir de nivel
      const requiredCorrectAnswers = CORRECT_ANSWERS_FOR_LEVEL_UP[adaptiveDifficulty];
      if (requiredCorrectAnswers && consecutiveCorrectAnswers + 1 >= requiredCorrectAnswers) {
        let newLevel: DifficultyLevel = adaptiveDifficulty;
        
        if (adaptiveDifficulty === 'beginner') newLevel = 'intermediate';
        else if (adaptiveDifficulty === 'intermediate') newLevel = 'advanced';
        
        if (adaptiveDifficulty !== newLevel) {
          // Almacenar el cambio de nivel para mostrar la animación
          setLevelChange({ previousLevel: adaptiveDifficulty, newLevel });
          setShowLevelChangeAnimation(true);
          
          // Temporizador para ocultar la animación después de unos segundos
          if (levelChangeTimeoutRef.current) clearTimeout(levelChangeTimeoutRef.current);
          levelChangeTimeoutRef.current = setTimeout(() => {
            setShowLevelChangeAnimation(false);
            setLevelChange(null);
          }, 3000);
          
          // Emitir evento para el componente LevelUpHandler
          eventBus.emit('levelChanged', {
            previousLevel: adaptiveDifficulty,
            newLevel: newLevel,
            consecutiveCorrectAnswers: consecutiveCorrectAnswers + 1
          });
          
          // Actualizar nivel de dificultad
          setAdaptiveDifficulty(newLevel);
          
          // Reiniciar contador de respuestas correctas consecutivas
          setConsecutiveCorrectAnswers(0);
        }
      }
    } else {
      // Reiniciar contador de respuestas correctas consecutivas al fallar
      setConsecutiveCorrectAnswers(0);
    }
  }

  // Función para otorgar recompensas
  const handleRewardCheck = useCallback(() => {
    // Verificar si debemos otorgar una recompensa
    const shouldAwardReward = Math.random() < getRewardProbability(rewardsCollected.length);
    
    if (shouldAwardReward) {
      const rewardId = selectRandomReward(rewardsCollected);
      if (rewardId) {
        setCurrentReward(rewardId);
        setShowRewardAnimation(true);
        awardReward(rewardId);
      }
    }
  }, [rewardsCollected]);

  // Resetear estado relacionado con el problema actual
  const resetProblemState = useCallback(() => {
    setDigitAnswers(prev => Array(prev.length).fill(''));
    setCurrentAttempts(0);
    setFocusedDigitIndex(null);
    
    // Reiniciar el valor del temporizador por problema
    setProblemTimerValue(settings.timeValue);
    
    // Detener temporizador anterior si existe
    if (problemTimerRef.current) {
      clearInterval(problemTimerRef.current);
      problemTimerRef.current = null;
    }
  }, [settings.timeValue]);

  // Manejar el cambio de un dígito de la respuesta
  const handleDigitChange = useCallback((index: number, value: string) => {
    // Solo permitir dígitos o vacío
    if (!/^[0-9]?$/.test(value) && value !== '_') return;
    
    if (value === '_' && (currentProblem?.answerDecimalPosition ?? -1) !== index) {
      return; // Solo permitir decimal en la posición correcta
    }
    
    setDigitAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = value;
      return newAnswers;
    });
    
    // Si se ingresó un dígito y hay más cajas, mover el foco según la dirección de entrada
    if (value && value !== '_') {
      if (inputDirection === 'rtl' && index > 0) {
        // Mover a la izquierda
        setFocusedDigitIndex(index - 1);
      } else if (inputDirection === 'ltr' && index < digitAnswers.length - 1) {
        // Mover a la derecha
        setFocusedDigitIndex(index + 1);
      } else {
        // Si estamos en el extremo, quitar el foco
        setFocusedDigitIndex(null);
      }
    }
  }, [currentProblem, digitAnswers.length, inputDirection]);

  // Manejar clic en una caja de dígito
  const handleDigitBoxClick = useCallback((index: number) => {
    setFocusedDigitIndex(index);
    
    // Determinar la dirección de entrada basada en dónde hace clic el usuario
    if (index === 0) {
      setInputDirection('ltr');
    } else if (index === digitAnswers.length - 1) {
      setInputDirection('rtl');
    }
    // Si hace clic en el medio, mantener la dirección actual
  }, [digitAnswers.length]);

  // Manejar tecla presionada en una caja de dígito
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace') {
      if (digitAnswers[index] === '') {
        // Si la caja actual está vacía, mover el foco a la caja anterior o siguiente según la dirección
        if (inputDirection === 'rtl' && index < digitAnswers.length - 1) {
          setFocusedDigitIndex(index + 1);
          setDigitAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[index + 1] = '';
            return newAnswers;
          });
        } else if (inputDirection === 'ltr' && index > 0) {
          setFocusedDigitIndex(index - 1);
          setDigitAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[index - 1] = '';
            return newAnswers;
          });
        }
      } else {
        // Limpiar la caja actual
        setDigitAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[index] = '';
          return newAnswers;
        });
      }
    } else if (e.key === 'ArrowLeft') {
      // Mover a la izquierda si es posible
      if (index > 0) {
        setFocusedDigitIndex(index - 1);
        setInputDirection('rtl');
      }
    } else if (e.key === 'ArrowRight') {
      // Mover a la derecha si es posible
      if (index < digitAnswers.length - 1) {
        setFocusedDigitIndex(index + 1);
        setInputDirection('ltr');
      }
    } else if (e.key === '.') {
      // Manejar el punto decimal
      const decimalPosition = currentProblem?.answerDecimalPosition;
      if (decimalPosition !== undefined && decimalPosition >= 0) {
        setFocusedDigitIndex(decimalPosition);
        setDigitAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[decimalPosition] = '_';
          return newAnswers;
        });
      }
    } else if (e.key >= '0' && e.key <= '9') {
      // Ingresar dígito y mover el foco
      handleDigitChange(index, e.key);
    } else if (e.key === 'Enter') {
      // Verificar respuesta
      handleCheckAnswer();
    }
  }, [digitAnswers, inputDirection, handleDigitChange, currentProblem]);

  // Verificar la respuesta del usuario
  const handleCheckAnswer = useCallback(() => {
    if (!currentProblem || viewingPrevious || waitingRef.current) return;
    
    // Si el ejercicio no ha comenzado, iniciarlo ahora
    if (!exerciseStarted) {
      setExerciseStarted(true);
      startTimer();
    }
    
    // Detener el temporizador por problema si está activo
    if (problemTimerRef.current) {
      clearInterval(problemTimerRef.current);
      problemTimerRef.current = null;
    }
    
    // Convertir las respuestas a un número y comprobar si es correcto
    let userAnswerStr = '';
    let hasDecimal = false;
    let decimalPos = -1;
    
    for (let i = 0; i < digitAnswers.length; i++) {
      if (digitAnswers[i] === '_') {
        userAnswerStr += '.';
        hasDecimal = true;
        decimalPos = i;
      } else {
        userAnswerStr += digitAnswers[i] || '0'; // Usar 0 para espacios vacíos
      }
    }
    
    // Si no hay respuesta (todo vacío), no hacer nada
    if (userAnswerStr.replace(/0+/g, '') === '') return;
    
    // Convertir a número
    const userAnswer = parseFloat(userAnswerStr);
    
    // Comprobar si la respuesta es correcta
    const isCorrect = checkAnswer(currentProblem, userAnswer);
    
    // Actualizar historial de respuestas
    setUserAnswersHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentProblemIndex] = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer,
        isCorrect,
        attempts: currentAttempts + 1,
        status: isCorrect ? 'correct' : 'incorrect'
      };
      return newHistory;
    });
    
    // Si la respuesta es correcta o se alcanzó el número máximo de intentos, continuar al siguiente problema
    if (isCorrect || (settings.maxAttempts > 0 && currentAttempts + 1 >= settings.maxAttempts)) {
      // Actualizar estadísticas para dificultad adaptativa
      updateAdaptiveDifficulty(isCorrect);
      
      // Verificar si debemos otorgar una recompensa (solo con respuestas correctas)
      if (isCorrect) {
        handleRewardCheck();
      }
      
      // Pausa antes de continuar
      waitingRef.current = true;
      
      // Eliminar cualquier temporizador anterior
      if (singleProblemTimerRef.current) {
        clearTimeout(singleProblemTimerRef.current);
      }
      
      singleProblemTimerRef.current = setTimeout(() => {
        // Ir al siguiente problema o finalizar si es el último
        if (currentProblemIndex < problemsList.length - 1) {
          setCurrentProblemIndex(prev => prev + 1);
        } else {
          // Finalizar el ejercicio
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          setExerciseStarted(false);
        }
        
        waitingRef.current = false;
      }, 1000);
    } else {
      // Si la respuesta es incorrecta y aún hay intentos disponibles, incrementar contador de intentos
      setCurrentAttempts(prev => prev + 1);
      
      // Reiniciar cajas de respuesta para nuevo intento si falla
      setDigitAnswers(prev => Array(prev.length).fill(''));
      setFocusedDigitIndex(null);
      
      // Reiniciar el temporizador por problema si está activado
      if (settings.enableTimeLimit) {
        startProblemTimer();
      }
    }
  }, [
    currentProblem, 
    viewingPrevious, 
    exerciseStarted, 
    startTimer, 
    digitAnswers, 
    currentProblemIndex, 
    problemsList.length, 
    currentAttempts, 
    settings.maxAttempts, 
    settings.enableTimeLimit, 
    updateAdaptiveDifficulty, 
    handleRewardCheck, 
    startProblemTimer
  ]);

  // Ver un problema anterior del historial
  const handleViewPreviousProblem = useCallback((index: number) => {
    // Guardar estado actual si estamos viendo el problema en curso
    if (!viewingPrevious && previousProblemIndex === null) {
      setPreviousProblemIndex(currentProblemIndex);
    }
    
    // Establecer estado para visualizar el problema anterior
    setViewingPrevious(true);
    setCurrentProblemIndex(index);
    
    // Cargar la respuesta anterior del usuario
    const previousAnswer = userAnswersHistory[index];
    if (previousAnswer) {
      const answerStr = previousAnswer.userAnswer?.toString() || '';
      const hasDecimal = answerStr.includes('.');
      
      // Crear un array de dígitos para mostrar la respuesta anterior
      const digits: string[] = [];
      let decimalFound = false;
      
      for (let i = 0; i < answerStr.length; i++) {
        if (answerStr[i] === '.') {
          digits.push('_');
          decimalFound = true;
        } else {
          digits.push(answerStr[i]);
        }
      }
      
      // Agregar ceros a la izquierda si es necesario
      const problem = previousAnswer.problem as AdditionProblem;
      const requiredDigits = problem.answerMaxDigits || 0;
      const currentDigits = digits.length - (decimalFound ? 1 : 0);
      
      if (currentDigits < requiredDigits) {
        const zerosToAdd = requiredDigits - currentDigits;
        for (let i = 0; i < zerosToAdd; i++) {
          digits.unshift('0');
        }
      }
      
      setDigitAnswers(digits);
    }
  }, [viewingPrevious, previousProblemIndex, currentProblemIndex, userAnswersHistory]);

  // Volver al problema actual después de ver uno anterior
  const handleReturnToCurrentProblem = useCallback(() => {
    if (previousProblemIndex !== null) {
      setViewingPrevious(false);
      setCurrentProblemIndex(previousProblemIndex);
      setPreviousProblemIndex(null);
      
      // Reiniciar las cajas de respuesta
      resetProblemState();
      
      // Reiniciar el temporizador por problema si está activado y el ejercicio está en curso
      if (settings.enableTimeLimit && exerciseStarted) {
        startProblemTimer();
      }
    }
  }, [previousProblemIndex, resetProblemState, settings.enableTimeLimit, exerciseStarted, startProblemTimer]);

  // Función para ver el problema anterior en la lista
  const handlePreviousProblem = useCallback(() => {
    if (currentProblemIndex > 0) {
      handleViewPreviousProblem(currentProblemIndex - 1);
    }
  }, [currentProblemIndex, handleViewPreviousProblem]);

  // Función para ver el siguiente problema en la lista
  const handleNextProblem = useCallback(() => {
    if (currentProblemIndex < problemsList.length - 1) {
      handleViewPreviousProblem(currentProblemIndex + 1);
    } else if (viewingPrevious) {
      // Si estamos en el último problema y viendo el historial, volver al actual
      handleReturnToCurrentProblem();
    }
  }, [currentProblemIndex, problemsList.length, viewingPrevious, handleViewPreviousProblem, handleReturnToCurrentProblem]);

  // Reiniciar el ejercicio completo
  const handleRestartExercise = useCallback(() => {
    // Detener temporizadores
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (problemTimerRef.current) {
      clearInterval(problemTimerRef.current);
      problemTimerRef.current = null;
    }
    
    // Reiniciar estado
    setExerciseStarted(false);
    setTimer(0);
    initializeProblems();
    setViewingPrevious(false);
    setPreviousProblemIndex(null);
    setAdaptiveDifficulty(settings.difficulty as DifficultyLevel);
    setConsecutiveCorrectAnswers(0);
    setRecentScores([]);
    setCurrentAttempts(0);
    resetProblemState();
  }, [initializeProblems, resetProblemState, settings.difficulty]);

  // Modificar problemas para alinear verticalmente
  const getAlignmentInfo = useCallback(() => {
    if (!currentProblem) return null;
    return getVerticalAlignmentInfo(currentProblem);
  }, [currentProblem]);

  // Obtener estadísticas del ejercicio actual
  const getExerciseStats = useCallback(() => {
    const completedCount = userAnswersHistory.filter(answer => answer !== null).length;
    const correctCount = userAnswersHistory.filter(answer => answer && answer.isCorrect).length;
    const incorrectCount = userAnswersHistory.filter(answer => answer && !answer.isCorrect).length;
    
    return {
      totalProblems: problemsList.length,
      completedProblems: completedCount,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      timeElapsed: timer,
      difficultyLevel: settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty,
    };
  }, [userAnswersHistory, problemsList.length, timer, settings.enableAdaptiveDifficulty, adaptiveDifficulty, settings.difficulty]);

  // Renderizar cajas de entrada de dígitos para la respuesta
  const renderDigitBoxes = useCallback(() => {
    const alignmentInfo = getAlignmentInfo();
    const boxes = [];
    
    if (!currentProblem) return null;
    
    const answerMaxDigits = currentProblem.answerMaxDigits || 0;
    const decimalPosition = currentProblem.answerDecimalPosition ?? -1;
    const hasDecimal = decimalPosition >= 0;
    
    // Calcular el número de cajas necesarias (dígitos + posible decimal)
    const totalBoxes = hasDecimal ? answerMaxDigits + 1 : answerMaxDigits;
    
    for (let i = 0; i < totalBoxes; i++) {
      const isDecimalPosition = i === decimalPosition;
      const isDisabled = isDecimalPosition; // Desactivar la posición del decimal
      const isFocused = focusedDigitIndex === i && !viewingPrevious;
      
      let boxStyle = digitBoxBaseStyle;
      if (isFocused) {
        boxStyle += " " + digitBoxFocusStyle;
      } else {
        boxStyle += " " + digitBoxBlurStyle;
      }
      
      if (isDisabled || viewingPrevious) {
        boxStyle += " " + digitBoxDisabledStyle;
      }
      
      const handleBoxClick = () => {
        if (!isDisabled && !viewingPrevious) {
          handleDigitBoxClick(i);
        }
      };
      
      const prevAnswer = userAnswersHistory[currentProblemIndex];
      
      boxes.push(
        <div
          key={i}
          className={boxStyle}
          onClick={handleBoxClick}
          tabIndex={isDisabled || viewingPrevious ? -1 : 0}
          onKeyDown={(e) => !isDisabled && !viewingPrevious && handleKeyDown(e, i)}
          ref={(el) => {
            if (el) {
              boxRefsArrayRef.current[i] = el;
              digitBoxRefs.current = boxRefsArrayRef.current;
            }
          }}
          data-focused={isFocused}
          data-position={i}
          data-disabled={isDisabled}
          data-viewing-previous={viewingPrevious}
        >
          {digitAnswers[i] === "_" ? "." : digitAnswers[i]}
        </div>
      );
    }
    
    // Mostrar estado de la respuesta (correcto/incorrecto) para problemas visualizados desde el historial
    if (viewingPrevious && prevAnswer) {
      const statusClassName = prevAnswer.status === 'correct' 
        ? "ml-4 text-green-500 flex items-center"
        : "ml-4 text-red-500 flex items-center";
      
      const StatusIcon = prevAnswer.status === 'correct' 
        ? <Check className="w-5 h-5 mr-1" />
        : <span className="w-5 h-5 mr-1 flex items-center justify-center">✗</span>;
      
      boxes.push(
        <div key="status" className={statusClassName}>
          {StatusIcon}
          {prevAnswer.status === 'correct' 
            ? currentTranslations.correct 
            : currentTranslations.incorrect}
        </div>
      );
    }
    
    return (
      <div className="flex justify-center items-center mt-6 space-x-1 font-mono">
        {boxes}
      </div>
    );
  }, [
    currentProblem, 
    digitAnswers, 
    focusedDigitIndex, 
    viewingPrevious, 
    getAlignmentInfo, 
    handleDigitBoxClick, 
    handleKeyDown, 
    userAnswersHistory, 
    currentProblemIndex,
    currentTranslations.correct,
    currentTranslations.incorrect
  ]);

  // Renderizar la presentación vertical de la suma
  const renderVerticalAddition = useCallback(() => {
    if (!currentProblem) return null;
    
    const alignmentInfo = getAlignmentInfo();
    
    if (!alignmentInfo) return null;
    
    const { firstNumberFormatted, secondNumberFormatted, maxLength } = alignmentInfo;
    
    return (
      <div className="flex flex-col items-end mt-6 font-mono">
        <div className={verticalOperandStyle}>{firstNumberFormatted}</div>
        <div className="flex items-center justify-end w-full">
          <span className={plusSignVerticalStyle}>+</span>
          <div className={verticalOperandStyle}>{secondNumberFormatted}</div>
        </div>
        <div className="w-full" style={{ width: `${maxLength + 2}ch` }}>
          <div className={sumLineStyle}></div>
        </div>
      </div>
    );
  }, [currentProblem, getAlignmentInfo]);

  // Renderizar el contador de tiempo para cada problema
  const renderProblemTimer = useCallback(() => {
    if (!settings.enableTimeLimit || !exerciseStarted || viewingPrevious) return null;
    
    // Calcular el porcentaje de tiempo restante
    const percentRemaining = (problemTimerValue / settings.timeValue) * 100;
    
    // Determinar el color basado en el tiempo restante
    let progressColor = "bg-green-500";
    if (percentRemaining < 60) progressColor = "bg-yellow-500";
    if (percentRemaining < 30) progressColor = "bg-red-500";
    
    return (
      <div className="w-full max-w-md mx-auto mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{currentTranslations.timeRemaining}</span>
          <span>{formatTime(problemTimerValue)}</span>
        </div>
        <ProgressBarUI
          value={percentRemaining}
          className="h-2"
          indicatorClassName={progressColor}
        />
      </div>
    );
  }, [settings.enableTimeLimit, settings.timeValue, exerciseStarted, viewingPrevious, problemTimerValue, currentTranslations.timeRemaining]);

  // Renderizar el progreso general del ejercicio
  const renderProgress = useCallback(() => {
    const completedProblems = userAnswersHistory.filter(answer => answer !== null).length;
    const totalProblems = problemsList.length;
    const percentComplete = (completedProblems / totalProblems) * 100;
    
    return (
      <div className="w-full max-w-xl mx-auto mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>
            {viewingPrevious ? currentTranslations.problemReview : currentTranslations.progress}
          </span>
          <span>{`${completedProblems} / ${totalProblems}`}</span>
        </div>
        <ProgressBarUI value={percentComplete} className="h-2" />
      </div>
    );
  }, [userAnswersHistory, problemsList.length, viewingPrevious, currentTranslations.progress, currentTranslations.problemReview]);

  // Renderizar botones para la navegación del historial
  const renderHistoryNavigation = useCallback(() => {
    if (!viewingPrevious) return null;
    
    return (
      <div className="flex justify-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousProblem}
          disabled={currentProblemIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> {currentTranslations.previous}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturnToCurrentProblem}
        >
          {currentTranslations.returnToCurrent}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextProblem}
          disabled={currentProblemIndex === problemsList.length - 1}
        >
          {currentTranslations.next} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }, [
    viewingPrevious, 
    handlePreviousProblem, 
    handleReturnToCurrentProblem, 
    handleNextProblem, 
    currentProblemIndex, 
    problemsList.length,
    currentTranslations.previous,
    currentTranslations.returnToCurrent,
    currentTranslations.next
  ]);

  // Renderizar botones de acción principal
  const renderActionButtons = useCallback(() => {
    if (viewingPrevious) {
      return null; // No mostrar botones de acción al revisar problemas
    }
    
    return (
      <div className="flex justify-center space-x-2 mt-6">
        {!exerciseStarted ? (
          <Button
            onClick={() => {
              setExerciseStarted(true);
              startTimer();
              
              // Iniciar temporizador por problema si está activado
              if (settings.enableTimeLimit) {
                startProblemTimer();
              }
            }}
            className="px-8"
          >
            {currentTranslations.start}
          </Button>
        ) : (
          <Button
            onClick={handleCheckAnswer}
            className="px-8"
            disabled={waitingRef.current}
          >
            <Check className="mr-2 h-4 w-4" /> {currentTranslations.check}
          </Button>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleRestartExercise}
                className="px-2 sm:px-4"
              >
                <RotateCcw className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{currentTranslations.restart}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{currentTranslations.restartTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={onOpenSettings}
                className="px-2 sm:px-4"
              >
                <Cog className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{currentTranslations.settings}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{currentTranslations.settingsTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setShowHistoryDialog(true)}
                className="px-2 sm:px-4"
                disabled={exerciseHistory.filter(entry => entry.moduleId === moduleId).length === 0}
              >
                <History className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{currentTranslations.history}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{currentTranslations.historyTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setYoutubeDialogOpen(true)}
                className="px-2 sm:px-4"
              >
                <Youtube className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{currentTranslations.videos}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{currentTranslations.videosTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }, [
    viewingPrevious, 
    exerciseStarted, 
    startTimer, 
    settings.enableTimeLimit, 
    startProblemTimer, 
    handleCheckAnswer, 
    handleRestartExercise, 
    onOpenSettings,
    exerciseHistory,
    moduleId,
    waitingRef.current,
    currentTranslations
  ]);

  // Renderizar información extra como tiempo, intentos, nivel de dificultad
  const renderExtraInfo = useCallback(() => {
    return (
      <div className="flex justify-center space-x-4 mt-4 text-xs text-gray-500">
        <div>
          {currentTranslations.totalTime}: {formatTime(timer)}
        </div>
        
        {settings.maxAttempts > 0 && exerciseStarted && !viewingPrevious && (
          <div>
            {currentTranslations.attemptsRemaining}: {settings.maxAttempts - currentAttempts}
          </div>
        )}
        
        {settings.enableAdaptiveDifficulty && (
          <div className="flex items-center">
            {currentTranslations.level}: 
            <span className="ml-1 font-medium">
              {adaptiveDifficulty === 'beginner' && currentTranslations.difficultyLevels.beginner}
              {adaptiveDifficulty === 'intermediate' && currentTranslations.difficultyLevels.intermediate}
              {adaptiveDifficulty === 'advanced' && currentTranslations.difficultyLevels.advanced}
            </span>
            
            {consecutiveCorrectAnswers > 0 && (
              <span className="ml-2 flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                {consecutiveCorrectAnswers}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }, [
    timer, 
    settings.maxAttempts, 
    settings.enableAdaptiveDifficulty, 
    exerciseStarted, 
    viewingPrevious, 
    currentAttempts, 
    adaptiveDifficulty, 
    consecutiveCorrectAnswers,
    currentTranslations
  ]);

  // Renderizar la información del resultado para cuando termine el ejercicio
  const renderResults = useCallback(() => {
    if (exerciseStarted || viewingPrevious) return null;
    
    const stats = getExerciseStats();
    const allCompleted = stats.completedProblems === stats.totalProblems && stats.completedProblems > 0;
    
    // Si no se ha completado ningún problema, no mostrar resultados
    if (stats.completedProblems === 0) return null;
    
    return (
      <div className="mt-8 px-4 py-6 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-lg mx-auto">
        <h3 className="text-xl font-bold text-center mb-4">{currentTranslations.results}</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>{currentTranslations.totalProblems}:</span>
            <span className="font-medium">{stats.totalProblems}</span>
          </div>
          
          <div className="flex justify-between">
            <span>{currentTranslations.completedProblems}:</span>
            <span className="font-medium">{stats.completedProblems}</span>
          </div>
          
          <div className="flex justify-between">
            <span>{currentTranslations.correctAnswers}:</span>
            <span className="font-medium text-green-600">{stats.correctAnswers}</span>
          </div>
          
          <div className="flex justify-between">
            <span>{currentTranslations.incorrectAnswers}:</span>
            <span className="font-medium text-red-600">{stats.incorrectAnswers}</span>
          </div>
          
          <div className="flex justify-between">
            <span>{currentTranslations.accuracy}:</span>
            <span className="font-medium">
              {stats.completedProblems > 0 ? 
                `${Math.round((stats.correctAnswers / stats.completedProblems) * 100)}%` : 
                '0%'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>{currentTranslations.timeElapsed}:</span>
            <span className="font-medium">{formatTime(stats.timeElapsed)}</span>
          </div>
          
          {settings.enableAdaptiveDifficulty && (
            <div className="flex justify-between">
              <span>{currentTranslations.finalLevel}:</span>
              <span className="font-medium">
                {adaptiveDifficulty === 'beginner' && currentTranslations.difficultyLevels.beginner}
                {adaptiveDifficulty === 'intermediate' && currentTranslations.difficultyLevels.intermediate}
                {adaptiveDifficulty === 'advanced' && currentTranslations.difficultyLevels.advanced}
              </span>
            </div>
          )}
        </div>
        
        {allCompleted && stats.correctAnswers === stats.totalProblems && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800 rounded-md text-center">
            <p className="text-green-800 dark:text-green-300 font-medium flex items-center justify-center">
              <Trophy className="w-5 h-5 mr-2" />
              {currentTranslations.perfectScore}
            </p>
          </div>
        )}
      </div>
    );
  }, [exerciseStarted, viewingPrevious, getExerciseStats, adaptiveDifficulty, settings.enableAdaptiveDifficulty, currentTranslations]);

  // Renderizar el botón de "Mostrar Respuesta" si está habilitado
  const renderShowAnswerButton = useCallback(() => {
    if (!settings.showAnswerWithExplanation || !exerciseStarted || !currentProblem || viewingPrevious || waitingRef.current) return null;
    
    return (
      <div className="flex justify-center mt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    // Detener el temporizador por problema
                    if (problemTimerRef.current) {
                        clearInterval(problemTimerRef.current);
                        problemTimerRef.current = null;
                    }
                    
                    // Calcular respuesta correcta para mostrarla
                    const correctAnswer = currentProblem.firstNumber + currentProblem.secondNumber;
                    
                    // Mostrar respuesta en las cajas de dígitos
                    const answerStr = correctAnswer.toString();
                    const newDigitAnswers = Array(digitAnswers.length).fill('');
                    
                    // Colocar dígitos de la respuesta correcta en las cajas
                    let decimalPos = answerStr.indexOf('.');
                    let answerWithoutDecimal = decimalPos >= 0 ? 
                        answerStr.substring(0, decimalPos) + answerStr.substring(decimalPos + 1) : 
                        answerStr;
                    
                    // Si hay posición decimal en el problema
                    if (currentProblem.answerDecimalPosition !== undefined && currentProblem.answerDecimalPosition >= 0) {
                        newDigitAnswers[currentProblem.answerDecimalPosition] = '_';
                    }
                    
                    let answerIdx = answerWithoutDecimal.length - 1;
                    for (let i = digitAnswers.length - 1; i >= 0; i--) {
                        // Saltar la posición del decimal
                        if (newDigitAnswers[i] === '_') continue;
                        
                        if (answerIdx >= 0) {
                            newDigitAnswers[i] = answerWithoutDecimal[answerIdx];
                            answerIdx--;
                        }
                    }
                    
                    setDigitAnswers(newDigitAnswers);
                    
                    // Marcar como incorrecto en el historial al revelar la respuesta
                    const problemIdxForHistory = currentProblemIndex;
                    if (!userAnswersHistory[problemIdxForHistory] || 
                        userAnswersHistory[problemIdxForHistory]?.status !== 'correct') {
                        setUserAnswersHistory(prev => {
                            const newHistory = [...prev];
                            newHistory[problemIdxForHistory] = {
                                problemId: currentProblem.id,
                                problem: currentProblem,
                                userAnswer: NaN,
                                isCorrect: false,
                                status: 'revealed'
                            };
                            return newHistory;
                        });

                        // Añadir problema de compensación cuando se revela la respuesta
                        if (settings.enableCompensation) {
                            console.log("[ADDITION] Agregando problema de compensación por respuesta revelada");
                            const difficultyForCompensation = settings.enableAdaptiveDifficulty
                                ? adaptiveDifficulty
                                : (settings.difficulty as DifficultyLevel);

                            const compensationProblem = generateAdditionProblem(difficultyForCompensation);
                            setProblemsList(prev => [...prev, compensationProblem]);
                            // Agregamos null al historial para que coincida con el nuevo problema añadido
                            setUserAnswersHistory(prev => [...prev, null]);
                            console.log("[ADDITION] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
                        }
                    }
                    if (settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts) {
                        setCurrentAttempts(prev => prev + 1); // Contar como un intento si se revela
                    }
                }}
                className="text-xs sm:text-sm"
              >
                <Info className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {currentTranslations.showAnswer}
              </Button>
            </TooltipTrigger>
            {(!settings.showAnswerWithExplanation && !viewingPrevious && !waitingRef.current) ? (
                <TooltipContent><p>{t('tooltips.activateShowAnswerInSettings')}</p></TooltipContent>
            ) : viewingPrevious ? (
                <TooltipContent><p>{t('tooltips.showAnswerDisabledInHistory')}</p></TooltipContent>
            ) : (
                <TooltipContent><p>{t('tooltips.showAnswer')}</p></TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }, [
    settings.showAnswerWithExplanation,
    exerciseStarted,
    currentProblem,
    viewingPrevious,
    waitingRef.current,
    digitAnswers.length,
    currentProblemIndex,
    userAnswersHistory,
    settings.enableCompensation,
    settings.enableAdaptiveDifficulty,
    adaptiveDifficulty,
    settings.difficulty,
    problemsList.length,
    settings.maxAttempts,
    currentAttempts,
    currentTranslations.showAnswer,
    t
  ]);

  // Manejar cambios en los videos de YouTube
  const handleSaveVideos = useCallback((newVideos: string[]) => {
    setYoutubeVideos(newVideos);
    
    // Guardar en localStorage para persistencia
    localStorage.setItem(`mathwaok_videos_${moduleId}`, JSON.stringify(newVideos));
  }, [moduleId]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Barra de progreso */}
      {renderProgress()}
      
      {/* Temporizador por problema si está activado */}
      {renderProblemTimer()}
      
      {/* Información del progreso y dificultad */}
      {renderExtraInfo()}
      
      {/* Representación vertical del problema */}
      <div className="flex justify-center">
        {renderVerticalAddition()}
      </div>
      
      {/* Cajas de entrada para la respuesta */}
      {renderDigitBoxes()}
      
      {/* Botón para mostrar respuesta si está habilitado */}
      {renderShowAnswerButton()}
      
      {/* Botones de navegación cuando se ve el historial */}
      {renderHistoryNavigation()}
      
      {/* Botones de acción principal */}
      {renderActionButtons()}
      
      {/* Resultados cuando se completa el ejercicio */}
      {renderResults()}
      
      {/* Animación de recompensa */}
      <RewardAnimation 
        show={showRewardAnimation} 
        rewardId={currentReward}
        onAnimationComplete={() => setShowRewardAnimation(false)}
      />
      
      {/* Componente de cambio de nivel */}
      <LevelUpHandler />
      
      {/* Diálogo de historial de ejercicios */}
      <ExerciseHistoryDialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        moduleId={moduleId}
        onViewProblem={handleViewPreviousProblem}
      />
      
      {/* Diálogo de videos explicativos */}
      <YoutubeVideoDialog
        isOpen={youtubeDialogOpen}
        onClose={() => setYoutubeDialogOpen(false)}
        videos={youtubeVideos}
        onSave={handleSaveVideos}
      />
    </div>
  );
}