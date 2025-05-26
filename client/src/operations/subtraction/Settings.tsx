import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, Save, Settings as SettingsIcon } from "lucide-react";
import type { SubtractionSettings } from './types';
import { defaultSubtractionSettings } from './utils';

interface SubtractionSettingsProps {
  onClose?: () => void;
}

export default function SubtractionSettingsComponent({ onClose }: SubtractionSettingsProps) {
  const { getModuleSettings, updateModuleSettings, resetModuleSettings } = useSettings();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SubtractionSettings>(() => {
    const moduleSettings = getModuleSettings('subtraction');
    return {
      ...defaultSubtractionSettings,
      ...moduleSettings,
      allowNegativeResults: (moduleSettings as any).allowNegativeResults ?? false
    } as SubtractionSettings;
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar con cambios externos
  useEffect(() => {
    const moduleSettings = getModuleSettings('subtraction');
    setSettings(current => ({
      ...defaultSubtractionSettings,
      ...moduleSettings,
      allowNegativeResults: (moduleSettings as any).allowNegativeResults ?? current.allowNegativeResults
    } as SubtractionSettings));
  }, [getModuleSettings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateModuleSettings('subtraction', settings);
      toast({
        title: "Configuración guardada",
        description: "Los ajustes de resta han sido guardados exitosamente.",
        variant: "default",
      });
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving subtraction settings:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los ajustes. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await resetModuleSettings('subtraction');
      setSettings(defaultSubtractionSettings);
      
      toast({
        title: "Configuración restaurada",
        description: "Los ajustes han sido restaurados a los valores predeterminados.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error resetting subtraction settings:", error);
      toast({
        title: "Error al restaurar",
        description: "No se pudieron restaurar los ajustes. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = <K extends keyof SubtractionSettings>(
    key: K,
    value: SubtractionSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getDifficultyDescription = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "Restas de 1 dígito (5 - 3, 8 - 2)";
      case "elementary":
        return "Restas de 2 dígitos sin prestar (25 - 12)";
      case "intermediate":
        return "Restas de 2 dígitos con prestar (53 - 28)";
      case "advanced":
        return "Restas de 3 dígitos (125 - 87)";
      case "expert":
        return "Restas con decimales (123.5 - 67.8)";
      default:
        return "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Resta</h1>
          <p className="text-gray-600">Personaliza tu experiencia de práctica de resta</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuración Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-purple-600">📊</span>
              Configuración Principal
            </CardTitle>
            <CardDescription>
              Ajusta la dificultad y cantidad de problemas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">
                Nivel de Dificultad
              </Label>
              <Select
                value={settings.difficulty}
                onValueChange={(value: any) => updateSetting('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="space-y-1">
                      <div className="font-medium">Principiante</div>
                      <div className="text-xs text-gray-500">
                        {getDifficultyDescription("beginner")}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="elementary">
                    <div className="space-y-1">
                      <div className="font-medium">Elemental</div>
                      <div className="text-xs text-gray-500">
                        {getDifficultyDescription("elementary")}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="space-y-1">
                      <div className="font-medium">Intermedio</div>
                      <div className="text-xs text-gray-500">
                        {getDifficultyDescription("intermediate")}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="space-y-1">
                      <div className="font-medium">Avanzado</div>
                      <div className="text-xs text-gray-500">
                        {getDifficultyDescription("advanced")}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="expert">
                    <div className="space-y-1">
                      <div className="font-medium">Experto</div>
                      <div className="text-xs text-gray-500">
                        {getDifficultyDescription("expert")}
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {settings.difficulty && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium">
                    {getDifficultyDescription(settings.difficulty)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="problemCount" className="text-sm font-medium">
                Cantidad de Problemas
              </Label>
              <Select
                value={settings.problemCount.toString()}
                onValueChange={(value) => updateSetting('problemCount', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 problemas</SelectItem>
                  <SelectItem value="10">10 problemas</SelectItem>
                  <SelectItem value="15">15 problemas</SelectItem>
                  <SelectItem value="20">20 problemas</SelectItem>
                  <SelectItem value="25">25 problemas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttempts" className="text-sm font-medium">
                Intentos Máximos por Problema
              </Label>
              <Select
                value={settings.maxAttempts.toString()}
                onValueChange={(value) => updateSetting('maxAttempts', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 intento</SelectItem>
                  <SelectItem value="2">2 intentos</SelectItem>
                  <SelectItem value="3">3 intentos</SelectItem>
                  <SelectItem value="0">Intentos ilimitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Tiempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-blue-600">⏱️</span>
              Límite de Tiempo
            </CardTitle>
            <CardDescription>
              Configura el tiempo límite para resolver problemas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeValue" className="text-sm font-medium">
                Tiempo por Problema (segundos)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.timeValue}
                  onChange={(e) => updateSetting('timeValue', parseInt(e.target.value) || 0)}
                  min="0"
                  max="300"
                  className="flex-1"
                />
                <Badge variant={settings.timeValue === 0 ? "secondary" : "default"}>
                  {settings.timeValue === 0 ? "Sin límite" : `${settings.timeValue}s`}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                0 = sin límite de tiempo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de Funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600">⚙️</span>
            Funcionalidades
          </CardTitle>
          <CardDescription>
            Activa o desactiva características específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Retroalimentación Inmediata</Label>
                  <p className="text-xs text-gray-500">
                    Muestra si la respuesta es correcta al instante
                  </p>
                </div>
                <Switch
                  checked={settings.showImmediateFeedback}
                  onCheckedChange={(checked) => updateSetting('showImmediateFeedback', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Efectos de Sonido</Label>
                  <p className="text-xs text-gray-500">
                    Reproduce sonidos para respuestas correctas/incorrectas
                  </p>
                </div>
                <Switch
                  checked={settings.enableSoundEffects}
                  onCheckedChange={(checked) => updateSetting('enableSoundEffects', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Mostrar Respuesta con Explicación</Label>
                  <p className="text-xs text-gray-500">
                    Botón de ayuda que muestra la respuesta paso a paso
                  </p>
                </div>
                <Switch
                  checked={settings.showAnswerWithExplanation}
                  onCheckedChange={(checked) => updateSetting('showAnswerWithExplanation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Dificultad Adaptativa</Label>
                  <p className="text-xs text-gray-500">
                    Ajusta automáticamente la dificultad según tu rendimiento
                  </p>
                </div>
                <Switch
                  checked={settings.enableAdaptiveDifficulty}
                  onCheckedChange={(checked) => updateSetting('enableAdaptiveDifficulty', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Permitir Resultados Negativos</Label>
                  <p className="text-xs text-gray-500">
                    Incluye problemas con respuestas negativas
                  </p>
                </div>
                <Switch
                  checked={settings.allowNegativeResults}
                  onCheckedChange={(checked) => updateSetting('allowNegativeResults', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Sistema de Compensación</Label>
                  <p className="text-xs text-gray-500">
                    Añade problemas extra por respuestas incorrectas
                  </p>
                </div>
                <Switch
                  checked={settings.enableCompensation}
                  onCheckedChange={(checked) => updateSetting('enableCompensation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Sistema de Recompensas</Label>
                  <p className="text-xs text-gray-500">
                    Activa premios y logros por buen rendimiento
                  </p>
                </div>
                <Switch
                  checked={settings.enableRewards}
                  onCheckedChange={(checked) => updateSetting('enableRewards', checked)}
                />
              </div>

              {settings.enableRewards && (
                <div className="space-y-2 pl-4 border-l-2 border-green-200">
                  <Label className="text-sm font-medium">Tipo de Recompensa</Label>
                  <Select
                    value={settings.rewardType}
                    onValueChange={(value: any) => updateSetting('rewardType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stars">⭐ Estrellas</SelectItem>
                      <SelectItem value="medals">🏅 Medallas</SelectItem>
                      <SelectItem value="trophies">🏆 Trofeos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Idioma</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value: any) => updateSetting('language', value)}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar Valores por Defecto
        </Button>

        <div className="flex gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </div>
    </div>
  );
}