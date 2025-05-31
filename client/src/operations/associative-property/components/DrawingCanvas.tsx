import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AssociativePropertyProblem } from '../types';

// Definir los diferentes modos de herramientas
type ToolMode = 'pen' | 'eraser';

// Punto para optimización del dibujo
interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
  onClear?: () => void;
  currentProblem?: AssociativePropertyProblem | null; // Problema actual para estampar en el canvas
}

export function DrawingCanvas({
  width = window.innerWidth,
  height = window.innerHeight,
  strokeColor = '#333333',
  strokeWidth = 3,
  className = '',
  onClear,
  position = 'right', // Nueva propiedad para posicionar los controles: 'left' o 'right'
  currentProblem
}: DrawingCanvasProps & { position?: 'left' | 'right' }) {
  // Debug: Log cuando cambia la posición
  console.log(`🎨 [CANVAS] DrawingCanvas recibió position: "${position}"`);
  
  // Añadir efecto para detectar cambios en position
  React.useEffect(() => {
    console.log(`🎨 [CANVAS] Position cambió a: "${position}"`);
  }, [position]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Estado para la herramienta activa y colores
  const [activeColor, setActiveColor] = useState<string>(strokeColor);
  const [activeWidth, setActiveWidth] = useState<number>(strokeWidth);
  const [activeTool, setActiveTool] = useState<ToolMode>('pen');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Tamaños del borrador
  const eraserSizes = [20, 40, 60, 100]; // Cuatro tamaños diferentes
  // Estado para el tamaño actual del borrador (índice en el array)
  const [eraserSizeIndex, setEraserSizeIndex] = useState<number>(1); // 40px por defecto (segundo tamaño)
  // Obtener el tamaño actual del borrador
  const eraserSize = eraserSizes[eraserSizeIndex];
  // Estado para mostrar el indicador visual del borrador
  const [showEraserIndicator, setShowEraserIndicator] = useState<boolean>(false);
  // Estado para mostrar un mensaje temporal del tamaño
  const [showSizeMessage, setShowSizeMessage] = useState<boolean>(false);
  
  // Ya no necesitamos el estado para mostrar el visualizador del problema
  
  // Referencias para optimización de dibujo
  const lastPoint = useRef<Point | null>(null);
  const pointsQueue = useRef<Point[]>([]);
  const animationFrameId = useRef<number | null>(null);
  
  // Estado para guardar la imagen del canvas antes de cambiar herramientas
  const canvasImageRef = useRef<string | null>(null);
  
  // Salvar el estado del canvas
  const saveCanvasState = () => {
    if (canvasRef.current) {
      canvasImageRef.current = canvasRef.current.toDataURL();
    }
  };
  
  // Restaurar el estado del canvas
  const restoreCanvasState = () => {
    if (canvasRef.current && canvasImageRef.current && contextRef.current) {
      const img = new Image();
      img.onload = () => {
        contextRef.current?.drawImage(img, 0, 0);
      };
      img.src = canvasImageRef.current;
    }
  };
  
  // Initialize the canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // For high resolution screens - using a higher DPR for better quality
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // Usar al menos 2x para mejor calidad
    const rect = canvas.getBoundingClientRect();
    
    // Guarda el estado actual antes de resetear el canvas
    if (canvasRef.current) {
      saveCanvasState();
    }
    
    // Establecer tamaños físicos del canvas (buffer de renderizado)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Mantener el tamaño de visualización CSS para alineación correcta
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Escalar el contexto para el ratio de píxeles
    context.scale(dpr, dpr);
    
    // Configurar antialiasing para texto más nítido
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    // Configurar otros aspectos del trazo
    context.lineCap = 'round';
    context.strokeStyle = activeColor;
    context.lineWidth = activeWidth;
    
    if (activeTool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
    } else {
      context.globalCompositeOperation = 'source-over';
    }
    
    contextRef.current = context;
    
    // Restaura el estado después de configurar el contexto
    restoreCanvasState();
  }, []);
  
  // Resize the canvas when window size changes
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !contextRef.current) return;
      
      // Usar un DPR mayor para mejor calidad
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      
      // Save the current drawing
      const prevDrawing = canvas.toDataURL();
      const img = new Image();
      
      img.onload = () => {
        // Actualizar dimensiones físicas del canvas
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Mantener dimensiones visuales CSS
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        const context = contextRef.current;
        if (!context) return;
        
        context.scale(dpr, dpr);
        
        // Mejorar calidad de renderizado
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        context.lineCap = 'round';
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth;
        
        // Restore the previous drawing - ajustar para escala
        context.drawImage(img, 0, 0, rect.width, rect.height);
      };
      
      img.src = prevDrawing;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [strokeColor, strokeWidth]);
  
  // Clear the canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (onClear) {
      onClear();
    }
  };
  
  // Función optimizada para dibujar usando requestAnimationFrame
  const drawPointsOptimized = useCallback(() => {
    const context = contextRef.current;
    const points = pointsQueue.current;
    
    if (!context || points.length === 0 || !lastPoint.current) {
      // Si no hay puntos para dibujar, cancelamos la animación
      animationFrameId.current = null;
      return;
    }
    
    context.beginPath();
    context.moveTo(lastPoint.current.x, lastPoint.current.y);
    
    // Dibujamos todos los puntos acumulados de una vez para mayor eficiencia
    for (const point of points) {
      context.lineTo(point.x, point.y);
      lastPoint.current = point; // Actualizamos el último punto
    }
    
    context.stroke();
    
    // Limpiamos la cola de puntos después de dibujarlos
    pointsQueue.current = [];
    
    // Continuamos la animación si seguimos dibujando
    if (isDrawing) {
      animationFrameId.current = requestAnimationFrame(drawPointsOptimized);
    } else {
      animationFrameId.current = null;
    }
  }, [isDrawing]);
  
  // Cleanup de animación al desmontar
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Drawing functions optimizadas
  // Función para cambiar el tamaño del borrador
  const changeEraserSize = () => {
    // Circular a través de los tamaños disponibles
    const newIndex = (eraserSizeIndex + 1) % eraserSizes.length;
    
    // Usar la función común para cambiar el tamaño
    setEraserSize(newIndex);
  };
  
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevenir comportamiento por defecto
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    // Cambiar tamaño del borrador al hacer clic derecho o tocar con dos dedos
    if (event.type === 'mousedown' && 'button' in event && event.button === 2) {
      event.preventDefault();
      if (activeTool === 'eraser') {
        changeEraserSize();
        return; // No iniciar dibujo para clic derecho
      }
    }
    
    // Asegurar que el borrador tenga el tamaño correcto antes de empezar
    if (activeTool === 'eraser') {
      context.lineWidth = eraserSize;
      context.globalCompositeOperation = 'destination-out';
      // Mostrar el indicador visual del borrador
      setShowEraserIndicator(true);
    } 
    
    // Get the correct coordinates
    let x: number, y: number;
    
    if ('touches' in event) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      const rect = canvas.getBoundingClientRect();
      x = event.nativeEvent.offsetX;
      y = event.nativeEvent.offsetY;
    }
    
    // Iniciamos el dibujo
    setIsDrawing(true);
    context.beginPath();
    
    // Guardamos el punto inicial
    lastPoint.current = { x, y };
    pointsQueue.current = [];
    
    // Iniciamos la animación para dibujo fluido
    if (!animationFrameId.current) {
      animationFrameId.current = requestAnimationFrame(drawPointsOptimized);
    }
  };
  
  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevenir scrolling y comportamientos por defecto
    
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get the correct coordinates
    let x: number, y: number;
    
    if ('touches' in event) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      const rect = canvas.getBoundingClientRect();
      x = event.nativeEvent.offsetX;
      y = event.nativeEvent.offsetY;
    }
    
    // Actualizar posición del cursor para el indicador visual
    setCursorPosition({ x, y });
    
    // Añadimos el punto a la cola para ser dibujado en el próximo frame
    pointsQueue.current.push({ x, y });
    
    // Nos aseguramos de que la animación esté activa
    if (!animationFrameId.current) {
      animationFrameId.current = requestAnimationFrame(drawPointsOptimized);
    }
  };
  
  // Función para seguir el movimiento del mouse incluso cuando no se está dibujando
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    
    // Actualizar posición del cursor cuando se mueve el mouse
    setCursorPosition({ x, y });
  };
  
  const stopDrawing = () => {
    if (!isDrawing) return;
    
    // Dibujamos los puntos restantes
    if (pointsQueue.current.length > 0) {
      drawPointsOptimized();
    }
    
    // Finalizamos el dibujo
    const context = contextRef.current;
    if (context) {
      context.closePath();
    }
    
    setIsDrawing(false);
    
    // Ocultar el indicador visual del borrador
    if (activeTool === 'eraser') {
      setShowEraserIndicator(false);
    }
    
    // Guardamos el estado del canvas después de terminar el trazo
    saveCanvasState();
  };
  
  // Estado para rastrear la posición del cursor
  const [cursorPosition, setCursorPosition] = useState<{x: number, y: number} | null>(null);
  
  // Expose clear method
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).clear = clearCanvas;
    }
  }, []);
  
  // Funciones para cambiar herramientas
  const setTool = (tool: ToolMode) => {
    // Guardar el estado actual del canvas
    saveCanvasState();
    
    setActiveTool(tool);
    
    // Si tenemos contexto, actualizamos las propiedades
    if (contextRef.current) {
      const context = contextRef.current;
      
      if (tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
        context.lineWidth = eraserSize; // Aplicar directamente el tamaño grande al contexto
        setActiveWidth(eraserSize); // Actualizar también el estado
      } else {
        context.globalCompositeOperation = 'source-over';
        
        // Ajustar grosor según la herramienta
        if (tool === 'pen') {
          setActiveWidth(3);
          setActiveColor(darkMode ? '#ffffff' : '#333333');
        }
      }
    }
  };
  
  // Función para cambiar el tamaño del borrador directamente
  const setEraserSize = (index: number) => {
    // Cambiar el índice del tamaño
    setEraserSizeIndex(index);
    
    // Actualizar el contexto si es necesario
    if (activeTool === 'eraser' && contextRef.current) {
      contextRef.current.lineWidth = eraserSizes[index];
    }
    
    // Mostrar mensaje temporal con el tamaño
    setShowSizeMessage(true);
    
    // Ocultar después de 2 segundos
    setTimeout(() => {
      setShowSizeMessage(false);
    }, 2000);
  };
  
  // Función para asegurar que el tamaño del borrador se aplique correctamente
  const applyEraserSettings = () => {
    if (contextRef.current && activeTool === 'eraser') {
      contextRef.current.lineWidth = eraserSize;
      contextRef.current.globalCompositeOperation = 'destination-out';
    }
  };
  
  // Efectos para actualizar el contexto cuando cambia la herramienta
  useEffect(() => {
    if (contextRef.current) {
      if (activeTool === 'eraser') {
        contextRef.current.lineWidth = eraserSize;
        contextRef.current.globalCompositeOperation = 'destination-out';
      } else {
        contextRef.current.lineWidth = activeWidth;
        contextRef.current.globalCompositeOperation = 'source-over';
      }
    }
  }, [activeTool, eraserSize, activeWidth]);
  
  // Función para cambiar color
  const changeColor = (color: string) => {
    // Guardar el estado actual del canvas
    saveCanvasState();
    
    setActiveColor(color);
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
    }
  };
  


  // Función para dibujar los números del problema en el canvas
  const drawProblemNumbers = () => {
    if (!currentProblem || !contextRef.current || !canvasRef.current) return;
    
    // Guardar el estado actual del canvas
    saveCanvasState();
    
    const context = contextRef.current;
    const canvas = canvasRef.current;
    
    // Guardar las configuraciones actuales del contexto
    const originalStrokeStyle = context.strokeStyle;
    const originalLineWidth = context.lineWidth;
    const originalFont = context.font;
    const originalTextAlign = context.textAlign;
    const originalTextBaseline = context.textBaseline;
    const originalGlobalCompositeOperation = context.globalCompositeOperation;
    
    // Configurar el contexto para dibujar texto con alta calidad
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = darkMode ? '#ffffff' : '#000000';
    context.fillStyle = darkMode ? '#ffffff' : '#000000';
    context.lineWidth = 3; // Línea más gruesa para mejor visibilidad
    
    // Usar un DPR mejorado para mejor calidad
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    
    // Tamaño de fuente adaptativo basado en el ancho del canvas
    const baseFontSize = Math.min(Math.max(canvas.width / 40, 36), 48);
    context.font = `bold ${baseFontSize}px monospace`;
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    
    // Habilitar suavizado para mejor calidad de texto
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    // Calcular posición central ajustada por DPR
    const centerX = (canvas.width / dpr) / 2;
    const centerY = (canvas.height / dpr) / 2;
    
    // Calcular el espaciado basado en el tamaño de fuente
    const charWidth = baseFontSize * 0.6; // Ancho aproximado de un carácter
    const lineHeight = baseFontSize * 1.5; // Altura de línea proporcional al tamaño de fuente
    
    // Formatear los números
    const { operands } = currentProblem;
    const formattedOperands = operands.map((num: number) => num.toFixed(2));
    
    // Encontrar la longitud máxima para alineación
    const parts = formattedOperands.map((num: string) => {
      const [intPart, decPart] = num.split('.');
      return { intPart, decPart };
    });
    
    const maxIntLength = Math.max(...parts.map((p: {intPart: string, decPart: string}) => p.intPart.length));
    
    // Posiciones calculadas en base al tamaño de fuente
    const decimalOffset = charWidth; // Espacio para el punto decimal
    const decimalPartOffset = charWidth * 2; // Espacio para la parte decimal
    
    // Posición para alinear el signo + a la izquierda
    const signXPosition = centerX - (maxIntLength * charWidth) - charWidth;
    
    // RENDERIZADO ESPECÍFICO PARA PROPIEDAD ASOCIATIVA
    // Detectar el nivel de dificultad basado en el problema
    const difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced' = (() => {
      if (currentProblem.operands && currentProblem.operands.length >= 4) {
        return 'advanced';
      } else if (currentProblem.operands && currentProblem.operands.length === 3) {
        return 'intermediate';
      }
      return 'beginner';
    })();
    
    // Función para renderizar formato principiante - Agrupación visual simple
    const drawBeginnerFormat = () => {
      const spacing = baseFontSize * 1.5;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      const text1 = `(${operands[0]} + ${operands[1]}) + ${operands[2]}`;
      const text2 = `= ?`;
      
      context.fillText(text1, centerX, centerY - spacing/2);
      context.fillText(text2, centerX, centerY + spacing/2);
    };

    // Función para renderizar formato elemental - Completar espacios básico
    const drawElementaryFormat = () => {
      const spacing = baseFontSize * 1.2;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      const line1 = `(${operands[0]} + ${operands[1]}) + ${operands[2]} = ?`;
      const line2 = `Completa la otra forma:`;
      const line3 = `${operands[0]} + (_____ + _____) = ?`;
      
      context.fillText(line1, centerX, centerY - spacing);
      context.fillText(line2, centerX, centerY);
      context.fillText(line3, centerX, centerY + spacing);
    };

    // Función para renderizar formato intermedio - Verificación
    const drawIntermediateFormat = () => {
      const spacing = baseFontSize * 1.2;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      const line1 = `¿Son estas expresiones equivalentes?`;
      const line2 = `(${operands[0]} + ${operands[1]}) + ${operands[2]}`;
      const line3 = `${operands[0]} + (${operands[1]} + ${operands[2]})`;
      
      context.fillText(line1, centerX, centerY - spacing * 1.5);
      context.fillText(line2, centerX, centerY - spacing/2);
      context.fillText(line3, centerX, centerY + spacing/2);
    };

    // Función para renderizar formato avanzado - Completar espacios completo
    const drawAdvancedFormat = () => {
      const spacing = baseFontSize * 1.2;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      const line1 = `Completa la expresión equivalente`;
      const line2 = `(${operands[0]} + ${operands[1]}) + ${operands[2]} = ?`;
      const line3 = `Completa la otra forma:`;
      const line4 = `${operands[0]} + (_____ + _____) = _____`;
      
      // Usar un fontSize más pequeño para que quepa todo
      const smallFont = baseFontSize * 0.8;
      const originalFont = context.font;
      context.font = `${smallFont}px Arial`;
      
      context.fillText(line1, centerX, centerY - spacing * 1.5);
      context.fillText(line2, centerX, centerY - spacing/2);
      context.fillText(line3, centerX, centerY + spacing/2);
      context.fillText(line4, centerX, centerY + spacing * 1.5);
      
      // Restaurar font original
      context.font = originalFont;
    };
    
    // Renderizar según el nivel de dificultad
    switch(difficulty) {
      case 'beginner':
        drawBeginnerFormat();
        break;
      case 'elementary':
        drawElementaryFormat();
        break;
      case 'intermediate':
        drawIntermediateFormat();
        break;
      case 'advanced':
        drawAdvancedFormat();
        break;
      default:
        drawAdvancedFormat();
    }
    
    // Restaurar configuraciones originales
    context.strokeStyle = originalStrokeStyle;
    context.lineWidth = originalLineWidth;
    context.font = originalFont;
    context.textAlign = originalTextAlign;
    context.textBaseline = originalTextBaseline;
    context.globalCompositeOperation = originalGlobalCompositeOperation;
    
    // Guardar el nuevo estado del canvas
    saveCanvasState();
  };
  
  // Automatically draw problem numbers when a new problem is provided
  useEffect(() => {
    if (currentProblem && contextRef.current && canvasRef.current) {
      // Small delay to ensure canvas is ready
      const timer = setTimeout(() => {
        // Clear the canvas first before drawing new numbers
        clearCanvas();
        // Then draw the new problem numbers
        drawProblemNumbers();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentProblem]);
  
  // Función para alternar entre modo claro y oscuro
  const toggleDarkMode = () => {
    saveCanvasState();
    setDarkMode(!darkMode);
  };
  
  return (
    <div className={`drawing-canvas-container relative ${className}`}>
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          className={`drawing-canvas cursor-crosshair ${darkMode ? 'bg-gray-900' : 'bg-white'} w-full h-full`}
          onMouseDown={startDrawing}
          onMouseMove={(e) => {
            draw(e);
            handleMouseMove(e);
          }}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onContextMenu={(e) => {
            e.preventDefault(); // Prevenir menú contextual
            if (activeTool === 'eraser') {
              changeEraserSize();
            }
          }}
          style={{ touchAction: 'none' }}
        />
        
        {/* Indicador visual del borrador */}
        {showEraserIndicator && cursorPosition && activeTool === 'eraser' && (
          <div 
            className="absolute pointer-events-none border-2 border-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${cursorPosition.x}px`,
              top: `${cursorPosition.y}px`,
              width: `${eraserSize}px`,
              height: `${eraserSize}px`,
            }}
          />
        )}
        
        {/* Mensaje temporal del tamaño del borrador */}
        {showSizeMessage && activeTool === 'eraser' && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-90 text-white text-2xl px-8 py-6 rounded-lg z-50 flex flex-col items-center shadow-lg animate-fadeIn">
            <div className="text-5xl font-bold">{eraserSize}px</div>
          </div>
        )}
      </div>
      {/* Barra de herramientas */}
      <div className={`absolute top-20 ${position === 'right' ? 'right-4' : 'left-4'} flex flex-col gap-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-2 rounded-lg shadow`}>
        {/* Lápiz */}
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-full ${activeTool === 'pen' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          title="Lápiz"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </button>
        
        {/* Borrador con un solo botón */}
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-full ${activeTool === 'eraser' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          title="Borrador"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <path d="M15 2l7 7-7 7-7-7 7-7z"></path>
          </svg>
        </button>
        
        {/* Botón para dibujar números en el centro */}
        {currentProblem && (
          <button
            onClick={drawProblemNumbers}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="Dibujar números en el centro"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        )}
        
        {/* El borrador ya no necesita un panel permanente visible */}
        

        

      </div>
      {/* Panel de controles principal con paleta de colores y herramientas */}
      <div className={`absolute top-4 ${position === 'right' ? 'right-4' : 'left-4'} flex items-center gap-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-2 rounded-lg shadow`}>
        {/* Botón de modo oscuro */}
        <button
          onClick={toggleDarkMode}
          className={`mr-1 p-1.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full`}
          title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
        
        {/* Separador vertical */}
        <div className={`h-6 w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        
        {darkMode ? (
          // Colores para modo oscuro (pizarra negra)
          (<>
            <button onClick={() => changeColor('#ffffff')} className="w-6 h-6 rounded-full bg-white border border-gray-300 shadow-md" title="Blanco"></button>
            <button onClick={() => changeColor('#ff0000')} className="w-6 h-6 rounded-full bg-red-500 border border-gray-300" title="Rojo"></button>
            <button onClick={() => changeColor('#00ffff')} className="w-6 h-6 rounded-full bg-cyan-400 border border-gray-300" title="Cian"></button>
            <button onClick={() => changeColor('#ff00ff')} className="w-6 h-6 rounded-full bg-pink-500 border border-gray-300" title="Magenta"></button>
            <button onClick={() => changeColor('#ffff00')} className="w-6 h-6 rounded-full bg-yellow-400 border border-gray-300" title="Amarillo"></button>
            <button onClick={() => changeColor('#00ff00')} className="w-6 h-6 rounded-full bg-green-500 border border-gray-300" title="Verde"></button>
          </>)
        ) : (
          // Colores para modo claro (pizarra blanca)
          (<>
            <button onClick={() => changeColor('#333333')} className="w-6 h-6 rounded-full bg-gray-800 border border-gray-300" title="Negro"></button>
            <button onClick={() => changeColor('#ff0000')} className="w-6 h-6 rounded-full bg-red-500 border border-gray-300" title="Rojo"></button>
            <button onClick={() => changeColor('#0000ff')} className="w-6 h-6 rounded-full bg-blue-500 border border-gray-300" title="Azul"></button>
            <button onClick={() => changeColor('#00ff00')} className="w-6 h-6 rounded-full bg-green-500 border border-gray-300" title="Verde"></button>
            <button onClick={() => changeColor('#ffff00')} className="w-6 h-6 rounded-full bg-yellow-400 border border-gray-300" title="Amarillo"></button>
          </>)
        )}
        
        {/* Separador vertical */}
        <div className={`h-6 w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        
        {/* Botón para borrar todo - integrado con los otros controles */}
        <button
          onClick={clearCanvas}
          className={`p-1.5 ${darkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-100 hover:bg-red-200'} rounded-full text-red-600`}
          title="Borrar todo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
      {/* Ya no necesitamos el visualizador de problemas, ahora dibujamos directo en el canvas */}
    </div>
  );
}

export default DrawingCanvas;