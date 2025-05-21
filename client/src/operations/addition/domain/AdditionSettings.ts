import { DifficultyLevel, DisplayFormat } from './AdditionProblem';

/**
 * Configuración base para ejercicios de adición
 */
export interface AdditionSettings {
  readonly difficulty: DifficultyLevel;
  readonly problemCount: number;
  readonly displayFormat: DisplayFormat;
  readonly allowNegatives: boolean;
  readonly allowDecimals: boolean;
  readonly maxOperandValue: number;
}

/**
 * Configuración para el modo profesor, extiende la configuración base
 */
export interface ProfessorModeSettings extends AdditionSettings {
  readonly enableCompensation: boolean;
  readonly enableReview: boolean;
  readonly enableExplanationBank: boolean;
}

/**
 * Opciones de ajuste para personalización de la dificultad
 */
export interface DifficultyOptions {
  minValue: number;
  maxValue: number;
  operandCount: number;
  allowNegatives: boolean;
  allowDecimals: boolean;
  decimalPlaces?: number;
}

/**
 * Configuración por defecto para el modo estándar
 */
export const DEFAULT_ADDITION_SETTINGS: AdditionSettings = {
  difficulty: DifficultyLevel.EASY,
  problemCount: 10,
  displayFormat: DisplayFormat.STANDARD,
  allowNegatives: false,
  allowDecimals: false,
  maxOperandValue: 100
};

/**
 * Configuración por defecto para el modo profesor
 */
export const DEFAULT_PROFESSOR_SETTINGS: ProfessorModeSettings = {
  ...DEFAULT_ADDITION_SETTINGS,
  problemCount: 5,
  enableCompensation: true,
  enableReview: true,
  enableExplanationBank: false
};

/**
 * Mapeo de dificultad a opciones concretas
 */
export const DIFFICULTY_RANGES: Record<DifficultyLevel, DifficultyOptions> = {
  [DifficultyLevel.BEGINNER]: {
    minValue: 1,
    maxValue: 10,
    operandCount: 2,
    allowNegatives: false,
    allowDecimals: false
  },
  [DifficultyLevel.EASY]: {
    minValue: 1,
    maxValue: 20,
    operandCount: 2,
    allowNegatives: false,
    allowDecimals: false
  },
  [DifficultyLevel.MEDIUM]: {
    minValue: 5,
    maxValue: 50,
    operandCount: 3,
    allowNegatives: false,
    allowDecimals: false
  },
  [DifficultyLevel.HARD]: {
    minValue: 10,
    maxValue: 100,
    operandCount: 3,
    allowNegatives: true,
    allowDecimals: false
  },
  [DifficultyLevel.EXPERT]: {
    minValue: 10,
    maxValue: 1000,
    operandCount: 4,
    allowNegatives: true,
    allowDecimals: true,
    decimalPlaces: 2
  }
};

/**
 * Función para validar si una configuración es válida
 */
export function isValidSettings(settings: any): settings is AdditionSettings {
  return (
    settings &&
    Object.values(DifficultyLevel).includes(settings.difficulty) &&
    typeof settings.problemCount === 'number' &&
    settings.problemCount > 0 &&
    Object.values(DisplayFormat).includes(settings.displayFormat) &&
    typeof settings.allowNegatives === 'boolean' &&
    typeof settings.allowDecimals === 'boolean' &&
    typeof settings.maxOperandValue === 'number' &&
    settings.maxOperandValue > 0
  );
}

/**
 * Función para validar si una configuración de modo profesor es válida
 */
export function isValidProfessorSettings(settings: any): settings is ProfessorModeSettings {
  return (
    isValidSettings(settings) && 
    typeof settings.enableCompensation === 'boolean' &&
    typeof settings.enableReview === 'boolean' &&
    typeof settings.enableExplanationBank === 'boolean'
  );
}