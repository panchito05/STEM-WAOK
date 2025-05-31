// Clase para dibujo del nivel principiante
import { LevelDrawing, DrawingConfig } from './types';
import { AssociativePropertyProblem } from '../types';
import { BaseDrawing } from './BaseDrawing';

export class BeginnerDrawing extends BaseDrawing implements LevelDrawing {
  
  draw(context: CanvasRenderingContext2D, problem: AssociativePropertyProblem, config: DrawingConfig): void {
    const originalState = this.saveContextState(context);
    this.setupContext(context, config);
    
    try {
      this.drawBeginnerFormat(context, config);
    } finally {
      this.restoreContext(context, originalState);
    }
  }

  private drawBeginnerFormat(context: CanvasRenderingContext2D, config: DrawingConfig): void {
    const spacing = config.baseFontSize * 1.5;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    const text1 = `(${config.operands[0]} + ${config.operands[1]}) + ${config.operands[2]}`;
    const text2 = `= ?`;
    
    context.fillText(text1, config.centerX, config.centerY - spacing/2);
    context.fillText(text2, config.centerX, config.centerY + spacing/2);
  }
}