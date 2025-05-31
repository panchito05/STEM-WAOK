// Exercise.tsx - Associative Property Module (Clean Version)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateAssociativePropertyProblem, checkAnswer } from "./utils";
import { AssociativePropertyProblem, UserAnswer as UserAnswerType, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Star, Award, Trophy, RotateCcw, History, Youtube, X, Plus, Maximize2, Minimize2, Play } from "lucide-react";
import { ProfessorModeWithSync as ProfessorMode } from "./components/professor/ProfessorModeWithSync";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/hooks/use-translations";
import { MathProblem } from '../../components/ProblemRenderer';
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import LevelUpHandler from "@/components/LevelUpHandler";
import { Link } from "wouter";
import ExerciseHistoryDialog from "@/components/ExerciseHistoryDialog";
import { useRewards, RewardModal, useRewardQueue, RewardUtils } from '@/rewards';
import { useMultiOperationsSession } from '@/hooks/useMultiOperationsSession';
import ProgressiveGroupingDisplay from './components/ProgressiveGroupingDisplay';
import AdvancedExercise from './components/AdvancedExercise';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

// Interface para los metadatos de videos de YouTube
interface YoutubeVideoMetadata {
  url: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
  loading: boolean;
  error: boolean;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const { t } = useTranslations();
  const { trackProgress } = useProgress();
  const { updateModuleSettings, saveExerciseResult } = useSettings();
  
  // Estados principales
  const [currentProblem, setCurrentProblem] = useState<AssociativePropertyProblem | null>(null);
  const [problemsList, setProblemsList] = useState<AssociativePropertyProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswerType[]>([]);
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState(0);
  
  // Estados de control del ejercicio
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [viewingPrevious, setViewingPrevious] = useState(false);
  
  // Estados para dígitos (nivel beginner)
  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [activeDigitIndex, setActiveDigitIndex] = useState<number>(0);
  
  // Estados de feedback y progreso
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("gray");
  const [currentAttempts, setCurrentAttempts] = useState(0);
  
  // Estados de contadores
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(0);
  const [maxConsecutiveStreak, setMaxConsecutiveStreak] = useState(0);
  
  // Estados de UI
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
  
  // Referencias
  const waitingRef = useRef(false);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const generalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  
  // Estados para sistema adaptativo
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel>(settings.difficulty);
  const [showLevelUpReward, setShowLevelUpReward] = useState(false);
  const [blockAutoAdvance, setBlockAutoAdvance] = useState(false);
  
  // Estados para YouTube
  const [youtubeVideos, setYoutubeVideos] = useState<YoutubeVideoMetadata[]>([]);
  
  // Estados para advanced mode
  const [advancedValidationTrigger, setAdvancedValidationTrigger] = useState(0);
  
  // Hooks de recompensas
  const { 
    rewardStats, 
    setRewardStats, 
    dailyStreak, 
    showRewardModal, 
    setShowRewardModal, 
    currentReward, 
    setCurrentReward 
  } = useRewards();
  
  const { processRewardQueue } = useRewardQueue();
  const { lastRewardShownIndex, setLastRewardShownIndex } = useMultiOperationsSession();
  
  // Estados de temporizadores
  const [timer, setTimer] = useState(0);
  const [singleProblemTimer, setSingleProblemTimer] = useState(0);
  const [autoContinue, setAutoContinue] = useState(false);

