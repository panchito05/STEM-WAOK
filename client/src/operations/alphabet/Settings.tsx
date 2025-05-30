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
    learningMode: 'exploration',
    timerDuration: settings.timeValue || 300,
    problemCount: settings.problemCount,
    enableHints: true,
    autoAdvance: false,
  };
}

export default function Settings({ settings, onBack }: SettingsProps) {
  const alphabetSettings = convertToAlphabetSettings(settings);

  const handleSettingChange = (key: keyof AlphabetSettings, value: any) => {
    // For now, we'll just show the interface
    // Integration with actual settings storage would be handled by parent component
    console.log(`Setting ${key} to:`, value);
  };

  return (
    <div className="alphabet-settings-module space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {alphabetSettings.language === 'spanish' ? 'Volver' : 'Back'}
        </Button>
        <h2 className="text-2xl font-bold">
          {alphabetSettings.language === 'spanish' 
            ? 'Configuración del Alfabeto' 
            : 'Alphabet Settings'}
        </h2>
      </div>

      <div className="grid gap-6">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle>
              {alphabetSettings.language === 'spanish' ? 'Idioma' : 'Language'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                {alphabetSettings.language === 'spanish' 
                  ? 'Idioma de aprendizaje' 
                  : 'Learning Language'}
              </Label>
              <Select 
                value={alphabetSettings.language} 
                onValueChange={(value) => handleSettingChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Difficulty Level */}
        <Card>
          <CardHeader>
            <CardTitle>
              {alphabetSettings.language === 'spanish' ? 'Nivel de Dificultad' : 'Difficulty Level'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                {alphabetSettings.language === 'spanish' ? 'Nivel' : 'Level'}
              </Label>
              <Select 
                value={alphabetSettings.difficulty} 
                onValueChange={(value) => handleSettingChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    {alphabetSettings.language === 'spanish' ? 'Principiante' : 'Beginner'}
                  </SelectItem>
                  <SelectItem value="intermediate">
                    {alphabetSettings.language === 'spanish' ? 'Intermedio' : 'Intermediate'}
                  </SelectItem>
                  <SelectItem value="advanced">
                    {alphabetSettings.language === 'spanish' ? 'Avanzado' : 'Advanced'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                {alphabetSettings.difficulty === 'beginner' && (
                  alphabetSettings.language === 'spanish' 
                    ? 'Exploración libre del alfabeto con ayudas visuales'
                    : 'Free alphabet exploration with visual aids'
                )}
                {alphabetSettings.difficulty === 'intermediate' && (
                  alphabetSettings.language === 'spanish' 
                    ? 'Secuencia de letras y reconocimiento básico'
                    : 'Letter sequence and basic recognition'
                )}
                {alphabetSettings.difficulty === 'advanced' && (
                  alphabetSettings.language === 'spanish' 
                    ? 'Asociación de palabras y comprensión avanzada'
                    : 'Word association and advanced comprehension'
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Learning Mode */}
        <Card>
          <CardHeader>
            <CardTitle>
              {alphabetSettings.language === 'spanish' ? 'Modo de Aprendizaje' : 'Learning Mode'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                {alphabetSettings.language === 'spanish' ? 'Tipo de actividad' : 'Activity Type'}
              </Label>
              <Select 
                value={alphabetSettings.learningMode} 
                onValueChange={(value) => handleSettingChange('learningMode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exploration">
                    {alphabetSettings.language === 'spanish' ? 'Exploración' : 'Exploration'}
                  </SelectItem>
                  <SelectItem value="guided">
                    {alphabetSettings.language === 'spanish' ? 'Guiado' : 'Guided'}
                  </SelectItem>
                  <SelectItem value="quiz">
                    {alphabetSettings.language === 'spanish' ? 'Evaluación' : 'Quiz'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Visual Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {alphabetSettings.language === 'spanish' ? 'Configuración Visual' : 'Visual Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-lowercase">
                {alphabetSettings.language === 'spanish' 
                  ? 'Mostrar minúsculas' 
                  : 'Show Lowercase'}
              </Label>
              <Switch
                id="show-lowercase"
                checked={alphabetSettings.showLowercase}
                onCheckedChange={(checked) => handleSettingChange('showLowercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="colored-letters">
                {alphabetSettings.language === 'spanish' 
                  ? 'Letras coloreadas' 
                  : 'Colored Letters'}
              </Label>
              <Switch
                id="colored-letters"
                checked={alphabetSettings.coloredLetters}
                onCheckedChange={(checked) => handleSettingChange('coloredLetters', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="animations">
                {alphabetSettings.language === 'spanish' 
                  ? 'Animaciones' 
                  : 'Animations'}
              </Label>
              <Switch
                id="animations"
                checked={alphabetSettings.animationsEnabled}
                onCheckedChange={(checked) => handleSettingChange('animationsEnabled', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {alphabetSettings.language === 'spanish' ? 'Estilo de letra' : 'Letter Style'}
              </Label>
              <Select 
                value={alphabetSettings.letterStyle} 
                onValueChange={(value) => handleSettingChange('letterStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    {alphabetSettings.language === 'spanish' ? 'Básico' : 'Basic'}
                  </SelectItem>
                  <SelectItem value="decorative">
                    {alphabetSettings.language === 'spanish' ? 'Decorativo' : 'Decorative'}
                  </SelectItem>
                  <SelectItem value="manuscript">
                    {alphabetSettings.language === 'spanish' ? 'Manuscrito' : 'Manuscript'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {alphabetSettings.language === 'spanish' ? 'Configuración de Audio' : 'Audio Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="audio-enabled">
                {alphabetSettings.language === 'spanish' 
                  ? 'Pronunciación automática' 
                  : 'Automatic Pronunciation'}
              </Label>
              <Switch
                id="audio-enabled"
                checked={alphabetSettings.audioEnabled}
                onCheckedChange={(checked) => handleSettingChange('audioEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Session Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {alphabetSettings.language === 'spanish' ? 'Configuración de Sesión' : 'Session Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                {alphabetSettings.language === 'spanish' 
                  ? `Duración de sesión: ${Math.floor(alphabetSettings.timerDuration / 60)} minutos`
                  : `Session Duration: ${Math.floor(alphabetSettings.timerDuration / 60)} minutes`}
              </Label>
              <Slider
                value={[alphabetSettings.timerDuration]}
                onValueChange={([value]) => handleSettingChange('timerDuration', value)}
                min={60}
                max={1800}
                step={60}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>
                {alphabetSettings.language === 'spanish' 
                  ? `Número de problemas: ${alphabetSettings.problemCount}`
                  : `Number of Problems: ${alphabetSettings.problemCount}`}
              </Label>
              <Slider
                value={[alphabetSettings.problemCount]}
                onValueChange={([value]) => handleSettingChange('problemCount', value)}
                min={5}
                max={26}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enable-hints">
                {alphabetSettings.language === 'spanish' 
                  ? 'Habilitar pistas' 
                  : 'Enable Hints'}
              </Label>
              <Switch
                id="enable-hints"
                checked={alphabetSettings.enableHints}
                onCheckedChange={(checked) => handleSettingChange('enableHints', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-advance">
                {alphabetSettings.language === 'spanish' 
                  ? 'Avance automático' 
                  : 'Auto Advance'}
              </Label>
              <Switch
                id="auto-advance"
                checked={alphabetSettings.autoAdvance}
                onCheckedChange={(checked) => handleSettingChange('autoAdvance', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex justify-center pt-6">
        <Button onClick={onBack} className="px-8">
          {alphabetSettings.language === 'spanish' ? 'Guardar y Continuar' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}