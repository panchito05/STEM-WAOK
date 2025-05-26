// Settings.tsx para el módulo de subtraction
// Adaptado del módulo addition-independent con configuraciones específicas para sustracción

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Minus, Settings as SettingsIcon, Clock, Target, Volume2, Eye, Zap, Award } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface SettingsProps {
  settings: any;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onBack }) => {
  const { updateSettings } = useSettings();

  const handleSettingChange = (key: string, value: any) => {
    updateSettings('subtraction', { [key]: value });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <Minus className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">Configuración de Sustracción</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración del Ejercicio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Configuración del Ejercicio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dificultad */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Nivel de Dificultad</Label>
              <Select 
                value={settings.difficulty} 
                onValueChange={(value) => handleSettingChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex flex-col">
                      <span>Principiante</span>
                      <span className="text-xs text-gray-500">Restas simples (2-9)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="elementary">
                    <div className="flex flex-col">
                      <span>Elemental</span>
                      <span className="text-xs text-gray-500">Dos dígitos menos uno o dos dígitos</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex flex-col">
                      <span>Intermedio</span>
                      <span className="text-xs text-gray-500">Problemas verticales, posibles decimales</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex flex-col">
                      <span>Avanzado</span>
                      <span className="text-xs text-gray-500">Múltiples sustraendos, decimales</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expert">
                    <div className="flex flex-col">
                      <span>Experto</span>
                      <span className="text-xs text-gray-500">4-5 operandos, decimales complejos</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Número de Problemas */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Número de Problemas</Label>
                <Badge variant="outline">{settings.problemCount}</Badge>
              </div>
              <Slider
                value={[settings.problemCount]}
                onValueChange={(value) => handleSettingChange('problemCount', value[0])}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            {/* Intentos Máximos */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Intentos Máximos por Problema</Label>
                <Badge variant="outline">{settings.maxAttempts}</Badge>
              </div>
              <Slider
                value={[settings.maxAttempts]}
                onValueChange={(value) => handleSettingChange('maxAttempts', value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>3</span>
                <span>5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Tiempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Configuración de Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Habilitar Temporizador */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Habilitar Temporizador</Label>
                <p className="text-sm text-gray-500">Agregar presión de tiempo al ejercicio</p>
              </div>
              <Switch
                checked={settings.hasTimerEnabled}
                onCheckedChange={(value) => handleSettingChange('hasTimerEnabled', value)}
              />
            </div>

            {settings.hasTimerEnabled && (
              <>
                {/* Tipo de Límite de Tiempo */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Tipo de Límite</Label>
                  <Select 
                    value={settings.timeLimit} 
                    onValueChange={(value) => handleSettingChange('timeLimit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Tiempo Total</SelectItem>
                      <SelectItem value="per-problem">Por Problema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor del Tiempo */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">
                      {settings.timeLimit === 'total' ? 'Minutos Totales' : 'Segundos por Problema'}
                    </Label>
                    <Badge variant="outline">
                      {settings.timeValue} {settings.timeLimit === 'total' ? 'min' : 'seg'}
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.timeValue]}
                    onValueChange={(value) => handleSettingChange('timeValue', value[0])}
                    min={settings.timeLimit === 'total' ? 2 : 10}
                    max={settings.timeLimit === 'total' ? 30 : 120}
                    step={settings.timeLimit === 'total' ? 1 : 5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{settings.timeLimit === 'total' ? '2 min' : '10 seg'}</span>
                    <span>{settings.timeLimit === 'total' ? '15 min' : '60 seg'}</span>
                    <span>{settings.timeLimit === 'total' ? '30 min' : '120 seg'}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Configuración de Retroalimentación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Retroalimentación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mostrar Retroalimentación Inmediata */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Retroalimentación Inmediata</Label>
                <p className="text-sm text-gray-500">Mostrar si la respuesta es correcta al instante</p>
              </div>
              <Switch
                checked={settings.showImmediateFeedback}
                onCheckedChange={(value) => handleSettingChange('showImmediateFeedback', value)}
              />
            </div>

            {/* Mostrar Respuesta con Explicación */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Mostrar Explicación</Label>
                <p className="text-sm text-gray-500">Incluir explicaciones en respuestas incorrectas</p>
              </div>
              <Switch
                checked={settings.showAnswerWithExplanation}
                onCheckedChange={(value) => handleSettingChange('showAnswerWithExplanation', value)}
              />
            </div>

            {/* Efectos de Sonido */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Efectos de Sonido</Label>
                <p className="text-sm text-gray-500">Reproducir sonidos para éxito y error</p>
              </div>
              <Switch
                checked={settings.enableSoundEffects}
                onCheckedChange={(value) => handleSettingChange('enableSoundEffects', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración Avanzada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Configuración Avanzada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dificultad Adaptativa */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Dificultad Adaptativa</Label>
                <p className="text-sm text-gray-500">Ajustar automáticamente según rendimiento</p>
              </div>
              <Switch
                checked={settings.enableAdaptiveDifficulty}
                onCheckedChange={(value) => handleSettingChange('enableAdaptiveDifficulty', value)}
              />
            </div>

            {/* Sistema de Compensación */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Sistema de Compensación</Label>
                <p className="text-sm text-gray-500">Ajustar problemas según errores frecuentes</p>
              </div>
              <Switch
                checked={settings.enableCompensation}
                onCheckedChange={(value) => handleSettingChange('enableCompensation', value)}
              />
            </div>

            {/* Sistema de Recompensas */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Sistema de Recompensas</Label>
                <p className="text-sm text-gray-500">Activar logros y recompensas</p>
              </div>
              <Switch
                checked={settings.enableRewards}
                onCheckedChange={(value) => handleSettingChange('enableRewards', value)}
              />
            </div>

            {settings.enableRewards && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Tipo de Recompensa</Label>
                <Select 
                  value={settings.rewardType} 
                  onValueChange={(value) => handleSettingChange('rewardType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Puntos</SelectItem>
                    <SelectItem value="badges">Insignias</SelectItem>
                    <SelectItem value="both">Puntos e Insignias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Idioma */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Idioma</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => handleSettingChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Resumen de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Dificultad:</span>
              <Badge variant="outline" className="ml-2">
                {settings.difficulty}
              </Badge>
            </div>
            <div>
              <span className="font-medium text-gray-600">Problemas:</span>
              <Badge variant="outline" className="ml-2">
                {settings.problemCount}
              </Badge>
            </div>
            <div>
              <span className="font-medium text-gray-600">Tiempo:</span>
              <Badge variant="outline" className="ml-2">
                {settings.hasTimerEnabled 
                  ? `${settings.timeValue}${settings.timeLimit === 'total' ? ' min' : ' seg'}`
                  : 'Sin límite'
                }
              </Badge>
            </div>
            <div>
              <span className="font-medium text-gray-600">Intentos:</span>
              <Badge variant="outline" className="ml-2">
                {settings.maxAttempts}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;