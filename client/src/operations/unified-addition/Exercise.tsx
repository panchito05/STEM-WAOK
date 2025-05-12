// Exercise.tsx - Módulo autocontenido de Addition
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSettings, ModuleSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';
import { useTranslations } from '@/hooks/use-translations';
import { useRewardsStore, awardReward, getRewardProbability } from '@/lib/rewards-system';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBarUI } from '@/components/ui/progress';
import { formatTime, debounce } from '@/lib/utils';
import { 
  Settings as SettingsIcon, ChevronLeft, ChevronRight, Check, Cog, Info, 
  Star, Award, Trophy, RotateCcw, ArrowLeft, AlertTriangle
} from 'lucide-react';
import { 
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider 
} from '@/components/ui/tooltip';
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { defaultModuleSettings } from '@/utils/operationComponents';
import DifficultyExamples from '@/components/DifficultyExamples';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

// ==========================================
// SECCIÓN 1: TIPOS Y INTERFACES
// ==========================================
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';
export type ExerciseLayout = 'horizontal' | 'vertical';

export interface Problem {
  id: string;
  operands: number[];
  num1?: number;
  num2?: number;
  correctAnswer: number;
  layout: ExerciseLayout;
  answerMaxDigits: number;
  answerDecimalPosition?: number;
  numberOfAnswerSlots?: number;
  difficulty?: DifficultyLevel;
  isCompensationProblem?: boolean;
}

export type AdditionProblem = Problem;

export interface UserAnswer {
  problemId: string;
  problem: Problem;
  userAnswerString?: string;
  userAnswer: number | any;
  isCorrect: boolean;
  status?: 'correct' | 'incorrect' | 'revealed' | 'timeout';
}

// ==========================================
// SECCIÓN 2: FUNCIONES UTILITARIAS
// ==========================================
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

export function generateAdditionProblem(
  difficulty: DifficultyLevel,
  isCompensationProblem: boolean = false
): AdditionProblem {
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
    operands = [getRandomInt(1, 5), getRandomInt(1, 5)];
  }

  const sum = operands.reduce((acc, val) => acc + val, 0);
  let effectiveMaxDecimalsInAnswer = problemMaxDecimals > 0 ? problemMaxDecimals : 0;
  const correctAnswer = parseFloat(sum.toFixed(effectiveMaxDecimalsInAnswer));
  const correctAnswerStr = correctAnswer.toFixed(effectiveMaxDecimalsInAnswer);
  const [integerPartOfSumStr, decimalPartOfSumStr = ""] = correctAnswerStr.split('.');
  const answerMaxDigits = integerPartOfSumStr.length + decimalPartOfSumStr.length;
  let answerDecimalPosition: number | undefined = decimalPartOfSumStr.length > 0 ? decimalPartOfSumStr.length : undefined;

  return {
    id,
    num1: operands[0],
    num2: operands.length > 1 ? operands[1] : 0,
    operands,
    correctAnswer,
    layout,
    answerMaxDigits,
    answerDecimalPosition,
    numberOfAnswerSlots: answerMaxDigits + (answerDecimalPosition !== undefined ? 1 : 0),
    difficulty,
    isCompensationProblem,
  };
}

function checkAnswer(problem: AdditionProblem, userAnswer: number): boolean {
  if (isNaN(userAnswer)) return false;
  const precisionForComparison = problem.answerDecimalPosition || 0;
  const factor = Math.pow(10, precisionForComparison);
  const roundedCorrectAnswer = Math.round(problem.correctAnswer * factor) / factor;
  const roundedUserAnswer = Math.round(userAnswer * factor) / factor;
  return roundedUserAnswer === roundedCorrectAnswer;
}

