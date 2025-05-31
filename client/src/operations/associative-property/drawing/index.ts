// Exportaciones principales del sistema de dibujo modularizado
export { DrawingFactory } from './DrawingFactory';
export { BeginnerDrawing } from './BeginnerDrawing';
export { ElementaryDrawing } from './ElementaryDrawing';
export { IntermediateDrawing } from './IntermediateDrawing';
export { AdvancedDrawing } from './AdvancedDrawing';
export { BaseDrawing } from './BaseDrawing';

// Exportaciones de ejercicios avanzados
export { FillBlankDrawing } from './advanced/FillBlankDrawing';
export { VerificationDrawing } from './advanced/VerificationDrawing';
export { MultipleChoiceDrawing } from './advanced/MultipleChoiceDrawing';

// Tipos e interfaces
export type { LevelDrawing, AdvancedExerciseDrawing, DrawingConfig, AdvancedExerciseType } from './types';