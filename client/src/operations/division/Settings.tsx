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
        updateModuleSettings("division", settings);
        console.log(`[DIVISION] Guardando configuración (debounced):`, settings);
      }, 500), // Reducir el tiempo de espera a 500ms para asegurar que se guarde pronto
    [updateModuleSettings]
  );
  
  // Guardar automáticamente cada vez que cambia un ajuste
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
    
    // Para cambios de dificultad, aplicar cambio inmediatamente
    if (key === "difficulty") {
      console.log("[DIVISION] Guardando configuración de dificultad inmediatamente:", value);
      // Actualizamos directamente sin usar debounce para cambios de dificultad
      updateModuleSettings("division", updatedSettings);
    } else {
      // Para otros ajustes, usar debounce para evitar múltiples llamadas de guardado
      debouncedSave(updatedSettings);
    }
  };
  
  // Para poder navegar entre la configuración y el ejercicio sin perder cambios
  // Agregamos un efecto para guardar al desmontar y asegurar persistencia
  // Referencia para controlar si ya se ha guardado la configuración
  const hasSavedRef = useRef(false);
  
  // Forzar el guardado de la configuración al componente cargarse
  useEffect(() => {
    // Guardar configuración inmediatamente al montar el componente para persistir valores actuales
    updateModuleSettings("division", localSettings);
    console.log("[DIVISION] Guardando configuración al cargar:", localSettings);
    
    // Al desmontar, volver a guardar
    return () => {
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        // Llamada directa sin debounce para asegurar que se ejecute
        updateModuleSettings("division", localSettings);
        console.log("[DIVISION] Guardando configuración al desmontar:", localSettings);
        
        // Forzar localStorage para asegurar persistencia
        try {
          const profileId = localStorage.getItem('activeProfileId');
          const suffix = profileId ? `-profile-${profileId}` : '';
          const key = `moduleSettings${suffix}`;
          
          // Obtener y actualizar configuraciones actuales en localStorage
          const currentSettings = localStorage.getItem(key);
          if (currentSettings) {
            const parsed = JSON.parse(currentSettings);
            const updated = {
              ...parsed,
              division: localSettings
            };
            localStorage.setItem(key, JSON.stringify(updated));
            console.log("[DIVISION] Forzando actualización en localStorage:", updated);
          }
        } catch (e) {
          console.error("Error al forzar guardado en localStorage:", e);
        }
      }
    };
  }, [localSettings, updateModuleSettings]);

  const handleResetSettings = async () => {
    if (showResetConfirm) {
      await resetModuleSettings("division");
      setLocalSettings({ ...defaultModuleSettings });
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const isEnglish = localSettings.language === 'english';

  const theme = {
    primary: "bg-purple-500",
    primaryHover: "hover:bg-purple-600",
    secondary: "bg-purple-50",
    accent: "text-purple-700",
    border: "border-purple-200",
    textSecondary: "text-gray-600"
  };

  return (
    <div className={`min-h-screen ${theme.secondary} p-4 sm:p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={onBack}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isEnglish ? "Division Settings" : "Configuración de División"}
              </h1>
              <p className={`text-sm ${theme.textSecondary} mt-1`}>
                {isEnglish 
                  ? "Customize your division practice experience" 
                  : "Personaliza tu experiencia de práctica de división"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleResetSettings}
            variant={showResetConfirm ? "destructive" : "outline"}
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {showResetConfirm 
              ? (isEnglish ? "Confirm Reset" : "Confirmar Reset")
              : (isEnglish ? "Reset to Defaults" : "Restablecer")
            }
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulty Level */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🎯 {isEnglish ? "Difficulty Level" : "Nivel de Dificultad"}
            </h3>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              {isEnglish ? "Click on an example to change the difficulty level:" : "Haz clic en un ejemplo para cambiar el nivel de dificultad:"}
            </p>
            
            <div className="mt-4 mb-6 bg-white/80 rounded-lg p-4 border border-gray-100 shadow-sm">
              <DifficultyExamples 
                operation="division" 
                activeDifficulty={localSettings.difficulty}
                onSelectDifficulty={(difficulty) => 
                  handleUpdateSetting("difficulty", difficulty as "beginner" | "elementary" | "intermediate" | "advanced" | "expert")
                }
                language={localSettings.language || "english"}
              />
            </div>
            
            <div className="mt-3 mb-2 space-y-1.5">
              <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                <span className="font-bold">{isEnglish ? "Beginner:" : "Principiante:"}</span> {isEnglish ? "Simple divisions (8÷2, 9÷3)" : "Divisiones simples (8÷2, 9÷3)"}
              </p>
              <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                <span className="font-bold">{isEnglish ? "Elementary:" : "Elemental:"}</span> {isEnglish ? "Two-digit by one-digit divisions (24÷3, 48÷6)" : "Divisiones de dos dígitos entre uno (24÷3, 48÷6)"}
              </p>
              <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                <span className="font-bold">{isEnglish ? "Intermediate:" : "Intermedio:"}</span> {isEnglish ? "Divisions with possible decimals" : "Divisiones con posibles decimales"}
              </p>
              <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                <span className="font-bold">{isEnglish ? "Advanced:" : "Avanzado:"}</span> {isEnglish ? "Complex divisions with decimals" : "Divisiones complejas con decimales"}
              </p>
              <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                <span className="font-bold">{isEnglish ? "Expert:" : "Experto:"}</span> {isEnglish ? "Very complex divisions with decimals" : "Divisiones muy complejas con decimales"}
              </p>
            </div>
          </div>

          {/* Exercise Configuration */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📊 {isEnglish ? "Exercise Configuration" : "Configuración del Ejercicio"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="problemCount" className="text-sm font-medium text-gray-700">
                  {isEnglish ? "Number of Problems" : "Número de Problemas"}: {localSettings.problemCount}
                </Label>
                <Slider
                  id="problemCount"
                  min={5}
                  max={50}
                  step={1}
                  value={[localSettings.problemCount]}
                  onValueChange={(value) => handleUpdateSetting("problemCount", value[0])}
                  className="mt-2"
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  {isEnglish ? "Choose between 5 and 50 problems" : "Elige entre 5 y 50 problemas"}
                </p>
              </div>

              <div>
                <Label htmlFor="maxAttempts" className="text-sm font-medium text-gray-700">
                  {isEnglish ? "Maximum Attempts per Problem" : "Máximo de Intentos por Problema"}: {localSettings.maxAttempts === 0 ? (isEnglish ? "Unlimited" : "Ilimitado") : localSettings.maxAttempts}
                </Label>
                <Slider
                  id="maxAttempts"
                  min={0}
                  max={5}
                  step={1}
                  value={[localSettings.maxAttempts]}
                  onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])}
                  className="mt-2"
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  {isEnglish ? "0 = unlimited attempts" : "0 = intentos ilimitados"}
                </p>
              </div>
            </div>
          </div>

          {/* Timer Settings */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              ⏱️ {isEnglish ? "Timer Settings" : "Configuración de Tiempo"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="timeValue" className="text-sm font-medium text-gray-700">
                  {isEnglish ? "Time per Problem (seconds)" : "Tiempo por Problema (segundos)"}: {localSettings.timeValue === 0 ? (isEnglish ? "No limit" : "Sin límite") : localSettings.timeValue}
                </Label>
                <Slider
                  id="timeValue"
                  min={0}
                  max={120}
                  step={5}
                  value={[localSettings.timeValue]}
                  onValueChange={(value) => handleUpdateSetting("timeValue", value[0])}
                  className="mt-2"
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  {isEnglish ? "0 = no time limit" : "0 = sin límite de tiempo"}
                </p>
              </div>
            </div>
          </div>

          {/* Learning Features */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🎓 {isEnglish ? "Learning Features" : "Características de Aprendizaje"}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adaptiveDifficulty" className="text-sm font-medium text-gray-700">
                    {isEnglish ? "Adaptive Difficulty" : "Dificultad Adaptativa"}
                  </Label>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {isEnglish ? "Automatically adjusts difficulty based on performance" : "Ajusta automáticamente la dificultad según el rendimiento"}
                  </p>
                </div>
                <Switch
                  id="adaptiveDifficulty"
                  checked={localSettings.enableAdaptiveDifficulty}
                  onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showAnswer" className="text-sm font-medium text-gray-700">
                    {isEnglish ? "Show Answer Button" : "Botón Mostrar Respuesta"}
                  </Label>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {isEnglish ? "Allow students to reveal answers when stuck" : "Permite a los estudiantes revelar respuestas cuando estén atascados"}
                  </p>
                </div>
                <Switch
                  id="showAnswer"
                  checked={localSettings.showAnswerWithExplanation}
                  onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compensation" className="text-sm font-medium text-gray-700">
                    {isEnglish ? "Compensation Problems" : "Problemas de Compensación"}
                  </Label>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {isEnglish ? "Add extra problems for incorrect answers" : "Agregar problemas extra por respuestas incorrectas"}
                  </p>
                </div>
                <Switch
                  id="compensation"
                  checked={localSettings.enableCompensation}
                  onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
                />
              </div>
            </div>
          </div>

          {/* Feedback & Rewards */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🎁 {isEnglish ? "Feedback & Rewards" : "Retroalimentación y Recompensas"}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="immediateFeedback" className="text-sm font-medium text-gray-700">
                    {isEnglish ? "Immediate Feedback" : "Retroalimentación Inmediata"}
                  </Label>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {isEnglish ? "Show results immediately after each answer" : "Mostrar resultados inmediatamente después de cada respuesta"}
                  </p>
                </div>
                <Switch
                  id="immediateFeedback"
                  checked={localSettings.showImmediateFeedback}
                  onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="soundEffects" className="text-sm font-medium text-gray-700">
                    {isEnglish ? "Sound Effects" : "Efectos de Sonido"}
                  </Label>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {isEnglish ? "Play sounds for correct/incorrect answers" : "Reproducir sonidos para respuestas correctas/incorrectas"}
                  </p>
                </div>
                <Switch
                  id="soundEffects"
                  checked={localSettings.enableSoundEffects}
                  onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rewards" className="text-sm font-medium text-gray-700">
                    {isEnglish ? "Reward System" : "Sistema de Recompensas"}
                  </Label>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {isEnglish ? "Earn points and achievements" : "Ganar puntos y logros"}
                  </p>
                </div>
                <Switch
                  id="rewards"
                  checked={localSettings.enableRewards}
                  onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
                />
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🌐 {isEnglish ? "Language Settings" : "Configuración de Idioma"}
            </h3>
            
            <RadioGroup
              value={localSettings.language}
              onValueChange={(value) => handleUpdateSetting("language", value as "english" | "spanish")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="english" id="english" />
                <Label htmlFor="english">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spanish" id="spanish" />
                <Label htmlFor="spanish">Español</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
}