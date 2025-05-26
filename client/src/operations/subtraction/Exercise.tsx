import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Settings, Timer, CheckCircle, SkipForward, Lightbulb, RotateCcw } from "lucide-react";
import { ModuleSettings } from "@/context/SettingsContext";
import type { SubtractionProblem } from './types';
import { 
  generateSubtractionProblem, 
  validateSubtractionAnswer, 
  formatNumberForDisplay,
  getVerticalAlignmentInfo,
  generateSubtractionExplanation,
  defaultSubtractionSettings
} from './utils';

interface SubtractionExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

interface UserAnswer {
  problemId: string;
  userAnswer: number | null;
  isCorrect: boolean;
  attempts: number;
  timeSpent: number;
  hintsUsed: number;
  status: 'pending' | 'correct' | 'incorrect' | 'revealed' | 'skipped';
}

interface ExerciseState {
  currentProblemIndex: number;
  problems: SubtractionProblem[];
  userAnswers: UserAnswer[];
  exerciseStartTime: number;
  isComplete: boolean;
  score: {
    correct: number;
    incorrect: number;
    revealed: number;
    total: number;
    percentage: number;
  };
}

export default function SubtractionExerciseComponent({ settings, onOpenSettings }: SubtractionExerciseProps) {
  const { toast } = useToast();
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    currentProblemIndex: 0,
    problems: [],
    userAnswers: [],
    exerciseStartTime: Date.now(),
    isComplete: false,
    score: {
      correct: 0,
      incorrect: 0,
      revealed: 0,
      total: 0,
      percentage: 0
    }
  });

  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeValue || 0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [problemStartTime, setProblemStartTime] = useState<number>(Date.now());
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert ModuleSettings to SubtractionSettings
  const subtractionSettings = {
    ...defaultSubtractionSettings,
    difficulty: settings.difficulty as any,
    problemCount: settings.problemCount,
    timeValue: settings.timeValue || 0,
    maxAttempts: settings.maxAttempts,
    showImmediateFeedback: settings.showImmediateFeedback,
    enableSoundEffects: settings.enableSoundEffects,
    showAnswerWithExplanation: settings.showAnswerWithExplanation,
    enableRewards: settings.enableRewards,
    rewardType: settings.rewardType as any,
    allowNegativeResults: (settings as any).allowNegativeResults ?? false,
  };

  // Generar problemas al inicio
  useEffect(() => {
    generateProblems();
  }, [settings]);

  // Timer effect
  useEffect(() => {
    if (subtractionSettings.timeValue > 0 && !exerciseState.isComplete && !showExplanation) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [exerciseState.currentProblemIndex, exerciseState.isComplete, showExplanation]);

  // Focus input when problem changes
  useEffect(() => {
    if (inputRef.current && !exerciseState.isComplete) {
      inputRef.current.focus();
    }
  }, [exerciseState.currentProblemIndex, exerciseState.isComplete]);

  const generateProblems = () => {
    const problems: SubtractionProblem[] = [];
    for (let i = 0; i < subtractionSettings.problemCount; i++) {
      const problem = generateSubtractionProblem(subtractionSettings, `sub-${Date.now()}-${i}`);
      problems.push(problem);
    }

    setExerciseState({
      currentProblemIndex: 0,
      problems,
      userAnswers: [],
      exerciseStartTime: Date.now(),
      isComplete: false,
      score: {
        correct: 0,
        incorrect: 0,
        revealed: 0,
        total: problems.length,
        percentage: 0
      }
    });

    setCurrentAnswer("");
    setTimeLeft(subtractionSettings.timeValue);
    setProblemStartTime(Date.now());
    setAttempts(0);
    setShowExplanation(false);
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const currentProblem = exerciseState.problems[exerciseState.currentProblemIndex];
    if (!currentProblem) return;

    // Marcar como incorrecto por tiempo agotado
    const timeSpent = Date.now() - problemStartTime;
    const userAnswer: UserAnswer = {
      problemId: currentProblem.id,
      userAnswer: null,
      isCorrect: false,
      attempts: attempts + 1,
      timeSpent,
      hintsUsed: showExplanation ? 1 : 0,
      status: 'incorrect'
    };

    setExerciseState(prev => {
      const newUserAnswers = [...prev.userAnswers, userAnswer];
      const newCorrect = prev.score.correct;
      const newIncorrect = prev.score.incorrect + 1;
      const newRevealed = prev.score.revealed;

      return {
        ...prev,
        userAnswers: newUserAnswers,
        score: {
          correct: newCorrect,
          incorrect: newIncorrect,
          revealed: newRevealed,
          total: prev.score.total,
          percentage: Math.round((newCorrect / prev.score.total) * 100)
        }
      };
    });

    toast({
      title: "⏰ Tiempo agotado",
      description: "El tiempo se ha agotado para este problema.",
      variant: "destructive",
    });

    setTimeout(() => {
      nextProblem();
    }, 1500);
  };

  const handleSubmitAnswer = () => {
    const currentProblem = exerciseState.problems[exerciseState.currentProblemIndex];
    if (!currentProblem || currentAnswer.trim() === "") return;

    const userAnswerNumber = parseFloat(currentAnswer);
    if (isNaN(userAnswerNumber)) {
      toast({
        title: "Respuesta inválida",
        description: "Por favor ingresa un número válido.",
        variant: "destructive",
      });
      return;
    }

    const isCorrect = validateSubtractionAnswer(currentProblem, userAnswerNumber);
    const timeSpent = Date.now() - problemStartTime;
    const currentAttempts = attempts + 1;

    const userAnswer: UserAnswer = {
      problemId: currentProblem.id,
      userAnswer: userAnswerNumber,
      isCorrect,
      attempts: currentAttempts,
      timeSpent,
      hintsUsed: showExplanation ? 1 : 0,
      status: isCorrect ? 'correct' : 'incorrect'
    };

    setExerciseState(prev => {
      const newUserAnswers = [...prev.userAnswers, userAnswer];
      const newCorrect = prev.score.correct + (isCorrect ? 1 : 0);
      const newIncorrect = prev.score.incorrect + (isCorrect ? 0 : 1);
      const newRevealed = prev.score.revealed;

      return {
        ...prev,
        userAnswers: newUserAnswers,
        score: {
          correct: newCorrect,
          incorrect: newIncorrect,
          revealed: newRevealed,
          total: prev.score.total,
          percentage: Math.round((newCorrect / prev.score.total) * 100)
        }
      };
    });

    if (subtractionSettings.showImmediateFeedback) {
      toast({
        title: isCorrect ? "¡Correcto! ✅" : "Incorrecto ❌",
        description: isCorrect 
          ? `¡Excelente! ${formatNumberForDisplay(currentProblem.operands[0], currentProblem.hasDecimals)} - ${formatNumberForDisplay(currentProblem.operands[1], currentProblem.hasDecimals)} = ${formatNumberForDisplay(currentProblem.correctAnswer, currentProblem.hasDecimals)}`
          : `La respuesta correcta es ${formatNumberForDisplay(currentProblem.correctAnswer, currentProblem.hasDecimals)}`,
        variant: isCorrect ? "default" : "destructive",
      });
    }

    if (isCorrect || currentAttempts >= subtractionSettings.maxAttempts) {
      setTimeout(() => {
        nextProblem();
      }, subtractionSettings.showImmediateFeedback ? 2000 : 500);
    } else {
      setAttempts(currentAttempts);
      setCurrentAnswer("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const nextProblem = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (exerciseState.currentProblemIndex >= exerciseState.problems.length - 1) {
      // Ejercicio completado
      setExerciseState(prev => ({ ...prev, isComplete: true }));
      toast({
        title: "¡Ejercicio completado! 🎉",
        description: `Has terminado el ejercicio de resta.`,
        variant: "default",
      });
    } else {
      // Siguiente problema
      setExerciseState(prev => ({
        ...prev,
        currentProblemIndex: prev.currentProblemIndex + 1
      }));
      
      setCurrentAnswer("");
      setTimeLeft(subtractionSettings.timeValue);
      setProblemStartTime(Date.now());
      setAttempts(0);
      setShowExplanation(false);
    }
  };

  const handleSkipProblem = () => {
    const currentProblem = exerciseState.problems[exerciseState.currentProblemIndex];
    if (!currentProblem) return;

    const timeSpent = Date.now() - problemStartTime;
    const userAnswer: UserAnswer = {
      problemId: currentProblem.id,
      userAnswer: null,
      isCorrect: false,
      attempts: attempts,
      timeSpent,
      hintsUsed: showExplanation ? 1 : 0,
      status: 'skipped'
    };

    setExerciseState(prev => {
      const newUserAnswers = [...prev.userAnswers, userAnswer];
      const newIncorrect = prev.score.incorrect + 1;

      return {
        ...prev,
        userAnswers: newUserAnswers,
        score: {
          ...prev.score,
          incorrect: newIncorrect,
          percentage: Math.round((prev.score.correct / prev.score.total) * 100)
        }
      };
    });

    nextProblem();
  };

  const handleShowExplanation = () => {
    setShowExplanation(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleHideExplanation = () => {
    setShowExplanation(false);
    setTimeLeft(subtractionSettings.timeValue);
    setProblemStartTime(Date.now());
  };

  const currentProblem = exerciseState.problems[exerciseState.currentProblemIndex];
  const progressPercentage = ((exerciseState.currentProblemIndex + (exerciseState.isComplete ? 1 : 0)) / exerciseState.problems.length) * 100;
  const alignmentInfo = getVerticalAlignmentInfo(currentProblem);

  if (exerciseState.isComplete) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">¡Ejercicio Completado! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{exerciseState.score.correct}</div>
                <div className="text-sm text-gray-600">Correctas</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{exerciseState.score.incorrect}</div>
                <div className="text-sm text-gray-600">Incorrectas</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{exerciseState.score.revealed}</div>
                <div className="text-sm text-gray-600">Reveladas</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{exerciseState.score.percentage}%</div>
                <div className="text-sm text-gray-600">Precisión</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={generateProblems} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Practicar de Nuevo
              </Button>
              <Button variant="outline" onClick={onOpenSettings} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Ajustar Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert>
          <AlertDescription>
            Cargando problemas de resta...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Práctica de Resta</h1>
          <p className="text-gray-600">
            Problema {exerciseState.currentProblemIndex + 1} de {exerciseState.problems.length}
          </p>
        </div>
        <Button variant="outline" onClick={onOpenSettings} className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuración
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progreso</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Timer */}
      {subtractionSettings.timeValue > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Timer className="h-4 w-4 text-blue-600" />
          <Badge variant={timeLeft <= 10 ? "destructive" : "default"}>
            {timeLeft}s
          </Badge>
        </div>
      )}

      {/* Problem Display */}
      <Card className="p-8">
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-700 mb-4">
              Resuelve la siguiente resta:
            </div>
            
            {/* Vertical Layout for Subtraction */}
            <div className="font-mono text-4xl leading-relaxed">
              <div className="flex justify-center">
                <div className="text-right">
                  <div className="mb-1">
                    {' '.repeat(alignmentInfo.minuendPadding)}{alignmentInfo.minuend}
                  </div>
                  <div className="border-b-2 border-gray-400 mb-1">
                    {'-'} {' '.repeat(alignmentInfo.subtrahendPadding)}{alignmentInfo.subtrahend}
                  </div>
                  <div className="min-h-[60px] flex items-center justify-end">
                    <Input
                      ref={inputRef}
                      type="number"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitAnswer();
                        }
                      }}
                      className="text-4xl font-mono text-center border-0 border-b-2 border-gray-300 rounded-none bg-transparent w-32"
                      placeholder="?"
                      disabled={showExplanation}
                      step={currentProblem.hasDecimals ? "0.1" : "1"}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty Badge */}
            <div className="mt-4">
              <Badge variant="outline" className="capitalize">
                {currentProblem.difficulty}
              </Badge>
              {currentProblem.requiresBorrowing && (
                <Badge variant="secondary" className="ml-2">
                  Requiere prestar
                </Badge>
              )}
              {currentProblem.hasDecimals && (
                <Badge variant="secondary" className="ml-2">
                  Con decimales
                </Badge>
              )}
            </div>
          </div>

          {/* Attempts Counter */}
          {subtractionSettings.maxAttempts > 0 && attempts > 0 && (
            <div className="text-center">
              <Badge variant="outline">
                Intento {attempts} de {subtractionSettings.maxAttempts}
              </Badge>
            </div>
          )}

          {/* Explanation */}
          {showExplanation && (
            <Alert className="bg-blue-50 border-blue-200">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Explicación paso a paso:</div>
                <div className="whitespace-pre-line text-sm">
                  {generateSubtractionExplanation(currentProblem)}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!showExplanation ? (
              <>
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!currentAnswer.trim()}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Verificar Respuesta
                </Button>
                
                {subtractionSettings.showAnswerWithExplanation && (
                  <Button 
                    variant="outline" 
                    onClick={handleShowExplanation}
                    className="flex items-center gap-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Ver Explicación
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={handleSkipProblem}
                  className="flex items-center gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Saltar
                </Button>
              </>
            ) : (
              <Button onClick={handleHideExplanation}>
                Continuar Practicando
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score Display */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{exerciseState.score.correct}</div>
          <div className="text-xs text-gray-600">Correctas</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{exerciseState.score.incorrect}</div>
          <div className="text-xs text-gray-600">Incorrectas</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{exerciseState.score.percentage}%</div>
          <div className="text-xs text-gray-600">Precisión</div>
        </div>
      </div>
    </div>
  );
}