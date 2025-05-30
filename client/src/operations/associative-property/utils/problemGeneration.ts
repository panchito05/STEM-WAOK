import { 
  AssociativeProblem, 
  AssociativeDifficulty, 
  AssociativeLevel, 
  OperationType,
  AssociativeExpressionGroup,
  VisualElement,
  Level1Activity,
  Level2Activity,
  Level3Activity,
  Level4Activity,
  Level5Activity
} from '../types';

// Visual elements for Level 1
export const visualElements: VisualElement[] = [
  { id: '1', type: 'animal', value: 1, emoji: '🐶', color: '#FF6B6B' },
  { id: '2', type: 'animal', value: 1, emoji: '🐱', color: '#4ECDC4' },
  { id: '3', type: 'animal', value: 1, emoji: '🐷', color: '#45B7D1' },
  { id: '4', type: 'animal', value: 1, emoji: '🐸', color: '#96CEB4' },
  { id: '5', type: 'animal', value: 1, emoji: '🐰', color: '#FFEAA7' },
  { id: '6', type: 'object', value: 1, emoji: '🍎', color: '#FF7675' },
  { id: '7', type: 'object', value: 1, emoji: '🍌', color: '#FDCB6E' },
  { id: '8', type: 'object', value: 1, emoji: '🍊', color: '#E17055' },
];

// Generate numbers based on difficulty and level
export function generateNumbers(difficulty: AssociativeDifficulty, level: AssociativeLevel): number[] {
  const ranges = {
    easy: { min: 1, max: 5 },
    medium: { min: 2, max: 10 },
    hard: { min: 5, max: 20 },
    expert: { min: 10, max: 50 }
  };

  // Map common difficulty names to our internal system
  let mappedDifficulty = difficulty;
  if (difficulty === 'beginner' as any) mappedDifficulty = 'easy';
  if (difficulty === 'elementary' as any) mappedDifficulty = 'easy';
  if (difficulty === 'intermediate' as any) mappedDifficulty = 'medium';
  if (difficulty === 'advanced' as any) mappedDifficulty = 'hard';

  const range = ranges[mappedDifficulty] || ranges.easy;
  const numbers: number[] = [];
  
  // Always generate 3 numbers for associative property (a + b) + c = a + (b + c)
  for (let i = 0; i < 3; i++) {
    numbers.push(Math.floor(Math.random() * (range.max - range.min + 1)) + range.min);
  }
  
  return numbers;
}

// Calculate result based on operation
export function calculateResult(numbers: number[], operation: OperationType): number {
  if (operation === 'addition') {
    return numbers.reduce((sum, num) => sum + num, 0);
  } else {
    return numbers.reduce((product, num) => product * num, 1);
  }
}

// Generate expression groups
export function generateExpressionGroups(numbers: number[], operation: OperationType): {
  left: AssociativeExpressionGroup;
  right: AssociativeExpressionGroup;
} {
  const [a, b, c] = numbers;
  
  return {
    left: {
      values: [a, b, c],
      grouping: 'left' // (a + b) + c
    },
    right: {
      values: [a, b, c],
      grouping: 'right' // a + (b + c)
    }
  };
}

// Format expression as string
export function formatExpression(group: AssociativeExpressionGroup, operation: OperationType): string {
  const [a, b, c] = group.values;
  const op = operation === 'addition' ? '+' : '×';
  
  if (group.grouping === 'left') {
    return `(${a} ${op} ${b}) ${op} ${c}`;
  } else {
    return `${a} ${op} (${b} ${op} ${c})`;
  }
}

