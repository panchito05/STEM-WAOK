import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, BookOpen, Volume2, Palette, Type, Zap, Trophy, Brain } from 'lucide-react';
import { ModuleSettings } from '@/context/SettingsContext';
import { AlphabetSettings } from './types';

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export default function Settings({ settings, onBack }: SettingsProps) {
  const [alphabetSettings, setAlphabetSettings] = useState<AlphabetSettings>({
    level: 'beginner',
    showLowercase: true,
    showColors: true,
    audioEnabled: true,
    fontStyle: 'basic',
    autoAdvance: false,
    celebrateCompletion: true,
    quizFrequency: 'occasionally',
    language: settings.language === 'spanish' ? 'spanish' : 'english'
  });

  // Load saved settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('alphabet_settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setAlphabetSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.warn('Failed to parse saved alphabet settings');
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('alphabet_settings', JSON.stringify(alphabetSettings));
  }, [alphabetSettings]);

  const updateSetting = <K extends keyof AlphabetSettings>(
    key: K,
    value: AlphabetSettings[K]
  ) => {
    setAlphabetSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    const defaultSettings: AlphabetSettings = {
      level: 'beginner',
      showLowercase: true,
      showColors: true,
      audioEnabled: true,
      fontStyle: 'basic',
      autoAdvance: false,
      celebrateCompletion: true,
      quizFrequency: 'occasionally',
      language: settings.language === 'spanish' ? 'spanish' : 'english'
    };
    setAlphabetSettings(defaultSettings);
  };

  return (
    <div className="alphabet-settings min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {alphabetSettings.language === 'spanish' ? 'Volver' : 'Back'}
          </Button>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {alphabetSettings.language === 'spanish' ? 'Configuración del Alfabeto' : 'Alphabet Settings'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {alphabetSettings.language === 'spanish' ? 
                  'Personaliza tu experiencia de aprendizaje del alfabeto' : 
                  'Customize your alphabet learning experience'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                {alphabetSettings.language === 'spanish' ? 'Nivel de Aprendizaje' : 'Learning Level'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  {alphabetSettings.language === 'spanish' ? 'Dificultad' : 'Difficulty'}
                </Label>
                <Select value={alphabetSettings.level} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => updateSetting('level', value)}>
                  <SelectTrigger className="mt-1">
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
                <p className="text-xs text-gray-500 mt-1">
                  {alphabetSettings.level === 'beginner' && (alphabetSettings.language === 'spanish' ? 
                    'Solo exploración y navegación' : 
                    'Exploration and navigation only'
                  )}
                  {alphabetSettings.level === 'intermediate' && (alphabetSettings.language === 'spanish' ? 
                    'Incluye ejercicios básicos' : 
                    'Includes basic exercises'
                  )}
                  {alphabetSettings.level === 'advanced' && (alphabetSettings.language === 'spanish' ? 
                    'Ejercicios completos y cuestionarios' : 
                    'Full exercises and quizzes'
                  )}
                </p>
              </div>

              {alphabetSettings.level !== 'beginner' && (
                <div>
                  <Label className="text-sm font-medium">
                    {alphabetSettings.language === 'spanish' ? 'Frecuencia de Cuestionarios' : 'Quiz Frequency'}
                  </Label>
                  <Select value={alphabetSettings.quizFrequency} onValueChange={(value: 'never' | 'occasionally' | 'frequent') => updateSetting('quizFrequency', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">
                        {alphabetSettings.language === 'spanish' ? 'Nunca' : 'Never'}
                      </SelectItem>
                      <SelectItem value="occasionally">
                        {alphabetSettings.language === 'spanish' ? 'Ocasionalmente' : 'Occasionally'}
                      </SelectItem>
                      <SelectItem value="frequent">
                        {alphabetSettings.language === 'spanish' ? 'Frecuente' : 'Frequent'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                {alphabetSettings.language === 'spanish' ? 'Configuración Visual' : 'Visual Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    {alphabetSettings.language === 'spanish' ? 'Mostrar Minúsculas' : 'Show Lowercase'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {alphabetSettings.language === 'spanish' ? 
                      'Muestra las letras en minúscula junto a las mayúsculas' : 
                      'Display lowercase letters alongside uppercase'
                    }
                  </p>
                </div>
                <Switch
                  checked={alphabetSettings.showLowercase}
                  onCheckedChange={(checked) => updateSetting('showLowercase', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    {alphabetSettings.language === 'spanish' ? 'Colores Temáticos' : 'Theme Colors'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {alphabetSettings.language === 'spanish' ? 
                      'Usa colores únicos para cada letra' : 
                      'Use unique colors for each letter'
                    }
                  </p>
                </div>
                <Switch
                  checked={alphabetSettings.showColors}
                  onCheckedChange={(checked) => updateSetting('showColors', checked)}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  {alphabetSettings.language === 'spanish' ? 'Estilo de Fuente' : 'Font Style'}
                </Label>
                <Select value={alphabetSettings.fontStyle} onValueChange={(value: 'basic' | 'decorative' | 'handwriting') => updateSetting('fontStyle', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      {alphabetSettings.language === 'spanish' ? 'Básica' : 'Basic'}
                    </SelectItem>
                    <SelectItem value="decorative">
                      {alphabetSettings.language === 'spanish' ? 'Decorativa' : 'Decorative'}
                    </SelectItem>
                    <SelectItem value="handwriting">
                      {alphabetSettings.language === 'spanish' ? 'Manuscrita' : 'Handwriting'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-green-600" />
                {alphabetSettings.language === 'spanish' ? 'Configuración de Audio' : 'Audio Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    {alphabetSettings.language === 'spanish' ? 'Audio Habilitado' : 'Audio Enabled'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {alphabetSettings.language === 'spanish' ? 
                      'Habilita pronunciación de letras y palabras' : 
                      'Enable pronunciation of letters and words'
                    }
                  </p>
                </div>
                <Switch
                  checked={alphabetSettings.audioEnabled}
                  onCheckedChange={(checked) => updateSetting('audioEnabled', checked)}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  {alphabetSettings.language === 'spanish' ? 'Idioma' : 'Language'}
                </Label>
                <Select value={alphabetSettings.language} onValueChange={(value: 'english' | 'spanish') => updateSetting('language', value)}>
                  <SelectTrigger className="mt-1">
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

          {/* Behavior Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                {alphabetSettings.language === 'spanish' ? 'Comportamiento' : 'Behavior'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    {alphabetSettings.language === 'spanish' ? 'Avance Automático' : 'Auto Advance'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {alphabetSettings.language === 'spanish' ? 
                      'Avanza automáticamente después de respuestas correctas' : 
                      'Automatically advance after correct answers'
                    }
                  </p>
                </div>
                <Switch
                  checked={alphabetSettings.autoAdvance}
                  onCheckedChange={(checked) => updateSetting('autoAdvance', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    {alphabetSettings.language === 'spanish' ? 'Celebrar Finalización' : 'Celebrate Completion'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {alphabetSettings.language === 'spanish' ? 
                      'Muestra celebración al completar el alfabeto' : 
                      'Show celebration when completing the alphabet'
                    }
                  </p>
                </div>
                <Switch
                  checked={alphabetSettings.celebrateCompletion}
                  onCheckedChange={(checked) => updateSetting('celebrateCompletion', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <Button variant="outline" onClick={resetToDefaults}>
            <Trophy className="w-4 h-4 mr-2" />
            {alphabetSettings.language === 'spanish' ? 'Restablecer por Defecto' : 'Reset to Defaults'}
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              {alphabetSettings.language === 'spanish' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button onClick={onBack} className="bg-purple-600 hover:bg-purple-700">
              {alphabetSettings.language === 'spanish' ? 'Guardar y Continuar' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}