// Export the main components for the Alphabet Learning module
import React from 'react';
import AlphabetExercise from './Exercise';
import { ModuleSettings } from '@/context/SettingsContext';

// Create an adapter component that bridges ModuleSettings to AlphabetSettings
export const Exercise: React.FC<{
  settings: ModuleSettings;
  onOpenSettings: () => void;
}> = ({ settings, onOpenSettings }) => {
  // Convert ModuleSettings to AlphabetSettings
  const alphabetSettings = {
    language: 'english' as const,
    level: 1 as const,
    showBothLanguages: false,
    autoAdvance: false,
    autoAdvanceDelay: 3000,
    audioEnabled: settings.enableSoundEffects,
    showImages: true,
    difficulty: settings.difficulty as 'beginner' | 'intermediate' | 'advanced',
    celebrateCompletion: settings.enableRewards
  };

  return React.createElement(AlphabetExercise, {
    settings: alphabetSettings,
    onOpenSettings
  });
};

// Create a simple Settings component 
export const Settings: React.FC<{
  settings: ModuleSettings;
  onBack: () => void;
}> = ({ settings, onBack }) => {
  return React.createElement('div', { className: 'p-4' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Configuración del Alfabeto'),
      React.createElement('p', { className: 'text-gray-600 mb-4' }, 'La configuración del alfabeto se maneja dentro del módulo principal.'),
      React.createElement('button', {
        onClick: onBack,
        className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
      }, 'Volver al Módulo')
    )
  );
};