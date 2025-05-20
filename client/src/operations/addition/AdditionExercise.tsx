// AdditionExercise.tsx - Componente principal reorganizado para el ejercicio de suma
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Importar componentes
import { ProblemDisplay } from './components/ProblemDisplay';
import { NumericKeypad } from './components/NumericKeypad';
import { ResultsBoard } from './components/ResultsBoard';
import { ExplanationPanel } from './components/ExplanationPanel';

// Importar hooks y utilidades
import { useExerciseTimer } from './hooks/useExerciseTimer';
import { useTranslation } from './hooks/useTranslation';
import { generateProblemsSet } from './utils/problemGenerator';

// Importar tipos
import { 
  Problem, 
  UserAnswer, 
  ExerciseSettings, 
  ExerciseResults,
  ExerciseState,
  DifficultyLevel,
  CompensationResult,
  LevelFeedback
} from './types';

// Importar componente para audio (si es necesario)
import { useAudio } from '@/hooks/useAudio';

// Componente principal para el ejercicio de suma
export default function AdditionExercise() {
  const { t } = useTranslation();
  
  // Estados principales
  const [exerciseState, setExerciseState] = useState<ExerciseState>(ExerciseState.LOADING);
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
  
  // Estado de problemas y respuestas
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [isShowingAnswer, setIsShowingAnswer] = useState(false);
  
  // Estado de resultados
  const [results, setResults] = useState<ExerciseResults | null>(null);
  
  // Estado de adaptabilidad
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<LevelFeedback | null>(null);
  
  // Referencias
  const exerciseStartTimeRef = useRef<number | null>(null);
  const problemStartTimeRef = useRef<number | null>(null);
  
  // Efectos de sonido
  const correctSound = useAudio('/audio/correct.mp3');
  const incorrectSound = useAudio('/audio/incorrect.mp3');
  const completedSound = useAudio('/audio/completed.mp3');
  
  // Timer 
  const isGlobalTimer = settings.timeLimit === 'global';
  const isPerProblemTimer = settings.timeLimit === 'per-problem';
  const hasTimeLimit = isGlobalTimer || isPerProblemTimer;
  const timerType = isGlobalTimer ? 'global' : 'per-problem';
  
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
  
  // Efectos
  
  // Cargar configuración al inicio
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Inicializar el ejercicio cuando cambia la configuración
  useEffect(() => {
    if (settings) {
      initializeExercise();
    }
  }, [settings]);
  
  // Efecto para manejar cambios en el estado del ejercicio
  useEffect(() => {
    switch (exerciseState) {
      case ExerciseState.READY:
        resetExercise();
        break;
      case ExerciseState.IN_PROGRESS:
        startExercise();
        break;
      case ExerciseState.COMPLETED:
        finishExercise();
        break;
      default:
        break;
    }
  }, [exerciseState]);
  
  // Funciones
  
  // Cargar configuración desde localStorage o servidor
  function loadSettings() {
    try {
      // Intenta cargar desde localStorage
      const savedSettingsStr = localStorage.getItem('moduleSettings');
      if (savedSettingsStr) {
        const savedSettings = JSON.parse(savedSettingsStr);
        if (savedSettings && savedSettings.addition) {
          console.log('[ADDITION] Guardando configuración al cargar:', savedSettings.addition);
          setSettings(prevSettings => ({
            ...prevSettings,
            ...savedSettings.addition
          }));
          return;
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
    
    // Si no hay configuración, usar los valores predeterminados
    console.log('[ADDITION] Usando configuración predeterminada');
  }
  
  // Inicializar el ejercicio con nuevos problemas
  function initializeExercise() {
    // Generar problemas según la dificultad configurada
    const generatedProblems = generateProblemsSet(
      settings.difficulty,
      settings.problemCount
    );
    
    setProblems(generatedProblems);
    setCurrentProblemIndex(0);
    setUserAnswers([]);
    setCurrentAnswer('');
    setCurrentAttempt(1);
    setShowExplanation(false);
    setIsShowingAnswer(false);
    setResults(null);
    setConsecutiveCorrectAnswers(0);
    setAdaptiveFeedback(null);
    
    setExerciseState(ExerciseState.READY);
  }
  
  // Reiniciar el ejercicio para comenzar de nuevo
  function resetExercise() {
    setCurrentProblemIndex(0);
    setCurrentAnswer('');
    setCurrentAttempt(1);
    setShowExplanation(false);
    setIsShowingAnswer(false);
    exerciseStartTimeRef.current = null;
    problemStartTimeRef.current = null;
  }
  
  // Iniciar el ejercicio
  function startExercise() {
    if (!exerciseStartTimeRef.current) {
      exerciseStartTimeRef.current = Date.now();
    }
    
    problemStartTimeRef.current = Date.now();
    startTimer();
  }
  
  // Manejar clic en dígitos del teclado numérico
  function handleNumberClick(value: string) {
    if (isShowingAnswer) return;
    
    // Limitar longitud según la respuesta correcta
    const correctAnswer = problems[currentProblemIndex]?.result.toString() || '';
    if (currentAnswer.length >= correctAnswer.length + 2) return;
    
    setCurrentAnswer(prev => prev + value);
  }
  
  // Manejar clic en retroceso
  function handleBackspaceClick() {
    if (isShowingAnswer) return;
    setCurrentAnswer(prev => prev.slice(0, -1));
  }
  
  // Manejar clic en limpiar
  function handleClearClick() {
    if (isShowingAnswer) return;
    setCurrentAnswer('');
  }
  
  // Verificar respuesta actual
  function handleCheckAnswer() {
    if (isShowingAnswer || currentAnswer === '') return;
    
    const currentProblem = problems[currentProblemIndex];
    const correctAnswer = currentProblem.result.toString();
    const isCorrect = currentAnswer === correctAnswer;
    
    // Calcular tiempo tomado
    const timeTaken = problemStartTimeRef.current 
      ? (Date.now() - problemStartTimeRef.current) / 1000 
      : 0;
    
    // Reproducir sonido de retroalimentación si está habilitado
    if (settings.enableSoundEffects) {
      if (isCorrect) {
        correctSound.play();
      } else {
        incorrectSound.play();
      }
    }
    
    // Puntuación base por problema
    const basePoints = getPointsForDifficulty(settings.difficulty);
    
    // Calcular puntos ganados
    let pointsEarned = 0;
    if (isCorrect) {
      // Bonificación por velocidad
      const timeBonus = calculateTimeBonus(timeTaken);
      // Penalización por intentos
      const attemptMultiplier = (settings.maxAttempts - currentAttempt + 1) / settings.maxAttempts;
      
      pointsEarned = Math.round(basePoints * attemptMultiplier * timeBonus);
      
      // Actualizar conteo de respuestas correctas consecutivas
      setConsecutiveCorrectAnswers(prev => prev + 1);
    } else {
      setConsecutiveCorrectAnswers(0);
    }
    
    // Crear objeto de respuesta de usuario
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
    
    // Actualizar respuestas del usuario
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
    
    // Determinar el siguiente paso
    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  }
  
  // Manejar respuesta correcta
  function handleCorrectAnswer() {
    // Pausar el temporizador
    pauseTimer();
    
    // Mostrar respuesta correcta brevemente
    setIsShowingAnswer(true);
    
    // Verificar si se debe ajustar la dificultad
    if (settings.enableAdaptiveDifficulty) {
      checkAndAdjustDifficulty();
    }
    
    // Programar siguiente paso después de mostrar retroalimentación
    setTimeout(() => {
      moveToNextProblem();
    }, 1500);
  }
  
  // Manejar respuesta incorrecta
  function handleIncorrectAnswer() {
    // Si hay más intentos disponibles
    if (currentAttempt < settings.maxAttempts) {
      setCurrentAttempt(prev => prev + 1);
      setCurrentAnswer('');
      
      // Mostrar retroalimentación inmediata si está habilitada
      if (settings.showImmediateFeedback) {
        setIsShowingAnswer(true);
        
        setTimeout(() => {
          setIsShowingAnswer(false);
        }, 2000);
      }
    } else {
      // No hay más intentos, mostrar la respuesta correcta
      setIsShowingAnswer(true);
      
      // Mostrar explicación si está habilitada
      if (settings.showAnswerWithExplanation) {
        setShowExplanation(true);
      }
      
      // Programar siguiente paso
      setTimeout(() => {
        moveToNextProblem();
      }, 4000);
    }
  }
  
  // Manejar fin del tiempo
  function handleTimerComplete() {
    const currentProblem = problems[currentProblemIndex];
    
    // Calcular tiempo tomado
    const timeTaken = problemStartTimeRef.current 
      ? (Date.now() - problemStartTimeRef.current) / 1000 
      : settings.timeValue;
    
    // Crear objeto de respuesta de usuario para tiempo agotado
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
    
    // Actualizar respuestas del usuario
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
    
    // Resetear conteo de respuestas correctas consecutivas
    setConsecutiveCorrectAnswers(0);
    
    // Mostrar la respuesta correcta
    setIsShowingAnswer(true);
    
    // Mostrar explicación si está habilitada
    if (settings.showAnswerWithExplanation) {
      setShowExplanation(true);
    }
    
    // Programar siguiente paso
    setTimeout(() => {
      moveToNextProblem();
    }, 4000);
  }
  
  // Avanzar al siguiente problema
  function moveToNextProblem() {
    setShowExplanation(false);
    setIsShowingAnswer(false);
    setCurrentAnswer('');
    setCurrentAttempt(1);
    
    if (currentProblemIndex + 1 < problems.length) {
      // Avanzar al siguiente problema
      setCurrentProblemIndex(prev => prev + 1);
      problemStartTimeRef.current = Date.now();
      
      // Reiniciar el temporizador por problema
      if (isPerProblemTimer) {
        resetProblemTimer();
      }
    } else {
      // Finalizar el ejercicio
      setExerciseState(ExerciseState.COMPLETED);
    }
  }
  
  // Finalizar el ejercicio y calcular resultados
  function finishExercise() {
    // Detener todos los temporizadores
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
    
    // Aplicar compensación adaptativa si está habilitada
    let finalPoints = totalPoints;
    let compensation: CompensationResult | null = null;
    
    if (settings.enableCompensation) {
      compensation = calculateCompensation(
        correctAnswers, 
        wrongAnswers, 
        totalPoints,
        settings.difficulty
      );
      
      if (compensation.compensated) {
        finalPoints = compensation.newPoints;
      }
    }
    
    // Calcular resultados finales
    const results: ExerciseResults = {
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
    
    setResults(results);
    
    // Guardar resultados en el historial
    saveExerciseResults(results);
  }
  
  // Verificar y ajustar la dificultad según el rendimiento
  function checkAndAdjustDifficulty() {
    // Solo ajustar después de suficientes respuestas correctas consecutivas
    const difficultyThresholds = {
      beginner: 3,
      elementary: 4,
      intermediate: 5,
      advanced: 6,
      expert: 0 // No hay nivel superior a expert
    };
    
    const currentDifficulty = settings.difficulty;
    const threshold = difficultyThresholds[currentDifficulty];
    
    if (threshold > 0 && consecutiveCorrectAnswers >= threshold) {
      // Determinar el siguiente nivel de dificultad
      const difficultyLevels: DifficultyLevel[] = [
        'beginner', 'elementary', 'intermediate', 'advanced', 'expert'
      ];
      
      const currentIndex = difficultyLevels.indexOf(currentDifficulty);
      if (currentIndex < difficultyLevels.length - 1) {
        const newDifficulty = difficultyLevels[currentIndex + 1];
        
        // Crear retroalimentación para mostrar al usuario
        setAdaptiveFeedback({
          previousLevel: currentDifficulty,
          newLevel: newDifficulty,
          consecutiveCorrectAnswers
        });
        
        // Actualizar la configuración de dificultad
        setSettings(prev => ({
          ...prev,
          difficulty: newDifficulty
        }));
        
        // Reiniciar contador de respuestas correctas consecutivas
        setConsecutiveCorrectAnswers(0);
        
        // Guardar la nueva configuración
        saveSettings({
          ...settings,
          difficulty: newDifficulty
        });
      }
    }
  }
  
  // Calcular compensación adaptativa
  function calculateCompensation(
    correctAnswers: number,
    wrongAnswers: number,
    totalPoints: number,
    difficulty: DifficultyLevel
  ): CompensationResult {
    const totalProblems = problems.length;
    const correctPercentage = (correctAnswers / totalProblems) * 100;
    
    // No aplicar compensación si el rendimiento es bueno
    if (correctPercentage >= 70) {
      return {
        compensated: false,
        newPoints: totalPoints,
        bonusPoints: 0,
        reason: 'No compensation needed'
      };
    }
    
    // Factores de compensación según dificultad
    const compensationFactors = {
      beginner: 1.1,
      elementary: 1.15,
      intermediate: 1.2,
      advanced: 1.25,
      expert: 1.3
    };
    
    const factor = compensationFactors[difficulty];
    const bonusPoints = Math.round(totalPoints * (factor - 1));
    const newPoints = totalPoints + bonusPoints;
    
    return {
      compensated: true,
      newPoints,
      bonusPoints,
      reason: 'Adaptive compensation applied'
    };
  }
  
  // Guardar resultados del ejercicio
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
      
      // Si hay conexión al servidor, también guardar allí
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (isLoggedIn) {
        saveExerciseToServer(newExercise);
      }
    } catch (error) {
      console.error('Error al guardar resultados:', error);
    }
  }
  
  // Guardar resultados en el servidor
  async function saveExerciseToServer(exercise: any) {
    try {
      const activeProfileId = localStorage.getItem('activeProfileId');
      if (!activeProfileId) return;
      
      const response = await fetch(`/api/child-profiles/${activeProfileId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exercise })
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar en el servidor');
      }
      
      console.log('Ejercicio guardado en el servidor correctamente');
    } catch (error) {
      console.error('Error al guardar en servidor:', error);
    }
  }
  
  // Guardar configuración actualizada
  function saveSettings(newSettings: ExerciseSettings) {
    try {
      // Actualizar en localStorage
      const settingsStr = localStorage.getItem('moduleSettings');
      const allSettings = settingsStr ? JSON.parse(settingsStr) : {};
      
      allSettings.addition = newSettings;
      
      localStorage.setItem('moduleSettings', JSON.stringify(allSettings));
      console.log('🔄 Actualizando configuración para addition:', newSettings);
      
      // Si hay conexión al servidor, también guardar allí
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (isLoggedIn) {
        console.log('🔐 Usuario autenticado: guardando configuración de addition en servidor');
        saveSettingsToServer(newSettings);
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    }
  }
  
  // Guardar configuración en el servidor
  async function saveSettingsToServer(moduleSettings: ExerciseSettings) {
    try {
      const activeProfileId = localStorage.getItem('activeProfileId');
      if (!activeProfileId) return;
      
      const response = await fetch(`/api/child-profiles/${activeProfileId}/settings/module/addition`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(moduleSettings)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar configuración en el servidor');
      }
    } catch (error) {
      console.error('Error al guardar configuración en servidor:', error);
    }
  }
  
  // Obtener puntos base según dificultad
  function getPointsForDifficulty(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'beginner': return 10;
      case 'elementary': return 20;
      case 'intermediate': return 30;
      case 'advanced': return 40;
      case 'expert': return 50;
      default: return 10;
    }
  }
  
  // Calcular bonus por velocidad
  function calculateTimeBonus(timeTaken: number): number {
    const maxTime = settings.timeValue;
    
    if (timeTaken <= maxTime * 0.3) {
      return 1.5; // Súper rápido: 50% extra
    } else if (timeTaken <= maxTime * 0.5) {
      return 1.3; // Muy rápido: 30% extra
    } else if (timeTaken <= maxTime * 0.7) {
      return 1.2; // Rápido: 20% extra
    } else {
      return 1.0; // Normal: sin bonus
    }
  }
  
  // Reiniciar el ejercicio completo (nuevos problemas)
  function handleRestartExercise() {
    setExerciseState(ExerciseState.LOADING);
    initializeExercise();
    setExerciseState(ExerciseState.IN_PROGRESS);
  }
  
  // Obtener el problema actual
  const currentProblem = problems[currentProblemIndex];
  
  // Renderizar diferentes estados del ejercicio
  if (exerciseState === ExerciseState.LOADING) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">{t('common.loading')}</span>
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
  
  // Renderizado principal del ejercicio
  return (
    <div className="flex flex-col space-y-4">
      {/* Progreso */}
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
      
      {/* Panel de explicación */}
      {showExplanation && currentProblem && (
        <ExplanationPanel
          problem={currentProblem}
          isVisible={showExplanation}
        />
      )}
      
      {/* Botones de acción */}
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
}