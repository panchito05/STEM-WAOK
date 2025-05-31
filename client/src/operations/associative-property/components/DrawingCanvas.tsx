import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AssociativePropertyProblem } from '../types';
import { DrawingFactory, DrawingConfig } from '../drawing';

// Definir los diferentes modos de herramientas
type ToolMode = 'pen' | 'eraser';

// Estructura para representar un punto en el canvas
interface Point {
  x: number;
  y: number;
}

// Props del componente DrawingCanvas
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolMode>('pen');
  const [darkMode, setDarkMode] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Configurar el canvas cuando se monta el componente
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ajustar el tamaño del canvas al contenedor
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const context = canvas.getContext('2d');
      if (context) {
        context.scale(dpr, dpr);
        contextRef.current = context;
        
        // Configuración inicial del contexto
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth;
        
        // Limpiar el canvas y establecer fondo
        context.fillStyle = darkMode ? '#1f2937' : '#ffffff';
        context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Guardar estado inicial
        saveCanvasState();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [strokeColor, strokeWidth, darkMode]);

  // Función para guardar el estado actual del canvas
  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = canvasHistory.slice(0, currentHistoryIndex + 1);
    newHistory.push(imageData);
    
    // Limitar el historial a 50 estados para evitar problemas de memoria
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setCurrentHistoryIndex(prev => prev + 1);
    }
    
    setCanvasHistory(newHistory);
  }, [canvasHistory, currentHistoryIndex]);

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

  // Función para comenzar a dibujar
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const context = contextRef.current;
    if (!context) return;

    setIsDrawing(true);
    const coords = getEventCoordinates(event);
    
    context.beginPath();
    context.moveTo(coords.x, coords.y);
  };

  // Función para dibujar
  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    
    const context = contextRef.current;
    if (!context) return;

    const coords = getEventCoordinates(event);
    
    if (currentTool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = strokeWidth * 2;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = darkMode ? '#ffffff' : strokeColor;
      context.lineWidth = strokeWidth;
    }
    
    context.lineTo(coords.x, coords.y);
    context.stroke();
  };

  // Función para detener el dibujo
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasState();
    }
  };

  // Función para limpiar el canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const dpr = window.devicePixelRatio || 1;
    context.fillStyle = darkMode ? '#1f2937' : '#ffffff';
    context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    saveCanvasState();
    if (onClear) onClear();
  };

  // Función para cambiar la herramienta de dibujo
  const setTool = (tool: ToolMode) => {
    setCurrentTool(tool);
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
    const baseFontSize = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1) / 20;
    const config: DrawingConfig = {
      canvas: canvas,
      dpr: window.devicePixelRatio || 1,
      centerX: canvas.width / (window.devicePixelRatio || 1) / 2,
      centerY: canvas.height / (window.devicePixelRatio || 1) / 2,
      baseFontSize: baseFontSize,
      charWidth: baseFontSize * 0.6,
      lineHeight: baseFontSize * 1.5,
      operands: currentProblem.operands,
      darkMode: darkMode
    };
    
    // Usar el factory para obtener el drawer apropiado y dibujar
    const drawer = DrawingFactory.create(currentDifficulty);
    drawer.draw(context, currentProblem, config);
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
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Controls positioned according to the position prop */}
        <div className={`absolute top-4 ${position === 'left' ? 'left-4' : 'right-4'} flex ${position === 'left' ? 'flex-row' : 'flex-row-reverse'} gap-2 z-10`}>
          {/* Clear Button */}
          <button
            onClick={clearCanvas}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Limpiar
          </button>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`${darkMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-700 hover:bg-gray-800'} text-white px-3 py-2 rounded-md text-sm font-medium transition-colors`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {/* Tool Selection */}
          <div className="flex bg-white rounded-md shadow-sm border">
            <button
              onClick={() => setTool('pen')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md transition-colors ${
                currentTool === 'pen' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ✏️
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-l transition-colors ${
                currentTool === 'eraser' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🧽
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DrawingCanvas;