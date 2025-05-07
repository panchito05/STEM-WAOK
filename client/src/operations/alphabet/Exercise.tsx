import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, ArrowLeft, ArrowRight, Cog, RefreshCw, Check, Award } from 'lucide-react';
import { ModuleSettings } from '@/context/SettingsContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibleDnd } from '@/components/AccessibleDndContext';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

interface Letter {
  uppercase: string;
  lowercase: string;
  word: string;
  image: string;
}

const alphabet: Letter[] = [
  { uppercase: 'A', lowercase: 'a', word: 'Apple', image: '🍎' },
  { uppercase: 'B', lowercase: 'b', word: 'Ball', image: '⚽' },
  { uppercase: 'C', lowercase: 'c', word: 'Cat', image: '🐱' },
  { uppercase: 'D', lowercase: 'd', word: 'Dog', image: '🐶' },
  { uppercase: 'E', lowercase: 'e', word: 'Elephant', image: '🐘' },
  { uppercase: 'F', lowercase: 'f', word: 'Fish', image: '🐠' },
  { uppercase: 'G', lowercase: 'g', word: 'Giraffe', image: '🦒' },
  { uppercase: 'H', lowercase: 'h', word: 'House', image: '🏠' },
  { uppercase: 'I', lowercase: 'i', word: 'Ice Cream', image: '🍦' },
  { uppercase: 'J', lowercase: 'j', word: 'Jellyfish', image: '🪼' },
  { uppercase: 'K', lowercase: 'k', word: 'Kite', image: '🪁' },
  { uppercase: 'L', lowercase: 'l', word: 'Lion', image: '🦁' },
  { uppercase: 'M', lowercase: 'm', word: 'Monkey', image: '🐵' },
  { uppercase: 'N', lowercase: 'n', word: 'Nest', image: '🪺' },
  { uppercase: 'O', lowercase: 'o', word: 'Orange', image: '🍊' },
  { uppercase: 'P', lowercase: 'p', word: 'Penguin', image: '🐧' },
  { uppercase: 'Q', lowercase: 'q', word: 'Queen', image: '👑' },
  { uppercase: 'R', lowercase: 'r', word: 'Rabbit', image: '🐰' },
  { uppercase: 'S', lowercase: 's', word: 'Sun', image: '☀️' },
  { uppercase: 'T', lowercase: 't', word: 'Tree', image: '🌳' },
  { uppercase: 'U', lowercase: 'u', word: 'Umbrella', image: '☂️' },
  { uppercase: 'V', lowercase: 'v', word: 'Violin', image: '🎻' },
  { uppercase: 'W', lowercase: 'w', word: 'Whale', image: '🐋' },
  { uppercase: 'X', lowercase: 'x', word: 'Xylophone', image: '🎵' },
  { uppercase: 'Y', lowercase: 'y', word: 'Yo-yo', image: '🪀' },
  { uppercase: 'Z', lowercase: 'z', word: 'Zebra', image: '🦓' },
];

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizOptions, setQuizOptions] = useState<Letter[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentLetter = alphabet[currentIndex];

  useEffect(() => {
    setShowDetails(false);
    setIsCorrect(null);
    setSelectedOption(null);
    
    // Determine if we should show a quiz based on settings
    const showQuiz = settings.difficulty === 'intermediate' || settings.difficulty === 'advanced';
    setIsQuizMode(showQuiz && Math.random() > 0.7); // 30% chance to show quiz in intermediate/advanced
    
    if (showQuiz) {
      generateQuizOptions();
    }
  }, [currentIndex, settings.difficulty]);

  const generateQuizOptions = () => {
    // Always include the correct letter
    const correctLetter = alphabet[currentIndex];
    
    // Get 3 random different letters
    let options: Letter[] = [correctLetter];
    while (options.length < 4) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      const randomLetter = alphabet[randomIndex];
      
      // Don't add duplicates
      if (!options.some(option => option.uppercase === randomLetter.uppercase)) {
        options.push(randomLetter);
      }
    }
    
    // Shuffle options
    setQuizOptions(shuffleArray(options));
  };

  const shuffleArray = <T extends unknown>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const playSound = (text: string) => {
    if (settings.enableSoundEffects && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % alphabet.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? alphabet.length - 1 : prevIndex - 1
    );
  };

  const handleLetterClick = () => {
    if (!isQuizMode) {
      setShowDetails(true);
      if (settings.enableSoundEffects) {
        playSound(`${currentLetter.uppercase}. ${currentLetter.word}`);
      }
    }
  };

  const handleQuizOptionSelect = (index: number) => {
    setSelectedOption(index);
    const selectedLetter = quizOptions[index];
    const isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
    setIsCorrect(isAnswerCorrect);
    
    if (settings.enableSoundEffects) {
      if (isAnswerCorrect) {
        playSound("Correct! Good job!");
      } else {
        playSound(`Incorrect. This is the letter ${selectedLetter.uppercase}, ${selectedLetter.word}`);
      }
    }
    
    // Show the answer regardless of correctness
    setShowDetails(true);
  };

  const renderLetterDisplay = () => {
    return (
      <div 
        className="cursor-pointer flex flex-col items-center justify-center"
        onClick={handleLetterClick}
      >
        <div className="text-9xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          {currentLetter.uppercase}
          {settings.showImmediateFeedback && (
            <span className="text-7xl ml-4">{currentLetter.lowercase}</span>
          )}
        </div>
        
        {showDetails && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="text-6xl mb-4">{currentLetter.image}</div>
            <div className="text-2xl font-medium">{currentLetter.word}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => playSound(`${currentLetter.uppercase}. ${currentLetter.word}`)}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Hear it
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderQuiz = () => {
    return (
      <div className="flex flex-col items-center">
        <div className="text-2xl font-medium mb-4">
          Which letter makes this sound?
        </div>
        <div className="text-6xl mb-6">{currentLetter.image}</div>
        
        <div className="grid grid-cols-2 gap-4">
          {quizOptions.map((option, index) => (
            <Button
              key={index}
              size="lg"
              variant={selectedOption === index 
                ? isCorrect ? "default" : "destructive" 
                : "outline"}
              className={`text-4xl h-20 w-20 ${
                selectedOption !== null && option.uppercase === currentLetter.uppercase 
                  ? "ring-2 ring-green-500" 
                  : ""
              }`}
              onClick={() => handleQuizOptionSelect(index)}
              disabled={selectedOption !== null}
            >
              {option.uppercase}
            </Button>
          ))}
        </div>
        
        {showDetails && (
          <div className="mt-6 flex flex-col items-center animate-fade-in">
            <div className="text-2xl font-medium">
              {currentLetter.uppercase} is for {currentLetter.word}
            </div>
            <div className="text-6xl mt-2">{currentLetter.image}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Alphabet Learning</h1>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Cog className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          {isQuizMode ? renderQuiz() : renderLetterDisplay()}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <Button
          variant="default"
          onClick={handleNext}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}