import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ModuleSettings } from '@/context/SettingsContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from '@/hooks/use-translations';
import { Slider } from '@/components/ui/slider';
import DifficultyExamples from '@/components/DifficultyExamples';

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export function Settings({ settings, onBack }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
  const { t, language } = useTranslations();

  const handleSave = () => {
    onBack();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('alphabetLearning')}</CardTitle>
        <CardDescription>{t('configureAlphabetModule')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('difficulty')}</h3>
          <RadioGroup
            value={localSettings.difficulty}
            onValueChange={(value) => setLocalSettings({ ...localSettings, difficulty: value as any })}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            <div>
              <RadioGroupItem value="beginner" id="beginner" className="peer sr-only" />
              <Label
                htmlFor="beginner"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span>{t('beginner')}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="elementary" id="elementary" className="peer sr-only" />
              <Label
                htmlFor="elementary"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span>{t('elementary')}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="intermediate" id="intermediate" className="peer sr-only" />
              <Label
                htmlFor="intermediate"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span>{t('intermediate')}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="advanced" id="advanced" className="peer sr-only" />
              <Label
                htmlFor="advanced"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span>{t('advanced')}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="expert" id="expert" className="peer sr-only" />
              <Label
                htmlFor="expert"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span>{t('expert')}</span>
              </Label>
            </div>
          </RadioGroup>

          <DifficultyExamples />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('displayOptions')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showImmediateFeedback">{t('showImmediateFeedback')}</Label>
              <Switch
                id="showImmediateFeedback"
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, showImmediateFeedback: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enableSoundEffects">{t('enableSoundEffects')}</Label>
              <Switch
                id="enableSoundEffects"
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, enableSoundEffects: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showAnswerWithExplanation">{t('showAnswerWithExplanation')}</Label>
              <Switch
                id="showAnswerWithExplanation"
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, showAnswerWithExplanation: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enableRewards">{t('enableRewards')}</Label>
              <Switch
                id="enableRewards"
                checked={localSettings.enableRewards}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, enableRewards: checked })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('rewardSettings')}</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rewardType">{t('rewardType')}</Label>
              <Select
                value={localSettings.rewardType}
                onValueChange={(value) => setLocalSettings({ ...localSettings, rewardType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectRewardType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stars">{t('stars')} ⭐</SelectItem>
                  <SelectItem value="medals">{t('medals')} 🥇</SelectItem>
                  <SelectItem value="trophies">{t('trophies')} 🏆</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('languageSettings')}</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="moduleLanguage">{t('moduleLanguage')}</Label>
              <Select
                value={localSettings.language || language}
                onValueChange={(value) => setLocalSettings({ ...localSettings, language: value as "english" | "spanish" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {t('saveSettings')}
        </Button>
      </CardFooter>
    </Card>
  );
}