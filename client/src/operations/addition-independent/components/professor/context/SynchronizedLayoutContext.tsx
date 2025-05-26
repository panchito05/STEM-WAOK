import React, { createContext, useContext, useState, ReactNode } from 'react';

// Tipos para el sistema de layout sincronizado
export type PanelPosition = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
export type ColorPosition = 'left' | 'right';

export interface LayoutConfiguration {
  panelPosition: PanelPosition;
  colorPosition: ColorPosition;
  id: number;
}

// Configuración robusta de layouts sincronizados - Colores siempre un paso adelante
const SYNCHRONIZED_LAYOUTS: LayoutConfiguration[] = [
  { id: 1, panelPosition: 'topLeft', colorPosition: 'right' },     // Panel sup-izq → Colores sup-der
  { id: 2, panelPosition: 'topRight', colorPosition: 'left' },     // Panel sup-der → Colores inf-der  
  { id: 3, panelPosition: 'bottomRight', colorPosition: 'left' },  // Panel inf-der → Colores inf-izq
  { id: 4, panelPosition: 'bottomLeft', colorPosition: 'right' }   // Panel inf-izq → Colores sup-izq
];

interface SynchronizedLayoutContextType {
  currentLayout: LayoutConfiguration;
  moveToNextLayout: () => void;
  getPanelCSSClasses: () => string;
  getColorPosition: () => ColorPosition;
  getCurrentLayoutId: () => number;
}

const SynchronizedLayoutContext = createContext<SynchronizedLayoutContextType | undefined>(undefined);

interface SynchronizedLayoutProviderProps {
  children: ReactNode;
  initialLayoutId?: number;
}

export const SynchronizedLayoutProvider: React.FC<SynchronizedLayoutProviderProps> = ({
  children,
  initialLayoutId = 2 // Por defecto: Panel arriba-derecha, Colores derecha
}) => {
  // Estado del layout actual
  const [currentLayoutIndex, setCurrentLayoutIndex] = useState(() => {
    const index = SYNCHRONIZED_LAYOUTS.findIndex(layout => layout.id === initialLayoutId);
    return index >= 0 ? index : 1; // Fallback seguro
  });

  const currentLayout = SYNCHRONIZED_LAYOUTS[currentLayoutIndex];

  // Función para moverse al siguiente layout en sentido horario
  const moveToNextLayout = () => {
    const nextIndex = (currentLayoutIndex + 1) % SYNCHRONIZED_LAYOUTS.length;
    setCurrentLayoutIndex(nextIndex);
    
    const newLayout = SYNCHRONIZED_LAYOUTS[nextIndex];
    console.log(`🎯 [NEW ARCH] Layout sincronizado actualizado:`, {
      from: currentLayout,
      to: newLayout,
      layoutId: newLayout.id
    });
  };

  // Función para obtener las clases CSS del panel según la posición
  const getPanelCSSClasses = (): string => {
    const positionClasses = {
      topLeft: 'lg:top-4 lg:left-4',
      topRight: 'lg:top-4 lg:right-4',
      bottomLeft: 'lg:bottom-4 lg:left-4',
      bottomRight: 'lg:bottom-4 lg:right-4'
    };

    return positionClasses[currentLayout.panelPosition];
  };

  // Función para obtener la posición de los colores
  const getColorPosition = (): ColorPosition => {
    return currentLayout.colorPosition;
  };

  // Función para obtener el ID del layout actual
  const getCurrentLayoutId = (): number => {
    return currentLayout.id;
  };

  const contextValue: SynchronizedLayoutContextType = {
    currentLayout,
    moveToNextLayout,
    getPanelCSSClasses,
    getColorPosition,
    getCurrentLayoutId
  };

  return (
    <SynchronizedLayoutContext.Provider value={contextValue}>
      {children}
    </SynchronizedLayoutContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useSynchronizedLayout = (): SynchronizedLayoutContextType => {
  const context = useContext(SynchronizedLayoutContext);
  
  if (context === undefined) {
    throw new Error('useSynchronizedLayout debe ser usado dentro de un SynchronizedLayoutProvider');
  }
  
  return context;
};

// Utilidades adicionales para debugging y desarrollo
export const getAllLayouts = (): LayoutConfiguration[] => SYNCHRONIZED_LAYOUTS;

export const getLayoutById = (id: number): LayoutConfiguration | undefined => {
  return SYNCHRONIZED_LAYOUTS.find(layout => layout.id === id);
};