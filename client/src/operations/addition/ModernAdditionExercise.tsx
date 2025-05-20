// ModernAdditionExercise.tsx - Componente modernizado para ejercicios de suma
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleSettings } from '@/types/settings';
import { generateProblems } from './utils/problemGenerator';
import { Problem, UserAnswer } from './types';
import ProblemDisplay from './components/ProblemDisplay';
import NumericKeypad from './components/NumericKeypad';
import ExplanationPanel from './components/ExplanationPanel';
import ResultsBoard from './components/ResultsBoard';
import { useTranslation } from './hooks/useTranslation';
import { useExerciseTimer } from './hooks/useExerciseTimer';
import { saveExerciseResult } from '@/services/progressService';

function ExerciseContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  return (
    <div className="exercise-content p-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando ejercicio...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p>Error: {error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <p>Contenido del ejercicio</p>
      )}
    </div>
  );
}

// Componente principal
export default function ModernAdditionExercise({ config }: { config: ModuleSettings }) {
  // Estado
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [exerciseState, setExerciseState] = useState<'ready' | 'in-progress' | 'explanation' | 'completed'>('ready');
  const [score, setScore] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(config.maxAttemptsPerProblem || 1);
  
  // Referencias
  const startTimeRef = useRef<number>(Date.now());
  const problemStartTimeRef = useRef<number>(Date.now());
  
  // Hooks personalizados
  const { t } = useTranslation();
  const { 
    timeLeft, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    isTimerActive 
  } = useExerciseTimer(config.timeLimit || 0);
  
  // Obtener problema actual
  const currentProblem = problems[currentProblemIndex] || null;
  
  // Cargar problemas al inicio
  useEffect(() => {
    async function loadProblems() {
      try {
        const generatedProblems = await generateProblems({
          count: config.problemCount || 5,
          difficulty: config.difficulty || 'easy',
          maxOperands: config.maxOperands || 2,
          allowNegatives: config.allowNegatives || false,
          allowDecimals: config.allowDecimals || false
        });
        
        setProblems(generatedProblems);
        startTimeRef.current = Date.now();
        
        if (config.hasTimeLimit) {
          startTimer();
        }
        
        setExerciseState('in-progress');
      } catch (err) {
        console.error('Error al generar problemas:', err);
        setExerciseState('ready');
      }
    }
    
    loadProblems();
    
    // Limpieza al desmontar
    return () => {
      pauseTimer();
    };
  }, [config]);
  
  // Reset del tiempo al cambiar de problema
  useEffect(() => {
    if (exerciseState === 'in-progress' && currentProblem) {
      problemStartTimeRef.current = Date.now();
      
      if (config.hasPerProblemTimer && config.hasTimeLimit) {
        resetTimer();
        startTimer();
      }
      
      setRemainingAttempts(config.maxAttemptsPerProblem || 1);
    }
  }, [currentProblemIndex, exerciseState, currentProblem]);
  
  // Comprobar si se acabó el tiempo
  useEffect(() => {
    if (timeLeft === 0 && isTimerActive && exerciseState === 'in-progress') {
      handleTimerEnd();
    }
  }, [timeLeft, isTimerActive, exerciseState]);
  
  // Manejo de respuesta del usuario
  const handleNumberClick = (value: string) => {
    // Evitar múltiples puntos decimales
    if (value === '.' && userAnswer.includes('.')) return;
    
    // Limitar longitud de la respuesta
    if (userAnswer.length >= 10) return;
    
    setUserAnswer(prev => prev + value);
  };
  
  const handleBackspaceClick = () => {
    setUserAnswer(prev => prev.slice(0, -1));
  };
  
  const handleSubmitAnswer = () => {
    if (!currentProblem || userAnswer === '') return;
    
    const timeTaken = (Date.now() - problemStartTimeRef.current) / 1000;
    const isCorrect = userAnswer === currentProblem.correctAnswer.toString();
    
    if (isCorrect) {
      // Respuesta correcta
      const newAnswer: UserAnswer = {
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswer,
        isCorrect: true,
        status: 'correct',
        attempts: config.maxAttemptsPerProblem - remainingAttempts + 1,
        timeTaken,
        timestamp: Date.now()
      };
      
      setUserAnswers(prev => [...prev, newAnswer]);
      setScore(prev => prev + 1);
      
      pauseTimer();
      moveToNextProblem();
    } else {
      // Respuesta incorrecta
      if (remainingAttempts > 1) {
        // Todavía tiene intentos
        setRemainingAttempts(prev => prev - 1);
        
        // Opcional: Mostrar feedback de error
        
      } else {
        // Se acabaron los intentos
        const newAnswer: UserAnswer = {
          problemId: currentProblem.id,
          problem: currentProblem,
          userAnswer,
          isCorrect: false,
          status: 'incorrect',
          attempts: config.maxAttemptsPerProblem,
          timeTaken,
          timestamp: Date.now()
        };
        
        setUserAnswers(prev => [...prev, newAnswer]);
        pauseTimer();
        
        // Mostrar explicación si está habilitado
        if (config.showExplanations) {
          setExerciseState('explanation');
        } else {
          moveToNextProblem();
        }
      }
    }
  };
  
  // Manejo del fin del temporizador
  const handleTimerEnd = () => {
    if (!currentProblem) return;
    
    const timeTaken = (Date.now() - problemStartTimeRef.current) / 1000;
    
    const newAnswer: UserAnswer = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer: userAnswer || '',
      isCorrect: false,
      status: 'timeout',
      attempts: config.maxAttemptsPerProblem - remainingAttempts + 1,
      timeTaken,
      timestamp: Date.now()
    };
    
    setUserAnswers(prev => [...prev, newAnswer]);
    pauseTimer();
    
    // Mostrar explicación si está habilitado
    if (config.showExplanations) {
      setExerciseState('explanation');
    } else {
      moveToNextProblem();
    }
  };
  
  // Continuar después de explicación
  const handleContinueAfterExplanation = () => {
    moveToNextProblem();
  };
  
  // Avanzar al siguiente problema
  const moveToNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      // Pasar al siguiente problema
      setCurrentProblemIndex(prev => prev + 1);
      setUserAnswer('');
      setExerciseState('in-progress');
    } else {
      // Finalizar ejercicio
      finishExercise();
    }
  };
  
  // Finalizar el ejercicio
  const finishExercise = async () => {
    pauseTimer();
    
    // Calcular tiempo total
    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    
    // Guardar resultados
    try {
      await saveExerciseResult({
        module: 'addition',
        score,
        totalProblems: problems.length,
        timeSpent: totalTime,
        settings: config,
        userAnswers,
        timestamp: Date.now()
      });
      
      console.log('Ejercicio guardado correctamente');
    } catch (err) {
      console.error('Error al guardar los resultados:', err);
    }
    
    setExerciseState('completed');
  };
  
  // Reiniciar ejercicio
  const handleRestartExercise = () => {
    setProblems([]);
    setCurrentProblemIndex(0);
    setUserAnswer('');
    setUserAnswers([]);
    setScore(0);
    setExerciseState('ready');
    
    // Volver a cargar problemas (se hace mediante el efecto)
  };
  
  // Renderizar contenido según el estado
  const renderContent = () => {
    switch (exerciseState) {
      case 'ready':
        return (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Preparando ejercicio...</p>
          </div>
        );
        
      case 'in-progress':
        return currentProblem ? (
          <>
            <ProblemDisplay 
              problem={currentProblem}
              userAnswer={userAnswer}
              isShowingAnswer={false}
              timeLeft={config.hasTimeLimit ? timeLeft : null}
              isTimerActive={isTimerActive}
              maxTime={config.timeLimit || 0}
              remainingAttempts={config.maxAttemptsPerProblem > 1 ? remainingAttempts : undefined}
              showHint={config.showHints && remainingAttempts < config.maxAttemptsPerProblem}
            />
            
            <NumericKeypad 
              onNumberClick={handleNumberClick}
              onBackspaceClick={handleBackspaceClick}
              onSubmitClick={handleSubmitAnswer}
              currentAnswer={userAnswer}
              disabled={!currentProblem}
              showCheckButton={true}
            />
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Problema {currentProblemIndex + 1} de {problems.length}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p>No hay problemas disponibles</p>
          </div>
        );
        
      case 'explanation':
        return (
          <ExplanationPanel
            problem={currentProblem}
            userAnswer={userAnswer}
            onContinue={handleContinueAfterExplanation}
          />
        );
        
      case 'completed':
        return (
          <ResultsBoard
            userAnswers={userAnswers}
            totalProblems={problems.length}
            score={score}
            onRestart={handleRestartExercise}
            onReturn={() => {
              // Navegar de vuelta al menú principal (implementar según sea necesario)
            }}
          />
        );
        
      default:
        return <div>Estado desconocido</div>;
    }
  };
  
  return (
    <Card className="addition-exercise-container max-w-4xl mx-auto">
      <CardContent className="p-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
}