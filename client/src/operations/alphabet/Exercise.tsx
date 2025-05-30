import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Settings, ArrowLeft, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

import {
  AlphabetSettings,
  AlphabetProgress,
  AlphabetExerciseProps,
  AlphabetSettingsProps,
  AlphabetLetter,
  AlphabetLanguage,
  AlphabetLevel,
  Level1Activity,
  AlphabetGameState
} from './types';
import { alphabetData, getLetterByIndex, getRandomLetter } from './data/alphabetData';

// Default settings
const defaultSettings: AlphabetSettings = {
  language: 'english',
  level: 1,
  showBothLanguages: false,
  autoAdvance: false,
  autoAdvanceDelay: 3000,
  audioEnabled: true,
  showImages: true,
  difficulty: 'beginner',
  celebrateCompletion: true
};

// Default progress
const defaultProgress: AlphabetProgress = {
  currentLevel: 1,
  currentLetterIndex: 0,
  completedLetters: [],
  totalCorrectAnswers: 0,
  totalAttempts: 0,
  longestStreak: 0,
  currentStreak: 0,
  timeSpent: 0,
  lastActivity: new Date()
};

// SVG placeholders for images (to be replaced with actual images)
const createImagePlaceholder = (letter: string, word: string, color: string) => (
  <svg width="200" height="200" viewBox="0 0 200 200" className="rounded-lg border-2 border-gray-200">
    <rect width="200" height="200" fill={`${color}20`} />
    <circle cx="100" cy="80" r="30" fill={color} opacity="0.3" />
    <text x="100" y="140" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>
      {word}
    </text>
    <text x="100" y="160" textAnchor="middle" fontSize="12" fill="#666">
      ({letter})
    </text>
  </svg>
);

// Audio pronunciation simulation (to be replaced with actual audio)
const pronounceLetter = (letter: AlphabetLetter, language: AlphabetLanguage) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = language === 'spanish' ? 
      `${letter.letter}. ${letter.words.spanish}` : 
      `${letter.letter}. ${letter.words.english}`;
    utterance.lang = language === 'spanish' ? 'es-ES' : 'en-US';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  }
};

