// Clase para dibujo del ejercicio "multiple-choice" del nivel avanzado
import { AdvancedExerciseDrawing, DrawingConfig } from '../types';
import { AssociativePropertyProblem } from '../../types';
import { BaseDrawing } from '../BaseDrawing';

export class MultipleChoiceDrawing extends BaseDrawing implements AdvancedExerciseDrawing {
  
  draw(context: CanvasRenderingContext2D, problem: AssociativePropertyProblem, config: DrawingConfig): void {
    const originalState = this.saveContextState(context);
    this.setupContext(context, config);
    
    try {
      this.drawMultipleChoiceFormat(context, config);
    } finally {
      this.restoreContext(context, originalState);
    }
  }

  private drawMultipleChoiceFormat(context: CanvasRenderingContext2D, config: DrawingConfig): void {
    const spacing = config.baseFontSize * 1.2;
    const smallFont = config.baseFontSize * 0.7;
    const mediumFont = config.baseFontSize * 0.9;
    
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Título
    this.setFont(context, smallFont, 'bold');
    this.setTextColor(context, '#ea580c'); // orange-600
    context.fillText('¿Cuál es igual a:', config.centerX, config.centerY - spacing * 1.8);
    
    // Expresión pregunta
    this.setFont(context, mediumFont, 'bold');
    this.setTextColor(context, '#ea580c');
    context.fillText(`(${config.operands[0]} + ${config.operands[1]}) + ${config.operands[2]}?`, config.centerX, config.centerY - spacing * 1);
    
    // Opciones de respuesta
    this.setFont(context, smallFont);
    this.setTextColor(context, '#000000');
    
    // Opción A - Correcta (propiedad asociativa)
    context.fillText(`A) ${config.operands[0]} + (${config.operands[1]} + ${config.operands[2]})`, config.centerX, config.centerY - spacing * 0.2);
    
    // Opción B - Incorrecta (cambio de orden, no es asociativa)
    context.fillText(`B) (${config.operands[0]} + ${config.operands[2]}) + ${config.operands[1]}`, config.centerX, config.centerY + spacing * 0.4);
    
    // Opción C - Incorrecta (multiplicación en lugar de suma)
    context.fillText(`C) ${config.operands[0]} × (${config.operands[1]} + ${config.operands[2]})`, config.centerX, config.centerY + spacing * 1);
  }
}