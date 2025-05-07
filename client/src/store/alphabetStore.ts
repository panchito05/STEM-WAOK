// Alphabet module store using Zustand
import { create } from 'zustand';
import { shuffleArray } from '../lib/utils';
import { englishAlphabet, spanishAlphabet } from '../operations/alphabet/data';

// Define el tipo de datos para una letra
export interface Letter {
  uppercase: string;
  lowercase: string;
  word: string;
  image: string;
  id: string;
}

// Define los tipos de ejercicios disponibles
export type ExerciseType = 'basic' | 'matching' | 'quiz' | 'ordering' | 'adjacentLetters' | 'mixed';

// Define el estado del store
interface AlphabetState {
  // Estado actual del ejercicio
  currentIndex: number;
  showDetails: boolean;
  isCorrect: boolean | null;
  selectedOption: Letter | null;
  correctStreak: number;
  score: number;
  attempts: number;
  showReward: boolean;
  exerciseType: ExerciseType;
  
  // Variables para el modo quiz
  quizOptions: Letter[];
  quizCorrectLetter: Letter | null;
  
  // Variables para el modo matching
  matchingImage: string;
  matchingOptions: Letter[];
  matchingSelection: Letter | null;
  
  // Variables para el modo de ordenamiento
  lettersToOrder: {letter: string, id: string}[];
  
  // Variables para el modo de letras adyacentes
  adjacentInputs: { before: string, after: string };
  adjacentResults: { before: boolean, after: boolean };
  
  // Acciones
  setCurrentIndex: (index: number) => void;
  setExerciseType: (type: ExerciseType) => void;
  reset: () => void;
  
  // Operaciones específicas para cada modo
  prepareQuizOptions: (language: string) => void;
  prepareMatchingOptions: (language: string) => void;
  prepareOrderingLetters: (language: string) => void;
  
  // Manejadores de interacción
  handleQuizOptionSelect: (letter: Letter) => void;
  handleMatchingSelect: (letter: Letter) => void;
  checkLetterOrder: () => void;
  checkAdjacentLetters: () => void;
  showAnswer: (exerciseType: ExerciseType, language: string) => void;
  updateAdjacentInputs: (field: 'before' | 'after', value: string) => void;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  
  // Utilidades
  toggleDetails: () => void;
  updateScoreAndRewards: (correct: boolean, enableRewards: boolean) => void;
  getCurrentLetter: (language: string) => Letter;
}

