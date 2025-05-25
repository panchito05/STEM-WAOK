import React, { useState, useCallback, useEffect } from 'react';
import { AdditionProblem } from '../types';
import { CloseButton } from './professor/CloseButton';
import { DrawingArea } from './professor/DrawingArea';
import { useProgress } from '../../../context/ProgressContext';

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

// Componente completamente refactorizado que funciona
export const ProfessorMode: React.FC<ProfessorModeProps> = ({
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
  const [position, setPosition] = useState<'top-left' | 'top-right' | 'bottom-right' | 'bottom-left'>('top-left');
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

  // Obtener función de guardado del contexto
  const { saveExerciseResult } = useProgress();

  // FUNCIÓN PARA GUARDAR DATOS EXACTAMENTE COMO EL MODO NORMAL
  const saveExerciseDataLikeNormalMode = async (stats: any, history: any[]) => {
    try {
      // Crear los problemas capturados exactamente como el modo normal
      const problemasCapturados = history.map((item, index) => ({
        problem: `${item.problem.operands.join(' + ')} = ${calculateCorrectAnswer(item.problem)}`,
        userAnswer: item.userAnswer.toString(),
        correctAnswer: calculateCorrectAnswer(item.problem).toString(),
        isCorrect: item.isCorrect,
        attempts: item.attempts,
        timeSpent: item.timeSpent,
        level: "beginner",
        problemId: `profesor_${index + 1}`,
        timestamp: Date.now() - ((history.length - index) * item.timeSpent * 1000)
      }));

      // Calcular estadísticas exactas
      const accuracy = stats.totalProblems > 0 ? Math.round((stats.correctAnswers / stats.totalProblems) * 100) : 0;
      const avgTimePerProblem = stats.totalProblems > 0 ? Math.round(stats.totalTime / stats.totalProblems) : 0;
      const avgAttempts = stats.totalProblems > 0 ? (stats.totalAttempts / stats.totalProblems).toFixed(1) : '1.0';

      // ESTRUCTURA EXACTA COMO EL MODO NORMAL - VERSIÓN 4.0
      const exerciseData = {
        operationId: "addition",
        date: new Date().toISOString(),
        score: stats.correctAnswers,
        totalProblems: stats.totalProblems,
        timeSpent: stats.totalTime,
        difficulty: "beginner",
        
        // Estadísticas precisas
        accuracy: accuracy,
        avgTimePerProblem: avgTimePerProblem,
        avgAttempts: parseFloat(avgAttempts),
        revealedAnswers: stats.revealedAnswers,
        
        // Datos extra con estructura clara - EXACTA COMO EL MODO NORMAL
        extra_data: {
          // Metadatos para trazabilidad
          version: "4.0",
          timestamp: Date.now(),
          exerciseId: `professor_mode_${Date.now()}`,
          exerciseType: "professor_mode_addition",
          source: "profesor_mode",
          
          // Almacenar los problemas en TODAS las ubicaciones posibles para máxima compatibilidad
          problemDetails: problemasCapturados,
          problems: problemasCapturados,
          capturedProblems: problemasCapturados,
          exactProblems: problemasCapturados,
          mathProblems: problemasCapturados,
          problemas: problemasCapturados,
          
          // Datos de la pantalla de resumen (screenshot data)
          screenshot: {
            scoreData: {
              score: { value: `${stats.correctAnswers} / ${stats.totalProblems}`, bgColor: "bg-blue-50", textColor: "text-indigo-600" },
              accuracy: { value: `${accuracy}%`, bgColor: "bg-green-50", textColor: "text-green-600" },
              avgTime: { value: `${avgTimePerProblem}s`, bgColor: "bg-purple-50", textColor: "text-purple-600" },
              avgAttempts: { value: avgAttempts, bgColor: "bg-amber-50", textColor: "text-amber-600" },
              revealed: { value: "0", bgColor: "bg-red-50", textColor: "text-red-600" },
              finalLevel: { value: "1", bgColor: "bg-teal-50", textColor: "text-teal-600" }
            },
            exactProblems: problemasCapturados
          },
          
          // Configuraciones usadas
          settings: {
            maxAttempts: settings.maxAttempts,
            enableCompensation: settings.enableCompensation,
            mode: "professor",
            showVerticalFormat: showVerticalFormat
          }
        }
      };

      console.log("🔥 MODO PROFESOR: Guardando ejercicio con datos:", exerciseData);
      
      // Guardar usando la misma función que el modo normal
      await saveExerciseResult(exerciseData);
      
      console.log("✅ MODO PROFESOR: Ejercicio guardado exitosamente en Progress and History");
      
    } catch (error) {
      console.error("❌ Error guardando ejercicio del Modo Profesor:", error);
    }
  };

  // Calcular respuesta correcta
  const calculateCorrectAnswer = useCallback((prob: AdditionProblem): number => {
    return prob.operands.reduce((sum, operand) => {
      const num = typeof operand === 'number' ? operand : parseFloat(operand.toString());
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, []);

  // Función de verificación mejorada con tracking de estadísticas
  const checkAnswer = useCallback(() => {
    if (!userAnswer.trim() || isProcessing) return;

    setIsProcessing(true);
    const currentAttempts = attempts + 1;
    setAttempts(currentAttempts);

    // Validar entrada
    const userNum = parseFloat(userAnswer);
    if (isNaN(userNum)) {
      setIsCorrect(false);
      setIsProcessing(false);
      return;
    }

    const correctAnswer = calculateCorrectAnswer(problem);
    const correct = Math.abs(userNum - correctAnswer) < 0.01;
    const problemStartTime = exerciseStartTime || Date.now();
    const problemTimeSpent = Math.round((Date.now() - problemStartTime) / 1000);
    
    setIsCorrect(correct);

    // SOLO guardar el problema cuando se complete (correcto o se agoten intentos)
    // NO guardarlo en cada intento
    
    if (correct) {
      // Guardar datos del problema SOLO cuando es correcto
      const problemData = {
        problem: problem,
        userAnswer: userNum,
        isCorrect: true,
        attempts: currentAttempts,
        timeSpent: problemTimeSpent
      };

      setProblemHistory(prev => [...prev, problemData]);

      // Actualizar estadísticas del ejercicio
      setExerciseStats(prev => ({
        ...prev,
        totalProblems: prev.totalProblems + 1,
        correctAnswers: prev.correctAnswers + 1,
        totalAttempts: prev.totalAttempts + currentAttempts,
        totalTime: prev.totalTime + problemTimeSpent
      }));

      setTimeout(() => {
        setIsProcessing(false);
        
        // Verificar si es el último problema (por ejemplo, problema 3 de 3)
        if (problemHistory.length + 1 >= 3) { // +1 porque acabamos de resolver uno más
          // GUARDAR DATOS ANTES DE COMPLETAR
          const finalStats = {
            totalTime: Math.floor((Date.now() - exerciseStartTime) / 1000),
            totalProblems: problemHistory.length + 1,
            correctAnswers: exerciseStats.correctAnswers + 1,
            totalAttempts: exerciseStats.totalAttempts + currentAttempts,
            revealedAnswers: 0
          };
          
          // Guardar ejercicio en Progress and History
          saveExerciseDataLikeNormalMode(finalStats, [...problemHistory, problemData]);
          
          setExerciseCompleted(true);
        } else {
          onCorrectAnswer(true);
        }
      }, 1000);
    } else {
      if (currentAttempts >= settings.maxAttempts) {
        // Guardar datos del problema SOLO cuando se agotan los intentos (incorrecto)
        const problemData = {
          problem: problem,
          userAnswer: userNum,
          isCorrect: false,
          attempts: currentAttempts,
          timeSpent: problemTimeSpent
        };

        setProblemHistory(prev => [...prev, problemData]);

        // Actualizar estadísticas del ejercicio
        setExerciseStats(prev => ({
          ...prev,
          totalProblems: prev.totalProblems + 1,
          correctAnswers: prev.correctAnswers, // No sumar porque es incorrecto
          totalAttempts: prev.totalAttempts + currentAttempts,
          totalTime: prev.totalTime + problemTimeSpent
        }));

        setTimeout(() => {
          setIsProcessing(false);
          
          // También verificar si era el último problema, aunque fuera incorrecto
          if (problemHistory.length + 1 >= 3) {
            // GUARDAR DATOS ANTES DE COMPLETAR (RESPUESTA INCORRECTA)
            const finalStats = {
              totalTime: Math.floor((Date.now() - exerciseStartTime) / 1000),
              totalProblems: problemHistory.length + 1,
              correctAnswers: exerciseStats.correctAnswers, // No sumar porque fue incorrecto
              totalAttempts: exerciseStats.totalAttempts + currentAttempts,
              revealedAnswers: 0
            };
            
            // Guardar ejercicio en Progress and History
            saveExerciseDataLikeNormalMode(finalStats, [...problemHistory, problemData]);
            
            setExerciseCompleted(true);
          } else {
            onCorrectAnswer(false);
          }
        }, 1000);
      } else {
        setTimeout(() => {
          setIsProcessing(false);
        }, 1500);
      }
    }
  }, [userAnswer, isProcessing, attempts, settings.maxAttempts, problem, calculateCorrectAnswer, onCorrectAnswer, exerciseStartTime, problemHistory.length]);

  // Reiniciar cuando cambia el problema
  useEffect(() => {
    setUserAnswer('');
    setAttempts(0);
    setIsCorrect(null);
    setIsProcessing(false);
  }, [problem.id]);

  // Teclas de atajo
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && userAnswer.trim() && !isProcessing) {
        event.preventDefault();
        checkAnswer();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [checkAnswer, userAnswer, isProcessing, onClose]);

  // Función para formatear tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Función para reiniciar ejercicio
  const restartExercise = () => {
    setExerciseCompleted(false);
    setProblemHistory([]);
    setExerciseStats({
      totalTime: 0,
      totalProblems: 0,
      correctAnswers: 0,
      totalAttempts: 0,
      revealedAnswers: 0
    });
    setUserAnswer('');
    setAttempts(0);
    setIsCorrect(null);
    setIsProcessing(false);
    setExerciseStartTime(Date.now());
  };

  // Función para mover el panel entre las cuatro esquinas (sentido horario)
  // Panel y colores se mueven sincronizadamente
  const movePanel = () => {
    // Secuencia sincronizada en sentido horario:
    // Posición 1: Panel=top-left + Colores=right
    // Posición 2: Panel=top-right + Colores=right  
    // Posición 3: Panel=bottom-right + Colores=left
    // Posición 4: Panel=bottom-left + Colores=left
    const positions: ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left')[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
    const currentIndex = positions.indexOf(position);
    const nextIndex = (currentIndex + 1) % positions.length;
    setPosition(positions[nextIndex]);
  };

  // Función para obtener las clases CSS según la posición - Solo para desktop
  const getPanelClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Clases responsivas del panel
  const getResponsiveClasses = () => {
    const baseClasses = "bg-white border-gray-200 p-3 lg:p-4 z-40 shadow-lg";
    const mobileClasses = "fixed bottom-0 left-0 right-0 w-full max-h-80 border-t overflow-y-auto";
    const desktopClasses = `lg:absolute lg:${getPanelClasses()} lg:max-w-sm lg:max-h-none lg:border lg:rounded-lg lg:overflow-visible lg:border-t-0`;
    
    return `${baseClasses} ${mobileClasses} ${desktopClasses}`;
  };

  // PANTALLA DE RESUMEN - Exactamente como en el modo normal
  if (exerciseCompleted) {
    const accuracy = exerciseStats.totalProblems > 0 ? Math.round((exerciseStats.correctAnswers / exerciseStats.totalProblems) * 100) : 0;
    const avgTime = exerciseStats.totalProblems > 0 ? Math.round(exerciseStats.totalTime / exerciseStats.totalProblems) : 0;
    const avgAttempts = exerciseStats.totalProblems > 0 ? (exerciseStats.totalAttempts / exerciseStats.totalProblems).toFixed(1) : '1.0';

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 overflow-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
            {/* Título */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Addition Exercise Complete!</h1>
              
              {/* Tiempo total */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(exerciseStats.totalTime)}</p>
              </div>
            </div>

            {/* Estadísticas en tarjetas - Primera fila */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Score</div>
                <div className="text-2xl text-indigo-600 font-semibold">
                  {exerciseStats.correctAnswers} / {exerciseStats.totalProblems}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Accuracy</div>
                <div className="text-2xl text-green-600 font-semibold">
                  {accuracy}%
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Avg. Time</div>
                <div className="text-2xl text-purple-600 font-semibold">
                  {avgTime}s
                </div>
              </div>
            </div>

            {/* Segunda fila */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Avg. Attempts</div>
                <div className="text-2xl text-amber-600 font-semibold">
                  {avgAttempts}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Revealed</div>
                <div className="text-2xl text-red-600 font-semibold">
                  {exerciseStats.revealedAnswers}
                </div>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Final Level</div>
                <div className="text-2xl text-teal-600 font-semibold">
                  1
                </div>
              </div>
            </div>

            {/* Problem Review */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Problem Review</h3>
              <div className="space-y-2">
                {problemHistory.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      item.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 mr-2">
                        (#{index + 1})
                      </span>
                      <span className="text-gray-900">
                        {item.problem.operands.join(' + ')} = {calculateCorrectAnswer(item.problem)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        Int: {item.attempts}; T: {item.timeSpent}s
                      </span>
                      {item.isCorrect ? (
                        <span className="text-green-600 text-xl">✓</span>
                      ) : (
                        <span className="text-red-600 text-xl">✗</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={restartExercise}
                className="bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium flex items-center"
              >
                ⚙️ Settings
              </button>
            </div>

            {/* Progress Saved */}
            <div className="text-center text-sm text-gray-600">
              <p>Progress Saved</p>
              <p className="font-medium">Score: {exerciseStats.correctAnswers}/{exerciseStats.totalProblems}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      <CloseButton onClose={onClose} />
      
      {/* Layout responsivo principal */}
      <div className="h-full w-full flex flex-col lg:flex-row overflow-hidden">
        {/* Área de dibujo - Ocupa todo el espacio en móvil/tablet */}
        <div className="flex-1 relative overflow-hidden">
          <DrawingArea 
            position={position === 'top-left' ? 'topLeft' as const : 
                     position === 'top-right' ? 'topRight' as const : 
                     position === 'bottom-left' ? 'bottomLeft' as const : 'bottomRight' as const} 
            problem={problem} 
          />
        </div>
        
        {/* Panel de control - Responsivo */}
        <div className="fixed bottom-0 left-0 right-0 w-full border-t overflow-y-auto lg:absolute lg:top-4 lg:right-4 lg:max-w-sm lg:border lg:rounded-lg lg:overflow-visible lg:border-t-0 bg-white border-gray-200 p-3 lg:p-4 z-40 shadow-lg lg:h-fit lg:max-h-[calc(100vh-2rem)]">
          {/* Botón para mover panel */}
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={movePanel}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              title="Mover panel a otra esquina"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Mover
            </button>
            <span className="text-xs text-gray-500">
              {position === 'top-right' ? '↗️' : 
               position === 'top-left' ? '↖️' : 
               position === 'bottom-left' ? '↙️' : '↘️'} {position}
            </span>
          </div>
          
          {/* Mostrar problema */}
          <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-md mb-2">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <span>Problema {problemHistory.length} de 3</span>
              </div>
              <div className={`text-sm font-medium ${
                attempts === 0 ? 'text-gray-600' :
                attempts >= settings.maxAttempts ? 'text-red-600 font-bold' :
                attempts > settings.maxAttempts * 0.7 ? 'text-orange-600' :
                'text-blue-600'
              }`}>
                Intentos: {attempts}/{settings.maxAttempts}
              </div>
            </div>
            
            {/* Problema matemático */}
            <div className="bg-gray-50 p-3 rounded border-2 border-dashed border-gray-200">
              <div className="font-mono text-4xl font-bold whitespace-pre select-none text-center">
                {problem.operands.map((op, index) => (
                  <span key={index}>
                    <span className="mx-1">{typeof op === 'number' ? op : parseFloat(op.toString())}</span>
                    {index < problem.operands.length - 1 && (
                      <span className="mx-2 text-blue-600 font-bold">+</span>
                    )}
                  </span>
                ))}
                <span className="mx-2">=</span>
                <span className="text-gray-400 italic">?</span>
              </div>
            </div>
          </div>
          
          {/* Campo de respuesta */}
          <div className="mb-2">
            <div className="flex items-center mb-1">
              <div className="font-medium mr-2">Respuesta:</div>
              {userAnswer.trim() && !isNaN(parseFloat(userAnswer)) && (
                <span className="text-green-600">✓</span>
              )}
            </div>
            
            <div className="flex">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isProcessing}
                placeholder={isProcessing ? 'Esperando...' : 'Escribe tu respuesta'}
                className={`flex-1 border rounded p-2 text-lg text-center min-h-[40px] transition-all duration-200 ${
                  isProcessing 
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                    : userAnswer.trim() && !isNaN(parseFloat(userAnswer))
                      ? 'bg-green-50 border-green-300 text-green-900 focus:border-green-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                autoFocus
              />
              
              <button
                onClick={() => setUserAnswer('')}
                disabled={isProcessing || !userAnswer.trim()}
                className="ml-2 p-2 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Borrar respuesta"
              >
                🗑️
              </button>
            </div>
          </div>
          
          {/* Botón de verificar */}
          <button
            onClick={checkAnswer}
            disabled={!userAnswer.trim() || isProcessing}
            className={`w-full mb-2 py-3 px-4 rounded-md font-medium text-base transition-all duration-200 flex items-center justify-center ${
              isProcessing
                ? 'bg-blue-500 text-white cursor-wait'
                : !userAnswer.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isCorrect === true
                    ? 'bg-green-600 text-white transform scale-105 shadow-lg'
                    : isCorrect === false
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:transform active:scale-95'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : isCorrect === true ? (
              <>✓ ¡Correcto! Excelente trabajo</>
            ) : isCorrect === false ? (
              <>✕ Incorrecto. Inténtalo de nuevo</>
            ) : (
              !userAnswer.trim() ? 'Escribe una respuesta primero' : 'Comprobar Respuesta'
            )}
          </button>
          
          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => setUserAnswer(userAnswer + num.toString())}
                disabled={isProcessing}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded p-3 text-lg font-medium text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            
            <button
              onClick={() => setUserAnswer(userAnswer + '.')}
              disabled={isProcessing || userAnswer.includes('.')}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-3 text-lg font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Punto decimal"
            >
              .
            </button>
            
            <button
              onClick={() => setUserAnswer(userAnswer + '0')}
              disabled={isProcessing}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded p-3 text-lg font-medium text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </button>
            
            <button
              onClick={() => setUserAnswer(userAnswer.slice(0, -1))}
              disabled={isProcessing || !userAnswer}
              className="bg-red-50 hover:bg-red-100 border border-red-200 rounded p-3 text-lg font-medium text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Borrar último dígito"
            >
              ⌫
            </button>
          </div>

          {/* Mensaje de progreso */}
          {attempts > 0 && attempts < settings.maxAttempts && !isProcessing && (
            <div className="mt-2 text-center text-sm text-gray-600">
              {settings.maxAttempts - attempts} intento{settings.maxAttempts - attempts !== 1 ? 's' : ''} restante{settings.maxAttempts - attempts !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorMode;