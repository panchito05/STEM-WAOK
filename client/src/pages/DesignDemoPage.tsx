import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveGrid, GridItem } from '@/components/layout/ResponsiveGrid';
import { FlexBox, FlexItem } from '@/components/layout/FlexBox';
import { PositionControl, useExtremePositioning } from '@/components/layout/PositionControl';
import { SpacingControl, useExtremeSpacing } from '@/components/layout/SpacingControl';
import { useResponsive, useDeviceInfo, useBreakpoints } from '@/hooks/useResponsive';
import { Monitor, Tablet, Smartphone, Layers, Grid, Move } from 'lucide-react';

export default function DesignDemoPage() {
  const [activeDemo, setActiveDemo] = useState<'grid' | 'flex' | 'position' | 'spacing'>('grid');
  const responsive = useResponsive();
  const deviceInfo = useDeviceInfo();
  const breakpoints = useBreakpoints();
  const positioning = useExtremePositioning();
  const spacing = useExtremeSpacing();

  const DeviceIcon = responsive.isMobile ? Smartphone : responsive.isTablet ? Tablet : Monitor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header con información del dispositivo */}
      <PositionControl
        position="sticky"
        top="0"
        zIndex={50}
        className="backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b"
      >
        <SpacingControl
          responsive={{
            mobile: { padding: '1rem' },
            tablet: { padding: '1.5rem' },
            desktop: { padding: '2rem' }
          }}
        >
          <FlexBox
            responsive={{
              mobile: { direction: 'column', gap: '1rem' },
              tablet: { direction: 'row', justify: 'space-between', align: 'center', gap: '1rem' },
              desktop: { direction: 'row', justify: 'space-between', align: 'center', gap: '2rem' }
            }}
            animate
            animationVariant="slideUp"
          >
            <FlexItem>
              <FlexBox direction="row" align="center" gap="0.75rem">
                <DeviceIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-xl mobile-l:text-2xl desktop-s:text-3xl font-bold text-gray-900 dark:text-white">
                    Control Extremo de Diseño
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {deviceInfo.type} • {responsive.width}x{responsive.height} • {breakpoints.current}
                  </p>
                </div>
              </FlexBox>
            </FlexItem>
            
            <FlexItem>
              <FlexBox direction="row" gap="0.5rem" wrap="wrap">
                <Badge variant={responsive.isMobile ? "default" : "secondary"}>
                  Móvil: {responsive.isMobile ? 'Sí' : 'No'}
                </Badge>
                <Badge variant={responsive.isTablet ? "default" : "secondary"}>
                  Tablet: {responsive.isTablet ? 'Sí' : 'No'}
                </Badge>
                <Badge variant={responsive.isDesktop ? "default" : "secondary"}>
                  Desktop: {responsive.isDesktop ? 'Sí' : 'No'}
                </Badge>
              </FlexBox>
            </FlexItem>
          </FlexBox>
        </SpacingControl>
      </PositionControl>

      {/* Navegación de demos */}
      <SpacingControl
        responsive={{
          mobile: { padding: '1rem' },
          tablet: { padding: '1.5rem 2rem' },
          desktop: { padding: '2rem 3rem' }
        }}
      >
        <FlexBox
          responsive={{
            mobile: { direction: 'column', gap: '0.5rem' },
            tablet: { direction: 'row', gap: '1rem' },
            desktop: { direction: 'row', gap: '1.5rem' }
          }}
          animate
          animationVariant="slideUp"
          staggerChildren={0.1}
        >
          {[
            { id: 'grid', label: 'Grid Responsive', icon: Grid },
            { id: 'flex', label: 'FlexBox Avanzado', icon: Layers },
            { id: 'position', label: 'Posicionamiento', icon: Move },
            { id: 'spacing', label: 'Espaciado Extremo', icon: Layers },
          ].map(({ id, label, icon: Icon }) => (
            <FlexItem key={id} animate animationVariant="slideUp">
              <Button
                variant={activeDemo === id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveDemo(id as any)}
                className="w-full tablet-s:w-auto"
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            </FlexItem>
          ))}
        </FlexBox>
      </SpacingControl>

      {/* Demo del Grid Responsive */}
      {activeDemo === 'grid' && (
        <SpacingControl
          responsive={{
            mobile: { padding: '1rem' },
            tablet: { padding: '1.5rem 2rem' },
            desktop: { padding: '2rem 3rem' }
          }}
        >
          <ResponsiveGrid
            areas={[
              { name: 'header' },
              { name: 'sidebar' },
              { name: 'main' },
              { name: 'aside' },
              { name: 'footer' }
            ]}
            mobileTemplate={`
              "header"
              "main"
              "aside"
              "sidebar"
              "footer"
            `}
            tabletTemplate={`
              "header header"
              "sidebar main"
              "sidebar aside"
              "footer footer"
            `}
            desktopTemplate={`
              "header header header header"
              "sidebar main main aside"
              "sidebar main main aside"
              "footer footer footer footer"
            `}
            gap={{
              mobile: '1rem',
              tablet: '1.5rem',
              desktop: '2rem'
            }}
            animate
            animationDelay={0.2}
          >
            <GridItem area="header" animate animationVariant="slideUp">
              <Card className="h-20 bg-gradient-to-r from-blue-500 to-purple-600">
                <CardContent className="p-4 h-full flex items-center justify-center">
                  <h2 className="text-white font-bold text-lg">Header Responsivo</h2>
                </CardContent>
              </Card>
            </GridItem>

            <GridItem area="sidebar" animate animationVariant="slideLeft">
              <Card className="h-64 tablet-s:h-80 desktop-s:h-96 bg-gradient-to-b from-green-400 to-green-600">
                <CardContent className="p-4 h-full flex items-center justify-center">
                  <h3 className="text-white font-bold text-center">
                    Sidebar
                    <br />
                    <span className="text-sm opacity-80">
                      {responsive.isMobile ? 'Abajo en móvil' : 'Lateral en tablet/desktop'}
                    </span>
                  </h3>
                </CardContent>
              </Card>
            </GridItem>

            <GridItem area="main" animate animationVariant="scale">
              <Card className="h-64 tablet-s:h-80 desktop-s:h-96 bg-gradient-to-br from-orange-400 to-red-500">
                <CardContent className="p-6 h-full">
                  <h3 className="text-white font-bold text-xl mb-4">Contenido Principal</h3>
                  <div className="text-white/90 space-y-2">
                    <p>Breakpoint actual: <strong>{breakpoints.current}</strong></p>
                    <p>Ancho: <strong>{responsive.width}px</strong></p>
                    <p>Dispositivo: <strong>{deviceInfo.type}</strong></p>
                    <p>Orientación: <strong>{deviceInfo.orientation}</strong></p>
                  </div>
                </CardContent>
              </Card>
            </GridItem>

            <GridItem area="aside" animate animationVariant="slideRight">
              <Card className="h-32 tablet-s:h-80 desktop-s:h-96 bg-gradient-to-t from-purple-400 to-pink-500">
                <CardContent className="p-4 h-full flex items-center justify-center">
                  <h3 className="text-white font-bold text-center">
                    Widget
                    <br />
                    <span className="text-sm opacity-80">
                      Adapta su altura automáticamente
                    </span>
                  </h3>
                </CardContent>
              </Card>
            </GridItem>

            <GridItem area="footer" animate animationVariant="slideUp">
              <Card className="h-16 bg-gradient-to-r from-gray-700 to-gray-900">
                <CardContent className="p-4 h-full flex items-center justify-center">
                  <p className="text-white">Footer • Siempre al final</p>
                </CardContent>
              </Card>
            </GridItem>
          </ResponsiveGrid>
        </SpacingControl>
      )}

      {/* Demo de FlexBox Avanzado */}
      {activeDemo === 'flex' && (
        <SpacingControl
          responsive={{
            mobile: { padding: '1rem' },
            tablet: { padding: '1.5rem 2rem' },
            desktop: { padding: '2rem 3rem' }
          }}
        >
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>FlexBox Responsive</CardTitle>
              </CardHeader>
              <CardContent>
                <FlexBox
                  responsive={{
                    mobile: { 
                      direction: 'column', 
                      gap: '1rem',
                      padding: '1rem' 
                    },
                    tablet: { 
                      direction: 'row', 
                      justify: 'space-between',
                      gap: '1.5rem',
                      padding: '1.5rem'
                    },
                    desktop: { 
                      direction: 'row', 
                      justify: 'space-around',
                      gap: '2rem',
                      padding: '2rem'
                    }
                  }}
                  animate
                  animationVariant="fadeIn"
                  staggerChildren={0.1}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {[1, 2, 3, 4].map((num) => (
                    <FlexItem
                      key={num}
                      responsive={{
                        mobile: { flex: '1 1 100%' },
                        tablet: { flex: '1 1 45%' },
                        desktop: { flex: '1 1 20%' }
                      }}
                      animate
                      animationVariant="scale"
                      delay={num * 0.1}
                    >
                      <Card className="h-32 bg-gradient-to-br from-cyan-400 to-blue-600">
                        <CardContent className="p-4 h-full flex items-center justify-center">
                          <span className="text-white font-bold text-2xl">{num}</span>
                        </CardContent>
                      </Card>
                    </FlexItem>
                  ))}
                </FlexBox>
              </CardContent>
            </Card>
          </div>
        </SpacingControl>
      )}

      {/* Demo de Posicionamiento */}
      {activeDemo === 'position' && (
        <SpacingControl
          responsive={{
            mobile: { padding: '1rem' },
            tablet: { padding: '1.5rem 2rem' },
            desktop: { padding: '2rem 3rem' }
          }}
        >
          <Card className="h-96 relative overflow-hidden">
            <CardHeader>
              <CardTitle>Posicionamiento Extremo</CardTitle>
            </CardHeader>
            <CardContent className="h-full relative">
              
              {/* Elemento centrado */}
              <PositionControl
                {...positioning.centerElement('120px', '80px')}
                animate
                animationVariant="scale"
                className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <span className="text-white font-bold">Centro</span>
              </PositionControl>

              {/* Esquinas */}
              <PositionControl
                {...positioning.cornerPositions.topLeft}
                className="w-16 h-16 bg-green-500 rounded-br-lg flex items-center justify-center"
                animate
                animationVariant="slideLeft"
              >
                <span className="text-white text-xs">TL</span>
              </PositionControl>

              <PositionControl
                {...positioning.cornerPositions.topRight}
                className="w-16 h-16 bg-red-500 rounded-bl-lg flex items-center justify-center"
                animate
                animationVariant="slideRight"
              >
                <span className="text-white text-xs">TR</span>
              </PositionControl>

              <PositionControl
                {...positioning.cornerPositions.bottomLeft}
                className="w-16 h-16 bg-yellow-500 rounded-tr-lg flex items-center justify-center"
                animate
                animationVariant="slideLeft"
              >
                <span className="text-white text-xs">BL</span>
              </PositionControl>

              <PositionControl
                {...positioning.cornerPositions.bottomRight}
                className="w-16 h-16 bg-pink-500 rounded-tl-lg flex items-center justify-center"
                animate
                animationVariant="slideRight"
              >
                <span className="text-white text-xs">BR</span>
              </PositionControl>

              {/* Posición responsive */}
              <PositionControl
                responsive={{
                  mobile: { 
                    position: 'absolute',
                    top: '20%',
                    left: '10%'
                  },
                  tablet: { 
                    position: 'absolute',
                    top: '30%',
                    right: '20%'
                  },
                  desktop: { 
                    position: 'absolute',
                    bottom: '30%',
                    left: '30%'
                  }
                }}
                className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center"
                animate
                animationVariant="float"
              >
                <span className="text-white font-bold text-xs">Resp</span>
              </PositionControl>
            </CardContent>
          </Card>
        </SpacingControl>
      )}

      {/* Demo de Espaciado */}
      {activeDemo === 'spacing' && (
        <SpacingControl
          responsive={{
            mobile: { padding: '1rem' },
            tablet: { padding: '1.5rem 2rem' },
            desktop: { padding: '2rem 3rem' }
          }}
        >
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Espaciado Extremo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Espaciado simétrico */}
                  <SpacingControl
                    {...spacing.createSymmetricSpacing('lg')}
                    backgroundColor="rgb(219 234 254)"
                    borderRadius="0.5rem"
                    animate
                    animationVariant="fadeIn"
                  >
                    <h4 className="font-semibold text-blue-900">Espaciado Simétrico (lg)</h4>
                    <p className="text-blue-700">Padding y margin iguales en todos los lados</p>
                  </SpacingControl>

                  {/* Espaciado asimétrico */}
                  <SpacingControl
                    {...spacing.createAsymmetricSpacing('xl', 'sm', 'md', 'lg')}
                    backgroundColor="rgb(254 226 226)"
                    borderRadius="0.5rem"
                    animate
                    animationVariant="slideUp"
                  >
                    <h4 className="font-semibold text-red-900">Espaciado Asimétrico</h4>
                    <p className="text-red-700">Top: xl, Right: sm, Bottom: md, Left: lg</p>
                  </SpacingControl>

                  {/* Espaciado contextual */}
                  <SpacingControl
                    {...spacing.getContentSpacing('card')}
                    backgroundColor="rgb(220 252 231)"
                    borderRadius="0.5rem"
                    animate
                    animationVariant="scale"
                  >
                    <h4 className="font-semibold text-green-900">Espaciado Contextual (Card)</h4>
                    <p className="text-green-700">
                      Se adapta automáticamente: 
                      {responsive.isMobile ? ' móvil' : responsive.isTablet ? ' tablet' : ' desktop'}
                    </p>
                  </SpacingControl>

                  {/* Grid con espaciado */}
                  <div 
                    style={spacing.createGridSpacing(
                      responsive.isMobile ? 1 : responsive.isTablet ? 2 : 3,
                      'md',
                      'lg'
                    )}
                  >
                    {[1, 2, 3].map((num) => (
                      <SpacingControl
                        key={num}
                        padding="1rem"
                        backgroundColor="rgb(237 233 254)"
                        borderRadius="0.5rem"
                        animate
                        animationVariant="slideUp"
                        animationDelay={num * 0.1}
                      >
                        <h5 className="font-semibold text-purple-900">Item {num}</h5>
                        <p className="text-purple-700 text-sm">Grid responsive</p>
                      </SpacingControl>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SpacingControl>
      )}
    </div>
  );
}