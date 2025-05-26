// Exercise.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateSubtractionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, SubtractionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube, X, Minus, Maximize2, Minimize2, Play } from "lucide-react";
import { ProfessorModeWithSync as ProfessorMode } from "./components/professor/ProfessorModeWithSync";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/hooks/use-translations";
// Importar el tipo MathProblem para el formato estándar de problemas
import { MathProblem } from '../../components/ProblemRenderer';
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus'; // Eliminado 'on', 'off' ya que no se usan directamente aquí
import LevelUpHandler from "@/components/LevelUpHandler";
import { Link } from "wouter";

import ExerciseHistoryDialog from "@/components/ExerciseHistoryDialog";
import { useRewards, RewardModal, useRewardQueue, RewardUtils } from '@/rewards';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
const digitBoxFocusStyle = "border-blue-500 ring-2 ring-blue-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300";
const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const minusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const sumLineStyle = "border-t-2 border-gray-700 my-1";

// Interface para los metadatos de videos de YouTube
interface YoutubeVideoMetadata {
  url: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
  loading: boolean;
  error: boolean;
}

// Componente para gestionar videos explicativos de YouTube
function YoutubeVideoManager({
  videos = [],
  onSave,
  onClose,
  isOpen
}: {
  videos: string[];
  onSave: (videos: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
}) {
  const [videoLinks, setVideoLinks] = useState<string[]>([...videos]);
  const [isEditMode, setIsEditMode] = useState(videos.length === 0);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Función para extraer el ID del video de YouTube de una URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // ID directo
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleVideoChange = (index: number, value: string) => {
    const newLinks = [...videoLinks];
    newLinks[index] = value;
    setVideoLinks(newLinks);
  };

  const addVideoInput = () => {
    if (videoLinks.length < 2) {
      setVideoLinks([...videoLinks, '']);
    }
  };

  const removeVideo = (index: number) => {
    const newLinks = [...videoLinks];
    newLinks.splice(index, 1);
    setVideoLinks(newLinks);
  };

  const handleSave = () => {
    // Filtrar enlaces vacíos
    const filteredLinks = videoLinks.filter(link => link.trim() !== '');
    onSave(filteredLinks);
    setIsEditMode(false);
    if (filteredLinks.length === 0) {
      onClose();
    }
  };

  const handleEnterEditMode = () => {
    setCurrentPlayingVideo(null);
    setIsEditMode(true);
    setVideoLinks([...videos]);
  };

  const playVideo = (videoId: string) => {
    setCurrentPlayingVideo(videoId);
  };

  const stopVideo = () => {
    setCurrentPlayingVideo(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCurrentPlayingVideo(null);
          onClose();
        }
      }}
    >
      <DialogContent className={`${isFullscreen ? 'w-[95vw] h-[95vh] max-w-none' : 'max-w-4xl max-h-[80vh]'} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              {isEditMode ? 'Manage Explanation Videos' : 'Watch Explanation Videos'}
            </span>
            <div className="flex gap-2">
              {currentPlayingVideo && (
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isEditMode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add YouTube video URLs or video IDs to provide explanations for this difficulty level.
            </p>
            
            {videoLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={link}
                  onChange={(e) => handleVideoChange(index, e.target.value)}
                  placeholder="YouTube URL or Video ID (e.g., dQw4w9WgXcQ)"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeVideo(index)}
                  disabled={videoLinks.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {videoLinks.length < 2 && (
              <Button variant="outline" onClick={addVideoInput} className="w-full">
                Add Another Video
              </Button>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Videos
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.length === 0 ? (
              <div className="text-center py-8">
                <Youtube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No explanation videos available for this difficulty level.</p>
                <Button onClick={handleEnterEditMode}>
                  Add Videos
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {videos.length} explanation video{videos.length > 1 ? 's' : ''} available
                  </p>
                  <Button variant="outline" size="sm" onClick={handleEnterEditMode}>
                    Edit Videos
                  </Button>
                </div>
                
                {currentPlayingVideo ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Now Playing</h4>
                      <Button variant="outline" size="sm" onClick={stopVideo}>
                        Stop Video
                      </Button>
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${currentPlayingVideo}?autoplay=1`}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {videos.map((videoUrl, index) => {
                      const videoId = extractVideoId(videoUrl);
                      if (!videoId) return null;
                      
                      return (
                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                            alt={`Video ${index + 1}`}
                            className="w-24 h-18 rounded object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">Explanation Video {index + 1}</h4>
                            <p className="text-sm text-gray-600">Click to watch this explanation</p>
                          </div>
                          <Button onClick={() => playVideo(videoId)}>
                            <Play className="h-4 w-4 mr-2" />
                            Watch
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const { t } = useTranslations();
  const { logExerciseResult } = useProgress();
  
  // Estados principales del ejercicio
  const [currentProblem, setCurrentProblem] = useState<SubtractionProblem | null>(null);
  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswerType[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [problemsList, setProblemsList] = useState<SubtractionProblem[]>([]);
  const [timer, setTimer] = useState(0);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('rtl');
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Estados para navegación y vista
  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState(0);
  
  // Estados para videos explicativos
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  
  // Estados para historial de ejercicios
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  // Estados para modo profesor
  const [showProfessorMode, setShowProfessorMode] = useState(false);
  
  // Estados para recompensas
  const { showReward, rewardData, hideReward } = useRewardQueue();
  
  // Referencias
  const digitBoxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const waitingRef = useRef(false);

  // Generar primer problema al cargar
  useEffect(() => {
    if (!currentProblem && !exerciseStarted) {
      const firstProblem = generateSubtractionProblem(settings.difficulty);
      firstProblem.index = 1;
      firstProblem.total = settings.problemCount;
      setCurrentProblem(firstProblem);
      setDigitAnswers(Array(firstProblem.answerMaxDigits).fill(""));
      console.log("[SUBTRACTION] Primer problema generado:", firstProblem);
    }
  }, [currentProblem, exerciseStarted, settings.difficulty, settings.problemCount]);

  // Funciones principales
  const startExercise = useCallback(() => {
    if (!currentProblem) return;
    
    setExerciseStarted(true);
    setProblemsList([currentProblem]);
    
    if (settings.timeLimit === "per-problem" && settings.timeValue > 0) {
      singleProblemTimerRef.current = window.setTimeout(() => {
        if (!waitingRef.current) {
          checkCurrentAnswer();
        }
      }, settings.timeValue * 1000);
    }
  }, [currentProblem, settings]);

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
      eventBus.emit('correctAnswer');
      
      if (settings.showImmediateFeedback) {
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 1500);
      }
      
      // Proceder al siguiente problema o completar ejercicio
      if (currentProblemIndex + 1 >= settings.problemCount) {
        completeExercise();
      } else {
        moveToNextProblem();
      }
    } else {
      setFeedbackMessage(t('exercises.tryAgain'));
      setFeedbackColor("red");
      eventBus.emit('incorrectAnswer');
      
      if (settings.showImmediateFeedback) {
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 1500);
      }
      
      if (newAttempts >= settings.maxAttempts) {
        // Mostrar respuesta correcta y continuar
        showCorrectAnswerAndContinue();
      }
    }
    
    return isCorrect;
  }, [currentProblem, digitAnswers, currentAttempts, exerciseCompleted, viewingPrevious, exerciseStarted, currentProblemIndex, settings, t, startExercise]);

  const moveToNextProblem = useCallback(() => {
    const nextIndex = currentProblemIndex + 1;
    const nextProblem = generateSubtractionProblem(settings.difficulty);
    nextProblem.index = nextIndex + 1;
    nextProblem.total = settings.problemCount;
    
    setCurrentProblem(nextProblem);
    setCurrentProblemIndex(nextIndex);
    setDigitAnswers(Array(nextProblem.answerMaxDigits).fill(""));
    setCurrentAttempts(0);
    setFocusedDigitIndex(direction === 'rtl' ? nextProblem.answerMaxDigits - 1 : 0);
    
    setProblemsList(prev => [...prev, nextProblem]);
    
    // Reiniciar temporizador por problema
    if (settings.timeLimit === "per-problem" && settings.timeValue > 0) {
      if (singleProblemTimerRef.current) {
        clearTimeout(singleProblemTimerRef.current);
      }
      singleProblemTimerRef.current = window.setTimeout(() => {
        if (!waitingRef.current) {
          checkCurrentAnswer();
        }
      }, settings.timeValue * 1000);
    }
  }, [currentProblemIndex, settings, direction, checkCurrentAnswer]);

  const showCorrectAnswerAndContinue = useCallback(() => {
    if (!currentProblem) return;
    
    const correctAnswer = currentProblem.correctAnswer.toString();
    const paddedAnswer = correctAnswer.padStart(currentProblem.answerMaxDigits, '0');
    setDigitAnswers(paddedAnswer.split(''));
    
    setTimeout(() => {
      if (currentProblemIndex + 1 >= settings.problemCount) {
        completeExercise();
      } else {
        moveToNextProblem();
      }
    }, 2000);
  }, [currentProblem, currentProblemIndex, settings.problemCount, moveToNextProblem]);

  const completeExercise = useCallback(() => {
    setExerciseCompleted(true);
    
    if (generalTimerRef.current) {
      clearInterval(generalTimerRef.current);
    }
    if (singleProblemTimerRef.current) {
      clearTimeout(singleProblemTimerRef.current);
    }
    
    const correctAnswers = userAnswersHistory.filter(answer => answer.isCorrect).length;
    const totalProblems = userAnswersHistory.length;
    const accuracy = totalProblems > 0 ? (correctAnswers / totalProblems) * 100 : 0;
    
    // Registrar resultado del ejercicio
    logExerciseResult({
      operation: 'subtraction',
      difficulty: settings.difficulty,
      problemCount: settings.problemCount,
      correctAnswers,
      totalTime: timer,
      accuracy,
      userAnswers: userAnswersHistory
    });
    
    // Mostrar recompensa si está habilitada
    if (settings.enableRewards && accuracy >= 70) {
      RewardUtils.triggerReward(settings.rewardType || 'stars', correctAnswers);
    }
  }, [userAnswersHistory, timer, settings, logExerciseResult]);

  // Efectos para temporizadores
  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted) {
      generalTimerRef.current = window.setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => { if (generalTimerRef.current) clearInterval(generalTimerRef.current); };
  }, [exerciseStarted, exerciseCompleted]);

  // Manejo de input de teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (exerciseCompleted || viewingPrevious) return;

    const key = e.key;
    
    if (key >= '0' && key <= '9') {
      e.preventDefault();
      const newDigitAnswers = [...digitAnswers];
      newDigitAnswers[index] = key;
      setDigitAnswers(newDigitAnswers);
      
      // Mover foco automáticamente
      if (direction === 'rtl' && index > 0) {
        setFocusedDigitIndex(index - 1);
      } else if (direction === 'ltr' && index < digitAnswers.length - 1) {
        setFocusedDigitIndex(index + 1);
      }
    } else if (key === 'Backspace' || key === 'Delete') {
      e.preventDefault();
      const newDigitAnswers = [...digitAnswers];
      newDigitAnswers[index] = '';
      setDigitAnswers(newDigitAnswers);
      
      if (key === 'Backspace') {
        if (direction === 'rtl' && index < digitAnswers.length - 1) {
          setFocusedDigitIndex(index + 1);
        } else if (direction === 'ltr' && index > 0) {
          setFocusedDigitIndex(index - 1);
        }
      }
    } else if (key === 'Enter') {
      e.preventDefault();
      checkCurrentAnswer();
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      const nextIndex = direction === 'rtl' ? index + 1 : index - 1;
      if (nextIndex >= 0 && nextIndex < digitAnswers.length) {
        setFocusedDigitIndex(nextIndex);
      }
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = direction === 'rtl' ? index - 1 : index + 1;
      if (nextIndex >= 0 && nextIndex < digitAnswers.length) {
        setFocusedDigitIndex(nextIndex);
      }
    }
  }, [digitAnswers, direction, exerciseCompleted, viewingPrevious, checkCurrentAnswer]);

  // Enfocar caja de dígito automáticamente
  useEffect(() => {
    if (focusedDigitIndex !== null && !viewingPrevious && digitBoxRefs.current[focusedDigitIndex]) {
      setTimeout(() => digitBoxRefs.current[focusedDigitIndex]?.focus(), 0);
    }
  }, [focusedDigitIndex, viewingPrevious]);

  // Configurar foco inicial
  useEffect(() => {
    if (currentProblem && !exerciseCompleted && !viewingPrevious) {
      const initialIndex = direction === 'rtl' ? currentProblem.answerMaxDigits - 1 : 0;
      setFocusedDigitIndex(initialIndex);
    }
  }, [currentProblem, direction, exerciseCompleted, viewingPrevious]);

  // Formatear operandos para visualización vertical
  const getFormattedOperands = () => {
    if (!currentProblem) return [];
    
    const alignInfo = getVerticalAlignmentInfo(currentProblem);
    if (!alignInfo) return [];
    
    return [
      {
        intStr: currentProblem.minuend.toString(),
        decStr: ''
      },
      {
        intStr: currentProblem.subtrahend.toString(),
        decStr: ''
      }
    ];
  };

  const operandsFormatted = getFormattedOperands();
  const maxDecLength = 0; // Para resta simple, no hay decimales por ahora
  const sumLineTotalCharWidth = currentProblem ? Math.max(
    currentProblem.minuend.toString().length,
    currentProblem.subtrahend.toString().length,
    currentProblem.answerMaxDigits
  ) : 5;

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating subtraction problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4" data-replit-metadata='{"role": "exercise-container"}'>
      {/* Header con progreso y controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Minus className="h-6 w-6 text-red-600" />
              Subtraction Exercise
            </h1>
            {exerciseStarted && (
              <p className="text-sm text-gray-600">
                Problem {currentProblemIndex + 1} of {settings.problemCount} • {formatTime(timer)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {exerciseStarted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVideoDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Youtube className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      {/* Barra de progreso */}
      {exerciseStarted && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentProblemIndex + (exerciseCompleted ? 1 : 0)) / settings.problemCount) * 100)}%
            </span>
          </div>
          <ProgressBarUI 
            value={((currentProblemIndex + (exerciseCompleted ? 1 : 0)) / settings.problemCount) * 100}
            className="w-full h-2"
          />
        </div>
      )}

      {/* Área principal del ejercicio */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        {!exerciseStarted ? (
          <div className="text-center py-8">
            <Minus className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Start?</h2>
            <p className="text-gray-600 mb-6">
              You'll solve {settings.problemCount} subtraction problems at {settings.difficulty} difficulty.
            </p>
            <Button
              onClick={startExercise}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Start Exercise
            </Button>
          </div>
        ) : exerciseCompleted ? (
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Exercise Complete!</h2>
            <div className="text-gray-600 mb-6 space-y-1">
              <p>Correct answers: {userAnswersHistory.filter(a => a.isCorrect).length} / {userAnswersHistory.length}</p>
              <p>Total time: {formatTime(timer)}</p>
              <p>Accuracy: {Math.round((userAnswersHistory.filter(a => a.isCorrect).length / userAnswersHistory.length) * 100)}%</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Link href="/">
                <Button>
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Controles de navegación */}
            {userAnswersHistory.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentProblemIndex > 0) {
                      setViewingPrevious(true);
                      setCurrentProblemIndex(currentProblemIndex - 1);
                    }
                  }}
                  disabled={currentProblemIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Problem {currentProblemIndex + 1} of {settings.problemCount}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (viewingPrevious) {
                      setViewingPrevious(false);
                      setCurrentProblemIndex(actualActiveProblemIndexBeforeViewingPrevious);
                    }
                  }}
                  disabled={!viewingPrevious}
                >
                  Current
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Área de visualización del problema */}
            <div className="p-4 rounded-lg mb-4 shadow-sm bg-gray-50 border">
              {currentProblem.layout === 'horizontal' ? (
                <div className="text-2xl font-bold flex items-center justify-center gap-2">
                  <span>{currentProblem.minuend}</span>
                  <span className="text-gray-600">-</span>
                  <span>{currentProblem.subtrahend}</span>
                  <span className="text-gray-600">=</span>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="inline-block text-right my-1 sm:my-2">
                    {operandsFormatted.map((op, index) => (
                      <div key={`op-${index}-${currentProblem.id}`} className={verticalOperandStyle}>
                        {index === operandsFormatted.length - 1 && operandsFormatted.length > 1 && <span className={minusSignVerticalStyle}>-</span>}
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
                </div>
              )}

              {/* Cajas de entrada para la respuesta */}
              <div className="mt-4 flex items-center justify-center gap-1">
                {Array(currentProblem.answerMaxDigits).fill(0).map((_, index) => {
                  const integerDigitsCount = currentProblem.answerMaxDigits - (currentProblem.answerDecimalPosition || 0);
                  const isVisualDecimalPointAfterThisBox = currentProblem.answerDecimalPosition !== undefined &&
                                                           currentProblem.answerDecimalPosition > 0 &&
                                                           index === integerDigitsCount - 1 &&
                                                           integerDigitsCount < currentProblem.answerMaxDigits;
                  
                  return (
                    <React.Fragment key={`digit-${index}-${currentProblem.id}`}>
                      <input
                        ref={el => digitBoxRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digitAnswers[index] || ''}
                        onChange={() => {}} // Manejado por onKeyDown
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setFocusedDigitIndex(index)}
                        className={`
                          ${digitBoxBaseStyle}
                          ${focusedDigitIndex === index ? digitBoxFocusStyle : digitBoxBlurStyle}
                          ${viewingPrevious ? digitBoxDisabledStyle : ''}
                        `}
                        disabled={viewingPrevious}
                        readOnly={viewingPrevious}
                      />
                      {isVisualDecimalPointAfterThisBox && (
                        <span className="text-2xl font-bold text-gray-600 mx-1">.</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Controles de dirección y verificación */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Input direction:</span>
                  <Button
                    variant={direction === 'ltr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDirection('ltr')}
                    disabled={viewingPrevious}
                  >
                    Left to Right
                  </Button>
                  <Button
                    variant={direction === 'rtl' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDirection('rtl')}
                    disabled={viewingPrevious}
                  >
                    Right to Left
                  </Button>
                </div>
                
                {!viewingPrevious && (
                  <Button
                    onClick={checkCurrentAnswer}
                    disabled={digitAnswers.every(d => !d)}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Check Answer
                  </Button>
                )}
              </div>

              {/* Feedback inmediato */}
              {showFeedback && feedbackMessage && (
                <div className={`mt-4 p-3 rounded-lg text-center text-white ${
                  feedbackColor === 'green' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {feedbackMessage}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Diálogos modales */}
      <ExerciseHistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        userAnswers={userAnswersHistory}
        operation="subtraction"
      />

      <YoutubeVideoManager
        videos={videoLinks}
        onSave={setVideoLinks}
        onClose={() => setIsVideoDialogOpen(false)}
        isOpen={isVideoDialogOpen}
      />

      {/* Modal de recompensas */}
      <RewardModal
        isOpen={showReward}
        onClose={hideReward}
        rewardData={rewardData}
      />

      {/* Manejador de subida de nivel */}
      <LevelUpHandler />
    </div>
  );
}