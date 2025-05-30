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
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import confetti from 'canvas-confetti';

// Type imports
import {
  AlphabetSettings,
  AlphabetProgress,
  AlphabetLanguage,
  AlphabetLetter,
  Level1Activity,
  Level2Activity,
  Level3Activity,
  Level4Activity,
  Level5Activity,
  DragItem,
  DropZone,
  LetterOption
} from './types';

// Data imports
import {
  alphabetData,
  getLetterByIndex,
  getRandomLetters,
  shuffleArray
} from './data/alphabetData';

// Translation function
const getTranslation = (language: AlphabetLanguage, key: string): string => {
  const translations = {
    english: {
      alphabetConfiguration: 'Alphabet Configuration',
      back: 'Back',
      primaryLanguage: 'Primary Language',
      english: 'English',
      spanish: 'Spanish',
      difficultyLevel: 'Difficulty Level',
      level1: 'Level 1: Visual and Audio Recognition',
      level2: 'Level 2: Letter Sequence',
      level3: 'Level 3: Drag and Drop Letter Organization',
      level4: 'Level 4: Complete the Word',
      level5: 'Level 5: Sound to Letter Association',
      audioEnabled: 'Audio Enabled',
      showBothLanguages: 'Show Both Languages',
      autoContinue: 'Auto Continue',
      letterDisplay: 'Letter Display',
      uppercase: 'UPPERCASE',
      lowercase: 'lowercase',
      both: 'Both',
      playAudio: 'Play Audio',
      nextLetter: 'Next Letter',
      previousLetter: 'Previous Letter',
      currentProgress: 'Current Progress',
      letterComplete: 'Letter Complete!',
      excellent: 'Excellent!',
      correct: 'Correct!',
      incorrect: 'Incorrect',
      tryAgain: 'Try Again',
      wellDone: 'Well Done!',
      levelCompleted: 'Level Completed!',
      nextLevel: 'Next Level',
      restart: 'Restart',
      complete: 'Complete',
      selectCorrectLetter: 'Select the correct letter',
      dragLettersToOrder: 'Drag letters to put them in alphabetical order',
      completeTheWord: 'Complete the word',
      selectLetterForSound: 'Select the letter that makes this sound',
      arrangeLetters: 'Arrange the letters in the correct order'
    },
    spanish: {
      alphabetConfiguration: 'Configuración del Alfabeto',
      back: 'Atrás',
      primaryLanguage: 'Idioma Principal',
      english: 'Inglés',
      spanish: 'Español',
      difficultyLevel: 'Nivel de Dificultad',
      level1: 'Nivel 1: Reconocimiento Visual y Auditivo',
      level2: 'Nivel 2: Secuencia de Letras',
      level3: 'Nivel 3: Organización de Letras Arrastrando y Soltando',
      level4: 'Nivel 4: Completar la Palabra',
      level5: 'Nivel 5: Asociación de Sonido a Letra',
      audioEnabled: 'Audio Habilitado',
      showBothLanguages: 'Mostrar Ambos Idiomas',
      autoContinue: 'Continuar Automáticamente',
      letterDisplay: 'Mostrar Letra',
      uppercase: 'MAYÚSCULAS',
      lowercase: 'minúsculas',
      both: 'Ambas',
      playAudio: 'Reproducir Audio',
      nextLetter: 'Siguiente Letra',
      previousLetter: 'Letra Anterior',
      currentProgress: 'Progreso Actual',
      letterComplete: '¡Letra Completada!',
      excellent: '¡Excelente!',
      correct: '¡Correcto!',
      incorrect: 'Incorrecto',
      tryAgain: 'Intentar de Nuevo',
      wellDone: '¡Bien Hecho!',
      levelCompleted: '¡Nivel Completado!',
      nextLevel: 'Siguiente Nivel',
      restart: 'Reiniciar',
      complete: 'Completar',
      selectCorrectLetter: 'Selecciona la letra correcta',
      dragLettersToOrder: 'Arrastra las letras para ponerlas en orden alfabético',
      completeTheWord: 'Completa la palabra',
      selectLetterForSound: 'Selecciona la letra que hace este sonido',
      arrangeLetters: 'Organiza las letras en el orden correcto'
    }
  };

  return translations[language]?.[key] || key;
};

// Default settings and progress
const defaultSettings: AlphabetSettings = {
  language: 'english',
  difficultyLevel: 'beginner',
  audioEnabled: true,
  showBothLanguages: false,
  autoContinue: false,
  letterDisplay: 'both'
};

