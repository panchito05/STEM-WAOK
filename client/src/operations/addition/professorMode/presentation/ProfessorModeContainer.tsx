import React, { useEffect, useState } from 'react';
import { 
  ProfessorModeState,
  ProfessorModeDisplayMode 
} from '../domain/ProfessorModeStateMachine';
import { ProfessorModeSettings } from '../../domain/AdditionSettings';
import { ProfessorStudentAnswer } from '../../domain/AdditionResult';
import { stateManager } from '../application/ProfessorModeStateManager';
import { debugPanel } from '../infrastructure/DebugPanel';
import { eventBus } from '../../infrastructure/EventBus';
import ProfessorModeDebugToolbar from './ProfessorModeDebugToolbar';

// Importar los componentes de UI específicos
// Estos serían los componentes existentes que se comunicarían ahora a través del stateManager
// Por ejemplo:
// import ProfessorProblemDisplay from '../../components/ProfessorProblemDisplay';
// import ProfessorExplanation from '../../components/ProfessorExplanation';
// import ProfessorResultsBoard from '../../components/ProfessorResultsBoard';
// import ProfessorModeReview from '../../components/ProfessorModeReview';

/**
 * Props para el contenedor del Modo Profesor
 */
interface ProfessorModeContainerProps {
  /**
   * Configuración inicial
   */
  initialSettings: ProfessorModeSettings;
  
  /**
   * Cantidad de problemas a generar
   */
  problemCount?: number;
  
  /**
   * Si se debe mostrar el panel de depuración
   */
  enableDebugPanel?: boolean;
  
  /**
   * Callback cuando finaliza la sesión
   */
  onSessionEnd?: () => void;
  
  /**
   * Callback cuando ocurre un error
   */
  onError?: (error: Error) => void;
}

/**
 * Contenedor principal del Modo Profesor
 * Utiliza el gestor de estado para coordinar todos los componentes
 */
