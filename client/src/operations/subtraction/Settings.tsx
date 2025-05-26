import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Settings as SettingsIcon } from "lucide-react";
import { ModuleSettings } from "@/context/SettingsContext";

interface SubtractionSettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export default function SubtractionSettingsComponent({ settings, onBack }: SubtractionSettingsProps) {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<ModuleSettings>(settings);

  const handleSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Los ajustes de resta han sido guardados exitosamente.",
      variant: "default",
    });
    onBack();
  };

  const updateSetting = <K extends keyof ModuleSettings>(
    key: K,
    value: ModuleSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Resta</h1>
            <p className="text-gray-600">Personaliza tu experiencia de práctica de resta</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuración Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-red-600">📊</span>
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
                value={localSettings.difficulty}
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
              {localSettings.difficulty && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    {getDifficultyDescription(localSettings.difficulty)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="problemCount" className="text-sm font-medium">
                Cantidad de Problemas
              </Label>
              <Select
                value={localSettings.problemCount.toString()}
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
                value={localSettings.maxAttempts.toString()}
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
                  value={localSettings.timeValue}
                  onChange={(e) => updateSetting('timeValue', parseInt(e.target.value) || 0)}
                  min="0"
                  max="300"
                  className="flex-1"
                />
                <Badge variant={localSettings.timeValue === 0 ? "secondary" : "default"}>
                  {localSettings.timeValue === 0 ? "Sin límite" : `${localSettings.timeValue}s`}
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
                  checked={localSettings.showImmediateFeedback}
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
                  checked={localSettings.enableSoundEffects}
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
                  checked={localSettings.showAnswerWithExplanation}
                  onCheckedChange={(checked) => updateSetting('showAnswerWithExplanation', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Sistema de Recompensas</Label>
                  <p className="text-xs text-gray-500">
                    Activa premios y logros por buen rendimiento
                  </p>
                </div>
                <Switch
                  checked={localSettings.enableRewards}
                  onCheckedChange={(checked) => updateSetting('enableRewards', checked)}
                />
              </div>

              {localSettings.enableRewards && (
                <div className="space-y-2 pl-4 border-l-2 border-green-200">
                  <Label className="text-sm font-medium">Tipo de Recompensa</Label>
                  <Select
                    value={localSettings.rewardType}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex justify-end items-center pt-6 border-t">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar Configuración
          </Button>
        </div>
      </div>
    </div>
  );
}