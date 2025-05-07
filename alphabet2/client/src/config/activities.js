/**
 * Configuración de actividades por niveles de dificultad para Alphabet Journey
 * Cada nivel tiene una actividad principal correspondiente, con estructuras de ejercicios
 * diseñadas específicamente para ese nivel de aprendizaje.
 */

export const difficultyLevels = {
  // Nivel 1: Reconocimiento básico (Beginner)
  beginner: {
    name: "Beginner",
    description: "Reconocimiento básico de letras y palabras",
    activityId: "letter-recognition",
    unlocked: true, // Siempre disponible al inicio
    example: "A → Apple 🍎",
    details: "Aprende a reconocer las letras y sus sonidos básicos a través de asociación con imágenes y palabras sencillas."
  },
  
  // Nivel 2: Emparejamiento (Elementary)
  elementary: {
    name: "Elementary",
    description: "Emparejamiento de letras con imágenes correspondientes",
    activityId: "letter-matching",
    unlocked: false, // Se desbloquea al completar el nivel Beginner
    example: "B = ? [Ball ⚽]",
    details: "Relaciona cada letra con su imagen correspondiente entre varias opciones. Refuerza el reconocimiento visual y la asociación letra-objeto."
  },
  
  // Nivel 3: Quizzes de letras (Intermediate)
  intermediate: {
    name: "Intermediate",
    description: "Quiz de letras con múltiples opciones",
    activityId: "letter-quiz",
    unlocked: false, // Se desbloquea al completar el nivel Elementary
    example: "🍌 = ? [A, C, P, R]",
    details: "Identifica qué letra inicial corresponde a cada imagen presentada. Refuerza análisis fonético y asociación de letras con sonidos iniciales."
  },
  
  // Nivel 4: Actividades de arrastrar y soltar (Advanced)
  advanced: {
    name: "Advanced",
    description: "Actividades de arrastrar y soltar (Drag & Drop)",
    activityId: "letter-ordering",
    unlocked: false, // Se desbloquea al completar el nivel Intermediate
    example: "Ordenar: A, C, B",
    details: "Ordena correctamente conjuntos de letras usando arrastrar y soltar. Refuerza el conocimiento del orden alfabético y la secuenciación."
  },
  
  // Nivel 5: Secuencias de letras (Expert)
  expert: {
    name: "Expert",
    description: "Secuencias de letras, reconocimiento de anterior y siguiente",
    activityId: "letter-sequence",
    unlocked: false, // Se desbloquea al completar el nivel Advanced
    example: "K → J y L",
    details: "Identifica qué letras van antes y después en la secuencia alfabética. Domina la secuencia completa del alfabeto y las relaciones entre letras."
  }
};

// Mapa de enlaces de actividades a componentes
export const activityComponentMap = {
  "letter-recognition": "LetterRecognition",
  "letter-matching": "LetterMatching",
  "letter-quiz": "LetterQuiz",
  "letter-ordering": "LetterOrdering",
  "letter-sequence": "LetterSequence"
};

