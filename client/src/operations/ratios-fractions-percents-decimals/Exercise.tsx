import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateRatiosFractionsPercentsDecimalsProblem, validateAnswer } from "./utils";
import { Problem, UserAnswer as UserAnswerType, RatiosFractionsPercentsDecimalsProblem, DifficultyLevel } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Info, RotateCcw } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations";

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
const digitBoxFocusStyle = "border-blue-500 ring-2 ring-blue-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300";

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Estados principales
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<RatiosFractionsPercentsDecimalsProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [problemsList, setProblemsList] = useState<RatiosFractionsPercentsDecimalsProblem[]>([]);
  const [userAnswersHistory, setUserAnswersHistory] = useState<(UserAnswerType | null)[]>([]);
  
  // Estados de entrada de dígitos
  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  
  // Estados de retroalimentación
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<string>("");
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  
  // Estados de temporizador
  const [timer, setTimer] = useState(0);
  const [problemStartTime, setProblemStartTime] = useState<number>(Date.now());
  const [currentAttempts, setCurrentAttempts] = useState(0);
  
  // Estados de configuración
  const [autoContinue, setAutoContinue] = useState(() => {
    try {
      const stored = localStorage.getItem('ratios-fractions-percents-decimals_autoContinue');
      return stored === 'true';
    } catch (e) { 
      return false; 
    }
  });

  // Referencias
  const waitingRef = useRef(false);
  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { saveExerciseResult } = useProgress();
  const { updateModuleSettings } = useSettings();
  const { t } = useTranslations();

  // Actualizar waitingRef cuando cambia waitingForContinue
  useEffect(() => {
    waitingRef.current = waitingForContinue;
  }, [waitingForContinue]);

  // Efecto para guardar autoContinue en localStorage
  useEffect(() => {
    localStorage.setItem('ratios-fractions-percents-decimals_autoContinue', autoContinue.toString());
  }, [autoContinue]);

  // Inicializar problemas
  useEffect(() => {
    if (problemsList.length === 0) {
      const problems: RatiosFractionsPercentsDecimalsProblem[] = [];
      for (let i = 0; i < settings.problemCount; i++) {
        const problem = generateRatiosFractionsPercentsDecimalsProblem(settings.difficulty as DifficultyLevel);
        problem.index = i;
        problem.total = settings.problemCount;
        problems.push(problem);
      }
      setProblemsList(problems);
      setUserAnswersHistory(new Array(settings.problemCount).fill(null));
    }
  }, [settings.problemCount, settings.difficulty, problemsList.length]);

  // Configurar problema actual
  useEffect(() => {
    if (problemsList.length > 0 && currentProblemIndex < problemsList.length) {
      const problem = problemsList[currentProblemIndex];
      setCurrentProblem(problem);
      setDigitAnswers(Array(problem.answerMaxDigits).fill(""));
      setFocusedDigitIndex(0);
      setCurrentAttempts(0);
      setFeedbackMessage(null);
    }
  }, [problemsList, currentProblemIndex]);

  // Temporizador general
  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted) {
      generalTimerRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else if (generalTimerRef.current) {
      clearInterval(generalTimerRef.current);
    }

    return () => {
      if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    };
  }, [exerciseStarted, exerciseCompleted]);

  const startExercise = () => {
    if (!exerciseStarted) {
      setExerciseStarted(true);
      setProblemStartTime(Date.now());
    }
  };

  const handleDigitInput = (value: string) => {
    if (waitingRef.current || !currentProblem || exerciseCompleted) return;
    if (!exerciseStarted) startExercise();

    let newAnswers = [...digitAnswers];
    let currentFocus = focusedDigitIndex;

    if (/[0-9]/.test(value) && currentFocus !== null) {
      newAnswers[currentFocus] = value;
      setDigitAnswers(newAnswers);
      
      // Avanzar al siguiente dígito
      if (currentFocus < currentProblem.answerMaxDigits - 1) {
        setFocusedDigitIndex(currentFocus + 1);
      }
    }
  };

  const handleBackspace = () => {
    if (waitingRef.current || exerciseCompleted) return;
    if (!exerciseStarted) startExercise();

    if (focusedDigitIndex === null || !currentProblem) return;
    
    let newAnswers = [...digitAnswers];
    
    if (newAnswers[focusedDigitIndex] !== "") {
      newAnswers[focusedDigitIndex] = "";
      setDigitAnswers(newAnswers);
    }
  };

  const checkCurrentAnswer = () => {
    if (!currentProblem || waitingRef.current) return;

    const userAnswer = parseFloat(digitAnswers.join(""));
    if (isNaN(userAnswer)) return;

    setCurrentAttempts(prev => prev + 1);

    if (validateAnswer(userAnswer, currentProblem.correctAnswer)) {
      // Respuesta correcta
      setFeedbackMessage("¡Correcto!");
      setFeedbackColor("green");
      setWaitingForContinue(true);

      // Registrar respuesta en el historial
      const answerEntry: UserAnswerType = {
        problemId: currentProblem.id,
        problem: {
          id: currentProblem.id,
          operands: currentProblem.operands.map(val => ({ value: val })),
          correctAnswer: currentProblem.correctAnswer,
          displayFormat: currentProblem.layout,
          difficulty: settings.difficulty as DifficultyLevel,
          allowDecimals: true,
          maxAttempts: settings.maxAttempts
        },
        userAnswer,
        isCorrect: true,
        status: 'correct',
        attempts: currentAttempts + 1,
        timestamp: Date.now()
      };

      setUserAnswersHistory(prev => {
        const newHistory = [...prev];
        newHistory[currentProblemIndex] = answerEntry;
        return newHistory;
      });

      // Auto-continuo
      if (autoContinue) {
        if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = setTimeout(() => {
          if (waitingRef.current) {
            handleContinue();
            autoContinueTimerRef.current = null;
          }
        }, 1500);
      }
    } else {
      // Respuesta incorrecta
      setFeedbackMessage("Incorrecto, intenta de nuevo");
      setFeedbackColor("red");
      
      if (currentAttempts + 1 >= settings.maxAttempts) {
        setWaitingForContinue(true);
      }
    }
  };

  const handleContinue = useCallback(() => {
    setWaitingForContinue(false);
    setFeedbackMessage(null);
    
    if (currentProblemIndex < problemsList.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setProblemStartTime(Date.now());
    } else {
      // Completar ejercicio
      setExerciseCompleted(true);
      if (generalTimerRef.current) clearInterval(generalTimerRef.current);
      
      // Guardar resultados
      const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;
      const accuracy = problemsList.length > 0 ? Math.round((correctCount / problemsList.length) * 100) : 0;
      
      saveExerciseResult({
        operationId: 'ratios-fractions-percents-decimals',
        date: new Date().toISOString(),
        score: correctCount,
        totalProblems: problemsList.length,
        timeSpent: timer,
        difficulty: settings.difficulty,
        accuracy,
        avgTimePerProblem: Math.round(timer / problemsList.length),
        avgAttempts: 1,
        revealedAnswers: 0
      });
    }
  }, [currentProblemIndex, problemsList.length, userAnswersHistory, timer, settings.difficulty, saveExerciseResult]);

  const resetExercise = () => {
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setCurrentProblemIndex(0);
    setProblemsList([]);
    setUserAnswersHistory([]);
    setTimer(0);
    setFeedbackMessage(null);
    setWaitingForContinue(false);
    
    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
  };

  const progress = problemsList.length > 0 ? ((currentProblemIndex + 1) / problemsList.length) * 100 : 0;

  if (!currentProblem && problemsList.length === 0 && !exerciseCompleted) {
    return <div className="p-8 text-center">Cargando problemas...</div>;
  }

  if (exerciseCompleted) {
    const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;
    const accuracy = problemsList.length > 0 ? Math.round((correctCount / problemsList.length) * 100) : 0;
    
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">¡Ejercicio Completado!</h1>
        <div className="space-y-4 mb-8">
          <div className="text-xl">Puntuación: {correctCount}/{problemsList.length}</div>
          <div className="text-lg">Precisión: {accuracy}%</div>
          <div className="text-lg">Tiempo total: {formatTime(timer)}</div>
        </div>
        <div className="space-x-4">
          <Button onClick={resetExercise}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Ratios, Fractions, Percents, Decimals</h1>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Problema {currentProblemIndex + 1} de {problemsList.length}</span>
            <span>Tiempo: {formatTime(timer)}</span>
          </div>
          <ProgressBarUI value={progress} className="w-full" />
        </div>

        {/* Problem Display */}
        {currentProblem && (
          <div className="bg-white rounded-lg p-8 shadow-lg mb-6">
            <div className="text-center text-2xl mb-8">
              <div className="mb-4">Resuelve el problema:</div>
              <div className="text-3xl font-mono">
                {currentProblem.operands[0]} ○ {currentProblem.operands[1]} = ?
              </div>
            </div>

            {/* Answer Input */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                {Array.from({ length: currentProblem.answerMaxDigits }, (_, index) => (
                  <div
                    key={index}
                    className={`${digitBoxBaseStyle} ${
                      focusedDigitIndex === index ? digitBoxFocusStyle : digitBoxBlurStyle
                    }`}
                    onClick={() => setFocusedDigitIndex(index)}
                  >
                    {digitAnswers[index] || ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback */}
            {feedbackMessage && (
              <div className={`text-center text-lg font-semibold mb-4 ${
                feedbackColor === 'green' ? 'text-green-600' : 'text-red-600'
              }`}>
                {feedbackMessage}
              </div>
            )}
          </div>
        )}

        {/* Number Pad */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, index) => (
              <Button
                key={num}
                variant="outline"
                size="lg"
                onClick={() => handleDigitInput(num.toString())}
                disabled={waitingRef.current || exerciseCompleted}
                className={`h-12 text-xl ${index === 9 ? 'col-start-2' : ''}`}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              onClick={handleBackspace}
              disabled={waitingRef.current || exerciseCompleted}
              className="h-12"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {waitingForContinue ? (
            <Button 
              onClick={handleContinue} 
              disabled={exerciseCompleted}
              className="w-full sm:w-auto px-6 text-lg bg-green-500 hover:bg-green-600 text-white h-12"
            >
              <span className="flex-grow text-center font-medium">Continuar</span>
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
                      <span className="text-xs font-medium">Auto</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{autoContinue ? 'Desactivar auto-continuo' : 'Activar auto-continuo'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>
          ) : (
            <Button 
              onClick={checkCurrentAnswer} 
              disabled={exerciseCompleted || waitingRef.current} 
              className="w-full sm:w-auto px-6 text-lg bg-blue-500 hover:bg-blue-600 text-white h-12"
            >
              {!exerciseStarted ? 'Comenzar' : <>
                <Check className="mr-2 h-4 w-4" />
                Verificar
              </>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}