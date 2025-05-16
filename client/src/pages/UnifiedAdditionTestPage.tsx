// UnifiedAdditionTestPage.tsx
// Página para probar el módulo de adición

import React, { useState } from 'react';
import Exercise from '@/operations/addition/Exercise';
import Settings from '@/operations/addition/Settings';
import { useSettings } from '@/context/SettingsContext';
import { defaultModuleSettings } from '@/utils/operationComponents';
import { Button } from '@/components/ui/button';

export default function UnifiedAdditionTestPage() {
  const { moduleSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  
  // Usa los ajustes del módulo si existen, sino los valores por defecto
  // NOTA: Aseguramos que siempre use "addition" para consistencia
  const settings = moduleSettings.addition || 
                  defaultModuleSettings;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">Módulo Unificado de Adición</h1>
        <p className="text-lg text-center text-gray-600 mt-2">
          Este es un módulo autocontenido con toda la funcionalidad unificada
        </p>
      </div>
      
      {/* Eliminado botón superior de configuración para evitar duplicidad */}
      
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