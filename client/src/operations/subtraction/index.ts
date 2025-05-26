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