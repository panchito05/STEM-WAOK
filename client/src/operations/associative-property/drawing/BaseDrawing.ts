// Clase base con utilidades comunes para todas las funciones de dibujo
import { DrawingConfig } from './types';

export abstract class BaseDrawing {
  
  // Configurar el contexto con las propiedades estándar
  protected setupContext(context: CanvasRenderingContext2D, config: DrawingConfig): void {
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = config.darkMode ? '#ffffff' : '#000000';
    context.fillStyle = config.darkMode ? '#ffffff' : '#000000';
    context.lineWidth = 3;
    context.font = `bold ${config.baseFontSize}px monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
  }

  // Restaurar el contexto a su estado original
  protected restoreContext(
    context: CanvasRenderingContext2D, 
    originalState: {
      strokeStyle: string | CanvasGradient | CanvasPattern;
      lineWidth: number;
      font: string;
      textAlign: CanvasTextAlign;
      textBaseline: CanvasTextBaseline;
      globalCompositeOperation: GlobalCompositeOperation;
    }
  ): void {
    context.strokeStyle = originalState.strokeStyle;
    context.lineWidth = originalState.lineWidth;
    context.font = originalState.font;
    context.textAlign = originalState.textAlign;
    context.textBaseline = originalState.textBaseline;
    context.globalCompositeOperation = originalState.globalCompositeOperation;
  }

  // Guardar el estado actual del contexto
  protected saveContextState(context: CanvasRenderingContext2D) {
    return {
      strokeStyle: context.strokeStyle,
      lineWidth: context.lineWidth,
      font: context.font,
      textAlign: context.textAlign,
      textBaseline: context.textBaseline,
      globalCompositeOperation: context.globalCompositeOperation
    };
  }

  // Dibujar un rectángulo para espacios en blanco
  protected drawBlankRectangle(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    context.strokeStyle = '#9ca3af'; // gray-400
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);
  }

  // Configurar fuente con tamaño específico
  protected setFont(context: CanvasRenderingContext2D, size: number, weight: string = 'bold'): void {
    context.font = `${weight} ${size}px Arial`;
  }

  // Configurar color de texto
  protected setTextColor(context: CanvasRenderingContext2D, color: string): void {
    context.fillStyle = color;
  }
}