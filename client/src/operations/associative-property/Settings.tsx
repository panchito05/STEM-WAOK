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
        updateModuleSettings("associative-property", settings);
        console.log(`[ASSOCIATIVE-PROPERTY] Guardando configuración (debounced):`, settings);
      }, 500), // Reducir el tiempo de espera a 500ms para asegurar que se guarde pronto
    [updateModuleSettings]
  );
  
  // Guardar automáticamente cada vez que cambia un ajuste
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
    
    // Para cambios de dificultad, aplicar cambio inmediatamente
    if (key === "difficulty") {
      console.log("[ASSOCIATIVE-PROPERTY] Guardando configuración de dificultad inmediatamente:", value);
      // Actualizamos directamente sin usar debounce para cambios de dificultad
      updateModuleSettings("associative-property", updatedSettings);
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
    updateModuleSettings("associative-property", localSettings);
    console.log("[ASSOCIATIVE-PROPERTY] Guardando configuración al cargar:", localSettings);
    
    // Al desmontar, volver a guardar
    return () => {
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        // Llamada directa sin debounce para asegurar que se ejecute
        updateModuleSettings("associative-property", localSettings);
        console.log("[ASSOCIATIVE-PROPERTY] Guardando configuración al desmontar:", localSettings);
        
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
              "associative-property": localSettings
            };
            localStorage.setItem(key, JSON.stringify(updated));
            console.log("[ASSOCIATIVE-PROPERTY] Forzando actualización en localStorage:", updated);
          }
        } catch (e) {
          console.error("Error al forzar guardado en localStorage:", e);
        }
      }
    };
  }, [localSettings, updateModuleSettings]);

  const handleResetSettings = async () => {
    if (showResetConfirm) {
      await resetModuleSettings("associative-property");
      setLocalSettings({ ...defaultModuleSettings });
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al ejercicio
          </Button>
          <h1 className="text-3xl font-bold">Configuración - Propiedad Asociativa</h1>
        </div>
        <Button
          variant={showResetConfirm ? "destructive" : "outline"}
          size="sm"
          onClick={handleResetSettings}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {showResetConfirm ? "¿Confirmar reset?" : "Restablecer"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuraciones principales */}
        <div className="space-y-6">
          {/* Idioma */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Idioma</Label>
            <RadioGroup
              value={localSettings.language}
              onValueChange={(value) => handleUpdateSetting("language", value as "spanish" | "english")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spanish" id="spanish" />
                <Label htmlFor="spanish">Español</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="english" id="english" />
                <Label htmlFor="english">English</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dificultad */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Dificultad</Label>
            <RadioGroup
              value={localSettings.difficulty}
              onValueChange={(value) => handleUpdateSetting("difficulty", value as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy">Fácil</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Intermedio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard">Difícil</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expert" id="expert" />
                <Label htmlFor="expert">Experto</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Operación */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Tipo de Operación</Label>
            <RadioGroup
              value={localSettings.operationType || "addition"}
              onValueChange={(value) => handleUpdateSetting("operationType", value as "addition" | "multiplication")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="addition" id="addition" />
                <Label htmlFor="addition">Suma (+)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiplication" id="multiplication" />
                <Label htmlFor="multiplication">Multiplicación (×)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Nivel actual */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Nivel Actual</Label>
            <div className="space-y-2">
              <Slider
                value={[localSettings.currentLevel || 1]}
                onValueChange={([value]) => handleUpdateSetting("currentLevel", value)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Nivel 1: Agrupación Visual</span>
                <span>Nivel {localSettings.currentLevel || 1}</span>
                <span>Nivel 5: Expresión Creativa</span>
              </div>
            </div>
          </div>

          {/* Configuraciones de tiempo */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Límite de tiempo por problema</Label>
            <div className="space-y-2">
              <Slider
                value={[localSettings.timeLimit || 0]}
                onValueChange={([value]) => handleUpdateSetting("timeLimit", value)}
                min={0}
                max={300}
                step={15}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Sin límite</span>
                <span>{localSettings.timeLimit || 0}s</span>
                <span>5 min</span>
              </div>
            </div>
          </div>

          {/* Número máximo de problemas */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Máximo problemas por sesión</Label>
            <div className="space-y-2">
              <Slider
                value={[localSettings.maxProblems || 10]}
                onValueChange={([value]) => handleUpdateSetting("maxProblems", value)}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>5</span>
                <span>{localSettings.maxProblems || 10}</span>
                <span>50</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuraciones avanzadas */}
        <div className="space-y-6">
          {/* Características de ayuda */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Características de Ayuda</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showSteps">Mostrar pasos de resolución</Label>
              <Switch
                id="showSteps"
                checked={localSettings.showSteps || false}
                onCheckedChange={(checked) => handleUpdateSetting("showSteps", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showVisualAids">Mostrar ayudas visuales</Label>
              <Switch
                id="showVisualAids"
                checked={localSettings.showVisualAids || false}
                onCheckedChange={(checked) => handleUpdateSetting("showVisualAids", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enableHints">Habilitar pistas</Label>
              <Switch
                id="enableHints"
                checked={localSettings.enableHints || false}
                onCheckedChange={(checked) => handleUpdateSetting("enableHints", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoAdvance">Avance automático</Label>
              <Switch
                id="autoAdvance"
                checked={localSettings.autoAdvance || false}
                onCheckedChange={(checked) => handleUpdateSetting("autoAdvance", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="soundEnabled">Sonido habilitado</Label>
              <Switch
                id="soundEnabled"
                checked={localSettings.soundEnabled || false}
                onCheckedChange={(checked) => handleUpdateSetting("soundEnabled", checked)}
              />
            </div>
          </div>

          {/* Ejemplos de dificultad */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Ejemplos por Dificultad</Label>
            <DifficultyExamples 
              operation="associative-property" 
              difficulty={localSettings.difficulty} 
            />
          </div>
        </div>
      </div>

      {/* Información del módulo */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Acerca de la Propiedad Asociativa</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Nivel 1:</strong> Introducción visual con objetos y agrupaciones básicas.
          </p>
          <p>
            <strong>Nivel 2:</strong> Transición a expresiones numéricas con paréntesis.
          </p>
          <p>
            <strong>Nivel 3:</strong> Práctica guiada completando expresiones equivalentes.
          </p>
          <p>
            <strong>Nivel 4:</strong> Aplicación en cálculo mental y estrategias de agrupación.
          </p>
          <p>
            <strong>Nivel 5:</strong> Desafíos creativos demostrando comprensión completa.
          </p>
        </div>
      </div>
    </div>
  );
}