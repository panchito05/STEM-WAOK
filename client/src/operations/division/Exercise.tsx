// Exercise.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateDivisionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, DivisionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube, X, Divide, Maximize2, Minimize2, Play } from "lucide-react";
import { ProfessorModeWithSync as ProfessorMode } from "./components/professor/ProfessorModeWithSync";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/hooks/use-translations";
// Importar el tipo MathProblem para el formato estándar de problemas
import { MathProblem } from '../../components/ProblemRenderer';
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import LevelUpHandler from "@/components/LevelUpHandler";
import { Link } from "wouter";

import ExerciseHistoryDialog from "@/components/ExerciseHistoryDialog";
import { useRewards, RewardModal, useRewardQueue, RewardUtils } from '@/rewards';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
const digitBoxFocusStyle = "border-purple-500 ring-2 ring-purple-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300";
const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const divideSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const divisionLineStyle = "border-t-2 border-gray-700 my-1";

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
const YoutubeVideoManager: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onVideoSelect: (videoUrl: string) => void;
}> = ({ isOpen, onClose, onVideoSelect }) => {
  const [videos, setVideos] = useState<YoutubeVideoMetadata[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");

  // Cargar videos guardados desde localStorage
  useEffect(() => {
    const savedVideos = localStorage.getItem('division_youtube_videos');
    if (savedVideos) {
      try {
        setVideos(JSON.parse(savedVideos));
      } catch (e) {
        console.error("Error loading saved videos:", e);
      }
    }
  }, []);

  // Guardar videos en localStorage
  const saveVideos = (updatedVideos: YoutubeVideoMetadata[]) => {
    localStorage.setItem('division_youtube_videos', JSON.stringify(updatedVideos));
    setVideos(updatedVideos);
  };

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const addVideo = async () => {
    if (!newVideoUrl.trim()) return;

    const videoId = extractVideoId(newVideoUrl);
    if (!videoId) {
      alert("URL de YouTube no válida");
      return;
    }

    const newVideo: YoutubeVideoMetadata = {
      url: newVideoUrl,
      title: `Video de División ${videos.length + 1}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      videoId: videoId,
      loading: false,
      error: false
    };

    const updatedVideos = [...videos, newVideo];
    saveVideos(updatedVideos);
    setNewVideoUrl("");
  };

  const removeVideo = (index: number) => {
    const updatedVideos = videos.filter((_, i) => i !== index);
    saveVideos(updatedVideos);
  };

  const handleEnterEditMode = () => {
    setEditMode(true);
  };

  const handleExitEditMode = () => {
    setEditMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Youtube className="mr-2 h-5 w-5 text-red-600" />
            Videos Explicativos de División
          </DialogTitle>
        </DialogHeader>
        
        {editMode ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addVideo} size="sm">
                Agregar
              </Button>
            </div>
            
            <div className="space-y-2">
              {videos.map((video, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-16 h-12 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-video.png';
                      }}
                    />
                    <div>
                      <div className="font-medium text-sm">{video.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {video.url}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVideo(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button onClick={handleExitEditMode}>Terminar edición</Button>
            </DialogFooter>
          </div>
        ) : (
          <div>
            {videos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Youtube className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No hay videos guardados</p>
                <p className="text-sm">Agrega videos explicativos para ayudar con las divisiones</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {videos.map((video, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onVideoSelect(video.url)}
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-24 h-18 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-video.png';
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{video.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Hacer clic para abrir en nueva pestaña
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(video.url, '_blank');
                      }}
                    >
                      <Youtube className="h-4 w-4 mr-2" />
                      Abrir en YouTube
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button type="button" onClick={handleEnterEditMode} variant="outline">
                <Cog className="h-4 w-4 mr-2" />
                Editar videos
              </Button>
              <Button type="button" onClick={onClose}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Acceder a la información de historial mediante el contexto de progreso
  const { exerciseHistory } = useProgress();
  const moduleId = "division"; // ID del módulo de división

  const [problemsList, setProblemsList] = useState<DivisionProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<DivisionProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userInput, setUserInput] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [exerciseComplete, setExerciseComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [problemStartTime, setProblemStartTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [problemTimeLeft, setProblemTimeLeft] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [exercises, setExercises] = useState<UserAnswerType[]>([]);
  
  // Estados para la gestión de historial
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  // Estados para videos explicativos
  const [showVideoManager, setShowVideoManager] = useState(false);
  
  // Estado para el modo profesor
  const [showProfessorMode, setProfessorMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estado para contador de streaks
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  
  // Estado para problemas compensatorios
  const [compensationProblems, setCompensationProblems] = useState(0);
  
  // Estados para el sistema de recompensas
  const { addToQueue, isModalOpen, closeModal, currentReward } = useRewards({ moduleId: 'division' });
  
  // Referencias para gestión de temporizadores
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const problemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { updateProgress, loadProgress } = useProgress();
  const { updateModuleSettings } = useSettings();

  // Estado para modo de entrada por dígitos
  const [digitInput, setDigitInput] = useState<string[]>([]);
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [showDigitInput, setShowDigitInput] = useState(false);

  // Obtener traducciones
  const { t } = useTranslations();

  // Cargar progreso desde el contexto al inicializar
  useEffect(() => {
    const savedProgress = loadProgress(moduleId);
    if (savedProgress && savedProgress.consecutiveCorrectAnswers !== undefined) {
      setConsecutiveCorrect(savedProgress.consecutiveCorrectAnswers);
      console.log(`[DIVISION] Cargando progreso: ${savedProgress.consecutiveCorrectAnswers} respuestas correctas consecutivas`);
    }
    if (savedProgress && savedProgress.longestStreak !== undefined) {
      setLongestStreak(savedProgress.longestStreak);
      console.log(`[DIVISION] Cargando progreso: ${savedProgress.longestStreak} racha más larga`);
    }
  }, [loadProgress, moduleId]);

  // Actualizar progreso en el contexto cuando cambie el contador
  useEffect(() => {
    updateProgress(moduleId, {
      consecutiveCorrectAnswers: consecutiveCorrect,
      longestStreak: Math.max(longestStreak, consecutiveCorrect),
      maxConsecutiveStreak: Math.max(longestStreak, consecutiveCorrect)
    });
    console.log(`[DIVISION] Actualizando progreso: ${consecutiveCorrect} respuestas correctas consecutivas, racha más larga: ${Math.max(longestStreak, consecutiveCorrect)}`);
  }, [consecutiveCorrect, longestStreak, updateProgress, moduleId]);

  // Función para generar lista de problemas
  const generateProblems = useCallback(() => {
    console.log(`[DIVISION] Generando ${settings.problemCount} problemas de dificultad ${settings.difficulty}`);
    const problems: DivisionProblem[] = [];
    for (let i = 0; i < settings.problemCount + compensationProblems; i++) {
      const problem = generateDivisionProblem(settings.difficulty as DifficultyLevel);
      problem.index = i + 1;
      problem.total = settings.problemCount + compensationProblems;
      problems.push(problem);
    }
    return problems;
  }, [settings.problemCount, settings.difficulty, compensationProblems]);

  // Inicializar problemas al cargar el componente o cambiar configuraciones
  useEffect(() => {
    const problems = generateProblems();
    setProblemsList(problems);
    setCurrentProblem(problems[0] || null);
    setCurrentProblemIndex(0);
    setExerciseComplete(false);
    setScore(0);
    setStartTime(Date.now());
    setProblemStartTime(Date.now());
    setExercises([]);
    
    // Configurar temporizadores según la configuración
    if (settings.timeValue > 0) {
      if (settings.timeLimit === "total") {
        setTimeLeft(settings.timeValue);
        setProblemTimeLeft(null);
      } else {
        setTimeLeft(null);
        setProblemTimeLeft(settings.timeValue);
      }
    } else {
      setTimeLeft(null);
      setProblemTimeLeft(null);
    }
    
    console.log(`[DIVISION] Ejercicio inicializado con ${problems.length} problemas`);
  }, [generateProblems, settings.timeValue, settings.timeLimit]);

  // Gestión de temporizadores
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft]);

  useEffect(() => {
    if (problemTimeLeft !== null && problemTimeLeft > 0) {
      problemTimerRef.current = setTimeout(() => {
        setProblemTimeLeft(problemTimeLeft - 1);
      }, 1000);
    } else if (problemTimeLeft === 0) {
      handleProblemTimeUp();
    }
    
    return () => {
      if (problemTimerRef.current) {
        clearTimeout(problemTimerRef.current);
      }
    };
  }, [problemTimeLeft]);

  const handleTimeUp = () => {
    console.log("[DIVISION] Tiempo total agotado");
    setExerciseComplete(true);
  };

  const handleProblemTimeUp = () => {
    console.log("[DIVISION] Tiempo del problema agotado");
    if (currentProblem) {
      handleSubmit(true); // true indica que el tiempo se agotó
    }
  };

  // Función para verificar si se debe aumentar la dificultad automáticamente
  const checkAdaptiveDifficulty = useCallback(() => {
    if (!settings.enableAdaptiveDifficulty) return;
    
    if (consecutiveCorrect >= CORRECT_ANSWERS_FOR_LEVEL_UP) {
      const currentDifficultyIndex = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'].indexOf(settings.difficulty);
      if (currentDifficultyIndex < 4) { // No superar 'expert'
        const newDifficulty = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'][currentDifficultyIndex + 1];
        console.log(`[DIVISION] Subiendo dificultad de ${settings.difficulty} a ${newDifficulty} por ${consecutiveCorrect} respuestas correctas consecutivas`);
        
        // Actualizar configuración del módulo
        updateModuleSettings("division", {
          ...settings,
          difficulty: newDifficulty
        });
        
        // Emitir evento de subida de nivel
        eventBus.emit('levelUp', {
          module: 'division',
          oldLevel: settings.difficulty,
          newLevel: newDifficulty,
          correctAnswers: consecutiveCorrect
        });
        
        // Resetear contador pero mantener en el máximo para no perder progreso
        setConsecutiveCorrect(CORRECT_ANSWERS_FOR_LEVEL_UP);
      }
    }
  }, [consecutiveCorrect, settings, updateModuleSettings]);

  // Función para manejar envío de respuesta
  const handleSubmit = useCallback((timeExpired: boolean = false) => {
    if (!currentProblem) return;

    const timeTaken = Date.now() - problemStartTime;
    const userAnswer = timeExpired ? -1 : parseFloat(userInput);
    let isAnswerCorrect = false;
    
    if (!timeExpired && !isNaN(userAnswer)) {
      isAnswerCorrect = checkAnswer(currentProblem, userAnswer);
    }

    const result: UserAnswerType = {
      problemId: currentProblem.id,
      problem: currentProblem as any, // Conversión temporal para compatibilidad
      userAnswer: userAnswer,
      isCorrect: isAnswerCorrect,
      status: timeExpired ? 'timeout' : (isAnswerCorrect ? 'correct' : 'incorrect'),
      attempts: attempts + 1,
      timestamp: Date.now(),
      timeTaken: timeTaken
    };

    setExercises(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(ex => ex.problemId === currentProblem.id);
      if (existingIndex >= 0) {
        updated[existingIndex] = result;
      } else {
        updated.push(result);
      }
      return updated;
    });

    if (isAnswerCorrect) {
      setIsCorrect(true);
      setFeedback(settings.language === "english" ? "Correct!" : "¡Correcto!");
      setScore(prev => prev + 1);
      
      // Actualizar contador de respuestas correctas consecutivas
      const newConsecutiveCorrect = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutiveCorrect);
      setLongestStreak(prev => Math.max(prev, newConsecutiveCorrect));
      
      console.log(`[CONTADOR-V2] Actualizado contador de respuestas correctas consecutivas a ${newConsecutiveCorrect}`);
      
      // Verificar dificultad adaptativa
      checkAdaptiveDifficulty();
      
      // Agregar recompensa
      if (settings.enableRewards) {
        addReward({
          type: settings.rewardType as any,
          message: settings.language === "english" ? "Great job!" : "¡Buen trabajo!"
        });
      }
      
      // Continuar automáticamente después de un breve delay
      setTimeout(() => {
        nextProblem();
      }, 1500);
    } else {
      setIsCorrect(false);
      setAttempts(prev => prev + 1);
      
      // Resetear contador de respuestas correctas consecutivas
      setConsecutiveCorrect(0);
      console.log(`[CONTADOR-V2] Reseteado contador de respuestas correctas consecutivas a 0`);
      
      if (timeExpired) {
        setFeedback(settings.language === "english" ? "Time's up!" : "¡Se acabó el tiempo!");
      } else {
        setFeedback(settings.language === "english" ? "Incorrect. Try again!" : "Incorrecto. ¡Inténtalo de nuevo!");
      }
      
      const maxAttempts = settings.maxAttempts || 3;
      if (attempts + 1 >= maxAttempts || timeExpired) {
        // Agregar problema compensatorio si está habilitado
        if (settings.enableCompensation) {
          setCompensationProblems(prev => prev + 1);
        }
        
        setTimeout(() => {
          nextProblem();
        }, 2000);
      }
    }

    // Limpiar entrada si es incorrecto o continuar
    if (!isAnswerCorrect || timeExpired) {
      setUserInput("");
      setDigitInput([]);
      setCurrentDigitIndex(0);
    }
  }, [currentProblem, userInput, attempts, problemStartTime, settings, consecutiveCorrect, checkAdaptiveDifficulty, addReward]);

  // Función para ir al siguiente problema
  const nextProblem = () => {
    const nextIndex = currentProblemIndex + 1;
    
    if (nextIndex >= problemsList.length) {
      // Ejercicio completado
      setExerciseComplete(true);
      const endTime = Date.now();
      const totalTime = Math.round((endTime - startTime) / 1000);
      
      console.log(`[DIVISION] Ejercicio completado. Puntuación: ${score}/${problemsList.length}, Tiempo: ${totalTime}s`);
      return;
    }
    
    // Continuar con el siguiente problema
    setCurrentProblemIndex(nextIndex);
    setCurrentProblem(problemsList[nextIndex]);
    setUserInput("");
    setDigitInput([]);
    setCurrentDigitIndex(0);
    setFeedback("");
    setIsCorrect(null);
    setAttempts(0);
    setShowAnswer(false);
    setShowExplanation(false);
    setProblemStartTime(Date.now());
    
    // Reiniciar temporizador por problema si está configurado
    if (settings.timeLimit === "per-problem" && settings.timeValue > 0) {
      setProblemTimeLeft(settings.timeValue);
    }
    
    // Enfocar en el input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Función para ir al problema anterior
  const previousProblem = () => {
    if (currentProblemIndex > 0) {
      const prevIndex = currentProblemIndex - 1;
      setCurrentProblemIndex(prevIndex);
      setCurrentProblem(problemsList[prevIndex]);
      setUserInput("");
      setDigitInput([]);
      setCurrentDigitIndex(0);
      setFeedback("");
      setIsCorrect(null);
      setAttempts(0);
      setShowAnswer(false);
      setShowExplanation(false);
      setProblemStartTime(Date.now());
      
      // Reiniciar temporizador por problema si está configurado
      if (settings.timeLimit === "per-problem" && settings.timeValue > 0) {
        setProblemTimeLeft(settings.timeValue);
      }
    }
  };

  // Función para mostrar respuesta con explicación
  const handleShowAnswer = () => {
    if (currentProblem) {
      setShowAnswer(true);
      setUserInput(currentProblem.correctAnswer.toString());
      
      // Agregar problema compensatorio si está habilitado
      if (settings.enableCompensation) {
        setCompensationProblems(prev => prev + 1);
      }
      
      // Resetear contador de respuestas correctas consecutivas
      setConsecutiveCorrect(0);
      console.log(`[CONTADOR-V2] Reseteado contador de respuestas correctas consecutivas a 0 por mostrar respuesta`);
    }
  };

  // Función para reiniciar ejercicio
  const restartExercise = () => {
    const problems = generateProblems();
    setProblemsList(problems);
    setCurrentProblem(problems[0] || null);
    setCurrentProblemIndex(0);
    setUserInput("");
    setDigitInput([]);
    setCurrentDigitIndex(0);
    setFeedback("");
    setIsCorrect(null);
    setAttempts(0);
    setShowAnswer(false);
    setShowExplanation(false);
    setExerciseComplete(false);
    setScore(0);
    setStartTime(Date.now());
    setProblemStartTime(Date.now());
    setExercises([]);
    setCompensationProblems(0);
    
    // Reiniciar temporizadores
    if (settings.timeValue > 0) {
      if (settings.timeLimit === "total") {
        setTimeLeft(settings.timeValue);
        setProblemTimeLeft(null);
      } else {
        setTimeLeft(null);
        setProblemTimeLeft(settings.timeValue);
      }
    }
    
    console.log("[DIVISION] Ejercicio reiniciado");
  };

  // Manejar entrada de teclado
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Enfocar input al cargar
  useEffect(() => {
    if (inputRef.current && !exerciseComplete) {
      inputRef.current.focus();
    }
  }, [currentProblem, exerciseComplete]);

  // Función para renderizar el problema en formato vertical
  const renderVerticalProblem = (problem: DivisionProblem) => {
    if (!problem) return null;

    const { dividendFormatted, divisorFormatted, divisionLineTotalCharWidth } = 
      getVerticalAlignmentInfo(problem.dividend, problem.divisor, problem.answerDecimalPosition);

    return (
      <div className="flex flex-col items-center space-y-2 bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-4">
            {settings.language === "english" ? "Solve the division:" : "Resuelve la división:"}
          </div>
          
          {/* Formato de división larga */}
          <div className="font-mono text-2xl">
            <div className="flex items-center justify-center">
              <div className="text-right mr-2">{problem.divisor}</div>
              <div className="border-l-2 border-t-2 border-gray-700 p-2">
                {problem.dividend}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-lg text-gray-600">
            {settings.language === "english" ? "Quotient:" : "Cociente:"}
          </div>
        </div>
      </div>
    );
  };

  // Función para renderizar el problema en formato horizontal
  const renderHorizontalProblem = (problem: DivisionProblem) => {
    if (!problem) return null;

    return (
      <div className="flex flex-col items-center space-y-4 bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-4">
            {settings.language === "english" ? "Solve the division:" : "Resuelve la división:"}
          </div>
          
          <div className="text-3xl font-bold text-gray-800 flex items-center justify-center space-x-3">
            <span>{problem.dividend}</span>
            <Divide className="h-8 w-8 text-purple-600" />
            <span>{problem.divisor}</span>
            <span className="text-purple-600">=</span>
            <span className="text-purple-600">?</span>
          </div>
          
          {problem.hasRemainder && (
            <div className="mt-2 text-sm text-gray-500">
              {settings.language === "english" ? 
                "(This division may have a remainder)" : 
                "(Esta división puede tener resto)"}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Función para manejar la selección de video de YouTube
  const handleVideoSelect = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
    setShowVideoManager(false);
  };

  // Si el ejercicio está completo, mostrar resumen
  if (exerciseComplete) {
    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);
    const accuracy = problemsList.length > 0 ? Math.round((score / problemsList.length) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg border-2 border-purple-200">
        <div className="text-center space-y-6">
          <div>
            <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-3xl font-bold text-purple-700 mb-2">
              {settings.language === "english" ? "Exercise Complete!" : "¡Ejercicio Completado!"}
            </h2>
            <p className="text-purple-600">
              {settings.language === "english" ? "Great work on your division practice!" : "¡Excelente trabajo en tu práctica de división!"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow border border-purple-100">
              <div className="text-2xl font-bold text-purple-700">{score}</div>
              <div className="text-sm text-purple-600">
                {settings.language === "english" ? "Correct Answers" : "Respuestas Correctas"}
              </div>
              <div className="text-xs text-gray-500">
                {settings.language === "english" ? `out of ${problemsList.length}` : `de ${problemsList.length}`}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-purple-100">
              <div className="text-2xl font-bold text-purple-700">{accuracy}%</div>
              <div className="text-sm text-purple-600">
                {settings.language === "english" ? "Accuracy" : "Precisión"}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-purple-100">
              <div className="text-2xl font-bold text-purple-700">{formatTime(totalTime)}</div>
              <div className="text-sm text-purple-600">
                {settings.language === "english" ? "Total Time" : "Tiempo Total"}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-purple-100">
              <div className="text-2xl font-bold text-purple-700">{longestStreak}</div>
              <div className="text-sm text-purple-600">
                {settings.language === "english" ? "Best Streak" : "Mejor Racha"}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={restartExercise} className="bg-purple-600 hover:bg-purple-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              {settings.language === "english" ? "Try Again" : "Intentar de Nuevo"}
            </Button>
            <Button variant="outline" onClick={onOpenSettings} className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <Settings className="mr-2 h-4 w-4" />
              {settings.language === "english" ? "Settings" : "Configuración"}
            </Button>
            <Button variant="outline" onClick={() => setShowHistoryDialog(true)} className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <History className="mr-2 h-4 w-4" />
              {settings.language === "english" ? "History" : "Historial"}
            </Button>
          </div>
        </div>

        {/* Modal de recompensa */}
        <RewardModal
          isOpen={showRewardModal}
          reward={currentReward}
          onClose={hideReward}
        />

        {/* Diálogo de historial */}
        <ExerciseHistoryDialog
          isOpen={showHistoryDialog}
          onClose={() => setShowHistoryDialog(false)}
          exercises={exercises}
          moduleId={moduleId}
        />
      </div>
    );
  }

  // Renderizar el ejercicio principal
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header con información del ejercicio */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-700 flex items-center">
            <Divide className="mr-2 h-6 w-6" />
            {settings.language === "english" ? "Division Exercise" : "Ejercicio de División"}
          </h1>
          <p className="text-purple-600">
            {settings.language === "english" ? 
              `Problem ${currentProblemIndex + 1} of ${problemsList.length}` : 
              `Problema ${currentProblemIndex + 1} de ${problemsList.length}`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVideoManager(true)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Youtube className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{settings.language === "english" ? "Explanatory Videos" : "Videos Explicativos"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProfessorMode(true)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{settings.language === "english" ? "Professor Mode" : "Modo Profesor"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistoryDialog(true)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{settings.language === "english" ? "Exercise History" : "Historial de Ejercicios"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Settings className="mr-2 h-4 w-4" />
            {settings.language === "english" ? "Settings" : "Configuración"}
          </Button>
        </div>
      </div>

      {/* Progreso y temporizadores */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ProgressBarUI 
              value={(currentProblemIndex / problemsList.length) * 100} 
              className="h-3"
            />
          </div>
          <div className="ml-4 text-sm text-purple-600 font-medium">
            {Math.round((currentProblemIndex / problemsList.length) * 100)}%
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <div className="text-purple-600">
            {settings.language === "english" ? "Score:" : "Puntuación:"} <span className="font-bold">{score}/{problemsList.length}</span>
          </div>
          <div className="text-purple-600">
            {settings.language === "english" ? "Streak:" : "Racha:"} <span className="font-bold">{consecutiveCorrect}</span>
          </div>
          {timeLeft !== null && (
            <div className="text-purple-600">
              {settings.language === "english" ? "Time:" : "Tiempo:"} <span className="font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
          {problemTimeLeft !== null && (
            <div className="text-purple-600">
              {settings.language === "english" ? "Problem:" : "Problema:"} <span className="font-bold">{formatTime(problemTimeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Área del problema */}
      <div className="mb-6">
        {currentProblem && (
          currentProblem.layout === 'vertical' ? 
            renderVerticalProblem(currentProblem) : 
            renderHorizontalProblem(currentProblem)
        )}
      </div>

      {/* Área de entrada */}
      <div className="mb-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="answer" className="text-lg font-semibold text-purple-700">
              {settings.language === "english" ? "Your Answer:" : "Tu Respuesta:"}
            </Label>
            <Input
              ref={inputRef}
              id="answer"
              type="number"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={settings.language === "english" ? "Enter your answer" : "Ingresa tu respuesta"}
              className="w-32 text-center text-xl font-bold border-2 border-purple-300 focus:border-purple-500"
              disabled={showAnswer || isCorrect === true}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => handleSubmit()}
              disabled={!userInput.trim() || showAnswer || isCorrect === true}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Check className="mr-2 h-4 w-4" />
              {settings.language === "english" ? "Submit" : "Enviar"}
            </Button>

            {settings.showAnswerWithExplanation && !showAnswer && isCorrect !== true && (
              <Button
                variant="outline"
                onClick={handleShowAnswer}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {settings.language === "english" ? "Show Answer" : "Mostrar Respuesta"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={previousProblem}
              disabled={currentProblemIndex === 0}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {settings.language === "english" ? "Previous" : "Anterior"}
            </Button>

            <Button
              variant="outline"
              onClick={nextProblem}
              disabled={currentProblemIndex === problemsList.length - 1}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {settings.language === "english" ? "Next" : "Siguiente"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`text-center p-4 rounded-lg mb-6 ${
          isCorrect === true 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          <p className="font-semibold">{feedback}</p>
          {showAnswer && currentProblem && (
            <div className="mt-2">
              <p className="text-sm">
                {settings.language === "english" ? "Correct answer:" : "Respuesta correcta:"} <span className="font-bold">{currentProblem.correctAnswer}</span>
              </p>
              {currentProblem.hasRemainder && currentProblem.remainder && (
                <p className="text-sm">
                  {settings.language === "english" ? "Remainder:" : "Resto:"} <span className="font-bold">{currentProblem.remainder}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Información de intentos */}
      {attempts > 0 && isCorrect !== true && (
        <div className="text-center text-purple-600 mb-4">
          <p className="text-sm">
            {settings.language === "english" ? "Attempts:" : "Intentos:"} {attempts}
            {settings.maxAttempts > 0 && ` / ${settings.maxAttempts}`}
          </p>
        </div>
      )}

      {/* Modal de recompensa */}
      <RewardModal
        isOpen={showRewardModal}
        reward={currentReward}
        onClose={hideReward}
      />

      {/* Diálogos */}
      <YoutubeVideoManager
        isOpen={showVideoManager}
        onClose={() => setShowVideoManager(false)}
        onVideoSelect={handleVideoSelect}
      />

      <ExerciseHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        exercises={exercises}
        moduleId={moduleId}
      />

      {/* Modo profesor */}
      {showProfessorMode && currentProblem && (
        <div className="fixed inset-0 z-50">
          <ProfessorMode
            problem={{
              dividend: currentProblem.dividend,
              divisor: currentProblem.divisor,
              quotient: currentProblem.correctAnswer,
              remainder: currentProblem.remainder || 0,
              operation: "division" as any,
              difficulty: settings.difficulty as any,
              explanation: `${currentProblem.dividend} ÷ ${currentProblem.divisor} = ${currentProblem.correctAnswer}${currentProblem.remainder ? ` remainder ${currentProblem.remainder}` : ""}`
            }}
            onClose={() => setProfessorMode(false)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
        </div>
      )}

      {/* Manejador de subida de nivel */}
      <LevelUpHandler />
    </div>
  );
}