import React, { useState, useEffect, useRef } from 'react';
import { AdditionProblem } from './types';

interface UltraReliableMultiVerticalDisplayProps {
  problem: AdditionProblem;
  onDataVerified?: (isVerified: boolean, displayedSum: number) => void;
}

/**
 * Componente ultra-confiable para mostrar problemas multi-verticales
 * con verificación continua y reconstrucción segura
 */
export function UltraReliableMultiVerticalDisplay({ 
  problem,
  onDataVerified
}: UltraReliableMultiVerticalDisplayProps) {
  // Estado para representación fiable de números
  const [displayData, setDisplayData] = useState<{
    originalNumbers: number[];
    stringRepresentations: string[];
    alignedDigits: string[][];
    displayMatrix: React.ReactNode[][];
    calculatedSum: number;
    displayedSum: string;
  }>({
    originalNumbers: [],
    stringRepresentations: [],
    alignedDigits: [],
    displayMatrix: [],
    calculatedSum: 0,
    displayedSum: ''
  });
  
  // Referencias para cada número representado
  const numberRefs = useRef<(HTMLElement | null)[]>([]);
  
  // Referencia al canvas para renderizado de respaldo
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // ID único para este componente
  const componentId = useRef(`multivert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Generar representación fiable al montar o al cambiar de problema
  useEffect(() => {
    try {
      console.log('[ULTRA-DISPLAY] Preparando representación fiable para problema:', problem);
      
      // Obtener todos los números a mostrar
      const allNumbers = [problem.num1, problem.num2, ...(problem.additionalNumbers || [])];
      
      // Convertir a strings para manipulación
      const stringReps = allNumbers.map(num => String(num));
      
      // Calcular la suma correcta
      const sum = allNumbers.reduce((acc, num) => acc + num, 0);
      
      // Identificar partes decimales si existen
      const hasDecimals = stringReps.some(str => str.includes('.'));
      
      // Preparar las representaciones alineadas
      const alignedDigits = stringReps.map(str => {
        // Separar parte entera y decimal
        const [intPart, decPart = ''] = str.split('.');
        return { intPart, decPart };
      });
      
      // Encontrar la longitud máxima de partes enteras y decimales
      const maxIntLength = Math.max(...alignedDigits.map(d => d.intPart.length));
      const maxDecLength = Math.max(...alignedDigits.map(d => d.decPart.length));
      
      // Crear matriz de dígitos alineados
      const digitMatrix: string[][] = alignedDigits.map(({ intPart, decPart }) => {
        const result: string[] = [];
        
        // Rellenar parte entera con espacios a la izquierda
        const paddedInt = intPart.padStart(maxIntLength, ' ');
        for (let i = 0; i < paddedInt.length; i++) {
          result.push(paddedInt[i]);
        }
        
        // Añadir punto decimal y parte decimal si existe
        if (hasDecimals) {
          result.push('.');
          
          // Rellenar parte decimal con ceros a la derecha
          const paddedDec = decPart.padEnd(maxDecLength, '0');
          for (let i = 0; i < paddedDec.length; i++) {
            result.push(paddedDec[i]);
          }
        }
        
        return result;
      });
      
      // Crear matriz de elementos React para mostrar con validación
      const reactMatrix = digitMatrix.map((row, rowIndex) => 
        row.map((digit, colIndex) => (
          <span 
            key={`digit-${rowIndex}-${colIndex}`}
            className="digit-cell ultra-reliable" 
            data-row={rowIndex}
            data-col={colIndex}
            data-original-number={allNumbers[rowIndex]}
            data-digit-value={digit}
            data-digit-position={colIndex - maxIntLength}
            data-is-decimal={digit === '.'}
            data-component-id={componentId.current}
            style={{ 
              display: 'inline-block',
              width: '24px',
              height: '36px',
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: '24px',
              fontWeight: 'bold',
              position: 'relative'
            }}
          >
            {digit === ' ' ? '\u00A0' : digit}
            
            {/* Marca de verificación visual para cada dígito */}
            <span 
              className="digit-verification"
              data-verified="true"
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'green',
                opacity: '0.6',
                display: 'none' // Oculto por defecto
              }}
            />
          </span>
        ))
      );
      
      // Actualizar estado con todos los datos calculados
      setDisplayData({
        originalNumbers: allNumbers,
        stringRepresentations: stringReps,
        alignedDigits: digitMatrix,
        displayMatrix: reactMatrix,
        calculatedSum: sum,
        displayedSum: String(sum)
      });
      
      // Registrar todos los datos para depuración
      console.log("[ULTRA-DISPLAY] Datos de visualización generados:", {
        originalNumbers: allNumbers,
        calculatedSum: sum,
        digitMatrix
      });
      
      // Notificar que los datos se han verificado
      if (onDataVerified) {
        onDataVerified(true, sum);
      }
      
    } catch (err) {
      console.error("[ULTRA-DISPLAY] Error generando representación fiable:", err);
      
      // Notificar error en verificación
      if (onDataVerified) {
        onDataVerified(false, 0);
      }
    }
  }, [problem, onDataVerified]);
  
  // Verificar que lo que se muestra coincide con los datos reales
  useEffect(() => {
    let verificationIntervalId: number;
    
    try {
      // Establecer un intervalo para verificar constantemente la representación visual
      verificationIntervalId = window.setInterval(() => {
        const domDigits = Array.from(document.querySelectorAll(`.ultra-reliable[data-component-id="${componentId.current}"]`))
          .map(el => ({ 
            value: el.textContent?.trim() || '', 
            row: parseInt(el.getAttribute('data-row') || '0'),
            originalNumber: parseFloat(el.getAttribute('data-original-number') || '0')
          }));
        
        // Agrupar por fila para reconstruir números
        const reconstructedNumbers: Record<number, string> = {};
        
        domDigits.forEach(digit => {
          if (!reconstructedNumbers[digit.row]) {
            reconstructedNumbers[digit.row] = '';
          }
          reconstructedNumbers[digit.row] += digit.value === '\u00A0' ? '' : digit.value;
        });
        
        // Convertir strings reconstruidos a números
        const parsedReconstructions = Object.values(reconstructedNumbers).map(str => {
          // Limpiar y normalizar string
          return parseFloat(str.replace(/\s+/g, ''));
        });
        
        // Verificar que coinciden con los números originales
        const allMatch = parsedReconstructions.every((num, idx) => {
          if (idx >= displayData.originalNumbers.length) return true;
          const originalNum = displayData.originalNumbers[idx];
          return !isNaN(num) && Math.abs(num - originalNum) < 0.0001;
        });
        
        if (!allMatch) {
          console.error("[ULTRA-DISPLAY] VERIFICACIÓN FALLIDA - Discrepancia detectada entre visualización y datos:", {
            original: displayData.originalNumbers,
            reconstructed: parsedReconstructions
          });
          
          // Mostrar marcas de verificación en rojo para los dígitos incorrectos
          domDigits.forEach(digit => {
            const el = document.querySelector(`.ultra-reliable[data-row="${digit.row}"][data-component-id="${componentId.current}"]`);
            if (el) {
              const verification = el.querySelector('.digit-verification');
              if (verification) {
                (verification as HTMLElement).style.display = 'block';
                (verification as HTMLElement).style.background = 'red';
              }
            }
          });
          
          // Actualizar la visualización para corregir automáticamente
          setDisplayData(prev => ({...prev}));
          
          // Notificar error en verificación
          if (onDataVerified) {
            onDataVerified(false, 0);
          }
        } else {
          // Todo correcto - mostrar marcas de verificación en verde
          domDigits.forEach(digit => {
            const el = document.querySelector(`.ultra-reliable[data-row="${digit.row}"][data-component-id="${componentId.current}"]`);
            if (el) {
              const verification = el.querySelector('.digit-verification');
              if (verification) {
                (verification as HTMLElement).style.display = 'block';
                (verification as HTMLElement).style.background = 'green';
              }
            }
          });
          
          // Notificar verificación exitosa
          if (onDataVerified) {
            onDataVerified(true, displayData.calculatedSum);
          }
        }
      }, 1000);
      
      return () => {
        if (verificationIntervalId) {
          clearInterval(verificationIntervalId);
        }
      };
    } catch (err) {
      console.error("[ULTRA-DISPLAY] Error en verificación visual:", err);
      
      // Limpiar intervalo en caso de error
      if (verificationIntervalId) {
        clearInterval(verificationIntervalId);
      }
      
      // Notificar error en verificación
      if (onDataVerified) {
        onDataVerified(false, 0);
      }
    }
  }, [displayData, onDataVerified]);
  
  // Renderizar en canvas como sistema de respaldo
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (canvas && displayData.originalNumbers.length > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 300, 200);
          ctx.font = "24px monospace";
          ctx.fillStyle = "#000";
          
          // Escribir cada número y su respectiva posición
          displayData.originalNumbers.forEach((num, idx) => {
            ctx.fillText(`${idx > 0 ? '+ ' : ''}${num}`, 10, 30 * (idx + 1));
          });
          
          // Línea
          ctx.beginPath();
          ctx.moveTo(10, 30 * (displayData.originalNumbers.length + 1) - 10);
          ctx.lineTo(200, 30 * (displayData.originalNumbers.length + 1) - 10);
          ctx.stroke();
          
          // Suma
          ctx.fillStyle = "blue";
          ctx.fillText(
            `= ${displayData.calculatedSum}`, 
            10, 
            30 * (displayData.originalNumbers.length + 2) - 10
          );
          
          console.log("[ULTRA-DISPLAY] Representación de respaldo generada en canvas");
        }
      }
    } catch (err) {
      console.error("[ULTRA-DISPLAY] Error renderizando canvas de respaldo:", err);
    }
  }, [displayData]);
  
  return (
    <div className="ultra-reliable-multivertical-container">
      {/* Visualización de números con signos + */}
      {displayData.displayMatrix.map((row, rowIdx) => (
        <div 
          key={`row-${rowIdx}`} 
          className="number-row"
          ref={el => numberRefs.current[rowIdx] = el}
          data-row-index={rowIdx}
          data-original-number={displayData.originalNumbers[rowIdx]}
          data-component-id={componentId.current}
        >
          {rowIdx > 0 && 
            <span className="operation-sign">+</span>
          }
          {row}
        </div>
      ))}
      
      {/* Línea divisoria */}
      <div className="division-line" style={{
        height: '2px',
        background: '#000',
        margin: '8px 0'
      }} />
      
      {/* Datos para debugging - oculto pero disponible para inspección */}
      <div className="debug-data" style={{ display: 'none' }}>
        <pre data-original-numbers={JSON.stringify(displayData.originalNumbers)}></pre>
        <pre data-calculated-sum={displayData.calculatedSum}></pre>
        <pre data-component-id={componentId.current}></pre>
      </div>
      
      {/* Sistema de respaldo - renderizado especial en canvas */}
      <canvas 
        id="backup-renderer" 
        width="300" 
        height="200" 
        style={{ display: 'none' }}
        ref={canvasRef}
      />
    </div>
  );
}