import React from 'react';
import { DivisionProblem } from '../../types';
import { SynchronizedLayoutProvider, useSynchronizedLayout } from './context/SynchronizedLayoutContext';
import { CloseButton } from './CloseButton';
import { DrawingArea } from './DrawingArea';

interface ProfessorModeProps {
  problem: DivisionProblem;
  onClose: () => void;
  onCorrectAnswer: (wasCorrect: boolean) => void;
  showVerticalFormat?: boolean;
  settings: {
    maxAttempts: number;
    enableCompensation: boolean;
  };
}

// Componente interno que usa el contexto sincronizado
const ProfessorModeContent: React.FC<ProfessorModeProps> = ({
  problem,
  onClose,
  onCorrectAnswer,
  showVerticalFormat = true,
  settings
}) => {
  const [userAnswer, setUserAnswer] = React.useState('');
  const [attempts, setAttempts] = React.useState(0);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [exerciseStartTime, setExerciseStartTime] = React.useState<number>(0);
  const [problemHistory, setProblemHistory] = React.useState<Array<{
    problem: DivisionProblem;
    userAnswer: number;
    isCorrect: boolean;
    attempts: number;
    timeSpent: number;
  }>>([]);
  const [exerciseCompleted, setExerciseCompleted] = React.useState(false);
  const [exerciseStats, setExerciseStats] = React.useState({
    totalTime: 0,
    totalProblems: 0,
    correctAnswers: 0,
    totalAttempts: 0,
    revealedAnswers: 0
  });
  const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(false);

  // Usar el contexto sincronizado - NUEVA ARQUITECTURA
  const { 
    currentLayout, 
    moveToNextLayout, 
    getPanelCSSClasses, 
    getColorPosition,
    getCurrentLayoutId 
  } = useSynchronizedLayout();

  // Inicializar ejercicio
  React.useEffect(() => {
    setIsCorrect(null);
    setIsProcessing(false);
    setExerciseStartTime(Date.now());
  }, []);

  const checkAnswer = React.useCallback(async () => {
    if (!userAnswer.trim() || isProcessing) return;

    setIsProcessing(true);
    const userNum = parseFloat(userAnswer.trim());
    const correctAnswer = problem.correctAnswer;
    const isAnswerCorrect = Math.abs(userNum - correctAnswer) < 0.001;
    const currentAttempts = attempts + 1;
    const problemTimeSpent = Math.floor((Date.now() - exerciseStartTime) / 1000);

    setAttempts(currentAttempts);

    if (isAnswerCorrect) {
      setIsCorrect(true);
      
      const problemData = {
        problem: problem,
        userAnswer: userNum,
        isCorrect: true,
        attempts: currentAttempts,
        timeSpent: problemTimeSpent
      };

      setProblemHistory(prev => [...prev, problemData]);

      setTimeout(() => {
        setIsProcessing(false);
        
        if (problemHistory.length + 1 >= 3) {
          const finalStats = {
            totalTime: Math.floor((Date.now() - exerciseStartTime) / 1000),
            totalProblems: problemHistory.length + 1,
            correctAnswers: exerciseStats.correctAnswers + 1,
            totalAttempts: exerciseStats.totalAttempts + currentAttempts,
            revealedAnswers: 0
          };
          
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
            
            setExerciseCompleted(true);
          } else {
            onCorrectAnswer(false);
          }
        }, 1500);
      } else {
        setIsCorrect(false);
        setTimeout(() => {
          setIsCorrect(null);
          setIsProcessing(false);
        }, 1500);
      }
    }
  }, [userAnswer, isProcessing, attempts, problem, exerciseStartTime, problemHistory, exerciseStats, settings, onCorrectAnswer]);

  // Mostrar indicador de posición actual para debugging
  const getPositionIndicator = () => {
    const indicators: Record<number, string> = {
      1: '↖️ TL',  // Top-Left
      2: '↗️ TR',  // Top-Right  
      3: '↘️ BR',  // Bottom-Right
      4: '↙️ BL'   // Bottom-Left
    };
    return indicators[getCurrentLayoutId()] || '❓';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative w-full h-full bg-white overflow-hidden">
        {/* Botón de cerrar */}
        <CloseButton onClose={onClose} />

        {/* Área de dibujo - Ahora recibe la posición de colores del contexto */}
        <DrawingArea 
          problem={problem}
          colorPosition={getColorPosition()} 
        />
        
        {/* Panel de control - Usa las clases CSS del contexto sincronizado */}
        <div 
          className={`fixed bottom-0 left-0 right-0 w-full border-t overflow-y-auto lg:absolute lg:max-w-sm lg:border lg:rounded-lg lg:overflow-visible lg:border-t-0 bg-white border-gray-200 p-3 lg:p-4 z-40 shadow-lg lg:h-fit lg:max-h-[calc(100vh-2rem)] ${getPanelCSSClasses()}`}
          style={{
            // DIAGNÓSTICO: Forzar posición directamente desde el contexto
            ...(window.innerWidth >= 1024 ? (() => {
              const layout = getCurrentLayoutId();
              console.log(`🔧 [PANEL-POSITION] Aplicando posición para layout ${layout}`);
              switch(layout) {
                case 1: return { top: '16px', left: '16px', right: 'auto', bottom: 'auto' };
                case 2: return { top: '16px', right: '16px', left: 'auto', bottom: 'auto' };
                case 3: return { bottom: '16px', right: '16px', top: 'auto', left: 'auto' };
                case 4: return { bottom: '16px', left: '16px', top: 'auto', right: 'auto' };
                default: return { top: '16px', left: '16px', right: 'auto', bottom: 'auto' };
              }
            })() : {})
          }}
        >
          {/* Header del panel con botones centralizados */}
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => {
                console.log(`🔥 [BUTTON-CLICK] ===== CLIC EN BOTÓN MOVER =====`);
                console.log(`🔥 [BUTTON-CLICK] moveToNextLayout function:`, moveToNextLayout);
                console.log(`🔥 [BUTTON-CLICK] getCurrentLayoutId():`, getCurrentLayoutId());
                console.log(`🔥 [BUTTON-CLICK] Timestamp:`, Date.now());
                moveToNextLayout();
                console.log(`🔥 [BUTTON-CLICK] moveToNextLayout() ejecutado`);
                console.log(`🔥 [BUTTON-CLICK] ===== FIN CLIC BOTÓN =====`);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              title="Mover panel y colores de forma sincronizada"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Mover
            </button>
            
            {/* Botón central de colapsar/expandir */}
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              title={isPanelCollapsed ? "Expandir panel" : "Colapsar panel"}
            >
              {isPanelCollapsed ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 9l4-4 4 4"/>
                    <path d="M8 15l4 4 4-4"/>
                  </svg>
                  Expandir
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 15l4-4 4 4"/>
                    <path d="M8 9l4 4 4-4"/>
                  </svg>
                  Colapsar
                </>
              )}
            </button>
            
            <span className="text-xs text-gray-500">
              {getPositionIndicator()} Layout {getCurrentLayoutId()}
            </span>
          </div>
          
          {/* Contenido del panel (colapsable) */}
          <div className={`transition-all duration-300 overflow-hidden ${
            isPanelCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
          }`}>
            {/* Mostrar problema */}
            <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-md mb-2">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <span>Problema {problemHistory.length + 1} de 3</span>
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
            
            {/* Problema matemático - Formato según el símbolo de división */}
            <div className="bg-gray-50 p-3 rounded border-2 border-dashed border-gray-200">
              <div className="font-mono text-2xl font-bold select-none text-center">
                <div className="mb-2">
                  <span className="text-gray-400 italic">?</span>
                </div>
                
                {problem.displaySymbol === 'long' ? (
                  // Formato de casita de división larga
                  (<div className="flex justify-center items-end">
                    <span className="mr-2 mt-[-5px] mb-[-5px]">{problem.divisor}</span>
                    <div className="relative">
                      <div className="border-l-2 border-t-2 border-gray-800 h-8 w-16 flex items-start justify-end pr-1 pt-1">
                        <span className="ml-[-28px] mr-[-28px]">{problem.dividend}</span>
                      </div>
                    </div>
                  </div>)
                ) : (
                  // Formato horizontal para ÷ y /
                  (<div className="flex items-center justify-center space-x-2">
                    <span>{problem.dividend}</span>
                    <span className="text-gray-600">
                      {problem.displaySymbol === 'obelus' ? '÷' : 
                       problem.displaySymbol === 'slash' ? '/' : '÷'}
                    </span>
                    <span>{problem.divisor}</span>
                  </div>)
                )}
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
    </div>
  );
};

// Componente principal que envuelve todo con el Provider
export const ProfessorModeWithSync: React.FC<ProfessorModeProps> = (props) => {
  return (
    <SynchronizedLayoutProvider initialLayoutId={1}>
      <ProfessorModeContent {...props} />
    </SynchronizedLayoutProvider>
  );
};

export default ProfessorModeWithSync;