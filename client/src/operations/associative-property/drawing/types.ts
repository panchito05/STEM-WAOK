// Tipos e interfaces para el sistema de dibujo modularizado
import { AssociativePropertyProblem } from '../types';

// Configuración común para todas las funciones de dibujo
export interface DrawingConfig {
  baseFontSize: number;
  centerX: number;
  centerY: number;
  charWidth: number;
  lineHeight: number;
  darkMode: boolean;
  operands: number[];
  canvas: HTMLCanvasElement;
  dpr: number;
}

// Interfaz base que deben implementar todas las clases de dibujo por nivel
export interface LevelDrawing {
  draw(context: CanvasRenderingContext2D, problem: AssociativePropertyProblem, config: DrawingConfig): void;
}

// Interfaz específica para ejercicios del nivel avanzado
export interface AdvancedExerciseDrawing {
  draw(context: CanvasRenderingContext2D, problem: AssociativePropertyProblem, config: DrawingConfig): void;
}

// Tipos de ejercicios del nivel avanzado
export type AdvancedExerciseType = 'fill-blank' | 'verification' | 'multiple-choice';