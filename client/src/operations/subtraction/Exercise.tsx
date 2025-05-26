// Exercise.tsx - Subtraction module
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateSubtractionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, SubtractionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube, X, Plus, Maximize2, Minimize2, Play } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

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
const YoutubeVideoDialog = ({
  isOpen,
  onClose,
  videos,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  videos: string[];
  onSave: (newVideos: string[]) => void;
}) => {
  const [videoLinks, setVideoLinks] = useState<string[]>([...videos]);
  const [videosMetadata, setVideosMetadata] = useState<YoutubeVideoMetadata[]>([]);
  const [isEditMode, setIsEditMode] = useState(videos.length === 0);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Función para extraer el ID de video de YouTube de una URL
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Cargar los metadatos de los videos cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && videos.length > 0 && !isEditMode) {
      const fetchVideoMetadata = async () => {
        const metadata: YoutubeVideoMetadata[] = [];

        for (const videoUrl of videos) {
          const videoId = extractYoutubeId(videoUrl);
          if (!videoId) {
            metadata.push({
              url: videoUrl,
              title: "Video no válido",
              thumbnailUrl: "",
              videoId: "",
              loading: false,
              error: true
            });
            continue;
          }

          try {
            // Usamos la API de oEmbed de YouTube para obtener metadatos
            const response = await fetch(`https://www.youtube.com/oembed?url=${videoUrl}&format=json`);

            if (response.ok) {
              const data = await response.json();
              metadata.push({
                url: videoUrl,
                title: data.title || "Video sin título",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                videoId,
                loading: false,
                error: false
              });
            } else {
              throw new Error('Error al obtener metadatos');
            }
          } catch (error) {
            metadata.push({
              url: videoUrl,
              title: "Error al cargar video",
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              videoId,
              loading: false,
              error: true
            });
          }
        }

        setVideosMetadata(metadata);
      };

      fetchVideoMetadata();
    }
  }, [isOpen, videos, isEditMode]);

  const handleSave = () => {
    const validVideos = videoLinks.filter(link => link.trim() !== '' && extractYoutubeId(link));
    onSave(validVideos);
    onClose();
  };

  const addVideoInput = () => {
    setVideoLinks([...videoLinks, '']);
  };

  const removeVideoInput = (index: number) => {
    const newLinks = videoLinks.filter((_, i) => i !== index);
    setVideoLinks(newLinks);
  };

  const updateVideoLink = (index: number, value: string) => {
    const newLinks = [...videoLinks];
    newLinks[index] = value;
    setVideoLinks(newLinks);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Videos Explicativos de Resta
          </DialogTitle>
        </DialogHeader>

        {isEditMode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Agrega enlaces de YouTube que expliquen técnicas de resta:
            </p>
            
            {videoLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={link}
                  onChange={(e) => updateVideoLink(index, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeVideoInput(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <Button onClick={addVideoInput} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Video
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {videosMetadata.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay videos configurados para esta operación.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videosMetadata.map((video, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    {video.error ? (
                      <div className="p-4 text-center text-red-500">
                        <Youtube className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Error al cargar video</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-32 object-cover"
                          />
                          <Button
                            size="sm"
                            className="absolute inset-0 bg-black/50 hover:bg-black/70 text-white"
                            onClick={() => setCurrentPlayingVideo(currentPlayingVideo === video.videoId ? null : video.videoId)}
                          >
                            {currentPlayingVideo === video.videoId ? (
                              <Minimize2 className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6" />
                            )}
                          </Button>
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm truncate">{video.title}</h4>
                        </div>
                        {currentPlayingVideo === video.videoId && (
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {isEditMode ? (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Guardar Videos
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditMode(true)}>
              <Cog className="w-4 h-4 mr-2" />
              Editar Videos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function SubtractionExercise({ settings, onOpenSettings }: ExerciseProps) {
  // Estados principales
  const [problems, setProblems] = useState<SubtractionProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState<UserAnswerType[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [exerciseStartTime] = useState(Date.now());
  const [singleProblemStartTime, setSingleProblemStartTime] = useState(Date.now());
  
  // Estados del temporizador
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [singleProblemTimeElapsed, setSingleProblemTimeElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // Estados de interacción
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Estados de navegación y UI
  const [currentInputIndex, setCurrentInputIndex] = useState(0);
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
  const [showProfessorMode, setShowProfessorMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>([]);
  
  // Estados de recompensas y progreso
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Referencias
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Contextos y hooks
  const { addExerciseResult } = useProgress();
  const { getModuleSettings, updateModuleSettings } = useSettings();
  const translations = useTranslations();
  const { processExerciseResult } = useRewards();
  const { showReward } = useRewardQueue();

  const currentProblem = problems[currentProblemIndex];
  const isLastProblem = currentProblemIndex === problems.length - 1;
  const progress = problems.length > 0 ? ((currentProblemIndex + 1) / problems.length) * 100 : 0;

  // Generar problemas al iniciar
  useEffect(() => {
    generateProblems();
    startExerciseTimer();
    return () => {
      if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    };
  }, [settings.difficulty, settings.problemCount]);

  // Iniciar temporizador del problema individual
  useEffect(() => {
    if (currentProblem && !showFeedback && !revealedAnswer) {
      startSingleProblemTimer();
    }
    return () => {
      if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
      }
    };
  }, [currentProblemIndex, showFeedback, revealedAnswer]);

  const generateProblems = () => {
    const newProblems: SubtractionProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      const problem = generateSubtractionProblem(settings.difficulty as DifficultyLevel);
      problem.index = i + 1;
      problem.total = settings.problemCount;
      newProblems.push(problem);
    }
    setProblems(newProblems);
    setCurrentProblemIndex(0);
    setUserAnswers([]);
    setIsComplete(false);
  };

  const startExerciseTimer = () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    
    exerciseTimerRef.current = setInterval(() => {
      setTimeElapsed(Date.now() - exerciseStartTime);
    }, 1000);
    setIsTimerActive(true);
  };

  const startSingleProblemTimer = () => {
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    
    setSingleProblemStartTime(Date.now());
    setSingleProblemTimeElapsed(0);
    
    singleProblemTimerRef.current = setInterval(() => {
      setSingleProblemTimeElapsed(Date.now() - singleProblemStartTime);
    }, 1000);
  };

  const stopSingleProblemTimer = () => {
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentProblem || userAnswer.trim() === "") return;

    const numericAnswer = parseFloat(userAnswer);
    const isCorrect = checkAnswer(currentProblem, numericAnswer);
    const currentAttempts = attempts + 1;
    
    stopSingleProblemTimer();

    const answerData: UserAnswerType = {
      problemId: currentProblem.id,
      problem: {
        id: currentProblem.id,
        operands: currentProblem.operands.map(value => ({ value })),
        operator: '-',
        correctAnswer: currentProblem.correctAnswer,
        displayFormat: currentProblem.layout,
        difficulty: settings.difficulty as DifficultyLevel,
        allowDecimals: currentProblem.answerDecimalPosition !== undefined,
        maxAttempts: settings.maxAttempts
      },
      userAnswer: numericAnswer,
      isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      attempts: currentAttempts,
      timestamp: Date.now(),
      timeTaken: singleProblemTimeElapsed
    };

    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const existingIndex = newAnswers.findIndex(a => a.problemId === currentProblem.id);
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = answerData;
      } else {
        newAnswers.push(answerData);
      }
      return newAnswers;
    });

    if (isCorrect) {
      setStreak(prev => prev + 1);
      setTotalCorrect(prev => prev + 1);
      
      if (settings.enableSoundEffects) {
        // Reproducir sonido de éxito
      }
      
      if (settings.enableRewards) {
        showReward('correct');
      }
    } else {
      setStreak(0);
      setTotalIncorrect(prev => prev + 1);
      
      if (settings.enableSoundEffects) {
        // Reproducir sonido de error
      }
    }

    setShowFeedback(true);
    setAttempts(currentAttempts);

    // Auto-continuar si está habilitado y la respuesta es correcta
    if (isCorrect && settings.autoContinue) {
      setTimeout(() => {
        handleNextProblem();
      }, 1500);
    }
  };

  const handleNextProblem = () => {
    if (isLastProblem) {
      completeExercise();
    } else {
      setCurrentProblemIndex(prev => prev + 1);
      resetProblemState();
    }
  };

  const handlePreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1);
      resetProblemState();
    }
  };

  const resetProblemState = () => {
    setUserAnswer("");
    setShowFeedback(false);
    setAttempts(0);
    setShowHint(false);
    setRevealedAnswer(false);
    setShowExplanation(false);
    setCurrentInputIndex(0);
    setSingleProblemTimeElapsed(0);
  };

  const completeExercise = () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    
    setIsComplete(true);
    setIsTimerActive(false);

    // Calcular estadísticas del ejercicio
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = userAnswers.length > 0 ? (correctAnswers / userAnswers.length) * 100 : 0;
    const avgTimePerProblem = userAnswers.length > 0 ? timeElapsed / userAnswers.length : 0;
    const avgAttempts = userAnswers.length > 0 ? userAnswers.reduce((sum, a) => sum + a.attempts, 0) / userAnswers.length : 0;
    const revealedAnswers = userAnswers.filter(a => a.status === 'revealed').length;

    const exerciseResult = {
      operationId: 'subtraction',
      date: new Date().toISOString(),
      score: correctAnswers,
      totalProblems: problems.length,
      timeSpent: timeElapsed,
      difficulty: settings.difficulty,
      accuracy,
      avgTimePerProblem,
      avgAttempts,
      revealedAnswers,
      extra_data: {
        version: '1.0',
        timestamp: Date.now(),
        exerciseId: `subtraction_${Date.now()}`,
        problemDetails: userAnswers,
        problems: problems,
        capturedProblems: problems,
        exerciseType: 'subtraction'
      }
    };

    // Guardar resultado
    addExerciseResult(exerciseResult);
    
    // Procesar recompensas
    if (settings.enableRewards) {
      processExerciseResult(exerciseResult);
    }

    // Verificar si hay level up
    if (correctAnswers >= CORRECT_ANSWERS_FOR_LEVEL_UP) {
      setShowLevelUp(true);
      eventBus.emit('levelUp', { operation: 'subtraction', score: correctAnswers });
    }
  };

  const handleRevealAnswer = () => {
    if (!currentProblem) return;
    
    setRevealedAnswer(true);
    setUserAnswer(currentProblem.correctAnswer.toString());
    stopSingleProblemTimer();

    const answerData: UserAnswerType = {
      problemId: currentProblem.id,
      problem: {
        id: currentProblem.id,
        operands: currentProblem.operands.map(value => ({ value })),
        operator: '-',
        correctAnswer: currentProblem.correctAnswer,
        displayFormat: currentProblem.layout,
        difficulty: settings.difficulty as DifficultyLevel,
        allowDecimals: currentProblem.answerDecimalPosition !== undefined,
        maxAttempts: settings.maxAttempts
      },
      userAnswer: currentProblem.correctAnswer,
      isCorrect: false,
      status: 'revealed',
      attempts: attempts + 1,
      timestamp: Date.now(),
      timeTaken: singleProblemTimeElapsed
    };

    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const existingIndex = newAnswers.findIndex(a => a.problemId === currentProblem.id);
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = answerData;
      } else {
        newAnswers.push(answerData);
      }
      return newAnswers;
    });

    setShowFeedback(true);
    setShowExplanation(true);
  };

  const renderProblemDisplay = () => {
    if (!currentProblem) return null;

    const minuend = currentProblem.operands[0];
    const subtrahend = currentProblem.operands[1];

    if (currentProblem.layout === 'vertical') {
      const alignmentInfo = getVerticalAlignmentInfo(
        currentProblem.operands,
        currentProblem.answerDecimalPosition
      );

      return (
        <div className="text-center space-y-2">
          <div className="inline-block font-mono text-right">
            <div className={verticalOperandStyle}>
              {minuend}
            </div>
            <div className="flex items-center justify-end">
              <span className={minusSignVerticalStyle}>-</span>
              <span className={verticalOperandStyle}>
                {subtrahend}
              </span>
            </div>
            <div className={sumLineStyle}></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            {minuend} - {subtrahend} = ?
          </div>
        </div>
      );
    }
  };

  const renderAnswerInput = () => {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2">
          <Input
            ref={(el) => { inputRefs.current[0] = el; }}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !showFeedback) {
                handleSubmitAnswer();
              }
            }}
            disabled={showFeedback || revealedAnswer}
            className="w-24 h-12 text-xl text-center font-bold"
            placeholder="?"
            autoFocus
          />
        </div>
      </div>
    );
  };

  const renderFeedback = () => {
    if (!showFeedback) return null;

    const currentAnswer = userAnswers.find(a => a.problemId === currentProblem?.id);
    const isCorrect = currentAnswer?.isCorrect;

    return (
      <div className={`text-center p-4 rounded-lg mb-4 ${
        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          {isCorrect ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <X className="w-6 h-6" />
          )}
          <span className="font-semibold text-lg">
            {isCorrect ? '¡Correcto!' : 'Incorrecto'}
          </span>
        </div>
        
        {!isCorrect && (
          <div className="text-sm">
            <p>La respuesta correcta es: <strong>{currentProblem?.correctAnswer}</strong></p>
            {revealedAnswer && showExplanation && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
                <p className="font-medium">Explicación:</p>
                <p>{minuend} - {subtrahend} = {currentProblem?.correctAnswer}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-600 mt-2">
          Intentos: {attempts} | Tiempo: {formatTime(singleProblemTimeElapsed)}
        </div>
      </div>
    );
  };

  const renderActionButtons = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {!showFeedback && !revealedAnswer && (
          <>
            <Button
              onClick={handleSubmitAnswer}
              disabled={userAnswer.trim() === ""}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Verificar
            </Button>
            
            {settings.showAnswerWithExplanation && attempts < settings.maxAttempts && (
              <Button
                onClick={handleRevealAnswer}
                variant="outline"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Mostrar Respuesta
              </Button>
            )}
          </>
        )}
        
        {showFeedback && (
          <Button
            onClick={handleNextProblem}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLastProblem ? 'Finalizar' : 'Siguiente'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    );
  };

  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={handlePreviousProblem}
          disabled={currentProblemIndex === 0}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowProfessorMode(true)}
                  variant="outline"
                  size="sm"
                >
                  <History className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Modo Profesor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowYoutubeDialog(true)}
                  variant="outline"
                  size="sm"
                >
                  <Youtube className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Videos Explicativos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onOpenSettings}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configuración</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Button
          onClick={handleNextProblem}
          disabled={isLastProblem}
          variant="outline"
          size="sm"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  };

  const renderProgressBar = () => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Problema {currentProblemIndex + 1} de {problems.length}
          </span>
          <span className="text-sm text-gray-500">
            {formatTime(timeElapsed)}
          </span>
        </div>
        <ProgressBarUI value={progress} className="h-2" />
      </div>
    );
  };

  const renderStats = () => {
    return (
      <div className="flex justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalCorrect}</div>
          <div className="text-xs text-gray-500">Correctas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{totalIncorrect}</div>
          <div className="text-xs text-gray-500">Incorrectas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{streak}</div>
          <div className="text-xs text-gray-500">Racha</div>
        </div>
      </div>
    );
  };

  if (isComplete) {
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = (correctAnswers / problems.length) * 100;
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800">¡Ejercicio Completado!</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{correctAnswers}</div>
              <div className="text-sm text-green-600">Correctas</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{problems.length - correctAnswers}</div>
              <div className="text-sm text-red-600">Incorrectas</div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{accuracy.toFixed(1)}%</div>
              <div className="text-sm text-blue-600">Precisión</div>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{formatTime(timeElapsed)}</div>
              <div className="text-sm text-purple-600">Tiempo Total</div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={generateProblems} className="bg-blue-600 hover:bg-blue-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Nuevo Ejercicio
            </Button>
            <Link href="/">
              <Button variant="outline">
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </div>
        
        {showLevelUp && (
          <LevelUpHandler
            isOpen={showLevelUp}
            onClose={() => setShowLevelUp(false)}
            operation="subtraction"
            newLevel={settings.difficulty}
          />
        )}
        
        <RewardModal />
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Generando problemas de resta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {renderProgressBar()}
      {renderNavigationButtons()}
      {renderStats()}
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {renderProblemDisplay()}
        {renderAnswerInput()}
        {renderFeedback()}
        {renderActionButtons()}
      </div>
      
      <YoutubeVideoDialog
        isOpen={showYoutubeDialog}
        onClose={() => setShowYoutubeDialog(false)}
        videos={youtubeVideos}
        onSave={setYoutubeVideos}
      />
      
      {showHistory && (
        <ExerciseHistoryDialog
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          operation="subtraction"
        />
      )}
      
      <RewardModal />
    </div>
  );
}