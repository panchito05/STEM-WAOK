import { useState, useEffect, useRef } from 'react';
import { ModuleSettings } from '@/context/SettingsContext';
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
import { useSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';
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
  // Referencias para audio, recompensas y seguimiento de dificultad
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rewardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevDifficultyRef = useRef<string>(settings.difficulty);
  
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
  const { user } = useAuth();
  const { globalSettings } = useSettings();
  const selectedLanguage = globalSettings.language === 'english' ? 'english' : 'spanish';
  
  // URLs de imágenes de recompensa según tipo
  const rewardSymbols = {
    stars: [
      'https://em-content.zobj.net/thumbs/120/apple/354/star_2b50.png',
      'https://em-content.zobj.net/thumbs/120/apple/354/glowing-star_1f31f.png',
      'https://em-content.zobj.net/thumbs/120/apple/354/sparkles_2728.png'
    ],
    medals: [
      'https://em-content.zobj.net/thumbs/120/apple/354/3rd-place-medal_1f949.png',
      'https://em-content.zobj.net/thumbs/120/apple/354/2nd-place-medal_1f948.png',
      'https://em-content.zobj.net/thumbs/120/apple/354/1st-place-medal_1f947.png'
    ],
    trophies: [
      'https://em-content.zobj.net/thumbs/120/apple/354/trophy_1f3c6.png',
      'https://em-content.zobj.net/thumbs/120/apple/354/sports-medal_1f3c5.png',
      'https://em-content.zobj.net/thumbs/120/apple/354/military-medal_1f396-fe0f.png'
    ]
  };
  
  // Definimos alfabetos en ambos idiomas con URL de imágenes para garantizar compatibilidad
  const alphabetSpanish = [
    { uppercase: 'A', lowercase: 'a', word: 'Avión', image: 'https://em-content.zobj.net/thumbs/120/apple/354/airplane_2708-fe0f.png' },
    { uppercase: 'B', lowercase: 'b', word: 'Barco', image: 'https://em-content.zobj.net/thumbs/120/apple/354/ship_1f6a2.png' },
    { uppercase: 'C', lowercase: 'c', word: 'Casa', image: 'https://em-content.zobj.net/thumbs/120/apple/354/house_1f3e0.png' },
    { uppercase: 'D', lowercase: 'd', word: 'Dado', image: 'https://em-content.zobj.net/thumbs/120/apple/354/game-die_1f3b2.png' },
    { uppercase: 'E', lowercase: 'e', word: 'Elefante', image: 'https://em-content.zobj.net/thumbs/120/apple/354/elephant_1f418.png' },
    { uppercase: 'F', lowercase: 'f', word: 'Foca', image: 'https://em-content.zobj.net/thumbs/120/apple/354/seal_1f9ad.png' },
    { uppercase: 'G', lowercase: 'g', word: 'Gato', image: 'https://em-content.zobj.net/thumbs/120/apple/354/cat_1f408.png' },
    { uppercase: 'H', lowercase: 'h', word: 'Helado', image: 'https://em-content.zobj.net/thumbs/120/apple/354/soft-ice-cream_1f366.png' },
    { uppercase: 'I', lowercase: 'i', word: 'Iglesia', image: 'https://em-content.zobj.net/thumbs/120/apple/354/church_26ea.png' },
    { uppercase: 'J', lowercase: 'j', word: 'Jirafa', image: 'https://em-content.zobj.net/thumbs/120/apple/354/giraffe_1f992.png' },
    { uppercase: 'K', lowercase: 'k', word: 'Kiwi', image: 'https://em-content.zobj.net/thumbs/120/apple/354/kiwi-fruit_1f95d.png' },
    { uppercase: 'L', lowercase: 'l', word: 'León', image: 'https://em-content.zobj.net/thumbs/120/apple/354/lion_1f981.png' },
    { uppercase: 'M', lowercase: 'm', word: 'Manzana', image: 'https://em-content.zobj.net/thumbs/120/apple/354/red-apple_1f34e.png' },
    { uppercase: 'N', lowercase: 'n', word: 'Nube', image: 'https://em-content.zobj.net/thumbs/120/apple/354/cloud_2601-fe0f.png' },
    { uppercase: 'Ñ', lowercase: 'ñ', word: 'Ñu', image: 'https://em-content.zobj.net/thumbs/120/apple/354/ox_1f402.png' },
    { uppercase: 'O', lowercase: 'o', word: 'Oso', image: 'https://em-content.zobj.net/thumbs/120/apple/354/bear_1f43b.png' },
    { uppercase: 'P', lowercase: 'p', word: 'Pez', image: 'https://em-content.zobj.net/thumbs/120/apple/354/fish_1f41f.png' },
    { uppercase: 'Q', lowercase: 'q', word: 'Queso', image: 'https://em-content.zobj.net/thumbs/120/apple/354/cheese-wedge_1f9c0.png' },
    { uppercase: 'R', lowercase: 'r', word: 'Ratón', image: 'https://em-content.zobj.net/thumbs/120/apple/354/mouse_1f42d.png' },
    { uppercase: 'S', lowercase: 's', word: 'Sol', image: 'https://em-content.zobj.net/thumbs/120/apple/354/sun_2600-fe0f.png' },
    { uppercase: 'T', lowercase: 't', word: 'Tortuga', image: 'https://em-content.zobj.net/thumbs/120/apple/354/turtle_1f422.png' },
    { uppercase: 'U', lowercase: 'u', word: 'Uva', image: 'https://em-content.zobj.net/thumbs/120/apple/354/grapes_1f347.png' },
    { uppercase: 'V', lowercase: 'v', word: 'Vaca', image: 'https://em-content.zobj.net/thumbs/120/apple/354/cow_1f404.png' },
    { uppercase: 'W', lowercase: 'w', word: 'Wifi', image: 'https://em-content.zobj.net/thumbs/120/apple/354/antenna-bars_1f4f6.png' },
    { uppercase: 'X', lowercase: 'x', word: 'Xilófono', image: 'https://em-content.zobj.net/thumbs/120/apple/354/musical-keyboard_1f3b9.png' },
    { uppercase: 'Y', lowercase: 'y', word: 'Yogur', image: 'https://em-content.zobj.net/thumbs/120/apple/354/glass-of-milk_1f95b.png' },
    { uppercase: 'Z', lowercase: 'z', word: 'Zapato', image: 'https://em-content.zobj.net/thumbs/120/apple/354/mans-shoe_1f45e.png' }
  ];
  
  // Alfabeto en inglés (palabras adaptadas al idioma) con URLs seguras
  const alphabetEnglish = [
    { uppercase: 'A', lowercase: 'a', word: 'Airplane', image: 'https://em-content.zobj.net/thumbs/120/apple/354/small-airplane_1f6e9-fe0f.png' },
    { uppercase: 'B', lowercase: 'b', word: 'Ball', image: 'https://em-content.zobj.net/thumbs/120/apple/354/soccer-ball_26bd.png' },
    { uppercase: 'C', lowercase: 'c', word: 'Cat', image: 'https://em-content.zobj.net/thumbs/120/apple/354/cat_1f408.png' },
    { uppercase: 'D', lowercase: 'd', word: 'Dog', image: 'https://em-content.zobj.net/thumbs/120/apple/354/dog_1f415.png' },
    { uppercase: 'E', lowercase: 'e', word: 'Elephant', image: 'https://em-content.zobj.net/thumbs/120/apple/354/elephant_1f418.png' },
    { uppercase: 'F', lowercase: 'f', word: 'Fish', image: 'https://em-content.zobj.net/thumbs/120/apple/354/fish_1f41f.png' },
    { uppercase: 'G', lowercase: 'g', word: 'Giraffe', image: 'https://em-content.zobj.net/thumbs/120/apple/354/giraffe_1f992.png' },
    { uppercase: 'H', lowercase: 'h', word: 'House', image: 'https://em-content.zobj.net/thumbs/120/apple/354/house_1f3e0.png' },
    { uppercase: 'I', lowercase: 'i', word: 'Ice cream', image: 'https://em-content.zobj.net/thumbs/120/apple/354/ice-cream_1f368.png' },
    { uppercase: 'J', lowercase: 'j', word: 'Jelly', image: 'https://em-content.zobj.net/thumbs/120/apple/354/custard_1f36e.png' },
    { uppercase: 'K', lowercase: 'k', word: 'Kite', image: 'https://em-content.zobj.net/thumbs/120/apple/354/kite_1fa81.png' },
    { uppercase: 'L', lowercase: 'l', word: 'Lion', image: 'https://em-content.zobj.net/thumbs/120/apple/354/lion_1f981.png' },
    { uppercase: 'M', lowercase: 'm', word: 'Moon', image: 'https://em-content.zobj.net/thumbs/120/apple/354/crescent-moon_1f319.png' },
    { uppercase: 'N', lowercase: 'n', word: 'Nose', image: 'https://em-content.zobj.net/thumbs/120/apple/354/nose_1f443.png' },
    { uppercase: 'O', lowercase: 'o', word: 'Orange', image: 'https://em-content.zobj.net/thumbs/120/apple/354/tangerine_1f34a.png' },
    { uppercase: 'P', lowercase: 'p', word: 'Pizza', image: 'https://em-content.zobj.net/thumbs/120/apple/354/pizza_1f355.png' },
    { uppercase: 'Q', lowercase: 'q', word: 'Queen', image: 'https://em-content.zobj.net/thumbs/120/apple/354/crown_1f451.png' },
    { uppercase: 'R', lowercase: 'r', word: 'Rainbow', image: 'https://em-content.zobj.net/thumbs/120/apple/354/rainbow_1f308.png' },
    { uppercase: 'S', lowercase: 's', word: 'Sun', image: 'https://em-content.zobj.net/thumbs/120/apple/354/sun_2600-fe0f.png' },
    { uppercase: 'T', lowercase: 't', word: 'Tree', image: 'https://em-content.zobj.net/thumbs/120/apple/354/deciduous-tree_1f333.png' },
    { uppercase: 'U', lowercase: 'u', word: 'Umbrella', image: 'https://em-content.zobj.net/thumbs/120/apple/354/umbrella_2602-fe0f.png' },
    { uppercase: 'V', lowercase: 'v', word: 'Volcano', image: 'https://em-content.zobj.net/thumbs/120/apple/354/volcano_1f30b.png' },
    { uppercase: 'W', lowercase: 'w', word: 'Watermelon', image: 'https://em-content.zobj.net/thumbs/120/apple/354/watermelon_1f349.png' },
    { uppercase: 'X', lowercase: 'x', word: 'Xylophone', image: 'https://em-content.zobj.net/thumbs/120/apple/354/musical-keyboard_1f3b9.png' },
    { uppercase: 'Y', lowercase: 'y', word: 'Yarn', image: 'https://em-content.zobj.net/thumbs/120/apple/354/yarn_1f9f6.png' },
    { uppercase: 'Z', lowercase: 'z', word: 'Zebra', image: 'https://em-content.zobj.net/thumbs/120/apple/354/zebra_1f993.png' }
  ];
  
  // Alternativas en español con URLs de imágenes para garantizar compatibilidad
  const alternativesSpanish: Record<string, AlternativeWord[]> = {
    'A': [
      { word: 'Abeja', image: 'https://em-content.zobj.net/thumbs/120/apple/354/honeybee_1f41d.png' },
      { word: 'Arcoiris', image: 'https://em-content.zobj.net/thumbs/120/apple/354/rainbow_1f308.png' },
      { word: 'Anillo', image: 'https://em-content.zobj.net/thumbs/120/apple/354/ring_1f48d.png' },
      { word: 'Árbol', image: 'https://em-content.zobj.net/thumbs/120/apple/354/deciduous-tree_1f333.png' }
    ],
    'B': [
      { word: 'Balón', image: 'https://em-content.zobj.net/thumbs/120/apple/354/soccer-ball_26bd.png' },
      { word: 'Banana', image: 'https://em-content.zobj.net/thumbs/120/apple/354/banana_1f34c.png' },
      { word: 'Bicicleta', image: 'https://em-content.zobj.net/thumbs/120/apple/354/bicycle_1f6b2.png' },
      { word: 'Ballena', image: 'https://em-content.zobj.net/thumbs/120/apple/354/whale_1f40b.png' }
    ],
    'C': [
      { word: 'Caballo', image: 'https://em-content.zobj.net/thumbs/120/apple/354/horse_1f40e.png' },
      { word: 'Corazón', image: 'https://em-content.zobj.net/thumbs/120/apple/354/red-heart_2764-fe0f.png' },
      { word: 'Coche', image: 'https://em-content.zobj.net/thumbs/120/apple/354/automobile_1f697.png' },
      { word: 'Cámara', image: 'https://em-content.zobj.net/thumbs/120/apple/354/camera_1f4f7.png' }
    ],
    'F': [
      { word: 'Flor', image: 'https://em-content.zobj.net/thumbs/120/apple/354/tulip_1f337.png' },
      { word: 'Fresa', image: 'https://em-content.zobj.net/thumbs/120/apple/354/strawberry_1f353.png' },
      { word: 'Fuego', image: 'https://em-content.zobj.net/thumbs/120/apple/354/fire_1f525.png' },
      { word: 'Fútbol', image: 'https://em-content.zobj.net/thumbs/120/apple/354/soccer-ball_26bd.png' }
    ],
    'G': [
      { word: 'Galleta', image: 'https://em-content.zobj.net/thumbs/120/apple/354/cookie_1f36a.png' },
      { word: 'Guitarra', image: 'https://em-content.zobj.net/thumbs/120/apple/354/guitar_1f3b8.png' },
      { word: 'Globo', image: 'https://em-content.zobj.net/thumbs/120/apple/354/balloon_1f388.png' },
      { word: 'Gorra', image: 'https://em-content.zobj.net/thumbs/120/apple/354/billed-cap_1f9e2.png' }
    ]
    // El resto del alfabeto seguiría con el mismo patrón
  };
  
  // Alternativas en inglés con URLs de imágenes para garantizar compatibilidad
  const alternativesEnglish: Record<string, AlternativeWord[]> = {
    'A': [
      { word: 'Apple', image: 'https://em-content.zobj.net/thumbs/120/apple/354/red-apple_1f34e.png' },
      { word: 'Ant', image: 'https://em-content.zobj.net/thumbs/120/apple/354/ant_1f41c.png' },
      { word: 'Arrow', image: 'https://em-content.zobj.net/thumbs/120/apple/354/right-arrow_27a1-fe0f.png' },
      { word: 'Astronaut', image: 'https://em-content.zobj.net/thumbs/120/apple/354/astronaut_1f9d1-1f680.png' }
    ],
    'B': [
      { word: 'Ball', image: 'https://em-content.zobj.net/thumbs/120/apple/354/soccer-ball_26bd.png' },
      { word: 'Banana', image: 'https://em-content.zobj.net/thumbs/120/apple/354/banana_1f34c.png' },
      { word: 'Bicycle', image: 'https://em-content.zobj.net/thumbs/120/apple/354/bicycle_1f6b2.png' },
      { word: 'Bear', image: 'https://em-content.zobj.net/thumbs/120/apple/354/bear_1f43b.png' }
    ],
    'C': [
      { word: 'Car', image: 'https://em-content.zobj.net/thumbs/120/apple/354/automobile_1f697.png' },
      { word: 'Cookie', image: 'https://em-content.zobj.net/thumbs/120/apple/354/cookie_1f36a.png' },
      { word: 'Cow', image: 'https://em-content.zobj.net/thumbs/120/apple/354/cow_1f404.png' },
      { word: 'Crown', image: 'https://em-content.zobj.net/thumbs/120/apple/354/crown_1f451.png' }
    ],
    'F': [
      { word: 'Fish', image: 'https://em-content.zobj.net/thumbs/120/apple/354/fish_1f41f.png' },
      { word: 'Flower', image: 'https://em-content.zobj.net/thumbs/120/apple/354/flower_1f33c.png' },
      { word: 'Fire', image: 'https://em-content.zobj.net/thumbs/120/apple/354/fire_1f525.png' },
      { word: 'Frog', image: 'https://em-content.zobj.net/thumbs/120/apple/354/frog_1f438.png' }
    ],
    'G': [
      { word: 'Guitar', image: 'https://em-content.zobj.net/thumbs/120/apple/354/guitar_1f3b8.png' },
      { word: 'Gift', image: 'https://em-content.zobj.net/thumbs/120/apple/354/wrapped-gift_1f381.png' },
      { word: 'Game', image: 'https://em-content.zobj.net/thumbs/120/apple/354/video-game_1f3ae.png' },
      { word: 'Globe', image: 'https://em-content.zobj.net/thumbs/120/apple/354/globe-showing-europe-africa_1f30d.png' }
    ]
    // El resto del alfabeto seguiría con el mismo patrón
  };
  
  // Efecto específico para manejar cambios en la dificultad
  useEffect(() => {
    // Verificar si ha cambiado el nivel de dificultad
    if (prevDifficultyRef.current !== settings.difficulty) {
      console.log(`[ALPHABET2] Dificultad cambiada: ${prevDifficultyRef.current} -> ${settings.difficulty}`);
      prevDifficultyRef.current = settings.difficulty;
      
      // Reiniciar todos los estados cuando cambia la dificultad
      setCurrentIndex(0);
      setCorrectAnswers(0);
      setIncorrectAnswers(0);
      setConsecutiveCorrectAnswers(0);
      setSelectedOptionIndex(null);
      setShowDetails(false);
      setIsCorrect(null);
      setAttemptCount(0);
      
      // Forzar regeneración del ejercicio con el nuevo nivel de dificultad
      setTimeout(() => {
        console.log(`[ALPHABET2] Regenerando ejercicio para nivel: ${settings.difficulty}`);
        generateExercise();
      }, 50);
    }
  }, [settings.difficulty]);
  
  // Efecto para otros cambios en el estado del ejercicio
  useEffect(() => {
    // No regenerar ejercicio si acabamos de cambiar la dificultad (ya manejado arriba)
    if (prevDifficultyRef.current === settings.difficulty) {
      // Generar nuevo ejercicio con el contenido apropiado para este nivel
      generateExercise();
    }
    
    // Iniciar o resetear el temporizador
    startTimer();
    
    // Limpieza
    return () => {
      if (timerId) clearInterval(timerId);
      if (rewardTimeoutRef.current) clearTimeout(rewardTimeoutRef.current);
    };
  }, [currentIndex, exerciseMode, settings.language]);
  
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
        // Nivel principiante: Solo primeras 5 letras (A-E)
        // Este nivel es para usuarios que están empezando a aprender el alfabeto
        return alphabet.slice(0, 5);
        
      case 'elementary':
        // Nivel elemental: Primeras 10 letras (A-J)
        // Un paso adelante del nivel principiante, incorpora más letras
        return alphabet.slice(0, 10);
        
      case 'intermediate':
        // Nivel intermedio: Primeras 15 letras (A-O/Ñ)
        // Para estudiantes que ya dominan la primera mitad del alfabeto
        return alphabet.slice(0, 15);
        
      case 'advanced':
        // Nivel avanzado: Primeras 21 letras (A-U)
        // Incluye letras menos comunes y más desafiantes
        return alphabet.slice(0, 21);
        
      case 'expert':
        // Nivel experto: Alfabeto completo con desafío adicional
        if (correctAnswers >= 10) {
          // Después de 10 respuestas correctas, mezclamos el alfabeto para mayor desafío
          // También incluimos combinaciones más difíciles y todas las letras
          const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
          return shuffled;
        }
        // Alfabeto completo en orden normal para las primeras 10 preguntas
        return alphabet;
        
      default:
        // Por defecto, usar configuración de principiante
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
        return selectedLanguage === 'spanish' ? 'Principiante (A-E)' : 'Beginner (A-E)';
      case 'elementary':
        return selectedLanguage === 'spanish' ? 'Elemental (A-J)' : 'Elementary (A-J)';
      case 'intermediate':
        return selectedLanguage === 'spanish' ? 'Intermedio (A-O)' : 'Intermediate (A-O)';
      case 'advanced':
        return selectedLanguage === 'spanish' ? 'Avanzado (A-U)' : 'Advanced (A-U)';
      case 'expert':
        return selectedLanguage === 'spanish' ? 'Experto (A-Z)' : 'Expert (A-Z)';
      default:
        return settings.difficulty;
    }
  };
  
  // Función para obtener descripción del nivel actual
  const getDifficultyDescription = () => {
    switch (settings.difficulty) {
      case 'beginner':
        return selectedLanguage === 'spanish' 
          ? 'Primeras 5 letras del alfabeto' 
          : 'First 5 letters of the alphabet';
      case 'elementary':
        return selectedLanguage === 'spanish' 
          ? 'Primeras 10 letras del alfabeto' 
          : 'First 10 letters of the alphabet';
      case 'intermediate':
        return selectedLanguage === 'spanish' 
          ? 'Primeras 15 letras del alfabeto' 
          : 'First 15 letters of the alphabet';
      case 'advanced':
        return selectedLanguage === 'spanish' 
          ? 'Primeras 21 letras del alfabeto' 
          : 'First 21 letters of the alphabet';
      case 'expert':
        return selectedLanguage === 'spanish' 
          ? 'Alfabeto completo con desafíos adicionales' 
          : 'Complete alphabet with additional challenges';
      default:
        return '';
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
                className={`w-full h-32 border-2 rounded-lg flex items-center justify-center ${
                  selectedOptionIndex === index
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
                onClick={() => checkAnswer(index)}
                disabled={selectedOptionIndex !== null}
              >
                <img 
                  src={option.image} 
                  alt={option.word} 
                  className="h-20 w-20 object-contain" 
                  onError={(e) => {
                    console.error(`Error loading image: ${option.image}`);
                    // Fallback: If image fails to load, show the first letter of the word
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parentElement = (e.target as HTMLImageElement).parentElement;
                    if (parentElement) {
                      const textNode = document.createElement('span');
                      textNode.className = 'text-4xl font-bold';
                      textNode.textContent = option.word.charAt(0);
                      parentElement.appendChild(textNode);
                    }
                  }}
                />
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
              <img 
                src={letter.image} 
                alt={letter.word} 
                className="h-8 w-8 object-contain mr-2" 
                onError={(e) => {
                  console.error(`Error loading image: ${letter.image}`);
                  // Fallback: If image fails to load, show the first letter of the word
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parentElement = (e.target as HTMLImageElement).parentElement;
                  if (parentElement) {
                    const textNode = document.createElement('span');
                    textNode.className = 'text-3xl font-bold';
                    textNode.textContent = letter.word.charAt(0);
                    parentElement.appendChild(textNode);
                  }
                }}
              />
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
          <div className="mb-4 flex justify-center">
            <img 
              src={image.image} 
              alt={image.word} 
              className="h-28 w-28 object-contain" 
              onError={(e) => {
                console.error(`Error loading image: ${image.image}`);
                // Fallback: If image fails to load, show the first letter of the word
                (e.target as HTMLImageElement).style.display = 'none';
                const parentElement = (e.target as HTMLImageElement).parentElement;
                if (parentElement) {
                  const textNode = document.createElement('span');
                  textNode.className = 'text-8xl font-bold';
                  textNode.textContent = image.word.charAt(0);
                  parentElement.appendChild(textNode);
                }
              }}
            />
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
              <img 
                src={image.image} 
                alt={image.word} 
                className="h-8 w-8 object-contain mr-2" 
                onError={(e) => {
                  console.error(`Error loading image: ${image.image}`);
                  // Fallback: If image fails to load, show the first letter of the word
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parentElement = (e.target as HTMLImageElement).parentElement;
                  if (parentElement) {
                    const textNode = document.createElement('span');
                    textNode.className = 'text-3xl font-bold';
                    textNode.textContent = image.word.charAt(0);
                    parentElement.appendChild(textNode);
                  }
                }}
              />
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
          <div className="mb-6 flex justify-center">
            <img 
              src={rewardSymbols[rewardType][Math.floor(Math.random() * rewardSymbols[rewardType].length)]}
              alt={selectedLanguage === 'spanish' ? "Premio" : "Reward"}
              className="h-32 w-32 object-contain"
              onError={(e) => {
                console.error("Error loading reward image");
                // Fallback to text-based symbol if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
                const parentElement = (e.target as HTMLImageElement).parentElement;
                if (parentElement) {
                  const textNode = document.createElement('span');
                  textNode.className = 'text-9xl';
                  textNode.textContent = rewardType === 'stars' ? '★' : rewardType === 'medals' ? '🥇' : '🏆';
                  parentElement.appendChild(textNode);
                }
              }}
            />
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
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold">
            {selectedLanguage === 'spanish' ? 'Viaje Alfabético' : 'Alphabet Journey'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {getDifficultyDescription()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {selectedLanguage === 'spanish' ? 'Nivel: ' : 'Level: '}
            <span className="font-medium">{getDifficultyText()}</span>
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