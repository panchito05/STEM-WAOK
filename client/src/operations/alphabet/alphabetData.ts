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
        <!-- Apple for English -->
        <g id="apple">
          <circle cx="50" cy="40" r="25" fill="#ff6b6b" stroke="#d63031" stroke-width="2"/>
          <ellipse cx="45" cy="35" rx="3" ry="6" fill="#ffffff" opacity="0.8"/>
          <path d="M50 15 Q55 10 60 15 Q58 20 55 18 Q52 16 50 15" fill="#27ae60" stroke="#229954" stroke-width="1"/>
          <path d="M55 18 Q60 22 58 25" fill="none" stroke="#27ae60" stroke-width="2" stroke-linecap="round"/>
        </g>
        <!-- Airplane for Spanish -->
        <g id="airplane" style="display: none;">
          <ellipse cx="50" cy="50" rx="30" ry="8" fill="#74b9ff"/>
          <ellipse cx="30" cy="45" rx="12" ry="4" fill="#74b9ff"/>
          <ellipse cx="70" cy="55" rx="12" ry="4" fill="#74b9ff"/>
          <path d="M20 50 L10 45 L15 50 L10 55 Z" fill="#74b9ff"/>
          <circle cx="45" cy="48" r="3" fill="#2d3436"/>
          <circle cx="55" cy="52" r="3" fill="#2d3436"/>
          <ellipse cx="50" cy="35" rx="15" ry="3" fill="#95a5a6"/>
          <ellipse cx="50" cy="65" rx="15" ry="3" fill="#95a5a6"/>
        </g>
      </svg>`,
      alt: {
        english: 'A red apple with a green leaf',
        spanish: 'Un avión azul volando'
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
  },
  {
    id: 'F',
    letter: 'F',
    lowercase: 'f',
    word: {
      english: 'Fish',
      spanish: 'Foca'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="50" rx="30" ry="15" fill="#3498db"/>
        <path d="M80 50 L90 40 L90 45 L85 50 L90 55 L90 60 Z" fill="#3498db"/>
        <circle cx="40" cy="45" r="3" fill="#2d3436"/>
        <path d="M30 35 Q35 30 40 35 Q35 40 30 35" fill="#e74c3c"/>
        <ellipse cx="45" cy="60" rx="8" ry="4" fill="#2ecc71"/>
        <ellipse cx="55" cy="65" rx="6" ry="3" fill="#2ecc71"/>
        <path d="M20 50 Q15 45 10 50 Q15 55 20 50" fill="#3498db"/>
      </svg>`,
      alt: {
        english: 'A blue fish swimming',
        spanish: 'Un pez azul nadando'
      }
    },
    color: '#3498db',
    pronunciation: {
      english: 'EF',
      spanish: 'EH-feh'
    }
  },
  {
    id: 'G',
    letter: 'G',
    lowercase: 'g',
    word: {
      english: 'Giraffe',
      spanish: 'Gato'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="70" rx="15" ry="10" fill="#f39c12"/>
        <rect x="45" y="20" width="10" height="50" fill="#f39c12"/>
        <ellipse cx="50" cy="15" rx="8" ry="6" fill="#f39c12"/>
        <ellipse cx="45" cy="25" rx="2" ry="3" fill="#8b4513"/>
        <ellipse cx="55" cy="25" rx="2" ry="3" fill="#8b4513"/>
        <circle cx="47" cy="13" r="1" fill="#2d3436"/>
        <circle cx="53" cy="13" r="1" fill="#2d3436"/>
        <ellipse cx="35" cy="75" rx="4" ry="8" fill="#f39c12"/>
        <ellipse cx="45" cy="75" rx="4" ry="8" fill="#f39c12"/>
        <ellipse cx="55" cy="75" rx="4" ry="8" fill="#f39c12"/>
        <ellipse cx="65" cy="75" rx="4" ry="8" fill="#f39c12"/>
      </svg>`,
      alt: {
        english: 'A tall orange giraffe',
        spanish: 'Una jirafa naranja alta'
      }
    },
    color: '#f39c12',
    pronunciation: {
      english: 'JEE',
      spanish: 'HEH'
    }
  },
  {
    id: 'H',
    letter: 'H',
    lowercase: 'h',
    word: {
      english: 'Horse',
      spanish: 'Hormiga'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="20" ry="15" fill="#8b4513"/>
        <ellipse cx="35" cy="40" rx="10" ry="12" fill="#8b4513"/>
        <path d="M30 25 Q25 20 30 15 Q35 20 40 25 Q35 30 30 25" fill="#654321"/>
        <circle cx="32" cy="38" r="2" fill="#2d3436"/>
        <ellipse cx="30" cy="42" rx="2" ry="1" fill="#2d3436"/>
        <ellipse cx="40" cy="70" rx="3" ry="8" fill="#8b4513"/>
        <ellipse cx="50" cy="70" rx="3" ry="8" fill="#8b4513"/>
        <ellipse cx="60" cy="70" rx="3" ry="8" fill="#8b4513"/>
        <ellipse cx="70" cy="70" rx="3" ry="8" fill="#8b4513"/>
        <ellipse cx="70" cy="50" rx="8" ry="4" fill="#654321"/>
      </svg>`,
      alt: {
        english: 'A brown horse with mane',
        spanish: 'Un caballo marrón con melena'
      }
    },
    color: '#8b4513',
    pronunciation: {
      english: 'AYTCH',
      spanish: 'AH-cheh'
    }
  },
  {
    id: 'I',
    letter: 'I',
    lowercase: 'i',
    word: {
      english: 'Ice Cream',
      spanish: 'Iguana'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 60 L50 80 L60 60 Z" fill="#d2691e"/>
        <circle cx="50" cy="50" r="15" fill="#ffc0cb"/>
        <circle cx="50" cy="35" r="12" fill="#ffb6c1"/>
        <circle cx="50" cy="22" r="10" fill="#ff69b4"/>
        <ellipse cx="45" cy="45" rx="2" ry="4" fill="#ff1493"/>
        <ellipse cx="55" cy="40" rx="2" ry="3" fill="#ff1493"/>
        <ellipse cx="48" cy="25" rx="1" ry="2" fill="#dc143c"/>
        <circle cx="50" cy="15" r="2" fill="#dc143c"/>
      </svg>`,
      alt: {
        english: 'A pink ice cream cone',
        spanish: 'Un helado rosado en cono'
      }
    },
    color: '#ff69b4',
    pronunciation: {
      english: 'AY',
      spanish: 'EE'
    }
  },
  {
    id: 'J',
    letter: 'J',
    lowercase: 'j',
    word: {
      english: 'Jellyfish',
      spanish: 'Jirafa'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="35" rx="20" ry="12" fill="#9b59b6"/>
        <path d="M35 45 Q30 60 35 70" stroke="#9b59b6" stroke-width="3" fill="none"/>
        <path d="M45 45 Q40 65 45 75" stroke="#9b59b6" stroke-width="3" fill="none"/>
        <path d="M55" cy="45 Q60 65 55 75" stroke="#9b59b6" stroke-width="3" fill="none"/>
        <path d="M65 45 Q70 60 65 70" stroke="#9b59b6" stroke-width="3" fill="none"/>
        <ellipse cx="45" cy="30" rx="3" ry="2" fill="#8e44ad" opacity="0.7"/>
        <ellipse cx="55" cy="32" rx="2" ry="2" fill="#8e44ad" opacity="0.7"/>
        <ellipse cx="50" cy="28" rx="2" ry="1" fill="#ffffff" opacity="0.8"/>
      </svg>`,
      alt: {
        english: 'A purple jellyfish floating',
        spanish: 'Una medusa púrpura flotando'
      }
    },
    color: '#9b59b6',
    pronunciation: {
      english: 'JAY',
      spanish: 'HOH-tah'
    }
  },
  {
    id: 'K',
    letter: 'K',
    lowercase: 'k',
    word: {
      english: 'Kite',
      spanish: 'Koala'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 20 L30 40 L50 50 L70 40 Z" fill="#e74c3c"/>
        <path d="M50 50 L45 55 L50 60 L55 55 Z" fill="#3498db"/>
        <line x1="50" y1="60" x2="50" y2="80" stroke="#2d3436" stroke-width="2"/>
        <path d="M50 75 L45 80 L50 85 Z" fill="#f39c12"/>
        <path d="M50 80 L55 85 L50 90 Z" fill="#2ecc71"/>
        <circle cx="50" cy="30" r="3" fill="#ffffff" opacity="0.8"/>
        <circle cx="40" cy="35" r="2" fill="#ffffff" opacity="0.6"/>
        <circle cx="60" cy="35" r="2" fill="#ffffff" opacity="0.6"/>
      </svg>`,
      alt: {
        english: 'A colorful diamond kite',
        spanish: 'Una cometa colorida en forma de diamante'
      }
    },
    color: '#e74c3c',
    pronunciation: {
      english: 'KAY',
      spanish: 'KAH'
    }
  },
  {
    id: 'L',
    letter: 'L',
    lowercase: 'l',
    word: {
      english: 'Lion',
      spanish: 'León'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="45" r="18" fill="#f39c12"/>
        <circle cx="35" cy="35" r="6" fill="#e67e22"/>
        <circle cx="65" cy="35" r="6" fill="#e67e22"/>
        <circle cx="30" cy="45" r="5" fill="#e67e22"/>
        <circle cx="70" cy="45" r="5" fill="#e67e22"/>
        <circle cx="35" cy="55" r="5" fill="#e67e22"/>
        <circle cx="65" cy="55" r="5" fill="#e67e22"/>
        <circle cx="45" cy="42" r="2" fill="#2d3436"/>
        <circle cx="55" cy="42" r="2" fill="#2d3436"/>
        <ellipse cx="50" cy="48" rx="2" ry="3" fill="#2d3436"/>
        <path d="M45 52 Q50 56 55 52" stroke="#2d3436" stroke-width="2" fill="none"/>
        <ellipse cx="50" cy="70" rx="12" ry="8" fill="#f39c12"/>
      </svg>`,
      alt: {
        english: 'A golden lion with mane',
        spanish: 'Un león dorado con melena'
      }
    },
    color: '#f39c12',
    pronunciation: {
      english: 'EL',
      spanish: 'EH-leh'
    }
  },
  {
    id: 'M',
    letter: 'M',
    lowercase: 'm',
    word: {
      english: 'Mouse',
      spanish: 'Mono'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="15" ry="12" fill="#95a5a6"/>
        <circle cx="35" cy="45" r="8" fill="#95a5a6"/>
        <circle cx="30" cy="40" r="4" fill="#ecf0f1"/>
        <circle cx="38" cy="40" r="4" fill="#ecf0f1"/>
        <circle cx="32" cy="42" r="1" fill="#2d3436"/>
        <circle cx="36" cy="42" r="1" fill="#2d3436"/>
        <ellipse cx="34" cy="45" rx="1" ry="2" fill="#e74c3c"/>
        <path d="M65 55 Q75 50 85 55 Q80 60 75 58 Q70 60 65 55" fill="#95a5a6"/>
        <ellipse cx="45" cy="70" rx="3" ry="6" fill="#95a5a6"/>
        <ellipse cx="55" cy="70" rx="3" ry="6" fill="#95a5a6"/>
        <ellipse cx="40" cy="70" rx="2" ry="5" fill="#95a5a6"/>
        <ellipse cx="60" cy="70" rx="2" ry="5" fill="#95a5a6"/>
      </svg>`,
      alt: {
        english: 'A gray mouse with long tail',
        spanish: 'Un ratón gris con cola larga'
      }
    },
    color: '#95a5a6',
    pronunciation: {
      english: 'EM',
      spanish: 'EH-meh'
    }
  },
  {
    id: 'N',
    letter: 'N',
    lowercase: 'n',
    word: {
      english: 'Nest',
      spanish: 'Nido'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="60" rx="25" ry="15" fill="#8b4513"/>
        <ellipse cx="50" cy="55" rx="20" ry="10" fill="#d2b48c"/>
        <circle cx="45" cy="50" r="4" fill="#ffffff"/>
        <circle cx="55" cy="52" r="4" fill="#ffffff"/>
        <circle cx="50" cy="48" r="4" fill="#ffffff"/>
        <circle cx="45" cy="50" r="3" fill="#f0e68c"/>
        <circle cx="55" cy="52" r="3" fill="#f0e68c"/>
        <circle cx="50" cy="48" r="3" fill="#f0e68c"/>
        <ellipse cx="40" cy="65" rx="8" ry="4" fill="#228b22"/>
        <ellipse cx="60" cy="67" rx="6" ry="3" fill="#228b22"/>
        <ellipse cx="50" cy="70" rx="5" ry="2" fill="#228b22"/>
      </svg>`,
      alt: {
        english: 'A brown nest with white eggs',
        spanish: 'Un nido marrón con huevos blancos'
      }
    },
    color: '#8b4513',
    pronunciation: {
      english: 'EN',
      spanish: 'EH-neh'
    }
  },
  {
    id: 'O',
    letter: 'O',
    lowercase: 'o',
    word: {
      english: 'Octopus',
      spanish: 'Oso'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="40" r="20" fill="#e67e22"/>
        <circle cx="45" cy="35" r="3" fill="#2d3436"/>
        <circle cx="55" cy="35" r="3" fill="#2d3436"/>
        <path d="M35 55 Q30 70 35 80" stroke="#e67e22" stroke-width="4" fill="none"/>
        <path d="M42 55 Q35 75 40 85" stroke="#e67e22" stroke-width="4" fill="none"/>
        <path d="M50 55 Q45 80 50 90" stroke="#e67e22" stroke-width="4" fill="none"/>
        <path d="M58 55 Q65 75 60 85" stroke="#e67e22" stroke-width="4" fill="none"/>
        <path d="M65 55 Q70 70 65 80" stroke="#e67e22" stroke-width="4" fill="none"/>
        <circle cx="32" cy="75" r="2" fill="#d35400"/>
        <circle cx="38" cy="80" r="2" fill="#d35400"/>
        <circle cx="48" cy="85" r="2" fill="#d35400"/>
        <circle cx="58" cy="80" r="2" fill="#d35400"/>
        <circle cx="68" cy="75" r="2" fill="#d35400"/>
      </svg>`,
      alt: {
        english: 'An orange octopus with tentacles',
        spanish: 'Un pulpo naranja con tentáculos'
      }
    },
    color: '#e67e22',
    pronunciation: {
      english: 'OH',
      spanish: 'OH'
    }
  },
  {
    id: 'P',
    letter: 'P',
    lowercase: 'p',
    word: {
      english: 'Penguin',
      spanish: 'Pato'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="18" ry="25" fill="#2d3436"/>
        <ellipse cx="50" cy="55" rx="12" ry="20" fill="#ffffff"/>
        <circle cx="50" cy="30" r="12" fill="#2d3436"/>
        <circle cx="50" cy="30" r="8" fill="#ffffff"/>
        <circle cx="47" cy="28" r="2" fill="#2d3436"/>
        <circle cx="53" cy="28" r="2" fill="#2d3436"/>
        <path d="M50 32 L48 35 L52 35 Z" fill="#f39c12"/>
        <ellipse cx="35" cy="50" rx="5" ry="12" fill="#2d3436"/>
        <ellipse cx="65" cy="50" rx="5" ry="12" fill="#2d3436"/>
        <ellipse cx="45" cy="75" rx="4" ry="6" fill="#f39c12"/>
        <ellipse cx="55" cy="75" rx="4" ry="6" fill="#f39c12"/>
      </svg>`,
      alt: {
        english: 'A black and white penguin',
        spanish: 'Un pingüino blanco y negro'
      }
    },
    color: '#2d3436',
    pronunciation: {
      english: 'PEE',
      spanish: 'PEH'
    }
  },
  {
    id: 'Q',
    letter: 'Q',
    lowercase: 'q',
    word: {
      english: 'Queen',
      spanish: 'Queso'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="45" r="15" fill="#ffc0cb"/>
        <path d="M35 30 Q40 25 45 30 Q50 25 55 30 Q60 25 65 30" fill="#ffd700"/>
        <circle cx="38" cy="32" r="2" fill="#ff69b4"/>
        <circle cx="50" cy="30" r="2" fill="#ff69b4"/>
        <circle cx="62" cy="32" r="2" fill="#ff69b4"/>
        <circle cx="47" cy="42" r="2" fill="#2d3436"/>
        <circle cx="53" cy="42" r="2" fill="#2d3436"/>
        <path d="M47 48 Q50 52 53 48" stroke="#e74c3c" stroke-width="2" fill="none"/>
        <rect x="40" y="60" width="20" height="15" fill="#9b59b6"/>
        <rect x="43" y="63" width="14" height="9" fill="#8e44ad"/>
        <ellipse cx="50" cy="75" rx="12" ry="8" fill="#9b59b6"/>
      </svg>`,
      alt: {
        english: 'A queen with golden crown',
        spanish: 'Una reina con corona dorada'
      }
    },
    color: '#9b59b6',
    pronunciation: {
      english: 'KYOO',
      spanish: 'KOO'
    }
  },
  {
    id: 'R',
    letter: 'R',
    lowercase: 'r',
    word: {
      english: 'Rabbit',
      spanish: 'Ratón'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="15" ry="18" fill="#ffffff"/>
        <circle cx="50" cy="35" r="10" fill="#ffffff"/>
        <ellipse cx="45" cy="20" rx="3" ry="12" fill="#ffffff"/>
        <ellipse cx="55" cy="20" rx="3" ry="12" fill="#ffffff"/>
        <ellipse cx="45" cy="22" rx="1" ry="8" fill="#ffc0cb"/>
        <ellipse cx="55" cy="22" rx="1" ry="8" fill="#ffc0cb"/>
        <circle cx="47" cy="32" r="1" fill="#2d3436"/>
        <circle cx="53" cy="32" r="1" fill="#2d3436"/>
        <ellipse cx="50" cy="36" rx="1" ry="2" fill="#e74c3c"/>
        <path d="M47 38 Q50 40 53 38" stroke="#2d3436" stroke-width="1" fill="none"/>
        <ellipse cx="45" cy="70" rx="4" ry="6" fill="#ffffff"/>
        <ellipse cx="55" cy="70" rx="4" ry="6" fill="#ffffff"/>
        <circle cx="70" cy="60" r="4" fill="#ffffff"/>
      </svg>`,
      alt: {
        english: 'A white rabbit with long ears',
        spanish: 'Un conejo blanco con orejas largas'
      }
    },
    color: '#ffffff',
    pronunciation: {
      english: 'AR',
      spanish: 'EH-rreh'
    }
  },
  {
    id: 'S',
    letter: 'S',
    lowercase: 's',
    word: {
      english: 'Snake',
      spanish: 'Sol'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 30 Q30 20 40 30 Q50 40 60 30 Q70 20 80 30 Q75 40 70 50 Q60 60 50 50 Q40 40 30 50 Q25 60 20 70" stroke="#27ae60" stroke-width="8" fill="none"/>
        <circle cx="80" cy="30" r="5" fill="#27ae60"/>
        <circle cx="78" cy="28" r="1" fill="#2d3436"/>
        <circle cx="82" cy="28" r="1" fill="#2d3436"/>
        <path d="M80 32 L85 30 L85 34 Z" fill="#e74c3c"/>
        <ellipse cx="35" cy="35" rx="2" ry="3" fill="#f1c40f"/>
        <ellipse cx="55" cy="45" rx="2" ry="3" fill="#f1c40f"/>
        <ellipse cx="45" cy="55" rx="2" ry="3" fill="#f1c40f"/>
        <ellipse cx="25" cy="65" rx="2" ry="3" fill="#f1c40f"/>
      </svg>`,
      alt: {
        english: 'A green snake with yellow spots',
        spanish: 'Una serpiente verde con manchas amarillas'
      }
    },
    color: '#27ae60',
    pronunciation: {
      english: 'ES',
      spanish: 'EH-seh'
    }
  },
  {
    id: 'T',
    letter: 'T',
    lowercase: 't',
    word: {
      english: 'Tree',
      spanish: 'Tigre'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="45" y="40" width="10" height="40" fill="#8b4513"/>
        <circle cx="50" cy="30" r="18" fill="#27ae60"/>
        <circle cx="35" cy="25" r="10" fill="#27ae60"/>
        <circle cx="65" cy="25" r="10" fill="#27ae60"/>
        <circle cx="30" cy="35" r="8" fill="#27ae60"/>
        <circle cx="70" cy="35" r="8" fill="#27ae60"/>
        <circle cx="50" cy="15" r="12" fill="#27ae60"/>
        <ellipse cx="40" cy="22" rx="3" ry="6" fill="#228b22"/>
        <ellipse cx="60" cy="22" rx="3" ry="6" fill="#228b22"/>
        <ellipse cx="50" cy="25" rx="4" ry="8" fill="#228b22"/>
        <ellipse cx="35" cy="32" rx="2" ry="4" fill="#228b22"/>
        <ellipse cx="65" cy="32" rx="2" ry="4" fill="#228b22"/>
      </svg>`,
      alt: {
        english: 'A green tree with brown trunk',
        spanish: 'Un árbol verde con tronco marrón'
      }
    },
    color: '#27ae60',
    pronunciation: {
      english: 'TEE',
      spanish: 'TEH'
    }
  },
  {
    id: 'U',
    letter: 'U',
    lowercase: 'u',
    word: {
      english: 'Umbrella',
      spanish: 'Uva'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 40 Q50 20 80 40" stroke="#e74c3c" stroke-width="6" fill="none"/>
        <path d="M25 40 Q50 25 75 40" stroke="#ffffff" stroke-width="2" fill="none"/>
        <line x1="50" y1="40" x2="50" y2="75" stroke="#8b4513" stroke-width="3"/>
        <path d="M50 75 Q55 80 60 75" stroke="#8b4513" stroke-width="3" fill="none"/>
        <ellipse cx="30" cy="38" rx="3" ry="8" fill="#f39c12"/>
        <ellipse cx="40" cy="35" rx="3" ry="8" fill="#3498db"/>
        <ellipse cx="50" cy="34" rx="3" ry="8" fill="#2ecc71"/>
        <ellipse cx="60" cy="35" rx="3" ry="8" fill="#9b59b6"/>
        <ellipse cx="70" cy="38" rx="3" ry="8" fill="#e67e22"/>
      </svg>`,
      alt: {
        english: 'A colorful umbrella with handle',
        spanish: 'Un paraguas colorido con mango'
      }
    },
    color: '#e74c3c',
    pronunciation: {
      english: 'YOO',
      spanish: 'OO'
    }
  },
  {
    id: 'V',
    letter: 'V',
    lowercase: 'v',
    word: {
      english: 'Violin',
      spanish: 'Vaca'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="45" cy="50" rx="12" ry="20" fill="#8b4513"/>
        <ellipse cx="45" cy="50" rx="8" ry="16" fill="#d2691e"/>
        <path d="M35 40 Q40 35 45 40" stroke="#2d3436" stroke-width="1" fill="none"/>
        <path d="M35 60 Q40 65 45 60" stroke="#2d3436" stroke-width="1" fill="none"/>
        <rect x="55" y="30" width="3" height="40" fill="#654321"/>
        <line x1="40" y1="35" x2="40" y2="65" stroke="#2d3436" stroke-width="1"/>
        <line x1="42" y1="35" x2="42" y2="65" stroke="#2d3436" stroke-width="1"/>
        <line x1="44" y1="35" x2="44" y2="65" stroke="#2d3436" stroke-width="1"/>
        <line x1="46" y1="35" x2="46" y2="65" stroke="#2d3436" stroke-width="1"/>
        <circle cx="57" cy="25" r="2" fill="#654321"/>
        <rect x="60" y="45" width="20" height="2" fill="#f4f4f4"/>
      </svg>`,
      alt: {
        english: 'A brown violin with bow',
        spanish: 'Un violín marrón con arco'
      }
    },
    color: '#8b4513',
    pronunciation: {
      english: 'VEE',
      spanish: 'VEH'
    }
  },
  {
    id: 'W',
    letter: 'W',
    lowercase: 'w',
    word: {
      english: 'Whale',
      spanish: 'Wafle'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="50" rx="35" ry="15" fill="#4682b4"/>
        <ellipse cx="20" cy="50" rx="12" ry="8" fill="#4682b4"/>
        <circle cx="25" cy="45" r="2" fill="#2d3436"/>
        <path d="M15 40 Q10 35 15 30 Q20 35 25 40" fill="#4682b4"/>
        <ellipse cx="80" cy="50" rx="8" ry="12" fill="#4682b4"/>
        <path d="M35 35 Q40 25 45 35" stroke="#87ceeb" stroke-width="3" fill="none"/>
        <path d="M55 35 Q60 25 65 35" stroke="#87ceeb" stroke-width="3" fill="none"/>
        <ellipse cx="50" cy="60" rx="15" ry="6" fill="#5f9ea0"/>
        <path d="M70 55 Q75 50 80 55 Q75 60 70 55" fill="#4682b4"/>
      </svg>`,
      alt: {
        english: 'A blue whale spouting water',
        spanish: 'Una ballena azul expulsando agua'
      }
    },
    color: '#4682b4',
    pronunciation: {
      english: 'DOUBLE-YOO',
      spanish: 'DOH-bleh VEH'
    }
  },
  {
    id: 'X',
    letter: 'X',
    lowercase: 'x',
    word: {
      english: 'Xylophone',
      spanish: 'Xilófono'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="45" width="60" height="10" fill="#8b4513"/>
        <rect x="25" y="35" width="8" height="30" fill="#e74c3c"/>
        <rect x="35" y="35" width="8" height="30" fill="#f39c12"/>
        <rect x="45" y="35" width="8" height="30" fill="#2ecc71"/>
        <rect x="55" y="35" width="8" height="30" fill="#3498db"/>
        <rect x="65" y="35" width="8" height="30" fill="#9b59b6"/>
        <circle cx="30" cy="25" r="3" fill="#f4f4f4"/>
        <circle cx="70" cy="25" r="3" fill="#f4f4f4"/>
        <rect x="28" y="22" width="4" height="15" fill="#654321"/>
        <rect x="68" y="22" width="4" height="15" fill="#654321"/>
        <ellipse cx="15" cy="50" rx="3" ry="8" fill="#8b4513"/>
        <ellipse cx="85" cy="50" rx="3" ry="8" fill="#8b4513"/>
      </svg>`,
      alt: {
        english: 'A colorful xylophone with mallets',
        spanish: 'Un xilófono colorido con baquetas'
      }
    },
    color: '#f39c12',
    pronunciation: {
      english: 'EKS',
      spanish: 'EH-kees'
    }
  },
  {
    id: 'Y',
    letter: 'Y',
    lowercase: 'y',
    word: {
      english: 'Yak',
      spanish: 'Yate'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="20" ry="15" fill="#8b4513"/>
        <ellipse cx="40" cy="40" rx="8" ry="10" fill="#8b4513"/>
        <path d="M30 30 Q25 25 30 20 Q35 25 40 30" fill="#654321"/>
        <path d="M50 30 Q55 25 60 30" fill="#654321"/>
        <circle cx="38" cy="38" r="2" fill="#2d3436"/>
        <ellipse cx="35" cy="42" rx="2" ry="1" fill="#2d3436"/>
        <ellipse cx="40" cy="70" rx="4" ry="8" fill="#8b4513"/>
        <ellipse cx="50" cy="70" rx="4" ry="8" fill="#8b4513"/>
        <ellipse cx="60" cy="70" rx="4" ry="8" fill="#8b4513"/>
        <ellipse cx="70" cy="70" rx="4" ry="8" fill="#8b4513"/>
        <path d="M20 45 Q15 40 20 35 Q25 40 30 45" fill="#654321"/>
        <path d="M70 45 Q75 40 80 45 Q75 50 70 45" fill="#654321"/>
      </svg>`,
      alt: {
        english: 'A brown yak with shaggy fur',
        spanish: 'Un yak marrón con pelaje abundante'
      }
    },
    color: '#8b4513',
    pronunciation: {
      english: 'WHY',
      spanish: 'EE gree-EH-gah'
    }
  },
  {
    id: 'Z',
    letter: 'Z',
    lowercase: 'z',
    word: {
      english: 'Zebra',
      spanish: 'Zapato'
    },
    image: {
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="20" ry="15" fill="#ffffff"/>
        <ellipse cx="35" cy="45" rx="8" ry="10" fill="#ffffff"/>
        <ellipse cx="35" cy="45" rx="6" ry="8" fill="#2d3436"/>
        <ellipse cx="50" cy="55" rx="18" ry="13" fill="#2d3436"/>
        <rect x="32" y="40" width="20" height="2" fill="#ffffff"/>
        <rect x="32" y="45" width="20" height="2" fill="#ffffff"/>
        <rect x="32" y="50" width="20" height="2" fill="#ffffff"/>
        <rect x="32" y="55" width="20" height="2" fill="#ffffff"/>
        <rect x="32" y="60" width="20" height="2" fill="#ffffff"/>
        <circle cx="32" cy="42" r="1" fill="#2d3436"/>
        <ellipse cx="30" cy="45" rx="1" ry="2" fill="#2d3436"/>
        <ellipse cx="40" cy="70" rx="4" ry="8" fill="#2d3436"/>
        <ellipse cx="50" cy="70" rx="4" ry="8" fill="#2d3436"/>
        <ellipse cx="60" cy="70" rx="4" ry="8" fill="#2d3436"/>
        <ellipse cx="70" cy="70" rx="4" ry="8" fill="#2d3436"/>
        <path d="M70 50 Q75 45 80 50 Q75 55 70 50" fill="#2d3436"/>
      </svg>`,
      alt: {
        english: 'A black and white striped zebra',
        spanish: 'Una cebra con rayas blancas y negras'
      }
    },
    color: '#2d3436',
    pronunciation: {
      english: 'ZEE',
      spanish: 'SEH-tah'
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