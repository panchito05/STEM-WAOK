// utils.ts - Empty Module Utils
import { EmptyProblem, DifficultyLevel } from "./types";

// Generate a generic empty problem based on difficulty
export function generateEmptyProblem(difficulty: DifficultyLevel): EmptyProblem {
  const id = `empty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate sample operands based on difficulty (these can be customized)
  let operands: number[] = [];
  let correctAnswer = 0;
  
  switch (difficulty) {
    case "beginner":
      operands = [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1];
      correctAnswer = operands[0] + operands[1]; // Example: simple addition
      break;
    case "elementary":
      operands = [Math.floor(Math.random() * 50) + 10, Math.floor(Math.random() * 50) + 10];
      correctAnswer = operands[0] + operands[1];
      break;
    case "intermediate":
      operands = [Math.floor(Math.random() * 100) + 50, Math.floor(Math.random() * 100) + 50];
      correctAnswer = operands[0] + operands[1];
      break;
    case "advanced":
      operands = [Math.floor(Math.random() * 500) + 100, Math.floor(Math.random() * 500) + 100];
      correctAnswer = operands[0] + operands[1];
      break;
    case "expert":
      operands = [Math.floor(Math.random() * 1000) + 500, Math.floor(Math.random() * 1000) + 500];
      correctAnswer = operands[0] + operands[1];
      break;
    default:
      operands = [5, 3];
      correctAnswer = 8;
  }

  const answerDigits = correctAnswer.toString().length;

  return {
    id,
    operands,
    correctAnswer,
    layout: Math.random() > 0.5 ? 'vertical' : 'horizontal',
    difficulty,
    problemType: 'empty',
    instructions: `Solve: ${operands.join(' + ')} = ?`,
    displayFormat: 'standard',
    allowDecimals: false,
    maxAttempts: 3,
    answerMaxDigits: answerDigits,
    answerDecimalPosition: 0
  };
}

// Check if the user's answer is correct
export function checkAnswer(problem: EmptyProblem, userAnswer: number): boolean {
  return Math.abs(userAnswer - problem.correctAnswer) < 0.001; // Allow for floating point precision
}

// Get vertical alignment information for display
export function getVerticalAlignmentInfo(operands: number[], decimalPosition?: number) {
  const operandsFormatted = operands.map(op => ({
    original: op,
    intStr: Math.floor(Math.abs(op)).toString(),
    decStr: ""
  }));

  const maxIntLength = Math.max(...operandsFormatted.map(op => op.intStr.length));
  const maxDecLength = 0; // No decimals for empty module
  const sumLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 + maxDecLength : 0);

  return {
    operandsFormatted,
    maxIntLength,
    maxDecLength,
    sumLineTotalCharWidth
  };
}

// Utility functions for difficulty management
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  const labels = {
    beginner: "Beginner",
    elementary: "Elementary", 
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert"
  };
  return labels[difficulty] || "Unknown";
}

export function getDifficultyNumber(difficulty: DifficultyLevel): number {
  const numbers = {
    beginner: 1,
    elementary: 2,
    intermediate: 3,
    advanced: 4,
    expert: 5
  };
  return numbers[difficulty] || 1;
}

export function getNextDifficulty(currentDifficulty: DifficultyLevel): DifficultyLevel {
  const difficulties: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
  const currentIndex = difficulties.indexOf(currentDifficulty);
  
  if (currentIndex < difficulties.length - 1) {
    return difficulties[currentIndex + 1];
  }
  
  return currentDifficulty; // Already at max difficulty
}

export function getPreviousDifficulty(currentDifficulty: DifficultyLevel): DifficultyLevel {
  const difficulties: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
  const currentIndex = difficulties.indexOf(currentDifficulty);
  
  if (currentIndex > 0) {
    return difficulties[currentIndex - 1];
  }
  
  return currentDifficulty; // Already at min difficulty
}

// Format numbers for display
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Calculate statistics
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function calculateAverageTime(totalTime: number, problemCount: number): number {
  if (problemCount === 0) return 0;
  return Math.round(totalTime / problemCount);
}