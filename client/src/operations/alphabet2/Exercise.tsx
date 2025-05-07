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

// Datos de ejercicio para el modo de drag & drop (nivel advanced)
interface DragAndDropExercise {
  letters: Letter[];
  correctOrder: string[];
  currentOrder: string[];
}

// Datos de ejercicio para el modo de secuencias (nivel expert)
interface SequenceRelationsExercise {
  currentLetter: Letter;
  previousLetter: Letter;
  nextLetter: Letter;
  options: Letter[];
  correctPrevIndex: number;
  correctNextIndex: number;
}

// Este componente implementa el módulo Alphabet Journey pero con una arquitectura interna diferente
export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // Referencias para audio, recompensas y seguimiento de dificultad
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rewardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados de la aplicación
  const [prevDifficulty, setPrevDifficulty] = useState<string>(settings.difficulty);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exerciseMode, setExerciseMode] = useState<'letter_to_image' | 'image_to_letter' | 'drag_and_drop' | 'sequence_relations'>('letter_to_image');
  const [currentExercise, setCurrentExercise] = useState<LetterToImageExercise | ImageToLetterExercise | DragAndDropExercise | SequenceRelationsExercise | null>(null);
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
  
  // Estados para los ejercicios avanzados y expertos (movidos al nivel superior)
  const [advancedUserOrder, setAdvancedUserOrder] = useState<string[]>([]);
  const [advancedHasSubmitted, setAdvancedHasSubmitted] = useState(false);
  const [advancedIsOrderCorrect, setAdvancedIsOrderCorrect] = useState(false);
  
  // Estados para ejercicios expertos
  const [expertSelectedPrevIndex, setExpertSelectedPrevIndex] = useState<number | null>(null);
  const [expertSelectedNextIndex, setExpertSelectedNextIndex] = useState<number | null>(null);
  const [expertHasSubmitted, setExpertHasSubmitted] = useState(false);
  const [expertIsAnswersPrevCorrect, setExpertIsAnswersPrevCorrect] = useState(false);
  const [expertIsAnswersNextCorrect, setExpertIsAnswersNextCorrect] = useState(false);
  
  // Contextos
  const { user } = useAuth();
  const { globalSettings } = useSettings();
  const selectedLanguage = globalSettings.language === 'english' ? 'english' : 'spanish';
  const { saveExerciseResult } = useProgress();
  
  // Obtener subset de letras según el idioma seleccionado
  const getAlphabetSubset = () => {
    // Alfabeto completo en inglés
    const alphabetEnglish = [
      { 
        uppercase: 'A', 
        lowercase: 'a', 
        word: 'Apple', 
        image: 'https://em-content.zobj.net/thumbs/240/apple/354/red-apple_1f34e.png'
      },
      { 
        uppercase: 'B', 
        lowercase: 'b', 
        word: 'Ball', 
        image: 'https://em-content.zobj.net/thumbs/240/apple/354/soccer-ball_26bd.png'
      },
      // Resto del alfabeto inglés
      // ...
    ];
    
    // Alfabeto completo en español
    const alphabetSpanish = [
      { 
        uppercase: 'A', 
        lowercase: 'a', 
        word: 'Árbol', 
        image: 'https://em-content.zobj.net/thumbs/240/apple/354/evergreen-tree_1f332.png'
      },
      { 
        uppercase: 'B', 
        lowercase: 'b', 
        word: 'Barco', 
        image: 'https://em-content.zobj.net/thumbs/240/apple/354/ship_1f6a2.png'
      },
      // Resto del alfabeto español
      // ...
    ];
    
    // Devolver el subconjunto apropiado según el idioma
    return selectedLanguage === 'english' ? alphabetEnglish : alphabetSpanish;
  };
  
  // No necesitamos este efecto ya que ahora usamos el estado prevDifficulty
  
  // Iniciar el ejercicio cuando el componente se monta, configurar temporizadores
  useEffect(() => {
    generateExercise();
    
    // Configurar temporizador para contar el tiempo
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    setTimerId(timer);
    
    return () => {
      if (timer) clearInterval(timer);
      if (rewardTimeoutRef.current) clearTimeout(rewardTimeoutRef.current);
    };
  }, []);
  
  // Generar nuevo ejercicio si cambia el índice actual o la dificultad
  useEffect(() => {
    if (prevDifficulty !== settings.difficulty) {
      console.log("Difficulty changed from " + prevDifficulty + " to " + settings.difficulty);
      setPrevDifficulty(settings.difficulty);
    }
    generateExercise();
  }, [currentIndex, settings.difficulty, prevDifficulty]);
  
  // Mostrar recompensa después de cierto número de respuestas correctas consecutivas
  useEffect(() => {
    if (consecutiveCorrectAnswers > 0 && consecutiveCorrectAnswers % 3 === 0 && !rewardsShownIndices.includes(currentIndex)) {
      setShowReward(true);
      // Alternar entre tipos de recompensa para variedad
      setRewardType(totalRewardsShown % 3 === 0 ? 'stars' : totalRewardsShown % 3 === 1 ? 'medals' : 'trophies');
      setRewardsShownIndices(prev => [...prev, currentIndex]);
      setTotalRewardsShown(prev => prev + 1);
      
      // Reproducir sonido de recompensa (opcional)
      playRewardSound();
      
      // Ocultar la recompensa automáticamente después de un tiempo
      rewardTimeoutRef.current = setTimeout(() => {
        setShowReward(false);
      }, 3000);
    }
  }, [consecutiveCorrectAnswers]);
  
  // Generar nuevo ejercicio según el índice actual
  const generateExercise = () => {
    setShowDetails(false);
    setSelectedOptionIndex(null);
    setIsCorrect(null);
    setAttemptCount(0);
    
    // Reset estados para ejercicios avanzados y expertos
    setAdvancedUserOrder([]);
    setAdvancedHasSubmitted(false);
    setAdvancedIsOrderCorrect(false);
    setExpertSelectedPrevIndex(null);
    setExpertSelectedNextIndex(null);
    setExpertHasSubmitted(false);
    setExpertIsAnswersPrevCorrect(false);
    setExpertIsAnswersNextCorrect(false);
    
    const alphabetSubset = getAlphabetSubset();
    const currentLetter = alphabetSubset[currentIndex];
    
    // Generar ejercicio según el nivel de dificultad seleccionado
    switch (settings.difficulty) {
      case 'beginner':
        setExerciseMode('letter_to_image');
        const exerciseBeginner = generateLetterToImageExercise(currentLetter);
        break;
      
      case 'elementary':
        setExerciseMode('letter_to_image');
        const exerciseElementary = generateLetterToImageExercise(currentLetter);
        break;
      
      case 'intermediate':
        setExerciseMode('image_to_letter');
        const exerciseIntermediate = generateImageToLetterExercise(currentLetter);
        break;
      
      case 'advanced':
        setExerciseMode('drag_and_drop');
        const exerciseAdvanced = generateAdvancedExercise(currentLetter, alphabetSubset);
        setAdvancedUserOrder(exerciseAdvanced.currentOrder);
        break;
      
      case 'expert':
        setExerciseMode('sequence_relations');
        const exerciseExpert = generateSequenceExercise(currentLetter, alphabetSubset);
        break;
      
      default:
        // Modo alternado para otros niveles
        if (currentIndex % 2 === 0) {
          setExerciseMode('letter_to_image');
          const exerciseDefault = generateLetterToImageExercise(currentLetter);
        } else {
          setExerciseMode('image_to_letter');
          const exerciseDefault = generateImageToLetterExercise(currentLetter);
        }
        break;
    }
  };
  
  // Generar ejercicio de letra a imagen
  const generateLetterToImageExercise = (currentLetterItem: Letter): LetterToImageExercise => {
    const alphabetSubset = getAlphabetSubset();
    
    // Crear opciones (una correcta, el resto incorrectas)
    const correctOption = {
      word: currentLetterItem.word,
      image: currentLetterItem.image
    };
    
    // Obtener opciones incorrectas (letras distintas de la actual)
    const incorrectOptions = alphabetSubset
      .filter(item => item.uppercase !== currentLetterItem.uppercase)
      .map(item => ({ word: item.word, image: item.image }))
      .sort(() => 0.5 - Math.random()) // Mezclar
      .slice(0, 3); // Tomar 3 opciones incorrectas
    
    // Mezclar todas las opciones
    const allOptions = [correctOption, ...incorrectOptions].sort(() => 0.5 - Math.random());
    
    // Encontrar índice de la opción correcta en el arreglo mezclado
    const correctIndex = allOptions.findIndex(
      option => option.word === correctOption.word
    );
    
    // Crear y devolver el ejercicio
    const exercise: LetterToImageExercise = {
      letter: currentLetterItem,
      options: allOptions,
      correctIndex
    };
    
    // Configurar ejercicio actual
    setCurrentExercise(exercise);
    
    return exercise;
  };
  
  // Generar ejercicio de imagen a letra
  const generateImageToLetterExercise = (currentLetterItem: Letter): ImageToLetterExercise => {
    const alphabetSubset = getAlphabetSubset();
    
    // Crear imagen correcta
    const correctImage = {
      word: currentLetterItem.word,
      image: currentLetterItem.image
    };
    
    // Obtener opciones incorrectas (letras distintas de la actual)
    const incorrectOptions = alphabetSubset
      .filter(item => item.uppercase !== currentLetterItem.uppercase)
      .sort(() => 0.5 - Math.random()) // Mezclar
      .slice(0, 3); // Tomar 3 opciones incorrectas
    
    // Mezclar todas las opciones de letras
    const allOptions = [currentLetterItem, ...incorrectOptions].sort(() => 0.5 - Math.random());
    
    // Encontrar índice de la opción correcta en el arreglo mezclado
    const correctIndex = allOptions.findIndex(
      option => option.uppercase === currentLetterItem.uppercase
    );
    
    // Crear y devolver el ejercicio
    const exercise: ImageToLetterExercise = {
      image: correctImage,
      options: allOptions,
      correctIndex
    };
    
    // Configurar ejercicio actual
    setCurrentExercise(exercise);
    
    return exercise;
  };
  
  // Generar ejercicio avanzado (drag & drop)
  const generateAdvancedExercise = (currentLetterItem: Letter, alphabetSubset: Letter[]): DragAndDropExercise => {
    // Para este ejercicio, seleccionamos 3-5 letras que incluyen la letra actual
    // El objetivo es ordenarlas alfabéticamente
    
    // Determinar cuántas letras usar (3-5)
    const numLetters = Math.floor(Math.random() * 3) + 3; // 3, 4 o 5 letras
    
    // Encontrar el índice actual en el alfabeto
    const currentIndex = alphabetSubset.findIndex(letter => 
      letter.uppercase === currentLetterItem.uppercase
    );
    
    let selectedLetters: Letter[] = [];
    
    // Seleccionar letras alrededor de la letra actual
    const startIndex = Math.max(0, currentIndex - Math.floor(numLetters / 2));
    const endIndex = Math.min(alphabetSubset.length - 1, startIndex + numLetters - 1);
    
    // Obtener las letras en ese rango
    selectedLetters = alphabetSubset.slice(startIndex, endIndex + 1);
    
    // Si no tenemos suficientes letras, agregar más desde el principio
    if (selectedLetters.length < numLetters) {
      const remainingCount = numLetters - selectedLetters.length;
      selectedLetters = [...selectedLetters, ...alphabetSubset.slice(0, remainingCount)];
    }
    
    // Definir el orden correcto (alfabético)
    const correctOrder = selectedLetters.map(letter => letter.uppercase).sort();
    
    // Crear un orden mezclado (diferente al correcto)
    let randomOrder;
    do {
      randomOrder = [...correctOrder].sort(() => 0.5 - Math.random());
    } while (JSON.stringify(randomOrder) === JSON.stringify(correctOrder));
    
    // Crear y devolver el ejercicio
    const exercise: DragAndDropExercise = {
      letters: selectedLetters,
      correctOrder,
      currentOrder: randomOrder
    };
    
    // Configurar ejercicio actual
    setCurrentExercise(exercise);
    
    return exercise;
  };
  
  // Generar ejercicio experto (relaciones de secuencia)
  const generateSequenceExercise = (currentLetterItem: Letter, alphabetSubset: Letter[]): SequenceRelationsExercise => {
    // Para este ejercicio, el usuario debe identificar la letra anterior y posterior
    const currentIndex = alphabetSubset.findIndex(letter => 
      letter.uppercase === currentLetterItem.uppercase
    );
    
    // Determinar la letra anterior (o usar la última si estamos en la primera)
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : alphabetSubset.length - 1;
    const previousLetter = alphabetSubset[previousIndex];
    
    // Determinar la letra siguiente (o usar la primera si estamos en la última)
    const nextIndex = currentIndex < alphabetSubset.length - 1 ? currentIndex + 1 : 0;
    const nextLetter = alphabetSubset[nextIndex];
    
    // Crear conjunto de opciones (incluir anterior, siguiente y algunas adicionales)
    let options = [previousLetter, nextLetter];
    
    // Agregar más opciones aleatorias
    const additionalOptions = alphabetSubset
      .filter(letter => 
        letter.uppercase !== previousLetter.uppercase && 
        letter.uppercase !== currentLetterItem.uppercase && 
        letter.uppercase !== nextLetter.uppercase
      )
      .sort(() => 0.5 - Math.random())
      .slice(0, 6); // Tomar hasta 6 opciones incorrectas
    
    options = [...options, ...additionalOptions];
    options = options.sort(() => 0.5 - Math.random()); // Mezclar todas las opciones
    
    // Encontrar índices de las opciones correctas
    const correctPrevIndex = options.findIndex(
      option => option.uppercase === previousLetter.uppercase
    );
    const correctNextIndex = options.findIndex(
      option => option.uppercase === nextLetter.uppercase
    );
    
    // Crear y devolver el ejercicio
    const exercise: SequenceRelationsExercise = {
      currentLetter: currentLetterItem,
      previousLetter,
      nextLetter,
      options,
      correctPrevIndex,
      correctNextIndex
    };
    
    // Configurar ejercicio actual
    setCurrentExercise(exercise);
    
    return exercise;
  };
  
  // Reproducir sonido de una letra
  const playLetterSound = (letter: string) => {
    // Aquí podría implementarse la reproducción real de sonidos de letras
    // Por ahora, solo mostraremos un mensaje en consola
    console.log(`Playing sound for letter: ${letter}`);
  };
  
  // Reproducir sonido de recompensa
  const playRewardSound = () => {
    // Aquí podría implementarse la reproducción real de sonidos
    // Por ahora, solo mostraremos un mensaje en consola
    console.log("Playing reward sound");
  };
  
  // Verificar respuesta
  const checkAnswer = (selectedIndex: number) => {
    setSelectedOptionIndex(selectedIndex);
    setAttemptCount(prev => prev + 1);
    
    let correct = false;
    
    if ('letter' in currentExercise!) {
      correct = selectedIndex === currentExercise.correctIndex;
    } else if ('image' in currentExercise!) {
      correct = selectedIndex === currentExercise.correctIndex;
    }
    
    setIsCorrect(correct);
    
    // Mostrar detalles después de agotar todos los intentos o si es correcta
    if (correct || attemptCount + 1 >= settings.maxAttempts) {
      setShowDetails(true);
      
      if (correct) {
        setCorrectAnswers(prev => prev + 1);
        setConsecutiveCorrectAnswers(prev => prev + 1);
      } else {
        setIncorrectAnswers(prev => prev + 1);
        setConsecutiveCorrectAnswers(0);
      }
    }
  };
  
  // Mostrar respuesta directamente
  const showAnswer = () => {
    setShowDetails(true);
    setIncorrectAnswers(prev => prev + 1);
    setConsecutiveCorrectAnswers(0);
  };
  
  // Manejar navegación a ejercicio anterior
  const handlePrevious = () => {
    if (showReward) {
      setShowReward(false);
    }
    
    const alphabetSubset = getAlphabetSubset();
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    } else {
      // Ir al final si estamos al principio
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
  
  // NIVEL BEGINNER: Reconocimiento básico (A → Apple 🍎)
  const renderBeginnerExercise = (exercise: LetterToImageExercise) => {
    const { letter, options, correctIndex } = exercise;
    
    return (
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center mb-4">
            <div 
              className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                      text-transparent bg-clip-text cursor-pointer transition-transform 
                      transform hover:scale-110"
              onClick={() => playLetterSound(letter.uppercase)}
            >
              {letter.uppercase}
            </div>
            <Volume2 
              className="ml-2 w-6 h-6 text-blue-500 cursor-pointer" 
              onClick={() => playLetterSound(letter.uppercase)}
            />
          </div>
          
          <div className="flex items-center justify-center mt-2 mb-4">
            <div className="text-2xl font-medium">→</div>
            <div className="text-2xl font-medium mx-2">?</div>
          </div>
          
          <div className="text-sm text-gray-500 italic mb-4 text-center">
            {selectedLanguage === 'spanish' 
              ? 'Reconocimiento básico: Elige la imagen que representa esta letra' 
              : 'Basic recognition: Select the image that represents this letter'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((option, index) => (
            <div key={index} className="relative">
              <button
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedOptionIndex === index
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => checkAnswer(index)}
                disabled={showDetails}
              >
                <div className="flex flex-col items-center">
                  <img
                    src={option.image}
                    alt={option.word}
                    className="w-24 h-24 object-contain mb-2"
                    onError={(e) => {
                      console.error(`Error loading image: ${option.image}`);
                      e.currentTarget.src = 'https://em-content.zobj.net/thumbs/120/apple/354/question-mark_2753.png';
                    }}
                  />
                  {(showDetails || selectedOptionIndex === index) && (
                    <div className="text-center mt-2 font-medium">{option.word}</div>
                  )}
                </div>
              </button>
              
              {/* Mostrar indicador correcto/incorrecto */}
              {selectedOptionIndex === index && (
                <div className="absolute top-2 right-2">
                  {isCorrect ? (
                    <Check className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              )}
              
              {/* Mostrar check en la respuesta correcta cuando se muestra detalle */}
              {showDetails && index === correctIndex && selectedOptionIndex !== index && (
                <div className="absolute top-2 right-2">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center text-lg font-semibold mb-4">
          {showDetails && (
            <div>
              {isCorrect ? (
                <div className="text-green-600">
                  {selectedLanguage === 'spanish' 
                    ? `¡Correcto! La letra "${letter.uppercase}" representa "${options[correctIndex].word}"` 
                    : `Correct! The letter "${letter.uppercase}" represents "${options[correctIndex].word}"`}
                </div>
              ) : (
                <div className="text-red-600">
                  {selectedLanguage === 'spanish' 
                    ? `Incorrecto. La letra "${letter.uppercase}" representa "${options[correctIndex].word}"` 
                    : `Incorrect. The letter "${letter.uppercase}" represents "${options[correctIndex].word}"`}
                </div>
              )}
            </div>
          )}
        </div>
        
        {!showDetails && settings.showAnswerWithExplanation && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={showAnswer}
              className="flex items-center"
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              {selectedLanguage === 'spanish' ? 'Mostrar respuesta' : 'Show answer'}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // NIVEL ELEMENTARY: Emparejamiento (B = ? [Ball ⚽])
  const renderElementaryExercise = (exercise: LetterToImageExercise) => {
    const { letter, options, correctIndex } = exercise;
    
    return (
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="text-xl text-center mb-4 font-medium">
            {selectedLanguage === 'spanish' 
              ? 'Emparejamiento de letras e imágenes' 
              : 'Letter and image matching'}
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div 
              className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                      text-transparent bg-clip-text cursor-pointer transition-transform 
                      transform hover:scale-110"
              onClick={() => playLetterSound(letter.uppercase)}
            >
              {letter.uppercase}
            </div>
            <div className="text-4xl">=</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 
                    text-transparent bg-clip-text">?</div>
            <Volume2 
              className="ml-2 w-6 h-6 text-blue-500 cursor-pointer" 
              onClick={() => playLetterSound(letter.uppercase)}
            />
          </div>
          
          <div className="text-sm text-gray-500 italic mb-4 text-center max-w-md">
            {selectedLanguage === 'spanish' 
              ? 'Selecciona la imagen que empiece con la letra mostrada. ¡Recuerda que cada letra tiene una palabra que la representa!' 
              : 'Select the image that starts with the shown letter. Remember that each letter has a word that represents it!'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((option, index) => (
            <div key={index} className="relative">
              <button
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedOptionIndex === index
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => checkAnswer(index)}
                disabled={showDetails}
              >
                <div className="flex flex-col items-center">
                  <img
                    src={option.image}
                    alt={option.word}
                    className="w-24 h-24 object-contain mb-2"
                    onError={(e) => {
                      console.error(`Error loading image: ${option.image}`);
                      e.currentTarget.src = 'https://em-content.zobj.net/thumbs/120/apple/354/question-mark_2753.png';
                    }}
                  />
                  {(showDetails || selectedOptionIndex === index) && (
                    <div className="text-center mt-2 font-medium">{option.word}</div>
                  )}
                </div>
              </button>
              
              {/* Mostrar indicador correcto/incorrecto */}
              {selectedOptionIndex === index && (
                <div className="absolute top-2 right-2">
                  {isCorrect ? (
                    <Check className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              )}
              
              {/* Mostrar check en la respuesta correcta cuando se muestra detalle */}
              {showDetails && index === correctIndex && selectedOptionIndex !== index && (
                <div className="absolute top-2 right-2">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center text-lg font-semibold mb-4">
          {showDetails && (
            <div>
              {isCorrect ? (
                <div className="text-green-600">
                  {selectedLanguage === 'spanish' 
                    ? `¡Correcto! "${letter.uppercase}" = "${options[correctIndex].word}"` 
                    : `Correct! "${letter.uppercase}" = "${options[correctIndex].word}"`}
                </div>
              ) : (
                <div className="text-red-600">
                  {selectedLanguage === 'spanish' 
                    ? `Incorrecto. "${letter.uppercase}" = "${options[correctIndex].word}"` 
                    : `Incorrect. "${letter.uppercase}" = "${options[correctIndex].word}"`}
                </div>
              )}
            </div>
          )}
        </div>
        
        {!showDetails && settings.showAnswerWithExplanation && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={showAnswer}
              className="flex items-center"
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              {selectedLanguage === 'spanish' ? 'Mostrar respuesta' : 'Show answer'}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // NIVEL INTERMEDIATE: Quiz de letras (🍌 = ? [A, C, P, R])
  const renderIntermediateExercise = (exercise: ImageToLetterExercise) => {
    const { image, options, correctIndex } = exercise;
    
    return (
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="text-xl text-center mb-4 font-medium">
            {selectedLanguage === 'spanish' 
              ? 'Quiz: ¿Qué letra corresponde a esta imagen?' 
              : 'Quiz: Which letter corresponds to this image?'}
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            <img
              src={image.image}
              alt={image.word}
              className="w-28 h-28 object-contain"
              onError={(e) => {
                console.error(`Error loading image: ${image.image}`);
                e.currentTarget.src = 'https://em-content.zobj.net/thumbs/120/apple/354/question-mark_2753.png';
              }}
            />
            <div className="text-4xl">=</div>
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 
                    text-transparent bg-clip-text">?</div>
          </div>
          
          <div className="text-sm text-gray-500 italic mb-6 text-center max-w-md">
            {selectedLanguage === 'spanish' 
              ? '¿Con qué letra comienza esta palabra? Elige entre las opciones disponibles.' 
              : 'Which letter does this word start with? Choose from the available options.'}
          </div>
          
          {(showDetails) && (
            <div className="text-center mb-4 font-medium text-xl">
              {`${image.word}`}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((option, index) => (
            <div key={index} className="relative">
              <button
                className={`w-full h-20 flex items-center justify-center rounded-lg border-2 transition-all ${
                  selectedOptionIndex === index
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => checkAnswer(index)}
                disabled={showDetails}
              >
                <div 
                  className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                          text-transparent bg-clip-text"
                >
                  {option.uppercase}
                </div>
              </button>
              
              {/* Mostrar indicador correcto/incorrecto */}
              {selectedOptionIndex === index && (
                <div className="absolute top-2 right-2">
                  {isCorrect ? (
                    <Check className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              )}
              
              {/* Mostrar check en la respuesta correcta cuando se muestra detalle */}
              {showDetails && index === correctIndex && selectedOptionIndex !== index && (
                <div className="absolute top-2 right-2">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center text-lg font-semibold mb-4">
          {showDetails && (
            <div>
              {isCorrect ? (
                <div className="text-green-600">
                  {selectedLanguage === 'spanish' 
                    ? `¡Correcto! La palabra "${image.word}" comienza con la letra "${options[correctIndex].uppercase}"` 
                    : `Correct! The word "${image.word}" starts with the letter "${options[correctIndex].uppercase}"`}
                </div>
              ) : (
                <div className="text-red-600">
                  {selectedLanguage === 'spanish' 
                    ? `Incorrecto. La palabra "${image.word}" comienza con la letra "${options[correctIndex].uppercase}"` 
                    : `Incorrect. The word "${image.word}" starts with the letter "${options[correctIndex].uppercase}"`}
                </div>
              )}
            </div>
          )}
        </div>
        
        {!showDetails && settings.showAnswerWithExplanation && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={showAnswer}
              className="flex items-center"
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              {selectedLanguage === 'spanish' ? 'Mostrar respuesta' : 'Show answer'}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // NIVEL ADVANCED: Drag & Drop (ordenar: A, C, B)
  const renderAdvancedExercise = (exercise: DragAndDropExercise) => {
    const { letters, correctOrder, currentOrder } = exercise;
    
    // Verificar si el ordenamiento es correcto
    const checkOrdering = () => {
      const isCorrect = advancedUserOrder.every((letter, index) => letter === correctOrder[index]);
      setAdvancedIsOrderCorrect(isCorrect);
      setAdvancedHasSubmitted(true);
      setShowDetails(true);
      
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
        setConsecutiveCorrectAnswers(prev => prev + 1);
      } else {
        setIncorrectAnswers(prev => prev + 1);
        setConsecutiveCorrectAnswers(0);
      }
    };
    
    // Manejar el movimiento de una letra
    const handleLetterMove = (fromIndex: number, toIndex: number) => {
      const updatedOrder = [...advancedUserOrder];
      const [moved] = updatedOrder.splice(fromIndex, 1);
      updatedOrder.splice(toIndex, 0, moved);
      setAdvancedUserOrder(updatedOrder);
    };
    
    return (
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="text-xl text-center mb-4 font-medium">
            {selectedLanguage === 'spanish' 
              ? 'Ordena las letras alfabéticamente' 
              : 'Arrange the letters in alphabetical order'}
          </div>
          
          <div className="text-lg text-center mb-2 font-medium">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Drag & Drop
            </span>
          </div>
          
          <div className="text-sm text-gray-500 italic mb-6 text-center max-w-md">
            {selectedLanguage === 'spanish' 
              ? 'Usa los botones de flechas para reorganizar las letras en el orden correcto del alfabeto.' 
              : 'Use the arrow buttons to rearrange the letters in the correct alphabetical order.'}
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {advancedUserOrder.map((letter: string, index: number) => {
            const letterObj = letters.find(l => l.uppercase === letter);
            return (
              <div key={index} className="relative">
                <div 
                  className={`
                    w-16 h-16 flex items-center justify-center rounded-lg 
                    text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                    text-white cursor-pointer transition-transform transform hover:scale-105
                    ${advancedHasSubmitted && advancedIsOrderCorrect ? 'bg-green-500' : ''}
                  `}
                  onClick={() => !advancedHasSubmitted && playLetterSound(letter)}
                >
                  {letter}
                </div>
                
                {!advancedHasSubmitted && (
                  <div className="flex mt-2 justify-center">
                    {index > 0 && (
                      <button 
                        className="p-1 mr-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                        onClick={() => handleLetterMove(index, index - 1)}
                        aria-label={selectedLanguage === 'spanish' ? 'Mover a la izquierda' : 'Move left'}
                        title={selectedLanguage === 'spanish' ? 'Mover a la izquierda' : 'Move left'}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    {index < advancedUserOrder.length - 1 && (
                      <button 
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                        onClick={() => handleLetterMove(index, index + 1)}
                        aria-label={selectedLanguage === 'spanish' ? 'Mover a la derecha' : 'Move right'}
                        title={selectedLanguage === 'spanish' ? 'Mover a la derecha' : 'Move right'}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {!advancedHasSubmitted ? (
          <div className="flex justify-center mb-6">
            <Button 
              className="px-8" 
              onClick={checkOrdering}
            >
              {selectedLanguage === 'spanish' ? 'Comprobar orden' : 'Check order'}
            </Button>
          </div>
        ) : (
          <div className="text-center text-lg font-semibold mb-6">
            {advancedIsOrderCorrect ? (
              <div className="text-green-600">
                {selectedLanguage === 'spanish' 
                  ? '¡Correcto! Has ordenado las letras alfabéticamente.' 
                  : 'Correct! You have arranged the letters alphabetically.'}
              </div>
            ) : (
              <div className="text-red-600">
                {selectedLanguage === 'spanish' 
                  ? `Incorrecto. El orden correcto es: ${correctOrder.join(', ')}` 
                  : `Incorrect. The correct order is: ${correctOrder.join(', ')}`}
              </div>
            )}
          </div>
        )}
        
        {advancedHasSubmitted && (
          <div className="flex justify-center mt-4">
            <Button onClick={handleNext}>
              {selectedLanguage === 'spanish' ? 'Siguiente ejercicio' : 'Next exercise'}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // NIVEL EXPERT: Anterior/Siguiente (K → J y L)
  const renderExpertExercise = (exercise: SequenceRelationsExercise) => {
    const { currentLetter, previousLetter, nextLetter, options } = exercise;
    
    // Verificar las respuestas
    const checkSequenceAnswers = () => {
      if (expertSelectedPrevIndex === null || expertSelectedNextIndex === null) return;
      
      const isPrevCorrect = options[expertSelectedPrevIndex]?.uppercase === previousLetter.uppercase;
      const isNextCorrect = options[expertSelectedNextIndex]?.uppercase === nextLetter.uppercase;
      
      setExpertIsAnswersPrevCorrect(isPrevCorrect);
      setExpertIsAnswersNextCorrect(isNextCorrect);
      setExpertHasSubmitted(true);
      setShowDetails(true);
      
      if (isPrevCorrect && isNextCorrect) {
        setCorrectAnswers(prev => prev + 1);
        setConsecutiveCorrectAnswers(prev => prev + 1);
      } else {
        setIncorrectAnswers(prev => prev + 1);
        setConsecutiveCorrectAnswers(0);
      }
    };
    
    return (
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="text-xl text-center mb-4 font-medium">
            {selectedLanguage === 'spanish' 
              ? 'Secuencias del Alfabeto: Anterior y Siguiente' 
              : 'Alphabet Sequences: Previous and Next'}
          </div>
          
          <div 
            className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                    text-transparent bg-clip-text cursor-pointer mb-6 transition-transform hover:scale-105"
            onClick={() => playLetterSound(currentLetter.uppercase)}
          >
            {currentLetter.uppercase}
          </div>
          
          <div className="text-sm text-gray-500 italic mb-6 text-center max-w-md">
            {selectedLanguage === 'spanish' 
              ? `¿Qué letras van antes y después de "${currentLetter.uppercase}" en el alfabeto? Selecciona ambas opciones.` 
              : `Which letters come before and after "${currentLetter.uppercase}" in the alphabet? Select both options.`}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-center mb-3 font-medium">
              {selectedLanguage === 'spanish' ? 'Letra anterior' : 'Previous letter'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {options.slice(0, 4).map((option, index) => (
                <div key={`prev-${index}`} className="relative">
                  <button
                    className={`
                      w-full h-16 flex items-center justify-center rounded-lg border-2 
                      ${expertSelectedPrevIndex === index 
                        ? expertHasSubmitted 
                          ? expertIsAnswersPrevCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                          : 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }
                      ${expertHasSubmitted && option.uppercase === previousLetter.uppercase && expertSelectedPrevIndex !== index
                        ? 'border-green-500 bg-green-50' : ''
                      }
                    `}
                    onClick={() => !expertHasSubmitted && setExpertSelectedPrevIndex(index)}
                    disabled={expertHasSubmitted}
                  >
                    <div className="text-2xl font-bold">
                      {option.uppercase}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-center mb-3 font-medium">
              {selectedLanguage === 'spanish' ? 'Letra siguiente' : 'Next letter'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {options.slice(0, 4).map((option, index) => (
                <div key={`next-${index}`} className="relative">
                  <button
                    className={`
                      w-full h-16 flex items-center justify-center rounded-lg border-2 
                      ${expertSelectedNextIndex === index 
                        ? expertHasSubmitted 
                          ? expertIsAnswersNextCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                          : 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }
                      ${expertHasSubmitted && option.uppercase === nextLetter.uppercase && expertSelectedNextIndex !== index
                        ? 'border-green-500 bg-green-50' : ''
                      }
                    `}
                    onClick={() => !expertHasSubmitted && setExpertSelectedNextIndex(index)}
                    disabled={expertHasSubmitted}
                  >
                    <div className="text-2xl font-bold">
                      {option.uppercase}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {!expertHasSubmitted ? (
          <div className="flex justify-center mb-6">
            <Button 
              className="px-8" 
              onClick={checkSequenceAnswers}
              disabled={expertSelectedPrevIndex === null || expertSelectedNextIndex === null}
            >
              {selectedLanguage === 'spanish' ? 'Comprobar respuestas' : 'Check answers'}
            </Button>
          </div>
        ) : (
          <div>
            <div className="text-center text-lg font-semibold mb-4">
              {expertIsAnswersPrevCorrect && expertIsAnswersNextCorrect ? (
                <div className="text-green-600">
                  {selectedLanguage === 'spanish' 
                    ? `¡Correcto! Antes de "${currentLetter.uppercase}" va "${previousLetter.uppercase}" y después va "${nextLetter.uppercase}"` 
                    : `Correct! Before "${currentLetter.uppercase}" comes "${previousLetter.uppercase}" and after comes "${nextLetter.uppercase}"`}
                </div>
              ) : (
                <div className="text-red-600">
                  {selectedLanguage === 'spanish' 
                    ? `Incorrecto. Antes de "${currentLetter.uppercase}" va "${previousLetter.uppercase}" y después va "${nextLetter.uppercase}"` 
                    : `Incorrect. Before "${currentLetter.uppercase}" comes "${previousLetter.uppercase}" and after comes "${nextLetter.uppercase}"`}
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-4">
              <Button onClick={handleNext}>
                {selectedLanguage === 'spanish' ? 'Siguiente ejercicio' : 'Next exercise'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Constantes para los símbolos/emojis de recompensa
  const rewardSymbols = {
    stars: [
      'https://em-content.zobj.net/thumbs/240/apple/354/glowing-star_1f31f.png',
      'https://em-content.zobj.net/thumbs/240/apple/354/star_2b50.png',
      'https://em-content.zobj.net/thumbs/240/apple/354/sparkles_2728.png'
    ],
    medals: [
      'https://em-content.zobj.net/thumbs/240/apple/354/1st-place-medal_1f947.png',
      'https://em-content.zobj.net/thumbs/240/apple/354/2nd-place-medal_1f948.png',
      'https://em-content.zobj.net/thumbs/240/apple/354/sports-medal_1f3c5.png'
    ],
    trophies: [
      'https://em-content.zobj.net/thumbs/240/apple/354/trophy_1f3c6.png',
      'https://em-content.zobj.net/thumbs/240/apple/354/crown_1f451.png',
      'https://em-content.zobj.net/thumbs/240/apple/354/gem-stone_1f48e.png'
    ]
  };
  
  // Funciones para obtener descripciones del nivel de dificultad
  const getDifficultyDescription = () => {
    switch (settings.difficulty) {
      case 'beginner':
        return selectedLanguage === 'spanish' 
          ? 'Nivel básico para aprender las letras y sus representaciones' 
          : 'Basic level to learn letters and their representations';
      case 'elementary':
        return selectedLanguage === 'spanish' 
          ? 'Empareja letras con palabras que comienzan con ellas' 
          : 'Match letters with words that start with them';
      case 'intermediate':
        return selectedLanguage === 'spanish' 
          ? 'Selecciona la letra correcta para cada imagen mostrada' 
          : 'Select the correct letter for each shown image';
      case 'advanced':
        return selectedLanguage === 'spanish' 
          ? 'Ordena las letras del alfabeto correctamente' 
          : 'Arrange the letters of the alphabet correctly';
      case 'expert':
        return selectedLanguage === 'spanish' 
          ? 'Identifica las letras antes y después en el alfabeto' 
          : 'Identify the letters before and after in the alphabet';
      default:
        return selectedLanguage === 'spanish' 
          ? 'Practica reconociendo letras y palabras' 
          : 'Practice recognizing letters and words';
    }
  };
  
  // Obtener texto del nivel de dificultad
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
  
  // Renderizar contenido del ejercicio
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
                  textNode.className = 'text-6xl';
                  textNode.textContent = rewardType === 'stars' ? '⭐' : rewardType === 'medals' ? '🏅' : '🏆';
                  parentElement.appendChild(textNode);
                }
              }}
            />
          </div>
          
          <div className="text-2xl font-bold mb-2 text-center bg-gradient-to-r from-yellow-500 to-red-500 text-transparent bg-clip-text">
            {selectedLanguage === 'spanish' ? '¡Felicitaciones!' : 'Congratulations!'}
          </div>
          
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
        
        {/* Renderizar contenido según el nivel de dificultad */}
        {settings.difficulty === 'beginner' && currentExercise && 'letter' in currentExercise 
          ? renderBeginnerExercise(currentExercise as LetterToImageExercise)
          : settings.difficulty === 'elementary' && currentExercise && 'letter' in currentExercise
          ? renderElementaryExercise(currentExercise as LetterToImageExercise)
          : settings.difficulty === 'intermediate' && currentExercise && 'image' in currentExercise
          ? renderIntermediateExercise(currentExercise as ImageToLetterExercise)
          : settings.difficulty === 'advanced' && currentExercise && 'letters' in currentExercise
          ? renderAdvancedExercise(currentExercise as DragAndDropExercise)
          : settings.difficulty === 'expert' && currentExercise && 'currentLetter' in currentExercise
          ? renderExpertExercise(currentExercise as SequenceRelationsExercise)
          : currentExercise && 'letter' in currentExercise
          ? renderBeginnerExercise(currentExercise as LetterToImageExercise)
          : currentExercise && 'image' in currentExercise
          ? renderIntermediateExercise(currentExercise as ImageToLetterExercise)
          : <div>Cargando ejercicio...</div>}
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