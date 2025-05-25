import React from 'react';
import { motion } from 'framer-motion';
import { useResponsive, useDeviceInfo } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface GridArea {
  name: string;
  mobile?: string;    // Grid area para móviles
  tablet?: string;    // Grid area para tablets
  desktop?: string;   // Grid area para desktop
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  areas: GridArea[];
  
  // Templates para diferentes dispositivos
  mobileTemplate?: string;
  tabletTemplate?: string;
  desktopTemplate?: string;
  
  // Gaps personalizados
  gap?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  
  // Padding personalizado
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  
  // Control de altura
  height?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  
  // Animaciones
  animate?: boolean;
  animationDelay?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  areas,
  mobileTemplate,
  tabletTemplate,
  desktopTemplate,
  gap = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
  padding = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
  height = { mobile: 'auto', tablet: 'auto', desktop: 'auto' },
  animate = true,
  animationDelay = 0.1,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const deviceInfo = useDeviceInfo();

  // Determinar template y propiedades según dispositivo
  const getGridTemplate = () => {
    if (isMobile && mobileTemplate) return mobileTemplate;
    if (isTablet && tabletTemplate) return tabletTemplate;
    if (isDesktop && desktopTemplate) return desktopTemplate;
    return desktopTemplate || tabletTemplate || mobileTemplate || '';
  };

  const getCurrentGap = () => {
    if (isMobile) return gap.mobile;
    if (isTablet) return gap.tablet;
    return gap.desktop;
  };

  const getCurrentPadding = () => {
    if (isMobile) return padding.mobile;
    if (isTablet) return padding.tablet;
    return padding.desktop;
  };

  const getCurrentHeight = () => {
    if (isMobile) return height.mobile;
    if (isTablet) return height.tablet;
    return height.desktop;
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateAreas: getGridTemplate(),
    gap: getCurrentGap(),
    padding: getCurrentPadding(),
    height: getCurrentHeight(),
    width: '100%',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animationDelay,
      },
    },
  };

  const Component = animate ? motion.div : 'div';
  const motionProps = animate
    ? {
        variants: containerVariants,
        initial: "hidden",
        animate: "visible",
      }
    : {};

  return (
    <Component
      className={cn('responsive-grid', className)}
      style={gridStyle}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

interface GridItemProps {
  children: React.ReactNode;
  area: string;
  className?: string;
  
  // Control de posicionamiento por dispositivo
  position?: {
    mobile?: React.CSSProperties;
    tablet?: React.CSSProperties;
    desktop?: React.CSSProperties;
  };
  
  // Control de dimensiones por dispositivo
  size?: {
    mobile?: { width?: string; height?: string };
    tablet?: { width?: string; height?: string };
    desktop?: { width?: string; height?: string };
  };
  
  // Animaciones específicas del item
  animate?: boolean;
  animationVariant?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'custom';
  customAnimation?: any;
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  area,
  className,
  position,
  size,
  animate = true,
  animationVariant = 'fadeIn',
  customAnimation,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getCurrentPosition = () => {
    if (isMobile && position?.mobile) return position.mobile;
    if (isTablet && position?.tablet) return position.tablet;
    if (isDesktop && position?.desktop) return position.desktop;
    return {};
  };

  const getCurrentSize = () => {
    let currentSize = {};
    if (isMobile && size?.mobile) currentSize = size.mobile;
    else if (isTablet && size?.tablet) currentSize = size.tablet;
    else if (isDesktop && size?.desktop) currentSize = size.desktop;
    return currentSize;
  };

  const itemStyle: React.CSSProperties = {
    gridArea: area,
    ...getCurrentPosition(),
    ...getCurrentSize(),
  };

  const animationVariants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5 } },
    },
    slideUp: {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    },
    slideLeft: {
      hidden: { opacity: 0, x: 30 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    },
    slideRight: {
      hidden: { opacity: 0, x: -30 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    },
  };

  const Component = animate ? motion.div : 'div';
  const currentVariants = customAnimation || (animationVariant !== 'custom' ? animationVariants[animationVariant] : animationVariants.fadeIn);
  const motionProps = animate
    ? {
        variants: currentVariants,
        initial: "hidden",
        animate: "visible",
      }
    : {};

  return (
    <Component
      className={cn('grid-item', className)}
      style={itemStyle}
      {...motionProps}
    >
      {children}
    </Component>
  );
};