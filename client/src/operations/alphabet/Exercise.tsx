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
  // Acceso al contexto de drag and drop
  const { useDragItem, useDropTarget } = useAccessibleDnd();
  
  // Variables de estado básicas
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Tipos de ejercicios
  const [exerciseType, setExerciseType] = useState<
    'basic' | 'matching' | 'quiz' | 'ordering' | 'adjacentLetters' | 'mixed'
  >('basic');
  
  // Variables para el quiz
  const [quizOptions, setQuizOptions] = useState<Letter[]>([]);
  
  // Variables para ordenamiento de letras
  const [lettersToOrder, setLettersToOrder] = useState<{letter: string, id: string}[]>([]);
  const [orderedLetters, setOrderedLetters] = useState<{letter: string, id: string}[]>([]);
  
  // Variables para ejercicio de letras adyacentes
  const [adjacentLetterInputs, setAdjacentLetterInputs] = useState({
    before: '',
    after: ''
  });
  const [adjacentCorrect, setAdjacentCorrect] = useState({
    before: false,
    after: false
  });
  
  // Contadores para sistema adaptativo
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [rewardType, setRewardType] = useState<'stars' | 'medals' | 'trophies'>(
    (settings.rewardType as 'stars' | 'medals' | 'trophies') || 'stars'
  );
  
  const currentLetter = alphabet[currentIndex];

  useEffect(() => {
    // Resetear estados
    setShowDetails(false);
    setIsCorrect(null);
    setSelectedOption(null);
    setAdjacentLetterInputs({ before: '', after: '' });
    setAdjacentCorrect({ before: false, after: false });
    
    // Determinar el tipo de ejercicio según el nivel de dificultad
    let newExerciseType: 'basic' | 'matching' | 'quiz' | 'ordering' | 'adjacentLetters' | 'mixed' = 'basic';
    
    // Si estamos en nivel Expert y tenemos más de 10 respuestas correctas, mezclamos todos los tipos
    if (settings.difficulty === 'expert' && correctAnswers >= 10) {
      // Escoger aleatoriamente entre todos los tipos de ejercicios
      const types: ('basic' | 'matching' | 'quiz' | 'ordering' | 'adjacentLetters')[] = 
        ['basic', 'matching', 'quiz', 'ordering', 'adjacentLetters'];
      newExerciseType = types[Math.floor(Math.random() * types.length)];
    } else {
      // Asignar tipo según nivel de dificultad
      switch (settings.difficulty) {
        case 'beginner':
          newExerciseType = 'basic';
          break;
        case 'elementary':
          newExerciseType = 'matching';
          break;
        case 'intermediate':
          newExerciseType = 'quiz';
          break;
        case 'advanced':
          newExerciseType = 'ordering';
          break;
        case 'expert':
          newExerciseType = 'adjacentLetters';
          break;
        default:
          newExerciseType = 'basic';
      }
    }
    
    setExerciseType(newExerciseType);
    
    // Preparar ejercicios según el tipo
    if (newExerciseType === 'quiz') {
      generateQuizOptions();
    } else if (newExerciseType === 'ordering') {
      generateLettersToOrder();
    }
    
  }, [currentIndex, settings.difficulty, correctAnswers]);

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

  // Generador de letras para ordenar
  const generateLettersToOrder = () => {
    // Obtener un conjunto aleatorio de 4-6 letras consecutivas
    const startIndex = Math.floor(Math.random() * 20); // No empezar muy al final del alfabeto
    const numLetters = Math.floor(Math.random() * 3) + 4; // Entre 4 y 6 letras
    
    const selectedLetters = alphabet.slice(startIndex, startIndex + numLetters);
    
    // Crear un array con la letra y un ID único para el DnD
    const lettersWithIds = selectedLetters.map((letter, index) => ({
      letter: letter.uppercase,
      id: `letter-${index}`
    }));
    
    // Desordenar las letras
    setLettersToOrder(shuffleArray([...lettersWithIds]));
    setOrderedLetters([]);
  };

  const handleLetterClick = () => {
    if (exerciseType === 'basic') {
      setShowDetails(true);
      if (settings.enableSoundEffects) {
        playSound(`${currentLetter.uppercase}. ${currentLetter.word}`);
      }
    }
  };

  // Actualiza el manejo de opciones para el quiz
  const handleQuizOptionSelect = (index: number) => {
    setSelectedOption(index);
    
    let selectedLetter: Letter;
    let isAnswerCorrect: boolean;
    
    // Si estamos en el modo quiz, usamos las opciones del quiz
    if (exerciseType === 'quiz') {
      selectedLetter = quizOptions[index];
      isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
    } 
    // Si estamos en modo matching, comparamos con la letra actual
    else if (exerciseType === 'matching') {
      const randomLetters = shuffleArray(alphabet.slice(0, 8));
      selectedLetter = randomLetters[index];
      isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
    } 
    // Por defecto
    else {
      selectedLetter = alphabet[index % alphabet.length];
      isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
    }
    
    setIsCorrect(isAnswerCorrect);
    
    // Si la respuesta es correcta, incrementar el contador de respuestas correctas
    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
      
      // Determinar si mostrar recompensa (3% al azar, 100% en múltiplos de 5)
      const shouldShowReward = 
        settings.enableRewards && 
        (Math.random() < 0.03 || correctAnswers % 5 === 4);
      
      if (shouldShowReward) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2000);
      }
    }
    
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

  // Renderiza el ejercicio de emparejamiento (Elementary)
  const renderMatching = () => {
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-6">¿Qué letra va con esta imagen?</h2>
        <div className="text-6xl mb-6">{currentLetter.image}</div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {shuffleArray(alphabet.slice(0, 8)).map((letter, index) => (
            <Button
              key={index}
              size="lg"
              variant={selectedOption === index 
                ? letter.uppercase === currentLetter.uppercase ? "default" : "destructive" 
                : "outline"}
              className={`text-3xl h-16 w-16 ${
                selectedOption !== null && letter.uppercase === currentLetter.uppercase 
                  ? "ring-2 ring-green-500" 
                  : ""
              }`}
              onClick={() => handleQuizOptionSelect(index)}
              disabled={selectedOption !== null}
            >
              {letter.uppercase}
            </Button>
          ))}
        </div>
        
        {showDetails && (
          <div className="mt-6 flex flex-col items-center animate-fade-in">
            <div className="text-2xl font-medium">
              {currentLetter.uppercase} es para {currentLetter.word}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Renderiza el ejercicio de ordenar letras (Advanced)
  const renderOrdering = () => {
    // No implementamos toda la funcionalidad de DnD aquí para simplificar
    // Este es un ejemplo visual de cómo se vería
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-6">Ordena las letras del alfabeto</h2>
        
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {lettersToOrder.map((item) => (
            <div 
              key={item.id}
              className="h-16 w-16 flex items-center justify-center text-3xl font-bold 
                      bg-blue-100 dark:bg-blue-900 rounded-md cursor-move border-2 border-blue-300"
            >
              {item.letter}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex flex-col items-center">
          <p className="text-gray-500 text-sm mb-2">Arrastra las letras para ordenarlas correctamente</p>
          <Button
            variant="outline"
            onClick={generateLettersToOrder}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Nuevo conjunto
          </Button>
        </div>
      </div>
    );
  };
  
  // Renderiza el ejercicio de letras adyacentes (Expert)
  const renderAdjacentLetters = () => {
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-4">¿Qué letras van antes y después?</h2>
        
        <div className="text-8xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          {currentLetter.uppercase}
        </div>
        
        <div className="grid grid-cols-2 gap-6 w-full max-w-md mb-6">
          <div>
            <Label htmlFor="before-letter" className="mb-2 block">Antes</Label>
            <div className="flex gap-2">
              <Input
                id="before-letter"
                value={adjacentLetterInputs.before}
                onChange={(e) => 
                  setAdjacentLetterInputs(prev => ({...prev, before: e.target.value.toUpperCase()}))
                }
                className="text-center text-xl"
                maxLength={1}
                placeholder="?"
              />
              <Button
                variant={adjacentCorrect.before ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  // Calcular la letra anterior
                  const index = alphabet.findIndex(l => l.uppercase === currentLetter.uppercase);
                  const prevLetter = index > 0 ? alphabet[index - 1].uppercase : 'Z';
                  
                  const isCorrect = adjacentLetterInputs.before === prevLetter;
                  setAdjacentCorrect(prev => ({...prev, before: isCorrect}));
                  
                  if (isCorrect && settings.enableSoundEffects) {
                    playSound("Correct!");
                  }
                }}
                disabled={!adjacentLetterInputs.before || adjacentCorrect.before}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="after-letter" className="mb-2 block">Después</Label>
            <div className="flex gap-2">
              <Input
                id="after-letter"
                value={adjacentLetterInputs.after}
                onChange={(e) => 
                  setAdjacentLetterInputs(prev => ({...prev, after: e.target.value.toUpperCase()}))
                }
                className="text-center text-xl"
                maxLength={1}
                placeholder="?"
              />
              <Button
                variant={adjacentCorrect.after ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  // Calcular la letra siguiente
                  const index = alphabet.findIndex(l => l.uppercase === currentLetter.uppercase);
                  const nextLetter = index < alphabet.length - 1 ? alphabet[index + 1].uppercase : 'A';
                  
                  const isCorrect = adjacentLetterInputs.after === nextLetter;
                  setAdjacentCorrect(prev => ({...prev, after: isCorrect}));
                  
                  if (isCorrect && settings.enableSoundEffects) {
                    playSound("Correct!");
                  }
                }}
                disabled={!adjacentLetterInputs.after || adjacentCorrect.after}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {adjacentCorrect.before && adjacentCorrect.after && (
          <div className="mt-4 flex flex-col items-center animate-fade-in">
            <div className="text-2xl font-medium mb-2">¡Excelente trabajo!</div>
            {settings.enableRewards && (
              <div className="text-5xl animate-bounce">
                {rewardType === 'stars' && '⭐'}
                {rewardType === 'medals' && '🥇'}
                {rewardType === 'trophies' && '🏆'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Función para renderizar el ejercicio actual basado en el tipo
  const renderCurrentExercise = () => {
    switch (exerciseType) {
      case 'basic':
        return renderLetterDisplay();
      case 'matching':
        return renderMatching();
      case 'quiz':
        return renderQuiz();
      case 'ordering':
        return renderOrdering();
      case 'adjacentLetters':
        return renderAdjacentLetters();
      case 'mixed':
        // En el modo mezclado, ya hemos asignado uno de los tipos anteriores
        return renderCurrentExercise();
      default:
        return renderLetterDisplay();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Alphabet Learning</h1>
        <div className="flex space-x-2">
          <div className="text-sm text-gray-500 mr-2 pt-1">
            Level: {settings.difficulty}
          </div>
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Cog className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          {renderCurrentExercise()}
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