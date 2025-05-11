// src/components/exercise/addition/types.ts
export type DifficultyLevel = "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
export type ExerciseLayout = 'horizontal' | 'vertical';

export interface Problem {
  id?: string; // Identificador único para el problema
  operands: number[]; // Array para soportar 2 o más operandos
  correctAnswer: number;
  layout: ExerciseLayout; // 'horizontal' o 'vertical'
  numberOfAnswerSlots: number; // Número total de cajones para la respuesta (incluyendo el punto si existe)
  decimalPositionInAnswer?: number; // Posición del punto decimal contado desde la DERECHA (ej: 2 para XX.YY).
                                  // undefined si la respuesta no tiene decimales.
  difficulty: DifficultyLevel; // La dificultad con la que se generó este problema específico
  // Estas propiedades son usadas internamente por el componente Exercise
  answerMaxDigits?: number; // Número máximo de dígitos en la respuesta (sin punto decimal)
  answerDecimalPosition?: number; // Posición del punto decimal en la respuesta (0 si no hay punto)
}

// AdditionProblem es un alias, ya que Problem ahora es genérico para sumas.
export type AdditionProblem = Problem;

export interface UserAnswer {
  problem: Problem; // Usa la nueva estructura de Problem
  problemId?: string; // ID del problema relacionado
  userAnswerString?: string; // La respuesta del usuario tal como se ingresó en los cajones (ej: "12.34")
  userAnswer: number; // La respuesta numérica del usuario (convertida desde userAnswerString)
  isCorrect: boolean;
  status?: 'correct' | 'incorrect' | 'revealed'; // Estado de la respuesta
}