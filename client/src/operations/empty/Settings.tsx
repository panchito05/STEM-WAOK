import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DifficultyLevel } from './types';

interface EmptySettingsProps {
  settings: EmptyModuleSettings;
  onSettingsChange: (settings: Partial<EmptyModuleSettings>) => void;
}

export interface EmptyModuleSettings {
  difficulty: DifficultyLevel;
  problemCount: number;
  timeLimit: number; // 0 para sin límite
  maxAttempts: number; // 0 para intentos ilimitados
  showImmediateFeedback: boolean;
  enableSoundEffects: boolean;
  showAnswerWithExplanation: boolean;
  enableAdaptiveDifficulty: boolean;
  enableRewards: boolean;
  language: "english" | "spanish";
  // Añade configuraciones específicas para tu módulo aquí
  customSetting1?: boolean;
  customSetting2?: string;
}

export const defaultEmptySettings: EmptyModuleSettings = {
  difficulty: "beginner",
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 2,
  showImmediateFeedback: true,
  enableSoundEffects: true,
  showAnswerWithExplanation: true,
  enableAdaptiveDifficulty: false,
  enableRewards: true,
  language: "english",
  customSetting1: true,
  customSetting2: "option1"
};

export default function EmptySettings({ settings, onSettingsChange }: EmptySettingsProps) {
  const updateSetting = <K extends keyof EmptyModuleSettings>(
    key: K,
    value: EmptyModuleSettings[K]
  ) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Configuración de Dificultad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Nivel de Dificultad</Label>
            <Select
              value={settings.difficulty}
              onValueChange={(value: DifficultyLevel) => updateSetting('difficulty', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Principiante</Badge>
                    <span>Conceptos básicos</span>
                  </div>
                </SelectItem>
                <SelectItem value="elementary">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Elemental</Badge>
                    <span>Nivel básico</span>
                  </div>
                </SelectItem>
                <SelectItem value="intermediate">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Intermedio</Badge>
                    <span>Nivel medio</span>
                  </div>
                </SelectItem>
                <SelectItem value="advanced">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Avanzado</Badge>
                    <span>Nivel difícil</span>
                  </div>
                </SelectItem>
                <SelectItem value="expert">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Experto</Badge>
                    <span>Máximo desafío</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Número de Problemas: {settings.problemCount}</Label>
            <Slider
              value={[settings.problemCount]}
              onValueChange={([value]) => updateSetting('problemCount', value)}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏱️ Configuración de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Tiempo por Problema: {settings.timeLimit === 0 ? 'Sin límite' : `${settings.timeLimit} segundos`}
            </Label>
            <Slider
              value={[settings.timeLimit]}
              onValueChange={([value]) => updateSetting('timeLimit', value)}
              min={0}
              max={300}
              step={15}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Intentos Máximos: {settings.maxAttempts === 0 ? 'Ilimitados' : settings.maxAttempts}
            </Label>
            <Slider
              value={[settings.maxAttempts]}
              onValueChange={([value]) => updateSetting('maxAttempts', value)}
              min={0}
              max={5}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎮 Configuración de Experiencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Retroalimentación Inmediata</Label>
              <p className="text-sm text-gray-600">
                Mostrar si la respuesta es correcta inmediatamente
              </p>
            </div>
            <Switch
              checked={settings.showImmediateFeedback}
              onCheckedChange={(checked) => updateSetting('showImmediateFeedback', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Efectos de Sonido</Label>
              <p className="text-sm text-gray-600">
                Reproducir sonidos para aciertos y errores
              </p>
            </div>
            <Switch
              checked={settings.enableSoundEffects}
              onCheckedChange={(checked) => updateSetting('enableSoundEffects', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Respuesta con Explicación</Label>
              <p className="text-sm text-gray-600">
                Botón de ayuda que muestra la respuesta correcta
              </p>
            </div>
            <Switch
              checked={settings.showAnswerWithExplanation}
              onCheckedChange={(checked) => updateSetting('showAnswerWithExplanation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dificultad Adaptiva</Label>
              <p className="text-sm text-gray-600">
                Ajustar automáticamente según el rendimiento
              </p>
            </div>
            <Switch
              checked={settings.enableAdaptiveDifficulty}
              onCheckedChange={(checked) => updateSetting('enableAdaptiveDifficulty', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sistema de Recompensas</Label>
              <p className="text-sm text-gray-600">
                Activar medallas y logros
              </p>
            </div>
            <Switch
              checked={settings.enableRewards}
              onCheckedChange={(checked) => updateSetting('enableRewards', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌐 Configuración de Idioma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Idioma del Módulo</Label>
            <Select
              value={settings.language}
              onValueChange={(value: "english" | "spanish") => updateSetting('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">🇺🇸 English</SelectItem>
                <SelectItem value="spanish">🇪🇸 Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sección personalizada para configuraciones específicas del módulo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚙️ Configuraciones Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Configuración Personalizada 1</Label>
              <p className="text-sm text-gray-600">
                Descripción de tu configuración personalizada
              </p>
            </div>
            <Switch
              checked={settings.customSetting1 || false}
              onCheckedChange={(checked) => updateSetting('customSetting1', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customSetting2">Configuración Personalizada 2</Label>
            <Select
              value={settings.customSetting2 || "option1"}
              onValueChange={(value: string) => updateSetting('customSetting2', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Opción 1</SelectItem>
                <SelectItem value="option2">Opción 2</SelectItem>
                <SelectItem value="option3">Opción 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}