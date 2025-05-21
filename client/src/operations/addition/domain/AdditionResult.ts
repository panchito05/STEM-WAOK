import { ProblemStatus } from './AdditionProblem';

/**
 * Interfaz para respuestas de estudiantes en el modo profesor
 * - Inmutable para prevenir modificaciones accidentales
 */
export interface ProfessorStudentAnswer {
  readonly problemId: string;
  readonly userAnswer: number | null; 
  readonly isCorrect: boolean;
  readonly timestamp: number;
  readonly showExplanation: boolean;
  readonly status?: ProblemStatus;
  readonly attempts?: number;
}

/**
 * Interfaz para resultados de sesiones de ejercicios
 */
export interface AdditionSessionResult {
  readonly sessionId: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly totalProblems: number;
  readonly correctAnswers: number;
  readonly incorrectAnswers: number;
  readonly skippedProblems: number;
  readonly totalTime: number;
  readonly averageTimePerProblem: number;
}

/**
 * Interfaz para estadísticas detalladas
 */
export interface DetailedStats {
  readonly accuracy: number;  // Porcentaje de respuestas correctas
  readonly timePerProblem: ReadonlyArray<number>;  // Tiempo para cada problema
  readonly attemptsPerProblem: ReadonlyArray<number>;  // Intentos por problema
  readonly problemDifficulties: ReadonlyArray<string>;  // Dificultad de cada problema
  readonly timeTrend: ReadonlyArray<[number, number]>;  // [índice, tiempo]
  readonly accuracyTrend: ReadonlyArray<[number, boolean]>;  // [índice, correcto]
}

/**
 * Función para crear una respuesta de estudiante
 */
export function createProfessorStudentAnswer(
  problemId: string,
  userAnswer: number | null,
  isCorrect: boolean,
  status: ProblemStatus = ProblemStatus.PENDING
): ProfessorStudentAnswer {
  return {
    problemId,
    userAnswer,
    isCorrect,
    timestamp: Date.now(),
    showExplanation: false,
    status,
    attempts: 1
  };
}

/**
 * Función para calcular estadísticas a partir de respuestas
 */
export function calculateStats(answers: ReadonlyArray<ProfessorStudentAnswer>): DetailedStats {
  // Si no hay respuestas, devolver estadísticas vacías
  if (!answers.length) {
    return {
      accuracy: 0,
      timePerProblem: [],
      attemptsPerProblem: [],
      problemDifficulties: [],
      timeTrend: [],
      accuracyTrend: []
    };
  }

  // Calcular precisión (% de respuestas correctas)
  const correctCount = answers.filter(a => a.isCorrect).length;
  const accuracy = (correctCount / answers.length) * 100;

  // Extraer datos para tendencias
  const timeTrend: [number, number][] = [];
  const accuracyTrend: [number, boolean][] = [];

  // Calcular tendencias
  answers.forEach((answer, index) => {
    // Tendencia de tiempo (asumimos que las respuestas están ordenadas)
    if (index > 0) {
      timeTrend.push([index, answer.timestamp]);
    }

    // Tendencia de precisión
    accuracyTrend.push([index, answer.isCorrect]);
  });

  // Devolver estadísticas calculadas
  return {
    accuracy,
    timePerProblem: [],  // Se calcularía con timestamps de inicio y fin
    attemptsPerProblem: answers.map(a => a.attempts || 1),
    problemDifficulties: [],  // Se llenaría con datos de los problemas
    timeTrend,
    accuracyTrend
  };
}