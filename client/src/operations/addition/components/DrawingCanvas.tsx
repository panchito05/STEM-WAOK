import React, { useRef, useEffect, useState, useCallback } from 'react';

// Definir los diferentes modos de herramientas
type ToolMode = 'pen' | 'eraser' | 'highlighter' | 'line';

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
}

export function DrawingCanvas({
  width = window.innerWidth,
  height = window.innerHeight,
  strokeColor = '#333333',
  strokeWidth = 3,
  className = '',
  onClear,
  position = 'right' // Nueva propiedad para posicionar los controles: 'left' o 'right'
}: DrawingCanvasProps & { position?: 'left' | 'right' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Estado para la herramienta activa y colores
  const [activeColor, setActiveColor] = useState<string>(strokeColor);
  const [activeWidth, setActiveWidth] = useState<number>(strokeWidth);
  const [activeTool, setActiveTool] = useState<ToolMode>('pen');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Estado para tamaño del borrador
  const [eraserSize, setEraserSize] = useState<number>(15);
  
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
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevenir comportamiento por defecto
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
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
    
    // Añadimos el punto a la cola para ser dibujado en el próximo frame
    pointsQueue.current.push({ x, y });
    
    // Nos aseguramos de que la animación esté activa
    if (!animationFrameId.current) {
      animationFrameId.current = requestAnimationFrame(drawPointsOptimized);
    }
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
    
    // Guardamos el estado del canvas después de terminar el trazo
    saveCanvasState();
  };
  
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
        setActiveWidth(eraserSize); // Usar el tamaño de borrador definido
      } else {
        context.globalCompositeOperation = 'source-over';
        
        // Ajustar grosor según la herramienta
        if (tool === 'highlighter') {
          setActiveWidth(15);
          setActiveColor('#ffff0080'); // Amarillo transparente
        } else if (tool === 'pen') {
          setActiveWidth(3);
          setActiveColor(darkMode ? '#ffffff' : '#333333');
        } else if (tool === 'line') {
          setActiveWidth(2);
          setActiveColor('#0000ff');
        }
      }
    }
  };
  
  // Función para cambiar el tamaño del borrador
  const changeEraserSize = (size: number) => {
    setEraserSize(size);
    if (activeTool === 'eraser' && contextRef.current) {
      setActiveWidth(size);
    }
  };
  
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
      <canvas
        ref={canvasRef}
        className={`drawing-canvas cursor-crosshair ${darkMode ? 'bg-gray-900' : 'bg-white'} w-full h-full`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }}
      />
      
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
        
        {/* Control deslizante para el tamaño del borrador */}
        {activeTool === 'eraser' && (
          <div className={`w-full px-1 py-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
            <p className="text-xs mb-1 text-center">Tamaño: {eraserSize}</p>
            <input 
              type="range" 
              min="5" 
              max="50" 
              value={eraserSize} 
              onChange={(e) => changeEraserSize(parseInt(e.target.value))} 
              className="w-full cursor-pointer"
            />
          </div>
        )}
        
        {/* Marcador */}
        <button
          onClick={() => setTool('highlighter')}
          className={`p-2 rounded-full ${activeTool === 'highlighter' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          title="Marcador"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l6 6 M6 18l-3 3 M12 6l6 6 M4 18L18 4"></path>
          </svg>
        </button>
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
            <button onClick={() => changeColor('#ffffff')} className="w-6 h-6 rounded-full bg-white border border-gray-300" title="Blanco"></button>
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