import { useState, useEffect } from 'react';

// Breakpoints personalizados para control extremo
export const BREAKPOINTS = {
  xs: 320,      // Móviles pequeños
  sm: 480,      // Móviles medianos
  md: 768,      // Tablets portrait
  lg: 1024,     // Tablets landscape / Desktop pequeño
  xl: 1280,     // Desktop mediano
  xxl: 1536,    // Desktop grande
  xxxl: 1920,   // Desktop extra grande
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  breakpoint: BreakpointKey;
  pixelRatio: number;
  touchDevice: boolean;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
}

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1920,
        height: 1080,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLandscape: true,
        isPortrait: false,
        breakpoint: 'xl' as BreakpointKey,
        pixelRatio: 1,
        touchDevice: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const pixelRatio = window.devicePixelRatio || 1;
    const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    let breakpoint: BreakpointKey = 'xs';
    if (width >= BREAKPOINTS.xxxl) breakpoint = 'xxxl';
    else if (width >= BREAKPOINTS.xxl) breakpoint = 'xxl';
    else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
    else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
    else if (width >= BREAKPOINTS.md) breakpoint = 'md';
    else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';

    const isMobile = width < BREAKPOINTS.md;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
    const isDesktop = width >= BREAKPOINTS.lg;

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      isLandscape,
      isPortrait: !isLandscape,
      breakpoint,
      pixelRatio,
      touchDevice,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      const pixelRatio = window.devicePixelRatio || 1;
      const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      let breakpoint: BreakpointKey = 'xs';
      if (width >= BREAKPOINTS.xxxl) breakpoint = 'xxxl';
      else if (width >= BREAKPOINTS.xxl) breakpoint = 'xxl';
      else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
      else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
      else if (width >= BREAKPOINTS.md) breakpoint = 'md';
      else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';

      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isDesktop = width >= BREAKPOINTS.lg;

      setState({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        isPortrait: !isLandscape,
        breakpoint,
        pixelRatio,
        touchDevice,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
};

// Hook para detectar breakpoint específico
export const useBreakpoint = (breakpoint: BreakpointKey): boolean => {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[breakpoint];
};

// Hook para obtener información del dispositivo
export const useDeviceInfo = (): DeviceInfo => {
  const responsive = useResponsive();
  
  const type = responsive.isMobile ? 'mobile' : 
               responsive.isTablet ? 'tablet' : 'desktop';
  
  return {
    type,
    orientation: responsive.isLandscape ? 'landscape' : 'portrait',
    size: responsive.breakpoint,
  };
};

// Hook para múltiples breakpoints
export const useBreakpoints = () => {
  const { breakpoint, width } = useResponsive();
  
  return {
    xs: width >= BREAKPOINTS.xs,
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
    xxl: width >= BREAKPOINTS.xxl,
    xxxl: width >= BREAKPOINTS.xxxl,
    current: breakpoint,
    width,
  };
};