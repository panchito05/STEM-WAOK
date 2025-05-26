// Exercise.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateDivisionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, DivisionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube, X, Plus, Maximize2, Minimize2, Play } from "lucide-react";
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
const divideSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const divideLineStyle = "border-t-2 border-gray-700 my-1";

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
                title: data.title || "Video de División",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId,
                loading: false,
                error: false
              });
            } else {
              metadata.push({
                url: videoUrl,
                title: "Video de División",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId,
                loading: false,
                error: false
              });
            }
          } catch (error) {
            metadata.push({
              url: videoUrl,
              title: "Video de División",
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              videoId: videoId,
              loading: false,
              error: false
            });
          }
        }

        setVideosMetadata(metadata);
      };

      fetchVideoMetadata();
    }
  }, [isOpen, videos, isEditMode]);

  const handleAddVideoLink = () => {
    setVideoLinks([...videoLinks, ""]);
  };

  const handleVideoLinkChange = (index: number, value: string) => {
    const newLinks = [...videoLinks];
    newLinks[index] = value;
    setVideoLinks(newLinks);
  };

  const handleRemoveVideoLink = (index: number) => {
    const newLinks = videoLinks.filter((_, i) => i !== index);
    setVideoLinks(newLinks);
  };

  const handleSaveVideos = () => {
    const validLinks = videoLinks.filter(link => link.trim() !== "" && extractYoutubeId(link) !== null);
    onSave(validLinks);
    setIsEditMode(false);
  };

  const handleEnterEditMode = () => {
    setVideoLinks([...videos]);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setVideoLinks([...videos]);
    setIsEditMode(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? "max-w-[95vw] max-h-[95vh]" : "max-w-4xl max-h-[80vh]"} overflow-y-auto`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Videos Explicativos de División</DialogTitle>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </DialogHeader>
        
        {isEditMode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Añade enlaces de YouTube para videos explicativos sobre división:
            </p>
            
            {videoLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => handleVideoLinkChange(index, e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleRemoveVideoLink(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button type="button" onClick={handleAddVideoLink} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Añadir video
            </Button>
            
            <DialogFooter>
              <Button type="button" onClick={handleCancelEdit} variant="outline">
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveVideos}>
                Guardar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {videosMetadata.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay videos configurados. Haz clic en "Editar videos" para añadir algunos.
              </p>
            ) : (
              videosMetadata.map((video, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex gap-4">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="w-32 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{video.title}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPlayingVideo(video.videoId)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Ver aquí
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(video.url, '_blank')}
                        >
                          <Youtube className="h-4 w-4 mr-2" />
                          Abrir en YouTube
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {currentPlayingVideo === video.videoId && (
                    <div className="mt-4">
                      <div className="relative w-full" style={{paddingBottom: '56.25%'}}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                          title={video.title}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setCurrentPlayingVideo(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cerrar video
                      </Button>
                    </div>
                  )}
                </div>
              ))
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
  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  
  // Estados de temporizadores
  const [timer, setTimer] = useState(0);
  const [problemTimerValue, setProblemTimerValue] = useState(0);
  
  // Estados de feedback y UI
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue">("green");
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [showProfessorMode, setShowProfessorMode] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>([]);
  
  // Estados de seguimiento de progreso
  const [userAnswersHistory, setUserAnswersHistory] = useState<(UserAnswerType | null)[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(0);
  const [maxConsecutiveStreak, setMaxConsecutiveStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [autoContinue, setAutoContinue] = useState(false);
  
  // Estados para navegación de historial
  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState(0);
  
  // Referencias
  const waitingRef = useRef(false);
  const boxRefsArrayRef = useRef<HTMLDivElement[]>([]);
  const digitBoxRefs = useRef<HTMLDivElement[]>([]);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoContinueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  const { t, locale } = useTranslations();
  const { updateModuleSettings, currentProfile } = useSettings();
  const { addReward, totalPoints: rewardStats } = useRewards();
  const { showReward } = useRewardQueue();
  
  // Variables derivadas
  const isEnglish = settings.language === 'english';
  const adaptiveDifficulty = settings.enableAdaptiveDifficulty ? 
    (consecutiveCorrectAnswers >= 15 ? "expert" :
     consecutiveCorrectAnswers >= 10 ? "advanced" :
     consecutiveCorrectAnswers >= 6 ? "intermediate" :
     consecutiveCorrectAnswers >= 3 ? "elementary" : "beginner") as DifficultyLevel
    : settings.difficulty as DifficultyLevel;

  // Configurar refs de waiting
  useEffect(() => {
    waitingRef.current = waitingForContinue;
  }, [waitingForContinue]);

  // Función para guardar configuraciones de usuario
  const saveUserProgress = useCallback(async () => {
    try {
      if (currentProfile) {
        const moduleData = {
          consecutiveCorrectAnswers,
          consecutiveIncorrectAnswers,
          maxConsecutiveStreak,
          longestStreak,
          autoContinue
        };
        
        await updateModuleSettings("division", moduleData);
        console.log("[DIVISION] Progreso guardado exitosamente:", moduleData);
      }
    } catch (error) {
      console.error("[DIVISION] Error guardando progreso:", error);
    }
  }, [currentProfile, consecutiveCorrectAnswers, consecutiveIncorrectAnswers, maxConsecutiveStreak, longestStreak, autoContinue, updateModuleSettings]);

  // Cargar progreso del usuario al iniciar
  useEffect(() => {
    if (currentProfile?.moduleSettings?.division) {
      const divisionData = currentProfile.moduleSettings.division;
      if (typeof divisionData.consecutiveCorrectAnswers === 'number') {
        setConsecutiveCorrectAnswers(divisionData.consecutiveCorrectAnswers);
      }
      if (typeof divisionData.consecutiveIncorrectAnswers === 'number') {
        setConsecutiveIncorrectAnswers(divisionData.consecutiveIncorrectAnswers);
      }
      if (typeof divisionData.maxConsecutiveStreak === 'number') {
        setMaxConsecutiveStreak(divisionData.maxConsecutiveStreak);
      }
      if (typeof divisionData.longestStreak === 'number') {
        setLongestStreak(divisionData.longestStreak);
      }
      if (typeof divisionData.autoContinue === 'boolean') {
        setAutoContinue(divisionData.autoContinue);
      }
      console.log("[DIVISION] Progreso cargado:", divisionData);
    }
  }, [currentProfile]);

  // Guardar progreso cuando cambie
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (exerciseStarted) {
        saveUserProgress();
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [consecutiveCorrectAnswers, consecutiveIncorrectAnswers, maxConsecutiveStreak, longestStreak, autoContinue, exerciseStarted, saveUserProgress]);

  // Obtener traducciones específicas del módulo
  const currentTranslations = {
    division: isEnglish ? "Division" : "División",
    level: isEnglish ? "Level" : "Nivel",
    attempts: isEnglish ? "Attempts" : "Intentos",
    previous: isEnglish ? "Previous" : "Anterior",
    settings: isEnglish ? "Settings" : "Configuración",
    showAnswer: isEnglish ? "Show Answer" : "Mostrar Respuesta",
    startExercise: isEnglish ? "Start Exercise" : "Iniciar Ejercicio"
  };

  // Funciones de generación de problemas
  const generateProblems = useCallback(() => {
    const problems: DivisionProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      const problem = generateDivisionProblem(adaptiveDifficulty);
      problems.push(problem);
    }
    console.log(`[DIVISION] Generados ${problems.length} problemas de división con dificultad ${adaptiveDifficulty}`);
    return problems;
  }, [settings.problemCount, adaptiveDifficulty]);

  // Inicializar ejercicio
  useEffect(() => {
    const problems = generateProblems();
    setProblemsList(problems);
    setCurrentProblem(problems[0] || null);
    setCurrentProblemIndex(0);
    setUserAnswersHistory(new Array(problems.length).fill(null));
    
    console.log("[DIVISION] Ejercicio inicializado con", problems.length, "problemas");
  }, [generateProblems]);

  // Lógica de temporizadores
  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted && !waitingRef.current) {
      // Temporizador global
      globalTimerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      
      // Temporizador por problema si está habilitado
      if (settings.timeValue > 0 && !viewingPrevious) {
        setProblemTimerValue(settings.timeValue);
        singleProblemTimerRef.current = setInterval(() => {
          setProblemTimerValue(prev => {
            if (prev <= 1) {
              // Tiempo agotado
              handleTimeUp();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    
    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    };
  }, [exerciseStarted, exerciseCompleted, currentProblemIndex, settings.timeValue, viewingPrevious]);

  // Función para manejar tiempo agotado
  const handleTimeUp = useCallback(() => {
    if (!currentProblem || viewingPrevious || exerciseCompleted || waitingRef.current) return;
    
    console.log("[DIVISION] Tiempo agotado para el problema", currentProblemIndex + 1);
    setFeedbackMessage(t('exercises.timeUp'));
    setFeedbackColor("red");
    setWaitingForContinue(true);
    
    // Registrar como respuesta incorrecta por tiempo
    const problemIdxForHistory = actualActiveProblemIndexBeforeViewingPrevious;
    setUserAnswersHistory(prev => {
      const newHistory = [...prev];
      newHistory[problemIdxForHistory] = {
        problemId: currentProblem.id,
        problem: currentProblem as any,
        userAnswer: NaN,
        isCorrect: false,
        status: 'timeout',
        attempts: currentAttempts + 1,
        timestamp: Date.now()
      };
      return newHistory;
    });
    
    // Actualizar contadores
    setConsecutiveCorrectAnswers(0);
    setConsecutiveIncorrectAnswers(prev => prev + 1);
    
    if (singleProblemTimerRef.current) {
      clearInterval(singleProblemTimerRef.current);
    }
  }, [currentProblem, currentProblemIndex, actualActiveProblemIndexBeforeViewingPrevious, currentAttempts, viewingPrevious, exerciseCompleted, t]);

  // Funciones de navegación
  const moveToNextProblem = useCallback(() => {
    if (currentProblemIndex < problemsList.length - 1) {
      const nextIndex = currentProblemIndex + 1;
      setCurrentProblemIndex(nextIndex);
      setCurrentProblem(problemsList[nextIndex]);
      setActualActiveProblemIndexBeforeViewingPrevious(nextIndex);
      setDigitAnswers([]);
      setFocusedDigitIndex(0);
      setCurrentAttempts(0);
      setFeedbackMessage("");
      setWaitingForContinue(false);
      
      // Reiniciar temporizador por problema
      if (settings.timeValue > 0) {
        setProblemTimerValue(settings.timeValue);
      }
      
      console.log(`[DIVISION] Avanzado al problema ${nextIndex + 1} de ${problemsList.length}`);
    } else {
      // Ejercicio completado
      finishExercise();
    }
  }, [currentProblemIndex, problemsList, settings.timeValue]);

  const moveToPreviousProblem = useCallback(() => {
    if (!viewingPrevious) {
      // Entramos en modo de visualización de historial
      if (currentProblemIndex > 0) {
        setViewingPrevious(true);
        setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
        const prevIndex = currentProblemIndex - 1;
        setCurrentProblemIndex(prevIndex);
        setCurrentProblem(problemsList[prevIndex]);
        
        // Mostrar la respuesta del usuario para este problema
        const userAnswer = userAnswersHistory[prevIndex];
        if (userAnswer && userAnswer.isCorrect) {
          const userAnswerStr = userAnswer.userAnswer.toString();
          setDigitAnswers(userAnswerStr.split(''));
        } else {
          setDigitAnswers([]);
        }
        
        console.log(`[DIVISION] Visualizando problema anterior: ${prevIndex + 1}`);
      }
    } else {
      // Ya estamos viendo historial, retroceder más
      if (currentProblemIndex > 0) {
        const prevIndex = currentProblemIndex - 1;
        setCurrentProblemIndex(prevIndex);
        setCurrentProblem(problemsList[prevIndex]);
        
        const userAnswer = userAnswersHistory[prevIndex];
        if (userAnswer && userAnswer.isCorrect) {
          const userAnswerStr = userAnswer.userAnswer.toString();
          setDigitAnswers(userAnswerStr.split(''));
        } else {
          setDigitAnswers([]);
        }
        
        console.log(`[DIVISION] Visualizando problema anterior: ${prevIndex + 1}`);
      }
    }
  }, [viewingPrevious, currentProblemIndex, problemsList, userAnswersHistory]);

  const returnToActiveProblem = useCallback(() => {
    if (viewingPrevious) {
      setViewingPrevious(false);
      setCurrentProblemIndex(actualActiveProblemIndexBeforeViewingPrevious);
      setCurrentProblem(problemsList[actualActiveProblemIndexBeforeViewingPrevious]);
      setDigitAnswers([]);
      setFocusedDigitIndex(0);
      
      console.log(`[DIVISION] Regresado al problema activo: ${actualActiveProblemIndexBeforeViewingPrevious + 1}`);
    }
  }, [viewingPrevious, actualActiveProblemIndexBeforeViewingPrevious, problemsList]);

  // Función para finalizar ejercicio
  const finishExercise = useCallback(() => {
    setExerciseCompleted(true);
    
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    
    // Calcular estadísticas del ejercicio
    const correctAnswers = userAnswersHistory.filter(answer => answer?.isCorrect).length;
    const totalProblems = problemsList.length;
    const accuracy = totalProblems > 0 ? (correctAnswers / totalProblems) * 100 : 0;
    const avgTimePerProblem = totalProblems > 0 ? timer / totalProblems : 0;
    
    console.log(`[DIVISION] Ejercicio completado: ${correctAnswers}/${totalProblems} correctas (${accuracy.toFixed(1)}%)`);
    
    // Calcular y otorgar recompensas
    if (settings.enableRewards) {
      const basePoints = correctAnswers * 10;
      const bonusPoints = consecutiveCorrectAnswers * 2;
      const totalPoints = basePoints + bonusPoints;
      
      if (totalPoints > 0) {
        addReward({
          type: 'exercise_completion',
          operation: 'division',
          points: totalPoints,
          details: {
            correctAnswers,
            totalProblems,
            accuracy,
            streak: consecutiveCorrectAnswers
          }
        });
        
        showReward({
          title: isEnglish ? 'Exercise Completed!' : '¡Ejercicio Completado!',
          message: isEnglish ? 
            `Great job! You earned ${totalPoints} points` : 
            `¡Excelente trabajo! Ganaste ${totalPoints} puntos`,
          points: totalPoints,
          type: 'success'
        });
      }
    }
    
    // Guardar resultado del ejercicio
    saveExerciseResult(correctAnswers, totalProblems, accuracy, avgTimePerProblem);
  }, [userAnswersHistory, problemsList, timer, consecutiveCorrectAnswers, settings.enableRewards, addReward, showReward, isEnglish]);

  // Función para guardar resultado del ejercicio
  const saveExerciseResult = useCallback(async (correctAnswers: number, totalProblems: number, accuracy: number, avgTimePerProblem: number) => {
    try {
      // Aquí se integraría con el sistema de guardado de progreso
      console.log("[DIVISION] Guardando resultado del ejercicio...");
    } catch (error) {
      console.error("[DIVISION] Error guardando resultado:", error);
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Component content will continue here */}
      <div className="text-center p-4">
        <h1 className="text-2xl font-bold">{currentTranslations.division}</h1>
        <p className="text-gray-600">División - Ejercicio en desarrollo</p>
      </div>
    </div>
  );
};