// Crea el store
export const useAlphabetStore = create<AlphabetState>((set, get) => ({
  // Estado inicial
  currentIndex: 0,
  showDetails: false,
  isCorrect: null,
  selectedOption: null,
  correctStreak: 0,
  score: 0,
  attempts: 0,
  showReward: false,
  exerciseType: 'basic',
  
  // Variables para el modo quiz
  quizOptions: [],
  quizCorrectLetter: null,
  
  // Variables para el modo matching
  matchingImage: '',
  matchingOptions: [],
  matchingSelection: null,
  
  // Variables para el modo de ordenamiento
  lettersToOrder: [],
  
  // Variables para el modo de letras adyacentes
  adjacentInputs: { before: '', after: '' },
  adjacentResults: { before: false, after: false },
  
  // Acciones
  setCurrentIndex: (index) => {
    set({ currentIndex: index });
    
    // Preparamos el ejercicio con la nueva letra
    const state = get();
    const exerciseType = state.exerciseType;
    const language = 'english'; // Default. Idealmente esto vendría de settings
    
    // Reset del estado al cambiar de letra
    state.reset();
    
    // Re-preparar el ejercicio con la nueva letra
    if (exerciseType === 'quiz') {
      state.prepareQuizOptions(language);
    } else if (exerciseType === 'matching') {
      state.prepareMatchingOptions(language);
    } else if (exerciseType === 'ordering') {
      state.prepareOrderingLetters(language);
    }
  },
  
  setExerciseType: (type) => {
    set({ exerciseType: type });
    
    // Reset y prepara el ejercicio cuando cambia el tipo
    const state = get();
    state.reset();
    
    const language = 'english'; // Default
    if (type === 'quiz') {
      state.prepareQuizOptions(language);
    } else if (type === 'matching') {
      state.prepareMatchingOptions(language);
    } else if (type === 'ordering') {
      state.prepareOrderingLetters(language);
    }
  },
  
  reset: () => set({
    showDetails: false,
    isCorrect: null,
    selectedOption: null,
    matchingSelection: null,
    adjacentInputs: { before: '', after: '' },
    adjacentResults: { before: false, after: false },
    quizCorrectLetter: null,
  }),
  
  // Obtener la letra actual
  getCurrentLetter: (language) => {
    const alphabet = language === 'spanish' ? spanishAlphabet : englishAlphabet;
    const index = get().currentIndex;
    return alphabet[index % alphabet.length];
  },
  
  // Preparar opciones para el quiz
  prepareQuizOptions: (language) => {
    const alphabet = language === 'spanish' ? spanishAlphabet : englishAlphabet;
    const currentIndex = get().currentIndex;
    
    // Usar una copia independiente de la letra actual
    const letterToUse = {...alphabet[currentIndex]};
    
    // Empezar con la respuesta correcta
    let options = [letterToUse];
    
    // Añadir tres letras aleatorias diferentes de la actual
    while (options.length < 4) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      const randomLetter = alphabet[randomIndex];
      
      if (!options.some(l => l.id === randomLetter.id)) {
        options.push(randomLetter);
      }
    }
    
    // Mezclar las opciones
    const shuffledOptions = shuffleArray([...options]);
    
    // Guardar la letra correcta y las opciones mezcladas
    set({ 
      quizCorrectLetter: letterToUse,
      quizOptions: shuffledOptions 
    });
    
    console.log("Store - Quiz correcto:", letterToUse.uppercase, letterToUse.word, letterToUse.image);
  },
  
  // Preparar opciones para matching
  prepareMatchingOptions: (language) => {
    const alphabet = language === 'spanish' ? spanishAlphabet : englishAlphabet;
    const currentLetter = alphabet[get().currentIndex];
    
    // Establecer la imagen a mostrar
    set({ matchingImage: currentLetter.image });
    
    // Obtener 7 letras aleatorias (excluyendo la actual)
    const randomLetters: Letter[] = [];
    while (randomLetters.length < 7) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      const randomLetter = alphabet[randomIndex];
      
      if (randomLetter.id !== currentLetter.id && 
          !randomLetters.some(l => l.id === randomLetter.id)) {
        randomLetters.push(randomLetter);
      }
    }
    
    // Añadir la letra actual y mezclar
    set({ matchingOptions: shuffleArray([...randomLetters, currentLetter]) });
  },
  
  // Preparar letras para ordenar
  prepareOrderingLetters: (language) => {
    const alphabet = language === 'spanish' ? spanishAlphabet : englishAlphabet;
    
    // Punto de inicio aleatorio (evitar final del alfabeto)
    const startIndex = Math.floor(Math.random() * (alphabet.length - 6));
    const letterCount = Math.floor(Math.random() * 3) + 4; // 4 a 6 letras
    
    // Obtener letras consecutivas
    const letters = alphabet.slice(startIndex, startIndex + letterCount);
    
    // Convertir al formato para drag-and-drop con IDs
    const lettersWithIds = letters.map((letter, i) => ({
      letter: letter.uppercase,
      id: `letter-${i}`
    }));
    
    // Mezclar y establecer
    set({ lettersToOrder: shuffleArray([...lettersWithIds]) });
  },
  
  // Manejar selección de opción en quiz
  handleQuizOptionSelect: (letter) => {
    const state = get();
    set({ selectedOption: letter });
    
    if (!state.quizCorrectLetter) {
      console.error("Error: No hay letra correcta definida para el quiz");
      return;
    }
    
    // Comprobar si la respuesta es correcta
    const isAnswerCorrect = letter.id === state.quizCorrectLetter.id;
    
    // Logging para debugger
    console.log("Store - Quiz seleccionado:", letter.uppercase, letter.word);
    console.log("Store - Quiz correcto:", state.quizCorrectLetter.uppercase, state.quizCorrectLetter.word);
    
    set({ 
      isCorrect: isAnswerCorrect,
      showDetails: true 
    });
    
    // Actualizar puntuación y recompensas
    state.updateScoreAndRewards(isAnswerCorrect, true); // Default enableRewards=true
  },
  
  // Manejar selección en matching
  handleMatchingSelect: (letter) => {
    const state = get();
    const language = 'english'; // Default
    const currentLetter = state.getCurrentLetter(language);
    
    set({ matchingSelection: letter });
    
    const isAnswerCorrect = letter.id === currentLetter.id;
    set({ 
      isCorrect: isAnswerCorrect,
      showDetails: true 
    });
    
    state.updateScoreAndRewards(isAnswerCorrect, true);
  },
  
  // Comprobar orden de letras
  checkLetterOrder: () => {
    const state = get();
    
    // Comparar con el orden alfabético
    const sortedLetters = [...state.lettersToOrder].sort((a, b) => 
      a.letter.localeCompare(b.letter)
    );
    
    const isOrderCorrect = state.lettersToOrder.every((letter, index) => 
      letter.letter === sortedLetters[index].letter
    );
    
    set({ 
      isCorrect: isOrderCorrect,
      showDetails: true 
    });
    
    state.updateScoreAndRewards(isOrderCorrect, true);
  },
  
  // Comprobar letras adyacentes
  checkAdjacentLetters: () => {
    const state = get();
    const language = 'english'; // Default
    const alphabet = language === 'spanish' ? spanishAlphabet : englishAlphabet;
    const currentLetter = state.getCurrentLetter(language);
    
    const currentIdx = alphabet.findIndex(l => l.id === currentLetter.id);
    let beforeCorrect = false;
    let afterCorrect = false;
    
    // Comprobar letra anterior
    if (currentIdx > 0) {
      const prevLetter = alphabet[currentIdx - 1].uppercase;
      beforeCorrect = state.adjacentInputs.before.toUpperCase() === prevLetter;
    } else {
      // Si es la primera letra, no hay "anterior"
      beforeCorrect = state.adjacentInputs.before === "";
    }
    
    // Comprobar letra siguiente
    if (currentIdx < alphabet.length - 1) {
      const nextLetter = alphabet[currentIdx + 1].uppercase;
      afterCorrect = state.adjacentInputs.after.toUpperCase() === nextLetter;
    } else {
      // Si es la última letra, no hay "siguiente"
      afterCorrect = state.adjacentInputs.after === "";
    }
    
    set({ 
      adjacentResults: { before: beforeCorrect, after: afterCorrect },
      isCorrect: beforeCorrect && afterCorrect,
      showDetails: true 
    });
    
    state.updateScoreAndRewards(beforeCorrect && afterCorrect, true);
  },
  
  // Mostrar respuesta para cada modo
  showAnswer: (exerciseType, language) => {
    const state = get();
    const alphabet = language === 'spanish' ? spanishAlphabet : englishAlphabet;
    const currentLetter = state.getCurrentLetter(language);
    
    set({ showDetails: true });
    
    switch (exerciseType) {
      case 'quiz':
        if (state.quizCorrectLetter) {
          set({ selectedOption: state.quizCorrectLetter });
        }
        break;
      case 'matching':
        set({ matchingSelection: currentLetter });
        break;
      case 'ordering':
        // Ordenar alfabéticamente
        const sortedLetters = [...state.lettersToOrder].sort((a, b) => 
          a.letter.localeCompare(b.letter)
        );
        set({ lettersToOrder: sortedLetters });
        break;
      case 'adjacentLetters':
        // Encontrar letras anterior y siguiente
        const currentIdx = alphabet.findIndex(l => l.id === currentLetter.id);
        let before = '';
        let after = '';
        
        if (currentIdx > 0) {
          before = alphabet[currentIdx - 1].uppercase;
        }
        
        if (currentIdx < alphabet.length - 1) {
          after = alphabet[currentIdx + 1].uppercase;
        }
        
        set({ 
          adjacentInputs: { before, after },
          adjacentResults: { before: true, after: true }
        });
        break;
    }
  },
  
  // Actualizar entradas de letras adyacentes
  updateAdjacentInputs: (field, value) => {
    set((state) => ({
      adjacentInputs: {
        ...state.adjacentInputs,
        [field]: value
      }
    }));
  },
  
  // Mover tarjeta (para drag and drop)
  moveCard: (dragIndex, hoverIndex) => {
    set((state) => {
      const newCards = [...state.lettersToOrder];
      const draggedItem = newCards[dragIndex];
      newCards.splice(dragIndex, 1);
      newCards.splice(hoverIndex, 0, draggedItem);
      return { lettersToOrder: newCards };
    });
  },
  
  // Alternar mostrar detalles
  toggleDetails: () => set((state) => ({ showDetails: !state.showDetails })),
  
  // Actualizar puntuación y recompensas
  updateScoreAndRewards: (correct, enableRewards) => {
    if (correct) {
      set((state) => ({ 
        score: state.score + 1,
        correctStreak: state.correctStreak + 1 
      }));
      
      // Mostrar recompensas según configuración
      if (enableRewards) {
        const state = get();
        // Probabilidad aleatoria (5%) o cada 5 respuestas correctas
        const shouldShowReward = Math.random() < 0.05 || state.correctStreak % 5 === 4;
        
        if (shouldShowReward) {
          set({ showReward: true });
          setTimeout(() => set({ showReward: false }), 2500);
        }
      }
    } else {
      set({ correctStreak: 0 });
    }
    
    set((state) => ({ attempts: state.attempts + 1 }));
  }
}));