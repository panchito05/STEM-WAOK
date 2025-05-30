// utils.ts - Generadores de problemas para Propiedad Asociativa
import { 
  AssociativePropertyProblem, 
  Level1Problem, 
  Level2Problem, 
  Level3Problem, 
  Level4Problem, 
  Level5Problem,
  VisualObject,
  DifficultyLevel, 
  ExerciseLayout, 
  Problem, 
  Operand,
  AssociativeActivityLevel
} from "./types";

// --- Funciones auxiliares ---
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomBool = (probability: number = 0.5): boolean => Math.random() < probability;

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- Objetos visuales para nivel 1 ---
const VISUAL_OBJECTS: VisualObject[] = [
  { id: 'dog', emoji: '🐶', name: 'Perro', color: '#8B4513' },
  { id: 'cat', emoji: '🐱', name: 'Gato', color: '#FFA500' },
  { id: 'pig', emoji: '🐷', name: 'Cerdo', color: '#FFB6C1' },
  { id: 'cow', emoji: '🐮', name: 'Vaca', color: '#000000' },
  { id: 'sheep', emoji: '🐑', name: 'Oveja', color: '#FFFFFF' },
  { id: 'rabbit', emoji: '🐰', name: 'Conejo', color: '#DDA0DD' },
  { id: 'duck', emoji: '🦆', name: 'Pato', color: '#FFD700' },
  { id: 'chicken', emoji: '🐔', name: 'Pollo', color: '#FF6347' },
];

// --- Generador para Nivel 1: Agrupar Objetos Visuales ---
export function generateLevel1Problem(): Level1Problem {
  const numObjects = getRandomInt(3, 4); // 3 o 4 objetos
  const selectedObjects = VISUAL_OBJECTS.slice(0, numObjects);
  
  const id = generateUniqueId();
  
  // Crear dos agrupamientos diferentes pero equivalentes
  let grouping1, grouping2;
  
  if (numObjects === 3) {
    // Para 3 objetos: (A+B)+C vs A+(B+C)
    grouping1 = {
      objects: selectedObjects,
      groups: { first: [0, 1], second: [2] }
    };
    grouping2 = {
      objects: selectedObjects,
      groups: { first: [0], second: [1, 2] }
    };
  } else {
    // Para 4 objetos: (A+B)+(C+D) vs A+(B+C+D) o (A+B+C)+D
    const variant = getRandomInt(1, 2);
    if (variant === 1) {
      grouping1 = {
        objects: selectedObjects,
        groups: { first: [0, 1], second: [2, 3] }
      };
      grouping2 = {
        objects: selectedObjects,
        groups: { first: [0], second: [1, 2, 3] }
      };
    } else {
      grouping1 = {
        objects: selectedObjects,
        groups: { first: [0, 1, 2], second: [3] }
      };
      grouping2 = {
        objects: selectedObjects,
        groups: { first: [0, 1], second: [2, 3] }
      };
    }
  }

  return {
    id,
    level: 1,
    objects: selectedObjects,
    grouping1,
    grouping2,
    question: "¿En ambos casos hay el mismo número de animales?",
    correctAnswer: true
  };
}

// --- Generador para Nivel 2: Introducción Numérica ---
export function generateLevel2Problem(): Level2Problem {
  const operands = [
    getRandomInt(1, 9),
    getRandomInt(1, 9),
    getRandomInt(1, 9)
  ];
  
  const [a, b, c] = operands;
  const expression1 = `(${a} + ${b}) + ${c}`;
  const expression2 = `${a} + (${b} + ${c})`;
  const correctAnswer = a + b + c;
  
  return {
    id: generateUniqueId(),
    level: 2,
    expression1,
    expression2,
    operands,
    correctAnswer,
    visualGroups: ['#FF6B6B', '#4ECDC4', '#45B7D1']
  };
}

// --- Generador para Nivel 3: Ejercicios Guiados ---
export function generateLevel3Problem(): Level3Problem {
  const operands = [
    getRandomInt(2, 9),
    getRandomInt(1, 8),
    getRandomInt(1, 7)
  ];
  
  const [a, b, c] = operands;
  const originalExpression = `(${a} + ${b}) + ${c}`;
  const incompleteExpression = `${a} + (___ + ___)`;
  const correctAnswer = a + b + c;
  const missingValues = [b, c];
  
  return {
    id: generateUniqueId(),
    level: 3,
    originalExpression,
    incompleteExpression,
    operands,
    correctAnswer,
    missingValues
  };
}

