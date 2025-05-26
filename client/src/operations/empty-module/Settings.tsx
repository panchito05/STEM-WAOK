import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ModuleSettings } from '@/context/SettingsContext';
import { useSettings } from '@/context/SettingsContext';
import { defaultModuleSettings } from '@/utils/operationComponents';

// Función debounce para optimizar las actualizaciones
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export default function Settings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const { toast } = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...defaultModuleSettings, ...settings });

  // Debounced function para actualizar configuraciones
  const debouncedUpdate = React.useMemo(
    () =>
      debounce((settings: ModuleSettings) => {
        updateModuleSettings("empty-module", settings);
        console.log("[EMPTY-MODULE] Guardando configuración al cargar:", settings);
      }, 300),
    [updateModuleSettings]
  );

  // Efecto para sincronizar cuando se cargan nuevas configuraciones
  useEffect(() => {
    console.log("[EMPTY-MODULE] Configuración recibida:", settings);
    setLocalSettings({ ...defaultModuleSettings, ...settings });
  }, [settings]);

  // Efecto para guardar cambios automáticamente
  useEffect(() => {
    if (JSON.stringify(localSettings) !== JSON.stringify({ ...defaultModuleSettings, ...settings })) {
      debouncedUpdate(localSettings);
    }
  }, [localSettings, debouncedUpdate, settings]);

  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    console.log(`[EMPTY-MODULE] Actualizando ${key}:`, value);
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleResetSettings = async () => {
    if (showResetConfirm) {
      await resetModuleSettings("empty-module");
      setLocalSettings({ ...defaultModuleSettings });
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  // Obtener el color del tema basado en la dificultad seleccionada
  const getDifficultyTheme = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return {
          bg: "bg-gradient-to-br from-blue-50 to-blue-100", 
          border: "border-blue-200",
          text: "text-blue-600",
          textSecondary: "text-blue-500",
          bgContainer: "bg-blue-50",
          bgLight: "bg-blue-100",
          bgMedium: "bg-blue-200",
          accent: "text-blue-700",
          emoji: "🔵",
          name: "Principiante"
        };
      case "elementary":
        return {
          bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
          border: "border-emerald-200",
          text: "text-emerald-600",
          textSecondary: "text-emerald-500",
          bgContainer: "bg-emerald-50",
          bgLight: "bg-emerald-100",
          bgMedium: "bg-emerald-200",
          accent: "text-emerald-700",
          emoji: "🟢",
          name: "Elemental"
        };
      case "intermediate":
        return {
          bg: "bg-gradient-to-br from-orange-50 to-orange-100",
          border: "border-orange-200",
          text: "text-orange-600",
          textSecondary: "text-orange-500",
          bgContainer: "bg-orange-50",
          bgLight: "bg-orange-100",
          bgMedium: "bg-orange-200",
          accent: "text-orange-700",
          emoji: "🟠",
          name: "Intermedio"
        };
      case "advanced":
        return {
          bg: "bg-gradient-to-br from-purple-50 to-purple-100",
          border: "border-purple-200",
          text: "text-purple-600",
          textSecondary: "text-purple-500",
          bgContainer: "bg-purple-50",
          bgLight: "bg-purple-100",
          bgMedium: "bg-purple-200",
          accent: "text-purple-700",
          emoji: "🟣",
          name: "Avanzado"
        };
      case "expert":
        return {
          bg: "bg-gradient-to-br from-rose-50 to-rose-100",
          border: "border-rose-200",
          text: "text-rose-600",
          textSecondary: "text-rose-500",
          bgContainer: "bg-rose-50",
          bgLight: "bg-rose-100",
          bgMedium: "bg-rose-200",
          accent: "text-rose-700",
          emoji: "⭐",
          name: "Experto"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
          border: "border-indigo-200",
          text: "text-indigo-600",
          textSecondary: "text-indigo-500",
          bgContainer: "bg-indigo-50",
          bgLight: "bg-indigo-100",
          bgMedium: "bg-indigo-200",
          accent: "text-indigo-700",
          emoji: "⚡",
          name: "General"
        };
    }
  };

  const theme = getDifficultyTheme(localSettings.difficulty || "beginner");

  // Función para cambiar el idioma
  const toggleLanguage = () => {
    const newLanguage = localSettings.language === "english" ? "spanish" : "english";
    handleUpdateSetting("language", newLanguage);
  };

  // Determinar textos según el idioma actual
  const isEnglish = localSettings.language === "english";
  const headerTitle = isEnglish ? "Configuration - Empty Module" : "Configuración - Módulo Genérico";
  const subheaderText = isEnglish ? "Customize your exercise experience" : "Personaliza tu experiencia de ejercicio";
  const backButtonText = isEnglish ? "Back to Exercise" : "Volver al Ejercicio";

  const timeValueDisplay = localSettings.timeValue === 0 ? 
    (isEnglish ? "No limit" : "Sin límite") : 
    `${localSettings.timeValue} ${isEnglish ? "seconds" : "segundos"}`;

  return (
    <div className={`min-h-screen ${theme.bg} transition-all duration-500`}>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header con diseño mejorado */}
        <div className={`${theme.bgContainer} ${theme.border} border rounded-2xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack} 
                className={`gap-2 ${theme.text} hover:${theme.bgLight} transition-colors`}
              >
                <ArrowLeft className="h-4 w-4" />
                {backButtonText}
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{theme.emoji}</span>
                <div>
                  <h1 className={`text-2xl font-bold ${theme.accent}`}>
                    {headerTitle}
                  </h1>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    {subheaderText}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className={`gap-2 ${theme.text} border-current hover:${theme.bgLight}`}
              >
                {isEnglish ? "🇪🇸 ES" : "🇺🇸 EN"}
              </Button>
              <Button
                variant={showResetConfirm ? "destructive" : "outline"}
                size="sm"
                onClick={handleResetSettings}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {showResetConfirm ? (isEnglish ? "Confirm?" : "¿Confirmar?") : (isEnglish ? "Reset" : "Restablecer")}
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className={`${theme.bgContainer} ${theme.border} border rounded-2xl p-6 shadow-lg space-y-8`}>
          {/* Dificultad */}
          <div className="space-y-4">
            <Label className={`text-lg font-semibold ${theme.accent}`}>
              {isEnglish ? "Difficulty Level" : "Nivel de Dificultad"}
            </Label>
            <RadioGroup
              value={localSettings.difficulty}
              onValueChange={(value) => handleUpdateSetting("difficulty", value as any)}
              className="grid grid-cols-1 gap-3"
            >
              {["beginner", "elementary", "intermediate", "advanced", "expert"].map((diff) => {
                const diffTheme = getDifficultyTheme(diff);
                return (
                  <div key={diff} className={`flex items-center space-x-3 p-4 border rounded-lg hover:${diffTheme.bgLight} transition-colors ${diff === localSettings.difficulty ? diffTheme.bgLight : 'bg-white'}`}>
                    <RadioGroupItem value={diff} id={diff} />
                    <Label htmlFor={diff} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{diffTheme.emoji}</span>
                        <span className={`font-medium ${diffTheme.text}`}>{diffTheme.name}</span>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Cantidad de problemas */}
          <div className="space-y-4">
            <Label className={`text-lg font-semibold ${theme.accent}`}>
              {isEnglish ? "Problem Count" : "Cantidad de problemas"}
            </Label>
            <div className="flex items-center space-x-4">
              <Label>{isEnglish ? "Problems:" : "Problemas:"}</Label>
              <span className={`font-semibold ${theme.text}`}>{localSettings.problemCount}</span>
            </div>
            <Slider
              value={[localSettings.problemCount]}
              onValueChange={(value) => handleUpdateSetting("problemCount", value[0])}
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          {/* Tiempo límite */}
          <div className="space-y-4">
            <Label className={`text-lg font-semibold ${theme.accent}`}>
              {isEnglish ? "Time Limit" : "Tiempo límite"}
            </Label>
            <div className="flex items-center space-x-4">
              <Label>{isEnglish ? "Time:" : "Tiempo:"}</Label>
              <span className={`font-semibold ${theme.text}`}>{timeValueDisplay}</span>
            </div>
            <Slider
              value={[localSettings.timeValue]}
              onValueChange={(value) => handleUpdateSetting("timeValue", value[0])}
              max={300}
              min={0}
              step={10}
              className="w-full"
            />
          </div>

          {/* Idioma */}
          <div className="space-y-4">
            <Label className={`text-lg font-semibold ${theme.accent}`}>
              {isEnglish ? "Language" : "Idioma"}
            </Label>
            <RadioGroup
              value={localSettings.language}
              onValueChange={(value) => handleUpdateSetting("language", value as any)}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="english" id="english" />
                <Label htmlFor="english">🇺🇸 English</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="spanish" id="spanish" />
                <Label htmlFor="spanish">🇪🇸 Español</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
}