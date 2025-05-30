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
import { 
  alphabetData, 
  getLetterByIndex, 
  getRandomLetter,
  generateOrderingExercise,
  generateWordCompletionExercise
} from './data/alphabetData';

// Translations
const translations = {
  spanish: {
    // Settings
    alphabetConfiguration: 'Configuración del Alfabeto',
    back: 'Volver',
    primaryLanguage: 'Idioma Principal',
    english: 'Inglés',
    spanish: 'Español',
    difficultyLevel: 'Nivel de Dificultad',
    level1: 'Nivel 1: Reconocimiento Visual y Auditivo',
    level2: 'Nivel 2: Ordenamiento de Letras',
    level3: 'Nivel 3: Completar Palabras',
    level4: 'Nivel 4: Asociación Sonido-Letra',
    level5: 'Nivel 5: Formación de Palabras',
    showBothLanguages: 'Mostrar Ambos Idiomas',
    showBothLanguagesDesc: 'Muestra palabras en español e inglés simultáneamente',
    autoAdvance: 'Avance Automático',
    autoAdvanceDesc: 'Cambia automáticamente a la siguiente letra',
    audioEnabled: 'Audio Habilitado',
    audioEnabledDesc: 'Reproduce pronunciación de letras y palabras',
    showImages: 'Mostrar Imágenes',
    showImagesDesc: 'Muestra imágenes representativas de cada letra',
    celebrateAchievements: 'Celebrar Logros',
    celebrateAchievementsDesc: 'Efectos visuales al completar el alfabeto',
    autoAdvanceTime: 'Tiempo de Avance Automático',
    time1s: '1 segundo',
    time2s: '2 segundos',
    time3s: '3 segundos',
    time5s: '5 segundos',
    // Exercise
    alphabetLearning: 'Aprendizaje del Alfabeto',
    currentLevel: 'Nivel Actual',
    progress: 'Progreso',
    settings: 'Configuración',
    resetProgress: 'Reiniciar Progreso',
    startExercise: 'Comenzar Ejercicio',
    nextLetter: 'Siguiente Letra',
    previousLetter: 'Letra Anterior',
    playAudio: 'Reproducir Audio',
    correct: 'Correcto',
    incorrect: 'Incorrecto',
    tryAgain: 'Intentar de Nuevo',
    congratulations: 'Felicitaciones',
    levelCompleted: 'Nivel Completado',
    nextLevel: 'Siguiente Nivel',
    allLevelsCompleted: 'Todos los Niveles Completados',
    excellentWork: 'Excelente Trabajo',
    // Activities
    recognizeLetterAndWord: 'Reconoce la letra y la palabra',
    orderLetters: 'Ordena las letras correctamente',
    completeWord: 'Completa la palabra',
    associateSound: 'Asocia el sonido con la letra',
    formWord: 'Forma la palabra correcta',
    dragLettersHere: 'Arrastra las letras aquí',
    selectCorrectLetter: 'Selecciona la letra correcta',
    listenAndSelect: 'Escucha y selecciona',
    arrangeLetters: 'Organiza las letras'
  },
  english: {
    // Settings
    alphabetConfiguration: 'Alphabet Configuration',
    back: 'Back',
    primaryLanguage: 'Primary Language',
    english: 'English',
    spanish: 'Spanish',
    difficultyLevel: 'Difficulty Level',
    level1: 'Level 1: Visual and Audio Recognition',
    level2: 'Level 2: Letter Ordering',
    level3: 'Level 3: Word Completion',
    level4: 'Level 4: Sound-Letter Association',
    level5: 'Level 5: Word Formation',
    showBothLanguages: 'Show Both Languages',
    showBothLanguagesDesc: 'Display words in Spanish and English simultaneously',
    autoAdvance: 'Auto Advance',
    autoAdvanceDesc: 'Automatically move to the next letter',
    audioEnabled: 'Audio Enabled',
    audioEnabledDesc: 'Play pronunciation of letters and words',
    showImages: 'Show Images',
    showImagesDesc: 'Display representative images for each letter',
    celebrateAchievements: 'Celebrate Achievements',
    celebrateAchievementsDesc: 'Visual effects when completing the alphabet',
    autoAdvanceTime: 'Auto Advance Time',
    time1s: '1 second',
    time2s: '2 seconds',
    time3s: '3 seconds',
    time5s: '5 seconds',
    // Exercise
    alphabetLearning: 'Alphabet Learning',
    currentLevel: 'Current Level',
    progress: 'Progress',
    settings: 'Settings',
    resetProgress: 'Reset Progress',
    startExercise: 'Start Exercise',
    nextLetter: 'Next Letter',
    previousLetter: 'Previous Letter',
    playAudio: 'Play Audio',
    correct: 'Correct',
    incorrect: 'Incorrect',
    tryAgain: 'Try Again',
    congratulations: 'Congratulations',
    levelCompleted: 'Level Completed',
    nextLevel: 'Next Level',
    allLevelsCompleted: 'All Levels Completed',
    excellentWork: 'Excellent Work',
    // Activities
    recognizeLetterAndWord: 'Recognize the letter and word',
    orderLetters: 'Order the letters correctly',
    completeWord: 'Complete the word',
    associateSound: 'Associate the sound with the letter',
    formWord: 'Form the correct word',
    dragLettersHere: 'Drag letters here',
    selectCorrectLetter: 'Select the correct letter',
    listenAndSelect: 'Listen and select',
    arrangeLetters: 'Arrange the letters'
  }
};

// Helper function to get translations
const getTranslation = (language: AlphabetLanguage, key: string): string => {
  return translations[language][key] || key;
};

// Default settings
const defaultSettings: AlphabetSettings = {
  language: 'english',
  level: 1,
  showBothLanguages: false,
  autoAdvance: false,
  autoAdvanceDelay: 3000,
  audioEnabled: true,
  showImages: true,
  difficulty: 'beginner',
  celebrateCompletion: true
};

