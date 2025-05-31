import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AssociativePropertyProblem } from '../types';
import { DrawingFactory, DrawingConfig } from '../drawing';

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
  
  // Estado para la posición del cursor (para el indicador del borrador)
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);
  
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
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (context) {
      context.scale(dpr, dpr);
      contextRef.current = context;
      
      // Configurar las propiedades del contexto
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = activeColor;
      context.lineWidth = activeWidth;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      // Limpiar el canvas y establecer fondo
      context.fillStyle = darkMode ? '#1f2937' : '#ffffff';
      context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      
      // Restaurar el estado si había uno guardado
      setTimeout(() => {
        restoreCanvasState();
      }, 10);
    }
    
    const resizeHandler = () => {
      const newRect = canvas.getBoundingClientRect();
      if (newRect.width !== rect.width || newRect.height !== rect.height) {
        // Solo reajustar si realmente cambió el tamaño
        const newDpr = Math.max(window.devicePixelRatio || 1, 2);
        canvas.width = newRect.width * newDpr;
        canvas.height = newRect.height * newDpr;
        canvas.style.width = `${newRect.width}px`;
        canvas.style.height = `${newRect.height}px`;
        
        const newContext = canvas.getContext('2d');
        if (newContext) {
          newContext.scale(newDpr, newDpr);
          contextRef.current = newContext;
          newContext.lineCap = 'round';
          newContext.lineJoin = 'round';
          newContext.strokeStyle = activeColor;
          newContext.lineWidth = activeWidth;
          newContext.imageSmoothingEnabled = true;
          newContext.imageSmoothingQuality = 'high';
          
          // Limpiar y restaurar
          newContext.fillStyle = darkMode ? '#1f2937' : '#ffffff';
          newContext.fillRect(0, 0, canvas.width / newDpr, canvas.height / newDpr);
          restoreCanvasState();
        }
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, [activeColor, activeWidth, darkMode]);

  // Función para procesar los puntos de dibujo de forma optimizada
  const processDrawingPoints = useCallback(() => {
    if (pointsQueue.current.length === 0 || !contextRef.current) return;
    
    const context = contextRef.current;
    const points = pointsQueue.current;
    pointsQueue.current = [];
    
    if (activeTool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = eraserSize;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = activeColor;
      context.lineWidth = activeWidth;
    }
    
    context.beginPath();
    if (lastPoint.current) {
      context.moveTo(lastPoint.current.x, lastPoint.current.y);
    }
    
    points.forEach(point => {
      context.lineTo(point.x, point.y);
    });
    
    context.stroke();
    
    if (points.length > 0) {
      lastPoint.current = points[points.length - 1];
    }
  }, [activeTool, eraserSize, activeColor, activeWidth]);

  // Función para obtener las coordenadas del ratón/touch relativas al canvas
  const getEventCoordinates = (event: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0]?.clientX || event.changedTouches[0]?.clientX || 0;
      clientY = event.touches[0]?.clientY || event.changedTouches[0]?.clientY || 0;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Función para cambiar color
  const changeColor = (color: string) => {
    setActiveColor(color);
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
    }
  };

  // Función para cambiar herramienta
  const setTool = (tool: ToolMode) => {
    setActiveTool(tool);
    
    if (tool === 'eraser') {
      setShowEraserIndicator(true);
    } else {
      setShowEraserIndicator(false);
    }
  };

  // Función para cambiar el tamaño del borrador
  const changeEraserSize = () => {
    const nextIndex = (eraserSizeIndex + 1) % eraserSizes.length;
    setEraserSizeIndex(nextIndex);
    
    // Mostrar mensaje temporal
    setShowSizeMessage(true);
    setTimeout(() => setShowSizeMessage(false), 1000);
  };

  // Función para manejar el movimiento del mouse (para el indicador del borrador)
  const handleMouseMove = (event: React.MouseEvent) => {
    if (activeTool === 'eraser') {
      const coords = getEventCoordinates(event);
      setCursorPosition(coords);
    }
  };

  // Función para comenzar a dibujar
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const context = contextRef.current;
    if (!context) return;

    setIsDrawing(true);
    const coords = getEventCoordinates(event);
    lastPoint.current = coords;
    
    pointsQueue.current = [coords]; // Inicializar la cola con el primer punto
    
    // Procesar inmediatamente el primer punto
    requestAnimationFrame(processDrawingPoints);
  };

  // Función para dibujar
  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    
    const coords = getEventCoordinates(event);
    pointsQueue.current.push(coords);
    
    // Procesar puntos de forma suave usando requestAnimationFrame
    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(() => {
        processDrawingPoints();
        animationFrameId.current = null;
      });
    }
  };

  // Función para detener el dibujo
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPoint.current = null;
      
      // Procesar cualquier punto restante
      if (pointsQueue.current.length > 0) {
        processDrawingPoints();
      }
      
      // Cancelar cualquier animación pendiente
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      saveCanvasState();
    }
  };

  // Función para limpiar el canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    context.fillStyle = darkMode ? '#1f2937' : '#ffffff';
    context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    saveCanvasState();
    if (onClear) onClear();
  };

  // Función para dibujar los números del problema en el canvas
  const drawProblemNumbers = () => {
    if (!currentProblem || !contextRef.current || !canvasRef.current) return;
    
    // Guardar el estado actual del canvas
    saveCanvasState();
    
    const context = contextRef.current;
    const canvas = canvasRef.current;
    
    // Obtener el nivel de dificultad actual desde localStorage (debe coincidir con Exercise.tsx)
    let currentDifficulty = 'beginner'; // fallback por defecto
    try {
      const storedSettings = localStorage.getItem('moduleSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        const associativeSettings = parsedSettings["associative-property"];
        if (associativeSettings) {
          const enableAdaptive = associativeSettings.enableAdaptiveDifficulty;
          const adaptiveDiff = localStorage.getItem('associative-property_adaptiveDifficulty');
          const settingsDiff = associativeSettings.difficulty;
          
          currentDifficulty = enableAdaptive && adaptiveDiff ? adaptiveDiff : (settingsDiff || 'beginner');
        }
      }
    } catch (e) {
      console.error('[CANVAS] Error al obtener nivel de dificultad:', e);
    }
    
    // Crear configuración para el sistema de dibujo
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const baseFontSize = Math.min(canvas.width, canvas.height) / dpr / 20;
    const config: DrawingConfig = {
      canvas: canvas,
      dpr: dpr,
      centerX: canvas.width / dpr / 2,
      centerY: canvas.height / dpr / 2,
      baseFontSize: baseFontSize,
      charWidth: baseFontSize * 0.6,
      lineHeight: baseFontSize * 1.5,
      operands: currentProblem.operands,
      darkMode: darkMode
    };
    
    // Guardar configuraciones originales del contexto
    const originalStrokeStyle = context.strokeStyle;
    const originalLineWidth = context.lineWidth;
    const originalFont = context.font;
    const originalTextAlign = context.textAlign;
    const originalTextBaseline = context.textBaseline;
    const originalGlobalCompositeOperation = context.globalCompositeOperation;
    
    // Usar el factory para obtener el drawer apropiado y dibujar
    const drawer = DrawingFactory.create(currentDifficulty);
    drawer.draw(context, currentProblem, config);
    
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
    </div>
  );
}

export default DrawingCanvas;