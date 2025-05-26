import React, { useState } from 'react';
import { ModuleSettings } from '@/context/SettingsContext';
import EmptyExercise from './Exercise';
import EmptySettings, { EmptyModuleSettings, defaultEmptySettings } from './Settings';

// Convertir configuraciones del sistema a configuraciones del Empty Module
function adaptSystemToEmptySettings(systemSettings: ModuleSettings): EmptyModuleSettings {
  return {
    difficulty: systemSettings.difficulty as any,
    problemCount: systemSettings.problemCount,
    timeLimit: systemSettings.timeValue,
    maxAttempts: systemSettings.maxAttempts,
    showImmediateFeedback: systemSettings.showImmediateFeedback,
    enableSoundEffects: systemSettings.enableSoundEffects,
    showAnswerWithExplanation: systemSettings.showAnswerWithExplanation,
    enableAdaptiveDifficulty: systemSettings.enableAdaptiveDifficulty,
    enableRewards: systemSettings.enableRewards,
    language: "spanish",
    customSetting1: true,
    customSetting2: "option1"
  };
}

// Adaptador para el componente Exercise
export function EmptyExerciseAdapter({ 
  settings, 
  onOpenSettings 
}: {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}) {
  const emptySettings = adaptSystemToEmptySettings(settings);
  
  return (
    <EmptyExercise
      difficulty={emptySettings.difficulty}
      problemCount={emptySettings.problemCount}
      onComplete={(results) => {
        console.log('Empty Module exercise completed:', results);
      }}
    />
  );
}

// Adaptador para el componente Settings
export function EmptySettingsAdapter({ 
  settings, 
  onBack 
}: {
  settings: ModuleSettings;
  onBack: () => void;
}) {
  const [emptySettings, setEmptySettings] = useState<EmptyModuleSettings>(
    adaptSystemToEmptySettings(settings)
  );

  const handleSettingsChange = (partialSettings: Partial<EmptyModuleSettings>) => {
    setEmptySettings(prev => ({ ...prev, ...partialSettings }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Configuración de Empty Module</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Volver
        </button>
      </div>
      
      <EmptySettings
        settings={emptySettings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}