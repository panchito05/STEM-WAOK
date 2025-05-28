// Define los textos traducibles para la aplicación
// Las claves deben seguir una estructura jerárquica para organizar las traducciones

type TranslationKeys = {
  common: {
    settings: string;
    save: string;
    cancel: string;
    confirm: string;
    reset: string;
    prev: string;
    next: string;
    start: string;
    comingSoon: string;
  };
  exercises: {
    start: string;
    check: string;
    showAnswer: string;
    correct: string;
    incorrect: string;
    correctAnswerIs: string;
    loading: string;
    completed: string;
    score: string;
    timeTaken: string;
    tryAgain: string;
    returnHome: string;
  };
  tooltips: {
    activateShowAnswer: string;
    maxAttemptsPerProblem: string;
    autoContinue: string;
    rewardsCollected: string;
    exerciseHistory: string;
  };
  levelUp: {
    previousLevel: string;
    newLevel: string;
    adaptiveDifficultyEnabled: string;
    continue: string;
  };
  difficulty: {
    beginner: string;
    elementary: string;
    intermediate: string;
    advanced: string;
    expert: string;
  };
  settings: {
    general: string;
    appearance: string;
    accessibility: string;
    language: string;
    selectLanguage: string;
    soundEffects: string;
    immediateFeedback: string;
    darkMode: string;
    fontSize: string;
    highContrast: string;
    showSolutions: string;
    extendedTime: string;
    resetToDefault: string;
    resetConfirmation: string;
  };
  favorites: {
    add: string;
    remove: string;
  };
  modules: {
    visibility: {
      hide: string;
      restore: string;
    };
    addition: {
      name: string;
      description: string;
    };
    subtraction: {
      name: string;
      description: string;
    };
    multiplication: {
      name: string;
      description: string;
    };
    division: {
      name: string;
      description: string;
    };

  };
};

// Traducciones en inglés (idioma por defecto)
export const enTranslations: TranslationKeys = {
  common: {
    settings: "Settings",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    reset: "Reset",
    prev: "Previous",
    next: "Next",
    start: "Start",
    comingSoon: "Coming Soon"
  },
  favorites: {
    add: "Add to favorites",
    remove: "Remove from favorites"
  },
  exercises: {
    start: "Start Exercise",
    check: "Check Answer",
    showAnswer: "Show Answer",
    correct: "Correct!",
    incorrect: "Incorrect!",
    correctAnswerIs: "The correct answer is = {correctAnswer}",
    loading: "Loading problems...",
    completed: "Exercise Completed!",
    score: "Your score",
    timeTaken: "Time taken",
    tryAgain: "Try Again",
    returnHome: "Return Home",
  },
  tooltips: {
    activateShowAnswer: "To activate this option, go to Settings",
    maxAttemptsPerProblem: "Maximum attempts allowed per problem",
    autoContinue: "When checked, automatically advances to next problem after a correct answer",
    rewardsCollected: "Rewards collected",
    exerciseHistory: "Exercise history",
  },
  levelUp: {
    previousLevel: "Previous Level",
    newLevel: "New Level",
    adaptiveDifficultyEnabled: "Adaptive difficulty is enabled. Your level will change based on your performance.",
    continue: "Continue"
  },
  difficulty: {
    beginner: "Beginner",
    elementary: "Elementary",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert"
  },
  settings: {
    general: "General Settings",
    appearance: "Appearance Settings",
    accessibility: "Accessibility Settings",
    language: "Language",
    selectLanguage: "Select language",
    soundEffects: "Sound Effects",
    immediateFeedback: "Immediate Feedback",
    darkMode: "Dark Mode",
    fontSize: "Font Size",
    highContrast: "High Contrast Mode",
    showSolutions: "Show Solutions",
    extendedTime: "Extended Time",
    resetToDefault: "Reset to Default Settings",
    resetConfirmation: "This will reset all settings to default values. Are you sure?",
  },
  modules: {
    visibility: {
      hide: "Hide module",
      restore: "Restore module"
    },
    addition: {
      name: "Addition",
      description: "Practice addition with various difficulty levels"
    },
    subtraction: {
      name: "Subtraction",
      description: "Practice subtraction with various difficulty levels"
    },
    multiplication: {
      name: "Multiplication",
      description: "Practice multiplication with various difficulty levels"
    },
    division: {
      name: "Division",
      description: "Practice division with various difficulty levels"
    },

  },
};

