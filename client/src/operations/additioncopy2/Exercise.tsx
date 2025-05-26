// Exercise.tsx - División
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { generateDivisionProblem, checkAnswer, chooseRandomFormat, divisionProblemToProblem } from "./utils";
import { Problem, UserAnswer as UserAnswerType, DivisionProblem, DifficultyLevel, DivisionDisplayFormat } from "./types";
import { formatTime } from "@/lib/utils";
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, History, Youtube, X, Eye, Maximize2, Minimize2, Play } from "lucide-react";
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

// --- Constants ---
const MAX_DIFFICULTY = 5;
const CORRECT_STREAK_THRESHOLD = 10;
const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;
const PROBLEM_CACHE_SIZE = 20;
const DECIMAL_PRECISION = 2;

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

interface UserAnswer {
  problem: DivisionProblem;
  userAnswer: number | null;
  isCorrect: boolean;
  wasRevealed: boolean;
  timeSpent: number;
  attemptsMade: number;
  difficultyLevel: number;
  displayFormat: DivisionDisplayFormat;
}

// Interface para los metadatos de videos de YouTube
interface YoutubeVideoMetadata {
  url: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
  loading: boolean;
  error: boolean;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const { saveExerciseResult } = useProgress();
  const { updateModuleSettings } = useSettings();
  const t = useTranslations();
  
  // División state management
  const [userSettings, setUserSettings] = useState<ModuleSettings>(() => ({ ...settings }));
  const [problemCache, setProblemCache] = useState<DivisionProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<DivisionProblem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [problemStartTime, setProblemStartTime] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [currentExerciseDifficulty, setCurrentExerciseDifficulty] = useState<number>(getDifficultyNumber(settings.difficulty as DifficultyLevel));
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [targetProblemCount, setTargetProblemCount] = useState(settings.problemCount);
  const [isAutoContinueEnabled, setIsAutoContinueEnabled] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [currentDisplayFormat, setCurrentDisplayFormat] = useState<DivisionDisplayFormat>('obelus');

  // Refs
  const isSubmitting = useRef(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper function to convert difficulty level to number
  function getDifficultyNumber(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'beginner': return 1;
      case 'elementary': return 2;
      case 'intermediate': return 3;
      case 'advanced': return 4;
      case 'expert': return 5;
      default: return 1;
    }
  }

