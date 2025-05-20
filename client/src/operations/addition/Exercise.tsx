// Exercise.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateAdditionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, AdditionProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube, X, Plus, Maximize2, Minimize2, Play } from "lucide-react";
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
import { useRewardsStore, awardReward, getRewardProbability, selectRandomReward } from '@/lib/rewards-system';
import RewardAnimation from '@/components/rewards/RewardAnimation';
import ExerciseHistoryDialog from "@/components/ExerciseHistoryDialog";

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
          <div className={`relative ${isFullscreen ? 'w-full h-full' : 'aspect-video'}`}>
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
          </div>
        ) : isEditMode ? (
          // Modo de edición
          <div className="space-y-4 py-4">
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
          </div>
        ) : (
          // Modo de visualización de miniaturas
          <div className="space-y-6 py-4">
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

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

  const [userAnswersHistory, setUserAnswersHistory] = useState<(UserAnswerType | null)[]>([]); // Permitir null
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

  // Estados para manejar los videos explicativos de YouTube
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>(() => {
    try {
      const storedVideos = localStorage.getItem('addition_youtubeVideos');
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
        attempts: newAttempts, // Guardar el número de intentos para este problema específico
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
    // Los setters y contextos suelen ser estables, pero es bueno listarlos si la lógica depende de ellos directamente.
    setUserAnswersHistory, setActualActiveProblemIndexBeforeViewingPrevious, setFeedbackMessage, 
    setFeedbackColor, setConsecutiveCorrectAnswers, setConsecutiveIncorrectAnswers, 
    setAdaptiveDifficulty, updateModuleSettings, setShowLevelUpReward, setBlockAutoAdvance, 
    setShowRewardAnimation, setWaitingForContinue, setCurrentAttempts, saveExerciseResult // Agregado saveExerciseResult si se usa indirectamente
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
          attempts: newAttempts,
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

    const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;
    const accuracy = problemsList.length > 0 ? Math.round((correctCount / problemsList.length) * 100) : 0;

    // Cálculo de tiempo promedio por problema
    const avgTimePerProblem = problemsList.length > 0 ? Math.round(timer / problemsList.length) : 0;

    // Cálculo de intentos promedio
    let totalIndividualProblemAttempts = 0;
    const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;

    userAnswersHistory.forEach(answer => {
      if (answer) {
        totalIndividualProblemAttempts += answer.attempts || 1; // Usar el campo attempts guardado en UserAnswerType
      }
    });

    const avgAttemptsValue = attemptedProblemsCount > 0 
      ? parseFloat((totalIndividualProblemAttempts / attemptedProblemsCount).toFixed(1))
      : 0;

    // Contar respuestas reveladas
    const revealedAnswers = userAnswersHistory.filter(a => a && a.status === 'revealed').length;

    // Nivel final - usamos el último nivel alcanzado
    const finalLevel = settings.enableAdaptiveDifficulty 
      ? localStorage.getItem('addition_adaptiveDifficulty') || adaptiveDifficulty 
      : settings.difficulty;

    // SOLUCIÓN OPTIMIZADA VERSIÓN 2.0: Captura los problemas en formato estándar para toda la aplicación
    function capturarProblemasExactos() {
      console.log("📸 Capturando problemas con formato estándar (V2.0)...");

      // Array para almacenar los problemas con formato compatible
      const problemasCapturas: MathProblem[] = []; // Usar tipo MathProblem si es adecuado, o uno específico

      // Procesar cada problema completado
      for (let i = 0; i < problemsList.length; i++) {
        const respuesta = userAnswersHistory[i];
        const problema = problemsList[i];

        if (!respuesta || !problema) continue;

        // Formatear el problema exactamente como se muestra en pantalla
        let operandoA = 0;
        let operandoB = 0;

        if (Array.isArray(problema.operands) && problema.operands.length >= 2) {
          operandoA = problema.operands[0];
          operandoB = problema.operands[1];
        } else {
          operandoA = (problema as any).operand1 || 0;
          operandoB = (problema as any).operand2 || 0;
        }

        const respuestaCorrecta = problema.correctAnswer || (operandoA + operandoB);
        const textoProblema = `${operandoA} + ${operandoB} = ${respuestaCorrecta}`;

        const nivelTexto = finalLevel === "beginner" ? "1" : 
                         finalLevel === "elementary" ? "2" : 
                         finalLevel === "intermediate" ? "3" : 
                         finalLevel === "advanced" ? "4" : "5";

        const tiempoPorProblema = Math.round(timer / problemsList.length);

        problemasCapturas.push({
          problem: textoProblema,
          isCorrect: respuesta.isCorrect,
          level: nivelTexto,
          attempts: (respuesta.attempts || 1).toString(), // Asegurar que attempts es string
          timeSpent: tiempoPorProblema, // number
          info: `Nivel: ${nivelTexto}, Intentos: ${respuesta.attempts || 1}, Tiempo: ${tiempoPorProblema}s`,
          userAnswer: respuesta.userAnswer !== undefined && !isNaN(respuesta.userAnswer) ? respuesta.userAnswer.toString() : "",
          correctAnswer: respuestaCorrecta.toString(),
          // problemNumber no es estrictamente necesario aquí, pero ProblemRenderer lo usa. Se puede añadir en ProgressPage
        });
      }

      // RESPALDO MÚLTIPLE: Guardar en varias ubicaciones para garantizar recuperación (ESTO SE MANTIENE POR AHORA)
      try {
        const timestamp = Date.now();
        const claveEjercicio = `math_exercise_${timestamp}`;
        const claveOperacion = `operation_addition_${timestamp}`;
        const claveEstandar = `backup_problemas_${timestamp}`;
        localStorage.setItem(claveEstandar, JSON.stringify(problemasCapturas));
        localStorage.setItem(claveOperacion, JSON.stringify(problemasCapturas));
        localStorage.setItem(claveEjercicio, JSON.stringify({
          id: timestamp,
          fecha: new Date().toISOString(),
          date: new Date().toISOString(),
          operacion: "addition",
          operation: "addition",
          nivel: finalLevel,
          level: finalLevel,
          puntuacion: { correctas: correctCount, total: problemsList.length },
          score: { correct: correctCount, total: problemsList.length },
          problems: problemasCapturas,
          problemas: problemasCapturas
        }));
        console.log(`✅ Respaldo completo guardado en localStorage: ${claveEjercicio}`);
      } catch (error) {
        console.error("Error al guardar respaldo:", error);
      }

      return problemasCapturas;
    }

    // Capturar los problemas exactamente como se muestran en la UI
    const problemasCapturados = capturarProblemasExactos();

    // El puntaje "corregido" se elimina para guardar el puntaje real.
    // const puntajeCorregido = problemsList.length; 
    const puntajeReal = correctCount;

    saveExerciseResult({
      operationId: "addition",
      date: new Date().toISOString(),
      score: puntajeReal, // Usar puntaje real
      totalProblems: problemsList.length,
      timeSpent: timer,
      difficulty: finalLevel as string,

      accuracy: accuracy, // Usar accuracy calculada con puntaje real
      avgTimePerProblem: avgTimePerProblem,
      avgAttempts: avgAttemptsValue,
      revealedAnswers: revealedAnswers,

      // VERSIÓN 3.0+: Estructura de extra_data
      extra_data: {
        version: "3.1", // Incrementar versión para indicar cambio
        timestamp: Date.now(),
        exerciseId: `addition_${Date.now()}`,

        // ---- INICIO SOLUCIÓN PROBLEMA 1 ----
        // Guardar los problemas capturados bajo las claves que ProgressPage.tsx espera.
        problemDetails: problemasCapturados, // Clave principal y preferida.
        problems: problemasCapturados,       // Clave alternativa según descripción del problema.
        // Se eliminan mathProblems, capturedProblems, problemas (plural) para reducir redundancia no crítica.
        // ---- FIN SOLUCIÓN PROBLEMA 1 ----

        // Mantener summary y otros datos por si son usados en otras partes.
        summary: {
          operation: "addition",
          level: finalLevel,
          score: { correct: puntajeReal, total: problemsList.length },
          time: timer,
          date: new Date().toISOString()
        },
        resumen: {
          operacion: "addition",
          nivel: finalLevel,
          puntuacion: { correctas: puntajeReal, total: problemsList.length },
          tiempo: timer,
          fecha: new Date().toISOString()
        },
        exerciseSummary: {
          operation: "addition",
          level: finalLevel,
          score: puntajeReal,
          totalProblems: problemsList.length,
          time: timer
        }
      }
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
    let totalIndividualProblemAttempts = 0;
    const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;

    userAnswersHistory.forEach(answer => {
      if (answer) {
        totalIndividualProblemAttempts += answer.attempts || 1;
      }
    });

    const avgAttempts = attemptedProblemsCount > 0 
      ? (totalIndividualProblemAttempts / attemptedProblemsCount).toFixed(1) 
      : "0";

    // Contar respuestas reveladas
    const revealedAnswers = userAnswersHistory.filter(a => a && a.status === 'revealed').length;

    const finalLevel = settings.enableAdaptiveDifficulty 
      ? localStorage.getItem('addition_adaptiveDifficulty') || adaptiveDifficulty 
      : settings.difficulty;

    return (
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {t('Addition Exercise Complete!')}
        </h2>

        <div className="bg-gray-100 p-3 rounded-lg mb-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Total Time</div>
          <div className="text-xl font-bold">{formatTime(timer)}</div>
        </div>

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

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Problem Review</h3>
          <div className="space-y-2">
            {userAnswersHistory.map((answer, index) => {
              if (!answer) return null;

              const problem = problemsList[index];
              if (!problem) return null;

              let problemDisplay = '';
              if (problem.operands && problem.operands.length > 0) {
                if (problem.operands.length === 2) {
                  problemDisplay = `${problem.operands[0]} + ${problem.operands[1]} = ${problem.correctAnswer}`;
                  if (!answer.isCorrect && answer.userAnswer !== undefined && !isNaN(answer.userAnswer)) {
                    problemDisplay += ` (Tu r: ${answer.userAnswer})`;
                  }
                }
              }

              let attemptInfo = `Nivel: ${finalLevel === "beginner" ? "1" : 
                                 finalLevel === "elementary" ? "2" : 
                                 finalLevel === "intermediate" ? "3" : 
                                 finalLevel === "advanced" ? "4" : "5"}, Intentos: ${answer.attempts || 1}, T: ${avgTimePerProblem}s`;

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
                        : <span className="text-red-600 font-bold">✕</span>}
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

  const attemptedProblemsCountUI = userAnswersHistory.filter(a => a !== null).length;
  const progressValue = problemsList.length > 0 ? (attemptedProblemsCountUI / problemsList.length) * 100 : 0;
  const score = userAnswersHistory.filter(a => a && a.isCorrect).length;

  // Función para manejar los videos explicativos de YouTube
  const handleSaveYoutubeVideos = (newVideos: string[]) => {
    setYoutubeVideos(newVideos);
    localStorage.setItem('addition_youtubeVideos', JSON.stringify(newVideos));
  };

  return (
    <div className="relative">
      <LevelUpHandler />
      <RewardAnimation />

      <YoutubeVideoDialog 
        isOpen={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        videos={youtubeVideos}
        onSave={handleSaveYoutubeVideos}
      />

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
                <Button variant="ghost" size="sm" onClick={onOpenSettings} className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
                  <Cog className="h-4 w-4" /> {currentTranslations.settings}
                </Button>
            </div>
        </div>
        <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1" />
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            <span>{currentTranslations.problem} {currentProblemIndex + 1} {currentTranslations.of} {problemsList.length}</span>
            <div className="flex items-center gap-2">
              <button 
                className={`px-2 py-1 flex items-center justify-center ${youtubeVideos.length > 0 ? "text-red-600" : "text-gray-500 hover:text-red-500"} border border-gray-300 rounded-md h-7 w-auto`}
                onClick={() => setShowVideoDialog(true)} 
                title="Videos explicativos"
              >
                <span className="text-xs font-medium mr-1">
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
              <span className="font-semibold">{t('exercises.score')}: {score}</span>
            </div>
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
                        boxRefsArrayRef.current[index] = el;
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
          ) : waitingRef.current ? ( 
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
                            setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
                            setFeedbackColor("blue");
                            setWaitingForContinue(true); 
                            const problemIdxForHistory = actualActiveProblemIndexBeforeViewingPrevious;
                            const answerEntry = userAnswersHistory[problemIdxForHistory];
                            if (!answerEntry || (!answerEntry.isCorrect && answerEntry.status !== 'revealed')) {
                                setUserAnswersHistory(prev => {
                                    const newHistory = [...prev];
                                    const currentProblemEntry = currentProblem; // Evitar error de closure
                                    newHistory[problemIdxForHistory] = { 
                                        problemId: currentProblemEntry.id, 
                                        problem: currentProblemEntry, 
                                        userAnswer: NaN,
                                        isCorrect: false, 
                                        attempts: (answerEntry?.attempts || 0) + 1, // Incrementar intentos
                                        status: 'revealed' 
                                    };
                                    return newHistory;
                                });

                                if (settings.enableCompensation) {
                                    console.log("[ADDITION] Agregando problema de compensación por respuesta revelada");
                                    const difficultyForCompensation = settings.enableAdaptiveDifficulty 
                                        ? adaptiveDifficulty 
                                        : (settings.difficulty as DifficultyLevel);

                                    const compensationProblem = generateAdditionProblem(difficultyForCompensation);
                                    setProblemsList(prev => [...prev, compensationProblem]);
                                    setUserAnswersHistory(prev => [...prev, null]);
                                    console.log("[ADDITION] Problema de compensación agregado. Total de problemas:", problemsList.length + 1);
                                }
                            }
                            // Contar como un intento si no se habían agotado los intentos y la respuesta no era ya 'revealed'
                            if (settings.maxAttempts === 0 || (currentAttempts < settings.maxAttempts && (!answerEntry || answerEntry.status !== 'revealed'))) {
                                setCurrentAttempts(prev => prev + 1); 
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

// ProgressPage.tsx
import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useProgress, ExerciseResult } from "@/context/ProgressContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { operationModules } from "@/utils/operationComponents";
import { Loader2, RefreshCw, Check, X } from "lucide-react";
import ProblemRenderer, { MathProblem } from "../components/ProblemRenderer";

export default function ProgressPage() {
  const { exerciseHistory, moduleProgress, clearProgress, refreshProgress, isLoading } = useProgress();
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [selectedExercise, setSelectedExercise] = useState<ExerciseResult | null>(null);

  // Función para refrescar los datos manualmente
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshProgress();
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProgress]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleClearProgress = async () => {
    setIsClearing(true);
    await clearProgress();
    setIsClearing(false);
  };

  // Prepare data for charts
  const getModuleColor = (moduleId: string) => {
    const colorMap: Record<string, string> = {
      addition: "#3B82F6", // primary
      subtraction: "#8B5CF6", // secondary
      multiplication: "#10B981", // success
      division: "#F59E0B", // amber-500
      fractions: "#EF4444", // error
    };
    return colorMap[moduleId] || "#6B7280"; // gray-500 as default
  };

  // Recent progress data - last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return {
      date: format(date, "MMM dd"),
      dateObj: date,
    };
  }).reverse();

  const recentProgressData = last7Days.map(day => {
    const dayResults = exerciseHistory ? exerciseHistory.filter(result => {
      if (!result || !result.date) return false;
      const resultDate = parseISO(result.date);
      return (
        resultDate.getDate() === day.dateObj.getDate() &&
        resultDate.getMonth() === day.dateObj.getMonth() &&
        resultDate.getFullYear() === day.dateObj.getFullYear()
      );
    }) : [];

    const dayData: any = {
      date: day.date,
    };

    operationModules.forEach(module => {
      if (!module.comingSoon) {
        const moduleResults = dayResults.filter(result => result.operationId === module.id);
        if (moduleResults.length > 0) {
          const avgScore = moduleResults.reduce((sum, result) => sum + (result.score / result.totalProblems), 0) / moduleResults.length;
          dayData[module.id] = Math.round(avgScore * 100);
        } else {
          dayData[module.id] = 0;
        }
      }
    });

    return dayData;
  });

  // Module comparison data
  const moduleComparisonData = operationModules
    .filter(module => !module.comingSoon)
    .map(module => {
      const progress = moduleProgress[module.id];
      return {
        name: module.displayName,
        completed: progress?.totalCompleted || 0,
        accuracy: progress?.averageScore ? Math.round(progress.averageScore * 100) : 0,
        color: getModuleColor(module.id)
      };
    });

  // Recent exercises list
  const recentExercises = [...exerciseHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getModuleName = (id: string) => {
    const module = operationModules.find(m => m.id === id);
    return module?.displayName || id;
  };

  return (
    <>
      <Helmet>
        <title>Your Progress - Math W+A+O+K</title>
        <meta name="description" content="Track your math learning progress and view your performance statistics." />
      </Helmet>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
            <p className="text-gray-600">Track your math learning journey</p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {format(lastUpdateTime, "MMM dd, yyyy HH:mm:ss")}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="flex items-center"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isClearing || exerciseHistory.length === 0}>
                  {isClearing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Clear All Progress"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your progress data and your rewards collection.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearProgress}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {exerciseHistory.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">No progress data yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Complete exercises to start tracking your progress
                </p>
                <Button className="mt-4" asChild>
                  <a href="/">Start an Exercise</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="detailed">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Progress</TabsTrigger>
              <TabsTrigger value="recent">Recent Exercises</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Progress</CardTitle>
                    <CardDescription>Your performance over the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={recentProgressData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis unit="%" domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, ""]} />
                          <Legend />
                          {operationModules
                            .filter(module => !module.comingSoon)
                            .map(module => (
                              <Line
                                key={module.id}
                                type="monotone"
                                dataKey={module.id}
                                name={module.displayName}
                                stroke={getModuleColor(module.id)}
                                activeDot={{ r: 8 }}
                              />
                            ))
                          }
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Module Comparison</CardTitle>
                    <CardDescription>Comparing your performance across modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={moduleComparisonData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis unit="%" domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, ""]} />
                          <Legend />
                          <Bar dataKey="accuracy" name="Accuracy" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {operationModules
                  .filter(module => !module.comingSoon)
                  .map(module => {
                    const progress = moduleProgress[module.id];
                    return (
                      <Card key={module.id} className="overflow-hidden transition-all">
                        <div 
                          className="flex justify-between items-center p-4 border-b border-gray-200 relative overflow-hidden"
                          style={{ 
                            backgroundColor: module.color || '#4287f5',
                            color: 'white'
                          }}
                        >
                          <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id={`grid-${module.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                                  <circle cx="2" cy="2" r="1" fill="white" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill={`url(#grid-${module.id})`} />
                            </svg>
                          </div>

                          <div className="flex items-center relative z-10">
                            <div className="flex items-center">
                              <div className="mr-3 bg-white/25 p-2 rounded-lg shadow-inner">
                                {module.icon === "Plus" && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                                {module.icon === "PieChart" && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
                                {module.icon === "Hash" && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
                                {!module.icon && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                              </div>
                              <h3 className="text-xl font-bold text-white">
                                {module.displayName}
                              </h3>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-5 bg-gradient-to-b from-white to-blue-50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Exercises Completed</p>
                                <p className="text-2xl font-bold">{progress?.totalCompleted || 0}</p>
                              </div>
                              <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Problems Solved</p>
                                <p className="text-2xl font-bold">
                                  {(() => {
                                    const problemsSolved = exerciseHistory
                                      .filter(ex => ex.operationId === module.id)
                                      .reduce((sum, ex) => sum + (ex.score || 0), 0);

                                    const totalProblems = exerciseHistory
                                      .filter(ex => ex.operationId === module.id)
                                      .reduce((sum, ex) => sum + (ex.totalProblems || 0), 0);

                                    return `${problemsSolved} de ${totalProblems}`;
                                  })()}
                                </p>
                              </div>
                              <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Average Score</p>
                                <p className="text-2xl font-bold">
                                  {progress?.averageScore 
                                    ? `${Math.min(100, Math.round(progress.averageScore * 100))}%` 
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Best Score</p>
                                <p className="text-2xl font-bold">
                                  {progress?.bestScore 
                                    ? `${Math.min(100, Math.round(progress.bestScore * 100))}%` 
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Average Time For Each Exercise Block Completed</p>
                                <p className="text-xl mt-2">
                                  <span className="font-bold">
                                    {progress?.averageTime 
                                      ? `${Math.round(progress.averageTime)}s` 
                                      : "N/A"}
                                  </span>
                                </p>
                              </div>
                              <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Total Time</p>
                                <p className="text-2xl font-bold">
                                  {(() => {
                                    const totalSeconds = exerciseHistory
                                      .filter(ex => ex.operationId === module.id)
                                      .reduce((sum, ex) => sum + (ex.timeSpent || 0), 0);

                                    if (totalSeconds < 3600) {
                                      const minutes = Math.floor(totalSeconds / 60);
                                      const seconds = totalSeconds % 60;
                                      return `${minutes}m ${seconds}s`;
                                    } 
                                    else {
                                      const hours = Math.floor(totalSeconds / 3600);
                                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                                      const seconds = totalSeconds % 60;
                                      return `${hours}h ${minutes}m ${seconds}s`;
                                    }
                                  })()}
                                </p>
                              </div>
                            </div>
                            <div className="bg-white shadow p-3 rounded-lg border border-gray-100 w-full mb-3">
                              <p className="text-sm text-gray-500">Average Time For Each Individual Exercise</p>
                              <p className="text-xl mt-2">
                                <span className="font-bold">
                                  {(() => {
                                    const moduleExercises = exerciseHistory.filter(ex => ex.operationId === module.id);
                                    const totalProblems = moduleExercises.reduce((sum, ex) => sum + (ex.totalProblems || 0), 0);
                                    const totalTime = moduleExercises.reduce((sum, ex) => sum + (ex.timeSpent || 0), 0);

                                    return totalProblems > 0 
                                      ? `${Math.round(totalTime / totalProblems)}s` 
                                      : "N/A";
                                  })()}
                                </span>
                              </p>
                            </div>
                            <Button variant="default" className="w-full bg-blue-500 hover:bg-blue-600" asChild>
                              <a href={`/operation/${module.id}`}>Practice Again</a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>

            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Exercise History</CardTitle>
                  <CardDescription>Your last 10 completed exercises</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Module</th>
                          <th className="text-left py-3 px-4">Difficulty</th>
                          <th className="text-left py-3 px-4">Score</th>
                          <th className="text-left py-3 px-4">Time</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentExercises.map((exercise: ExerciseResult, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">
                              {format(new Date(exercise.date || exercise.createdAt || new Date()), "MMMM dd, yyyy h:mm a")}
                            </td>
                            <td className="py-3 px-4">{getModuleName(exercise.operationId)}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyBadgeClass(exercise.difficulty || 'beginner')}`}>
                                {(exercise.difficulty || 'beginner').charAt(0).toUpperCase() + (exercise.difficulty || 'beginner').slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {exercise.score !== undefined && exercise.totalProblems ? 
                                `${exercise.score}/${exercise.totalProblems} (${Math.round((exercise.score / exercise.totalProblems) * 100)}%)` : 
                                "N/A"}
                            </td>
                            <td className="py-3 px-4">{exercise.timeSpent !== undefined ? `${exercise.timeSpent}s` : "N/A"}</td>
                            <td className="py-3 px-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedExercise(exercise)}
                                  >
                                    Ver detalles
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="text-center text-xl font-bold">
                                      {getModuleName(exercise.operationId)} Exercise Complete!
                                    </DialogTitle>
                                  </DialogHeader>

                                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                                    <p className="text-center text-sm text-gray-500">Total Time</p>
                                    <p className="text-center text-2xl font-bold">
                                      {exercise.timeSpent ? 
                                        exercise.timeSpent < 60 ? 
                                          `00:${exercise.timeSpent.toString().padStart(2, '0')}` : 
                                          `${Math.floor(exercise.timeSpent / 60).toString().padStart(2, '0')}:${(exercise.timeSpent % 60).toString().padStart(2, '0')}` 
                                        : '00:00'}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-blue-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Score</p>
                                      <p className="text-center text-lg font-bold text-blue-600">
                                        {exercise.score}/{exercise.totalProblems}
                                      </p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Accuracy</p>
                                      <p className="text-center text-lg font-bold text-green-600">
                                        {exercise.score && exercise.totalProblems ? 
                                          `${Math.round((exercise.score / exercise.totalProblems) * 100)}%` : 
                                          '0%'}
                                      </p>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Avg. Time</p>
                                      <p className="text-center text-lg font-bold text-purple-600">
                                        {exercise.timeSpent && exercise.totalProblems ? 
                                          `${Math.round(exercise.timeSpent / exercise.totalProblems)}s` : 
                                          'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="bg-yellow-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Avg. Attempts</p>
                                      <p className="text-center text-lg font-bold text-yellow-600">
                                        {exercise.avgAttempts ? exercise.avgAttempts.toFixed(1) : '1.0'}
                                      </p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Revealed</p>
                                      <p className="text-center text-lg font-bold text-red-600">
                                        {exercise.revealedAnswers || 0}
                                      </p>
                                    </div>
                                    <div className="bg-teal-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Final Level</p>
                                      <p className="text-center text-lg font-bold text-teal-600">
                                        {exercise.difficulty === 'beginner' ? 'Principiante' : 
                                         exercise.difficulty === 'intermediate' ? 'Intermedio' : 
                                         exercise.difficulty === 'advanced' ? 'Avanzado' : 'Principiante'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4">
                                    <h3 className="font-medium mb-2">Problem Review</h3>
                                    <div className="space-y-2">
                                      {(() => {
                                        let problemsToShow: any[] = []; // Inicializar como array vacío

                                        console.log(`DEBUG ID ${exercise.id}:`, exercise);

                                        if (!exercise) {
                                          console.log("No hay ejercicio seleccionado");
                                          problemsToShow = [{
                                            problem: "No hay ejercicio seleccionado",
                                            isCorrect: true,
                                            isPlaceholder: true
                                          }];
                                        } else {
                                          let extraDataContent = exercise.extra_data;

                                          if (typeof extraDataContent === 'string') {
                                            try {
                                              extraDataContent = JSON.parse(extraDataContent);
                                            } catch (error) {
                                              console.log("Error al parsear extra_data:", error);
                                              extraDataContent = {}; // Fallback a objeto vacío si el parseo falla
                                            }
                                          }

                                          if (extraDataContent && typeof extraDataContent === 'object') {
                                            // ---- INICIO SOLUCIÓN PROBLEMA 1 (LECTURA) ----
                                            // PRIORIDAD 1: 'problemDetails'
                                            if (extraDataContent.problemDetails && Array.isArray(extraDataContent.problemDetails) && extraDataContent.problemDetails.length > 0) {
                                              problemsToShow = extraDataContent.problemDetails;
                                              console.log("✅ PROBLEMAS ENCONTRADOS en extra_data.problemDetails (Prioridad 1):", problemsToShow);
                                            }
                                            // PRIORIDAD 2: 'problems'
                                            else if (extraDataContent.problems && Array.isArray(extraDataContent.problems) && extraDataContent.problems.length > 0) {
                                              problemsToShow = extraDataContent.problems;
                                              console.log("✅ PROBLEMAS ENCONTRADOS en extra_data.problems (Prioridad 2):", problemsToShow);
                                            }
                                            // ---- FIN SOLUCIÓN PROBLEMA 1 (LECTURA) ----

                                            // Mantener fallbacks existentes para compatibilidad con datos antiguos
                                            else if (extraDataContent.screenshot && 
                                                extraDataContent.screenshot.problemReview && 
                                                Array.isArray(extraDataContent.screenshot.problemReview) &&
                                                extraDataContent.screenshot.problemReview.length > 0 ) {
                                              problemsToShow = extraDataContent.screenshot.problemReview;
                                              console.log("✅ Encontrados problemas en extra_data.screenshot.problemReview (Fallback Legado)");
                                            }
                                            else {
                                              console.log("🔍 Búsqueda exhaustiva de problemas en otras estructuras (Fallback)...");
                                              const posiblesCamposFallback = [
                                                'mathProblems',
                                                'capturedProblems',
                                                'uiProblems', // Este no se guarda más desde Exercise.tsx
                                                'exactProblems', // Este no se guarda directamente en extra_data desde Exercise.tsx
                                                // 'problemas' (plural español) ya no se guarda.
                                              ];

                                              for (const campo of posiblesCamposFallback) {
                                                if (extraDataContent[campo] && Array.isArray(extraDataContent[campo]) && extraDataContent[campo].length > 0) {
                                                  problemsToShow = extraDataContent[campo];
                                                  console.log(`✅ PROBLEMAS ENCONTRADOS en extra_data.${campo} (Fallback PosiblesCampos):`, problemsToShow);
                                                  break; 
                                                }
                                              }

                                              // Búsqueda en localStorage como último recurso (manteniendo lógica original)
                                              if (problemsToShow.length === 0) {
                                                const timestamp = extraDataContent.timestamp || extraDataContent.captureTimestamp;
                                                if (timestamp) {
                                                  const posiblesClavesStorage = [
                                                    `backup_problemas_${timestamp}`,
                                                    `exercise_${timestamp}`,
                                                    `backup_${exercise.operationId}_${timestamp}`
                                                  ];
                                                  for (const clave of posiblesClavesStorage) {
                                                    const storedData = localStorage.getItem(clave);
                                                    if (storedData) {
                                                      try {
                                                        const parsedData = JSON.parse(storedData);
                                                        if (Array.isArray(parsedData) && parsedData.length > 0) {
                                                          problemsToShow = parsedData;
                                                          console.log(`✅ PROBLEMAS RECUPERADOS DE LOCALSTORAGE (${clave}) (Fallback Storage):`, problemsToShow);
                                                          break;
                                                        } else if (parsedData.problems && Array.isArray(parsedData.problems) && parsedData.problems.length > 0) {
                                                          problemsToShow = parsedData.problems;
                                                          console.log(`✅ PROBLEMAS RECUPERADOS DE LOCALSTORAGE (${clave}) (Fallback Storage, anidado):`, problemsToShow);
                                                          break;
                                                        }
                                                      } catch (e) { console.error(`Error parseando localStorage ${clave}:`, e); }
                                                    }
                                                  }
                                                }
                                              }
                                              // Búsqueda dinámica (manteniendo lógica original)
                                              if (problemsToShow.length === 0) {
                                                for (const key in extraDataContent) {
                                                    if (Array.isArray(extraDataContent[key]) && 
                                                        extraDataContent[key].length > 0 &&
                                                        typeof extraDataContent[key][0] === 'object') {
                                                      const firstItem = extraDataContent[key][0];
                                                      if ((firstItem.problem || firstItem.problema) && 
                                                          (typeof firstItem.isCorrect === 'boolean' || typeof firstItem.esCorrecta === 'boolean')) {
                                                        problemsToShow = extraDataContent[key];
                                                        console.log(`✅ Encontrados problemas por búsqueda dinámica en campo: ${key} (Fallback Dinámico)`);
                                                        break;
                                                      }
                                                    }
                                                  }
                                              }
                                            }
                                          }
                                        }

                                        if (problemsToShow.length === 0) {
                                          console.log("⚠️ No se encontraron problemas en ninguna estructura conocida. Mostrando placeholder.");
                                          problemsToShow = [{
                                            problem: `Ejercicio de ${getModuleName(exercise.operationId)} completado con puntuación ${exercise.score}/${exercise.totalProblems}`,
                                            isCorrect: true,
                                            isPlaceholder: true
                                          }];
                                        }

                                        const standardizedProblems: MathProblem[] = [];
                                        const placeholders: React.ReactNode[] = [];

                                        problemsToShow.forEach((problemItem, idx) => {
                                          if (problemItem.isPlaceholder) {
                                            placeholders.push(
                                              <div key={`placeholder-${idx}`} className="bg-gray-50 p-3 rounded-md">
                                                <p className="text-center text-gray-500 italic">
                                                  {typeof problemItem.problem === 'string' ? problemItem.problem : `Problema ${idx + 1}`}
                                                </p>
                                                <p className="text-xs text-center text-gray-400 mt-1">
                                                  Los detalles completos no se guardaron para este ejercicio anterior
                                                </p>
                                              </div>
                                            );
                                            return;
                                          }

                                          const isCorrect = 
                                            typeof problemItem.isCorrect === 'boolean' ? problemItem.isCorrect :
                                            typeof problemItem.esCorrecta === 'boolean' ? problemItem.esCorrecta :
                                            problemItem.status === 'correct';

                                          let problemText = '';
                                          if (typeof problemItem.problem === 'string') problemText = problemItem.problem;
                                          else if (typeof problemItem.problema === 'string') problemText = problemItem.problema;
                                          else if (problemItem.problem && problemItem.problem.operands) problemText = problemItem.problem.operands.join(' + ') + ' = ' + problemItem.problem.correctAnswer;
                                          else if (problemItem.text) problemText = problemItem.text;
                                          else if (problemItem.texto) problemText = problemItem.texto;
                                          else problemText = `Problema ${idx + 1}`;

                                          const infoItems = [];
                                          const level = problemItem.level || problemItem.nivel;
                                          if (level) infoItems.push(`Nivel: ${level}`);
                                          const attempts = problemItem.attempts || problemItem.intentos;
                                          if (attempts) infoItems.push(`Intentos: ${attempts}`);
                                          const time = problemItem.timeSpent || problemItem.tiempo;
                                          if (time) infoItems.push(`Tiempo: ${time}s`);
                                          const infoText = problemItem.info || problemItem.infoTexto || infoItems.join(', ');

                                          standardizedProblems.push({
                                            problemNumber: idx + 1,
                                            problem: problemText,
                                            isCorrect: isCorrect,
                                            info: infoText || undefined,
                                            attempts: problemItem.attempts,
                                            timeSpent: problemItem.timeSpent,
                                            level: problemItem.level,
                                            userAnswer: problemItem.userAnswer
                                          });
                                        });

                                        return (
                                          <>
                                            {standardizedProblems.length > 0 && (
                                              <ProblemRenderer 
                                                problems={standardizedProblems} 
                                                showProblemNumbers={true}
                                                showInfoDetails={true}
                                              />
                                            )}
                                            {placeholders.length > 0 && (
                                              <div className="space-y-2 mt-2">
                                                {placeholders}
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
