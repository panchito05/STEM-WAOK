import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Settings, ArrowLeft, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

import {
  AlphabetSettings,
  AlphabetProgress,
  AlphabetExerciseProps,
  AlphabetSettingsProps,
  AlphabetLetter,
  AlphabetLanguage,
  AlphabetLevel,
  Level1Activity,
  Level2Activity,
  Level3Activity,
  AlphabetGameState,
  DragItem,
  DropZone,
  DragDropState,
  WordCompletionData,
  LetterOption
} from './types';
import { alphabetData } from './data/alphabetData';

// Translation system
const translations = {
  english: {
    alphabetConfiguration: 'Alphabet Configuration',
    back: 'Back',
    primaryLanguage: 'Primary Language',
    english: 'English',
    spanish: 'Spanish',
    difficultyLevel: 'Difficulty Level',
    level1: 'Level 1 - Visual & Audio Recognition',
    level2: 'Level 2 - Letter Ordering',
    level3: 'Level 3 - Word Completion',
    level4: 'Level 4 - Sound-Letter Association',
    level5: 'Level 5 - Word Formation',
    audioEnabled: 'Audio Enabled',
    showBothLanguages: 'Show Both Languages',
    autoAdvance: 'Auto Advance (3s)',
    showTimer: 'Show Timer',
    timeLimit: 'Time Limit (seconds)',
    exerciseComplete: 'Exercise Complete!',
    congratulations: 'Congratulations!',
    nextLevel: 'Next Level',
    retry: 'Retry',
    continue: 'Continue',
    correct: 'Correct!',
    incorrect: 'Try again!',
    timeUp: 'Time up!',
    score: 'Score',
    attempts: 'Attempts',
    progress: 'Progress',
    playAgain: 'Play Again',
    next: 'Next',
    previous: 'Previous',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    settings: 'Settings',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    arrangeLetters: 'Arrange letters in alphabetical order',
    complete: 'Complete',
    selectMissingLetter: 'Select the missing letter',
    listenAndSelect: 'Listen and select the correct letter',
    formWords: 'Form words using the given letters'
  },
  spanish: {
    alphabetConfiguration: 'Configuración del Alfabeto',
    back: 'Atrás',
    primaryLanguage: 'Idioma Principal',
    english: 'Inglés',
    spanish: 'Español',
    difficultyLevel: 'Nivel de Dificultad',
    level1: 'Nivel 1 - Reconocimiento Visual y Auditivo',
    level2: 'Nivel 2 - Ordenamiento de Letras',
    level3: 'Nivel 3 - Completar Palabras',
    level4: 'Nivel 4 - Asociación Sonido-Letra',
    level5: 'Nivel 5 - Formación de Palabras',
    audioEnabled: 'Audio Habilitado',
    showBothLanguages: 'Mostrar Ambos Idiomas',
    autoAdvance: 'Avance Automático (3s)',
    showTimer: 'Mostrar Temporizador',
    timeLimit: 'Límite de Tiempo (segundos)',
    exerciseComplete: '¡Ejercicio Completado!',
    congratulations: '¡Felicitaciones!',
    nextLevel: 'Siguiente Nivel',
    retry: 'Reintentar',
    continue: 'Continuar',
    correct: '¡Correcto!',
    incorrect: '¡Inténtalo de nuevo!',
    timeUp: '¡Se acabó el tiempo!',
    score: 'Puntuación',
    attempts: 'Intentos',
    progress: 'Progreso',
    playAgain: 'Jugar de Nuevo',
    next: 'Siguiente',
    previous: 'Anterior',
    start: 'Comenzar',
    pause: 'Pausar',
    resume: 'Reanudar',
    reset: 'Reiniciar',
    settings: 'Configuración',
    close: 'Cerrar',
    save: 'Guardar',
    cancel: 'Cancelar',
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    arrangeLetters: 'Organiza las letras en orden alfabético',
    complete: 'Completar',
    selectMissingLetter: 'Selecciona la letra que falta',
    listenAndSelect: 'Escucha y selecciona la letra correcta',
    formWords: 'Forma palabras usando las letras dadas'
  }
};

const getTranslation = (language: AlphabetLanguage, key: string): string => {
  return translations[language][key as keyof typeof translations.english] || key;
};

// Default settings and progress
const defaultSettings: AlphabetSettings = {
  language: 'english',
  level: 'level1',
  difficulty: 'beginner',
  audioEnabled: true,
  showBothLanguages: false,
  autoAdvance: false,
  showTimer: true,
  timeLimit: 30
};

const defaultProgress: AlphabetProgress = {
  currentLevel: 'level1',
  currentLetterIndex: 0,
  completedLevels: [],
  score: 0,
  totalAttempts: 0,
  correctAnswers: 0,
  streakCount: 0,
  lastActivity: Date.now()
};