const defaultProgress: AlphabetProgress = {
  currentLevel: 1,
  currentLetterIndex: 0,
  completedLetters: [],
  completedLevels: [],
  totalScore: 0,
  accuracy: 100,
  timeSpent: 0,
  activities: {
    level1: [],
    level2: [],
    level3: [],
    level4: [],
    level5: []
  }
};

// Real Images for each letter based on language
const createLetterImage = (letter: string, language: AlphabetLanguage) => {
  // Find the letter data in the array
  const data = alphabetData.find(item => item.letter === letter.toUpperCase());
  
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
    
    // Update progress
    const newProgress = {
      ...progress,
      currentLetterIndex: newIndex,
      completedLetters: Array.from(new Set([...progress.completedLetters, currentLetter.letter])),
      activities: {
        ...progress.activities,
        level1: [...progress.activities.level1, {
          letterId: currentLetter.letter,
          timestamp: Date.now(),
          completed: true
        } as Level1Activity]
      }
    };
    
    onProgress(newProgress);
    
    if (settings.autoContinue) {
      setTimeout(playAudio, 500);
    }
  }, [currentLetterIndex, progress, currentLetter, onProgress, settings.autoContinue, playAudio]);

  const previousLetter = useCallback(() => {
    const newIndex = currentLetterIndex === 0 ? alphabetData.length - 1 : currentLetterIndex - 1;
    setCurrentLetterIndex(newIndex);
    
    const newProgress = {
      ...progress,
      currentLetterIndex: newIndex
    };
    
    onProgress(newProgress);
  }, [currentLetterIndex, progress, onProgress]);

  useEffect(() => {
    if (settings.autoContinue) {
      autoAdvanceTimerRef.current = setTimeout(nextLetter, 5000);
      return () => {
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
        }
      };
    }
  }, [settings.autoContinue, nextLetter]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">
          {getTranslation(settings.language, 'level1')}
        </h3>
        <div className="flex justify-center items-center space-x-8">
          {/* Left: Uppercase Letter */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {currentLetter.letter}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {getTranslation(settings.language, 'uppercase')}
            </span>
          </div>
          
          {/* Center: Image */}
          <div className="flex-1 max-w-md">
            <div className="bg-blue-100 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
              {createLetterImage(currentLetter.letter, settings.language)}
            </div>
          </div>
          
          {/* Right: Lowercase Letter */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {currentLetter.letter.toLowerCase()}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {getTranslation(settings.language, 'lowercase')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <Button onClick={previousLetter} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {getTranslation(settings.language, 'previousLetter')}
        </Button>
        
        <Button onClick={playAudio} disabled={isPlaying || !settings.audioEnabled}>
          {isPlaying ? (
            <Pause className="mr-2 h-4 w-4" />
          ) : (
            <Volume2 className="mr-2 h-4 w-4" />
          )}
          {getTranslation(settings.language, 'playAudio')}
        </Button>
        
        <Button onClick={nextLetter}>
          {getTranslation(settings.language, 'nextLetter')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">
          {getTranslation(settings.language, 'currentProgress')}: {currentLetterIndex + 1} / {alphabetData.length}
        </div>
        <Progress value={(currentLetterIndex + 1) / alphabetData.length * 100} className="max-w-md mx-auto" />
      </div>
    </div>
  );
};

// Level 2 Component - Letter Sequence
const Level2Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [sequence, setSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const { toast } = useToast();

  const generateSequence = useCallback(() => {
    const startIndex = Math.floor(Math.random() * (alphabetData.length - 5));
    const newSequence = alphabetData.slice(startIndex, startIndex + 5).map(item => item.letter);
    setSequence(newSequence);
    setUserSequence([]);
    setFeedback('');
  }, []);

  useEffect(() => {
    generateSequence();
  }, [generateSequence]);

  const handleLetterClick = (letter: string, index: number) => {
    const newUserSequence = [...userSequence, letter];
    setUserSequence(newUserSequence);

    if (newUserSequence[index] === sequence[index]) {
      if (newUserSequence.length === sequence.length) {
        setFeedback(getTranslation(settings.language, 'excellent'));
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        const activity: Level2Activity = {
          sequence: sequence,
          userSequence: newUserSequence,
          completed: true,
          timestamp: Date.now(),
          attempts: 1
        };
        
        const newProgress = {
          ...progress,
          activities: {
            ...progress.activities,
            level2: [...progress.activities.level2, activity]
          }
        };
        
        onProgress(newProgress);
        
        setTimeout(generateSequence, 2000);
      } else {
        setFeedback(getTranslation(settings.language, 'correct'));
      }
    } else {
      setFeedback(getTranslation(settings.language, 'incorrect'));
      setTimeout(() => {
        setUserSequence([]);
        setFeedback('');
      }, 1000);
    }
  };

  const shuffledSequence = shuffleArray([...sequence]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">
          {getTranslation(settings.language, 'level2')}
        </h3>
        <p className="text-gray-600">
          {getTranslation(settings.language, 'arrangeLetters')}
        </p>
      </div>

      <div className="text-center">
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Target Sequence:</h4>
          <div className="flex justify-center space-x-2">
            {sequence.map((letter: any, index: any) => (
              <div key={index} className="w-12 h-12 border-2 border-gray-300 rounded flex items-center justify-center bg-blue-50">
                <span className="text-xl font-bold text-blue-600">{letter}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Your Answer:</h4>
          <div className="flex justify-center space-x-2">
            {sequence.map((letter: any, index: any) => (
              <div key={index} className="w-12 h-12 border-2 border-gray-300 rounded flex items-center justify-center bg-gray-50">
                <span className="text-xl font-bold">
                  {userSequence[index] || '?'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Available Letters:</h4>
          <div className="flex justify-center space-x-2 flex-wrap">
            {shuffledSequence.map((letter: any, index: any) => (
              <Button
                key={index}
                variant="outline"
                className="w-12 h-12 text-xl font-bold"
                onClick={() => handleLetterClick(letter, userSequence.length)}
                disabled={userSequence.includes(letter)}
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>

        {feedback && (
          <div className={`text-lg font-semibold ${
            feedback.includes(getTranslation(settings.language, 'incorrect')) ? 'text-red-600' : 'text-green-600'
          }`}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
};

// Level 3 Component - Drag and Drop
const Level3Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [letters, setLetters] = useState<string[]>([]);
  const [dropZones, setDropZones] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const { toast } = useToast();

  const generateExercise = useCallback(() => {
    const startIndex = Math.floor(Math.random() * (alphabetData.length - 4));
    const correctOrder = alphabetData.slice(startIndex, startIndex + 4).map(item => item.letter);
    const shuffledLetters = shuffleArray([...correctOrder]);
    
    setLetters(shuffledLetters);
    setDropZones(new Array(4).fill(''));
    setFeedback('');
  }, []);

  useEffect(() => {
    generateExercise();
  }, [generateExercise]);

  const handleDragStart = (item: DragItem) => {
    // Drag start logic
  };

  const handleDrop = (zone: DropZone) => {
    // Drop logic
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">
          {getTranslation(settings.language, 'level3')}
        </h3>
        <p className="text-gray-600">
          {getTranslation(settings.language, 'dragLettersToOrder')}
        </p>
      </div>
      
      {/* Drag and drop implementation would go here */}
      <div className="text-center text-gray-500">
        Drag and drop functionality will be implemented here
      </div>
    </div>
  );
};

// Level 4 Component - Complete the Word
const Level4Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [currentWord, setCurrentWord] = useState<AlphabetLetter | null>(null);
  const [missingIndices, setMissingIndices] = useState<number[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [options, setOptions] = useState<LetterOption[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const { toast } = useToast();

  const generateExercise = useCallback(() => {
    const randomLetter = getRandomLetters(1)[0];
    const word = settings.language === 'spanish' ? randomLetter.words.spanish : randomLetter.words.english;
    const wordLength = word.length;
    
    // Remove 1-2 letters from the word
    const numMissing = Math.min(2, Math.max(1, Math.floor(wordLength / 3)));
    const missing = [];
    
    while (missing.length < numMissing) {
      const index = Math.floor(Math.random() * wordLength);
      if (!missing.includes(index)) {
        missing.push(index);
      }
    }
    
    setCurrentWord(randomLetter);
    setMissingIndices(missing);
    setUserAnswers(new Array(missing.length).fill(''));
    
    // Generate options (correct letters + distractors)
    const correctLetters = missing.map(index => word[index].toUpperCase());
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const distractors = allLetters
      .filter(letter => !correctLetters.includes(letter))
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    
    const allOptions = [...correctLetters, ...distractors]
      .map((letter, index) => ({ id: index, letter }))
      .sort(() => Math.random() - 0.5);
    
    setOptions(allOptions);
    setFeedback('');
  }, [settings.language]);

  useEffect(() => {
    generateExercise();
  }, [generateExercise]);

  const selectLetter = (option: LetterOption, missingIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[missingIndex] = option.letter;
    setUserAnswers(newAnswers);

    if (!newAnswers.includes('')) {
      // Check if all answers are correct
      const word = settings.language === 'spanish' ? currentWord!.words.spanish : currentWord!.words.english;
      const isCorrect = missingIndices.every((originalIndex, i) => 
        word[originalIndex].toUpperCase() === newAnswers[i]
      );

      if (isCorrect) {
        setFeedback(getTranslation(settings.language, 'excellent'));
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        const activity: Level4Activity = {
          wordId: currentWord!.letter,
          word: word,
          missingIndices: missingIndices,
          userAnswers: newAnswers,
          completed: true,
          timestamp: Date.now()
        };

        const newProgress = {
          ...progress,
          activities: {
            ...progress.activities,
            level4: [...progress.activities.level4, activity]
          }
        };

        onProgress(newProgress);
        setTimeout(generateExercise, 2000);
      } else {
        setFeedback(getTranslation(settings.language, 'incorrect'));
        setTimeout(() => {
          setUserAnswers(new Array(missingIndices.length).fill(''));
          setFeedback('');
        }, 1000);
      }
    }
  };

  if (!currentWord) return <div>Loading...</div>;

  const word = settings.language === 'spanish' ? currentWord.words.spanish : currentWord.words.english;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">
          {getTranslation(settings.language, 'level4')}
        </h3>
        <p className="text-gray-600">
          {getTranslation(settings.language, 'completeTheWord')}
        </p>
      </div>

      <div className="text-center">
        <div className="mb-6">
          {createLetterImage(currentWord.letter, settings.language)}
        </div>

        <div className="mb-6">
          <div className="flex justify-center space-x-1">
            {word.split('').map((letter, index) => {
              const missingIndex = missingIndices.indexOf(index);
              const isMissing = missingIndex !== -1;
              
              return (
                <div
                  key={index}
                  className={`w-12 h-12 border-2 rounded flex items-center justify-center text-xl font-bold ${
                    isMissing 
                      ? 'border-red-300 bg-red-50 text-red-600' 
                      : 'border-blue-300 bg-blue-50 text-blue-600'
                  }`}
                >
                  {isMissing ? (userAnswers[missingIndex] || '?') : letter.toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Choose the missing letters:</h4>
          <div className="flex justify-center space-x-2 flex-wrap">
            {options.map((opt: any) => (
              <Button
                key={opt.id}
                variant="outline"
                className="w-12 h-12 text-xl font-bold"
                onClick={() => {
                  const nextMissingIndex = userAnswers.findIndex(answer => answer === '');
                  if (nextMissingIndex !== -1) {
                    selectLetter(opt, nextMissingIndex);
                  }
                }}
                disabled={userAnswers.includes(opt.letter)}
              >
                {opt.letter}
              </Button>
            ))}
          </div>
        </div>

        {feedback && (
          <div className={`text-lg font-semibold ${
            feedback.includes(getTranslation(settings.language, 'incorrect')) ? 'text-red-600' : 'text-green-600'
          }`}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
};

// Level 5 Component - Sound to Letter Association
const Level5Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [currentLetter, setCurrentLetter] = useState<AlphabetLetter | null>(null);
  const [options, setOptions] = useState<AlphabetLetter[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const { toast } = useToast();

  const generateExercise = useCallback(() => {
    const target = getRandomLetters(1)[0];
    const distractors = getRandomLetters(3, [target.letter]);
    const allOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    
    setCurrentLetter(target);
    setOptions(allOptions);
    setFeedback('');
    setHasPlayedAudio(false);
  }, []);

  useEffect(() => {
    generateExercise();
  }, [generateExercise]);

  const playTargetSound = useCallback(() => {
    if (currentLetter && settings.audioEnabled) {
      pronounceLetter(currentLetter, settings.language);
      setHasPlayedAudio(true);
    }
  }, [currentLetter, settings.language, settings.audioEnabled]);

  const handleAnswer = (option: AlphabetLetter) => {
    if (option.letter === currentLetter!.letter) {
      setFeedback(getTranslation(settings.language, 'excellent'));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      const activity: Level5Activity = {
        targetLetter: currentLetter!.letter,
        selectedLetter: option.letter,
        completed: true,
        timestamp: Date.now()
      };

      const newProgress = {
        ...progress,
        activities: {
          ...progress.activities,
          level5: [...progress.activities.level5, activity]
        }
      };

      onProgress(newProgress);
      setTimeout(generateExercise, 2000);
    } else {
      setFeedback(getTranslation(settings.language, 'incorrect'));
      setTimeout(() => setFeedback(''), 1000);
    }
  };

  if (!currentLetter) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">
          {getTranslation(settings.language, 'level5')}
        </h3>
        <p className="text-gray-600">
          {getTranslation(settings.language, 'selectLetterForSound')}
        </p>
      </div>

      <div className="text-center">
        <div className="mb-6">
          <Button 
            onClick={playTargetSound} 
            disabled={!settings.audioEnabled}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Volume2 className="mr-2 h-6 w-6" />
            Play Sound
          </Button>
          
          {!hasPlayedAudio && (
            <p className="text-sm text-gray-500 mt-2">
              Click to hear the sound, then select the matching letter
            </p>
          )}
        </div>

        {hasPlayedAudio && (
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {options.map((option: any) => (
              <Button
                key={option.letter}
                variant="outline"
                className="h-20 text-2xl font-bold hover:bg-blue-50"
                onClick={() => handleAnswer(option)}
              >
                {option.letter}
              </Button>
            ))}
          </div>
        )}

        {feedback && (
          <div className={`text-lg font-semibold mt-4 ${
            feedback.includes(getTranslation(settings.language, 'incorrect')) ? 'text-red-600' : 'text-green-600'
          }`}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Settings Component
const SettingsComponent: React.FC<{
  settings: AlphabetSettings;
  onSettingsChange: (settings: AlphabetSettings) => void;
  onBack: () => void;
}> = ({ settings, onSettingsChange, onBack }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {getTranslation(settings.language, 'alphabetConfiguration')}
          </h2>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getTranslation(settings.language, 'back')}
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="language" className="text-base font-medium">
              {getTranslation(settings.language, 'primaryLanguage')}
            </Label>
            <Select 
              value={settings.language} 
              onValueChange={(value: AlphabetLanguage) => 
                onSettingsChange({ ...settings, language: value })
              }
            >
              <SelectTrigger className="mt-2">
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

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="audio" className="text-base font-medium">
                {getTranslation(settings.language, 'audioEnabled')}
              </Label>
              <Switch
                id="audio"
                checked={settings.audioEnabled}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, audioEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="bothLanguages" className="text-base font-medium">
                {getTranslation(settings.language, 'showBothLanguages')}
              </Label>
              <Switch
                id="bothLanguages"
                checked={settings.showBothLanguages}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showBothLanguages: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoContinue" className="text-base font-medium">
                {getTranslation(settings.language, 'autoContinue')}
              </Label>
              <Switch
                id="autoContinue"
                checked={settings.autoContinue}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, autoContinue: checked })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Exercise Component
const AlphabetExercise: React.FC<{
  onComplete?: () => void;
  onBack?: () => void;
}> = ({ onComplete, onBack }) => {
  const [settings, setSettings] = useState<AlphabetSettings>(defaultSettings);
  const [progress, setProgress] = useState<AlphabetProgress>(defaultProgress);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);

  const handleProgressUpdate = useCallback((newProgress: AlphabetProgress) => {
    setProgress(newProgress);
  }, []);

  const handleSettingsChange = useCallback((newSettings: AlphabetSettings) => {
    setSettings(newSettings);
  }, []);

  const renderCurrentLevel = () => {
    switch (currentLevel) {
      case 1:
        return (
          <Level1Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        );
      case 2:
        return (
          <Level2Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        );
      case 3:
        return (
          <Level3Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        );
      case 4:
        return (
          <Level4Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        );
      case 5:
        return (
          <Level5Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        );
      default:
        return <div>Invalid level</div>;
    }
  };

  if (showSettings) {
    return (
      <SettingsComponent
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {getTranslation(settings.language, 'back')}
                </Button>
              )}
              <h1 className="text-3xl font-bold text-gray-800">
                Alphabet Learning
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setShowSettings(true)} 
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Level Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  variant={currentLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentLevel(level)}
                  className="min-w-[120px]"
                >
                  {getTranslation(settings.language, `level${level}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Current Level Content */}
          <Card className="w-full">
            <CardContent className="p-8">
              {renderCurrentLevel()}
            </CardContent>
          </Card>
        </div>
      </div>
    </DndProvider>
  );
};

export default AlphabetExercise;