import React from 'react';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface ResponsiveSpacing {
  mobile?: {
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
  };
  tablet?: {
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
  };
  desktop?: {
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
  };
}

interface SpacingControlProps {
  children: React.ReactNode;
  className?: string;
  responsive?: ResponsiveSpacing;
  
  // Margin props por defecto
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  
  // Padding props por defecto
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  
  // Background y border
  backgroundColor?: string;
  borderRadius?: string;
  border?: string;
  boxShadow?: string;
  
  // Animaciones
  animate?: boolean;
  animationVariant?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce';
  animationDelay?: number;
  animationDuration?: number;
}

export const SpacingControl: React.FC<SpacingControlProps> = ({
  children,
  className,
  responsive,
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  backgroundColor,
  borderRadius,
  border,
  boxShadow,
  animate = false,
  animationVariant = 'fadeIn',
  animationDelay = 0,
  animationDuration = 0.5,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getCurrentStyle = (): React.CSSProperties => {
    let currentProps = {
      margin,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      padding,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
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
      margin: currentProps.margin,
      marginTop: currentProps.marginTop,
      marginRight: currentProps.marginRight,
      marginBottom: currentProps.marginBottom,
      marginLeft: currentProps.marginLeft,
      padding: currentProps.padding,
      paddingTop: currentProps.paddingTop,
      paddingRight: currentProps.paddingRight,
      paddingBottom: currentProps.paddingBottom,
      paddingLeft: currentProps.paddingLeft,
      backgroundColor,
      borderRadius,
      border,
      boxShadow,
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
    bounce: {
      hidden: { opacity: 0, scale: 0.3 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: animationDuration,
          delay: animationDelay,
          type: "spring",
          damping: 10,
          stiffness: 100,
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
      className={cn('spacing-control', className)}
      style={getCurrentStyle()}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

// Hook para generar espaciado extremo y preciso
export const useExtremeSpacing = () => {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();

  // Sistema de espaciado escalable
  const spacingScale = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
    '5xl': '8rem',   // 128px
    '6xl': '12rem',  // 192px
  };

  // Espaciado responsive automático
  const getResponsiveSpacing = (
    mobile: keyof typeof spacingScale,
    tablet: keyof typeof spacingScale,
    desktop: keyof typeof spacingScale
  ) => {
    if (isMobile) return spacingScale[mobile];
    if (isTablet) return spacingScale[tablet];
    return spacingScale[desktop];
  };

  // Crear espaciado simétrico
  const createSymmetricSpacing = (size: keyof typeof spacingScale) => ({
    padding: spacingScale[size],
    margin: spacingScale[size],
  });

  // Crear espaciado asimétrico
  const createAsymmetricSpacing = (
    top: keyof typeof spacingScale,
    right: keyof typeof spacingScale,
    bottom: keyof typeof spacingScale,
    left: keyof typeof spacingScale
  ) => ({
    paddingTop: spacingScale[top],
    paddingRight: spacingScale[right],
    paddingBottom: spacingScale[bottom],
    paddingLeft: spacingScale[left],
  });

  // Espaciado contextual por tipo de contenido
  const contentSpacing = {
    button: {
      mobile: { padding: '0.75rem 1rem' },
      tablet: { padding: '1rem 1.5rem' },
      desktop: { padding: '1rem 2rem' },
    },
    card: {
      mobile: { padding: '1rem', margin: '0.5rem' },
      tablet: { padding: '1.5rem', margin: '1rem' },
      desktop: { padding: '2rem', margin: '1.5rem' },
    },
    section: {
      mobile: { padding: '2rem 1rem' },
      tablet: { padding: '3rem 2rem' },
      desktop: { padding: '4rem 3rem' },
    },
    container: {
      mobile: { padding: '1rem', maxWidth: '100%' },
      tablet: { padding: '2rem', maxWidth: '768px' },
      desktop: { padding: '3rem', maxWidth: '1200px' },
    },
  };

  // Obtener espaciado contextual
  const getContentSpacing = (type: keyof typeof contentSpacing) => {
    const spacing = contentSpacing[type];
    if (isMobile) return spacing.mobile;
    if (isTablet) return spacing.tablet;
    return spacing.desktop;
  };

  // Crear grid spacing avanzado
  const createGridSpacing = (
    columns: number,
    gap: keyof typeof spacingScale,
    containerPadding: keyof typeof spacingScale
  ) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: spacingScale[gap],
    padding: spacingScale[containerPadding],
  });

  return {
    spacingScale,
    getResponsiveSpacing,
    createSymmetricSpacing,
    createAsymmetricSpacing,
    contentSpacing,
    getContentSpacing,
    createGridSpacing,
    device: { isMobile, isTablet, isDesktop, breakpoint },
  };
};