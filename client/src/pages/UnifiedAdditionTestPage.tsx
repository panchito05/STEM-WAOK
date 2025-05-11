// UnifiedAdditionTestPage.tsx
// Página para probar el módulo unificado de adición

import React, { useState } from 'react';
import { Exercise, Settings } from '@/operations/unified-addition';
import { useSettings } from '@/context/SettingsContext';
import { defaultModuleSettings } from '@/utils/operationComponents';
import { Button } from '@/components/ui/button';

export default function UnifiedAdditionTestPage() {
  const { moduleSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  
  // Usa los ajustes del módulo si existen, sino los del módulo original, o los valores por defecto
  const settings = moduleSettings.unifiedAddition || 
                  moduleSettings.addition || 
                  defaultModuleSettings;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">Módulo Unificado de Adición</h1>
        <p className="text-lg text-center text-gray-600 mt-2">
          Este es un módulo autocontenido con toda la funcionalidad unificada
        </p>
      </div>
      
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="outline"
        >
          {showSettings ? 'Volver al Ejercicio' : 'Configuración'}
        </Button>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        {showSettings ? (
          <Settings 
            settings={settings} 
            onBack={() => setShowSettings(false)} 
          />
        ) : (
          <Exercise 
            settings={settings} 
            onOpenSettings={() => setShowSettings(true)} 
          />
        )}
      </div>
    </div>
  );
}