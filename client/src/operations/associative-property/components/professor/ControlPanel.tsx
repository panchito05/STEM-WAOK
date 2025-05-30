import React, { useEffect } from 'react';
import { PositionControl } from './PositionControl';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { CheckButton } from './CheckButton';
import { KeypadContainer } from './KeypadContainer';
import { AssociativePropertyProblem } from '../../types';
import { useSynchronizedLayout } from './context/SynchronizedLayoutContext';

type Position = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

interface ControlPanelProps {
  problem: AssociativePropertyProblem;
  position: Position;
  onPositionChange: (newPosition: Position) => void;
  userAnswer: string;
  onAnswerChange: (value: string) => void;
  attempts: number;
  maxAttempts: number;
  isCorrect: boolean | null;
  onCheck: () => void;
  showVerticalFormat?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  problem,
  position,
  onPositionChange,
  userAnswer,
  onAnswerChange,
  attempts,
  maxAttempts,
  isCorrect,
  onCheck,
  showVerticalFormat = true
}) => {
  // Usar el contexto de layout sincronizado
  const { currentLayout, getPanelCSSClasses } = useSynchronizedLayout();

  // Sistema de diagnóstico avanzado para sincronización de layout
  useEffect(() => {
    console.log(`🔍 [CONTROL-PANEL] ===== DIAGNÓSTICO AVANZADO =====`);
    console.log(`🔍 [CONTROL-PANEL] Layout sincronizado:`, currentLayout);
    console.log(`🔍 [CONTROL-PANEL] Position local actual: "${position}"`);
    console.log(`🔍 [CONTROL-PANEL] Position del layout: "${currentLayout.panelPosition}"`);
    console.log(`🔍 [CONTROL-PANEL] ¿Son diferentes?`, position !== currentLayout.panelPosition);
    console.log(`🔍 [CONTROL-PANEL] Función onPositionChange:`, typeof onPositionChange);
    console.log(`🔍 [CONTROL-PANEL] Timestamp:`, Date.now());
    
    // Solo actualizar si la posición local es diferente
    if (position !== currentLayout.panelPosition) {
      console.log(`🔍 [CONTROL-PANEL] 🔥 EJECUTANDO SINCRONIZACIÓN`);
      console.log(`🔍 [CONTROL-PANEL] Cambiando: "${position}" -> "${currentLayout.panelPosition}"`);
      console.log(`🔍 [CONTROL-PANEL] Llamando onPositionChange("${currentLayout.panelPosition}")`);
      onPositionChange(currentLayout.panelPosition);
      console.log(`🔍 [CONTROL-PANEL] ✅ onPositionChange ejecutado`);
    } else {
      console.log(`🔍 [CONTROL-PANEL] ⚠️ NO SE EJECUTA SINCRONIZACIÓN (posiciones iguales)`);
    }
    console.log(`🔍 [CONTROL-PANEL] ===== FIN DIAGNÓSTICO =====`);
  }, [currentLayout, position, onPositionChange]);

  // Función para obtener la posición correcta del ejercicio usando el sistema sincronizado
  const getPositionStyles = () => {
    console.log(`🔍 [STYLES] ===== CALCULANDO ESTILOS =====`);
    console.log(`🔍 [STYLES] Position local: "${position}"`);
    console.log(`🔍 [STYLES] Layout position: "${currentLayout.panelPosition}"`);
    
    // Usar las clases CSS del sistema sincronizado
    const cssClasses = getPanelCSSClasses();
    console.log(`🔍 [STYLES] CSS classes del sistema sincronizado:`, cssClasses);
    
    // Convertir clases CSS a styles inline para compatibilidad
    let styles = {};
    if (cssClasses.includes('lg:top-4') && cssClasses.includes('lg:right-4')) {
      styles = { top: '4px', right: '4px', left: 'auto', bottom: 'auto' };
      console.log(`🔍 [STYLES] ✅ Detectado topRight, aplicando:`, styles);
    } else if (cssClasses.includes('lg:bottom-4') && cssClasses.includes('lg:right-4')) {
      styles = { bottom: '4px', right: '4px', top: 'auto', left: 'auto' };
      console.log(`🔍 [STYLES] ✅ Detectado bottomRight, aplicando:`, styles);
    } else if (cssClasses.includes('lg:bottom-4') && cssClasses.includes('lg:left-4')) {
      styles = { bottom: '4px', left: '4px', top: 'auto', right: 'auto' };
      console.log(`🔍 [STYLES] ✅ Detectado bottomLeft, aplicando:`, styles);
    } else {
      // topLeft por defecto
      styles = { top: '4px', left: '4px', right: 'auto', bottom: 'auto' };
      console.log(`🔍 [STYLES] ✅ Usando topLeft por defecto, aplicando:`, styles);
    }
    
    console.log(`🔍 [STYLES] ===== ESTILOS FINALES =====`, styles);
    return styles;
  };

  return (
    <div 
      className="absolute z-10 w-[280px]" 
      style={getPositionStyles()}
    >
      {/* Move button para cambiar la posición */}
      <PositionControl 
        position={position} 
        onPositionChange={onPositionChange} 
      />
      
      {/* Problem display with information about attempts and problem count */}
      <ProblemDisplay
        problem={problem}
        showVerticalFormat={showVerticalFormat}
        attempts={attempts}
        maxAttempts={maxAttempts}
      />
      
      {/* Answer input */}
      <AnswerInput
        value={userAnswer}
        onChange={onAnswerChange}
        onClear={() => onAnswerChange('')}
      />
      
      {/* Check answer button */}
      <CheckButton
        onCheck={onCheck}
        disabled={!userAnswer}
        isCorrect={isCorrect}
      />
      
      {/* Numeric keypad */}
      <KeypadContainer
        onNumberClick={(num: number | string) => onAnswerChange(`${userAnswer}${num}`)}
        onBackspaceClick={() => onAnswerChange(userAnswer.slice(0, -1))}
        onDotClick={() => onAnswerChange(userAnswer.includes('.') ? userAnswer : `${userAnswer}.`)}
      />
    </div>
  );
};

export default ControlPanel;