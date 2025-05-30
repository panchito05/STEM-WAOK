import React, { useState, useEffect, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, Info, History, Star, Trophy } from "lucide-react";
import ExerciseHistoryDialog from "@/components/ExerciseHistoryDialog";
import { 
  generateLevel1Problem, 
  generateLevel2Problem, 
  generateLevel3Problem, 
  generateLevel4Problem, 
  generateLevel5Problem 
} from "./utils";
import { 
  Level1Problem, 
  Level2Problem, 
  Level3Problem, 
  Level4Problem, 
  Level5Problem,
  AssociativePropertySettings 
} from "./types";

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const { saveExerciseResult } = useProgress();
  const [timer, setTimer] = useState(0);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [showExerciseHistory, setShowExerciseHistory] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);

  // Get current level from settings
  const currentLevel = (settings as any).currentLevel || 1;

  const translations = {
    title: settings.language === 'english' ? 'Associative Property' : 'Propiedad Asociativa',
    level: settings.language === 'english' ? 'Level' : 'Nivel',
    problem: settings.language === 'english' ? 'Problem' : 'Problema',
    of: settings.language === 'english' ? 'of' : 'de',
    previous: settings.language === 'english' ? 'Previous' : 'Anterior',
    startExercise: settings.language === 'english' ? 'Start Exercise' : 'Comenzar Ejercicio',
    settings: settings.language === 'english' ? 'Settings' : 'Configuración',
    exerciseHistory: settings.language === 'english' ? 'Exercise History' : 'Historial'
  };

  const levelNames = {
    1: settings.language === 'english' ? 'Visual grouping' : 'Agrupación visual',
    2: settings.language === 'english' ? 'Numerical intro' : 'Introducción numérica',
    3: settings.language === 'english' ? 'Guided exercises' : 'Ejercicios guiados',
    4: settings.language === 'english' ? 'Mental calculation' : 'Cálculo mental',
    5: settings.language === 'english' ? 'Advanced expressions' : 'Expresiones avanzadas'
  };

  // Generate problem based on level
  const generateProblem = useCallback((level: number, index: number) => {
    switch (level) {
      case 1:
        return generateLevel1Problem();
      case 2:
        return generateLevel2Problem();
      case 3:
        return generateLevel3Problem();
      case 4:
        return generateLevel4Problem();
      case 5:
        return generateLevel5Problem();
      default:
        return generateLevel1Problem();
    }
  }, []);

  // Initialize first problem
  useEffect(() => {
    if (!currentProblem) {
      setCurrentProblem(generateProblem(currentLevel, 0));
    }
  }, [currentLevel, generateProblem, currentProblem]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (exerciseStarted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [exerciseStarted]);

  // Start exercise
  const startExercise = () => {
    if (!exerciseStarted) {
      setExerciseStarted(true);
    }
  };

  // Handle answer submission
  const handleAnswer = useCallback((answer: any) => {
    if (!currentProblem) return;

    startExercise();

    let correct = false;
    
    // Check answer based on level
    switch (currentLevel) {
      case 1:
        correct = answer === currentProblem.correctAnswer;
        break;
      case 2:
        correct = answer === currentProblem.correctAnswer;
        break;
      case 3:
        correct = Array.isArray(answer) 
          ? answer[0] === currentProblem.missingValues[0] && answer[1] === currentProblem.missingValues[1]
          : answer === currentProblem.correctAnswer;
        break;
      case 4:
        correct = answer === currentProblem.correctAnswer;
        break;
      case 5:
        correct = answer === currentProblem.targetSum;
        break;
      default:
        correct = false;
    }

    setIsCorrect(correct);
    setShowResult(true);

    // Save result
    const result = {
      problemId: `level${currentLevel}_${currentProblemIndex}`,
      problem: currentProblem,
      userAnswer: answer,
      isCorrect: correct,
      timeSpent: timer,
      level: currentLevel
    };

    setExerciseHistory(prev => [...prev, result]);
    
    saveExerciseResult({
      operation: 'associative-property',
      problem: currentProblem,
      userAnswer: answer,
      isCorrect: correct,
      timeSpent: timer,
      difficulty: `level${currentLevel}`
    });
  }, [currentProblem, currentLevel, currentProblemIndex, timer, saveExerciseResult]);

  // Continue to next problem
  const handleContinue = () => {
    if (currentProblemIndex + 1 < settings.problemCount) {
      const nextIndex = currentProblemIndex + 1;
      setCurrentProblemIndex(nextIndex);
      setCurrentProblem(generateProblem(currentLevel, nextIndex));
      setShowResult(false);
      setIsCorrect(false);
    } else {
      // Exercise completed
      alert(settings.language === 'english' ? 'Exercise completed!' : '¡Ejercicio completado!');
    }
  };

  // Level 1 Component: Visual Object Grouping
  const Level1Component: React.FC<{
    problem: Level1Problem;
    onAnswer: (answer: number) => void;
    showResult?: boolean;
    isCorrect?: boolean;
  }> = ({ problem, onAnswer, showResult, isCorrect }) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const handleSubmit = () => {
      if (selectedAnswer !== null) {
        onAnswer(selectedAnswer);
      }
    };

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            <Star className="inline mr-2" />
            {settings.language === 'english' ? 'Level 1: Visual Object Grouping' : 'Nivel 1: Agrupación Visual de Objetos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg mb-4">
                {settings.language === 'english' 
                  ? `Count the total number of ${problem.animalType}:` 
                  : `Cuenta el total de ${problem.animalType}:`}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {problem.groups.map((group, idx) => (
                  <div key={idx} className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                    <div className="text-center">
                      <div className="text-6xl mb-2">{problem.emoji}</div>
                      <div className="text-xl font-bold">× {group}</div>
                      <div className="text-sm text-gray-600 mt-2">
                        {settings.language === 'english' ? 'Group' : 'Grupo'} {idx + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-lg mb-4">
                {settings.language === 'english' ? 'How many in total?' : '¿Cuántos hay en total?'}
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                {[problem.correctAnswer - 2, problem.correctAnswer - 1, problem.correctAnswer, problem.correctAnswer + 1, problem.correctAnswer + 2].map((option) => (
                  <Button
                    key={option}
                    variant={selectedAnswer === option ? "default" : "outline"}
                    onClick={() => setSelectedAnswer(option)}
                    disabled={showResult}
                    className="text-lg px-6 py-3"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            
            {!showResult && selectedAnswer !== null && (
              <div className="text-center">
                <Button onClick={handleSubmit} className="px-8">
                  {settings.language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
                </Button>
              </div>
            )}
            
            {showResult && (
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="font-bold text-lg text-center">
                  {isCorrect 
                    ? (settings.language === 'english' ? 'Correct!' : '¡Correcto!') 
                    : (settings.language === 'english' ? 'Incorrect' : 'Incorrecto')}
                </div>
                <div className="text-sm mt-2 text-center">
                  {settings.language === 'english' ? 'Correct answer:' : 'Respuesta correcta:'} {problem.correctAnswer}
                  <br />
                  ({problem.groups.join(' + ')} = {problem.correctAnswer})
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Level 2 Component: Numerical Introduction
  const Level2Component: React.FC<{
    problem: Level2Problem;
    onAnswer: (answer: number) => void;
    showResult?: boolean;
    isCorrect?: boolean;
  }> = ({ problem, onAnswer, showResult, isCorrect }) => {
    const [answer, setAnswer] = useState<string>("");

    const handleSubmit = () => {
      onAnswer(parseInt(answer));
    };

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            <Star className="inline mr-2" />
            {settings.language === 'english' ? 'Level 2: Numerical Introduction with Parentheses' : 'Nivel 2: Introducción Numérica con Paréntesis'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg mb-6">
                {settings.language === 'english' ? 'Solve both expressions:' : 'Resuelve ambas expresiones:'}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-center">
                    {problem.expression1}
                  </div>
                </div>
                <div className="p-6 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-center">
                    {problem.expression2}
                  </div>
                </div>
              </div>
              
              <div className="text-lg mb-4">
                {settings.language === 'english' ? 'What is the result of both expressions?' : '¿Cuál es el resultado de ambas expresiones?'}
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">
                  {settings.language === 'english' ? 'Answer:' : 'Respuesta:'}
                </span>
                <Input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-24 text-center text-lg"
                  placeholder="?"
                  disabled={showResult}
                />
              </div>
            </div>
            
            {!showResult && (
              <div className="text-center">
                <Button 
                  onClick={handleSubmit}
                  disabled={!answer}
                  className="px-8"
                >
                  {settings.language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
                </Button>
              </div>
            )}
            
            {showResult && (
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="font-bold text-lg text-center">
                  {isCorrect 
                    ? (settings.language === 'english' ? 'Correct!' : '¡Correcto!') 
                    : (settings.language === 'english' ? 'Incorrect' : 'Incorrecto')}
                </div>
                <div className="text-sm mt-2 text-center">
                  {settings.language === 'english' ? 'Correct answer:' : 'Respuesta correcta:'} {problem.correctAnswer}
                  <br />
                  {settings.language === 'english' ? 'Both expressions give the same result due to the associative property.' : 'Ambas expresiones dan el mismo resultado debido a la propiedad asociativa.'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render current problem based on level
  const renderCurrentProblem = () => {
    if (!currentProblem) return null;

    switch (currentLevel) {
      case 1:
        return (
          <Level1Component
            problem={currentProblem}
            onAnswer={handleAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        );
      case 2:
        return (
          <Level2Component
            problem={currentProblem}
            onAnswer={handleAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        );
      default:
        return (
          <div className="text-center p-8">
            <div className="text-lg">
              {settings.language === 'english' 
                ? `Level ${currentLevel} implementation in progress...` 
                : `Implementación del Nivel ${currentLevel} en progreso...`}
            </div>
          </div>
        );
    }
  };

  const attemptedProblemsCount = currentProblemIndex;
  const progressValue = settings.problemCount > 0 ? (attemptedProblemsCount / settings.problemCount) * 100 : 0;
  const score = exerciseHistory.filter(h => h.isCorrect).length;

  return (
    <div className="relative">
      {/* Exercise History Dialog */}
      <ExerciseHistoryDialog
        isOpen={showExerciseHistory}
        onClose={() => setShowExerciseHistory(false)}
        exerciseHistory={exerciseHistory}
        moduleName="associative-property"
      />

      <div className={`px-2 py-3 sm:px-4 sm:py-5 rounded-xl shadow-lg min-h-[calc(100vh-8rem)] md:min-h-0 flex flex-col ${
        currentLevel === 1 ? "bg-blue-50 border-blue-200" :
        currentLevel === 2 ? "bg-emerald-50 border-emerald-200" :
        currentLevel === 3 ? "bg-orange-50 border-orange-200" :
        currentLevel === 4 ? "bg-purple-50 border-purple-200" :
        currentLevel === 5 ? "bg-rose-50 border-rose-200" :
        "bg-indigo-50 border-indigo-200"
      } border-2`}>
        {/* Header - Responsive Design: Stack vertically on mobile, horizontal on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex flex-row justify-between items-center sm:flex-col sm:items-start">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">{translations.title}</h2>
              <span className="sm:hidden font-medium text-sm bg-[#3b82f6] text-[#f9fafb]">
                {translations.problem} {currentProblemIndex + 1} de {settings.problemCount}
              </span>
            </div>
            
            {/* Top row info - Timer and basic stats */}
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
                <span className="font-medium text-gray-700 flex items-center">
                  <Info className="h-4 w-4 mr-1 opacity-70"/>
                  {formatTime(timer)}
                </span>

                <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                  currentLevel === 1 ? "bg-blue-100 text-blue-800" :
                  currentLevel === 2 ? "bg-emerald-100 text-emerald-800" :
                  currentLevel === 3 ? "bg-orange-100 text-orange-800" :
                  currentLevel === 4 ? "bg-purple-100 text-purple-800" :
                  currentLevel === 5 ? "bg-rose-100 text-rose-800" :
                  "bg-indigo-100 text-indigo-800"
                }`}>
                    {translations.level}: {levelNames[currentLevel as keyof typeof levelNames]}
                </span>
            </div>
        </div>
        
        <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1 bg-[#c5dbeb]" />
        
        {/* Unified Controls Row - Single horizontal row on mobile, maintain desktop layout */}
        <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 flex-wrap">
            {/* Problem Progress - Desktop only */}
            <span className="hidden sm:inline font-semibold px-2 py-1 border border-gray-300 rounded-md text-xs bg-[#2563eb] text-[#ffffff]">
              {translations.problem} : {currentProblemIndex + 1} de {settings.problemCount}
            </span>
            
            {/* Score - First item */}
            <div className="flex flex-col items-center">
              <span className="font-semibold px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-xs">
                Score: {score}
              </span>
              <span className="text-xs mt-1 sm:hidden text-gray-500">Score</span>
            </div>
            
            {/* Exercise History button */}
            <div className="flex flex-col items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExerciseHistory(true)}
                className="flex items-center gap-1 py-1 px-2 text-xs h-7"
              >
                <History className="h-3 w-3" />
                <span className="hidden sm:inline">{translations.exerciseHistory}</span>
              </Button>
              <span className="text-xs mt-1 sm:hidden text-gray-500">{translations.exerciseHistory}</span>
            </div>
            
            {/* Settings button */}
            <div className="flex flex-col items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="flex items-center gap-1 py-1 px-2 text-xs h-7"
              >
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">{translations.settings}</span>
              </Button>
              <span className="text-xs mt-1 sm:hidden text-gray-500">{translations.settings}</span>
            </div>
        </div>

        {/* Current Problem */}
        <div className="flex-1 flex items-center justify-center">
          {renderCurrentProblem()}
        </div>

        {/* Navigation Buttons - Bottom */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <Button
            variant="outline" 
            size="sm"
            disabled={currentProblemIndex === 0}
            onClick={() => {
              if (currentProblemIndex > 0) {
                const prevIndex = currentProblemIndex - 1;
                setCurrentProblemIndex(prevIndex);
                setCurrentProblem(generateProblem(currentLevel, prevIndex));
                setShowResult(false);
                setIsCorrect(false);
              }
            }}
            className="w-full sm:w-auto text-xs sm:text-sm md:text-base h-12 sm:h-10"
          >
            <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {translations.previous}
          </Button>

          <Button 
            onClick={showResult ? handleContinue : () => {}}
            disabled={!showResult}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 text-base sm:text-lg md:text-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white flex items-center justify-center h-12 sm:h-10"
          >
            <span className="flex-grow text-center font-medium">
              {showResult 
                ? (settings.language === 'english' ? 'Continue' : 'Continuar')
                : (settings.language === 'english' ? 'Start Exercise' : 'Comenzar Ejercicio')
              }
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}