// --- Generador para Nivel 4: Problemas Verbales ---
export function generateLevel4Problem(): Level4Problem {
  const problems = [
    {
      template: "{name1} tiene {num1} canicas, {name2} tiene {num2} y {name3} tiene {num3}. ¿Cómo puedes agruparlos para hacer la cuenta más fácil?",
      strategy: "Agrupa los números que suman 10 primero"
    },
    {
      template: "En una tienda hay {num1} manzanas rojas, {num2} manzanas verdes y {num3} manzanas amarillas. ¿Cuántas manzanas hay en total?",
      strategy: "Busca pares que sumen números redondos"
    },
    {
      template: "María recogió {num1} flores, Ana recogió {num2} y Luis recogió {num3}. ¿Cuál es la forma más rápida de contar todas las flores?",
      strategy: "Agrupa los números más pequeños primero"
    }
  ];
  
  const names = ['Luis', 'Ana', 'Carlos', 'María', 'Pedro', 'Sofía'];
  const selectedProblem = problems[getRandomInt(0, problems.length - 1)];
  
  // Generar números que permitan agrupamientos estratégicos
  let numbers: number[];
  const strategy = getRandomInt(1, 3);
  
  if (strategy === 1) {
    // Crear números que sumen 10
    const base = getRandomInt(2, 8);
    const complement = 10 - base;
    const third = getRandomInt(1, 9);
    numbers = [base, complement, third];
  } else if (strategy === 2) {
    // Números que sumen múltiplos de 5
    numbers = [getRandomInt(1, 4), getRandomInt(1, 4), 5];
  } else {
    // Números aleatorios
    numbers = [getRandomInt(2, 8), getRandomInt(1, 6), getRandomInt(1, 7)];
  }
  
  // Llenar el template
  let problemText = selectedProblem.template
    .replace('{name1}', names[0])
    .replace('{name2}', names[1])
    .replace('{name3}', names[2])
    .replace('{num1}', numbers[0].toString())
    .replace('{num2}', numbers[1].toString())
    .replace('{num3}', numbers[2].toString());
  
  const correctAnswer = numbers.reduce((sum, num) => sum + num, 0);
  const optimalGrouping = `(${numbers[0]} + ${numbers[1]}) + ${numbers[2]}`;
  
  return {
    id: generateUniqueId(),
    level: 4,
    problemText,
    numbers,
    suggestedStrategy: selectedProblem.strategy,
    correctAnswer,
    optimalGrouping
  };
}

// --- Generador para Nivel 5: Crear y Justificar ---
export function generateLevel5Problem(): Level5Problem {
  const targetSum = getRandomInt(15, 30);
  
  // Generar números que puedan sumar al objetivo
  const num1 = getRandomInt(3, Math.floor(targetSum / 3));
  const num2 = getRandomInt(2, Math.floor((targetSum - num1) / 2));
  const num3 = targetSum - num1 - num2;
  
  const availableNumbers = [num1, num2, num3];
  const correctExpressions = [
    `(${num1} + ${num2}) + ${num3}`,
    `${num1} + (${num2} + ${num3})`,
    `(${num1} + ${num3}) + ${num2}`,
    `${num2} + (${num1} + ${num3})`
  ];
  
  return {
    id: generateUniqueId(),
    level: 5,
    targetSum,
    availableNumbers,
    requiresCreation: true,
    requiresJustification: true,
    correctExpressions
  };
}

// --- Generador principal ---
export function generateAssociativePropertyProblem(level: AssociativeActivityLevel): AssociativePropertyProblem {
  switch (level) {
    case 1:
      return generateLevel1Problem();
    case 2:
      return generateLevel2Problem();
    case 3:
      return generateLevel3Problem();
    case 4:
      return generateLevel4Problem();
    case 5:
      return generateLevel5Problem();
    default:
      return generateLevel1Problem();
  }
}

// --- Función de verificación de respuestas ---
export function checkAssociativeAnswer(problem: AssociativePropertyProblem, userAnswer: any): boolean {
  switch (problem.level) {
    case 1:
      return userAnswer === true; // Siempre true para nivel 1
    
    case 2:
      return userAnswer === problem.correctAnswer;
    
    case 3:
      if (Array.isArray(userAnswer)) {
        return userAnswer.length === 2 && 
               userAnswer.every((val, idx) => val === problem.missingValues[idx]);
      }
      return userAnswer === problem.correctAnswer;
    
    case 4:
      return userAnswer === problem.correctAnswer;
    
    case 5:
      if (Array.isArray(userAnswer)) {
        // Verificar si las expresiones creadas son válidas
        return userAnswer.every(expr => problem.correctExpressions.includes(expr));
      }
      return userAnswer === problem.targetSum;
    
    default:
      return false;
  }
}

// --- Funciones de compatibilidad con el sistema existente ---
export function checkAnswer(answer: number, correctAnswer: number): boolean {
  return answer === correctAnswer;
}

export function getVerticalAlignmentInfo(operands: number[]): any {
  return {
    maxDigits: Math.max(...operands.map(n => n.toString().length)),
    alignment: 'right'
  };
}

// --- Adaptador para compatibilidad con el tipo Problem genérico ---
export function associativePropertyProblemToProblem(
  problem: AssociativePropertyProblem, 
  difficulty: DifficultyLevel = 'beginner'
): Problem {
  let operands: Operand[] = [];
  let correctAnswer = 0;
  
  switch (problem.level) {
    case 1:
      operands = problem.objects.map((obj, idx) => ({ value: idx + 1 }));
      correctAnswer = problem.objects.length;
      break;
    
    case 2:
    case 3:
      operands = (problem as Level2Problem | Level3Problem).operands.map((value: number) => ({ value }));
      correctAnswer = problem.correctAnswer;
      break;
    
    case 4:
      operands = (problem as Level4Problem).numbers.map((value: number) => ({ value }));
      correctAnswer = problem.correctAnswer;
      break;
    
    case 5:
      operands = problem.availableNumbers.map(value => ({ value }));
      correctAnswer = problem.targetSum;
      break;
  }
  
  return {
    id: problem.id,
    operands,
    displayFormat: 'horizontal',
    correctAnswer,
    difficulty,
    allowDecimals: false,
    maxAttempts: 3
  };
}