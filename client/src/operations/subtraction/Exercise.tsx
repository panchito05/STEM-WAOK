import { useState, useEffect, useRef } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { generateSubtractionProblem, checkAnswer } from "./utils";
import { Problem, UserAnswer } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations";

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
  
  // Nuevos estados para las funcionalidades solicitadas
  const [waitingForContinue, setWaitingForContinue] = useState(false); // Controla si estamos esperando a que el usuario haga clic en "Continuar"
  const [showingReview, setShowingReview] = useState(false); // Controla si estamos mostrando la pantalla de revisión
  const [isReviewing, setIsReviewing] = useState(false); // Controla si estamos revisando un problema anterior
  const [reviewIndex, setReviewIndex] = useState(0); // Índice del problema que estamos revisando
  const [problemTimes, setProblemTimes] = useState<number[]>([]); // Tiempos para cada problema
  const [problemStartTime, setProblemStartTime] = useState(0); // Tiempo de inicio del problema actual
  const [problemAttempts, setProblemAttempts] = useState<number[]>([]); // Intentos para cada problema
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const { saveExerciseResult } = useProgress();

  // Generate problems when settings change or initially
  useEffect(() => {
    generateProblems();
  }, [settings]);

  // Timer logic
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
  
  // Registro del tiempo por problema
  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted && !waitingForContinue && !showingReview) {
      // Registrar tiempo de inicio para el problema actual
      setProblemStartTime(timer);
    }
  }, [currentProblemIndex, exerciseStarted, exerciseCompleted, waitingForContinue, showingReview, timer]);

  // Focus input when current problem changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentProblemIndex]);

  const generateProblems = () => {
    const newProblems: Problem[] = [];
    
    for (let i = 0; i < settings.problemCount; i++) {
      newProblems.push(generateSubtractionProblem(settings.difficulty));
    }
    
    setProblems(newProblems);
    setCurrentProblemIndex(0);
    setUserAnswer("");
    setAnswers([]);
    setTimer(0);
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setFeedbackMessage(null);
    setFeedbackColor(null);
    setShowingExplanation(false);
    setShowHelpButton(false); // Reiniciamos el estado del botón de ayuda
    setCurrentAttempts(0); // Reiniciamos el contador de intentos
    setConsecutiveCorrectAnswers(0); // Reiniciamos el contador de respuestas correctas consecutivas
    setRewardsShownIndices([]); // Reiniciamos el registro de índices donde se mostraron recompensas
    setTotalRewardsShown(0); // Reiniciamos el contador total de recompensas mostradas
    
    // Reiniciar los nuevos estados
    setWaitingForContinue(false);
    setShowingReview(false);
    setReviewIndex(0);
    setProblemTimes([]);
    setProblemStartTime(0);
    setProblemAttempts([]);
  };

  const showAnswerWithExplanation = () => {
    if (!exerciseStarted) {
      startExercise();
    }
    
    // Solo se puede revelar la respuesta si hemos alcanzado el número máximo de intentos
    // o si el maxAttempts está configurado a 0 (sin límite)
    if (settings.maxAttempts === 0 || currentAttempts >= settings.maxAttempts) {
      setShowingExplanation(true);
      const currentProblem = problems[currentProblemIndex];
      const correctAnswer = currentProblem.num1 - currentProblem.num2;
      
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
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
  };

  const handleKeyboardInput = (value: string) => {
    if (value === "backspace") {
      setUserAnswer(prev => prev.slice(0, -1));
    } else if (value === "negative") {
      setUserAnswer(prev => prev.startsWith("-") ? prev.substring(1) : "-" + prev);
    } else {
      // Limit input to 3 digits which should be enough for math problems at this level
      if (userAnswer.replace("-", "").length < 3) {
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
    
    // Si la respuesta es correcta, guardamos la respuesta y esperamos a que el usuario presione "Continuar"
    if (isCorrect) {
      // Calcular tiempo empleado en el problema actual
      const timeSpent = timer - problemStartTime;
      
      // Save the answer
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
    // Si la respuesta es incorrecta...
    else {
      // Reiniciar el contador de respuestas correctas consecutivas
      setConsecutiveCorrectAnswers(0);
      
      // Verificar si hemos alcanzado el máximo de intentos permitidos
      const maxAttemptsReached = settings.maxAttempts > 0 && newAttemptCount >= settings.maxAttempts;
      
      // Mostrar mensaje de respuesta incorrecta
      setFeedbackMessage(t('exercises.incorrect'));
      setFeedbackColor("red");
      
      // Si hemos alcanzado el máximo de intentos, mostrar la respuesta correcta y esperar a Continuar
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
        
        // Esperar un momento para mostrar el mensaje de respuesta incorrecta
        setTimeout(() => {
          // Luego mostrar la respuesta correcta
          const correctAnswer = currentProblem.num1 - currentProblem.num2;
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
  
  // Función para continuar al siguiente problema después de esperar la acción del usuario
  const handleContinue = () => {
    setShowReward(false);
    setFeedbackMessage(null);
    setFeedbackColor(null);
    setWaitingForContinue(false);
    moveToNextProblem();
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

  const moveToNextProblem = () => {
    // Si estamos en modo revisión, salimos del modo primero
    if (isReviewing) {
      setIsReviewing(false);
    }
    
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setUserAnswer("");
      setShowingExplanation(false); // Restablecemos la explicación al pasar al siguiente problema
      setFeedbackMessage(null);
      setFeedbackColor(null);
      setCurrentAttempts(0); // Reiniciamos el contador de intentos para el nuevo problema
    } else {
      completeExercise();
    }
  };

  const moveToPreviousProblem = () => {
    if (currentProblemIndex > 0) {
      // Marcar que estamos en modo revisión
      setIsReviewing(true);
      
      // Ir al problema anterior
      setCurrentProblemIndex(prev => prev - 1);
      
      // Obtener la respuesta del problema anterior
      const previousAnswer = answers[currentProblemIndex - 1];
      if (previousAnswer) {
        setUserAnswer(previousAnswer.userAnswer.toString());
        
        // Mostrar retroalimentación apropiada
        if (previousAnswer.isCorrect) {
          setFeedbackMessage(t('exercises.correct'));
          setFeedbackColor("green");
        } else {
          setFeedbackMessage(t('exercises.incorrect') + ". " + 
                            t('exercises.correctAnswerIs') + " " + 
                            (previousAnswer.problem.num1 - previousAnswer.problem.num2));
          setFeedbackColor("red");
        }
      }
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
      operationId: "subtraction",
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
              <span className="mx-4">-</span>
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
                      {answer.problem.num1 - answer.problem.num2}
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
                    {answer.problem.num1} - {answer.problem.num2}
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
                        {answer.problem.num1 - answer.problem.num2}
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
          <h2 className="text-xl font-bold text-gray-900">Subtraction Exercise</h2>
          <p className="text-sm text-gray-500">Solve the following subtraction problems</p>
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
          <span>{t('exercises.problem')} {currentProblemIndex + 1} {t('exercises.of')} {problems.length}</span>
          <span>{t('exercises.score')}: {score}/{answers.length}</span>
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
          {isReviewing ? (
            // Modo de revisión: Mostrar la respuesta sin posibilidad de cambiar
            <div className="mb-4">
              <div className="text-center mb-2">
                <div className="text-gray-600 text-sm font-medium mb-2">Revisando Problema {currentProblemIndex + 1}</div>
              </div>
              <div className={`text-3xl font-bold mb-6 flex justify-center items-baseline`}>
                <span className="text-right w-16">{currentProblem.num1}</span>
                <span className="mx-4">-</span>
                <span className="text-right w-16">{currentProblem.num2}</span>
                <span className="mx-4">=</span>
                <span className="w-16 text-right">
                  <span className={feedbackColor === "green" ? "text-green-600" : "text-red-600"}>
                    {userAnswer}
                  </span>
                </span>
              </div>
              
              <div className="flex justify-between items-center my-4 px-4 text-sm">
                <div className="text-gray-600">
                  <div>Nivel: {settings.difficulty}</div>
                  <div>Intentos: {problemAttempts[currentProblemIndex] || 0}</div>
                </div>
                <div className="text-gray-600">
                  <div>Tiempo: {formatTime(problemTimes[currentProblemIndex] || 0)}</div>
                </div>
              </div>
            </div>
          ) : (
            // Modo normal: Mostrar el problema con posibilidad de responder
            <div className={`text-3xl font-bold mb-6 flex justify-center items-baseline ${feedbackMessage ? (feedbackColor === "green" ? "text-green-600" : "text-red-600") : ""}`}>
              <span className="text-right w-16">{currentProblem.num1}</span>
              <span className="mx-4">-</span>
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
                  pattern="-?[0-9]*"
                  inputMode="numeric"
                  readOnly={isReviewing}
                />
              </div>
            </div>
          )}
          
          {feedbackMessage && (
            <div className={`text-lg font-medium ${feedbackColor === "green" ? "text-green-600" : "text-red-600"}`}>
              {feedbackMessage}
            </div>
          )}
          
          {/* Visualización de recompensas */}
          {showReward && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 animate-fadeIn">
              <div className="p-8 bg-white rounded-lg shadow-xl transform animate-scaleIn text-center">
                <h3 className="text-2xl font-bold mb-4 text-purple-600">¡Felicidades!</h3>
                
                {rewardType === "medals" && (
                  <div className="mb-6 text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="mt-2 text-xl">¡Has ganado una medalla!</p>
                  </div>
                )}
                
                {rewardType === "trophies" && (
                  <div className="mb-6 text-yellow-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="mt-2 text-xl">¡Has ganado un trofeo!</p>
                  </div>
                )}
                
                {rewardType === "stars" && (
                  <div className="mb-6 text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto animate-spin-slow" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="mt-2 text-xl">¡Has ganado una estrella!</p>
                  </div>
                )}
                
                <p className="text-gray-600">Sigue así, ¡vas muy bien!</p>
              </div>
            </div>
          )}
        </div>

        {/* No mostrar el teclado virtual en modo revisión */}
        {!isReviewing && (
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
              onClick={() => handleKeyboardInput("negative")}
            >
              +/-
            </button>
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
        )}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          // Habilitar el botón solo cuando haya un problema anterior y no estemos esperando "Continuar"
          disabled={currentProblemIndex === 0}
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
                disabled={!settings.showAnswerWithExplanation || (settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts)}
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
            ) : settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts ? (
              <TooltipContent>
                <p>Debes agotar los {settings.maxAttempts} intentos primero</p>
              </TooltipContent>
            ) : null}
          </Tooltip>
        </TooltipProvider>
        
        {waitingForContinue ? (
          // Botón Continuar con color verde
          <Button 
            variant="default"
            className="bg-green-600 hover:bg-green-700" 
            onClick={handleContinue}
          >
            Continuar
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          // Botón Check Answer
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
