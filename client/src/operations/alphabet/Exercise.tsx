import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Settings, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Eye,
  EyeOff
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

interface ExerciseProps {
  settings: AlphabetSettings;
  onOpenSettings: () => void;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Core state
  const [currentProblem, setCurrentProblem] = useState<AlphabetProblem | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [guidedSequence, setGuidedSequence] = useState<number[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedLetters, setCompletedLetters] = useState<string[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<UserAnswerType[]>([]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(settings.timerDuration);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  // UI state
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackColor, setFeedbackColor] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showWordAssociation, setShowWordAssociation] = useState(true);
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(settings.audioEnabled);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  // Generate guided sequence on mount
  useEffect(() => {
    const sequence = generateGuidedSequence(settings);
    setGuidedSequence(sequence);
  }, [settings.difficulty]);

  // Generate initial problem
  useEffect(() => {
    if (guidedSequence.length > 0) {
      generateNewProblem();
    }
  }, [guidedSequence, currentPosition]);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionTimeout();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, isPaused, timeLeft]);

  // Auto-speak letter on load
  useEffect(() => {
    if (currentProblem && audioEnabled && isActive) {
      const textToSpeak = settings.language === 'spanish' 
        ? `Letra ${currentProblem.letter}. ${currentProblem.associatedWord.spanish}`
        : `Letter ${currentProblem.letter}. ${currentProblem.associatedWord.english}`;
      
      setTimeout(() => speakText(textToSpeak, settings.language), 500);
    }
  }, [currentProblem, audioEnabled, settings.language, isActive]);

  const generateNewProblem = useCallback(() => {
    if (guidedSequence.length === 0) return;
    
    const position = settings.learningMode === 'guided' 
      ? guidedSequence[currentPosition % guidedSequence.length]
      : Math.floor(Math.random() * 26);
      
    const problem = generateAlphabetProblem(settings, position);
    setCurrentProblem(problem);
    setUserAnswer('');
    setAttempts(0);
    setFeedbackMessage('');
    setShowAnswer(false);
    
    // Focus input for quiz mode
    if (settings.learningMode === 'quiz') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [settings, currentPosition, guidedSequence]);

  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
    setSessionStartTime(Date.now());
    setTimeLeft(settings.timerDuration);
    setCurrentPosition(0);
    setCompletedLetters([]);
    setExerciseHistory([]);
    generateNewProblem();
  };

  const pauseSession = () => {
    setIsPaused(!isPaused);
  };

  const handleSessionTimeout = () => {
    setIsActive(false);
    setFeedbackMessage(
      settings.language === 'spanish' 
        ? '¡Tiempo agotado! Sesión completada.'
        : 'Time\'s up! Session completed.'
    );
    setFeedbackColor('blue');
  };

  const handleLetterNavigation = (direction: 'prev' | 'next') => {
    if (settings.learningMode === 'exploration') {
      const newPosition = direction === 'next' 
        ? (currentPosition + 1) % 26
        : (currentPosition - 1 + 26) % 26;
      setCurrentPosition(newPosition);
    }
  };

  const handleAnswerSubmit = () => {
    if (!currentProblem || settings.learningMode !== 'quiz') return;

    const isCorrect = validateAnswer(currentProblem, userAnswer);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const answerEntry: UserAnswerType = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer: userAnswer,
      isCorrect,
      status: 'completed',
      attempts: newAttempts,
      timestamp: Date.now()
    };

    setExerciseHistory(prev => [...prev, answerEntry]);

    if (isCorrect) {
      setFeedbackMessage(
        settings.language === 'spanish' 
          ? `¡Correcto! ${currentProblem.letter} es la respuesta correcta.`
          : `Correct! ${currentProblem.letter} is the right answer.`
      );
      setFeedbackColor('green');
      
      if (!completedLetters.includes(currentProblem.letter)) {
        setCompletedLetters(prev => [...prev, currentProblem.letter]);
      }

      if (audioEnabled) {
        const successText = settings.language === 'spanish' ? '¡Muy bien!' : 'Great job!';
        speakText(successText, settings.language);
      }

      // Auto-advance after delay
      setTimeout(() => {
        if (settings.autoAdvance) {
          moveToNextLetter();
        }
      }, 2000);
    } else {
      setFeedbackMessage(
        settings.language === 'spanish' 
          ? `Incorrecto. La respuesta era: ${currentProblem.correctAnswer}`
          : `Incorrect. The answer was: ${currentProblem.correctAnswer}`
      );
      setFeedbackColor('red');
      
      if (settings.enableHints && newAttempts >= 2) {
        setShowAnswer(true);
      }
    }
  };

  const moveToNextLetter = () => {
    if (settings.learningMode === 'guided') {
      setCurrentPosition(prev => (prev + 1) % guidedSequence.length);
    } else {
      generateNewProblem();
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(prev => !prev);
  };

  const speakCurrentLetter = () => {
    if (currentProblem && audioEnabled) {
      const word = settings.language === 'spanish' 
        ? currentProblem.associatedWord.spanish
        : currentProblem.associatedWord.english;
      speakText(`${currentProblem.letter}. ${word}`, settings.language);
    }
  };

  const toggleWordAssociation = () => {
    setShowWordAssociation(prev => !prev);
  };

  const getDifficultyDescription = () => {
    switch (settings.difficulty) {
      case 'beginner':
        return settings.language === 'spanish' 
          ? 'Exploración libre del alfabeto'
          : 'Free alphabet exploration';
      case 'intermediate':
        return settings.language === 'spanish' 
          ? 'Secuencia de letras'
          : 'Letter sequence';
      case 'advanced':
        return settings.language === 'spanish' 
          ? 'Asociación de palabras'
          : 'Word association';
      default:
        return '';
    }
  };

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>{settings.language === 'spanish' ? 'Cargando...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alphabet-learning-module space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {settings.language === 'spanish' ? 'Aprendizaje del Alfabeto' : 'Alphabet Learning'}
          </h2>
          <Badge variant="outline">
            {getDifficultyDescription()}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAudio}>
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {settings.language === 'spanish' ? 'Progreso del alfabeto' : 'Alphabet progress'}
          </span>
          <span>{getAlphabetProgress(completedLetters)}%</span>
        </div>
        <Progress value={getAlphabetProgress(completedLetters)} className="w-full" />
      </div>

      {/* Timer */}
      {isActive && (
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-blue-600">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Main letter display */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold" style={{ color: currentProblem.color }}>
            {currentProblem.letter}
            {settings.showLowercase && (
              <span className="text-4xl ml-4">{currentProblem.letter.toLowerCase()}</span>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* SVG illustration */}
          <div 
            className="mx-auto w-32 h-32 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: currentProblem.associatedImage }}
          />

          {/* Word association */}
          <AnimatePresence>
            {showWordAssociation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-2"
              >
                <p className="text-2xl font-semibold">
                  {settings.language === 'spanish' 
                    ? currentProblem.associatedWord.spanish 
                    : currentProblem.associatedWord.english}
                </p>
                <p className="text-gray-600">
                  {settings.language === 'spanish' 
                    ? `${currentProblem.letter} de ${currentProblem.associatedWord.spanish}`
                    : `${currentProblem.letter} for ${currentProblem.associatedWord.english}`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio button */}
          <Button variant="outline" onClick={speakCurrentLetter} disabled={!audioEnabled}>
            <Volume2 className="w-4 h-4 mr-2" />
            {settings.language === 'spanish' ? 'Escuchar' : 'Listen'}
          </Button>
        </CardContent>
      </Card>

      {/* Quiz input (for quiz mode) */}
      {settings.learningMode === 'quiz' && isActive && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg mb-4">
                  {settings.difficulty === 'beginner' && (
                    settings.language === 'spanish' 
                      ? '¿Qué letra es esta?' 
                      : 'What letter is this?'
                  )}
                  {settings.difficulty === 'intermediate' && (
                    settings.language === 'spanish' 
                      ? '¿Qué letra viene después?' 
                      : 'What letter comes next?'
                  )}
                  {settings.difficulty === 'advanced' && (
                    settings.language === 'spanish' 
                      ? '¿Con qué letra comienza esta palabra?' 
                      : 'What letter does this word start with?'
                  )}
                </p>
              </div>
              
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  ref={inputRef}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                  placeholder={settings.language === 'spanish' ? 'Tu respuesta...' : 'Your answer...'}
                  maxLength={1}
                  className="text-center text-xl"
                />
                <Button onClick={handleAnswerSubmit} disabled={!userAnswer.trim()}>
                  {settings.language === 'spanish' ? 'Enviar' : 'Submit'}
                </Button>
              </div>

              {/* Show answer hint */}
              {showAnswer && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800">
                    {settings.language === 'spanish' ? 'Pista: ' : 'Hint: '}
                    {currentProblem.correctAnswer}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation controls */}
      <div className="flex justify-center items-center gap-4">
        {settings.learningMode === 'exploration' && (
          <>
            <Button variant="outline" onClick={() => handleLetterNavigation('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {currentPosition + 1} / 26
            </span>
            <Button variant="outline" onClick={() => handleLetterNavigation('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        <Button variant="outline" onClick={toggleWordAssociation}>
          {showWordAssociation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="ml-2">
            {settings.language === 'spanish' ? 'Palabra' : 'Word'}
          </span>
        </Button>
      </div>

      {/* Control buttons */}
      <div className="flex justify-center gap-4">
        {!isActive ? (
          <Button onClick={startSession} className="px-8">
            <Play className="w-4 h-4 mr-2" />
            {settings.language === 'spanish' ? 'Comenzar' : 'Start'}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={pauseSession}>
              <Pause className="w-4 h-4 mr-2" />
              {isPaused 
                ? (settings.language === 'spanish' ? 'Reanudar' : 'Resume')
                : (settings.language === 'spanish' ? 'Pausar' : 'Pause')
              }
            </Button>
            
            {settings.learningMode !== 'exploration' && (
              <Button variant="outline" onClick={moveToNextLetter}>
                <ChevronRight className="w-4 h-4 mr-2" />
                {settings.language === 'spanish' ? 'Siguiente' : 'Next'}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`text-center p-4 rounded-lg ${
              feedbackColor === 'green' ? 'bg-green-100 text-green-800' :
              feedbackColor === 'red' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {feedbackMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed letters display */}
      {completedLetters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {settings.language === 'spanish' ? 'Letras Completadas' : 'Completed Letters'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {completedLetters.map(letter => (
                <Badge key={letter} variant="default" className="text-lg p-2">
                  {letter}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}