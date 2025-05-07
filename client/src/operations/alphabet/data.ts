export interface Letter {
  id: string;
  uppercase: string;
  lowercase: string;
  word: string;
  image: string;
}

// English alphabet with representative words and emojis
export const englishAlphabet: Letter[] = [
  { id: 'en-a', uppercase: 'A', lowercase: 'a', word: 'Apple', image: '🍎' },
  { id: 'en-b', uppercase: 'B', lowercase: 'b', word: 'Ball', image: '⚽' },
  { id: 'en-c', uppercase: 'C', lowercase: 'c', word: 'Cat', image: '🐱' },
  { id: 'en-d', uppercase: 'D', lowercase: 'd', word: 'Dog', image: '🐶' },
  { id: 'en-e', uppercase: 'E', lowercase: 'e', word: 'Elephant', image: '🐘' },
  { id: 'en-f', uppercase: 'F', lowercase: 'f', word: 'Fish', image: '🐠' },
  { id: 'en-g', uppercase: 'G', lowercase: 'g', word: 'Giraffe', image: '🦒' },
  { id: 'en-h', uppercase: 'H', lowercase: 'h', word: 'House', image: '🏠' },
  { id: 'en-i', uppercase: 'I', lowercase: 'i', word: 'Ice Cream', image: '🍦' },
  { id: 'en-j', uppercase: 'J', lowercase: 'j', word: 'Jellyfish', image: '🪼' },
  { id: 'en-k', uppercase: 'K', lowercase: 'k', word: 'Kite', image: '🪁' },
  { id: 'en-l', uppercase: 'L', lowercase: 'l', word: 'Lion', image: '🦁' },
  { id: 'en-m', uppercase: 'M', lowercase: 'm', word: 'Monkey', image: '🐵' },
  { id: 'en-n', uppercase: 'N', lowercase: 'n', word: 'Nose', image: '👃' },
  { id: 'en-o', uppercase: 'O', lowercase: 'o', word: 'Orange', image: '🍊' },
  { id: 'en-p', uppercase: 'P', lowercase: 'p', word: 'Panda', image: '🐼' },
  { id: 'en-q', uppercase: 'Q', lowercase: 'q', word: 'Queen', image: '👑' },
  { id: 'en-r', uppercase: 'R', lowercase: 'r', word: 'Rabbit', image: '🐰' },
  { id: 'en-s', uppercase: 'S', lowercase: 's', word: 'Sun', image: '☀️' },
  { id: 'en-t', uppercase: 'T', lowercase: 't', word: 'Tree', image: '🌲' },
  { id: 'en-u', uppercase: 'U', lowercase: 'u', word: 'Umbrella', image: '☂️' },
  { id: 'en-v', uppercase: 'V', lowercase: 'v', word: 'Violin', image: '🎻' },
  { id: 'en-w', uppercase: 'W', lowercase: 'w', word: 'Watermelon', image: '🍉' },
  { id: 'en-x', uppercase: 'X', lowercase: 'x', word: 'X-ray', image: '🩻' },
  { id: 'en-y', uppercase: 'Y', lowercase: 'y', word: 'Yo-yo', image: '🪀' },
  { id: 'en-z', uppercase: 'Z', lowercase: 'z', word: 'Zebra', image: '🦓' }
];

// Spanish alphabet with representative words and emojis
export const spanishAlphabet: Letter[] = [
  { id: 'es-a', uppercase: 'A', lowercase: 'a', word: 'Árbol', image: '🌳' },
  { id: 'es-b', uppercase: 'B', lowercase: 'b', word: 'Barco', image: '⛵' },
  { id: 'es-c', uppercase: 'C', lowercase: 'c', word: 'Casa', image: '🏠' },
  { id: 'es-d', uppercase: 'D', lowercase: 'd', word: 'Dedo', image: '👆' },
  { id: 'es-e', uppercase: 'E', lowercase: 'e', word: 'Elefante', image: '🐘' },
  { id: 'es-f', uppercase: 'F', lowercase: 'f', word: 'Flor', image: '🌸' },
  { id: 'es-g', uppercase: 'G', lowercase: 'g', word: 'Gato', image: '🐱' },
  { id: 'es-h', uppercase: 'H', lowercase: 'h', word: 'Helado', image: '🍦' },
  { id: 'es-i', uppercase: 'I', lowercase: 'i', word: 'Iglesia', image: '⛪' },
  { id: 'es-j', uppercase: 'J', lowercase: 'j', word: 'Juguete', image: '🧸' },
  { id: 'es-k', uppercase: 'K', lowercase: 'k', word: 'Kilo', image: '⚖️' },
  { id: 'es-l', uppercase: 'L', lowercase: 'l', word: 'Luna', image: '🌙' },
  { id: 'es-m', uppercase: 'M', lowercase: 'm', word: 'Manzana', image: '🍎' },
  { id: 'es-n', uppercase: 'N', lowercase: 'n', word: 'Nube', image: '☁️' },
  { id: 'es-ñ', uppercase: 'Ñ', lowercase: 'ñ', word: 'Ñandú', image: '🦅' },
  { id: 'es-o', uppercase: 'O', lowercase: 'o', word: 'Oso', image: '🐻' },
  { id: 'es-p', uppercase: 'P', lowercase: 'p', word: 'Pez', image: '🐠' },
  { id: 'es-q', uppercase: 'Q', lowercase: 'q', word: 'Queso', image: '🧀' },
  { id: 'es-r', uppercase: 'R', lowercase: 'r', word: 'Rosa', image: '🌹' },
  { id: 'es-s', uppercase: 'S', lowercase: 's', word: 'Sol', image: '☀️' },
  { id: 'es-t', uppercase: 'T', lowercase: 't', word: 'Tortuga', image: '🐢' },
  { id: 'es-u', uppercase: 'U', lowercase: 'u', word: 'Uva', image: '🍇' },
  { id: 'es-v', uppercase: 'V', lowercase: 'v', word: 'Vaca', image: '🐄' },
  { id: 'es-w', uppercase: 'W', lowercase: 'w', word: 'Waterpolo', image: '🤽' },
  { id: 'es-x', uppercase: 'X', lowercase: 'x', word: 'Xilófono', image: '🎵' },
  { id: 'es-y', uppercase: 'Y', lowercase: 'y', word: 'Yate', image: '🛥️' },
  { id: 'es-z', uppercase: 'Z', lowercase: 'z', word: 'Zapato', image: '👞' }
];