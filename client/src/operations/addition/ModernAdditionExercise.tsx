// ModernAdditionExercise.tsx - Componente principal modernizado para ejercicios de suma
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'wouter';
import { useStore } from '@/store/store';
import { ModuleSettings } from '@/types/settings';
import { 
  ExerciseProvider, 
  useExerciseContext 
} from './context/ExerciseContext';
import ProblemDisplay from './components/ProblemDisplay';
import NumericKeypad from './components/NumericKeypad';
import ResultsBoard from './components/ResultsBoard';
import ExplanationPanel from './components/ExplanationPanel';
import { useTranslation } from './hooks/useTranslation';
import { saveExerciseResult } from '@/services/progressService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Hourglass, SkipForward, Eye, Check, X } from 'lucide-react';

// Componente interno que usa el contexto
const ExerciseContent: React.FC = () => {
  const { state, updateAnswer, submitAnswer, skipProblem, showSolution, nextProblem } = useExerciseContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Obtener problema actual
  const currentProblem = state.problems[state.currentProblemIndex] || null;
  
  // Manejar entrada de número
  const handleNumberInput = (value: string | number) => {
    if (state.showExplanation) return; // No permitir entrada durante explicación
    
    updateAnswer(value);
  };
  
  // Manejar envío de respuesta
  const handleSubmitAnswer = () => {
    if (state.showExplanation) {
      nextProblem();
      return;
    }
    
    const isCorrect = submitAnswer();
    
    if (isCorrect) {
      setTimeout(() => {
        nextProblem();
      }, 1000); // Esperar un segundo antes de pasar al siguiente problema
    }
  };
  
  // Manejar clic en saltar
  const handleSkip = () => {
    skipProblem();
  };
  
  // Manejar clic en mostrar solución
  const handleShowSolution = () => {
    showSolution();
  };
  
  // Manejar clic en botón "Volver al menú"
  const handleReturnToMenu = () => {
    navigate('/');
  };
  
  // Renderizar pantalla de resultados cuando el ejercicio está completo
  if (state.isComplete) {
    return (
      <ResultsBoard 
        score={state.score}
        problems={state.problems}
        userAnswers={state.userAnswers}
        onRestart={() => window.location.reload()}
        onReturn={handleReturnToMenu}
      />
    );
  }
  
  return (
    <div className="exercise-container flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Barra de progreso y temporizador */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">
            {t('exercise.progress')}: {state.currentProblemIndex + 1} / {state.problems.length}
          </div>
          <Progress 
            value={(state.currentProblemIndex / state.problems.length) * 100} 
            className="h-2" 
          />
        </div>
        
        {state.settings.hasTimeLimit && (
          <div className="flex items-center gap-2">
            <Hourglass className="h-4 w-4" />
            <span>{Math.floor(state.timeRemaining / 60)}:{(state.timeRemaining % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>
      
      {/* Panel principal del problema */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            {currentProblem?.displayFormat === 'word' 
              ? t('exercise.wordProblem')
              : t('exercise.addition')}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {currentProblem && (
            <ProblemDisplay 
              problem={currentProblem}
              userAnswer={state.currentAnswer}
            />
          )}
          
          {/* Panel de explicación */}
          {state.showExplanation && currentProblem && (
            <ExplanationPanel problem={currentProblem} />
          )}
          
          {/* Información de resultado de intento */}
          {state.attempts > 0 && !state.showExplanation && (
            <div className={`mt-4 p-2 rounded-md ${
              state.userAnswers.find(a => a.problemId === currentProblem?.id)?.isCorrect
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}>
              {state.userAnswers.find(a => a.problemId === currentProblem?.id)?.isCorrect 
                ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>{t('common.correct')}</span>
                  </div>
                ) 
                : (
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span>{t('common.incorrect')}</span>
                  </div>
                )
              }
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Teclado numérico */}
      <NumericKeypad 
        onNumberClick={handleNumberInput}
        onSubmit={handleSubmitAnswer}
        disabled={state.showExplanation}
        answer={state.currentAnswer.toString()}
        allowDecimals={state.settings.allowDecimals || false}
      />
      
      {/* Acciones adicionales */}
      <div className="flex justify-between gap-2">
        <Button 
          variant="outline" 
          onClick={handleSkip}
          disabled={state.showExplanation}
        >
          <SkipForward className="h-4 w-4 mr-2" />
          {t('common.skip')}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleShowSolution}
          disabled={state.showExplanation}
        >
          <Eye className="h-4 w-4 mr-2" />
          {t('common.showSolution')}
        </Button>
      </div>
    </div>
  );
};

// Componente principal que provee el contexto
const ModernAdditionExercise: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const store = useStore();
  
  // Obtener configuraciones
  const settings = store.activeProfile?.moduleSettings?.addition || {};
  
  // Asegurar que se carga el perfil
  useEffect(() => {
    if (store.activeProfile) {
      setIsReady(true);
    }
  }, [store.activeProfile]);
  
  if (!isReady) {
    return <div>Cargando...</div>;
  }
  
  return (
    <ExerciseProvider>
      <ModernExerciseInitializer settings={settings} />
      <ExerciseContent />
    </ExerciseProvider>
  );
};

// Componente para inicializar el ejercicio con configuraciones
const ModernExerciseInitializer: React.FC<{ settings: ModuleSettings }> = ({ settings }) => {
  const { startExercise } = useExerciseContext();
  
  useEffect(() => {
    // Configurar valores por defecto
    const exerciseSettings: ModuleSettings = {
      language: settings.language || 'es',
      problemCount: settings.problemCount || 5,
      difficulty: settings.difficulty || 'beginner',
      hasTimeLimit: settings.hasTimeLimit || false,
      timeLimit: settings.timeLimit || 300,
      hasPerProblemTimer: settings.hasPerProblemTimer || false,
      maxOperands: settings.maxOperands || 2,
      minValue: settings.minValue || 1,
      maxValue: settings.maxValue || 10,
      allowNegatives: settings.allowNegatives || false,
      allowDecimals: settings.allowDecimals || false,
      decimalPlaces: settings.decimalPlaces || 1,
      maxAttemptsPerProblem: settings.maxAttemptsPerProblem || 2,
      showHints: settings.showHints || true,
      showExplanations: settings.showExplanations || true,
      preferredDisplayFormat: settings.preferredDisplayFormat || 'horizontal',
      adaptiveMode: settings.adaptiveMode || false,
      consecutiveCorrectThreshold: settings.consecutiveCorrectThreshold || 3,
      consecutiveIncorrectThreshold: settings.consecutiveIncorrectThreshold || 2
    };
    
    // Iniciar ejercicio
    startExercise(exerciseSettings);
  }, [startExercise, settings]);
  
  return null;
};

export default ModernAdditionExercise;