  // Emit progress data
  const emitProgress = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => {
    const event = new CustomEvent('operationProgress', { detail: { operationType: 'division', ...data } });
    window.dispatchEvent(event);
  }, []);

  // Initialize exercise
  useEffect(() => {
    console.log("Initializing/Restarting division exercise with settings:", userSettings);
    const initialDifficulty = getDifficultyNumber(userSettings.difficulty as DifficultyLevel);
    
    const generateCache = (difficulty: number, size: number) => 
      Array(size).fill(null).map(() => generateDivisionProblem(getDifficultyFromNumber(difficulty)));
    
    const cacheSize = Math.max(PROBLEM_CACHE_SIZE, userSettings.problemCount);
    const newCache = generateCache(initialDifficulty, cacheSize);
    
    setProblemCache(newCache);
    setCurrentExerciseDifficulty(initialDifficulty);
    setCurrentProblem(newCache[0]);
    setCurrentDisplayFormat(chooseRandomFormat());
    setCurrentIndex(0);
    setUserAnswers([]);
    setInputValue('');
    setProblemStartTime(Date.now());
    setIsComplete(false);
    setFeedback(null);
    setError('');
    setCurrentAttempts(0);
    setShowContinueButton(false);
    setIsAnswerRevealed(false);
    setConsecutiveCorrectAnswers(0);
    setTargetProblemCount(userSettings.problemCount);
    setIsReviewMode(false);
    setReviewIndex(0);
    setShowAutoContinueTooltip(false);
    isSubmitting.current = false;
    
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    autoContinueTimerRef.current = null;
    tooltipTimerRef.current = null;
    
    const focusTimeout = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(focusTimeout);
  }, [userSettings]);

  // Helper function to convert number to difficulty
  function getDifficultyFromNumber(num: number): DifficultyLevel {
    switch (num) {
      case 1: return 'beginner';
      case 2: return 'elementary';
      case 3: return 'intermediate';
      case 4: return 'advanced';
      case 5: return 'expert';
      default: return 'beginner';
    }
  }

  // Focus input effect
  useEffect(() => {
    if (!isReviewMode && !isComplete && currentProblem && !showContinueButton && !autoContinueTimerRef.current) {
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
        if (error) inputRef.current?.select();
      }, 50);
      return () => clearTimeout(focusTimeout);
    }
  }, [currentIndex, showContinueButton, isComplete, currentProblem, error, isReviewMode]);

  // Continue to next problem
  const handleContinue = useCallback(() => {
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }
    
    if (currentIndex >= targetProblemCount - 1) {
      setIsComplete(true);
      setShowContinueButton(false);
      return;
    }
    
    const nextProblemIndex = currentIndex + 1;
    let nextProblem: DivisionProblem;
    
    if (nextProblemIndex < problemCache.length) {
      nextProblem = problemCache[nextProblemIndex];
    } else {
      console.warn("Generating division problem outside cache for index:", nextProblemIndex);
      nextProblem = generateDivisionProblem(getDifficultyFromNumber(currentExerciseDifficulty));
      setProblemCache(cache => [...cache, nextProblem]);
    }
    
    setCurrentProblem(nextProblem);
    setCurrentDisplayFormat(chooseRandomFormat());
    setCurrentIndex(nextProblemIndex);
    setShowContinueButton(false);
    setFeedback(null);
    setInputValue('');
    setError('');
    setCurrentAttempts(0);
    setIsAnswerRevealed(false);
    setProblemStartTime(Date.now());
    isSubmitting.current = false;
  }, [currentIndex, targetProblemCount, problemCache, currentExerciseDifficulty]);

  // Auto continue effect
  useEffect(() => {
    if (feedback && isAutoContinueEnabled && !isReviewMode) {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY);
    }
    return () => {
      if (autoContinueTimerRef.current && (!feedback || !isAutoContinueEnabled)) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
      }
    };
  }, [feedback, isAutoContinueEnabled, isReviewMode, currentIndex, handleContinue]);

  // Trigger continuation
  const triggerContinuation = useCallback(() => {
    if (isAutoContinueEnabled && !isReviewMode) setShowContinueButton(false);
    else setShowContinueButton(true);
  }, [isAutoContinueEnabled, isReviewMode]);

  // Submit answer
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswerRevealed || showContinueButton || isSubmitting.current || !currentProblem) return;
    
    isSubmitting.current = true;
    setError('');
    
    if (inputValue.trim() === '') {
      setError('Please enter an answer');
      isSubmitting.current = false;
      inputRef.current?.focus();
      return;
    }
    
    const numericAnswer = parseFloat(inputValue);
    if (isNaN(numericAnswer)) {
      setError('Please enter a valid number');
      isSubmitting.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }
    
    const attemptsSoFar = currentAttempts + 1;
    setCurrentAttempts(attemptsSoFar);
    const isCorrect = checkAnswer(currentProblem, numericAnswer);
    const timeSpent = (Date.now() - problemStartTime) / 1000;
    let shouldProceed = false;
    
    if (isCorrect) {
      let feedbackMessage = `Correct! (${attemptsSoFar} ${attemptsSoFar === 1 ? 'attempt' : 'attempts'})`;
      setFeedback({ correct: true, message: feedbackMessage });
      setUserAnswers(prev => [...prev, {
        problem: currentProblem,
        userAnswer: numericAnswer,
        isCorrect: true,
        wasRevealed: false,
        timeSpent,
        attemptsMade: attemptsSoFar,
        difficultyLevel: currentExerciseDifficulty,
        displayFormat: currentDisplayFormat
      }]);
      
      emitProgress({ correct: true, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsSoFar, revealed: false });
      
      if (userSettings.enableAdaptiveDifficulty) {
        const newStreak = consecutiveCorrectAnswers + 1;
        setConsecutiveCorrectAnswers(newStreak);
        if (newStreak >= CORRECT_STREAK_THRESHOLD && currentExerciseDifficulty < MAX_DIFFICULTY) {
          const nextDifficulty = currentExerciseDifficulty + 1;
          setCurrentExerciseDifficulty(nextDifficulty);
          setConsecutiveCorrectAnswers(0);
          const cacheSize = Math.max(PROBLEM_CACHE_SIZE, targetProblemCount - (currentIndex + 1));
          const newProblems = Array(cacheSize).fill(null).map(() => generateDivisionProblem(getDifficultyFromNumber(nextDifficulty)));
          setProblemCache(prev => [...prev.slice(0, currentIndex + 1), ...newProblems]);
        }
      }
      shouldProceed = true;
    } else {
      if (userSettings.enableAdaptiveDifficulty) setConsecutiveCorrectAnswers(0);
      const hasAttemptsLeft = userSettings.maxAttempts === 0 || attemptsSoFar < userSettings.maxAttempts;
      
      if (hasAttemptsLeft) {
        const attemptsRemaining = userSettings.maxAttempts === 0 ? 'Unlimited' : userSettings.maxAttempts - attemptsSoFar;
        setError(`Incorrect. Attempts left: ${attemptsRemaining}`);
        setFeedback({ correct: false, message: `Incorrect. Try again!` });
        setInputValue('');
        isSubmitting.current = false;
      } else {
        const displayCorrectAnswer = !Number.isInteger(currentProblem.correctAnswer) 
          ? currentProblem.correctAnswer.toFixed(DECIMAL_PRECISION) 
          : currentProblem.correctAnswer;
        setFeedback({ correct: false, message: `Incorrect. No attempts left. The answer was ${displayCorrectAnswer}.` });
        setUserAnswers(prev => [...prev, {
          problem: currentProblem,
          userAnswer: numericAnswer,
          isCorrect: false,
          wasRevealed: false,
          timeSpent,
          attemptsMade: attemptsSoFar,
          difficultyLevel: currentExerciseDifficulty,
          displayFormat: currentDisplayFormat
        }]);
        
        emitProgress({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsSoFar, revealed: false });
        
        if (userSettings.enableCompensation) {
          setTargetProblemCount(prev => prev + 1);
        }
        shouldProceed = true;
      }
    }
    
    if (shouldProceed) triggerContinuation();
  };

  // Show answer
  const handleShowAnswer = () => {
    if (isAnswerRevealed || showContinueButton || isSubmitting.current || !currentProblem) return;
    
    isSubmitting.current = true;
    if (userSettings.enableAdaptiveDifficulty) setConsecutiveCorrectAnswers(0);
    
    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const attemptsCounted = userSettings.maxAttempts > 0 ? userSettings.maxAttempts : 1;
    setIsAnswerRevealed(true);
    
    const displayCorrectAnswer = !Number.isInteger(currentProblem.correctAnswer) 
      ? currentProblem.correctAnswer.toFixed(DECIMAL_PRECISION) 
      : currentProblem.correctAnswer;
    setFeedback({ correct: false, message: `Answer revealed: ${displayCorrectAnswer}` });
    setUserAnswers(prev => [...prev, {
      problem: currentProblem,
      userAnswer: null,
      isCorrect: false,
      wasRevealed: true,
      timeSpent,
      attemptsMade: attemptsCounted,
      difficultyLevel: currentExerciseDifficulty,
      displayFormat: currentDisplayFormat
    }]);
    
    emitProgress({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsCounted, revealed: true });
    
    if (userSettings.enableCompensation) {
      setTargetProblemCount(prev => prev + 1);
    }
    
    setError('');
    setInputValue('');
    triggerContinuation();
  };

  // Auto continue change
  const handleAutoContinueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsAutoContinueEnabled(isChecked);
    
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    
    if (isChecked) {
      setShowAutoContinueTooltip(true);
      tooltipTimerRef.current = setTimeout(() => setShowAutoContinueTooltip(false), TOOLTIP_DISPLAY_TIME);
    } else {
      setShowAutoContinueTooltip(false);
      if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
        if (feedback && !isComplete) setShowContinueButton(true);
      }
    }
  };

  // Restart exercise
  const restartExercise = () => setUserSettings(prev => ({ ...prev }));

  // Render division problem based on display format
  const renderDivisionProblem = (problem: DivisionProblem, format: DivisionDisplayFormat) => {
    const operatorSymbol = problem.operator;
    
    switch (format) {
      case 'long':
        return (
          <div className="inline-flex items-center text-4xl font-mono">
            <span className="mr-2">{problem.num1}</span>
            <div className="inline-block relative border-l-2 border-t-2 border-gray-500 dark:border-gray-400 px-2 pt-1">
              <span>{problem.num2}</span>
            </div>
            <span className="ml-2">= ?</span>
          </div>
        );
      case 'slash':
        return (
          <div className="text-4xl font-mono">
            {problem.num1} / {problem.num2} = ?
          </div>
        );
      case 'obelus':
      default:
        return (
          <div className="text-4xl font-mono">
            {problem.num1} {operatorSymbol} {problem.num2} = ?
          </div>
        );
    }
  };

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading division exercise...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="w-full max-w-4xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={restartExercise}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </Button>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Problem {currentIndex + 1} of {targetProblemCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Level: {currentExerciseDifficulty}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <ProgressBarUI 
            value={(currentIndex / targetProblemCount) * 100} 
            className="h-2"
          />
        </div>

        {/* Problem Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6">
            {renderDivisionProblem(currentProblem, currentDisplayFormat)}
          </div>
          
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                ref={inputRef}
                type="number"
                step="0.01"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter your answer"
                className="text-2xl text-center w-48 h-14"
                disabled={isAnswerRevealed || showContinueButton}
              />
              <Button 
                type="submit" 
                size="lg"
                disabled={isAnswerRevealed || showContinueButton}
              >
                <Check className="w-5 h-5 mr-2" />
                Submit
              </Button>
            </div>
            
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </form>
          
          {/* Feedback */}
          {feedback && (
            <div className={`text-center mt-4 p-3 rounded-lg ${
              feedback.correct 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {feedback.message}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            {!isAnswerRevealed && !showContinueButton && (
              <Button
                variant="outline"
                onClick={handleShowAnswer}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Show Answer</span>
              </Button>
            )}
            
            {showContinueButton && (
              <Button
                onClick={handleContinue}
                className="flex items-center space-x-2"
              >
                <ChevronRight className="w-4 h-4" />
                <span>Continue</span>
              </Button>
            )}
          </div>
        </div>

        {/* Auto Continue Toggle */}
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="autoContinue"
            checked={isAutoContinueEnabled}
            onChange={handleAutoContinueChange}
            className="rounded"
          />
          <label htmlFor="autoContinue" className="text-sm text-gray-600 dark:text-gray-400">
            Auto-continue after correct answers
          </label>
        </div>
      </div>

      {/* Completion Screen */}
      {isComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Exercise Complete!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You've completed {targetProblemCount} division problems!
              </p>
              <div className="space-y-2 mb-6">
                <p>Correct answers: {userAnswers.filter(a => a.isCorrect).length}</p>
                <p>Accuracy: {Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100)}%</p>
              </div>
              <Button onClick={restartExercise} className="w-full">
                Start New Exercise
              </Button>
            </div>
          </div>
        </div>
      )}

      <LevelUpHandler />
      <RewardModal />
    </div>
  );
}