import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import { ModuleSettings } from '@/context/SettingsContext';
import { useSettings } from '@/context/SettingsContext';

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export default function Settings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  
  // Local state to track changes before saving
  const [localSettings, setLocalSettings] = useState({
    difficulty: settings.difficulty,
    showImmediateFeedback: settings.showImmediateFeedback,
    enableSoundEffects: settings.enableSoundEffects,
  });
  
  const handleSettingChange = <K extends keyof typeof localSettings>(
    key: K, 
    value: typeof localSettings[K]
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSave = async () => {
    setIsLoading(true);
    await updateModuleSettings('alphabet', localSettings);
    setIsLoading(false);
    onBack();
  };
  
  const handleReset = async () => {
    setIsLoading(true);
    await resetModuleSettings('alphabet');
    setIsLoading(false);
    onBack();
  };
  
  return (
    <div className="p-6">
      <Button
        variant="ghost"
        className="mb-4 pl-0 flex items-center"
        onClick={onBack}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Exercise
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Alphabet Learning Settings</CardTitle>
          <CardDescription>
            Customize your learning experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={localSettings.difficulty}
              onValueChange={(value) => handleSettingChange('difficulty', value as any)}
            >
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="beginner">Beginner - Just Letters</SelectItem>
                  <SelectItem value="intermediate">Intermediate - With Quiz</SelectItem>
                  <SelectItem value="advanced">Advanced - Challenging Quiz</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Higher difficulty levels introduce quizzes and faster transitions.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-lowercase">Show Lowercase Letters</Label>
              <p className="text-sm text-gray-500">
                Display lowercase letters alongside uppercase
              </p>
            </div>
            <Switch
              id="show-lowercase"
              checked={localSettings.showImmediateFeedback}
              onCheckedChange={(checked) => handleSettingChange('showImmediateFeedback', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-effects">Enable Sound</Label>
              <p className="text-sm text-gray-500">
                Play pronunciation of letters and words
              </p>
            </div>
            <Switch
              id="sound-effects"
              checked={localSettings.enableSoundEffects}
              onCheckedChange={(checked) => handleSettingChange('enableSoundEffects', checked)}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}