import { AlphabetItem } from './types';

export const alphabetData: AlphabetItem[] = [
  {
    id: 'A',
    letter: 'A',
    lowercase: 'a',
    word: {
      english: 'Apple',
      spanish: 'Avión'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="40" r="25" fill="#ff6b6b" stroke="#d63031" stroke-width="2"/>
        <ellipse cx="45" cy="35" rx="3" ry="6" fill="#ffffff" opacity="0.8"/>
        <path d="M50 15 Q55 10 60 15 Q58 20 55 18 Q52 16 50 15" fill="#27ae60" stroke="#229954" stroke-width="1"/>
        <path d="M55 18 Q60 22 58 25" fill="none" stroke="#27ae60" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      alt: {
        english: 'A red apple with a green leaf',
        spanish: 'Una manzana roja con una hoja verde'
      }
    },
    color: '#ff6b6b',
    pronunciation: {
      english: 'AY',
      spanish: 'AH'
    }
  },
  {
    id: 'B',
    letter: 'B',
    lowercase: 'b',
    word: {
      english: 'Ball',
      spanish: 'Barco'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="#74b9ff" stroke="#0984e3" stroke-width="3"/>
        <path d="M30 30 Q40 25 50 30 T70 30" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <path d="M25 45 Q35 40 45 45 T65 45" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <path d="M35 60 Q45 55 55 60 T75 60" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      alt: {
        english: 'A blue ball with curved stripes',
        spanish: 'Una pelota azul con rayas curvas'
      }
    },
    color: '#74b9ff',
    pronunciation: {
      english: 'BEE',
      spanish: 'BEH'
    }
  },
  {
    id: 'C',
    letter: 'C',
    lowercase: 'c',
    word: {
      english: 'Cat',
      spanish: 'Casa'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="25" ry="20" fill="#fda085"/>
        <circle cx="40" cy="45" r="12" fill="#fda085"/>
        <path d="M35 35 L40 25 L45 35" fill="#fda085"/>
        <path d="M55 35 L60 25 L65 35" fill="#fda085"/>
        <circle cx="38" cy="42" r="2" fill="#2d3436"/>
        <circle cx="42" cy="42" r="2" fill="#2d3436"/>
        <path d="M40 46 L40 50" stroke="#2d3436" stroke-width="1"/>
        <path d="M35 48 Q40 52 45 48" fill="none" stroke="#2d3436" stroke-width="1"/>
        <ellipse cx="25" cy="60" rx="8" ry="15" fill="#fda085"/>
      </svg>`,
      alt: {
        english: 'An orange cat sitting',
        spanish: 'Un gato naranja sentado'
      }
    },
    color: '#fda085',
    pronunciation: {
      english: 'SEE',
      spanish: 'SEH'
    }
  },
  {
    id: 'D',
    letter: 'D',
    lowercase: 'd',
    word: {
      english: 'Dog',
      spanish: 'Delfín'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="55" cy="50" rx="30" ry="15" fill="#8d6e63"/>
        <circle cx="35" cy="40" r="15" fill="#8d6e63"/>
        <ellipse cx="28" cy="35" rx="4" ry="8" fill="#8d6e63"/>
        <ellipse cx="42" cy="35" rx="4" ry="8" fill="#8d6e63"/>
        <circle cx="30" cy="38" r="2" fill="#2d3436"/>
        <circle cx="40" cy="38" r="2" fill="#2d3436"/>
        <ellipse cx="35" cy="44" rx="3" ry="2" fill="#2d3436"/>
        <path d="M32 46 Q35 48 38 46" fill="none" stroke="#2d3436" stroke-width="1"/>
        <ellipse cx="85" cy="55" rx="8" ry="4" fill="#8d6e63"/>
        <rect x="45" y="60" width="4" height="15" fill="#8d6e63"/>
        <rect x="55" y="60" width="4" height="15" fill="#8d6e63"/>
        <rect x="65" y="60" width="4" height="15" fill="#8d6e63"/>
        <rect x="75" y="60" width="4" height="15" fill="#8d6e63"/>
      </svg>`,
      alt: {
        english: 'A brown dog with tail wagging',
        spanish: 'Un perro marrón moviendo la cola'
      }
    },
    color: '#8d6e63',
    pronunciation: {
      english: 'DEE',
      spanish: 'DEH'
    }
  },
  {
    id: 'E',
    letter: 'E',
    lowercase: 'e',
    word: {
      english: 'Elephant',
      spanish: 'Elefante'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="25" ry="20" fill="#95a5a6"/>
        <circle cx="45" cy="35" r="18" fill="#95a5a6"/>
        <ellipse cx="35" cy="25" rx="3" ry="6" fill="#95a5a6"/>
        <ellipse cx="55" cy="25" rx="3" ry="6" fill="#95a5a6"/>
        <circle cx="42" cy="32" r="2" fill="#2d3436"/>
        <circle cx="48" cy="32" r="2" fill="#2d3436"/>
        <ellipse cx="20" cy="45" rx="8" ry="25" fill="#95a5a6"/>
        <ellipse cx="45" cy="75" rx="6" ry="8" fill="#95a5a6"/>
        <ellipse cx="55" cy="75" rx="6" ry="8" fill="#95a5a6"/>
        <ellipse cx="35" cy="75" rx="6" ry="8" fill="#95a5a6"/>
        <ellipse cx="65" cy="75" rx="6" ry="8" fill="#95a5a6"/>
      </svg>`,
      alt: {
        english: 'A gray elephant with trunk',
        spanish: 'Un elefante gris con trompa'
      }
    },
    color: '#95a5a6',
    pronunciation: {
      english: 'EE',
      spanish: 'EH'
    }
  }
];

// Function to get complete alphabet (will expand as needed)
export const getCompleteAlphabet = (): AlphabetItem[] => {
  // For now returning first 5 letters, will expand to full 26 letters
  return alphabetData;
};

// Function to get alphabet item by letter
export const getAlphabetItem = (letter: string): AlphabetItem | undefined => {
  return alphabetData.find(item => item.letter.toLowerCase() === letter.toLowerCase());
};

// Function to get next letter
export const getNextLetter = (currentLetter: string): AlphabetItem | undefined => {
  const currentIndex = alphabetData.findIndex(item => item.letter === currentLetter);
  if (currentIndex < alphabetData.length - 1) {
    return alphabetData[currentIndex + 1];
  }
  return undefined;
};

// Function to get previous letter
export const getPreviousLetter = (currentLetter: string): AlphabetItem | undefined => {
  const currentIndex = alphabetData.findIndex(item => item.letter === currentLetter);
  if (currentIndex > 0) {
    return alphabetData[currentIndex - 1];
  }
  return undefined;
};