export const ProfessorModeContainer: React.FC<ProfessorModeContainerProps> = ({
  initialSettings,
  problemCount = 5,
  enableDebugPanel = false,
  onSessionEnd,
  onError
}) => {
  // Estado local
  const [state, setState] = useState<ProfessorModeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(0);
  
  // Inicialización
  useEffect(() => {
    try {
      // Configurar callback para actualizar estado
      stateManager.options.onStateChange = (newState) => {
        setState(newState);
      };
      
      // Inicializar debugPanel si está habilitado
      if (enableDebugPanel) {
        debugPanel.enable();
      }
      
      // Escuchar errores
      const removeErrorListener = eventBus.on('professorMode:error', (data) => {
        setError(data.message);
        
        if (onError) {
          onError(new Error(data.message));
        }
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          setError(null);
        }, 5000);
      });
      
      // Iniciar sesión con problemas
      stateManager.initSession(initialSettings, problemCount);
      
      // Actualizar estado inicial
      setState(stateManager.getState());
      setLoading(false);
      
      // Configurar temporizador para actualizar tiempo total
      const timerInterval = setInterval(() => {
        setTimer(prev => prev + 1);
        
        // Actualizar tiempo total en el estado
        stateManager.dispatch({
          type: 'UPDATE_TOTAL_TIME',
          payload: { totalTime: state?.totalTime ? state.totalTime + 1000 : 1000 }
        });
      }, 1000);
      
      // Limpiar al desmontar
      return () => {
        removeErrorListener();
        clearInterval(timerInterval);
      };
    } catch (error) {
      setError('Error al inicializar Modo Profesor');
      setLoading(false);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Finalizar sesión
  const handleEndSession = () => {
    stateManager.endSession();
    
    if (onSessionEnd) {
      onSessionEnd();
    }
  };
  
  // Manejar respuesta del estudiante
  const handleStudentAnswer = (answer: ProfessorStudentAnswer) => {
    stateManager.submitAnswer(answer);
  };
  
  // Mostrar explicación
  const handleShowExplanation = (explanationText?: string, drawing?: string) => {
    stateManager.showExplanation(explanationText, drawing);
  };
  
  // Pasar al siguiente problema
  const handleNextProblem = () => {
    stateManager.nextProblem();
  };
  
  // Volver al problema anterior
  const handlePreviousProblem = () => {
    stateManager.previousProblem();
  };
  
  // Mostrar resultados
  const handleShowResults = () => {
    stateManager.showResults();
  };
  
  // Iniciar revisión
  const handleStartReview = () => {
    stateManager.startReview();
  };
  
  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  // Si no hay estado, mostrar mensaje
  if (!state) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <p className="font-bold">Advertencia</p>
        <p>No se pudo cargar el estado del Modo Profesor</p>
      </div>
    );
  }
  
  // Renderizar componente según modo actual
  return (
    <div className="professor-mode-container">
      {/* Barra de estado */}
      <div className="flex justify-between bg-gray-100 p-2 mb-4 rounded-lg">
        <div>
          <span className="mr-4">
            <strong>Modo:</strong> {state.displayMode}
          </span>
          <span className="mr-4">
            <strong>Problema:</strong> {state.currentProblemIndex + 1} de {state.problems.length}
          </span>
          <span>
            <strong>Tiempo:</strong> {Math.floor(state.totalTime / 60000)}:{Math.floor((state.totalTime % 60000) / 1000).toString().padStart(2, '0')}
          </span>
        </div>
        <div>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            onClick={handleEndSession}
          >
            Finalizar Sesión
          </button>
        </div>
      </div>
      
      {/* Contenido principal según el modo */}
      <div className="professor-mode-content">
        {/* Modo Problema */}
        {state.displayMode === ProfessorModeDisplayMode.PROBLEM && state.problems.length > 0 && (
          <div>
            {/* Aquí iría el componente de visualización de problema */}
            {/* Por ejemplo: */}
            {/* <ProfessorProblemDisplay
              problem={state.problems[state.currentProblemIndex]}
              onSubmitAnswer={handleStudentAnswer}
              onRequestExplanation={handleShowExplanation}
            /> */}
            
            {/* Contenido temporal para demostración */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Problema {state.currentProblemIndex + 1}</h2>
              <div className="text-3xl mb-6">
                {state.problems[state.currentProblemIndex].operands.join(' + ')} = ?
              </div>
              <div className="flex space-x-4">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => handleStudentAnswer({
                    problemId: state.problems[state.currentProblemIndex].id,
                    userAnswer: state.problems[state.currentProblemIndex].correctAnswer,
                    isCorrect: true,
                    timestamp: Date.now(),
                    showExplanation: false
                  })}
                >
                  Respuesta Correcta
                </button>
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                  onClick={() => handleStudentAnswer({
                    problemId: state.problems[state.currentProblemIndex].id,
                    userAnswer: state.problems[state.currentProblemIndex].correctAnswer + 1,
                    isCorrect: false,
                    timestamp: Date.now(),
                    showExplanation: false
                  })}
                >
                  Respuesta Incorrecta
                </button>
                <button
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                  onClick={() => handleShowExplanation('Explicación de ejemplo para el problema.')}
                >
                  Mostrar Explicación
                </button>
              </div>
              <div className="mt-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                  onClick={handlePreviousProblem}
                  disabled={state.currentProblemIndex === 0}
                >
                  Anterior
                </button>
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  onClick={handleNextProblem}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modo Explicación */}
        {state.displayMode === ProfessorModeDisplayMode.EXPLANATION && (
          <div>
            {/* Aquí iría el componente de explicación */}
            {/* Por ejemplo: */}
            {/* <ProfessorExplanation
              problem={state.problems[state.currentProblemIndex]}
              explanation={(state as any).explanationText}
              drawing={(state as any).activeDrawing}
              onContinue={handleNextProblem}
            /> */}
            
            {/* Contenido temporal para demostración */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Explicación</h2>
              <p className="text-lg mb-6">
                {(state as any).explanationText || 'No hay explicación disponible.'}
              </p>
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                onClick={handleNextProblem}
              >
                Continuar
              </button>
            </div>
          </div>
        )}
        
        {/* Modo Resultados */}
        {state.displayMode === ProfessorModeDisplayMode.RESULTS && (
          <div>
            {/* Aquí iría el componente de resultados */}
            {/* Por ejemplo: */}
            {/* <ProfessorResultsBoard
              problems={state.problems}
              answers={state.studentAnswers}
              statistics={(state as any).statistics}
              onReview={handleStartReview}
              onFinish={handleEndSession}
            /> */}
            
            {/* Contenido temporal para demostración */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Resultados</h2>
              <div className="mb-6">
                <p><strong>Problemas totales:</strong> {state.problems.length}</p>
                <p><strong>Respuestas correctas:</strong> {state.studentAnswers.filter(a => a.isCorrect).length}</p>
                <p><strong>Respuestas incorrectas:</strong> {state.studentAnswers.filter(a => !a.isCorrect).length}</p>
                <p><strong>Precisión:</strong> {
                  state.studentAnswers.length > 0
                    ? Math.round((state.studentAnswers.filter(a => a.isCorrect).length / state.studentAnswers.length) * 100)
                    : 0
                }%</p>
              </div>
              <div className="flex space-x-4">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={handleStartReview}
                >
                  Revisar Problemas
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  onClick={handleEndSession}
                >
                  Finalizar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modo Revisión */}
        {state.displayMode === ProfessorModeDisplayMode.REVIEW && (
          <div>
            {/* Aquí iría el componente de revisión */}
            {/* Por ejemplo: */}
            {/* <ProfessorModeReview
              problems={state.problems}
              answers={state.studentAnswers}
              currentIndex={state.currentProblemIndex}
              onPrevious={handlePreviousProblem}
              onNext={handleNextProblem}
              onFinish={() => stateManager.showResults()}
            /> */}
            
            {/* Contenido temporal para demostración */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Revisión - Problema {state.currentProblemIndex + 1}</h2>
              <div className="text-xl mb-4">
                {state.problems[state.currentProblemIndex].operands.join(' + ')} = {state.problems[state.currentProblemIndex].correctAnswer}
              </div>
              <div className="mb-6">
                {state.studentAnswers.find(a => a.problemId === state.problems[state.currentProblemIndex].id) ? (
                  <div>
                    <p><strong>Respuesta del estudiante:</strong> {
                      state.studentAnswers.find(a => a.problemId === state.problems[state.currentProblemIndex].id)?.userAnswer
                    }</p>
                    <p><strong>Correcta:</strong> {
                      state.studentAnswers.find(a => a.problemId === state.problems[state.currentProblemIndex].id)?.isCorrect
                        ? 'Sí'
                        : 'No'
                    }</p>
                  </div>
                ) : (
                  <p>No hay respuesta para este problema.</p>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  onClick={handlePreviousProblem}
                  disabled={state.currentProblemIndex === 0}
                >
                  Anterior
                </button>
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  onClick={handleNextProblem}
                  disabled={state.currentProblemIndex === state.problems.length - 1}
                >
                  Siguiente
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={handleShowResults}
                >
                  Volver a Resultados
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Panel de depuración */}
      {enableDebugPanel && <ProfessorModeDebugToolbar />}
    </div>
  );
};

export default ProfessorModeContainer;