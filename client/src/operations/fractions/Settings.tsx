import { useState, useEffect, useMemo } from "react";
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
        updateModuleSettings("fractions", settings);
        console.log(`[FRACTIONS] Guardando configuración (debounced):`, settings);
      }, 1000), // 1 segundo de espera antes de guardar
    [updateModuleSettings]
  );
  
  // Guardar automáticamente cada vez que cambia un ajuste
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
    
    // Para cambios de dificultad, aplicar cambio inmediatamente
    if (key === "difficulty") {
      console.log("[FRACTIONS] Guardando configuración de dificultad inmediatamente:", value);
      updateModuleSettings("fractions", updatedSettings);
    } else {
      // Para otros ajustes, usar debounce para evitar múltiples llamadas de guardado
      debouncedSave(updatedSettings);
    }
  };
  
  // Para poder navegar entre la configuración y el ejercicio sin perder cambios
  useEffect(() => {
    // Guardar la configuración cuando se cierra/vuelve atrás
    return () => {
      updateModuleSettings("fractions", localSettings);
    };
  }, [localSettings, updateModuleSettings]);

  const handleResetSettings = async () => {
    if (showResetConfirm) {
      await resetModuleSettings("fractions");
      setLocalSettings({ ...defaultModuleSettings });
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
    }
  };

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fractions Exercise Settings</h2>
          <p className="text-sm text-gray-500">Customize your exercise experience</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exercise
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Difficulty Level</h3>
          <div className="mt-2">
            <DifficultyExamples 
              operation="fractions"
              activeDifficulty={localSettings.difficulty}
              onSelectDifficulty={(difficulty) => 
                handleUpdateSetting("difficulty", difficulty as "beginner" | "elementary" | "intermediate" | "advanced" | "expert")
              }
            />
          </div>
          
          <div className="mt-2 mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-medium">Beginner:</span> Fracciones con mismo denominador
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Elementary:</span> Fracciones con denominadores relacionados
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Intermediate:</span> Fracciones con denominadores no relacionados
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Advanced:</span> Operaciones con números mixtos
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Expert:</span> Operaciones avanzadas (multiplicación y división)
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Problem Type</h3>
          <div className="mt-2">
            <RadioGroup
              value={localSettings.fractionType || "mixed"}
              onValueChange={(value) => handleUpdateSetting("fractionType", value as "addition" | "subtraction" | "comparison" | "mixed")}
            >
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="addition" id="addition" />
                  <Label htmlFor="addition">Addition</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="subtraction" id="subtraction" />
                  <Label htmlFor="subtraction">Subtraction</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comparison" id="comparison" />
                  <Label htmlFor="comparison">Comparison</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed">Mixed (All Types)</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Number of Problems</h3>
          <div className="mt-2">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.problemCount]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={(value) => handleUpdateSetting("problemCount", value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.problemCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 50) {
                      handleUpdateSetting("problemCount", value);
                    }
                  }}
                  min={1}
                  max={50}
                  className="w-full"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Especifica cuántos problemas quieres resolver en este ejercicio (1-50)
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Límite de Tiempo</h3>
          <div className="mt-2">
            <div className="mb-4 grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="time-limit-type" className="text-sm text-gray-700">
                  Tipo de límite de tiempo
                </Label>
                <RadioGroup
                  value={localSettings.timeLimit}
                  onValueChange={(value) => handleUpdateSetting("timeLimit", value as "per-problem")}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="per-problem" id="per-problem" />
                    <Label htmlFor="per-problem">Por problema</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Slider
                    value={[localSettings.timeValue]}
                    min={0}
                    max={300}
                    step={5}
                    onValueChange={(value) => handleUpdateSetting("timeValue", value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>150</span>
                    <span>300</span>
                  </div>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    value={localSettings.timeValue}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 300) {
                        handleUpdateSetting("timeValue", value);
                      }
                    }}
                    min={0}
                    max={300}
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Tiempo en segundos (0 para sin límite). {localSettings.timeLimit === "per-problem" 
                  ? "Cada problema tiene este límite de tiempo específico."
                  : "Es el tiempo total para completar todos los problemas."}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Maximum Attempts per Problem</h3>
          <div className="mt-2">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.maxAttempts]}
                  min={0}
                  max={10}
                  step={1}
                  onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.maxAttempts}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 10) {
                      handleUpdateSetting("maxAttempts", value);
                    }
                  }}
                  min={0}
                  max={10}
                  className="w-full"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Establece el máximo de intentos por problema (0 para intentos ilimitados)
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mt-6">Additional Settings</h3>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-immediate-feedback" className="cursor-pointer">
                Show immediate feedback
              </Label>
              <Switch
                id="show-immediate-feedback"
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-sound-effects" className="cursor-pointer">
                Enable sound effects
              </Label>
              <Switch
                id="enable-sound-effects"
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-answer-explanation" className="cursor-pointer">
                Show answer with explanation
              </Label>
              <Switch
                id="show-answer-explanation"
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="require-simplified" className="cursor-pointer">
                Require simplified answers
              </Label>
              <Switch
                id="require-simplified"
                checked={localSettings.requireSimplified || true}
                onCheckedChange={(checked) => handleUpdateSetting("requireSimplified", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-adaptive-difficulty" className="cursor-pointer">
                Habilitar Dificultad Adaptativa
              </Label>
              <Switch
                id="enable-adaptive-difficulty"
                checked={localSettings.enableAdaptiveDifficulty || false}
                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-compensation" className="cursor-pointer">
                Habilitar Compensación (Añadir 1 problema por cada incorrecto/revelado)
              </Label>
              <Switch
                id="enable-compensation"
                checked={localSettings.enableCompensation || false}
                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
              />
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mt-6">Reward System</h3>
          <div className="mt-2 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-rewards" className="cursor-pointer">
                Enable reward system
              </Label>
              <Switch
                id="enable-rewards"
                checked={localSettings.enableRewards || true}
                onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
              />
            </div>
            
            {(localSettings.enableRewards || true) && (
              <div>
                <Label className="mb-2 block">Reward Type</Label>
                <RadioGroup
                  value={localSettings.rewardType || "stars"}
                  onValueChange={(value) => 
                    handleUpdateSetting("rewardType", value as "medals" | "trophies" | "stars")
                  }
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stars" id="stars" />
                    <Label htmlFor="stars" className="flex items-center">
                      Stars <span className="ml-2 text-lg">⭐</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medals" id="medals" />
                    <Label htmlFor="medals" className="flex items-center">
                      Medals <span className="ml-2 text-lg">🥇</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trophies" id="trophies" />
                    <Label htmlFor="trophies" className="flex items-center">
                      Trophies <span className="ml-2 text-lg">🏆</span>
                    </Label>
                  </div>
                </RadioGroup>
                <p className="mt-2 text-sm text-gray-500">
                  Los premios aparecerán en momentos clave para motivar al estudiante. La frecuencia es controlada 
                  para mantener su valor motivacional.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <Button
              type="button"
              variant={showResetConfirm ? "destructive" : "outline"}
              onClick={handleResetSettings}
              className="mr-3"
            >
              {showResetConfirm ? (
                "Confirm Reset"
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </>
              )}
            </Button>
            {/* Botón de guardar eliminado - los cambios se guardan automáticamente */}
          </div>
        </div>
      </div>
    </div>
  );
}
