import { useState, useEffect, useRef } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { generateAdditionProblem, checkAnswer } from "./utils";
import { Problem, UserAnswer } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations";
import { createLevelManager, DifficultyLevel, CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import LevelUpHandler from "@/components/LevelUpHandler";
import { useRewardsStore, awardReward, getRewardProbability, checkAndAwardRewards, RewardTheme } from '@/lib/rewards-system';
import RewardAnimation from '@/components/rewards/RewardAnimation';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timer, setTimer] = useState(0);
  const [problemTimer, setProblemTimer] = useState(0); // Temporizador para el problema actual
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue" | null>(null);
  const [showHelpButton, setShowHelpButton] = useState(false); // Control si mostramos el botón de ayuda
  const [showingExplanation, setShowingExplanation] = useState(false);
  // Ya no necesitamos estos contadores porque agregamos problemas inmediatamente
  // const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0); // Contador para respuestas incorrectas
  // const [revealedAnswersCount, setRevealedAnswersCount] = useState(0); // Contador para respuestas reveladas
  // Cargar la dificultad adaptativa al iniciar, basado en la configuración o localStorage
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<"beginner" | "elementary" | "intermediate" | "advanced" | "expert">(() => {
    // Intentar cargar desde localStorage primero
    try {
      const storedSettings = localStorage.getItem('moduleSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (parsedSettings.addition && parsedSettings.addition.difficulty) {
          console.log('[ADAPTIVE DIFFICULTY] Cargando dificultad desde localStorage:', parsedSettings.addition.difficulty);
          return parsedSettings.addition.difficulty;
        }
      }
    } catch (error) {
      console.error('[ADAPTIVE DIFFICULTY] Error al cargar dificultad desde localStorage:', error);
    }
    
    // Si no hay datos en localStorage, usar la configuración actual
    return settings.difficulty;
  });
  const [currentAttempts, setCurrentAttempts] = useState(0); // Contador para intentos en el problema actual
  const [showReward, setShowReward] = useState(false); // Estado para mostrar la recompensa
  const [showLevelUpReward, setShowLevelUpReward] = useState(false); // Recompensa especial para subida de nivel
  // Inicializar contadores con valores almacenados en localStorage si existen
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(() => {
    try {
      const stored = localStorage.getItem('addition_consecutiveCorrectAnswers');
      if (stored) {
        const value = parseInt(stored, 10);
        console.log('[ADAPTIVE DIFFICULTY] Recuperando contador de respuestas correctas consecutivas:', value);
        return value;
      }
    } catch (error) {
      console.error('[ADAPTIVE DIFFICULTY] Error al recuperar contador de respuestas correctas:', error);
    }
    return 0;
  });
  
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(() => {
    try {
      const stored = localStorage.getItem('addition_consecutiveIncorrectAnswers');
      if (stored) {
        const value = parseInt(stored, 10);
        console.log('[ADAPTIVE DIFFICULTY] Recuperando contador de respuestas incorrectas consecutivas:', value);
        return value;
      }
    } catch (error) {
      console.error('[ADAPTIVE DIFFICULTY] Error al recuperar contador de respuestas incorrectas:', error);
    }
    return 0;
  });
  const [rewardType, setRewardType] = useState<"medals" | "trophies" | "stars">("stars"); // Tipo de recompensa a mostrar
  const [rewardsShownIndices, setRewardsShownIndices] = useState<number[]>([]); // Índices donde se han mostrado recompensas
  const [totalRewardsShown, setTotalRewardsShown] = useState(0); // Contador total de recompensas mostradas
  const [waitingForContinue, setWaitingForContinue] = useState(false); // Estado para saber si estamos esperando que el usuario presione "Continuar"
  const [blockAutoAdvance, setBlockAutoAdvance] = useState(false); // Estado para bloquear el avance automático después de subir de nivel
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const problemTimerRef = useRef<number | null>(null); // Referencia para el temporizador del problema
  const { saveExerciseResult } = useProgress();
  const { updateModuleSettings } = useSettings();
  const { t } = useTranslations();
  const { setShowRewardAnimation } = useRewardsStore();

  // Generate problems when settings change or initially
  useEffect(() => {
    generateProblems();
  }, [settings]);

  // Timer logic for overall exercise
  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted) {
      timerRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [exerciseStarted, exerciseCompleted]);
  
  // Escuchar el evento de cierre del modal de nivel superado
  useEffect(() => {
    const handleLevelUpModalClosed = (event: CustomEvent) => {
      if (event.detail && event.detail.stayOnCurrentProblem) {
        console.log('[EXERCISE] Recibido evento de levelUpModalClosed - manteniendo el problema actual');
        // Esto no avanza al siguiente problema, pero habilita la interfaz de usuario para
        // que el usuario pueda continuar con el problema actual
        setWaitingForContinue(false);
        setFeedbackMessage("Ahora estás en un nuevo nivel de dificultad. Completa este problema para continuar.");
        setFeedbackColor("blue");
      }
    };
    
    // Añadir el event listener
    document.addEventListener('levelUpModalClosed', handleLevelUpModalClosed as EventListener);
    
    // Limpiar al desmontar
    return () => {
      document.removeEventListener('levelUpModalClosed', handleLevelUpModalClosed as EventListener);
    };
  }, []);
  
  // Timer logic for problem time limit
  useEffect(() => {
    // Solo iniciamos el temporizador si hay un límite de tiempo configurado (timeValue > 0)
    if (exerciseStarted && !exerciseCompleted && settings.timeValue > 0) {
      // Limpiamos el temporizador anterior si existe
      if (problemTimerRef.current) {
        clearInterval(problemTimerRef.current);
      }
      
      // Iniciamos un nuevo temporizador para el problema actual
      setProblemTimer(settings.timeValue); // Reiniciamos el temporizador con el valor configurado
      
      problemTimerRef.current = window.setInterval(() => {
        setProblemTimer(prev => {
          // Si el temporizador llega a cero, contamos como un intento usado
          if (prev <= 1) {
            // Limpiamos este intervalo
            if (problemTimerRef.current) {
              clearInterval(problemTimerRef.current);
            }
            
            // Incrementamos el contador de intentos
            setCurrentAttempts(attempts => {
              const newAttempts = attempts + 1;
              
              // Si hemos alcanzado el máximo de intentos, mostramos la respuesta y avanzamos
              if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
                const currentProblem = problems[currentProblemIndex];
                const correctAnswer = currentProblem.num1 + currentProblem.num2;
                
                // Mostrar mensaje de tiempo agotado
                setFeedbackMessage(`¡Tiempo agotado! ${t('exercises.correctAnswerIs')} ${correctAnswer}`);
                setFeedbackColor("red");
                
                // Guardar la respuesta como incorrecta
                const answer: UserAnswer = {
                  problem: currentProblem,
                  userAnswer: parseInt(userAnswer) || 0,
                  isCorrect: false
                };
                
                setAnswers(prev => [...prev, answer]);
                
                // Si está habilitada la compensación, añadimos un problema adicional inmediatamente
                if (settings.enableCompensation) {
                  // Añadir un problema adicional de compensación
                  const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
                  const compensationProblem = generateAdditionProblem(difficultyToUse);
                  
                  // Añadimos el problema a la lista actual
                  const updatedProblems = [...problems];
                  // Insertar el problema después del problema actual
                  updatedProblems.splice(currentProblemIndex + 1, 0, compensationProblem);
                  
                  console.log("[COMPENSATION] Añadiendo problema de compensación después del índice:", currentProblemIndex);
                  console.log("[COMPENSATION] Total de problemas ahora:", updatedProblems.length);
                  
                  // Actualizamos la lista de problemas
                  setProblems(updatedProblems);
                }
                
                // Mostrar la respuesta correcta y esperar a que el usuario presione continuar
                // No avanzamos automáticamente, el usuario debe presionar el botón "Continuar"
                setFeedbackMessage(`¡Tiempo agotado! ${t('exercises.correctAnswerIs')} ${correctAnswer}. Presiona Continuar para seguir.`);
                setFeedbackColor("red");
                
                // Activamos el estado de espera para el botón "Continuar"
                setWaitingForContinue(true);
                
                // Limpiamos cualquier temporizador activo
                if (problemTimerRef.current) {
                  clearInterval(problemTimerRef.current);
                  problemTimerRef.current = null;
                }
              } else {
                // Si aún no hemos agotado todos los intentos, reiniciamos el temporizador
                setTimeout(() => {
                  setFeedbackMessage("¡Tiempo agotado! Intenta de nuevo.");
                  setFeedbackColor("red");
                  
                  // Iniciamos un nuevo temporizador
                  setProblemTimer(settings.timeValue);
                  problemTimerRef.current = window.setInterval(() => {
                    setProblemTimer(p => {
                      // Si el temporizador llega a cero, contamos como un intento usado
                      if (p <= 1) {
                        // Limpiamos este intervalo
                        if (problemTimerRef.current) {
                          clearInterval(problemTimerRef.current);
                          problemTimerRef.current = null; // Importante establecer a null para evitar doble limpieza
                        }
                        
                        // Incrementamos el contador de intentos de nuevo
                        setCurrentAttempts(attempts => {
                          const newAttempts = attempts + 1;
                          console.log("Incrementando intentos a:", newAttempts);
                          
                          // Si hemos alcanzado el máximo de intentos, mostramos la respuesta y avanzamos
                          if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
                            handleMaxAttemptsReached();
                          } else {
                            // Todavía tenemos intentos, reiniciamos el temporizador otra vez
                            setTimeout(() => {
                              setFeedbackMessage("¡Tiempo agotado! Intenta de nuevo.");
                              setFeedbackColor("red");
                              
                              // Iniciamos un nuevo temporizador correctamente recursivo
                              setProblemTimer(settings.timeValue);
                              const newTimer = window.setInterval(() => {
                                setProblemTimer(p => {
                                  if (p <= 1) {
                                    // Si llega a cero de nuevo
                                    if (newTimer) {
                                      clearInterval(newTimer);
                                    }
                                    
                                    // Incrementamos intentos una vez más
                                    setCurrentAttempts(previousAttempts => {
                                      const nextAttempts = previousAttempts + 1;
                                      console.log("Incrementando intentos a:", nextAttempts);
                                      
                                      // Verificamos máximo de intentos
                                      if (settings.maxAttempts > 0 && nextAttempts >= settings.maxAttempts) {
                                        // Si alcanzó el máximo, mostrar respuesta
                                        handleMaxAttemptsReached();
                                      } else {
                                        // Aún hay intentos disponibles, reiniciar timer
                                        setupNewTimer(nextAttempts);
                                      }
                                      
                                      return nextAttempts;
                                    });
                                    
                                    return 0;
                                  }
                                  return p - 1; // Decrementar temporizador
                                });
                              }, 1000);
                              
                              // Guardamos la referencia del nuevo temporizador
                              problemTimerRef.current = newTimer;
                              
                              // Limpiar el mensaje después de un momento
                              setTimeout(() => {
                                setFeedbackMessage(null);
                                setFeedbackColor(null);
                              }, 1500);
                            }, 500);
                          }
                          
                          return newAttempts;
                        });
                        
                        return 0;
                      }
                      return p - 1; // Decrementar el temporizador
                    });
                  }, 1000);
                  
                  // Limpiar el mensaje después de un momento
                  setTimeout(() => {
                    setFeedbackMessage(null);
                    setFeedbackColor(null);
                  }, 1500);
                }, 500);
              }
              
              return newAttempts;
            });
            
            return 0;
          }
          return prev - 1; // Decrementar el temporizador
        });
      }, 1000);
    }
    
    return () => {
      if (problemTimerRef.current) {
        clearInterval(problemTimerRef.current);
      }
    };
  }, [exerciseStarted, exerciseCompleted, currentProblemIndex, settings.timeValue, settings.maxAttempts]);

  // Focus input when current problem changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentProblemIndex]);
  
  // Guardar contadores en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('addition_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString());
    console.log('[ADAPTIVE DIFFICULTY] Guardando contador de respuestas correctas consecutivas:', consecutiveCorrectAnswers);
  }, [consecutiveCorrectAnswers]);
  
  useEffect(() => {
    localStorage.setItem('addition_consecutiveIncorrectAnswers', consecutiveIncorrectAnswers.toString());
    console.log('[ADAPTIVE DIFFICULTY] Guardando contador de respuestas incorrectas consecutivas:', consecutiveIncorrectAnswers);
  }, [consecutiveIncorrectAnswers]);

  // Sincronizar la dificultad de localStorage
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('moduleSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (parsedSettings.addition && parsedSettings.addition.difficulty && 
            parsedSettings.addition.difficulty !== adaptiveDifficulty) {
          console.log(`[EXERCISE] Sincronizando dificultad desde localStorage: ${parsedSettings.addition.difficulty}`);
          setAdaptiveDifficulty(parsedSettings.addition.difficulty);
        }
      }
    } catch (error) {
      console.error('[EXERCISE] Error al sincronizar con localStorage:', error);
    }
  }, [settings]);

  const generateProblems = () => {
    const newProblems: Problem[] = [];
    
    // Elegir la dificultad correcta - si la dificultad adaptativa está habilitada, usamos esa
    const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
    console.log(`[GENERATE PROBLEMS] Generando ${settings.problemCount} problemas con dificultad: ${difficultyToUse}`);
    console.log(`[GENERATE PROBLEMS] Dificultad adaptativa: ${settings.enableAdaptiveDifficulty ? "ACTIVADA" : "DESACTIVADA"}`);
    
    for (let i = 0; i < settings.problemCount; i++) {
      newProblems.push(generateAdditionProblem(difficultyToUse));
    }
    
    setProblems(newProblems);
    setCurrentProblemIndex(0);
    setUserAnswer("");
    setAnswers([]);
    setTimer(0);
    setProblemTimer(settings.timeValue); // Inicializar el temporizador del problema con el valor configurado
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setFeedbackMessage(null);
    setFeedbackColor(null);
    setShowingExplanation(false);
    setShowHelpButton(false); // Reiniciamos el estado del botón de ayuda
    
    // Reiniciamos la dificultad adaptativa solo si estamos empezando un nuevo ejercicio
    // No lo reiniciamos cuando usamos "Try Again" para conservar el nivel adaptado
    if (!settings.enableAdaptiveDifficulty) {
      setAdaptiveDifficulty(settings.difficulty);
    } else {
      console.log(`[ADAPTIVE DIFFICULTY] Manteniendo nivel actual: ${adaptiveDifficulty}`);
    }
    
    setCurrentAttempts(0); // Reiniciamos el contador de intentos actuales
    
    // NUNCA reiniciamos los contadores consecutivos de respuestas correctas/incorrectas
    // Esto permite que el sistema siempre detecte cuando se alcanzan 10 respuestas correctas consecutivas
    // incluso cuando la dificultad adaptativa está desactivada
    console.log(`[ADAPTIVE DIFFICULTY] Manteniendo contadores para conservar progreso: Correctas=${consecutiveCorrectAnswers}, Incorrectas=${consecutiveIncorrectAnswers}`);
    
    // NUEVA LÓGICA: SIEMPRE verificamos las 10 respuestas correctas consecutivas
    // independientemente de si la dificultad adaptativa está activada o no
    if (consecutiveCorrectAnswers >= 10) {
      // Determinar qué nivel de dificultad usar como base para la promoción
      // Si la dificultad adaptativa está habilitada, usamos el nivel adaptativo actual
      // De lo contrario, usamos el nivel configurado por el usuario
      const currentDifficultyLevel = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
      
      console.log(`[ADAPTIVE DIFFICULTY] ✓✓✓ ¡Se detectaron ${consecutiveCorrectAnswers} respuestas correctas acumuladas! Incrementando nivel...`);
      
      // Lista de dificultades disponibles
      const difficulties: string[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
      const currentIndex = difficulties.indexOf(currentDifficultyLevel);
      console.log(`[ADAPTIVE DIFFICULTY] Nivel actual: ${currentDifficultyLevel} (index: ${currentIndex}, de total: ${difficulties.length - 1})`);
      
      // Verificar si podemos subir de nivel (no estamos en el máximo)
      if (currentIndex < difficulties.length - 1) {
        const newDifficulty = difficulties[currentIndex + 1] as "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
        console.log(`[ADAPTIVE DIFFICULTY] ¡SUBIENDO DE NIVEL! De ${currentDifficultyLevel} a ${newDifficulty}`);
        
        // Actualizar tanto la dificultad adaptativa como la dificultad normal
        setAdaptiveDifficulty(newDifficulty);
        
        // También actualizamos la configuración local para que el cambio persista
        // incluso si el usuario recarga la página
        const updatedSettings = { ...settings, difficulty: newDifficulty };
        updateModuleSettings("addition", { difficulty: newDifficulty });
        
        // Guardar en localStorage como respaldo adicional
        try {
          localStorage.setItem('addition_currentDifficulty', newDifficulty);
          
          // También actualizar el objeto de configuración completo en localStorage
          const currentModuleSettings = localStorage.getItem('moduleSettings');
          if (currentModuleSettings) {
            const settingsObj = JSON.parse(currentModuleSettings);
            if (settingsObj.addition) {
              settingsObj.addition.difficulty = newDifficulty;
            } else {
              settingsObj.addition = { ...settingsObj.addition || {}, difficulty: newDifficulty };
            }
            localStorage.setItem('moduleSettings', JSON.stringify(settingsObj));
          }
          console.log(`[ADAPTIVE DIFFICULTY] Guardada nueva dificultad en localStorage: ${newDifficulty}`);
        } catch (error) {
          console.error("[ADAPTIVE DIFFICULTY] Error al guardar en localStorage:", error);
        }
        
        // Reiniciar contador de respuestas correctas consecutivas después de subir de nivel
        setConsecutiveCorrectAnswers(0);
        localStorage.setItem('addition_consecutiveCorrectAnswers', '0');
        
        // Activar la dificultad adaptativa si no estaba activada
        if (!settings.enableAdaptiveDifficulty) {
          console.log(`[ADAPTIVE DIFFICULTY] Activando la dificultad adaptativa automáticamente`);
          updateModuleSettings("addition", { enableAdaptiveDifficulty: true });
        }
        
        // Mostrar animación de subida de nivel
        setShowLevelUpReward(true);
        
        // Mostrar mensaje explicativo
        setFeedbackMessage(`¡Felicidades! Has dominado este nivel y has subido a ${newDifficulty}`);
        setFeedbackColor("green");
      } else {
        console.log(`[ADAPTIVE DIFFICULTY] Ya estás en el nivel más alto (${currentDifficultyLevel}). ¡Felicidades!`);
      }
    }
    setRewardsShownIndices([]); // Reiniciamos el registro de índices donde se mostraron recompensas
    setTotalRewardsShown(0); // Reiniciamos el contador total de recompensas mostradas
    setWaitingForContinue(false); // Aseguramos que no estamos esperando que el usuario presione "Continuar"
    setShowLevelUpReward(false); // Reiniciamos el estado de recompensa por subir de nivel
  };
  
  const showAnswerWithExplanation = () => {
    if (!exerciseStarted) {
      startExercise();
    }
    
    // Siempre permitimos mostrar la respuesta cuando showAnswerWithExplanation está activado
    setShowingExplanation(true);
    const currentProblem = problems[currentProblemIndex];
    const correctAnswer = currentProblem.num1 + currentProblem.num2;
    
    setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${correctAnswer}`);
    setFeedbackColor("green");

    // Si está habilitada la compensación, añadimos un problema adicional inmediatamente
    if (settings.enableCompensation) {
      // Añadir un problema adicional de compensación
      const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
      const compensationProblem = generateAdditionProblem(difficultyToUse);
      
      // Añadimos el problema a la lista actual
      const updatedProblems = [...problems];
      // Insertar el problema después del problema actual
      updatedProblems.splice(currentProblemIndex + 1, 0, compensationProblem);
      
      console.log("[COMPENSATION] Añadiendo problema de compensación después del índice:", currentProblemIndex);
      console.log("[COMPENSATION] Total de problemas ahora:", updatedProblems.length);
      
      // Actualizamos la lista de problemas
      setProblems(updatedProblems);
    }
    
    // Si hay un temporizador activo, lo detenemos
    if (problemTimerRef.current) {
      clearInterval(problemTimerRef.current);
      problemTimerRef.current = null;
    }
    
    // Guardar la respuesta como incorrecta
    const answer: UserAnswer = {
      problem: currentProblem,
      userAnswer: -1, // Usamos -1 para indicar que se reveló la respuesta
      isCorrect: false
    };
    
    setAnswers(prev => [...prev, answer]);
    
    // Mostrar la respuesta correcta y esperar a que el usuario presione continuar
    // No avanzamos automáticamente, el usuario debe presionar el botón "Continuar"
    setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${correctAnswer}. Presiona Continuar para seguir.`);
    setFeedbackColor("green");
    
    // Activamos el estado de espera para el botón "Continuar"
    setWaitingForContinue(true);
  };

  // Función auxiliar para configurar un nuevo temporizador
  const setupNewTimer = (currentAttemptsCount: number) => {
    // Mostramos mensaje de tiempo agotado nuevamente
    setTimeout(() => {
      setFeedbackMessage("¡Tiempo agotado! Intenta de nuevo.");
      setFeedbackColor("red");
      
      // Reiniciamos el temporizador con el valor configurado
      setProblemTimer(settings.timeValue);
      
      // Creamos un nuevo temporizador
      const timerInstance = window.setInterval(() => {
        setProblemTimer(p => {
          if (p <= 1) {
            // Si llega a cero de nuevo
            if (timerInstance) {
              clearInterval(timerInstance);
            }
            
            // Incrementamos intentos una vez más
            setCurrentAttempts(previousAttempts => {
              const nextAttemptsCount = previousAttempts + 1;
              console.log("Incrementando intentos a:", nextAttemptsCount);
              
              // Verificamos máximo de intentos
              if (settings.maxAttempts > 0 && nextAttemptsCount >= settings.maxAttempts) {
                handleMaxAttemptsReached();
              } else {
                // Todavía hay intentos disponibles
                setupNewTimer(nextAttemptsCount);
              }
              
              return nextAttemptsCount;
            });
            
            return 0;
          }
          return p - 1; // Decrementar temporizador
        });
      }, 1000);
      
      // Guardamos la referencia
      problemTimerRef.current = timerInstance;
      
      // Limpiar mensaje después de un momento
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackColor(null);
      }, 1500);
    }, 500);
  };

  // Función para manejar cuando se alcanzan los intentos máximos
  const handleMaxAttemptsReached = () => {
    const currentProblem = problems[currentProblemIndex];
    const correctAnswer = currentProblem.num1 + currentProblem.num2;
    
    // Mostrar mensaje de tiempo agotado
    setFeedbackMessage(`¡Tiempo agotado! ${t('exercises.correctAnswerIs')} ${correctAnswer}`);
    setFeedbackColor("red");
    
    // Guardar la respuesta como incorrecta
    const answer: UserAnswer = {
      problem: currentProblem,
      userAnswer: parseInt(userAnswer) || 0,
      isCorrect: false
    };
    
    setAnswers(prev => [...prev, answer]);
    
    // Si está habilitada la compensación, añadimos un problema adicional inmediatamente
    if (settings.enableCompensation) {
      // Añadir un problema adicional de compensación
      const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
      const compensationProblem = generateAdditionProblem(difficultyToUse);
      
      // Añadimos el problema a la lista actual
      const updatedProblems = [...problems];
      // Insertar el problema después del problema actual
      updatedProblems.splice(currentProblemIndex + 1, 0, compensationProblem);
      
      console.log("[COMPENSATION] Añadiendo problema de compensación después del índice:", currentProblemIndex);
      console.log("[COMPENSATION] Total de problemas ahora:", updatedProblems.length);
      
      // Actualizamos la lista de problemas
      setProblems(updatedProblems);
    }
    
    // Mostrar la respuesta correcta y esperar a que el usuario presione continuar
    // No avanzamos automáticamente, el usuario debe presionar el botón "Continuar"
    setShowHelpButton(false); // Ocultamos el botón de ayuda
    setFeedbackMessage(`¡Tiempo agotado! ${t('exercises.correctAnswerIs')} ${correctAnswer}. Presiona Continuar para seguir.`);
    setFeedbackColor("red");
    
    // Activamos el estado de espera para el botón "Continuar"
    setWaitingForContinue(true);
    
    // Limpiamos cualquier temporizador activo
    if (problemTimerRef.current) {
      clearInterval(problemTimerRef.current);
      problemTimerRef.current = null;
    }
  };
  
  // Función para continuar al siguiente problema cuando el usuario presiona "Continuar"
  const handleContinue = () => {
    // Si estamos mostrando el mensaje de nivel superado, no hacemos nada
    // ya que ese modal tiene su propio botón para continuar
    if (showLevelUpReward) {
      return;
    }
    
    // Reseteamos el estado de espera
    setWaitingForContinue(false);
    
    // Limpiamos el mensaje de feedback
    setFeedbackMessage(null);
    setFeedbackColor(null);
    
    // Avanzamos al siguiente problema
    moveToNextProblem();
    
    // Resetear el contador de intentos para el nuevo problema
    setCurrentAttempts(0);
  };

  const startExercise = () => {
    setExerciseStarted(true);
    // Una vez que empieza el ejercicio, mostrar el botón de ayuda si está configurado
    if (settings.showAnswerWithExplanation) {
      setShowHelpButton(true);
    }
    
    // Inicializar el temporizador del problema si está configurado
    if (settings.timeValue > 0) {
      setProblemTimer(settings.timeValue);
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Si estamos en modo de visualización o esperando "Continuar", no permitir cambios
    if (waitingForContinue || showingExplanation) {
      return;
    }
    
    // Solo permitir dígitos para que coincida con el patrón establecido
    const value = e.target.value.replace(/\D/g, '');
    setUserAnswer(value);
  };

  const handleKeyboardInput = (value: string) => {
    // Si estamos en modo de visualización o esperando que el usuario presione "Continuar"
    // no permitimos modificar la respuesta
    if (waitingForContinue || showingExplanation) {
      return;
    }
    
    if (value === "backspace") {
      setUserAnswer(prev => prev.slice(0, -1));
    } else {
      // Limit input to 3 digits which should be enough for math problems at this level
      if (userAnswer.length < 3) {
        setUserAnswer(prev => prev + value);
      }
    }
  };

  const checkCurrentAnswer = () => {
    if (!exerciseStarted) {
      startExercise();
      return;
    }
    
    // Incrementar el contador de intentos
    const newAttemptCount = currentAttempts + 1;
    setCurrentAttempts(newAttemptCount);
    
    const currentProblem = problems[currentProblemIndex];
    const isCorrect = checkAnswer(currentProblem, parseInt(userAnswer) || 0);
    
    // Si la respuesta es correcta, guardamos la respuesta y avanzamos al siguiente problema
    if (isCorrect) {
      // Save the answer
      const answer: UserAnswer = {
        problem: currentProblem,
        userAnswer: parseInt(userAnswer) || 0,
        isCorrect: true
      };
      
      setAnswers(prev => [...prev, answer]);
      
      // NUEVA LÓGICA: SIEMPRE incrementamos el contador de respuestas correctas
      // independientemente de si la dificultad adaptativa está habilitada o no
      const newConsecutiveCorrectAnswers = consecutiveCorrectAnswers + 1;
      
      // Incrementar contador de respuestas correctas
      setConsecutiveCorrectAnswers(newConsecutiveCorrectAnswers);
      
      // Resetear el contador de respuestas incorrectas consecutivas
      setConsecutiveIncorrectAnswers(0);
      
      // Incrementar el contador de respuestas correctas
      const newCorrectCount = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newCorrectCount);
      
      // Guardar el contador en localStorage
      localStorage.setItem('addition_consecutiveCorrectAnswers', newCorrectCount.toString());
      
      // Verificar si hemos alcanzado exactamente 10 respuestas correctas consecutivas
      if (newCorrectCount === CORRECT_ANSWERS_FOR_LEVEL_UP) {
        // Determinar qué nivel de dificultad se está usando actualmente
        const currentDifficultyLevel = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
        
        // Lista de dificultades disponibles
        const difficulties: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
        const currentIndex = difficulties.indexOf(currentDifficultyLevel as DifficultyLevel);
        
        // Verificar si podemos subir de nivel (no estamos en el máximo)
        if (currentIndex < difficulties.length - 1) {
          // Obtener el siguiente nivel
          const previousLevel = currentDifficultyLevel;
          const newDifficulty = difficulties[currentIndex + 1];
          
          console.log(`[EXERCISE] ¡Nivel superado! De ${previousLevel} a ${newDifficulty}`);
          
          // Actualizar la UI para mostrar el nuevo nivel
          setAdaptiveDifficulty(newDifficulty);
          
          // Actualizar la configuración del módulo
          try {
            updateModuleSettings("addition", {
              difficulty: newDifficulty,
              enableAdaptiveDifficulty: true
            });
          } catch (error) {
            console.error("[EXERCISE] Error al guardar configuración:", error);
          }
          
          // Guardar en localStorage como respaldo
          localStorage.setItem('addition_currentDifficulty', newDifficulty);
          localStorage.setItem('addition_enableAdaptiveDifficulty', 'true');
          
          // Reiniciar el contador
          setConsecutiveCorrectAnswers(0);
          localStorage.setItem('addition_consecutiveCorrectAnswers', '0');
          
          // EMITIR EVENTO DE NIVEL SUPERADO a través del bus de eventos
          // Esto activará el modal sin tener referencia directa a él
          eventBus.emit('levelUp', {
            previousLevel: previousLevel,
            newLevel: newDifficulty,
            consecutiveCorrectAnswers: CORRECT_ANSWERS_FOR_LEVEL_UP
          });
        }
      }
      
      // Mensaje estándar de respuesta correcta en todos los casos
      setFeedbackMessage(t('exercises.correct'));
      setFeedbackColor("green");
      
      // Solo en este punto si no entró en ninguna condición anterior
      
      // Decidir si mostrar recompensa basado en diferentes criterios
      if (settings.enableRewards) {
        // NUEVO SISTEMA DE RECOMPENSAS INTEGRADO
        // - Sistema escalonado con diferentes niveles de recompensas
        // - Colecciones temáticas que el usuario puede completar
        // - Recompensas estratégicas basadas en contexto y progreso
        
        // Información sobre el problema actual
        const isEarlyProblem = currentProblemIndex < Math.ceil(problems.length * 0.2);
        const isMidPointProblem = Math.abs(currentProblemIndex - Math.floor(problems.length / 2)) <= 1;
        const isLateProblem = currentProblemIndex >= Math.floor(problems.length * 0.9);
        const isFinalProblem = currentProblemIndex === problems.length - 1;
        
        // Contexto para determinar probabilidad de recompensa
        const rewardContext = {
          isFirstProblem: currentProblemIndex === 0,
          isLastProblem: isFinalProblem,
          isMidPoint: isMidPointProblem,
          problemIndex: currentProblemIndex,
          totalProblems: problems.length,
          streak: consecutiveCorrectAnswers,
          correctAnswers: answers.filter(a => a.isCorrect).length,
          incorrectAnswers: answers.filter(a => !a.isCorrect).length,
          difficulty: settings.difficulty,
          previousRewardShown: rewardsShownIndices.length > 0 ? rewardsShownIndices[rewardsShownIndices.length - 1] : -1
        };
        
        // Obtener probabilidad de recompensa basada en el contexto
        const rewardProbability = getRewardProbability(rewardContext);
        
        // Máximo de recompensas permitidas (más restrictivo que antes)
        const maxRewardsPerSession = Math.max(2, Math.ceil(problems.length * 0.15));
        
        // Determinar si mostrar una recompensa
        let shouldShowReward = Math.random() < rewardProbability && 
                              (totalRewardsShown < maxRewardsPerSession || isFinalProblem);
        
        // Si corresponde otorgar una recompensa, verificamos qué tipo otorgar según el contexto
        if (shouldShowReward) {
          console.log('[REWARDS] Otorgando recompensa basada en el contexto del ejercicio');
          
          // Verificar y otorgar recompensas de hito o racha
          if (consecutiveCorrectAnswers >= 10) {
            // Racha de 10 - recompensa "streak-10"
            awardReward('streak-10', { theme: 'addition', module: 'addition' });
            console.log('[REWARDS] Otorgada recompensa streak-10 por 10 respuestas correctas consecutivas');
          } else if (consecutiveCorrectAnswers >= 5) {
            // Racha de 5 - recompensa "streak-5"  
            awardReward('streak-5', { theme: 'addition', module: 'addition' });
            console.log('[REWARDS] Otorgada recompensa streak-5 por 5 respuestas correctas consecutivas');
          }
          
          // Si es el último problema, verificar recompensas de sesión
          if (isFinalProblem) {
            // Verificar si es una sesión perfecta (todas las respuestas correctas)
            const allCorrect = answers.every(a => a.isCorrect);
            if (allCorrect && answers.length >= problems.length - 1) {
              awardReward('perfect-session', { theme: 'general', module: 'addition' });
              console.log('[REWARDS] Otorgada recompensa perfect-session por completar todos los problemas correctamente');
            } else {
              // Recompensa por completar la sesión
              awardReward('session-complete', { theme: 'general', module: 'addition' });
              console.log('[REWARDS] Otorgada recompensa session-complete por completar la sesión');
            }
          }
          
          // Recompensas por cantidad de problemas completados
          const totalCompleted = answers.filter(a => a.isCorrect).length + 1; // +1 por la respuesta actual
          if (totalCompleted >= 25) {
            awardReward('addition-enthusiast', { theme: 'addition', module: 'addition' });
            console.log('[REWARDS] Otorgada recompensa addition-enthusiast por completar 25 problemas correctamente');
          } else if (totalCompleted >= 10) {
            awardReward('addition-novice', { theme: 'addition', module: 'addition' });
            console.log('[REWARDS] Otorgada recompensa addition-novice por completar 10 problemas correctamente');
          }
          
          // Activar la animación de recompensa del nuevo sistema
          setShowRewardAnimation(true);
          
          // Mostrar mensaje específico para la recompensa
          setFeedbackMessage("¡Excelente! ¡Has ganado una recompensa!");
          setFeedbackColor("green");
          
          // Registrar que se mostró una recompensa en este índice (para estadísticas y tracking)
          setRewardsShownIndices(prev => [...prev, currentProblemIndex]);
          setTotalRewardsShown(prev => prev + 1);
          
          // Verificar si estamos a punto de subir de nivel (9 respuestas correctas)
          // Si es así, no avanzamos automáticamente para no interferir con la subida de nivel
          if (consecutiveCorrectAnswers === 9) {
            console.log(`[ADAPTIVE DIFFICULTY] Detectado contador en 9, próxima respuesta subirá nivel. No avanzando automáticamente.`);
            
            // Solo ocultamos la recompensa sin avanzar al siguiente problema
            setTimeout(() => {
              setFeedbackMessage("¡Correcta! Una respuesta correcta más y subirás de nivel.");
              setFeedbackColor("green");
              // No llamamos a moveToNextProblem() para que la siguiente respuesta active la subida de nivel
            }, 2500);
          } else {
            // Para cualquier otro valor de contador, comportamiento normal
            setTimeout(() => {
              setFeedbackMessage(null);
              setFeedbackColor(null);
              moveToNextProblem();
            }, 2500);
          }
          
          // NO reiniciamos el contador de respuestas correctas consecutivas
          // para permitir llegar a 10 y subir de nivel
          console.log(`[ADAPTIVE DIFFICULTY] Mostrando recompensa pero manteniendo contador de respuestas correctas: ${consecutiveCorrectAnswers}`);
        } else {
          // Si no hay recompensa, simplemente avanzamos al siguiente problema
          setTimeout(() => {
            setFeedbackMessage(null);
            setFeedbackColor(null);
            moveToNextProblem();
          }, 1000);
        }
      } else {
        // Si las recompensas están desactivadas, simplemente avanzamos
        setTimeout(() => {
          setFeedbackMessage(null);
          setFeedbackColor(null);
          moveToNextProblem();
        }, 1000);
      }
    } 
    // Si la respuesta es incorrecta...
    else {
      // Reiniciar el contador de respuestas correctas consecutivas
      setConsecutiveCorrectAnswers(0);
      
      // Incrementar el contador de respuestas incorrectas consecutivas
      const newConsecutiveIncorrectAnswers = consecutiveIncorrectAnswers + 1;
      setConsecutiveIncorrectAnswers(newConsecutiveIncorrectAnswers);
      
      // Logging para dificultad adaptativa
      if (settings.enableAdaptiveDifficulty) {
        console.log(`[ADAPTIVE DIFFICULTY] ✗ Respuesta incorrecta. Consecutivas: ${newConsecutiveIncorrectAnswers}/${5} necesarias para bajar de nivel`);
        console.log(`[ADAPTIVE DIFFICULTY] Dificultad actual: ${adaptiveDifficulty}, Habilitada: ${settings.enableAdaptiveDifficulty}`);
      }
      
      // Verificar si hemos alcanzado el máximo de intentos permitidos
      const maxAttemptsReached = settings.maxAttempts > 0 && newAttemptCount >= settings.maxAttempts;
      
      // Mostrar mensaje de respuesta incorrecta
      setFeedbackMessage(t('exercises.incorrect'));
      setFeedbackColor("red");
      
      // Si hemos alcanzado el máximo de intentos, mostrar la respuesta correcta y avanzar
      if (maxAttemptsReached) {
        // Guardar la respuesta incorrecta
        const answer: UserAnswer = {
          problem: currentProblem,
          userAnswer: parseInt(userAnswer) || 0,
          isCorrect: false
        };
        
        // Añadimos la respuesta al historial
        setAnswers(prev => [...prev, answer]);
        
        // Si está habilitada la compensación, añadimos un problema adicional inmediatamente
        if (settings.enableCompensation) {
          // Añadir un problema adicional de compensación
          const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
          const compensationProblem = generateAdditionProblem(difficultyToUse);
          
          // Añadimos el problema a la lista actual
          const updatedProblems = [...problems];
          // Insertar el problema después del problema actual
          updatedProblems.splice(currentProblemIndex + 1, 0, compensationProblem);
          
          console.log("[COMPENSATION] Añadiendo problema de compensación después del índice:", currentProblemIndex);
          console.log("[COMPENSATION] Total de problemas ahora:", updatedProblems.length);
          
          // Actualizamos la lista de problemas
          setProblems(updatedProblems);
        }
        
        // Ajustar dificultad adaptativamente si está habilitada esa opción
        if (settings.enableAdaptiveDifficulty) {
          // No necesitamos duplicar los logs aquí porque ya los tenemos en la sección anterior
          
          // Si lleva 5 respuestas incorrectas seguidas, disminuir dificultad
          if (newConsecutiveIncorrectAnswers >= 5) {
            console.log(`[ADAPTIVE DIFFICULTY] ✗✗✗ ¡Se alcanzaron ${newConsecutiveIncorrectAnswers} respuestas incorrectas! Intentando bajar nivel...`);
            
            // Disminuir dificultad (si no está ya en el nivel mínimo)
            const difficulties: string[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
            const currentIndex = difficulties.indexOf(adaptiveDifficulty);
            console.log(`[ADAPTIVE DIFFICULTY] Nivel actual index: ${currentIndex}, mínimo es 0`);
            
            if (currentIndex > 0) {
              const newDifficulty = difficulties[currentIndex - 1] as "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
              console.log(`[ADAPTIVE DIFFICULTY] ¡BAJANDO DE NIVEL! De ${adaptiveDifficulty} a ${newDifficulty}`);
              
              // Actualizar la dificultad adaptativa localmente
              setAdaptiveDifficulty(newDifficulty);
              
              // Guardar en la configuración del módulo para que persista entre sesiones
              // Esto es crítico para mantener el progreso del usuario
              try {
                console.log(`[ADAPTIVE DIFFICULTY] Guardando nueva dificultad (reducida) en configuración: ${newDifficulty}`);
                // IMPORTANTE: Solo actualizamos el campo difficulty, no toda la configuración
                updateModuleSettings("addition", { difficulty: newDifficulty });
                
                // Almacenar también en localStorage como respaldo en caso de problemas de autenticación
                try {
                  const currentModuleSettings = localStorage.getItem('moduleSettings');
                  if (currentModuleSettings) {
                    const settings = JSON.parse(currentModuleSettings);
                    if (settings.addition) {
                      settings.addition.difficulty = newDifficulty;
                    } else {
                      settings.addition = { ...settings.addition || {}, difficulty: newDifficulty };
                    }
                    localStorage.setItem('moduleSettings', JSON.stringify(settings));
                    console.log(`[ADAPTIVE DIFFICULTY] Respaldo: Guardada nueva dificultad (reducida) en localStorage: ${newDifficulty}`);
                  }
                } catch (localStorageError) {
                  console.error("[ADAPTIVE DIFFICULTY] Error al guardar respaldo en localStorage:", localStorageError);
                }
              } catch (error) {
                console.error("[ADAPTIVE DIFFICULTY] Error al guardar nueva dificultad (reducida):", error);
                
                // Intentar guardar al menos en localStorage si falló la API
                try {
                  const currentModuleSettings = localStorage.getItem('moduleSettings');
                  if (currentModuleSettings) {
                    const settings = JSON.parse(currentModuleSettings);
                    if (settings.addition) {
                      settings.addition.difficulty = newDifficulty;
                    } else {
                      settings.addition = { ...settings.addition || {}, difficulty: newDifficulty };
                    }
                    localStorage.setItem('moduleSettings', JSON.stringify(settings));
                    console.log(`[ADAPTIVE DIFFICULTY] Respaldo: Guardada nueva dificultad (reducida) en localStorage: ${newDifficulty}`);
                  }
                } catch (localStorageError) {
                  console.error("[ADAPTIVE DIFFICULTY] Error al guardar respaldo en localStorage:", localStorageError);
                }
              }
              
              // Mostrar mensaje informativo sobre la reducción de nivel
              setTimeout(() => {
                setFeedbackMessage(`Estamos ajustando la dificultad a un nivel más adecuado. Ahora estás en el nivel ${newDifficulty}.`);
                setFeedbackColor("blue");
              }, 1500);
              
              // Reiniciar contador de respuestas incorrectas consecutivas
              setConsecutiveIncorrectAnswers(0);
            } else {
              console.log(`[ADAPTIVE DIFFICULTY] Ya estás en el nivel mínimo: ${adaptiveDifficulty}`);
            }
          }
        }
        
        // Esperar un momento para mostrar el mensaje de respuesta incorrecta
        setTimeout(() => {
          // Luego mostrar la respuesta correcta y el mensaje para continuar
          const correctAnswer = currentProblem.num1 + currentProblem.num2;
          setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${correctAnswer}. Presiona Continuar para seguir.`);
          setFeedbackColor("green");
          
          // Activamos el estado de espera para el botón "Continuar"
          setWaitingForContinue(true);
          
          // Limpiamos cualquier temporizador activo
          if (problemTimerRef.current) {
            clearInterval(problemTimerRef.current);
            problemTimerRef.current = null;
          }
        }, 1000);
      } 
      // Si aún no hemos agotado los intentos, permitir intentar de nuevo
      else {
        setTimeout(() => {
          setFeedbackMessage(null);
          setFeedbackColor(null);
          setUserAnswer(""); // Limpiar el campo para un nuevo intento
        }, 1000);
      }
    }
  };

  const moveToNextProblem = () => {
    // Verificar si el avance automático está bloqueado (ej. después de subir de nivel)
    if (blockAutoAdvance) {
      console.log("[EXERCISE] Avance automático bloqueado. No se avanzará al siguiente problema.");
      return;
    }
    
    if (currentProblemIndex < problems.length - 1) {
      // Limpiar el temporizador del problema actual si existe
      if (problemTimerRef.current) {
        clearInterval(problemTimerRef.current);
        problemTimerRef.current = null;
      }
      
      // Logging para los contadores adaptativos (no se reinician al pasar de un problema a otro)
      if (settings.enableAdaptiveDifficulty) {
        console.log(`[ADAPTIVE DIFFICULTY] Pasando al siguiente problema. Manteniendo contadores:`);
        console.log(`[ADAPTIVE DIFFICULTY] - Respuestas correctas consecutivas: ${consecutiveCorrectAnswers}`);
        console.log(`[ADAPTIVE DIFFICULTY] - Respuestas incorrectas consecutivas: ${consecutiveIncorrectAnswers}`);
      }
      
      setCurrentProblemIndex(prev => prev + 1);
      setUserAnswer("");
      setShowingExplanation(false);
      setFeedbackMessage(null);
      setFeedbackColor(null);
      setCurrentAttempts(0); // Reiniciamos el contador de intentos para el nuevo problema
      setProblemTimer(settings.timeValue); // Reiniciamos el temporizador para el nuevo problema
      setWaitingForContinue(false); // Aseguramos que no estamos esperando que el usuario presione "Continuar"
      
      // NO reiniciamos consecutiveCorrectAnswers ni consecutiveIncorrectAnswers
      // para que la dificultad adaptativa funcione correctamente entre problemas
    } else {
      completeExercise();
    }
  };

  const moveToPreviousProblem = () => {
    if (currentProblemIndex > 0) {
      // Limpiar el temporizador del problema actual si existe
      if (problemTimerRef.current) {
        clearInterval(problemTimerRef.current);
        problemTimerRef.current = null;
      }
      
      setCurrentProblemIndex(prev => prev - 1);
      
      // Obtener la respuesta anterior del usuario
      const previousAnswer = answers[currentProblemIndex - 1];
      
      if (previousAnswer) {
        // Mostrar la respuesta anterior del usuario en formato de solo lectura
        setUserAnswer(previousAnswer.userAnswer.toString());
        
        // Mostrar un mensaje indicando la respuesta anterior
        const isCorrect = previousAnswer.isCorrect;
        const correctAnswer = previousAnswer.problem.num1 + previousAnswer.problem.num2;
        
        if (isCorrect) {
          // Para respuestas correctas
          setFeedbackMessage(`Respuesta correcta: ${previousAnswer.userAnswer}`);
          setFeedbackColor("green");
        } else {
          // Para respuestas incorrectas
          if (previousAnswer.userAnswer === -1) {
            // Si la respuesta fue revelada
            setFeedbackMessage(`Respuesta revelada: ${correctAnswer}`);
          } else {
            // Si fue una respuesta incorrecta del usuario
            setFeedbackMessage(`Respuesta incorrecta. La respuesta correcta es: ${correctAnswer}`);
          }
          setFeedbackColor("red");
        }
      } else {
        setUserAnswer("");
        setFeedbackMessage(null);
        setFeedbackColor(null);
      }
      
      // Desactiva la posibilidad de editar en problemas anteriores
      setShowingExplanation(true);
      
      // Aseguramos que el usuario no pueda seguir intentando responder
      // al problema anterior
      setWaitingForContinue(true);
    }
  };

  const completeExercise = () => {
    // Al final ya no necesitamos esta lógica de compensación, porque ahora agregamos los problemas inmediatamente
  // después de cada respuesta incorrecta o revelada
    
    // Si no hay compensación o ya hemos añadido los problemas, completar el ejercicio
    setExerciseCompleted(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Calculate score
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    
    // Save results
    saveExerciseResult({
      operationId: "addition",
      date: new Date().toISOString(),
      score: correctAnswers,
      totalProblems: problems.length,
      timeSpent: timer,
      difficulty: settings.difficulty
    });
  };

  const currentProblem = problems[currentProblemIndex];
  const progress = ((currentProblemIndex + 1) / problems.length) * 100;
  const score = answers.filter(a => a.isCorrect).length;

  if (problems.length === 0) {
    return (
      <div className="text-center py-8">
        <p>Loading problems...</p>
      </div>
    );
  }
  
  // Añadimos el componente LevelUpHandler fuera de los condicionales
  // para que siempre esté disponible para escuchar eventos de nivel superado
  // Nota: Este componente es "invisible" hasta que se dispara un evento de nivel superado

  if (exerciseCompleted) {
    return (
      <div className="px-4 py-5 sm:p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Exercise Completed!</h2>
            <p className="text-gray-600">Your score: {score}/{problems.length}</p>
            <p className="text-gray-600">Time taken: {formatTime(timer)}</p>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Performance</h3>
            <p className="text-sm">
              Accuracy: {Math.round((score / problems.length) * 100)}%
            </p>
            <p className="text-sm">
              Average time per problem: {Math.round(timer / problems.length)} seconds
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Breakdown</h3>
            <p className="text-sm">
              Correct answers: {score}
            </p>
            <p className="text-sm">
              Incorrect answers: {problems.length - score}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={generateProblems}>
            Try Again
          </Button>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <LevelUpHandler />
      {/* El componente RewardAnimation se mostrará cuando el estado de recompensa esté activo */}
      <RewardAnimation />
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Addition Exercise</h2>
          <p className="text-sm text-gray-500">Solve the following addition problems</p>
        </div>
        <div className="flex items-center">
          <span className="mr-4 text-sm text-gray-500">
            <span className="inline-flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatTime(timer)}
            </span>
          </span>
          
          {/* Mostrar temporizador por problema si está configurado */}
          {settings.timeValue > 0 && (
            <span className={`mr-4 text-sm ${problemTimer <= 5 ? "text-red-600 font-bold animate-pulse" : "text-gray-500"}`}>
              <span className="inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 mr-1 ${problemTimer <= 5 ? "text-red-600" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Tiempo: {problemTimer}s
              </span>
            </span>
          )}
          
          {/* Mostrar el nivel de dificultad actual */}
          <div className="mr-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Nivel: {settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty}
            </span>
            {consecutiveCorrectAnswers >= 5 && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                🔥 Racha: {consecutiveCorrectAnswers}
              </span>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
          >
            <Cog className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <Progress value={progress} className="h-2.5" />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Problem {currentProblemIndex + 1} of {problems.length}</span>
          <span>Score: {score}/{answers.length}</span>
        </div>
        {settings.maxAttempts > 0 && (
          <div className="flex justify-between items-center text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded-md">
            <span className="font-semibold">Intentos permitidos: {settings.maxAttempts}</span>
            <div className="flex gap-1">
              {Array.from({ length: settings.maxAttempts }).map((_, index) => (
                <div 
                  key={index} 
                  className={`w-3 h-3 rounded-full ${
                    index < currentAttempts 
                      ? "bg-red-500" // Intentos usados
                      : "bg-gray-300" // Intentos disponibles
                  }`}
                />
              ))}
            </div>
            <span>Usados: {currentAttempts}/{settings.maxAttempts}</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-50 rounded-lg mb-6">
        <div className="text-center">
          {/* El sistema de recompensas antiguo ha sido reemplazado por el nuevo componente RewardAnimation */}
          
          {/* Mostrar recompensa especial por subir de nivel - DISEÑO EXACTO al proporcionado */}
          {showLevelUpReward && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-blue-100 rounded-3xl p-8 shadow-2xl text-center transform transition-transform max-w-md w-full border-4 border-indigo-300">
                <h3 className="text-5xl font-bold text-indigo-600 mb-6">¡NIVEL SUPERADO!</h3>
                
                <div className="flex justify-center mb-6">
                  <Trophy 
                    className="h-32 w-32 text-indigo-500 drop-shadow-xl" 
                    fill="#818cf8"
                    strokeWidth={1}
                  />
                </div>
           
                <p className="text-2xl font-medium text-indigo-800 mb-2">
                  ¡Has demostrado excelentes habilidades matemáticas!
                </p>
                <p className="text-xl font-medium mb-8 text-indigo-700">
                  Has avanzado al siguiente nivel de dificultad
                </p>
                
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-xl"
                  onClick={() => {
                    // 1. Ocultar el mensaje de nivel superado
                    setShowLevelUpReward(false);
                    
                    // 2. CRÍTICO: Desbloquear la progresión automática que estaba bloqueada
                    setWaitingForContinue(false); 
                    
                    // 3. Eliminamos la llamada automática a moveToNextProblem()
                    // para que el usuario pueda completar el problema actual
                    console.log('[NIVEL SUPERADO] Usuario hizo clic en Continuar el Desafío - Permaneciendo en el mismo problema');
                    
                    // 4. Mostrar mensaje informativo sobre el cambio de nivel
                    setFeedbackMessage("Ahora estás en un nuevo nivel de dificultad. Completa este problema para continuar.");
                    setFeedbackColor("blue");
                  }}
                >
                  ¡Continuar el Desafío!
                </Button>
              </div>
            </div>
          )}
        
          {currentProblem ? (
            <div className={`text-3xl font-bold mb-6 flex justify-center items-baseline ${feedbackMessage ? (feedbackColor === "green" ? "text-green-600" : "text-red-600") : ""}`}>
              <span className="text-right w-16">{currentProblem.num1}</span>
              <span className="mx-4">+</span>
              <span className="text-right w-16">{currentProblem.num2}</span>
              <span className="mx-4">=</span>
              <div className="border-b-2 border-gray-400 w-16 relative">
                <Input
                  type="text"
                  ref={inputRef}
                  className={`w-full text-center ${waitingForContinue || showingExplanation ? "bg-gray-100" : "bg-transparent"} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-10 px-2`}
                  value={userAnswer}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !waitingForContinue && !showingExplanation) {
                      checkCurrentAnswer();
                    }
                  }}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  disabled={waitingForContinue || showingExplanation}
                  readOnly={waitingForContinue || showingExplanation}
                  aria-readonly={waitingForContinue || showingExplanation}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p>Cargando el siguiente problema...</p>
            </div>
          )}
          {feedbackMessage && (
            <div className={`text-lg font-medium ${
              feedbackColor === "green" ? "text-green-600" : 
              feedbackColor === "blue" ? "text-blue-600" : 
              "text-red-600"
            }`}>
              {feedbackMessage}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((num) => (
            <button
              key={num}
              className={`w-12 h-12 ${waitingForContinue || showingExplanation ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-50"} rounded-lg shadow-sm border border-gray-300 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary`}
              onClick={() => !waitingForContinue && !showingExplanation && handleKeyboardInput(num)}
              disabled={waitingForContinue || showingExplanation}
              aria-disabled={waitingForContinue || showingExplanation}
            >
              {num}
            </button>
          ))}
          <button
            className={`w-12 h-12 ${waitingForContinue || showingExplanation ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-50"} rounded-lg shadow-sm border border-gray-300 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary`}
            onClick={() => !waitingForContinue && !showingExplanation && handleKeyboardInput("backspace")}
            disabled={waitingForContinue || showingExplanation}
            aria-disabled={waitingForContinue || showingExplanation}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={currentProblemIndex === 0}
          onClick={moveToPreviousProblem}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('common.prev')}
        </Button>
        
        {/* Si estamos esperando que el usuario presione "Continuar", mostrar ese botón */}
        {waitingForContinue ? (
          <Button 
            onClick={handleContinue}
            className="px-8 animate-pulse" // Hacemos el botón un poco más ancho y pulsante para llamar la atención
          >
            Continuar
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={!settings.showAnswerWithExplanation}
                    onClick={showAnswerWithExplanation}
                  >
                    <Info className="mr-2 h-4 w-4" />
                    {t('exercises.showAnswer')}
                  </Button>
                </TooltipTrigger>
                {!settings.showAnswerWithExplanation ? (
                  <TooltipContent>
                    <p>{t('tooltips.activateShowAnswer')}</p>
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
            <Button onClick={checkCurrentAnswer}>
              {exerciseStarted ? (
                <>
                  {t('exercises.check')}
                  <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                t('exercises.start')
              )}
            </Button>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
