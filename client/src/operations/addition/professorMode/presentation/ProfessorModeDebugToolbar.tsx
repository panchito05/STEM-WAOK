import React, { useState, useEffect } from 'react';
import { 
  ProfessorModeDisplayMode,
  calculateSessionStats 
} from '../domain/ProfessorModeStateMachine';
import { stateManager } from '../application/ProfessorModeStateManager';
import { debugPanel } from '../infrastructure/DebugPanel';

/**
 * Barra de herramientas de depuración para el Modo Profesor
 * Esta barra aparece en la parte inferior de la pantalla y proporciona
 * controles para manipular y depurar el modo profesor
 */
export const ProfessorModeDebugToolbar: React.FC = () => {
  // Estado local
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('general');
  const [currentState, setCurrentState] = useState<any>(null);
  const [exportedState, setExportedState] = useState('');
  const [importState, setImportState] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Actualizar estado en cada renderizado
  useEffect(() => {
    setCurrentState(stateManager.getState());
  }, []);
  
  // Seguimiento de cambios de estado
  useEffect(() => {
    const handleStateChange = (newState: any) => {
      setCurrentState(newState);
    };
    
    // Registrar callback de actualización de estado
    stateManager.options.onStateChange = handleStateChange;
    
    // Limpiar al desmontar
    return () => {
      stateManager.options.onStateChange = () => {};
    };
  }, []);
  
  // Actualizar logs periódicamente
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setLogs(debugPanel.getLogs().slice(0, 10));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [visible]);
  
  // Activar o desactivar depuración
  const toggleDebugging = () => {
    if (visible) {
      debugPanel.disable();
      setVisible(false);
    } else {
      debugPanel.enable();
      setVisible(true);
      // Actualizar logs inmediatamente
      setLogs(debugPanel.getLogs().slice(0, 10));
    }
  };
  
  // Alternar expansión
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Cambiar pestaña
  const switchTab = (tab: string) => {
    setSelectedTab(tab);
    
    // Si cambiamos a la pestaña de exportar, generar JSON
    if (tab === 'export') {
      setExportedState(JSON.stringify(stateManager.getState(), null, 2));
    }
  };
  
  // Exportar datos
  const handleExport = () => {
    try {
      // Crear elemento para descargar
      const element = document.createElement('a');
      const file = new Blob([exportedState], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = `professor_mode_state_${Date.now()}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setSuccessMessage('Estado exportado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Error al exportar estado');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };
  
  // Importar datos
  const handleImport = () => {
    try {
      const result = stateManager.importData(importState);
      
      if (result) {
        setSuccessMessage('Estado importado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        setImportState('');
      } else {
        setErrorMessage('Formato de estado inválido');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('Error al importar estado');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };
  
  // Simular transición de modo
  const simulateDisplayModeChange = (mode: string) => {
    switch (mode) {
      case ProfessorModeDisplayMode.EXPLANATION:
        debugPanel.simulateAction('SHOW_EXPLANATION', {
          explanationText: 'Explicación de prueba generada por el depurador'
        });
        break;
        
      case ProfessorModeDisplayMode.RESULTS:
        debugPanel.simulateAction('SHOW_RESULTS');
        break;
        
      case ProfessorModeDisplayMode.REVIEW:
        debugPanel.simulateAction('START_REVIEW', { index: 0 });
        break;
        
      case ProfessorModeDisplayMode.PROBLEM:
        debugPanel.simulateAction('NEXT_PROBLEM', { index: currentState.currentProblemIndex });
        break;
    }
  };
  
  // Generar y descargar informe
  const generateAndDownloadReport = () => {
    try {
      const report = debugPanel.generateStateReport();
      
      // Crear elemento para descargar
      const element = document.createElement('a');
      const file = new Blob([report], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `professor_mode_report_${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setSuccessMessage('Informe generado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Error al generar informe');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };
  
  // Restaurar estado inicial
  const resetToInitialState = () => {
    if (window.confirm('¿Realmente desea reiniciar el estado? Se perderán todos los datos.')) {
      stateManager.endSession();
      setSuccessMessage('Estado reiniciado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };
  
  // Si no está visible, mostrar solo botón de activación
  if (!visible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full shadow-lg opacity-70 hover:opacity-100"
          onClick={toggleDebugging}
          title="Activar modo depuración"
        >
          <span className="text-xs font-bold">DEBUG</span>
        </button>
      </div>
    );
  }
  
  // Barra de herramientas visible
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white z-50 border-t border-amber-500 shadow-lg text-xs">
      {/* Barra principal */}
      <div className="flex items-center justify-between px-4 py-1">
        <div className="flex items-center space-x-2">
          <button
            className="bg-amber-500 hover:bg-amber-600 text-white p-1 rounded"
            onClick={toggleDebugging}
            title="Desactivar depuración"
          >
            DEBUG
          </button>
          
          <span>
            Modo: <strong>{currentState?.displayMode || 'N/A'}</strong>
          </span>
          
          <span>
            Problema: <strong>{(currentState?.currentProblemIndex !== undefined && currentState?.problems?.length) 
              ? `${currentState.currentProblemIndex + 1}/${currentState.problems.length}` 
              : 'N/A'}</strong>
          </span>
          
          <span>
            Respuestas: <strong>{currentState?.studentAnswers?.length || 0}</strong>
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="hover:bg-gray-700 p-1 rounded"
            onClick={() => stateManager.undo()}
            title="Deshacer"
          >
            Deshacer
          </button>
          
          <button
            className="hover:bg-gray-700 p-1 rounded"
            onClick={() => stateManager.redo()}
            title="Rehacer"
          >
            Rehacer
          </button>
          
          <button
            className="hover:bg-gray-700 p-1 rounded"
            onClick={generateAndDownloadReport}
            title="Generar informe"
          >
            Informe
          </button>
          
          <button
            className="hover:bg-gray-700 p-1 rounded"
            onClick={toggleExpanded}
            title={expanded ? "Contraer panel" : "Expandir panel"}
          >
            {expanded ? '▼' : '▲'}
          </button>
        </div>
      </div>
      
      {/* Panel expandido */}
      {expanded && (
        <div className="p-4 bg-gray-900 border-t border-gray-700">
          {/* Pestañas */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`px-3 py-1 ${selectedTab === 'general' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => switchTab('general')}
            >
              General
            </button>
            <button
              className={`px-3 py-1 ${selectedTab === 'logs' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => switchTab('logs')}
            >
              Logs
            </button>
            <button
              className={`px-3 py-1 ${selectedTab === 'state' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => switchTab('state')}
            >
              Estado
            </button>
            <button
              className={`px-3 py-1 ${selectedTab === 'export' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => switchTab('export')}
            >
              Exportar/Importar
            </button>
          </div>
          
          {/* Contenido: General */}
          {selectedTab === 'general' && (
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded"
                  onClick={() => simulateDisplayModeChange(ProfessorModeDisplayMode.PROBLEM)}
                >
                  Simular Modo Problema
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded"
                  onClick={() => simulateDisplayModeChange(ProfessorModeDisplayMode.EXPLANATION)}
                >
                  Simular Modo Explicación
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded"
                  onClick={() => simulateDisplayModeChange(ProfessorModeDisplayMode.RESULTS)}
                >
                  Simular Modo Resultados
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded"
                  onClick={() => simulateDisplayModeChange(ProfessorModeDisplayMode.REVIEW)}
                >
                  Simular Modo Revisión
                </button>
              </div>
              
              <div className="flex space-x-2">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
                  onClick={() => debugPanel.simulateAction('NEXT_PROBLEM')}
                >
                  Siguiente Problema
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
                  onClick={() => debugPanel.simulateAction('PREVIOUS_PROBLEM')}
                >
                  Problema Anterior
                </button>
                <button
                  className="bg-amber-600 hover:bg-amber-700 text-white p-1 rounded"
                  onClick={() => debugPanel.simulateAction('ADD_COMPENSATION_PROBLEM', {
                    problem: {
                      id: `comp_${Date.now()}`,
                      operands: [3, 3],
                      correctAnswer: 6,
                      difficulty: 'easy',
                      displayFormat: 'standard',
                      maxAttempts: 1,
                      allowDecimals: false,
                      isCompensation: true
                    }
                  })}
                >
                  Añadir Compensación
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                  onClick={resetToInitialState}
                >
                  Reiniciar Estado
                </button>
              </div>
              
              {/* Mensajes */}
              {errorMessage && (
                <div className="bg-red-700 p-2 rounded">
                  {errorMessage}
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-700 p-2 rounded">
                  {successMessage}
                </div>
              )}
            </div>
          )}
          
          {/* Contenido: Logs */}
          {selectedTab === 'logs' && (
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-1 text-left">Tiempo</th>
                    <th className="p-1 text-left">Acción</th>
                    <th className="p-1 text-left">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800">
                      <td className="p-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-1 font-mono">
                        {log.actionType}
                      </td>
                      <td className="p-1 truncate max-w-xs">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                  
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-2 text-center text-gray-500">
                        No hay logs disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              <div className="mt-2 flex justify-end">
                <button
                  className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
                  onClick={() => debugPanel.clearLogs()}
                >
                  Limpiar logs
                </button>
              </div>
            </div>
          )}
          
          {/* Contenido: Estado */}
          {selectedTab === 'state' && (
            <div className="max-h-60 overflow-y-auto">
              <div className="bg-gray-950 p-2 rounded font-mono text-xs whitespace-pre">
                {JSON.stringify(currentState, null, 2)}
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold mb-2">Estadísticas</h4>
                  {currentState && (
                    <div className="bg-gray-800 p-2 rounded">
                      <div>Total problemas: {currentState.problems?.length || 0}</div>
                      <div>Total respuestas: {currentState.studentAnswers?.length || 0}</div>
                      <div>
                        Correctas: {
                          currentState.studentAnswers?.filter((a: any) => a.isCorrect).length || 0
                        }
                      </div>
                      <div>
                        Incorrectas: {
                          currentState.studentAnswers?.filter((a: any) => !a.isCorrect).length || 0
                        }
                      </div>
                      <div>
                        Precisión: {
                          currentState.studentAnswers?.length 
                            ? Math.round((currentState.studentAnswers.filter((a: any) => a.isCorrect).length / currentState.studentAnswers.length) * 100)
                            : 0
                        }%
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-bold mb-2">Problema Actual</h4>
                  {currentState && currentState.problems && currentState.problems[currentState.currentProblemIndex] ? (
                    <div className="bg-gray-800 p-2 rounded">
                      <div>ID: {currentState.problems[currentState.currentProblemIndex].id}</div>
                      <div>
                        Operandos: {currentState.problems[currentState.currentProblemIndex].operands.join(' + ')}
                      </div>
                      <div>
                        Respuesta: {currentState.problems[currentState.currentProblemIndex].correctAnswer}
                      </div>
                      <div>
                        Compensación: {
                          currentState.problems[currentState.currentProblemIndex].isCompensation 
                            ? 'Sí' 
                            : 'No'
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 p-2 rounded text-gray-500">
                      No hay problema activo
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Contenido: Exportar/Importar */}
          {selectedTab === 'export' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold mb-2">Exportar Estado</h4>
                <div className="flex flex-col space-y-2">
                  <textarea
                    className="bg-gray-950 text-white p-2 rounded font-mono text-xs h-40"
                    value={exportedState}
                    readOnly
                  />
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded"
                    onClick={handleExport}
                  >
                    Descargar Estado
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">Importar Estado</h4>
                <div className="flex flex-col space-y-2">
                  <textarea
                    className="bg-gray-950 text-white p-2 rounded font-mono text-xs h-40"
                    value={importState}
                    onChange={(e) => setImportState(e.target.value)}
                    placeholder="Pega aquí el JSON de estado exportado..."
                  />
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
                    onClick={handleImport}
                  >
                    Importar Estado
                  </button>
                </div>
              </div>
              
              {/* Mensajes */}
              {errorMessage && (
                <div className="col-span-2 bg-red-700 p-2 rounded">
                  {errorMessage}
                </div>
              )}
              
              {successMessage && (
                <div className="col-span-2 bg-green-700 p-2 rounded">
                  {successMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessorModeDebugToolbar;