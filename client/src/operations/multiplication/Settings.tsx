import { useState } from "react";
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

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export default function Settings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    await updateModuleSettings("multiplication", localSettings);
    onBack();
  };

  const handleResetSettings = async () => {
    if (showResetConfirm) {
      await resetModuleSettings("multiplication");
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
          <h2 className="text-xl font-bold text-gray-900">Multiplication Exercise Settings</h2>
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
            <RadioGroup
              value={localSettings.difficulty}
              onValueChange={(value) => handleUpdateSetting("difficulty", value as "beginner" | "elementary" | "intermediate" | "advanced" | "expert")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner">Beginner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="elementary" id="elementary" />
                  <Label htmlFor="elementary">Elementary</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate">Intermediate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced">Advanced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expert" id="expert" />
                  <Label htmlFor="expert">Expert</Label>
                </div>
              </div>
            </RadioGroup>
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-medium">Beginner:</span> Multiplicación de dígitos 1-5 (1×1 a 5×5)
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Elementary:</span> Multiplicación de tablas hasta 9 (1×1 a 9×9)
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Intermediate:</span> Multiplicación de tablas hasta 12 (1×1 a 12×12)
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Advanced:</span> Multiplicación de dos dígitos por un dígito (23×6, 85×4)
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Expert:</span> Multiplicación de dos dígitos por dos dígitos (23×45, 78×19)
            </p>
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
          <h3 className="text-lg font-medium text-gray-900">Time Limit</h3>
          <div className="mt-2">
            <RadioGroup
              value={localSettings.timeLimit}
              onValueChange={(value) => handleUpdateSetting("timeLimit", value as "none" | "per-problem" | "total")}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="time-none" />
                  <Label htmlFor="time-none">No Limit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="per-problem" id="time-per-problem" />
                  <Label htmlFor="time-per-problem">Per Problem</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="total" id="time-total" />
                  <Label htmlFor="time-total">Total Time</Label>
                </div>
              </div>
            </RadioGroup>

            {localSettings.timeLimit !== "none" && (
              <div className="mt-4">
                <Label htmlFor="time-value" className="block text-sm font-medium text-gray-700">
                  Time (seconds)
                </Label>
                <div className="mt-1">
                  <Input
                    type="number"
                    id="time-value"
                    value={localSettings.timeValue}
                    onChange={(e) => handleUpdateSetting("timeValue", Number(e.target.value))}
                    min={5}
                    max={300}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Additional Settings</h3>
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
              <Label htmlFor="show-solution" className="cursor-pointer">
                Show solution on incorrect answer
              </Label>
              <Switch
                id="show-solution"
                checked={localSettings.showSolution}
                onCheckedChange={(checked) => handleUpdateSetting("showSolution", checked)}
              />
            </div>
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
            <Button type="button" onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
