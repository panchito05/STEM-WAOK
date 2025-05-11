// Archivo de exportación para el módulo unificado de adición

import Exercise from './Exercise';
import Settings from './Settings';

// Exportar componentes principales
export { 
  Exercise, 
  Settings 
};

// Re-exportar tipos y funciones de Exercise.tsx
export type {
  DifficultyLevel,
  ExerciseLayout,
  Problem,
  AdditionProblem,
  UserAnswer
} from './Exercise';

// Exportar funciones auxiliares que no son componentes
import { generateAdditionProblem } from './Exercise';

export { generateAdditionProblem };

export const helperFunctions = {
  generateAdditionProblem
};

// Exportación por defecto del componente Exercise
export default Exercise;