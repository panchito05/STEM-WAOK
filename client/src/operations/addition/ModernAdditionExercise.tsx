// ModernAdditionExercise.tsx - Versión refactorizada del ejercicio de suma
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Importar componentes
import ProblemDisplay from './components/ProblemDisplay';
import NumericKeypad from './components/NumericKeypad';
import { ResultsBoard } from './components/ResultsBoard';
import { ExplanationPanel } from './components/ExplanationPanel';

// Importar hooks y utilidades
import { useExerciseTimer } from './hooks/useExerciseTimer';
import { useTranslation } from './hooks/useTranslation';
import { generateProblemsSet } from './utils/problemGenerator';
import { useAudio } from '../../hooks/useAudio';

// Importar tipos
import {
  Problem,
  UserAnswer,
  ExerciseSettings,
  ExerciseResults,
  ExerciseState,
  DifficultyLevel,
  LevelFeedback
} from './types';

/**
 * Componente moderno y refactorizado para el ejercicio de suma
 */
const ModernAdditionExercise: React.FC = () => {
  // Configuración inicial del ejercicio
  const [settings, setSettings] = useState<ExerciseSettings>({
    difficulty: 'intermediate',
    problemCount: 5,
    timeLimit: 'per-problem',
    timeValue: 10,
    maxAttempts: 2,
    showImmediateFeedback: true,
    enableSoundEffects: true,
    showAnswerWithExplanation: true,
    enableAdaptiveDifficulty: true,
    enableCompensation: true,
    enableRewards: true,
    rewardType: 'stars',
    language: 'spanish'
  });
  
  // Estado del ejercicio
  const [exerciseState, setExerciseState] = useState<ExerciseState>(ExerciseState.LOADING);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [results, setResults] = useState<ExerciseResults | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [isShowingAnswer, setIsShowingAnswer] = useState(false);
  
  // Efectos de sonido
  const correctSound = useAudio('/audio/correct.mp3');
  const incorrectSound = useAudio('/audio/incorrect.mp3');
  const completedSound = useAudio('/audio/completed.mp3');
  
  // Retroalimentación de adaptabilidad
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<LevelFeedback | null>(null);
  
  // Referencias para tiempos
  const exerciseStartTimeRef = React.useRef<number | null>(null);
  const problemStartTimeRef = React.useRef<number | null>(null);
  
  // Hook para traducciones
  const { t } = useTranslation();
  
  // Configuración del timer
  const isGlobalTimer = settings.timeLimit === 'global';
  const isPerProblemTimer = settings.timeLimit === 'per-problem';
  const hasTimeLimit = isGlobalTimer || isPerProblemTimer;
  const timerType = isGlobalTimer ? 'global' : 'per-problem';
  
  // Hook para el temporizador
  const { 
    timeLeft, 
    isTimerActive, 
    globalTimer,
    startTimer, 
    pauseTimer, 
    resetProblemTimer,
    stopAllTimers
  } = useExerciseTimer({
    timerType,
    timeValue: settings.timeValue,
    active: exerciseState === ExerciseState.IN_PROGRESS && hasTimeLimit,
    onTimerComplete: handleTimerComplete
  });
  
  // Cargar configuración al inicio
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Inicializar el ejercicio cuando cambia la configuración
  useEffect(() => {
    if (exerciseState === ExerciseState.LOADING) {
      initializeExercise();
    }
  }, [settings, exerciseState]);
  
  // Manejar cambios en el estado del ejercicio
  useEffect(() => {
    if (exerciseState === ExerciseState.IN_PROGRESS) {
      startExercise();
    } else if (exerciseState === ExerciseState.COMPLETED) {
      finishExercise();
    }
  }, [exerciseState]);
  
  /**
   * Cargar configuración desde localStorage o servidor
   */
  function loadSettings() {
    try {
      // Intenta cargar desde localStorage
      const savedSettingsStr = localStorage.getItem('moduleSettings');
      if (savedSettingsStr) {
        const savedSettings = JSON.parse(savedSettingsStr);
        if (savedSettings && savedSettings.addition) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...savedSettings.addition
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
    
    // Después de cargar configuración, inicializar ejercicio
    setExerciseState(ExerciseState.LOADING);
  }
  
  /**
   * Inicializar el ejercicio con problemas nuevos
   */
  function initializeExercise() {
    // Generar problemas
    const newProblems = generateProblemsSet(settings.difficulty, settings.problemCount);
    
    // Inicializar estado
    setProblems(newProblems);
    setCurrentProblemIndex(0);
    setCurrentAnswer('');
    setCurrentAttempt(1);
    setUserAnswers([]);
    setShowExplanation(false);
    setIsShowingAnswer(false);
    setResults(null);
    
    // Cambiar estado para iniciar
    setExerciseState(ExerciseState.READY);
  }
  
  /**
   * Iniciar ejercicio
   */
  function startExercise() {
    // Iniciar temporizadores
    if (!exerciseStartTimeRef.current) {
      exerciseStartTimeRef.current = Date.now();
    }
    
    problemStartTimeRef.current = Date.now();
    startTimer();
  }
  
  /**
   * Manejar clic de tecla numérica
   */
  function handleNumberClick(value: string) {
    if (isShowingAnswer) return;
    
    // Limitar longitud
    const maxDigits = problems[currentProblemIndex]?.result.toString().length + 1;
    if (currentAnswer.length >= maxDigits) return;
    
    setCurrentAnswer(prev => prev + value);
  }
  
  /**
   * Manejar clic de retroceso
   */
  function handleBackspaceClick() {
    if (isShowingAnswer) return;
    setCurrentAnswer(prev => prev.slice(0, -1));
  }
  
  /**
   * Manejar clic de limpiar
   */
  function handleClearClick() {
    if (isShowingAnswer) return;
    setCurrentAnswer('');
  }
  
  /**
   * Verificar respuesta del usuario
   */
  function handleCheckAnswer() {
    if (isShowingAnswer || currentAnswer === '') return;
    
    const currentProblem = problems[currentProblemIndex];
    const correctAnswer = currentProblem.result.toString();
    const isCorrect = currentAnswer === correctAnswer;
    
    // Calcular tiempo
    const timeTaken = problemStartTimeRef.current 
      ? (Date.now() - problemStartTimeRef.current) / 1000 
      : 0;
    
    // Efectos de sonido
    if (settings.enableSoundEffects) {
      if (isCorrect) {
        correctSound.play();
      } else {
        incorrectSound.play();
      }
    }
    
    // Calcular puntos
    let pointsEarned = 0;
    if (isCorrect) {
      // Puntos base para la dificultad
      const basePoints = getPointsForDifficulty(settings.difficulty);
      
      // Bonificación por tiempo y penalización por intentos
      const timeBonus = calculateTimeBonus(timeTaken);
      const attemptMultiplier = (settings.maxAttempts - currentAttempt + 1) / settings.maxAttempts;
      
      pointsEarned = Math.round(basePoints * timeBonus * attemptMultiplier);
      
      // Actualizar respuestas correctas consecutivas
      setConsecutiveCorrectAnswers(prev => prev + 1);
    } else {
      setConsecutiveCorrectAnswers(0);
    }
    
    // Crear objeto de respuesta
    const userAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: `${currentProblem.operands[0]} + ${currentProblem.operands[1]} = ${currentProblem.result}`,
      userAnswer: currentAnswer,
      correctAnswer,
      isCorrect,
      attempt: currentAttempt,
      timeTaken,
      pointsEarned
    };
    
    // Actualizar respuestas
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const existingIndex = newAnswers.findIndex(a => a.problemId === currentProblem.id);
      
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = userAnswer;
      } else {
        newAnswers.push(userAnswer);
      }
      
      return newAnswers;
    });
    
    // Manejar resultado
    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  }
  
  /**
   * Manejar respuesta correcta
   */
  function handleCorrectAnswer() {
    // Pausar temporizador
    pauseTimer();
    
    // Mostrar respuesta correcta
    setIsShowingAnswer(true);
    
    // Verificar ajuste de dificultad
    if (settings.enableAdaptiveDifficulty) {
      checkAndAdjustDifficulty();
    }
    
    // Mostrar siguiente problema
    setTimeout(() => {
      moveToNextProblem();
    }, 1500);
  }
  
  /**
   * Manejar respuesta incorrecta
   */
  function handleIncorrectAnswer() {
    // Si hay más intentos disponibles
    if (currentAttempt < settings.maxAttempts) {
      setCurrentAttempt(prev => prev + 1);
      setCurrentAnswer('');
      
      // Mostrar retroalimentación si está habilitada
      if (settings.showImmediateFeedback) {
        setIsShowingAnswer(true);
        
        setTimeout(() => {
          setIsShowingAnswer(false);
        }, 2000);
      }
    } else {
      // No más intentos
      setIsShowingAnswer(true);
      
      if (settings.showAnswerWithExplanation) {
        setShowExplanation(true);
      }
      
      setTimeout(() => {
        moveToNextProblem();
      }, 3000);
    }
  }
  
  /**
   * Manejar fin del tiempo
   */
  function handleTimerComplete() {
    const currentProblem = problems[currentProblemIndex];
    
    // Calcular tiempo
    const timeTaken = problemStartTimeRef.current 
      ? (Date.now() - problemStartTimeRef.current) / 1000 
      : settings.timeValue;
    
    // Crear respuesta para tiempo agotado
    const userAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: `${currentProblem.operands[0]} + ${currentProblem.operands[1]} = ${currentProblem.result}`,
      userAnswer: currentAnswer,
      correctAnswer: currentProblem.result.toString(),
      isCorrect: false,
      attempt: currentAttempt,
      timeTaken,
      pointsEarned: 0
    };
    
    // Actualizar respuestas
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const existingIndex = newAnswers.findIndex(a => a.problemId === currentProblem.id);
      
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = userAnswer;
      } else {
        newAnswers.push(userAnswer);
      }
      
      return newAnswers;
    });
    
    // Resetear contador
    setConsecutiveCorrectAnswers(0);
    
    // Mostrar respuesta correcta
    setIsShowingAnswer(true);
    
    if (settings.showAnswerWithExplanation) {
      setShowExplanation(true);
    }
    
    setTimeout(() => {
      moveToNextProblem();
    }, 3000);
  }
  
  /**
   * Avanzar al siguiente problema
   */
  function moveToNextProblem() {
    setShowExplanation(false);
    setIsShowingAnswer(false);
    setCurrentAnswer('');
    setCurrentAttempt(1);
    
    if (currentProblemIndex + 1 < problems.length) {
      setCurrentProblemIndex(prev => prev + 1);
      problemStartTimeRef.current = Date.now();
      
      if (isPerProblemTimer) {
        resetProblemTimer();
      }
    } else {
      setExerciseState(ExerciseState.COMPLETED);
    }
  }
  
  /**
   * Finalizar ejercicio y calcular resultados
   */
  function finishExercise() {
    // Detener temporizadores
    stopAllTimers();
    
    // Reproducir sonido de finalización
    if (settings.enableSoundEffects) {
      completedSound.play();
    }
    
    // Calcular estadísticas
    const totalTimeTaken = exerciseStartTimeRef.current 
      ? (Date.now() - exerciseStartTimeRef.current) / 1000 
      : globalTimer;
    
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const wrongAnswers = userAnswers.filter(a => !a.isCorrect).length;
    const totalPoints = userAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
    
    // Aplicar compensación si está habilitada
    let finalPoints = totalPoints;
    if (settings.enableCompensation) {
      // Si el rendimiento fue bajo, dar puntos extra
      const correctPercentage = (correctAnswers / problems.length) * 100;
      if (correctPercentage < 70) {
        const factor = {
          beginner: 1.1,
          elementary: 1.15,
          intermediate: 1.2,
          advanced: 1.25,
          expert: 1.3
        }[settings.difficulty] || 1.1;
        
        finalPoints = Math.round(totalPoints * factor);
      }
    }
    
    // Crear resultados
    const exerciseResults: ExerciseResults = {
      totalProblems: problems.length,
      correctAnswers,
      wrongAnswers,
      skippedAnswers: 0,
      timeOutAnswers: userAnswers.filter(a => !a.isCorrect && a.timeTaken >= settings.timeValue).length,
      totalPoints: finalPoints,
      accuracy: correctAnswers / problems.length,
      totalTimeTaken,
      averageTimePerProblem: totalTimeTaken / problems.length,
      userAnswers,
      difficulty: settings.difficulty,
      levelsImproved: adaptiveFeedback ? 1 : 0
    };
    
    setResults(exerciseResults);
    
    // Guardar resultados
    saveExerciseResults(exerciseResults);
  }
  
  /**
   * Verificar y ajustar dificultad
   */
  function checkAndAdjustDifficulty() {
    // Thresholds para aumentar la dificultad
    const thresholds = {
      beginner: 3,
      elementary: 4,
      intermediate: 5,
      advanced: 6,
      expert: 0 // No hay nivel superior
    };
    
    const currentDifficulty = settings.difficulty;
    const threshold = thresholds[currentDifficulty];
    
    // Si se alcanzó el umbral, aumentar dificultad
    if (threshold > 0 && consecutiveCorrectAnswers >= threshold) {
      const difficultyLevels: DifficultyLevel[] = [
        'beginner', 'elementary', 'intermediate', 'advanced', 'expert'
      ];
      
      const currentIndex = difficultyLevels.indexOf(currentDifficulty);
      if (currentIndex < difficultyLevels.length - 1) {
        const newDifficulty = difficultyLevels[currentIndex + 1];
        
        // Guardar retroalimentación
        setAdaptiveFeedback({
          previousLevel: currentDifficulty,
          newLevel: newDifficulty,
          consecutiveCorrectAnswers
        });
        
        // Actualizar configuración
        setSettings(prev => ({
          ...prev,
          difficulty: newDifficulty
        }));
        
        // Reiniciar contador
        setConsecutiveCorrectAnswers(0);
        
        // Guardar configuración
        saveSettings({
          ...settings,
          difficulty: newDifficulty
        });
      }
    }
  }
  
  /**
   * Obtener puntos base según dificultad
   */
  function getPointsForDifficulty(difficulty: DifficultyLevel): number {
    const points = {
      beginner: 10,
      elementary: 20,
      intermediate: 30,
      advanced: 40,
      expert: 50
    };
    
    return points[difficulty] || 10;
  }
  
  /**
   * Calcular bonus por velocidad
   */
  function calculateTimeBonus(timeTaken: number): number {
    const maxTime = settings.timeValue;
    
    if (timeTaken <= maxTime * 0.3) {
      return 1.5; // Súper rápido
    } else if (timeTaken <= maxTime * 0.5) {
      return 1.3; // Muy rápido
    } else if (timeTaken <= maxTime * 0.7) {
      return 1.2; // Rápido
    }
    
    return 1.0; // Normal
  }
  
  /**
   * Guardar resultados del ejercicio
   */
  function saveExerciseResults(results: ExerciseResults) {
    try {
      // Obtener historial existente
      const historyStr = localStorage.getItem('exerciseHistory');
      let history = historyStr ? JSON.parse(historyStr) : [];
      
      // Añadir nuevo resultado
      const newExercise = {
        id: Date.now(),
        date: new Date().toISOString(),
        module: 'addition',
        results,
        settings
      };
      
      history = [newExercise, ...history];
      
      // Guardar en localStorage
      localStorage.setItem('exerciseHistory', JSON.stringify(history));
      
      // Si hay conexión al servidor, guardar allí
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (isLoggedIn) {
        saveExerciseToServer(newExercise);
      }
    } catch (error) {
      console.error('Error al guardar resultados:', error);
    }
  }
  
  /**
   * Guardar en servidor
   */
  async function saveExerciseToServer(exercise: any) {
    try {
      const activeProfileId = localStorage.getItem('activeProfileId');
      if (!activeProfileId) return;
      
      await fetch(`/api/child-profiles/${activeProfileId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exercise })
      });
    } catch (error) {
      console.error('Error al guardar en servidor:', error);
    }
  }
  
  /**
   * Guardar configuración
   */
  function saveSettings(newSettings: ExerciseSettings) {
    try {
      // Actualizar en localStorage
      const settingsStr = localStorage.getItem('moduleSettings');
      const allSettings = settingsStr ? JSON.parse(settingsStr) : {};
      
      allSettings.addition = newSettings;
      
      localStorage.setItem('moduleSettings', JSON.stringify(allSettings));
      
      // Guardar en servidor si está autenticado
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (isLoggedIn) {
        saveSettingsToServer(newSettings);
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    }
  }
  
  /**
   * Guardar configuración en servidor
   */
  async function saveSettingsToServer(moduleSettings: ExerciseSettings) {
    try {
      const activeProfileId = localStorage.getItem('activeProfileId');
      if (!activeProfileId) return;
      
      await fetch(`/api/child-profiles/${activeProfileId}/settings/module/addition`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(moduleSettings)
      });
    } catch (error) {
      console.error('Error al guardar configuración en servidor:', error);
    }
  }
  
  /**
   * Reiniciar ejercicio
   */
  function handleRestartExercise() {
    setExerciseState(ExerciseState.LOADING);
  }
  
  // Problema actual
  const currentProblem = problems[currentProblemIndex];
  
  // Renderizar según el estado
  if (exerciseState === ExerciseState.LOADING) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        <span className="text-lg">{t('common.loading')}</span>
      </div>
    );
  }
  
  if (exerciseState === ExerciseState.COMPLETED && results) {
    return (
      <ResultsBoard
        results={results}
        problems={problems}
        userAnswers={userAnswers}
        onRestart={handleRestartExercise}
      />
    );
  }
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Barra de progreso */}
      <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
        <div>
          <span className="font-medium mr-1">{t('exercise.problem')}</span>
          <span className="bg-blue-500 text-white px-2 py-1 rounded-md">
            {currentProblemIndex + 1} / {problems.length}
          </span>
        </div>
        
        {hasTimeLimit && (
          <div className="flex items-center">
            <span className="font-medium mr-2">{t('common.timeRemaining')}</span>
            <span className={`px-2 py-1 rounded-md ${
              (timeLeft && timeLeft < settings.timeValue * 0.3) 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-100'
            }`}>
              {timeLeft ? Math.ceil(timeLeft) : 0}{t('exercise.seconds')}
            </span>
          </div>
        )}
      </div>
      
      {/* Problema */}
      {currentProblem && (
        <Card className="overflow-hidden border-2 border-blue-200">
          <CardContent className="p-0">
            <ProblemDisplay
              problem={currentProblem}
              userAnswer={currentAnswer}
              isShowingAnswer={isShowingAnswer}
              timeLeft={timeLeft}
              isTimerActive={isTimerActive}
              hasTimeLimit={hasTimeLimit}
              isPerProblemTimer={isPerProblemTimer}
              maxTime={settings.timeValue}
            />
            
            {/* Teclado numérico */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <NumericKeypad 
                onNumberClick={handleNumberClick}
                onBackspaceClick={handleBackspaceClick}
                onClearClick={handleClearClick}
                onCheckClick={handleCheckAnswer}
                disabled={isShowingAnswer}
                showCheckButton={true}
                answerMaxDigits={currentProblem.result.toString().length + 1}
                currentAnswer={currentAnswer}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Explicación */}
      {showExplanation && currentProblem && (
        <ExplanationPanel
          problem={currentProblem}
          isVisible={showExplanation}
        />
      )}
      
      {/* Botones */}
      <div className="flex justify-center space-x-4">
        {exerciseState === ExerciseState.READY && (
          <Button
            onClick={() => setExerciseState(ExerciseState.IN_PROGRESS)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6"
          >
            {t('exercise.start')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModernAdditionExercise;