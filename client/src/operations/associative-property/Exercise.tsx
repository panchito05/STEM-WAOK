// Exercise.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateAssociativePropertyProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, AssociativePropertyProblem, DifficultyLevel } from "./types";
import VisualProblemDisplay from "./components/VisualProblemDisplay";
import InteractiveExercise from "./components/InteractiveExercise";
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
import { useMultiOperationsSession } from '@/hooks/useMultiOperationsSession';

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
                title: data.title || "Video de YouTube",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                videoId: videoId,
                loading: false,
                error: false
              });
            } else {
              metadata.push({
                url: videoUrl,
                title: "Video no encontrado",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                videoId: videoId,
                loading: false,
                error: true
              });
            }
          } catch (error) {
            metadata.push({
              url: videoUrl,
              title: "Error al cargar información",
              thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "",
              videoId: videoId || "",
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

  // Limpiar estado cuando se cierra el diálogo
  useEffect(() => {
    if (!isOpen) {
      setCurrentPlayingVideo(null);
      setIsFullscreen(false);
    }
  }, [isOpen]);

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
          setIsFullscreen(false);
          onClose();
        }
      }}
    >
      <DialogContent
        className={`${isFullscreen ? 'sm:max-w-[95vw] sm:h-[90vh] p-0 overflow-hidden' : 'sm:max-w-md'}`}
      >
        {!isFullscreen && (
          <DialogHeader>
            <DialogTitle>{currentPlayingVideo ? "Reproduciendo video" : (isEditMode ? "Añadir Videos Explicativos" : "Videos Explicativos")}</DialogTitle>
          </DialogHeader>
        )}

        {currentPlayingVideo ? (
          // Modo de reproducción de video
          (<div className={`relative ${isFullscreen ? 'w-full h-full' : 'aspect-video'}`}>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${currentPlayingVideo}?autoplay=1&rel=0`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="bg-black bg-opacity-50 text-white border-none h-8 w-8 hover:bg-black hover:bg-opacity-70"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {isFullscreen && (
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-black bg-opacity-50 text-white border-none h-8 w-8 hover:bg-black hover:bg-opacity-70"
                  onClick={stopVideo}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!isFullscreen && (
              <div className="p-3 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopVideo}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cerrar video
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnterEditMode}
                >
                  <Cog className="h-4 w-4 mr-2" />
                  Editar videos
                </Button>
              </div>
            )}
          </div>)
        ) : isEditMode ? (
          // Modo de edición
          (<div className="space-y-4 py-4">
            <div className="text-sm text-gray-600 mb-2">
              Añade hasta 2 enlaces de YouTube para videos explicativos de este ejercicio.
            </div>
            {videoLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => handleVideoChange(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeVideo(index)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {videoLinks.length < 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addVideoInput}
                type="button"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" /> Añadir Video
              </Button>
            )}
            <DialogFooter className="mt-4">
              <Button type="button" onClick={() => {
                setIsEditMode(false);
                if (videos.length === 0) onClose();
              }} variant="outline">
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </div>)
        ) : (
          // Modo de visualización de miniaturas
          (<div className="space-y-6 py-4">
            {videosMetadata.map((video, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div
                  className="relative aspect-video bg-gray-100 cursor-pointer group"
                  onClick={() => playVideo(video.videoId)}
                >
                  {video.thumbnailUrl ? (
                    <>
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <Play className="text-white opacity-0 group-hover:opacity-100 h-12 w-12 transform scale-75 group-hover:scale-100 transition-all" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Youtube className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2">
                    <h3 className="text-white text-sm font-medium truncate">{video.title}</h3>
                  </div>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playVideo(video.videoId)}
                    className="text-red-600"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Reproducir
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
            ))}
            <DialogFooter>
              <Button type="button" onClick={handleEnterEditMode} variant="outline">
                <Cog className="h-4 w-4 mr-2" />
                Editar videos
              </Button>
              <Button type="button" onClick={onClose}>Cerrar</Button>
            </DialogFooter>
          </div>)
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Acceder a la información de historial mediante el contexto de progreso
  const { exerciseHistory } = useProgress();
  const moduleId = "associative-property"; // ID del módulo de suma
  
  // Hook para manejar sesiones multi-operaciones
  const { isMultiMode, completeCurrentModule } = useMultiOperationsSession();

  const [problemsList, setProblemsList] = useState<AssociativePropertyProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<AssociativePropertyProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  
  // Estados para el nivel intermediate
  const [interactiveAnswers, setInteractiveAnswers] = useState<{ [key: string]: string }>({
    blank1: '',
    blank2: '',
    blank3: ''
  });
  const [activeInteractiveField, setActiveInteractiveField] = useState<string | null>(null);
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
  const [problemStartTime, setProblemStartTime] = useState<number>(0); // Tiempo de inicio para cada problema

  const [blockAutoAdvance, setBlockAutoAdvance] = useState(false);
  const [autoContinue, setAutoContinue] = useState(() => {
    try {
      const stored = localStorage.getItem('associative-property_autoContinue');
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
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(() => parseInt(localStorage.getItem('associative-property_consecutiveCorrectAnswers') || '0', 10));
  const [maxConsecutiveStreak, setMaxConsecutiveStreak] = useState(() => parseInt(localStorage.getItem('associative-property_maxConsecutiveStreak') || '0', 10));
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(() => parseInt(localStorage.getItem('associative-property_consecutiveIncorrectAnswers') || '0', 10));
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showLevelUpReward, setShowLevelUpReward] = useState(false);

  // Estado para rastrear cuándo se mostró la última recompensa (para el sistema progresivo)
  const [lastRewardShownIndex, setLastRewardShownIndex] = useState<number>(-1);

  // Estado para el diálogo de historial de ejercicios recientes

  // Estado para el modo profesor
  const [showProfessorMode, setShowProfessorMode] = useState(false);

  // Estados para manejar los videos explicativos de YouTube
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>(() => {
    try {
      const storedVideos = localStorage.getItem('associative-property_youtubeVideos');
      return storedVideos ? JSON.parse(storedVideos) : [];
    } catch (e) {
      console.error('Error loading YouTube videos from localStorage:', e);
      return [];
    }
  });

  const [viewingPrevious, setViewingPrevious] = useState(false);
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState<number>(0);

  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { saveExerciseResult } = useProgress();
  const { updateModuleSettings } = useSettings();
  const { t } = useTranslations();

  // 🎯 Sistema de Recompensas Simplificado (sin hooks problemáticos)
  const [rewardStats, setRewardStats] = useState(() => {
    // Cargar datos guardados al inicializar
    const saved = localStorage.getItem('associative-property_rewards');
    const defaultStats = {
      totalProblems: 0,
      currentStreak: 0,
      showRewardModal: false,
      lastReward: null as any,
      totalPoints: 0,
      unlockedRewards: [] as any[],
      completedMilestones: new Set<number>(),
      completedStreaks: new Set<number>()
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultStats,
          totalPoints: parsed.totalPoints || 0,
          unlockedRewards: parsed.unlockedRewards || [],
          completedMilestones: new Set(parsed.completedMilestones || []),
          completedStreaks: new Set(parsed.completedStreaks || [])
        };
      } catch (e) {
        console.warn('Error cargando recompensas guardadas:', e);
      }
    }
    return defaultStats;
  });

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


  useEffect(() => {
    waitingRef.current = waitingForContinue;
    // Ya no enfocamos el botón aquí, se hace directamente en cada punto donde se llama a setWaitingForContinue(true)
  }, [waitingForContinue]);
  
  // Monitor avanzado del contador de respuestas consecutivas correctas
  useEffect(() => {
    // Sincronizar con localStorage para asegurar consistencia total
    if (consecutiveCorrectAnswers !== undefined) {
      try {
        // 1. Almacenar en localStorage para persistencia
        localStorage.setItem('associative-property_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString());
        
        // 2. También almacenar en sessionStorage para verificación cruzada
        sessionStorage.setItem('associative-property_lastConsecutiveCorrect', consecutiveCorrectAnswers.toString());
        sessionStorage.setItem('associative-property_lastConsecutiveUpdateTime', Date.now().toString());
        
        // 3. Logs detallados para seguimiento
        console.log(`[CONTADOR-V2] Actualizado contador de respuestas correctas consecutivas a ${consecutiveCorrectAnswers}`);
        
        // 4. Verificación avanzada para diagnóstico
        if (consecutiveCorrectAnswers >= CORRECT_ANSWERS_FOR_LEVEL_UP && settings.enableAdaptiveDifficulty) {
          console.log(`[CONTADOR-V2] ⚠️ ATENCIÓN: Se alcanzó umbral para subir nivel (${consecutiveCorrectAnswers}/${CORRECT_ANSWERS_FOR_LEVEL_UP})`);
          
          // 5. Verificar si el nivel debería subir
          const difficultiesOrder = ["beginner", "elementary", "intermediate", "advanced", "expert"];
          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
          
          if (currentLevelIdx < difficultiesOrder.length - 1) {
            console.log(`[CONTADOR-V2] ✅ Confirmado: condiciones cumplidas para subir de nivel`);
            sessionStorage.setItem('associative-property_levelUpEligible', 'true');
          }
        }
      } catch (error) {
        console.error('[CONTADOR-V2] Error al sincronizar contador:', error);
      }
    }
  }, [consecutiveCorrectAnswers, settings.enableAdaptiveDifficulty, adaptiveDifficulty]);

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

  // Actualizar el tiempo de inicio cuando cambia el problema
  useEffect(() => {
    if (currentProblem && !viewingPrevious && !exerciseCompleted) {
      setProblemStartTime(Date.now());
    }
  }, [currentProblem, viewingPrevious, exerciseCompleted]);

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
      
      // 🧠 NUEVA LÓGICA: Iniciar sin selección para permitir detección inteligente
      // Solo establecer dirección por defecto, sin seleccionar contenedor
      if (currentProblem.layout === 'horizontal') {
        setInputDirection('ltr');
      } else {
        setInputDirection('rtl');
      }
      // No establecer foco inicial - será determinado por el primer dígito
      setFocusedDigitIndex(null);

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
      
      // Actualizar racha máxima si es necesario
      if (newConsecutive > maxConsecutiveStreak) {
        setMaxConsecutiveStreak(newConsecutive);
        localStorage.setItem('associative-property_maxConsecutiveStreak', newConsecutive.toString());
        console.log("[CONTADOR-V2] Nueva racha máxima alcanzada:", newConsecutive);
      }
      
      localStorage.setItem('associative-property_consecutiveCorrectAnswers', newConsecutive.toString());
      console.log("[CONTADOR-V2] Actualizado contador de respuestas correctas consecutivas a", newConsecutive);

      // 🎯 Sistema de Recompensas Simplificado - Detección de Hitos
      const checkSimpleRewards = () => {
        const currentTotalProblems = userAnswersHistory.filter(answer => answer && answer.isCorrect).length + 1;
        
        // Verificar hitos importantes (evitar duplicados)
        let rewardToShow = null;
        
        // Recompensas por hitos (solo si no se han completado antes)
        if (currentTotalProblems === 5 && !rewardStats.completedMilestones.has(5)) {
          rewardToShow = {
            id: 'milestone_5',
            title: "¡Primeros Pasos!",
            description: "Has resuelto 5 problemas correctamente",
            points: 25,
            type: "milestone",
            icon: "🌟",
            timestamp: Date.now()
          };
        } else if (currentTotalProblems === 10 && !rewardStats.completedMilestones.has(10)) {
          rewardToShow = {
            id: 'milestone_10',
            title: "¡Aprendiz Dedicado!",
            description: "Has completado 10 problemas de suma",
            points: 50,
            type: "milestone", 
            icon: "🎯",
            timestamp: Date.now()
          };
        } else if (currentTotalProblems === 25 && !rewardStats.completedMilestones.has(25)) {
          rewardToShow = {
            id: 'milestone_25',
            title: "¡Matemático en Progreso!",
            description: "¡Increíble! 25 problemas resueltos correctamente",
            points: 100,
            type: "milestone",
            icon: "🏆",
            timestamp: Date.now()
          };
        } 
        // Recompensas por rachas (solo si no se han completado antes)
        else if (newConsecutive === 5 && !rewardStats.completedStreaks.has(5)) {
          rewardToShow = {
            id: 'streak_5',
            title: "¡Racha Inicial!",
            description: "5 respuestas correctas consecutivas",
            points: 30,
            type: "streak",
            icon: "⚡",
            timestamp: Date.now()
          };
        } else if (newConsecutive === 10 && !rewardStats.completedStreaks.has(10)) {
          rewardToShow = {
            id: 'streak_10',
            title: "¡Racha Fantástica!",
            description: "10 respuestas correctas seguidas",
            points: 75,
            type: "streak",
            icon: "🔥",
            timestamp: Date.now()
          };
        }
        
        // Mostrar y guardar recompensa si se desbloqueó una
        if (rewardToShow) {
          console.log(`🎉 ¡RECOMPENSA DESBLOQUEADA!`, rewardToShow);
          
          // Actualizar estado con la nueva recompensa
          setRewardStats(prev => {
            const newStats = {
              ...prev,
              totalProblems: currentTotalProblems,
              currentStreak: newConsecutive,
              totalPoints: prev.totalPoints + rewardToShow.points,
              unlockedRewards: [...prev.unlockedRewards, rewardToShow],
              completedMilestones: rewardToShow.type === 'milestone' ? 
                new Set([...prev.completedMilestones, currentTotalProblems]) : prev.completedMilestones,
              completedStreaks: rewardToShow.type === 'streak' ? 
                new Set([...prev.completedStreaks, newConsecutive]) : prev.completedStreaks,
              showRewardModal: true,
              lastReward: rewardToShow
            };
            
            // Guardar en localStorage
            localStorage.setItem('associative-property_rewards', JSON.stringify({
              totalPoints: newStats.totalPoints,
              unlockedRewards: newStats.unlockedRewards,
              completedMilestones: Array.from(newStats.completedMilestones),
              completedStreaks: Array.from(newStats.completedStreaks)
            }));
            
            console.log(`💾 Guardado: ${rewardToShow.points} puntos. Total: ${newStats.totalPoints}`);
            return newStats;
          });
        } else {
          // Solo actualizar estadísticas sin mostrar modal
          setRewardStats(prev => ({
            ...prev,
            totalProblems: currentTotalProblems,
            currentStreak: newConsecutive
          }));
        }
      };
      
      checkSimpleRewards();

      // Sistema mejorado y más robusto para verificar subida de nivel
      // Doble verificación con logs para diagnóstico
      console.log(`[CONTADOR] Respuestas correctas consecutivas actuales: ${newConsecutive}/${CORRECT_ANSWERS_FOR_LEVEL_UP}`);
      
      // Trigger especial: Al llegar exactamente a 10 respuestas correctas consecutivas
      if (newConsecutive === CORRECT_ANSWERS_FOR_LEVEL_UP) {
        console.log(`[CONTADOR] 🎯 Se alcanzó exactamente el número objetivo de respuestas consecutivas correctas: ${newConsecutive}`);
      }
      
      if (newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP && settings.enableAdaptiveDifficulty) {
          const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
          
          // Logs para diagnóstico y seguimiento
          console.log(`[NIVEL] ===== VERIFICACIÓN DE SUBIDA DE NIVEL =====`);
          console.log(`[NIVEL] Rachas consecutivas correctas: ${newConsecutive}/${CORRECT_ANSWERS_FOR_LEVEL_UP}`);
          console.log(`[NIVEL] Nivel actual: ${adaptiveDifficulty} (Índice ${currentLevelIdx}/${difficultiesOrder.length-1})`);
          console.log(`[NIVEL] Dificultad adaptativa activada: ${settings.enableAdaptiveDifficulty}`);
          
          // Verificar que podemos subir de nivel
          if (currentLevelIdx < difficultiesOrder.length - 1) {
              const newLevel = difficultiesOrder[currentLevelIdx + 1];
              console.log(`[NIVEL] ✅ INICIANDO SUBIDA DE NIVEL: ${adaptiveDifficulty} → ${newLevel}`);
              
              try {
                  console.log(`[NIVEL] 💾 GUARDANDO PROGRESO ANTES DE SUBIR NIVEL - Iniciando...`);
                  
                  // CRÍTICO: Guardar progreso de los 10 problemas correctos antes de avanzar de nivel
                  const progressDataForLevelUp = {
                    operationId: "associative-property",
                    date: new Date().toISOString(),
                    score: CORRECT_ANSWERS_FOR_LEVEL_UP, // Los 10 problemas fueron correctos
                    totalProblems: CORRECT_ANSWERS_FOR_LEVEL_UP,
                    timeSpent: Math.round(newConsecutive * 30), // Estimación basada en problemas completados
                    difficulty: adaptiveDifficulty, // Nivel anterior donde se completaron
                    
                    // Estadísticas para el avance de nivel
                    accuracy: 100, // 100% correcto para avanzar de nivel
                    avgTimePerProblem: 30, // Estimación promedio
                    avgAttempts: 1, // Asumimos primer intento para nivel up
                    revealedAnswers: 0,
                    
                    // Datos específicos del avance de nivel
                    extra_data: {
                      version: "4.0",
                      timestamp: new Date().toISOString(),
                      isLevelUpProgress: true, // Marcador especial
                      previousLevel: adaptiveDifficulty,
                      newLevel: newLevel,
                      consecutiveCorrect: newConsecutive,
                      automaticSave: true,
                      reason: "Adaptive difficulty level up - 10 consecutive correct answers"
                    }
                  };
                  
                  // Guardar progreso utilizando la función existente
                  console.log(`[NIVEL] 💾 Guardando datos de progreso:`, progressDataForLevelUp);
                  saveExerciseResult(progressDataForLevelUp);
                  console.log(`[NIVEL] ✅ Progreso guardado exitosamente antes del avance de nivel`);
                  
                  // Actualizar localStorage con el nuevo nivel
                  localStorage.setItem('associative-property_adaptiveDifficulty', newLevel);
                  localStorage.setItem('associative-property_currentLevel', newLevel);
                  
                  // Actualizar los estados para la UI
                  setAdaptiveDifficulty(newLevel);
                  updateModuleSettings("associative-property", { 
                      difficulty: newLevel, 
                      enableAdaptiveDifficulty: true 
                  });
                  
                  // Reiniciar contador de respuestas correctas
                  setConsecutiveCorrectAnswers(0);
                  localStorage.setItem('associative-property_consecutiveCorrectAnswers', '0');
                  
                  // Mostrar recompensa y bloquear avance automático
                  setShowLevelUpReward(true);
                  setBlockAutoAdvance(true);
                  
                  // Notificar al sistema de eventos
                  eventBus.emit('levelUp', { 
                      previousLevel: adaptiveDifficulty, 
                      newLevel,
                      consecutiveCorrectAnswers: CORRECT_ANSWERS_FOR_LEVEL_UP
                  });
                  
                  console.log(`[NIVEL] ✅ SUBIDA DE NIVEL COMPLETADA: ${adaptiveDifficulty} → ${newLevel}`);
              } catch (error) {
                  console.error('[NIVEL] ❌ Error en subida de nivel:', error);
              }
          } else {
              console.log(`[NIVEL] ⚠️ Ya estás en el nivel máximo (${adaptiveDifficulty})`);
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
      localStorage.setItem('associative-property_consecutiveCorrectAnswers', '0');

      if (settings.enableAdaptiveDifficulty && newConsecutiveInc >= 5) {
          const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
          if (currentLevelIdx > 0) {
              const newLevel = difficultiesOrder[currentLevelIdx - 1];
              setAdaptiveDifficulty(newLevel);
              updateModuleSettings("associative-property", { difficulty: newLevel });
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
          console.log("[ASSOCIATIVE-PROPERTY] Agregando problema de compensación por respuesta incorrecta");
          const difficultyForCompensation = settings.enableAdaptiveDifficulty
            ? adaptiveDifficulty
            : (settings.difficulty as DifficultyLevel);

          const compensationProblem = generateAssociativePropertyProblem(difficultyForCompensation);
          setProblemsList(prev => [...prev, compensationProblem]);
          // Agregamos null al historial para que coincida con el nuevo problema añadido
          setUserAnswersHistory(prev => [...prev, null]);
          console.log("[ASSOCIATIVE-PROPERTY] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
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
            console.log("[ASSOCIATIVE-PROPERTY] Agregando problema de compensación por tiempo agotado (con respuesta incorrecta)");
            const difficultyForCompensation = settings.enableAdaptiveDifficulty
              ? adaptiveDifficulty
              : (settings.difficulty as DifficultyLevel);

            const compensationProblem = generateAssociativePropertyProblem(difficultyForCompensation);
            setProblemsList(prev => [...prev, compensationProblem]);
            // Agregamos null al historial para que coincida con el nuevo problema añadido
            setUserAnswersHistory(prev => [...prev, null]);
            console.log("[ASSOCIATIVE-PROPERTY] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
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
          console.log("[ASSOCIATIVE-PROPERTY] Agregando problema de compensación por tiempo agotado (sin respuesta)");
          const difficultyForCompensation = settings.enableAdaptiveDifficulty
            ? adaptiveDifficulty
            : (settings.difficulty as DifficultyLevel);

          const compensationProblem = generateAssociativePropertyProblem(difficultyForCompensation);
          setProblemsList(prev => [...prev, compensationProblem]);
          // Agregamos null al historial para que coincida con el nuevo problema añadido
          setUserAnswersHistory(prev => [...prev, null]);
          console.log("[ASSOCIATIVE-PROPERTY] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
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

  useEffect(() => localStorage.setItem('associative-property_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString()), [consecutiveCorrectAnswers]);
  useEffect(() => localStorage.setItem('associative-property_consecutiveIncorrectAnswers', consecutiveIncorrectAnswers.toString()), [consecutiveIncorrectAnswers]);
  useEffect(() => localStorage.setItem('associative-property_autoContinue', autoContinue.toString()), [autoContinue]);

  const generateNewProblemSet = () => {
    const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
    const newProblemsArray: AssociativePropertyProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      const problem = generateAssociativePropertyProblem(difficultyToUse);
      // Agregar información de índice y total a cada problema
      problem.index = i;
      problem.total = settings.problemCount;
      newProblemsArray.push(problem);
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
      // Avanzar al siguiente problema normal
      setCurrentProblemIndex(nextActiveIdx);
      setCurrentProblem(problemsList[nextActiveIdx]);
      setActualActiveProblemIndexBeforeViewingPrevious(nextActiveIdx);
      setFeedbackMessage(null);
      setDigitAnswers(Array(problemsList[nextActiveIdx].answerMaxDigits).fill("")); // Limpiar cajones para nuevo problema
      setCurrentAttempts(0); // Resetear intentos para el nuevo problema
      setProblemTimerValue(settings.timeValue); // Resetear timer para el nuevo problema
      setWaitingForContinue(false); // Permitir que el nuevo problema inicie su timer
    } else {
      // ÚLTIMA RESPUESTA - SOLUCIÓN FINAL
      // Antes de completar, asegurarnos de guardar la respuesta del último problema
      const currentAnswer = digitAnswers.join("");
      
      console.log("🔍 VALIDANDO ÚLTIMO PROBLEMA ANTES DE COMPLETAR:", {
        respuestaActual: currentAnswer,
        problemaActual: currentProblem?.id,
        indice: currentProblemIndex
      });
      
      if (currentProblem && currentAnswer && currentAnswer.length > 0) {
        // Verificar si ya existe una respuesta registrada
        const existingAnswer = userAnswersHistory[currentProblemIndex];
        
        if (!existingAnswer) {
          console.log("🔴 ÚLTIMO PROBLEMA: Registrando respuesta final antes de completar:", currentAnswer);
          
          // Crear respuesta con todos los datos necesarios
          const respuestaFinal = {
            problemId: currentProblem.id,
            problem: currentProblem,
            userAnswer: parseFloat(currentAnswer),
            isCorrect: parseFloat(currentAnswer) === currentProblem.correctAnswer,
            status: parseFloat(currentAnswer) === currentProblem.correctAnswer ? 'correct' : 'incorrect',
            attempts: currentAttempts || 1,
            timestamp: Date.now()
          };
          
          // Actualizar respuesta en el historial - Dos métodos para asegurar actualización
          const newHistory = [...userAnswersHistory];
          newHistory[currentProblemIndex] = respuestaFinal;
          userAnswersHistory[currentProblemIndex] = respuestaFinal; // Actualización directa
          setUserAnswersHistory(newHistory); // Actualización por setState
          
          console.log("✅ ÚLTIMA RESPUESTA REGISTRADA:", respuestaFinal);
        }
      }
      
      // Ahora sí completar el ejercicio
      completeExercise();
    }
  }, [actualActiveProblemIndexBeforeViewingPrevious, problemsList, settings.timeValue, digitAnswers, currentProblem, userAnswersHistory, currentProblemIndex, currentAttempts]);


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
            (settings.language === 'spanish' ? `Tu respuesta fue correcta: ${prevAnswerEntry.userAnswer}` : `Your answer was correct: ${prevAnswerEntry.userAnswer}`) :
            (settings.language === 'spanish' ? `Tu respuesta fue incorrecta: ${prevAnswerEntry.userAnswer === undefined || isNaN(prevAnswerEntry.userAnswer) ? 'Sin respuesta' : prevAnswerEntry.userAnswer}. La respuesta correcta era: ${prevProblemToView.correctAnswer}` : `Your answer was incorrect: ${prevAnswerEntry.userAnswer === undefined || isNaN(prevAnswerEntry.userAnswer) ? 'Not answered' : prevAnswerEntry.userAnswer}. The correct answer was: ${prevProblemToView.correctAnswer}`)
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
    // SOLUCIÓN MEJORADA: Gestión robusta del último problema 
    // Con logs detallados para identificar el origen del problema
    console.log("INICIO COMPLETE EXERCISE - Estado actual:", {
      problemsList: problemsList.map(p => p.id),
      userAnswersHistory: userAnswersHistory.map(a => a ? `${a.problemId} - ${a.isCorrect}` : 'null'),
      currentProblemIndex,
      currentAnswer: digitAnswers.join(""),
      problemaActual: currentProblem ? currentProblem.id : 'ninguno',
      respuestaCorrecta: currentProblem ? currentProblem.correctAnswer : 'ninguna',
    });
    
    // Si el problema actual tiene respuesta pero no está en userAnswersHistory, la añadimos
    if (currentProblem && currentProblemIndex < problemsList.length) {
      const currentAnswer = digitAnswers.join("");
      
      console.log(`Verificando última respuesta - Problema ${currentProblemIndex+1}:`, {
        digitosActuales: digitAnswers,
        respuestaActual: currentAnswer,
        respuestaCorrecta: currentProblem.correctAnswer,
        existeRespuesta: userAnswersHistory[currentProblemIndex] ? 'SI' : 'NO'
      });
      
      if (currentAnswer && currentAnswer.length > 0) {
        // Verificar si ya existe respuesta en el historial
        const existingAnswer = userAnswersHistory[currentProblemIndex];
        
        if (!existingAnswer) {
          console.log("DETECTADO: Último problema sin respuesta registrada - Forzando registro:", {
            problema: currentProblem.id,
            respuesta: currentAnswer
          });
          
          // Calcular si la respuesta es correcta
          const isCorrect = parseFloat(currentAnswer) === currentProblem.correctAnswer;
          
          // Crear objeto de respuesta
          const answer: UserAnswerType = {
            problemId: currentProblem.id,
            problem: currentProblem,
            userAnswer: parseFloat(currentAnswer),
            isCorrect: isCorrect,
            status: isCorrect ? 'correct' : 'incorrect',
            attempts: currentAttempts || 1,
            timestamp: Date.now()
          };
          
          // FORZAR actualización de respuesta - Más fiable que setState
          const newHistory = [...userAnswersHistory];
          newHistory[currentProblemIndex] = answer;
          setUserAnswersHistory(newHistory);
          
          // Forzar sincronización (importante!)
          setTimeout(() => {
            console.log("Verificación después de actualizar:", {
              respuestasActualizadas: newHistory.map(a => a ? `${a.problemId} - ${a.isCorrect}` : 'null'),
            });
          }, 50);
        }
      }
    }
    
    setExerciseCompleted(true);
    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);

    const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;
    const accuracy = problemsList.length > 0 ? Math.round((correctCount / problemsList.length) * 100) : 0;

    // Cálculo de tiempo promedio por problema
    const avgTimePerProblem = problemsList.length > 0 ? Math.round(timer / problemsList.length) : 0;

    // Cálculo de intentos promedio
    let totalAttempts = 0;
    const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;

    userAnswersHistory.forEach(answer => {
      if (answer) {
        totalAttempts += answer.attempts || 1;
        if (answer.status === 'revealed') {
          totalAttempts++;
        }
      }
    });

    const avgAttemptsValue = attemptedProblemsCount > 0
      ? parseFloat((totalAttempts / attemptedProblemsCount).toFixed(1))
      : 0;

    // Contar respuestas reveladas
    const revealedAnswers = userAnswersHistory.filter(a => a && a.status === 'revealed').length;

    // Nivel final - usamos el último nivel alcanzado
    const finalLevel = settings.enableAdaptiveDifficulty
      ? localStorage.getItem('associative-property_adaptiveDifficulty') || adaptiveDifficulty
      : settings.difficulty;

    // Construir detalles de problemas para guardar en historial
    const problemDetails = userAnswersHistory.map((answer, index) => {
      if (!answer) return null;

      const problem = problemsList[index];
      if (!problem) return null;

      return {
        problemId: problem.id || index,
        problem: {
          operands: problem.operands,
          correctAnswer: problem.correctAnswer,
          layout: problem.layout
        },
        isCorrect: answer.isCorrect,
        userAnswer: answer.userAnswer,
        correctAnswer: problem.correctAnswer,
        attempts: answer.attempts || 1,
        status: answer.status,
        level: finalLevel
      };
    }).filter(item => item !== null);

    // Create screenshot-like data structure that matches our template
    const screenshotData = {
      title: "Addition Exercise Complete!",
      scoreData: {
        totalTime: formatTime(timer),
        score: {
          value: `${correctCount} / ${problemsList.length}`,
          bgColor: "bg-blue-50",
          textColor: "text-indigo-600"
        },
        accuracy: {
          value: `${accuracy}%`,
          bgColor: "bg-green-50",
          textColor: "text-green-600"
        },
        avgTime: {
          value: `${avgTimePerProblem}s`,
          bgColor: "bg-purple-50",
          textColor: "text-purple-600"
        },
        avgAttempts: {
          value: avgAttemptsValue.toString(),
          bgColor: "bg-amber-50",
          textColor: "text-amber-600"
        },
        revealed: {
          value: revealedAnswers.toString(),
          bgColor: "bg-red-50",
          textColor: "text-red-600"
        },
        finalLevel: {
          value: settings.enableAdaptiveDifficulty
            ? (adaptiveDifficulty === 'beginner' ? '1'
              : adaptiveDifficulty === 'elementary' ? '2'
              : adaptiveDifficulty === 'intermediate' ? '3'
              : adaptiveDifficulty === 'advanced' ? '4'
              : adaptiveDifficulty === 'expert' ? '5' : '1')
            : (settings.difficulty === 'beginner' ? '1'
              : settings.difficulty === 'elementary' ? '2'
              : settings.difficulty === 'intermediate' ? '3'
              : settings.difficulty === 'advanced' ? '4'
              : settings.difficulty === 'expert' ? '5' : '1'),
          bgColor: "bg-teal-50",
          textColor: "text-teal-600"
        }
      },
      // CAPTURA DEFINITIVA DE LOS PROBLEMAS EXACTOS RESUELTOS
      exactProblems: userAnswersHistory.map((answer, index) => {
        if (!answer) return null;
        const problem = problemsList[index];
        if (!problem) return null;

        // Este es el formato EXACTO que se muestra en la pantalla final
        const problemText = `${problem.operands[0]} + ${problem.operands[1]} = ${problem.correctAnswer}`;

        // Objeto con la información completa del problema tal como se muestra en la UI
        return {
          problem: problemText,
          isCorrect: answer.isCorrect,
          attempts: (answer.attempts || 1).toString(),
          timeSpent: Math.round(timer / problemsList.length),
          level: finalLevel === "beginner" ? "1" :
                 finalLevel === "elementary" ? "2" :
                 finalLevel === "intermediate" ? "3" :
                 finalLevel === "advanced" ? "4" : "5"
        };
      }).filter(Boolean)
    };

    // Mostrar en consola para verificar
    console.log(`🧠 VERIFICACIÓN DE PUNTUACIÓN PARA GUARDAR:
    - Puntuación calculada (correctCount): ${correctCount}
    - Total de problemas: ${problemsList.length}
    - Precisión: ${accuracy}%
    - Respuestas correctas: ${userAnswersHistory.filter(a => a && a.isCorrect).length}
    - Respuestas incorrectas: ${userAnswersHistory.filter(a => a && !a.isCorrect).length}
    - Respuestas nulas: ${userAnswersHistory.filter(a => a === null).length}`);

    // Recalcular correctCount para asegurar exactitud
    const finalScore = userAnswersHistory.filter(a => a && a.isCorrect).length;

    // CORRECCIÓN: Calcular el score real excluyendo respuestas reveladas
    const puntajeCorregido = finalScore; // Usar el score real calculado

    console.log(`🧠 CORRECCIÓN DEL PUNTAJE:
    - Puntaje REAL calculado: ${finalScore}/${problemsList.length}
    - Respuestas reveladas: ${revealedAnswers}
    - Puntaje final a guardar: ${puntajeCorregido}/${problemsList.length}`);

    // SOLUCIÓN OPTIMIZADA VERSIÓN 7.0: Captura los problemas con diagnóstico ULTRA detallado
    function capturarProblemasExactos() {
      console.log("🔍🔍🔍 INICIO CAPTURA PROBLEMAS - DIAGNÓSTICO DETALLADO 🔍🔍🔍");
      
      // Diagnóstico 1: Estado general
      console.log(`🔵 ESTADO GENERAL DEL EJERCICIO:
        - Total problemas generados: ${problemsList.length}
        - Índice problema actual: ${currentProblemIndex}
        - Total respuestas historial: ${userAnswersHistory.length}
        - Respuestas nulas: ${userAnswersHistory.filter(r => r === null).length}
        - ESTADO COMPLETO DEL ARREGLO DE RESPUESTAS: 
          ${JSON.stringify(userAnswersHistory.map((r, i) => r ? 
            {índice: i, problema: r.problemId, respuesta: r.userAnswer, correcta: r.isCorrect} : 
            {índice: i, estado: "SIN RESPUESTA"}))}
      `);
      
      // DIAGNOSTICO 2: Examinar cada espacio de historia para detectar problemas
      console.log("🟡 ANÁLISIS PROBLEMA POR PROBLEMA:");
      for (let i = 0; i < problemsList.length; i++) {
        const respuesta = userAnswersHistory[i];
        const problema = problemsList[i];
        console.log(`   Problema #${i+1}: ${problema.id}`);
        console.log(`   - Operación: ${problema.operands?.[0]} + ${problema.operands?.[1]} = ${problema.correctAnswer}`);
        console.log(`   - Tiene respuesta: ${respuesta ? "SÍ" : "NO"}`);
        if (respuesta) {
          console.log(`   - Respuesta dada: ${respuesta.userAnswer}`);
          console.log(`   - Es correcta: ${respuesta.isCorrect ? "SÍ" : "NO"}`);
          console.log(`   - Estado: ${respuesta.status}`);
        }
      }
      
      // DIAGNÓSTICO 3: Estado del problema actual
      if (currentProblem) {
        console.log(`🔴 PROBLEMA ACTUAL (posiblemente el último):
          - Índice: ${currentProblemIndex}
          - ID: ${currentProblem.id}
          - Operación: ${currentProblem.operands?.[0]} + ${currentProblem.operands?.[1]} = ${currentProblem.correctAnswer}
          - Respuesta en teclado: ${digitAnswers.join("")}
          - Tiene respuesta registrada: ${userAnswersHistory[currentProblemIndex] ? "SÍ" : "NO"}
        `);
      }
      
      // ARREGLO CRÍTICO: Verificar y corregir cualquier problema sin respuesta registrada
      if (currentProblem && currentProblemIndex < problemsList.length) {
        const currentAnswer = digitAnswers.join("");
        
        console.log(`🔴 VERIFICACIÓN CRÍTICA - ÚLTIMO PROBLEMA #${currentProblemIndex+1}:`, {
          id: currentProblem.id,
          operación: `${currentProblem.operands?.[0]} + ${currentProblem.operands?.[1]} = ${currentProblem.correctAnswer}`,
          enTeclado: digitAnswers.join(""),
          tieneDigitos: digitAnswers.length > 0 ? "SÍ" : "NO",
          respuestaRegistrada: userAnswersHistory[currentProblemIndex] ? "SÍ" : "NO"
        });
        
        if (currentAnswer && currentAnswer.length > 0) {
          // Verificamos si existe respuesta registrada
          const existingAnswer = userAnswersHistory[currentProblemIndex];
          
          if (!existingAnswer) {
            console.log("🚨 PROBLEMA CRÍTICO DETECTADO: Último problema sin respuesta registrada");
            console.log("🚨 Forzando registro inmediato de respuesta:", currentAnswer);
            
            // Calculamos si la respuesta es correcta
            const isCorrect = parseFloat(currentAnswer) === currentProblem.correctAnswer;
            
            // Creamos objeto respuesta completo
            const respuestaGenerada = {
              problemId: currentProblem.id,
              problem: currentProblem,
              userAnswer: parseFloat(currentAnswer),
              isCorrect: isCorrect,
              status: isCorrect ? 'correct' : 'incorrect',
              attempts: currentAttempts || 1,
              timestamp: Date.now()
            };
            
            console.log("📝 Respuesta generada:", respuestaGenerada);
            
            // FORZAMOS actualización directa - más confiable que setState
            userAnswersHistory[currentProblemIndex] = respuestaGenerada;
            
            console.log("✅ Respuesta registrada para problema:", currentProblem.id);
            console.log("✅ Estado actual del historial:", userAnswersHistory.map((a, i) => a ? 
              `Prob#${i+1}: ${a.problemId} - ${a.userAnswer} - ${a.isCorrect}` : 
              `Prob#${i+1}: SIN RESPUESTA`));
          }
        } else {
          console.log("⚠️ NO HAY RESPUESTA EN TECLADO para el problema actual");
        }
      }
      
      console.log("🔄 INICIO PROCESAMIENTO FINAL DE PROBLEMAS");
      
      const problemasCapturados = [];
      
      // Procesar cada problema para la visualización final
      for (let i = 0; i < problemsList.length; i++) {
        const respuesta = userAnswersHistory[i];
        const problema = problemsList[i];
        
        // Solo omitimos si falta el problema (no debería ocurrir)
        if (!problema) {
          console.log(`⚠️ FALTA PROBLEMA en índice ${i}`);
          continue;
        }
        
        // Detectar problemas sin respuesta
        if (!respuesta) {
          console.log(`🚨 PROBLEMA #${i+1} SIN RESPUESTA REGISTRADA:`, problema.id);
        }
        
        // Marcamos si falta respuesta
        const esRespuestaNula = !respuesta;
        
        // Extraer operandos de manera segura
        let operandoA = 0;
        let operandoB = 0;
        
        if (Array.isArray(problema.operands) && problema.operands.length >= 2) {
          operandoA = problema.operands[0];
          operandoB = problema.operands[1];
        } else {
          // Alternativa para modelos antiguos
          operandoA = (problema.operand1 !== undefined) ? problema.operand1 : 0;
          operandoB = (problema.operand2 !== undefined) ? problema.operand2 : 0;
        }
        
        // Usar la respuesta correcta del problema o calcularla
        const respuestaCorrecta = problema.correctAnswer || (operandoA + operandoB);
        
        // Crear un objeto que incluya TODOS los datos necesarios para este tipo de problema
        const problemaCompleto = {
          // Metadatos para identificación
          id: problema.id || `problema-${i}`,
          tipo: "suma",
          
          // Datos específicos del problema de suma
          operands: [operandoA, operandoB],
          operacion: "+",
          correctAnswer: respuestaCorrecta.toString(),
          
          // Formato visual del problema (para mostrar exactamente como se vio)
          displayText: `${operandoA} + ${operandoB} = ${respuestaCorrecta}`,
          problem: `${operandoA} + ${operandoB} = ${respuestaCorrecta}`, // Para compatibilidad
          
          // Información sobre la respuesta del usuario
          // Si no hay respuesta (null), creamos información "no contestado"
          userAnswer: esRespuestaNula ? null : respuesta.userAnswer,
          isCorrect: esRespuestaNula ? false : respuesta.isCorrect,
          status: esRespuestaNula ? "unanswered" : (respuesta.status || (respuesta.isCorrect ? "correct" : "incorrect")),
          
          // Metadatos adicionales
          level: (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty),
          attempts: esRespuestaNula ? 0 : (respuesta.attempts || currentAttempts || 1),
          timeSpent: Math.round(timer / problemsList.length),
          
          // Campo info para visualización rápida
          info: esRespuestaNula 
            ? `Nivel: ${finalLevel}, Sin respuesta, Tiempo: ${Math.round(timer / problemsList.length)}s` 
            : `Nivel: ${finalLevel}, Intentos: ${respuesta.attempts || 1}, Tiempo: ${Math.round(timer / problemsList.length)}s`
        };
        
        problemasCapturados.push(problemaCompleto);
      }
      
      // Respaldo simple en localStorage (solo para depuración)
      try {
        const timestamp = Date.now();
        const claveRespaldo = `math_associative-property_${timestamp}`;
        localStorage.setItem(claveRespaldo, JSON.stringify(problemasCapturados));
      } catch (error) {
        console.error("Error al guardar respaldo local:", error);
      }
      
      return problemasCapturados;
    }

    // Capturar los problemas exactamente como se muestran en la UI
    const problemasCapturados = capturarProblemasExactos();

    // 🔬 SISTEMA ROBUSTO ANTIFRAGIL - Cálculo directo sin import
    console.log("🔬 [ROBUST-CALC] ===== INICIO CÁLCULO ANTIFRAGIL =====");
    console.log("🔬 [ROBUST-CALC] userAnswersHistory:", userAnswersHistory);
    
    // FUNCIÓN INTERNA ROBUSTA - Múltiples métodos de verificación
    const calcularScoreRobusto = (answers: any[]) => {
      const answersValidas = answers.filter(a => a && typeof a === 'object' && a.status !== undefined);
      
      // Método 1: Por status 'correct'
      const porStatus = answersValidas.filter(a => a.status === 'correct').length;
      
      // Método 2: Por campo isCorrect
      const porIsCorrect = answersValidas.filter(a => a.isCorrect === true).length;
      
      // Método 3: Por verificación dual
      const porVerificacion = answersValidas.reduce((count, answer) => {
        const esCorrecta = (answer.status === 'correct' && answer.isCorrect === true);
        return esCorrecta ? count + 1 : count;
      }, 0);
      
      console.log("🔬 [ROBUST-CALC] Métodos de cálculo:");
      console.log("🔬 [ROBUST-CALC] - Por status:", porStatus);
      console.log("🔬 [ROBUST-CALC] - Por isCorrect:", porIsCorrect);
      console.log("🔬 [ROBUST-CALC] - Por verificación:", porVerificacion);
      
      // Usar el valor más consistente
      const scores = [porStatus, porIsCorrect, porVerificacion];
      const scoreRobusto = scores.sort((a,b) => 
        scores.filter(v => v === a).length - scores.filter(v => v === b).length
      ).pop() || porStatus;
      
      const revealedAnswers = answersValidas.filter(a => a.status === 'revealed').length;
      const totalProblems = answersValidas.length;
      const accuracy = totalProblems > 0 ? Math.round((scoreRobusto / totalProblems) * 100) : 0;
      
      return { scoreRobusto, accuracy, revealedAnswers, totalProblems };
    };
    
    const resultado = calcularScoreRobusto(userAnswersHistory);
    
    console.log("🔬 [ROBUST-CALC] ===== COMPARACIÓN SISTEMAS =====");
    console.log("🔬 [ROBUST-CALC] Score original (frágil):", puntajeCorregido);
    console.log("🔬 [ROBUST-CALC] Score robusto:", resultado.scoreRobusto);
    console.log("🔬 [ROBUST-CALC] Accuracy original:", Math.round((puntajeCorregido / problemsList.length) * 100));
    console.log("🔬 [ROBUST-CALC] Accuracy robusta:", resultado.accuracy);
    console.log("🔬 [ROBUST-CALC] ¿Hay discrepancia?", puntajeCorregido !== resultado.scoreRobusto ? "❌ SÍ" : "✅ NO");

    // 🛡️ INTERCEPTOR ANTIFRAGIL DIRECTO - Sin imports
    const interceptorScore = (userAnswers: any[], scoreOriginal: number, context: string) => {
      console.log(`🛡️ [INTERCEPTOR] ===== VALIDANDO SCORE EN ${context} =====`);
      
      const answersValidas = userAnswers.filter(a => a && a.status !== undefined);
      const scoreCorregido = answersValidas.filter(a => a.status === 'correct').length;
      
      if (scoreCorregido !== scoreOriginal) {
        console.warn(`🚨 [INTERCEPTOR] CORRECCIÓN CRÍTICA: ${scoreOriginal} → ${scoreCorregido}`);
        return scoreCorregido;
      }
      
      console.log(`✅ [INTERCEPTOR] Score validado: ${scoreOriginal}`);
      return scoreOriginal;
    };
    
    // Aplicar interceptor antes del guardado
    const scoreFinal = interceptorScore(userAnswersHistory, resultado.scoreRobusto, "Exercise.tsx");
    const accuracyFinal = Math.round((scoreFinal / problemsList.length) * 100);
    
    // VERSIÓN 6.0 INTERCEPTOR ANTIFRAGIL: Usando valores interceptados y validados
    saveExerciseResult({
      operationId: "associative-property",
      date: new Date().toISOString(),
      score: scoreFinal, // ✅ Score interceptado y validado
      totalProblems: problemsList.length,
      timeSpent: timer,
      difficulty: finalLevel as string,
      
      // Estadísticas corregidas con interceptor
      accuracy: accuracyFinal, // ✅ Accuracy recalculada del score interceptado
      avgTimePerProblem: avgTimePerProblem,
      avgAttempts: avgAttemptsValue,
      revealedAnswers: resultado.revealedAnswers,
      
      // Datos extra con estructura clara
      extra_data: {
        // Metadatos para trazabilidad
        version: "4.0",
        timestamp: Date.now(),
        exerciseId: `associative-property_${Date.now()}`,
        
        // Almacenar los problemas en una ubicación consistente
        problemDetails: problemasCapturados,
        
        // Incluir también en ubicaciones alternativas para compatibilidad
        problems: problemasCapturados,
        capturedProblems: problemasCapturados,
        
        // Incluir información específica del tipo de ejercicio
        exerciseType: "associative-property",
        
        // Incluir resumen para facilitar acceso rápido
        summary: {
          operation: "associative-property",
          level: finalLevel,
          score: {
            correct: scoreFinal,
            total: problemsList.length
          },
          time: timer
        }
      }
    });

    // 🔄 INTEGRACIÓN MULTI-OPERACIONES: Detectar y manejar transición automática
    console.log('🔄 Verificando modo multi-operaciones:', { isMultiMode });
    
    if (isMultiMode) {
      console.log('🔄 Estamos en modo multi-operaciones, completando módulo addition...');
      
      // Preparar datos del módulo para la sesión multi-operaciones
      const moduleResults = {
        moduleId: 'addition',
        completed: true,
        correctAnswers: scoreFinal,
        totalAnswers: problemsList.length,
        timeSpent: timer,
        userAnswers: userAnswersHistory.filter(a => a !== null).map(answer => ({
          problem: answer?.problem,
          userAnswer: answer?.userAnswer,
          isCorrect: answer?.isCorrect,
          timeSpent: Math.round(timer / problemsList.length),
          attempts: answer?.attempts || 1
        }))
      };
      
      console.log('🔄 Datos del módulo addition preparados:', moduleResults);
      
      // Llamar al hook para completar el módulo actual y continuar
      completeCurrentModule(moduleResults);
      
      // Importante: Retornar aquí para evitar mostrar la pantalla de resumen individual
      return;
    }
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

  // Función para manejar el retroceso simple
  const handleBackspace = () => {
    if (waitingRef.current || exerciseCompleted || viewingPrevious) return;
    if (!exerciseStarted) startExercise();

    // Si estamos en nivel intermediate y hay un campo activo, manejar el borrado para ese campo
    if (settings.difficulty === 'intermediate' && activeInteractiveField) {
      setInteractiveAnswers(prev => ({
        ...prev,
        [activeInteractiveField]: prev[activeInteractiveField].slice(0, -1)
      }));
      return;
    }

    if (focusedDigitIndex === null || !currentProblem) return;
    
    let newAnswers = [...digitAnswers];
    let currentFocus = focusedDigitIndex;
    
    // Si el contenedor actual tiene un dígito, lo borramos
    if (newAnswers[currentFocus] !== "") {
      newAnswers[currentFocus] = "";
      setDigitAnswers(newAnswers);
    }
  };

  // Función para manejar el retroceso secuencial que permite saltar entre contenedores
  const handleSequentialBackspace = () => {
    if (waitingRef.current || focusedDigitIndex === null || !currentProblem || exerciseCompleted || viewingPrevious) return;
    if (!exerciseStarted) startExercise();
    
    let newAnswers = [...digitAnswers];
    let currentFocus = focusedDigitIndex;
    
    // Si el contenedor actual está vacío, movemos el foco al siguiente contenedor
    if (newAnswers[currentFocus] === "") {
      // Si estamos en modo RTL (derecha a izquierda), movemos a la derecha
      if (inputDirection === 'rtl') {
        if (currentFocus < currentProblem.answerMaxDigits - 1) {
          // Movemos el foco a la derecha y borramos el contenido en ese contenedor
          setFocusedDigitIndex(currentFocus + 1);
          
          // Programamos el borrado después del cambio de foco
          setTimeout(() => {
            setDigitAnswers((prev) => {
              const updated = [...prev];
              if (currentFocus + 1 < currentProblem.answerMaxDigits) {
                updated[currentFocus + 1] = "";
              }
              return updated;
            });
          }, 10);
        }
      } 
      // Si estamos en modo LTR (izquierda a derecha), movemos a la izquierda
      else {
        if (currentFocus > 0) {
          // Movemos el foco a la izquierda y borramos el contenido en ese contenedor
          setFocusedDigitIndex(currentFocus - 1);
          
          // Programamos el borrado después del cambio de foco
          setTimeout(() => {
            setDigitAnswers((prev) => {
              const updated = [...prev];
              if (currentFocus - 1 >= 0) {
                updated[currentFocus - 1] = "";
              }
              return updated;
            });
          }, 10);
        }
      }
    } 
    // Si el contenedor actual tiene un dígito, lo borramos
    else {
      newAnswers[currentFocus] = "";
      setDigitAnswers(newAnswers);
    }
  };

  const handleDigitInput = (value: string) => {
    if (waitingRef.current || !currentProblem || exerciseCompleted || viewingPrevious) return;
    if (!exerciseStarted) startExercise();

    // Si estamos en nivel intermediate y hay un campo activo, manejar la entrada para ese campo
    if (settings.difficulty === 'intermediate' && activeInteractiveField) {
      setInteractiveAnswers(prev => ({
        ...prev,
        [activeInteractiveField]: prev[activeInteractiveField] + value
      }));
      return;
    }

    let newAnswers = [...digitAnswers];
    let currentFocus = focusedDigitIndex;
    const maxDigits = currentProblem.answerMaxDigits;

    if (/[0-9]/.test(value)) {
      // 🧠 DETECCIÓN INTELIGENTE: Verificar si es el primer dígito ingresado
      const isFirstDigit = digitAnswers.every(digit => digit === "") && focusedDigitIndex === null;
      let detectedDirection = inputDirection; // Variable local para la dirección detectada

      
      if (isFirstDigit && currentProblem.correctAnswer !== undefined) {
        // Obtener el primer y último dígito de la respuesta correcta
        const correctAnswerStr = currentProblem.correctAnswer.toString().replace('.', '');
        const firstDigitCorrect = correctAnswerStr[0];
        const lastDigitCorrect = correctAnswerStr[correctAnswerStr.length - 1];
        
        // Casos especiales: si primer y último dígito son iguales, usar dirección por defecto del layout
        if (firstDigitCorrect === lastDigitCorrect) {
          currentFocus = inputDirection === 'ltr' ? 0 : maxDigits - 1;
          setFocusedDigitIndex(currentFocus);
          detectedDirection = inputDirection;
        }
        // Si coincide con el primer dígito -> LTR (izquierda a derecha)
        else if (value === firstDigitCorrect) {
          setInputDirection('ltr');
          currentFocus = 0;
          setFocusedDigitIndex(currentFocus);
          detectedDirection = 'ltr';
        }
        // Si coincide con el último dígito -> RTL (derecha a izquierda)
        else if (value === lastDigitCorrect) {
          setInputDirection('rtl');
          currentFocus = maxDigits - 1;
          setFocusedDigitIndex(currentFocus);
          detectedDirection = 'rtl';
        }
        // Si no coincide con ningún extremo, usar dirección por defecto del layout
        else {
          currentFocus = inputDirection === 'ltr' ? 0 : maxDigits - 1;
          setFocusedDigitIndex(currentFocus);
          detectedDirection = inputDirection;
        }
      } else if (focusedDigitIndex === null) {
        // Si no hay foco establecido, usar posición por defecto
        currentFocus = inputDirection === 'ltr' ? 0 : maxDigits - 1;
        setFocusedDigitIndex(currentFocus);
        detectedDirection = inputDirection;
      }
      
      // Verificar que currentFocus no sea null antes de usar
      if (currentFocus !== null) {
        newAnswers[currentFocus] = value;
      }
      
      // Mover el foco según la dirección detectada (solo si currentFocus no es null)
      if (currentFocus !== null) {
        if (detectedDirection === 'rtl') {
          // RTL: mover hacia la izquierda (índice menor)
          if (currentFocus > 0) {
            setFocusedDigitIndex(currentFocus - 1);
          }
        } else {
          // LTR: mover hacia la derecha (índice mayor)
          if (currentFocus < maxDigits - 1) {
            setFocusedDigitIndex(currentFocus + 1);
          }
        }
      }
    }
    
    setDigitAnswers(newAnswers);
  };

  useEffect(() => {
    const handlePhysicalKeyDown = (event: KeyboardEvent) => {
      // Usar waitingRef.current para la comprobación más actualizada
      if (waitingRef.current || exerciseCompleted || viewingPrevious || showLevelUpReward || !currentProblem) return;

      const key = event.key;
      if (key >= '0' && key <= '9') {
          // 🧠 DETECCIÓN INTELIGENTE: Verificar si es el primer dígito ingresado
          const isFirstDigit = digitAnswers.every(digit => digit === "") && focusedDigitIndex === null;
          let currentFocus = focusedDigitIndex;
          const maxDigits = currentProblem.answerMaxDigits;
          let detectedDirection = inputDirection; // Variable local para la dirección detectada
          
          if (isFirstDigit && currentProblem.correctAnswer !== undefined) {
            // Obtener el primer y último dígito de la respuesta correcta
            const correctAnswerStr = currentProblem.correctAnswer.toString().replace('.', '');
            const firstDigitCorrect = correctAnswerStr[0];
            const lastDigitCorrect = correctAnswerStr[correctAnswerStr.length - 1];
            
            // Casos especiales: si primer y último dígito son iguales, usar dirección por defecto del layout
            if (firstDigitCorrect === lastDigitCorrect) {
              currentFocus = inputDirection === 'ltr' ? 0 : maxDigits - 1;
              setFocusedDigitIndex(currentFocus);
              detectedDirection = inputDirection;
            }
            // Si coincide con el primer dígito -> LTR (izquierda a derecha)
            else if (key === firstDigitCorrect) {
              setInputDirection('ltr');
              currentFocus = 0;
              setFocusedDigitIndex(currentFocus);
              detectedDirection = 'ltr';
            }
            // Si coincide con el último dígito -> RTL (derecha a izquierda)
            else if (key === lastDigitCorrect) {
              setInputDirection('rtl');
              currentFocus = maxDigits - 1;
              setFocusedDigitIndex(currentFocus);
              detectedDirection = 'rtl';
            }
            // Si no coincide con ningún extremo, usar dirección por defecto del layout
            else {
              currentFocus = inputDirection === 'ltr' ? 0 : maxDigits - 1;
              setFocusedDigitIndex(currentFocus);
              detectedDirection = inputDirection;
            }
          } else if (focusedDigitIndex === null) {
            // Si no hay foco establecido, usar posición por defecto
            currentFocus = inputDirection === 'ltr' ? 0 : maxDigits - 1;
            setFocusedDigitIndex(currentFocus);
            detectedDirection = inputDirection;
          }
          
          // Verificar que currentFocus no sea null antes de usar
          if (currentFocus !== null) {
            let newAnswers = [...digitAnswers];
            newAnswers[currentFocus] = key;
            setDigitAnswers(newAnswers);
            
            // Mover el foco según la dirección detectada
            if (detectedDirection === 'rtl') {
                if (currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
            } else {
                if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1);
            }
          }
          event.preventDefault();
      } else if (key === 'Backspace' && focusedDigitIndex !== null) {
          let newAnswers = [...digitAnswers];
          newAnswers[focusedDigitIndex] = "";
          setDigitAnswers(newAnswers);
          event.preventDefault();
      } else if (key === 'Enter') {
          checkCurrentAnswer(); // checkCurrentAnswer es useCallback
          event.preventDefault();
      } else if (key === 'ArrowLeft' && focusedDigitIndex !== null) {
          if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
          event.preventDefault();
      } else if (key === 'ArrowRight' && focusedDigitIndex !== null) {
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
      const newProblemForLevelUp = generateAssociativePropertyProblem(adaptiveDifficulty);
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
    // 🔧 SOLUCIÓN: Usar exactamente la misma lógica exitosa del tooltip
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
      ? localStorage.getItem('associative-property_adaptiveDifficulty') || adaptiveDifficulty
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
            <div className="text-xl text-blue-600 font-semibold">
              {(() => {
                // 🔧 APLICAR EXACTAMENTE LA MISMA LÓGICA CONSISTENTE
                const finalScore = userAnswersHistory.filter(a => a && a.isCorrect).length;
                const percentage = Math.round((finalScore / problemsList.length) * 100);
                return `${finalScore}/${problemsList.length} (${percentage}%)`;
              })()}
            </div>
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

  // Función para manejar los videos explicativos de YouTube
  const handleSaveYoutubeVideos = (newVideos: string[]) => {
    setYoutubeVideos(newVideos);
    localStorage.setItem('associative-property_youtubeVideos', JSON.stringify(newVideos));
  };

  // Función para mostrar un video de YouTube en una nueva pestaña
  const openYoutubeVideo = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  return (
    <div className="relative">
      <LevelUpHandler />

      {/* Diálogo para gestionar videos explicativos */}
      <YoutubeVideoDialog
        isOpen={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        videos={youtubeVideos}
        onSave={handleSaveYoutubeVideos}
      />
      {/* El botón de YouTube ahora se muestra en la barra superior junto a los otros controles */}
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
      <div className={`px-2 py-3 sm:px-4 sm:py-5 rounded-xl shadow-lg min-h-[calc(100vh-8rem)] md:min-h-0 flex flex-col ${
        adaptiveDifficulty === "beginner" ? "bg-blue-50 border-blue-200" :
        adaptiveDifficulty === "elementary" ? "bg-emerald-50 border-emerald-200" :
        adaptiveDifficulty === "intermediate" ? "bg-orange-50 border-orange-200" :
        adaptiveDifficulty === "advanced" ? "bg-purple-50 border-purple-200" :
        adaptiveDifficulty === "expert" ? "bg-rose-50 border-rose-200" :
        "bg-indigo-50 border-indigo-200"
      } border-2`}>
        {/* Header - Responsive Design: Stack vertically on mobile, horizontal on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex flex-row justify-between items-center sm:flex-col sm:items-start">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">{currentTranslations.addition}</h2>
              <span className="sm:hidden font-medium text-sm bg-[#3b82f6] text-[#f9fafb]">
                Problem {currentProblemIndex + 1} de {settings.problemCount}
              </span>
            </div>
            
            {/* Top row info - Timer and basic stats */}
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
                {/* Rewards button - Desktop only, left of timer */}
                <Link href="/rewards" className="hidden sm:flex">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 py-1 px-2 text-xs text-yellow-600 hover:bg-yellow-50 border border-yellow-300 bg-yellow-50">
                    <Award className="h-4 w-4" /> 
                    <span>
                      {isEnglish ? "View Rewards" : "Ver Recompensas"} (⭐{rewardStats.totalPoints} pts)
                    </span>
                  </Button>
                </Link>
                
                <span className="font-medium text-gray-700 flex items-center">
                  <Info className="h-4 w-4 mr-1 opacity-70"/>
                  {formatTime(timer)}
                </span>
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
                
                {/* CONTADOR VISUAL DE RACHA CONSECUTIVA - Siempre visible */}
                {!viewingPrevious && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`font-medium p-1 rounded border-2 ${
                          consecutiveCorrectAnswers >= 8 
                            ? "bg-green-100 text-green-800 border-green-400 animate-pulse" 
                            : consecutiveCorrectAnswers >= 5 
                            ? "bg-blue-100 text-blue-800 border-blue-400" 
                            : consecutiveCorrectAnswers >= 3
                            ? "bg-purple-100 text-purple-800 border-purple-400"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}>
                          🔥 Racha: {consecutiveCorrectAnswers} ({maxConsecutiveStreak})
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{settings.enableAdaptiveDifficulty 
                          ? `Racha actual: ${consecutiveCorrectAnswers} | Récord máximo: ${maxConsecutiveStreak} (necesitas 10 para subir nivel)`
                          : `Racha actual: ${consecutiveCorrectAnswers} | Récord máximo alcanzado: ${maxConsecutiveStreak}`
                        }</p>
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
            </div>
            

        </div>
        <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1 bg-[#c5dbeb]" />
        
        {/* Unified Controls Row - Single horizontal row on mobile, maintain desktop layout */}
        <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 flex-wrap">
            {/* Problem Progress - Desktop only */}
            <span className="hidden sm:inline font-semibold px-2 py-1 border border-gray-300 rounded-md text-xs bg-[#2563eb] text-[#ffffff]">
              Problem : {currentProblemIndex + 1} de {problemsList.length}
            </span>
            
            {/* Score - First item */}
            <div className="flex flex-col items-center">
              <span className="font-semibold px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-xs">
                Score: {score}
              </span>
              <span className="text-xs mt-1 sm:hidden text-gray-500">Score</span>
            </div>
            
            {/* Modo Profesor button - Second item */}
            <div className="flex flex-col items-center">
              <button
                className="px-2 py-1 flex items-center justify-center text-indigo-600 border border-gray-300 rounded-md h-7 hover:bg-indigo-50"
                onClick={() => setShowProfessorMode(true)}
                title="Modo Profesor"
              >
                <span className="text-xs font-medium mr-1 hidden sm:inline">
                  {settings.language === 'english' ? 'Professor Mode' : 'Modo Profesor'}
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <span className="text-xs mt-1 sm:hidden text-gray-500">
                {settings.language === 'english' ? 'Prof' : 'Prof'}
              </span>
            </div>
            
            {/* Ver Video button - Third item */}
            <div className="flex flex-col items-center">
              <button
                className={`px-2 py-1 flex items-center justify-center ${youtubeVideos.length > 0 ? "text-red-600" : "text-gray-500 hover:text-red-500"} border border-gray-300 rounded-md h-7`}
                onClick={() => setShowVideoDialog(true)}
                title="Videos explicativos"
              >
                <span className="text-xs font-medium mr-1 hidden sm:inline">
                  {settings.language === 'english' ? 'Watch Explanatory Video' : 'Ver Video Explicativo'}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 16"
                  fill="currentColor"
                  className="h-5 w-6"
                >
                  <rect x="1" y="2" width="22" height="12" rx="4" fill="currentColor" fillOpacity="0.3" />
                  <polygon points="9,5 16,8 9,11" fill="currentColor" />
                </svg>
                {youtubeVideos.length > 0 && (
                  <span className="ml-1 text-xs font-medium">{youtubeVideos.length}</span>
                )}
              </button>
              <span className="text-xs mt-1 sm:hidden text-gray-500">
                {settings.language === 'english' ? 'Video' : 'Video'}
              </span>
            </div>
            
            {/* History button - Mobile version (icon only) */}
            <div className="flex flex-col items-center sm:hidden">
              <Link href="/progress?tab=recent">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 py-1 px-2 text-xs text-gray-600 hover:bg-gray-100 h-7 border border-gray-300">
                  <History className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-xs mt-1 text-gray-500">
                {settings.language === 'english' ? 'History' : 'Historial'}
              </span>
            </div>
            
            {/* History button - Desktop version (with text) */}
            <Link href="/progress?tab=recent" className="hidden sm:flex">
              <Button variant="ghost" size="sm" className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
                <History className="h-4 w-4" /> 
                <span>
                  {isEnglish ? "Exercise History" : "Historial de Ejercicios"}
                </span>
              </Button>
            </Link>
            
            {/* Rewards button - Mobile version (icon only) */}
            <div className="flex flex-col items-center sm:hidden">
              <Link href="/rewards">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 py-1 px-2 text-xs text-yellow-600 hover:bg-yellow-50 h-7 border border-yellow-300 bg-yellow-50">
                  <Award className="h-4 w-4" />
                  <span className="text-xs font-bold">⭐{rewardStats.totalPoints}</span>
                </Button>
              </Link>
              <span className="text-xs mt-1 text-yellow-600">
                {settings.language === 'english' ? 'Rewards' : 'Premios'}
              </span>
            </div>
            

            
            {/* Settings button - Mobile version (icon only) */}
            <div className="flex flex-col items-center sm:hidden">
              <Button variant="ghost" size="sm" onClick={onOpenSettings} className="flex items-center gap-1 py-1 px-2 text-xs text-gray-600 hover:bg-gray-100 h-7 border border-gray-300">
                <Cog className="h-4 w-4" />
              </Button>
              <span className="text-xs mt-1 text-gray-500">
                {settings.language === 'english' ? 'Settings' : 'Config'}
              </span>
            </div>
            
            {/* Settings button - Desktop version (with text) */}
            <Button variant="ghost" size="sm" onClick={onOpenSettings} className="hidden sm:flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
              <Cog className="h-4 w-4" /> 
              <span>
                {currentTranslations.settings}
              </span>
            </Button>
        </div>

        {/* Problem Display Area - Compact Design */}
        <div className="p-4 rounded-lg mb-4 shadow-sm bg-gray-50 border">
          {/* Visualización para diferentes niveles de dificultad */}
          {(settings.difficulty === 'beginner' || settings.difficulty === 'elementary') && (
            <VisualProblemDisplay 
              visualObjects={currentProblem.visualObjects || []}
              operands={currentProblem.operands}
              difficulty={settings.difficulty}
            />
          )}

          {/* Interactive Exercise para nivel intermedio */}
          {settings.difficulty === 'intermediate' && (
            <InteractiveExercise 
              operands={currentProblem.operands}
              onAnswer={(answers) => {
                // Verificar todas las respuestas del ejercicio interactivo
                const correctSum = currentProblem.correctAnswer;
                const form1Correct = answers[0] === correctSum;
                const form2Blanks = answers[1] === currentProblem.operands[1] && answers[2] === currentProblem.operands[2];
                const form2Answer = answers[3] === correctSum;
                
                if (form1Correct && form2Blanks && form2Answer) {
                  // Simular respuesta correcta
                  setFeedbackMessage("¡Excelente! Has completado correctamente ambas formas de la propiedad asociativa.");
                  setFeedbackColor("green");
                  setTimeout(() => {
                    if (currentProblemIndex < problems.length - 1) {
                      nextProblem();
                    } else {
                      completeExercise();
                    }
                  }, 2000);
                } else {
                  // Simular respuesta incorrecta
                  setFeedbackMessage("Revisa tus respuestas. Recuerda que ambas formas deben dar el mismo resultado.");
                  setFeedbackColor("red");
                }
              }}
            />
          )}

          {/* Answer Input Boxes - Solo para niveles que no son intermedio */}
          {settings.difficulty !== 'intermediate' && (
            <>
              <div className="mt-4 flex items-center justify-center gap-1">
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
                            digitBoxRefs.current = boxRefsArrayRef.current;
                          }
                        }}
                        tabIndex={viewingPrevious || exerciseCompleted || waitingRef.current ? -1 : 0}
                        className={`
                          w-12 h-12 border-2 rounded-md
                          flex items-center justify-center
                          text-xl font-bold
                          transition-all duration-200
                          ${viewingPrevious || exerciseCompleted || waitingRef.current 
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                            : (focusedDigitIndex === index 
                              ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                              : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md cursor-text'
                            )
                          }
                        `}
                        onClick={() => !viewingPrevious && !exerciseCompleted && !waitingRef.current && handleDigitBoxClick(index)}
                        onFocus={() => {if (!viewingPrevious && !exerciseCompleted && !waitingRef.current) setFocusedDigitIndex(index);}}
                      >
                        {digitAnswers[index] || <span className="opacity-0">0</span>}
                      </div>
                      {isVisualDecimalPointAfterThisBox && (
                        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mx-0.5 sm:mx-1 opacity-80 self-center pt-1 select-none">.</div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {feedbackMessage && (viewingPrevious || (!viewingPrevious && currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) || exerciseCompleted) && (
                <div className={`mt-2 sm:mt-3 text-center font-medium text-sm sm:text-base md:text-lg ${feedbackColor === "green" ? "text-green-600" : feedbackColor === "blue" ? "text-blue-700" : "text-red-600"}`}>
                  {feedbackMessage}
                </div>
              )}
            </>
          )}
        </div>
        {/* Number Keypad - Full Width Design */}
        <div className="grid grid-cols-3 gap-3 w-full px-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ">", "0", "<"].map((key, idx) => (
            <Button
              key={key || `empty-key-${idx}`}
              variant="outline"
              className={`
                h-12 text-lg font-semibold
                transition-all duration-200
                ${
                key === ">" 
                  ? "bg-white hover:bg-red-50 text-red-600 active:bg-red-100 shadow-sm border-red-200 hover:border-red-300" 
                  : key === "<" 
                    ? "bg-white hover:bg-blue-50 text-blue-600 active:bg-blue-100 shadow-sm border-blue-200 hover:border-blue-300"
                    : "bg-white hover:bg-gray-50 shadow-sm active:bg-gray-100 border-gray-300 hover:border-gray-400 hover:shadow-md"
              }`}
              onClick={() => {
                if (viewingPrevious || exerciseCompleted || waitingRef.current || !key || key === "") return;
                
                if (key === ">" || key === "sequential_backspace") {
                  handleSequentialBackspace();
                } else if (key === "<" || key === "backspace") {
                  handleBackspace();
                } else {
                  handleDigitInput(key);
                }
              }}
              disabled={waitingRef.current || exerciseCompleted || viewingPrevious || key === "" || (!exerciseStarted && key !== "" && key !== "backspace" && key !== "sequential_backspace" && (key < '0' || key > '9'))}
            >
              {key === "backspace" 
                ? <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" /> 
                : key === "sequential_backspace" 
                  ? <span className="text-xl sm:text-2xl md:text-3xl font-bold">&gt;</span>
                  : key
              }
            </Button>
          ))}
        </div>
        {/* Bottom Control Buttons - Responsive: Optimized for all screen sizes */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          {/* Mobile/Tablet: Previous and Show Answer in same row */}
          <div className="flex sm:hidden w-full gap-3">
            <Button
              variant="outline" 
              size="sm"
              disabled={(viewingPrevious ? currentProblemIndex === 0 : actualActiveProblemIndexBeforeViewingPrevious === 0 && currentProblemIndex === 0 && !viewingPrevious) || exerciseCompleted}
              onClick={moveToPreviousProblem}
              className="flex-1 text-xs h-12"
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> {currentTranslations.previous}
            </Button>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="outline" size="sm"
                      disabled={(!settings.showAnswerWithExplanation && !viewingPrevious) || viewingPrevious || exerciseCompleted || waitingRef.current || !exerciseStarted}
                      onClick={() => {
                          if(currentProblem && !viewingPrevious && !exerciseCompleted && !waitingRef.current) {
                              if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                              
                              // Reiniciar el contador de respuestas correctas consecutivas cuando se revela una respuesta
                              setConsecutiveCorrectAnswers(0);
                              console.log("[ASSOCIATIVE-PROPERTY] Reiniciando contador de respuestas correctas consecutivas por respuesta revelada");
                              
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
                                      console.log("[ASSOCIATIVE-PROPERTY] Agregando problema de compensación por respuesta revelada");
                                      const difficultyForCompensation = settings.enableAdaptiveDifficulty
                                          ? adaptiveDifficulty
                                          : (settings.difficulty as DifficultyLevel);

                                      const compensationProblem = generateAssociativePropertyProblem(difficultyForCompensation);
                                      setProblemsList(prev => [...prev, compensationProblem]);
                                      // Agregamos null al historial para que coincida con el nuevo problema añadido
                                      setUserAnswersHistory(prev => [...prev, null]);
                                      console.log("[ASSOCIATIVE-PROPERTY] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
                                  }
                              }
                              if (settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts) {
                                  setCurrentAttempts(prev => prev + 1); // Contar como un intento si se revela
                              }
                          }
                      }}
                      className="flex-1 text-xs h-12"
                  >
                      <Info className="mr-1 h-3 w-3" /> {currentTranslations.showAnswer}
                  </Button>
                </TooltipTrigger>
                {(!settings.showAnswerWithExplanation && !viewingPrevious && !waitingRef.current) ? (
                    <TooltipContent><p>{t('tooltips.activateShowAnswerInSettings')}</p></TooltipContent>
                ) : viewingPrevious ? (
                    <TooltipContent><p>{t('tooltips.showAnswerDisabledInHistory')}</p></TooltipContent>
                ) : waitingRef.current ? ( // Usar waitingRef.current
                    (<TooltipContent><p>{t('tooltips.showAnswerDisabledWhileWaiting')}</p></TooltipContent>)
                ) : null }
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Desktop: Original layout */}
          <Button
            variant="outline" 
            size="sm"
            disabled={(viewingPrevious ? currentProblemIndex === 0 : actualActiveProblemIndexBeforeViewingPrevious === 0 && currentProblemIndex === 0 && !viewingPrevious) || exerciseCompleted}
            onClick={moveToPreviousProblem}
            className="hidden sm:flex w-auto text-xs sm:text-sm md:text-base h-12 sm:h-10 order-1 sm:order-1"
          >
            <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {currentTranslations.previous}
          </Button>

          {viewingPrevious ? (
            <Button 
              onClick={returnToActiveProblem} 
              className="w-full sm:w-auto px-4 sm:px-5 text-sm sm:text-base md:text-lg bg-orange-500 hover:bg-orange-600 text-white h-12 sm:h-10 order-2 sm:order-2"
            >
                <RotateCcw className="mr-1 h-4 w-4" /> {settings.language === 'spanish' ? 'Volver al Activo' : 'Return to Active'}
            </Button>
          ) : waitingRef.current ? ( // Usar waitingRef.current para la UI
            (<Button
                ref={continueButtonRef}
                onClick={handleContinue}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 text-base sm:text-lg md:text-xl animate-pulse bg-green-500 hover:bg-green-600 text-white flex items-center justify-center h-12 sm:h-10 order-2 sm:order-2"
            >
              <span className="flex-grow text-center font-medium">{t('Continue')}</span>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="ml-2 sm:ml-3 flex items-center bg-black/20 py-1 px-2 rounded-md cursor-pointer"
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
            </Button>)
          ) : (
            <Button 
              onClick={checkCurrentAnswer} 
              disabled={exerciseCompleted || waitingRef.current} 
              className="w-full sm:w-auto px-5 sm:px-6 text-sm sm:text-base md:text-lg bg-blue-500 hover:bg-blue-600 text-white h-12 sm:h-10 order-2 sm:order-2"
            >
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
                            
                            // Reiniciar el contador de respuestas correctas consecutivas cuando se revela una respuesta
                            setConsecutiveCorrectAnswers(0);
                            localStorage.setItem('associative-property_consecutiveCorrectAnswers', '0');
                            console.log("[ASSOCIATIVE-PROPERTY] Reiniciando contador de respuestas correctas consecutivas por respuesta revelada");
                            
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
                                    console.log("[ASSOCIATIVE-PROPERTY] Agregando problema de compensación por respuesta revelada");
                                    const difficultyForCompensation = settings.enableAdaptiveDifficulty
                                        ? adaptiveDifficulty
                                        : (settings.difficulty as DifficultyLevel);

                                    const compensationProblem = generateAssociativePropertyProblem(difficultyForCompensation);
                                    setProblemsList(prev => [...prev, compensationProblem]);
                                    // Agregamos null al historial para que coincida con el nuevo problema añadido
                                    setUserAnswersHistory(prev => [...prev, null]);
                                    console.log("[ASSOCIATIVE-PROPERTY] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
                                }
                            }
                            if (settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts) {
                                setCurrentAttempts(prev => prev + 1); // Contar como un intento si se revela
                            }
                        }
                    }}
                    className="hidden sm:flex w-auto text-xs sm:text-sm h-12 sm:h-10"
                >
                    <Info className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {currentTranslations.showAnswer}
                </Button>
              </TooltipTrigger>
              {(!settings.showAnswerWithExplanation && !viewingPrevious && !waitingRef.current) ? (
                  <TooltipContent><p>{t('tooltips.activateShowAnswerInSettings')}</p></TooltipContent>
              ) : viewingPrevious ? (
                  <TooltipContent><p>{t('tooltips.showAnswerDisabledInHistory')}</p></TooltipContent>
              ) : waitingRef.current ? ( // Usar waitingRef.current
                  (<TooltipContent><p>{t('tooltips.showAnswerDisabledWhileWaiting')}</p></TooltipContent>)
              ) : null }
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* Modo Profesor - Nueva implementación con canvas para dibujo */}
      {showProfessorMode && (
        <ProfessorMode
          problem={currentProblem}
          onClose={() => setShowProfessorMode(false)}
          onCorrectAnswer={(wasCorrect: boolean) => {
            // Actualizar contadores de respuestas consecutivas
            if (wasCorrect) {
              const newConsecutive = consecutiveCorrectAnswers + 1;
              setConsecutiveCorrectAnswers(newConsecutive);
              setConsecutiveIncorrectAnswers(0);
              
              // Verificar posible subida de nivel si se alcanza el umbral
              if (newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP && settings.enableAdaptiveDifficulty) {
                const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
                const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
                
                // Solo subir si no estamos ya en el nivel máximo
                if (currentLevelIdx < difficultiesOrder.length - 1) {
                  const newLevel = difficultiesOrder[currentLevelIdx + 1];
                  setAdaptiveDifficulty(newLevel);
                  setConsecutiveCorrectAnswers(0);
                  console.log(`[CONTADOR] 🔼 Subiendo nivel a: ${newLevel}`);
                }
              }
            } else if (settings.enableCompensation) {
              // Agregar problema de compensación cuando se falla
              console.log("[ASSOCIATIVE-PROPERTY] Agregando problema de compensación por respuesta incorrecta en modo profesor");
              const difficultyForCompensation = settings.enableAdaptiveDifficulty
                ? adaptiveDifficulty
                : (settings.difficulty as DifficultyLevel);
                
              const compensationProblem = generateAssociativePropertyProblem(difficultyForCompensation);
              setProblemsList(prev => [...prev, compensationProblem]);
              // Agregamos null al historial para que coincida con el nuevo problema añadido
              setUserAnswersHistory(prev => [...prev, null]);
            }
            
            // Generar un nuevo problema
            const newProblem = generateAssociativePropertyProblem(settings.difficulty);
            // Agregar información sobre la posición y total de problemas
            newProblem.index = currentProblemIndex;
            newProblem.total = settings.problemCount;
            setCurrentProblem(newProblem);
            
            // Avanzar el contador de problemas si es necesario
            if (currentProblemIndex < settings.problemCount - 1) {
              setCurrentProblemIndex(prev => prev + 1);
            }
            
            // Reiniciar temporizador para el nuevo problema
            const newStartTime = Date.now();
            setProblemStartTime(newStartTime);
          }}
          showVerticalFormat={true}
          settings={{
            maxAttempts: settings.maxAttempts,
            enableCompensation: settings.enableCompensation
          }}
        />
      )}

      {/* 🎯 Modal de Recompensas Simplificado */}
      {rewardStats.showRewardModal && rewardStats.lastReward && (
        <Dialog open={rewardStats.showRewardModal} onOpenChange={(open) => {
          if (!open) {
            setRewardStats(prev => ({ ...prev, showRewardModal: false, lastReward: null }));
          }
        }}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-2">
                <span className="text-3xl">{rewardStats.lastReward.icon}</span>
                ¡Recompensa Desbloqueada!
              </DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <div className="text-4xl mb-4">{rewardStats.lastReward.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {rewardStats.lastReward.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {rewardStats.lastReward.description}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 inline-block">
                <span className="text-yellow-700 font-semibold">
                  +{rewardStats.lastReward.points} puntos
                </span>
              </div>
            </div>
            <DialogFooter className="justify-center">
              <Button 
                onClick={() => setRewardStats(prev => ({ ...prev, showRewardModal: false, lastReward: null }))}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                ¡Genial! Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}