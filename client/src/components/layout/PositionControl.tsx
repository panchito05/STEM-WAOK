import React from 'react';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

type PositionType = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';

interface ResponsivePosition {
  mobile?: {
    position?: PositionType;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: number;
    transform?: string;
  };
  tablet?: {
    position?: PositionType;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: number;
    transform?: string;
  };
  desktop?: {
    position?: PositionType;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: number;
    transform?: string;
  };
}

interface PositionControlProps {
  children: React.ReactNode;
  className?: string;
  responsive?: ResponsivePosition;
  
  // Props por defecto
  position?: PositionType;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;
  transform?: string;
  
  // Control de dimensiones
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  
  // Overflow control
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
  
  // Animaciones
  animate?: boolean;
  animationVariant?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'float';
  animationDelay?: number;
  animationDuration?: number;
}

export const PositionControl: React.FC<PositionControlProps> = ({
  children,
  className,
  responsive,
  position = 'static',
  top,
  right,
  bottom,
  left,
  zIndex,
  transform,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  overflow,
  overflowX,
  overflowY,
  animate = false,
  animationVariant = 'fadeIn',
  animationDelay = 0,
  animationDuration = 0.5,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getCurrentStyle = (): React.CSSProperties => {
    let currentProps = {
      position,
      top,
      right,
      bottom,
      left,
      zIndex,
      transform,
    };

    // Aplicar configuración responsive
    if (responsive) {
      if (isMobile && responsive.mobile) {
        currentProps = { ...currentProps, ...responsive.mobile };
      } else if (isTablet && responsive.tablet) {
        currentProps = { ...currentProps, ...responsive.tablet };
      } else if (isDesktop && responsive.desktop) {
        currentProps = { ...currentProps, ...responsive.desktop };
      }
    }

    return {
      position: currentProps.position,
      top: currentProps.top,
      right: currentProps.right,
      bottom: currentProps.bottom,
      left: currentProps.left,
      zIndex: currentProps.zIndex,
      transform: currentProps.transform,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      overflow,
      overflowX,
      overflowY,
    };
  };

  const animationVariants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: animationDuration, delay: animationDelay },
      },
    },
    slideUp: {
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: animationDuration, delay: animationDelay },
      },
    },
    slideLeft: {
      hidden: { opacity: 0, x: 30 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: animationDuration, delay: animationDelay },
      },
    },
    slideRight: {
      hidden: { opacity: 0, x: -30 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: animationDuration, delay: animationDelay },
      },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: animationDuration, delay: animationDelay },
      },
    },
    float: {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: animationDuration,
          delay: animationDelay,
          repeat: Infinity,
          repeatType: "reverse" as const,
          repeatDelay: 1,
        },
      },
    },
  };

  const Component = animate ? motion.div : 'div';
  const motionProps = animate
    ? {
        variants: animationVariants[animationVariant],
        initial: "hidden",
        animate: "visible",
      }
    : {};

  return (
    <Component
      className={cn('position-control', className)}
      style={getCurrentStyle()}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

// Hook para controlar posicionamiento extremo
export const useExtremePositioning = () => {
  const { width, height, isMobile, isTablet, isDesktop } = useResponsive();

  const centerElement = (elementWidth?: string, elementHeight?: string) => ({
    position: 'absolute' as PositionType,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%)`,
    width: elementWidth,
    height: elementHeight,
  });

  const cornerPositions = {
    topLeft: {
      position: 'absolute' as PositionType,
      top: '0',
      left: '0',
    },
    topRight: {
      position: 'absolute' as PositionType,
      top: '0',
      right: '0',
    },
    bottomLeft: {
      position: 'absolute' as PositionType,
      bottom: '0',
      left: '0',
    },
    bottomRight: {
      position: 'absolute' as PositionType,
      bottom: '0',
      right: '0',
    },
  };

  const edgePositions = {
    top: {
      position: 'absolute' as PositionType,
      top: '0',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    bottom: {
      position: 'absolute' as PositionType,
      bottom: '0',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    left: {
      position: 'absolute' as PositionType,
      left: '0',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    right: {
      position: 'absolute' as PositionType,
      right: '0',
      top: '50%',
      transform: 'translateY(-50%)',
    },
  };

  const createCustomPosition = (
    x: number,
    y: number,
    unit: 'px' | '%' | 'rem' | 'vh' | 'vw' = 'px'
  ) => ({
    position: 'absolute' as PositionType,
    left: `${x}${unit}`,
    top: `${y}${unit}`,
  });

  const createResponsivePosition = (
    mobile: { x: number; y: number },
    tablet: { x: number; y: number },
    desktop: { x: number; y: number },
    unit: 'px' | '%' | 'rem' | 'vh' | 'vw' = 'px'
  ) => {
    if (isMobile) return createCustomPosition(mobile.x, mobile.y, unit);
    if (isTablet) return createCustomPosition(tablet.x, tablet.y, unit);
    return createCustomPosition(desktop.x, desktop.y, unit);
  };

  return {
    centerElement,
    cornerPositions,
    edgePositions,
    createCustomPosition,
    createResponsivePosition,
    viewport: { width, height },
    device: { isMobile, isTablet, isDesktop },
  };
};