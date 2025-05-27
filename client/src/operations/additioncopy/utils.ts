// utils.ts - Division Logic
import React from "react";
import { DivisionProblem, DivisionProblemExtended, DifficultyLevel } from "./types";

// Constants for division logic
const MAX_DIFFICULTY = 5;
const SAME_RANGE_DIVISOR_PROBABILITY = 0.6;
const DECIMAL_PRECISION = 2;
const EPSILON = 1 / (10 ** (DECIMAL_PRECISION + 1));

export type DivisionDisplayFormat = 'slash' | 'obelus' | 'long';
export const DISPLAY_FORMATS: DivisionDisplayFormat[] = ['slash', 'obelus', 'long'];

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
    case 'intermediate': return 2;
    case 'advanced': return 4;
    case 'expert': return 5;
    default: return 1;
  }
}

// Function to generate division problems
export function generateDivisionProblem(difficulty: DifficultyLevel): DivisionProblem {
  const validDifficulty = Math.max(1, Math.min(MAX_DIFFICULTY, difficultyToNumeric(difficulty)));
  let num1: number, num2: number, correctAnswer: number;
  const operator = '\u00F7'; // Division symbol

  if (validDifficulty < 4) { // Exact division
    let minDivisor: number, maxDivisor: number, minQuotient: number, maxQuotient: number;
    switch (validDifficulty) {
      case 1: 
        minDivisor = 1; maxDivisor = 5; 
        minQuotient = 1; maxQuotient = 9; 
        break;
      case 2: 
        minDivisor = 2; maxDivisor = 10; 
        minQuotient = 2; maxQuotient = 12; 
        break;
      case 3: 
        minDivisor = 2; maxDivisor = 20; 
        minQuotient = 5; maxQuotient = 25; 
        break;
      default: 
        minDivisor = 1; maxDivisor = 5; 
        minQuotient = 1; maxQuotient = 9;
    }
    
    do { 
      num2 = getRandomInt(minDivisor, maxDivisor); 
    } while (num2 === 0);
    
    correctAnswer = getRandomInt(minQuotient, maxQuotient);
    num1 = num2 * correctAnswer;
  } else { // Potentially decimal results
    let min1: number, max1: number, min2Main: number, max2Main: number, min2Lower: number, max2Lower: number;
    switch (validDifficulty) {
      case 4: 
        min1 = 20; max1 = 500; 
        min2Main = 2; max2Main = 25; 
        min2Lower = 2; max2Lower = 10; 
        break;
      case 5: 
        min1 = 100; max1 = 2000; 
        min2Main = 5; max2Main = 50; 
        min2Lower = 2; max2Lower = 20; 
        break;
      default: 
        min1 = 20; max1 = 500; 
        min2Main = 2; max2Main = 25; 
        min2Lower = 2; max2Lower = 10;
    }
    
    num1 = getRandomInt(min1, max1);
    const useMainRangeDivisor = Math.random() < SAME_RANGE_DIVISOR_PROBABILITY;
    
    if (useMainRangeDivisor) {
      do { 
        num2 = getRandomInt(min2Main, max2Main); 
      } while (num2 === 0);
    } else {
      do { 
        num2 = getRandomInt(min2Lower, max2Lower); 
      } while (num2 === 0);
    }
    
    const rawAnswer = num1 / num2;
    correctAnswer = Math.round(rawAnswer * (10**DECIMAL_PRECISION)) / (10**DECIMAL_PRECISION);
    
    // Ensure some problems have decimal answers
    if (Number.isInteger(correctAnswer) && validDifficulty >= 4) {
      const adjustment = Math.random() < 0.5 ? 1 : -1;
      num1 = Math.max(1, num1 + adjustment);
      const newRawAnswer = num1 / num2;
      correctAnswer = Math.round(newRawAnswer * (10**DECIMAL_PRECISION)) / (10**DECIMAL_PRECISION);
    }
  }

  return {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    dividend: num1,
    divisor: num2,
    result: correctAnswer,
    operator: operator
  };
}

export function checkAnswer(problem: DivisionProblem, userAnswer: number): boolean {
  if (userAnswer === null || userAnswer === undefined || isNaN(userAnswer)) return false;
  return Math.abs(userAnswer - problem.result) < EPSILON;
}

// Helper function to choose random display format
export function chooseRandomFormat(): DivisionDisplayFormat {
  return DISPLAY_FORMATS[Math.floor(Math.random() * DISPLAY_FORMATS.length)];
}

// Helper function to get display format for examples (returns string instead of JSX)
export function renderDivisionExample(problem: DivisionProblem, format: DivisionDisplayFormat): string {
  const operatorSymbol = problem.operator;
  switch (format) {
    case 'long':
      return `${problem.dividend} ÷ ${problem.divisor} = ?`;
    case 'slash': 
      return `${problem.dividend} / ${problem.divisor} = ?`;
    case 'obelus': 
    default: 
      return `${problem.dividend} ${operatorSymbol} ${problem.divisor} = ?`;
  }
}

// Backwards compatibility functions (these will be replaced gradually)
export function generateMultiplicationProblem(difficulty: DifficultyLevel): any {
  const divProblem = generateDivisionProblem(difficulty);
  return {
    id: divProblem.id,
    operands: [divProblem.dividend, divProblem.divisor],
    correctAnswer: divProblem.result,
    layout: 'horizontal'
  };
}

export function getVerticalAlignmentInfo(): any {
  return {
    maxIntLength: 0,
    maxDecLength: 0,
    operandsFormatted: [],
    productLineTotalCharWidth: 0
  };
}