// Generate a complete problem
export function generateAssociativeProblem(
  difficulty: AssociativeDifficulty,
  level: AssociativeLevel,
  operation: OperationType = 'addition'
): AssociativeProblem {
  const numbers = generateNumbers(difficulty, level);
  const groups = generateExpressionGroups(numbers, operation);
  const correctAnswer = calculateResult(numbers, operation);
  
  return {
    id: `associative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operation,
    leftExpression: groups.left,
    rightExpression: groups.right,
    correctAnswer,
    level,
    difficulty,
    values: numbers,
    displayFormat: level <= 2 ? 'visual' : 'numeric'
  };
}

// Level 1: Visual Grouping Activity
export function generateLevel1Activity(difficulty: AssociativeDifficulty): Level1Activity {
  const numElements = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
  const elements = visualElements.slice(0, numElements);
  
  return {
    type: 'visual_grouping',
    elements,
    groupings: [
      {
        leftGroup: elements.slice(0, 2),
        rightGroup: elements.slice(2),
        operation: 'addition',
        result: numElements
      },
      {
        leftGroup: [elements[0]],
        rightGroup: elements.slice(1),
        operation: 'addition',
        result: numElements
      }
    ],
    question: '¿En ambos casos hay el mismo número total de elementos?'
  };
}

// Level 2: Numeric Introduction
export function generateLevel2Activity(difficulty: AssociativeDifficulty): Level2Activity {
  const numbers = generateNumbers(difficulty, 2);
  const [a, b, c] = numbers;
  
  return {
    type: 'numeric_introduction',
    expression1: `(${a} + ${b}) + ${c}`,
    expression2: `${a} + (${b} + ${c})`,
    showCalculation: true,
    question: '¿Ambas expresiones dan el mismo resultado?'
  };
}

// Level 3: Guided Practice
export function generateLevel3Activity(difficulty: AssociativeDifficulty): Level3Activity {
  const numbers = generateNumbers(difficulty, 3);
  const [a, b, c] = numbers;
  const correctSum = a + b + c;
  
  const options = [
    `${a} + (${b} + ${c})`,
    `(${a} + ${c}) + ${b}`,
    `${a} × (${b} + ${c})`,
    `(${a} - ${b}) + ${c}`
  ];
  
  return {
    type: 'guided_practice',
    incompleteExpression: `(${a} + ${b}) + ${c} = ${correctSum}`,
    options,
    correctOption: options[0],
    question: '¿Cuál expresión es equivalente a la mostrada?'
  };
}

// Level 4: Mental Calculation
export function generateLevel4Activity(difficulty: AssociativeDifficulty): Level4Activity {
  // Generate numbers that make mental calculation easier
  const baseNumbers = difficulty === 'easy' ? [8, 2, 5] : [15, 5, 7];
  
  return {
    type: 'mental_calculation',
    numbers: baseNumbers,
    hint: `Agrupa los números que suman ${baseNumbers[0] + baseNumbers[1]} primero`,
    strategy: 'Busca números que formen sumas redondas (como 10, 20, etc.)',
    question: `Calcula: ${baseNumbers[0]} + ${baseNumbers[1]} + ${baseNumbers[2]}`
  };
}

// Level 5: Creative Expression
export function generateLevel5Activity(difficulty: AssociativeDifficulty): Level5Activity {
  const target = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 24 : 36;
  const numbers = difficulty === 'easy' ? [3, 5, 7] : [6, 8, 10];
  
  return {
    type: 'creative_expression',
    targetResult: target,
    availableNumbers: numbers,
    requiredExpressions: 2,
    question: `Usa los números ${numbers.join(', ')} para crear dos expresiones asociativas diferentes que den ${target}`
  };
}

// Validate associative property
export function validateAssociativeProperty(
  expression1: string,
  expression2: string,
  operation: OperationType
): boolean {
  try {
    // This is a simplified validation - in a real implementation,
    // you'd want more robust expression parsing
    const result1 = eval(expression1.replace(/×/g, '*'));
    const result2 = eval(expression2.replace(/×/g, '*'));
    return Math.abs(result1 - result2) < 0.001; // Account for floating point precision
  } catch {
    return false;
  }
}

// Generate multiple problems for a session
export function generateProblemSet(
  count: number,
  difficulty: AssociativeDifficulty,
  level: AssociativeLevel,
  operation: OperationType = 'addition'
): AssociativeProblem[] {
  const problems: AssociativeProblem[] = [];
  
  for (let i = 0; i < count; i++) {
    problems.push(generateAssociativeProblem(difficulty, level, operation));
  }
  
  return problems;
}