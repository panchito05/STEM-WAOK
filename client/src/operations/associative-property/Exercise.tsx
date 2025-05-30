// AssociativeProperty Exercise.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateAssociativeProblem, formatExpression, validateAssociativeProperty } from "./utils/problemGeneration";
import { AssociativeProblem, AssociativeAnswer, AssociativeDifficulty, AssociativeLevel, OperationType } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Play } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/hooks/use-translations";
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';
import eventBus from '@/lib/eventBus';
import LevelUpHandler from "@/components/LevelUpHandler";
import { Link } from "wouter";
import ExerciseHistoryDialog from "@/components/ExerciseHistoryDialog";
import { useRewards, RewardModal, useRewardQueue, RewardUtils } from '@/rewards';
import { useMultiOperationsSession } from '@/hooks/useMultiOperationsSession';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

const AssociativePropertyExercise = ({ settings, onOpenSettings }: ExerciseProps) => {
  // Core State
  const [currentProblem, setCurrentProblem] = useState<AssociativeProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [problemNumber, setProblemNumber] = useState(1);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<AssociativeLevel>(1);
  const [currentOperation, setCurrentOperation] = useState<OperationType>('addition');
  const [userAnswers, setUserAnswers] = useState<AssociativeAnswer[]>([]);

  // Timer and interaction states
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [problemStartTime, setProblemStartTime] = useState<number>(Date.now());
  const [singleProblemTimer, setSingleProblemTimer] = useState(0);

  // UI States
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  // Refs
  const answerInputRef = useRef<HTMLInputElement>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleProblemTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { updateProgress } = useProgress();
  const { updateModuleSettings } = useSettings();
  const t = useTranslations();
  
  // Rewards
  const { checkAndAwardRewards } = useRewards('associative-property');
  const { processRewardQueue, currentReward, showRewardModal, hideRewardModal } = useRewardQueue();

  // Multi-operations session
  const { 
    isMultiOperationsActive, 
    completeExercise, 
    currentSessionData,
    pauseSession,
    resumeSession 
  } = useMultiOperationsSession();

  // Generate new problem
  const generateNewProblem = useCallback(() => {
    console.log('[ASSOCIATIVE-PROPERTY] Generating new problem:', { currentLevel, settings });
    
    const difficulty = settings.difficulty as AssociativeDifficulty || 'easy';
    const problem = generateAssociativeProblem(difficulty, currentLevel, currentOperation);
    
    setCurrentProblem(problem);
    setUserAnswer("");
    setIsCorrect(null);
    setShowResult(false);
    setShowExplanation(false);
    setProblemStartTime(Date.now());
    setSingleProblemTimer(0);

    // Set up timer if enabled
    if (settings.timeLimit && settings.timeLimit > 0) {
      setTimeRemaining(settings.timeLimit);
    } else {
      setTimeRemaining(null);
    }

    // Focus input
    setTimeout(() => {
      answerInputRef.current?.focus();
    }, 100);
  }, [currentLevel, settings, currentOperation]);

  // Start timers
  useEffect(() => {
    if (!isPaused) {
      // Session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

      // Single problem timer
      singleProblemTimerRef.current = setInterval(() => {
        setSingleProblemTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    };
  }, [isPaused]);

  // Time limit countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !isPaused && !showResult) {
      timeoutRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev! - 1);
      }, 1000);
    } else if (timeRemaining === 0 && !showResult) {
      handleTimeUp();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [timeRemaining, isPaused, showResult]);

  // Handle time up
  const handleTimeUp = () => {
    console.log('[ASSOCIATIVE-PROPERTY] Time up for problem:', currentProblem?.id);
    
    if (currentProblem) {
      setIsCorrect(false);
      setShowResult(true);
      
      const answer: AssociativeAnswer = {
        problemId: currentProblem.id,
        userAnswer: userAnswer || "",
        isCorrect: false,
        attempts: 1,
        timeSpent: singleProblemTimer,
        timestamp: new Date(),
        method: 'calculation'
      };

      setUserAnswers(prev => [...prev, answer]);
      updateProgress('associative-property', false, singleProblemTimer);
    }
  };

  // Check answer
  const checkUserAnswer = useCallback(() => {
    if (!currentProblem || !userAnswer.trim()) return;

    console.log('[ASSOCIATIVE-PROPERTY] Checking answer:', { 
      userAnswer, 
      correctAnswer: currentProblem.correctAnswer,
      problemId: currentProblem.id 
    });

    const numericAnswer = parseInt(userAnswer.trim());
    const correct = numericAnswer === currentProblem.correctAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);

    const answer: AssociativeAnswer = {
      problemId: currentProblem.id,
      userAnswer: numericAnswer,
      isCorrect: correct,
      attempts: 1,
      timeSpent: singleProblemTimer,
      timestamp: new Date(),
      method: 'calculation'
    };

    setUserAnswers(prev => [...prev, answer]);

    if (correct) {
      setTotalCorrect(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
      
      // Check for rewards
      checkAndAwardRewards({
        correctAnswers: totalCorrect + 1,
        streak: currentStreak + 1,
        level: currentLevel,
        timeSpent: singleProblemTimer
      });
    } else {
      setCurrentStreak(0);
    }

    updateProgress('associative-property', correct, singleProblemTimer);
  }, [currentProblem, userAnswer, singleProblemTimer, totalCorrect, currentStreak, currentLevel, checkAndAwardRewards, updateProgress]);

  // Handle next problem
  const handleNext = () => {
    if (isMultiOperationsActive) {
      completeExercise('associative-property', {
        correct: isCorrect || false,
        timeSpent: singleProblemTimer,
        problem: currentProblem,
        userAnswer
      });
    } else {
      setProblemNumber(prev => prev + 1);
      generateNewProblem();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setUserAnswer(value);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult && userAnswer.trim()) {
      checkUserAnswer();
    }
  };

  // Initialize first problem
  useEffect(() => {
    generateNewProblem();
  }, [generateNewProblem]);

  // Level components for different levels
  const Level1Component = () => {
    if (!currentProblem) return null;
    
    return (
      <div className="associative-level1-container space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            {t('associativeProperty.level1.title', 'Agrupa los Elementos')}
          </h3>
        </div>

        <div className="visual-grouping-area bg-blue-50 p-6 rounded-lg">
          <div className="grouping-example mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-lg">(</span>
              <div className="flex space-x-1">
                {currentProblem.values.slice(0, 2).map((val, idx) => (
                  <div key={idx} className="w-8 h-8 bg-red-300 rounded-full flex items-center justify-center">
                    {val}
                  </div>
                ))}
              </div>
              <span className="text-lg">)</span>
              <span className="text-lg font-bold">+</span>
              <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
                {currentProblem.values[2]}
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600 mb-4">
              = {formatExpression(currentProblem.leftExpression, currentProblem.operation)}
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="text-lg font-semibold">ES IGUAL A</span>
          </div>

          <div className="grouping-example">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-green-300 rounded-full flex items-center justify-center">
                {currentProblem.values[0]}
              </div>
              <span className="text-lg font-bold">+</span>
              <span className="text-lg">(</span>
              <div className="flex space-x-1">
                {currentProblem.values.slice(1).map((val, idx) => (
                  <div key={idx} className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
                    {val}
                  </div>
                ))}
              </div>
              <span className="text-lg">)</span>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              = {formatExpression(currentProblem.rightExpression, currentProblem.operation)}
            </div>
          </div>
        </div>

        <div className="question-area text-center">
          <p className="text-lg mb-4">
            {t('associativeProperty.level1.question', '¿Cuál es el resultado de ambas expresiones?')}
          </p>
        </div>
      </div>
    );
  };

  const Level2Component = () => {
    if (!currentProblem) return null;
    
    return (
      <div className="associative-level2-container space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            {t('associativeProperty.level2.title', 'Introducción Numérica')}
          </h3>
        </div>

        <div className="expressions-container bg-gray-50 p-6 rounded-lg">
          <div className="expression-pair space-y-4">
            <div className="expression bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-mono mb-2">
                {formatExpression(currentProblem.leftExpression, currentProblem.operation)}
              </div>
              {showExplanation && (
                <div className="text-sm text-gray-600">
                  = {currentProblem.values[0]} {currentProblem.operation === 'addition' ? '+' : '×'} {currentProblem.values[1]} {currentProblem.operation === 'addition' ? '+' : '×'} {currentProblem.values[2]}
                </div>
              )}
            </div>

            <div className="text-center text-lg font-semibold">
              {t('associativeProperty.level2.equals', 'ES IGUAL A')}
            </div>

            <div className="expression bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-mono mb-2">
                {formatExpression(currentProblem.rightExpression, currentProblem.operation)}
              </div>
              {showExplanation && (
                <div className="text-sm text-gray-600">
                  = {currentProblem.values[0]} {currentProblem.operation === 'addition' ? '+' : '×'} {currentProblem.values[1]} {currentProblem.operation === 'addition' ? '+' : '×'} {currentProblem.values[2]}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="question-area text-center">
          <p className="text-lg mb-4">
            {t('associativeProperty.level2.question', '¿Cuál es el resultado?')}
          </p>
        </div>
      </div>
    );
  };

  const Level3Component = () => {
    if (!currentProblem) return null;
    
    return (
      <div className="associative-level3-container space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            {t('associativeProperty.level3.title', 'Práctica Guiada')}
          </h3>
        </div>

        <div className="problem-container bg-yellow-50 p-6 rounded-lg">
          <div className="given-expression text-center mb-6">
            <div className="text-xl font-mono mb-2">
              {formatExpression(currentProblem.leftExpression, currentProblem.operation)} = {currentProblem.correctAnswer}
            </div>
            <div className="text-sm text-gray-600">
              {t('associativeProperty.level3.given', 'Expresión dada')}
            </div>
          </div>

          <div className="equivalent-expression text-center">
            <p className="text-lg mb-4">
              {t('associativeProperty.level3.question', 'Completa la expresión equivalente:')}
            </p>
            <div className="text-xl font-mono">
              {formatExpression(currentProblem.rightExpression, currentProblem.operation)} = ?
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Level4Component = () => {
    if (!currentProblem) return null;
    
    return (
      <div className="associative-level4-container space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            {t('associativeProperty.level4.title', 'Cálculo Mental')}
          </h3>
        </div>

        <div className="mental-calculation bg-purple-50 p-6 rounded-lg">
          <div className="strategy-hint mb-4 p-4 bg-blue-100 rounded-lg">
            <div className="text-sm font-semibold text-blue-800 mb-2">
              {t('associativeProperty.level4.strategy', 'Estrategia:')}
            </div>
            <div className="text-sm text-blue-700">
              {t('associativeProperty.level4.hint', 'Agrupa los números que sean más fáciles de sumar primero')}
            </div>
          </div>

          <div className="problem-display text-center">
            <div className="text-2xl font-mono mb-4">
              {currentProblem.values.join(' + ')}
            </div>
            <div className="text-lg mb-4">
              {t('associativeProperty.level4.question', '¿Cuál es el resultado?')}
            </div>
          </div>

          {showExplanation && (
            <div className="explanation bg-gray-100 p-4 rounded-lg">
              <div className="text-sm">
                <div>Puedes agrupar como: ({currentProblem.values[0]} + {currentProblem.values[1]}) + {currentProblem.values[2]}</div>
                <div>O como: {currentProblem.values[0]} + ({currentProblem.values[1]} + {currentProblem.values[2]})</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Level5Component = () => {
    if (!currentProblem) return null;
    
    return (
      <div className="associative-level5-container space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            {t('associativeProperty.level5.title', 'Expresión Creativa')}
          </h3>
        </div>

        <div className="creative-challenge bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
          <div className="challenge-description mb-6 text-center">
            <div className="text-lg mb-2">
              {t('associativeProperty.level5.challenge', 'Desafío Creativo')}
            </div>
            <div className="text-sm text-gray-600">
              {t('associativeProperty.level5.description', 'Demuestra que conoces la propiedad asociativa')}
            </div>
          </div>

          <div className="numbers-available mb-4 text-center">
            <div className="text-sm font-semibold mb-2">
              {t('associativeProperty.level5.numbersAvailable', 'Números disponibles:')}
            </div>
            <div className="flex justify-center space-x-2">
              {currentProblem.values.map((num, idx) => (
                <div key={idx} className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center font-bold">
                  {num}
                </div>
              ))}
            </div>
          </div>

          <div className="expressions-display space-y-3">
            <div className="text-center">
              <div className="text-lg font-mono">
                {formatExpression(currentProblem.leftExpression, currentProblem.operation)}
              </div>
              <div className="text-sm text-gray-600">Primera forma</div>
            </div>
            
            <div className="text-center text-lg font-bold">
              =
            </div>
            
            <div className="text-center">
              <div className="text-lg font-mono">
                {formatExpression(currentProblem.rightExpression, currentProblem.operation)}
              </div>
              <div className="text-sm text-gray-600">Segunda forma</div>
            </div>
          </div>

          <div className="question-area text-center mt-6">
            <p className="text-lg">
              {t('associativeProperty.level5.question', '¿Cuál es el resultado de ambas expresiones?')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render level component based on current level
  const renderLevelComponent = () => {
    switch (currentLevel) {
      case 1: return <Level1Component />;
      case 2: return <Level2Component />;
      case 3: return <Level3Component />;
      case 4: return <Level4Component />;
      case 5: return <Level5Component />;
      default: return <Level1Component />;
    }
  };

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">
          {t('loading', 'Generando problema...')}
        </div>
      </div>
    );
  }

  return (
    <div className="associative-property-exercise max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/operations" className="flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="w-5 h-5 mr-1" />
            {t('back', 'Volver')}
          </Link>
          <h1 className="text-2xl font-bold">
            {t('associativeProperty.title', 'Propiedad Asociativa')}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
                  <History className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('showHistory', 'Ver historial')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onOpenSettings}>
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('settings', 'Configuraciones')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{t('problem', 'Problema')} {problemNumber}</span>
          <span>{t('level', 'Nivel')} {currentLevel}</span>
          <span>{t('correct', 'Correctas')}: {totalCorrect}</span>
          <span>{t('streak', 'Racha')}: {currentStreak}</span>
          <span>{t('time', 'Tiempo')}: {formatTime(sessionTime)}</span>
        </div>
        
        {timeRemaining !== null && (
          <div className="flex justify-between text-sm">
            <span>{t('timeRemaining', 'Tiempo restante')}: {timeRemaining}s</span>
            <ProgressBarUI value={(timeRemaining / (settings.timeLimit || 60)) * 100} className="w-32" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border p-6">
        {renderLevelComponent()}

        {/* Answer Input */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <Label htmlFor="answer" className="text-lg font-semibold">
              {t('yourAnswer', 'Tu respuesta:')}
            </Label>
            <Input
              id="answer"
              ref={answerInputRef}
              type="text"
              value={userAnswer}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={showResult}
              className="w-32 text-center text-xl font-bold"
              placeholder="?"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {!showResult ? (
              <>
                <Button 
                  onClick={checkUserAnswer}
                  disabled={!userAnswer.trim()}
                  className="px-8"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('checkAnswer', 'Verificar')}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="px-6"
                >
                  <Info className="w-4 h-4 mr-2" />
                  {t('hint', 'Pista')}
                </Button>
              </>
            ) : (
              <Button onClick={handleNext} className="px-8">
                <ChevronRight className="w-4 h-4 mr-2" />
                {t('next', 'Siguiente')}
              </Button>
            )}
          </div>
        </div>

        {/* Result Display */}
        {showResult && (
          <div className={`mt-6 p-4 rounded-lg text-center ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center justify-center space-x-2 mb-2">
              {isCorrect ? (
                <Trophy className="w-6 h-6 text-green-600" />
              ) : (
                <RotateCcw className="w-6 h-6 text-red-600" />
              )}
              <span className="text-lg font-semibold">
                {isCorrect 
                  ? t('correct', '¡Correcto!') 
                  : t('incorrect', 'Incorrecto')
                }
              </span>
            </div>
            
            {!isCorrect && (
              <div className="text-sm">
                {t('correctAnswer', 'La respuesta correcta es')}: {currentProblem.correctAnswer}
              </div>
            )}
            
            <div className="text-sm mt-2">
              {t('timeSpent', 'Tiempo usado')}: {formatTime(singleProblemTimer)}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ExerciseHistoryDialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        operation="associative-property"
        answers={userAnswers}
      />

      <LevelUpHandler />
      
      <RewardModal
        isOpen={showRewardModal}
        onClose={hideRewardModal}
        reward={currentReward}
      />
    </div>
  );
};

export default AssociativePropertyExercise;