// Helper functions
const getLetterByIndex = (index: number): AlphabetLetter => {
  const normalizedIndex = Math.max(0, Math.min(25, index));
  return alphabetData[normalizedIndex];
};

const getRandomLetter = (): AlphabetLetter => {
  const randomIndex = Math.floor(Math.random() * alphabetData.length);
  return alphabetData[randomIndex];
};

// Image component with real images
const createLetterImage = (letter: string, language: AlphabetLanguage) => {
  const data = alphabetData.find(item => item.letter.toLowerCase() === letter.toLowerCase());
  
  if (!data) {
    return <div className="text-red-500">No data for {letter}</div>;
  }
  
  const word = language === 'spanish' ? data.words.spanish : data.words.english;
  const imageUrl = language === 'spanish' ? data.images.spanish : data.images.english;

  return (
    <div className="flex flex-col items-center space-y-2">
      <img 
        src={imageUrl} 
        alt={word}
        className="w-32 h-32 object-cover rounded-lg shadow-md"
        onError={(e) => {
          e.currentTarget.src = `https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=${letter}`;
        }}
      />
      <span className="text-sm font-medium text-gray-700">{word}</span>
    </div>
  );
};

// Audio pronunciation function
const pronounceLetter = (letter: AlphabetLetter, language: AlphabetLanguage) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = language === 'spanish' ? 
      `${letter.letter}. ${letter.words.spanish}` : 
      `${letter.letter}. ${letter.words.english}`;
    utterance.lang = language === 'spanish' ? 'es-ES' : 'en-US';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  }
};

