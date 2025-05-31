// Clase coordinadora para el nivel avanzado
import { LevelDrawing, DrawingConfig } from './types';
import { AssociativePropertyProblem } from '../types';
import { BaseDrawing } from './BaseDrawing';
import { FillBlankDrawing } from './advanced/FillBlankDrawing';
import { VerificationDrawing } from './advanced/VerificationDrawing';
import { MultipleChoiceDrawing } from './advanced/MultipleChoiceDrawing';

export class AdvancedDrawing extends BaseDrawing implements LevelDrawing {
  private fillBlankDrawing = new FillBlankDrawing();
  private verificationDrawing = new VerificationDrawing();
  private multipleChoiceDrawing = new MultipleChoiceDrawing();
  
  draw(context: CanvasRenderingContext2D, problem: AssociativePropertyProblem, config: DrawingConfig): void {
    // Obtener el tipo de ejercicio desde localStorage (sincronizado con AdvancedExercise)
    const exerciseType = localStorage.getItem('associative-property-exercise-type') || 'fill-blank';
    
    // Delegar el dibujo al tipo específico de ejercicio
    switch(exerciseType) {
      case 'fill-blank':
        this.fillBlankDrawing.draw(context, problem, config);
        break;
      case 'verification':
        this.verificationDrawing.draw(context, problem, config);
        break;
      case 'multiple-choice':
        this.multipleChoiceDrawing.draw(context, problem, config);
        break;
      default:
        // Fallback al formato fill-blank si no se reconoce el tipo
        this.fillBlankDrawing.draw(context, problem, config);
        break;
    }
  }
}