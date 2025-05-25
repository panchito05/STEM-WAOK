import React, { useReducer, useCallback, useEffect } from 'react';

// Sistema ultra-robusto de gestión de layout
export type LayoutPosition = 'position1' | 'position2' | 'position3' | 'position4';

interface LayoutState {
  position: LayoutPosition;
  panelLocation: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  colorsLocation: 'left' | 'right';
  isTransitioning: boolean;
  lastValidState: LayoutState | null;
  errorCount: number;
}

type LayoutAction = 
  | { type: 'MOVE_NEXT' }
  | { type: 'MOVE_TO', position: LayoutPosition }
  | { type: 'START_TRANSITION' }
  | { type: 'END_TRANSITION' }
  | { type: 'ERROR_OCCURRED' }
  | { type: 'RESET_TO_SAFE' }
  | { type: 'RESTORE_LAST_VALID' };

// Configuraciones pre-validadas
const LAYOUT_CONFIGS: Record<LayoutPosition, Omit<LayoutState, 'isTransitioning' | 'lastValidState' | 'errorCount'>> = {
  position1: { position: 'position1', panelLocation: 'topLeft', colorsLocation: 'right' },
  position2: { position: 'position2', panelLocation: 'topRight', colorsLocation: 'right' },
  position3: { position: 'position3', panelLocation: 'bottomRight', colorsLocation: 'left' },
  position4: { position: 'position4', panelLocation: 'bottomLeft', colorsLocation: 'left' }
};

const POSITION_SEQUENCE: LayoutPosition[] = ['position1', 'position2', 'position3', 'position4'];

// Reducer ultra-robusto
function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  console.log(`🔄 [LAYOUT-REDUCER] Action: ${action.type}`, { currentState: state.position });

  switch (action.type) {
    case 'START_TRANSITION':
      return { ...state, isTransitioning: true };

    case 'END_TRANSITION':
      return { ...state, isTransitioning: false };

    case 'MOVE_NEXT': {
      try {
        const currentIndex = POSITION_SEQUENCE.indexOf(state.position);
        if (currentIndex === -1) {
          console.error('🚨 [LAYOUT] Posición actual inválida en secuencia');
          return { ...state, errorCount: state.errorCount + 1 };
        }

        const nextIndex = (currentIndex + 1) % POSITION_SEQUENCE.length;
        const nextPosition = POSITION_SEQUENCE[nextIndex];
        const nextConfig = LAYOUT_CONFIGS[nextPosition];

        return {
          ...nextConfig,
          isTransitioning: true,
          lastValidState: { ...state },
          errorCount: 0 // Reset error count on success
        };
      } catch (error) {
        console.error('🚨 [LAYOUT] Error en MOVE_NEXT:', error);
        return { ...state, errorCount: state.errorCount + 1 };
      }
    }

    case 'MOVE_TO': {
      try {
        const targetConfig = LAYOUT_CONFIGS[action.position];
        if (!targetConfig) {
          console.error('🚨 [LAYOUT] Configuración no encontrada para:', action.position);
          return { ...state, errorCount: state.errorCount + 1 };
        }

        return {
          ...targetConfig,
          isTransitioning: true,
          lastValidState: { ...state },
          errorCount: 0
        };
      } catch (error) {
        console.error('🚨 [LAYOUT] Error en MOVE_TO:', error);
        return { ...state, errorCount: state.errorCount + 1 };
      }
    }

    case 'ERROR_OCCURRED':
      return { ...state, errorCount: state.errorCount + 1 };

    case 'RESET_TO_SAFE': {
      const safeConfig = LAYOUT_CONFIGS.position2;
      console.log('🔄 [LAYOUT] Reseteando a posición segura');
      return {
        ...safeConfig,
        isTransitioning: false,
        lastValidState: null,
        errorCount: 0
      };
    }

    case 'RESTORE_LAST_VALID': {
      if (state.lastValidState) {
        console.log('🔄 [LAYOUT] Restaurando último estado válido');
        return { ...state.lastValidState, errorCount: 0 };
      }
      return state;
    }

    default:
      return state;
  }
}

// Hook personalizado para gestión de layout
export function useLayoutManager(initialPosition: LayoutPosition = 'position2') {
  const initialState: LayoutState = {
    ...LAYOUT_CONFIGS[initialPosition],
    isTransitioning: false,
    lastValidState: null,
    errorCount: 0
  };

  const [state, dispatch] = useReducer(layoutReducer, initialState);

  // Auto-recovery cuando hay demasiados errores
  useEffect(() => {
    if (state.errorCount >= 3) {
      console.warn('⚠️ [LAYOUT] Demasiados errores, iniciando auto-recovery');
      dispatch({ type: 'RESET_TO_SAFE' });
    }
  }, [state.errorCount]);

  // Funciones públicas
  const moveToNextPosition = useCallback(() => {
    if (state.isTransitioning) {
      console.warn('⚠️ [LAYOUT] Movimiento ignorado: transición en progreso');
      return false;
    }

    dispatch({ type: 'START_TRANSITION' });
    
    // Simular tiempo de transición
    setTimeout(() => {
      dispatch({ type: 'MOVE_NEXT' });
      setTimeout(() => {
        dispatch({ type: 'END_TRANSITION' });
      }, 300); // Duración de la transición CSS
    }, 50);

    return true;
  }, [state.isTransitioning]);

  const moveToPosition = useCallback((position: LayoutPosition) => {
    if (state.isTransitioning) {
      return false;
    }

    dispatch({ type: 'START_TRANSITION' });
    setTimeout(() => {
      dispatch({ type: 'MOVE_TO', position });
      setTimeout(() => {
        dispatch({ type: 'END_TRANSITION' });
      }, 300);
    }, 50);

    return true;
  }, [state.isTransitioning]);

  const resetToSafe = useCallback(() => {
    dispatch({ type: 'RESET_TO_SAFE' });
  }, []);

  const restoreLastValid = useCallback(() => {
    dispatch({ type: 'RESTORE_LAST_VALID' });
  }, []);

  // Funciones de utilidad
  const getPanelClasses = useCallback(() => {
    const classMap = {
      'topLeft': 'lg:top-4 lg:left-4',
      'topRight': 'lg:top-4 lg:right-4',
      'bottomLeft': 'lg:bottom-4 lg:left-4',
      'bottomRight': 'lg:bottom-4 lg:right-4'
    };

    return classMap[state.panelLocation] || 'lg:top-4 lg:right-4';
  }, [state.panelLocation]);

  const getColorsPosition = useCallback(() => {
    return state.colorsLocation;
  }, [state.colorsLocation]);

  const getDebugInfo = useCallback(() => {
    return {
      currentState: state,
      availablePositions: POSITION_SEQUENCE,
      currentIndex: POSITION_SEQUENCE.indexOf(state.position),
      canMove: !state.isTransitioning,
      errorCount: state.errorCount,
      hasLastValidState: !!state.lastValidState
    };
  }, [state]);

  return {
    // Estado
    layoutState: state,
    isTransitioning: state.isTransitioning,
    
    // Acciones
    moveToNextPosition,
    moveToPosition,
    resetToSafe,
    restoreLastValid,
    
    // Utilidades
    getPanelClasses,
    getColorsPosition,
    getDebugInfo
  };
}

export default useLayoutManager;