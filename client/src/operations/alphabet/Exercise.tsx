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
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Variables para ejercicio
  const [timer, setTimer] = useState(0);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [problemTimer, setProblemTimer] = useState(0);
  const [problemStartTime, setProblemStartTime] = useState(0);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("gray");
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [autoContinue, setAutoContinue] = useState(false);
  const [showingExplanation, setShowingExplanation] = useState(false);
  
  // Tipos de ejercicios
  const [exerciseType, setExerciseType] = useState<
    'basic' | 'matching' | 'quiz' | 'ordering' | 'adjacentLetters' | 'mixed'
  >('basic');
  
  // Variables para el quiz y matching
  const [quizOptions, setQuizOptions] = useState<Letter[]>([]);
  const [matchingOptions, setMatchingOptions] = useState<Letter[]>([]);
  const [fixedPositions, setFixedPositions] = useState<boolean>(true);
  
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
  
  // Función de utilidad para mezclar un array
  const shuffleArray = <T extends unknown>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Genera un conjunto fijo de letras para el quiz (nivel intermediate)
  const generateInitialLetterSet = (): Letter[] => {
    // Usar todas las letras del alfabeto, pero asegurándonos de incluir la letra actual
    const letterSet: Letter[] = [...alphabet];
    const currentLetterItem = alphabet[currentIndex];
    
    // Asegurarse de que currentLetterItem está incluido en el conjunto
    const optionsWithoutCurrent = letterSet.filter(letter => 
      letter.uppercase !== currentLetterItem.uppercase
    );
    
    // Mezclar el resto de las letras
    const shuffledRest = shuffleArray(optionsWithoutCurrent);
    
    // Tomar 3 letras aleatorias (además de la actual)
    const randomThreeLetters = shuffledRest.slice(0, 3);
    
    // Combinar con la letra actual y mezclar
    const finalOptions = shuffleArray([...randomThreeLetters, currentLetterItem]);
    
    console.log("🌟 Conjunto inicial de letras generado para quiz, asegurando", currentLetterItem.uppercase);
    return finalOptions;
  };
  
  // Genera un conjunto fijo de letras para el matching (nivel elementary)
  const generateInitialMatchingSet = (): Letter[] => {
    // Usar todas las letras del alfabeto, pero asegurándonos de incluir la letra actual
    const letterSet: Letter[] = [...alphabet];
    const currentLetterItem = alphabet[currentIndex];
    
    // Asegurarse de que currentLetterItem está incluido en el conjunto
    const optionsWithoutCurrent = letterSet.filter(letter => 
      letter.uppercase !== currentLetterItem.uppercase
    );
    
    // Mezclar el resto de las letras
    const shuffledRest = shuffleArray(optionsWithoutCurrent);
    
    // Tomar 7 letras aleatorias (además de la actual)
    const randomSevenLetters = shuffledRest.slice(0, 7);
    
    // Combinar con la letra actual y mezclar
    const finalOptions = shuffleArray([...randomSevenLetters, currentLetterItem]);
    
    console.log("🌟 Conjunto inicial de letras generado para matching, asegurando", currentLetterItem.uppercase);
    return finalOptions;
  };

  // Efecto para regenerar opciones cuando cambia la letra actual
  useEffect(() => {
    // Al cambiar de letra, debemos regenerar las opciones para incluir la letra correcta
    if (settings.difficulty === 'intermediate') {
      const updatedLetters = generateInitialLetterSet();
      setQuizOptions(updatedLetters);
    }
    
    // También regeneramos las opciones para el nivel elementary
    if (settings.difficulty === 'elementary') {
      const updatedMatchingLetters = generateInitialMatchingSet();
      setMatchingOptions(updatedMatchingLetters);
    }
  }, [currentIndex, settings.difficulty]);

  // Efecto principal para cambios de letra y configuración
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
    
    // Preparar ejercicios según el tipo, solo para ordenamiento
    // Quiz y matching ya están pre-generados
    if (newExerciseType === 'ordering') {
      generateLettersToOrder();
    }
    
  }, [currentIndex, settings.difficulty, correctAnswers]);
  
  // Este método ahora solo se usa para regenerar opciones si fuera necesario
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
    
    // Solo mezclar las opciones cuando comenzamos un nuevo ejercicio
    // esto permite que las posiciones se mantengan fijas después
    if (fixedPositions) {
      // Ordenamos alfabéticamente para que siempre sea consistente
      options.sort((a, b) => a.uppercase.localeCompare(b.uppercase));
      
      // Luego mezclamos para que la respuesta correcta no esté siempre en la misma posición
      const shuffledOptions = shuffleArray(options);
      
      // Registramos la posición correcta para debugging
      const correctPosition = shuffledOptions.findIndex(
        option => option.uppercase === correctLetter.uppercase
      );
      console.log("✓ Posición correcta:", correctPosition);
      
      setQuizOptions(shuffledOptions);
    }
  };
  
  // Generador de opciones para el ejercicio de matching
  const generateMatchingOptions = () => {
    // Always include the correct letter
    const correctLetter = alphabet[currentIndex];
    
    // Generar 7 letras aleatorias diferentes (8 opciones totales con la correcta)
    let options: Letter[] = [correctLetter];
    
    // Intentar tomar letras diferentes uniformemente del alfabeto
    const step = Math.max(1, Math.floor(alphabet.length / 8));
    
    for (let i = 0; i < alphabet.length && options.length < 8; i += step) {
      const randomOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const index = (currentIndex + i + randomOffset) % alphabet.length;
      
      const letter = alphabet[index];
      
      // No añadir duplicados
      if (!options.some(option => option.uppercase === letter.uppercase)) {
        options.push(letter);
      }
    }
    
    // Si aún no hemos reunido suficientes opciones, añadir aleatorias
    while (options.length < 8) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      const randomLetter = alphabet[randomIndex];
      
      // No añadir duplicados
      if (!options.some(option => option.uppercase === randomLetter.uppercase)) {
        options.push(randomLetter);
      }
    }
    
    // En el caso de matching, siempre tomamos las primeras 8
    options = options.slice(0, 8);
    
    // Ordenar alfabéticamente y luego mezclar
    if (fixedPositions) {
      options.sort((a, b) => a.uppercase.localeCompare(b.uppercase));
      const shuffledOptions = shuffleArray(options);
      
      // Registrar la posición correcta para debugging
      const correctPosition = shuffledOptions.findIndex(
        option => option.uppercase === correctLetter.uppercase
      );
      console.log("🔤 Matching - Posición correcta:", correctPosition);
      
      setMatchingOptions(shuffledOptions);
    }
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
    // Habilitar logs detallados para depurar
    console.log("🎯 handleQuizOptionSelect iniciando con índice:", index);
    
    setSelectedOption(index);
    
    let selectedLetter: Letter;
    let isAnswerCorrect: boolean;
    
    // Si estamos en el modo quiz, usamos las opciones del quiz
    if (exerciseType === 'quiz') {
      selectedLetter = quizOptions[index];
      isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
      
      // Registramos para debugging
      console.log("👆 Usuario seleccionó:", selectedLetter.uppercase, selectedLetter.word);
      console.log("✓ Respuesta correcta:", currentLetter.uppercase, currentLetter.word);
      console.log("✅ ¿Es correcta?:", isAnswerCorrect);
    } 
    // Si estamos en modo matching, usamos las opciones de matching
    else if (exerciseType === 'matching') {
      selectedLetter = matchingOptions[index];
      isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
      console.log("🔤 Matching - Usuario seleccionó:", selectedLetter.uppercase);
    } 
    // Por defecto
    else {
      selectedLetter = alphabet[index % alphabet.length];
      isAnswerCorrect = selectedLetter.uppercase === currentLetter.uppercase;
    }
    
    // Actualizar el estado de correcto/incorrecto
    console.log("🔄 Actualizando isCorrect:", isAnswerCorrect);
    setIsCorrect(isAnswerCorrect);
    
    // IMPORTANTE: Siempre mostrar detalles después de seleccionar cualquier opción
    console.log("🔍 Mostrando detalles:", true);
    setShowDetails(true);
    
    // Si la respuesta es correcta, incrementar los contadores
    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
      // También aumentar el contador de respuestas correctas consecutivas
      const newConsecutiveCorrectAnswers = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newConsecutiveCorrectAnswers);
      
      // Sistema de recompensas más estratégico y aleatorio
      if (settings.enableRewards) {
        let shouldShowReward = false;
        
        // Máximo de recompensas permitidas (aproximadamente 20-25% del alfabeto)
        const maxRewardsPerSession = Math.max(2, Math.ceil(alphabet.length * 0.2));
        
        // Limitar la cantidad total de recompensas
        if (totalRewardsShown >= maxRewardsPerSession) {
          // Sólo mostrar recompensa en la última letra si no se ha mostrado ahí
          shouldShowReward = currentIndex === alphabet.length - 1 && 
                          !rewardsShownIndices.includes(alphabet.length - 1);
        } 
        else {
          // Evitar recompensas en letras consecutivas
          const lastRewardIndex = rewardsShownIndices.length > 0 ? 
                                rewardsShownIndices[rewardsShownIndices.length - 1] : -1;
                                
          // Mínimo de letras entre recompensas
          const minLettersBetweenRewards = Math.max(3, Math.floor(alphabet.length / 8));
          const lettersSinceLastReward = lastRewardIndex === -1 ? 
                                      currentIndex + 1 : 
                                      Math.abs(currentIndex - lastRewardIndex);
          
          // Solo considerar mostrar recompensa si ha pasado suficiente tiempo
          if (lastRewardIndex === -1 || lettersSinceLastReward > minLettersBetweenRewards) {
            
            // Momentos estratégicos para mostrar recompensas:
            
            // Si estamos en las primeras letras (8% de probabilidad)
            const isEarlyLetter = currentIndex < Math.ceil(alphabet.length * 0.2);
            
            // En la mitad del alfabeto (25% de probabilidad)
            const isMidPointLetter = Math.abs(currentIndex - Math.floor(alphabet.length / 2)) <= 1;
            
            // En las últimas letras (35% de probabilidad)
            const isLateLetter = currentIndex >= Math.floor(alphabet.length * 0.85);
            
            // Racha significativa de respuestas correctas (5+)
            const isSignificantStreak = newConsecutiveCorrectAnswers >= 5;
            
            // Asignar probabilidades basado en los criterios
            if (isSignificantStreak) {
              shouldShowReward = Math.random() < 0.6; // Alta probabilidad por racha
            }
            else if (isLateLetter) {
              shouldShowReward = Math.random() < 0.35; // Probabilidad moderada al final
            }
            else if (isMidPointLetter) {
              shouldShowReward = Math.random() < 0.25; // Probabilidad media a mitad
            }
            else if (isEarlyLetter) {
              shouldShowReward = Math.random() < 0.08; // Baja probabilidad al inicio
            }
            else {
              // Factor sorpresa (3%)
              shouldShowReward = Math.random() < 0.03;
            }
          }
        }
        
        // Si se determinó que debemos mostrar una recompensa
        if (shouldShowReward) {
          // Seleccionar aleatoriamente el tipo de recompensa
          const rewardTypes: ("medals" | "trophies" | "stars")[] = ["medals", "trophies", "stars"];
          const randomRewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
          setRewardType(randomRewardType);
          
          // Registrar la recompensa
          setRewardsShownIndices(prev => [...prev, currentIndex]);
          setTotalRewardsShown(prev => prev + 1);
          
          // Mostrar la recompensa con animación
          setShowReward(true);
          setTimeout(() => setShowReward(false), 2500);
          
          // Reiniciar el contador para variar la frecuencia
          setConsecutiveCorrectAnswers(0);
        }
      }
    } else {
      // Si es incorrecta, reiniciar contador de consecutivas
      setConsecutiveCorrectAnswers(0);
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
    // Usamos selectedLanguage que ya fue definido
    
    // Función para mostrar la respuesta sin esperar selección
    const showQuizAnswer = () => {
      // Marcar la opción correcta
      const correctIndex = quizOptions.findIndex(option => 
        option.uppercase === currentLetter.uppercase);
      
      setSelectedOption(correctIndex);
      setIsCorrect(true);
      setShowDetails(true);
      
      // Registrar para debugging
      console.log("💡 Mostrando respuesta correcta:", correctIndex, currentLetter.uppercase);
    };
    
    return (
      <div className="flex flex-col items-center">
        <div className="text-2xl font-medium mb-4">
          {selectedLanguage === 'spanish'
            ? '¿Qué letra hace este sonido?'
            : 'Which letter makes this sound?'}
        </div>
        <div className="text-6xl mb-6">{currentLetter.image}</div>
        
        <div className="grid grid-cols-2 gap-4">
          {quizOptions.map((option, index) => {
            // Verificar si esta es la opción correcta
            const isCorrectOption = option.uppercase === currentLetter.uppercase;
            
            // Determinar el estilo visual para la opción actual
            let buttonVariant: "default" | "link" | "destructive" | "outline" | "secondary" | "ghost" = "outline"; // Por defecto, todos los botones son outline
            
            if (selectedOption === index) {
              // Si esta opción está seleccionada
              buttonVariant = isCorrectOption ? "default" : "destructive";
            }
            
            return (
              <Button
                key={index}
                size="lg"
                variant={buttonVariant}
                className={`text-4xl h-20 w-20 ${
                  selectedOption !== null && isCorrectOption 
                    ? "ring-2 ring-green-500" 
                    : ""
                }`}
                onClick={() => {
                  console.log("🖱️ Clic en botón:", index, option.uppercase);
                  handleQuizOptionSelect(index);
                }}
                disabled={selectedOption !== null}
              >
                {option.uppercase}
              </Button>
            );
          })}
        </div>
        
        {selectedOption === null && (
          <Button 
            variant="outline"
            onClick={showQuizAnswer}
            className="mt-4"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
          </Button>
        )}
        
        {showDetails && (
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

  // Renderiza el ejercicio de emparejamiento (Elementary)
  const renderMatching = () => {
    // Usamos selectedLanguage que ya fue definido arriba
    
    // Función para mostrar la respuesta directamente
    const showMatchingAnswer = () => {
      // Encontrar el índice de la letra correcta
      const correctIndex = matchingOptions.findIndex(letter => 
        letter.uppercase === currentLetter.uppercase);
      
      setSelectedOption(correctIndex);
      setIsCorrect(true);
      setShowDetails(true);
    };
    
    // Si no hay opciones generadas, las generamos aquí
    if (matchingOptions.length === 0) {
      generateMatchingOptions();
      return <div className="flex justify-center items-center h-40">Cargando...</div>;
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
          {matchingOptions.map((letter, index) => {
            // Verificar si esta es la opción correcta
            const isCorrectOption = letter.uppercase === currentLetter.uppercase;
            
            // Determinar el estilo visual para la opción actual
            let buttonVariant: "default" | "link" | "destructive" | "outline" | "secondary" | "ghost" = "outline";
            
            if (selectedOption === index) {
              // Si esta opción está seleccionada
              buttonVariant = isCorrectOption ? "default" : "destructive";
            }
            
            return (
              <Button
                key={index}
                size="lg"
                variant={buttonVariant}
                className={`text-3xl h-16 w-16 ${
                  selectedOption !== null && isCorrectOption 
                    ? "ring-2 ring-green-500" 
                    : ""
                }`}
                onClick={() => {
                  console.log("🖱️ Clic en botón de matching:", index, letter.uppercase);
                  handleQuizOptionSelect(index);
                }}
                disabled={selectedOption !== null}
              >
                {letter.uppercase}
              </Button>
            );
          })}
        </div>
        
        {selectedOption === null && (
          <Button 
            variant="outline"
            onClick={showMatchingAnswer}
            className="mt-4"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
          </Button>
        )}
        
        {showDetails && (
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
  
  // Renderiza el ejercicio de ordenar letras (Advanced)
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

  const showOrderAnswer = () => {
    // Ordena las letras alfabéticamente
    const sortedLetters = [...lettersToOrder].sort((a, b) => {
      return a.letter.localeCompare(b.letter);
    });
    
    setLettersToOrder(sortedLetters);
    setShowDetails(true);
  };

  const renderOrdering = () => {
    // Usamos selectedLanguage que ya fue definido arriba
    
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
              {selectedLanguage === 'spanish' ? 'Verificar' : 'Check'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={showOrderAnswer}
              disabled={showDetails && isCorrect === true}
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
            </Button>
          </div>
          
          {showDetails && isCorrect && (
            <div className="mt-4 flex flex-col items-center animate-fade-in">
              <p className="text-green-500 font-bold text-lg">
                {selectedLanguage === 'spanish' ? '¡Correcto!' : 'Correct!'}
              </p>
              <p className="text-gray-500">
                {selectedLanguage === 'spanish' ? 'Has ordenado las letras correctamente' : 'You ordered the letters correctly'}
              </p>
            </div>
          )}
          
          <div className="mt-4 flex flex-col items-center">
            <Button
              variant="outline"
              onClick={generateLettersToOrder}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {selectedLanguage === 'spanish' ? 'Nuevo conjunto' : 'New set'}
            </Button>
          </div>
        </div>
      </DndProvider>
    );
  };
  
  // Renderiza el ejercicio de letras adyacentes (Expert)
  const renderAdjacentLetters = () => {
    // Usamos selectedLanguage que ya fue definido arriba
    
    // Obtenemos las letras adyacentes para usarlas en el botón de mostrar respuestas
    const index = alphabet.findIndex(l => l.uppercase === currentLetter.uppercase);
    const prevLetter = index > 0 ? alphabet[index - 1].uppercase : 'Z';
    const nextLetter = index < alphabet.length - 1 ? alphabet[index + 1].uppercase : 'A';
    
    const showAdjacentAnswers = () => {
      setAdjacentLetterInputs({
        before: prevLetter,
        after: nextLetter
      });
      setAdjacentCorrect({
        before: true,
        after: true
      });
      setShowDetails(true);
    };
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-4">
          {selectedLanguage === 'spanish' 
            ? '¿Qué letras van antes y después?' 
            : 'What letters come before and after?'}
        </h2>
        
        <div className="text-8xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          {currentLetter.uppercase}
        </div>
        
        <div className="grid grid-cols-2 gap-6 w-full max-w-md mb-6">
          <div>
            <Label htmlFor="before-letter" className="mb-2 block">
              {selectedLanguage === 'spanish' ? 'Antes' : 'Before'}
            </Label>
            <Input
              id="before-letter"
              value={adjacentLetterInputs.before}
              onChange={(e) => 
                setAdjacentLetterInputs(prev => ({...prev, before: e.target.value.toUpperCase()}))
              }
              className={`text-center text-xl ${adjacentCorrect.before ? "border-green-500" : ""}`}
              maxLength={1}
              placeholder="?"
            />
          </div>
          
          <div>
            <Label htmlFor="after-letter" className="mb-2 block">
              {selectedLanguage === 'spanish' ? 'Después' : 'After'}
            </Label>
            <Input
              id="after-letter"
              value={adjacentLetterInputs.after}
              onChange={(e) => 
                setAdjacentLetterInputs(prev => ({...prev, after: e.target.value.toUpperCase()}))
              }
              className={`text-center text-xl ${adjacentCorrect.after ? "border-green-500" : ""}`}
              maxLength={1}
              placeholder="?"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => {
              const userPrevLetter = adjacentLetterInputs.before.toUpperCase();
              const userNextLetter = adjacentLetterInputs.after.toUpperCase();
              
              const isPrevCorrect = userPrevLetter === prevLetter;
              const isNextCorrect = userNextLetter === nextLetter;
              
              setAdjacentCorrect({
                before: isPrevCorrect,
                after: isNextCorrect
              });
              
              setIsCorrect(isPrevCorrect && isNextCorrect);
              setShowDetails(true);
              
              if (isPrevCorrect && isNextCorrect) {
                setCorrectAnswers(prev => prev + 1);
                if (settings.enableSoundEffects) {
                  playSound("Correct! You know the alphabet well!");
                }
              } else {
                if (settings.enableSoundEffects) {
                  let message = "Not quite right. ";
                  if (!isPrevCorrect) message += `The letter before ${currentLetter.uppercase} is ${prevLetter}. `;
                  if (!isNextCorrect) message += `The letter after ${currentLetter.uppercase} is ${nextLetter}. `;
                  playSound(message);
                }
              }
            }}
            disabled={showDetails && isCorrect === true}
          >
            <Check className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Verificar' : 'Check'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={showAdjacentAnswers}
            disabled={showDetails && isCorrect === true}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
          </Button>
        </div>
        
        {showDetails && (
          <div className="mt-6 flex flex-col items-center animate-fade-in">
            {isCorrect ? (
              <div className="text-green-500 font-bold">
                {selectedLanguage === 'spanish' ? '¡Correcto!' : 'Correct!'}
              </div>
            ) : (
              <div className="text-red-500 font-bold">
                {selectedLanguage === 'spanish' ? 'Incorrecto' : 'Incorrect'}
              </div>
            )}
            
            <div className="mt-2 text-lg">
              {selectedLanguage === 'spanish' ? 'El orden correcto es:' : 'The correct order is:'}
            </div>
            
            <div className="flex items-center justify-center mt-2 text-3xl font-bold">
              <span className={adjacentCorrect.before ? "text-green-500" : "text-red-500"}>
                {prevLetter}
              </span>
              <span className="mx-4">→</span>
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                {currentLetter.uppercase}
              </span>
              <span className="mx-4">→</span>
              <span className={adjacentCorrect.after ? "text-green-500" : "text-red-500"}>
                {nextLetter}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExerciseContent = () => {
    if (showReward) {
      // Mostrar la recompensa
      let rewardContent;
      
      if (rewardType === 'stars') {
        rewardContent = (
          <div className="text-9xl animate-bounce">
            ⭐
          </div>
        );
      } else if (rewardType === 'medals') {
        rewardContent = (
          <div className="text-9xl animate-bounce">
            🥇
          </div>
        );
      } else if (rewardType === 'trophies') {
        rewardContent = (
          <div className="text-9xl animate-bounce">
            🏆
          </div>
        );
      }
      
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-2xl font-bold mb-6">
            {selectedLanguage === 'spanish' ? '¡Excelente trabajo!' : 'Great job!'}
          </div>
          {rewardContent}
          <div className="text-xl font-medium mt-6">
            {selectedLanguage === 'spanish'
              ? '¡Has ganado una recompensa!'
              : 'You earned a reward!'}
          </div>
        </div>
      );
    }

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
        return <div>Unsupported exercise type</div>;
    }
  };

  const getDifficultyText = () => {
    switch(settings.difficulty) {
      case 'beginner':
        return selectedLanguage === 'spanish' ? 'principiante' : 'beginner';
      case 'elementary':
        return selectedLanguage === 'spanish' ? 'elemental' : 'elementary';
      case 'intermediate':
        return selectedLanguage === 'spanish' ? 'intermedio' : 'intermediate';
      case 'advanced':
        return selectedLanguage === 'spanish' ? 'avanzado' : 'advanced';
      case 'expert':
        return selectedLanguage === 'spanish' ? 'experto' : 'expert';
      default:
        return settings.difficulty;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {selectedLanguage === 'spanish' ? 'Aprendizaje del Alfabeto' : 'Alphabet Learning'}
        </h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {selectedLanguage === 'spanish' ? 'Nivel: ' : 'Level: '}
            {getDifficultyText()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="flex items-center"
          >
            <Cog className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card className="flex-1 mb-4">
        <CardContent className="flex flex-col items-center justify-center h-full pt-6">
          {renderExerciseContent()}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {selectedLanguage === 'spanish' ? 'Anterior' : 'Previous'}
        </Button>
        <Button onClick={handleNext} className="flex items-center">
          {selectedLanguage === 'spanish' ? 'Siguiente' : 'Next'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}