// Archivo de exportación para el módulo unificado de adición

import Exercise, { 
  Settings,
  DifficultyLevel, 
  ExerciseLayout, 
  Problem, 
  AdditionProblem, 
  UserAnswer,
  generateAdditionProblem,
  checkAnswer 
} from './Exercise';

// Exportar componentes principales
export { 
  Exercise, 
  Settings 
};

// Exportar tipos y funciones utilitarias
export type {
  DifficultyLevel,
  ExerciseLayout,
  Problem,
  AdditionProblem,
  UserAnswer
};

// Exportar funciones auxiliares que no son componentes
const helperFunctions = {
  generateAdditionProblem,
  checkAnswer
};

export { helperFunctions };

// Exportación por defecto del componente Exercise
export default Exercise;