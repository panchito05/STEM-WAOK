// ModernAdditionExercise.tsx - Versión moderna y refactorizada del módulo de suma
import React from 'react';
// Importamos los componentes UI de Shadcn
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExerciseProvider, useExercise } from './context/ExerciseContext';
import { ModuleSettings } from './types';
import ProblemDisplay from './components/ProblemDisplay';
import NumericKeypad from './components/NumericKeypad';
// Importemos estos componentes cuando los creemos
// import ResultsBoard from './components/ResultsBoard';
// import ExplanationPanel from './components/ExplanationPanel';

// Componente interno que usa el contexto
function ExerciseContent() {
  const { 
    state, 
    currentProblem, 
    currentAnswer,
    problemIndex,
    totalProblems,
    remainingAttempts,
    timeLeft,
    score,
    setAnswer,
    submitAnswer,
    goToNextProblem,
    restartExercise,
    showExplanation,
    userAnswers
  } = useExercise();

  // Función para renderizar el contenido según el estado
  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg">Cargando ejercicio...</p>
          </div>
        );
        
      case 'problem-display':
        return (
          <>
            {/* Barra de progreso */}
            <div className="w-full mb-4">
              <div className="flex justify-between mb-1 text-sm">
                <span>Problema {problemIndex + 1} de {totalProblems}</span>
                {timeLeft !== null && (
                  <span>Tiempo: {Math.ceil(timeLeft)}s</span>
                )}
              </div>
              <Progress value={(problemIndex / totalProblems) * 100} />
            </div>
            
            {/* Visualización del problema */}
            {currentProblem && (
              <ProblemDisplay 
                problem={currentProblem} 
                userAnswer={currentAnswer}
                remainingAttempts={remainingAttempts}
              />
            )}
            
            {/* Teclado numérico */}
            <NumericKeypad
              onNumberClick={(value) => setAnswer(currentAnswer + value)}
              onBackspaceClick={() => setAnswer(currentAnswer.slice(0, -1))}
              onSubmitClick={submitAnswer}
              currentAnswer={currentAnswer}
              disabled={!currentProblem}
              showCheckButton={true}
            />
          </>
        );
        
      case 'feedback':
        const lastAnswer = userAnswers[problemIndex];
        const isCorrect = lastAnswer?.isCorrect || false;
        
        return (
          <div className="flex flex-col items-center">
            {/* Retroalimentación */}
            <div className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {isCorrect ? '¡Correcto!' : 'Incorrecto'}
            </div>
            
            {/* Problema y respuesta */}
            {currentProblem && (
              <div className="mb-4 text-center">
                <p className="text-lg mb-2">
                  {currentProblem.operands?.join(' + ')} = {currentProblem.correctAnswer}
                </p>
                <p>Tu respuesta: {currentAnswer}</p>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex gap-4 mt-4">
              {!isCorrect && (
                <Button 
                  variant="outline" 
                  onClick={showExplanation}
                >
                  Ver explicación
                </Button>
              )}
              <Button 
                onClick={goToNextProblem}
              >
                {problemIndex < totalProblems - 1 ? 'Siguiente problema' : 'Ver resultados'}
              </Button>
            </div>
          </div>
        );
        
      case 'explanation':
        return (
          <ExplanationPanel 
            problem={currentProblem} 
            userAnswer={currentAnswer}
            onContinue={goToNextProblem}
          />
        );
        
      case 'completed':
        return (
          <ResultsBoard 
            results={userAnswers}
            totalProblems={totalProblems}
            score={score}
            onRestart={restartExercise}
          />
        );
        
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="text-red-500 text-lg mb-4">
              Ha ocurrido un error al cargar el ejercicio.
            </div>
            <Button onClick={restartExercise}>
              Reintentar
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="exercise-container">
      {renderContent()}
    </div>
  );
}

// Componente principal que proporciona el contexto
export default function ModernAdditionExercise({ config }: { config: ModuleSettings }) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <ExerciseProvider settings={config}>
          <ExerciseContent />
        </ExerciseProvider>
      </CardContent>
    </Card>
  );
}