import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ModuleSettings } from "@/context/SettingsContext";
import { Hash, Settings2 } from "lucide-react";

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

export default function CountingExercise({ settings, onOpenSettings }: ExerciseProps) {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [targetNumber, setTargetNumber] = useState(10);
  const [showVisual, setShowVisual] = useState(true);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Establecer el número objetivo según la dificultad
  useEffect(() => {
    switch (settings.difficulty) {
      case "beginner":
        setTargetNumber(10);
        break;
      case "intermediate":
        setTargetNumber(20);
        break;
      case "advanced":
        setTargetNumber(50);
        break;
      default:
        setTargetNumber(10);
    }
    setCurrentNumber(1);
    setProgress(0);
    setIsComplete(false);
  }, [settings.difficulty]);

  // Calcular el progreso
  useEffect(() => {
    const calculatedProgress = ((currentNumber - 1) / targetNumber) * 100;
    setProgress(calculatedProgress);
    
    if (currentNumber > targetNumber) {
      setIsComplete(true);
    }
  }, [currentNumber, targetNumber]);

  // Función para incrementar el contador
  const incrementCounter = () => {
    if (currentNumber <= targetNumber) {
      setCurrentNumber(prev => prev + 1);
      setIsCorrect(true);
      
      // Reproducir sonido si está habilitado
      if (settings.enableSoundEffects) {
        playSound(true);
      }
    }
  };

  // Función para reiniciar el ejercicio
  const resetExercise = () => {
    setCurrentNumber(1);
    setProgress(0);
    setIsCorrect(null);
    setIsComplete(false);
  };

  // Función para reproducir sonidos
  const playSound = (correct: boolean) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (correct) {
      oscillator.frequency.value = 500;
      gainNode.gain.value = 0.1;
      oscillator.type = "sine";
    } else {
      oscillator.frequency.value = 200;
      gainNode.gain.value = 0.1;
      oscillator.type = "triangle";
    }
    
    oscillator.start();
    
    setTimeout(() => {
      oscillator.stop();
    }, 200);
  };

  // Visualización de elementos para contar
  const renderVisualElements = () => {
    if (!showVisual) return null;
    
    const elements = [];
    for (let i = 0; i < currentNumber - 1; i++) {
      elements.push(
        <div 
          key={i}
          className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm"
        >
          {i + 1}
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {elements}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Counting Numbers</h2>
        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>
      
      <Card className="w-full p-6 mb-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">Count from 1 to {targetNumber}</h3>
          <p className="text-gray-600">Click the button to count up one by one</p>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 rounded-lg p-8 flex items-center justify-center">
            <span className="text-6xl font-bold text-blue-700">{currentNumber <= targetNumber ? currentNumber : targetNumber}</span>
          </div>
        </div>
        
        {renderVisualElements()}
        
        <Progress value={progress} className="mb-6" />
        
        <div className="flex justify-center space-x-4">
          {!isComplete ? (
            <Button onClick={incrementCounter} size="lg" className="bg-blue-500 hover:bg-blue-600">
              <Hash className="mr-2 h-5 w-5" />
              Count: {currentNumber}
            </Button>
          ) : (
            <Button onClick={resetExercise} size="lg" className="bg-green-500 hover:bg-green-600">
              Start Again
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setShowVisual(!showVisual)}
          >
            {showVisual ? "Hide Visual" : "Show Visual"}
          </Button>
        </div>
        
        {isComplete && (
          <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-md text-center">
            <h3 className="font-bold text-lg">Great job!</h3>
            <p>You've successfully counted from 1 to {targetNumber}</p>
          </div>
        )}
      </Card>
      
      <div className="text-sm text-gray-500 mt-4">
        <p>Try switching difficulty in settings to count to different numbers!</p>
      </div>
    </div>
  );
}