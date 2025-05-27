import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, SkipForward, Eye } from 'lucide-react';
import { ExerciseProvider, useExerciseContext } from './context/ExerciseContext';
import { Problem, UserAnswer } from './types';
import ProblemDisplay from './components/ProblemDisplay';
import NumericKeypad from './components/NumericKeypad';
import ResultsBoard from './components/ResultsBoard';
import ExplanationPanel from './components/ExplanationPanel';
import { useExerciseTimer } from './hooks/useExerciseTimer';
import { useTranslation } from './hooks/useTranslation';
import { useStore } from '@/store/store';

// Componente interno que usa el contexto del ejercicio
const Exercise: React.FC = () => {
  const { state, updateAnswer, submitAnswer, skipProblem, showSolution, nextProblem } = useExerciseContext();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  // Obtener el problema actual
  const currentProblem = state.problems[state.currentProblemIndex];
  
  // Configurar el temporizador global
  const globalTimer = useExerciseTimer({
    initialTime: state.settings.hasTimeLimit ? state.settings.timeLimit : 0,
    autoStart: state.settings.hasTimeLimit && state.isActive,
    onExpire: () => {
      // Cuando expire el temporizador global, terminar el ejercicio
      // El contexto manejará la finalización y guardado del ejercicio
    }
  });
  
  // Configurar el temporizador por problema
  const problemTimer = useExerciseTimer({
    initialTime: state.settings.hasPerProblemTimer ? state.settings.problemTimeLimit : 0,
    autoStart: state.settings.hasPerProblemTimer && state.isActive && !state.showExplanation,
    onExpire: () => {
      // Al expirar, mostrar la explicación con la respuesta correcta
      skipProblem();
    }
  });
  
  // Reiniciar el temporizador por problema cuando cambie el problema
  useEffect(() => {
    if (state.settings.hasPerProblemTimer && state.isActive && !state.showExplanation) {
      problemTimer.resetTimer(state.settings.problemTimeLimit);
    }
  }, [state.currentProblemIndex, state.showExplanation, state.isActive, state.settings.hasPerProblemTimer, state.settings.problemTimeLimit]);
  
  // Manejar click en número
  const handleNumberClick = (value: string | number) => {
    updateAnswer(value);
  };
  
  // Manejar retroceso secuencial (botón >) que permite borrar dígitos y saltar entre contenedores
  const handleSequentialBackspace = () => {
    // Si el estado actual del componente es una cadena vacía, podemos informar al contexto
    // de que queremos retroceder al contenedor anterior (si es que estamos usando contenedores)
    if (state.currentAnswer === '') {
      // Aquí podríamos implementar lógica adicional para saltar entre contenedores de dígitos
      // Por ahora, simplemente enviamos un evento de retroceso al contexto
      console.log("Retroceso secuencial activado - contenedor vacío");
      // Como este componente no usa contenedores múltiples, no necesitamos hacer nada más
    } else {
      // Si hay texto, borramos el último caracter (mismo comportamiento que handleNumberClick)
      const updatedAnswer = String(state.currentAnswer).slice(0, -1);
      updateAnswer(updatedAnswer);
    }
  };
  
  // Manejar envío de respuesta
  const handleSubmit = () => {
    const isCorrect = submitAnswer();
    
    // Si es correcta y no hay explicación, pasar al siguiente problema
    if (isCorrect && !state.settings.showExplanations) {
      setTimeout(() => {
        nextProblem();
      }, 300);
    }
  };
  
  // Manejar click en continuar en la explicación
  const handleContinue = () => {
    nextProblem();
  };
  
  // Manejar click en reiniciar
  const handleRetry = () => {
    // Reiniciar ejercicio con las mismas configuraciones
    location.reload();
  };
  
  // Manejar click en volver al inicio
  const handleHome = () => {
    setLocation('/');
  };
  
  // Renderizar pantalla de resultados cuando el ejercicio está completo
  if (state.isComplete) {
    // Calcular el número real de problemas respondidos
    const actualTotalProblems = state.userAnswers.length;
    // Usar el máximo entre el total definido en problems y los que realmente contestó el usuario
    const finalTotalProblems = Math.max(state.problems.length, actualTotalProblems);
    
    return (
      <ResultsBoard
        score={state.score}
        totalProblems={finalTotalProblems}
        userAnswers={state.userAnswers}
        difficulty={state.settings.difficulty}
        timeSpent={state.settings.hasTimeLimit ? state.settings.timeLimit - globalTimer.timeRemaining : 0}
        onRetry={handleRetry}
        onHome={handleHome}
      />
    );
  }
  
  // Mientras no haya problemas, mostrar cargando
  if (!currentProblem) {
    return (
      <div className="w-full flex justify-center items-center p-10">
        <p className="text-xl font-medium">Cargando ejercicio...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-6 w-full max-w-3xl mx-auto">
      {/* Encabezado con temporizadores */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium text-lg mr-2">
            {state.currentProblemIndex + 1} / {state.problems.length}
          </span>
        </div>
        
        {/* Temporizador global */}
        {state.settings.hasTimeLimit && (
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <Timer className="w-5 h-5 mr-1" />
            <span className="font-mono">
              {t('timeRemaining', { 
                defaultValue: 'Tiempo restante: {{time}}', 
                values: { time: globalTimer.formattedTime } 
              })}
            </span>
          </div>
        )}
      </div>
      
      {/* Problema */}
      <ProblemDisplay 
        problem={currentProblem} 
        answer={state.currentAnswer} 
      />
      
      {/* Temporizador de problema */}
      {state.settings.hasPerProblemTimer && !state.showExplanation && (
        <div className="flex justify-center">
          <div className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-sm">
            <Timer className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-600 dark:text-blue-400 font-mono">
              {problemTimer.formattedTime}
            </span>
          </div>
        </div>
      )}
      
      {/* Panel de explicación o entrada de respuesta */}
      {state.showExplanation ? (
        <ExplanationPanel 
          problem={currentProblem}
          userAnswer={state.currentAnswer}
          isCorrect={state.userAnswers.find(a => a.problemId === currentProblem.id)?.isCorrect || false}
          onContinue={handleContinue}
        />
      ) : (
        <>
          {/* Teclado numérico */}
          <NumericKeypad 
            onNumberClick={handleNumberClick} 
            onSubmit={handleSubmit}
            disabled={!state.isActive}
            answer={state.currentAnswer}
            allowDecimals={currentProblem.allowDecimals || false}
            onSequentialBackspace={handleSequentialBackspace}
          />
          
          {/* Botones de ayuda */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={skipProblem}
              disabled={!state.isActive}
              className="flex items-center"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              {t('skip', { defaultValue: 'Saltar' })}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={showSolution}
              disabled={!state.isActive}
              className="flex items-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              {t('showSolution', { defaultValue: 'Mostrar solución' })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// Componente principal que proporciona el contexto
const ModernSubtractionExercise: React.FC = () => {
  const settings = useStore(state => 
    state.currentProfile?.moduleSettings?.subtraction || 
    { 
      difficulty: 'easy', 
      problemCount: 5,
      hasTimeLimit: false,
      timeLimit: 300,
      hasPerProblemTimer: false,
      problemTimeLimit: 30,
      showExplanations: true,
      language: 'es'
    }
  );
  
  return (
    <Card className="w-full p-0 overflow-hidden">
      <CardContent className="p-6">
        <ExerciseProvider>
          <Exercise />
        </ExerciseProvider>
      </CardContent>
    </Card>
  );
};

export default ModernSubtractionExercise;