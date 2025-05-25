import React from 'react';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

interface ResponsiveFlexProps {
  mobile?: {
    direction?: FlexDirection;
    justify?: JustifyContent;
    align?: AlignItems;
    wrap?: FlexWrap;
    gap?: string;
    padding?: string;
  };
  tablet?: {
    direction?: FlexDirection;
    justify?: JustifyContent;
    align?: AlignItems;
    wrap?: FlexWrap;
    gap?: string;
    padding?: string;
  };
  desktop?: {
    direction?: FlexDirection;
    justify?: JustifyContent;
    align?: AlignItems;
    wrap?: FlexWrap;
    gap?: string;
    padding?: string;
  };
}

interface FlexBoxProps {
  children: React.ReactNode;
  className?: string;
  responsive?: ResponsiveFlexProps;
  
  // Props por defecto (se aplicarán si no hay responsive definido)
  direction?: FlexDirection;
  justify?: JustifyContent;
  align?: AlignItems;
  wrap?: FlexWrap;
  gap?: string;
  padding?: string;
  
  // Control de dimensiones
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  
  // Animaciones
  animate?: boolean;
  animationVariant?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale';
  staggerChildren?: number;
}

export const FlexBox: React.FC<FlexBoxProps> = ({
  children,
  className,
  responsive,
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap = '0',
  padding = '0',
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  animate = false,
  animationVariant = 'fadeIn',
  staggerChildren = 0.1,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getCurrentStyle = (): React.CSSProperties => {
    let currentProps = {
      direction,
      justify,
      align,
      wrap,
      gap,
      padding,
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
      display: 'flex',
      flexDirection: currentProps.direction,
      justifyContent: currentProps.justify,
      alignItems: currentProps.align,
      flexWrap: currentProps.wrap,
      gap: currentProps.gap,
      padding: currentProps.padding,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
    };
  };

  const animationVariants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.5,
          staggerChildren,
        },
      },
    },
    slideUp: {
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          staggerChildren,
        },
      },
    },
    slideLeft: {
      hidden: { opacity: 0, x: 30 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.5,
          staggerChildren,
        },
      },
    },
    slideRight: {
      hidden: { opacity: 0, x: -30 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.5,
          staggerChildren,
        },
      },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.5,
          staggerChildren,
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
      className={cn('flex-box', className)}
      style={getCurrentStyle()}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

interface FlexItemProps {
  children: React.ReactNode;
  className?: string;
  
  // Control flex individual
  flex?: string | number;
  grow?: number;
  shrink?: number;
  basis?: string;
  
  // Control de alineación individual
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  
  // Control responsive de propiedades flex
  responsive?: {
    mobile?: {
      flex?: string | number;
      grow?: number;
      shrink?: number;
      basis?: string;
      alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    };
    tablet?: {
      flex?: string | number;
      grow?: number;
      shrink?: number;
      basis?: string;
      alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    };
    desktop?: {
      flex?: string | number;
      grow?: number;
      shrink?: number;
      basis?: string;
      alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    };
  };
  
  // Animaciones específicas del item
  animate?: boolean;
  animationVariant?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale';
  delay?: number;
}

export const FlexItem: React.FC<FlexItemProps> = ({
  children,
  className,
  flex,
  grow,
  shrink,
  basis,
  alignSelf,
  responsive,
  animate = false,
  animationVariant = 'fadeIn',
  delay = 0,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getCurrentStyle = (): React.CSSProperties => {
    let currentProps = {
      flex,
      grow,
      shrink,
      basis,
      alignSelf,
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
      flex: currentProps.flex,
      flexGrow: currentProps.grow,
      flexShrink: currentProps.shrink,
      flexBasis: currentProps.basis,
      alignSelf: currentProps.alignSelf,
    };
  };

  const itemVariants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.5, delay },
      },
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay },
      },
    },
    slideLeft: {
      hidden: { opacity: 0, x: 20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, delay },
      },
    },
    slideRight: {
      hidden: { opacity: 0, x: -20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, delay },
      },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, delay },
      },
    },
  };

  const Component = animate ? motion.div : 'div';
  const motionProps = animate
    ? {
        variants: itemVariants[animationVariant],
        initial: "hidden",
        animate: "visible",
      }
    : {};

  return (
    <Component
      className={cn('flex-item', className)}
      style={getCurrentStyle()}
      {...motionProps}
    >
      {children}
    </Component>
  );
};