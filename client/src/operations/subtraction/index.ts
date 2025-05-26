import { lazy } from 'react';

// Lazy load components for better performance
const SubtractionExercise = lazy(() => import('./Exercise'));
const SubtractionSettings = lazy(() => import('./Settings'));

// Export the module structure expected by the system
export const Exercise = SubtractionExercise;
export const Settings = SubtractionSettings;

// Export types
export type { 
  SubtractionProblem,
  DifficultyLevel,
  ExerciseLayout,
  Problem,
  UserAnswer,
  ExerciseResult
} from './types';

// Export utilities
export {
  generateSubtractionProblem,
  checkAnswer,
  getVerticalAlignmentInfo,
  subtractionProblemToProblem,
  problemToSubtractionProblem,
  formatNumberWithSpacing,
  requiresBorrowing,
  generateStepByStepExplanation
} from './utils';