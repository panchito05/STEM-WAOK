// Clase para dibujo del ejercicio "verification" del nivel avanzado
import { AdvancedExerciseDrawing, DrawingConfig } from '../types';
import { AssociativePropertyProblem } from '../../types';
import { BaseDrawing } from '../BaseDrawing';

export class VerificationDrawing extends BaseDrawing implements AdvancedExerciseDrawing {
  
  draw(context: CanvasRenderingContext2D, problem: AssociativePropertyProblem, config: DrawingConfig): void {
    const originalState = this.saveContextState(context);
    this.setupContext(context, config);
    
    try {
      this.drawVerificationFormat(context, config);
    } finally {
      this.restoreContext(context, originalState);
    }
  }

  private drawVerificationFormat(context: CanvasRenderingContext2D, config: DrawingConfig): void {
    const spacing = config.baseFontSize * 1.2;
    const smallFont = config.baseFontSize * 0.7;
    const mediumFont = config.baseFontSize * 0.9;
    
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Título
    this.setFont(context, smallFont, 'bold');
    this.setTextColor(context, '#7c3aed'); // purple-600
    context.fillText('¿Son estas expresiones equivalentes?', config.centerX, config.centerY - spacing * 1.5);
    
    // Primera expresión
    this.setFont(context, mediumFont, 'bold');
    this.setTextColor(context, '#7c3aed');
    context.fillText(`(${config.operands[0]} + ${config.operands[1]}) + ${config.operands[2]}`, config.centerX, config.centerY - spacing * 0.5);
    
    // Texto "es igual a"
    this.setFont(context, smallFont);
    this.setTextColor(context, '#6b7280'); // gray-500
    context.fillText('es igual a', config.centerX, config.centerY + spacing * 0.2);
    
    // Segunda expresión (forma equivalente)
    this.setFont(context, mediumFont, 'bold');
    this.setTextColor(context, '#7c3aed');
    context.fillText(`${config.operands[0]} + (${config.operands[1]} + ${config.operands[2]})`, config.centerX, config.centerY + spacing * 0.9);
    
    // Opciones de respuesta
    this.setFont(context, smallFont);
    this.setTextColor(context, '#000000');
    context.fillText('[Verdadero]    [Falso]', config.centerX, config.centerY + spacing * 1.8);
  }
}