// Traducciones en español
export const esTranslations: TranslationKeys = {
  common: {
    settings: "Configuración",
    save: "Guardar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    reset: "Restablecer",
    prev: "Anterior",
    next: "Siguiente",
    start: "Iniciar",
    comingSoon: "Próximamente"
  },
  favorites: {
    add: "Añadir a favoritos",
    remove: "Quitar de favoritos"
  },
  exercises: {
    start: "Comenzar Ejercicio",
    check: "Verificar Respuesta",
    showAnswer: "Mostrar Respuesta",
    correct: "¡Correcto!",
    incorrect: "¡Incorrecto!",
    correctAnswerIs: "La respuesta correcta es = {correctAnswer}",
    loading: "Cargando problemas...",
    completed: "¡Ejercicio Completado!",
    score: "Tu puntuación",
    timeTaken: "Tiempo usado",
    tryAgain: "Intentar de Nuevo",
    returnHome: "Volver al Inicio",
  },
  tooltips: {
    activateShowAnswer: "Para activar esta opción, ve a Configuración",
    maxAttemptsPerProblem: "Número máximo de intentos permitidos por problema",
    autoContinue: "Cuando está marcado, avanza automáticamente al siguiente problema después de una respuesta correcta",
    rewardsCollected: "Recompensas obtenidas",
    exerciseHistory: "Historial de ejercicios",
  },
  levelUp: {
    previousLevel: "Nivel Anterior",
    newLevel: "Nuevo Nivel",
    adaptiveDifficultyEnabled: "La dificultad adaptativa está activada. Tu nivel cambiará según tu desempeño.",
    continue: "Continuar"
  },
  difficulty: {
    beginner: "Principiante",
    elementary: "Elemental",
    intermediate: "Intermedio",
    advanced: "Avanzado",
    expert: "Experto"
  },
  settings: {
    general: "Configuración General",
    appearance: "Configuración de Apariencia",
    accessibility: "Configuración de Accesibilidad",
    language: "Idioma",
    selectLanguage: "Seleccionar idioma",
    soundEffects: "Efectos de Sonido",
    immediateFeedback: "Retroalimentación Inmediata",
    darkMode: "Modo Oscuro",
    fontSize: "Tamaño de Fuente",
    highContrast: "Modo de Alto Contraste",
    showSolutions: "Mostrar Soluciones",
    extendedTime: "Tiempo Extendido",
    resetToDefault: "Restablecer Configuración Predeterminada",
    resetConfirmation: "Esto restablecerá todos los ajustes a los valores predeterminados. ¿Estás seguro?",
  },
  modules: {
    visibility: {
      hide: "Ocultar módulo",
      restore: "Restaurar módulo"
    },
    addition: {
      name: "Suma",
      description: "Practica sumas con varios niveles de dificultad"
    },
    subtraction: {
      name: "Resta",
      description: "Practica restas con varios niveles de dificultad"
    },
    multiplication: {
      name: "Multiplicación",
      description: "Practica multiplicaciones con varios niveles de dificultad"
    },
    division: {
      name: "División",
      description: "Practica divisiones con varios niveles de dificultad"
    },

  },
};

// Objeto con todos los idiomas disponibles
export const translations = {
  en: enTranslations,
  es: esTranslations,
};

// Tipo para los idiomas soportados
export type SupportedLanguage = keyof typeof translations;