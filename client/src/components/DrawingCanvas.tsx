import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  initialDrawing?: string;
  brushColor?: string;
  brushSize?: number;
  backgroundColor?: string;
  onSave?: (dataUrl: string) => void;
}

/**
 * Componente de lienzo para dibujar explicaciones
 * Permite dibujar, borrar y cargar dibujos existentes
 */
export const DrawingCanvas = React.forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({ 
    width = 600, 
    height = 400, 
    initialDrawing,
    brushColor = '#000000',
    brushSize = 3,
    backgroundColor = '#ffffff',
    onSave
  }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentBrushColor, setCurrentBrushColor] = useState(brushColor);
    const [currentBrushSize, setCurrentBrushSize] = useState(brushSize);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    // Inicializar canvas cuando se monta el componente
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Si se proporciona ref externa, asignar el canvas a esa ref
      if (typeof ref === 'function') {
        ref(canvas);
      } else if (ref) {
        ref.current = canvas;
      }

      const context = canvas.getContext('2d');
      if (!context) return;

      setCtx(context);

      // Configurar el estilo de línea inicial
      context.strokeStyle = currentBrushColor;
      context.lineWidth = currentBrushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      // Limpiar el canvas con el color de fondo
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Cargar dibujo inicial si existe
      if (initialDrawing) {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0);
        };
        img.src = initialDrawing;
      }
    }, [ref, initialDrawing, backgroundColor]);

    // Actualizar estilo de línea cuando cambian los props
    useEffect(() => {
      if (!ctx) return;
      setCurrentBrushColor(brushColor);
      setCurrentBrushSize(brushSize);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }, [brushColor, brushSize, ctx]);

    // Función para comenzar a dibujar
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!ctx) return;
      setIsDrawing(true);
      
      const { offsetX, offsetY } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
    };

    // Función para obtener coordenadas tanto de mouse como de touch
    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { offsetX: 0, offsetY: 0 };

      let offsetX, offsetY;
      
      if ('touches' in e) {
        // Evento touch
        const rect = canvas.getBoundingClientRect();
        offsetX = e.touches[0].clientX - rect.left;
        offsetY = e.touches[0].clientY - rect.top;
      } else {
        // Evento mouse
        offsetX = e.nativeEvent.offsetX;
        offsetY = e.nativeEvent.offsetY;
      }

      return { offsetX, offsetY };
    };

    // Función para dibujar mientras se mueve
    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !ctx) return;
      
      const { offsetX, offsetY } = getCoordinates(e);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    };

    // Función para terminar de dibujar
    const stopDrawing = () => {
      if (!isDrawing || !ctx) return;
      
      ctx.closePath();
      setIsDrawing(false);
      
      // Guardar el dibujo si se proporciona un callback
      if (onSave && canvasRef.current) {
        onSave(canvasRef.current.toDataURL('image/png'));
      }
    };

    // Función para limpiar el canvas
    const clearCanvas = () => {
      if (!ctx || !canvasRef.current) return;
      
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Guardar el canvas limpio si se proporciona un callback
      if (onSave && canvasRef.current) {
        onSave(canvasRef.current.toDataURL('image/png'));
      }
    };

    // Función para cambiar el color del pincel
    const changeBrushColor = (color: string) => {
      if (!ctx) return;
      
      setCurrentBrushColor(color);
      ctx.strokeStyle = color;
    };

    return (
      <div className="flex flex-col">
        <div className="relative border border-gray-300 rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="touch-none cursor-crosshair bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        {/* Controles de dibujo */}
        <div className="flex justify-between mt-2">
          <div className="flex gap-1">
            {['#000000', '#ff0000', '#0000ff', '#008000', '#ffa500'].map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full ${
                  currentBrushColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => changeBrushColor(color)}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <button
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm"
              onClick={clearCanvas}
            >
              Borrar todo
            </button>
          </div>
        </div>
      </div>
    );
  }
);