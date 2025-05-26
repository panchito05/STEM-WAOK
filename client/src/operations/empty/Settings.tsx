import { useState, useEffect, useMemo, useRef } from "react";
import { ModuleSettings } from "@/context/SettingsContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, RotateCcw, Check } from "lucide-react";
import { defaultModuleSettings } from "@/utils/operationComponents";
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
  const headerTitle = isEnglish ? "Configuration - Empty Module" : "Configuración - Módulo Vacío";
  const subheaderText = isEnglish ? "Customize your exercise experience" : "Personaliza tu experiencia de ejercicio";
  const backButtonText = isEnglish ? "Back to Exercise" : "Volver al Ejercicio";

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Header con estilo similar a Exercise */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backButtonText}
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{theme.emoji}</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
                  <p className="text-sm text-gray-600">{subheaderText}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                onClick={toggleLanguage}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <span className="text-xs font-medium">
                  {isEnglish ? "🇪🇸 Español" : "🇺🇸 English"}
                </span>
              </Button>
              
              <Button 
                onClick={handleReset}
                variant={showResetConfirm ? "destructive" : "outline"}
                size="sm"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {showResetConfirm 
                    ? (isEnglish ? "Confirm Reset" : "Confirmar Reset")
                    : (isEnglish ? "Reset" : "Resetear")
                  }
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con layout similar al de Addition */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Sección de Dificultad */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">{theme.emoji}</span>{isEnglish ? "Difficulty Level" : "Nivel de Dificultad"}
          </h3>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {(["beginner", "elementary", "intermediate", "advanced", "expert"] as const).map((level) => (
              <Label
                key={level}
                className={`cursor-pointer text-center p-3 rounded-lg border-2 transition-all ${
                  localSettings.difficulty === level
                    ? `${theme.border} ${theme.bgLight} ${theme.text} border-current`
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <RadioGroup value={localSettings.difficulty} onValueChange={(value) => handleUpdateSetting("difficulty", value as any)}>
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value={level} id={level} className="sr-only" />
                    <span className="text-2xl">
                      {level === "beginner" ? "🔵" :
                       level === "elementary" ? "🟢" :
                       level === "intermediate" ? "🟠" :
                       level === "advanced" ? "🟣" : "⭐"}
                    </span>
                    <span className="text-xs font-medium">
                      {isEnglish 
                        ? level.charAt(0).toUpperCase() + level.slice(1)
                        : level === "beginner" ? "Principiante" :
                          level === "elementary" ? "Elemental" :
                          level === "intermediate" ? "Intermedio" :
                          level === "advanced" ? "Avanzado" : "Experto"
                      }
                    </span>
                    <span className="text-xs text-gray-500">
                      {level === "beginner" ? "Nivel 1" :
                       level === "elementary" ? "Nivel 2" :
                       level === "intermediate" ? "Nivel 3" :
                       level === "advanced" ? "Nivel 4" : "Nivel 5"}
                    </span>
                  </div>
                </RadioGroup>
              </Label>
            ))}
          </div>
          
          <div className="mt-3 mb-2 space-y-1.5">
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{isEnglish ? "Beginner:" : "Principiante:"}</span> {isEnglish ? "Basic mathematical operations (5+3, 8-2)" : "Operaciones matemáticas básicas (5+3, 8-2)"}
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{isEnglish ? "Elementary:" : "Elemental:"}</span> {isEnglish ? "Two-digit mathematical operations (15+12, 24-13)" : "Operaciones con números de dos dígitos (15+12, 24-13)"}
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{isEnglish ? "Intermediate:" : "Intermedio:"}</span> {isEnglish ? "Operations with larger numbers (65+309, 392-132)" : "Operaciones con números grandes (65+309, 392-132)"}
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{isEnglish ? "Advanced:" : "Avanzado:"}</span> {isEnglish ? "4-digit mathematical operations (1247+3568, 5934-2742)" : "Operaciones con números de 4 dígitos (1247+3568, 5934-2742)"}
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{isEnglish ? "Expert:" : "Experto:"}</span> {isEnglish ? "Very large number operations (70960+11650, 89730-59436)" : "Operaciones con números muy grandes (70960+11650, 89730-59436)"}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🔢</span>{isEnglish ? "Number of Problems" : "Número de Problemas"}
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
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
              <span className="font-medium">{isEnglish ? "Specify how many problems you want to solve:" : "Especifica cuántos problemas quieres resolver:"}</span> <span className={`font-bold ${theme.text}`}>{localSettings.problemCount}</span>
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">⏱️</span>{isEnglish ? "Time Limit" : "Límite de Tiempo"}
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
                  className={`w-full border ${theme.border}`}
                />
              </div>
            </div>
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
              <span className="font-medium">{isEnglish ? "Time limit per problem:" : "Tiempo límite por problema:"}</span> <span className={`font-bold ${theme.text}`}>{localSettings.timeValue === 0 ? (isEnglish ? "No limit" : "Sin límite") : `${localSettings.timeValue}s`}</span>
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🎯</span>{isEnglish ? "Maximum Attempts" : "Intentos Máximos"}
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
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
              <span className="font-medium">{isEnglish ? "Maximum attempts per problem:" : "Máximo de intentos por problema:"}</span> <span className={`font-bold ${theme.text}`}>{localSettings.maxAttempts}</span>
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">⚙️</span>{isEnglish ? "Advanced Options" : "Opciones Avanzadas"}
          </h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-md border border-white">
              <div>
                <Label className="text-sm font-medium">{isEnglish ? "Immediate Feedback" : "Feedback Inmediato"}</Label>
                <p className="text-xs text-gray-600">{isEnglish ? "Show result after each answer" : "Mostrar resultado después de cada respuesta"}</p>
              </div>
              <Switch
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-md border border-white">
              <div>
                <Label className="text-sm font-medium">{isEnglish ? "Sound Effects" : "Efectos de Sonido"}</Label>
                <p className="text-xs text-gray-600">{isEnglish ? "Play audio for results" : "Reproducir audio para resultados"}</p>
              </div>
              <Switch
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-md border border-white">
              <div>
                <Label className="text-sm font-medium">{isEnglish ? "Show Answer Button" : "Botón Mostrar Respuesta"}</Label>
                <p className="text-xs text-gray-600">{isEnglish ? "Allow showing correct answer" : "Permitir mostrar respuesta correcta"}</p>
              </div>
              <Switch
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-md border border-white">
              <div>
                <Label className="text-sm font-medium">{isEnglish ? "Adaptive Difficulty" : "Dificultad Adaptativa"}</Label>
                <p className="text-xs text-gray-600">{isEnglish ? "Auto-adjust based on performance" : "Auto-ajustar según rendimiento"}</p>
              </div>
              <Switch
                checked={localSettings.enableAdaptiveDifficulty}
                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-md border border-white">
              <div>
                <Label className="text-sm font-medium">{isEnglish ? "Compensation Mode" : "Modo Compensación"}</Label>
                <p className="text-xs text-gray-600">{isEnglish ? "Add extra problems for mistakes" : "Agregar problemas extra por errores"}</p>
              </div>
              <Switch
                checked={localSettings.enableCompensation}
                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-md border border-white">
              <div>
                <Label className="text-sm font-medium">{isEnglish ? "Rewards System" : "Sistema de Recompensas"}</Label>
                <p className="text-xs text-gray-600">{isEnglish ? "Enable achievements and points" : "Habilitar logros y puntos"}</p>
              </div>
              <Switch
                checked={localSettings.enableRewards}
                onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}