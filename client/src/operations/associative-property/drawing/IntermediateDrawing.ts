// Clase para dibujo del nivel intermedio - Dos columnas con agrupaciones
import { LevelDrawing, DrawingConfig } from './types';
import { AssociativePropertyProblem } from '../types';
import { BaseDrawing } from './BaseDrawing';

export class IntermediateDrawing extends BaseDrawing implements LevelDrawing {
  
  draw(context: CanvasRenderingContext2D, problem: AssociativePropertyProblem, config: DrawingConfig): void {
    const originalState = this.saveContextState(context);
    this.setupContext(context, config);
    
    try {
      this.drawIntermediateFormat(context, config);
    } finally {
      this.restoreContext(context, originalState);
    }
  }

  private drawIntermediateFormat(context: CanvasRenderingContext2D, config: DrawingConfig): void {
    const [a, b, c] = config.operands;
    
    // Configuración de layout
    const columnWidth = config.canvas.width / config.dpr / 2.5;
    const leftColumnCenterX = config.centerX - columnWidth/2;
    const rightColumnCenterX = config.centerX + columnWidth/2;
    
    // Configuración de fuentes
    const headerFont = `bold ${config.baseFontSize * 0.9}px Arial`;
    const contentFont = `bold ${config.baseFontSize * 0.8}px Arial`;
    const blankFont = `${config.baseFontSize * 0.7}px Arial`;
    
    // Altura y posiciones verticales
    const boxHeight = config.baseFontSize * 12;
    const leftBoxY = config.centerY - boxHeight/2;
    const headerY = leftBoxY + config.baseFontSize * 1.5;
    const expr1Y = headerY + config.baseFontSize * 2;
    const lineSpacing = config.baseFontSize * 1.8;
    const blank1Y = expr1Y + lineSpacing * 2;
    
    this.drawLeftColumn(context, leftColumnCenterX, columnWidth, boxHeight, leftBoxY, headerY, expr1Y, lineSpacing, blank1Y, a, b, c, headerFont, contentFont, blankFont, config);
    this.drawRightColumn(context, rightColumnCenterX, columnWidth, boxHeight, leftBoxY, headerY, expr1Y, lineSpacing, blank1Y, a, b, c, headerFont, contentFont, blankFont, config);
  }

  private drawLeftColumn(
    context: CanvasRenderingContext2D,
    leftColumnCenterX: number,
    columnWidth: number,
    boxHeight: number,
    leftBoxY: number,
    headerY: number,
    expr1Y: number,
    lineSpacing: number,
    blank1Y: number,
    a: number,
    b: number,
    c: number,
    headerFont: string,
    contentFont: string,
    blankFont: string,
    config: DrawingConfig
  ): void {
    // Fondo verde claro
    context.fillStyle = 'rgba(167, 243, 208, 0.3)'; // green-300 con transparencia
    context.fillRect(leftColumnCenterX - columnWidth/2, leftBoxY, columnWidth, boxHeight);
    
    // Borde verde
    context.strokeStyle = '#059669'; // green-600
    context.lineWidth = 2;
    context.strokeRect(leftColumnCenterX - columnWidth/2, leftBoxY, columnWidth, boxHeight);
    
    // Texto del encabezado
    context.fillStyle = '#047857'; // green-700
    context.font = headerFont;
    context.fillText('Primera agrupación', leftColumnCenterX, headerY);
    
    // Contenido de la primera agrupación
    context.fillStyle = '#000000';
    context.font = contentFont;
    
    // Expresión con paréntesis: ( 13 + 6 ) + 14
    context.fillText(`( ${a} + ${b} ) + ${c}`, leftColumnCenterX, expr1Y);
    
    // Texto explicativo
    context.font = blankFont;
    context.fillStyle = '#6b7280'; // gray-500
    context.fillText('Primero resuelve el paréntesis:', leftColumnCenterX, expr1Y + lineSpacing);
    
    // Campo en blanco para el resultado interno + 14
    context.fillStyle = '#000000';
    context.font = contentFont;
    context.fillText('+', leftColumnCenterX + config.baseFontSize * 0.2, blank1Y);
    context.fillText(`${c}`, leftColumnCenterX + config.baseFontSize * 1.2, blank1Y);
    
    // Rectángulo para el espacio en blanco
    this.drawBlankRectangle(context, leftColumnCenterX - config.baseFontSize * 2.2, blank1Y - config.baseFontSize * 0.6, config.baseFontSize * 2, config.baseFontSize * 1.2);
    
    // Texto "Resultado final:"
    context.font = blankFont;
    context.fillStyle = '#6b7280';
    context.fillText('Resultado final:', leftColumnCenterX, blank1Y + lineSpacing);
    
    // Campo final
    context.fillStyle = '#000000';
    context.font = contentFont;
    const final1Y = blank1Y + lineSpacing * 2;
    context.fillText('=', leftColumnCenterX - config.baseFontSize * 1, final1Y);
    
    // Rectángulo para el resultado final
    this.drawBlankRectangle(context, leftColumnCenterX - config.baseFontSize * 0.2, final1Y - config.baseFontSize * 0.6, config.baseFontSize * 2, config.baseFontSize * 1.2);
  }

