// utils.ts - Multiplication Logic
import React from "react";
import { MultiplicationProblem, DifficultyLevel } from "./types";

// Constants for multiplication logic
const MAX_DIFFICULTY = 5;

export type MultiplicationDisplayFormat = 'horizontal' | 'vertical';
export const DISPLAY_FORMATS: MultiplicationDisplayFormat[] = ['horizontal', 'vertical'];

// Utility function to generate random integers
export function getRandomInt(min: number, max: number): number {
  const minNum = Math.ceil(min);
  const maxNum = Math.floor(max);
  if (maxNum < minNum) return minNum;
  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
}

// Function to convert difficulty level to numeric
function difficultyToNumeric(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'beginner': return 1;
    case 'elementary': return 2;
    case 'intermediate': return 3;
    case 'advanced': return 4;
    case 'expert': return 5;
    default: return 1;
  }
}

// Function to generate multiplication problems
export function generateMultiplicationProblem(difficulty: DifficultyLevel): MultiplicationProblem {
  const validDifficulty = Math.max(1, Math.min(MAX_DIFFICULTY, difficultyToNumeric(difficulty)));
  let factor1: number, factor2: number;
  const operator = '\u00D7'; // Multiplication symbol (×)

  switch (validDifficulty) {
    case 1: // Beginner: 1-digit × 1-digit
      factor1 = getRandomInt(1, 9);
      factor2 = getRandomInt(1, 9);
      break;
    case 2: // Elementary: 1-digit × 2-digit or 2-digit × 1-digit
      if (Math.random() < 0.5) {
        factor1 = getRandomInt(1, 9);
        factor2 = getRandomInt(10, 99);
      } else {
        factor1 = getRandomInt(10, 99);
        factor2 = getRandomInt(1, 9);
      }
      break;
    case 3: // Intermediate: 2-digit × 2-digit
      factor1 = getRandomInt(10, 99);
      factor2 = getRandomInt(10, 99);
      break;
    case 4: // Advanced: 3-digit × 2-digit or 2-digit × 3-digit
      if (Math.random() < 0.5) {
        factor1 = getRandomInt(100, 999);
        factor2 = getRandomInt(10, 99);
      } else {
        factor1 = getRandomInt(10, 99);
        factor2 = getRandomInt(100, 999);
      }
      break;
    case 5: // Expert: 3-digit × 3-digit or larger
      factor1 = getRandomInt(100, 999);
      factor2 = getRandomInt(10, 99);
      break;
    default:
      factor1 = getRandomInt(1, 9);
      factor2 = getRandomInt(1, 9);
      break;
  }

  const result = factor1 * factor2;

  return {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    factor1: factor1,
    factor2: factor2,
    result: result,
    operator: operator
  };
}

export function checkAnswer(problem: MultiplicationProblem, userAnswer: number): boolean {
  if (userAnswer === null || userAnswer === undefined || isNaN(userAnswer)) return false;
  return userAnswer === problem.result;
}

// Helper function to choose random display format
export function chooseRandomFormat(): MultiplicationDisplayFormat {
  return DISPLAY_FORMATS[Math.floor(Math.random() * DISPLAY_FORMATS.length)];
}

// Helper function to get display format for examples (returns string instead of JSX)
export function renderMultiplicationExample(problem: MultiplicationProblem, format: MultiplicationDisplayFormat): string {
  const operatorSymbol = problem.operator;
  switch (format) {
    case 'vertical':
      return `${problem.factor1}\n× ${problem.factor2}\n____`;
    case 'horizontal': 
    default: 
      return `${problem.factor1} ${operatorSymbol} ${problem.factor2} = ?`;
  }
}

// Helper function for vertical alignment (compatibility)
export function getVerticalAlignmentInfo(problem: MultiplicationProblem) {
  const factor1String = problem.factor1.toString();
  const factor2String = problem.factor2.toString();
  const resultString = problem.result.toString();
  
  return {
    maxDigits: Math.max(factor1String.length, factor2String.length, resultString.length),
    factor1Digits: factor1String.length,
    factor2Digits: factor2String.length,
    resultDigits: resultString.length
  };
}