  // Función para iniciar el ejercicio
  const startExercise = useCallback(() => {
    if (!exerciseStarted) {
      setExerciseStarted(true);
      setTimer(0);
      setSingleProblemTimer(0);
      
      // Limpiar temporizadores existentes
      if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
      }
      if (generalTimerRef.current) {
        clearInterval(generalTimerRef.current);
      }
      
      // Iniciar temporizadores
      generalTimerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      
      singleProblemTimerRef.current = setInterval(() => {
        setSingleProblemTimer(prev => prev + 1);
      }, 1000);
    }
  }, [exerciseStarted]);

  // FUNCIÓN DE VALIDACIÓN PRINCIPAL
  const checkCurrentAnswer = useCallback(() => {
    if (!currentProblem || waitingForContinue || exerciseCompleted || viewingPrevious) {
      return false;
    }

    if (!exerciseStarted) {
      startExercise();
      return false;
    }

    // Para niveles elementary e intermediate: usar input boxes de propiedad asociativa
    if (settings.difficulty === 'elementary' || settings.difficulty === 'intermediate') {
      if (!currentProblem.grouping1 || !currentProblem.grouping2) {
        setFeedbackMessage("Error: No se pudieron generar las agrupaciones matemáticas.");
        setFeedbackColor("red");
        return false;
      }

      // Obtener valores de los input boxes
      const leftSum1 = document.querySelector('[data-field="leftSum1"]')?.textContent || '';
      const final1 = document.querySelector('[data-field="final1"]')?.textContent || '';
      const rightSum2 = document.querySelector('[data-field="rightSum2"]')?.textContent || '';
      const final2 = document.querySelector('[data-field="final2"]')?.textContent || '';

      if (!leftSum1 || !final1 || !rightSum2 || !final2) {
        setFeedbackMessage("Por favor completa todos los campos antes de verificar.");
        setFeedbackColor("red");
        return false;
      }

      // Validar respuestas
      const userAnswers = {
        leftSum1: parseInt(leftSum1) || 0,
        final1: parseInt(final1) || 0,
        rightSum2: parseInt(rightSum2) || 0,
        final2: parseInt(final2) || 0
      };

      const correctAnswers = {
        leftSum1: currentProblem.grouping1?.leftSum || 0,
        final1: currentProblem.grouping1?.totalSum || 0,
        rightSum2: currentProblem.grouping2?.rightSum || 0,
        final2: currentProblem.grouping2?.totalSum || 0
      };

      const isCorrect = 
        userAnswers.leftSum1 === correctAnswers.leftSum1 &&
        userAnswers.final1 === correctAnswers.final1 &&
        userAnswers.rightSum2 === correctAnswers.rightSum2 &&
        userAnswers.final2 === correctAnswers.final2;

      // Actualizar historial
      const newAttempts = currentAttempts + 1;
      setCurrentAttempts(newAttempts);
      
      const problemIndexForHistory = actualActiveProblemIndexBeforeViewingPrevious;
      const newHistoryEntry: UserAnswerType = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer: currentProblem.correctAnswer,
        isCorrect: isCorrect,
        status: isCorrect ? 'correct' : 'incorrect',
        attempts: newAttempts,
        timestamp: Date.now()
      };
      
      setUserAnswersHistory(prev => {
        const newHistory = [...prev];
        newHistory[problemIndexForHistory] = newHistoryEntry;
        return newHistory;
      });
      setActualActiveProblemIndexBeforeViewingPrevious(problemIndexForHistory);

      if (isCorrect) {
        setFeedbackMessage(`¡Excelente! Has demostrado que ${currentProblem.grouping1?.expression} = ${currentProblem.grouping2?.expression} = ${currentProblem.grouping1?.totalSum}. ¡La propiedad asociativa funciona!`);
        setFeedbackColor("green");
        
        const newConsecutive = consecutiveCorrectAnswers + 1;
        setConsecutiveCorrectAnswers(newConsecutive);
        setConsecutiveIncorrectAnswers(0);
        
        if (newConsecutive > maxConsecutiveStreak) {
          setMaxConsecutiveStreak(newConsecutive);
        }
        
        setWaitingForContinue(true);
      } else {
        setFeedbackMessage("Revisa tus cálculos. Recuerda que la propiedad asociativa dice que (a + b) + c = a + (b + c).");
        setFeedbackColor("red");
        setConsecutiveIncorrectAnswers(prev => prev + 1);
        setConsecutiveCorrectAnswers(0);
      }

      return isCorrect;
    }

    // Para nivel advanced
    if (settings.difficulty === 'advanced') {
      setAdvancedValidationTrigger(prev => prev + 1);
      return false;
    }

    // Para nivel beginner usando dígitos
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
      userAnswer: userNumericAnswer,
      isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      attempts: newAttempts,
      timestamp: Date.now()
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
      setWaitingForContinue(true);
    } else {
      setFeedbackMessage(t('exercises.incorrect'));
      setFeedbackColor("red");
    }

    return isCorrect;
  }, [currentProblem, waitingForContinue, exerciseCompleted, viewingPrevious, exerciseStarted, settings.difficulty, currentAttempts, digitAnswers, consecutiveCorrectAnswers, maxConsecutiveStreak, actualActiveProblemIndexBeforeViewingPrevious, currentProblemIndex, t, checkAnswer, startExercise]);

  // Generar problemas iniciales
  useEffect(() => {
    const problems: AssociativePropertyProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      problems.push(generateAssociativePropertyProblem(settings));
    }
    setProblemsList(problems);
    setCurrentProblem(problems[0] || null);
    setCurrentProblemIndex(0);
    setUserAnswersHistory(new Array(problems.length).fill(null));
  }, [settings]);

  // Inicializar dígitos para nivel beginner
  useEffect(() => {
    if (currentProblem && settings.difficulty === 'beginner') {
      const maxDigits = currentProblem.answerMaxDigits || 3;
      setDigitAnswers(new Array(maxDigits).fill(''));
      setActiveDigitIndex(0);
    }
  }, [currentProblem, settings.difficulty]);

  // Renderizar el componente
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Propiedad Asociativa</h1>
          <p className="text-gray-600">Aprende que (a + b) + c = a + (b + c)</p>
        </div>

        {currentProblem && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {settings.difficulty === 'advanced' ? (
              <AdvancedExercise 
                problem={currentProblem}
                validationTrigger={advancedValidationTrigger}
                onValidationComplete={(isCorrect) => {
                  if (isCorrect) {
                    setFeedbackMessage("¡Correcto! Has aplicado correctamente la propiedad asociativa.");
                    setFeedbackColor("green");
                    setWaitingForContinue(true);
                  } else {
                    setFeedbackMessage("Revisa tu trabajo. Recuerda que la propiedad asociativa permite reagrupar los sumandos.");
                    setFeedbackColor("red");
                  }
                }}
              />
            ) : settings.difficulty === 'elementary' || settings.difficulty === 'intermediate' ? (
              <ProgressiveGroupingDisplay 
                problem={currentProblem}
                onComplete={(finalAnswer) => {
                  // Handle completion if needed
                }}
              />
            ) : (
              <div className="text-center">
                <p className="text-lg mb-4">Resuelve: {currentProblem.operands.join(' + ')} = ?</p>
                <div className="flex justify-center gap-2 mb-4">
                  {digitAnswers.map((digit, index) => (
                    <div
                      key={index}
                      className={`w-12 h-14 border-2 rounded-md flex items-center justify-center text-xl font-bold
                        ${index === activeDigitIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                        ${digit ? 'bg-white' : 'bg-gray-50'}
                      `}
                      onClick={() => setActiveDigitIndex(index)}
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {feedbackMessage && (
          <div className={`text-center mb-6 p-4 rounded-lg ${
            feedbackColor === 'green' ? 'bg-green-100 text-green-800' : 
            feedbackColor === 'red' ? 'bg-red-100 text-red-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {feedbackMessage}
          </div>
        )}

        <div className="text-center">
          {!waitingForContinue && (
            <Button 
              onClick={checkCurrentAnswer}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              <Check className="w-5 h-5 mr-2" />
              Verificar Respuesta
            </Button>
          )}
          
          {waitingForContinue && (
            <Button 
              onClick={() => {
                setWaitingForContinue(false);
                setFeedbackMessage("");
                // Avanzar al siguiente problema
                if (currentProblemIndex < problemsList.length - 1) {
                  const nextIndex = currentProblemIndex + 1;
                  setCurrentProblemIndex(nextIndex);
                  setCurrentProblem(problemsList[nextIndex]);
                  setCurrentAttempts(0);
                } else {
                  setExerciseCompleted(true);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              Continuar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}