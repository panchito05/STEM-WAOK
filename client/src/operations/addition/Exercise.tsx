import { useState, useEffect, useRef } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { generateAdditionProblem, checkAnswer } from "./utils";
import { Problem, UserAnswer } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations";

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
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | null>(null);
  const [showHelpButton, setShowHelpButton] = useState(false); // Control si mostramos el botón de ayuda
  const [showingExplanation, setShowingExplanation] = useState(false);
  const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0); // Contador para respuestas incorrectas
  const [revealedAnswersCount, setRevealedAnswersCount] = useState(0); // Contador para respuestas reveladas
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(settings.difficulty); // Dificultad adaptiva
  const [currentAttempts, setCurrentAttempts] = useState(0); // Contador para intentos en el problema actual
  const [showReward, setShowReward] = useState(false); // Estado para mostrar la recompensa
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const { saveExerciseResult } = useProgress();
  const { t } = useTranslations();

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

  // Focus input when current problem changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentProblemIndex]);

  const generateProblems = () => {
    const newProblems: Problem[] = [];
    
    for (let i = 0; i < settings.problemCount; i++) {
      newProblems.push(generateAdditionProblem(settings.difficulty));
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
    setIncorrectAnswersCount(0); // Reiniciamos el contador de respuestas incorrectas
    setRevealedAnswersCount(0); // Reiniciamos el contador de respuestas reveladas
    setAdaptiveDifficulty(settings.difficulty); // Reiniciamos la dificultad adaptativa
    setCurrentAttempts(0); // Reiniciamos el contador de intentos actuales
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
      const correctAnswer = currentProblem.num1 + currentProblem.num2;
      
      setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${correctAnswer}`);
      setFeedbackColor("green");
  
      // Incrementar contador de respuestas reveladas si está habilitada la compensación
      if (settings.enableCompensation) {
        setRevealedAnswersCount(prev => prev + 1);
      }
      
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
      
      // Ajustar dificultad adaptativamente si está habilitada esa opción
      if (settings.enableAdaptiveDifficulty) {
        // Si lleva 3 respuestas correctas seguidas, aumentar dificultad
        const lastThreeAnswers = [...answers, answer].slice(-3);
        if (lastThreeAnswers.length === 3 && lastThreeAnswers.every(a => a.isCorrect)) {
          // Aumentar dificultad (si no está ya en el nivel máximo)
          const difficulties: string[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
          const currentIndex = difficulties.indexOf(adaptiveDifficulty);
          if (currentIndex < difficulties.length - 1) {
            setAdaptiveDifficulty(difficulties[currentIndex + 1] as "beginner" | "elementary" | "intermediate" | "advanced" | "expert");
          }
        }
      }
      
      // Mostrar feedback de respuesta correcta
      setFeedbackMessage(t('exercises.correct'));
      setFeedbackColor("green");
      
      // Mostrar recompensa si está habilitado
      if (settings.enableRewards) {
        setShowReward(true);
        setTimeout(() => {
          setShowReward(false);
          setFeedbackMessage(null);
          setFeedbackColor(null);
          moveToNextProblem();
        }, 1500);
      } else {
        setTimeout(() => {
          setFeedbackMessage(null);
          setFeedbackColor(null);
          moveToNextProblem();
        }, 1000);
      }
    } 
    // Si la respuesta es incorrecta...
    else {
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
        
        setAnswers(prev => [...prev, answer]);
        
        // Incrementar contador de respuestas incorrectas si está habilitada la compensación
        if (settings.enableCompensation) {
          setIncorrectAnswersCount(prev => prev + 1);
        }
        
        // Ajustar dificultad adaptativamente si está habilitada esa opción
        if (settings.enableAdaptiveDifficulty) {
          // Si lleva 2 respuestas incorrectas seguidas, disminuir dificultad
          const lastTwoAnswers = [...answers, answer].slice(-2);
          if (lastTwoAnswers.length === 2 && lastTwoAnswers.every(a => !a.isCorrect)) {
            // Disminuir dificultad (si no está ya en el nivel mínimo)
            const difficulties: string[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
            const currentIndex = difficulties.indexOf(adaptiveDifficulty);
            if (currentIndex > 0) {
              setAdaptiveDifficulty(difficulties[currentIndex - 1] as "beginner" | "elementary" | "intermediate" | "advanced" | "expert");
            }
          }
        }
        
        // Esperar un momento para mostrar el mensaje de respuesta incorrecta
        setTimeout(() => {
          // Luego mostrar la respuesta correcta
          const correctAnswer = currentProblem.num1 + currentProblem.num2;
          setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${correctAnswer}`);
          setFeedbackColor("green");
          
          // Y finalmente avanzar al siguiente problema
          setTimeout(() => {
            setFeedbackMessage(null);
            setFeedbackColor(null);
            moveToNextProblem();
          }, 2000); // Mayor tiempo para leer la respuesta correcta
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
      setShowingExplanation(false);
      setFeedbackMessage(null);
      setFeedbackColor(null);
      setCurrentAttempts(0); // Reiniciamos el contador de intentos para el nuevo problema
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
      setShowingExplanation(false);
      setFeedbackMessage(null);
      setFeedbackColor(null);
    }
  };

  const completeExercise = () => {
    // Verificar si necesitamos añadir problemas de compensación
    if (settings.enableCompensation && (incorrectAnswersCount > 0 || revealedAnswersCount > 0)) {
      const compensationProblemsNeeded = incorrectAnswersCount + revealedAnswersCount;
      
      if (compensationProblemsNeeded > 0) {
        // Crear nuevos problemas de compensación
        const newProblems: Problem[] = [];
        
        for (let i = 0; i < compensationProblemsNeeded; i++) {
          // Usamos la dificultad adaptativa si está habilitada, o la configurada si no
          const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty;
          newProblems.push(generateAdditionProblem(difficultyToUse));
        }
        
        // Añadir estos problemas a la lista existente
        setProblems(prev => [...prev, ...newProblems]);
        
        // Mostrar mensaje informativo sobre problemas adicionales
        setFeedbackMessage(`Añadidos ${compensationProblemsNeeded} problemas de compensación`);
        setFeedbackColor("green");
        
        // Reiniciar los contadores
        setIncorrectAnswersCount(0);
        setRevealedAnswersCount(0);
        
        // Continuar con el ejercicio en lugar de completarlo
        setTimeout(() => {
          setFeedbackMessage(null);
          setFeedbackColor(null);
        }, 2000);
        
        return; // No completamos el ejercicio todavía
      }
    }
    
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
          {/* Mostrar recompensa cuando corresponda */}
          {showReward && settings.enableRewards && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 animate-bounce">
              {settings.rewardType === "stars" && (
                <div className="flex">
                  {[...Array(3)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-16 w-16 text-yellow-400 drop-shadow-lg"
                      fill="yellow" 
                    />
                  ))}
                </div>
              )}
              {settings.rewardType === "medals" && (
                <div className="flex">
                  <Award 
                    className="h-24 w-24 text-yellow-600 drop-shadow-lg" 
                    fill="gold"
                  />
                </div>
              )}
              {settings.rewardType === "trophies" && (
                <div className="flex">
                  <Trophy 
                    className="h-24 w-24 text-yellow-500 drop-shadow-lg" 
                    fill="gold"
                  />
                </div>
              )}
            </div>
          )}
        
          <div className={`text-3xl font-bold mb-6 flex justify-center items-baseline ${feedbackMessage ? (feedbackColor === "green" ? "text-green-600" : "text-red-600") : ""}`}>
            <span className="text-right w-16">{currentProblem.num1}</span>
            <span className="mx-4">+</span>
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
      </div>
    </div>
  );
}
