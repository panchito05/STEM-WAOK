import { useState, useEffect, useMemo, useRef } from "react";
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

export default function Settings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Referencia a la función debounced para guardar la configuración
  const debouncedSave = useMemo(
    () =>
      debounce((settings: ModuleSettings) => {
        updateModuleSettings("addition", settings);
        console.log(`[ADDITION] Guardando configuración (debounced):`, settings);
      }, 2000), // 2 segundos de espera antes de guardar para reducir peticiones
    [updateModuleSettings]
  );
  
  // Guardar automáticamente cada vez que cambia un ajuste
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
    
    // Para cambios de dificultad, aplicar cambio inmediatamente
    if (key === "difficulty") {
      console.log("[ADDITION] Guardando configuración de dificultad inmediatamente:", value);
      updateModuleSettings("addition", updatedSettings);
      
      // Actualizar también el localStorage para asegurar coherencia entre ambos perfiles
      try {
        const storedSettings = localStorage.getItem('moduleSettings');
        const settingsObj = storedSettings ? JSON.parse(storedSettings) : {};
        
        if (settingsObj.addition) {
          settingsObj.addition.difficulty = value;
        } else {
          settingsObj.addition = { difficulty: value };
        }
        
        localStorage.setItem('moduleSettings', JSON.stringify(settingsObj));
        console.log("[ADDITION] También actualizado localStorage con difficulty:", value);
      } catch (error) {
        console.error("[ADDITION] Error al actualizar localStorage:", error);
      }
    } else {
      // Para otros ajustes, usar debounce para evitar múltiples llamadas de guardado
      debouncedSave(updatedSettings);
    }
  };
  
  // Para poder navegar entre la configuración y el ejercicio sin perder cambios
  // Agregamos un efecto para guardar al desmontar y asegurar persistencia
  // Referencia para controlar si ya se ha guardado la configuración
  const hasSavedRef = useRef(false);
  
  useEffect(() => {
    // Guardar configuración cuando se desmonta el componente
    return () => {
      // Evitar múltiples guardados en desmontajes rápidos
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        // Llamada directa sin debounce para asegurar que se ejecute
        updateModuleSettings("addition", localSettings);
        console.log("[ADDITION] Guardando configuración al desmontar:", localSettings);
      }
    };
  }, [localSettings, updateModuleSettings]);

  const handleResetSettings = async () => {
    if (showResetConfirm) {
      await resetModuleSettings("addition");
      setLocalSettings({ ...defaultModuleSettings });
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
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

  return (
    <div className={`px-4 py-5 sm:p-6 rounded-xl shadow-md ${theme.bg} border-2 ${theme.border}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text} flex items-center`}>
            {theme.emoji} Configuración - Ejercicio de Suma
          </h2>
          <p className={`text-sm font-medium ${theme.textSecondary}`}>Personaliza tu experiencia de ejercicio</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className={`border ${theme.border} hover:${theme.bgContainer}`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Ejercicio
        </Button>
      </div>

      <div className="space-y-6">
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🎯</span>Nivel de Dificultad
          </h3>
          <p className={`text-sm ${theme.textSecondary} mb-2`}>Haz clic en un ejemplo para cambiar el nivel de dificultad:</p>
          
          <div className="mt-4 mb-6 bg-white/80 rounded-lg p-4 border border-gray-100 shadow-sm">
            <DifficultyExamples 
              operation="addition" 
              activeDifficulty={localSettings.difficulty}
              onSelectDifficulty={(difficulty) => 
                handleUpdateSetting("difficulty", difficulty as "beginner" | "elementary" | "intermediate" | "advanced" | "expert")
              }
            />
          </div>
          
          <div className="mt-3 mb-2 space-y-1.5">
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">Principiante:</span> Sumas con dígitos simples (1+8, 7+5)
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">Elemental:</span> Sumas de números de dos dígitos (12+15, 24+13)
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">Intermedio:</span> Sumas con números grandes (65+309, 392+132)
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">Avanzado:</span> Sumas de números de 4 dígitos (1247+3568, 5934+8742)
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">Experto:</span> Sumas con números muy grandes (70960+11650, 28730+59436)
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🔢</span>Número de Problemas
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
              <span className="font-medium">Especifica cuántos problemas quieres resolver:</span> <span className={`font-bold ${theme.text}`}>{localSettings.problemCount}</span>
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">⏱️</span>Límite de Tiempo
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
              <span className="font-medium">Tiempo en segundos:</span> <span className={`font-bold ${theme.text}`}>{localSettings.timeValue}</span> <span className="text-xs">(0 para sin límite)</span>
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🔄</span>Máximo de Intentos por Problema
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.maxAttempts]}
                  min={0}
                  max={10}
                  step={1}
                  onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])}
                  className={`w-full ${theme.bgLight}`}
                />
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.maxAttempts}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 10) {
                      handleUpdateSetting("maxAttempts", value);
                    }
                  }}
                  min={0}
                  max={10}
                  className={`w-full border ${theme.border}`}
                />
              </div>
            </div>
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
              <span className="font-medium">Intentos máximos:</span> <span className={`font-bold ${theme.text}`}>{localSettings.maxAttempts}</span> <span className="text-xs">(0 para intentos ilimitados)</span>
            </p>
          </div>

          <h3 className={`text-lg font-bold ${theme.text} flex items-center mt-6`}>
            <span className="mr-2">⚙️</span>Configuración Adicional
          </h3>
          <div className="mt-3 space-y-3">
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="show-immediate-feedback" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">📝</span>Mostrar retroalimentación inmediata
              </Label>
              <Switch
                id="show-immediate-feedback"
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-sound-effects" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">🔊</span>Habilitar efectos de sonido
              </Label>
              <Switch
                id="enable-sound-effects"
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="show-answer-explanation" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">❓</span>Mostrar explicación de respuestas
              </Label>
              <Switch
                id="show-answer-explanation"
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-adaptive-difficulty" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">📈</span>Habilitar Dificultad Adaptativa
              </Label>
              <Switch
                id="enable-adaptive-difficulty"
                checked={localSettings.enableAdaptiveDifficulty}
                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-compensation" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">➕</span>Habilitar Compensación
                <br/><span className="text-xs ml-5 opacity-80">(Añadir 1 problema por cada incorrecto/revelado)</span>
              </Label>
              <Switch
                id="enable-compensation"
                checked={localSettings.enableCompensation}
                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
                className={theme.bgLight}
              />
            </div>
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-rewards" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">🏆</span>Activar sistema de recompensas aleatorias
                <div className="flex items-center ml-2 mt-1">
                  <span className="mx-0.5 text-xl">🏅</span>
                  <span className="mx-0.5 text-xl">🏆</span>
                  <span className="mx-0.5 text-xl">⭐</span>
                </div>
              </Label>
              <Switch
                id="enable-rewards"
                checked={localSettings.enableRewards}
                onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
                className={theme.bgLight}
              />
            </div>
            {localSettings.enableRewards && (
              <div className={`ml-6 mt-3 p-3 rounded-md bg-white/70 border ${theme.border}`}>
                <p className={`text-sm ${theme.accent}`}>
                  <span className="mr-2">🎲</span>Las recompensas aparecerán de forma aleatoria durante los ejercicios:
                </p>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">🏅</span>
                    <span className={`text-xs font-medium ${theme.text}`}>Medallas</span>
                  </div>
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">🏆</span>
                    <span className={`text-xs font-medium ${theme.text}`}>Trofeos</span>
                  </div>
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">⭐</span>
                    <span className={`text-xs font-medium ${theme.text}`}>Estrellas</span>
                  </div>
                </div>
                <p className={`text-xs mt-3 ${theme.textSecondary} text-center italic`}>
                  El sistema elegirá automáticamente qué recompensa mostrar en cada ocasión
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant={showResetConfirm ? "destructive" : "outline"}
              onClick={handleResetSettings}
              className={`mr-3 ${showResetConfirm ? "" : `border ${theme.border} hover:${theme.bgContainer}`}`}
            >
              {showResetConfirm ? (
                "Confirmar Restablecimiento"
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restablecer valores predeterminados
                </>
              )}
            </Button>
            {/* Botón de guardar eliminado - los cambios se guardan automáticamente */}
          </div>
        </div>
      </div>
    </div>
  );
}
