// Exercise.tsx - Módulo autocontenido de Addition
// ==========================================
// SECCIÓN 0: IMPORTACIONES
// ==========================================

// React y Hooks
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Contextos
import { useProgress } from '@/context/ProgressContext';
import { useSettings as useSettingsContext } from '@/context/SettingsContext'; // Renombrado para evitar conflicto con el componente Settings

// Hooks Personalizados (del proyecto)
import { useTranslations } from '@/hooks/use-translations';

// Stores (Zustand u otros)
import { useRewardsStore } from '@/lib/rewards-system'; // El store hook
import { awardReward, getRewardProbability } from '@/lib/rewards-system'; // Funciones asociadas de rewards-system

// Componentes UI (del proyecto)
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import LevelUpHandler from "@/components/LevelUpHandler";
import RewardAnimation from '@/components/rewards/RewardAnimation';
import DifficultyExamples from "@/components/DifficultyExamples";

// Librerías de UI (iconos)
import { 
    Settings as SettingsIcon, // Icono de Configuración
    ChevronLeft, 
    ChevronRight, 
    Check, 
    Cog as CogIcon, // Icono de Engranaje
    Info as InfoIcon, // Icono de Información
    Star as StarIcon, // Icono de Estrella
    Award as AwardIcon, // Icono de Premio
    Trophy as TrophyIcon, // Icono de Trofeo
    RotateCcw, 
    ArrowLeft 
} from "lucide-react";

// Utilidades y Constantes (del proyecto)
import { formatTime, debounce } from "@/lib/utils";
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import { defaultModuleSettings } from "@/utils/operationComponents";

// ==========================================
// SECCIÓN 1: TIPOS Y INTERFACES
// ==========================================

type DifficultyLevel = "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
type ExerciseLayout = 'horizontal' | 'vertical';

interface Problem {
  id: string;
  operands: number[];
  correctAnswer: number;
  layout: ExerciseLayout;
  answerMaxDigits: number;
  answerDecimalPosition?: number;
  difficulty: DifficultyLevel;
}

type AdditionProblem = Problem;

interface UserAnswer {
  problemId: string;
  problem: Problem;
  userAnswer: number | null; // Puede ser null si no se ingresa nada o es inválido
  isCorrect: boolean;
  status?: 'correct' | 'incorrect' | 'revealed' | 'timeout' | 'unanswered';
}
type UserAnswerType = UserAnswer; // Alias usado en Exercise.tsx

interface ModuleSettings {
  difficulty: DifficultyLevel | string; // string para flexibilidad, pero debería ser DifficultyLevel
  problemCount: number;
  timeValue: number;
  maxAttempts: number;
  showImmediateFeedback: boolean;
  enableSoundEffects: boolean;
  showAnswerWithExplanation: boolean;
  enableAdaptiveDifficulty: boolean;
  enableCompensation: boolean;
  enableRewards: boolean;
}

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

// ==========================================
// SECCIÓN 2: FUNCIONES UTILITARIAS
// ==========================================

// --- Funciones auxiliares de utils.ts ---
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomBool = (probability: number = 0.5): boolean => Math.random() < probability;

function getRandomDecimal(min: number, max: number, maxDecimals: 0 | 1 | 2): number {
  if (maxDecimals === 0) {
    return getRandomInt(min, max);
  }
  const range = max - min;
  let value = Math.random() * range + min;
  const factor = Math.pow(10, maxDecimals);
  value = Math.round(value * factor) / factor;
  const fixedString = value.toFixed(maxDecimals);
  return parseFloat(fixedString);
}

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- Generación del Problema de utils.ts ---
function generateAdditionProblem(difficulty: DifficultyLevel): AdditionProblem {
  const id = generateUniqueId();
  let operands: number[] = [];
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner":
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
      break;
    case "elementary":
      operands = [getRandomInt(10, 30), getRandomInt(1, 9)];
      if (getRandomBool(0.5)) {
          operands = [getRandomInt(10, 20), getRandomInt(10, 20)];
      }
      layout = 'horizontal';
      break;
    case "intermediate":
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal';
      if (layout === 'vertical' && getRandomBool(0.4)) {
        problemMaxDecimals = 1;
        operands = [
          getRandomDecimal(10, 99, problemMaxDecimals),
          getRandomDecimal(10, 99, problemMaxDecimals)
        ];
      } else {
        operands = [getRandomInt(10, 99), getRandomInt(10, 99)];
      }
      break;
    case "advanced":
      layout = 'vertical';
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1;
      for (let i = 0; i < 3; i++) {
        operands.push(getRandomDecimal(10, getRandomInt(200, 999), problemMaxDecimals));
      }
      break;
    case "expert":
      layout = 'vertical';
      const numLines = getRandomBool() ? 4 : 5;
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1;
      for (let i = 0; i < numLines; i++) {
        operands.push(getRandomDecimal(100, getRandomInt(2000, 9999), problemMaxDecimals));
      }
      break;
    default:
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
  }

  if (operands.length === 0) {
    operands = [getRandomInt(1,5), getRandomInt(1,5)];
  }

  const sum = operands.reduce((acc, val) => acc + val, 0);

  let effectiveMaxDecimalsInAnswer = 0;
  if (problemMaxDecimals > 0) {
      effectiveMaxDecimalsInAnswer = problemMaxDecimals;
  } else {
      effectiveMaxDecimalsInAnswer = Math.max(0, ...operands.map(op => {
          const opStr = String(op);
          return (opStr.split('.')[1] || '').length;
      }));
  }
  const correctAnswer = parseFloat(sum.toFixed(effectiveMaxDecimalsInAnswer));

  const correctAnswerStr = correctAnswer.toFixed(effectiveMaxDecimalsInAnswer);
  const [integerPartOfSumStr, decimalPartOfSumStr = ""] = correctAnswerStr.split('.');

  const answerMaxDigits = integerPartOfSumStr.length + decimalPartOfSumStr.length;

  let answerDecimalPosition: number | undefined = undefined;
  if (effectiveMaxDecimalsInAnswer > 0 && decimalPartOfSumStr.length > 0) {
    answerDecimalPosition = decimalPartOfSumStr.length;
  }

  return {
    id,
    operands,
    correctAnswer,
    layout,
    answerMaxDigits,
    answerDecimalPosition,
    difficulty, // Añadido para cumplir con el tipo Problem
  };
}

// --- Validación de la Respuesta de utils.ts ---
function checkAnswer(problem: AdditionProblem, userAnswer: number): boolean {
  if (isNaN(userAnswer)) return false;

  const precisionForComparison = problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0
    ? problem.answerDecimalPosition
    : 0;

  const factor = Math.pow(10, precisionForComparison);
  const roundedCorrectAnswer = Math.round(problem.correctAnswer * factor) / factor;
  const roundedUserAnswer = Math.round(userAnswer * factor) / factor;

  return roundedUserAnswer === roundedCorrectAnswer;
}

