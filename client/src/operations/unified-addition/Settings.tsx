// Settings.tsx - Componente de configuración del módulo de adición unificado
import React, { useCallback } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { SettingsIcon, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ModuleSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { debounce } from '@/lib/utils';
import DifficultyExamples from '@/components/DifficultyExamples';

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export function Settings({ settings, onBack }: SettingsProps) {
  const { t } = useTranslations();
  
  // Crear una función debounced para actualizar configuraciones
  const debouncedUpdateSettings = useCallback(
      debounce((settings: ModuleSettings) => {
        // La función actual sólo actualiza el estado local
        // La actualización a la base de datos se maneja en el hook useSettings
      }, 300),
      []
  );

  // Función para manejar cambios en las configuraciones
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...settings, [key]: value };
    
    // En el contexto actual, la función updateSettings no es parte del objeto settings
    // pero se pasa como parte de las props desde el componente padre
    if (typeof settings.onUpdate === 'function') {
      settings.onUpdate(updatedSettings);
      debouncedUpdateSettings(updatedSettings);
    }
  };

  // Ejemplos por nivel de dificultad
  const difficultyExamples = {
    beginner: ["5 + 3", "7 + 2", "4 + 6"],
    elementary: ["12 + 8", "15 + 7", "23 + 16"],
    intermediate: ["127 + 45", "238 + 167", "456 + 329"],
    advanced: ["1,258 + 763", "3,427 + 2,891", "8,753 + 6,429"],
    expert: ["12.75 + 8.25", "347.52 + 186.39", "1,238.75 + 962.48"],
  };

  return (
    <div className="settings-container space-y-6 p-4 rounded-md border border-gray-200 bg-background">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <SettingsIcon className="mr-2 h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">{t('settings.title')}</h2>
        </div>
      </div>

      {/* Sección de dificultad */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">{t('settings.difficultyLevel')}</h3>
        <DifficultyExamples 
          operation="addition"
          activeDifficulty={settings.difficulty || 'beginner'}
          onSelectDifficulty={(difficulty) => handleUpdateSetting('difficulty', difficulty)}
        />
      </div>

      {/* Cantidad de problemas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="problemCount">{t('settings.problemCount')}</Label>
          <span className="text-sm font-medium">{settings.problemCount}</span>
        </div>
        <Slider 
          id="problemCount"
          min={5} 
          max={25} 
          step={5} 
          value={[settings.problemCount || 10]} 
          onValueChange={(value) => handleUpdateSetting('problemCount', value[0])}
        />
      </div>

      {/* Tiempo límite */}
      <div className="space-y-2">
        <Label htmlFor="timeLimit">{t('settings.timeLimit')}</Label>
        <RadioGroup 
          id="timeLimit"
          value={settings.timeLimit || 'no-limit'} 
          onValueChange={(value) => handleUpdateSetting('timeLimit', value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no-limit" id="no-limit" />
            <Label htmlFor="no-limit">{t('settings.timeLimitNone')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="per-problem" id="per-problem" />
            <Label htmlFor="per-problem">{t('settings.timeLimitPerProblem')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="exercise" id="exercise" />
            <Label htmlFor="exercise">{t('settings.timeLimitTotal')}</Label>
          </div>
        </RadioGroup>

        {settings.timeLimit !== 'no-limit' && (
          <div className="mt-2 pl-6">
            <div className="flex items-center">
              <Input
                type="number"
                min={5}
                max={300}
                value={settings.timeValue || 30}
                onChange={(e) => handleUpdateSetting('timeValue', parseInt(e.target.value) || 30)}
                className="w-20 mr-2"
              />
              <span>{t('settings.seconds')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Opciones avanzadas */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-lg">{t('settings.advancedOptions')}</h3>
        
        {/* Feedback inmediato */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showImmediateFeedback">{t('settings.showImmediateFeedback')}</Label>
            <p className="text-xs text-muted-foreground">{t('settings.showImmediateFeedbackDesc')}</p>
          </div>
          <Switch
            id="showImmediateFeedback"
            checked={settings.showImmediateFeedback ?? true}
            onCheckedChange={(checked) => handleUpdateSetting('showImmediateFeedback', checked)}
          />
        </div>

        {/* Efectos de sonido */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enableSoundEffects">{t('settings.enableSoundEffects')}</Label>
            <p className="text-xs text-muted-foreground">{t('settings.enableSoundEffectsDesc')}</p>
          </div>
          <Switch
            id="enableSoundEffects"
            checked={settings.enableSoundEffects ?? true}
            onCheckedChange={(checked) => handleUpdateSetting('enableSoundEffects', checked)}
          />
        </div>

        {/* Mostrar respuesta con explicación */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showAnswerWithExplanation">{t('settings.showAnswerWithExplanation')}</Label>
            <p className="text-xs text-muted-foreground">{t('settings.showAnswerWithExplanationDesc')}</p>
          </div>
          <Switch
            id="showAnswerWithExplanation"
            checked={settings.showAnswerWithExplanation ?? true}
            onCheckedChange={(checked) => handleUpdateSetting('showAnswerWithExplanation', checked)}
          />
        </div>

        {/* Dificultad adaptativa */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-center">
            <div>
              <Label htmlFor="enableAdaptiveDifficulty">{t('settings.enableAdaptiveDifficulty')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.enableAdaptiveDifficultyDesc')}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{t('settings.enableAdaptiveDifficultyTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="enableAdaptiveDifficulty"
            checked={settings.enableAdaptiveDifficulty ?? true}
            onCheckedChange={(checked) => handleUpdateSetting('enableAdaptiveDifficulty', checked)}
          />
        </div>

        {/* Compensación de errores */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enableCompensation">{t('settings.enableCompensation')}</Label>
            <p className="text-xs text-muted-foreground">{t('settings.enableCompensationDesc')}</p>
          </div>
          <Switch
            id="enableCompensation"
            checked={settings.enableCompensation ?? true}
            onCheckedChange={(checked) => handleUpdateSetting('enableCompensation', checked)}
          />
        </div>
      </div>
    </div>
  );
}

export default Settings;