// Level 1 Component - Visual and Audio Recognition
const Level1Component: React.FC<{
  settings: AlphabetSettings;
  progress: AlphabetProgress;
  onProgress: (progress: AlphabetProgress) => void;
}> = ({ settings, progress, onProgress }) => {
  const [currentLetterIndex, setCurrentLetterIndex] = useState(progress.currentLetterIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const currentLetter = getLetterByIndex(currentLetterIndex);

  const playAudio = useCallback(() => {
    if (!settings.audioEnabled) return;
    
    setIsPlaying(true);
    pronounceLetter(currentLetter, settings.language);
    
    if (settings.showBothLanguages) {
      setTimeout(() => {
        pronounceLetter(currentLetter, settings.language === 'spanish' ? 'english' : 'spanish');
      }, 1500);
    }
    
    setTimeout(() => setIsPlaying(false), 3000);
  }, [currentLetter, settings.language, settings.audioEnabled, settings.showBothLanguages]);

  const nextLetter = useCallback(() => {
    const newIndex = (currentLetterIndex + 1) % alphabetData.length;
    setCurrentLetterIndex(newIndex);
    
    const newProgress = {
      ...progress,
      currentLetterIndex: newIndex,
      completedLetters: [...new Set([...progress.completedLetters, currentLetter.id])],
      totalAttempts: progress.totalAttempts + 1,
      lastActivity: new Date()
    };
    
    onProgress(newProgress);
    
    if (newIndex === 0) {
      // Completed full alphabet
      if (settings.celebrateCompletion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: "¡Alfabeto Completado!",
          description: "Has revisado todas las letras del alfabeto. ¡Excelente trabajo!"
        });
      }
    }
  }, [currentLetterIndex, currentLetter.id, progress, onProgress, settings.celebrateCompletion, toast]);

  const previousLetter = useCallback(() => {
    const newIndex = currentLetterIndex === 0 ? alphabetData.length - 1 : currentLetterIndex - 1;
    setCurrentLetterIndex(newIndex);
    
    const newProgress = {
      ...progress,
      currentLetterIndex: newIndex,
      lastActivity: new Date()
    };
    
    onProgress(newProgress);
  }, [currentLetterIndex, progress, onProgress]);

  useEffect(() => {
    if (settings.autoAdvance) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        nextLetter();
      }, settings.autoAdvanceDelay);
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [currentLetterIndex, settings.autoAdvance, settings.autoAdvanceDelay, nextLetter]);

  useEffect(() => {
    // Auto-play audio when letter changes
    if (settings.audioEnabled) {
      const timer = setTimeout(() => playAudio(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentLetterIndex, playAudio, settings.audioEnabled]);

  const progressPercentage = ((currentLetterIndex + 1) / alphabetData.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progreso del Alfabeto</span>
          <span>{currentLetterIndex + 1} / {alphabetData.length}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Letter Display */}
      <Card className="alphabet-learning-card">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLetter.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              {/* Letter Display */}
              <div 
                className="text-9xl font-bold mb-4"
                style={{ color: currentLetter.color }}
              >
                {currentLetter.letter}
                <div className="text-6xl mt-2 opacity-70">
                  {currentLetter.lowercase}
                </div>
              </div>

              {/* Image Display */}
              {settings.showImages && (
                <div className="flex justify-center space-x-4">
                  {settings.showBothLanguages ? (
                    <>
                      <div className="text-center space-y-2">
                        {createImagePlaceholder(currentLetter.letter, currentLetter.words.spanish, currentLetter.color)}
                        <Badge variant="secondary" className="text-sm">
                          🇪🇸 {currentLetter.words.spanish}
                        </Badge>
                      </div>
                      <div className="text-center space-y-2">
                        {createImagePlaceholder(currentLetter.letter, currentLetter.words.english, currentLetter.color)}
                        <Badge variant="secondary" className="text-sm">
                          🇺🇸 {currentLetter.words.english}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2">
                      {createImagePlaceholder(
                        currentLetter.letter, 
                        currentLetter.words[settings.language], 
                        currentLetter.color
                      )}
                      <Badge variant="secondary" className="text-sm">
                        {settings.language === 'spanish' ? '🇪🇸' : '🇺🇸'} {currentLetter.words[settings.language]}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Pronunciation Display */}
              <div className="text-center space-y-2">
                <div className="text-2xl font-semibold text-gray-700">
                  {settings.showBothLanguages ? (
                    <div className="space-y-1">
                      <div>🇪🇸 {currentLetter.pronunciation.spanish}</div>
                      <div>🇺🇸 {currentLetter.pronunciation.english}</div>
                    </div>
                  ) : (
                    <div>
                      {settings.language === 'spanish' ? '🇪🇸' : '🇺🇸'} {currentLetter.pronunciation[settings.language]}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={previousLetter}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Anterior</span>
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={playAudio}
          disabled={isPlaying}
          className="flex items-center space-x-2"
          style={{ backgroundColor: currentLetter.color }}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
          <span>Escuchar</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={nextLetter}
          className="flex items-center space-x-2"
        >
          <span>Siguiente</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Auto-advance indicator */}
      {settings.autoAdvance && (
        <div className="text-center">
          <Badge variant="outline" className="animate-pulse">
            Avance automático en {settings.autoAdvanceDelay / 1000}s
          </Badge>
        </div>
      )}
    </div>
  );
};

// Settings Component
const AlphabetSettingsComponent: React.FC<AlphabetSettingsProps> = ({ settings, onBack }) => {
  const [localSettings, setLocalSettings] = useState<AlphabetSettings>(settings);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('alphabet_settings', JSON.stringify(localSettings));
    onBack();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-2xl font-bold">Configuración del Alfabeto</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">Idioma Principal</Label>
            <Select 
              value={localSettings.language} 
              onValueChange={(value: AlphabetLanguage) => 
                setLocalSettings({ ...localSettings, language: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spanish">🇪🇸 Español</SelectItem>
                <SelectItem value="english">🇺🇸 English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Level Selection */}
          <div className="space-y-2">
            <Label htmlFor="level">Nivel de Dificultad</Label>
            <Select 
              value={localSettings.level.toString()} 
              onValueChange={(value) => 
                setLocalSettings({ ...localSettings, level: parseInt(value) as AlphabetLevel })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nivel 1: Reconocimiento Visual y Auditivo</SelectItem>
                <SelectItem value="2">Nivel 2: Ordenar Letras (Próximamente)</SelectItem>
                <SelectItem value="3">Nivel 3: Completar Palabras (Próximamente)</SelectItem>
                <SelectItem value="4">Nivel 4: Asociación Sonidos (Próximamente)</SelectItem>
                <SelectItem value="5">Nivel 5: Formar Palabras (Próximamente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Bilingual Options */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="both-languages">Mostrar Ambos Idiomas</Label>
              <div className="text-sm text-gray-500">
                Muestra palabras en español e inglés simultáneamente
              </div>
            </div>
            <Switch
              id="both-languages"
              checked={localSettings.showBothLanguages}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, showBothLanguages: checked })
              }
            />
          </div>

          {/* Auto-advance */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-advance">Avance Automático</Label>
              <div className="text-sm text-gray-500">
                Cambia automáticamente a la siguiente letra
              </div>
            </div>
            <Switch
              id="auto-advance"
              checked={localSettings.autoAdvance}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, autoAdvance: checked })
              }
            />
          </div>

          {/* Audio */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="audio">Audio Habilitado</Label>
              <div className="text-sm text-gray-500">
                Reproduce pronunciación de letras y palabras
              </div>
            </div>
            <Switch
              id="audio"
              checked={localSettings.audioEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, audioEnabled: checked })
              }
            />
          </div>

          {/* Images */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="images">Mostrar Imágenes</Label>
              <div className="text-sm text-gray-500">
                Muestra imágenes representativas de cada letra
              </div>
            </div>
            <Switch
              id="images"
              checked={localSettings.showImages}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, showImages: checked })
              }
            />
          </div>

          {/* Celebrations */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="celebrate">Celebrar Logros</Label>
              <div className="text-sm text-gray-500">
                Efectos visuales al completar el alfabeto
              </div>
            </div>
            <Switch
              id="celebrate"
              checked={localSettings.celebrateCompletion}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, celebrateCompletion: checked })
              }
            />
          </div>

          <Separator />

          {/* Auto-advance delay (if enabled) */}
          {localSettings.autoAdvance && (
            <div className="space-y-2">
              <Label htmlFor="delay">Tiempo de Avance Automático</Label>
              <Select 
                value={localSettings.autoAdvanceDelay.toString()} 
                onValueChange={(value) => 
                  setLocalSettings({ ...localSettings, autoAdvanceDelay: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2000">2 segundos</SelectItem>
                  <SelectItem value="3000">3 segundos</SelectItem>
                  <SelectItem value="5000">5 segundos</SelectItem>
                  <SelectItem value="10000">10 segundos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
};

// Main Exercise Component
const AlphabetExercise: React.FC<AlphabetExerciseProps> = ({ settings: initialSettings, onOpenSettings }) => {
  const [settings, setSettings] = useState<AlphabetSettings>(() => {
    const saved = localStorage.getItem('alphabet_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : initialSettings || defaultSettings;
  });

  const [progress, setProgress] = useState<AlphabetProgress>(() => {
    const saved = localStorage.getItem('alphabet_progress');
    return saved ? JSON.parse(saved) : defaultProgress;
  });

  const [showSettings, setShowSettings] = useState(false);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('alphabet_progress', JSON.stringify(progress));
  }, [progress]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('alphabet_settings', JSON.stringify(settings));
  }, [settings]);

  const handleProgressUpdate = useCallback((newProgress: AlphabetProgress) => {
    setProgress(newProgress);
  }, []);

  const resetProgress = useCallback(() => {
    const resetProgress = { ...defaultProgress };
    setProgress(resetProgress);
    localStorage.setItem('alphabet_progress', JSON.stringify(resetProgress));
  }, []);

  if (showSettings) {
    return (
      <AlphabetSettingsComponent
        settings={settings}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              🔤 Aprendizaje del Alfabeto
            </h1>
            <p className="text-gray-600 mt-1">
              Nivel {settings.level}: {
                settings.level === 1 ? 'Reconocimiento Visual y Auditivo' :
                settings.level === 2 ? 'Ordenar Letras' :
                settings.level === 3 ? 'Completar Palabras' :
                settings.level === 4 ? 'Asociación de Sonidos' :
                'Formar Palabras'
              }
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={resetProgress}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reiniciar</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </Button>
          </div>
        </div>

        {/* Current Level Component */}
        {settings.level === 1 && (
          <Level1Component
            settings={settings}
            progress={progress}
            onProgress={handleProgressUpdate}
          />
        )}

        {settings.level > 1 && (
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">🚧 Próximamente</h2>
              <p className="text-gray-600 mb-4">
                Este nivel estará disponible en la próxima fase de desarrollo.
              </p>
              <Button onClick={() => setSettings({ ...settings, level: 1 })}>
                Volver al Nivel 1
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Summary */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {progress.completedLetters.length}
                </div>
                <div className="text-sm text-gray-600">Letras Vistas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {progress.totalCorrectAnswers}
                </div>
                <div className="text-sm text-gray-600">Respuestas Correctas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {progress.currentStreak}
                </div>
                <div className="text-sm text-gray-600">Racha Actual</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.floor(progress.timeSpent / 60)}m
                </div>
                <div className="text-sm text-gray-600">Tiempo Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlphabetExercise;