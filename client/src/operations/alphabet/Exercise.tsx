import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  RotateCcw, 
  Volume2,
  VolumeX,
  Star,
  Play,
  Pause,
  Home,
  BookOpen,
  Brain,
  Trophy
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { ModuleSettings } from '@/types/settings';
import { AlphabetItem, AlphabetAnswer, AlphabetMode, AlphabetSettings, AlphabetState } from './types';
import { getCompleteAlphabet, getNextLetter, getPreviousLetter } from './alphabetData';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Base state
  const [alphabet] = useState<AlphabetItem[]>(getCompleteAlphabet());
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [mode, setMode] = useState<AlphabetMode>('exploration');
  const [isPlaying, setIsPlaying] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackColor, setFeedbackColor] = useState('');
  
  // Progress tracking
  const [visitedLetters, setVisitedLetters] = useState<Set<string>>(new Set());
  const [completedLetters, setCompletedLetters] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<AlphabetAnswer[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  
  // Alphabet-specific settings
  const [alphabetSettings, setAlphabetSettings] = useState<AlphabetSettings>({
    level: 'beginner',
    showLowercase: true,
    showColors: true,
    audioEnabled: true,
    fontStyle: 'basic',
    autoAdvance: false,
    celebrateCompletion: true,
    quizFrequency: 'occasionally',
    language: 'english'
  });

  // Update language when global settings change
  useEffect(() => {
    const currentLanguage = globalSettings.language === 'spanish' ? 'spanish' : 'english';
    console.log('Global settings language:', globalSettings.language, 'Module settings language:', settings.language, 'Alphabet language:', currentLanguage);
    setAlphabetSettings(prev => ({
      ...prev,
      language: currentLanguage
    }));
  }, [globalSettings.language, settings.language]);

  // Translation helper
  const t = (englishText: string, spanishText: string) => {
    return alphabetSettings.language === 'spanish' ? spanishText : englishText;
  };

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Current letter
  const currentLetter = alphabet[currentLetterIndex] || alphabet[0];

  // Audio synthesis for pronunciation
  const playPronunciation = useCallback((text: string, lang: string) => {
    if (!alphabetSettings.audioEnabled) return;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'spanish' ? 'es-ES' : 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      speechSynthesis.speak(utterance);
    }
  }, [alphabetSettings.audioEnabled]);

  // Navigation functions
  const goToNextLetter = useCallback(() => {
    if (currentLetterIndex < alphabet.length - 1) {
      setCurrentLetterIndex(prev => prev + 1);
      setUserInput('');
      setShowAnswer(false);
      setFeedback('');
      setAttempts(0);
      setStartTime(Date.now());
    }
  }, [currentLetterIndex, alphabet.length]);

  const goToPreviousLetter = useCallback(() => {
    if (currentLetterIndex > 0) {
      setCurrentLetterIndex(prev => prev - 1);
      setUserInput('');
      setShowAnswer(false);
      setFeedback('');
      setAttempts(0);
      setStartTime(Date.now());
    }
  }, [currentLetterIndex]);

  // Mark letter as visited
  useEffect(() => {
    if (currentLetter) {
      setVisitedLetters(prev => new Set([...prev, currentLetter.letter]));
    }
  }, [currentLetter]);

  // Auto-play pronunciation when letter changes
  useEffect(() => {
    if (currentLetter && mode === 'exploration') {
      const timer = setTimeout(() => {
        const word = alphabetSettings.language === 'spanish' 
          ? currentLetter.word.spanish 
          : currentLetter.word.english;
        playPronunciation(`${currentLetter.letter}. ${word}`, alphabetSettings.language);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLetter, mode, alphabetSettings.language, playPronunciation]);

  // Check for quiz mode triggers
  const shouldShowQuiz = useCallback(() => {
    if (alphabetSettings.quizFrequency === 'never') return false;
    if (alphabetSettings.level === 'beginner') return false;
    
    const threshold = alphabetSettings.quizFrequency === 'frequent' ? 3 : 5;
    return visitedLetters.size > 0 && visitedLetters.size % threshold === 0;
  }, [alphabetSettings.quizFrequency, alphabetSettings.level, visitedLetters.size]);

  // Handle quiz answer submission
  const handleQuizSubmit = useCallback(() => {
    if (!userInput.trim()) return;

    const correctAnswer = alphabetSettings.language === 'spanish' 
      ? currentLetter.word.spanish.toLowerCase()
      : currentLetter.word.english.toLowerCase();
    
    const isCorrect = userInput.toLowerCase().trim() === correctAnswer;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Create answer record
    const answer: AlphabetAnswer = {
      id: `${currentLetter.id}-${Date.now()}`,
      letterId: currentLetter.id,
      letter: currentLetter,
      userAnswer: userInput.trim(),
      isCorrect,
      mode,
      timestamp: Date.now(),
      attempts: newAttempts,
      timeSpent: Date.now() - startTime
    };

    setHistory(prev => [...prev, answer]);

    if (isCorrect) {
      setFeedback(alphabetSettings.language === 'spanish' ? 
        `¡Correcto! ${currentLetter.letter} es para ${currentLetter.word.spanish}` :
        `Correct! ${currentLetter.letter} is for ${currentLetter.word.english}`
      );
      setFeedbackColor('green');
      setCompletedLetters(prev => new Set([...prev, currentLetter.letter]));
      
      if (alphabetSettings.autoAdvance) {
        setTimeout(goToNextLetter, 2000);
      }
    } else {
      setFeedback(alphabetSettings.language === 'spanish' ? 
        `Intenta de nuevo. ${currentLetter.letter} es para ${currentLetter.word.spanish}` :
        `Try again. ${currentLetter.letter} is for ${currentLetter.word.english}`
      );
      setFeedbackColor('red');
      setShowAnswer(true);
    }

    playPronunciation(
      isCorrect ? (alphabetSettings.language === 'spanish' ? '¡Correcto!' : 'Correct!') : 
      (alphabetSettings.language === 'spanish' ? 'Intenta de nuevo' : 'Try again'),
      alphabetSettings.language
    );
  }, [userInput, attempts, currentLetter, alphabetSettings, mode, startTime, goToNextLetter, playPronunciation]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (mode === 'quiz' && event.key === 'Enter') {
        handleQuizSubmit();
      } else if (event.key === 'ArrowRight') {
        goToNextLetter();
      } else if (event.key === 'ArrowLeft') {
        goToPreviousLetter();
      } else if (event.key === ' ') {
        event.preventDefault();
        const word = alphabetSettings.language === 'spanish' 
          ? currentLetter.word.spanish 
          : currentLetter.word.english;
        playPronunciation(`${currentLetter.letter}. ${word}`, alphabetSettings.language);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [mode, handleQuizSubmit, goToNextLetter, goToPreviousLetter, currentLetter, alphabetSettings, playPronunciation]);

  // Calculate progress
  const progress = Math.round((visitedLetters.size / alphabet.length) * 100);
  const completionProgress = Math.round((completedLetters.size / alphabet.length) * 100);

  // Mode switching
  const switchMode = (newMode: AlphabetMode) => {
    setMode(newMode);
    setUserInput('');
    setShowAnswer(false);
    setFeedback('');
    setAttempts(0);
    setStartTime(Date.now());
  };

  return (
    <div className="alphabet-learning-module min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {alphabetSettings.language === 'spanish' ? 'Aprendizaje del Alfabeto' : 'Alphabet Learning'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {alphabetSettings.language === 'spanish' ? 
                  `Letra ${currentLetterIndex + 1} de ${alphabet.length}` :
                  `Letter ${currentLetterIndex + 1} of ${alphabet.length}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlphabetSettings(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }))}
            >
              {alphabetSettings.audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {alphabetSettings.language === 'spanish' ? 'Progreso de Exploración' : 'Exploration Progress'}
              </span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 mb-3" />
            
            {alphabetSettings.level !== 'beginner' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {alphabetSettings.language === 'spanish' ? 'Letras Dominadas' : 'Letters Mastered'}
                  </span>
                  <span className="text-sm text-gray-600">{completionProgress}%</span>
                </div>
                <Progress value={completionProgress} className="h-2" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Mode Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={mode === 'exploration' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchMode('exploration')}
                className="flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {alphabetSettings.language === 'spanish' ? 'Exploración' : 'Exploration'}
              </Button>
              
              <Button
                variant={mode === 'guided' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchMode('guided')}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {alphabetSettings.language === 'spanish' ? 'Guiado' : 'Guided'}
              </Button>
              
              {alphabetSettings.level !== 'beginner' && (
                <Button
                  variant={mode === 'quiz' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchMode('quiz')}
                  className="flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {alphabetSettings.language === 'spanish' ? 'Cuestionario' : 'Quiz'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Learning Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Letter Display */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentLetter.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    {/* Letter Display */}
                    <div 
                      className="inline-block mb-6 p-8 rounded-3xl shadow-lg"
                      style={{ 
                        backgroundColor: alphabetSettings.showColors ? currentLetter.color : '#f8f9fa',
                        color: alphabetSettings.showColors ? '#ffffff' : '#2d3436'
                      }}
                    >
                      <div 
                        className={`text-8xl font-bold ${
                          alphabetSettings.fontStyle === 'decorative' ? 'font-serif' :
                          alphabetSettings.fontStyle === 'handwriting' ? 'font-mono' : 'font-sans'
                        }`}
                      >
                        {currentLetter.letter}
                      </div>
                      {alphabetSettings.showLowercase && (
                        <div 
                          className={`text-4xl mt-2 ${
                            alphabetSettings.fontStyle === 'decorative' ? 'font-serif' :
                            alphabetSettings.fontStyle === 'handwriting' ? 'font-mono' : 'font-sans'
                          }`}
                        >
                          {currentLetter.lowercase}
                        </div>
                      )}
                    </div>

                    {/* Image */}
                    <div className="mb-6">
                      <div 
                        className="w-32 h-32 mx-auto bg-white rounded-2xl shadow-md flex items-center justify-center"
                        dangerouslySetInnerHTML={{ 
                          __html: alphabetSettings.language === 'spanish' 
                            ? currentLetter.image.svg
                                .replace('id="apple"', 'id="apple" style="display: none;"')
                                .replace('id="airplane" style="display: none;"', 'id="airplane"')
                            : currentLetter.image.svg
                        }}
                      />
                    </div>

                    {/* Word */}
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {alphabetSettings.language === 'spanish' ? 
                          currentLetter.word.spanish : 
                          currentLetter.word.english
                        }
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        {alphabetSettings.language === 'spanish' ? 
                          currentLetter.image.alt.spanish : 
                          currentLetter.image.alt.english
                        }
                      </p>
                    </div>

                    {/* Pronunciation Button */}
                    <Button
                      onClick={() => {
                        const word = alphabetSettings.language === 'spanish' 
                          ? currentLetter.word.spanish 
                          : currentLetter.word.english;
                        playPronunciation(`${currentLetter.letter}. ${word}`, alphabetSettings.language);
                      }}
                      className="mb-6"
                      size="lg"
                    >
                      <Volume2 className="w-5 h-5 mr-2" />
                      {alphabetSettings.language === 'spanish' ? 'Escuchar' : 'Listen'}
                    </Button>

                    {/* Quiz Mode Input */}
                    {mode === 'quiz' && alphabetSettings.level !== 'beginner' && (
                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {alphabetSettings.language === 'spanish' ? 
                              `¿Qué palabra empieza con ${currentLetter.letter}?` :
                              `What word starts with ${currentLetter.letter}?`
                            }
                          </label>
                          <div className="flex gap-2">
                            <Input
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              placeholder={alphabetSettings.language === 'spanish' ? 'Escribe tu respuesta...' : 'Type your answer...'}
                              onKeyPress={(e) => e.key === 'Enter' && handleQuizSubmit()}
                              disabled={showAnswer}
                              className="flex-1"
                            />
                            <Button onClick={handleQuizSubmit} disabled={showAnswer || !userInput.trim()}>
                              {alphabetSettings.language === 'spanish' ? 'Enviar' : 'Submit'}
                            </Button>
                          </div>
                        </div>

                        {feedback && (
                          <div 
                            className={`p-3 rounded-lg text-center font-medium ${
                              feedbackColor === 'green' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {alphabetSettings.language === 'spanish' ? 'Navegación' : 'Navigation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={goToPreviousLetter}
                    disabled={currentLetterIndex === 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {alphabetSettings.language === 'spanish' ? 'Anterior' : 'Previous'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={goToNextLetter}
                    disabled={currentLetterIndex === alphabet.length - 1}
                    className="flex-1"
                  >
                    {alphabetSettings.language === 'spanish' ? 'Siguiente' : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                
                {/* Letter Grid */}
                <div className="grid grid-cols-5 gap-1">
                  {alphabet.map((letter, index) => (
                    <Button
                      key={letter.id}
                      variant={index === currentLetterIndex ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentLetterIndex(index);
                        setUserInput('');
                        setShowAnswer(false);
                        setFeedback('');
                        setAttempts(0);
                        setStartTime(Date.now());
                      }}
                      className={`aspect-square p-0 text-xs relative ${
                        completedLetters.has(letter.letter) ? 'border-green-500' : ''
                      }`}
                    >
                      {letter.letter}
                      {completedLetters.has(letter.letter) && (
                        <Trophy className="w-2 h-2 absolute top-0 right-0 text-yellow-500" />
                      )}
                      {visitedLetters.has(letter.letter) && !completedLetters.has(letter.letter) && (
                        <div className="w-1 h-1 absolute top-0 right-0 bg-blue-500 rounded-full" />
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {alphabetSettings.language === 'spanish' ? 'Estadísticas' : 'Statistics'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">
                      {alphabetSettings.language === 'spanish' ? 'Letras Visitadas:' : 'Letters Visited:'}
                    </span>
                    <Badge variant="secondary">{visitedLetters.size}/{alphabet.length}</Badge>
                  </div>
                  
                  {alphabetSettings.level !== 'beginner' && (
                    <div className="flex justify-between">
                      <span className="text-sm">
                        {alphabetSettings.language === 'spanish' ? 'Letras Dominadas:' : 'Letters Mastered:'}
                      </span>
                      <Badge variant="secondary">{completedLetters.size}/{alphabet.length}</Badge>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm">
                      {alphabetSettings.language === 'spanish' ? 'Sesión Actual:' : 'Current Session:'}
                    </span>
                    <Badge variant="secondary">{history.length} {alphabetSettings.language === 'spanish' ? 'respuestas' : 'answers'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completion Celebration */}
            {visitedLetters.size === alphabet.length && alphabetSettings.celebrateCompletion && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <CardContent className="p-4 text-center">
                  <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-200">
                    {alphabetSettings.language === 'spanish' ? '¡Felicitaciones!' : 'Congratulations!'}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {alphabetSettings.language === 'spanish' ? 
                      '¡Has explorado todo el alfabeto!' : 
                      'You\'ve explored the entire alphabet!'
                    }
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentLetterIndex(0);
                      setVisitedLetters(new Set());
                      setCompletedLetters(new Set());
                      setHistory([]);
                    }}
                    className="mt-2"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    {alphabetSettings.language === 'spanish' ? 'Comenzar de Nuevo' : 'Start Over'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}