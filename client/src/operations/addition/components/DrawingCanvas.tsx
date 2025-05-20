import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ProblemViewer } from './ProblemViewer';
import { AdditionProblem } from '../types';

// Definir los diferentes modos de herramientas
type ToolMode = 'pen' | 'eraser' | 'problem-view';

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
  currentProblem?: any; // Problema actual para mostrar en la vista ampliada
}

export function DrawingCanvas({
  width = window.innerWidth,
  height = window.innerHeight,
  strokeColor = '#333333',
  strokeWidth = 3,
  className = '',
  onClear,
  position = 'right', // Nueva propiedad para posicionar los controles: 'left' o 'right'
  currentProblem = null
}: DrawingCanvasProps & { position?: 'left' | 'right' }) {
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
  
  // Estado para mostrar el visualizador del problema
  const [showProblemViewer, setShowProblemViewer] = useState<boolean>(false);
  
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
    
    // For high resolution screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Guarda el estado actual antes de resetear el canvas
    if (canvasRef.current) {
      saveCanvasState();
    }
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(dpr, dpr);
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
      
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Save the current drawing
      const prevDrawing = canvas.toDataURL();
      const img = new Image();
      
      img.onload = () => {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const context = contextRef.current;
        if (!context) return;
        
        context.scale(dpr, dpr);
        context.lineCap = 'round';
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth;
        
        // Restore the previous drawing
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
        
        {/* El borrador ya no necesita un panel permanente visible */}
        

        

      </div>
      
      {/* Selector de colores con modo oscuro integrado */}
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
          <>
            <button onClick={() => changeColor('#ffffff')} className="w-6 h-6 rounded-full bg-white border border-gray-300 shadow-md" title="Blanco"></button>
            <button onClick={() => changeColor('#ff0000')} className="w-6 h-6 rounded-full bg-red-500 border border-gray-300" title="Rojo"></button>
            <button onClick={() => changeColor('#00ffff')} className="w-6 h-6 rounded-full bg-cyan-400 border border-gray-300" title="Cian"></button>
            <button onClick={() => changeColor('#ff00ff')} className="w-6 h-6 rounded-full bg-pink-500 border border-gray-300" title="Magenta"></button>
            <button onClick={() => changeColor('#ffff00')} className="w-6 h-6 rounded-full bg-yellow-400 border border-gray-300" title="Amarillo"></button>
            <button onClick={() => changeColor('#00ff00')} className="w-6 h-6 rounded-full bg-green-500 border border-gray-300" title="Verde"></button>
          </>
        ) : (
          // Colores para modo claro (pizarra blanca)
          <>
            <button onClick={() => changeColor('#333333')} className="w-6 h-6 rounded-full bg-gray-800 border border-gray-300" title="Negro"></button>
            <button onClick={() => changeColor('#ff0000')} className="w-6 h-6 rounded-full bg-red-500 border border-gray-300" title="Rojo"></button>
            <button onClick={() => changeColor('#0000ff')} className="w-6 h-6 rounded-full bg-blue-500 border border-gray-300" title="Azul"></button>
            <button onClick={() => changeColor('#00ff00')} className="w-6 h-6 rounded-full bg-green-500 border border-gray-300" title="Verde"></button>
            <button onClick={() => changeColor('#ffff00')} className="w-6 h-6 rounded-full bg-yellow-400 border border-gray-300" title="Amarillo"></button>
          </>
        )}
      </div>
      
      {/* Botón para borrar todo - siempre en la esquina opuesta a las herramientas */}
      <button
        onClick={clearCanvas}
        className={`absolute bottom-4 ${position === 'right' ? 'left-4' : 'right-4'} p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full`}
        title="Borrar todo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    </div>
  );
}

export default DrawingCanvas;