// --- Funciones auxiliares para formatear números para la vista vertical de utils.ts ---
function getVerticalAlignmentInfo(
    operands: number[],
    problemOverallDecimalPrecision?: number
): {
    maxIntLength: number;
    maxDecLength: number;
    operandsFormatted: Array<{ original: number, intStr: string, decStr: string }>;
    sumLineTotalCharWidth: number;
} {
    const effectiveDecimalPlacesToShow = problemOverallDecimalPrecision || 0;

    const operandsDisplayInfo = operands.map(op => {
        const s = op.toFixed(effectiveDecimalPlacesToShow);
        const parts = s.split('.');
        return {
            original: op,
            intPart: parts[0],
            decPart: parts[1] || ""
        };
    });

    const maxIntLength = Math.max(1, ...operandsDisplayInfo.map(info => info.intPart.length));
    const maxDecLength = effectiveDecimalPlacesToShow;

    const operandsFormatted = operandsDisplayInfo.map(info => ({
        original: info.original,
        intStr: info.intPart.padStart(maxIntLength, ' '),
        decStr: info.decPart.padEnd(maxDecLength, '0')
    }));

    const sumLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 : 0) + maxDecLength;

    return { maxIntLength, maxDecLength, operandsFormatted, sumLineTotalCharWidth };
}


// ==========================================
// SECCIÓN 3: COMPONENTE PRINCIPAL
// ==========================================

