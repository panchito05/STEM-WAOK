import React, { useRef, useEffect, useState } from 'react';

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
  height = window.innerHeight * 0.6,
  strokeColor = '#333333',
  strokeWidth = 3,
  className = '',
  onClear
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
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
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    
    contextRef.current = context;
  }, [strokeColor, strokeWidth]);
  
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
  
  return (
    <div className={`drawing-canvas-container relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="drawing-canvas border border-gray-200 rounded-lg cursor-crosshair bg-white w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }}
      />
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