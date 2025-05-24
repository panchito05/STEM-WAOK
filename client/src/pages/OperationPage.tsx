import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { operationComponents, operationModules } from "@/utils/operationComponents";
import { useSettings } from "@/context/SettingsContext";
import { useExercise } from "@/context/ExerciseContext";
import { Card, CardContent } from "@/components/ui/card";

export default function OperationPage() {
  const params = useParams<{ operation: string }>();
  const [, setLocation] = useLocation();
  const { getModuleSettings } = useSettings();
  const { setExerciseActive } = useExercise();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsUpdated, setSettingsUpdated] = useState(0); // Contador para forzar recarga

  const operationId = params.operation;
  const operation = operationComponents[operationId];
  const moduleInfo = operationModules.find(m => m.id === operationId);
  
  // Marcar el ejercicio como activo cuando se monta el componente
  useEffect(() => {
    // Establecer el ejercicio como activo solo cuando no estamos en la configuración
    if (!showSettings) {
      setExerciseActive(true);
    }
    
    // Limpiar al desmontar
    return () => {
      setExerciseActive(false);
    };
  }, [setExerciseActive, showSettings]);

  useEffect(() => {
    // Redirect to home if operation doesn't exist
    if (!operation) {
      setLocation("/");
    }
  }, [operation, setLocation]);

  // Manejar regreso de configuración
  const handleBackFromSettings = () => {
    setShowSettings(false);
    setSettingsUpdated(prev => prev + 1); // Incrementar para forzar recarga de configuración
  };

  if (!operation || !moduleInfo) {
    return null;
  }

  const { Exercise, Settings } = operation;
  const moduleSettings = getModuleSettings(operationId);

  return (
    <>
      <Helmet>
        <title>{moduleInfo.displayName} - Math W+A+O+K</title>
        <meta name="description" content={`Practice ${moduleInfo.displayName.toLowerCase()} with interactive exercises.`} />
      </Helmet>
      
      <div className="max-w-4xl mx-auto py-2 px-3 sm:py-6 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {showSettings ? (
              <Settings 
                settings={moduleSettings} 
                onBack={handleBackFromSettings} 
              />
            ) : (
              <Exercise 
                key={`exercise-${operationId}-${settingsUpdated}`}
                settings={moduleSettings} 
                onOpenSettings={() => setShowSettings(true)} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
