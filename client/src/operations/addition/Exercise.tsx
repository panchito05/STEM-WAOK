// Exercise.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateAdditionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, AdditionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Download } from "lucide-react";
// Importaremos jsPDF de forma dinámica cuando sea necesario
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations";
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus'; // Eliminado 'on', 'off' ya que no se usan directamente aquí
import LevelUpHandler from "@/components/LevelUpHandler";
import { useRewardsStore, awardReward, getRewardProbability, selectRandomReward } from '@/lib/rewards-system';
import RewardAnimation from '@/components/rewards/RewardAnimation';

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
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue" | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const waitingRef = useRef(waitingForContinue); // Ref para el estado de waitingForContinue
  const continueButtonRef = useRef<HTMLButtonElement | null>(null); // Ref para el botón Continuar
  
  const [blockAutoAdvance, setBlockAutoAdvance] = useState(false);
  const [autoContinue, setAutoContinue] = useState(() => {
    try {
      const stored = localStorage.getItem('addition_autoContinue');
      return stored === 'true';
    } catch (e) { return false; }
  });

  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel>(() => {
    try {
      const storedSettings = localStorage.getItem('moduleSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (parsedSettings.addition && parsedSettings.addition.difficulty) return parsedSettings.addition.difficulty;
      }
    } catch (e) { console.error('Error loading adaptive difficulty from localStorage:', e); }
    return settings.difficulty as DifficultyLevel;
  });
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveCorrectAnswers') || '0', 10));
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveIncorrectAnswers') || '0', 10));
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showLevelUpReward, setShowLevelUpReward] = useState(false);
  
  // Estado para rastrear cuándo se mostró la última recompensa (para el sistema progresivo)
  const [lastRewardShownIndex, setLastRewardShownIndex] = useState<number>(-1);

  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState<number>(0);

  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { saveExerciseResult } = useProgress();
  const { updateModuleSettings } = useSettings();
  const { t } = useTranslations();
  
  // Traducciones para elementos específicos de la interfaz
  const translations = {
    english: {
      addition: "Addition",
      attempts: "Attempts",
      level: "Level",
      settings: "Settings",
      previous: "Previous",
      startExercise: "Start Exercise",
      showAnswer: "Show Answer",
      problem: "Problem",
      of: "of"
    },
    spanish: {
      addition: "Suma",
      attempts: "Intentos",
      level: "Nivel",
      settings: "Ajustes",
      previous: "Anterior",
      startExercise: "Iniciar Ejercicio",
      showAnswer: "Mostrar Respuesta",
      problem: "Problema",
      of: "de"
    }
  };
  
  // Seleccionar el idioma adecuado
  const isEnglish = settings.language !== "spanish";
  const currentTranslations = isEnglish ? translations.english : translations.spanish;
  const { setShowRewardAnimation } = useRewardsStore();

  useEffect(() => {
    waitingRef.current = waitingForContinue;
    // Ya no enfocamos el botón aquí, se hace directamente en cada punto donde se llama a setWaitingForContinue(true)
  }, [waitingForContinue]);

  useEffect(() => {
    generateNewProblemSet();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.problemCount, settings.difficulty, settings.enableAdaptiveDifficulty, adaptiveDifficulty]);

  useEffect(() => {
    if (settings.enableAdaptiveDifficulty && settings.difficulty !== adaptiveDifficulty) {
      setAdaptiveDifficulty(settings.difficulty as DifficultyLevel);
      // Regenerar problemas inmediatamente cuando cambia el nivel
      generateNewProblemSet();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.difficulty, settings.enableAdaptiveDifficulty, adaptiveDifficulty]);

  useEffect(() => {
    if (currentProblem && !viewingPrevious && !exerciseCompleted) {
      const numBoxes = currentProblem.answerMaxDigits || 0;
      const activeProblemHistoryEntry = userAnswersHistory[actualActiveProblemIndexBeforeViewingPrevious];
      if (currentProblem.id !== problemsList[actualActiveProblemIndexBeforeViewingPrevious]?.id ||
          !activeProblemHistoryEntry ||
          currentProblemIndex !== actualActiveProblemIndexBeforeViewingPrevious) {
        setDigitAnswers(Array(numBoxes).fill(""));
      }
      // Inicializar un nuevo array para las referencias
      boxRefsArrayRef.current = Array(numBoxes).fill(null);
      if (currentProblem.layout === 'horizontal') {
        setInputDirection('ltr');
        setFocusedDigitIndex(0);
      } else {
        setInputDirection('rtl');
        setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : 0);
      }

      if (!waitingRef.current) { // Solo resetear timer si no estamos esperando
          setProblemTimerValue(settings.timeValue); 
          // No resetear currentAttempts aquí, se maneja por problema o por la lógica de intentos.
      }
      // setCurrentAttempts(0); // Se resetea al avanzar al siguiente problema activo

      if (!waitingRef.current && currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) {
        setFeedbackMessage(null);
      }
    } else if (viewingPrevious && currentProblem) {
      setFocusedDigitIndex(null);
    }
  }, [currentProblem, viewingPrevious, exerciseCompleted, actualActiveProblemIndexBeforeViewingPrevious, problemsList, currentProblemIndex, userAnswersHistory, settings.timeValue]);


  useEffect(() => {
    if (focusedDigitIndex !== null && !viewingPrevious && digitBoxRefs.current[focusedDigitIndex]) {
      setTimeout(() => digitBoxRefs.current[focusedDigitIndex]?.focus(), 0);
    }
  }, [focusedDigitIndex, viewingPrevious]);

  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted) {
      generalTimerRef.current = window.setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => { if (generalTimerRef.current) clearInterval(generalTimerRef.current); };
  }, [exerciseStarted, exerciseCompleted]);

  const checkCurrentAnswer = useCallback(() => {
    if (!currentProblem || waitingRef.current || exerciseCompleted || viewingPrevious) return false;

    if (!exerciseStarted) {
      startExercise();
      return false; // No cuenta como intento, no está "resuelto"
    }

    let userAnswerString = "";
    const decPosInAnswer = currentProblem.answerDecimalPosition;
    const totalDigitBoxes = currentProblem.answerMaxDigits;
    const integerBoxesCount = totalDigitBoxes - (decPosInAnswer || 0);

    if (decPosInAnswer !== undefined && decPosInAnswer > 0) {
        const integerPart = digitAnswers.slice(0, integerBoxesCount).join('');
        const decimalPart = digitAnswers.slice(integerBoxesCount).join('');
        userAnswerString = `${integerPart || '0'}.${decimalPart.padEnd(decPosInAnswer, '0')}`;
    } else {
        userAnswerString = digitAnswers.join('') || '0';
    }

    const userNumericAnswer = parseFloat(userAnswerString);

    if (isNaN(userNumericAnswer) && digitAnswers.some(d => d && d.trim() !== "")) {
        setFeedbackMessage(t('exercises.invalidAnswer')); 
        setFeedbackColor("red"); 
        return false; // Inválido, no resuelto
    }

    const newAttempts = currentAttempts + 1; 
    setCurrentAttempts(newAttempts); // Incrementar intento por cada evaluación
    const isCorrect = checkAnswer(currentProblem, userNumericAnswer);

    const problemIndexForHistory = currentProblemIndex; 
    const newHistoryEntry: UserAnswerType = { 
        problemId: currentProblem.id, 
        problem: currentProblem,
        userAnswer: userNumericAnswer, 
        isCorrect,
        status: isCorrect ? 'correct' : 'incorrect' // Añadir status
    };
    setUserAnswersHistory(prev => {
        const newHistory = [...prev];
        newHistory[problemIndexForHistory] = newHistoryEntry;
        return newHistory;
    });
    setActualActiveProblemIndexBeforeViewingPrevious(problemIndexForHistory);

    if (isCorrect) {
      setFeedbackMessage(t('exercises.correct')); 
      setFeedbackColor("green");
      const newConsecutive = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newConsecutive); 
      setConsecutiveIncorrectAnswers(0);

      if (newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP && settings.enableAdaptiveDifficulty) {
          const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
          if (currentLevelIdx < difficultiesOrder.length - 1) {
              const newLevel = difficultiesOrder[currentLevelIdx + 1];
              setAdaptiveDifficulty(newLevel);
              updateModuleSettings("addition", { difficulty: newLevel, enableAdaptiveDifficulty: true });
              setConsecutiveCorrectAnswers(0); // Reset racha para nuevo nivel
              setShowLevelUpReward(true);
              setBlockAutoAdvance(true); // Bloquear avance hasta que se cierre el modal de level up
              eventBus.emit('levelUp', { previousLevel: adaptiveDifficulty, newLevel });
          }
      }

      if (settings.enableRewards) {
          const rewardContext = { 
              streak: newConsecutive, 
              difficulty: adaptiveDifficulty, 
              problemIndex: currentProblemIndex, 
              totalProblems: problemsList.length,
              previousRewardShown: lastRewardShownIndex
          };
          
          // Calcular probabilidad con el sistema progresivo
          const probability = getRewardProbability(rewardContext as any);
          console.log(`🎯 Probabilidad calculada: ${(probability * 100).toFixed(1)}%`);
          
          if (Math.random() < probability) {
              // Seleccionar una recompensa aleatoria según la dificultad
              const rewardId = selectRandomReward('common', 'addition');
              
              if (rewardId) {
                  console.log(`🏆 Otorgando recompensa: ${rewardId}`);
                  awardReward(rewardId, { theme: 'addition', module: 'addition' });
                  setShowRewardAnimation(true);
                  setLastRewardShownIndex(currentProblemIndex);
              } else {
                  // Si no hay recompensa específica, usar una genérica de racha
                  const streakRewardId = newConsecutive >= 8 ? 'streak-20' : 
                                         newConsecutive >= 5 ? 'streak-10' : 'streak-5';
                  
                  console.log(`🔥 Otorgando recompensa de racha: ${streakRewardId}`);
                  awardReward(streakRewardId, { theme: 'general', module: 'addition' });
                  setShowRewardAnimation(true);
                  setLastRewardShownIndex(currentProblemIndex);
              }
          }
      }

      setWaitingForContinue(true); // Pone waitingRef.current = true via useEffect
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
      
      // Programar un enfoque inmediato en el botón Continuar para evitar problemas con el flujo de renderizado
      setTimeout(() => {
        try {
          // Intentar enfocar el botón Continuar directamente
          if (continueButtonRef.current) {
            continueButtonRef.current.focus();
            console.log("Enfocando botón Continuar después de respuesta correcta");
          }
        } catch (e) {
          console.error("Error al enfocar botón Continuar:", e);
        }
      }, 50);

      if (autoContinue && !blockAutoAdvance) {
        if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = setTimeout(() => {
          if (!blockAutoAdvance && waitingRef.current) { // Re-check waitingRef.current
            handleContinue(); // Asume que handleContinue está memoizada
            autoContinueTimerRef.current = null;
          }
        }, 3000);
      }
      return true; // Problema resuelto (correctamente)
    } else { // Incorrecta
      setFeedbackMessage(t('exercises.incorrect')); 
      setFeedbackColor("red");
      const newConsecutiveInc = consecutiveIncorrectAnswers + 1;
      setConsecutiveIncorrectAnswers(newConsecutiveInc); 
      setConsecutiveCorrectAnswers(0);

      if (settings.enableAdaptiveDifficulty && newConsecutiveInc >= 5) {
          const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
          if (currentLevelIdx > 0) {
              const newLevel = difficultiesOrder[currentLevelIdx - 1];
              setAdaptiveDifficulty(newLevel);
              updateModuleSettings("addition", { difficulty: newLevel });
              setConsecutiveIncorrectAnswers(0);
              setFeedbackMessage(`${t('adaptiveDifficulty.levelDecreased')} ${t(newLevel)}. ${t('exercises.incorrect')}`);
          }
      }

      if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
        // Mostrar mensaje en el formato "Answered (Incorrect!). The correct answer is = X"
        setFeedbackMessage(`Answered (Incorrect!). The correct answer is = ${currentProblem.correctAnswer}`);
        // Actualizar historial para reflejar que la respuesta fue revelada
        const updatedHistoryEntry: UserAnswerType = { ...newHistoryEntry, status: 'revealed' };
        setUserAnswersHistory(prev => {
            const newHistory = [...prev];
            newHistory[problemIndexForHistory] = updatedHistoryEntry;
            return newHistory;
        });
        
        // Añadir problema de compensación cuando se agota el número de intentos (respuesta incorrecta)
        if (settings.enableCompensation) {
          console.log("[ADDITION] Agregando problema de compensación por respuesta incorrecta");
          const difficultyForCompensation = settings.enableAdaptiveDifficulty 
            ? adaptiveDifficulty 
            : (settings.difficulty as DifficultyLevel);
          
          const compensationProblem = generateAdditionProblem(difficultyForCompensation);
          setProblemsList(prev => [...prev, compensationProblem]);
          // Agregamos null al historial para que coincida con el nuevo problema añadido
          setUserAnswersHistory(prev => [...prev, null]);
          console.log("[ADDITION] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
        }
        
        setWaitingForContinue(true); // Pone waitingRef.current = true via useEffect
        if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
        
        // También enfocar el botón Continuar cuando se muestra la respuesta correcta después de intentos agotados
        setTimeout(() => {
          try {
            if (continueButtonRef.current) {
              continueButtonRef.current.focus();
              console.log("Enfocando botón Continuar después de respuesta incorrecta (intentos agotados)");
            }
          } catch (e) {
            console.error("Error al enfocar botón Continuar:", e);
          }
        }, 50);
        return true; // Problema resuelto (sin más intentos)
      }
      // Respuesta incorrecta, pero aún quedan intentos
      // No poner waitingForContinue(true), el timer sigue o handleTimeOrAttemptsUp se encarga.
      return false; 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentProblem, exerciseCompleted, viewingPrevious, exerciseStarted, digitAnswers, t, 
    currentAttempts, settings, currentProblemIndex, consecutiveCorrectAnswers, adaptiveDifficulty, 
    consecutiveIncorrectAnswers, problemsList.length, autoContinue, blockAutoAdvance, // handleContinue no aquí porque es dependiente
    // setUserAnswersHistory, setActualActiveProblemIndexBeforeViewingPrevious, setFeedbackMessage, 
    // setFeedbackColor, setConsecutiveCorrectAnswers, setConsecutiveIncorrectAnswers, 
    // setAdaptiveDifficulty, updateModuleSettings, setShowLevelUpReward, setBlockAutoAdvance, 
    // eventBus, getRewardProbability, awardReward, setShowRewardAnimation, setWaitingForContinue, setCurrentAttempts
    // Las funciones setter y las de contexto suelen ser estables.
  ]);

  const handleTimeOrAttemptsUp = useCallback(() => {
    if (waitingRef.current || !currentProblem) return; // Si ya se está esperando "Continuar", no hacer nada.

    const userAnswerIsPresent = digitAnswers.some(d => d && d.trim() !== "");

    if (userAnswerIsPresent) {
      // Hay una respuesta, validarla. checkCurrentAnswer se encarga de los intentos, feedback, y waitingForContinue.
      // checkCurrentAnswer también limpia el timer si es correcta o se agotan intentos.
      const problemResolvedByCheck = checkCurrentAnswer();

      if (!problemResolvedByCheck && !waitingRef.current) { 
        // checkCurrentAnswer la marcó incorrecta Y AÚN QUEDAN INTENTOS (waitingRef es false)
        // Y el tiempo se agotó para este intento.
        // currentAttempts ya fue incrementado por checkCurrentAnswer.

        // Este caso es sutil: checkCurrentAnswer ya mostró "Incorrecto".
        // Solo necesitamos añadir que el tiempo se agotó para ESE intento fallido.
        // Y verificar si ese intento fallido era el último.
        setFeedbackMessage(prev => `${prev}. ${t('exercises.timeUpForThisAttempt')}`);

        if (settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts) {
          // Esto es redundante si checkCurrentAnswer ya lo manejó, pero es una salvaguarda.
          setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
          
          // Añadir problema de compensación cuando se agota el tiempo con respuesta incorrecta
          if (settings.enableCompensation) {
            console.log("[ADDITION] Agregando problema de compensación por tiempo agotado (con respuesta incorrecta)");
            const difficultyForCompensation = settings.enableAdaptiveDifficulty 
              ? adaptiveDifficulty 
              : (settings.difficulty as DifficultyLevel);
            
            const compensationProblem = generateAdditionProblem(difficultyForCompensation);
            setProblemsList(prev => [...prev, compensationProblem]);
            // Agregamos null al historial para que coincida con el nuevo problema añadido
            setUserAnswersHistory(prev => [...prev, null]);
            console.log("[ADDITION] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
          }
          
          setWaitingForContinue(true);
          // Historial ya actualizado por checkCurrentAnswer
        } else {
          // Quedan más intentos, preparar para el siguiente.
          setProblemTimerValue(settings.timeValue);
          // El useEffect del timer se reiniciará porque waitingRef.current es false.
        }
      }
      // Si problemResolvedByCheck es true, checkCurrentAnswer ya puso waitingForContinue(true) y manejó todo.
    } else {
      // No hay respuesta escrita, tiempo agotado.
      const newAttempts = currentAttempts + 1;
      setCurrentAttempts(newAttempts);

      const problemIndexForHistory = currentProblemIndex;
      const newHistoryEntry: UserAnswerType = { 
          problemId: currentProblem.id, 
          problem: currentProblem,
          userAnswer: NaN, 
          isCorrect: false,
          status: 'timeout' // o 'unanswered'
      };
      setUserAnswersHistory(prev => {
          const newHistory = [...prev];
          newHistory[problemIndexForHistory] = newHistoryEntry;
          return newHistory;
      });
      setActualActiveProblemIndexBeforeViewingPrevious(problemIndexForHistory);

      if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
        // Cambiar el mensaje a "Answered (Incorrect!). The correct answer is = X"
        setFeedbackMessage(`Answered (Incorrect!). The correct answer is = ${currentProblem.correctAnswer}`);
        const updatedHistoryEntry: UserAnswerType = { ...newHistoryEntry, status: 'revealed' };
         setUserAnswersHistory(prev => {
            const newHistory = [...prev];
            newHistory[problemIndexForHistory] = updatedHistoryEntry;
            return newHistory;
        });
        
        // Añadir problema de compensación cuando se agota el tiempo y se revelan las respuestas
        if (settings.enableCompensation) {
          console.log("[ADDITION] Agregando problema de compensación por tiempo agotado (sin respuesta)");
          const difficultyForCompensation = settings.enableAdaptiveDifficulty 
            ? adaptiveDifficulty 
            : (settings.difficulty as DifficultyLevel);
          
          const compensationProblem = generateAdditionProblem(difficultyForCompensation);
          setProblemsList(prev => [...prev, compensationProblem]);
          // Agregamos null al historial para que coincida con el nuevo problema añadido
          setUserAnswersHistory(prev => [...prev, null]);
          console.log("[ADDITION] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
        }
        
        setWaitingForContinue(true);
        
        // Enfocar el botón Continuar cuando se agota el tiempo
        setTimeout(() => {
          try {
            if (continueButtonRef.current) {
              continueButtonRef.current.focus();
              console.log("Enfocando botón Continuar después de tiempo agotado");
            }
          } catch (e) {
            console.error("Error al enfocar botón Continuar:", e);
          }
        }, 50);
      } else {
        setFeedbackMessage(t('exercises.timeUpNoAnswer', {attemptsMade: newAttempts, maxAttempts: settings.maxAttempts}));
        setFeedbackColor("red");
        setProblemTimerValue(settings.timeValue); // Preparar para el siguiente intento
        // El useEffect del timer se reiniciará porque waitingRef.current es false.
      }
    }
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); // Asegurar que el timer está detenido
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProblem, digitAnswers, checkCurrentAnswer, currentAttempts, settings, t, currentProblemIndex, actualActiveProblemIndexBeforeViewingPrevious /* waitingRef no es dep */]);


  useEffect(() => {
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);

    if ( exerciseStarted && 
         !exerciseCompleted && 
         currentProblem && 
         !viewingPrevious && 
         settings.timeValue > 0 &&
         !waitingRef.current && // No iniciar timer si ya estamos esperando continuar
         (settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts) // Y si quedan intentos
    ) {
      // problemTimerValue ya debería estar seteado al valor correcto (ej. settings.timeValue)
      // por el cambio de problema o por handleTimeOrAttemptsUp/checkCurrentAnswer para el siguiente intento.

      singleProblemTimerRef.current = window.setInterval(() => {
        setProblemTimerValue(prevTimerValue => {
          if (prevTimerValue <= 1) {
            if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
            handleTimeOrAttemptsUp(); // Único lugar donde se llama por timeout
            return 0;
          }
          return prevTimerValue - 1;
        });
      }, 1000);
    }

    return () => { 
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); 
    };
  }, [ exerciseStarted, exerciseCompleted, settings.timeValue, currentProblem, 
       viewingPrevious, currentAttempts, settings.maxAttempts, /* waitingRef no es dep */
       handleTimeOrAttemptsUp, problemTimerValue // Incluir problemTimerValue si se resetea aquí
     ]);

  useEffect(() => localStorage.setItem('addition_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString()), [consecutiveCorrectAnswers]);
  useEffect(() => localStorage.setItem('addition_consecutiveIncorrectAnswers', consecutiveIncorrectAnswers.toString()), [consecutiveIncorrectAnswers]);
  useEffect(() => localStorage.setItem('addition_autoContinue', autoContinue.toString()), [autoContinue]);

  const generateNewProblemSet = () => {
    const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
    const newProblemsArray: AdditionProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      newProblemsArray.push(generateAdditionProblem(difficultyToUse));
    }
    setProblemsList(newProblemsArray);
    setCurrentProblemIndex(0);
    setActualActiveProblemIndexBeforeViewingPrevious(0);
    setCurrentProblem(newProblemsArray[0]);

    setUserAnswersHistory(Array(newProblemsArray.length).fill(null));
    setTimer(0);
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setFeedbackMessage(null);
    setWaitingForContinue(false); // Esto actualizará waitingRef.current
    setBlockAutoAdvance(false);
    setShowLevelUpReward(false);
    setViewingPrevious(false);
    setProblemTimerValue(settings.timeValue);
    setCurrentAttempts(0);
  };

  const startExercise = () => {
    if (!exerciseStarted) {
      setExerciseStarted(true);
    }
  };

  const advanceToNextActiveProblem = useCallback(() => {
    const nextActiveIdx = actualActiveProblemIndexBeforeViewingPrevious + 1;
    if (nextActiveIdx < problemsList.length) {
      setCurrentProblemIndex(nextActiveIdx);
      setCurrentProblem(problemsList[nextActiveIdx]);
      setActualActiveProblemIndexBeforeViewingPrevious(nextActiveIdx);
      setFeedbackMessage(null);
      setDigitAnswers(Array(problemsList[nextActiveIdx].answerMaxDigits).fill("")); // Limpiar cajones para nuevo problema
      setCurrentAttempts(0); // Resetear intentos para el nuevo problema
      setProblemTimerValue(settings.timeValue); // Resetear timer para el nuevo problema
      setWaitingForContinue(false); // Permitir que el nuevo problema inicie su timer
    } else {
      completeExercise();
    }
  }, [actualActiveProblemIndexBeforeViewingPrevious, problemsList, settings.timeValue]);


  const moveToPreviousProblem = () => {
    const canGoBack = viewingPrevious ? currentProblemIndex > 0 : actualActiveProblemIndexBeforeViewingPrevious >= 0 && currentProblemIndex >=0 ;
    if (!canGoBack || exerciseCompleted) return;

    if (!viewingPrevious) {
        setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
    }
    setViewingPrevious(true);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); // Detener timer del problema activo

    const prevIndexToView = viewingPrevious ? currentProblemIndex - 1 : actualActiveProblemIndexBeforeViewingPrevious -1 ; // Corrección aquí
    if(prevIndexToView < 0) return;

    setCurrentProblemIndex(prevIndexToView);
    const prevProblemToView = problemsList[prevIndexToView];
    setCurrentProblem(prevProblemToView); // Cargar datos del problema anterior

    const prevAnswerEntry = userAnswersHistory[prevIndexToView];

    if (prevAnswerEntry && prevProblemToView) {
        const answerStr = isNaN(prevAnswerEntry.userAnswer) ? "" : String(prevAnswerEntry.userAnswer);
        let [intPart, decPart = ""] = answerStr.split('.');
        const expectedDecimals = prevProblemToView.answerDecimalPosition || 0;
        decPart = decPart.padEnd(expectedDecimals, '0').slice(0, expectedDecimals);
        // Para la parte entera, no usar padStart con '0' a menos que el problema original fuera así
        // o si la respuesta del usuario era así. Simplemente usar la parte entera.
        const numIntBoxes = prevProblemToView.answerMaxDigits - expectedDecimals;
        // intPart = intPart.padStart(numIntBoxes, '0'); // Evitar esto para no alterar la visualización de la respuesta del usuario
        const fullAnswerDigitsString = intPart + decPart;


        const restoredDigitAnswers = Array(prevProblemToView.answerMaxDigits).fill('');
        // Rellenar de derecha a izquierda si es vertical, o según la lógica original de entrada
        // Por simplicidad, rellenamos de izquierda a derecha, asumiendo que el string es completo.
        // Esto puede necesitar ajuste si la respuesta original no llenaba todas las cajas.
        // El objetivo es mostrar *lo que el usuario introdujo* en las cajas.
        // Una forma más robusta sería guardar los `digitAnswers` en el historial.
        // Por ahora, reconstruimos desde `userNumericAnswer`.
        const answerDisplayArray = String(prevAnswerEntry.userAnswer).replace('.', '').split('');

        if (prevProblemToView.layout === 'vertical' || (prevProblemToView.answerDecimalPosition && prevProblemToView.answerDecimalPosition > 0)) {
            // Para vertical o decimales, reconstruir con más cuidado.
            // Esta parte es compleja si no se guardan los digitAnswers originales.
            // Lo más simple es usar la reconstrucción original que tenías:
            let displayIntPart = intPart;
            let displayDecPart = decPart;
             if (prevProblemToView.layout === 'vertical') { // Para vertical, alinear a la derecha la parte entera
                displayIntPart = intPart.padStart(numIntBoxes, ''); // No rellenar con 0s visualmente a menos que el usuario los pusiera
            }
            const reconstructedAnswerString = displayIntPart + displayDecPart;

            for (let i = 0; i < Math.min(restoredDigitAnswers.length, reconstructedAnswerString.length); i++) {
                restoredDigitAnswers[i] = reconstructedAnswerString[i] || "";
            }
        } else { // Horizontal sin decimales
             for (let i = 0; i < Math.min(restoredDigitAnswers.length, answerDisplayArray.length); i++) {
                restoredDigitAnswers[i] = answerDisplayArray[i];
            }
        }

        setDigitAnswers(restoredDigitAnswers);
        setFeedbackMessage(
            prevAnswerEntry.isCorrect ? 
            t('exercises.yourAnswerWasCorrect', { userAnswer: prevAnswerEntry.userAnswer }) :
            t('exercises.yourAnswerWasIncorrect', { userAnswer: (prevAnswerEntry.userAnswer === undefined || isNaN(prevAnswerEntry.userAnswer) ? t('common.notAnswered') : prevAnswerEntry.userAnswer), correctAnswer: prevProblemToView.correctAnswer })
        );
        setFeedbackColor(prevAnswerEntry.isCorrect ? "green" : "red");
    } else {
        setDigitAnswers(prevProblemToView ? Array(prevProblemToView.answerMaxDigits).fill("") : []);
        setFeedbackMessage(prevProblemToView ? t('exercises.noAnswerRecordedForThisProblem') : t('common.error'));
        setFeedbackColor("blue");
    }
    // setWaitingForContinue(false); // No estamos esperando continuar el ejercicio activo
    // No es necesario setWaitingForContinue aquí, ya que el timer del problema activo se detuvo.
    // Al volver al problema activo, el estado de waitingForContinue de ESE problema se restaurará (o no).
    setFocusedDigitIndex(null);
  };

  const returnToActiveProblem = () => {
    setViewingPrevious(false);
    const activeProblem = problemsList[actualActiveProblemIndexBeforeViewingPrevious];
    setCurrentProblemIndex(actualActiveProblemIndexBeforeViewingPrevious);
    setCurrentProblem(activeProblem);

    const activeProblemHistory = userAnswersHistory[actualActiveProblemIndexBeforeViewingPrevious];
    if (activeProblemHistory) {
        // Restaurar digitAnswers si se guardaron (idealmente) o limpiar. Por ahora limpiamos.
        setDigitAnswers(Array(activeProblem.answerMaxDigits).fill("")); // O restaurar desde historial si se guardó

        if(activeProblemHistory.isCorrect || activeProblemHistory.status === 'revealed' || (activeProblemHistory.status === 'incorrect' && settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts)){
            // Si fue correcta, o revelada, o incorrecta y sin intentos, estamos esperando continuar.
            setFeedbackMessage(
                 activeProblemHistory.isCorrect ? 
                 t('exercises.correct') :
                 t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: activeProblem.correctAnswer }) // Asumimos que si es revealed o incorrecta sin intentos, se mostró la respuesta
            );
            setFeedbackColor(activeProblemHistory.isCorrect ? "green" : "red");
            setWaitingForContinue(true);
        } else if (activeProblemHistory.status === 'incorrect' ) { // Incorrecta pero con intentos restantes (o sin límite)
            setFeedbackMessage(t('exercises.yourPreviousAnswerWas', { userAnswer: activeProblemHistory.userAnswer }));
            setFeedbackColor("red");
            setWaitingForContinue(false); // Permitir reintentar
            setProblemTimerValue(settings.timeValue); // Reiniciar timer para el intento
        } else { // No respondida aún, o estado no manejado
             setFeedbackMessage(null);
             setWaitingForContinue(false);
             setProblemTimerValue(settings.timeValue);
        }
    } else {
        // Problema activo aún no intentado
        setDigitAnswers(Array(activeProblem.answerMaxDigits).fill(""));
        setFeedbackMessage(null);
        setWaitingForContinue(false);
        setProblemTimerValue(settings.timeValue);
    }
    // El useEffect del timer se encargará de reiniciarlo si !waitingRef.current y aplican otras condiciones.
  };

  const completeExercise = () => {
    setExerciseCompleted(true);
    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    
    // Calcular estadísticas detalladas para guardar
    const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;
    const accuracy = problemsList.length > 0 ? Math.round((correctCount / problemsList.length) * 100) : 0;
    const avgTimePerProblem = problemsList.length > 0 ? Math.round(timer / problemsList.length) : 0;
    
    // Cálculo de intentos promedio - corrección para contar los intentos reales por problema
    let totalAttempts = 0;
    const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;
    
    userAnswersHistory.forEach(answer => {
      if (answer) {
        // Usando la propiedad attempts del objeto answer si existe, de lo contrario asumimos 1
        totalAttempts += answer.attempts || 1;
        
        // Si la respuesta fue revelada, contamos un intento adicional
        if (answer.status === 'revealed') {
          totalAttempts++;
        }
      }
    });
    
    const avgAttempts = attemptedProblemsCount > 0 
      ? parseFloat((totalAttempts / attemptedProblemsCount).toFixed(1)) 
      : 0;
    
    // Contar respuestas reveladas
    const revealedAnswers = userAnswersHistory.filter(a => a && a.status === 'revealed').length;
    
    // Nivel final - actualizamos para detectar posibles cambios de nivel durante el ejercicio
    const finalLevel = settings.enableAdaptiveDifficulty 
      ? localStorage.getItem('addition_adaptiveDifficulty') || adaptiveDifficulty 
      : settings.difficulty;
    
    // Preparar los detalles de cada problema para el historial
    const problemDetails = userAnswersHistory.map((answer, index) => {
      if (!answer) return null;
      
      const problem = problemsList[index];
      if (!problem) return null;
      
      // Formato para mostrar el problema
      let problemText = '';
      if (problem.operands && problem.operands.length > 0) {
        if (problem.operands.length === 2) {
          problemText = `${problem.operands[0]} + ${problem.operands[1]} = ${problem.correctAnswer}`;
        }
      }
      
      return {
        problemNumber: index + 1,
        problem: problemText,
        isCorrect: answer.isCorrect,
        userAnswer: answer.userAnswer,
        correctAnswer: problem.correctAnswer,
        attempts: answer.attempts || 1,
        timeSpent: avgTimePerProblem, // Como no tenemos el tiempo exacto por problema, usamos el promedio
        level: finalLevel
      };
    }).filter(Boolean); // Eliminar los null
    
    // Guardar el resultado con toda la información detallada
    saveExerciseResult({
      operationId: "addition",
      date: new Date().toISOString(),
      score: correctCount,
      totalProblems: problemsList.length,
      timeSpent: timer,
      difficulty: (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) as string,
      // Información detallada adicional
      accuracy: accuracy,
      avgTimePerProblem: avgTimePerProblem,
      avgAttempts: avgAttempts,
      revealedAnswers: revealedAnswers,
      problemDetails: problemDetails
    });
  };

  const handleDigitBoxClick = (index: number) => {
    if (waitingRef.current || exerciseCompleted || viewingPrevious) return;
    if (!exerciseStarted) startExercise();
    if (currentProblem) {
      setInputDirection(index < Math.floor(currentProblem.answerMaxDigits / 2) ? 'ltr' : 'rtl');
    }
    setFocusedDigitIndex(index);
    
    // Asegurar que actualizamos el estado primero y luego enfocamos
    setTimeout(() => {
      try {
        const el = boxRefsArrayRef.current[index];
        if (el) {
          el.focus();
          console.log("Enfocando elemento en índice:", index);
        } else {
          console.log("No se encontró elemento para enfocar en índice:", index);
        }
      } catch (err) {
        console.error("Error al intentar enfocar:", err);
      }
    }, 10);
  };

  const handleDigitInput = (value: string) => {
    if (waitingRef.current || focusedDigitIndex === null || !currentProblem || exerciseCompleted || viewingPrevious) return;
    if (!exerciseStarted) startExercise();

    let newAnswers = [...digitAnswers];
    let currentFocus = focusedDigitIndex;
    const maxDigits = currentProblem.answerMaxDigits;

    if (value === "backspace") {
      newAnswers[currentFocus] = "";
    } else if (/[0-9]/.test(value)) {
      newAnswers[currentFocus] = value;
      if (inputDirection === 'rtl') { 
        if (currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
      } else {
        if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1);
      }
    }
    setDigitAnswers(newAnswers);
  };

  useEffect(() => {
    const handlePhysicalKeyDown = (event: KeyboardEvent) => {
      // Usar waitingRef.current para la comprobación más actualizada
      if (focusedDigitIndex === null || waitingRef.current || exerciseCompleted || viewingPrevious || showLevelUpReward || !currentProblem) return;

      const key = event.key;
      if (key >= '0' && key <= '9') {
          let newAnswers = [...digitAnswers];
          newAnswers[focusedDigitIndex] = key;
          setDigitAnswers(newAnswers);
          if (inputDirection === 'rtl') {
              if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
          } else {
              if (focusedDigitIndex < currentProblem.answerMaxDigits - 1) setFocusedDigitIndex(focusedDigitIndex + 1);
          }
          event.preventDefault();
      } else if (key === 'Backspace') {
          let newAnswers = [...digitAnswers];
          newAnswers[focusedDigitIndex] = "";
          setDigitAnswers(newAnswers);
          event.preventDefault();
      } else if (key === 'Enter') {
          checkCurrentAnswer(); // checkCurrentAnswer es useCallback
          event.preventDefault();
      } else if (key === 'ArrowLeft') {
          if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
          event.preventDefault();
      } else if (key === 'ArrowRight') {
          if (focusedDigitIndex < currentProblem.answerMaxDigits - 1) {
              setFocusedDigitIndex(focusedDigitIndex + 1);
          }
          event.preventDefault();
      }
    };
    document.addEventListener('keydown', handlePhysicalKeyDown);
    return () => document.removeEventListener('keydown', handlePhysicalKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedDigitIndex, exerciseCompleted, currentProblem, digitAnswers, inputDirection, viewingPrevious, showLevelUpReward, checkCurrentAnswer /* waitingRef no es dep */]);

  const handleContinue = useCallback(() => {
    // setWaitingForContinue(false) se hace en advanceToNextActiveProblem o al regenerar problema por level up
    setFeedbackMessage(null); 

    if (showLevelUpReward) {
      setShowLevelUpReward(false);
      setBlockAutoAdvance(false);
      const newProblemForLevelUp = generateAdditionProblem(adaptiveDifficulty);
      const updatedProblemsList = [...problemsList];
      updatedProblemsList[actualActiveProblemIndexBeforeViewingPrevious] = newProblemForLevelUp;
      setProblemsList(updatedProblemsList);
      setCurrentProblem(newProblemForLevelUp); 
      setDigitAnswers(Array(newProblemForLevelUp.answerMaxDigits).fill(""));
      setCurrentAttempts(0);
      setProblemTimerValue(settings.timeValue);
      setWaitingForContinue(false); // Crucial para reiniciar el flujo para el nuevo problema
      return;
    }

    if (!blockAutoAdvance) {
      advanceToNextActiveProblem();
    }
  }, [showLevelUpReward, adaptiveDifficulty, problemsList, actualActiveProblemIndexBeforeViewingPrevious, blockAutoAdvance, advanceToNextActiveProblem, settings.timeValue]);


  if (!currentProblem && problemsList.length === 0 && !exerciseCompleted) {
    return <div className="p-8 text-center">{t('common.loadingProblems')}...</div>;
  }
  if (!currentProblem && !exerciseCompleted) {
    if(problemsList.length > 0 && actualActiveProblemIndexBeforeViewingPrevious < problemsList.length) {
      setCurrentProblem(problemsList[actualActiveProblemIndexBeforeViewingPrevious] || problemsList[0]);
    } else if (problemsList.length > 0) {
        setCurrentProblem(problemsList[0]); // Fallback
        setActualActiveProblemIndexBeforeViewingPrevious(0);
    }
    return <div className="p-8 text-center">{t('common.reloadingProblem')}...</div>;
  }
  if (exerciseCompleted) {
    const finalScore = userAnswersHistory.filter(a => a && a.isCorrect).length;
    const accuracy = problemsList.length > 0 ? Math.round((finalScore / problemsList.length) * 100) : 0;
    
    // Cálculo de tiempo promedio por problema
    const avgTimePerProblem = problemsList.length > 0 ? Math.round(timer / problemsList.length) : 0;
    
    // Cálculo de intentos promedio - corrección para contar los intentos reales por problema
    let totalAttempts = 0;
    const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;
    
    userAnswersHistory.forEach(answer => {
      if (answer) {
        // Usando la propiedad attempts del objeto answer si existe, de lo contrario asumimos 1
        totalAttempts += answer.attempts || 1;
        
        // Si la respuesta fue revelada, contamos un intento adicional
        if (answer.status === 'revealed') {
          totalAttempts++;
        }
      }
    });
    
    const avgAttempts = attemptedProblemsCount > 0 
      ? (totalAttempts / attemptedProblemsCount).toFixed(1) 
      : "0";
    
    // Contar respuestas reveladas
    const revealedAnswers = userAnswersHistory.filter(a => a && a.status === 'revealed').length;
    
    // Nivel final - actualizamos para detectar posibles cambios de nivel durante el ejercicio
    // Si se usa dificultad adaptativa, el nivel mostrado será el último alcanzado
    const finalLevel = settings.enableAdaptiveDifficulty 
      ? localStorage.getItem('addition_adaptiveDifficulty') || adaptiveDifficulty 
      : settings.difficulty;
    
    return (
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {t('Addition Exercise Complete!')}
        </h2>
        
        {/* Tiempo total */}
        <div className="bg-gray-100 p-3 rounded-lg mb-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Total Time</div>
          <div className="text-xl font-bold">{formatTime(timer)}</div>
        </div>
        
        {/* Grid de estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg shadow-sm text-center border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Score</div>
            <div className="text-xl text-indigo-600 font-semibold">{finalScore} / {problemsList.length}</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg shadow-sm text-center border border-green-100">
            <div className="text-sm text-gray-600 mb-1">Accuracy</div>
            <div className="text-xl text-green-600 font-semibold">{accuracy}%</div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg shadow-sm text-center border border-purple-100">
            <div className="text-sm text-gray-600 mb-1">Avg. Time</div>
            <div className="text-xl text-purple-600 font-semibold">{avgTimePerProblem}s</div>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-lg shadow-sm text-center border border-amber-100">
            <div className="text-sm text-gray-600 mb-1">Avg. Attempts</div>
            <div className="text-xl text-amber-600 font-semibold">{avgAttempts}</div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg shadow-sm text-center border border-red-100">
            <div className="text-sm text-gray-600 mb-1">Revealed</div>
            <div className="text-xl text-red-600 font-semibold">{revealedAnswers}</div>
          </div>
          
          <div className="bg-teal-50 p-3 rounded-lg shadow-sm text-center border border-teal-100">
            <div className="text-sm text-gray-600 mb-1">Final Level</div>
            <div className="text-xl text-teal-600 font-semibold">{finalLevel === "beginner" ? "1" : 
                                                          finalLevel === "elementary" ? "2" : 
                                                          finalLevel === "intermediate" ? "3" : 
                                                          finalLevel === "advanced" ? "4" : "5"}</div>
          </div>
        </div>
        
        {/* Sección de revisión de problemas */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Problem Review</h3>
          <div className="space-y-2">
            {userAnswersHistory.map((answer, index) => {
              if (!answer) return null;
              
              const problem = problemsList[index];
              if (!problem) return null;
              
              // Formato para mostrar el problema resuelto
              let problemDisplay = '';
              if (problem.operands && problem.operands.length > 0) {
                if (problem.operands.length === 2) {
                  problemDisplay = `${problem.operands[0]} + ${problem.operands[1]} = ${problem.correctAnswer}`;
                  if (answer.userAnswer !== problem.correctAnswer && !isNaN(answer.userAnswer)) {
                    problemDisplay += ` (${answer.userAnswer})`;
                  }
                }
              }
              
              // Información adicional sobre el intento
              let attemptInfo = `Lvl: ${finalLevel === "beginner" ? "1" : 
                                 finalLevel === "elementary" ? "2" : 
                                 finalLevel === "intermediate" ? "3" : 
                                 finalLevel === "advanced" ? "4" : "5"}, Att: 1, T: ${avgTimePerProblem}s`;
              
              return (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${answer.isCorrect 
                    ? 'bg-green-100 border border-green-200' 
                    : 'bg-red-100 border border-red-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">(#{index + 1})</span> {problemDisplay}
                    </div>
                    <div>
                      {answer.isCorrect 
                        ? <Check className="h-5 w-5 text-green-600" /> 
                        : <span className="text-red-600">✕</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {attemptInfo}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Guardar resultados */}
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-sky-50">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Download className="h-5 w-5 mr-2 text-blue-600" />
            Guardar resultados
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Puedes guardar estos resultados en el sistema para revisarlos más tarde en tu historial de progreso.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={async () => {
                try {
                  // Preparamos los datos para guardar en la base de datos
                  const progressData = {
                    operationId: "addition",
                    score: finalScore,
                    totalProblems: problemsList.length,
                    timeSpent: timer,
                    difficulty: finalLevel,
                    accuracy,
                    avgTimePerProblem,
                    avgAttempts,
                    revealedAnswers,
                    problemDetails: problemsList.map((problem, index) => {
                      const answer = userAnswersHistory[index];
                      if (!answer) return null;
                      
                      return {
                        problemNumber: index + 1,
                        problem: `${problem.operands[0]} + ${problem.operands[1]} = ${problem.correctAnswer}`,
                        isCorrect: answer.isCorrect,
                        userAnswer: answer.userAnswer,
                        correctAnswer: problem.correctAnswer,
                        attempts: answer.attempts || 1,
                        timeSpent: Math.round(avgTimePerProblem),
                        level: finalLevel
                      };
                    }).filter(Boolean)
                  };
                  
                  // Enviamos los datos al servidor
                  const response = await fetch('/api/progress', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(progressData),
                  });
                  
                  if (!response.ok) {
                    throw new Error('Error al guardar en el servidor');
                  }
                  
                  // También guardamos en localStorage como respaldo
                  const storageKey = `math_results_${new Date().toISOString().slice(0, 10)}`;
                  localStorage.setItem(storageKey, JSON.stringify(progressData));
                  
                  alert("Resultados guardados correctamente");
                  
                  // Notificamos al sistema de progreso
                  if (saveProgress) {
                    saveProgress(progressData);
                  }
                } catch (error) {
                  console.error("Error saving progress:", error);
                  
                  // Guardamos al menos en localStorage
                  try {
                    const storageKey = `math_results_${new Date().toISOString().slice(0, 10)}`;
                    const progressData = {
                      operationId: "addition",
                      date: new Date().toISOString(),
                      score: finalScore,
                      totalProblems: problemsList.length,
                      timeSpent: timer,
                      difficulty: finalLevel,
                      accuracy,
                      avgTimePerProblem,
                      avgAttempts,
                      revealedAnswers
                    };
                    localStorage.setItem(storageKey, JSON.stringify(progressData));
                    alert("No se pudo guardar en el servidor pero se guardó localmente");
                  } catch (localError) {
                    alert("Error al guardar los resultados. Por favor intenta de nuevo.");
                  }
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Guardar en mi progreso
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  // Creamos un texto formateado para exportar
                  const fecha = new Date().toLocaleDateString();
                  const hora = new Date().toLocaleTimeString();
                  
                  let contenido = `RESULTADOS DEL EJERCICIO DE SUMA\n`;
                  contenido += `Fecha: ${fecha} - Hora: ${hora}\n\n`;
                  contenido += `RESUMEN:\n`;
                  contenido += `Total de problemas: ${problemsList.length}\n`;
                  contenido += `Puntuación: ${finalScore} / ${problemsList.length}\n`;
                  contenido += `Precisión: ${accuracy}%\n`;
                  contenido += `Tiempo total: ${formatTime(timer)}\n`;
                  contenido += `Tiempo promedio por problema: ${Math.round(avgTimePerProblem)}s\n`;
                  contenido += `Intentos promedio: ${avgAttempts.toFixed(1)}\n`;
                  contenido += `Respuestas reveladas: ${revealedAnswers}\n`;
                  contenido += `Nivel de dificultad: ${finalLevel}\n\n`;
                  
                  contenido += `DETALLE DE PROBLEMAS:\n`;
                  problemsList.forEach((problem, index) => {
                    const answer = userAnswersHistory[index];
                    if (!answer) return;
                    
                    contenido += `Problema #${index + 1}: ${problem.operands[0]} + ${problem.operands[1]} = ${problem.correctAnswer}\n`;
                    contenido += `  Respuesta del usuario: ${answer.userAnswer || '-'}\n`;
                    contenido += `  Correcto: ${answer.isCorrect ? 'Sí' : 'No'}\n`;
                    contenido += `  Intentos: ${answer.attempts || 1}\n`;
                    contenido += `  Nivel: ${finalLevel}\n\n`;
                  });
                  
                  // Crear el archivo de texto y descargarlo
                  const blob = new Blob([contenido], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `resultados_suma_${new Date().toISOString().slice(0, 10)}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  
                  // Limpiar
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }, 0);
                } catch (error) {
                  console.error("Error al exportar:", error);
                  alert("Error al exportar los resultados. Por favor intenta de nuevo.");
                }
              }}
              variant="outline"
              className="w-full border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar como texto
            </Button>
          </div>
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
    );
  }
  if (!currentProblem) return <div className="p-8 text-center">{t('common.errorLoadingProblem')}</div>;

  const { maxIntLength = 0, maxDecLength = 0, operandsFormatted = [], sumLineTotalCharWidth = 0 } =
    currentProblem.layout === 'vertical'
    ? getVerticalAlignmentInfo(currentProblem.operands, currentProblem.answerDecimalPosition)
    : { operandsFormatted: currentProblem.operands.map(op => ({original: op, intStr: String(op), decStr: ""})), maxIntLength:0, maxDecLength:0, sumLineTotalCharWidth:0 };

  const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;
  const progressValue = problemsList.length > 0 ? (attemptedProblemsCount / problemsList.length) * 100 : 0;
  const score = userAnswersHistory.filter(a => a && a.isCorrect).length;

  return (
    <div className="relative">
      <LevelUpHandler />
      <RewardAnimation />

      {showLevelUpReward && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
              <Trophy className="h-20 w-20 sm:h-24 sm:w-24 text-yellow-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('levelUp.title')}</h3>
              <p className="text-lg sm:text-xl mb-4 sm:mb-6">{t('levelUp.message', { level: t(adaptiveDifficulty) })}</p>
              <Button 
                ref={continueButtonRef}
                onClick={handleContinue} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg py-2.5 sm:py-3"
              >
                {t('levelUp.continueChallenge')}
              </Button>
            </div>
          </div>
        )}

      <div className={`px-2 py-3 sm:px-4 sm:py-5 rounded-xl shadow-lg ${
        adaptiveDifficulty === "beginner" ? "bg-blue-50 border-blue-200" : 
        adaptiveDifficulty === "elementary" ? "bg-emerald-50 border-emerald-200" : 
        adaptiveDifficulty === "intermediate" ? "bg-orange-50 border-orange-200" :
        adaptiveDifficulty === "advanced" ? "bg-purple-50 border-purple-200" :
        adaptiveDifficulty === "expert" ? "bg-rose-50 border-rose-200" :
        "bg-indigo-50 border-indigo-200"
      } border-2`}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{currentTranslations.addition}</h2>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="font-medium text-gray-700 flex items-center"><Info className="h-4 w-4 mr-1 opacity-70"/>{formatTime(timer)}</span>
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
                          {currentTranslations.attempts}: {currentAttempts}/{settings.maxAttempts}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.maxAttemptsPerProblem')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                  (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) === "beginner" ? "bg-blue-100 text-blue-800" : 
                  (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) === "elementary" ? "bg-emerald-100 text-emerald-800" : 
                  (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) === "intermediate" ? "bg-orange-100 text-orange-800" :
                  (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) === "advanced" ? "bg-purple-100 text-purple-800" :
                  (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) === "expert" ? "bg-rose-100 text-rose-800" :
                  "bg-indigo-100 text-indigo-800"
                }`}>
                    {currentTranslations.level}: {t(settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty)}
                </span>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Star className="h-4 w-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.rewardsCollected') || "Rewards collected"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger>
                        <History className="h-4 w-4 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.exerciseHistory') || "Exercise history"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Button>
                <Button variant="ghost" size="sm" onClick={onOpenSettings} className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
                  <Cog className="h-4 w-4" /> {currentTranslations.settings}
                </Button>
            </div>
        </div>
        <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1" />
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            <span>{currentTranslations.problem} {currentProblemIndex + 1} {currentTranslations.of} {problemsList.length}</span>
            <span className="font-semibold">{t('exercises.score')}: {score}</span>
        </div>

        <div className={`p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 shadow-md bg-white min-h-[150px] sm:min-h-[180px] flex flex-col items-center justify-center`}>
          {currentProblem.layout === 'horizontal' ? (
            <div className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
              <span>{currentProblem.operands[0]}</span>
              <span className="text-gray-600 mx-1">+</span>
              <span>{currentProblem.operands.length > 1 ? currentProblem.operands[1] : '?'}</span>
              {currentProblem.operands.length > 2 && ( // Support for more than 2 operands if needed
                <>
                  <span className="text-gray-600 mx-1">+</span>
                  <span>{currentProblem.operands[2]}</span>
                </>
              )}
              <span className="text-gray-600 mx-1">=</span>
            </div>
          ) : ( 
            <div className="inline-block text-right my-1 sm:my-2">
              {operandsFormatted.map((op, index) => (
                <div key={`op-${index}-${currentProblem.id}`} className={verticalOperandStyle}>
                  {index === operandsFormatted.length -1 && operandsFormatted.length > 1 && <span className={plusSignVerticalStyle}>+</span>}
                  <span>{op.intStr}</span>
                  {maxDecLength > 0 && (
                    <>
                      <span className="opacity-60">.</span>
                      <span>{op.decStr}</span>
                    </>
                  )}
                </div>
              ))}
              <div 
                className={sumLineStyle} 
                style={{width: `${Math.max(5, sumLineTotalCharWidth + 2)}ch`, marginLeft: 'auto', marginRight: '0'}}
              />
            </div>
          )}

          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
            {Array(currentProblem.answerMaxDigits).fill(0).map((_, index) => {
              const integerDigitsCount = currentProblem.answerMaxDigits - (currentProblem.answerDecimalPosition || 0);
              const isVisualDecimalPointAfterThisBox = currentProblem.answerDecimalPosition !== undefined && 
                                                       currentProblem.answerDecimalPosition > 0 && 
                                                       index === integerDigitsCount - 1 &&
                                                       integerDigitsCount < currentProblem.answerMaxDigits;

              return (
                <React.Fragment key={`digit-box-frag-${index}-${currentProblem.id}`}>
                  <div
                    ref={el => {
                      if (el) {
                        // Guardar la referencia en el array auxiliar
                        boxRefsArrayRef.current[index] = el;
                        // Actualizar la referencia principal para acceder globalmente
                        digitBoxRefs.current = boxRefsArrayRef.current;
                      }
                    }}
                    tabIndex={viewingPrevious || exerciseCompleted || waitingRef.current ? -1 : 0}
                    className={`${digitBoxBaseStyle} 
                                ${viewingPrevious || exerciseCompleted || waitingRef.current ? digitBoxDisabledStyle : (focusedDigitIndex === index ? digitBoxFocusStyle : digitBoxBlurStyle)}
                                ${!viewingPrevious && !exerciseCompleted && !waitingRef.current ? 'cursor-text hover:border-gray-400' : ''}`}
                    onClick={() => !viewingPrevious && !exerciseCompleted && !waitingRef.current && handleDigitBoxClick(index)}
                    onFocus={() => {if (!viewingPrevious && !exerciseCompleted && !waitingRef.current) setFocusedDigitIndex(index);}}
                  >
                    {digitAnswers[index] || <span className="opacity-0">0</span>}
                  </div>
                  {isVisualDecimalPointAfterThisBox && (
                    <div className="text-2xl sm:text-3xl font-bold mx-0.5 sm:mx-1 opacity-80 self-center pt-1 select-none">.</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {feedbackMessage && (viewingPrevious || (!viewingPrevious && currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) || exerciseCompleted) && (
            <div className={`mt-2 sm:mt-3 text-center font-medium text-sm sm:text-base ${feedbackColor === "green" ? "text-green-600" : feedbackColor === "blue" ? "text-blue-700" : "text-red-600"}`}>
              {feedbackMessage}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-xs mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"].map((key, idx) => (
            <Button
              key={key || `empty-key-${idx}`}
              variant="outline"
              className={`text-lg sm:text-xl h-11 sm:h-12 ${key === "" ? "invisible pointer-events-none" : "bg-white hover:bg-gray-50 shadow-sm active:bg-gray-100"}`}
              onClick={() => !viewingPrevious && !exerciseCompleted && !waitingRef.current && key && key !== "" && handleDigitInput(key)}
              disabled={waitingRef.current || exerciseCompleted || viewingPrevious || key === "" || (!exerciseStarted && key !== "" && key!=="backspace" && (key < '0' || key > '9'))}
            >
              {key === "backspace" ? <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" /> : key}
            </Button>
          ))}
        </div>
        <div className="mt-4 sm:mt-6 flex justify-between items-center">
          <Button 
            variant="outline" size="sm" 
            disabled={(viewingPrevious ? currentProblemIndex === 0 : actualActiveProblemIndexBeforeViewingPrevious === 0 && currentProblemIndex === 0 && !viewingPrevious) || exerciseCompleted} 
            onClick={moveToPreviousProblem} 
            className="text-xs sm:text-sm"
          >
            <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {currentTranslations.previous}
          </Button>

          {viewingPrevious ? (
            <Button onClick={returnToActiveProblem} className="px-4 sm:px-5 text-sm sm:text-base bg-orange-500 hover:bg-orange-600 text-white">
                <RotateCcw className="mr-1 h-4 w-4" /> {t('common.returnToActive')} 
            </Button>
          ) : waitingRef.current ? ( // Usar waitingRef.current para la UI
            <Button 
                ref={continueButtonRef}
                onClick={handleContinue} 
                className="px-5 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg animate-pulse bg-green-500 hover:bg-green-600 text-white flex items-center justify-center w-full max-w-xs mx-auto"
            >
                <span className="flex-grow text-center font-medium">{t('Continue')}</span>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="ml-3 flex items-center bg-black/20 py-1 px-2 rounded-md cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAutoContinue(prev => !prev);
                        }}
                      >
                        <div className={`h-4 w-4 border border-white rounded-sm flex items-center justify-center mr-1.5 ${autoContinue ? 'bg-white' : ''}`}>
                          {autoContinue && <Check className="h-3 w-3 text-green-700" />}
                        </div>
                        <span className="text-xs font-medium">{t('Auto')}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{autoContinue ? t('tooltips.disableAutoContinue') : t('tooltips.enableAutoContinue')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </Button>
          ) : (
            <Button onClick={checkCurrentAnswer} disabled={exerciseCompleted || waitingRef.current} className="px-5 sm:px-6 text-sm sm:text-base bg-blue-500 hover:bg-blue-600 text-white">
              {!exerciseStarted ? currentTranslations.startExercise : <><Check className="mr-1 h-4 w-4" />{t('exercises.check')}</>}
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
                            // Usamos la respuesta correcta del problema directamente
                            setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
                            setFeedbackColor("blue");
                            setWaitingForContinue(true); // Pone waitingRef.current = true
                            const problemIdxForHistory = actualActiveProblemIndexBeforeViewingPrevious;
                            const answerEntry = userAnswersHistory[problemIdxForHistory];
                            if (!answerEntry || (!answerEntry.isCorrect && answerEntry.status !== 'revealed')) {
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
              ) : waitingRef.current ? ( // Usar waitingRef.current
                  <TooltipContent><p>{t('tooltips.showAnswerDisabledWhileWaiting')}</p></TooltipContent>
              ) : null }
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}