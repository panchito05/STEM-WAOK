import React, { useRef, useEffect, useState } from 'react';

// Definir los diferentes modos de herramientas
type ToolMode = 'pen' | 'eraser' | 'highlighter' | 'line';

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
  onClear
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Estado para la herramienta activa y colores
  const [activeColor, setActiveColor] = useState<string>(strokeColor);
  const [activeWidth, setActiveWidth] = useState<number>(strokeWidth);
  const [activeTool, setActiveTool] = useState<ToolMode>('pen');
  
  // Initialize the canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // For high resolution screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
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
  }, [activeColor, activeWidth, activeTool]);
  
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
  
  // Drawing functions
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    setIsDrawing(true);
    
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
    
    context.beginPath();
    context.moveTo(x, y);
  };
  
  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    // Get the correct coordinates
    let x: number, y: number;
    
    if ('touches' in event) {
      // Touch event
      event.preventDefault(); // Prevent scrolling while drawing
      const rect = canvas.getBoundingClientRect();
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      const rect = canvas.getBoundingClientRect();
      x = event.nativeEvent.offsetX;
      y = event.nativeEvent.offsetY;
    }
    
    context.lineTo(x, y);
    context.stroke();
  };
  
  const stopDrawing = () => {
    if (!isDrawing) return;
    
    const context = contextRef.current;
    if (!context) return;
    
    context.closePath();
    setIsDrawing(false);
  };
  
  // Expose clear method
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).clear = clearCanvas;
    }
  }, []);
  
  // Funciones para cambiar herramientas
  const setTool = (tool: ToolMode) => {
    setActiveTool(tool);
    
    // Si tenemos contexto, actualizamos las propiedades
    if (contextRef.current) {
      const context = contextRef.current;
      
      if (tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
        setActiveWidth(20); // Borrador más grande
      } else {
        context.globalCompositeOperation = 'source-over';
        
        // Ajustar grosor según la herramienta
        if (tool === 'highlighter') {
          setActiveWidth(15);
          setActiveColor('#ffff0080'); // Amarillo transparente
        } else if (tool === 'pen') {
          setActiveWidth(3);
          setActiveColor('#333333');
        } else if (tool === 'line') {
          setActiveWidth(2);
          setActiveColor('#0000ff');
        }
      }
    }
  };
  
  // Función para cambiar color
  const changeColor = (color: string) => {
    setActiveColor(color);
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
    }
  };
  
  return (
    <div className={`drawing-canvas-container relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="drawing-canvas cursor-crosshair bg-white w-full h-full"
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
      <div className="absolute top-20 left-4 flex flex-col gap-2 bg-white p-2 rounded-lg shadow">
        {/* Lápiz */}
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-full ${activeTool === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          title="Lápiz"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </button>
        
        {/* Borrador */}
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-full ${activeTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          title="Borrador"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20h-4v-4h4v4z M4 20v-4h12v4H4z M4 12h4v4H4v-4z M16 12h4v4h-4v-4z"></path>
          </svg>
        </button>
        
        {/* Marcador */}
        <button
          onClick={() => setTool('highlighter')}
          className={`p-2 rounded-full ${activeTool === 'highlighter' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          title="Marcador"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l6 6 M6 18l-3 3 M12 6l6 6 M4 18L18 4"></path>
          </svg>
        </button>
      </div>
      
      {/* Selector de colores */}
      <div className="absolute top-4 left-4 flex gap-2 bg-white p-2 rounded-lg shadow">
        <button onClick={() => changeColor('#333333')} className="w-6 h-6 rounded-full bg-gray-800 border border-gray-300" title="Negro"></button>
        <button onClick={() => changeColor('#ff0000')} className="w-6 h-6 rounded-full bg-red-500 border border-gray-300" title="Rojo"></button>
        <button onClick={() => changeColor('#0000ff')} className="w-6 h-6 rounded-full bg-blue-500 border border-gray-300" title="Azul"></button>
        <button onClick={() => changeColor('#00ff00')} className="w-6 h-6 rounded-full bg-green-500 border border-gray-300" title="Verde"></button>
      </div>
      
      {/* Botón para borrar todo */}
      <button
        onClick={clearCanvas}
        className="absolute bottom-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
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