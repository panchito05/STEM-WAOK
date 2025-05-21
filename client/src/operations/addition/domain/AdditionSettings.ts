import { DifficultyLevel, DisplayFormat } from './AdditionProblem';

/**
 * Configuración base para ejercicios de suma
 */
export interface AdditionSettings {
  readonly difficulty: DifficultyLevel;
  readonly problemCount: number;
  readonly timeLimit?: number; // tiempo en segundos, undefined = sin límite
  readonly displayFormat: DisplayFormat;
  readonly allowNegatives: boolean;
  readonly allowDecimals: boolean;
  readonly maxOperandValue: number;
}

/**
 * Configuración adicional para modo profesor
 */
export interface ProfessorModeSettings extends AdditionSettings {
  readonly enableCompensation: boolean;
  readonly enableReview: boolean;
  readonly enableExplanationBank: boolean;
  readonly enableAdaptiveDifficulty?: boolean;
  readonly adaptiveDifficulty?: DifficultyLevel;
}

/**
 * Configuración para el modo estándar
 */
export interface StandardModeSettings extends AdditionSettings {
  readonly maxAttempts: number;
  readonly showHints: boolean;
  readonly enableTimerPerProblem: boolean;
  readonly timePerProblem?: number; // en segundos
}

/**
 * Estado de la sesión del modo profesor
 */
export interface ProfessorModeState {
  readonly displayMode: 'problem' | 'explanation' | 'review' | 'results';
  readonly currentProblemIndex: number;
  readonly problems: readonly any[]; // Se reemplazará con AdditionProblem[]
  readonly studentAnswers: readonly any[]; // Se reemplazará con AdditionAnswer[]
  readonly settings: ProfessorModeSettings;
  readonly totalTime: number;
}