// Level 1 Component - Visual and Audio Recognition
const Level1Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [currentLetterIndex, setCurrentLetterIndex] = useState(progress.currentLetterIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const currentLetter = getLetterByIndex(currentLetterIndex);

  const playAudio = useCallback(() => {
    if (!settings.audioEnabled) return;
    
    setIsPlaying(true);
    pronounceLetter(currentLetter, settings.language);
    
    if (settings.showBothLanguages) {
      setTimeout(() => {
        pronounceLetter(currentLetter, settings.language === 'spanish' ? 'english' : 'spanish');
      }, 1500);
    }
    
    setTimeout(() => setIsPlaying(false), 3000);
  }, [currentLetter, settings.language, settings.audioEnabled, settings.showBothLanguages]);

  const nextLetter = useCallback(() => {
    if (currentLetterIndex < 25) {
      const newIndex = currentLetterIndex + 1;
      setCurrentLetterIndex(newIndex);
      onProgress({
        ...progress,
        currentLetterIndex: newIndex,
        lastActivity: Date.now()
      });
      
      if (settings.autoAdvance) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          playAudio();
        }, 500);
      }
    } else {
      confetti();
      toast({
        title: getTranslation(settings.language, 'exerciseComplete'),
        description: getTranslation(settings.language, 'congratulations'),
      });
    }
  }, [currentLetterIndex, progress, onProgress, settings, playAudio, toast]);

  const prevLetter = useCallback(() => {
    if (currentLetterIndex > 0) {
      const newIndex = currentLetterIndex - 1;
      setCurrentLetterIndex(newIndex);
      onProgress({
        ...progress,
        currentLetterIndex: newIndex,
        lastActivity: Date.now()
      });
    }
  }, [currentLetterIndex, progress, onProgress]);

  useEffect(() => {
    if (settings.autoAdvance) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        nextLetter();
      }, 3000);
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [currentLetterIndex, settings.autoAdvance, nextLetter]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-4">
          {getTranslation(settings.language, 'level1')}
        </h3>
        <Progress value={(currentLetterIndex / 25) * 100} className="w-full mb-4" />
      </div>

      <Card className="p-6">
        <CardContent className="flex flex-col items-center space-y-6">
          {/* Letter Display Layout */}
          <div className="flex items-center justify-center space-x-8 w-full">
            {/* Uppercase Letter - Red Circle */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {currentLetter.letter.toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-600 mt-2">Uppercase</span>
            </div>

            {/* Central Image Container - Blue Background */}
            <div className="flex-1 max-w-md">
              <div className="bg-blue-100 p-6 rounded-xl border-2 border-blue-300">
                {createLetterImage(currentLetter.letter, settings.language)}
                {settings.showBothLanguages && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    {createLetterImage(currentLetter.letter, settings.language === 'spanish' ? 'english' : 'spanish')}
                  </div>
                )}
              </div>
            </div>

            {/* Lowercase Letter - Red Circle */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {currentLetter.letter.toLowerCase()}
                </span>
              </div>
              <span className="text-sm text-gray-600 mt-2">Lowercase</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex space-x-4">
            <Button
              onClick={prevLetter}
              disabled={currentLetterIndex === 0}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {getTranslation(settings.language, 'previous')}
            </Button>

            <Button
              onClick={playAudio}
              disabled={isPlaying || !settings.audioEnabled}
              variant="default"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Volume2 className="w-4 h-4 mr-2" />
              )}
              {isPlaying ? getTranslation(settings.language, 'pause') : getTranslation(settings.language, 'start')}
            </Button>

            <Button
              onClick={nextLetter}
              disabled={currentLetterIndex === 25}
              variant="outline"
            >
              {getTranslation(settings.language, 'next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Progress Info */}
          <div className="text-center text-sm text-gray-600">
            Letter {currentLetterIndex + 1} of 26
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Settings Component
const AlphabetSettingsComponent: React.FC<AlphabetSettingsProps> = ({
  settings,
  onSettingsChange,
  onBack
}) => {
  const handleSettingChange = (key: keyof AlphabetSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {getTranslation(settings.language, 'alphabetConfiguration')}
        </h2>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {getTranslation(settings.language, 'back')}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label>{getTranslation(settings.language, 'primaryLanguage')}</Label>
            <Select
              value={settings.language}
              onValueChange={(value: AlphabetLanguage) => 
                handleSettingChange('language', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">
                  {getTranslation(settings.language, 'english')}
                </SelectItem>
                <SelectItem value="spanish">
                  {getTranslation(settings.language, 'spanish')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Level Selection */}
          <div className="space-y-2">
            <Label>{getTranslation(settings.language, 'difficultyLevel')}</Label>
            <Select
              value={settings.level}
              onValueChange={(value: AlphabetLevel) => 
                handleSettingChange('level', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="level1">
                  {getTranslation(settings.language, 'level1')}
                </SelectItem>
                <SelectItem value="level2">
                  {getTranslation(settings.language, 'level2')}
                </SelectItem>
                <SelectItem value="level3">
                  {getTranslation(settings.language, 'level3')}
                </SelectItem>
                <SelectItem value="level4">
                  {getTranslation(settings.language, 'level4')}
                </SelectItem>
                <SelectItem value="level5">
                  {getTranslation(settings.language, 'level5')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Audio Settings */}
          <div className="flex items-center justify-between">
            <Label>{getTranslation(settings.language, 'audioEnabled')}</Label>
            <Switch
              checked={settings.audioEnabled}
              onCheckedChange={(checked) => 
                handleSettingChange('audioEnabled', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>{getTranslation(settings.language, 'showBothLanguages')}</Label>
            <Switch
              checked={settings.showBothLanguages}
              onCheckedChange={(checked) => 
                handleSettingChange('showBothLanguages', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>{getTranslation(settings.language, 'autoAdvance')}</Label>
            <Switch
              checked={settings.autoAdvance}
              onCheckedChange={(checked) => 
                handleSettingChange('autoAdvance', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>{getTranslation(settings.language, 'showTimer')}</Label>
            <Switch
              checked={settings.showTimer}
              onCheckedChange={(checked) => 
                handleSettingChange('showTimer', checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Exercise Component
const AlphabetExercise: React.FC<AlphabetExerciseProps> = ({
  settings: initialSettings = defaultSettings,
  progress: initialProgress = defaultProgress,
  onProgress,
  onComplete
}) => {
  const [settings, setSettings] = useState<AlphabetSettings>(initialSettings);
  const [progress, setProgress] = useState<AlphabetProgress>(initialProgress);
  const [showSettings, setShowSettings] = useState(false);

  const handleProgressUpdate = useCallback((newProgress: AlphabetProgress) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [onProgress]);

  const handleSettingsChange = useCallback((newSettings: AlphabetSettings) => {
    setSettings(newSettings);
  }, []);

  if (showSettings) {
    return (
      <AlphabetSettingsComponent
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Alphabet Learning
          </h1>
          <p className="text-gray-600 mt-1">
            {getTranslation(settings.language, settings.level)}
          </p>
        </div>
        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          {getTranslation(settings.language, 'settings')}
        </Button>
      </div>

      {/* Render appropriate level component */}
      {settings.level === 'level1' && (
        <Level1Component
          settings={settings}
          progress={progress}
          onProgress={handleProgressUpdate}
        />
      )}

      {/* Add other level components here when implemented */}
      {settings.level !== 'level1' && (
        <div className="text-center p-8">
          <p className="text-gray-600">
            {getTranslation(settings.language, settings.level)} - Coming Soon!
          </p>
        </div>
      )}
    </div>
  );
};

export default AlphabetExercise;