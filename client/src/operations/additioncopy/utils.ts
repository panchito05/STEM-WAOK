// Multiplication module utils - completely clean implementation
import { MultiplicationProblem, DisplayFormat } from './types';

// Display formats for multiplication
export const DISPLAY_FORMATS: DisplayFormat[] = ['horizontal', 'vertical'];

export interface MultiplicationSettings {
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';
  displayFormat: DisplayFormat;
  includeDecimals: boolean;
  maxDigits: number;
  timeLimit: number;
  problemCount: number;
}

// Generate a multiplication problem based on difficulty
export function generateMultiplicationProblem(
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert',
  displayFormat: DisplayFormat = 'horizontal'
): MultiplicationProblem {
  let factor1: number, factor2: number;
  
  switch (difficulty) {
    case 'beginner':
      factor1 = Math.floor(Math.random() * 5) + 1; // 1-5
      factor2 = Math.floor(Math.random() * 5) + 1; // 1-5
      break;
    case 'elementary':
      factor1 = Math.floor(Math.random() * 9) + 1; // 1-9
      factor2 = Math.floor(Math.random() * 9) + 1; // 1-9
      break;
    case 'intermediate':
      factor1 = Math.floor(Math.random() * 12) + 1; // 1-12
      factor2 = Math.floor(Math.random() * 12) + 1; // 1-12
      break;
    case 'advanced':
      factor1 = Math.floor(Math.random() * 50) + 10; // 10-59
      factor2 = Math.floor(Math.random() * 20) + 1;  // 1-20
      break;
    case 'expert':
      factor1 = Math.floor(Math.random() * 100) + 10; // 10-109
      factor2 = Math.floor(Math.random() * 50) + 10;  // 10-59
      break;
    default:
      factor1 = Math.floor(Math.random() * 9) + 1;
      factor2 = Math.floor(Math.random() * 9) + 1;
  }

  const correctAnswer = factor1 * factor2;

  return {
    id: `mult_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operands: [factor1, factor2],
    num1: factor1,
    num2: factor2,
    correctAnswer,
    layout: displayFormat,
    answerMaxDigits: correctAnswer.toString().length
  };
}

// Check if answer is correct for multiplication
export function checkMultiplicationAnswer(problem: MultiplicationProblem, userAnswer: number): boolean {
  return Math.abs(userAnswer - problem.correctAnswer) < 0.01; // Allow small floating point errors
}

// Alias for compatibility with Exercise.tsx
export function checkAnswer(problem: MultiplicationProblem, userAnswer: number): boolean {
  return checkMultiplicationAnswer(problem, userAnswer);
}

// Choose a random display format
export function chooseRandomFormat(): DisplayFormat {
  return DISPLAY_FORMATS[Math.floor(Math.random() * DISPLAY_FORMATS.length)];
}

// Helper function to get display format for examples (returns string instead of JSX)
export function renderMultiplicationExample(problem: MultiplicationProblem, format: DisplayFormat): string {
  const [factor1, factor2] = problem.operands;
  switch (format) {
    case 'vertical':
      return `${factor1}\n× ${factor2}\n____`;
    case 'horizontal': 
    default: 
      return `${factor1} × ${factor2} = ?`;
  }
}

// Helper function for vertical alignment (compatibility)
export function getVerticalAlignmentInfo(problem: MultiplicationProblem) {
  const [factor1, factor2] = problem.operands;
  const factor1String = factor1.toString();
  const factor2String = factor2.toString();
  const resultString = problem.correctAnswer.toString();
  
  return {
    maxDigits: Math.max(factor1String.length, factor2String.length, resultString.length),
    factor1Digits: factor1String.length,
    factor2Digits: factor2String.length,
    resultDigits: resultString.length,
    maxIntLength: Math.max(factor1String.length, factor2String.length, resultString.length),
    maxDecLength: 0,
    operandsFormatted: [
      { original: factor1, intStr: factor1String, decStr: "" },
      { original: factor2, intStr: factor2String, decStr: "" }
    ],
    productLineTotalCharWidth: Math.max(factor1String.length, factor2String.length, resultString.length) + 2
  };
}

// Export default settings
export const DEFAULT_MULTIPLICATION_SETTINGS: MultiplicationSettings = {
  difficulty: 'elementary',
  displayFormat: 'horizontal',
  includeDecimals: false,
  maxDigits: 2,
  timeLimit: 30,
  problemCount: 10
};