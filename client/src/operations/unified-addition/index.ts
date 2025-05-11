// Archivo de exportación para el módulo unificado de adición
// Este archivo simplifica la exportación de componentes para su uso en la aplicación

import Exercise, { 
  Settings,
  DifficultyLevel, 
  ExerciseLayout, 
  Problem, 
  AdditionProblem, 
  UserAnswer
} from './Exercise';

// Exportar componentes principales
export { 
  Exercise, 
  Settings 
};

// Exportar tipos para uso en otros componentes
export type {
  DifficultyLevel,
  ExerciseLayout,
  Problem,
  AdditionProblem,
  UserAnswer
};

// Exportación por defecto del componente Exercise
export default Exercise;