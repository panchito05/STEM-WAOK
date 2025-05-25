import React, { useState, useCallback, useEffect } from 'react';
import { AdditionProblem } from '../../types';
import { CloseButton } from './CloseButton';
import { DrawingArea } from './DrawingArea';
import { useProgress } from '../../../../context/ProgressContext';
import { ProfessorLayoutProvider, useProfessorLayout } from './ProfessorLayoutContext';
import { Button } from '../../../../components/ui/button';
import { Move } from 'lucide-react';

interface ProfessorModeProps {
  problem: AdditionProblem;
  onClose: () => void;
  onCorrectAnswer: (wasCorrect: boolean) => void;
  showVerticalFormat?: boolean;
  settings: {
    maxAttempts: number;
    enableCompensation: boolean;
  };
}

// Componente interno que usa el contexto
const ProfessorModeContent: React.FC<ProfessorModeProps> = ({
  problem,
  onClose,
  onCorrectAnswer,
  showVerticalFormat = true,
  settings
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exerciseStartTime, setExerciseStartTime] = useState<number>(0);
  const [problemHistory, setProblemHistory] = useState<Array<{
    problem: AdditionProblem;
    userAnswer: number;
    isCorrect: boolean;
    attempts: number;
    timeSpent: number;
  }>>([]);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [exerciseStats, setExerciseStats] = useState({
    totalTime: 0,
    totalProblems: 0,
    correctAnswers: 0,
    totalAttempts: 0,
    revealedAnswers: 0
  });

  // Usar el contexto para el layout
  const { moveToNextPosition, getPanelClasses, getColorsPosition } = useProfessorLayout();
  const { saveExerciseResult } = useProgress();

  useEffect(() => {
    setExerciseStartTime(Date.now());
  }, []);

  const saveExerciseDataLikeNormalMode = useCallback((stats: any, history: any[]) => {
    const exerciseData = {
      operation: 'addition' as const,
      difficulty: 'medium',
      totalProblems: stats.totalProblems,
      correctAnswers: stats.correctAnswers,
      incorrectAnswers: stats.totalProblems - stats.correctAnswers,
      totalTime: stats.totalTime,
      averageTime: stats.totalProblems > 0 ? Math.round(stats.totalTime / stats.totalProblems) : 0,
      accuracy: stats.totalProblems > 0 ? Math.round((stats.correctAnswers / stats.totalProblems) * 100) : 0,
      timestamp: Date.now(),
      exerciseType: 'professor',
      details: {
        problemHistory: history,
        settings: settings
      }
    };

    console.log('💾 [PROFESSOR] Guardando datos del ejercicio:', exerciseData);
    saveExerciseResult(exerciseData);
  }, [saveExerciseResult, settings]);

  const checkAnswer = useCallback(() => {
    if (isProcessing || userAnswer.trim() === '') return;

    setIsProcessing(true);
    const userNum = parseInt(userAnswer);
    const correctAnswer = problem.operands.reduce((sum, operand) => sum + operand, 0);
    const currentAttempts = attempts + 1;
    const problemTimeSpent = Math.floor((Date.now() - exerciseStartTime) / 1000);

    setAttempts(currentAttempts);

    if (userNum === correctAnswer) {
      setIsCorrect(true);
      
      setTimeout(() => {
        const problemData = {
          problem: problem,
          userAnswer: userNum,
          isCorrect: true,
          attempts: currentAttempts,
          timeSpent: problemTimeSpent
        };

        setProblemHistory(prev => [...prev, problemData]);
        
        setExerciseStats(prev => ({
          ...prev,
          totalProblems: prev.totalProblems + 1,
          correctAnswers: prev.correctAnswers + 1,
          totalAttempts: prev.totalAttempts + currentAttempts,
          totalTime: prev.totalTime + problemTimeSpent
        }));

        if (problemHistory.length + 1 >= 3) {
          const finalStats = {
            totalTime: Math.floor((Date.now() - exerciseStartTime) / 1000),
            totalProblems: problemHistory.length + 1,
            correctAnswers: exerciseStats.correctAnswers + 1,
            totalAttempts: exerciseStats.totalAttempts + currentAttempts,
            revealedAnswers: 0
          };
          
          saveExerciseDataLikeNormalMode(finalStats, [...problemHistory, problemData]);
          setExerciseCompleted(true);
        } else {
          onCorrectAnswer(true);
        }
      }, 1000);
    } else {
      if (currentAttempts >= settings.maxAttempts) {
        const problemData = {
          problem: problem,
          userAnswer: userNum,
          isCorrect: false,
          attempts: currentAttempts,
          timeSpent: problemTimeSpent
        };

        setProblemHistory(prev => [...prev, problemData]);

        setExerciseStats(prev => ({
          ...prev,
          totalProblems: prev.totalProblems + 1,
          correctAnswers: prev.correctAnswers,
          totalAttempts: prev.totalAttempts + currentAttempts,
          totalTime: prev.totalTime + problemTimeSpent
        }));

        setTimeout(() => {
          setIsProcessing(false);
          
          if (problemHistory.length + 1 >= 3) {
            const finalStats = {
              totalTime: Math.floor((Date.now() - exerciseStartTime) / 1000),
              totalProblems: problemHistory.length + 1,
              correctAnswers: exerciseStats.correctAnswers,
              totalAttempts: exerciseStats.totalAttempts + currentAttempts,
              revealedAnswers: 0
            };
            
            saveExerciseDataLikeNormalMode(finalStats, [...problemHistory, problemData]);
            setExerciseCompleted(true);
          } else {
            onCorrectAnswer(false);
          }
        }, 1000);
      } else {
        setIsCorrect(false);
        setTimeout(() => {
          setIsProcessing(false);
          setIsCorrect(null);
          setUserAnswer('');
        }, 1000);
      }
    }
  }, [userAnswer, problem, attempts, isProcessing, exerciseStartTime, problemHistory, exerciseStats, settings, saveExerciseDataLikeNormalMode, onCorrectAnswer]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      checkAnswer();
    }
  }, [checkAnswer, isProcessing]);

  const resetExercise = () => {
    setUserAnswer('');
    setAttempts(0);
    setIsCorrect(null);
    setIsProcessing(false);
    setExerciseStartTime(Date.now());
  };

  const getResponsiveClasses = () => {
    try {
      const baseClasses = "bg-white border-gray-200 p-3 lg:p-4 z-40 shadow-lg transition-all duration-300 ease-in-out";
      const mobileClasses = "fixed bottom-0 left-0 right-0 border-t-2 rounded-t-xl";
      const desktopClasses = getPanelClasses();
      
      // Verificar que las clases de escritorio son válidas
      if (!desktopClasses || desktopClasses.trim() === '') {
        console.warn('⚠️ [PANEL] Clases de desktop inválidas, usando fallback');
        return `${baseClasses} ${mobileClasses} lg:fixed lg:border-2 lg:rounded-xl lg:top-4 lg:right-4`;
      }
      
      return `${baseClasses} ${mobileClasses} lg:fixed lg:border-2 lg:rounded-xl ${desktopClasses}`;
    } catch (error) {
      console.error('🚨 [PANEL] Error generando clases responsivas:', error);
      return "bg-white border-gray-200 p-3 lg:p-4 z-40 shadow-lg fixed bottom-0 left-0 right-0 border-t-2 rounded-t-xl lg:top-4 lg:right-4 lg:border-2 lg:rounded-xl";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center">
      <div className="relative w-full h-full">
        <CloseButton onClick={onClose} />
        
        {/* Canvas de dibujo con posición de colores sincronizada */}
        <DrawingArea 
          problem={problem} 
          colorsPosition={getColorsPosition()}
        />
        
        {/* Panel de control con posición sincronizada */}
        <div className={getResponsiveClasses()}>
          <div className="space-y-4">
            {/* Botón Mover - solo visible en desktop */}
            <div className="hidden lg:flex justify-end">
              <Button
                onClick={moveToNextPosition}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Move className="w-4 h-4" />
                Mover
              </Button>
            </div>

            {/* Problema matemático */}
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
                {showVerticalFormat ? (
                  <div className="flex flex-col items-center space-y-1">
                    {problem.operands.map((operand, index) => (
                      <div key={index} className="flex items-center">
                        {index === problem.operands.length - 1 && (
                          <span className="mr-2">+</span>
                        )}
                        <span>{operand}</span>
                      </div>
                    ))}
                    <div className="border-t-2 border-gray-400 w-20"></div>
                  </div>
                ) : (
                  <span>
                    {problem.operands.join(' + ')} = ?
                  </span>
                )}
              </div>

              {/* Input y validación */}
              <div className="space-y-3">
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-32 text-xl lg:text-2xl text-center border-2 border-gray-300 rounded-lg py-2 px-3 focus:border-blue-500 focus:outline-none"
                  disabled={isProcessing}
                  placeholder="?"
                />

                <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 justify-center items-center">
                  <Button
                    onClick={checkAnswer}
                    disabled={isProcessing || userAnswer.trim() === ''}
                    className="w-full lg:w-auto px-6 py-2"
                  >
                    {isProcessing ? 'Verificando...' : 'Verificar'}
                  </Button>
                </div>

                {/* Feedback visual */}
                {isCorrect === true && (
                  <div className="text-green-600 font-bold text-lg lg:text-xl">
                    ¡Correcto! 🎉
                  </div>
                )}
                {isCorrect === false && (
                  <div className="text-red-600 font-bold text-lg lg:text-xl">
                    Incorrecto. Intentos: {attempts}/{settings.maxAttempts}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal con el Provider
export const ProfessorModeModular: React.FC<ProfessorModeProps> = (props) => {
  return (
    <ProfessorLayoutProvider initialPosition="position2">
      <ProfessorModeContent {...props} />
    </ProfessorLayoutProvider>
  );
};