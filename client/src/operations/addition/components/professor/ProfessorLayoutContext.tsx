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
  resetToSafePosition: () => void;
  getLayoutDebugInfo: () => {
    currentState: LayoutState;
    isValid: boolean;
    availablePositions: LayoutPosition[];
    currentIndex: number;
  };
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

// Verificaciones de integridad del sistema
const validateLayoutState = (state: LayoutState): boolean => {
  const validPositions: LayoutPosition[] = ['position1', 'position2', 'position3', 'position4'];
  const validPanelLocations = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  const validColorLocations = ['left', 'right'];
  
  return validPositions.includes(state.position) &&
         validPanelLocations.includes(state.panelLocation) &&
         validColorLocations.includes(state.colorsLocation);
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
    try {
      // Validar estado actual
      if (!validateLayoutState(layoutState)) {
        console.warn('⚠️ [LAYOUT] Estado actual inválido, restaurando a posición por defecto');
        setLayoutState(LAYOUT_CONFIGURATIONS.position2);
        return;
      }

      const currentIndex = POSITION_SEQUENCE.indexOf(layoutState.position);
      
      // Manejar casos edge
      if (currentIndex === -1) {
        console.warn('⚠️ [LAYOUT] Posición actual no encontrada en secuencia, reiniciando');
        setLayoutState(LAYOUT_CONFIGURATIONS.position1);
        return;
      }

      const nextIndex = (currentIndex + 1) % POSITION_SEQUENCE.length;
      const nextPosition = POSITION_SEQUENCE[nextIndex];
      const nextLayoutState = LAYOUT_CONFIGURATIONS[nextPosition];
      
      // Validar nuevo estado antes de aplicar
      if (!validateLayoutState(nextLayoutState)) {
        console.error('🚨 [LAYOUT] Nueva configuración inválida, cancelando movimiento');
        return;
      }

      setLayoutState(nextLayoutState);
      
      console.log(`🎯 [LAYOUT] Movimiento exitoso: ${layoutState.position} → ${nextPosition}`);
      console.log(`📍 Panel: ${layoutState.panelLocation} → ${nextLayoutState.panelLocation}`);
      console.log(`🎨 Colores: ${layoutState.colorsLocation} → ${nextLayoutState.colorsLocation}`);
      
    } catch (error) {
      console.error('🚨 [LAYOUT] Error durante movimiento:', error);
      // Fallback seguro
      setLayoutState(LAYOUT_CONFIGURATIONS.position2);
    }
  }, [layoutState]);

  const getPanelClasses = useCallback(() => {
    try {
      const classMap = {
        'topLeft': 'lg:top-4 lg:left-4',
        'topRight': 'lg:top-4 lg:right-4',
        'bottomLeft': 'lg:bottom-4 lg:left-4',
        'bottomRight': 'lg:bottom-4 lg:right-4'
      };
      
      const classes = classMap[layoutState.panelLocation];
      if (!classes) {
        console.warn('⚠️ [LAYOUT] Clases de panel no encontradas, usando posición por defecto');
        return 'lg:top-4 lg:right-4'; // Fallback a position2
      }
      
      return classes;
    } catch (error) {
      console.error('🚨 [LAYOUT] Error obteniendo clases de panel:', error);
      return 'lg:top-4 lg:right-4';
    }
  }, [layoutState.panelLocation]);

  const getColorsPosition = useCallback(() => {
    try {
      if (!layoutState.colorsLocation || !['left', 'right'].includes(layoutState.colorsLocation)) {
        console.warn('⚠️ [LAYOUT] Posición de colores inválida, usando "right" por defecto');
        return 'right';
      }
      return layoutState.colorsLocation;
    } catch (error) {
      console.error('🚨 [LAYOUT] Error obteniendo posición de colores:', error);
      return 'right';
    }
  }, [layoutState.colorsLocation]);

  // Función para forzar reposicionamiento si hay problemas
  const resetToSafePosition = useCallback(() => {
    console.log('🔄 [LAYOUT] Reseteando a posición segura');
    setLayoutState(LAYOUT_CONFIGURATIONS.position2);
  }, []);

  // Función para obtener información de debugging
  const getLayoutDebugInfo = useCallback(() => {
    return {
      currentState: layoutState,
      isValid: validateLayoutState(layoutState),
      availablePositions: POSITION_SEQUENCE,
      currentIndex: POSITION_SEQUENCE.indexOf(layoutState.position)
    };
  }, [layoutState]);

  const contextValue: ProfessorLayoutContextType = {
    layoutState,
    moveToNextPosition,
    getPanelClasses,
    getColorsPosition,
    resetToSafePosition,
    getLayoutDebugInfo
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