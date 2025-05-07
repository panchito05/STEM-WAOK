import { useState, useEffect, useRef } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { generateFractionProblem, checkAnswer } from "./utils";
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
  const [userNumerator, setUserNumerator] = useState("");
  const [userDenominator, setUserDenominator] = useState("");
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timer, setTimer] = useState(0);
  const [problemTimer, setProblemTimer] = useState(0); // Temporizador para el problema actual
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | null>(null);
  const [currentAttempts, setCurrentAttempts] = useState(0); // Contador para intentos en el problema actual
  const [showingExplanation, setShowingExplanation] = useState(false);
  const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0); // Contador para respuestas incorrectas
  const [revealedAnswersCount, setRevealedAnswersCount] = useState(0); // Contador para respuestas reveladas
  const [showHelpButton, setShowHelpButton] = useState(false); // Control si mostramos el botón de ayuda
  
  const numeratorRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const problemTimerRef = useRef<number | null>(null); // Referencia para el temporizador del problema
  const { saveExerciseResult } = useProgress();
  const { t } = useTranslations();

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
  
  // Timer logic for per-problem time limit
  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted && settings.timeValue > 0) {
      // Reiniciar el temporizador de problema cuando cambia el problema actual
      setProblemTimer(settings.timeValue);
      
      // Iniciar un nuevo temporizador para el problema actual
      problemTimerRef.current = window.setInterval(() => {
        setProblemTimer(prev => {
          if (prev <= 0) {
            // Si el temporizador llega a cero, verificar los intentos
            setCurrentAttempts(newAttempts => {
              // Si hemos alcanzado el máximo de intentos o no hay límite, registrar como incorrecto y avanzar
              if (newAttempts >= settings.maxAttempts - 1 || settings.maxAttempts === 0) {
                // Limpiar el temporizador
                if (problemTimerRef.current) {
                  clearInterval(problemTimerRef.current);
                }
                
                setFeedbackMessage("¡Tiempo agotado!");
                setFeedbackColor("red");
                
                // Guardar la respuesta como incorrecta
                const answer: UserAnswer = {
                  problem: currentProblem,
                  userNumerator: parseInt(userNumerator) || 0,
                  userDenominator: parseInt(userDenominator) || 1,
                  isCorrect: false
                };
                
                setAnswers(prev => [...prev, answer]);
                
                // Si está habilitada la compensación, incrementar contador
                if (settings.enableCompensation) {
                  setIncorrectAnswersCount(prev => prev + 1);
                }
                
                // Avanzar al siguiente problema después de un breve retraso
                setTimeout(() => {
                  setFeedbackMessage(null);
                  setFeedbackColor(null);
                  moveToNextProblem();
                }, 2000);
              } else {
                // Si aún no hemos agotado todos los intentos, reiniciamos el temporizador
                setTimeout(() => {
                  setFeedbackMessage("¡Tiempo agotado! Intenta de nuevo.");
                  setFeedbackColor("red");
                  
                  // Iniciamos un nuevo temporizador
                  setProblemTimer(settings.timeValue);
                  problemTimerRef.current = window.setInterval(() => {
                    setProblemTimer(p => p > 0 ? p - 1 : 0);
                  }, 1000);
                  
                  // Limpiar el mensaje después de un momento
                  setTimeout(() => {
                    setFeedbackMessage(null);
                    setFeedbackColor(null);
                  }, 1500);
                }, 500);
              }
              
              return newAttempts + 1;
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
    if (numeratorRef.current) {
      numeratorRef.current.focus();
    }
  }, [currentProblemIndex]);

  const generateProblems = () => {
    const newProblems: Problem[] = [];
    
    for (let i = 0; i < settings.problemCount; i++) {
      newProblems.push(generateFractionProblem(settings.difficulty));
    }
    
    setProblems(newProblems);
    setCurrentProblemIndex(0);
    setUserNumerator("");
    setUserDenominator("");
    setAnswers([]);
    setTimer(0);
    setProblemTimer(settings.timeValue); // Inicializar el temporizador del problema con el valor configurado
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setFeedbackMessage(null);
    setFeedbackColor(null);
    setShowingExplanation(false);
    setCurrentAttempts(0); // Reiniciamos el contador de intentos actuales
    setIncorrectAnswersCount(0); // Reiniciamos el contador de respuestas incorrectas
    setRevealedAnswersCount(0); // Reiniciamos el contador de respuestas reveladas
  };

  const startExercise = () => {
    setExerciseStarted(true);
    if (numeratorRef.current) {
      numeratorRef.current.focus();
    }
  };

  const handleNumeratorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserNumerator(e.target.value);
  };

  const handleDenominatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserDenominator(e.target.value);
  };

  const handleKeyboardInput = (value: string, target: "numerator" | "denominator") => {
    if (value === "backspace") {
      if (target === "numerator") {
        setUserNumerator(prev => prev.slice(0, -1));
      } else {
        setUserDenominator(prev => prev.slice(0, -1));
      }
    } else if (value === "negative") {
      if (target === "numerator") {
        setUserNumerator(prev => prev.startsWith("-") ? prev.substring(1) : "-" + prev);
      } else {
        setUserDenominator(prev => prev.startsWith("-") ? prev.substring(1) : "-" + prev);
      }
    } else {
      // Limit input to reasonable length
      if (target === "numerator" && userNumerator.length < 3) {
        setUserNumerator(prev => prev + value);
      } else if (target === "denominator" && userDenominator.length < 3) {
        setUserDenominator(prev => prev + value);
      }
    }
  };

  const checkCurrentAnswer = () => {
    if (!exerciseStarted) {
      startExercise();
      return;
    }
    
    // Validate inputs
    if (!userNumerator || !userDenominator || parseInt(userDenominator) === 0) {
      setFeedbackMessage("Invalid input. Denominator cannot be zero.");
      setFeedbackColor("red");
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackColor(null);
      }, 1500);
      return;
    }
    
    const currentProblem = problems[currentProblemIndex];
    const userNum = parseInt(userNumerator);
    const userDenom = parseInt(userDenominator);
    
    const isCorrect = checkAnswer(currentProblem, userNum, userDenom);
    
    // Save the answer
    const answer: UserAnswer = {
      problem: currentProblem,
      userNumerator: userNum,
      userDenominator: userDenom,
      isCorrect
    };
    
    setAnswers(prev => [...prev, answer]);
    
    // Show feedback if enabled
    if (settings.showImmediateFeedback) {
      setFeedbackMessage(isCorrect ? "Correct!" : "Incorrect!");
      setFeedbackColor(isCorrect ? "green" : "red");
      
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackColor(null);
        moveToNextProblem();
      }, 1000);
    } else {
      moveToNextProblem();
    }
  };

  const moveToNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setUserNumerator("");
      setUserDenominator("");
    } else {
      completeExercise();
    }
  };

  const moveToPreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1);
      // Set the input to the previously entered answer if available
      const previousAnswer = answers[currentProblemIndex - 1];
      if (previousAnswer) {
        setUserNumerator(previousAnswer.userNumerator.toString());
        setUserDenominator(previousAnswer.userDenominator.toString());
      } else {
        setUserNumerator("");
        setUserDenominator("");
      }
    }
  };

  const showAnswerWithExplanation = () => {
    if (!exerciseStarted) {
      startExercise();
    }
    
    // Siempre permitimos mostrar la respuesta cuando showAnswerWithExplanation está activado
    setShowingExplanation(true);
    const currentProblem = problems[currentProblemIndex];
    
    // Si está habilitada la compensación, incrementar contador
    if (settings.enableCompensation) {
      setRevealedAnswersCount(prev => prev + 1);
    }
    
    // Después de un tiempo, reiniciar el estado para seguir con el ejercicio
    setTimeout(() => {
      setShowingExplanation(false);
    }, 5000); // La explicación se muestra durante 5 segundos
  };
  
  const completeExercise = () => {
    setExerciseCompleted(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (problemTimerRef.current) {
      clearInterval(problemTimerRef.current);
    }
    
    // Calculate score
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    
    // Save results
    saveExerciseResult({
      operationId: "fractions",
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

  const renderProblem = () => {
    switch (currentProblem.type) {
      case "addition":
        return (
          <div className="flex items-baseline justify-center">
            <div className="flex flex-col items-center mr-4">
              <span className="text-center">{currentProblem.fraction1.numerator}</span>
              <div className="w-8 h-px bg-black my-1"></div>
              <span className="text-center">{currentProblem.fraction1.denominator}</span>
            </div>
            <span className="mx-2">+</span>
            <div className="flex flex-col items-center ml-4 mr-8">
              <span className="text-center">{currentProblem.fraction2.numerator}</span>
              <div className="w-8 h-px bg-black my-1"></div>
              <span className="text-center">{currentProblem.fraction2.denominator}</span>
            </div>
            <span className="mx-2">=</span>
            <div className="flex flex-col items-center ml-4">
              <Input
                type="text"
                ref={numeratorRef}
                className="w-16 text-center h-8 px-2 mb-1"
                value={userNumerator}
                onChange={handleNumeratorChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    document.getElementById("denominator-input")?.focus();
                  }
                }}
                pattern="-?[0-9]*"
                inputMode="numeric"
              />
              <div className="w-16 h-px bg-black my-1"></div>
              <Input
                id="denominator-input"
                type="text"
                className="w-16 text-center h-8 px-2 mt-1"
                value={userDenominator}
                onChange={handleDenominatorChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    checkCurrentAnswer();
                  }
                }}
                pattern="-?[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>
        );
      case "subtraction":
        return (
          <div className="flex items-baseline justify-center">
            <div className="flex flex-col items-center mr-4">
              <span className="text-center">{currentProblem.fraction1.numerator}</span>
              <div className="w-8 h-px bg-black my-1"></div>
              <span className="text-center">{currentProblem.fraction1.denominator}</span>
            </div>
            <span className="mx-2">-</span>
            <div className="flex flex-col items-center ml-4 mr-8">
              <span className="text-center">{currentProblem.fraction2.numerator}</span>
              <div className="w-8 h-px bg-black my-1"></div>
              <span className="text-center">{currentProblem.fraction2.denominator}</span>
            </div>
            <span className="mx-2">=</span>
            <div className="flex flex-col items-center ml-4">
              <Input
                type="text"
                ref={numeratorRef}
                className="w-16 text-center h-8 px-2 mb-1"
                value={userNumerator}
                onChange={handleNumeratorChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    document.getElementById("denominator-input")?.focus();
                  }
                }}
                pattern="-?[0-9]*"
                inputMode="numeric"
              />
              <div className="w-16 h-px bg-black my-1"></div>
              <Input
                id="denominator-input"
                type="text"
                className="w-16 text-center h-8 px-2 mt-1"
                value={userDenominator}
                onChange={handleDenominatorChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    checkCurrentAnswer();
                  }
                }}
                pattern="-?[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>
        );
      case "comparison":
        return (
          <div className="flex items-baseline justify-center">
            <div className="flex flex-col items-center mr-4">
              <span className="text-center">{currentProblem.fraction1.numerator}</span>
              <div className="w-8 h-px bg-black my-1"></div>
              <span className="text-center">{currentProblem.fraction1.denominator}</span>
            </div>
            <span className="mx-6">and</span>
            <div className="flex flex-col items-center ml-4">
              <span className="text-center">{currentProblem.fraction2.numerator}</span>
              <div className="w-8 h-px bg-black my-1"></div>
              <span className="text-center">{currentProblem.fraction2.denominator}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
          <h2 className="text-xl font-bold text-gray-900">Fractions Exercise</h2>
          <p className="text-sm text-gray-500">
            {currentProblem.type === "addition" && "Add the fractions and simplify your answer."}
            {currentProblem.type === "subtraction" && "Subtract the fractions and simplify your answer."}
            {currentProblem.type === "comparison" && "Compare the fractions and select the correct relation."}
          </p>
        </div>
        <div className="flex items-center">
          {/* Temporizador total */}
          <span className="mr-4 text-sm text-gray-500">
            <span className="inline-flex items-center" title="Total time">
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
          
          {/* Temporizador por problema (si está habilitado) */}
          {settings.timeValue > 0 && settings.timeLimit === "per-problem" && (
            <span className="mr-4 text-sm text-gray-500">
              <span className="inline-flex items-center rounded-md px-2 py-1 bg-blue-50 text-blue-800" title="Time per problem">
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
                    d="M12 6v6h4m8 0a10 10 0 11-20 0 10 10 0 0120 0z"
                  />
                </svg>
                {problemTimer}s
              </span>
            </span>
          )}
          
          {/* Botón de configuración */}
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
      </div>

      <div className="p-6 bg-gray-50 rounded-lg mb-6">
        <div className="text-center">
          <div className={`text-3xl font-bold mb-6 ${feedbackMessage ? (feedbackColor === "green" ? "text-green-600" : "text-red-600") : ""}`}>
            {renderProblem()}
          </div>
          {feedbackMessage && (
            <div className={`text-lg font-medium ${feedbackColor === "green" ? "text-green-600" : "text-red-600"}`}>
              {feedbackMessage}
            </div>
          )}
          
          {currentProblem.type === "comparison" && (
            <div className="flex justify-center space-x-4 mt-6">
              <Button 
                variant="outline"
                className="w-12 h-12 text-xl"
                onClick={() => {
                  setUserNumerator("1");
                  setUserDenominator("1");
                  checkCurrentAnswer();
                }}
              >
                =
              </Button>
              <Button 
                variant="outline"
                className="w-12 h-12 text-xl"
                onClick={() => {
                  setUserNumerator("2");
                  setUserDenominator("1");
                  checkCurrentAnswer();
                }}
              >
                &gt;
              </Button>
              <Button 
                variant="outline"
                className="w-12 h-12 text-xl"
                onClick={() => {
                  setUserNumerator("0");
                  setUserDenominator("1");
                  checkCurrentAnswer();
                }}
              >
                &lt;
              </Button>
            </div>
          )}
          
          {(currentProblem.type === "addition" || currentProblem.type === "subtraction") && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Enter your simplified answer</h3>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <p className="text-xs mb-1">Numerator</p>
                  <div className="flex space-x-2">
                    {["-", "1", "2", "3"].map((num) => (
                      <button
                        key={`num-${num}`}
                        className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-300 text-base font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={() => handleKeyboardInput(num === "-" ? "negative" : num, "numerator")}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    {["4", "5", "6", "←"].map((num) => (
                      <button
                        key={`num-${num}`}
                        className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-300 text-base font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={() => handleKeyboardInput(num === "←" ? "backspace" : num, "numerator")}
                      >
                        {num === "←" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mx-auto"
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
                        ) : (
                          num
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <p className="text-xs mb-1">Denominator</p>
                  <div className="flex space-x-2">
                    {["1", "2", "3", "4"].map((num) => (
                      <button
                        key={`denom-${num}`}
                        className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-300 text-base font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={() => handleKeyboardInput(num, "denominator")}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    {["5", "6", "8", "←"].map((num) => (
                      <button
                        key={`denom-${num}`}
                        className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-300 text-base font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={() => handleKeyboardInput(num === "←" ? "backspace" : num, "denominator")}
                      >
                        {num === "←" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mx-auto"
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
                        ) : (
                          num
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={currentProblemIndex === 0}
          onClick={moveToPreviousProblem}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {/* Botón de ayuda con explicación (si está habilitado) */}
          {settings.showAnswerWithExplanation && !showingExplanation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={showAnswerWithExplanation}
                    className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    Ayuda
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Muestra la respuesta con explicación")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {currentProblem.type !== "comparison" && (
            <Button onClick={checkCurrentAnswer}>
              {exerciseStarted ? (
                <>
                  Check Answer
                  <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Start Exercise"
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Mostrar respuesta con explicación */}
      {showingExplanation && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <h3 className="font-medium text-amber-800 mb-2">Respuesta correcta:</h3>
          {currentProblem.type === "addition" && (
            <div className="text-sm text-amber-700">
              <p className="mb-2">Para sumar fracciones con diferentes denominadores, encontramos un denominador común:</p>
              <p className="mb-1">
                {currentProblem.fraction1.numerator}/{currentProblem.fraction1.denominator} + {currentProblem.fraction2.numerator}/{currentProblem.fraction2.denominator}
              </p>
              <p>La respuesta simplificada es {currentProblem.correctAnswer.numerator}/{currentProblem.correctAnswer.denominator}</p>
            </div>
          )}
          {currentProblem.type === "subtraction" && (
            <div className="text-sm text-amber-700">
              <p className="mb-2">Para restar fracciones con diferentes denominadores, encontramos un denominador común:</p>
              <p className="mb-1">
                {currentProblem.fraction1.numerator}/{currentProblem.fraction1.denominator} - {currentProblem.fraction2.numerator}/{currentProblem.fraction2.denominator}
              </p>
              <p>La respuesta simplificada es {currentProblem.correctAnswer.numerator}/{currentProblem.correctAnswer.denominator}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
