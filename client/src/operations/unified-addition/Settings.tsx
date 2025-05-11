// Settings.tsx - Configuraciones para el módulo unificado de adición
import React, { useState, useMemo } from 'react';
import { useSettings, ModuleSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import DifficultyExamples from '@/components/DifficultyExamples';
import { debounce } from '@/lib/utils';
import { ArrowLeft, RotateCcw } from 'lucide-react';

// Interface para las props del componente Settings
interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

// Temas por nivel de dificultad
const difficultyThemes = {
  beginner: {
    text: "text-blue-600",
    border: "border-blue-200",
    accent: "text-blue-500",
    bgLight: "bg-blue-100",
    bgContainer: "bg-blue-50",
  },
  elementary: {
    text: "text-emerald-600",
    border: "border-emerald-200",
    accent: "text-emerald-500",
    bgLight: "bg-emerald-100",
    bgContainer: "bg-emerald-50",
  },
  intermediate: {
    text: "text-orange-600",
    border: "border-orange-200",
    accent: "text-orange-500",
    bgLight: "bg-orange-100",
    bgContainer: "bg-orange-50",
  },
  advanced: {
    text: "text-purple-600",
    border: "border-purple-200",
    accent: "text-purple-500",
    bgLight: "bg-purple-100",
    bgContainer: "bg-purple-50",
  },
  expert: {
    text: "text-rose-600",
    border: "border-rose-200",
    accent: "text-rose-500",
    bgLight: "bg-rose-100",
    bgContainer: "bg-rose-50",
  },
};

// Componente principal de configuración
export function Settings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Referencia a la función debounced para guardar la configuración
  const debouncedSave = useMemo(
    () => 
      debounce((settings: ModuleSettings) => {
        updateModuleSettings("addition", settings);
        console.log('[ADDITION] Guardando configuración al cargar:', settings);
      }, 500),
    [updateModuleSettings]
  );

  // Tema basado en la dificultad actual
  const theme = useMemo(() => {
    return difficultyThemes[localSettings.difficulty as keyof typeof difficultyThemes] || difficultyThemes.beginner;
  }, [localSettings.difficulty]);

  // Manejador para actualizar configuraciones
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    debouncedSave(newSettings);
  };

  // Manejador para reset de configuraciones
  const handleReset = () => {
    resetModuleSettings("addition");
    setShowResetConfirm(false);
    // No necesitamos navegar de vuelta, solo actualizamos los settings locales
    if (settings) {
      setLocalSettings({ ...settings });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Configuración de Adición</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restablecer</span>
        </Button>
      </div>

      <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
        <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
          Dificultad
        </h3>
        
        <div className="mt-4">
          <DifficultyExamples 
            operationId="addition"
            selectedDifficulty={localSettings.difficulty as string} 
            onSelectDifficulty={(difficulty) => handleUpdateSetting("difficulty", difficulty)}
          />
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
        <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
          Configuración General
        </h3>
        
        <div className="mt-3 space-y-4">
          {/* Adaptive Difficulty */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="adaptiveDifficulty" className="font-medium">
                Dificultad Adaptativa
              </Label>
              <Switch
                id="adaptiveDifficulty"
                checked={localSettings.enableAdaptiveDifficulty}
                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
              />
            </div>
            <p className={`text-sm mt-1 ${theme.accent}`}>
              Ajusta automáticamente la dificultad según tu desempeño
            </p>
          </div>
          
          {/* Immediate Feedback */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="immediateFeedback" className="font-medium">
                Feedback Inmediato
              </Label>
              <Switch
                id="immediateFeedback"
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
              />
            </div>
            <p className={`text-sm mt-1 ${theme.accent}`}>
              Muestra si la respuesta es correcta inmediatamente
            </p>
          </div>
          
          {/* Compensation */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="compensation" className="font-medium">
                Compensación
              </Label>
              <Switch
                id="compensation"
                checked={localSettings.enableCompensation}
                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
              />
            </div>
            <p className={`text-sm mt-1 ${theme.accent}`}>
              Añade problemas adicionales por respuestas incorrectas
            </p>
          </div>
          
          {/* Sound Effects */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="soundEffects" className="font-medium">
                Efectos de Sonido
              </Label>
              <Switch
                id="soundEffects"
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
              />
            </div>
            <p className={`text-sm mt-1 ${theme.accent}`}>
              Reproduce sonidos de feedback y celebración
            </p>
          </div>
          
          {/* Show Answer with Explanation */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showAnswer" className="font-medium">
                Mostrar Respuesta con Explicación
              </Label>
              <Switch
                id="showAnswer"
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
              />
            </div>
            <p className={`text-sm mt-1 ${theme.accent}`}>
              Permite revelar la respuesta correcta con explicación
            </p>
          </div>
          
          {/* Rewards */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rewards" className="font-medium">
                Recompensas
              </Label>
              <Switch
                id="rewards"
                checked={localSettings.enableRewards}
                onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
              />
            </div>
            <p className={`text-sm mt-1 ${theme.accent}`}>
              Muestra animaciones de premio al completar ejercicios
            </p>
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
        <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
          Número de Problemas
        </h3>
        <div className="mt-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Slider
                value={[localSettings.problemCount]}
                min={1}
                max={50}
                step={1}
                onValueChange={(value) => handleUpdateSetting("problemCount", value[0])}
                className={`w-full ${theme.bgLight}`}
              />
              <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
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
                className={`w-full border ${theme.border}`}
              />
            </div>
          </div>
          <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
            <span className="font-medium">Especifica cuántos problemas quieres resolver:</span> <span className={`font-bold ${theme.text}`}>{localSettings.problemCount}</span>
          </p>
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
        <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
          ⏱️ Límite de Tiempo
        </h3>
        <div className="mt-3">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Slider
                value={[localSettings.timeValue]}
                min={0}
                max={300}
                step={5}
                onValueChange={(value) => handleUpdateSetting("timeValue", value[0])}
                className={`w-full ${theme.bgLight}`}
              />
              <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
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
                step={5}
                className={`w-full border ${theme.border}`}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <RadioGroup 
              value={localSettings.timeLimit} 
              onValueChange={(value) => handleUpdateSetting("timeLimit", value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="time-none" />
                <Label htmlFor="time-none" className="cursor-pointer">Sin límite de tiempo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="total" id="time-total" />
                <Label htmlFor="time-total" className="cursor-pointer">Límite para todo el ejercicio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="per-problem" id="time-per-problem" />
                <Label htmlFor="time-per-problem" className="cursor-pointer">Límite por problema</Label>
              </div>
            </RadioGroup>
          </div>
          
          <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
            <span className="font-medium">Tiempo seleccionado:</span> {" "}
            <span className={`font-bold ${theme.text}`}>
              {localSettings.timeValue === 0 ? (
                "Sin límite"
              ) : (
                `${localSettings.timeValue} segundos ${
                  localSettings.timeLimit === "total" ? "en total" : "por problema"
                }`
              )}
            </span>
          </p>
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
        <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
          Intentos Permitidos
        </h3>
        <div className="mt-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Slider
                value={[localSettings.maxAttempts]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])}
                className={`w-full ${theme.bgLight}`}
              />
              <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                <span>1</span>
                <span>3</span>
                <span>5</span>
              </div>
            </div>
            <div className="w-20">
              <Input
                type="number"
                value={localSettings.maxAttempts}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 5) {
                    handleUpdateSetting("maxAttempts", value);
                  }
                }}
                min={1}
                max={5}
                className={`w-full border ${theme.border}`}
              />
            </div>
          </div>
          <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
            <span className="font-medium">Intentos por problema:</span> <span className={`font-bold ${theme.text}`}>{localSettings.maxAttempts}</span>
          </p>
        </div>
      </div>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restablecer configuración?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto restablecerá todas las configuraciones del módulo de adición a sus valores predeterminados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-red-500 hover:bg-red-600">
              Restablecer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}