import type { SubtractionProblem, SubtractionSettings } from './types';

/**
 * Genera un problema de resta según la dificultad especificada
 */
export function generateSubtractionProblem(
  settings: SubtractionSettings,
  problemId: string
): SubtractionProblem {
  const { difficulty } = settings;
  
  switch (difficulty) {
    case "beginner":
      return generateBeginnerProblem(problemId, settings);
    case "elementary":
      return generateElementaryProblem(problemId, settings);
    case "intermediate":
      return generateIntermediateProblem(problemId, settings);
    case "advanced":
      return generateAdvancedProblem(problemId, settings);
    case "expert":
      return generateExpertProblem(problemId, settings);
    default:
      return generateBeginnerProblem(problemId, settings);
  }
}

/**
 * Beginner: Restas de 1 dígito (5 - 3, 8 - 2)
 */
function generateBeginnerProblem(problemId: string, settings: SubtractionSettings): SubtractionProblem {
  let minuend: number, subtrahend: number;
  
  if (settings.allowNegativeResults) {
    minuend = Math.floor(Math.random() * 9) + 1; // 1-9
    subtrahend = Math.floor(Math.random() * 9) + 1; // 1-9
  } else {
    // Asegurar resultado positivo
    minuend = Math.floor(Math.random() * 9) + 1; // 1-9
    subtrahend = Math.floor(Math.random() * minuend) + 1; // 1 hasta minuend
  }
  
  return {
    id: problemId,
    operands: [minuend, subtrahend],
    correctAnswer: minuend - subtrahend,
    difficulty: "beginner",
    created: Date.now(),
    allowsNegativeResults: settings.allowNegativeResults,
    requiresBorrowing: false,
    hasDecimals: false
  };
}

/**
 * Elementary: Restas de 2 dígitos sin prestar (25 - 12, 38 - 15)
 */
function generateElementaryProblem(problemId: string, settings: SubtractionSettings): SubtractionProblem {
  let minuend: number, subtrahend: number;
  
  do {
    minuend = Math.floor(Math.random() * 90) + 10; // 10-99
    
    if (settings.allowNegativeResults) {
      subtrahend = Math.floor(Math.random() * 90) + 10; // 10-99
    } else {
      subtrahend = Math.floor(Math.random() * (minuend - 10)) + 10; // 10 hasta minuend-1
    }
    
    // Verificar que no requiera prestar (para elementary)
    const minuendUnits = minuend % 10;
    const subtrahendUnits = subtrahend % 10;
    const minuendTens = Math.floor(minuend / 10);
    const subtrahendTens = Math.floor(subtrahend / 10);
    
    // No debe requerir prestar en ninguna posición
    if (minuendUnits >= subtrahendUnits && minuendTens >= subtrahendTens) {
      break;
    }
  } while (true);
  
  return {
    id: problemId,
    operands: [minuend, subtrahend],
    correctAnswer: minuend - subtrahend,
    difficulty: "elementary",
    created: Date.now(),
    allowsNegativeResults: settings.allowNegativeResults,
    requiresBorrowing: false,
    hasDecimals: false
  };
}

/**
 * Intermediate: Restas de 2 dígitos con prestar (53 - 28, 72 - 49)
 */
function generateIntermediateProblem(problemId: string, settings: SubtractionSettings): SubtractionProblem {
  let minuend: number, subtrahend: number;
  
  do {
    minuend = Math.floor(Math.random() * 90) + 10; // 10-99
    
    if (settings.allowNegativeResults) {
      subtrahend = Math.floor(Math.random() * 90) + 10; // 10-99
    } else {
      subtrahend = Math.floor(Math.random() * (minuend - 10)) + 10; // 10 hasta minuend-1
    }
    
    // Verificar que SÍ requiera prestar
    const minuendUnits = minuend % 10;
    const subtrahendUnits = subtrahend % 10;
    
    // Debe requerir prestar en las unidades
    if (minuendUnits < subtrahendUnits) {
      break;
    }
  } while (true);
  
  return {
    id: problemId,
    operands: [minuend, subtrahend],
    correctAnswer: minuend - subtrahend,
    difficulty: "intermediate",
    created: Date.now(),
    allowsNegativeResults: settings.allowNegativeResults,
    requiresBorrowing: true,
    hasDecimals: false
  };
}

/**
 * Advanced: Restas de 3 dígitos (125 - 87, 234 - 156)
 */
function generateAdvancedProblem(problemId: string, settings: SubtractionSettings): SubtractionProblem {
  let minuend: number, subtrahend: number;
  
  minuend = Math.floor(Math.random() * 900) + 100; // 100-999
  
  if (settings.allowNegativeResults) {
    subtrahend = Math.floor(Math.random() * 900) + 100; // 100-999
  } else {
    subtrahend = Math.floor(Math.random() * (minuend - 100)) + 100; // 100 hasta minuend-1
  }
  
  // Determinar si requiere prestar
  const requiresBorrowing = checkIfRequiresBorrowing(minuend, subtrahend);
  
  return {
    id: problemId,
    operands: [minuend, subtrahend],
    correctAnswer: minuend - subtrahend,
    difficulty: "advanced",
    created: Date.now(),
    allowsNegativeResults: settings.allowNegativeResults,
    requiresBorrowing,
    hasDecimals: false
  };
}

/**
 * Expert: Restas de 3 dígitos con decimales (123.5 - 67.8, 456.7 - 123.4)
 */