export function getVerticalAlignmentInfo(
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

function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const [problemsList, setProblemsList] = useState<AdditionProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<AdditionProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
  const digitBoxRefs = useRef<HTMLDivElement[]>([]);
  const boxRefsArrayRef = useRef<HTMLDivElement[]>([]);
  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswer[]>([]);
  const [timer, setTimer] = useState(0);
  const [problemTimerValue, setProblemTimerValue] = useState(settings?.timeValue || 0);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue" | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const waitingRef = useRef(waitingForContinue);
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
    return (settings?.difficulty as DifficultyLevel) || defaultModuleSettings.difficulty as DifficultyLevel;
  });
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveCorrectAnswers') || '0', 10));
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveIncorrectAnswers') || '0', 10));
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showLevelUpReward, setShowLevelUpReward] = useState(false);
  const [previousDifficulty, setPreviousDifficulty] = useState<DifficultyLevel | null>(null);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [rewardType, setRewardType] = useState<'medal' | 'trophy' | 'star'>('medal');
  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState<number>(0);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const soundEffectsRef = useRef<{
    correct: HTMLAudioElement | null;
    incorrect: HTMLAudioElement | null;
    levelUp: HTMLAudioElement | null;
    timeUp: HTMLAudioElement | null;
    reward: HTMLAudioElement | null;
  }>({
    correct: null,
    incorrect: null,
    levelUp: null,
    timeUp: null,
    reward: null
  });

  const { saveExerciseResult } = useProgress();
  const { updateModuleSettings } = useSettings();
  const { t } = useTranslations();
  const rewardsStore = useRewardsStore();

  useEffect(() => {
    if (settings?.enableSoundEffects) {
      try {
        soundEffectsRef.current = {
          correct: new Audio('/sounds/correct.mp3'),
          incorrect: new Audio('/sounds/incorrect.mp3'),
          levelUp: new Audio('/sounds/level-up.mp3'),
          timeUp: new Audio('/sounds/time-up.mp3'),
          reward: new Audio('/sounds/reward.mp3')
        };
        Object.values(soundEffectsRef.current).forEach(audio => {
          if (audio) {
            audio.load();
            audio.volume = 0.5;
          }
        });
        return () => {
          Object.values(soundEffectsRef.current).forEach(audio => {
            if (audio) {
              audio.pause();
              audio.src = '';
            }
          });
          soundEffectsRef.current = {
            correct: null,
            incorrect: null,
            levelUp: null,
            timeUp: null,
            reward: null
          };
        };
      } catch (error) {
        console.error('Error initializing sound effects:', error);
      }
    }
  }, [settings?.enableSoundEffects]);

  const playSound = useCallback((type: 'correct' | 'incorrect' | 'levelUp' | 'timeUp' | 'reward') => {
    if (settings?.enableSoundEffects && soundEffectsRef.current[type]) {
      try {
        const sound = soundEffectsRef.current[type];
        if (sound) {
          sound.currentTime = 0;
          sound.play().catch(e => console.error(Error playing ${type} sound:, e));
        }
      } catch (error) {
        console.error(Error playing ${type} sound:, error);
      }
    }
  }, [settings?.enableSoundEffects]);

  useEffect(() => {
    waitingRef.current = waitingForContinue;
  }, [waitingForContinue]);

  useEffect(() => {
    generateNewProblemSet();
  }, [settings?.problemCount, settings?.difficulty, settings?.enableAdaptiveDifficulty, adaptiveDifficulty]);

  useEffect(() => {
    if (settings?.enableAdaptiveDifficulty && settings?.difficulty !== adaptiveDifficulty) {
      setAdaptiveDifficulty(settings.difficulty as DifficultyLevel);
      generateNewProblemSet();
    }
  }, [settings?.difficulty, settings?.enableAdaptiveDifficulty, adaptiveDifficulty]);

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

  const addCompensationProblem = useCallback(() => {
    if (settings.enableCompensation && currentProblem && !currentProblem.isCompensationProblem) {
      const newProblem = generateAdditionProblem(adaptiveDifficulty, true);
      setProblemsList(prev => [...prev, newProblem]);
      setUserAnswersHistory(prev => [...prev, null]);
    }
  }, [settings.enableCompensation, currentProblem, adaptiveDifficulty]);

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
      userAnswerString = ${integerPart || '0'}.${decimalPart.padEnd(decPosInAnswer, '0')};
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
    const newHistoryEntry: UserAnswer = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer: userNumericAnswer,
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
      playSound('correct');
      const newConsecutive = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newConsecutive);
      setConsecutiveIncorrectAnswers(0);
      if (newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP && settings.enableAdaptiveDifficulty) {
        const difficultiesOrder = ["beginner", "elementary", "intermediate", "advanced", "expert"];
        const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
        if (currentLevelIdx < difficultiesOrder.length - 1) {
          const previousDifficultyTemp = adaptiveDifficulty; // Guardar el nivel anterior
          const newLevel = difficultiesOrder[currentLevelIdx + 1];
          setPreviousDifficulty(previousDifficultyTemp); // Guardar para mostrar en el modal
          setAdaptiveDifficulty(newLevel);
          updateModuleSettings("addition", { difficulty: newLevel, enableAdaptiveDifficulty: true });
          setConsecutiveCorrectAnswers(0);
          setShowLevelUpReward(true);
          setBlockAutoAdvance(true);
          playSound('levelUp');
          eventBus.emit('levelUp', {
            previousLevel: previousDifficultyTemp,
            newLevel,
            consecutiveCorrectAnswers: newConsecutive
          });
        }
      }
      if (settings.enableRewards) {
        const rewardContext = { streak: newConsecutive, difficulty: adaptiveDifficulty, problemIndex: currentProblemIndex, totalProblems: problemsList.length };
        if (Math.random() < getRewardProbability(rewardContext as any)) {
          const rewards = ['medal', 'trophy', 'star'] as const;
          const selectedReward = rewards[Math.floor(Math.random() * rewards.length)];
          setRewardType(selectedReward);
          awardReward(addition_${selectedReward} as any, {
            module: 'addition',
            difficulty: adaptiveDifficulty,
            score: calculatedScore
          });
          setShowRewardAnimation(true);
          playSound('reward');
        }
      }
      setWaitingForContinue(true);
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
      if (autoContinue && !blockAutoAdvance) {
        if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = setTimeout(() => {
          if (!blockAutoAdvance && waitingRef.current) {
            handleContinue();
            autoContinueTimerRef.current = null;
          }
        }, 3000);
      }
      return true;
    } else {
      setFeedbackMessage(t('exercises.incorrect'));
      setFeedbackColor("red");
      playSound('incorrect');
      const newConsecutiveInc = consecutiveIncorrectAnswers + 1;
      setConsecutiveIncorrectAnswers(newConsecutiveInc);
      setConsecutiveCorrectAnswers(0);
      if (settings.enableAdaptiveDifficulty && newConsecutiveInc >= 5) {
        const difficultiesOrder = ["beginner", "elementary", "intermediate", "advanced", "expert"];
        const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
        if (currentLevelIdx > 0) {
          const newLevel = difficultiesOrder[currentLevelIdx - 1];
          setAdaptiveDifficulty(newLevel);
          updateModuleSettings("addition", { difficulty: newLevel });
          setConsecutiveIncorrectAnswers(0);
          setFeedbackMessage(${t('adaptiveDifficulty.levelDecreased')} ${t(newLevel)}. ${t('exercises.incorrect')});
        }
      }
      if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
        setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
        const updatedHistoryEntry: UserAnswer = { ...newHistoryEntry, status: 'revealed' };
        setUserAnswersHistory(prev => {
          const newHistory = [...prev];
          newHistory[problemIndexForHistory] = updatedHistoryEntry;
          return newHistory;
        });
        setWaitingForContinue(true);
        if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
        addCompensationProblem();
        return true;
      }
      return false;
    }
  }, [currentProblem, exerciseCompleted, viewingPrevious, exerciseStarted, digitAnswers, t, currentAttempts, settings, currentProblemIndex, consecutiveCorrectAnswers, adaptiveDifficulty, consecutiveIncorrectAnswers, problemsList.length, autoContinue, blockAutoAdvance, playSound, addCompensationProblem]);

  const handleTimeOrAttemptsUp = useCallback(() => {
    if (waitingRef.current || !currentProblem) return;
    const userAnswerIsPresent = digitAnswers.some(d => d && d.trim() !== "");
    if (userAnswerIsPresent) {
      const problemResolvedByCheck = checkCurrentAnswer();
      if (!problemResolvedByCheck && !waitingRef.current) {
        playSound('timeUp');
        setFeedbackMessage(prev => ${prev}. ${t('exercises.timeUpForThisAttempt')});
        if (settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts) {
          setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
          setWaitingForContinue(true);
          addCompensationProblem();
        } else {
          setProblemTimerValue(settings.timeValue);
        }
      }
    } else {
      playSound('timeUp');
      const newAttempts = currentAttempts + 1;
      setCurrentAttempts(newAttempts);
      const problemIndexForHistory = currentProblemIndex;
      const newHistoryEntry: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: NaN,
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
        setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
        const updatedHistoryEntry: UserAnswer = { ...newHistoryEntry, status: 'revealed' };
        setUserAnswersHistory(prev => {
          const newHistory = [...prev];
          newHistory[problemIndexForHistory] = updatedHistoryEntry;
          return newHistory;
        });
        setWaitingForContinue(true);
        addCompensationProblem();
      } else {
        setFeedbackMessage(t('exercises.timeUpNoAnswer', { attemptsMade: newAttempts, maxAttempts: settings.maxAttempts }));
        setFeedbackColor("red");
        setProblemTimerValue(settings.timeValue);
      }
    }
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
  }, [currentProblem, digitAnswers, checkCurrentAnswer, currentAttempts, settings, t, currentProblemIndex, actualActiveProblemIndexBeforeViewingPrevious, playSound, addCompensationProblem]);

  useEffect(() => {
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    if (exerciseStarted && !exerciseCompleted && currentProblem && !viewingPrevious && settings.timeValue > 0 && !waitingRef.current && (settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts)) {
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
  }, [exerciseStarted, exerciseCompleted, settings.timeValue, currentProblem, viewingPrevious, currentAttempts, settings.maxAttempts, handleTimeOrAttemptsUp]);

  useEffect(() => {
    if (exerciseCompleted && !viewingPrevious) {
      if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
        singleProblemTimerRef.current = null;
      }
      if (generalTimerRef.current) {
        clearInterval(generalTimerRef.current);
        generalTimerRef.current = null;
      }
      const correctAnswers = userAnswersHistory.filter(h => h?.isCorrect).length;
      const totalProblems = userAnswersHistory.length;
      try {
        localStorage.setItem('addition_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString());
        localStorage.setItem('addition_consecutiveIncorrectAnswers', consecutiveIncorrectAnswers.toString());
        localStorage.setItem('addition_autoContinue', autoContinue.toString());
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
      if (totalProblems > 0) {
        saveExerciseResult({
          operationId: "addition",
          date: new Date().toISOString(),
          score: correctAnswers,
          totalProblems,
          timeSpent: timer,
          difficulty: settings.difficulty
        });
      }
    }
  }, [exerciseCompleted, viewingPrevious, userAnswersHistory, consecutiveCorrectAnswers, consecutiveIncorrectAnswers, autoContinue, timer, settings.difficulty, saveExerciseResult]);

  const handleDigitClick = (index: number, event?: React.MouseEvent) => {
    if (viewingPrevious || waitingRef.current || exerciseCompleted) {
      event?.preventDefault();
      return;
    }
    if (!exerciseStarted) {
      startExercise();
    }
    setFocusedDigitIndex(index);
    if (currentProblem) {
      if (currentProblem.answerDecimalPosition !== undefined && currentProblem.answerDecimalPosition > 0) {
        const decimalPosition = currentProblem.answerMaxDigits - currentProblem.answerDecimalPosition;
        if (index < decimalPosition) {
          setInputDirection(currentProblem.layout === 'vertical' ? 'rtl' : 'ltr');
        } else {
          setInputDirection('ltr');
        }
      } else {
        setInputDirection(currentProblem.layout === 'vertical' ? 'rtl' : 'ltr');
      }
    }
  };

  const clearDigitBox = useCallback((index: number) => {
    if (index < 0 || viewingPrevious || waitingRef.current || exerciseCompleted) return;
    setDigitAnswers(prev => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });
  }, [viewingPrevious, exerciseCompleted]);

  const handleDigitKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (viewingPrevious || waitingRef.current || exerciseCompleted) {
      e.preventDefault();
      return;
    }
    if (!e.key || exerciseCompleted) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (inputDirection === 'ltr' && index > 0) {
        setFocusedDigitIndex(index - 1);
      } else if (inputDirection === 'rtl' && index < digitAnswers.length - 1) {
        setFocusedDigitIndex(index + 1);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (inputDirection === 'ltr' && index < digitAnswers.length - 1) {
        setFocusedDigitIndex(index + 1);
      } else if (inputDirection === 'rtl' && index > 0) {
        setFocusedDigitIndex(index - 1);
      }
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      clearDigitBox(index);
      if (inputDirection === 'ltr' && index > 0) {
        setFocusedDigitIndex(index - 1);
      } else if (inputDirection === 'rtl' && index < digitAnswers.length - 1) {
        setFocusedDigitIndex(index + 1);
      }
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (!exerciseStarted) startExercise();
      setDigitAnswers(prev => {
        const updated = [...prev];
        updated[index] = e.key;
        return updated;
      });
      if (inputDirection === 'ltr' && index < digitAnswers.length - 1) {
        setFocusedDigitIndex(index + 1);
      } else if (inputDirection === 'rtl' && index > 0) {
        setFocusedDigitIndex(index - 1);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      checkCurrentAnswer();
    }
  }, [viewingPrevious, exerciseCompleted, inputDirection, digitAnswers.length, clearDigitBox, exerciseStarted, checkCurrentAnswer]);

  const handleContinue = useCallback(() => {
    setShowLevelUpReward(false); // Cerrar el modal
    setBlockAutoAdvance(false);  // Permitir avanzar al siguiente problema
    const newProblem = generateAdditionProblem(adaptiveDifficulty); // Generar un nuevo problema con el nivel actualizado
    setCurrentProblem(newProblem); // Actualizar el problema actual
    setDigitAnswers(Array(newProblem.answerMaxDigits).fill("")); // Reiniciar las respuestas
    setCurrentAttempts(0); // Reiniciar intentos
    setProblemTimerValue(settings.timeValue); // Reiniciar el temporizador
    setWaitingForContinue(false); // Asegurar que el estado de espera se reinicie
  }, [adaptiveDifficulty, settings.timeValue]);

  const startExercise = () => {
    if (exerciseStarted || exerciseCompleted || !currentProblem) return;
    setExerciseStarted(true);
  };

  const generateNewProblemSet = () => {
    const effectiveDifficulty = settings.enableAdaptiveDifficulty
      ? adaptiveDifficulty
      : settings.difficulty as DifficultyLevel;
    const newProblems = Array.from({ length: settings.problemCount }, () =>
      generateAdditionProblem(effectiveDifficulty, false) // Problemas originales
    );
    setProblemsList(newProblems);
    setCurrentProblemIndex(0);
    setCurrentProblem(newProblems[0]);
    setUserAnswersHistory(Array(newProblems.length).fill(null));
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setWaitingForContinue(false);
    setFeedbackMessage(null);
    setFeedbackColor(null);
    setCurrentAttempts(0);
    setTimer(0);
    setProblemTimerValue(settings.timeValue);
    setViewingPrevious(false);
    setActualActiveProblemIndexBeforeViewingPrevious(0);
    if (adaptiveDifficulty !== effectiveDifficulty) {
      setAdaptiveDifficulty(effectiveDifficulty);
      setConsecutiveCorrectAnswers(0);
      setConsecutiveIncorrectAnswers(0);
    }
  };

  const restartExercise = () => {
    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    generateNewProblemSet();
    setShowRestartConfirm(false);
  };

  const handleViewPrevious = () => {
    if (currentProblemIndex === 0 || exerciseCompleted) return;
    if (!viewingPrevious) {
      setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
    }
    setViewingPrevious(true);
    setCurrentProblemIndex(prev => prev - 1);
    setCurrentProblem(problemsList[currentProblemIndex - 1]);
    const prevAnswer = userAnswersHistory[currentProblemIndex - 1];
    if (prevAnswer) {
      const prevProblem = problemsList[currentProblemIndex - 1];
      if (prevProblem) {
        const answerStr = String(prevAnswer.userAnswer || '');
        const decimalPosition = prevProblem.answerDecimalPosition;
        if (decimalPosition !== undefined && decimalPosition > 0) {
          const [intPart = '', decPart = ''] = answerStr.split('.');
          const restoredDigits: string[] = Array(prevProblem.answerMaxDigits).fill('');
          const intDigits = intPart.split('');
          for (let i = 0; i < intDigits.length; i++) {
            restoredDigits[i] = intDigits[i];
          }
          const decDigits = decPart.split('');
          for (let i = 0; i < decDigits.length; i++) {
            const position = i + (prevProblem.answerMaxDigits - decimalPosition);
            if (position < prevProblem.answerMaxDigits) {
              restoredDigits[position] = decDigits[i];
            }
          }
          setDigitAnswers(restoredDigits);
        } else {
          const digits = answerStr.split('');
          const restoredDigits: string[] = Array(prevProblem.answerMaxDigits).fill('');
          for (let i = 0; i < digits.length; i++) {
            if (i < restoredDigits.length) {
              restoredDigits[i] = digits[i];
            }
          }
          setDigitAnswers(restoredDigits);
        }
      }
      setFeedbackMessage(
        prevAnswer.isCorrect
          ? t('exercises.yourAnswerWasCorrect', { userAnswer: prevAnswer.userAnswer })
          : t('exercises.yourAnswerWasIncorrect', {
              userAnswer: isNaN(prevAnswer.userAnswer) ? t('common.notAnswered') : prevAnswer.userAnswer,
              correctAnswer: prevAnswer.problem.correctAnswer
            })
      );
      setFeedbackColor(prevAnswer.isCorrect ? "green" : "red");
    } else {
      setFeedbackMessage(t('exercises.noAnswerRecordedForThisProblem'));
      setFeedbackColor("blue");
    }
  };

  const handleViewNext = () => {
    if (viewingPrevious && currentProblemIndex < actualActiveProblemIndexBeforeViewingPrevious) {
      setCurrentProblemIndex(prev => prev + 1);
      setCurrentProblem(problemsList[currentProblemIndex + 1]);
      const nextAnswer = userAnswersHistory[currentProblemIndex + 1];
      if (nextAnswer) {
        const nextProblem = problemsList[currentProblemIndex + 1];
        if (nextProblem) {
          const answerStr = String(nextAnswer.userAnswer || '');
          const decimalPosition = nextProblem.answerDecimalPosition;
          if (decimalPosition !== undefined && decimalPosition > 0) {
            const [intPart = '', decPart = ''] = answerStr.split('.');
            const restoredDigits: string[] = Array(nextProblem.answerMaxDigits).fill('');
            const intDigits = intPart.split('');
            for (let i = 0; i < intDigits.length; i++) {
              restoredDigits[i] = intDigits[i];
            }
            const decDigits = decPart.split('');
            for (let i = 0; i < decDigits.length; i++) {
              const position = i + (nextProblem.answerMaxDigits - decimalPosition);
              if (position < nextProblem.answerMaxDigits) {
                restoredDigits[position] = decDigits[i];
              }
            }
            setDigitAnswers(restoredDigits);
          } else {
            const digits = answerStr.split('');
            const restoredDigits: string[] = Array(nextProblem.answerMaxDigits).fill('');
            for (let i = 0; i < digits.length; i++) {
              if (i < restoredDigits.length) {
                restoredDigits[i] = digits[i];
              }
            }
            setDigitAnswers(restoredDigits);
          }
        }
        setFeedbackMessage(
          nextAnswer.isCorrect
            ? t('exercises.yourAnswerWasCorrect', { userAnswer: nextAnswer.userAnswer })
            : t('exercises.yourAnswerWasIncorrect', {
                userAnswer: isNaN(nextAnswer.userAnswer) ? t('common.notAnswered') : nextAnswer.userAnswer,
                correctAnswer: nextAnswer.problem.correctAnswer
              })
        );
        setFeedbackColor(nextAnswer.isCorrect ? "green" : "red");
      }
      if (currentProblemIndex + 1 === actualActiveProblemIndexBeforeViewingPrevious) {
        setViewingPrevious(false);
      }
    }
  };

  const calculatedScore = useMemo(() => {
    if (userAnswersHistory.length === 0) return 0;
    const correctCount = userAnswersHistory.filter(a => a?.isCorrect).length;
    return Math.round((correctCount / problemsList.length) * 100);
  }, [userAnswersHistory, problemsList.length]);

  const getDifficultyTheme = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "beginner":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-600",
          accent: "bg-blue-500",
          accentHover: "hover:bg-blue-600",
          accentText: "text-white",
          timer: "bg-blue-100"
        };
      case "elementary":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-600",
          accent: "bg-emerald-500",
          accentHover: "hover:bg-emerald-600",
          accentText: "text-white",
          timer: "bg-emerald-100"
        };
      case "intermediate":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-600",
          accent: "bg-orange-500",
          accentHover: "hover:bg-orange-600",
          accentText: "text-white",
          timer: "bg-orange-100"
        };
      case "advanced":
        return {
          bg: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-600",
          accent: "bg-purple-500",
          accentHover: "hover:bg-purple-600",
          accentText: "text-white",
          timer: "bg-purple-100"
        };
      case "expert":
        return {
          bg: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-600",
          accent: "bg-rose-500",
          accentHover: "hover:bg-rose-600",
          accentText: "text-white",
          timer: "bg-rose-100"
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-600",
          accent: "bg-gray-500",
          accentHover: "hover:bg-gray-600",
          accentText: "text-white",
          timer: "bg-gray-100"
        };
    }
  };

  const theme = getDifficultyTheme(adaptiveDifficulty);

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center min-h-64 p-6 animate-pulse">
        <div className="text-center">
          <div className="inline-block w-16 h-16 mb-4 rounded-full bg-gray-200"></div>
          <p className="text-lg font-medium text-gray-600">{t('exercises.loading')}</p>
        </div>
      </div>
    );
  }

  if (exerciseCompleted) {
    const correctCount = userAnswersHistory.filter(a => a?.isCorrect).length;

    return (
      <div className={${theme.bg} rounded-lg shadow-md p-6 max-w-2xl mx-auto border ${theme.border}}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 mb-4 rounded-full bg-green-100 text-green-600">
            <Trophy className="h-16 w-16" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">{t('exercises.completed')}</h2>
          <p className="text-lg font-medium text-gray-600">{t('exercises.scoreWithCount', { score: calculatedScore, correct: correctCount, total: problemsList.length })}</p>
          <p className="text-lg font-medium text-gray-600">{t('exercises.timeTaken')}: {formatTime(timer)}</p>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Resumen del Ejercicio:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-700 mb-2">Estadísticas:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span>Problemas Correctos:</span>
                  <span className="font-medium">{userAnswersHistory.filter(a => a?.isCorrect).length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Problemas Incorrectos:</span>
                  <span className="font-medium">{userAnswersHistory.filter(a => a && !a.isCorrect).length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Total de Problemas:</span>
                  <span className="font-medium">{problemsList.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Dificultad:</span>
                  <span className="font-medium capitalize">{settings.difficulty}</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h4 className="font-medium text-green-700 mb-2">Tus Respuestas:</h4>
              <div className="max-h-40 overflow-y-auto pr-2">
                <ul className="space-y-1 text-sm">
                  {userAnswersHistory.map((answer, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{idx + 1}: {answer?.problem.operands.join(' + ')} = </span>
                      <span className={font-medium ${answer?.isCorrect ? 'text-green-600' : 'text-red-600'}}>
                        {answer?.userAnswer !== undefined && !isNaN(answer?.userAnswer as number)
                          ? answer?.userAnswer
                          : '(Sin respuesta)'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-8 space-x-4">
          <Button
            variant="outline"
            onClick={restartExercise}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t('exercises.tryAgain')}</span>
          </Button>
          <Button
            onClick={() => {
              if (settings.enableAdaptiveDifficulty) {
                try {
                  localStorage.setItem('addition_consecutiveCorrectAnswers', '0');
                  localStorage.setItem('addition_consecutiveIncorrectAnswers', '0');
                } catch (e) {
                  console.error("Error resetting consecutive answers:", e);
                }
              }
            }}
            className={flex items-center space-x-2 ${theme.accent} ${theme.accentHover} ${theme.accentText}}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t('exercises.returnHome')}</span>
          </Button>
        </div>
      </div>
    );
  }

  const renderHorizontalProblem = () => (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center text-3xl font-bold space-x-3">
        <span>{currentProblem.operands[0]}</span>
        <span className="text-gray-600">+</span>
        <span>{currentProblem.operands[1]}</span>
        {currentProblem.operands.length > 2 && currentProblem.operands.slice(2).map((op, idx) => (
          <React.Fragment key={op-${idx}}>
            <span className="text-gray-600">+</span>
            <span>{op}</span>
          </React.Fragment>
        ))}
        <span className="text-gray-600">=</span>
      </div>
    </div>
  );

  const renderVerticalProblem = () => {
    const { maxIntLength, maxDecLength, operandsFormatted, sumLineTotalCharWidth } = getVerticalAlignmentInfo(
      currentProblem.operands,
      currentProblem.answerDecimalPosition
    );

    return (
      <div className="py-4 flex justify-center">
        <div className="flex flex-col items-end">
          {operandsFormatted.map((op, idx) => (
            <div key={idx} className="flex items-center mb-1">
              {idx === operandsFormatted.length - 1 && (
                <span className={plusSignVerticalStyle}>+</span>
              )}
              <span className={verticalOperandStyle}>
                {op.intStr}
                {maxDecLength > 0 && (
                  <>
                    <span className="text-gray-600">.</span>
                    {op.decStr}
                  </>
                )}
              </span>
            </div>
          ))}
          <div className={sumLineStyle} style={{ width: ${sumLineTotalCharWidth * 0.6}em }} />
        </div>
      </div>
    );
  };

  const renderDigitAnswerBoxes = () => {
    const decimalPosition = currentProblem.answerDecimalPosition;
    const totalBoxes = digitAnswers.length;

    return (
      <div className="flex justify-center items-center space-x-1 my-4">
        {digitAnswers.map((value, index) => {
          const isDecimalPointPosition = decimalPosition !== undefined &&
            index === (totalBoxes - decimalPosition);
          const isDecimalBox = decimalPosition !== undefined &&
            index >= (totalBoxes - decimalPosition);
          if (isDecimalPointPosition) {
            return (
              <React.Fragment key={decimal-${index}}>
                <div className="text-2xl font-bold mx-1 mt-1 opacity-75">.</div>
                <div
                  ref={(el) => {
                    if (el) boxRefsArrayRef.current[index] = el;
                  }}
                  className={
                    ${digitBoxBaseStyle}
                    ${focusedDigitIndex === index && !viewingPrevious && !waitingForContinue ? digitBoxFocusStyle : digitBoxBlurStyle}
                    ${viewingPrevious || waitingForContinue ? digitBoxDisabledStyle : 'cursor-pointer'}
                    ${isDecimalBox ? 'bg-blue-50' : ''}
                  }
                  onClick={() => handleDigitClick(index)}
                  onKeyDown={(e) => handleDigitKeyDown(e, index)}
                  tabIndex={viewingPrevious || waitingForContinue ? -1 : 0}
                  data-testid={digit-box-${index}}
                >
                  {value || <span className="opacity-0">0</span>}
                </div>
              </React.Fragment>
            );
          }
          return (
            <div
              key={digit-${index}}
              ref={(el) => {
                if (el) {
                  boxRefsArrayRef.current[index] = el;
                  digitBoxRefs.current = boxRefsArrayRef.current;
                }
              }}
              className={
                ${digitBoxBaseStyle}
                ${focusedDigitIndex === index && !viewingPrevious && !waitingForContinue ? digitBoxFocusStyle : digitBoxBlurStyle}
                ${viewingPrevious || waitingForContinue ? digitBoxDisabledStyle : 'cursor-pointer'}
                ${isDecimalBox ? 'bg-blue-50' : ''}
              }
              onClick={() => handleDigitClick(index)}
              onKeyDown={(e) => handleDigitKeyDown(e, index)}
              tabIndex={viewingPrevious || waitingForContinue ? -1 : 0}
              data-testid={digit-box-${index}}
            >
              {value || <span className="opacity-0">0</span>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderNumpad = () => (
    <div className="grid grid-cols-3 gap-2 mt-4 max-w-xs mx-auto">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, idx) => (
        <Button
          key={key || empty-${idx}}
          variant="outline"
          className={
            h-12 text-lg font-medium
            ${key === "" ? "invisible pointer-events-none" : ""}
            ${key === "⌫" ? "bg-gray-100" : "bg-white"}
          }
          onClick={() => {
            if (waitingForContinue || viewingPrevious) return;
            if (!exerciseStarted) startExercise();
            if (key === "⌫" && focusedDigitIndex !== null) {
              clearDigitBox(focusedDigitIndex);
              if (inputDirection === 'ltr' && focusedDigitIndex > 0) {
                setFocusedDigitIndex(focusedDigitIndex - 1);
              } else if (inputDirection === 'rtl' && focusedDigitIndex < digitAnswers.length - 1) {
                setFocusedDigitIndex(focusedDigitIndex + 1);
              }
            } else if (/^[0-9]$/.test(key) && focusedDigitIndex !== null) {
              setDigitAnswers(prev => {
                const updated = [...prev];
                updated[focusedDigitIndex] = key;
                return updated;
              });
              if (inputDirection === 'ltr' && focusedDigitIndex < digitAnswers.length - 1) {
                setFocusedDigitIndex(focusedDigitIndex + 1);
              } else if (inputDirection === 'rtl' && focusedDigitIndex > 0) {
                setFocusedDigitIndex(focusedDigitIndex - 1);
              }
            }
          }}
          disabled={waitingForContinue || viewingPrevious || key === ""}
        >
          {key}
        </Button>
      ))}
    </div>
  );

  return (
    <div className={${theme.bg} rounded-lg shadow-md p-4 max-w-2xl mx-auto border ${theme.border}}>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-medium text-gray-500">
          Problema {currentProblemIndex + 1} de {problemsList.length}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="flex items-center text-xs"
          >
            <SettingsIcon className="h-3.5 w-3.5 mr-1" />
            Configuración
          </Button>
        </div>
      </div>
      <div className="mb-6">
        <ProgressBarUI
          value={(currentProblemIndex / problemsList.length) * 100}
          className="h-1.5"
        />
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium text-gray-500 flex items-center">
          <Info className="h-3.5 w-3.5 mr-1" />
          Tiempo: {formatTime(timer)}
        </div>
        <div className="flex items-center space-x-2">
          <div className={px-2 py-0.5 rounded-full text-xs font-medium capitalize ${theme.text} bg-white/70 border ${theme.border}}>
            {t(adaptiveDifficulty)}
          </div>
          {settings.timeValue > 0 && (
            <div className={px-2 py-0.5 rounded-full text-xs font-medium
              ${problemTimerValue <= 5 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-gray-600 bg-white/70'}
              border ${problemTimerValue <= 5 ? 'border-red-200' : theme.border}}
            >
              {problemTimerValue}s
            </div>
          )}
          {settings.maxAttempts > 0 && (
            <div className={px-2 py-0.5 rounded-full text-xs font-medium
              ${currentAttempts >= settings.maxAttempts ? 'text-red-600 bg-red-50' :
                currentAttempts > 0 ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-white/70'}
              border ${currentAttempts >= settings.maxAttempts ? 'border-red-200' :
                currentAttempts > 0 ? 'border-amber-200' : theme.border}}
            >
              {currentAttempts}/{settings.maxAttempts}
            </div>
          )}
        </div>
      </div>
      <div className={my-4 p-3 rounded-lg border shadow-sm ${
        waitingForContinue && feedbackColor === "green" ? "bg-green-50 border-green-200" :
        waitingForContinue && feedbackColor === "red" ? "bg-red-50 border-red-200" :
        "bg-white border-gray-200"
      }}>
        {currentProblem.layout === 'horizontal'
          ? renderHorizontalProblem()
          : renderVerticalProblem()
        }
        {renderDigitAnswerBoxes()}
      </div>
      {feedbackMessage && (
        <div className={my-3 p-3 rounded-lg text-center ${
          feedbackColor === "green" ? "bg-green-50 border border-green-200 text-green-700" :
          feedbackColor === "red" ? "bg-red-50 border border-red-200 text-red-700" :
          "bg-blue-50 border border-blue-200 text-blue-700"
        }}>
          {feedbackMessage}
        </div>
      )}
      {renderNumpad()}
      <div className="flex justify-between mt-5">
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewPrevious}
                  disabled={currentProblemIndex === 0 || !exerciseStarted}
                  className="flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              </TooltipTrigger>
              {currentProblemIndex === 0 && (
                <TooltipContent>
                  <p>No hay problemas anteriores para revisar</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewNext}
                  disabled={!viewingPrevious || currentProblemIndex >= actualActiveProblemIndexBeforeViewingPrevious}
                  className="flex items-center"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </TooltipTrigger>
              {(!viewingPrevious || currentProblemIndex >= actualActiveProblemIndexBeforeViewingPrevious) && (
                <TooltipContent>
                  <p>No hay más problemas para avanzar</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex space-x-2">
          {viewingPrevious ? (
            <Button
              onClick={() => {
                setViewingPrevious(false);
                setCurrentProblemIndex(actualActiveProblemIndexBeforeViewingPrevious);
                setCurrentProblem(problemsList[actualActiveProblemIndexBeforeViewingPrevious]);
                setFeedbackMessage(null);
                setFeedbackColor(null);
              }}
              className={flex items-center ${theme.accent} ${theme.accentHover} ${theme.accentText}}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Volver al Problema Actual
            </Button>
          ) : waitingForContinue ? (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleContinue}
                className={flex items-center ${feedbackColor === "green" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white}
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2 ml-2 p-1 rounded border border-gray-200 bg-white/80">
                      <Switch
                        checked={autoContinue}
                        onCheckedChange={setAutoContinue}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <span className="text-xs text-gray-500">Auto</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Avanzar automáticamente al siguiente problema</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : !exerciseStarted ? (
            <Button
              onClick={startExercise}
              className={flex items-center ${theme.accent} ${theme.accentHover} ${theme.accentText}}
            >
              {t('exercises.start')}
            </Button>
          ) : (
            <Button
              onClick={checkCurrentAnswer}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
              disabled={waitingForContinue || viewingPrevious}
            >
              <Check className="h-4 w-4 mr-1" />
              {t('exercises.check')}
            </Button>
          )}
          {settings.showAnswerWithExplanation && !waitingForContinue && !viewingPrevious && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!exerciseStarted) startExercise();
                      setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
                      setFeedbackColor("blue");
                      setWaitingForContinue(true);
                      setUserAnswersHistory(prev => {
                        const newHistory = [...prev];
                        newHistory[currentProblemIndex] = {
                          problemId: currentProblem.id,
                          problem: currentProblem,
                          userAnswer: null,
                          isCorrect: false,
                          status: 'revealed'
                        };
                        return newHistory;
                      });
                      addCompensationProblem();
                    }}
                    disabled={!settings.showAnswerWithExplanation || waitingForContinue || viewingPrevious}
                    className="flex items-center"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    {t('exercises.showAnswer')}
                  </Button>
                </TooltipTrigger>
                {!settings.showAnswerWithExplanation && (
                  <TooltipContent>
                    <p>{t('tooltips.activateShowAnswer')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <div className="mt-5 border-t pt-3 flex justify-start">
        <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center text-red-600 border-red-200 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reiniciar Ejercicio
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                Confirmar Reinicio
              </AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro que deseas reiniciar el ejercicio? Perderás todo tu progreso actual.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={restartExercise} className="bg-red-600 hover:bg-red-700">
                Sí, Reiniciar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {showLevelUpReward && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-white">¡NIVEL SUPERADO!</h3>
              <p className="text-white mt-2">¡Has completado 10 respuestas correctas consecutivas y has avanzado de nivel!</p>
              <div className="flex justify-center mt-4">
                <div className="bg-gray-200 p-3 rounded">Nivel Anterior: {previousDifficulty}</div>
                <div className="mx-2 text-white">→</div>
                <div className="bg-green-500 p-3 rounded text-white">Nuevo Nivel: {adaptiveDifficulty}</div>
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <Button onClick={handleContinue} className="bg-green-600 hover:bg-green-700 text-white">
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
      {showRewardAnimation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl animate-fadeInUp">
            <div className="text-center">
              <div className={inline-block p-5 rounded-full
                ${rewardType === 'medal' ? 'bg-amber-100' :
                 rewardType === 'trophy' ? 'bg-indigo-100' : 'bg-pink-100'}
                mb-4}
              >
                {rewardType === 'medal' ? (
                  <div className="text-5xl">🏅</div>
                ) : rewardType === 'trophy' ? (
                  <div className="text-5xl">🏆</div>
                ) : (
                  <div className="text-5xl">⭐</div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {rewardType === 'medal' ? '¡Medalla Obtenida!' :
                 rewardType === 'trophy' ? '¡Trofeo Ganado!' : '¡Estrella Conseguida!'}
              </h3>
              <p className="text-gray-600 mb-4">
                ¡Enhorabuena! Has obtenido una recompensa por tu buen desempeño.
              </p>
              <Button
                onClick={() => setShowRewardAnimation(false)}
                className={
                  rewardType === 'medal' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                  rewardType === 'trophy' ? 'bg-indigo-500 hover:bg-indigo-600 text-white' :
                  'bg-pink-500 hover:bg-pink-600 text-white'
                }
              >
                ¡Genial!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SECCIÓN 4: COMPONENTE DE CONFIGURACIÓN
// ==========================================
interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

function Settings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const debouncedSave = useMemo(
    () =>
      debounce((settings: ModuleSettings) => {
        updateModuleSettings("addition", settings);
        console.log([ADDITION] Guardando configuración (debounced):, settings);
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

  const hasSavedRef = useRef(false);

  useEffect(() => {
    updateModuleSettings("addition", localSettings);
    console.log("[ADDITION] Guardando configuración al cargar:", localSettings);
    return () => {
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        updateModuleSettings("addition", localSettings);
        console.log("[ADDITION] Guardando configuración al desmontar:", localSettings);
        try {
          const profileId = localStorage.getItem('activeProfileId');
          const suffix = profileId ? -profile-${profileId} : '';
          const key = moduleSettings${suffix};
          const currentSettings = localStorage.getItem(key);
          if (currentSettings) {
            const parsed = JSON.parse(currentSettings);
            const updated = {
              ...parsed,
              addition: localSettings
            };
            localStorage.setItem(key, JSON.stringify(updated));
            console.log("[ADDITION] Forzando actualización en localStorage:", updated);
          }
        } catch (e) {
          console.error("Error al forzar guardado en localStorage:", e);
        }
      }
    };
  }, [localSettings, updateModuleSettings]);

  const handleResetSettings = async () => {
    if (showResetConfirm) {
      await resetModuleSettings("addition");
      setLocalSettings({ ...defaultModuleSettings });
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
    }
  };

  const getDifficultyTheme = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return {
          bg: "bg-gradient-to-br from-blue-50 to-blue-100",
          border: "border-blue-200",
          text: "text-blue-600",
          textSecondary: "text-blue-500",
          bgContainer: "bg-blue-50",
          bgLight: "bg-blue-100",
          bgMedium: "bg-blue-200",
          accent: "text-blue-700",
          emoji: "🔵",
          name: "Principiante"
        };
      case "elementary":
        return {
          bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
          border: "border-emerald-200",
          text: "text-emerald-600",
          textSecondary: "text-emerald-500",
          bgContainer: "bg-emerald-50",
          bgLight: "bg-emerald-100",
          bgMedium: "bg-emerald-200",
          accent: "text-emerald-700",
          emoji: "🟢",
          name: "Elemental"
        };
      case "intermediate":
        return {
          bg: "bg-gradient-to-br from-orange-50 to-orange-100",
          border: "border-orange-200",
          text: "text-orange-600",
          textSecondary: "text-orange-500",
          bgContainer: "bg-orange-50",
          bgLight: "bg-orange-100",
          bgMedium: "bg-orange-200",
          accent: "text-orange-700",
          emoji: "🟠",
          name: "Intermedio"
        };
      case "advanced":
        return {
          bg: "bg-gradient-to-br from-purple-50 to-purple-100",
          border: "border-purple-200",
          text: "text-purple-600",
          textSecondary: "text-purple-500",
          bgContainer: "bg-purple-50",
          bgLight: "bg-purple-100",
          bgMedium: "bg-purple-200",
          accent: "text-purple-700",
          emoji: "🟣",
          name: "Avanzado"
        };
      case "expert":
        return {
          bg: "bg-gradient-to-br from-rose-50 to-rose-100",
          border: "border-rose-200",
          text: "text-rose-600",
          textSecondary: "text-rose-500",
          bgContainer: "bg-rose-50",
          bgLight: "bg-rose-100",
          bgMedium: "bg-rose-200",
          accent: "text-rose-700",
          emoji: "⭐",
          name: "Experto"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
          border: "border-indigo-200",
          text: "text-indigo-600",
          textSecondary: "text-indigo-500",
          bgContainer: "bg-indigo-50",
          bgLight: "bg-indigo-100",
          bgMedium: "bg-indigo-200",
          accent: "text-indigo-700",
          emoji: "⚡",
          name: "General"
        };
    }
  };

  const theme = getDifficultyTheme(localSettings.difficulty || "beginner");

  return (
    <div className={px-4 py-5 sm:p-6 rounded-xl shadow-md ${theme.bg} border-2 ${theme.border}}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={text-2xl font-bold ${theme.text} flex items-center}>
            {theme.emoji} Configuración - Ejercicio de Suma
          </h2>
          <p className={text-sm font-medium ${theme.textSecondary}}>Personaliza tu experiencia de ejercicio</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className={border ${theme.border} hover:${theme.bgContainer}}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Ejercicio
        </Button>
      </div>
      <div className="space-y-6">
        <div className={p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}}>
          <h3 className={text-lg font-bold ${theme.text} flex items-center}>
            <span className="mr-2">🎯</span>Nivel de Dificultad
          </h3>
          <p className={text-sm ${theme.textSecondary} mb-2}>Haz clic en un ejemplo para cambiar el nivel de dificultad:</p>
          <div className="mt-4 mb-6 bg-white/80 rounded-lg p-4 border border-gray-100 shadow-sm">
            <DifficultyExamples
              operation="addition"
              activeDifficulty={localSettings.difficulty}
              onSelectDifficulty={(difficulty) =>
                handleUpdateSetting("difficulty", difficulty as "beginner" | "elementary" | "intermediate" | "advanced" | "expert")
              }
            />
          </div>
          <div className="mt-3 mb-2 space-y-1.5">
            <p className={text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}}>
              <span className="font-bold">Principiante:</span> Sumas con dígitos simples (1+8, 7+5)
            </p>
            <p className={text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}}>
              <span className="font-bold">Elemental:</span> Sumas de números de dos dígitos (12+15, 24+13)
            </p>
            <p className={text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}}>
              <span className="font-bold">Intermedio:</span> Sumas con números grandes (65+309, 392+132)
            </p>
            <p className={text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}}>
              <span className="font-bold">Avanzado:</span> Sumas de números de 4 dígitos (1247+3568, 5934+8742)
            </p>
            <p className={text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}}>
              <span className="font-bold">Experto:</span> Sumas con números muy grandes (70960+11650, 28730+59436)
            </p>
          </div>
        </div>
        <div className={p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}}>
          <h3 className={text-lg font-bold ${theme.text} flex items-center}>
            <span className="mr-2">🔢</span>Número de Problemas
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.problemCount]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={(value) => handleUpdateSetting("problemCount", value[0])}
                  className={w-full ${theme.bgLight}}
                />
                <div className={flex justify-between text-xs font-medium mt-1 ${theme.accent}}>
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.problemCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 50) {
                      handleUpdateSetting("problemCount", value);
                    }
                  }}
                  min={1}
                  max={50}
                  className={w-full border ${theme.border}}
                />
              </div>
            </div>
            <p className={mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}}>
              <span className="font-medium">Especifica cuántos problemas quieres resolver:</span> <span className={font-bold ${theme.text}}>{localSettings.problemCount}</span>
            </p>
          </div>
        </div>
        <div className={p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}}>
          <h3 className={text-lg font-bold ${theme.text} flex items-center}>
            <span className="mr-2">⏱️</span>Límite de Tiempo
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.timeValue]}
                  min={0}
                  max={300}
                  step={5}
                  onValueChange={(value) => handleUpdateSetting("timeValue", value[0])}
                  className={w-full ${theme.bgLight}}
                />
                <div className={flex justify-between text-xs font-medium mt-1 ${theme.accent}}>
                  <span>0</span>
                  <span>150</span>
                  <span>300</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.timeValue}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 300) {
                      handleUpdateSetting("timeValue", value);
                    }
                  }}
                  min={0}
                  max={300}
                  className={w-full border ${theme.border}}
                />
              </div>
            </div>
            <p className={mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}}>
              <span className="font-medium">Tiempo en segundos:</span> <span className={font-bold ${theme.text}}>{localSettings.timeValue}</span> <span className="text-xs">(0 para sin límite)</span>
            </p>
          </div>
        </div>
        <div className={p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}}>
          <h3 className={text-lg font-bold ${theme.text} flex items-center}>
            <span className="mr-2">🔄</span>Máximo de Intentos por Problema
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.maxAttempts]}
                  min={0}
                  max={10}
                  step={1}
                  onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])}
                  className={w-full ${theme.bgLight}}
                />
                <div className={flex justify-between text-xs font-medium mt-1 ${theme.accent}}>
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.maxAttempts}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 10) {
                      handleUpdateSetting("maxAttempts", value);
                    }
                  }}
                  min={0}
                  max={10}
                  className={w-full border ${theme.border}}
                />
              </div>
            </div>
            <p className={mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}}>
              <span className="font-medium">Intentos máximos:</span> <span className={font-bold ${theme.text}}>{localSettings.maxAttempts}</span> <span className="text-xs">(0 para intentos ilimitados)</span>
            </p>
          </div>
          <h3 className={text-lg font-bold ${theme.text} flex items-center mt-6}>
            <span className="mr-2">⚙️</span>Configuración Adicional
          </h3>
          <div className="mt-3 space-y-3">
            <div className={flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}}>
              <Label htmlFor="show-immediate-feedback" className={cursor-pointer ${theme.accent} flex items-center}>
                <span className="mr-2">📝</span>Mostrar retroalimentación inmediata
              </Label>
              <Switch
                id="show-immediate-feedback"
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}}>
              <Label htmlFor="enable-sound-effects" className={cursor-pointer ${theme.accent} flex items-center}>
                <span className="mr-2">🔊</span>Habilitar efectos de sonido
              </Label>
              <Switch
                id="enable-sound-effects"
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}}>
              <Label htmlFor="show-answer-explanation" className={cursor-pointer ${theme.accent} flex items-center}>
                <span className="mr-2">❓</span>Mostrar explicación de respuestas
              </Label>
              <Switch
                id="show-answer-explanation"
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}}>
              <Label htmlFor="enable-adaptive-difficulty" className={cursor-pointer ${theme.accent} flex items-center}>
                <span className="mr-2">📈</span>Habilitar Dificultad Adaptativa
              </Label>
              <Switch
                id="enable-adaptive-difficulty"
                checked={localSettings.enableAdaptiveDifficulty}
                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}}>
              <Label htmlFor="enable-compensation" className={cursor-pointer ${theme.accent} flex items-center}>
                <span className="mr-2">➕</span>Habilitar Compensación
                <br/><span className="text-xs ml-5 opacity-80">(Añadir 1 problema por cada incorrecto/revelado)</span>
              </Label>
              <Switch
                id="enable-compensation"
                checked={localSettings.enableCompensation}
                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}}>
              <Label htmlFor="enable-rewards" className={cursor-pointer ${theme.accent} flex items-center}>
                <span className="mr-2">🏆</span>Activar sistema de recompensas aleatorias
                <div className="flex items-center ml-2 mt-1">
                  <span className="mx-0.5 text-xl">🏅</span>
                  <span className="mx-0.5 text-xl">🏆</span>
                  <span className="mx-0.5 text-xl">⭐</span>
                </div>
              </Label>
              <Switch
                id="enable-rewards"
                checked={localSettings.enableRewards}
                onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
                className={theme.bgLight}
              />
            </div>
            {localSettings.enableRewards && (
              <div className={ml-6 mt-3 p-3 rounded-md bg-white/70 border ${theme.border}}>
                <p className={text-sm ${theme.accent}}>
                  <span className="mr-2">🎲</span>Las recompensas aparecerán de forma aleatoria durante los ejercicios:
                </p>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  <div className={p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center}>
                    <span className="text-2xl">🏅</span>
                    <span className={text-xs font-medium ${theme.text}}>Medallas</span>
                  </div>
                  <div className={p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center}>
                    <span className="text-2xl">🏆</span>
                    <span className={text-xs font-medium ${theme.text}}>Trofeos</span>
                  </div>
                  <div className={p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center}>
                    <span className="text-2xl">⭐</span>
                    <span className={text-xs font-medium ${theme.text}}>Estrellas</span>
                  </div>
                </div>
                <p className={text-xs mt-3 ${theme.textSecondary} text-center italic}>
                  El sistema elegirá automáticamente qué recompensa mostrar en cada ocasión
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="pt-4">
          <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={mr-3 border ${theme.border} hover:${theme.bgContainer} text-red-600}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restablecer valores predeterminados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  Confirmar Restablecimiento
                </AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro que deseas restablecer toda la configuración a los valores predeterminados?
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSettings} className="bg-red-600 hover:bg-red-700">
                  Sí, Restablecer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SECCIÓN 5: EXPORTACIÓN DE COMPONENTES
// ==========================================
export { Exercise as default, Settings as SettingsPanel };