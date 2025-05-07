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
    enableRewards: settings.enableRewards === undefined ? true : settings.enableRewards,
    rewardType: settings.rewardType || "stars",
    enableAdaptiveDifficulty: settings.enableAdaptiveDifficulty || false,
    language: settings.language || "english",
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
          <CardTitle>
            {localSettings.language === "spanish" ? "Configuración de Aprendizaje de Alfabeto" : "Alphabet Learning Settings"}
          </CardTitle>
          <CardDescription>
            {localSettings.language === "spanish" ? "Personaliza tu experiencia de aprendizaje" : "Customize your learning experience"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-md font-medium">
              {localSettings.language === "spanish" ? "Nivel de Dificultad" : "Difficulty Level"}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="beginner"
                  name="difficulty"
                  value="beginner"
                  checked={localSettings.difficulty === "beginner"}
                  onChange={(e) => handleSettingChange('difficulty', e.target.value as "beginner")}
                  className="h-4 w-4"
                />
                <label htmlFor="beginner" className="text-sm">Beginner</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="elementary"
                  name="difficulty"
                  value="elementary"
                  checked={localSettings.difficulty === "elementary"}
                  onChange={(e) => handleSettingChange('difficulty', e.target.value as "elementary")}
                  className="h-4 w-4"
                />
                <label htmlFor="elementary" className="text-sm">Elementary</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="intermediate"
                  name="difficulty"
                  value="intermediate"
                  checked={localSettings.difficulty === "intermediate"}
                  onChange={(e) => handleSettingChange('difficulty', e.target.value as "intermediate")}
                  className="h-4 w-4"
                />
                <label htmlFor="intermediate" className="text-sm">Intermediate</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="advanced"
                  name="difficulty"
                  value="advanced"
                  checked={localSettings.difficulty === "advanced"}
                  onChange={(e) => handleSettingChange('difficulty', e.target.value as "advanced")}
                  className="h-4 w-4"
                />
                <label htmlFor="advanced" className="text-sm">Advanced</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="expert"
                  name="difficulty"
                  value="expert"
                  checked={localSettings.difficulty === "expert"}
                  onChange={(e) => handleSettingChange('difficulty', e.target.value as "expert")}
                  className="h-4 w-4"
                />
                <label htmlFor="expert" className="text-sm">Expert</label>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Each level adds new exercises and challenges for alphabet learning.
            </p>
            
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2">Difficulty Examples</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {/* Beginner */}
                <div className={`p-3 rounded-md ${localSettings.difficulty === "beginner" ? "bg-blue-900 text-white border-blue-700" : "bg-gray-800 text-gray-300 border-gray-700"} border`}>
                  <p className="font-semibold mb-1">Beginner</p>
                  <p className="text-sm">Reconocimiento básico</p>
                  <p className="text-sm">A → Apple 🍎</p>
                </div>
                
                {/* Elementary */}
                <div className={`p-3 rounded-md ${localSettings.difficulty === "elementary" ? "bg-blue-900 text-white border-blue-700" : "bg-gray-800 text-gray-300 border-gray-700"} border`}>
                  <p className="font-semibold mb-1">Elementary</p>
                  <p className="text-sm">Emparejamiento</p>
                  <p className="text-sm">B = ? [Ball ⚽]</p>
                </div>
                
                {/* Intermediate */}
                <div className={`p-3 rounded-md ${localSettings.difficulty === "intermediate" ? "bg-blue-900 text-white border-blue-700" : "bg-gray-800 text-gray-300 border-gray-700"} border`}>
                  <p className="font-semibold mb-1">Intermediate</p>
                  <p className="text-sm">Quiz de letras</p>
                  <p className="text-sm">🐱 = ? (A, C, P, R)</p>
                </div>
                
                {/* Advanced */}
                <div className={`p-3 rounded-md ${localSettings.difficulty === "advanced" ? "bg-blue-900 text-white border-blue-700" : "bg-gray-800 text-gray-300 border-gray-700"} border`}>
                  <p className="font-semibold mb-1">Advanced</p>
                  <p className="text-sm">Drag & Drop</p>
                  <p className="text-sm">Ordenar: D, A, C, B</p>
                </div>
                
                {/* Expert */}
                <div className={`p-3 rounded-md ${localSettings.difficulty === "expert" ? "bg-blue-900 text-white border-blue-700" : "bg-gray-800 text-gray-300 border-gray-700"} border`}>
                  <p className="font-semibold mb-1">Expert</p>
                  <p className="text-sm">Anterior/Siguiente</p>
                  <p className="text-sm">K → J y L</p>
                </div>
              </div>
            </div>
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
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-adaptive">Adaptive Difficulty</Label>
              <p className="text-sm text-gray-500">
                Adjust difficulty based on performance
              </p>
            </div>
            <Switch
              id="enable-adaptive"
              checked={localSettings.enableAdaptiveDifficulty}
              onCheckedChange={(checked) => handleSettingChange('enableAdaptiveDifficulty', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between my-6">
            <div className="space-y-0.5">
              <Label htmlFor="language">Language / Idioma</Label>
              <p className="text-sm text-gray-500">
                Choose interface language / Elegir idioma de la interfaz
              </p>
            </div>
            <Select
              value={localSettings.language}
              onValueChange={(value) => handleSettingChange('language', value as "english" | "spanish")}
            >
              <SelectTrigger id="language" className="w-40">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="english">English 🇺🇸</SelectItem>
                  <SelectItem value="spanish">Español 🇪🇸</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">
              {localSettings.language === "spanish" ? "Sistema de Recompensas" : "Reward System"}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-rewards">
                  {localSettings.language === "spanish" ? "Activar Recompensas" : "Enable Rewards"}
                </Label>
                <p className="text-sm text-gray-500">
                  {localSettings.language === "spanish" 
                    ? "Mostrar recompensas por respuestas correctas" 
                    : "Show rewards for correct answers"}
                </p>
              </div>
              <Switch
                id="enable-rewards"
                checked={localSettings.enableRewards}
                onCheckedChange={(checked) => handleSettingChange('enableRewards', checked)}
              />
            </div>
            
            {localSettings.enableRewards && (
              <div>
                <Label className="mb-2 block">
                  {localSettings.language === "spanish" ? "Tipo de Recompensa" : "Reward Type"}
                </Label>
                <Select
                  value={localSettings.rewardType}
                  onValueChange={(value) => handleSettingChange('rewardType', value as "stars" | "medals" | "trophies")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={localSettings.language === "spanish" ? "Seleccionar tipo" : "Select reward type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="stars">{localSettings.language === "spanish" ? "Estrellas ⭐" : "Stars ⭐"}</SelectItem>
                      <SelectItem value="medals">{localSettings.language === "spanish" ? "Medallas 🥇" : "Medals 🥇"}</SelectItem>
                      <SelectItem value="trophies">{localSettings.language === "spanish" ? "Trofeos 🏆" : "Trophies 🏆"}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-2">
                  {localSettings.language === "spanish"
                    ? "Las recompensas aparecerán en momentos clave para motivar al estudiante."
                    : "Rewards will appear at key moments to motivate the student."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            {localSettings.language === "spanish" ? "Restablecer Valores" : "Reset to Defaults"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {localSettings.language === "spanish" ? "Guardar Cambios" : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}