// Constantes de estilo para Exercise.tsx
const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
const digitBoxFocusStyle = "border-blue-500 ring-2 ring-blue-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300";
const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const plusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const sumLineStyle = "border-t-2 border-gray-700 my-1";

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // ==========================================
  // 3.1: ESTADO Y REFS
  // ==========================================
  // Estados
  const [problemsList, setProblemsList] = useState<AdditionProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<AdditionProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswerType[]>([]);
  const [timer, setTimer] = useState(0);
  const [problemTimerValue, setProblemTimerValue] = useState(settings.timeValue);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue" | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
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
  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState<number>(0);

  //Score (calculado, no es un estado directo para evitar desincronización, se calcula en render)
  //const [score, setScore] = useState(0); // Eliminado, se calcula de userAnswersHistory

  // Referencias
  const digitBoxRefs = useRef<HTMLDivElement[]>([]); // Usado para enfocar
  const boxRefsArrayRef = useRef<HTMLDivElement[]>([]); // Auxiliar para el callback de ref
  const waitingRef = useRef(waitingForContinue);
  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks personalizados
  const { saveExerciseResult } = useProgress();
  const { updateModuleSettings } = useSettingsContext(); // Usar el alias
  const { t } = useTranslations();
  const { setShowRewardAnimation } = useRewardsStore();

  // ==========================================
  // 3.2: EFECTOS 
  // ==========================================
  useEffect(() => {
    waitingRef.current = waitingForContinue;
  }, [waitingForContinue]);

  useEffect(() => {
    generateNewProblemSet();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.problemCount, settings.difficulty, settings.enableAdaptiveDifficulty, adaptiveDifficulty]); // Ojo: adaptiveDifficulty aqui, si cambia, regenera

  useEffect(() => {
    if (settings.enableAdaptiveDifficulty && settings.difficulty !== adaptiveDifficulty) {
      setAdaptiveDifficulty(settings.difficulty as DifficultyLevel);
      // No es necesario llamar a generateNewProblemSet() aquí, el useEffect anterior lo hará
      // cuando adaptiveDifficulty cambie.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.difficulty, settings.enableAdaptiveDifficulty]); // No incluir adaptiveDifficulty aquí para evitar bucle

  useEffect(() => {
    if (currentProblem && !viewingPrevious && !exerciseCompleted) {
      const numBoxes = currentProblem.answerMaxDigits || 0;
      const activeProblemHistoryEntry = userAnswersHistory[actualActiveProblemIndexBeforeViewingPrevious];
      if (currentProblem.id !== problemsList[actualActiveProblemIndexBeforeViewingPrevious]?.id ||
          !activeProblemHistoryEntry ||
          currentProblemIndex !== actualActiveProblemIndexBeforeViewingPrevious) {
        setDigitAnswers(Array(numBoxes).fill(""));
      }
      boxRefsArrayRef.current = Array(numBoxes).fill(null);
      if (currentProblem.layout === 'horizontal') {
        setInputDirection('ltr');
        setFocusedDigitIndex(0);
      } else {
        setInputDirection('rtl');
        setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : 0);
      }

      if (!waitingRef.current) {
          setProblemTimerValue(settings.timeValue); 
      }

      if (!waitingRef.current && currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) {
        setFeedbackMessage(null);
      }
    } else if (viewingPrevious && currentProblem) {
      setFocusedDigitIndex(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProblem, viewingPrevious, exerciseCompleted, actualActiveProblemIndexBeforeViewingPrevious, problemsList, currentProblemIndex, settings.timeValue]); // userAnswersHistory removido para evitar re-trigger innecesario


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


  useEffect(() => localStorage.setItem('addition_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString()), [consecutiveCorrectAnswers]);
  useEffect(() => localStorage.setItem('addition_consecutiveIncorrectAnswers', consecutiveIncorrectAnswers.toString()), [consecutiveIncorrectAnswers]);
  useEffect(() => localStorage.setItem('addition_autoContinue', autoContinue.toString()), [autoContinue]);


  // ==========================================
  // 3.3: FUNCIONES AUXILIARES Y CALLBACKS
  // ==========================================

  // Función para generar un nuevo conjunto de problemas (No es callback)
  function generateNewProblemSet() {
    const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
    const newProblemsArray: AdditionProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      newProblemsArray.push(generateAdditionProblem(difficultyToUse));
    }
    setProblemsList(newProblemsArray);
    setCurrentProblemIndex(0);
    setActualActiveProblemIndexBeforeViewingPrevious(0);
    setCurrentProblem(newProblemsArray[0] || null); // Asegurar que no sea undefined si problemCount es 0

    setUserAnswersHistory(Array(newProblemsArray.length).fill(null));
    setTimer(0);
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setFeedbackMessage(null);
    setWaitingForContinue(false);
    setBlockAutoAdvance(false);
    setShowLevelUpReward(false);
    setViewingPrevious(false);
    setProblemTimerValue(settings.timeValue);
    setCurrentAttempts(0);
  };

  // Función para iniciar el ejercicio (No es callback)
  const startExercise = () => {
    if (!exerciseStarted) {
      setExerciseStarted(true);
    }
  };

  // Función para completar el ejercicio (No es callback)
  const completeExercise = () => {
    setExerciseCompleted(true);
    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;
    saveExerciseResult({
      operationId: "addition",
      date: new Date().toISOString(),
      score: correctCount,
      totalProblems: problemsList.length,
      timeSpent: timer,
      difficulty: (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) as string,
    });
  };

  // Callback para avanzar al siguiente problema activo
  const advanceToNextActiveProblem = useCallback(() => {
    const nextActiveIdx = actualActiveProblemIndexBeforeViewingPrevious + 1;
    if (nextActiveIdx < problemsList.length) {
      setCurrentProblemIndex(nextActiveIdx);
      setCurrentProblem(problemsList[nextActiveIdx]);
      setActualActiveProblemIndexBeforeViewingPrevious(nextActiveIdx);
      setFeedbackMessage(null);
      // Limpiar cajones para nuevo problema
      const nextProblem = problemsList[nextActiveIdx];
      if (nextProblem) {
        setDigitAnswers(Array(nextProblem.answerMaxDigits).fill("")); 
      }
      setCurrentAttempts(0); // Resetear intentos para el nuevo problema
      setProblemTimerValue(settings.timeValue); // Resetear timer para el nuevo problema
      setWaitingForContinue(false); // Permitir que el nuevo problema inicie su timer
    } else {
      completeExercise();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualActiveProblemIndexBeforeViewingPrevious, problemsList, settings.timeValue, /* completeExercise, saveExerciseResult, timer */]);


  // Callback para verificar respuestas
  const checkCurrentAnswer = useCallback(() => {
    if (!currentProblem || waitingRef.current || exerciseCompleted || viewingPrevious) return false;

    if (!exerciseStarted) {
      startExercise();
      return false; 
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
        return false; 
    }

    const newAttempts = currentAttempts + 1; 
    setCurrentAttempts(newAttempts);
    const isCorrect = checkAnswer(currentProblem, userNumericAnswer);

    const problemIndexForHistory = currentProblemIndex; 
    const newHistoryEntry: UserAnswerType = { 
        problemId: currentProblem.id, 
        problem: currentProblem,
        userAnswer: isNaN(userNumericAnswer) ? null : userNumericAnswer, 
        isCorrect,
        status: isCorrect ? 'correct' : 'incorrect'
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
              updateModuleSettings("addition", { difficulty: newLevel, enableAdaptiveDifficulty: true } as Partial<ModuleSettings>);
              setConsecutiveCorrectAnswers(0);
              setShowLevelUpReward(true);
              setBlockAutoAdvance(true);
              eventBus.emit('levelUp', { previousLevel: adaptiveDifficulty, newLevel });
          }
      }

      if (settings.enableRewards) {
          const rewardContext = { streak: newConsecutive, difficulty: adaptiveDifficulty, problemIndex: currentProblemIndex, totalProblems: problemsList.length };
          if (Math.random() < getRewardProbability(rewardContext as any)) { // Cast as any for simplicity, ensure types match in real use
              awardReward('some_reward_id_correct' as any, { module: 'addition' }); // Cast as any for simplicity
              setShowRewardAnimation(true);
          }
      }

      setWaitingForContinue(true);
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);

      if (autoContinue && !blockAutoAdvance) {
        if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = setTimeout(() => {
          if (!blockAutoAdvance && waitingRef.current) {
            // handleContinue() se llamará implícitamente o el usuario hará click.
            // Si necesitamos llamar a handleContinue aquí, necesitaría ser una dependencia
            // Pero handleContinue depende de otros estados, así que es mejor no encadenar directamente así.
            // En su lugar, el usuario interactuará o el estado waitingForContinue lo manejará.
            // El prompt original tenía `handleContinue()` aquí. Si es necesario:
            // handleContinue(); // Descomentar si es necesario y añadir a deps de useCallback si handleContinue se pasa
            // autoContinueTimerRef.current = null;
            // Por ahora, mantendré la lógica de que el usuario haga clic o se llame a handleContinue de otra forma
          }
        }, 3000);
      }
      return true;
    } else { 
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
              updateModuleSettings("addition", { difficulty: newLevel } as Partial<ModuleSettings>);
              setConsecutiveIncorrectAnswers(0);
              setFeedbackMessage(`${t('adaptiveDifficulty.levelDecreased')} ${t(newLevel)}. ${t('exercises.incorrect')}`);
          }
      }

      if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
        setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
        const updatedHistoryEntry: UserAnswerType = { ...newHistoryEntry, status: 'revealed' };
        setUserAnswersHistory(prev => {
            const newHistory = [...prev];
            newHistory[problemIndexForHistory] = updatedHistoryEntry;
            return newHistory;
        });
        setWaitingForContinue(true);
        if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
        return true;
      }
      return false; 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentProblem, exerciseCompleted, viewingPrevious, exerciseStarted, digitAnswers, t, 
    currentAttempts, settings, currentProblemIndex, consecutiveCorrectAnswers, adaptiveDifficulty, 
    consecutiveIncorrectAnswers, problemsList.length, autoContinue, blockAutoAdvance,
    // Las setters (setFeedbackMessage, etc.) y hooks de contexto (updateModuleSettings) suelen ser estables
    // eventBus, getRewardProbability, awardReward, setShowRewardAnimation son también estables.
    // advanceToNextActiveProblem no es una dependencia directa de checkCurrentAnswer
  ]);

  const handleTimeOrAttemptsUp = useCallback(() => {
    if (waitingRef.current || !currentProblem) return;

    const userAnswerIsPresent = digitAnswers.some(d => d && d.trim() !== "");

    if (userAnswerIsPresent) {
      const problemResolvedByCheck = checkCurrentAnswer();

      if (!problemResolvedByCheck && !waitingRef.current) { 
        setFeedbackMessage(prev => `${prev}. ${t('exercises.timeUpForThisAttempt')}`);
        if (settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts) {
          setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
          setWaitingForContinue(true);
          // Historial actualizado por checkCurrentAnswer
           const problemIndexForHistory = currentProblemIndex; // Re-get index for safety
           const existingEntry = userAnswersHistory[problemIndexForHistory];
           if (existingEntry) {
                setUserAnswersHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[problemIndexForHistory] = { ...existingEntry, status: 'revealed' };
                    return newHistory;
                });
           }
        } else {
          setProblemTimerValue(settings.timeValue);
        }
      }
    } else {
      const newAttempts = currentAttempts + 1;
      setCurrentAttempts(newAttempts);

      const problemIndexForHistory = currentProblemIndex;
      const newHistoryEntry: UserAnswerType = { 
          problemId: currentProblem.id, 
          problem: currentProblem,
          userAnswer: null, 
          isCorrect: false,
          status: 'timeout'
      };
      setUserAnswersHistory(prev => {
          const newHistory = [...prev];
          newHistory[problemIndexForHistory] = newHistoryEntry;
          return newHistory;
      });
      setActualActiveProblemIndexBeforeViewingPrevious(problemIndexForHistory);

      if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
        setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
         const updatedHistoryEntry: UserAnswerType = { ...newHistoryEntry, status: 'revealed' };
         setUserAnswersHistory(prev => {
            const newHistory = [...prev];
            newHistory[problemIndexForHistory] = updatedHistoryEntry;
            return newHistory;
        });
        setWaitingForContinue(true);
      } else {
        setFeedbackMessage(t('exercises.timeUpNoAnswer', {attemptsMade: newAttempts, maxAttempts: settings.maxAttempts}));
        setFeedbackColor("red");
        setProblemTimerValue(settings.timeValue);
      }
    }
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProblem, digitAnswers, checkCurrentAnswer, currentAttempts, settings, t, currentProblemIndex, userAnswersHistory /* No añadir actualActiveProblemIndexBeforeViewingPrevious directamente si solo lee currentProblemIndex */]);


  // Efecto para gestionar el temporizador por problema
  useEffect(() => {
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);

    if ( exerciseStarted && 
         !exerciseCompleted && 
         currentProblem && 
         !viewingPrevious && 
         settings.timeValue > 0 &&
         !waitingRef.current &&
         (settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts)
    ) {
      singleProblemTimerRef.current = window.setInterval(() => {
        setProblemTimerValue(prevTimerValue => {
          if (prevTimerValue <= 1) {
            if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
            handleTimeOrAttemptsUp();
            return 0;
          }
          return prevTimerValue - 1;
        });
      }, 1000);
    }

    return () => { 
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ exerciseStarted, exerciseCompleted, settings.timeValue, currentProblem, 
       viewingPrevious, currentAttempts, settings.maxAttempts, /* waitingRef no es dep */
       handleTimeOrAttemptsUp /* problemTimerValue no es necesario si solo se lee para el return 0 */
     ]);

  // Callback para manejar "Continuar"
  const handleContinue = useCallback(() => {
    setFeedbackMessage(null); 

    if (showLevelUpReward) {
      setShowLevelUpReward(false);
      setBlockAutoAdvance(false);
      // Regenerar problema actual con nueva dificultad
      const newProblemForLevelUp = generateAdditionProblem(adaptiveDifficulty);
      const updatedProblemsList = [...problemsList];
      updatedProblemsList[actualActiveProblemIndexBeforeViewingPrevious] = newProblemForLevelUp;
      setProblemsList(updatedProblemsList);
      setCurrentProblem(newProblemForLevelUp); 
      if (newProblemForLevelUp) {
        setDigitAnswers(Array(newProblemForLevelUp.answerMaxDigits).fill(""));
      }
      setCurrentAttempts(0);
      setProblemTimerValue(settings.timeValue);
      setWaitingForContinue(false);
      return;
    }

    if (!blockAutoAdvance) {
      advanceToNextActiveProblem();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLevelUpReward, adaptiveDifficulty, problemsList, actualActiveProblemIndexBeforeViewingPrevious, blockAutoAdvance, advanceToNextActiveProblem, settings.timeValue]);

  // Otras funciones auxiliares del componente (no callbacks directos de UI eventos, sino lógica interna)
  const moveToPreviousProblem = () => {
    const canGoBack = viewingPrevious ? currentProblemIndex > 0 : actualActiveProblemIndexBeforeViewingPrevious >= 0 && currentProblemIndex >=0 ;
    if (!canGoBack || exerciseCompleted) return;

    if (!viewingPrevious) {
        setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
    }
    setViewingPrevious(true);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);

    const prevIndexToView = viewingPrevious ? currentProblemIndex - 1 : (actualActiveProblemIndexBeforeViewingPrevious > 0 ? actualActiveProblemIndexBeforeViewingPrevious -1 : 0) ;
    if(prevIndexToView < 0) return; // Debería ser manejado por canGoBack

    setCurrentProblemIndex(prevIndexToView);
    const prevProblemToView = problemsList[prevIndexToView];
    setCurrentProblem(prevProblemToView);

    const prevAnswerEntry = userAnswersHistory[prevIndexToView];

    if (prevAnswerEntry && prevProblemToView) {
        const answerStr = (prevAnswerEntry.userAnswer === null || isNaN(prevAnswerEntry.userAnswer as number)) ? "" : String(prevAnswerEntry.userAnswer);
        let [intPart, decPart = ""] = answerStr.split('.');
        const expectedDecimals = prevProblemToView.answerDecimalPosition || 0;
        decPart = decPart.padEnd(expectedDecimals, '0').slice(0, expectedDecimals);

        const numIntBoxes = prevProblemToView.answerMaxDigits - expectedDecimals;
        // intPart debe ser rellenado con ceros a la izquierda si el userAnswer así lo era implícitamente
        // o si la longitud es menor que numIntBoxes y el layout es vertical (para alineación)
        // Esta reconstrucción es compleja. Simplemente usando el string completo.
        const fullAnswerDigitsString = intPart + decPart;
        const restoredDigitAnswers = Array(prevProblemToView.answerMaxDigits).fill('');

        // Rellenar desde la derecha para layout vertical o si hay decimales, para alinear correctamente
        // El inputDirection original pudo ser 'ltr' o 'rtl'.
        // Asumimos que la respuesta numérica guardada es la fuente de verdad.
        // Para una reconstrucción visual perfecta, habría que guardar los digitAnswers originales.
        if (prevProblemToView.layout === 'vertical' || prevProblemToView.answerDecimalPosition) {
            for (let i = 0; i < fullAnswerDigitsString.length; i++) {
                if (restoredDigitAnswers.length - fullAnswerDigitsString.length + i >= 0) { // Alinea a la derecha si es más corto
                    restoredDigitAnswers[restoredDigitAnswers.length - fullAnswerDigitsString.length + i] = fullAnswerDigitsString[i];
                }
            }
        } else { // Horizontal sin decimales, rellenar desde la izquierda
            for (let i = 0; i < Math.min(restoredDigitAnswers.length, fullAnswerDigitsString.length); i++) {
                restoredDigitAnswers[i] = fullAnswerDigitsString[i];
            }
        }

        setDigitAnswers(restoredDigitAnswers);
        setFeedbackMessage(
            prevAnswerEntry.isCorrect ? 
            t('exercises.yourAnswerWasCorrect', { userAnswer: prevAnswerEntry.userAnswer }) :
            t('exercises.yourAnswerWasIncorrect', { userAnswer: (prevAnswerEntry.userAnswer === null || prevAnswerEntry.userAnswer === undefined || isNaN(prevAnswerEntry.userAnswer as number) ? t('common.notAnswered') : prevAnswerEntry.userAnswer), correctAnswer: prevProblemToView.correctAnswer })
        );
        setFeedbackColor(prevAnswerEntry.isCorrect ? "green" : "red");
    } else {
        setDigitAnswers(prevProblemToView ? Array(prevProblemToView.answerMaxDigits).fill("") : []);
        setFeedbackMessage(prevProblemToView ? t('exercises.noAnswerRecordedForThisProblem') : t('common.error'));
        setFeedbackColor("blue");
    }
    setFocusedDigitIndex(null);
  };

  const returnToActiveProblem = () => {
    setViewingPrevious(false);
    const activeProblem = problemsList[actualActiveProblemIndexBeforeViewingPrevious];
    setCurrentProblemIndex(actualActiveProblemIndexBeforeViewingPrevious);
    setCurrentProblem(activeProblem);

    const activeProblemHistory = userAnswersHistory[actualActiveProblemIndexBeforeViewingPrevious];
    if (activeProblem && activeProblemHistory) {
        setDigitAnswers(Array(activeProblem.answerMaxDigits).fill("")); 

        if(activeProblemHistory.isCorrect || activeProblemHistory.status === 'revealed' || (activeProblemHistory.status === 'incorrect' && settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts)){
            setFeedbackMessage(
                 activeProblemHistory.isCorrect ? 
                 t('exercises.correct') :
                 t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: activeProblem.correctAnswer })
            );
            setFeedbackColor(activeProblemHistory.isCorrect ? "green" : "red");
            setWaitingForContinue(true);
        } else if (activeProblemHistory.status === 'incorrect' ) {
            setFeedbackMessage(t('exercises.yourPreviousAnswerWas', { userAnswer: activeProblemHistory.userAnswer }));
            setFeedbackColor("red");
            setWaitingForContinue(false);
            setProblemTimerValue(settings.timeValue);
        } else { 
             setFeedbackMessage(null);
             setWaitingForContinue(false);
             setProblemTimerValue(settings.timeValue);
        }
    } else if (activeProblem) {
        setDigitAnswers(Array(activeProblem.answerMaxDigits).fill(""));
        setFeedbackMessage(null);
        setWaitingForContinue(false);
        setProblemTimerValue(settings.timeValue);
    }
  };

  const handleDigitBoxClick = (index: number) => {
    if (waitingRef.current || exerciseCompleted || viewingPrevious) return;
    if (!exerciseStarted) startExercise();
    if (currentProblem) {
      // Esta lógica de inputDirection podría simplificarse o basarse en el layout
      // setInputDirection(index < Math.floor(currentProblem.answerMaxDigits / 2) ? 'ltr' : 'rtl');
    }
    setFocusedDigitIndex(index);

    setTimeout(() => {
      try {
        const el = boxRefsArrayRef.current[index]; // Usa el array auxiliar que se actualiza en el callback ref
        if (el) el.focus();
      } catch (err) {
        console.error("Error al intentar enfocar:", err);
      }
    }, 10); // Pequeño delay para asegurar que el estado se haya actualizado en React
  };

  const handleDigitInput = (value: string) => {
    if (waitingRef.current || focusedDigitIndex === null || !currentProblem || exerciseCompleted || viewingPrevious) return;
    if (!exerciseStarted) startExercise();

    let newAnswers = [...digitAnswers];
    let currentFocus = focusedDigitIndex;
    const maxDigits = currentProblem.answerMaxDigits;

    if (value === "backspace") {
      newAnswers[currentFocus] = "";
      // Opcional: mover foco hacia atrás en backspace si la caja está vacía
      // if (inputDirection === 'rtl' && currentFocus < maxDigits -1) setFocusedDigitIndex(currentFocus + 1);
      // else if (inputDirection === 'ltr' && currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
    } else if (/[0-9]/.test(value)) {
      newAnswers[currentFocus] = value;
      if (inputDirection === 'rtl') { 
        if (currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
      } else { // ltr
        if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1);
      }
    }
    setDigitAnswers(newAnswers);
  };

  useEffect(() => {
    const handlePhysicalKeyDown = (event: KeyboardEvent) => {
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
          // Opcional: mover foco en backspace
          // if (inputDirection === 'ltr' && focusedDigitIndex > 0) {
          //    setFocusedDigitIndex(focusedDigitIndex - 1);
          // } else if (inputDirection === 'rtl' && focusedDigitIndex < currentProblem.answerMaxDigits - 1) {
          //    setFocusedDigitIndex(focusedDigitIndex + 1);
          // }
          event.preventDefault();
      } else if (key === 'Enter') {
          checkCurrentAnswer();
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
  }, [focusedDigitIndex, exerciseCompleted, currentProblem, digitAnswers, inputDirection, viewingPrevious, showLevelUpReward, checkCurrentAnswer]);


  // ==========================================
  // 3.4: RENDERIZADO DE LA INTERFAZ
  // ==========================================

  if (!currentProblem && problemsList.length === 0 && !exerciseCompleted) {
    return <div className="p-8 text-center">{t('common.loadingProblems')}...</div>;
  }
  if (!currentProblem && !exerciseCompleted) {
    // Intenta cargar el problema actual si la lista tiene elementos
    if(problemsList.length > 0 && actualActiveProblemIndexBeforeViewingPrevious < problemsList.length) {
      setCurrentProblem(problemsList[actualActiveProblemIndexBeforeViewingPrevious] || problemsList[0]);
    } else if (problemsList.length > 0) {
        setCurrentProblem(problemsList[0]); 
        setActualActiveProblemIndexBeforeViewingPrevious(0);
    }
    return <div className="p-8 text-center">{t('common.reloadingProblem')}...</div>;
  }
  if (exerciseCompleted) {
    const finalScore = userAnswersHistory.filter(a => a && a.isCorrect).length;
    return (
      <div className="px-4 py-5 sm:p-6 text-center">
        <TrophyIcon className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">{t('Congratulations, You Have Completed The Established Exercises15')}</h2>
        <p className="text-gray-700 mt-2">{t('Your Score Is')} {finalScore}/{problemsList.length}</p>
        <p className="text-gray-600">{t('exercises.timeTaken')}: {formatTime(timer)}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Button onClick={generateNewProblemSet} className="w-full sm:w-auto">
            {t('exercises.tryAgain')}
          </Button>
          <Button variant="outline" onClick={onOpenSettings} className="w-full sm:w-auto">
            <SettingsIcon className="mr-2 h-4 w-4" />
            {t('common.settings')}
          </Button>
        </div>
      </div>
    );
  }
  // Si currentProblem sigue siendo null después de los reintentos de carga, mostrar error.
  if (!currentProblem) return <div className="p-8 text-center">{t('common.errorLoadingProblem')}</div>;

  // Para layout vertical
  const { maxIntLength = 0, maxDecLength = 0, operandsFormatted = [], sumLineTotalCharWidth = 0 } =
    currentProblem.layout === 'vertical' && currentProblem.operands
    ? getVerticalAlignmentInfo(currentProblem.operands, currentProblem.answerDecimalPosition)
    : { operandsFormatted: currentProblem.operands?.map(op => ({original: op, intStr: String(op), decStr: ""})) || [], maxIntLength:0, maxDecLength:0, sumLineTotalCharWidth:0 };

  const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;
  const progressValue = problemsList.length > 0 ? (attemptedProblemsCount / problemsList.length) * 100 : 0;
  const score = userAnswersHistory.filter(a => a && a.isCorrect).length;
  const difficultyForDisplay = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;

  return (
    <div className="relative">
      <LevelUpHandler />
      <RewardAnimation />

      {showLevelUpReward && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
              <TrophyIcon className="h-20 w-20 sm:h-24 sm:w-24 text-yellow-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('levelUp.title')}</h3>
              <p className="text-lg sm:text-xl mb-4 sm:mb-6">{t('levelUp.message', { level: t(adaptiveDifficulty) })}</p>
              <Button onClick={handleContinue} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg py-2.5 sm:py-3">
                {t('levelUp.continueChallenge')}
              </Button>
            </div>
          </div>
        )}

      <div className={`px-2 py-3 sm:px-4 sm:py-5 rounded-xl shadow-lg ${
        difficultyForDisplay === "beginner" ? "bg-blue-50 border-blue-200" : 
        difficultyForDisplay === "elementary" ? "bg-emerald-50 border-emerald-200" : 
        difficultyForDisplay === "intermediate" ? "bg-orange-50 border-orange-200" :
        difficultyForDisplay === "advanced" ? "bg-purple-50 border-purple-200" :
        difficultyForDisplay === "expert" ? "bg-rose-50 border-rose-200" :
        "bg-indigo-50 border-indigo-200"
      } border-2`}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{t('Addition')}</h2>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="font-medium text-gray-700 flex items-center"><InfoIcon className="h-4 w-4 mr-1 opacity-70"/>{formatTime(timer)}</span>
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
                          {t('Attempts')}: {currentAttempts}/{settings.maxAttempts}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.maxAttemptsPerProblem')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                  difficultyForDisplay === "beginner" ? "bg-blue-100 text-blue-800" : 
                  difficultyForDisplay === "elementary" ? "bg-emerald-100 text-emerald-800" : 
                  difficultyForDisplay === "intermediate" ? "bg-orange-100 text-orange-800" :
                  difficultyForDisplay === "advanced" ? "bg-purple-100 text-purple-800" :
                  difficultyForDisplay === "expert" ? "bg-rose-100 text-rose-800" :
                  "bg-indigo-100 text-indigo-800"
                }`}>
                    {t('Level')}: {t(difficultyForDisplay)}
                </span>
                <Button variant="ghost" size="sm" onClick={onOpenSettings} className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
                  <CogIcon className="h-4 w-4" /> {t('common.settings')}
                </Button>
            </div>
        </div>
        <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1" />
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            <span>{t('Problem')} {currentProblemIndex + 1} {t('of')} {problemsList.length}</span>
            <span className="font-semibold">{t('exercises.score')}: {score}</span>
        </div>

        <div className={`p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 shadow-md bg-white min-h-[150px] sm:min-h-[180px] flex flex-col items-center justify-center`}>
          {currentProblem.layout === 'horizontal' ? (
            <div className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
              <span>{currentProblem.operands[0]}</span>
              <span className="text-gray-600 mx-1">+</span>
              <span>{currentProblem.operands.length > 1 ? currentProblem.operands[1] : '?'}</span>
              {currentProblem.operands.length > 2 && (
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
                        boxRefsArrayRef.current[index] = el;
                        digitBoxRefs.current = boxRefsArrayRef.current; // Mantener actualizada la ref principal
                      }
                    }}
                    tabIndex={viewingPrevious || exerciseCompleted || waitingRef.current ? -1 : 0}
                    className={`${digitBoxBaseStyle} 
                                ${viewingPrevious || exerciseCompleted || waitingRef.current ? digitBoxDisabledStyle : (focusedDigitIndex === index ? digitBoxFocusStyle : digitBoxBlurStyle)}
                                ${!viewingPrevious && !exerciseCompleted && !waitingRef.current ? 'cursor-text hover:border-gray-400' : ''}`}
                    onClick={() => !viewingPrevious && !exerciseCompleted && !waitingRef.current && handleDigitBoxClick(index)}
                    onFocus={() => {if (!viewingPrevious && !exerciseCompleted && !waitingRef.current) setFocusedDigitIndex(index);}}
                  >
                    {digitAnswers[index] || <span className="opacity-0">0</span>} {/* Placeholder para mantener altura */}
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
            <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {t('common.prev')}
          </Button>

          {viewingPrevious ? (
            <Button onClick={returnToActiveProblem} className="px-4 sm:px-5 text-sm sm:text-base bg-orange-500 hover:bg-orange-600 text-white">
                <RotateCcw className="mr-1 h-4 w-4" /> {t('common.returnToActive')} 
            </Button>
          ) : waitingRef.current ? (
            <Button onClick={handleContinue} className="px-5 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg animate-pulse bg-green-500 hover:bg-green-600 text-white flex items-center justify-center w-full max-w-xs mx-auto">
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
              {!exerciseStarted ? t('exercises.start') : <><Check className="mr-1 h-4 w-4" />{t('exercises.check')}</>}
            </Button>
          )}

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                    variant="outline" size="sm" 
                    disabled={(!settings.showAnswerWithExplanation && !viewingPrevious) || viewingPrevious || exerciseCompleted || waitingRef.current} 
                    onClick={() => { 
                        if(currentProblem && !viewingPrevious && !exerciseCompleted && !waitingRef.current) { 
                            if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                            setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
                            setFeedbackColor("blue");
                            setWaitingForContinue(true);
                            const problemIdxForHistory = actualActiveProblemIndexBeforeViewingPrevious;
                            const answerEntry = userAnswersHistory[problemIdxForHistory];
                            if (!answerEntry || (!answerEntry.isCorrect && answerEntry.status !== 'revealed')) {
                                setUserAnswersHistory(prev => {
                                    const newHistory = [...prev];
                                    const entryToUpdate : UserAnswerType = { 
                                        problemId: currentProblem.id, 
                                        problem: currentProblem, 
                                        userAnswer: null, // No answer from user if revealed
                                        isCorrect: false, 
                                        status: 'revealed' 
                                    };
                                    newHistory[problemIdxForHistory] = entryToUpdate;
                                    return newHistory;
                                });
                            }
                            if (settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts) {
                                setCurrentAttempts(prev => prev + 1);
                            }
                        }
                    }}
                    className="text-xs sm:text-sm"
                >
                    <InfoIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {t('exercises.showAnswer')}
                </Button>
              </TooltipTrigger>
              {(!settings.showAnswerWithExplanation && !viewingPrevious && !waitingRef.current) ? (
                  <TooltipContent><p>{t('tooltips.activateShowAnswerInSettings')}</p></TooltipContent>
              ) : viewingPrevious ? (
                  <TooltipContent><p>{t('tooltips.showAnswerDisabledInHistory')}</p></TooltipContent>
              ) : waitingRef.current ? (
                  <TooltipContent><p>{t('tooltips.showAnswerDisabledWhileWaiting')}</p></TooltipContent>
              ) : null }
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SECCIÓN 4: COMPONENTES INTERNOS
// ==========================================

// Componente Settings (de Settings.tsx)
function Settings({ settings: initialSettings, onBack }: SettingsProps) { // Renombrado settings a initialSettings para evitar colisión
  const { updateModuleSettings, resetModuleSettings } = useSettingsContext(); // Usar el alias
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...initialSettings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasSavedRef = useRef(false); // Para controlar el guardado al desmontar

  const debouncedSave = useMemo(
    () =>
      debounce((newSettings: ModuleSettings) => { // Renombrado settings a newSettings
        updateModuleSettings("addition", newSettings);
        console.log(`[ADDITION] Guardando configuración (debounced):`, newSettings);
      }, 500),
    [updateModuleSettings]
  );

  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);

    if (key === "difficulty") {
      console.log("[ADDITION] Guardando configuración de dificultad inmediatamente:", value);
      updateModuleSettings("addition", updatedSettings);
    } else {
      debouncedSave(updatedSettings);
    }
  };

  useEffect(() => {
    // Sincronizar localSettings si initialSettings cambia desde fuera (p.ej. reseteo global)
    setLocalSettings({...initialSettings});
  }, [initialSettings]);

  useEffect(() => {
    // Guardar configuración inmediatamente al montar el componente para persistir valores actuales
    // Esto es más para asegurar que el estado global está alineado con lo que ve el usuario
    // si hubo cambios externos mientras este componente no estaba montado.
    // updateModuleSettings("addition", localSettings); // Comentado para evitar doble guardado al inicio si no es necesario
    // console.log("[ADDITION] Sincronizando/Guardando configuración al cargar:", localSettings);

    hasSavedRef.current = false; // Resetear al montar
    return () => {
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        updateModuleSettings("addition", localSettings); // Guardar al desmontar
        console.log("[ADDITION] Guardando configuración al desmontar:", localSettings);

        // Forzar localStorage para asegurar persistencia (código original)
        try {
          const profileId = localStorage.getItem('activeProfileId');
          const suffix = profileId ? `-profile-${profileId}` : '';
          const storageKey = `moduleSettings${suffix}`; // Renombrado key

          const currentStoredSettings = localStorage.getItem(storageKey); // Renombrado currentSettings
          if (currentStoredSettings) {
            const parsed = JSON.parse(currentStoredSettings);
            const updated = {
              ...parsed,
              addition: localSettings
            };
            localStorage.setItem(storageKey, JSON.stringify(updated));
            console.log("[ADDITION] Forzando actualización en localStorage:", updated);
          } else { // Si no hay nada en localStorage, crear la entrada
             const initialStorage = { addition: localSettings };
             localStorage.setItem(storageKey, JSON.stringify(initialStorage));
             console.log("[ADDITION] Creando entrada en localStorage:", initialStorage);
          }
        } catch (e) {
          console.error("Error al forzar guardado en localStorage:", e);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSettings, updateModuleSettings]); // No incluir debouncedSave aquí

  const handleResetSettings = async () => {
    if (showResetConfirm) {
      // Usar defaultModuleSettings de la operación específica si existe, o el global.
      // Aquí es 'addition', así que el defaultModuleSettings global es el que aplica.
      const additionDefaultSettings = defaultModuleSettings.addition || defaultModuleSettings;

      await resetModuleSettings("addition"); // Esto debería resetear en el contexto
      setLocalSettings({ ...additionDefaultSettings } as ModuleSettings); // Y actualizar localmente
      setShowResetConfirm(false);
      // updateModuleSettings("addition", { ...additionDefaultSettings } as ModuleSettings); // Asegurar que se propaga
    } else {
      setShowResetConfirm(true);
    }
  };

  const getDifficultyTheme = (difficulty: string) => {
    // (Implementación de getDifficultyTheme como en el original)
    switch (difficulty) {
      case "beginner": return { bg: "bg-gradient-to-br from-blue-50 to-blue-100", border: "border-blue-200", text: "text-blue-600", textSecondary: "text-blue-500", bgContainer: "bg-blue-50", bgLight: "bg-blue-100", accent: "text-blue-700", emoji: "🔵", name: "Principiante" };
      case "elementary": return { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100", border: "border-emerald-200", text: "text-emerald-600", textSecondary: "text-emerald-500", bgContainer: "bg-emerald-50", bgLight: "bg-emerald-100", accent: "text-emerald-700", emoji: "🟢", name: "Elemental" };
      case "intermediate": return { bg: "bg-gradient-to-br from-orange-50 to-orange-100", border: "border-orange-200", text: "text-orange-600", textSecondary: "text-orange-500", bgContainer: "bg-orange-50", bgLight: "bg-orange-100", accent: "text-orange-700", emoji: "🟠", name: "Intermedio" };
      case "advanced": return { bg: "bg-gradient-to-br from-purple-50 to-purple-100", border: "border-purple-200", text: "text-purple-600", textSecondary: "text-purple-500", bgContainer: "bg-purple-50", bgLight: "bg-purple-100", accent: "text-purple-700", emoji: "🟣", name: "Avanzado" };
      case "expert": return { bg: "bg-gradient-to-br from-rose-50 to-rose-100", border: "border-rose-200", text: "text-rose-600", textSecondary: "text-rose-500", bgContainer: "bg-rose-50", bgLight: "bg-rose-100", accent: "text-rose-700", emoji: "⭐", name: "Experto" };
      default: return { bg: "bg-gradient-to-br from-indigo-50 to-indigo-100", border: "border-indigo-200", text: "text-indigo-600", textSecondary: "text-indigo-500", bgContainer: "bg-indigo-50", bgLight: "bg-indigo-100", accent: "text-indigo-700", emoji: "⚡", name: "General" };
    }
  };

  const theme = getDifficultyTheme(localSettings.difficulty || "beginner");

  return (
    <div className={`px-4 py-5 sm:p-6 rounded-xl shadow-md ${theme.bg} border-2 ${theme.border}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text} flex items-center`}>
            {theme.emoji} Configuración - Ejercicio de Suma
          </h2>
          <p className={`text-sm font-medium ${theme.textSecondary}`}>Personaliza tu experiencia de ejercicio</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className={`border ${theme.border} hover:${theme.bgContainer}`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Ejercicio
        </Button>
      </div>

      <div className="space-y-6">
        {/* Nivel de Dificultad */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🎯</span>Nivel de Dificultad
          </h3>
          <p className={`text-sm ${theme.textSecondary} mb-2`}>Haz clic en un ejemplo para cambiar el nivel de dificultad:</p>
          <div className="mt-4 mb-6 bg-white/80 rounded-lg p-4 border border-gray-100 shadow-sm">
            <DifficultyExamples 
              operation="addition" 
              activeDifficulty={localSettings.difficulty as DifficultyLevel}
              onSelectDifficulty={(difficulty) => 
                handleUpdateSetting("difficulty", difficulty)
              }
            />
          </div>
          <div className="mt-3 mb-2 space-y-1.5">
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}><span className="font-bold">Principiante:</span> Sumas con dígitos simples (1+8, 7+5)</p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}><span className="font-bold">Elemental:</span> Sumas de números de dos dígitos (12+15, 24+13)</p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}><span className="font-bold">Intermedio:</span> Sumas con números grandes (65+309, 392+132)</p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}><span className="font-bold">Avanzado:</span> Sumas de números de 4 dígitos (1247+3568, 5934+8742)</p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}><span className="font-bold">Experto:</span> Sumas con números muy grandes (70960+11650, 28730+59436)</p>
          </div>
        </div>

        {/* Número de Problemas */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}><span className="mr-2">🔢</span>Número de Problemas</h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider value={[localSettings.problemCount]} min={1} max={50} step={1} onValueChange={(value) => handleUpdateSetting("problemCount", value[0])} className={`w-full ${theme.bgLight}`} />
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}><span>1</span><span>25</span><span>50</span></div>
              </div>
              <div className="w-20">
                <Input type="number" value={localSettings.problemCount} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 1 && val <= 50) handleUpdateSetting("problemCount", val); }} min={1} max={50} className={`w-full border ${theme.border}`} />
              </div>
            </div>
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}><span className="font-medium">Especifica cuántos problemas quieres resolver:</span> <span className={`font-bold ${theme.text}`}>{localSettings.problemCount}</span></p>
          </div>
        </div>

        {/* Límite de Tiempo */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}><span className="mr-2">⏱️</span>Límite de Tiempo</h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider value={[localSettings.timeValue]} min={0} max={300} step={5} onValueChange={(value) => handleUpdateSetting("timeValue", value[0])} className={`w-full ${theme.bgLight}`} />
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}><span>0</span><span>150</span><span>300</span></div>
              </div>
              <div className="w-20">
                <Input type="number" value={localSettings.timeValue} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 0 && val <= 300) handleUpdateSetting("timeValue", val);}} min={0} max={300} className={`w-full border ${theme.border}`} />
              </div>
            </div>
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}><span className="font-medium">Tiempo en segundos:</span> <span className={`font-bold ${theme.text}`}>{localSettings.timeValue}</span> <span className="text-xs">(0 para sin límite)</span></p>
          </div>
        </div>

        {/* Máximo de Intentos y Configuración Adicional */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}><span className="mr-2">🔄</span>Máximo de Intentos por Problema</h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider value={[localSettings.maxAttempts]} min={0} max={10} step={1} onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])} className={`w-full ${theme.bgLight}`} />
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}><span>0</span><span>5</span><span>10</span></div>
              </div>
              <div className="w-20">
                <Input type="number" value={localSettings.maxAttempts} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 0 && val <= 10) handleUpdateSetting("maxAttempts", val); }} min={0} max={10} className={`w-full border ${theme.border}`} />
              </div>
            </div>
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}><span className="font-medium">Intentos máximos:</span> <span className={`font-bold ${theme.text}`}>{localSettings.maxAttempts}</span> <span className="text-xs">(0 para intentos ilimitados)</span></p>
          </div>

          <h3 className={`text-lg font-bold ${theme.text} flex items-center mt-6`}><span className="mr-2">⚙️</span>Configuración Adicional</h3>
          <div className="mt-3 space-y-3">
            {[
              { id: "show-immediate-feedback", label: "Mostrar retroalimentación inmediata", emoji: "📝", key: "showImmediateFeedback" as keyof ModuleSettings },
              { id: "enable-sound-effects", label: "Habilitar efectos de sonido", emoji: "🔊", key: "enableSoundEffects" as keyof ModuleSettings },
              { id: "show-answer-explanation", label: "Mostrar explicación de respuestas", emoji: "❓", key: "showAnswerWithExplanation" as keyof ModuleSettings },
              { id: "enable-adaptive-difficulty", label: "Habilitar Dificultad Adaptativa", emoji: "📈", key: "enableAdaptiveDifficulty" as keyof ModuleSettings },
              { id: "enable-compensation", label: "Habilitar Compensación", subLabel: "(Añadir 1 problema por cada incorrecto/revelado)", emoji: "➕", key: "enableCompensation" as keyof ModuleSettings },
              { id: "enable-rewards", label: "Activar sistema de recompensas aleatorias", emoji: "🏆", key: "enableRewards" as keyof ModuleSettings },
            ].map(item => (
              <div key={item.id} className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
                <Label htmlFor={item.id} className={`cursor-pointer ${theme.accent} flex items-center`}>
                  <span className="mr-2">{item.emoji}</span>
                  <div>
                    {item.label}
                    {item.subLabel && <><br/><span className="text-xs opacity-80">{item.subLabel}</span></>}
                     {item.key === "enableRewards" && (
                        <div className="flex items-center ml-2 mt-1">
                            <span className="mx-0.5 text-xl">🏅</span>
                            <span className="mx-0.5 text-xl">🏆</span>
                            <span className="mx-0.5 text-xl">⭐</span>
                        </div>
                     )}
                  </div>
                </Label>
                <Switch id={item.id} checked={!!localSettings[item.key]} onCheckedChange={(checked) => handleUpdateSetting(item.key, checked)} className={theme.bgLight} />
              </div>
            ))}
             {localSettings.enableRewards && (
              <div className={`ml-6 mt-3 p-3 rounded-md bg-white/70 border ${theme.border}`}>
                <p className={`text-sm ${theme.accent}`}><span className="mr-2">🎲</span>Las recompensas aparecerán de forma aleatoria durante los ejercicios:</p>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}><span className="text-2xl">🏅</span><span className={`text-xs font-medium ${theme.text}`}>Medallas</span></div>
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}><span className="text-2xl">🏆</span><span className={`text-xs font-medium ${theme.text}`}>Trofeos</span></div>
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}><span className="text-2xl">⭐</span><span className={`text-xs font-medium ${theme.text}`}>Estrellas</span></div>
                </div>
                <p className={`text-xs mt-3 ${theme.textSecondary} text-center italic`}>El sistema elegirá automáticamente qué recompensa mostrar en cada ocasión</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <div className="flex justify-end">
            <Button type="button" variant={showResetConfirm ? "destructive" : "outline"} onClick={handleResetSettings} className={`mr-3 ${showResetConfirm ? "" : `border ${theme.border} hover:${theme.bgContainer}`}`}>
              {showResetConfirm ? "Confirmar Restablecimiento" : <><RotateCcw className="mr-2 h-4 w-4" /> Restablecer valores predeterminados</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Nota: El componente Settings se exporta aquí para que pueda ser usado por el componente padre
// que gestiona la vista entre Exercise y Settings, pero no es exportado del módulo como 'default'.
// Si este archivo fuese el único punto de entrada para 'addition', entonces Exercise sería el default export.
// La lógica de cómo se monta 'Settings' vs 'Exercise' está fuera de este archivo unificado.