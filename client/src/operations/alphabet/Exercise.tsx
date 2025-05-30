import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBarUI } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Star,
  Award,
  History,
  Cog,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { AlphabetProblem, AlphabetSettings, UserAnswerType } from './types';
import { 
  generateAlphabetProblem, 
  generateSVGImage, 
  speakText, 
  validateAnswer, 
  getAlphabetProgress,
  generateGuidedSequence,
  ALPHABET_DATA
} from './utils';
import { Link } from "wouter";
import { formatTime } from "@/lib/utils";

interface ExerciseProps {
  settings: AlphabetSettings;
  onOpenSettings: () => void;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Core state similar to math modules
  const [currentProblem, setCurrentProblem] = useState<AlphabetProblem | null>(null);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [problemsList, setProblemsList] = useState<AlphabetProblem[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<UserAnswerType[]>([]);
  
  // Timer state like math modules
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exerciseStartTime, setExerciseStartTime] = useState<number>(0);
  
  // Score and progress
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  
  // UI state
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(settings.audioEnabled);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate problems list on initialization
  const generateProblemsList = useCallback(() => {
    const problems: AlphabetProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      const position = Math.floor(Math.random() * 26);
      const problem = generateAlphabetProblem(settings, position);
      problems.push(problem);
    }
    setProblemsList(problems);
    setCurrentProblem(problems[0]);
  }, [settings]);

  // Initialize exercise
  useEffect(() => {
    if (!exerciseStarted && problemsList.length === 0) {
      generateProblemsList();
    }
  }, [generateProblemsList, exerciseStarted, problemsList.length]);

  // Timer effect
  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [exerciseStarted, exerciseCompleted]);

  const startExercise = () => {
    setExerciseStarted(true);
    setExerciseStartTime(Date.now());
    setElapsedTime(0);
    setCurrentLetterIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setExerciseHistory([]);
    setUserAnswer('');
    
    if (currentProblem && audioEnabled) {
      setTimeout(() => {
        const word = settings.language === 'spanish' 
          ? currentProblem.associatedWord.spanish
          : currentProblem.associatedWord.english;
        speakText(`${currentProblem.letter}. ${word}`, settings.language);
      }, 500);
    }
  };

  const handleLetterInput = (input: string) => {
    if (isAnswering || exerciseCompleted) return;
    
    setUserAnswer(input.toUpperCase());
    
    if (input.length === 1) {
      setTimeout(() => {
        checkAnswer(input.toUpperCase());
      }, 300);
    }
  };

  const checkAnswer = (answer: string) => {
    if (!currentProblem || isAnswering) return;
    
    setIsAnswering(true);
    setTotalAttempts(prev => prev + 1);
    
    const isCorrect = validateAnswer(currentProblem, answer);
    
    const answerEntry: UserAnswerType = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer: answer,
      isCorrect,
      status: 'completed',
      attempts: 1,
      timestamp: Date.now()
    };

    setExerciseHistory(prev => [...prev, answerEntry]);

    if (isCorrect) {
      setScore(prev => prev + 10);
      setCorrectAnswers(prev => prev + 1);
      setFeedbackMessage(
        settings.language === 'spanish' 
          ? '¡Correcto! ¡Muy bien!' 
          : 'Correct! Great job!'
      );
      setShowCelebration(true);
      
      if (audioEnabled) {
        const successText = settings.language === 'spanish' ? '¡Excelente!' : 'Excellent!';
        speakText(successText, settings.language);
      }
      
      setTimeout(() => {
        moveToNextLetter();
      }, 1500);
    } else {
      setFeedbackMessage(
        settings.language === 'spanish' 
          ? `La respuesta correcta es: ${currentProblem.letter}`
          : `The correct answer is: ${currentProblem.letter}`
      );
      setShowCorrectAnswer(true);
      
      setTimeout(() => {
        moveToNextLetter();
      }, 2500);
    }
  };

  const moveToNextLetter = () => {
    setIsAnswering(false);
    setShowCelebration(false);
    setShowCorrectAnswer(false);
    setFeedbackMessage('');
    setUserAnswer('');
    
    if (currentLetterIndex + 1 >= problemsList.length) {
      // Exercise completed
      setExerciseCompleted(true);
      const finalScore = Math.round((correctAnswers / totalAttempts) * 100);
      setFeedbackMessage(
        settings.language === 'spanish' 
          ? `¡Ejercicio completado! Puntuación: ${finalScore}%`
          : `Exercise completed! Score: ${finalScore}%`
      );
    } else {
      // Move to next letter
      const nextIndex = currentLetterIndex + 1;
      setCurrentLetterIndex(nextIndex);
      setCurrentProblem(problemsList[nextIndex]);
      
      // Auto-pronounce next letter
      if (audioEnabled) {
        setTimeout(() => {
          const nextProblem = problemsList[nextIndex];
          const word = settings.language === 'spanish' 
            ? nextProblem.associatedWord.spanish
            : nextProblem.associatedWord.english;
          speakText(`${nextProblem.letter}. ${word}`, settings.language);
        }, 300);
      }
    }
  };

  const resetExercise = () => {
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setCurrentLetterIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setElapsedTime(0);
    setExerciseHistory([]);
    setUserAnswer('');
    setFeedbackMessage('');
    setShowCelebration(false);
    setShowCorrectAnswer(false);
    setIsAnswering(false);
    generateProblemsList();
  };

  const speakCurrentLetter = () => {
    if (currentProblem && audioEnabled) {
      const word = settings.language === 'spanish' 
        ? currentProblem.associatedWord.spanish
        : currentProblem.associatedWord.english;
      speakText(`${currentProblem.letter}. ${word}`, settings.language);
    }
  };

  const progressValue = problemsList.length > 0 
    ? Math.round(((currentLetterIndex + 1) / problemsList.length) * 100) 
    : 0;

  const isEnglish = settings.language === 'english';

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>{isEnglish ? 'Loading...' : 'Cargando...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alphabet-exercise-container max-w-4xl mx-auto p-4 space-y-4">
      {/* Header - Following math modules pattern */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            {isEnglish ? 'Alphabet Learning' : 'Aprendizaje del Alfabeto'}
          </h1>
          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
            settings.difficulty === "beginner" ? "bg-green-100 text-green-800" :
            settings.difficulty === "intermediate" ? "bg-orange-100 text-orange-800" :
            "bg-purple-100 text-purple-800"
          }`}>
            {isEnglish ? 'Level' : 'Nivel'}: {settings.difficulty === 'beginner' ? (isEnglish ? 'Beginner' : 'Principiante') :
            settings.difficulty === 'intermediate' ? (isEnglish ? 'Intermediate' : 'Intermedio') :
            (isEnglish ? 'Advanced' : 'Avanzado')}
          </span>
        </div>
      </div>

      <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1 bg-[#c5dbeb]" />

      {/* Controls Row - Following math modules pattern */}
      <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 flex-wrap">
        {/* Problem Progress */}
        <span className="hidden sm:inline font-semibold px-2 py-1 border border-gray-300 rounded-md text-xs bg-[#2563eb] text-[#ffffff]">
          {isEnglish ? 'Letter' : 'Letra'}: {currentLetterIndex + 1} {isEnglish ? 'of' : 'de'} {problemsList.length}
        </span>
        
        {/* Score */}
        <div className="flex flex-col items-center">
          <span className="font-semibold px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-xs">
            {isEnglish ? 'Score' : 'Puntos'}: {score}
          </span>
          <span className="text-xs mt-1 sm:hidden text-gray-500">{isEnglish ? 'Score' : 'Puntos'}</span>
        </div>

        {/* Audio Button */}
        <div className="flex flex-col items-center">
          <button
            className="px-2 py-1 flex items-center justify-center text-blue-600 border border-gray-300 rounded-md h-7 hover:bg-blue-50"
            onClick={speakCurrentLetter}
            disabled={!audioEnabled}
            title={isEnglish ? "Listen to pronunciation" : "Escuchar pronunciación"}
          >
            <Volume2 className="h-4 w-4" />
            <span className="text-xs font-medium ml-1 hidden sm:inline">
              {isEnglish ? 'Listen' : 'Escuchar'}
            </span>
          </button>
          <span className="text-xs mt-1 sm:hidden text-gray-500">
            {isEnglish ? 'Audio' : 'Audio'}
          </span>
        </div>

        {/* History button */}
        <Link href="/progress?tab=recent" className="hidden sm:flex">
          <Button variant="ghost" size="sm" className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
            <History className="h-4 w-4" /> 
            <span>{isEnglish ? "Exercise History" : "Historial de Ejercicios"}</span>
          </Button>
        </Link>

        {/* Settings button */}
        <Button variant="ghost" size="sm" onClick={onOpenSettings} className="hidden sm:flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
          <Cog className="h-4 w-4" /> 
          <span>{isEnglish ? 'Settings' : 'Configuración'}</span>
        </Button>
      </div>

      {/* Main Learning Area - Following math modules layout */}
      <div className="p-4 rounded-lg mb-4 shadow-sm bg-gray-50 border">
        {/* Letter Display */}
        <div className="text-center mb-6">
          <div 
            className="text-8xl sm:text-9xl font-bold mb-4"
            style={{ 
              color: currentProblem.color,
              fontFamily: settings.letterStyle === 'decorative' ? 'serif' : 
                          settings.letterStyle === 'manuscript' ? 'cursive' : 'sans-serif'
            }}
          >
            {currentProblem.letter}
            {settings.showLowercase && (
              <span className="text-6xl sm:text-7xl ml-4 opacity-75">
                {currentProblem.letter.toLowerCase()}
              </span>
            )}
          </div>

          {/* Word Association */}
          <div className="space-y-2">
            <div 
              className="mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center mb-4"
              dangerouslySetInnerHTML={{ __html: currentProblem.associatedImage }}
            />
            
            <p className="text-xl sm:text-2xl font-semibold text-gray-800">
              {settings.language === 'spanish' 
                ? currentProblem.associatedWord.spanish 
                : currentProblem.associatedWord.english}
            </p>
            
            <p className="text-sm sm:text-base text-gray-600">
              {settings.language === 'spanish' 
                ? `${currentProblem.letter} de ${currentProblem.associatedWord.spanish}`
                : `${currentProblem.letter} for ${currentProblem.associatedWord.english}`}
            </p>
          </div>
        </div>

        {/* Answer Input - Only show when exercise is started */}
        {exerciseStarted && !exerciseCompleted && (
          <div className="mt-6 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium text-gray-700">
                {settings.difficulty === 'beginner' && (
                  isEnglish ? 'What letter is this?' : '¿Qué letra es esta?'
                )}
                {settings.difficulty === 'intermediate' && (
                  isEnglish ? 'Type the letter you see:' : 'Escribe la letra que ves:'
                )}
                {settings.difficulty === 'advanced' && (
                  isEnglish ? 'What letter does this word start with?' : '¿Con qué letra comienza esta palabra?'
                )}
              </p>
              
              <div className="w-16 h-16 mx-auto">
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => handleLetterInput(e.target.value)}
                  maxLength={1}
                  className="w-full h-full text-3xl font-bold text-center border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-300 uppercase"
                  disabled={isAnswering || exerciseCompleted}
                  placeholder="?"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {!exerciseStarted ? (
          <Button onClick={startExercise} className="px-8 py-3 text-lg">
            <Play className="w-5 h-5 mr-2" />
            {isEnglish ? 'Start Learning' : 'Comenzar Aprendizaje'}
          </Button>
        ) : exerciseCompleted ? (
          <Button onClick={resetExercise} className="px-8 py-3 text-lg">
            <RotateCcw className="w-5 h-5 mr-2" />
            {isEnglish ? 'Try Again' : 'Intentar de Nuevo'}
          </Button>
        ) : null}
      </div>

      {/* Feedback Messages */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`text-center p-4 rounded-lg font-medium ${
              showCelebration ? 'bg-green-100 text-green-800' :
              showCorrectAnswer ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {feedbackMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Stats */}
      {exerciseStarted && (
        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>{isEnglish ? 'Time' : 'Tiempo'}: {formatTime(elapsedTime)}</p>
          <p>{isEnglish ? 'Correct' : 'Correctas'}: {correctAnswers} / {totalAttempts}</p>
        </div>
      )}
    </div>
  );
}