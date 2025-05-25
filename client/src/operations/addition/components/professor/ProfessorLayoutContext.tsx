import React, { createContext, useContext, useState, useCallback } from 'react';

// Definir las posiciones disponibles
export type LayoutPosition = 'position1' | 'position2' | 'position3' | 'position4';

interface LayoutState {
  position: LayoutPosition;
  panelLocation: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  colorsLocation: 'left' | 'right';
}

interface ProfessorLayoutContextType {
  layoutState: LayoutState;
  moveToNextPosition: () => void;
  getPanelClasses: () => string;
  getColorsPosition: () => 'left' | 'right';
}

const ProfessorLayoutContext = createContext<ProfessorLayoutContextType | null>(null);

// Configuración unificada de todas las posiciones
const LAYOUT_CONFIGURATIONS: Record<LayoutPosition, LayoutState> = {
  position1: {
    position: 'position1',
    panelLocation: 'topLeft',
    colorsLocation: 'right'
  },
  position2: {
    position: 'position2', 
    panelLocation: 'topRight',
    colorsLocation: 'right'
  },
  position3: {
    position: 'position3',
    panelLocation: 'bottomRight', 
    colorsLocation: 'left'
  },
  position4: {
    position: 'position4',
    panelLocation: 'bottomLeft',
    colorsLocation: 'left'
  }
};

// Secuencia de movimiento en sentido horario
const POSITION_SEQUENCE: LayoutPosition[] = ['position1', 'position2', 'position3', 'position4'];

interface ProfessorLayoutProviderProps {
  children: React.ReactNode;
  initialPosition?: LayoutPosition;
}

export const ProfessorLayoutProvider: React.FC<ProfessorLayoutProviderProps> = ({ 
  children, 
  initialPosition = 'position2' // Iniciar en posición 2 por defecto para escritorio
}) => {
  const [layoutState, setLayoutState] = useState<LayoutState>(
    LAYOUT_CONFIGURATIONS[initialPosition]
  );

  const moveToNextPosition = useCallback(() => {
    const currentIndex = POSITION_SEQUENCE.indexOf(layoutState.position);
    const nextIndex = (currentIndex + 1) % POSITION_SEQUENCE.length;
    const nextPosition = POSITION_SEQUENCE[nextIndex];
    const nextLayoutState = LAYOUT_CONFIGURATIONS[nextPosition];
    
    setLayoutState(nextLayoutState);
    
    console.log(`🎯 [NEW ARCH] Moved to ${nextPosition}: Panel(${nextLayoutState.panelLocation}) + Colors(${nextLayoutState.colorsLocation})`);
  }, [layoutState.position]);

  const getPanelClasses = useCallback(() => {
    const classMap = {
      'topLeft': 'lg:top-4 lg:left-4',
      'topRight': 'lg:top-4 lg:right-4',
      'bottomLeft': 'lg:bottom-4 lg:left-4',
      'bottomRight': 'lg:bottom-4 lg:right-4'
    };
    
    return classMap[layoutState.panelLocation];
  }, [layoutState.panelLocation]);

  const getColorsPosition = useCallback(() => {
    return layoutState.colorsLocation;
  }, [layoutState.colorsLocation]);

  const contextValue: ProfessorLayoutContextType = {
    layoutState,
    moveToNextPosition,
    getPanelClasses,
    getColorsPosition
  };

  return (
    <ProfessorLayoutContext.Provider value={contextValue}>
      {children}
    </ProfessorLayoutContext.Provider>
  );
};

export const useProfessorLayout = (): ProfessorLayoutContextType => {
  const context = useContext(ProfessorLayoutContext);
  if (!context) {
    throw new Error('useProfessorLayout must be used within a ProfessorLayoutProvider');
  }
  return context;
};