// Default progress
const defaultProgress: AlphabetProgress = {
  currentLevel: 1,
  currentLetterIndex: 0,
  completedLetters: [],
  totalCorrectAnswers: 0,
  totalAttempts: 0,
  longestStreak: 0,
  currentStreak: 0,
  timeSpent: 0,
  lastActivity: new Date()
};

// SVG Images for each letter based on language
const createLetterImage = (letter: string, language: AlphabetLanguage) => {
  const data = alphabetData[letter as AlphabetLetter];
  if (!data) return null;
  const word = language === 'spanish' ? data.spanish.word : data.english.word;
  const color = data.color;
  
  // Get appropriate SVG based on letter and language
  const getSVGContent = () => {
    switch (letter.toLowerCase()) {
      case 'a':
        return language === 'spanish' ? (
          // Auto (Car) for Spanish
          <g>
            <rect x="60" y="85" width="80" height="30" rx="8" fill={color} />
            <circle cx="80" cy="125" r="12" fill="#333" />
            <circle cx="120" cy="125" r="12" fill="#333" />
            <circle cx="80" cy="125" r="8" fill="#666" />
            <circle cx="120" cy="125" r="8" fill="#666" />
            <rect x="70" y="70" width="60" height="20" rx="5" fill={color} opacity="0.8" />
            <rect x="85" y="75" width="8" height="8" fill="lightblue" />
            <rect x="107" y="75" width="8" height="8" fill="lightblue" />
          </g>
        ) : (
          // Apple for English
          <g>
            <path d="M100 60 C85 60 75 75 75 90 C75 110 85 125 100 125 C115 125 125 110 125 90 C125 75 115 60 100 60 Z" fill={color} />
            <path d="M100 60 C102 55 105 50 108 52 C110 54 108 58 105 60" stroke="#8B4513" strokeWidth="2" fill="#8B4513" />
            <ellipse cx="90" cy="80" rx="8" ry="12" fill="white" opacity="0.3" />
          </g>
        );
      
      case 'b':
        // Ball for English, Whale for Spanish
        return language === 'spanish' ? (
          <g>
            <ellipse cx="100" cy="100" rx="55" ry="25" fill={color} />
            <ellipse cx="140" cy="85" rx="15" ry="8" fill={color} />
            <path d="M45 100 Q30 85 45 75 Q35 90 45 100" fill={color} />
            <circle cx="125" cy="90" r="3" fill="white" />
            <path d="M100 75 L105 65 L95 65 Z" fill={color} />
            <path d="M110 75 L115 65 L105 65 Z" fill={color} />
          </g>
        ) : (
          <g>
            <circle cx="100" cy="100" r="35" fill={color} />
            <path d="M75 75 Q65 65 75 55 Q85 65 75 75" fill="white" />
            <path d="M125 75 Q135 65 125 55 Q115 65 125 75" fill="white" />
            <path d="M85 110 Q100 120 115 110" stroke="white" strokeWidth="2" fill="none" />
          </g>
        );
      
      case 'c':
        // Cat for English, House for Spanish
        return language === 'spanish' ? (
          <g>
            <rect x="65" y="110" width="70" height="50" fill={color} />
            <polygon points="65,110 100,80 135,110" fill={color} />
            <rect x="80" y="125" width="12" height="20" fill="white" />
            <rect x="108" y="125" width="12" height="20" fill="white" />
            <rect x="92" y="140" width="16" height="20" fill="#8B4513" />
            <circle cx="98" cy="150" r="2" fill="gold" />
          </g>
        ) : (
          <g>
            <ellipse cx="100" cy="110" rx="30" ry="20" fill={color} />
            <circle cx="100" cy="85" r="18" fill={color} />
            <polygon points="88,75 93,65 98,75" fill={color} />
            <polygon points="102,75 107,65 112,75" fill={color} />
            <circle cx="93" cy="80" r="2" fill="white" />
            <circle cx="107" cy="80" r="2" fill="white" />
            <path d="M100 88 L100 93 L105 98" stroke="white" strokeWidth="2" fill="none" />
            <path d="M85 90 L75 85" stroke={color} strokeWidth="2" />
            <path d="M115 90 L125 85" stroke={color} strokeWidth="2" />
          </g>
        );
      
      case 'd':
        // Dog for English, Dolphin for Spanish
        return language === 'spanish' ? (
          <g>
            <ellipse cx="100" cy="100" rx="45" ry="18" fill={color} />
            <ellipse cx="125" cy="88" rx="18" ry="12" fill={color} />
            <path d="M55 100 Q45 85 60 80" fill={color} />
            <circle cx="115" cy="88" r="3" fill="white" />
            <path d="M90 85 Q85 75 95 70" fill={color} />
            <path d="M100 82 L105 75 L95 75 Z" fill={color} />
          </g>
        ) : (
          <g>
            <ellipse cx="100" cy="110" rx="30" ry="22" fill={color} />
            <circle cx="100" cy="85" r="18" fill={color} />
            <ellipse cx="78" cy="85" rx="6" ry="12" fill={color} />
            <ellipse cx="122" cy="85" rx="6" ry="12" fill={color} />
            <circle cx="93" cy="80" r="2" fill="white" />
            <circle cx="107" cy="80" r="2" fill="white" />
            <ellipse cx="100" cy="88" rx="4" ry="2" fill="black" />
            <path d="M118 115 Q128 125 133 120" stroke={color} strokeWidth="3" fill="none" />
          </g>
        );
      
      case 'e':
        // Elephant for both languages
        return (
          <g>
            <ellipse cx="100" cy="110" rx="35" ry="25" fill={color} />
            <circle cx="100" cy="80" r="22" fill={color} />
            <ellipse cx="88" cy="70" rx="6" ry="10" fill={color} />
            <ellipse cx="112" cy="70" rx="6" ry="10" fill={color} />
            <circle cx="93" cy="75" r="2" fill="white" />
            <circle cx="107" cy="75" r="2" fill="white" />
            <ellipse cx="100" cy="95" rx="12" ry="20" fill={color} />
            <path d="M88 135 L88 145 M95 135 L95 145 M105 135 L105 145 M112 135 L112 145" stroke={color} strokeWidth="3" />
          </g>
        );
      
      case 'f':
        // Fish for English, Flower for Spanish
        return language === 'spanish' ? (
          <g>
            <circle cx="100" cy="100" r="12" fill="yellow" />
            <ellipse cx="88" cy="88" rx="10" ry="16" fill={color} transform="rotate(-30 88 88)" />
            <ellipse cx="112" cy="88" rx="10" ry="16" fill={color} transform="rotate(30 112 88)" />
            <ellipse cx="88" cy="112" rx="10" ry="16" fill={color} transform="rotate(30 88 112)" />
            <ellipse cx="112" cy="112" rx="10" ry="16" fill={color} transform="rotate(-30 112 112)" />
            <ellipse cx="100" cy="76" rx="10" ry="16" fill={color} />
            <rect x="97" y="115" width="6" height="25" fill="green" />
          </g>
        ) : (
          <g>
            <ellipse cx="100" cy="100" rx="35" ry="18" fill={color} />
            <polygon points="135,100 150,92 150,108" fill={color} />
            <circle cx="88" cy="95" r="3" fill="white" />
            <path d="M100 82 Q108 75 116 82" fill={color} />
            <path d="M100 118 Q108 125 116 118" fill={color} />
            <path d="M85 88 Q75 82 85 78" fill={color} />
          </g>
        );
      
      default:
        // Generic image for other letters
        return (
          <g>
            <rect x="70" y="70" width="60" height="60" rx="8" fill={`${color}60`} />
            <circle cx="100" cy="100" r="18" fill={color} />
            <text x="100" y="108" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">
              {letter}
            </text>
          </g>
        );
    }
  };

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="rounded-lg border-2 border-gray-200 bg-white shadow-sm">
      {getSVGContent()}
      <text x="100" y="185" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>
        {word}
      </text>
    </svg>
  );
};