  private drawRightColumn(
    context: CanvasRenderingContext2D,
    rightColumnCenterX: number,
    columnWidth: number,
    boxHeight: number,
    leftBoxY: number,
    headerY: number,
    expr1Y: number,
    lineSpacing: number,
    blank1Y: number,
    a: number,
    b: number,
    c: number,
    headerFont: string,
    contentFont: string,
    blankFont: string,
    config: DrawingConfig
  ): void {
    // Fondo púrpura claro
    context.fillStyle = 'rgba(196, 181, 253, 0.3)'; // purple-300 con transparencia
    context.fillRect(rightColumnCenterX - columnWidth/2, leftBoxY, columnWidth, boxHeight);
    
    // Borde púrpura
    context.strokeStyle = '#9333ea'; // purple-600
    context.lineWidth = 2;
    context.strokeRect(rightColumnCenterX - columnWidth/2, leftBoxY, columnWidth, boxHeight);
    
    // Texto del encabezado
    context.fillStyle = '#7c3aed'; // purple-700
    context.font = headerFont;
    context.fillText('Segunda agrupación', rightColumnCenterX, headerY);
    
    // Contenido de la segunda agrupación
    context.fillStyle = '#000000';
    context.font = contentFont;
    
    // Expresión con paréntesis: 13 + ( 6 + 14 )
    context.fillText(`${a} + ( ${b} + ${c} )`, rightColumnCenterX, expr1Y);
    
    // Texto explicativo
    context.font = blankFont;
    context.fillStyle = '#6b7280';
    context.fillText('Primero resuelve el paréntesis:', rightColumnCenterX, expr1Y + lineSpacing);
    
    // Campo en blanco para a + ?
    context.fillStyle = '#000000';
    context.font = contentFont;
    context.fillText(`${a}`, rightColumnCenterX - config.baseFontSize * 1.2, blank1Y);
    context.fillText('+', rightColumnCenterX - config.baseFontSize * 0.5, blank1Y);
    
    // Rectángulo para el espacio en blanco
    this.drawBlankRectangle(context, rightColumnCenterX + config.baseFontSize * 0.2, blank1Y - config.baseFontSize * 0.6, config.baseFontSize * 2, config.baseFontSize * 1.2);
    
    // Texto "Resultado final:"
    context.font = blankFont;
    context.fillStyle = '#6b7280';
    context.fillText('Resultado final:', rightColumnCenterX, blank1Y + lineSpacing);
    
    // Campo final
    context.fillStyle = '#000000';
    context.font = contentFont;
    const final2Y = blank1Y + lineSpacing * 2;
    context.fillText('=', rightColumnCenterX - config.baseFontSize * 1, final2Y);
    
    // Rectángulo para el resultado final
    this.drawBlankRectangle(context, rightColumnCenterX - config.baseFontSize * 0.2, final2Y - config.baseFontSize * 0.6, config.baseFontSize * 2, config.baseFontSize * 1.2);
  }
}