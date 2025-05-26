import { lazy } from 'react';

// Lazy load components for better performance
export const SubtractionExercise = lazy(() => import('./Exercise'));
export const SubtractionSettings = lazy(() => import('./Settings'));

// Export types
export type { 
  SubtractionProblem, 
  SubtractionSettings as SubtractionSettingsType,
  SubtractionExerciseState,
  SubtractionStats 
} from './types';

// Export utilities
export {
  generateSubtractionProblem,
  validateSubtractionAnswer,
  formatNumberForDisplay,
  getVerticalAlignmentInfo,
  generateSubtractionExplanation,
  defaultSubtractionSettings
} from './utils';