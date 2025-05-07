import { useState, useEffect, useRef } from 'react';
import { ModuleSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';
import { Button } from '@/components/ui/button';
import { 
  Volume2, 
  ArrowLeft, 
  ArrowRight, 
  Cog, 
  RefreshCw, 
  Check, 
  EyeIcon, 
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { formatTime } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

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

// Interface para opciones de palabras alternativas para cada letra
interface AlternativeWord {
  word: string;
  image: string;
}

// Datos de ejercicio para el modo de selección de imágenes
interface LetterToImageExercise {
  letter: Letter;
  options: AlternativeWord[];
  correctIndex: number;
}

// Datos de ejercicio para el modo de selección de letras
interface ImageToLetterExercise {
  image: AlternativeWord;
  options: Letter[];
  correctIndex: number;
}

// Este componente implementa el módulo Alphabet Journey pero con una arquitectura interna diferente
export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Referencias para audio y recompensas
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rewardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados de la aplicación
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exerciseMode, setExerciseMode] = useState<'letter_to_image' | 'image_to_letter'>('letter_to_image');
  const [currentExercise, setCurrentExercise] = useState<LetterToImageExercise | ImageToLetterExercise | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [rewardType, setRewardType] = useState<'stars' | 'medals' | 'trophies'>('stars');
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [rewardsShownIndices, setRewardsShownIndices] = useState<number[]>([]);
  const [totalRewardsShown, setTotalRewardsShown] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  
  // Contextos
  const { saveExerciseResult } = useProgress();
  const { user } = useAuth();
  const selectedLanguage = settings.language || 'spanish';
  
  // Símbolos de recompensa según tipo
  const rewardSymbols = {
    stars: ['⭐', '🌟', '✨'],
    medals: ['🥉', '🥈', '🥇'],
    trophies: ['🏆', '🏅', '🎖️']
  };
  
  // Definimos alfabetos en ambos idiomas con emojis simplificados para mayor compatibilidad
  const alphabetSpanish = [
    { uppercase: 'A', lowercase: 'a', word: 'Avión', image: '✈️' },
    { uppercase: 'B', lowercase: 'b', word: 'Barco', image: '🚢' },
    { uppercase: 'C', lowercase: 'c', word: 'Casa', image: '🏠' },
    { uppercase: 'D', lowercase: 'd', word: 'Dado', image: '🎲' },
    { uppercase: 'E', lowercase: 'e', word: 'Elefante', image: '🐘' },
    { uppercase: 'F', lowercase: 'f', word: 'Foca', image: '🦭' },
    { uppercase: 'G', lowercase: 'g', word: 'Gato', image: '🐱' },
    { uppercase: 'H', lowercase: 'h', word: 'Helado', image: '🍦' },
    { uppercase: 'I', lowercase: 'i', word: 'Iglesia', image: '⛪' },
    { uppercase: 'J', lowercase: 'j', word: 'Jirafa', image: '🦒' },
    { uppercase: 'K', lowercase: 'k', word: 'Kiwi', image: '🥝' },
    { uppercase: 'L', lowercase: 'l', word: 'León', image: '🦁' },
    { uppercase: 'M', lowercase: 'm', word: 'Manzana', image: '🍎' },
    { uppercase: 'N', lowercase: 'n', word: 'Nube', image: '☁️' },
    { uppercase: 'Ñ', lowercase: 'ñ', word: 'Ñu', image: '🐂' },
    { uppercase: 'O', lowercase: 'o', word: 'Oso', image: '🐻' },
    { uppercase: 'P', lowercase: 'p', word: 'Pez', image: '🐟' },
    { uppercase: 'Q', lowercase: 'q', word: 'Queso', image: '🧀' },
    { uppercase: 'R', lowercase: 'r', word: 'Ratón', image: '🐭' },
    { uppercase: 'S', lowercase: 's', word: 'Sol', image: '☀️' },
    { uppercase: 'T', lowercase: 't', word: 'Tortuga', image: '🐢' },
    { uppercase: 'U', lowercase: 'u', word: 'Uva', image: '🍇' },
    { uppercase: 'V', lowercase: 'v', word: 'Vaca', image: '🐄' },
    { uppercase: 'W', lowercase: 'w', word: 'Wifi', image: '📶' },
    { uppercase: 'X', lowercase: 'x', word: 'Xilófono', image: '🎹' },
    { uppercase: 'Y', lowercase: 'y', word: 'Yogur', image: '🥛' },
    { uppercase: 'Z', lowercase: 'z', word: 'Zapato', image: '👞' }
  ];
  
  // Alfabeto en inglés (palabras adaptadas al idioma)
  const alphabetEnglish = [
    { uppercase: 'A', lowercase: 'a', word: 'Airplane', image: '✈️' },
    { uppercase: 'B', lowercase: 'b', word: 'Ball', image: '⚽' },
    { uppercase: 'C', lowercase: 'c', word: 'Cat', image: '🐱' },
    { uppercase: 'D', lowercase: 'd', word: 'Dog', image: '🐶' },
    { uppercase: 'E', lowercase: 'e', word: 'Elephant', image: '🐘' },
    { uppercase: 'F', lowercase: 'f', word: 'Fish', image: '🐟' },
    { uppercase: 'G', lowercase: 'g', word: 'Giraffe', image: '🦒' },
    { uppercase: 'H', lowercase: 'h', word: 'House', image: '🏠' },
    { uppercase: 'I', lowercase: 'i', word: 'Ice cream', image: '🍦' },
    { uppercase: 'J', lowercase: 'j', word: 'Juice', image: '🧃' },
    { uppercase: 'K', lowercase: 'k', word: 'Kite', image: '🪁' },
    { uppercase: 'L', lowercase: 'l', word: 'Lion', image: '🦁' },
    { uppercase: 'M', lowercase: 'm', word: 'Moon', image: '🌙' },
    { uppercase: 'N', lowercase: 'n', word: 'Nose', image: '👃' },
    { uppercase: 'O', lowercase: 'o', word: 'Orange', image: '🍊' },
    { uppercase: 'P', lowercase: 'p', word: 'Pizza', image: '🍕' },
    { uppercase: 'Q', lowercase: 'q', word: 'Queen', image: '👑' },
    { uppercase: 'R', lowercase: 'r', word: 'Rainbow', image: '🌈' },
    { uppercase: 'S', lowercase: 's', word: 'Sun', image: '☀️' },
    { uppercase: 'T', lowercase: 't', word: 'Tree', image: '🌳' },
    { uppercase: 'U', lowercase: 'u', word: 'Umbrella', image: '☂️' },
    { uppercase: 'V', lowercase: 'v', word: 'Volcano', image: '🌋' },
    { uppercase: 'W', lowercase: 'w', word: 'Watermelon', image: '🍉' },
    { uppercase: 'X', lowercase: 'x', word: 'Xylophone', image: '🎹' },
    { uppercase: 'Y', lowercase: 'y', word: 'Yo-yo', image: '🪀' },
    { uppercase: 'Z', lowercase: 'z', word: 'Zebra', image: '🦓' }
  ];
  
  // Alternativas en español
  const alternativesSpanish: Record<string, AlternativeWord[]> = {
    'A': [
      { word: 'Abeja', image: '🐝' },
      { word: 'Arcoiris', image: '🌈' },
      { word: 'Anillo', image: '💍' },
      { word: 'Árbol', image: '🌳' }
    ],
    'B': [
      { word: 'Balón', image: '⚽' },
      { word: 'Banana', image: '🍌' },
      { word: 'Bicicleta', image: '🚲' },
      { word: 'Ballena', image: '🐋' }
    ],
    'C': [
      { word: 'Caballo', image: '🐴' },
      { word: 'Corazón', image: '❤️' },
      { word: 'Coche', image: '🚗' },
      { word: 'Cámara', image: '📷' }
    ],
    'G': [
      { word: 'Galleta', image: '🍪' },
      { word: 'Guitarra', image: '🎸' },
      { word: 'Globo', image: '🎈' },
      { word: 'Gorra', image: '🧢' }
    ]
    // El resto del alfabeto seguiría con el mismo patrón
  };
  
  // Alternativas en inglés
  const alternativesEnglish: Record<string, AlternativeWord[]> = {
    'A': [
      { word: 'Apple', image: '🍎' },
      { word: 'Ant', image: '🐜' },
      { word: 'Arrow', image: '➡️' },
      { word: 'Astronaut', image: '👨‍🚀' }
    ],
    'B': [
      { word: 'Ball', image: '⚽' },
      { word: 'Banana', image: '🍌' },
      { word: 'Bicycle', image: '🚲' },
      { word: 'Bear', image: '🐻' }
    ],
    'C': [
      { word: 'Car', image: '🚗' },
      { word: 'Cookie', image: '🍪' },
      { word: 'Cow', image: '🐄' },
      { word: 'Crown', image: '👑' }
    ],
    'G': [
      { word: 'Guitar', image: '🎸' },
      { word: 'Gift', image: '🎁' },
      { word: 'Game', image: '🎮' },
      { word: 'Globe', image: '🌍' }
    ]
    // El resto del alfabeto seguiría con el mismo patrón
  };
  
  // Efecto para inicializar el ejercicio
  useEffect(() => {
    generateExercise();
    startTimer();
    
    // Limpieza
    return () => {
      if (timerId) clearInterval(timerId);
      if (rewardTimeoutRef.current) clearTimeout(rewardTimeoutRef.current);
    };
  }, [currentIndex, exerciseMode, settings.difficulty]);
  
  // Iniciar temporizador
  const startTimer = () => {
    if (timerId) clearInterval(timerId);
    
    const id = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    setTimerId(id);
  };
  
  // Función para reproducir audio (implementación diferente)
  const playLetterSound = (letter: string) => {
    // En la implementación real, esto usaría la API de Web Speech
    console.log(`[ALPHABET2] Reproduciendo sonido para la letra: ${letter}`);
    
    // Simulación de síntesis de voz (esto sería diferente en la implementación real)
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.lang = selectedLanguage === 'spanish' ? 'es-ES' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };
  
  // Función para obtener el alfabeto según el idioma seleccionado
  const getAlphabet = () => {
    return selectedLanguage === 'spanish' ? alphabetSpanish : alphabetEnglish;
  };
  
  // Función para obtener las alternativas según el idioma seleccionado
  const getAlternatives = () => {
    return selectedLanguage === 'spanish' ? alternativesSpanish : alternativesEnglish;
  };
  
  // Función para obtener un subconjunto del alfabeto según la dificultad
  const getAlphabetSubset = () => {
    const alphabet = getAlphabet();
    
    switch (settings.difficulty) {
      case 'beginner':
        return alphabet.slice(0, 5); // A-E
      case 'elementary':
        return alphabet.slice(0, 10); // A-J
      case 'intermediate':
        return alphabet.slice(0, 15); // A-Ñ (o A-O en inglés)
      case 'advanced':
        return alphabet.slice(0, 21); // A-U
      case 'expert':
        // En modo experto, después de 10 respuestas correctas, mezclamos todo el alfabeto
        if (correctAnswers >= 10) {
          // Esta implementación es diferente del módulo original
          const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
          return shuffled;
        }
        return alphabet; // Alfabeto completo
      default:
        return alphabet.slice(0, 5);
    }
  };
  
  // Genera un nuevo ejercicio
  const generateExercise = () => {
    const alphabetSubset = getAlphabetSubset();
    const alternatives = getAlternatives();
    
    // Asegurarse de que no nos pasamos del límite del array
    const safeIndex = currentIndex % alphabetSubset.length;
    const currentLetterItem = alphabetSubset[safeIndex];
    
    // Alternar entre los dos modos de ejercicio
    const newExerciseMode = Math.random() > 0.5 ? 'letter_to_image' : 'image_to_letter';
    setExerciseMode(newExerciseMode);
    
    // Resetear estados
    setSelectedOptionIndex(null);
    setShowDetails(false);
    setIsCorrect(null);
    setAttemptCount(0);
    
    if (newExerciseMode === 'letter_to_image') {
      // Generar ejercicio de letra a imagen (similar al original pero implementado diferente)
      const letterAlternatives = alternatives[currentLetterItem.uppercase] || [];
      const correctOption = { word: currentLetterItem.word, image: currentLetterItem.image };
      
      // Generar opciones incorrectas
      const incorrectOptions: AlternativeWord[] = [];
      while (incorrectOptions.length < 3) {
        const randIndex = Math.floor(Math.random() * alphabetSubset.length);
        const randLetter = alphabetSubset[randIndex];
        
        // Evitar duplicados y la letra correcta
        if (randLetter.uppercase !== currentLetterItem.uppercase && 
            !incorrectOptions.some(opt => opt.image === randLetter.image)) {
          incorrectOptions.push({
            word: randLetter.word,
            image: randLetter.image
          });
        }
      }
      
      // Mezclar opciones
      const allOptions = [correctOption, ...incorrectOptions].sort(() => Math.random() - 0.5);
      const correctIndex = allOptions.findIndex(opt => opt.word === correctOption.word);
      
      setCurrentExercise({
        letter: currentLetterItem,
        options: allOptions,
        correctIndex
      } as LetterToImageExercise);
      
    } else {
      // Modo imagen a letra (similar al original pero implementado diferente)
      const correctOption = { 
        word: currentLetterItem.word, 
        image: currentLetterItem.image 
      };
      
      // Obtener 3 letras incorrectas
      const incorrectLetters: Letter[] = [];
      while (incorrectLetters.length < 3) {
        const randIndex = Math.floor(Math.random() * alphabetSubset.length);
        const randLetter = alphabetSubset[randIndex];
        
        // Evitar duplicados
        if (randLetter.uppercase !== currentLetterItem.uppercase && 
            !incorrectLetters.some(l => l.uppercase === randLetter.uppercase)) {
          incorrectLetters.push(randLetter);
        }
      }
      
      // Mezclar opciones
      const allOptions = [currentLetterItem, ...incorrectLetters].sort(() => Math.random() - 0.5);
      const correctIndex = allOptions.findIndex(l => l.uppercase === currentLetterItem.uppercase);
      
      setCurrentExercise({
        image: correctOption,
        options: allOptions,
        correctIndex
      } as ImageToLetterExercise);
    }
  };
  
  // Manejar navegación a ejercicio anterior
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    } else {
      // Volver al final si estamos al principio
      const alphabetSubset = getAlphabetSubset();
      setCurrentIndex(alphabetSubset.length - 1);
    }
  };
  
  // Manejar navegación a siguiente ejercicio
  const handleNext = () => {
    if (showReward) {
      setShowReward(false);
    }
    
    const alphabetSubset = getAlphabetSubset();
    if (currentIndex < alphabetSubset.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else {
      // Volver al principio si estamos al final
      setCurrentIndex(0);
    }
  };
  
  // Verificar respuesta
  const checkAnswer = (selectedIndex: number) => {
    // Incrementar contador de intentos
    setAttemptCount(prev => prev + 1);
    setSelectedOptionIndex(selectedIndex);
    
    // Verificar si alcanzamos el máximo de intentos
    if (attemptCount >= settings.maxAttempts - 1) {
      setShowDetails(true);
    }
    
    // Verificar si la respuesta es correcta
    let isAnswerCorrect = false;
    
    if (exerciseMode === 'letter_to_image' && 'letter' in currentExercise!) {
      isAnswerCorrect = selectedIndex === (currentExercise as LetterToImageExercise).correctIndex;
    } else if (exerciseMode === 'image_to_letter' && 'image' in currentExercise!) {
      isAnswerCorrect = selectedIndex === (currentExercise as ImageToLetterExercise).correctIndex;
    }
    
    // Actualizar estado de correcto/incorrecto
    setIsCorrect(isAnswerCorrect);
    
    // Mostrar detalles si la respuesta es correcta (pero no si es incorrecta)
    if (isAnswerCorrect) {
      setShowDetails(true);
      setCorrectAnswers(prev => prev + 1);
      setConsecutiveCorrectAnswers(prev => prev + 1);
      
      // Sistema de recompensas (implementado diferente al original)
      if (settings.enableRewards) {
        const currentAlphabet = getAlphabet();
        const maxRewardsPerSession = Math.max(2, Math.ceil(currentAlphabet.length * 0.2));
        
        if (totalRewardsShown < maxRewardsPerSession) {
          // Mostrar recompensa de manera aleatoria pero estratégica
          const showRewardNow = Math.random() < 0.3;
          
          if (showRewardNow) {
            setShowReward(true);
            setRewardType(settings.rewardType || 'stars');
            setRewardsShownIndices([...rewardsShownIndices, currentIndex]);
            setTotalRewardsShown(prev => prev + 1);
            
            // Ocultar recompensa después de un tiempo
            rewardTimeoutRef.current = setTimeout(() => {
              setShowReward(false);
            }, 2000);
          }
        }
      }
    } else {
      setIncorrectAnswers(prev => prev + 1);
      setConsecutiveCorrectAnswers(0);
    }
  };
  
  // Mostrar respuesta (botón de ayuda)
  const showAnswer = () => {
    setShowDetails(true);
    setIncorrectAnswers(prev => prev + 1);
    setConsecutiveCorrectAnswers(0);
  };
  
  // Función para obtener texto de dificultad
  const getDifficultyText = () => {
    switch (settings.difficulty) {
      case 'beginner':
        return selectedLanguage === 'spanish' ? 'Principiante' : 'Beginner';
      case 'elementary':
        return selectedLanguage === 'spanish' ? 'Elemental' : 'Elementary';
      case 'intermediate':
        return selectedLanguage === 'spanish' ? 'Intermedio' : 'Intermediate';
      case 'advanced':
        return selectedLanguage === 'spanish' ? 'Avanzado' : 'Advanced';
      case 'expert':
        return selectedLanguage === 'spanish' ? 'Experto' : 'Expert';
      default:
        return settings.difficulty;
    }
  };
  
  // Renderizar contenido del ejercicio de letra a imagen
  const renderLetterToImageExercise = () => {
    if (!currentExercise || !('letter' in currentExercise)) return null;
    
    const exercise = currentExercise as LetterToImageExercise;
    const { letter, options, correctIndex } = exercise;
    
    return (
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center mb-4">
            <div 
              className="text-6xl font-bold mr-4 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-lg p-4 w-20 h-20 flex items-center justify-center"
            >
              {letter.uppercase}
            </div>
            <div 
              className="text-6xl font-medium bg-gradient-to-r from-indigo-500 to-purple-400 text-white rounded-lg p-4 w-20 h-20 flex items-center justify-center"
            >
              {letter.lowercase}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2"
              onClick={() => playLetterSound(letter.uppercase)}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
          <h3 className="text-lg font-medium mb-2">
            {selectedLanguage === 'spanish' ? 'Selecciona la imagen correcta:' : 'Select the correct image:'}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((option, index) => (
            <div key={index} className="relative">
              <button
                className={`w-full h-32 text-5xl border-2 rounded-lg flex items-center justify-center ${
                  selectedOptionIndex === index
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
                onClick={() => checkAnswer(index)}
                disabled={selectedOptionIndex !== null}
              >
                {option.image}
              </button>
              {showDetails && index === correctIndex && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {showDetails && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <h4 className="font-bold mr-2">{letter.uppercase}{letter.lowercase}:</h4>
              <span>{letter.word}</span>
            </div>
            <div className="flex items-center">
              <span className="text-3xl mr-2">{letter.image}</span>
              <span className="text-sm text-gray-500">
                ({selectedLanguage === 'spanish' ? 'Ejemplo: ' : 'Example: '}{letter.word})
              </span>
            </div>
          </div>
        )}
        
        {!showDetails && settings.showAnswerWithExplanation && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={showAnswer}
              className="flex items-center"
              disabled={selectedOptionIndex !== null}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar contenido del ejercicio de imagen a letra
  const renderImageToLetterExercise = () => {
    if (!currentExercise || !('image' in currentExercise)) return null;
    
    const exercise = currentExercise as ImageToLetterExercise;
    const { image, options, correctIndex } = exercise;
    
    return (
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="text-8xl mb-4">
            {image.image}
          </div>
          <h3 className="text-lg font-medium mb-2">
            {selectedLanguage === 'spanish' ? '¿Con qué letra comienza?' : 'What letter does it start with?'}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((option, index) => (
            <div key={index} className="relative">
              <button
                className={`w-full h-24 text-4xl font-bold border-2 rounded-lg flex items-center justify-center ${
                  selectedOptionIndex === index
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
                onClick={() => checkAnswer(index)}
                disabled={selectedOptionIndex !== null}
              >
                {option.uppercase}
              </button>
              {showDetails && index === correctIndex && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {showDetails && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <h4 className="font-bold mr-2">{options[correctIndex].uppercase}{options[correctIndex].lowercase}:</h4>
              <span>{image.word}</span>
            </div>
            <div className="flex items-center">
              <span className="text-3xl mr-2">{image.image}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={() => playLetterSound(options[correctIndex].uppercase)}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {!showDetails && settings.showAnswerWithExplanation && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={showAnswer}
              className="flex items-center"
              disabled={selectedOptionIndex !== null}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {selectedLanguage === 'spanish' ? 'Mostrar Respuesta' : 'Show Answer'}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar contenido del ejercicio según el modo actual
  const renderExerciseContent = () => {
    if (showReward) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-9xl mb-6">
            {rewardSymbols[rewardType][Math.floor(Math.random() * rewardSymbols[rewardType].length)]}
          </div>
          <h3 className="text-2xl font-bold text-center mb-2">
            {selectedLanguage === 'spanish' ? '¡Muy bien!' : 'Great job!'}
          </h3>
          <p className="text-center">
            {selectedLanguage === 'spanish' 
              ? '¡Sigue practicando para ganar más premios!' 
              : 'Keep practicing to earn more rewards!'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <div className="flex items-center justify-between w-full mb-6">
          <div>
            <Progress value={(correctAnswers / Math.max(1, correctAnswers + incorrectAnswers)) * 100} className="w-32 h-2" />
            <div className="flex text-xs mt-1 justify-between">
              <span>{correctAnswers} ✓</span>
              <span>{incorrectAnswers} ✗</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        {exerciseMode === 'letter_to_image' ? renderLetterToImageExercise() : renderImageToLetterExercise()}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {selectedLanguage === 'spanish' ? 'Alphabet Journey' : 'Alphabet Journey'}
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