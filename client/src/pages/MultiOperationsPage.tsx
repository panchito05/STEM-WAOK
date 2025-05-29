import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from "react-helmet";
import { useLocation } from 'wouter';
import { useModuleStore, useModuleFavorites } from "@/store/moduleStore";
import { operationModules } from "@/utils/operationComponents";
import { useSettings } from "@/context/SettingsContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Star, Eye, CheckCircle2, AlertCircle, Plus, Minus, X, Calculator } from 'lucide-react';

interface SessionConfig {
  modules: Array<{
    id: string;
    name: string;
    color: string;
    icon: React.ReactNode;
    problemCount: number;
  }>;
  totalProblems: number;
  currentProblem: number;
  currentModule: string;
}

interface MultiOperationsPageProps {
  mode: 'favorites' | 'visible';
}

export default function MultiOperationsPage() {
  const [, setLocation] = useLocation();
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { hiddenModules } = useModuleStore();
  const { favoriteModules } = useModuleFavorites();
  const { getModuleSettings } = useSettings();

  // Obtener el modo desde la URL
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') as 'favorites' | 'visible' || 'favorites';

  // Filtrar módulos según el modo
  const availableModules = useMemo(() => {
    if (mode === 'favorites') {
      return operationModules.filter(module => favoriteModules.includes(module.id));
    } else {
      return operationModules.filter(module => !hiddenModules.includes(module.id));
    }
  }, [mode, favoriteModules, hiddenModules]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Validar que hay módulos disponibles
    if (availableModules.length === 0) {
      if (mode === 'favorites') {
        setError('No has marcado ninguna operación como favorita. Por favor, marca algunas operaciones como favoritas primero.');
      } else {
        setError('Todas las operaciones están ocultas. Por favor, haz visible al menos una operación.');
      }
      setIsLoading(false);
      return;
    }

    // Configurar la sesión con problemCount real de cada módulo
    const modulesWithSettings = availableModules.map(module => {
      let iconComponent;
      switch (module.icon) {
        case 'Plus':
          iconComponent = <Plus className="w-4 h-4" />;
          break;
        case 'Minus':
          iconComponent = <Minus className="w-4 h-4" />;
          break;
        case 'X':
          iconComponent = <X className="w-4 h-4" />;
          break;
        case 'DivideIcon':
          iconComponent = <Calculator className="w-4 h-4" />;
          break;
        default:
          iconComponent = <Calculator className="w-4 h-4" />;
      }
      
      // Obtener la configuración real del módulo
      const moduleSettings = getModuleSettings(module.id);
      
      return {
        id: module.id,
        name: module.displayName,
        color: module.color || '#4287f5',
        icon: iconComponent,
        problemCount: moduleSettings.problemCount
      };
    });

    const config: SessionConfig = {
      modules: modulesWithSettings,
      totalProblems: modulesWithSettings.reduce((total, module) => total + module.problemCount, 0),
      currentProblem: 1,
      currentModule: availableModules[0].id
    };

    setSessionConfig(config);
    setIsLoading(false);
  }, [availableModules, mode, getModuleSettings]);

  const handleStartSession = () => {
    if (!sessionConfig) return;
    
    // Redirigir al primer módulo de la sesión
    setLocation(`/operation/${sessionConfig.currentModule}?multiMode=true&session=${encodeURIComponent(JSON.stringify(sessionConfig))}`);
  };

  const goBack = () => {
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Configurando tu sesión de práctica...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Ejercicios Multi-Operaciones - Math W+A+O+K</title>
        </Helmet>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={goBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </div>

          <Card className="border-red-200">
            <CardContent className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                No se pueden iniciar los ejercicios
              </h2>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={goBack} variant="outline">
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Ejercicios Multi-Operaciones - Math W+A+O+K</title>
        <meta name="description" content="Practica múltiples operaciones matemáticas en una sola sesión personalizada." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={goBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text-blue mb-2">
              Ejercicios Multi-Operaciones
            </h1>
            <p className="text-gray-600">
              {mode === 'favorites' ? (
                <>
                  <Star className="w-4 h-4 inline mr-1 text-yellow-500" />
                  Practica tus operaciones favoritas
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 inline mr-1 text-blue-500" />
                  Practica todas las operaciones visibles
                </>
              )}
            </p>
          </div>
        </div>

        {sessionConfig && (
          <div className="space-y-6">
            {/* Resumen de la sesión */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Configuración de la Sesión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Operaciones incluidas:</h3>
                    <div className="space-y-2">
                      {sessionConfig.modules.map((module) => (
                        <div key={module.id} className="flex items-center gap-2">
                          {module.icon}
                          <span className="font-medium">{module.name}</span>
                          <Badge variant="secondary" style={{ backgroundColor: `${module.color}20`, color: module.color }}>
                            {module.problemCount} problema{module.problemCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Detalles de la sesión:</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Total de operaciones:</span>
                        <span className="font-medium">{sessionConfig.modules.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total de problemas:</span>
                        <span className="font-medium">{sessionConfig.totalProblems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modo de práctica:</span>
                        <span className="font-medium">
                          {mode === 'favorites' ? 'Solo favoritas' : 'Todas visibles'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información importante */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-4">
                <h3 className="font-semibold text-blue-800 mb-2">💡 Información importante:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Cada operación mantendrá su configuración individual (dificultad, temporizador, etc.)</li>
                  <li>• Los problemas se presentarán en orden aleatorio entre las diferentes operaciones</li>
                  <li>• Tu progreso se guardará automáticamente para cada tipo de operación</li>
                  <li>• Puedes pausar y continuar la sesión cuando quieras</li>
                </ul>
              </CardContent>
            </Card>

            {/* Botón para iniciar */}
            <div className="text-center">
              <Button 
                onClick={handleStartSession}
                size="lg"
                className="text-lg px-8 py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar Sesión de Práctica
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}