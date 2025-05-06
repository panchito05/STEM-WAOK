import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { operationComponents, operationModules } from "@/utils/operationComponents";
import { useSettings } from "@/context/SettingsContext";
import { Card, CardContent } from "@/components/ui/card";

export default function OperationPage() {
  const params = useParams<{ operation: string }>();
  const [, setLocation] = useLocation();
  const { getModuleSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const operationId = params.operation;
  const operation = operationComponents[operationId];
  const moduleInfo = operationModules.find(m => m.id === operationId);
  
  useEffect(() => {
    // Redirect to home if operation doesn't exist
    if (!operation) {
      setLocation("/");
    }
  }, [operation, setLocation]);

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
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {showSettings ? (
              <Settings 
                settings={moduleSettings} 
                onBack={() => setShowSettings(false)} 
              />
            ) : (
              <Exercise 
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
