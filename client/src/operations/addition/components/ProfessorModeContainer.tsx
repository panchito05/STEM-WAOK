import React, { useState, useEffect, useRef } from 'react';
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

  // Estado de la máquina de estados del modo profesor
  const [state, setState] = useState<ProfessorModeState>({
    problems: [],
    studentAnswers: [],
    currentProblemIndex: 0,
    displayMode: 'problem',
    settings: initialSettings,
    totalTime: 0
  });

  // Inicialización - Generar problemas iniciales
  useEffect(() => {
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

    // Iniciar el temporizador global
    startGlobalTimer();

    // Limpiar timers al desmontar
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initialSettings]);

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
  const addCompensationProblem = () => {
    // Solo añadir si está habilitada la compensación
    if (!state.settings.enableCompensation) return;

    const newProblem = {
      ...generateAdditionProblem(state.settings.difficulty),
      id: uuidv4()
    };

    setState(prev => ({
      ...prev,
      problems: [...prev.problems, newProblem]
    }));

    toast({
      title: t('exercises.compensationProblemAdded'),
      description: t('exercises.compensationProblemDescription'),
      variant: "default",
    });
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
  };

  // Avanza al siguiente problema
  const goToNextProblem = () => {
    const nextIndex = state.currentProblemIndex + 1;
    
    // Si no hay más problemas, mostrar resultados
    if (nextIndex >= state.problems.length) {
      setState(prev => ({
        ...prev,
        displayMode: 'results'
      }));
      return;
    }

    // Avanzar al siguiente problema
    setState(prev => ({
      ...prev,
      currentProblemIndex: nextIndex,
      displayMode: 'problem'
    }));
  };

  // Manejador para iniciar explicación
  const handleStartExplanation = () => {
    setState(prev => ({
      ...prev,
      displayMode: 'explanation'
    }));
  };

  // Manejador para guardar dibujo
  const handleSaveDrawing = (drawingData: string) => {
    updateStudentAnswer({
      explanationDrawing: drawingData
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

    // Añadir problema de compensación si está habilitado
    addCompensationProblem();
    
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

    // Si es incorrecta y compensación está habilitada, añadir problema
    if (!isCorrect && state.settings.enableCompensation) {
      addCompensationProblem();
    }

    // Mostrar toast con el resultado
    toast({
      title: isCorrect 
        ? t('exercises.correctAnswer') 
        : t('exercises.incorrectAnswer'),
      description: isCorrect
        ? t('exercises.correctAnswerMessage')
        : t('exercises.incorrectAnswerMessage', { correctAnswer: currentProblem.correctAnswer }),
      variant: isCorrect ? "success" : "destructive",
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

    // Añadir problema de compensación
    addCompensationProblem();

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

  // Manejador para finalizar el ejercicio
  const handleFinishExercise = () => {
    // Detener el timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Crear el objeto de resultado
    const result: ProfessorModeResult = {
      module: "addition",
      operationId: "addition",
      score: state.studentAnswers.filter(a => a.isCorrect).length,
      totalProblems: state.problems.length,
      timeSpent: Math.round(totalTimerRef.current),
      settings: state.settings,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      difficulty: state.settings.difficulty,
      problemDetails: state.studentAnswers,
      extra_data: {
        mode: 'professor',
        version: '4.0',
        problems: state.studentAnswers
      }
    };

    // Notificar que el ejercicio está completo
    onComplete(result);
  };

  // Renderizado basado en el modo actual
  const currentProblem = getCurrentProblem();
  const currentAnswer = getCurrentAnswer();

  // Si no hay problemas, mostrar mensaje de carga
  if (state.problems.length === 0) {
    return <div className="text-center p-4">{t('common.loading')}</div>;
  }

  // Renderizar el componente adecuado según el estado actual
  switch (state.displayMode) {
    case 'problem':
      return currentProblem ? (
        <StudentAnswerCapture
          problem={currentProblem}
          currentProblemIndex={state.currentProblemIndex}
          totalProblems={state.problems.length}
          drawing={currentAnswer?.explanationDrawing}
          onSubmitAnswer={handleSubmitAnswer}
          onRevealAnswer={handleRevealAnswer}
        />
      ) : null;

    case 'explanation':
      return currentProblem ? (
        <ProfessorExplanation
          problem={currentProblem}
          currentProblemIndex={state.currentProblemIndex}
          totalProblems={state.problems.length}
          initialDrawing={currentAnswer?.explanationDrawing}
          onSaveDrawing={handleSaveDrawing}
          onContinue={handleFinishExplanation}
          onChangePosition={() => {}}
        />
      ) : null;

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