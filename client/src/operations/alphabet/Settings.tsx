import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import { AlphabetSettings } from './types';
import { ModuleSettings } from '@/context/SettingsContext';

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

// Convert ModuleSettings to AlphabetSettings with defaults
function convertToAlphabetSettings(settings: ModuleSettings): AlphabetSettings {
  return {
    language: 'english',
    difficulty: settings.difficulty as 'beginner' | 'intermediate' | 'advanced',
    showLowercase: true,
    coloredLetters: true,
    audioEnabled: settings.enableSoundEffects,
    animationsEnabled: true,
    letterStyle: 'basic',
    learningMode: 'quiz',
    timerDuration: settings.timeValue || 300,
    problemCount: settings.problemCount,
    enableHints: true,
    autoAdvance: false,
  };
}

export default function Settings({ settings, onBack }: SettingsProps) {
  const alphabetSettings = convertToAlphabetSettings(settings);
  const isEnglish = alphabetSettings.language === 'english';

  const handleSettingChange = (key: keyof AlphabetSettings, value: any) => {
    // For now, we'll just show the interface
    // Integration with actual settings storage would be handled by parent component
    console.log(`Setting ${key} to:`, value);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header - Following math modules pattern */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isEnglish ? 'Back' : 'Volver'}
        </Button>
        <h2 className="text-xl font-bold text-gray-800">
          {isEnglish ? 'Alphabet Learning Settings' : 'Configuración del Alfabeto'}
        </h2>
      </div>

      {/* Settings Grid - Following math modules layout */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Basic Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {isEnglish ? 'Basic Settings' : 'Configuración Básica'}
            </h3>
            
            <div className="space-y-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Learning Language' : 'Idioma de Aprendizaje'}
                </Label>
                <Select 
                  value={alphabetSettings.language} 
                  onValueChange={(value) => handleSettingChange('language', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Difficulty Level' : 'Nivel de Dificultad'}
                </Label>
                <Select 
                  value={alphabetSettings.difficulty} 
                  onValueChange={(value) => handleSettingChange('difficulty', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">
                      {isEnglish ? 'Beginner' : 'Principiante'}
                    </SelectItem>
                    <SelectItem value="intermediate">
                      {isEnglish ? 'Intermediate' : 'Intermedio'}
                    </SelectItem>
                    <SelectItem value="advanced">
                      {isEnglish ? 'Advanced' : 'Avanzado'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {alphabetSettings.difficulty === 'beginner' && (
                    isEnglish 
                      ? 'Basic letter recognition with visual aids'
                      : 'Reconocimiento básico de letras con ayudas visuales'
                  )}
                  {alphabetSettings.difficulty === 'intermediate' && (
                    isEnglish 
                      ? 'Letter sequences and spelling patterns'
                      : 'Secuencias de letras y patrones de escritura'
                  )}
                  {alphabetSettings.difficulty === 'advanced' && (
                    isEnglish 
                      ? 'Word association and advanced comprehension'
                      : 'Asociación de palabras y comprensión avanzada'
                  )}
                </p>
              </div>

              {/* Problem Count */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {isEnglish 
                    ? `Number of Letters: ${alphabetSettings.problemCount}`
                    : `Número de Letras: ${alphabetSettings.problemCount}`}
                </Label>
                <Slider
                  value={[alphabetSettings.problemCount]}
                  onValueChange={([value]) => handleSettingChange('problemCount', value)}
                  min={5}
                  max={26}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  {isEnglish 
                    ? 'How many letters to practice in each session'
                    : 'Cuántas letras practicar en cada sesión'}
                </p>
              </div>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {isEnglish ? 'Visual Settings' : 'Configuración Visual'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-lowercase" className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Show Lowercase Letters' : 'Mostrar Minúsculas'}
                </Label>
                <Switch
                  id="show-lowercase"
                  checked={alphabetSettings.showLowercase}
                  onCheckedChange={(checked) => handleSettingChange('showLowercase', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="colored-letters" className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Colored Letters' : 'Letras Coloreadas'}
                </Label>
                <Switch
                  id="colored-letters"
                  checked={alphabetSettings.coloredLetters}
                  onCheckedChange={(checked) => handleSettingChange('coloredLetters', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="animations" className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Animations' : 'Animaciones'}
                </Label>
                <Switch
                  id="animations"
                  checked={alphabetSettings.animationsEnabled}
                  onCheckedChange={(checked) => handleSettingChange('animationsEnabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Letter Style' : 'Estilo de Letra'}
                </Label>
                <Select 
                  value={alphabetSettings.letterStyle} 
                  onValueChange={(value) => handleSettingChange('letterStyle', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      {isEnglish ? 'Basic' : 'Básico'}
                    </SelectItem>
                    <SelectItem value="decorative">
                      {isEnglish ? 'Decorative' : 'Decorativo'}
                    </SelectItem>
                    <SelectItem value="manuscript">
                      {isEnglish ? 'Manuscript' : 'Manuscrito'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {isEnglish ? 'Audio Settings' : 'Configuración de Audio'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="audio-enabled" className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Audio Pronunciation' : 'Pronunciación de Audio'}
                </Label>
                <Switch
                  id="audio-enabled"
                  checked={alphabetSettings.audioEnabled}
                  onCheckedChange={(checked) => handleSettingChange('audioEnabled', checked)}
                />
              </div>
              <p className="text-xs text-gray-500">
                {isEnglish 
                  ? 'Automatically pronounce letters and words'
                  : 'Pronunciar automáticamente letras y palabras'}
              </p>
            </div>
          </div>

          {/* Learning Features */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {isEnglish ? 'Learning Features' : 'Características de Aprendizaje'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-hints" className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Show Hints' : 'Mostrar Pistas'}
                </Label>
                <Switch
                  id="enable-hints"
                  checked={alphabetSettings.enableHints}
                  onCheckedChange={(checked) => handleSettingChange('enableHints', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-advance" className="text-sm font-medium text-gray-700">
                  {isEnglish ? 'Auto Advance' : 'Avance Automático'}
                </Label>
                <Switch
                  id="auto-advance"
                  checked={alphabetSettings.autoAdvance}
                  onCheckedChange={(checked) => handleSettingChange('autoAdvance', checked)}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                {isEnglish 
                  ? 'Automatically move to next letter after correct answer'
                  : 'Avanzar automáticamente a la siguiente letra después de respuesta correcta'}
              </p>
            </div>
          </div>

          {/* Session Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {isEnglish ? 'Session Settings' : 'Configuración de Sesión'}
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {isEnglish 
                    ? `Time Limit: ${Math.floor(alphabetSettings.timerDuration / 60)} minutes`
                    : `Límite de Tiempo: ${Math.floor(alphabetSettings.timerDuration / 60)} minutos`}
                </Label>
                <Slider
                  value={[alphabetSettings.timerDuration]}
                  onValueChange={([value]) => handleSettingChange('timerDuration', value)}
                  min={60}
                  max={1800}
                  step={60}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  {isEnglish 
                    ? 'Maximum time for each learning session'
                    : 'Tiempo máximo para cada sesión de aprendizaje'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center pt-6 border-t border-gray-200">
        <Button onClick={onBack} className="px-8 py-3">
          {isEnglish ? 'Save & Continue' : 'Guardar y Continuar'}
        </Button>
      </div>
    </div>
  );
}