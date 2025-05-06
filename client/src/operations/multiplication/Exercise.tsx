import { useState, useEffect, useRef } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { generateMultiplicationProblem, checkAnswer } from "./utils";
import { Problem, UserAnswer } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations";
import { Checkbox } from "@/components/ui/checkbox";

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const { t } = useTranslations();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timer, setTimer] = useState(0);
  const [problemTimer, setProblemTimer] = useState(0); // Temporizador para el problema actual
  const [problemStartTime, setProblemStartTime] = useState(0); // Tiempo en que se inició el problema actual
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | null>(null);
  const [showHelpButton, setShowHelpButton] = useState(false); // Control si mostramos el botón de ayuda
  const [showingExplanation, setShowingExplanation] = useState(false); // Control si mostramos la explicación
  const [currentAttempts, setCurrentAttempts] = useState(0); // Contador para intentos en el problema actual
  const [showReward, setShowReward] = useState(false); // Estado para mostrar la recompensa
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0); // Contador para respuestas correctas consecutivas
  const [rewardType, setRewardType] = useState<"medals" | "trophies" | "stars">("stars"); // Tipo de recompensa a mostrar
  const [rewardsShownIndices, setRewardsShownIndices] = useState<number[]>([]); // Índices donde se han mostrado recompensas
  const [totalRewardsShown, setTotalRewardsShown] = useState(0); // Contador total de recompensas mostradas
  const [waitingForContinue, setWaitingForContinue] = useState(false); // Estado para esperar a que el usuario continúe
  const [autoContinue, setAutoContinue] = useState(false); // Estado para continuar automáticamente
  const [isReviewing, setIsReviewing] = useState(false); // Estado para modo revisión
  const [showingReview, setShowingReview] = useState(false); // Estado para mostrar vista de revisión
  const [reviewIndex, setReviewIndex] = useState(0); // Índice actual en modo revisión
  const [problemAttempts, setProblemAttempts] = useState<number[]>([]); // Número de intentos por problema
  const [problemTimes, setProblemTimes] = useState<number[]>([]); // Tiempo empleado por problema
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const problemTimerRef = useRef<number | null>(null); // Referencia para el temporizador del problema
  const autoContinueTimeoutRef = useRef<number | null>(null); // Referencia para el timeout de auto continuar
  const { saveExerciseResult } = useProgress();

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
  
  // Timer logic for problem time limit
  useEffect(() => {
    // Solo iniciamos el temporizador si hay un límite de tiempo configurado (timeValue > 0)
    // y si el ejercicio está activo y no estamos esperando que el usuario presione continuar
    if (exerciseStarted && !exerciseCompleted && !waitingForContinue && settings.timeValue > 0) {
      // Limpiamos el temporizador anterior si existe
      if (problemTimerRef.current) {
        clearInterval(problemTimerRef.current);
        problemTimerRef.current = null;
      }
      
      // Iniciamos un nuevo temporizador para el problema actual
      setProblemTimer(settings.timeValue); // Reiniciamos el temporizador con el valor configurado
      
      problemTimerRef.current = window.setInterval(() => {
        setProblemTimer(prev => {
          if (prev <= 1) {
            // Cuando llega a cero, lo manejamos como timeOut
            if (problemTimerRef.current) {
              clearInterval(problemTimerRef.current);
              problemTimerRef.current = null;
            }
            
            // Usamos la función handleTimeExpired para manejar cuando se agota el tiempo
            handleTimeExpired();
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (problemTimerRef.current) {
        clearInterval(problemTimerRef.current);
        problemTimerRef.current = null;
      }
    };
  }, [exerciseStarted, exerciseCompleted, currentProblemIndex, waitingForContinue, settings.timeValue]);

  // Función centralizada para manejar cuando se agota el tiempo
  const handleTimeExpired = () => {
    // Contamos como un intento usado
    setCurrentAttempts(attempts => {
      const newAttempts = attempts + 1;
      console.log("Tiempo expirado: intento", newAttempts);
      
      // Mostramos mensaje de tiempo agotado
      setFeedbackMessage("¡Tiempo agotado! Intenta de nuevo.");
      setFeedbackColor("red");
      
      // Verificamos si hemos alcanzado el máximo de intentos
      if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
        const currentProblem = problems[currentProblemIndex];
        const correctAnswer = currentProblem.num1 * currentProblem.num2;
        
        setTimeout(() => {
          // Mostrar la respuesta correcta
          setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${correctAnswer}`);
          setFeedbackColor("green");
          
          // Guardar la respuesta como incorrecta
          const answer: UserAnswer = {
            problem: currentProblem,
            userAnswer: -2, // Usamos -2 para indicar tiempo agotado
            isCorrect: false
          };
          
          setAnswers(prev => [...prev, answer]);
          
          // Guardar el número de intentos para este problema
          setProblemAttempts(prev => [...prev, newAttempts]);
          
          // Guardar el tiempo empleado en este problema
          setProblemTimes(prev => [...prev, settings.timeValue]);
          
          // Marcar como esperando para continuar
          setWaitingForContinue(true);
          
          // Si está habilitada la compensación, añadimos un problema adicional
          if (settings.enableCompensation) {
            const newProblem = generateMultiplicationProblem(settings.difficulty);
            setProblems(prev => [...prev, newProblem]);
          }
        }, 1500);
      } else {
        // Si aún no hemos alcanzado el máximo de intentos, reiniciamos el temporizador
        setTimeout(() => {
          setFeedbackMessage(null);
          setFeedbackColor(null);
          
          // Reiniciamos el temporizador
          setProblemTimer(settings.timeValue);
          if (!problemTimerRef.current && settings.timeValue > 0) {
            problemTimerRef.current = window.setInterval(() => {
              setProblemTimer(p => p > 0 ? p - 1 : 0);
            }, 1000);
          }
        }, 1500);
      }
      
      return newAttempts;
    });
  };

  // Focus input when current problem changes
  useEffect(() => {
    if (inputRef.current && !waitingForContinue) {
      inputRef.current.focus();
    }
  }, [currentProblemIndex, waitingForContinue]);

  const generateProblems = () => {
    const newProblems: Problem[] = [];
    
    for (let i = 0; i < settings.problemCount; i++) {
      newProblems.push(generateMultiplicationProblem(settings.difficulty));
    }
    
    setProblems(newProblems);
    setCurrentProblemIndex(0);
    setUserAnswer("");
    setAnswers([]);
    setTimer(0);
    setProblemTimer(settings.timeValue);
    setProblemStartTime(0);
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setFeedbackMessage(null);
    setFeedbackColor(null);
    setShowingExplanation(false);
    setShowHelpButton(false);
    setCurrentAttempts(0);
    setConsecutiveCorrectAnswers(0);
    setRewardsShownIndices([]);
    setTotalRewardsShown(0);
    setShowReward(false);
    setWaitingForContinue(false);
    setAutoContinue(false);
    setIsReviewing(false);
    setShowingReview(false);
    setReviewIndex(0);
    setProblemAttempts([]);
    setProblemTimes([]);
    
    if (autoContinueTimeoutRef.current) {
      window.clearTimeout(autoContinueTimeoutRef.current);
      autoContinueTimeoutRef.current = null;
    }
  };
  
  const showAnswerWithExplanation = () => {
    if (!exerciseStarted) {
      startExercise();
      return;
    }
    
    // Solo se puede revelar la respuesta si hemos alcanzado el número máximo de intentos
    // o si el maxAttempts está configurado a 0 (sin límite)
    if (settings.maxAttempts === 0 || currentAttempts >= settings.maxAttempts) {
      setShowingExplanation(true);
      const currentProblem = problems[currentProblemIndex];
      const correctAnswer = currentProblem.num1 * currentProblem.num2;
      
      setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${correctAnswer}`);
      setFeedbackColor("green");
      
      // Esperar 2 segundos y luego pasar al siguiente problema
      setTimeout(() => {
        // Guardar la respuesta como incorrecta
        const answer: UserAnswer = {
          problem: currentProblem,
          userAnswer: -1, // Usamos -1 para indicar que se reveló la respuesta
          isCorrect: false
        };
        
        setAnswers(prev => [...prev, answer]);
        moveToNextProblem();
      }, 2000);
    } else {
      // Mostrar mensaje de que no se puede ver la respuesta hasta agotar los intentos
      setFeedbackMessage(`Debes agotar tus ${settings.maxAttempts} intentos primero`);
      setFeedbackColor("red");
      
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackColor(null);
      }, 2000);
    }
  };

  const startExercise = () => {
    setExerciseStarted(true);
    // Una vez que empieza el ejercicio, mostrar el botón de ayuda si está configurado
    if (settings.showAnswerWithExplanation) {
      setShowHelpButton(true);
    }
    
    // Registramos el tiempo de inicio para el primer problema
    setProblemStartTime(timer);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Función para continuar al siguiente problema después de esperar la acción del usuario
  const handleContinue = () => {
    setShowReward(false);
    setFeedbackMessage(null);
    setFeedbackColor(null);
    setWaitingForContinue(false);
    
    // Si tenemos habilitado el auto-continuar, recordamos la configuración para el siguiente problema
    if (autoContinueTimeoutRef.current) {
      window.clearTimeout(autoContinueTimeoutRef.current);
      autoContinueTimeoutRef.current = null;
    }
    
    moveToNextProblem();
    
    // Si el usuario ha activado el auto-continuar, programamos el siguiente problema
    if (autoContinue && currentProblemIndex < problems.length - 1) {
      // Activar el auto-continuar después de responder correctamente
      autoContinueTimeoutRef.current = window.setTimeout(() => {
        if (currentProblemIndex < problems.length - 1) {
          checkCurrentAnswer();
        }
      }, 1000); // Esperar 1 segundo para darle tiempo al usuario a ver el problema
    }
  };

  // Función para iniciar la revisión de respuestas
  const startReview = () => {
    setShowingReview(true);
    setReviewIndex(0);
  };
  
  // Funciones para navegar entre las respuestas en modo revisión
  const nextReviewItem = () => {
    if (reviewIndex < answers.length - 1) {
      setReviewIndex(prev => prev + 1);
    } else {
      // Si llegamos al final, volvemos a la pantalla de resumen
      setShowingReview(false);
    }
  };
  
  const prevReviewItem = () => {
    if (reviewIndex > 0) {
      setReviewIndex(prev => prev - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
  };

  const handleKeyboardInput = (value: string) => {
    if (value === "backspace") {
      setUserAnswer(prev => prev.slice(0, -1));
    } else {
      // Limit input to 4 digits which should be enough for multiplication problems at this level
      if (userAnswer.length < 4) {
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
    
    // Si la respuesta es correcta
    if (isCorrect) {
      // Calcular tiempo empleado en el problema actual
      const timeSpent = timer - problemStartTime;
      
      // Guardar la respuesta
      const answer: UserAnswer = {
        problem: currentProblem,
        userAnswer: parseInt(userAnswer) || 0,
        isCorrect: true
      };
      
      setAnswers(prev => [...prev, answer]);
      
      // Guardar el número de intentos para este problema
      setProblemAttempts(prev => [...prev, newAttemptCount]);
      
      // Guardar el tiempo empleado en este problema
      setProblemTimes(prev => [...prev, timeSpent]);
      
      // Incrementar el contador de respuestas correctas consecutivas
      const newConsecutiveCorrectAnswers = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newConsecutiveCorrectAnswers);
      
      // Mostrar feedback de respuesta correcta
      setFeedbackMessage(t('exercises.correct'));
      setFeedbackColor("green");
      
      // Decidir si mostrar recompensa basado en diferentes criterios
      if (settings.enableRewards) {
        // Sistema de recompensas mucho más estratégico y menos predecible
        // - Evitamos que aparezcan recompensas en problemas consecutivos
        // - Limitamos el número total de recompensas por sesión
        // - Garantizamos recompensas solo en momentos clave del progreso
        // - Introducimos una mecánica de "racha oculta" para sorprender
        
        let shouldShowReward = false;
        
        // Máximo de recompensas permitidas por sesión (aproximadamente 20-25% de los problemas)
        const maxRewardsPerSession = Math.max(2, Math.ceil(problems.length * 0.2));
        
        // Si ya hemos mostrado suficientes recompensas, limitamos su aparición
        if (totalRewardsShown >= maxRewardsPerSession) {
          // Solo permitimos una recompensa final si es el último problema y aún no hemos mostrado una allí
          shouldShowReward = currentProblemIndex === problems.length - 1 && 
                             !rewardsShownIndices.includes(problems.length - 1);
        } 
        else {
          // Evitamos mostrar recompensas en problemas consecutivos o muy cercanos
          const lastRewardIndex = rewardsShownIndices.length > 0 ? 
                                  rewardsShownIndices[rewardsShownIndices.length - 1] : -1;
          
          // Mínimo de problemas entre recompensas (al menos 3-4 problemas entre recompensas)
          const minProblemsBetweenRewards = Math.max(3, Math.floor(problems.length / 8));
          const problemsSinceLastReward = lastRewardIndex === -1 ? 
                                          currentProblemIndex + 1 : 
                                          currentProblemIndex - lastRewardIndex;
          
          // Solo considerar mostrar recompensa si ha pasado suficiente tiempo desde la última
          if (lastRewardIndex === -1 || problemsSinceLastReward > minProblemsBetweenRewards) {
            
            // Momentos estratégicos para recompensas con mayor probabilidad:
            // 1. Al inicio del ejercicio (primer 20% de problemas) - muy baja probabilidad (8%)
            const isEarlyProblem = currentProblemIndex < Math.ceil(problems.length * 0.2);
            
            // 2. A mitad del ejercicio (promedio 50% completado) - probabilidad media (25%)
            const isMidPointProblem = Math.abs(currentProblemIndex - Math.floor(problems.length / 2)) <= 1;
            
            // 3. Al final del ejercicio (último 10% de problemas) - alta probabilidad (75%) 
            const isLateProblem = currentProblemIndex >= Math.floor(problems.length * 0.9);
            
            // 4. Específicamente en el último problema - garantizada (100%)
            const isFinalProblem = currentProblemIndex === problems.length - 1;
            
            // 5. Tras logros significativos (5 o más respuestas correctas consecutivas) - probabilidad alta (60%)
            const isSignificantStreak = newConsecutiveCorrectAnswers >= 5;
            
            // Asignamos probabilidades basadas en los criterios
            if (isFinalProblem) {
              shouldShowReward = true; // Garantizada en el último problema
            }
            else if (isSignificantStreak) {
              shouldShowReward = Math.random() < 0.6; // Alta probabilidad por racha significativa
            }
            else if (isLateProblem) {
              shouldShowReward = Math.random() < 0.35; // Probabilidad moderada hacia el final
            }
            else if (isMidPointProblem) {
              shouldShowReward = Math.random() < 0.25; // Probabilidad media en el punto medio
            }
            else if (isEarlyProblem) {
              shouldShowReward = Math.random() < 0.08; // Muy baja probabilidad al inicio
            }
            else {
              // Factor sorpresa - muy raro (3%)
              shouldShowReward = Math.random() < 0.03;
            }
          }
        }
        
        if (shouldShowReward) {
          // Seleccionar aleatoriamente el tipo de recompensa (medallas, trofeos o estrellas)
          const rewardTypes: ("medals" | "trophies" | "stars")[] = ["medals", "trophies", "stars"];
          const randomRewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
          setRewardType(randomRewardType);
          
          // Mostrar mensaje específico para la recompensa
          setFeedbackMessage("¡Excelente! ¡Has ganado una recompensa!");
          setFeedbackColor("green");
          
          // Registrar que se mostró una recompensa en este índice
          setRewardsShownIndices(prev => [...prev, currentProblemIndex]);
          setTotalRewardsShown(prev => prev + 1);
          
          // Mostrar recompensa con animación
          setShowReward(true);
          
          // Ahora esperamos a que el usuario haga clic en "Continuar"
          setWaitingForContinue(true);
          
          // Reiniciar contador de respuestas correctas consecutivas para variar la frecuencia
          setConsecutiveCorrectAnswers(0);
        } else {
          // Si no hay recompensa, esperamos a que el usuario haga clic en "Continuar"
          setWaitingForContinue(true);
        }
      } else {
        // Si las recompensas están desactivadas, esperamos a que el usuario haga clic en "Continuar"
        setWaitingForContinue(true);
      }
    } 
    // Si la respuesta es incorrecta
    else {
      // Reiniciar el contador de respuestas correctas consecutivas
      setConsecutiveCorrectAnswers(0);
      
      // Verificar si hemos alcanzado el máximo de intentos permitidos
      const maxAttemptsReached = settings.maxAttempts > 0 && newAttemptCount >= settings.maxAttempts;
      
      // Mostrar mensaje de respuesta incorrecta
      setFeedbackMessage(t('exercises.incorrect'));
      setFeedbackColor("red");
      
      // Si hemos alcanzado el máximo de intentos, mostrar la respuesta correcta y avanzar
      if (maxAttemptsReached) {
        // Calcular tiempo empleado en el problema actual
        const timeSpent = timer - problemStartTime;
        
        // Guardar la respuesta incorrecta
        const answer: UserAnswer = {
          problem: currentProblem,
          userAnswer: parseInt(userAnswer) || 0,
          isCorrect: false
        };
        
        setAnswers(prev => [...prev, answer]);
        
        // Guardar el número de intentos para este problema
        setProblemAttempts(prev => [...prev, newAttemptCount]);
        
        // Guardar el tiempo empleado en este problema
        setProblemTimes(prev => [...prev, timeSpent]);
        
        // Si la compensación está habilitada, añadimos un problema adicional por cada respuesta incorrecta
        if (settings.enableCompensation) {
          const newProblem = generateMultiplicationProblem(settings.difficulty);
          setProblems(prev => [...prev, newProblem]);
        }
        
        // Esperar un momento para mostrar el mensaje de respuesta incorrecta
        setTimeout(() => {
          // Luego mostrar la respuesta correcta
          const correctAnswer = currentProblem.num1 * currentProblem.num2;
          setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${correctAnswer}`);
          setFeedbackColor("green");
          
          // Esperamos a que el usuario haga clic en "Continuar"
          setWaitingForContinue(true);
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
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setUserAnswer("");
      setShowingExplanation(false); // Restablecemos la explicación al pasar al siguiente problema
      setFeedbackMessage(null);
      setFeedbackColor(null);
      setCurrentAttempts(0); // Reiniciamos el contador de intentos para el nuevo problema
      
      // Reiniciamos el temporizador para el nuevo problema
      setProblemTimer(settings.timeValue);
      
      // Registramos el tiempo de inicio del nuevo problema
      setProblemStartTime(timer);
    } else {
      completeExercise();
    }
  };

  const moveToPreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1);
      // Set the input to the previously entered answer if available
      const previousAnswer = answers[currentProblemIndex - 1];
      setUserAnswer(previousAnswer ? previousAnswer.userAnswer.toString() : "");
    }
  };

  const completeExercise = () => {
    setExerciseCompleted(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Calculate score
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    
    // Save results
    saveExerciseResult({
      operationId: "multiplication",
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

  // Modo de revisión
  if (showingReview && answers.length > 0) {
    const answer = answers[reviewIndex];
    const attemptCount = problemAttempts[reviewIndex] || 0;
    const timeSpent = problemTimes[reviewIndex] || 0;
    
    return (
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Revisión de Respuestas</h2>
          <div className="text-sm text-gray-500">
            {reviewIndex + 1} / {answers.length}
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 rounded-lg mb-6 border border-gray-200">
          <div className="flex justify-center items-center mb-6">
            <div className="text-3xl font-bold flex items-baseline">
              <span className="w-16 text-right">{answer.problem.num1}</span>
              <span className="mx-4">×</span>
              <span className="w-16 text-right">{answer.problem.num2}</span>
              <span className="mx-4">=</span>
              <span className="w-16 text-right">
                <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>
                  {answer.userAnswer}
                </span>
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm">
              <span className="font-semibold">Resultado: </span>
              {answer.isCorrect ? (
                <span className="text-green-600 font-semibold">Correcto</span>
              ) : (
                <div>
                  <span className="text-red-600 font-semibold">Incorrecto</span>
                  <div className="mt-1">
                    <span className="font-medium">Respuesta correcta: </span>
                    <span className="text-green-600 font-semibold">
                      {answer.problem.num1 * answer.problem.num2}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-right">
              <div>
                <span className="font-semibold">Tiempo: </span>
                {formatTime(timeSpent)}
              </div>
              <div>
                <span className="font-semibold">Intentos: </span>
                {attemptCount}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevReviewItem}
            disabled={reviewIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowingReview(false)}
          >
            Volver al Resumen
          </Button>
          
          <Button 
            onClick={nextReviewItem}
            disabled={reviewIndex === answers.length - 1}
          >
            Siguiente
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Pantalla de resultados
  if (exerciseCompleted) {
    return (
      <div className="px-4 py-5 sm:p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t('exercises.completed')}</h2>
          <p className="text-gray-600">{t('exercises.score')}: {score}/{problems.length}</p>
          <p className="text-gray-600">{t('exercises.timeTaken')}: {formatTime(timer)}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Rendimiento</h3>
            <p className="text-sm">
              Precisión: {Math.round((score / problems.length) * 100)}%
            </p>
            <p className="text-sm">
              Tiempo promedio por problema: {Math.round(timer / problems.length)} segundos
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Desglose</h3>
            <p className="text-sm">
              Respuestas correctas: {score}
            </p>
            <p className="text-sm">
              Respuestas incorrectas: {problems.length - score}
            </p>
          </div>
        </div>
        
        {/* Tabla detallada de resultados */}
        <div className="mb-8 overflow-x-auto">
          <h3 className="font-semibold mb-4 text-lg">Reporte Detallado</h3>
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">#</th>
                <th className="py-2 px-4 border-b text-left">Problema</th>
                <th className="py-2 px-4 border-b text-left">Tu respuesta</th>
                <th className="py-2 px-4 border-b text-left">Correcta</th>
                <th className="py-2 px-4 border-b text-left">Tiempo</th>
                <th className="py-2 px-4 border-b text-left">Intentos</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="py-2 px-4 border-b">{index + 1}</td>
                  <td className="py-2 px-4 border-b">
                    {answer.problem.num1} × {answer.problem.num2}
                  </td>
                  <td className="py-2 px-4 border-b font-medium">
                    <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>
                      {answer.userAnswer}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {answer.isCorrect ? (
                      <Check className="text-green-600 h-5 w-5" />
                    ) : (
                      <span className="text-green-600 font-medium">
                        {answer.problem.num1 * answer.problem.num2}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {formatTime(problemTimes[index] || 0)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {problemAttempts[index] || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
          <Button onClick={startReview} disabled={answers.length === 0}>
            Revisar Respuestas
          </Button>
          <Button variant="outline" onClick={generateProblems}>
            {t('exercises.tryAgain')}
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            {t('common.settings')}
          </Button>
          <Button variant="outline" asChild>
            <a href="/">{t('exercises.returnHome')}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Multiplication Exercise</h2>
          <p className="text-sm text-gray-500">Solve the following multiplication problems</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Temporizador global */}
          <span className="text-sm text-gray-500">
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

          {/* Temporizador por problema (solo visible si está configurado) */}
          {settings.timeValue > 0 && exerciseStarted && (
            <span className={`text-sm ${problemTimer <= 5 && problemTimer > 0 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
              <span className="inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 mr-1 ${problemTimer <= 5 && problemTimer > 0 ? 'text-red-500 animate-pulse' : ''}`}
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
        {settings.maxAttempts > 0 && exerciseStarted && (
          <div className="flex justify-center items-center mt-2">
            <div className="flex gap-1 items-center">
              <span className="text-xs text-gray-500 mr-1">Intentos:</span>
              {/* Mostrar círculos que representan los intentos usados (rojo) y disponibles (gris) */}
              {Array.from({ length: settings.maxAttempts }).map((_, i) => (
                <span 
                  key={i}
                  className={`inline-block w-3 h-3 rounded-full ${
                    i < currentAttempts ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-50 rounded-lg mb-6">
        <div className="text-center">
          {/* Animación de recompensa */}
          {showReward && (
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="absolute inset-0 bg-black bg-opacity-30 animate-fade-in"></div>
              <div className="relative bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-8 shadow-xl transform animate-bounce-in">
                <div className="text-2xl font-bold text-white mb-4 text-center">
                  ¡Recompensa!
                </div>
                <div className="flex justify-center">
                  {rewardType === "stars" && (
                    <div className="text-6xl text-yellow-200 animate-pulse">
                      ⭐⭐⭐
                    </div>
                  )}
                  {rewardType === "medals" && (
                    <div className="text-6xl text-yellow-200 animate-pulse">
                      🥇
                    </div>
                  )}
                  {rewardType === "trophies" && (
                    <div className="text-6xl text-yellow-200 animate-pulse">
                      🏆
                    </div>
                  )}
                </div>
                <div className="text-white text-center mt-4 font-medium">
                  ¡Excelente trabajo!
                </div>
              </div>
            </div>
          )}
          
          <div className={`text-3xl font-bold mb-6 flex justify-center items-baseline ${feedbackMessage ? (feedbackColor === "green" ? "text-green-600" : "text-red-600") : ""}`}>
            <span className="text-right w-16">{currentProblem.num1}</span>
            <span className="mx-4">×</span>
            <span className="text-right w-16">{currentProblem.num2}</span>
            <span className="mx-4">=</span>
            <div className="border-b-2 border-gray-400 w-16 relative">
              <Input
                type="text"
                ref={inputRef}
                className="w-full text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-10 px-2"
                value={userAnswer}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    checkCurrentAnswer();
                  }
                }}
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>
          {feedbackMessage && (
            <div className={`text-lg font-medium ${feedbackColor === "green" ? "text-green-600" : "text-red-600"}`}>
              {feedbackMessage}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((num) => (
            <button
              key={num}
              className="w-12 h-12 bg-white rounded-lg shadow-sm border border-gray-300 text-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => handleKeyboardInput(num)}
            >
              {num}
            </button>
          ))}
          <button
            className="w-12 h-12 bg-white rounded-lg shadow-sm border border-gray-300 text-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => handleKeyboardInput("backspace")}
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
          disabled={currentProblemIndex === 0 || waitingForContinue}
          onClick={moveToPreviousProblem}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('common.prev')}
        </Button>
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
            {!settings.showAnswerWithExplanation && (
              <TooltipContent>
                <p>{t('tooltips.activateShowAnswer')}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        {/* Condicional: botón check o botón continuar */}
        {waitingForContinue ? (
          <div className="relative">
            <Button 
              className="bg-green-500 hover:bg-green-600 min-w-[210px]"
              onClick={handleContinue}
            >
              Continuar
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            
            {/* Checkbox para auto-continuar */}
            <div 
              className="absolute right-0 -bottom-8 flex items-center space-x-2 bg-black bg-opacity-40 rounded-md px-2 py-1"
            >
              <Checkbox 
                id="autoContinue" 
                checked={autoContinue}
                onCheckedChange={(checked) => {
                  setAutoContinue(checked === true);
                }}
              />
              <label 
                htmlFor="autoContinue" 
                className="text-sm font-medium text-white"
              >
                Auto
              </label>
            </div>
          </div>
        ) : (
          <Button onClick={checkCurrentAnswer}>
            {exerciseStarted ? (
              <>
                {t('exercises.check')}
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>{t('exercises.start')}</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
