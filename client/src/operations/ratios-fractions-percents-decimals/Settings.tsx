import { useState, useEffect, useMemo, useRef } from "react";
import { ModuleSettings } from "@/context/SettingsContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { defaultModuleSettings } from "@/utils/operationComponents";
import DifficultyExamples from "@/components/DifficultyExamples";
import { debounce } from "@/lib/utils";

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export default function Settings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Referencia a la función debounced para guardar la configuración
  const debouncedSave = useMemo(
    () =>
      debounce((settings: ModuleSettings) => {
        updateModuleSettings("ratios-fractions-percents-decimals", settings);
        console.log(`[RATIOS-FRACTIONS-PERCENTS-DECIMALS] Guardando configuración (debounced):`, settings);
      }, 500),
    [updateModuleSettings]
  );
  
  // Guardar automáticamente cada vez que cambia un ajuste
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
    
    // Para cambios de dificultad, aplicar cambio inmediatamente
    if (key === "difficulty") {
      console.log("[RATIOS-FRACTIONS-PERCENTS-DECIMALS] Guardando configuración de dificultad inmediatamente:", value);
      updateModuleSettings("ratios-fractions-percents-decimals", updatedSettings);
    } else {
      debouncedSave(updatedSettings);
    }
  };
  
  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const handleReset = () => {
    const defaultSettings = defaultModuleSettings;
    setLocalSettings(defaultSettings);
    resetModuleSettings("ratios-fractions-percents-decimals");
    console.log("[RATIOS-FRACTIONS-PERCENTS-DECIMALS] Configuración restablecida a valores por defecto");
    setShowResetConfirm(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Configuración - Ratios, Fractions, Percents, Decimals</h1>
      </div>

      <div className="space-y-8">
        {/* Dificultad */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Nivel de dificultad</Label>
          <RadioGroup
            value={localSettings.difficulty}
            onValueChange={(value) => handleUpdateSetting("difficulty", value as "beginner" | "elementary" | "intermediate" | "advanced" | "expert")}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="beginner" id="beginner" />
              <Label htmlFor="beginner">Principiante</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="elementary" id="elementary" />
              <Label htmlFor="elementary">Elemental</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermediate" id="intermediate" />
              <Label htmlFor="intermediate">Intermedio</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="advanced" id="advanced" />
              <Label htmlFor="advanced">Avanzado</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expert" id="expert" />
              <Label htmlFor="expert">Experto</Label>
            </div>
          </RadioGroup>
          <DifficultyExamples activeDifficulty={localSettings.difficulty} operation="generic" />
        </div>

        {/* Cantidad de problemas */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Cantidad de problemas</Label>
          <div className="space-y-2">
            <Slider
              value={[localSettings.problemCount]}
              onValueChange={([value]) => handleUpdateSetting("problemCount", value)}
              max={50}
              min={5}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">
              {localSettings.problemCount} problemas
            </div>
          </div>
        </div>

        {/* Temporizador */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Temporizador por problema</Label>
            <Switch
              checked={localSettings.timeValue > 0}
              onCheckedChange={(checked) => handleUpdateSetting("timeValue", checked ? 30 : 0)}
            />
          </div>
          {localSettings.timeValue > 0 && (
            <div className="space-y-2">
              <Slider
                value={[localSettings.timeValue]}
                onValueChange={([value]) => handleUpdateSetting("timeValue", value)}
                max={300}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">
                {localSettings.timeValue} segundos por problema
              </div>
            </div>
          )}
        </div>

        {/* Intentos máximos */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Intentos máximos por problema</Label>
          <div className="space-y-2">
            <Slider
              value={[localSettings.maxAttempts]}
              onValueChange={([value]) => handleUpdateSetting("maxAttempts", value)}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">
              {localSettings.maxAttempts === 1 ? "1 intento" : `${localSettings.maxAttempts} intentos`}
            </div>
          </div>
        </div>

        {/* Funciones avanzadas */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Funciones avanzadas</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="feedback">Retroalimentación inmediata</Label>
              <Switch
                id="feedback"
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sounds">Efectos de sonido</Label>
              <Switch
                id="sounds"
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-answer">Mostrar respuesta con explicación</Label>
              <Switch
                id="show-answer"
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="adaptive">Dificultad adaptativa</Label>
              <Switch
                id="adaptive"
                checked={localSettings.enableAdaptiveDifficulty}
                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="compensation">Problemas de compensación</Label>
              <Switch
                id="compensation"
                checked={localSettings.enableCompensation}
                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rewards">Sistema de recompensas</Label>
              <Switch
                id="rewards"
                checked={localSettings.enableRewards}
                onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
              />
            </div>
          </div>
        </div>

        {/* Idioma */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Idioma</Label>
          <RadioGroup
            value={localSettings.language || "english"}
            onValueChange={(value) => handleUpdateSetting("language", value as "english" | "spanish")}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="english" id="english" />
              <Label htmlFor="english">English</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spanish" id="spanish" />
              <Label htmlFor="spanish">Español</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Restablecer configuración */}
        <div className="pt-6 border-t">
          {!showResetConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restablecer configuración
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                ¿Estás seguro de que quieres restablecer toda la configuración?
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Restablecer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}