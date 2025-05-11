// Archivo de exportación para el módulo unificado de adición

import Exercise, { Settings } from './Exercise';
import { 
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

export {
    generateAdditionProblem,
    checkAnswer
};

// Exportación por defecto del componente Exercise
export default Exercise;