// Audio pronunciation simulation (to be replaced with actual audio)
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
    const newIndex = (currentLetterIndex + 1) % alphabetData.length;
    setCurrentLetterIndex(newIndex);
    
    const newProgress = {
      ...progress,
      currentLetterIndex: newIndex,
      completedLetters: [...new Set([...progress.completedLetters, currentLetter.id])],
      totalAttempts: progress.totalAttempts + 1,
      lastActivity: new Date()
    };
    
    onProgress(newProgress);
    
    if (newIndex === 0) {
      // Completed full alphabet
      if (settings.celebrateCompletion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: "¡Alfabeto Completado!",
          description: "Has revisado todas las letras del alfabeto. ¡Excelente trabajo!"
        });
      }
    }
  }, [currentLetterIndex, currentLetter.id, progress, onProgress, settings.celebrateCompletion, toast]);

  const previousLetter = useCallback(() => {
    const newIndex = currentLetterIndex === 0 ? alphabetData.length - 1 : currentLetterIndex - 1;
    setCurrentLetterIndex(newIndex);
    
    const newProgress = {
      ...progress,
      currentLetterIndex: newIndex,
      lastActivity: new Date()
    };
    
    onProgress(newProgress);
  }, [currentLetterIndex, progress, onProgress]);

  useEffect(() => {
    if (settings.autoAdvance) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        nextLetter();
      }, settings.autoAdvanceDelay);
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [currentLetterIndex, settings.autoAdvance, settings.autoAdvanceDelay, nextLetter]);

  useEffect(() => {
    // Auto-play audio when letter changes
    if (settings.audioEnabled) {
      const timer = setTimeout(() => playAudio(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentLetterIndex, playAudio, settings.audioEnabled]);

  const progressPercentage = ((currentLetterIndex + 1) / alphabetData.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progreso del Alfabeto</span>
          <span>{currentLetterIndex + 1} / {alphabetData.length}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Letter Display */}
      <Card className="alphabet-learning-card">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLetter.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              {/* Letter Display */}
              <div 
                className="text-9xl font-bold mb-4"
                style={{ color: currentLetter.color }}
              >
                {currentLetter.letter}
                <div className="text-6xl mt-2 opacity-70">
                  {currentLetter.lowercase}
                </div>
              </div>

              {/* Image Display */}
              {settings.showImages && (
                <div className="flex justify-center space-x-4">
                  {settings.showBothLanguages ? (
                    <>
                      <div className="text-center space-y-2">
                        {createLetterImage(currentLetter.letter, 'spanish')}
                        <Badge variant="secondary" className="text-sm">
                          🇪🇸 {alphabetData[currentLetter.letter]?.spanish.word}
                        </Badge>
                      </div>
                      <div className="text-center space-y-2">
                        {createLetterImage(currentLetter.letter, 'english')}
                        <Badge variant="secondary" className="text-sm">
                          🇺🇸 {alphabetData[currentLetter.letter]?.english.word}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2">
                      {createLetterImage(currentLetter.letter, settings.language)}
                      <Badge variant="secondary" className="text-sm">
                        {settings.language === 'spanish' ? '🇪🇸' : '🇺🇸'} {alphabetData[currentLetter.letter]?.[settings.language].word}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Pronunciation Display */}
              <div className="text-center space-y-2">
                <div className="text-2xl font-semibold text-gray-700">
                  {settings.showBothLanguages ? (
                    <div className="space-y-1">
                      <div>🇪🇸 {currentLetter.pronunciation.spanish}</div>
                      <div>🇺🇸 {currentLetter.pronunciation.english}</div>
                    </div>
                  ) : (
                    <div>
                      {settings.language === 'spanish' ? '🇪🇸' : '🇺🇸'} {currentLetter.pronunciation[settings.language]}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={previousLetter}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Anterior</span>
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={playAudio}
          disabled={isPlaying}
          className="flex items-center space-x-2"
          style={{ backgroundColor: currentLetter.color }}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
          <span>Escuchar</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={nextLetter}
          className="flex items-center space-x-2"
        >
          <span>Siguiente</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Auto-advance indicator */}
      {settings.autoAdvance && (
        <div className="text-center">
          <Badge variant="outline" className="animate-pulse">
            Avance automático en {settings.autoAdvanceDelay / 1000}s
          </Badge>
        </div>
      )}
    </div>
  );
};

// Level 2 Component - Drag & Drop Letter Ordering
const Level2Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [dragDropState, setDragDropState] = useState<DragDropState>({
    dragItems: [],
    dropZones: [],
    draggedItem: null,
    isComplete: false,
    correctPlacements: 0
  });
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const { toast } = useToast();

  // Initialize exercise
  useEffect(() => {
    const difficulty = settings.difficulty === 'beginner' ? 'easy' : 
                     settings.difficulty === 'intermediate' ? 'medium' : 'hard';
    const exercise = generateOrderingExercise(difficulty);
    
    const dragItems: DragItem[] = exercise.shuffledLetters.map((letter, index) => ({
      id: `drag-${letter}-${index}`,
      letter,
      index,
      isPlaced: false
    }));

    const dropZones: DropZone[] = exercise.correctSequence.map((letter, index) => ({
      id: `drop-${index}`,
      expectedLetter: letter,
      currentLetter: null,
      isCorrect: false,
      position: index
    }));

    setCurrentExercise(exercise);
    setDragDropState({
      dragItems,
      dropZones,
      draggedItem: null,
      isComplete: false,
      correctPlacements: 0
    });
  }, [settings.difficulty]);

  const handleDragStart = (item: DragItem) => {
    setDragDropState(prev => ({ ...prev, draggedItem: item }));
  };

  const handleDrop = (zone: DropZone) => {
    if (!dragDropState.draggedItem) return;

    const draggedItem = dragDropState.draggedItem;
    const isCorrect = draggedItem.letter === zone.expectedLetter;

    setDragDropState(prev => {
      const newDragItems = prev.dragItems.map(item =>
        item.id === draggedItem.id ? { ...item, isPlaced: true } : item
      );

      const newDropZones = prev.dropZones.map(z =>
        z.id === zone.id ? { ...z, currentLetter: draggedItem.letter, isCorrect } : z
      );

      const correctPlacements = newDropZones.filter(z => z.isCorrect).length;
      const isComplete = correctPlacements === newDropZones.length;

      if (isComplete && settings.celebrateCompletion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: "¡Excelente!",
          description: "Has ordenado todas las letras correctamente",
        });
      }

      return {
        ...prev,
        dragItems: newDragItems,
        dropZones: newDropZones,
        draggedItem: null,
        correctPlacements,
        isComplete
      };
    });

    // Update progress
    const newProgress = {
      ...progress,
      totalAttempts: progress.totalAttempts + 1,
      totalCorrectAnswers: isCorrect ? progress.totalCorrectAnswers + 1 : progress.totalCorrectAnswers,
      currentStreak: isCorrect ? progress.currentStreak + 1 : 0,
      longestStreak: isCorrect ? Math.max(progress.longestStreak, progress.currentStreak + 1) : progress.longestStreak,
      lastActivity: new Date()
    };
    onProgress(newProgress);
  };

  const resetExercise = () => {
    const difficulty = settings.difficulty === 'beginner' ? 'easy' : 
                     settings.difficulty === 'intermediate' ? 'medium' : 'hard';
    const exercise = generateOrderingExercise(difficulty);
    
    const dragItems: DragItem[] = exercise.shuffledLetters.map((letter, index) => ({
      id: `drag-${letter}-${index}`,
      letter,
      index,
      isPlaced: false
    }));

    const dropZones: DropZone[] = exercise.correctSequence.map((letter, index) => ({
      id: `drop-${index}`,
      expectedLetter: letter,
      currentLetter: null,
      isCorrect: false,
      position: index
    }));

    setCurrentExercise(exercise);
    setDragDropState({
      dragItems,
      dropZones,
      draggedItem: null,
      isComplete: false,
      correctPlacements: 0
    });
  };

  if (!currentExercise) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Nivel 2: Ordenar Letras</h2>
        <p className="text-gray-600">Arrastra las letras al orden correcto del alfabeto</p>
        <Badge variant="outline">
          {dragDropState.correctPlacements} / {dragDropState.dropZones.length} correctas
        </Badge>
      </div>

      {/* Target sequence visualization */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Secuencia objetivo:</h3>
            <div className="flex justify-center space-x-2 mt-2">
              {currentExercise.correctSequence.map((letter: string, index: number) => (
                <div
                  key={index}
                  className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm"
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drop zones */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center space-x-4">
            {dragDropState.dropZones.map((zone) => (
              <motion.div
                key={zone.id}
                className={`w-16 h-16 border-2 rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer transition-colors ${
                  zone.currentLetter
                    ? zone.isCorrect
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 border-dashed bg-gray-50'
                }`}
                onClick={() => handleDrop(zone)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {zone.currentLetter || '?'}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drag items */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Letras disponibles:</h3>
          </div>
          <div className="flex justify-center space-x-4 flex-wrap gap-2">
            {dragDropState.dragItems
              .filter(item => !item.isPlaced)
              .map((item) => (
                <motion.div
                  key={item.id}
                  className="w-14 h-14 bg-blue-500 text-white rounded-lg flex items-center justify-center text-2xl font-bold cursor-grab hover:bg-blue-600 transition-colors"
                  onClick={() => handleDragStart(item)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  drag
                  dragSnapToOrigin
                >
                  {item.letter}
                </motion.div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={resetExercise}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Nuevo Ejercicio</span>
        </Button>

        {dragDropState.isComplete && (
          <Button
            onClick={resetExercise}
            className="flex items-center space-x-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Siguiente</span>
          </Button>
        )}
      </div>
    </div>
  );
};

// Level 3 Component - Word Completion
const Level3Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [wordCompletion, setWordCompletion] = useState<WordCompletionData>({
    word: '',
    language: settings.language,
    image: '',
    missingPositions: [],
    completedWord: [],
    selectedOptions: [],
    isComplete: false
  });
  const [availableOptions, setAvailableOptions] = useState<LetterOption[]>([]);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const { toast } = useToast();

  // Initialize exercise
  useEffect(() => {
    const exercise = generateWordCompletionExercise(settings.language);
    
    const completedWord = exercise.completionArray.map((letter: string | null) => letter || '');
    const selectedOptions = exercise.missingPositions.map(() => null);
    
    const options: LetterOption[] = exercise.options.map((letter: string) => ({
      letter,
      isUsed: false,
      isCorrect: exercise.word.includes(letter)
    }));

    setCurrentExercise(exercise);
    setWordCompletion({
      word: exercise.word,
      language: exercise.language,
      image: '',
      missingPositions: exercise.missingPositions,
      completedWord,
      selectedOptions,
      isComplete: false
    });
    setAvailableOptions(options);
  }, [settings.language]);

  const selectLetter = (option: LetterOption, missingIndex: number) => {
    if (option.isUsed) return;

    const position = wordCompletion.missingPositions[missingIndex];
    const correctLetter = wordCompletion.word[position];
    const isCorrect = option.letter === correctLetter;

    setWordCompletion(prev => {
      const newCompletedWord = [...prev.completedWord];
      newCompletedWord[position] = option.letter;

      const newSelectedOptions = [...prev.selectedOptions];
      newSelectedOptions[missingIndex] = option.letter;

      const isComplete = newSelectedOptions.every((letter, index) => {
        const pos = prev.missingPositions[index];
        return letter === prev.word[pos];
      });

      if (isComplete && settings.celebrateCompletion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: "¡Perfecto!",
          description: "Has completado la palabra correctamente",
        });
      }

      return {
        ...prev,
        completedWord: newCompletedWord,
        selectedOptions: newSelectedOptions,
        isComplete
      };
    });

    setAvailableOptions(prev =>
      prev.map(opt => 
        opt.letter === option.letter ? { ...opt, isUsed: true } : opt
      )
    );

    // Update progress
    const newProgress = {
      ...progress,
      totalAttempts: progress.totalAttempts + 1,
      totalCorrectAnswers: isCorrect ? progress.totalCorrectAnswers + 1 : progress.totalCorrectAnswers,
      currentStreak: isCorrect ? progress.currentStreak + 1 : 0,
      longestStreak: isCorrect ? Math.max(progress.longestStreak, progress.currentStreak + 1) : progress.longestStreak,
      lastActivity: new Date()
    };
    onProgress(newProgress);
  };

  const resetExercise = () => {
    const exercise = generateWordCompletionExercise(settings.language);
    
    const completedWord = exercise.completionArray.map((letter: string | null) => letter || '');
    const selectedOptions = exercise.missingPositions.map(() => null);
    
    const options: LetterOption[] = exercise.options.map((letter: string) => ({
      letter,
      isUsed: false,
      isCorrect: exercise.word.includes(letter)
    }));

    setCurrentExercise(exercise);
    setWordCompletion({
      word: exercise.word,
      language: exercise.language,
      image: '',
      missingPositions: exercise.missingPositions,
      completedWord,
      selectedOptions,
      isComplete: false
    });
    setAvailableOptions(options);
  };

  if (!currentExercise) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Nivel 3: Completar Palabras</h2>
        <p className="text-gray-600">Selecciona las letras que faltan para completar la palabra</p>
        <Badge variant="outline">
          {settings.language === 'spanish' ? '🇪🇸 Español' : '🇺🇸 English'}
        </Badge>
      </div>

      {/* Word display */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Image placeholder */}
            <div className="flex justify-center">
              {createImagePlaceholder('', wordCompletion.word, '#4F46E5')}
            </div>

            {/* Word with missing letters */}
            <div className="flex justify-center space-x-2">
              {wordCompletion.word.split('').map((letter, index) => {
                const isMissing = wordCompletion.missingPositions.includes(index);
                const missingIndex = wordCompletion.missingPositions.indexOf(index);
                const selectedLetter = isMissing ? wordCompletion.selectedOptions[missingIndex] : null;

                return (
                  <motion.div
                    key={index}
                    className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-2xl font-bold ${
                      isMissing
                        ? selectedLetter
                          ? selectedLetter === letter
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-blue-500 border-dashed bg-blue-50 text-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-700'
                    }`}
                    whileHover={isMissing && !selectedLetter ? { scale: 1.05 } : {}}
                  >
                    {isMissing ? (selectedLetter || '_') : letter}
                  </motion.div>
                );
              })}
            </div>

            {/* Word meaning */}
            <div className="text-lg text-gray-600">
              {settings.language === 'spanish' ? 'Palabra en español' : 'Word in English'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Letter options */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Letras disponibles:</h3>
          </div>
          <div className="flex justify-center space-x-2 flex-wrap gap-2">
            {availableOptions.map((option, index) => (
              <motion.button
                key={index}
                className={`w-12 h-12 rounded-lg text-xl font-bold border-2 transition-colors ${
                  option.isUsed
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                }`}
                disabled={option.isUsed}
                onClick={() => {
                  const nextMissingIndex = wordCompletion.selectedOptions.findIndex(opt => opt === null);
                  if (nextMissingIndex !== -1) {
                    selectLetter(option, nextMissingIndex);
                  }
                }}
                whileHover={!option.isUsed ? { scale: 1.1 } : {}}
                whileTap={!option.isUsed ? { scale: 0.9 } : {}}
              >
                {option.letter}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={resetExercise}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Nueva Palabra</span>
        </Button>

        {wordCompletion.isComplete && (
          <Button
            onClick={resetExercise}
            className="flex items-center space-x-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Siguiente</span>
          </Button>
        )}
      </div>
    </div>
  );
};

// Level 4 Component - Sound-Letter Association
const Level4Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [currentActivity, setCurrentActivity] = useState<Level4Activity | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const { toast } = useToast();

  // Generate new activity
  const generateActivity = useCallback(() => {
    const randomLetter = getRandomLetter();
    const stimulus = Math.random() > 0.5 ? 'sound' : 'image';
    
    // Generate wrong options
    const wrongOptions = Array.from({ length: 3 }, () => getRandomLetter())
      .filter(letter => letter.id !== randomLetter.id);
    
    const options = [randomLetter, ...wrongOptions.slice(0, 3)].sort(() => Math.random() - 0.5);

    const activity: Level4Activity = {
      type: 'association',
      stimulus,
      content: stimulus === 'sound' ? randomLetter.pronunciation[settings.language] : randomLetter.images[settings.language],
      options,
      correctAnswer: randomLetter.id
    };

    setCurrentActivity(activity);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(null);
  }, [settings.language]);

  // Initialize activity
  useEffect(() => {
    generateActivity();
  }, [generateActivity]);

  const handleAnswer = (option: AlphabetLetter) => {
    const correct = option.id === currentActivity?.correctAnswer;
    setSelectedAnswer(option.id);
    setIsCorrect(correct);
    setShowFeedback(true);
    setScore(prev => ({ 
      correct: prev.correct + (correct ? 1 : 0), 
      total: prev.total + 1 
    }));

    // Update progress
    const newProgress = {
      ...progress,
      totalAttempts: progress.totalAttempts + 1,
      totalCorrectAnswers: correct ? progress.totalCorrectAnswers + 1 : progress.totalCorrectAnswers,
      currentStreak: correct ? progress.currentStreak + 1 : 0,
      longestStreak: correct ? Math.max(progress.longestStreak, progress.currentStreak + 1) : progress.longestStreak,
      lastActivity: new Date()
    };
    onProgress(newProgress);

    if (correct && settings.celebrateCompletion) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      toast({
        title: "¡Correcto!",
        description: "Has identificado la letra correctamente",
      });
    }

    // Auto advance after feedback
    setTimeout(() => {
      generateActivity();
    }, 2000);
  };

  const playSound = () => {
    if (currentActivity?.stimulus === 'sound' && settings.audioEnabled) {
      pronounceLetter(
        currentActivity.options.find(opt => opt.id === currentActivity.correctAnswer)!,
        settings.language
      );
    }
  };

  if (!currentActivity) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Nivel 4: Asociación de Sonidos</h2>
        <p className="text-gray-600">
          {currentActivity.stimulus === 'sound' 
            ? 'Escucha el sonido y selecciona la letra correcta'
            : 'Observa la imagen y selecciona la letra que comienza esa palabra'
          }
        </p>
        <Badge variant="outline">
          {score.correct} / {score.total} correctas
        </Badge>
      </div>

      {/* Stimulus Display */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {currentActivity.stimulus === 'sound' ? (
              <div className="space-y-4">
                <div className="text-6xl">🔊</div>
                <Button 
                  onClick={playSound}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Volume2 className="h-5 w-5" />
                  <span>Reproducir Sonido</span>
                </Button>
                <p className="text-sm text-gray-500">Haz clic para escuchar la pronunciación</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {createImagePlaceholder('', 'Imagen', '#8B5CF6')}
                </div>
                <p className="text-lg text-gray-600">
                  ¿Qué letra comienza esta palabra?
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Options */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentActivity.options.map((option) => (
              <motion.button
                key={option.id}
                className={`p-6 rounded-lg border-2 transition-all ${
                  showFeedback
                    ? selectedAnswer === option.id
                      ? isCorrect
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : option.id === currentActivity.correctAnswer
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-gray-50'
                    : 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100'
                }`}
                onClick={() => !showFeedback && handleAnswer(option)}
                disabled={showFeedback}
                whileHover={!showFeedback ? { scale: 1.05 } : {}}
                whileTap={!showFeedback ? { scale: 0.95 } : {}}
              >
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold">{option.letter}</div>
                  <div className="text-sm text-gray-600">{option.letter.toLowerCase()}</div>
                  <div className="text-xs text-gray-500">
                    {option.words[settings.language]}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {showFeedback && (
        <Card>
          <CardContent className="p-4">
            <div className={`text-center ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              <div className="text-2xl mb-2">
                {isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto'}
              </div>
              <p className="text-sm">
                {isCorrect 
                  ? 'Has identificado la letra correctamente'
                  : `La respuesta correcta era "${currentActivity.options.find(opt => opt.id === currentActivity.correctAnswer)?.letter}"`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={generateActivity}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Nueva Pregunta</span>
        </Button>
      </div>
    </div>
  );
};

// Level 5 Component - Word Formation
const Level5Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [currentActivity, setCurrentActivity] = useState<Level5Activity | null>(null);
  const [formedWord, setFormedWord] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const { toast } = useToast();

  // Generate new activity
  const generateActivity = useCallback(() => {
    const exercise = generateWordCompletionExercise(settings.language);
    const targetWord = exercise.word;
    
    // Create scrambled letters with some extras
    const scrambledLetters = [...targetWord.split('')]
      .sort(() => Math.random() - 0.5);
    
    // Add some extra random letters
    const extraLetters = Array.from({ length: 3 }, () => 
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    );
    
    const allLetters = [...scrambledLetters, ...extraLetters]
      .sort(() => Math.random() - 0.5);

    const activity: Level5Activity = {
      type: 'formation',
      targetWord,
      scrambledLetters: allLetters,
      image: '',
      language: settings.language
    };

    setCurrentActivity(activity);
    setFormedWord(Array(targetWord.length).fill(''));
    setAvailableLetters(allLetters);
    setIsComplete(false);
    setShowFeedback(false);
  }, [settings.language]);

  // Initialize activity
  useEffect(() => {
    generateActivity();
  }, [generateActivity]);

  const addLetter = (letter: string, letterIndex: number) => {
    const nextEmptyPosition = formedWord.findIndex(pos => pos === '');
    if (nextEmptyPosition === -1) return;

    const newFormedWord = [...formedWord];
    newFormedWord[nextEmptyPosition] = letter;
    setFormedWord(newFormedWord);

    const newAvailableLetters = [...availableLetters];
    newAvailableLetters.splice(letterIndex, 1);
    setAvailableLetters(newAvailableLetters);

    // Check if word is complete
    if (newFormedWord.every(pos => pos !== '')) {
      const formedString = newFormedWord.join('');
      const isCorrect = formedString.toLowerCase() === currentActivity?.targetWord.toLowerCase();
      
      setIsComplete(true);
      setShowFeedback(true);
      setScore(prev => ({ 
        correct: prev.correct + (isCorrect ? 1 : 0), 
        total: prev.total + 1 
      }));

      // Update progress
      const newProgress = {
        ...progress,
        totalAttempts: progress.totalAttempts + 1,
        totalCorrectAnswers: isCorrect ? progress.totalCorrectAnswers + 1 : progress.totalCorrectAnswers,
        currentStreak: isCorrect ? progress.currentStreak + 1 : 0,
        longestStreak: isCorrect ? Math.max(progress.longestStreak, progress.currentStreak + 1) : progress.longestStreak,
        lastActivity: new Date()
      };
      onProgress(newProgress);

      if (isCorrect && settings.celebrateCompletion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: "¡Excelente!",
          description: "Has formado la palabra correctamente",
        });
      }
    }
  };

  const removeLetter = (position: number) => {
    if (formedWord[position] === '') return;

    const letter = formedWord[position];
    const newFormedWord = [...formedWord];
    newFormedWord[position] = '';
    setFormedWord(newFormedWord);

    setAvailableLetters(prev => [...prev, letter]);
    setIsComplete(false);
    setShowFeedback(false);
  };

  const resetWord = () => {
    if (!currentActivity) return;
    
    setFormedWord(Array(currentActivity.targetWord.length).fill(''));
    setAvailableLetters(currentActivity.scrambledLetters);
    setIsComplete(false);
    setShowFeedback(false);
  };

  if (!currentActivity) return <div>Cargando...</div>;

  const isCorrectWord = formedWord.join('').toLowerCase() === currentActivity.targetWord.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Nivel 5: Formar Palabras</h2>
        <p className="text-gray-600">Forma la palabra usando las letras disponibles</p>
        <Badge variant="outline">
          {score.correct} / {score.total} correctas
        </Badge>
      </div>

      {/* Target Image/Hint */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {createImagePlaceholder('', currentActivity.targetWord, '#10B981')}
            </div>
            <p className="text-lg text-gray-600">
              Forma esta palabra: <span className="font-bold text-2xl">
                {currentActivity.targetWord.length} letras
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Word Formation Area */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Tu palabra:</h3>
            <div className="flex justify-center space-x-2">
              {formedWord.map((letter, index) => (
                <motion.div
                  key={index}
                  className={`w-16 h-16 border-2 rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer transition-colors ${
                    letter
                      ? showFeedback
                        ? isCorrectWord
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 border-dashed bg-gray-50'
                  }`}
                  onClick={() => removeLetter(index)}
                  whileHover={letter ? { scale: 1.05 } : {}}
                  whileTap={letter ? { scale: 0.95 } : {}}
                >
                  {letter || '_'}
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Letters */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Letras disponibles:</h3>
            <div className="flex justify-center space-x-2 flex-wrap gap-2">
              {availableLetters.map((letter, index) => (
                <motion.button
                  key={`${letter}-${index}`}
                  className="w-12 h-12 bg-purple-500 text-white rounded-lg flex items-center justify-center text-xl font-bold hover:bg-purple-600 transition-colors"
                  onClick={() => addLetter(letter, index)}
                  disabled={isComplete}
                  whileHover={!isComplete ? { scale: 1.1 } : {}}
                  whileTap={!isComplete ? { scale: 0.9 } : {}}
                >
                  {letter}
                </motion.button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {showFeedback && isComplete && (
        <Card>
          <CardContent className="p-4">
            <div className={`text-center ${isCorrectWord ? 'text-green-700' : 'text-red-700'}`}>
              <div className="text-2xl mb-2">
                {isCorrectWord ? '✅ ¡Perfecto!' : '❌ Incorrecto'}
              </div>
              <p className="text-sm">
                {isCorrectWord 
                  ? 'Has formado la palabra correctamente'
                  : `La palabra correcta era "${currentActivity.targetWord}"`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={resetWord}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reiniciar</span>
        </Button>

        <Button
          onClick={generateActivity}
          className="flex items-center space-x-2"
        >
          <ArrowRight className="h-4 w-4" />
          <span>Nueva Palabra</span>
        </Button>
      </div>
    </div>
  );
};

// Settings Component
const AlphabetSettingsComponent: React.FC<AlphabetSettingsProps> = ({ settings, onBack, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<AlphabetSettings>(settings);

  // Auto-save settings whenever they change
  useEffect(() => {
    localStorage.setItem('alphabet_settings', JSON.stringify(localSettings));
    onSettingsChange(localSettings);
  }, [localSettings, onSettingsChange]);

  const updateSetting = <K extends keyof AlphabetSettings>(
    key: K, 
    value: AlphabetSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  // Get current language for translations
  const t = (key: string) => getTranslation(localSettings.language, key);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <h2 className="text-2xl font-bold">{t('alphabetConfiguration')}</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">{t('primaryLanguage')}</Label>
            <Select 
              value={localSettings.language} 
              onValueChange={(value: AlphabetLanguage) => 
                updateSetting('language', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spanish">🇪🇸 {t('spanish')}</SelectItem>
                <SelectItem value="english">🇺🇸 {t('english')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Level Selection */}
          <div className="space-y-2">
            <Label htmlFor="level">{t('difficultyLevel')}</Label>
            <Select 
              value={localSettings.level.toString()} 
              onValueChange={(value) => 
                updateSetting('level', parseInt(value) as AlphabetLevel)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('level1')}</SelectItem>
                <SelectItem value="2">{t('level2')}</SelectItem>
                <SelectItem value="3">{t('level3')}</SelectItem>
                <SelectItem value="4">{t('level4')}</SelectItem>
                <SelectItem value="5">{t('level5')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Bilingual Options */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="both-languages">{t('showBothLanguages')}</Label>
              <div className="text-sm text-gray-500">
                {t('showBothLanguagesDesc')}
              </div>
            </div>
            <Switch
              id="both-languages"
              checked={localSettings.showBothLanguages}
              onCheckedChange={(checked) =>
                updateSetting('showBothLanguages', checked)
              }
            />
          </div>

          {/* Auto-advance */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-advance">{t('autoAdvance')}</Label>
              <div className="text-sm text-gray-500">
                {t('autoAdvanceDesc')}
              </div>
            </div>
            <Switch
              id="auto-advance"
              checked={localSettings.autoAdvance}
              onCheckedChange={(checked) =>
                updateSetting('autoAdvance', checked)
              }
            />
          </div>

          {/* Audio */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="audio">{t('audioEnabled')}</Label>
              <div className="text-sm text-gray-500">
                {t('audioEnabledDesc')}
              </div>
            </div>
            <Switch
              id="audio"
              checked={localSettings.audioEnabled}
              onCheckedChange={(checked) =>
                updateSetting('audioEnabled', checked)
              }
            />
          </div>

          {/* Images */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="images">{t('showImages')}</Label>
              <div className="text-sm text-gray-500">
                {t('showImagesDesc')}
              </div>
            </div>
            <Switch
              id="images"
              checked={localSettings.showImages}
              onCheckedChange={(checked) =>
                updateSetting('showImages', checked)
              }
            />
          </div>

          {/* Celebrations */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="celebrate">{t('celebrateAchievements')}</Label>
              <div className="text-sm text-gray-500">
                {t('celebrateAchievementsDesc')}
              </div>
            </div>
            <Switch
              id="celebrate"
              checked={localSettings.celebrateCompletion}
              onCheckedChange={(checked) =>
                updateSetting('celebrateCompletion', checked)
              }
            />
          </div>

          <Separator />

          {/* Auto-advance delay (if enabled) */}
          {localSettings.autoAdvance && (
            <div className="space-y-2">
              <Label htmlFor="delay">{t('autoAdvanceTime')}</Label>
              <Select 
                value={localSettings.autoAdvanceDelay.toString()} 
                onValueChange={(value) => 
                  updateSetting('autoAdvanceDelay', parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">{t('time1s')}</SelectItem>
                  <SelectItem value="2000">{t('time2s')}</SelectItem>
                  <SelectItem value="3000">{t('time3s')}</SelectItem>
                  <SelectItem value="5000">{t('time5s')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

// Main Exercise Component
const AlphabetExercise: React.FC<AlphabetExerciseProps> = ({ settings: initialSettings, onOpenSettings }) => {
  const [settings, setSettings] = useState<AlphabetSettings>(() => {
    const saved = localStorage.getItem('alphabet_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : initialSettings || defaultSettings;
  });

  const [progress, setProgress] = useState<AlphabetProgress>(() => {
    const saved = localStorage.getItem('alphabet_progress');
    return saved ? JSON.parse(saved) : defaultProgress;
  });

  const [showSettings, setShowSettings] = useState(false);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('alphabet_progress', JSON.stringify(progress));
  }, [progress]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('alphabet_settings', JSON.stringify(settings));
  }, [settings]);

  const handleProgressUpdate = useCallback((newProgress: AlphabetProgress) => {
    setProgress(newProgress);
  }, []);

  const handleSettingsChange = useCallback((newSettings: AlphabetSettings) => {
    setSettings(newSettings);
  }, []);

  const resetProgress = useCallback(() => {
    const resetProgress = { ...defaultProgress };
    setProgress(resetProgress);
    localStorage.setItem('alphabet_progress', JSON.stringify(resetProgress));
  }, []);

  // Get current language for translations
  const t = (key: string) => getTranslation(settings.language, key);

  if (showSettings) {
    return (
      <AlphabetSettingsComponent
        settings={settings}
        onBack={() => setShowSettings(false)}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              🔤 {t('alphabetLearning')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('currentLevel')} {settings.level}: {
                settings.level === 1 ? t('level1') :
                settings.level === 2 ? t('level2') :
                settings.level === 3 ? t('level3') :
                settings.level === 4 ? t('level4') :
                t('level5')
              }
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={resetProgress}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t('resetProgress')}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>{t('settings')}</span>
            </Button>
          </div>
        </div>

        {/* Current Level Component */}
        {settings.level === 1 && (
          <Level1Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        )}

        {settings.level === 2 && (
          <Level2Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        )}

        {settings.level === 3 && (
          <Level3Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        )}

        {settings.level === 4 && (
          <Level4Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        )}

        {settings.level === 5 && (
          <Level5Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        )}

        {/* Progress Summary */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {progress.completedLetters.length}
                </div>
                <div className="text-sm text-gray-600">Letras Vistas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {progress.totalCorrectAnswers}
                </div>
                <div className="text-sm text-gray-600">Respuestas Correctas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {progress.currentStreak}
                </div>
                <div className="text-sm text-gray-600">Racha Actual</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.floor(progress.timeSpent / 60)}m
                </div>
                <div className="text-sm text-gray-600">Tiempo Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlphabetExercise;