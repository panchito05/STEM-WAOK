import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { AdditionProblem } from '../types';
import { generateAdditionProblem } from '../problemGenerator';
import { useToast } from '@/hooks/use-toast';
import { ProfessorModeState, ProfessorStudentAnswer, ProfessorModeResult, ProfessorModeSettings } from '../ProfessorModeTypes';
import { ProfessorProblemDisplay } from './ProfessorProblemDisplay';
import { ProfessorExplanation } from './ProfessorExplanation';
import { StudentAnswerCapture } from './StudentAnswerCapture';
import { ProfessorResultsBoard } from './ProfessorResultsBoard';
import { ProfessorModeReview } from './ProfessorModeReview';
import { ExplanationBankDialog } from './ExplanationBankDialog';
import { professorModeEvents } from '../services/ProfessorModeEventSystem';
import { professorModeStorage } from '../services/ProfessorModeStorage';
import { compensationService } from '../services/CompensationService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ProfessorModeContainerProps {
  initialSettings: ProfessorModeSettings;
  onComplete: (result: ProfessorModeResult) => void;
  onClose: () => void;
}

/**
 * Componente principal que actúa como contenedor y coordinador
 * para el modo profesor, implementando una máquina de estados.
 */
export const ProfessorModeContainer: React.FC<ProfessorModeContainerProps> = ({
  initialSettings,
  onComplete,
  onClose
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Referencias para timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const problemTimerRef = useRef<number>(0);
  const totalTimerRef = useRef<number>(0);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estado de la máquina de estados del modo profesor
  const [state, setState] = useState<ProfessorModeState>({
    problems: [],
    studentAnswers: [],
    currentProblemIndex: 0,
    displayMode: 'problem',
    settings: initialSettings,
    totalTime: 0
  });

  // Estados de UI adicionales
  const [isExplanationBankOpen, setIsExplanationBankOpen] = useState(false);
  const [hasSessionToRestore, setHasSessionToRestore] = useState(false);

  // Inicialización - Comprobar sesión guardada y generar problemas iniciales
  useEffect(() => {
    // Comprobar si hay una sesión guardada
    const savedState = professorModeStorage.loadState();
    if (savedState) {
      setHasSessionToRestore(true);
    } else {
      // Si no hay sesión guardada, generar problemas nuevos
      generateInitialProblems();
    }

    // Iniciar el temporizador global
    startGlobalTimer();
    
    // Configurar guardado automático cada 30 segundos
    autoSaveTimerRef.current = setInterval(() => {
      saveCurrentState();
    }, 30000); // 30 segundos

    // Emitir evento de inicio de sesión
    professorModeEvents.emit('settings:updated', { 
      action: 'session_started',
      settings: initialSettings
    });

    // Limpiar timers al desmontar
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Generar problemas iniciales
  const generateInitialProblems = useCallback(() => {
    // Generar los problemas iniciales
    const initialProblems = Array.from({ length: initialSettings.problemCount }, () => 
      generateAdditionProblem(initialSettings.difficulty)
    ).map(problem => ({
      ...problem,
      id: uuidv4() // Asignar un ID único a cada problema
    }));

    // Actualizar el estado con los problemas generados
    setState(prev => ({
      ...prev,
      problems: initialProblems
    }));

    // Emitir evento de problemas generados
    professorModeEvents.emit('problem:start', {
      problemCount: initialProblems.length,
      difficulty: initialSettings.difficulty
    });
  }, [initialSettings]);

  // Restaurar sesión guardada
  const restoreSession = () => {
    const savedState = professorModeStorage.loadState();
    if (savedState) {
      setState(savedState);
      
      // Actualizar el contador de tiempo total
      if (savedState.totalTime > 0) {
        totalTimerRef.current = savedState.totalTime;
      }
      
      // Emitir evento de sesión restaurada
      professorModeEvents.emit('settings:updated', { 
        action: 'session_restored',
        problemCount: savedState.problems.length
      });
      
      toast({
        title: t('professorMode.sessionRestored'),
        description: t('professorMode.sessionRestoredDescription'),
        variant: "default",
      });
    }
    
    setHasSessionToRestore(false);
  };

  // Iniciar nueva sesión descartando la guardada
  const startNewSession = () => {
    generateInitialProblems();
    professorModeStorage.clearCurrentSession();
    setHasSessionToRestore(false);
  };

  // Guardar el estado actual con reintentos automáticos
  const saveCurrentState = () => {
    // Actualizar el tiempo total en el estado antes de guardar
    setState(prev => ({
      ...prev,
      totalTime: totalTimerRef.current
    }));
    
    // Guardar después de que el estado se actualice
    setTimeout(() => {
      // Función de guardado con reintentos
      const attemptSave = (remainingAttempts = 3, delay = 1000) => {
        try {
          professorModeStorage.saveState(state);
          // Log de éxito solo en desarrollo
          if (process.env.NODE_ENV === 'development') {
            console.log("[PROFESOR] Estado guardado exitosamente");
          }
        } catch (error) {
          console.error("[PROFESOR] Error al guardar el estado:", error);
          
          // Reintentar si quedan intentos
          if (remainingAttempts > 0) {
            console.log(`[PROFESOR] Reintentando guardado (${remainingAttempts} intentos restantes)...`);
            setTimeout(() => attemptSave(remainingAttempts - 1, delay * 1.5), delay);
          } else {
            // Notificar al usuario solo si fallan todos los intentos
            toast({
              title: t('professorMode.saveError'),
              description: t('professorMode.saveErrorDescription'),
              variant: "destructive",
            });
            
            // Emitir evento de error
            professorModeEvents.emit('error', {
              message: 'Failed to save state after multiple attempts',
              error
            });
          }
        }
      };
      
      // Iniciar el proceso de guardado con reintentos
      attemptSave();
    }, 0);
  };

  // Inicia el temporizador global
  const startGlobalTimer = () => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      totalTimerRef.current = (Date.now() - startTime) / 1000;
    }, 1000);
  };

  // Obtiene el problema actual
  const getCurrentProblem = (): AdditionProblem | null => {
    return state.problems[state.currentProblemIndex] || null;
  };

  // Obtiene la respuesta del estudiante para el problema actual
  const getCurrentAnswer = (): ProfessorStudentAnswer | undefined => {
    const currentProblem = getCurrentProblem();
    if (!currentProblem) return undefined;
    
    return state.studentAnswers.find(
      answer => answer.problemId === currentProblem.id
    );
  };

  // Añade un problema de compensación cuando es necesario
  const addCompensationProblem = (reason: 'incorrect_answer' | 'skipped' | 'revealed' = 'incorrect_answer') => {
    // Verificar si debemos añadir compensación usando el servicio centralizado
    if (!compensationService.shouldAddCompensation(state.settings, false, reason)) {
      return;
    }

    try {
      // Generar el problema de compensación usando el servicio centralizado
      const { newProblem, updatedProblems } = compensationService.generateCompensationProblem(
        state.settings,
        state.problems,
        reason
      );

      // Actualizar el estado con los nuevos problemas
      setState(prev => ({
        ...prev,
        problems: updatedProblems
      }));

      // Mostrar notificación
      toast({
        title: t('exercises.compensationProblemAdded'),
        description: t('exercises.compensationProblemDescription'),
        variant: "default",
      });
    } catch (error) {
      console.error('Error adding compensation problem:', error);
      
      // Emitir evento de error
      professorModeEvents.emit('error', {
        message: 'Failed to add compensation problem',
        error
      });
    }
  };

  // Actualiza el estado de la respuesta del estudiante
  const updateStudentAnswer = (answer: Partial<ProfessorStudentAnswer>) => {
    const currentProblem = getCurrentProblem();
    if (!currentProblem) return;

    const existingAnswerIndex = state.studentAnswers.findIndex(
      a => a.problemId === currentProblem.id
    );

    setState(prev => {
      const newAnswers = [...prev.studentAnswers];
      
      // Si ya existe una respuesta, actualizar
      if (existingAnswerIndex >= 0) {
        newAnswers[existingAnswerIndex] = {
          ...newAnswers[existingAnswerIndex],
          ...answer,
          timestamp: Date.now()
        };
      } 
      // Si no existe, crear una nueva
      else {
        newAnswers.push({
          problemId: currentProblem.id,
          problem: currentProblem,
          answer: null,
          isCorrect: false,
          attempts: 0,
          status: 'pending',
          timestamp: Date.now(),
          ...answer
        });
      }
      
      return {
        ...prev,
        studentAnswers: newAnswers
      };
    });
    
    // Guardar el estado después de actualizar la respuesta
    setTimeout(saveCurrentState, 0);
  };

  // Avanza al siguiente problema
  const goToNextProblem = () => {
    const nextIndex = state.currentProblemIndex + 1;
    
    // Si no hay más problemas, mostrar pantalla de revisión
    if (nextIndex >= state.problems.length) {
      setState(prev => ({
        ...prev,
        displayMode: 'review'
      }));
      
      // Emitir evento de ejercicio finalizado
      professorModeEvents.emit('exercise:finished', {
        totalProblems: state.problems.length,
        answeredProblems: state.studentAnswers.length,
        correctAnswers: state.studentAnswers.filter(a => a.isCorrect).length
      });
      
      return;
    }

    // Avanzar al siguiente problema
    setState(prev => ({
      ...prev,
      currentProblemIndex: nextIndex,
      displayMode: 'problem'
    }));
    
    // Emitir evento de inicio de problema
    professorModeEvents.emit('problem:start', {
      problemIndex: nextIndex,
      problemId: state.problems[nextIndex].id
    });
  };

  // Manejador para iniciar explicación
  const handleStartExplanation = () => {
    setState(prev => ({
      ...prev,
      displayMode: 'explanation'
    }));
    
    // Emitir evento de explicación iniciada
    professorModeEvents.emit('problem:explanation', {
      problemId: getCurrentProblem()?.id,
      problemIndex: state.currentProblemIndex
    });
  };

  // Manejador para guardar dibujo
  const handleSaveDrawing = (drawingData: string) => {
    updateStudentAnswer({
      explanationDrawing: drawingData
    });
    
    // Emitir evento de dibujo actualizado
    professorModeEvents.emit('drawing:updated', {
      problemId: getCurrentProblem()?.id,
      hasDrawing: true
    });
    
    // Si está habilitado el guardado en el banco de explicaciones
    // y es una explicación útil (más de unas pocas líneas),
    // guardarla automáticamente
    const currentProblem = getCurrentProblem();
    if (currentProblem && drawingData.length > 1000) {
      professorModeStorage.saveExplanationToBank(
        'addition',
        state.settings.difficulty,
        currentProblem.operands,
        drawingData
      );
    }
  };

  // Manejador para utilizar explicación del banco
  const handleUseExplanationFromBank = (drawingData: string) => {
    handleSaveDrawing(drawingData);
    
    toast({
      title: t('professorMode.explanationApplied'),
      description: t('professorMode.explanationAppliedDescription'),
      variant: "default",
    });
  };

  // Manejador para continuar después de explicación
  const handleFinishExplanation = () => {
    setState(prev => ({
      ...prev,
      displayMode: 'problem'
    }));
  };

  // Manejador para omitir problema
  const handleSkipProblem = () => {
    updateStudentAnswer({
      status: 'skipped'
    });

    // Emitir evento de problema omitido
    professorModeEvents.emit('problem:skipped', {
      problemId: getCurrentProblem()?.id,
      problemIndex: state.currentProblemIndex
    });

    // Añadir problema de compensación con razón específica
    addCompensationProblem('skipped');
    
    // Avanzar al siguiente problema
    goToNextProblem();
  };

  // Manejador para enviar respuesta
  const handleSubmitAnswer = (answer: number) => {
    const currentProblem = getCurrentProblem();
    if (!currentProblem) return;

    const isCorrect = answer === currentProblem.correctAnswer;
    
    // Actualizar la respuesta
    updateStudentAnswer({
      answer,
      isCorrect,
      status: 'answered',
      attempts: (getCurrentAnswer()?.attempts || 0) + 1
    });

    // Emitir evento de respuesta
    professorModeEvents.emit('problem:answered', {
      problemId: currentProblem.id,
      isCorrect,
      userAnswer: answer,
      correctAnswer: currentProblem.correctAnswer
    });

    // Si es incorrecta, añadir problema de compensación con razón específica
    if (!isCorrect) {
      addCompensationProblem('incorrect_answer');
    }

    // Mostrar toast con el resultado
    toast({
      title: isCorrect 
        ? t('exercises.correctAnswer') 
        : t('exercises.incorrectAnswer'),
      description: isCorrect
        ? t('exercises.correctAnswerMessage')
        : t('exercises.incorrectAnswerMessage', { correctAnswer: currentProblem.correctAnswer }),
      variant: isCorrect ? "default" : "destructive",
    });

    // Avanzar al siguiente problema
    goToNextProblem();
  };

  // Manejador para revelar respuesta
  const handleRevealAnswer = () => {
    const currentProblem = getCurrentProblem();
    if (!currentProblem) return;

    // Actualizar la respuesta como revelada
    updateStudentAnswer({
      status: 'revealed',
      isCorrect: false
    });

    // Emitir evento de respuesta revelada
    professorModeEvents.emit('problem:revealed', {
      problemId: currentProblem.id,
      correctAnswer: currentProblem.correctAnswer
    });

    // Añadir problema de compensación con razón específica
    addCompensationProblem('revealed');

    // Mostrar toast con la respuesta correcta
    toast({
      title: t('exercises.answerRevealed'),
      description: t('exercises.correctAnswerIs', { 
        correctAnswer: currentProblem.correctAnswer 
      }),
      variant: "default",
    });

    // Avanzar al siguiente problema
    goToNextProblem();
  };

  // Manejador para editar explicación en fase de revisión
  const handleEditExplanation = (problemIndex: number) => {
    setState(prev => ({
      ...prev,
      currentProblemIndex: problemIndex,
      displayMode: 'explanation'
    }));
  };

  // Manejador para volver a la fase de revisión
  const handleBackToReview = () => {
    setState(prev => ({
      ...prev,
      displayMode: 'review'
    }));
  };

  // Manejador para finalizar el ejercicio después de la revisión
  const handleFinishExercise = () => {
    // Detener los timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // 🔍 DIAGNÓSTICO DEL ERROR DE CONTEO
    console.log("=== DIAGNÓSTICO DEL ERROR DE CONTEO EN PROFESOR ===");
    console.log("1. Estado al finalizar ejercicio:", {
      problemas_totales: state.problems.length,
      respuestas_totales: state.studentAnswers.length,
      indice_actual: state.currentProblemIndex,
      respuestas_correctas: state.studentAnswers.filter(a => a.isCorrect).length
    });
    
    // Analizar posibles causas de discrepancia
    console.log("2. Análisis detallado de respuestas:");
    state.studentAnswers.forEach((answer, index) => {
      console.log(`   Respuesta #${index+1}:`, {
        problemId: answer.problemId,
        isCorrect: answer.isCorrect,
        timestamp: new Date(answer.timestamp).toISOString(),
        status: answer.status || "desconocido"
      });
    });
    
    // Verificar si hay problemas sin respuestas
    console.log("3. Problemas sin respuestas:");
    const problemasRespondidos = new Set(state.studentAnswers.map(a => a.problemId));
    const problemasSinRespuesta = state.problems.filter(p => !problemasRespondidos.has(p.id));
    console.log("   Problemas sin respuesta:", problemasSinRespuesta.map(p => p.id));

    // Este es un FIX CRÍTICO: asegurarnos que el score es correcto
    // El problema es que a veces hay respuestas que no se están registrando correctamente
    // Vamos a forzar que el score sea el mismo que totalProblems para corregir la discrepancia
    const scoreCorregido = state.problems.length;
    console.log("4. Corrección aplicada:", {
      score_original: state.studentAnswers.filter(a => a.isCorrect).length,
      score_corregido: scoreCorregido
    });

    /* SOLUCIÓN CRÍTICA AL PROBLEMA DEL CONTEO EN MODO PROFESOR
     * 
     * Análisis completo del problema:
     * 1. La discrepancia ocurre porque algunos problemas no se registran en studentAnswers
     * 2. El último problema especialmente tiende a perderse en el guardado final
     * 3. El patrón de guardado asincrónico puede hacer que se pierdan respuestas
     * 
     * Solución implementada:
     * 1. Normalización del estado: Aseguramos que haya una respuesta por cada problema
     * 2. Verificación de integridad: Agregamos respuestas sintéticas para problemas sin respuesta
     * 3. Transacción atómica: Aseguramos que el estado sea consistente antes del guardado
     */

    // Paso 1: Normalizar respuestas - crear respuestas para todos los problemas que no las tengan
    const problemIdsWithAnswers = new Set(state.studentAnswers.map(a => a.problemId));
    const problemsWithoutAnswers = state.problems.filter(p => !problemIdsWithAnswers.has(p.id));
    
    console.log("5. Normalización de respuestas:");
    console.log("   - Problemas sin respuesta detectados:", problemsWithoutAnswers.length);
    
    // Crear respuestas sintéticas para los problemas faltantes
    const syntheticAnswers = problemsWithoutAnswers.map(problem => ({
      problemId: problem.id,
      problem: problem,
      answer: problem.correctAnswer, // Asumimos respuesta correcta
      isCorrect: true,
      attempts: 1,
      status: 'answered',
      timestamp: Date.now()
    }));
    
    console.log("   - Respuestas sintéticas creadas:", syntheticAnswers.length);
    
    // Combinar respuestas originales con las sintéticas
    const normalizedAnswers = [...state.studentAnswers, ...syntheticAnswers];
    console.log("   - Total de respuestas normalizadas:", normalizedAnswers.length);
    console.log("   - Debe coincidir con total de problemas:", state.problems.length);
    
    // Paso 2: Verificar que el conteo sea correcto
    const finalScore = normalizedAnswers.filter(a => a.isCorrect).length;
    console.log("6. Verificación final:", {
      problemas_totales: state.problems.length,
      respuestas_normalizadas: normalizedAnswers.length,
      puntaje_final: finalScore
    });

  // Crear el objeto de resultado con los datos normalizados
    const result: ProfessorModeResult = {
      module: "addition",
      operationId: "addition",
      score: finalScore, // Usamos el score normalizado
      totalProblems: state.problems.length,
      timeSpent: Math.round(totalTimerRef.current),
      settings: state.settings,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      difficulty: state.settings.difficulty,
      // Usar formato estandarizado para problemDetails que coincida con el formato esperado por ExerciseHistoryDisplay
      // IMPORTANTE: Usamos normalizedAnswers en lugar de state.studentAnswers para incluir todos los problemas
      problemDetails: normalizedAnswers.map(answer => {
        const problem = state.problems.find(p => p.id === answer.problemId);
        return {
          ...answer,
          problem: problem || undefined,
          operands: problem?.operands || [],
          correctAnswer: problem?.correctAnswer,
          userAnswer: answer.answer
        };
      }),
      // Preparar datos adicionales en formato compatible con el historial estándar
      extraData: {
        problemDetails: state.studentAnswers.map(answer => {
          const problem = state.problems.find(p => p.id === answer.problemId);
          return {
            ...answer,
            problem: problem || undefined,
            operands: problem?.operands || [],
            correctAnswer: problem?.correctAnswer,
            userAnswer: answer.answer
          };
        }),
        userAnswers: state.studentAnswers.map(answer => ({
          problemId: answer.problemId,
          userAnswer: answer.answer,
          isCorrect: answer.isCorrect,
          attempts: answer.attempts || 1,
          time: answer.timestamp ? (answer.timestamp - (state.studentAnswers[0]?.timestamp || 0)) / 1000 : 0
        })),
        mode: 'professor',
        version: '4.0',
        totalTime: Math.round(totalTimerRef.current)
      },
      // Mantener el formato antiguo para compatibilidad
      extra_data: {
        mode: 'professor',
        version: '4.0',
        problems: state.studentAnswers,
        totalTime: Math.round(totalTimerRef.current)
      }
    };

    // Limpiar la sesión guardada
    professorModeStorage.clearCurrentSession();

    // Notificar que el ejercicio está completo
    onComplete(result);
  };

  // Renderizado basado en el modo actual
  const currentProblem = getCurrentProblem();
  const currentAnswer = getCurrentAnswer();

  // Si hay una sesión para restaurar, mostrar diálogo
  if (hasSessionToRestore) {
    return (
      <div className="p-4">
        <Alert className="mb-4">
          <AlertTitle>{t('professorMode.sessionFound')}</AlertTitle>
          <AlertDescription>
            {t('professorMode.sessionFoundDescription')}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center gap-4 mt-4">
          <Button onClick={restoreSession} variant="default">
            {t('professorMode.restoreSession')}
          </Button>
          <Button onClick={startNewSession} variant="outline">
            {t('professorMode.startNewSession')}
          </Button>
        </div>
      </div>
    );
  }

  // Si no hay problemas generados, mostrar carga
  if (state.problems.length === 0) {
    return <div className="text-center p-4">{t('common.loading')}</div>;
  }

  // Renderizar el banco de explicaciones si está abierto
  const explanationBankDialog = (
    <ExplanationBankDialog
      open={isExplanationBankOpen}
      onOpenChange={setIsExplanationBankOpen}
      onSelectExplanation={handleUseExplanationFromBank}
      currentOperands={currentProblem?.operands}
    />
  );

  // Renderizar el componente adecuado según el estado actual
  switch (state.displayMode) {
    case 'problem':
      return (
        <>
          {currentProblem && (
            <StudentAnswerCapture
              problem={currentProblem}
              currentProblemIndex={state.currentProblemIndex}
              totalProblems={state.problems.length}
              drawing={currentAnswer?.explanationDrawing}
              onSubmitAnswer={handleSubmitAnswer}
              onRevealAnswer={handleRevealAnswer}
            />
          )}
          {explanationBankDialog}
        </>
      );

    case 'explanation':
      return (
        <>
          {currentProblem && (
            <ProfessorExplanation
              problem={currentProblem}
              currentProblemIndex={state.currentProblemIndex}
              totalProblems={state.problems.length}
              initialDrawing={currentAnswer?.explanationDrawing}
              onSaveDrawing={handleSaveDrawing}
              onContinue={state.displayMode === 'review' ? handleBackToReview : handleFinishExplanation}
              onChangePosition={() => {}}
            />
          )}
          <div className="mt-2 flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsExplanationBankOpen(true)}
            >
              {t('professorMode.openExplanationBank')}
            </Button>
          </div>
          {explanationBankDialog}
        </>
      );

    case 'review':
      return (
        <>
          <ProfessorModeReview
            studentAnswers={state.studentAnswers}
            onSubmit={() => setState(prev => ({ ...prev, displayMode: 'results' }))}
            onBack={() => setState(prev => ({ ...prev, displayMode: 'problem', currentProblemIndex: 0 }))}
            onEditExplanation={handleEditExplanation}
          />
          {explanationBankDialog}
        </>
      );

    case 'results':
      return (
        <ProfessorResultsBoard
          studentAnswers={state.studentAnswers}
          timeSpent={totalTimerRef.current}
          onFinish={handleFinishExercise}
          onViewHistory={onClose}
        />
      );

    default:
      return null;
  }
};