function generateExpertProblem(problemId: string, settings: SubtractionSettings): SubtractionProblem {
  let minuend: number, subtrahend: number;
  
  // Generar números de 3 dígitos con 1 decimal
  const minuendWhole = Math.floor(Math.random() * 900) + 100; // 100-999
  const minuendDecimal = Math.floor(Math.random() * 10); // 0-9
  minuend = parseFloat(`${minuendWhole}.${minuendDecimal}`);
  
  if (settings.allowNegativeResults) {
    const subtrahendWhole = Math.floor(Math.random() * 900) + 100; // 100-999
    const subtrahendDecimal = Math.floor(Math.random() * 10); // 0-9
    subtrahend = parseFloat(`${subtrahendWhole}.${subtrahendDecimal}`);
  } else {
    // Asegurar resultado positivo
    const maxSubtrahend = minuend - 0.1;
    const subtrahendWhole = Math.floor(Math.random() * Math.floor(maxSubtrahend)) + 1;
    const subtrahendDecimal = Math.floor(Math.random() * 10);
    subtrahend = parseFloat(`${subtrahendWhole}.${subtrahendDecimal}`);
    
    // Verificar que no sea mayor que minuend
    if (subtrahend >= minuend) {
      subtrahend = minuend - 0.1;
    }
  }
  
  const result = parseFloat((minuend - subtrahend).toFixed(1));
  
  return {
    id: problemId,
    operands: [minuend, subtrahend],
    correctAnswer: result,
    difficulty: "expert",
    created: Date.now(),
    allowsNegativeResults: settings.allowNegativeResults,
    requiresBorrowing: true, // Los decimales casi siempre requieren "prestar"
    hasDecimals: true
  };
}

/**
 * Verifica si una resta requiere prestar
 */
function checkIfRequiresBorrowing(minuend: number, subtrahend: number): boolean {
  const minuendStr = minuend.toString();
  const subtrahendStr = subtrahend.toString();
  
  // Comparar dígito por dígito desde las unidades
  for (let i = 0; i < Math.max(minuendStr.length, subtrahendStr.length); i++) {
    const minuendDigit = parseInt(minuendStr[minuendStr.length - 1 - i] || '0');
    const subtrahendDigit = parseInt(subtrahendStr[subtrahendStr.length - 1 - i] || '0');
    
    if (minuendDigit < subtrahendDigit) {
      return true;
    }
  }
  
  return false;
}

/**
 * Valida si una respuesta es correcta
 */
export function validateSubtractionAnswer(
  problem: SubtractionProblem,
  userAnswer: number
): boolean {
  if (problem.hasDecimals) {
    // Para decimales, permitir pequeña diferencia por precisión de punto flotante
    return Math.abs(userAnswer - problem.correctAnswer) < 0.01;
  }
  
  return userAnswer === problem.correctAnswer;
}

/**
 * Formatea un número para mostrar en el problema
 */
export function formatNumberForDisplay(num: number, hasDecimals: boolean): string {
  if (hasDecimals) {
    return num.toFixed(1);
  }
  return num.toString();
}

/**
 * Obtiene información sobre el alineamiento vertical para mostrar la resta
 */
export function getVerticalAlignmentInfo(problem: SubtractionProblem | null) {
  if (!problem) {
    console.log('getVerticalAlignmentInfo: problema inválido', problem);
    return {
      minuend: '',
      subtrahend: '',
      maxLength: 0,
      minuendPadding: 0,
      subtrahendPadding: 0
    };
  }

  const [minuend, subtrahend] = problem.operands;
  const minuendStr = formatNumberForDisplay(minuend, problem.hasDecimals);
  const subtrahendStr = formatNumberForDisplay(subtrahend, problem.hasDecimals);
  
  const maxLength = Math.max(minuendStr.length, subtrahendStr.length);
  
  return {
    minuend: minuendStr,
    subtrahend: subtrahendStr,
    maxLength,
    minuendPadding: maxLength - minuendStr.length,
    subtrahendPadding: maxLength - subtrahendStr.length
  };
}

/**
 * Genera una explicación paso a paso de la resta
 */
export function generateSubtractionExplanation(problem: SubtractionProblem): string {
  const [minuend, subtrahend] = problem.operands;
  const result = problem.correctAnswer;
  
  if (problem.hasDecimals) {
    return `Para resolver ${formatNumberForDisplay(minuend, true)} - ${formatNumberForDisplay(subtrahend, true)}:\n` +
           `1. Alineamos los números por el punto decimal\n` +
           `2. Restamos las décimas: ${(minuend * 10) % 10} - ${(subtrahend * 10) % 10}\n` +
           `3. Restamos las unidades y demás posiciones\n` +
           `4. El resultado es ${formatNumberForDisplay(result, true)}`;
  }
  
  if (problem.requiresBorrowing) {
    return `Para resolver ${minuend} - ${subtrahend}:\n` +
           `1. Comenzamos por las unidades\n` +
           `2. Como necesitamos prestar, tomamos de la siguiente posición\n` +
           `3. Continuamos con las demás posiciones\n` +
           `4. El resultado es ${result}`;
  }
  
  return `Para resolver ${minuend} - ${subtrahend}:\n` +
         `1. Restamos dígito por dígito, comenzando por las unidades\n` +
         `2. ${minuend} - ${subtrahend} = ${result}`;
}

/**
 * Configuraciones por defecto para resta
 */
export const defaultSubtractionSettings: SubtractionSettings = {
  difficulty: "beginner",
  problemCount: 10,
  timeLimit: "per-problem",
  timeValue: 0, // Sin límite por defecto
  maxAttempts: 2,
  showImmediateFeedback: true,
  enableSoundEffects: true,
  showAnswerWithExplanation: true,
  enableAdaptiveDifficulty: true,
  enableCompensation: true,
  enableRewards: true,
  rewardType: "stars",
  language: "english",
  allowNegativeResults: false
};