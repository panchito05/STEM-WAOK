import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, ArrowLeft, ArrowRight, Cog, RefreshCw, Check, EyeIcon, AlertCircle } from 'lucide-react';
import { ModuleSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { Progress } from '@/components/ui/progress';
import { formatTime } from '@/lib/utils';

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

// Alfabeto en inglés
const englishAlphabet: Letter[] = [
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

// Alfabeto en español
const spanishAlphabet: Letter[] = [
  { uppercase: 'A', lowercase: 'a', word: 'Árbol', image: '🌳' },
  { uppercase: 'B', lowercase: 'b', word: 'Balón', image: '⚽' },
  { uppercase: 'C', lowercase: 'c', word: 'Casa', image: '🏠' },
  { uppercase: 'D', lowercase: 'd', word: 'Delfín', image: '🐬' },
  { uppercase: 'E', lowercase: 'e', word: 'Elefante', image: '🐘' },
  { uppercase: 'F', lowercase: 'f', word: 'Flor', image: '🌸' },
  { uppercase: 'G', lowercase: 'g', word: 'Gato', image: '🐱' },
  { uppercase: 'H', lowercase: 'h', word: 'Helado', image: '🍦' },
  { uppercase: 'I', lowercase: 'i', word: 'Iguana', image: '🦎' },
  { uppercase: 'J', lowercase: 'j', word: 'Jirafa', image: '🦒' },
  { uppercase: 'K', lowercase: 'k', word: 'Kiwi', image: '🥝' },
  { uppercase: 'L', lowercase: 'l', word: 'León', image: '🦁' },
  { uppercase: 'M', lowercase: 'm', word: 'Manzana', image: '🍎' },
  { uppercase: 'N', lowercase: 'n', word: 'Nube', image: '☁️' },
  { uppercase: 'Ñ', lowercase: 'ñ', word: 'Ñandú', image: '🦢' },
  { uppercase: 'O', lowercase: 'o', word: 'Oso', image: '🐻' },
  { uppercase: 'P', lowercase: 'p', word: 'Pez', image: '🐠' },
  { uppercase: 'Q', lowercase: 'q', word: 'Queso', image: '🧀' },
  { uppercase: 'R', lowercase: 'r', word: 'Ratón', image: '🐭' },
  { uppercase: 'S', lowercase: 's', word: 'Sol', image: '☀️' },
  { uppercase: 'T', lowercase: 't', word: 'Tren', image: '🚂' },
  { uppercase: 'U', lowercase: 'u', word: 'Uvas', image: '🍇' },
  { uppercase: 'V', lowercase: 'v', word: 'Vaca', image: '🐄' },
  { uppercase: 'W', lowercase: 'w', word: 'Windsurf', image: '🏄' },
  { uppercase: 'X', lowercase: 'x', word: 'Xilófono', image: '🎵' },
  { uppercase: 'Y', lowercase: 'y', word: 'Yogur', image: '🥛' },
  { uppercase: 'Z', lowercase: 'z', word: 'Zapato', image: '👞' },
];

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Accedemos al contexto de progreso para guardar resultados
  const { saveExerciseResult } = useProgress();
  
  // Variables de estado básicas
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Variables para ejercicio
  const [timer, setTimer] = useState(0);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  
  // Tipos de ejercicios
  const [exerciseType, setExerciseType] = useState<
    'basic' | 'matching' | 'quiz' | 'ordering' | 'adjacentLetters' | 'mixed'
  >('basic');
  
  // Variables para el quiz (nuevo sistema)
  const [quizOptions, setQuizOptions] = useState<Letter[]>([]);
  const [quizSelectedOption, setQuizSelectedOption] = useState<Letter | null>(null);
  const [quizIsCorrect, setQuizIsCorrect] = useState<boolean | null>(null);
  const [quizShowDetails, setQuizShowDetails] = useState(false);
  
  // Variables para el matching (nuevo sistema)
  const [matchingOptions, setMatchingOptions] = useState<Letter[]>([]);
  const [matchingSelectedOption, setMatchingSelectedOption] = useState<Letter | null>(null);
  const [matchingIsCorrect, setMatchingIsCorrect] = useState<boolean | null>(null);
  const [matchingShowDetails, setMatchingShowDetails] = useState(false);
  
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
  
  // Contadores para sistema adaptativo y recompensas
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [showReward, setShowReward] = useState(false);
  
  // Sistema avanzado de recompensas aleatorias
  const [rewardsShownIndices, setRewardsShownIndices] = useState<number[]>([]);
  const [totalRewardsShown, setTotalRewardsShown] = useState(0);
  
  // Tipo de recompensa a mostrar
  const [rewardType, setRewardType] = useState<'stars' | 'medals' | 'trophies'>(
    (settings.rewardType as 'stars' | 'medals' | 'trophies') || 'stars'
  );
  
  // Usar el alfabeto correspondiente al idioma seleccionado
  const selectedLanguage = settings.language || 'english';
  const alphabet = selectedLanguage === 'spanish' ? spanishAlphabet : englishAlphabet;
  const currentLetter = alphabet[currentIndex];

  useEffect(() => {
    // Resetear estados
    setShowDetails(false);
    setIsCorrect(null);
    setQuizSelectedOption(null);
    setQuizIsCorrect(null);
    setQuizShowDetails(false);
    setMatchingSelectedOption(null);
    setMatchingIsCorrect(null);
    setMatchingShowDetails(false);
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
    
  }, [currentIndex, settings.difficulty, correctAnswers, settings.language]);

  // Efecto para generar opciones de quiz cuando cambia la letra o el tipo de ejercicio
  useEffect(() => {
    if (exerciseType === 'quiz') {
      // Siempre incluir la letra correcta
      const correctLetter = currentLetter;
      
      // Crear el conjunto de opciones (3 aleatorias + la correcta)
      let optionsSet: Letter[] = [correctLetter];
      
      // Necesitamos 3 letras aleatorias diferentes
      while (optionsSet.length < 4) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        const randomLetter = alphabet[randomIndex];
        
        // No agregar duplicados
        if (!optionsSet.some(opt => opt.uppercase === randomLetter.uppercase)) {
          optionsSet.push(randomLetter);
        }
      }
      
      // Mezclar las opciones
      const shuffledOptions = [...optionsSet].sort(() => Math.random() - 0.5);
      
      // Actualizar el estado
      setQuizOptions(shuffledOptions);
      
      console.log('NUEVO SISTEMA QUIZ: Opciones generadas:', 
        shuffledOptions.map(l => l.uppercase).join(', '));
      console.log('NUEVO SISTEMA QUIZ: Letra correcta:', correctLetter.uppercase);
    }
  }, [currentLetter, alphabet, exerciseType]);
  
  // Efecto para generar opciones de matching cuando cambia la letra o el tipo de ejercicio
  useEffect(() => {
    if (exerciseType === 'matching') {
      // Generar conjunto de opciones aleatorias para el matching
      const letterIndices: number[] = [];
      
      // Elegir índices aleatorios para 7 letras diferentes (excluyendo la actual)
      while (letterIndices.length < 7) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        if (randomIndex !== currentIndex && !letterIndices.includes(randomIndex)) {
          letterIndices.push(randomIndex);
        }
      }
      
      // Convertir índices en letras
      const randomLetters = letterIndices.map(index => alphabet[index]);
      
      // Agregar la letra actual y mezclar
      const allOptions = [...randomLetters, currentLetter];
      const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
      
      // Actualizar estado
      setMatchingOptions(shuffledOptions);
      
      console.log('NUEVO SISTEMA MATCHING: Opciones generadas:', 
        shuffledOptions.map(l => l.uppercase).join(', '));
      console.log('NUEVO SISTEMA MATCHING: Letra correcta:', currentLetter.uppercase);
    }
  }, [currentLetter, alphabet, currentIndex, exerciseType]);
  
  // Efecto para generar letras para ordenar cuando cambia el tipo de ejercicio
  useEffect(() => {
    if (exerciseType === 'ordering') {
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
    }
  }, [exerciseType, alphabet]);

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

  const shuffleArray = <T extends unknown>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleLetterClick = () => {
    if (exerciseType === 'basic') {
      setShowDetails(true);
      if (settings.enableSoundEffects) {
        playSound(`${currentLetter.uppercase}. ${currentLetter.word}`);
      }
    }
  };

  // Manejar la selección de una opción en el quiz
  const handleQuizOptionSelect = (selectedLetter: Letter) => {
    setQuizSelectedOption(selectedLetter);
    
    // Comprobar si es correcta comparando directamente las letras
    const isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
    setQuizIsCorrect(isAnswerCorrect);
    setQuizShowDetails(true);
    
    console.log('NUEVO SISTEMA QUIZ: Seleccionada:', selectedLetter.uppercase);
    console.log('NUEVO SISTEMA QUIZ: Correcta:', currentLetter.uppercase);
    console.log('NUEVO SISTEMA QUIZ: ¿Coinciden?', isAnswerCorrect);
    
    // Actualizar contadores
    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setConsecutiveCorrectAnswers(prev => prev + 1);
      
      // Activar sistema de recompensas si corresponde
      const shouldShowReward = settings.enableRewards && 
        (Math.random() < 0.05 || consecutiveCorrectAnswers % 5 === 4);
      
      if (shouldShowReward) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2500);
      }
      
      // Reproducir sonido de acierto
      if (settings.enableSoundEffects) {
        playSound("Correct! Good job!");
      }
    } else {
      // Reiniciar contador de aciertos consecutivos
      setConsecutiveCorrectAnswers(0);
      
      // Reproducir sonido de error
      if (settings.enableSoundEffects) {
        playSound(`Incorrect. The letter is ${currentLetter.uppercase} for ${currentLetter.word}`);
      }
    }
  };
  
  // Función para mostrar la respuesta directamente en el quiz
  const showQuizAnswer = () => {
    setQuizSelectedOption(currentLetter);
    setQuizIsCorrect(true);
    setQuizShowDetails(true);
    
    // Reproducir sonido con la respuesta
    if (settings.enableSoundEffects) {
      playSound(`The letter is ${currentLetter.uppercase} for ${currentLetter.word}`);
    }
  };

  // Manejar la selección de una opción en el matching
  const handleMatchingOptionSelect = (selectedLetter: Letter) => {
    setMatchingSelectedOption(selectedLetter);
    
    // Comprobar si es correcta comparando directamente las letras
    const isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
    setMatchingIsCorrect(isAnswerCorrect);
    setMatchingShowDetails(true);
    
    console.log('NUEVO SISTEMA MATCHING: Seleccionada:', selectedLetter.uppercase);
    console.log('NUEVO SISTEMA MATCHING: Correcta:', currentLetter.uppercase);
    console.log('NUEVO SISTEMA MATCHING: ¿Coinciden?', isAnswerCorrect);
    
    // Actualizar contadores
    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setConsecutiveCorrectAnswers(prev => prev + 1);
      
      // Activar sistema de recompensas si corresponde
      const shouldShowReward = settings.enableRewards && 
        (Math.random() < 0.05 || consecutiveCorrectAnswers % 5 === 4);
      
      if (shouldShowReward) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2500);
      }
      
      // Reproducir sonido de acierto
      if (settings.enableSoundEffects) {
        playSound("Correct! Good job!");
      }
    } else {
      // Reiniciar contador de aciertos consecutivos
      setConsecutiveCorrectAnswers(0);
      
      // Reproducir sonido de error
      if (settings.enableSoundEffects) {
        playSound(`Incorrect. The letter is ${currentLetter.uppercase} for ${currentLetter.word}`);
      }
    }
  };
  
  // Función para mostrar la respuesta directamente en el matching
  const showMatchingAnswer = () => {
    setMatchingSelectedOption(currentLetter);
    setMatchingIsCorrect(true);
    setMatchingShowDetails(true);
    
    // Reproducir sonido con la respuesta
    if (settings.enableSoundEffects) {
      playSound(`The letter is ${currentLetter.uppercase} for ${currentLetter.word}`);
    }
  };

  // Función para mostrar la respuesta básica
  const showBasicAnswer = () => {
    setShowDetails(true);
    if (settings.enableSoundEffects) {
      playSound(`${currentLetter.uppercase}. ${currentLetter.word}`);
    }
  };

  // Función para revisar el orden de las letras
  const checkLetterOrder = () => {
    // Compara el orden actual con el orden alfabético correcto
    const sortedLetters = [...lettersToOrder].sort((a, b) => {
      return a.letter.localeCompare(b.letter);
    });
    
    // Verifica si están en el mismo orden
    const isCorrect = lettersToOrder.every((letter, index) => {
      return letter.letter === sortedLetters[index].letter;
    });

    setIsCorrect(isCorrect);
    setShowDetails(true);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      
      // Determinar si mostrar recompensa (3% al azar, 100% en múltiplos de 5)
      const shouldShowReward = 
        settings.enableRewards && 
        (Math.random() < 0.03 || correctAnswers % 5 === 4);
      
      if (shouldShowReward) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2000);
      }

      if (settings.enableSoundEffects) {
        playSound("Correct! The letters are in the right order!");
      }
    } else {
      if (settings.enableSoundEffects) {
        playSound("Try again. The letters are not in the correct order.");
      }
    }
  };

  // Función para mostrar las letras en orden
  const showOrderAnswer = () => {
    // Ordena las letras alfabéticamente
    const sortedLetters = [...lettersToOrder].sort((a, b) => {
      return a.letter.localeCompare(b.letter);
    });
    
    setLettersToOrder(sortedLetters);
    setShowDetails(true);
  };

  // Comprueba las letras adyacentes
  const checkAdjacentLetters = () => {
    // Obtener índice actual
    const currentIdx = alphabet.findIndex(
      letter => letter.uppercase === currentLetter.uppercase
    );
    
    // Obtener letras adyacentes correctas
    let beforeCorrect = false;
    let afterCorrect = false;
    
    // Verificar letra anterior
    if (currentIdx > 0) {
      const correctBeforeLetter = alphabet[currentIdx - 1].uppercase;
      beforeCorrect = adjacentLetterInputs.before.toUpperCase() === correctBeforeLetter;
    } else {
      // Si es la primera letra, no hay "anterior"
      beforeCorrect = adjacentLetterInputs.before === "";
    }
    
    // Verificar letra siguiente
    if (currentIdx < alphabet.length - 1) {
      const correctAfterLetter = alphabet[currentIdx + 1].uppercase;
      afterCorrect = adjacentLetterInputs.after.toUpperCase() === correctAfterLetter;
    } else {
      // Si es la última letra, no hay "siguiente"
      afterCorrect = adjacentLetterInputs.after === "";
    }
    
    // Actualizar estado
    setAdjacentCorrect({
      before: beforeCorrect,
      after: afterCorrect
    });
    
    const allCorrect = beforeCorrect && afterCorrect;
    
    // Mostrar feedback y actualizar contadores
    if (allCorrect) {
      setCorrectAnswers(prev => prev + 1);
      
      // Sistema de recompensas
      const shouldShowReward = 
        settings.enableRewards && 
        (Math.random() < 0.05 || correctAnswers % 5 === 4);
      
      if (shouldShowReward) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2000);
      }
      
      if (settings.enableSoundEffects) {
        playSound("Perfect! You got both adjacent letters right!");
      }
    } else if (beforeCorrect || afterCorrect) {
      if (settings.enableSoundEffects) {
        playSound("Partially correct! One of your answers is right.");
      }
    } else {
      if (settings.enableSoundEffects) {
        playSound("Try again. Neither of your answers is correct.");
      }
    }
    
    setShowDetails(true);
  };

  // Mostrar respuesta para letras adyacentes
  const showAdjacentAnswer = () => {
    // Obtener índice actual
    const currentIdx = alphabet.findIndex(
      letter => letter.uppercase === currentLetter.uppercase
    );
    
    // Obtener y mostrar letras adyacentes correctas
    let beforeLetter = "";
    let afterLetter = "";
    
    if (currentIdx > 0) {
      beforeLetter = alphabet[currentIdx - 1].uppercase;
    }
    
    if (currentIdx < alphabet.length - 1) {
      afterLetter = alphabet[currentIdx + 1].uppercase;
    }
    
    setAdjacentLetterInputs({
      before: beforeLetter,
      after: afterLetter
    });
    
    setAdjacentCorrect({
      before: true,
      after: true
    });
    
    setShowDetails(true);
    
    if (settings.enableSoundEffects) {
      const message = `The letter before ${currentLetter.uppercase} is ${beforeLetter || "none"} and the letter after is ${afterLetter || "none"}.`;
      playSound(message);
    }
  };

  const renderLetterDisplay = () => {
    return (
      <div className="flex flex-col items-center justify-center">
        <div 
          className="cursor-pointer text-9xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text"
          onClick={handleLetterClick}
        >
          {currentLetter.uppercase}
          {settings.showImmediateFeedback && (
            <span className="text-7xl ml-4">{currentLetter.lowercase}</span>
          )}
        </div>
        
        {!showDetails && (
          <Button 
            variant="outline"
            onClick={showBasicAnswer}
            className="mt-2 mb-4"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
          </Button>
        )}
        
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
    // Si no hay opciones, mostrar loading
    if (quizOptions.length === 0) {
      return <div className="flex justify-center"><RefreshCw className="animate-spin" /></div>;
    }
    
    return (
      <div className="flex flex-col items-center">
        <div className="text-2xl font-medium mb-4">
          {selectedLanguage === 'spanish'
            ? '¿Qué letra hace este sonido?'
            : 'Which letter makes this sound?'}
        </div>
        <div className="text-6xl mb-6">{currentLetter.image}</div>
        
        <div className="grid grid-cols-2 gap-4">
          {quizOptions.map((option) => {
            // Determinar si esta opción es la correcta
            const isThisCorrect = option.uppercase === currentLetter.uppercase;
            const isSelected = quizSelectedOption?.uppercase === option.uppercase;
            
            return (
              <Button
                key={`quiz-option-${option.uppercase}`}
                size="lg"
                variant={isSelected 
                  ? (isThisCorrect ? "default" : "destructive")
                  : "outline"
                }
                className={`text-4xl h-20 w-20 ${
                  quizSelectedOption && isThisCorrect
                    ? "ring-2 ring-green-500" 
                    : ""
                }`}
                onClick={() => handleQuizOptionSelect(option)}
                disabled={quizSelectedOption !== null}
              >
                {option.uppercase}
              </Button>
            );
          })}
        </div>
        
        {quizSelectedOption === null && (
          <Button 
            variant="outline"
            onClick={showQuizAnswer}
            className="mt-4"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
          </Button>
        )}
        
        {quizShowDetails && (
          <div className="mt-6 flex flex-col items-center animate-fade-in">
            <div className="text-2xl font-medium">
              {selectedLanguage === 'spanish'
                ? `${currentLetter.uppercase} es para ${currentLetter.word}`
                : `${currentLetter.uppercase} is for ${currentLetter.word}`}
            </div>
            <div className="text-6xl mt-2">{currentLetter.image}</div>
          </div>
        )}
      </div>
    );
  };

  const renderMatching = () => {
    // Si no hay opciones, mostrar loading
    if (matchingOptions.length === 0) {
      return <div className="flex justify-center"><RefreshCw className="animate-spin" /></div>;
    }
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-6">
          {selectedLanguage === 'spanish' 
            ? '¿Qué letra va con esta imagen?' 
            : 'Which letter goes with this image?'}
        </h2>
        <div className="text-6xl mb-6">{currentLetter.image}</div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {matchingOptions.map((letter) => {
            // Determinar si esta opción es la correcta
            const isThisCorrect = letter.uppercase === currentLetter.uppercase;
            const isSelected = matchingSelectedOption?.uppercase === letter.uppercase;
            
            return (
              <Button
                key={`matching-option-${letter.uppercase}`}
                size="lg"
                variant={isSelected 
                  ? (isThisCorrect ? "default" : "destructive") 
                  : "outline"}
                className={`text-3xl h-16 w-16 ${
                  matchingSelectedOption && isThisCorrect
                    ? "ring-2 ring-green-500" 
                    : ""
                }`}
                onClick={() => handleMatchingOptionSelect(letter)}
                disabled={matchingSelectedOption !== null}
              >
                {letter.uppercase}
              </Button>
            );
          })}
        </div>
        
        {matchingSelectedOption === null && (
          <Button 
            variant="outline"
            onClick={showMatchingAnswer}
            className="mt-4"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
          </Button>
        )}
        
        {matchingShowDetails && (
          <div className="mt-6 flex flex-col items-center animate-fade-in">
            <div className="text-2xl font-medium">
              {selectedLanguage === 'spanish'
                ? `${currentLetter.uppercase} es para ${currentLetter.word}`
                : `${currentLetter.uppercase} is for ${currentLetter.word}`}
            </div>
            <div className="text-6xl mt-2">{currentLetter.image}</div>
          </div>
        )}
      </div>
    );
  };

  // Componente de letra arrastrable
  const DraggableLetter = ({ id, letter, index, moveCard }: { 
    id: string, 
    letter: string, 
    index: number, 
    moveCard: (dragIndex: number, hoverIndex: number) => void 
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    
    const [{ isDragging }, drag] = useDrag({
      type: 'letter',
      item: () => {
        return { id, index };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    
    const [, drop] = useDrop({
      accept: 'letter',
      hover(item: { id: string, index: number }, monitor) {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;
        
        // No reemplazar elementos en sí mismos
        if (dragIndex === hoverIndex) {
          return;
        }
        
        // Determinar el rectángulo en la pantalla
        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        // Obtener el punto medio vertical
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
        // Determinar la posición del mouse
        const clientOffset = monitor.getClientOffset();
        
        if (!clientOffset) {
          return;
        }
        
        // Obtener pixeles hasta el lado izquierdo
        const hoverClientX = clientOffset.x - hoverBoundingRect.left;
        
        // Solo realizar el movimiento cuando el mouse haya cruzado la mitad de la altura del elemento
        // Al arrastrar hacia la derecha, solo mover cuando el cursor esté después de la mitad
        // Al arrastrar hacia la izquierda, solo mover cuando el cursor esté antes de la mitad
        
        // Arrastrando hacia la derecha
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }
        
        // Arrastrando hacia la izquierda
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }
        
        // Realizar la acción de movimiento
        moveCard(dragIndex, hoverIndex);
        // Actualizar el índice para el elemento arrastrado
        item.index = hoverIndex;
      },
    });
    
    const opacity = isDragging ? 0.4 : 1;
    drag(drop(ref));
    
    return (
      <div 
        ref={ref}
        className={`h-16 w-16 flex items-center justify-center text-3xl font-bold 
                   bg-blue-100 dark:bg-blue-900 rounded-md cursor-move border-2 
                   border-blue-300 transition-opacity`}
        style={{ opacity }}
      >
        {letter}
      </div>
    );
  };

  const moveCard = (dragIndex: number, hoverIndex: number) => {
    setLettersToOrder(prevCards => {
      const newCards = [...prevCards];
      // Eliminar la carta arrastrada
      const draggedItem = newCards[dragIndex];
      // Eliminar del array en la posición de arrastre
      newCards.splice(dragIndex, 1);
      // Insertar en la nueva posición
      newCards.splice(hoverIndex, 0, draggedItem);
      return newCards;
    });
  };

  const renderOrdering = () => {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-medium mb-6">
            {selectedLanguage === 'spanish' ? 'Ordena las letras del alfabeto' : 'Order the alphabet letters'}
          </h2>
          
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {lettersToOrder.map((item, index) => (
              <DraggableLetter 
                key={item.id}
                id={item.id}
                letter={item.letter}
                index={index}
                moveCard={moveCard}
              />
            ))}
          </div>
          
          <div className="flex gap-3 mt-4">
            <Button
              onClick={checkLetterOrder}
              disabled={showDetails && isCorrect === true}
            >
              <Check className="mr-2 h-4 w-4" />
              {selectedLanguage === 'spanish' ? 'Comprobar Orden' : 'Check Order'}
            </Button>
            
            {!showDetails && (
              <Button
                variant="outline"
                onClick={showOrderAnswer}
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
              </Button>
            )}
          </div>
          
          {showDetails && (
            <div className="mt-6 animate-fade-in">
              {isCorrect ? (
                <div className="text-center text-green-600 font-medium">
                  {selectedLanguage === 'spanish' 
                    ? '¡Correcto! Las letras están en el orden alfabético correcto.' 
                    : 'Correct! The letters are in the correct alphabetical order.'}
                </div>
              ) : (
                <div className="text-center text-red-600 font-medium">
                  {selectedLanguage === 'spanish' 
                    ? 'Incorrecto. Intenta ordenar las letras alfabéticamente.' 
                    : 'Incorrect. Try to arrange the letters alphabetically.'}
                </div>
              )}
            </div>
          )}
        </div>
      </DndProvider>
    );
  };

  const renderAdjacentLetters = () => {
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-4">
          {selectedLanguage === 'spanish' 
            ? '¿Qué letras van antes y después?' 
            : 'Which letters come before and after?'}
        </h2>
        
        <div className="text-9xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          {currentLetter.uppercase}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-2 mb-6">
          <div>
            <Label htmlFor="before-letter" className="block mb-2">
              {selectedLanguage === 'spanish' ? 'Letra anterior:' : 'Letter before:'}
            </Label>
            <Input
              id="before-letter"
              maxLength={1}
              className={`text-center text-2xl h-12 w-16 ${
                showDetails 
                  ? adjacentCorrect.before ? "border-green-500" : "border-red-500" 
                  : ""
              }`}
              value={adjacentLetterInputs.before}
              onChange={(e) => 
                setAdjacentLetterInputs(prev => ({...prev, before: e.target.value.toUpperCase()}))
              }
            />
          </div>
          
          <div>
            <Label htmlFor="after-letter" className="block mb-2">
              {selectedLanguage === 'spanish' ? 'Letra siguiente:' : 'Letter after:'}
            </Label>
            <Input
              id="after-letter"
              maxLength={1}
              className={`text-center text-2xl h-12 w-16 ${
                showDetails 
                  ? adjacentCorrect.after ? "border-green-500" : "border-red-500" 
                  : ""
              }`}
              value={adjacentLetterInputs.after}
              onChange={(e) => 
                setAdjacentLetterInputs(prev => ({...prev, after: e.target.value.toUpperCase()}))
              }
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-2">
          <Button onClick={checkAdjacentLetters} disabled={showDetails}>
            <Check className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Comprobar' : 'Check'}
          </Button>
          
          {!showDetails && (
            <Button variant="outline" onClick={showAdjacentAnswer}>
              <EyeIcon className="mr-2 h-4 w-4" />
              {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
            </Button>
          )}
        </div>
        
        {showDetails && (
          <div className="mt-6 text-center animate-fade-in">
            {adjacentCorrect.before && adjacentCorrect.after ? (
              <div className="text-green-600 font-medium">
                {selectedLanguage === 'spanish' 
                  ? '¡Correcto! Has identificado ambas letras adyacentes.' 
                  : 'Correct! You have identified both adjacent letters.'}
              </div>
            ) : adjacentCorrect.before || adjacentCorrect.after ? (
              <div className="text-yellow-600 font-medium">
                {selectedLanguage === 'spanish' 
                  ? 'Parcialmente correcto. Una de tus respuestas es correcta.' 
                  : 'Partially correct. One of your answers is correct.'}
              </div>
            ) : (
              <div className="text-red-600 font-medium">
                {selectedLanguage === 'spanish' 
                  ? 'Incorrecto. Intenta identificar las letras que vienen antes y después.' 
                  : 'Incorrect. Try to identify the letters that come before and after.'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderExercise = () => {
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
      default:
        return renderLetterDisplay();
    }
  };

  // Elementos de recompensa
  const renderReward = () => {
    if (!showReward) return null;
    
    let rewardElements: JSX.Element[] = [];
    
    // Determinar el tipo de recompensa
    switch (rewardType) {
      case 'stars':
        rewardElements = Array(5).fill(0).map((_, i) => (
          <div 
            key={`star-${i}`} 
            className="text-4xl animate-bounce" 
            style={{ 
              animation: `bounce 1s infinite ${i * 0.2}s`,
              color: `hsl(${45 + i * 10}, 100%, 50%)`
            }}
          >
            ⭐
          </div>
        ));
        break;
      case 'medals':
        rewardElements = Array(3).fill(0).map((_, i) => (
          <div 
            key={`medal-${i}`} 
            className="text-5xl animate-bounce" 
            style={{ 
              animation: `bounce 1s infinite ${i * 0.3}s`,
            }}
          >
            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
          </div>
        ));
        break;
      case 'trophies':
        rewardElements = Array(3).fill(0).map((_, i) => (
          <div 
            key={`trophy-${i}`} 
            className="text-5xl animate-bounce" 
            style={{ 
              animation: `bounce 1s infinite ${i * 0.3}s`,
              transform: `rotate(${(i - 1) * 15}deg)`
            }}
          >
            🏆
          </div>
        ));
        break;
    }
    
    return (
      <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center pointer-events-none">
        <div className="flex gap-4 items-center">
          {rewardElements}
        </div>
      </div>
    );
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {selectedLanguage === 'spanish' ? 'Aprendizaje del Alfabeto' : 'Alphabet Learning'}
          </h2>
          <div className="flex items-center">
            <div className="mr-2 text-sm opacity-70">
              {settings.difficulty === 'beginner' ? 'Beginner' :
               settings.difficulty === 'elementary' ? 'Elementary' :
               settings.difficulty === 'intermediate' ? 'Intermediate' :
               settings.difficulty === 'advanced' ? 'Advanced' :
               'Expert'}
            </div>
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Cog className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          {renderExercise()}
        </div>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handlePrevious}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Anterior' : 'Previous'}
          </Button>
          
          <Button variant="outline" onClick={handleNext}>
            {selectedLanguage === 'spanish' ? 'Siguiente' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {/* Sistema de recompensas */}
        {renderReward()}
      </CardContent>
    </Card>
  );
}