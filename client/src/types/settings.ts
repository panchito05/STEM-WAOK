// settings.ts - Tipos relacionados con configuraciones del sistema
import { DifficultyLevel } from '@/operations/addition/types';

// Configuración general de un módulo
export interface ModuleSettings {
  // Configuraciones generales
  language?: string;
  problemCount?: number;
  difficulty?: DifficultyLevel;
  
  // Configuraciones de temporizadores
  hasTimeLimit?: boolean;
  timeLimit?: number;
  hasPerProblemTimer?: boolean;
  
  // Configuraciones de operandos
  maxOperands?: number;
  minValue?: number;
  maxValue?: number;
  allowNegatives?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  
  // Configuraciones de intentos
  maxAttemptsPerProblem?: number;
  showHints?: boolean;
  showExplanations?: boolean;
  
  // Configuraciones de visualización
  preferredDisplayFormat?: 'horizontal' | 'vertical' | 'word';
  
  // Otras configuraciones
  adaptiveMode?: boolean;
  consecutiveCorrectThreshold?: number;
  consecutiveIncorrectThreshold?: number;
}

// Configuración global de la aplicación
export interface GlobalSettings {
  theme?: 'light' | 'dark' | 'system';
  soundEffects?: boolean;
  backgroundMusic?: boolean;
  animations?: boolean;
  voiceInstructions?: boolean;
  language?: string;
  showTimer?: boolean;
  enforceFullscreen?: boolean;
}

// Estructura de perfil de niño
export interface ChildProfile {
  id: number;
  parentId: number;
  name: string;
  avatar?: string;
  age?: number;
  grade?: string;
  createdAt: string;
  updatedAt: string;
  moduleSettings?: {
    global?: GlobalSettings;
    addition?: ModuleSettings;
    subtraction?: ModuleSettings;
    multiplication?: ModuleSettings;
    division?: ModuleSettings;
    fractions?: ModuleSettings;
    counting?: ModuleSettings;
    [key: string]: ModuleSettings | GlobalSettings | undefined;
  };
}