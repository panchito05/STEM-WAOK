// Clase para dibujo del ejercicio "fill-blank" del nivel avanzado
import { AdvancedExerciseDrawing, DrawingConfig } from '../types';
import { AssociativePropertyProblem } from '../../types';
import { BaseDrawing } from '../BaseDrawing';

export class FillBlankDrawing extends BaseDrawing implements AdvancedExerciseDrawing {
  
  draw(context: CanvasRenderingContext2D, problem: AssociativePropertyProblem, config: DrawingConfig): void {
    const originalState = this.saveContextState(context);
    this.setupContext(context, config);
    
    try {
      this.drawFillBlankFormat(context, config);
    } finally {
      this.restoreContext(context, originalState);
    }
  }

  private drawFillBlankFormat(context: CanvasRenderingContext2D, config: DrawingConfig): void {
    const spacing = config.baseFontSize * 1.2;
    const smallFont = config.baseFontSize * 0.7;
    const mediumFont = config.baseFontSize * 0.9;
    
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Título
    this.setFont(context, smallFont, 'bold');
    this.setTextColor(context, '#000000');
    context.fillText('Completa la expresión equivalente', config.centerX, config.centerY - spacing * 2);
    
    // Expresión dada
    this.setFont(context, mediumFont, 'bold');
    this.setTextColor(context, '#059669'); // green-600
    context.fillText(`(${config.operands[0]} + ${config.operands[1]}) + ${config.operands[2]} = ?`, config.centerX, config.centerY - spacing * 0.8);
    
    // Texto "Completa la otra forma"
    this.setFont(context, smallFont);
    this.setTextColor(context, '#000000');
    context.fillText('Completa la otra forma:', config.centerX, config.centerY + spacing * 0.2);
    
    // Expresión a completar
    this.setFont(context, mediumFont, 'bold');
    this.setTextColor(context, '#000000');
    context.fillText(`${config.operands[0]} + (_____ + _____) = _____`, config.centerX, config.centerY + spacing * 1.2);
  }
}