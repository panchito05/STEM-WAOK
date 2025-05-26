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
        updateModuleSettings("empty-module", settings);
        console.log(`[EMPTY-MODULE] Guardando configuración (debounced):`, settings);
      }, 500), // Reducir el tiempo de espera a 500ms para asegurar que se guarde pronto
    [updateModuleSettings]
  );
  
  // Guardar automáticamente cada vez que cambia un ajuste
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
    
    // Para cambios de dificultad, aplicar cambio inmediatamente
    if (key === "difficulty") {
      console.log("[EMPTY-MODULE] Guardando configuración de dificultad inmediatamente:", value);
      // Actualizamos directamente sin usar debounce para cambios de dificultad
      updateModuleSettings("empty-module", updatedSettings);
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
    updateModuleSettings("empty-module", localSettings);
    console.log("[EMPTY-MODULE] Guardando configuración al cargar:", localSettings);
    
    // Al desmontar, volver a guardar
    return () => {
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        // Llamada directa sin debounce para asegurar que se ejecute
        updateModuleSettings("empty-module", localSettings);
        console.log("[EMPTY-MODULE] Guardando configuración al desmontar:", localSettings);
        
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
              "empty-module": localSettings
            };
            localStorage.setItem(key, JSON.stringify(updated));
            console.log("[EMPTY-MODULE] Forzando actualización en localStorage:", updated);
          }
        } catch (e) {
          console.error("Error al forzar guardado en localStorage:", e);
        }
      }
    };
  }, [localSettings, updateModuleSettings]);

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

  const timeValueDisplay = localSettings.timeValue === 0 ? "Sin límite" : `${localSettings.timeValue} segundos`;

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Configuración - Empty Module</h1>
        </div>
        <Button
          variant={showResetConfirm ? "destructive" : "outline"}
          size="sm"
          onClick={handleResetSettings}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {showResetConfirm ? "¿Confirmar?" : "Restablecer"}
        </Button>
      </div>

      {/* Dificultad */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Nivel de Dificultad</Label>
        <RadioGroup
          value={localSettings.difficulty}
          onValueChange={(value) => handleUpdateSetting("difficulty", value as any)}
          className="grid grid-cols-1 gap-3"
        >
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="beginner" id="beginner" />
            <div className="flex-1">
              <Label htmlFor="beginner" className="font-medium">Principiante</Label>
              <p className="text-sm text-gray-500">Problemas básicos para empezar</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="elementary" id="elementary" />
            <div className="flex-1">
              <Label htmlFor="elementary" className="font-medium">Elemental</Label>
              <p className="text-sm text-gray-500">Problemas de nivel básico</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="intermediate" id="intermediate" />
            <div className="flex-1">
              <Label htmlFor="intermediate" className="font-medium">Intermedio</Label>
              <p className="text-sm text-gray-500">Problemas de complejidad media</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="advanced" id="advanced" />
            <div className="flex-1">
              <Label htmlFor="advanced" className="font-medium">Avanzado</Label>
              <p className="text-sm text-gray-500">Problemas más complejos</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="expert" id="expert" />
            <div className="flex-1">
              <Label htmlFor="expert" className="font-medium">Experto</Label>
              <p className="text-sm text-gray-500">Problemas de máxima dificultad</p>
            </div>
          </div>
        </RadioGroup>
        
        {/* Ejemplos de dificultad */}
        <div className="text-sm text-gray-500 mt-2">
          Selecciona el nivel apropiado para comenzar tu práctica
        </div>
      </div>

      {/* Cantidad de problemas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="problemCount" className="text-lg font-semibold">
            Cantidad de Problemas
          </Label>
          <span className="text-sm text-gray-500">{localSettings.problemCount} problemas</span>
        </div>
        <Slider
          value={[localSettings.problemCount]}
          onValueChange={([value]) => handleUpdateSetting("problemCount", value)}
          max={50}
          min={5}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>5 problemas</span>
          <span>50 problemas</span>
        </div>
      </div>

      {/* Límite de tiempo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="timeLimit" className="text-lg font-semibold">
            Límite de Tiempo por Problema
          </Label>
          <span className="text-sm text-gray-500">{timeValueDisplay}</span>
        </div>
        <Slider
          value={[localSettings.timeValue]}
          onValueChange={([value]) => handleUpdateSetting("timeValue", value)}
          max={120}
          min={0}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Sin límite</span>
          <span>2 minutos</span>
        </div>
      </div>

      {/* Intentos máximos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="maxAttempts" className="text-lg font-semibold">
            Intentos Máximos por Problema
          </Label>
          <span className="text-sm text-gray-500">
            {localSettings.maxAttempts === 0 ? "Ilimitados" : `${localSettings.maxAttempts} intentos`}
          </span>
        </div>
        <Slider
          value={[localSettings.maxAttempts]}
          onValueChange={([value]) => handleUpdateSetting("maxAttempts", value)}
          max={5}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Ilimitados</span>
          <span>5 intentos</span>
        </div>
      </div>

      {/* Configuraciones de retroalimentación */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Retroalimentación</Label>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label htmlFor="immediateFeedback">Retroalimentación Inmediata</Label>
            <p className="text-sm text-gray-500">Mostrar si la respuesta es correcta inmediatamente</p>
          </div>
          <Switch
            id="immediateFeedback"
            checked={localSettings.showImmediateFeedback}
            onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label htmlFor="showAnswerWithExplanation">Mostrar Respuesta con Explicación</Label>
            <p className="text-sm text-gray-500">Botón de ayuda que muestra la respuesta correcta</p>
          </div>
          <Switch
            id="showAnswerWithExplanation"
            checked={localSettings.showAnswerWithExplanation}
            onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
          />
        </div>
      </div>

      {/* Configuraciones de audio y efectos */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Audio y Efectos</Label>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label htmlFor="soundEffects">Efectos de Sonido</Label>
            <p className="text-sm text-gray-500">Reproducir sonidos para respuestas correctas e incorrectas</p>
          </div>
          <Switch
            id="soundEffects"
            checked={localSettings.enableSoundEffects}
            onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
          />
        </div>
      </div>

      {/* Configuraciones avanzadas */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Configuraciones Avanzadas</Label>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label htmlFor="adaptiveDifficulty">Dificultad Adaptativa</Label>
            <p className="text-sm text-gray-500">Ajustar automáticamente la dificultad según el rendimiento</p>
          </div>
          <Switch
            id="adaptiveDifficulty"
            checked={localSettings.enableAdaptiveDifficulty}
            onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label htmlFor="compensation">Compensación por Errores</Label>
            <p className="text-sm text-gray-500">Añadir problemas adicionales por respuestas incorrectas</p>
          </div>
          <Switch
            id="compensation"
            checked={localSettings.enableCompensation}
            onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label htmlFor="rewards">Sistema de Recompensas</Label>
            <p className="text-sm text-gray-500">Activar premios y medallas por buen rendimiento</p>
          </div>
          <Switch
            id="rewards"
            checked={localSettings.enableRewards}
            onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
          />
        </div>
      </div>

      {/* Tipo de recompensa */}
      {localSettings.enableRewards && (
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Tipo de Recompensa</Label>
          <RadioGroup
            value={localSettings.rewardType}
            onValueChange={(value) => handleUpdateSetting("rewardType", value as any)}
            className="grid grid-cols-3 gap-3"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="stars" id="stars" />
              <Label htmlFor="stars">⭐ Estrellas</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="medals" id="medals" />
              <Label htmlFor="medals">🏅 Medallas</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="trophies" id="trophies" />
              <Label htmlFor="trophies">🏆 Trofeos</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Idioma */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Idioma</Label>
        <RadioGroup
          value={localSettings.language || "english"}
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
  );
}