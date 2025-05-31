import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/utils/i18n';
import { ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX, Settings } from 'lucide-react';

// Importar hooks personalizados
import { useExerciseState } from './hooks/useExerciseState';
import { useAnswerHandling } from './hooks/useAnswerHandling';
import { useTimerLogic } from './hooks/useTimerLogic';

// Importar componentes especializados
import YouTubeVideoManager from './components/YouTubeVideoManager';
import ExerciseResults from './components/ExerciseResults';
import VisualProblemDisplay from './components/VisualProblemDisplay';
import InteractiveExercise from './components/InteractiveExercise';

// Importar utilidades
import { generateAssociativePropertyProblem } from './utils';
import { ExerciseProps, AssociativePropertyProblem } from './types';

const AssociativePropertyExercise: React.FC<ExerciseProps> = ({ settings, onOpenSettings }) => {
  const { t } = useTranslation();
  
  // Estado del ejercicio usando hook personalizado
  const exerciseState = useExerciseState(
    settings.difficulty as any,
    settings.problemCount,
    settings.maxAttempts
  );

  // Lógica de temporizadores
  const timerLogic = useTimerLogic({
    timeValue: settings.timeValue,
    hasTimerEnabled: settings.hasTimerEnabled,
    timeLimit: settings.timeLimit || 'per-problem',
    setTotalTimeSpent: exerciseState.setTotalTimeSpent,
    onTimeUp: () => {
      // Manejar cuando se acaba el tiempo
      handleTimeUp();
    }
  });

  // Lógica de manejo de respuestas
  const answerHandling = useAnswerHandling({
    currentProblem: exerciseState.currentProblem,
    currentAttempt: exerciseState.currentAttempt,
    maxAttempts: settings.maxAttempts,
    userAnswersHistory: exerciseState.userAnswersHistory,
    setUserAnswersHistory: exerciseState.setUserAnswersHistory,
    setCurrentAttempt: exerciseState.setCurrentAttempt,
    setFeedbackMessage: exerciseState.setFeedbackMessage,
    setFeedbackColor: exerciseState.setFeedbackColor,
    setShowFeedback: exerciseState.setShowFeedback,
    setConsecutiveCorrectAnswers: exerciseState.setConsecutiveCorrectAnswers,
    setConsecutiveIncorrectAnswers: exerciseState.setConsecutiveIncorrectAnswers,
    consecutiveCorrectAnswers: exerciseState.consecutiveCorrectAnswers,
    consecutiveIncorrectAnswers: exerciseState.consecutiveIncorrectAnswers,
    problemStartTime: exerciseState.problemStartTime,
    showImmediateFeedback: settings.showImmediateFeedback,
    t
  });

  // Estados locales para UI específica
  const [soundEnabled, setSoundEnabled] = useState(settings.enableSoundEffects);
  const [videoLinks, setVideoLinks] = useState<string[]>(['', '']);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Generar problemas al iniciar
  useEffect(() => {
    if (!exerciseState.exerciseStarted && exerciseState.problems.length === 0) {
      generateProblems();
    }
  }, [settings.difficulty, settings.problemCount]);

  // Función para generar problemas
  const generateProblems = () => {
    const newProblems: AssociativePropertyProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      const problem = generateAssociativePropertyProblem(
        settings.difficulty as any,
        settings.maxAttempts,
        i,
        settings.problemCount
      );
      newProblems.push(problem);
    }
    exerciseState.setProblems(newProblems);
  };

  // Iniciar ejercicio
  const startExercise = () => {
    exerciseState.setExerciseStarted(true);
    exerciseState.setProblemStartTime(Date.now());
    timerLogic.startExerciseTimer();
    timerLogic.startProblemTimer();
  };

  // Manejar envío de respuesta
  const handleSubmitAnswer = () => {
    const userNumericAnswer = parseFloat(exerciseState.userAnswer);
    if (isNaN(userNumericAnswer)) return;

    const isCorrect = answerHandling.submitAnswer(userNumericAnswer);
    
    if (isCorrect) {
      answerHandling.handleCorrectAnswer();
      if (exerciseState.isLastProblem) {
        finishExercise();
      } else {
        setTimeout(() => moveToNextProblem(), 1500);
      }
    } else {
      answerHandling.handleIncorrectAnswer();
    }
    
    exerciseState.setUserAnswer('');
  };

  // Moverse al siguiente problema
  const moveToNextProblem = () => {
    exerciseState.setCurrentProblemIndex(prev => prev + 1);
    exerciseState.setCurrentAttempt(1);
    exerciseState.setShowFeedback(false);
    exerciseState.setProblemStartTime(Date.now());
    timerLogic.startProblemTimer();
  };

  // Finalizar ejercicio
  const finishExercise = () => {
    exerciseState.setExerciseFinished(true);
    timerLogic.stopExerciseTimer();
  };

  // Manejar tiempo agotado
  const handleTimeUp = () => {
    if (exerciseState.currentAttempt >= settings.maxAttempts || exerciseState.isLastProblem) {
      answerHandling.handleSkipProblem();
      if (exerciseState.isLastProblem) {
        finishExercise();
      } else {
        setTimeout(() => moveToNextProblem(), 1500);
      }
    }
  };

  // Reiniciar ejercicio
  const restartExercise = () => {
    exerciseState.setExerciseStarted(false);
    exerciseState.setExerciseFinished(false);
    exerciseState.setCurrentProblemIndex(0);
    exerciseState.setUserAnswersHistory([]);
    exerciseState.setCurrentAttempt(1);
    exerciseState.setConsecutiveCorrectAnswers(0);
    exerciseState.setConsecutiveIncorrectAnswers(0);
    exerciseState.setRevealedAnswers(0);
    exerciseState.setTotalTimeSpent(0);
    exerciseState.setShowFeedback(false);
    timerLogic.clearTimers();
    generateProblems();
  };

  // Renderizado condicional basado en el estado del ejercicio
  if (exerciseState.exerciseFinished) {
    return (
      <ExerciseResults
        userAnswersHistory={exerciseState.userAnswersHistory}
        exerciseStats={exerciseState.calculateStats()}
        onRestart={restartExercise}
        onGoHome={() => window.location.href = '/'}
        t={t}
      />
    );
  }

  if (!exerciseState.exerciseStarted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Propiedad Asociativa</CardTitle>
          <p className="text-gray-600">
            Aprende que cambiar los paréntesis no altera el resultado: (a + b) + c = a + (b + c)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <YouTubeVideoManager
            isVideoPlaying={isVideoPlaying}
            currentVideo={currentVideo}
            videoLinks={videoLinks}
            isEditMode={isEditMode}
            onStartVideo={setCurrentVideo}
            onStopVideo={() => setIsVideoPlaying(false)}
            onEnterEditMode={() => setIsEditMode(true)}
            onExitEditMode={() => setIsEditMode(false)}
            onSaveVideos={() => {}}
            onVideoChange={(index, value) => {
              const newLinks = [...videoLinks];
              newLinks[index] = value;
              setVideoLinks(newLinks);
            }}
            onRemoveVideo={(index) => {
              const newLinks = videoLinks.filter((_, i) => i !== index);
              setVideoLinks([...newLinks, '']);
            }}
            onAddVideo={() => setVideoLinks([...videoLinks, ''])}
          />
          
          <div className="text-center space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Dificultad:</span>
                <Badge variant="outline" className="ml-2">
                  {settings.difficulty}
                </Badge>
              </div>
              <div>
                <span className="font-semibold">Problemas:</span>
                <span className="ml-2">{settings.problemCount}</span>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={startExercise} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Comenzar Ejercicio
              </Button>
              <Button onClick={onOpenSettings} variant="outline" size="lg">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vista principal del ejercicio
  if (!exerciseState.currentProblem) {
    return <div>Cargando problema...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header del ejercicio */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Propiedad Asociativa</h2>
          <Badge variant="outline">
            Problema {exerciseState.currentProblemIndex + 1} de {exerciseState.problems.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? 
              <Volume2 className="h-4 w-4" /> : 
              <VolumeX className="h-4 w-4" />
            }
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenido principal del problema */}
      <Card>
        <CardContent className="p-6">
          {settings.difficulty === 'beginner' && exerciseState.currentProblem.visualObjects ? (
            <VisualProblemDisplay
              problem={exerciseState.currentProblem}
              showVisualMode={true}
            />
          ) : settings.difficulty === 'intermediate' && exerciseState.currentProblem.grouping1 ? (
            <InteractiveExercise
              problem={exerciseState.currentProblem}
              userAnswer={exerciseState.userAnswer}
              onAnswerChange={exerciseState.setUserAnswer}
              onSubmit={handleSubmitAnswer}
              showFeedback={exerciseState.showFeedback}
              feedbackMessage={exerciseState.feedbackMessage}
              feedbackColor={exerciseState.feedbackColor}
              currentAttempt={exerciseState.currentAttempt}
              maxAttempts={settings.maxAttempts}
            />
          ) : (
            // Vista simple para otros niveles
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-mono">
                  {exerciseState.currentProblem.operands.join(' + ')} = ?
                </div>
              </div>
              
              <div className="flex justify-center">
                <Input
                  type="number"
                  value={exerciseState.userAnswer}
                  onChange={(e) => exerciseState.setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  className="w-32 text-center text-lg"
                  placeholder="Respuesta"
                />
              </div>
              
              <div className="flex justify-center">
                <Button onClick={handleSubmitAnswer} disabled={!exerciseState.userAnswer.trim()}>
                  Enviar Respuesta
                </Button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {exerciseState.showFeedback && (
            <div className={`mt-4 text-center p-3 rounded-lg ${
              exerciseState.feedbackColor === 'green' ? 'bg-green-100 text-green-800' :
              exerciseState.feedbackColor === 'red' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {exerciseState.feedbackMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controles de navegación */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => exerciseState.setCurrentProblemIndex(Math.max(0, exerciseState.currentProblemIndex - 1))}
          disabled={exerciseState.currentProblemIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => answerHandling.handleSkipProblem()}>
            Omitir
          </Button>
          {settings.showAnswerWithExplanation && (
            <Button variant="outline" onClick={() => answerHandling.revealAnswer()}>
              Revelar Respuesta
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={moveToNextProblem}
          disabled={exerciseState.isLastProblem}
        >
          Siguiente
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default AssociativePropertyExercise;