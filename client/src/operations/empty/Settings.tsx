import { useState, useMemo } from "react";
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

export default function EmptySettings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Referencia a la función debounced para guardar la configuración
  const debouncedSave = useMemo(
    () =>
      debounce((settings: ModuleSettings) => {
        updateModuleSettings("empty", settings);
        console.log(`[EMPTY] Guardando configuración (debounced):`, settings);
      }, 500),
    [updateModuleSettings]
  );
  
  // Guardar automáticamente cada vez que cambia un ajuste
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
    
    // Para cambios de dificultad, aplicar cambio inmediatamente
    if (key === "difficulty") {
      console.log("[EMPTY] Guardando configuración de dificultad inmediatamente:", value);
      updateModuleSettings("empty", updatedSettings);
    } else {
      debouncedSave(updatedSettings);
    }
  };

  const handleReset = () => {
    if (showResetConfirm) {
      const resetSettings = { ...defaultModuleSettings };
      setLocalSettings(resetSettings);
      updateModuleSettings("empty", resetSettings);
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Empty Module Settings</h1>
            <p className="text-sm text-gray-600">Customize your practice experience</p>
          </div>
        </div>
        
        <Button 
          variant={showResetConfirm ? "destructive" : "outline"}
          onClick={handleReset}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {showResetConfirm ? "Confirm Reset" : "Reset to Default"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Main Settings */}
        <div className="space-y-6">
          {/* Difficulty Level */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Difficulty Level</Label>
            <RadioGroup
              value={localSettings.difficulty}
              onValueChange={(value) => handleUpdateSetting("difficulty", value as any)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="beginner" id="beginner" />
                <Label htmlFor="beginner" className="cursor-pointer">Beginner (Level 1)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="elementary" id="elementary" />
                <Label htmlFor="elementary" className="cursor-pointer">Elementary (Level 2)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate" className="cursor-pointer">Intermediate (Level 3)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced" className="cursor-pointer">Advanced (Level 4)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expert" id="expert" />
                <Label htmlFor="expert" className="cursor-pointer">Expert (Level 5)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Problem Count */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Number of Problems</Label>
            <div className="space-y-2">
              <Slider
                value={[localSettings.problemCount]}
                onValueChange={([value]) => handleUpdateSetting("problemCount", value)}
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>5 problems</span>
                <span className="font-medium">{localSettings.problemCount} problems</span>
                <span>50 problems</span>
              </div>
            </div>
          </div>

          {/* Time Settings */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Time Limit</Label>
            <RadioGroup
              value={localSettings.timeLimit}
              onValueChange={(value) => handleUpdateSetting("timeLimit", value as any)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="no-time" />
                <Label htmlFor="no-time" className="cursor-pointer">No time limit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="per-problem" id="per-problem" />
                <Label htmlFor="per-problem" className="cursor-pointer">Per problem</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="total" id="total" />
                <Label htmlFor="total" className="cursor-pointer">Total exercise</Label>
              </div>
            </RadioGroup>

            {localSettings.timeLimit !== "none" && (
              <div className="ml-6 space-y-2">
                <Label>Time in seconds</Label>
                <Input
                  type="number"
                  value={localSettings.timeValue}
                  onChange={(e) => handleUpdateSetting("timeValue", parseInt(e.target.value) || 0)}
                  min={0}
                  max={300}
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Max Attempts */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Maximum Attempts per Problem</Label>
            <div className="space-y-2">
              <Slider
                value={[localSettings.maxAttempts]}
                onValueChange={([value]) => handleUpdateSetting("maxAttempts", value)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>1 attempt</span>
                <span className="font-medium">
                  {localSettings.maxAttempts} {localSettings.maxAttempts === 1 ? 'attempt' : 'attempts'}
                </span>
                <span>5 attempts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Advanced Settings & Examples */}
        <div className="space-y-6">
          {/* Advanced Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Advanced Options</Label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Immediate Feedback</Label>
                  <p className="text-xs text-gray-500">Show feedback after each answer</p>
                </div>
                <Switch
                  checked={localSettings.showImmediateFeedback}
                  onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Sound Effects</Label>
                  <p className="text-xs text-gray-500">Play sounds for correct/incorrect answers</p>
                </div>
                <Switch
                  checked={localSettings.enableSoundEffects}
                  onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Show Answer Button</Label>
                  <p className="text-xs text-gray-500">Allow showing the correct answer</p>
                </div>
                <Switch
                  checked={localSettings.showAnswerWithExplanation}
                  onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Adaptive Difficulty</Label>
                  <p className="text-xs text-gray-500">Automatically adjust difficulty based on performance</p>
                </div>
                <Switch
                  checked={localSettings.enableAdaptiveDifficulty}
                  onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Compensation Mode</Label>
                  <p className="text-xs text-gray-500">Add extra problems for incorrect answers</p>
                </div>
                <Switch
                  checked={localSettings.enableCompensation}
                  onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Rewards System</Label>
                  <p className="text-xs text-gray-500">Enable points and achievements</p>
                </div>
                <Switch
                  checked={localSettings.enableRewards}
                  onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
                />
              </div>
            </div>
          </div>

          {/* Difficulty Examples */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Difficulty Examples</Label>
            <DifficultyExamples 
              difficulty={localSettings.difficulty} 
              operation="empty"
            />
          </div>
        </div>
      </div>
    </div>
  );
}