// Imagen de ejemplo para cada letra en español e inglés
export const letterExamples = {
  english: {
    'A': { word: 'Apple', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/red-apple_1f34e.png' },
    'B': { word: 'Ball', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/soccer-ball_26bd.png' },
    'C': { word: 'Cat', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/cat-face_1f431.png' },
    'D': { word: 'Dog', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/dog-face_1f436.png' },
    'E': { word: 'Elephant', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/elephant_1f418.png' },
    'F': { word: 'Frog', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/frog_1f438.png' },
    'G': { word: 'Grapes', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/grapes_1f347.png' },
    'H': { word: 'House', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/house_1f3e0.png' },
    'I': { word: 'Ice Cream', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/ice-cream_1f368.png' },
    'J': { word: 'Jelly', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/candy_1f36c.png' },
    'K': { word: 'Kite', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/kite_1fa81.png' },
    'L': { word: 'Lion', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/lion_1f981.png' },
    'M': { word: 'Monkey', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/monkey-face_1f435.png' },
    'N': { word: 'Nose', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/nose_1f443.png' },
    'O': { word: 'Orange', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/tangerine_1f34a.png' },
    'P': { word: 'Pear', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/pear_1f350.png' },
    'Q': { word: 'Queen', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/crown_1f451.png' },
    'R': { word: 'Rabbit', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/rabbit-face_1f430.png' },
    'S': { word: 'Sun', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/sun_2600-fe0f.png' },
    'T': { word: 'Tree', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/deciduous-tree_1f333.png' },
    'U': { word: 'Umbrella', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/umbrella_2602-fe0f.png' },
    'V': { word: 'Violin', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/violin_1f3bb.png' },
    'W': { word: 'Watch', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/watch_231a-fe0f.png' },
    'X': { word: 'X-ray', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/bone_1f9b4.png' },
    'Y': { word: 'Yarn', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/yarn_1f9f6.png' },
    'Z': { word: 'Zebra', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/zebra_1f993.png' }
  },
  spanish: {
    'A': { word: 'Árbol', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/deciduous-tree_1f333.png' },
    'B': { word: 'Barco', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/ship_1f6a2.png' },
    'C': { word: 'Casa', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/house_1f3e0.png' },
    'D': { word: 'Dedo', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/backhand-index-pointing-up_1f446.png' },
    'E': { word: 'Elefante', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/elephant_1f418.png' },
    'F': { word: 'Flor', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/tulip_1f337.png' },
    'G': { word: 'Gato', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/cat-face_1f431.png' },
    'H': { word: 'Helado', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/ice-cream_1f368.png' },
    'I': { word: 'Iglú', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/house_1f3e0.png' },
    'J': { word: 'Juguete', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/teddy-bear_1f9f8.png' },
    'K': { word: 'Kiwi', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/kiwi-fruit_1f95d.png' },
    'L': { word: 'León', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/lion_1f981.png' },
    'M': { word: 'Manzana', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/red-apple_1f34e.png' },
    'N': { word: 'Naranja', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/tangerine_1f34a.png' },
    'Ñ': { word: 'Ñandú', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/bird_1f426.png' },
    'O': { word: 'Oso', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/bear_1f43b.png' },
    'P': { word: 'Pera', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/pear_1f350.png' },
    'Q': { word: 'Queso', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/cheese-wedge_1f9c0.png' },
    'R': { word: 'Ratón', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/mouse-face_1f42d.png' },
    'S': { word: 'Sol', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/sun_2600-fe0f.png' },
    'T': { word: 'Tren', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/locomotive_1f682.png' },
    'U': { word: 'Uva', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/grapes_1f347.png' },
    'V': { word: 'Vaca', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/cow-face_1f42e.png' },
    'W': { word: 'Waffle', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/waffle_1f9c7.png' },
    'X': { word: 'Xilófono', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/musical-keyboard_1f3b9.png' },
    'Y': { word: 'Yogur', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/cup-with-straw_1f964.png' },
    'Z': { word: 'Zapato', imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/mans-shoe_1f45e.png' }
  }
};

// Palabras adicionales para cada letra (para actividades más complejas)
export const additionalWords = {
  english: {
    'A': ['Ant', 'Arrow', 'Astronaut', 'Avocado', 'Airplane'],
    'B': ['Banana', 'Bear', 'Bed', 'Book', 'Butterfly'],
    'C': ['Cake', 'Car', 'Cloud', 'Cookie', 'Crown'],
    // ...resto del alfabeto
  },
  spanish: {
    'A': ['Avión', 'Ardilla', 'Agua', 'Anillo', 'Abeja'],
    'B': ['Bebé', 'Bola', 'Bote', 'Botón', 'Banana'],
    'C': ['Cama', 'Comida', 'Carro', 'Cepillo', 'Canción'],
    // ...resto del alfabeto
  }
};

// Función utilitaria para obtener datos aleatorios para actividades
export function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Función para obtener letras adyacentes (anterior y siguiente)
export function getAdjacentLetters(letter) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const index = alphabet.indexOf(letter);
  
  return {
    previous: index > 0 ? alphabet[index - 1] : null,
    next: index < alphabet.length - 1 ? alphabet[index + 1] : null
  };
}