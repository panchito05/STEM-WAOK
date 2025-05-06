import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { ModuleSettings } from "@/context/SettingsContext";
import { useSettings } from "@/context/SettingsContext";

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export default function CountingSettings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    settings.difficulty as "beginner" | "intermediate" | "advanced"
  );
  const [enableSoundEffects, setEnableSoundEffects] = useState<boolean>(
    settings.enableSoundEffects
  );
  const [showImmediateFeedback, setShowImmediateFeedback] = useState<boolean>(
    settings.showImmediateFeedback
  );
  
  // Función para guardar la configuración
  const saveSettings = async () => {
    const updatedSettings = {
      ...settings,
      difficulty: difficulty,
      enableSoundEffects,
      showImmediateFeedback
    };
    
    await updateModuleSettings("counting", updatedSettings);
    onBack();
  };
  
  // Función para restablecer la configuración
  const handleReset = async () => {
    await resetModuleSettings("counting");
    onBack();
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Counting Settings</h2>
      </div>
      
      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Difficulty Level</h3>
            <p className="text-sm text-gray-500">
              Choose the difficulty level for counting exercises
            </p>
            <Select 
              value={difficulty} 
              onValueChange={setDifficulty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner (Count to 10)</SelectItem>
                <SelectItem value="intermediate">Intermediate (Count to 20)</SelectItem>
                <SelectItem value="advanced">Advanced (Count to 50)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Options</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-effects">Sound Effects</Label>
                <p className="text-sm text-gray-500">
                  Play sounds when counting numbers
                </p>
              </div>
              <Switch 
                id="sound-effects" 
                checked={enableSoundEffects}
                onCheckedChange={setEnableSoundEffects}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="immediate-feedback">Immediate Feedback</Label>
                <p className="text-sm text-gray-500">
                  Show feedback immediately after each count
                </p>
              </div>
              <Switch 
                id="immediate-feedback" 
                checked={showImmediateFeedback}
                onCheckedChange={setShowImmediateFeedback}
              />
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={saveSettings}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}