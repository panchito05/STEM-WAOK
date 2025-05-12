
// ========================================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react';

// --- Dependencias Externas Asumidas (Placeholders Mínimos) ---
// Estas interfaces y valores deben coincidir con las definiciones reales en tu proyecto.
// Reemplaza estos placeholders con las importaciones y definiciones correctas si no lo hacen.
// ---------------------------------------------------------------

// Placeholder: Definición de ModuleSettings desde el contexto de settings
interface ModuleSettings {
    difficulty: string; // Usamos string aquí inicialmente, se puede refinar
    problemCount: number;
    timeValue: number; // Segundos por problema (0 para sin límite)
    maxAttempts: number; // Intentos máximos por problema (0 para ilimitado)
    showImmediateFeedback: boolean;
    enableSoundEffects: boolean;
    showAnswerWithExplanation: boolean;
    enableAdaptiveDifficulty: boolean;
    enableCompensation: boolean; // Añadir problema por cada incorrecto/revelado
    enableRewards: boolean;
    [key: string]: any; // Permite otras propiedades de configuración
}

// Placeholder: Valor por defecto de la configuración para este módulo
const defaultModuleSettings: ModuleSettings = {
    difficulty: "beginner",
    problemCount: 10,
    timeValue: 60, // 60 segundos por problema
    maxAttempts: 3, // 3 intentos por problema
    showImmediateFeedback: true,
    enableSoundEffects: true,
    showAnswerWithExplanation: true,
    enableAdaptiveDifficulty: true,
    enableCompensation: false,
    enableRewards: true,
};

// Placeholder: Constante para la lógica de subida de nivel
const CORRECT_ANSWERS_FOR_LEVEL_UP = 5; // Ejemplo, usar el valor real de tu LevelManager


// --- Importaciones de Librerías y Componentes Externos Asumidos ---
// Asegúrate de que estas rutas e imports existan y sean correctos en tu proyecto.
// -------------------------------------------------------------------
// Importaciones de React UI (ej: Shadcn UI)
import { Button } from '@/components/ui/button';
import { Progress as ProgressBarUI } from '@/components/ui/progress'; // Renombrado para evitar conflicto con useProgress
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // No usado en SettingsPanel, solo DifficultyExamples
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


// Importaciones de Iconos
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, Settings as SettingsIcon /* Renombrado */ } from 'lucide-react';

// Importaciones de Contextos y Hooks de la Aplicación
import { useSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';
import { useTranslations } from '@/hooks/use-translations'; // Hook para internacionalización
import { useRewardsStore, awardReward, getRewardProbability } from '@/lib/rewards-system'; // Sistema de recompensas

// Importaciones de Utilidades y Componentes Compartidos
import { formatTime, debounce } from '@/lib/utils'; // Utilidades generales (tiempo, debounce)
import eventBus from '@/lib/eventBus'; // Bus de eventos para comunicación entre partes de la app
// import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager'; // Usamos el placeholder local arriba
// import { defaultModuleSettings } from '@/utils/operationComponents'; // Usamos el placeholder local arriba
import DifficultyExamples from '@/components/DifficultyExamples'; // Componente para mostrar ejemplos de dificultad
import LevelUpHandler from '@/components/LevelUpHandler'; // Componente para manejar animaciones/side-effects de subida de nivel
import RewardAnimation from '@/components/rewards/RewardAnimation'; // Componente para animaciones de recompensa


// ========================================================================================
// TIPOS Y INTERFACES (Originalmente types.ts, ajustado según tu ejemplo)
// ========================================================================================

export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';
export type ExerciseLayout = 'horizontal' | 'vertical';

export interface Problem {
  id: string;
  operands: number[]; // Array para soportar 2 o más operandos
  num1?: number; // Mantener por compatibilidad con código antiguo si aplica
  num2?: number; // Mantener por compatibilidad con código antiguo si aplica
  correctAnswer: number;
  layout: ExerciseLayout; // 'horizontal' o 'vertical'
  answerMaxDigits: number; // Número total de dígitos en la respuesta (sin contar el punto)
  answerDecimalPosition?: number; // Número de dígitos después del punto decimal. undefined si no hay decimales.
  numberOfAnswerSlots: number; // Número total de cajones para la respuesta VISUALMENTE (incluyendo el punto como un slot si existe). Esto parece venir de tu ejemplo, el original solo usaba answerMaxDigits. Vamos a usar answerMaxDigits para el número de cajas de dígito y calcular el slot extra para el punto si es necesario en el renderizado. Eliminamos numberOfAnswerSlots de aquí para alinearlo con el original utils.ts, que es quien genera el problema. El render lo calculará.
  difficulty: DifficultyLevel; // La dificultad con la que se generó este problema específico
}

// AdditionProblem es un alias
export type AdditionProblem = Problem;

export interface UserAnswer {
  problem: Problem; // La estructura completa del problema respondido
  problemId: string; // ID del problema respondido
  userAnswerString?: string; // La respuesta del usuario como string (útil para ver input crudo)
  userAnswer: number | null; // La respuesta numérica del usuario (null si no se introdujo número válido)
  isCorrect: boolean; // Si la respuesta numérica coincide con la correcta
  status: 'correct' | 'incorrect' | 'revealed' | 'timeout' | 'unanswered' | 'skipped'; // Estado final del intento en ese problema
  attemptsMade?: number; // Cuántos intentos se hicieron en este problema
}


// ========================================================================================
// FUNCIONES UTILITARIAS (Originalmente utils.ts)
// ========================================================================================

// --- Funciones auxiliares de propósito general ---
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomBool = (probability: number = 0.5): boolean => Math.random() < probability;

function getRandomDecimal(min: number, max: number, maxDecimals: 0 | 1 | 2): number {
  if (maxDecimals === 0) {
    return getRandomInt(min, max);
  }
  const range = max - min;
  let value = Math.random() * range + min;
  const factor = Math.pow(10, maxDecimals);
  value = Math.round(value * factor) / factor;
  // Usamos toFixed para asegurar el número correcto de decimales en la representación string
  // y parseFloat para obtener el valor numérico preciso.
  return parseFloat(value.toFixed(maxDecimals));
}

function generateUniqueId(): string {
  // Genera un ID único basado en el tiempo y un número aleatorio.
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}


// --- Generación del Problema de Suma ---
export function generateAdditionProblem(difficulty: DifficultyLevel): AdditionProblem {
  const id = generateUniqueId();
  let operands: number[] = [];
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0; // Máximo de decimales en *los operandos* generados

  switch (difficulty) {
    case "beginner": // Sumas simples, ej: 1+1 a 9+9
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
      break;
    case "elementary": // Sumas de dos dígitos (10+10 a 99+99) sin decimales
      operands = [getRandomInt(10, 99), getRandomInt(10, 99)];
      layout = 'horizontal';
      break;
    case "intermediate": // 2-3 operandos, aleatoriamente vertical, posible 1 decimal
      layout = getRandomBool(0.6) ? 'vertical' : 'horizontal'; // 60% vertical
      const numOperandsIntermediate = layout === 'vertical' ? (getRandomBool(0.7) ? 2 : 3) : 2; // Vertical: 70% 2 ops, 30% 3 ops; Horizontal: siempre 2 ops

      problemMaxDecimals = layout === 'vertical' && getRandomBool(0.4) ? 1 : 0; // 40% chance de 1 decimal si es vertical

      for (let i = 0; i < numOperandsIntermediate; i++) {
         if (problemMaxDecimals > 0) {
            operands.push(getRandomDecimal(1, getRandomInt(50, 500), problemMaxDecimals)); // Números con 1 decimal
         } else {
            operands.push(getRandomInt(10, getRandomInt(100, 500))); // Enteros
         }
      }
       // Asegurar al menos 2 operandos si la lógica anterior generó menos
      while(operands.length < 2) {
           operands.push(getRandomInt(1,10)); // Añadir enteros pequeños como fallback
      }
      break;
    case "advanced": // 3-4 operandos, siempre vertical, 1 o 2 decimales
      layout = 'vertical';
      const numOperandsAdvanced = getRandomBool() ? 3 : 4; // 50% 3 ops, 50% 4 ops
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1; // 60% chance de 2 decimales
      for (let i = 0; i < numOperandsAdvanced; i++) {
        operands.push(getRandomDecimal(10, getRandomInt(300, 1500), problemMaxDecimals));
      }
       // Asegurar al menos 3 operandos
      while(operands.length < 3) {
           operands.push(getRandomDecimal(1,10, problemMaxDecimals)); // Añadir decimales pequeños como fallback
      }
      break;
    case "expert": // 4-5 operandos, siempre vertical, 1 o 2 decimales
      layout = 'vertical';
      const numOperandsExpert = getRandomBool() ? 4 : 5; // 50% 4 ops, 50% 5 ops
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1; // 75% chance de 2 decimales
      for (let i = 0; i < numOperandsExpert; i++) {
        operands.push(getRandomDecimal(100, getRandomInt(1000, 5000), problemMaxDecimals));
      }
       // Asegurar al menos 4 operandos
       while(operands.length < 4) {
           operands.push(getRandomDecimal(10,100, problemMaxDecimals)); // Añadir decimales como fallback
       }
      break;
    default: // Fallback a beginner si la dificultad no es reconocida o es undefined
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
  }

  if (operands.length < 1) { // Salvaguarda final: si por alguna razón no se generaron operandos
    operands = [getRandomInt(1,5), getRandomInt(1,5)];
    layout = 'horizontal';
    problemMaxDecimals = 0;
  } else if (operands.length === 1) { // Asegurar al menos dos operandos para una suma "real"
     operands.push(getRandomDecimal(1, (operands[0] > 10 ? 10 : operands[0]), problemMaxDecimals)); // Añadir un segundo operando pequeño
  }


  const sum = operands.reduce((acc, val) => acc + val, 0);

   // Determinar los decimales efectivos en la respuesta *basado en los operandos sumados*.
   // El resultado debe tener tantos decimales como el operando con más decimales para esa suma específica.
   let effectiveDecimalsInResult = 0;
   operands.forEach(op => {
       const opStr = String(op);
       const decimalPart = opStr.split('.')[1];
       if (decimalPart) {
           effectiveDecimalsInResult = Math.max(effectiveDecimalsInResult, decimalPart.length);
       }
   });

  const correctAnswer = parseFloat(sum.toFixed(effectiveDecimalsInResult));

  const correctAnswerStr = correctAnswer.toFixed(effectiveDecimalsInResult);
  const [integerPartOfSumStr, decimalPartOfSumStr = ""] = correctAnswerStr.split('.');

  // answerMaxDigits: Número TOTAL de dígitos necesarios para representar la respuesta
  // (incluyendo ceros a la izquierda si toFixed los añadió, pero generalmente no).
  // Es la longitud de la string formateada SIN el punto.
  const answerMaxDigits = integerPartOfSumStr.length + decimalPartOfSumStr.length;

  let answerDecimalPosition: number | undefined = undefined;
  if (effectiveDecimalsInResult > 0) {
      // answerDecimalPosition: Número de dígitos *después* del punto.
      answerDecimalPosition = effectiveDecimalsInResult;
  }
   // Note: Tu ejemplo incluía `numberOfAnswerSlots`. Si esto se refería al total de cajas
   // incluyendo un slot para el punto, esa lógica se manejaría en el componente de renderizado.
   // Si se refería a la longitud total de dígitos, es answerMaxDigits. Usaremos answerMaxDigits
   // para la generación y el renderizado calculará las cajas visuales.


  return {
    id,
    num1: operands[0], // Propiedad mantenida por compatibilidad
    num2: operands.length > 1 ? operands[1] : 0, // Propiedad mantenida por compatibilidad
    operands,
    correctAnswer,
    layout,
    answerMaxDigits, // Total de dígitos en la respuesta (sin punto)
    answerDecimalPosition, // Número de decimales
    difficulty, // Dificultad con la que se generó
  };
}

// --- Validación de la Respuesta del Usuario ---
function checkAnswer(problem: AdditionProblem, userAnswer: number | null): boolean {
  // Considerar null o NaN como incorrecto
  if (userAnswer === null || isNaN(userAnswer)) return false;

  // La precisión para la comparación se basa en los decimales esperados en la respuesta
  const precisionForComparison = problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0
    ? problem.answerDecimalPosition
    : 0;

  const factor = Math.pow(10, precisionForComparison);
  // Redondear ambas respuestas a la precisión requerida antes de comparar
  const roundedCorrectAnswer = Math.round(problem.correctAnswer * factor) / factor;
  const roundedUserAnswer = Math.round(userAnswer * factor) / factor;

   // Usar una pequeña tolerancia para comparar números flotantes
   const epsilon = Number.EPSILON * 2; // Una pequeña tolerancia
  return Math.abs(roundedUserAnswer - roundedCorrectAnswer) < epsilon;
}

// --- Funciones auxiliares para formatear números para la vista vertical ---
// Esta función ayuda a alinear los números correctamente en el formato vertical.
export function getVerticalAlignmentInfo(
    operands: number[],
    // Pasamos los decimales esperados en la respuesta para asegurar alineación consistente
    problemOverallDecimalPrecision?: number
): {
    maxIntLength: number;
    maxDecLength: number;
    operandsFormatted: Array<{ original: number, intStr: string, decStr: string }>;
    sumLineTotalCharWidth: number;
} {
    // Usar la precisión definida en el problema si está disponible, si no, calcular el máximo en operandos
    let effectiveDecimalPlacesToShow = problemOverallDecimalPrecision !== undefined ? problemOverallDecimalPrecision : 0;

     if (problemOverallDecimalPrecision === undefined) { // Si no se especifica precisión global, calcular la máxima en los operandos
         operands.forEach(op => {
            const opStr = String(op);
            const decimalPart = opStr.split('.')[1];
            if (decimalPart) {
                effectiveDecimalPlacesToShow = Math.max(effectiveDecimalPlacesToShow, decimalPart.length);
            }
        });
     }


    const operandsDisplayInfo = operands.map(op => {
        // Formatear con el número efectivo de decimales para mostrar, manteniendo ceros finales si toFixed los añade
        const s = op.toFixed(effectiveDecimalPlacesToShow);
        const parts = s.split('.');
        return {
            original: op,
            intPart: parts[0],
            decPart: parts[1] || "" // Puede que no haya parte decimal si effectiveDecimalPlacesToShow es 0
        };
    });

    // Calcular la longitud máxima de la parte entera para la alineación
    const maxIntLength = Math.max(1, ...operandsDisplayInfo.map(info => info.intPart.length));
    // La longitud máxima de la parte decimal es la precisión efectiva determinada
    const maxDecLength = effectiveDecimalPlacesToShow;

    const operandsFormatted = operandsDisplayInfo.map(info => ({
        original: info.original,
        // Rellenar la parte entera con espacios a la izquierda para alinear a la derecha
        intStr: info.intPart.padStart(maxIntLength, ' '),
        // Rellenar la parte decimal con ceros a la derecha hasta la longitud máxima de decimales
        decStr: info.decPart.padEnd(maxDecLength, '0') // Usar '0' para rellenar decimales si es necesario
    }));

    // El ancho de la línea de suma debe ser suficiente para la parte entera más larga,
    // el punto decimal (si hay decimales), y la parte decimal más larga.
    // Añadimos un espacio extra a la izquierda para el signo '+' o para margen/alineación.
    const sumLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 : 0) + maxDecLength + 1; // +1 para el signo '+' o espacio

    return { maxIntLength, maxDecLength, operandsFormatted, sumLineTotalCharWidth };
}


// ========================================================================================
// COMPONENTE PRINCIPAL DEL EJERCICIO (Originalmente Exercise.tsx)
// ========================================================================================

interface ExerciseProps {
  // Usamos la interfaz local ModuleSettings
  settings: ModuleSettings;
  onOpenSettings: () => void; // Función para abrir la configuración (proveída por el padre)
}

// Estilos CSS para los elementos del ejercicio (cajas de dígitos, operandos verticales, etc.)
// Se asume el uso de Tailwind CSS o clases similares.
const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none outline-none"; // Añadido outline-none
const digitBoxFocusStyle = "border-blue-500 ring-2 ring-blue-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300";
const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const plusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const sumLineStyle = "border-t-2 border-gray-700 my-1";

export function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  // ==========================================
  // 4.1: ESTADO Y REFS
  // ==========================================
  // Lista completa de problemas para el ejercicio actual
  const [problemsList, setProblemsList] = useState<AdditionProblem[]>([]);
  // El problema que se muestra actualmente al usuario
  const [currentProblem, setCurrentProblem] = useState<AdditionProblem | null>(null);
  // El índice del problema que se muestra actualmente (puede ser un problema anterior)
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

  // Estado para los dígitos introducidos por el usuario en las cajas de respuesta
  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  // Índice de la caja de dígito actualmente enfocada para la entrada de teclado
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  // Dirección de la entrada de dígitos (LTR para horizontal, RTL para vertical)
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
  // Referencias a los elementos DOM de las cajas de dígitos para poder enfocar
  const digitBoxRefs = useRef<HTMLDivElement[]>([]);
  // Array auxiliar para construir y actualizar las referencias
  const boxRefsArrayRef = useRef<HTMLDivElement[]>([]); // Esto parece redundante si se actualiza digitBoxRefs.current directamente. Simplifiquemos y usemos solo digitBoxRefs.current


  // Historial de respuestas del usuario para cada problema
  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswer[]>([]);
  // Timer general del ejercicio
  const [timer, setTimer] = useState(0);
  // Timer para el problema actual (cuenta regresiva si settings.timeValue > 0)
  const [problemTimerValue, setProblemTimerValue] = useState(settings?.timeValue || 0);
  // Estado del ejercicio
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  // Estado para mostrar feedback al usuario
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue" | null>(null);
  // Estado para indicar que se ha respondido/agotado intentos y se espera clic en "Continuar"
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  // Ref para acceder al estado waitingForContinue en callbacks sin re-crearlos
  const waitingRef = useRef(waitingForContinue);

  // Estado para bloquear el avance automático (ej: durante modal de Level Up)
  const [blockAutoAdvance, setBlockAutoAdvance] = useState(false);
  // Estado del toggle de auto-continuar
  const [autoContinue, setAutoContinue] = useState(() => {
    // Leer del localStorage al inicializar
    try {
      const stored = localStorage.getItem('addition_autoContinue');
      return stored === 'true';
    } catch (e) {
      console.error("Error reading autoContinue from localStorage", e);
      return false;
    }
  });

  // Estado para la dificultad adaptativa (puede cambiar durante el ejercicio)
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel>(() => {
    // Intentar cargar del localStorage si existe, si no, usar setting inicial
    try {
        const storedAdaptive = localStorage.getItem('addition_adaptiveDifficulty');
        if(storedAdaptive && ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'].includes(storedAdaptive)) {
            return storedAdaptive as DifficultyLevel;
        }
        const storedSettings = localStorage.getItem('moduleSettings');
        if (storedSettings) {
            const parsedSettings = JSON.parse(storedSettings);
            if (parsedSettings.addition && parsedSettings.addition.difficulty) return parsedSettings.addition.difficulty as DifficultyLevel;
        }
    } catch (e) { console.error('Error loading adaptive difficulty from localStorage:', e); }
    // Usar defaultModuleSettings si settings no está definido o dificultad no es válida
    return (settings?.difficulty as DifficultyLevel) || defaultModuleSettings.difficulty as DifficultyLevel;
  });
  // Rachas de respuestas correctas/incorrectas consecutivas para la dificultad adaptativa
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveCorrectAnswers') || '0', 10));
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveIncorrectAnswers') || '0', 10));

  // Contador de intentos para el problema actual
  const [currentAttempts, setCurrentAttempts] = useState(0);
  // Estado para mostrar el modal/animación de subida de nivel
  const [showLevelUpReward, setShowLevelUpReward] = useState(false);
   // Estado para mostrar un modal genérico de confirmación (ej: reiniciar)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);


  // Estado para la navegación histórica (ver problemas anteriores)
  const [viewingPrevious, setViewingPrevious] = useState(false);
  // Índice del problema que estaba ACTIVO antes de empezar a ver problemas anteriores
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState<number>(0);

  // Refs para los timers para poder limpiarlos
  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);


  // --- Hooks de Contexto y Utilidades Externas Asumidas ---
  const { saveExerciseResult } = useProgress(); // Hook para guardar resultados
  const { updateModuleSettings } = useSettings(); // Hook para actualizar settings (ej: dificultad adaptativa)
  const { t } = useTranslations(); // Hook para traducciones
  const { setShowRewardAnimation } = useRewardsStore(); // Controlar animaciones de recompensa

  // ==========================================
  // 4.2: EFECTOS Y CALLBACKS
  // ==========================================

  // Sincronizar waitingRef con el estado waitingForContinue
  useEffect(() => {
    waitingRef.current = waitingForContinue;
  }, [waitingForContinue]);

  // Sincronizar autoContinue con localStorage
  useEffect(() => {
     try {
       localStorage.setItem('addition_autoContinue', autoContinue.toString());
     } catch (e) {
       console.error("Error writing autoContinue to localStorage", e);
     }
  }, [autoContinue]);

  // Sincronizar rachas y dificultad adaptativa con localStorage
  useEffect(() => {
      try {
          localStorage.setItem('addition_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString());
      } catch (e) { console.error("Error writing consecutiveCorrectAnswers to localStorage", e); }
  }, [consecutiveCorrectAnswers]);

  useEffect(() => {
      try {
          localStorage.setItem('addition_consecutiveIncorrectAnswers', consecutiveIncorrectAnswers.toString());
      } catch (e) { console.error("Error writing consecutiveIncorrectAnswers to localStorage", e); }
  }, [consecutiveIncorrectAnswers]);

  useEffect(() => {
      try {
          localStorage.setItem('addition_adaptiveDifficulty', adaptiveDifficulty);
      } catch (e) { console.error("Error writing adaptiveDifficulty to localStorage", e); }
  }, [adaptiveDifficulty]);


  // Hook para generar el set de problemas inicial o cuando cambian settings relevantes
  useEffect(() => {
    // Usar la dificultad adaptativa si está habilitada, de lo contrario usar la configuración global.
    // Si settings es undefined (ej. al cargar), usar defaultModuleSettings.
    const effectiveDifficulty = (settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty)
                                ? adaptiveDifficulty
                                : (settings?.difficulty as DifficultyLevel ?? defaultModuleSettings.difficulty as DifficultyLevel);
    const problemCount = settings?.problemCount ?? defaultModuleSettings.problemCount;
    const timeValue = settings?.timeValue ?? defaultModuleSettings.timeValue; // También regenerar si cambia el tiempo (afecta problemTimerValue inicial)

    console.log(`[ADDITION] Generating new problem set with difficulty: ${effectiveDifficulty}, count: ${problemCount}`);
    const newProblems = Array.from({ length: problemCount }, () =>
      generateAdditionProblem(effectiveDifficulty)
    );

    setProblemsList(newProblems);
    setCurrentProblemIndex(0); // Siempre empezar en el primer problema del nuevo set
    setActualActiveProblemIndexBeforeViewingPrevious(0); // El problema activo es el primero
    setCurrentProblem(newProblems[0]); // Cargar el primer problema

    // Inicializar historial de respuestas para el nuevo set
    setUserAnswersHistory(Array(newProblems.length).fill(null));
    setTimer(0); // Resetear timer general
    setExerciseStarted(false); // Reiniciar estado de ejercicio (el usuario debe presionar Start/Check)
    setExerciseCompleted(false);
    setFeedbackMessage(null); // Limpiar feedback
    setFeedbackColor(null);
    setWaitingForContinue(false); // No estamos esperando continuar al inicio
    setBlockAutoAdvance(false); // Desbloquear avance
    setShowLevelUpReward(false); // Ocultar modal de level up
    setViewingPrevious(false); // No estamos viendo problemas anteriores
    setProblemTimerValue(timeValue); // Resetear timer del problema
    setCurrentAttempts(0); // Resetear intentos del problema
    digitBoxRefs.current = []; // Limpiar referencias a las cajas de input

    // Si la dificultad efectiva usada es diferente a la que teníamos, actualizar estado de racha
    // Esto ocurre si settings.enableAdaptiveDifficulty cambia o si se fuerza un reset de settings.
    if (adaptiveDifficulty !== effectiveDifficulty) {
       console.log(`[ADDITION] Difficulty mismatch, resetting adaptive state. Effective: ${effectiveDifficulty}, Current Adaptive: ${adaptiveDifficulty}`);
       setAdaptiveDifficulty(effectiveDifficulty); // Asegurar que el estado adaptativo refleje la dificultad inicial
       setConsecutiveCorrectAnswers(0); // Resetear racha si cambia la dificultad "base"
       setConsecutiveIncorrectAnswers(0);
    } else {
        // Si la dificultad no cambió, las rachas se mantienen (cargadas desde localStorage)
        console.log(`[ADDITION] Difficulty consistent. Maintaining adaptive state. Racha Correctas: ${consecutiveCorrectAnswers}, Racha Incorrectas: ${consecutiveIncorrectAnswers}`);
    }

  // Regenerar solo cuando cambian los parámetros que afectan la generación O la dificultad adaptativa
  // settings?.prop para manejar caso settings undefined
  // Incluir adaptiveDifficulty aquí es crucial porque la generación depende de él cuando adaptiveDifficulty está activado
  // Incluir problemCount y timeValue para regenerar si cambian
  // Dependencias: settings (para problemCount, difficulty, enableAdaptiveDifficulty, timeValue), adaptiveDifficulty
  }, [settings?.problemCount, settings?.difficulty, settings?.enableAdaptiveDifficulty, settings?.timeValue, adaptiveDifficulty]);


  // Hook para reaccionar a cambios en el problema actual o el estado de vista
  // Se ejecuta cuando currentProblemIndex cambia, o cuando salimos/entramos a viewingPrevious
  // O cuando se completa el ejercicio.
  useEffect(() => {
    // Limpiar timer anterior si existe
    if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
        singleProblemTimerRef.current = null;
    }
     // Limpiar timer de auto-continuar si existe
    if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
    }


    if (currentProblem && !viewingPrevious && !exerciseCompleted) {
      // Estamos en un problema activo, no viendo anteriores, y el ejercicio no ha terminado.
      const numBoxes = currentProblem.answerMaxDigits || 0;

      // Siempre limpiar las respuestas actuales en las cajas visualmente al cargar un problema activo
      setDigitAnswers(Array(numBoxes).fill(""));

      // Resetear las referencias de las cajas. Se rellenarán en el render.
      digitBoxRefs.current = [];


      // Cargar el estado de respuesta y feedback del historial si ya existe una entrada para este problema
      const historyEntryForCurrent = userAnswersHistory[currentProblemIndex];

      if (historyEntryForCurrent && historyEntryForCurrent.problemId === currentProblem.id) {
          console.log(`[ADDITION] Found history for active problem ${currentProblemIndex}:`, historyEntryForCurrent.status);
          // Restaurar estado basado en el historial
          setCurrentAttempts(historyEntryForCurrent.attemptsMade || 0); // Restaurar intentos si se guardaron, si no, 0.
          setProblemTimerValue(settings?.timeValue ?? defaultModuleSettings.timeValue); // Resetear timer para el nuevo intento/estado

          if (historyEntryForCurrent.status === 'correct') {
              setFeedbackMessage(t('exercises.correct'));
              setFeedbackColor("green");
              setWaitingForContinue(true); // Esperar continuar después de correcto
              setFocusedDigitIndex(null); // Quitar foco si está esperando

          } else if (historyEntryForCurrent.status === 'revealed' || historyEntryForCurrent.status === 'timeout') {
              // Revelado o Timeout sin respuesta -> mostrar respuesta correcta y esperar continuar
              setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
              setFeedbackColor(historyEntryForCurrent.status === 'revealed' ? "blue" : "red"); // Azul para revelado manual, rojo para timeout/agotado
              setWaitingForContinue(true); // Esperar continuar
              setFocusedDigitIndex(null); // Quitar foco si está esperando

          } else if (historyEntryForCurrent.status === 'incorrect') {
              // Incorrecta, pero aún puede haber intentos.
              // Verificar si los intentos se agotaron al momento de la respuesta.
               const maxAttempts = settings?.maxAttempts ?? defaultModuleSettings.maxAttempts;
               const attemptsMade = historyEntryForCurrent.attemptsMade || 0;

               if (maxAttempts > 0 && attemptsMade >= maxAttempts) {
                   // Se agotaron intentos al momento de la respuesta
                   setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
                   setFeedbackColor("red");
                   setWaitingForContinue(true); // Esperar continuar
                   setFocusedDigitIndex(null); // Quitar foco si está esperando
               } else {
                   // Incorrecta, pero quedan intentos (o ilimitados). Permitir reintentar.
                   setFeedbackMessage(t('exercises.yourPreviousAnswerWas', { userAnswer: (historyEntryForCurrent.userAnswer === null || isNaN(historyEntryForCurrent.userAnswer)) ? t('common.notAnswered') : historyEntryForCurrent.userAnswer }));
                   setFeedbackColor("red");
                   setWaitingForContinue(false); // Permitir reintentar
                    // Enfocar input si se permite reintentar
                   const numBoxes = currentProblem.answerMaxDigits || 0;
                   if (currentProblem.layout === 'horizontal') {
                      setInputDirection('ltr');
                      setFocusedDigitIndex(numBoxes > 0 ? 0 : null);
                    } else { // Vertical
                      setInputDirection('rtl');
                      setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null);
                    }
               }
          } else { // 'unanswered' o 'skipped'
              // Problema sin respuesta registrada o marcado como saltado -> limpiar y permitir empezar
              console.log(`[ADDITION] Problem ${currentProblemIndex} status is '${historyEntryForCurrent.status}', allowing new attempt.`);
              setFeedbackMessage(null);
              setFeedbackColor(null);
              setWaitingForContinue(false); // Permitir empezar
              setCurrentAttempts(0); // Resetear intentos si estaba sin responder

               // Enfocar input si se permite empezar
              const numBoxes = currentProblem.answerMaxDigits || 0;
               if (currentProblem.layout === 'horizontal') {
                  setInputDirection('ltr');
                  setFocusedDigitIndex(numBoxes > 0 ? 0 : null);
                } else { // Vertical
                  setInputDirection('rtl');
                  setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null);
                }
          }

      } else {
          // Problema nuevo (o no encontrado en historial) -> limpiar y permitir empezar
          console.log(`[ADDITION] No history found for active problem ${currentProblemIndex}. Starting fresh.`);
          setFeedbackMessage(null);
          setFeedbackColor(null);
          setWaitingForContinue(false); // Permitir empezar
          setCurrentAttempts(0); // Resetear intentos para un problema nuevo

           // Enfocar input
           const numBoxes = currentProblem.answerMaxDigits || 0;
           if (currentProblem.layout === 'horizontal') {
              setInputDirection('ltr');
              setFocusedDigitIndex(numBoxes > 0 ? 0 : null);
            } else { // Vertical
              setInputDirection('rtl');
              setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null);
            }
           // El timer se iniciará si aplica en el otro useEffect
      }


    } else if (viewingPrevious && currentProblem) {
      // Estamos viendo un problema anterior
      console.log(`[ADDITION] Viewing previous problem ${currentProblemIndex}.`);
      setFocusedDigitIndex(null); // Quitar foco de las cajas
      setWaitingForContinue(false); // No estamos "esperando continuar" un problema activo
      setFeedbackMessage(null); // Limpiar feedback del problema activo
      setFeedbackColor(null);

       // Cargar la respuesta y estado del historial para la vista
      const historyEntry = userAnswersHistory[currentProblemIndex];
       if (historyEntry && historyEntry.problemId === currentProblem.id) {
           // Reconstruir la string de la respuesta para mostrar en las cajas
           const answerStr = historyEntry.userAnswerString || ""; // Usar userAnswerString si está guardado
           // O reconstruir desde el número si no se guarda la string exacta
           // const answerStr = (historyEntry.userAnswer === null || isNaN(historyEntry.userAnswer)) ? "" : String(historyEntry.userAnswer);

           const numBoxes = currentProblem.answerMaxDigits || 0;
           const restoredDigitAnswers = Array(numBoxes).fill('');

            // Rellenar las cajas con la string de respuesta guardada/reconstruida
            // Esta parte es tricky sin guardar el formato exacto del input.
            // Un enfoque simple es simplemente poner los dígitos del número, ignorando la alineación exacta del usuario.
            const displayAnswerString = (historyEntry.userAnswer === null || isNaN(historyEntry.userAnswer)) ? "" : String(historyEntry.userAnswer);
            const displayDigits = displayAnswerString.replace('.', '').split('');

            // Rellenar de izquierda a derecha
            for (let i = 0; i < Math.min(restoredDigitAnswers.length, displayDigits.length); i++) {
                restoredDigitAnswers[i] = displayDigits[i];
            }

           setDigitAnswers(restoredDigitAnswers);
           // Mostrar feedback basado en el historial
           setFeedbackMessage(
               historyEntry.isCorrect ?
               t('exercises.yourAnswerWasCorrect', { userAnswer: historyEntry.userAnswer }) :
               historyEntry.status === 'revealed' ? t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }) :
               t('exercises.yourAnswerWasIncorrect', { userAnswer: (historyEntry.userAnswer === null || isNaN(historyEntry.userAnswer) ? t('common.notAnswered') : historyEntry.userAnswer), correctAnswer: currentProblem.correctAnswer })
           );
           setFeedbackColor(historyEntry.isCorrect ? "green" : (historyEntry.status === 'revealed' ? "blue" : "red"));

       } else {
           // No hay historia para este problema (ej. era el problema activo antes de cambiar de vista)
           console.log(`[ADDITION] No history found for problem ${currentProblemIndex} in history view.`);
           setDigitAnswers(Array(currentProblem.answerMaxDigits).fill("")); // Limpiar cajas
           setFeedbackMessage(t('exercises.noAnswerRecordedForThisProblem')); // O un mensaje diferente
           setFeedbackColor("blue"); // Color neutro
       }

    } else if (exerciseCompleted) {
      // El ejercicio ha terminado
      console.log("[ADDITION] Exercise completed state detected.");
      setFocusedDigitIndex(null); // Quitar foco
      setWaitingForContinue(false); // No hay botón de continuar al final
       // Limpiar timers
       if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
       singleProblemTimerRef.current = null;
       if (generalTimerRef.current) clearInterval(generalTimerRef.current);
       generalTimerRef.current = null;
       if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
       autoContinueTimerRef.current = null;
       // El feedback y resumen se manejan por la renderización condicional del estado exerciseCompleted
    } else {
        // Esto no debería pasar si currentProblem existe, pero es una salvaguarda
         console.warn("[ADDITION] useEffect(currentProblemIndex, ...) triggered in unexpected state.");
    }

    // No necesitamos re-iniciar timers aquí, el useEffect del timer se encargará
    // basado en el estado final de exerciseStarted, exerciseCompleted, viewingPrevious, waitingForContinue.


  // Dependencias: currentProblem, currentProblemIndex, viewingPrevious, exerciseCompleted,
  // userAnswersHistory, settings (para maxAttempts, timeValue, etc), adaptiveDifficulty, t.
  // También set... setters para actualizar el estado.
  // No incluir problemTimerValue, currentAttempts, digitAnswers, focusedDigitIndex, inputDirection
  // como dependencias de este efecto principal, ya que este efecto *configura* esos estados
  // basándose en el problema actual y su historia.
  }, [
    currentProblem, currentProblemIndex, viewingPrevious, exerciseCompleted, userAnswersHistory,
    settings?.maxAttempts, settings?.timeValue, adaptiveDifficulty, t, /* set... setters */
     setDigitAnswers, setFocusedDigitIndex, setInputDirection, setUserAnswersHistory,
     setFeedbackMessage, setFeedbackColor, setWaitingForContinue, setCurrentAttempts, setProblemTimerValue,
     defaultModuleSettings.maxAttempts, defaultModuleSettings.timeValue // Usar defaults si settings es undefined
  ]);


   // Hook para manejar el enfoque en la caja de input activa.
   // Depende solo del índice enfocado y si estamos en un estado que permite input.
  useEffect(() => {
     // Solo intentar enfocar si hay un índice enfocado y no estamos en estados deshabilitantes
     // Usar waitingRef.current para la comprobación más actualizada
    if (focusedDigitIndex !== null && !viewingPrevious && !exerciseCompleted && !waitingRef.current && !showLevelUpReward) {
       // Usar setTimeout para asegurar que el elemento existe en el DOM después de la actualización del estado
      const element = digitBoxRefs.current[focusedDigitIndex];
      if (element) {
        // Pequeño retardo para asegurar que el DOM se ha actualizado
        const handler = setTimeout(() => {
          try {
             element.focus();
             // console.log(`[ADDITION] Focused digit box at index ${focusedDigitIndex}.`);
          } catch (error) {
             console.error(`[ADDITION] Failed to focus element at index ${focusedDigitIndex}:`, error);
          }
        }, 10); // 10ms es usualmente suficiente

         return () => clearTimeout(handler); // Limpiar el timeout si las dependencias cambian antes de que se dispare
      } else {
         // console.log(`[ADDITION] Element at index ${focusedDigitIndex} not found for focusing.`);
      }
    }
    // Limpiar el foco si entramos en un estado que lo deshabilita
    else if (focusedDigitIndex !== null && (viewingPrevious || exerciseCompleted || waitingRef.current || showLevelUpReward)) {
        setFocusedDigitIndex(null);
        // console.log("[ADDITION] Removed focus due to state change.");
    }

  // Dependencias: focusedDigitIndex, viewingPrevious, exerciseCompleted, waitingRef.current, showLevelUpReward
  // digitBoxRefs.current NO debe ser una dependencia directa aquí, ya que es una ref mutable.
  // Su contenido cambia (el array de refs), pero la ref `digitBoxRefs` en sí misma no cambia.
  // El efecto debe re-ejecutarse cuando `focusedDigitIndex` cambia y las condiciones de estado lo permiten.
  // Asumimos que `digitBoxRefs.current` estará actualizado cuando se necesite debido a los renders.
  }, [focusedDigitIndex, viewingPrevious, exerciseCompleted, waitingRef.current, showLevelUpReward]); // Solo estas dependencias


  // Hook para el timer general del ejercicio
  useEffect(() => {
    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    generalTimerRef.current = null;

    if (exerciseStarted && !exerciseCompleted) {
      console.log("[ADDITION] Starting general timer.");
      generalTimerRef.current = window.setInterval(() => {
          setTimer(prev => prev + 1);
      }, 1000);
    } else {
        console.log("[ADDITION] Not starting general timer.", { exerciseStarted, exerciseCompleted });
    }

    return () => {
      console.log("[ADDITION] Cleaning up general timer.");
      if (generalTimerRef.current) clearInterval(generalTimerRef.current);
      generalTimerRef.current = null;
    };
  // Dependencias: exerciseStarted, exerciseCompleted.
  }, [exerciseStarted, exerciseCompleted]);


  // Hook para el timer de cada problema individual
  useEffect(() => {
    // Limpiar el timer anterior antes de configurar uno nuevo
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    singleProblemTimerRef.current = null;


    // Iniciar el timer del problema si:
    // 1. El ejercicio ha comenzado pero no terminado.
    // 2. Hay un problema actual cargado.
    // 3. NO estamos viendo problemas anteriores.
    // 4. settings.timeValue es mayor que 0 (hay límite de tiempo).
    // 5. NO estamos esperando una acción de "Continuar".
    // 6. Todavía quedan intentos disponibles para el problema actual (si maxAttempts es > 0).
    // 7. No estamos bloqueados por el modal de level up.

    const timeLimitActive = (settings?.timeValue ?? defaultModuleSettings.timeValue) > 0;
    const attemptsRemaining = (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts) === 0 || currentAttempts < (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts);

    const shouldStartProblemTimer = exerciseStarted &&
                                   !exerciseCompleted &&
                                   currentProblem !== null &&
                                   !viewingPrevious &&
                                   timeLimitActive &&
                                   !waitingRef.current && // Usa la ref actualizada
                                   attemptsRemaining && // Verifica intentos
                                   !showLevelUpReward; // No correr timer si el modal level up está abierto

    if (shouldStartProblemTimer) {
       console.log("[ADDITION] Starting problem timer...");
       // problemTimerValue ya debería estar seteado al valor correcto (ej. settings.timeValue)
       // por el cambio de problema o por handleTimeOrAttemptsUp/checkCurrentAnswer para el siguiente intento.
       singleProblemTimerRef.current = window.setInterval(() => {
         setProblemTimerValue(prevTimerValue => {
           if (prevTimerValue <= 1) {
             console.log("[ADDITION] Problem timer reached 0.");
             if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
             singleProblemTimerRef.current = null;
             // Llamar a la función que maneja el fin del tiempo o intentos
             handleTimeOrAttemptsUp(); // Usa la versión memoizada/stable de useCallback
             return 0; // Establecer el timer a 0 al finalizar
           }
           return prevTimerValue - 1;
         });
       }, 1000);
    } else {
        // console.log("[ADDITION] Not starting problem timer.", { exerciseStarted, exerciseCompleted, currentProblem: !!currentProblem, viewingPrevious, timeValue: settings?.timeValue, waiting: waitingRef.current, attemptsLeft: attemptsRemaining, levelUpModal: showLevelUpReward });
    }


    // Función de limpieza al desmontar o re-ejecutar el efecto
    return () => {
      console.log("[ADDITION] Cleaning up problem timer...");
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;
      // Limpiar el timer de auto-continuar aquí no es ideal, se limpia en handleContinue o cuando no se espera continuar.
      // Pero lo hacemos como salvaguarda si el componente se desmonta.
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    };

  // Dependencias:
  // - exerciseStarted, exerciseCompleted: Controlan si el timer debe estar activo.
  // - settings.timeValue, settings.maxAttempts (o sus defaults): Si el límite de tiempo/intentos cambia o se desactiva.
  // - currentProblem: Si cambia el problema (reinicia el timer).
  // - viewingPrevious: El timer solo corre para el problema activo.
  // - currentAttempts: Para saber si quedan intentos y el timer debe seguir.
  // - waitingRef.current: Para pausar el timer cuando se espera 'Continuar'.
  // - showLevelUpReward: Para pausar el timer durante el modal de level up.
  // - handleTimeOrAttemptsUp: La función que se llama al acabar el tiempo (debe ser estable).
  // problemTimerValue no necesita ser dependencia si solo se usa el valor inicial de settings.timeValue aquí.
  }, [ exerciseStarted, exerciseCompleted, settings?.timeValue, settings?.maxAttempts, currentProblem,
       viewingPrevious, currentAttempts, waitingRef, showLevelUpReward,
       defaultModuleSettings.timeValue, defaultModuleSettings.maxAttempts
     ]);


  // Usa useCallback para estabilizar la función checkCurrentAnswer
  const checkCurrentAnswer = useCallback(() => {
    // Usar waitingRef.current para la comprobación más actualizada
    // Bloquear si ya se está esperando continuar, ejercicio completado, viendo historial, o modal de level up activo
    if (!currentProblem || waitingRef.current || exerciseCompleted || viewingPrevious || showLevelUpReward) {
       console.log("[ADDITION] checkAnswer blocked:", { currentProblem: !!currentProblem, waiting: waitingRef.current, completed: exerciseCompleted, viewing: viewingPrevious, levelUp: showLevelUpReward });
       return false; // No se pudo verificar o ya se está en un estado de espera/finalización
    }

    // Si el ejercicio no ha comenzado, empezarlo al primer intento de check válido
    if (!exerciseStarted) {
      startExercise(); // Esto pondrá exerciseStarted a true
      // No verificamos la respuesta en este mismo ciclo, el usuario tendrá que hacer clic de nuevo
      // después de que el estado cambie.
      return false;
    }

    // Reconstruir la respuesta del usuario desde las cajas
    let userAnswerString = "";
    const decPosInAnswer = currentProblem.answerDecimalPosition;
    const totalDigitBoxes = currentProblem.answerMaxDigits;
    const integerBoxesCount = totalDigitBoxes - (decPosInAnswer || 0);

     // Manejar el caso donde no se han introducido dígitos
    const filledAnswers = digitAnswers.filter(d => d && d.trim() !== "");
    if (filledAnswers.length === 0) {
       // Solo mostrar feedback si se hace clic en Check sin input.
       // Si el timer se agota sin input, handleTimeOrAttemptsUp lo manejará.
       setFeedbackMessage(t('exercises.noAnswerEntered'));
       setFeedbackColor("blue"); // Color neutro
       console.log("[ADDITION] Check clicked with no digits entered.");
       // No contamos esto como un intento fallido que agota intentos.
       return false; // Inválido, no resuelto
    }

    // Reconstruir la string de respuesta, añadiendo el punto decimal si aplica.
    // La parte entera son los dígitos antes de la posición decimal.
    const integerPart = digitAnswers.slice(0, integerBoxesCount).join('');
    // La parte decimal son los dígitos desde la posición decimal hasta el final.
    const decimalPart = digitAnswers.slice(integerBoxesCount).join('');

    if (decPosInAnswer !== undefined && decPosInAnswer > 0) {
         // Solo añadir el punto si hay decimales esperados en la respuesta.
        userAnswerString = `${integerPart || '0'}.${decimalPart}`;
    } else {
        userAnswerString = integerPart || '0'; // Si no hay decimales, es solo la parte entera.
    }

    // Intentar convertir la string a número. parseFloat maneja bien los casos como "12.", ".5", "12.34".
    const userNumericAnswer = parseFloat(userAnswerString);

    // Validación más robusta: si el input string no resulta en un número válido, es inválido.
    if (isNaN(userNumericAnswer)) {
        setFeedbackMessage(t('exercises.invalidAnswer'));
        setFeedbackColor("red");
        console.log("[ADDITION] Invalid answer entered:", userAnswerString);
        // No contamos esto como un intento agotable.
        return false;
    }

    // **Incrementar intento AQUÍ** solo si la respuesta es numérica y válida para evaluar
    const newAttempts = currentAttempts + 1;
    setCurrentAttempts(newAttempts);
    console.log(`[ADDITION] Attempt ${newAttempts}/${settings?.maxAttempts ?? 'Unlimited'}`);

    // Realizar la verificación de la respuesta usando la utilidad checkAnswer
    const isCorrect = checkAnswer(currentProblem, userNumericAnswer);

    // Actualizar el historial para el problema actual
    const problemIndexForHistory = currentProblemIndex; // El índice actual es el que se actualiza
    // Buscamos la entrada existente para mantener posibles datos anteriores (si los hubiera, aunque limpiamos)
    const existingHistoryEntry = userAnswersHistory[problemIndexForHistory];

    const newHistoryEntry: UserAnswer = existingHistoryEntry ? {
        ...existingHistoryEntry, // Mantener id, problem (referencia), etc.
        userAnswerString: userAnswerString, // Guardar la string introducida por el usuario
        userAnswer: userNumericAnswer, // Guardar el valor numérico
        isCorrect: isCorrect,
        status: isCorrect ? 'correct' : 'incorrect', // Estado inicial del intento
        attemptsMade: newAttempts, // Guardar el número de intentos hechos para este problema
    } : { // Crear una nueva entrada si no existía (no debería pasar si problemsList se inicializa con nulls)
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswerString: userAnswerString,
        userAnswer: userNumericAnswer,
        isCorrect: isCorrect,
        status: isCorrect ? 'correct' : 'incorrect',
        attemptsMade: newAttempts,
    };

    setUserAnswersHistory(prev => {
        const newHistory = [...prev];
        newHistory[problemIndexForHistory] = newHistoryEntry; // Reemplazar o añadir la entrada
        return newHistory;
    });

    // Si el problema actual es el último problema ACTIVO (no solo el que estamos viendo en historial),
    // actualizamos el índice del último problema activo intentado.
    if (!viewingPrevious && currentProblemIndex >= actualActiveProblemIndexBeforeViewingPrevious) {
       setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
    }


    if (isCorrect) {
      console.log("[ADDITION] Correct answer!");
      setFeedbackMessage(t('exercises.correct'));
      setFeedbackColor("green");
      const newConsecutive = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newConsecutive);
      setConsecutiveIncorrectAnswers(0); // Rompe la racha de incorrectas

      // Lógica de dificultad adaptativa (subir nivel)
       const enableAdaptive = settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty;
      if (enableAdaptive && newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP) {
          const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
          if (currentLevelIdx < difficultiesOrder.length - 1) {
              const newLevel = difficultiesOrder[currentLevelIdx + 1];
              console.log(`[ADDITION] Level Up! From ${adaptiveDifficulty} to ${newLevel}`);
              setAdaptiveDifficulty(newLevel); // Actualizar estado de dificultad adaptativa
              // Guardar la nueva dificultad inmediatamente via settings context
              updateModuleSettings("addition", { ...settings, difficulty: newLevel }); // Asegurar que otras settings se mantienen
              setConsecutiveCorrectAnswers(0); // Resetear racha para el nuevo nivel
              setConsecutiveIncorrectAnswers(0); // Resetear racha incorrecta por si acaso
              setShowLevelUpReward(true); // Mostrar modal/animación de level up
              setBlockAutoAdvance(true); // Bloquear avance automático hasta que se cierre el modal
              // eventBus.emit es asumido externo
              eventBus.emit('levelUp', {
                previousLevel: adaptiveDifficulty,
                newLevel,
                consecutiveCorrectAnswers: newConsecutive
              });
          } else {
             console.log("[ADDITION] Max level reached. Not leveling up.");
          }
      }

      // Lógica de recompensas aleatorias
       const enableRewards = settings?.enableRewards ?? defaultModuleSettings.enableRewards;
      if (enableRewards) {
           // getRewardProbability y awardReward son asumidos externos
          const rewardContext = { streak: newConsecutive, difficulty: adaptiveDifficulty, problemIndex: currentProblemIndex, totalProblems: problemsList.length };
          if (Math.random() < getRewardProbability(rewardContext as any)) {
              console.log("[ADDITION] Awarding random reward!");
              awardReward('addition_correct_answer', { module: 'addition', difficulty: adaptiveDifficulty }); // Usar un ID de recompensa más específico
               // setShowRewardAnimation es asumido externo
              setShowRewardAnimation(true); // Mostrar animación de recompensa (componente RewardAnimation)
          }
      }

      // Problema resuelto correctamente -> esperar clic en continuar
      setWaitingForContinue(true); // Pone waitingRef.current = true via useEffect
      setFocusedDigitIndex(null); // Quitar foco
      // Detener timer del problema actual
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null;

      // Iniciar timer de auto-continuar si está activado Y no estamos bloqueados por level up
       const enableAutoContinue = autoContinue && !((settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) && newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP);
      if (enableAutoContinue && !blockAutoAdvance) { // También verificar blockAutoAdvance
        if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); // Limpiar timer previo por si acaso
         console.log("[ADDITION] Auto-continue enabled, waiting 3s...");
        autoContinueTimerRef.current = setTimeout(() => {
          // Verificar si waitingRef.current sigue siendo true y si no hay bloqueo antes de avanzar
          if (!blockAutoAdvance && waitingRef.current) { // Re-check waitingRef.current
            console.log("[ADDITION] Auto-continuing...");
            handleContinue(); // Usar la versión memoizada/stable
            autoContinueTimerRef.current = null;
          } else {
             console.log("[ADDITION] Auto-continue blocked or waiting state changed before auto-continue trigger.");
          }
        }, 3000); // 3 segundos de espera antes de avanzar
      }
      return true; // Problema resuelto (correctamente)
    } else { // Incorrecta
      console.log(`[ADDITION] Incorrect answer: ${userNumericAnswer} (Correct: ${currentProblem.correctAnswer})`);
      // No mostrar feedback inmediato si la configuración lo prohíbe
       const showImmediate = settings?.showImmediateFeedback ?? defaultModuleSettings.showImmediateFeedback;
       if (showImmediate) {
          setFeedbackMessage(t('exercises.incorrect'));
          setFeedbackColor("red");
       } else {
           setFeedbackMessage(null); // Limpiar feedback si no es inmediato
           setFeedbackColor(null);
       }


      const newConsecutiveInc = consecutiveIncorrectAnswers + 1;
      setConsecutiveIncorrectAnswers(newConsecutiveInc);
      setConsecutiveCorrectAnswers(0); // Rompe la racha de correctas

      // Lógica de dificultad adaptativa (bajar nivel)
       const enableAdaptive = settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty;
      if (enableAdaptive && newConsecutiveInc >= 5) { // Bajar nivel después de X incorrectas seguidas
          const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
          if (currentLevelIdx > 0) {
              const newLevel = difficultiesOrder[currentLevelIdx - 1];
              console.log(`[ADDITION] Level Down! From ${adaptiveDifficulty} to ${newLevel}`);
              setAdaptiveDifficulty(newLevel); // Actualizar estado de dificultad adaptativa
               // Guardar la nueva dificultad inmediatamente via settings context
              updateModuleSettings("addition", { ...settings, difficulty: newLevel }); // Asegurar que otras settings se mantienen
              setConsecutiveIncorrectAnswers(0); // Resetear racha de incorrectas al bajar nivel
               // Si se mostró feedback inmediato, añadir el mensaje de bajada de nivel
              if (showImmediate) {
                 setFeedbackMessage(prev => `${t('adaptiveDifficulty.levelDecreased', { level: t(newLevel) })}. ${prev || t('exercises.incorrect')}`);
              } else {
                  // Si no hay feedback inmediato, solo loggearlo o manejarlo de otra forma
              }
          } else {
             console.log("[ADDITION] Min level reached. Not leveling down.");
          }
      }

      // Lógica de intentos máximos
       const maxAttempts = settings?.maxAttempts ?? defaultModuleSettings.maxAttempts;
      if (maxAttempts > 0 && newAttempts >= maxAttempts) {
        console.log(`[ADDITION] Max attempts reached (${maxAttempts}). Revealing answer.`);
        // Mostrar mensaje de respuesta correcta (por agotamiento de intentos)
        setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer })); // Mensaje de agotamiento de intentos
        setFeedbackColor("red"); // O color de revelado si es diferente

        // Actualizar historial para reflejar que la respuesta fue revelada (o intentos agotados)
        // La entrada ya existe en newHistoryEntry, solo actualizamos el status
        const updatedHistoryEntryWithRevealStatus: UserAnswer = { ...newHistoryEntry, status: 'revealed' }; // Marcar como revelado
         // Actualizar el historial de nuevo con el status final de "revelado"
        setUserAnswersHistory(prev => {
            const newHistory = [...prev];
            newHistory[problemIndexForHistory] = updatedHistoryEntryWithRevealStatus;
            return newHistory;
        });

        // Poner waitingForContinue(true) -> espera para continuar al siguiente problema
        setWaitingForContinue(true); // Pone waitingRef.current = true via useEffect
        setFocusedDigitIndex(null); // Quitar foco
        // Detener timer del problema actual
        if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
        singleProblemTimerRef.current = null;

         // Iniciar timer de auto-continuar si está activado (incluso después de agotar intentos/revelar)
        if (autoContinue && !blockAutoAdvance) { // También verificar blockAutoAdvance
            if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
            console.log("[ADDITION] Auto-continue enabled after failed attempts, waiting 3s...");
            autoContinueTimerRef.current = setTimeout(() => {
                if (!blockAutoAdvance && waitingRef.current) { // Re-check waitingRef.current
                    console.log("[ADDITION] Auto-continuing after failed attempts...");
                    handleContinue(); // Usa la versión memoizada/stable
                    autoContinueTimerRef.current = null;
                } else {
                    console.log("[ADDITION] Auto-continue blocked or waiting state changed after failed attempts.");
                }
            }, 3000);
        }

        // Lógica de compensación: añadir problema si se agotan intentos o se revela la respuesta
         const enableCompensation = settings?.enableCompensation ?? defaultModuleSettings.enableCompensation;
        if (enableCompensation) {
             console.log("[ADDITION] Compensation enabled. Adding one problem due to attempts up.");
             const difficultyForCompensation = (settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) ? adaptiveDifficulty : (settings?.difficulty as DifficultyLevel ?? defaultModuleSettings.difficulty as DifficultyLevel);
             const compensationProblem = generateAdditionProblem(difficultyForCompensation);
             setProblemsList(prev => [...prev, compensationProblem]); // Añadir al final de la lista
             // Añadir un slot vacío en el historial para el nuevo problema compensado
             setUserAnswersHistory(prev => [...prev, null]);
             console.log("[ADDITION] Problem added due to compensation.");
        }

        return true; // Problema resuelto (sin más intentos disponibles)
      }

      // Si llega aquí, la respuesta es incorrecta pero aún quedan intentos.
      // El feedback inmediato ya fue mostrado (o no).
      // No se pone waitingForContinue(true), el usuario puede intentarlo de nuevo.
      // El timer del problema sigue corriendo (manejado por el useEffect del timer).
      // El foco debería seguir en la caja actual o moverse automáticamente.
      // El useEffect de enfocar maneja esto si focusedDigitIndex no es null y !waitingForContinue.
      return false; // Problema no resuelto aún
    }
  // Dependencias:
  // - currentProblem, digitAnswers: Estado para evaluar la respuesta.
  // - currentAttempts, settings (maxAttempts, enableCompensation, etc), defaultModuleSettings: Lógica de intentos/compensación/settings.
  // - adaptiveDifficulty, consecutiveCorrectAnswers, consecutiveIncorrectAnswers, CORRECT_ANSWERS_FOR_LEVEL_UP: Lógica adaptativa.
  // - updateModuleSettings, eventBus, setShowLevelUpReward, setBlockAutoAdvance: Acciones de level up.
  // - autoContinue, autoContinueTimerRef, handleContinue: Lógica de auto-continuar.
  // - t: Para los mensajes traducidos.
  // - userAnswersHistory, currentProblemIndex, actualActiveProblemIndexBeforeViewingPrevious, problemsList (para length y añadir): Para actualizar historial y lista de problemas.
  // - set... setters: Para actualizar el estado (setFeedbackMessage, setFeedbackColor, setConsecutiveCorrectAnswers, setConsecutiveIncorrectAnswers, setAdaptiveDifficulty, setWaitingForContinue, setCurrentAttempts, setUserAnswersHistory, setActualActiveProblemIndexBeforeViewingPrevious, setProblemsList).
  // - waitingRef: Para verificar el estado actual.
  // - checkAnswer (la utilidad), generateAdditionProblem: Funciones llamadas dentro.
  // - showLevelUpReward: Para bloquear si el modal está abierto.
  }, [
    currentProblem, digitAnswers, currentAttempts, settings, defaultModuleSettings,
    adaptiveDifficulty, consecutiveCorrectAnswers, consecutiveIncorrectAnswers, CORRECT_ANSWERS_FOR_LEVEL_UP,
    updateModuleSettings, eventBus, setShowLevelUpReward, setBlockAutoAdvance,
    autoContinue, autoContinueTimerRef, t, userAnswersHistory, currentProblemIndex,
    actualActiveProblemIndexBeforeViewingPrevious, problemsList, waitingRef, checkAnswer, generateAdditionProblem, showLevelUpReward,
    /* set... setters */
  ]);


  // Usa useCallback para estabilizar la función handleTimeOrAttemptsUp
  // Se llama cuando el timer del problema llega a cero.
  const handleTimeOrAttemptsUp = useCallback(() => {
    console.log("[ADDITION] handleTimeOrAttemptsUp triggered (Timer expired).");
    // Usar waitingRef.current para la comprobación más actualizada
    // Bloquear si ya se está esperando continuar, ejercicio completado, viendo historial, o modal level up activo
    if (waitingRef.current || !currentProblem || exerciseCompleted || viewingPrevious || showLevelUpReward) {
       console.log("[ADDITION] handleTimeOrAttemptsUp blocked:", { waiting: waitingRef.current, currentProblem: !!currentProblem, completed: exerciseCompleted, viewing: viewingPrevious, levelUp: showLevelUpReward });
       return;
    }

    // Determinar si se ha introducido *algún* dígito en las cajas
    const userAnswerIsPresent = digitAnswers.some(d => d && d.trim() !== "");

    // Contar esto como un intento, ya sea que haya input o no al agotarse el tiempo.
    const newAttempts = currentAttempts + 1;
    setCurrentAttempts(newAttempts);
    console.log(`[ADDITION] Time expired. Attempt ${newAttempts}/${settings?.maxAttempts ?? 'Unlimited'}. Input present: ${userAnswerIsPresent}.`);


    // Actualizar el historial para el problema actual
    const problemIndexForHistory = currentProblemIndex; // El índice actual es el que se actualiza
    // Buscamos la entrada existente para mantener posibles datos anteriores
    const existingHistoryEntry = userAnswersHistory[problemIndexForHistory];

    let historyStatus: UserAnswer['status'] = 'timeout'; // Estado por defecto si el tiempo se agota
    let userNumericAnswer: number | null = null; // Inicializar a null

    if (userAnswerIsPresent) {
       // Si había input, intentar parsear y marcar como incorrecto
        let userAnswerString = "";
        const decPosInAnswer = currentProblem.answerDecimalPosition;
        const totalDigitBoxes = currentProblem.answerMaxDigits;
        const integerBoxesCount = totalDigitBoxes - (decPosInAnswer || 0);
        const integerPart = digitAnswers.slice(0, integerBoxesCount).join('');
        const decimalPart = digitAnswers.slice(integerBoxesCount).join('');
        if (decPosInAnswer !== undefined && decPosInAnswer > 0) {
            userAnswerString = `${integerPart || '0'}.${decimalPart}`;
        } else {
            userAnswerString = integerPart || '0';
        }

        userNumericAnswer = parseFloat(userAnswerString);

        // Aunque el tiempo se acabó, si había input, lo marcamos como 'incorrect' si es inválido o erróneo,
        // o 'timeout' si el tiempo se acabó *con* input pero no fue verificado.
        // La lógica original marcaba como incorrecto *si* se hacía clic en check.
        // Aquí, si el tiempo se agota CON input, es esencialmente un intento fallido por tiempo.
        // Podríamos marcarlo como 'incorrect' o 'timeout'. 'timeout' parece más preciso.
        // Si se agotaron intentos, el status final será 'revealed'.

        if (isNaN(userNumericAnswer)) {
             historyStatus = 'timeout'; // O 'invalid_timeout'
        } else {
             // Incluso si el input es numérico, es un timeout si no se hizo click en check.
             historyStatus = 'timeout';
        }

       console.log("[ADDITION] Time up, answer was present (treated as timeout).");

    } else {
      // No hay respuesta escrita, tiempo agotado -> status es 'timeout'
      userNumericAnswer = NaN; // O null, dependiendo de la convención
      historyStatus = 'timeout';
      console.log("[ADDITION] Time up, no answer entered.");
    }


    // Determinar el estado final en caso de agotamiento de intentos
    const maxAttempts = settings?.maxAttempts ?? defaultModuleSettings.maxAttempts;
    const finalStatus = (maxAttempts > 0 && newAttempts >= maxAttempts) ? 'revealed' : historyStatus; // Si se agotan, el estado final es 'revealed'

    const newHistoryEntry: UserAnswer = existingHistoryEntry ? {
        ...existingHistoryEntry,
        userAnswerString: userAnswerIsPresent ? digitAnswers.join('') : undefined, // Guardar el input string si había
        userAnswer: userAnswerIsPresent && !isNaN(userNumericAnswer as number) ? userNumericAnswer : null,
        isCorrect: false, // Timeout o input inválido = no correcta
        status: finalStatus, // Usar el status final (timeout o revealed)
        attemptsMade: newAttempts, // Guardar el número de intentos
    } : { // Crear una nueva entrada (menos común si problemsList se inicializa con nulls)
        problemId: currentProblem.id,
        problem: currentProblem,
        userAnswerString: userAnswerIsPresent ? digitAnswers.join('') : undefined,
        userAnswer: userAnswerIsPresent && !isNaN(userNumericAnswer as number) ? userNumericAnswer : null,
        isCorrect: false,
        status: finalStatus,
        attemptsMade: newAttempts,
    };

    setUserAnswersHistory(prev => {
        const newHistory = [...prev];
        newHistory[problemIndexForHistory] = newHistoryEntry; // Reemplazar o añadir la entrada
        return newHistory;
    });

    // Si es el problema activo, actualizar el índice del último activo intentado.
    if (!viewingPrevious && currentProblemIndex >= actualActiveProblemIndexBeforeViewingPrevious) {
       setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
    }


    if (finalStatus === 'revealed') {
      console.log(`[ADDITION] Max attempts reached (${maxAttempts}) due to timeout. Revealing answer.`);
      // Se agotaron los intentos (por timeouts sucesivos o combinación con clics en check), revelar respuesta.
      setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
      setFeedbackColor("red"); // O color de revelado si es diferente
      setWaitingForContinue(true); // Pone waitingRef.current = true via useEffect -> espera para continuar
      setFocusedDigitIndex(null); // Quitar foco

       // Lógica de compensación: añadir problema si se agotan intentos (incluyendo timeouts)
       const enableCompensation = settings?.enableCompensation ?? defaultModuleSettings.enableCompensation;
       if (enableCompensation) {
          console.log("[ADDITION] Compensation enabled. Adding one problem due to timeout/attempts up.");
          const difficultyForCompensation = (settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) ? adaptiveDifficulty : (settings?.difficulty as DifficultyLevel ?? defaultModuleSettings.difficulty as DifficultyLevel);
          const compensationProblem = generateAdditionProblem(difficultyForCompensation);
          setProblemsList(prev => [...prev, compensationProblem]); // Añadir al final de la lista
          setUserAnswersHistory(prev => [...prev, null]); // Añadir un slot vacío en el historial
          console.log("[ADDITION] Problem added due to compensation (timeout).");
       }

       // Iniciar timer de auto-continuar si está activado (incluso después de agotar intentos/revelar)
       if (autoContinue && !blockAutoAdvance) { // También verificar blockAutoAdvance
           if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
           console.log("[ADDITION] Auto-continue enabled after timeout, waiting 3s...");
           autoContinueTimerRef.current = setTimeout(() => {
               if (!blockAutoAdvance && waitingRef.current) { // Re-check waitingRef.current
                   console.log("[ADDITION] Auto-continuing after timeout...");
                   handleContinue(); // Usa la versión memoizada/stable
                   autoContinueTimerRef.current = null;
               } else {
                   console.log("[ADDITION] Auto-continue blocked or waiting state changed after timeout.");
               }
           }, 3000);
       }

    } else {
      // Quedan más intentos, pero el tiempo de este intento se agotó (y no se agotaron los intentos totales).
      // Mostrar feedback de timeout (si no se mostró ya feedback inmediato de incorrecto)
      const showImmediate = settings?.showImmediateFeedback ?? defaultModuleSettings.showImmediateFeedback;
      // Solo mostrar mensaje de timeout si no se acaba de mostrar "Incorrecto" por checkAnswer (raro, pero posible si el timer es muy corto)
      // O si no había input.
      if (userAnswerIsPresent && showImmediate) {
           // Si había input y feedback inmediato está activado, "Incorrecto" ya se mostró por checkCurrentAnswer llamada dentro.
           // Podríamos añadir un mensaje adicional aquí, pero el original no lo hacía.
           // Dejar el feedback como está (rojo "Incorrecto").
           console.log("[ADDITION] Timer up with input, feedback 'Incorrect' likely already shown.");

      } else {
          // Si no había input, o feedback inmediato desactivado, mostrar mensaje de timeout.
           setFeedbackMessage(t('exercises.timeUpNoAnswer', {attemptsMade: newAttempts, maxAttempts: maxAttempts > 0 ? maxAttempts : t('common.unlimited')}));
           setFeedbackColor("red");
           console.log("[ADDITION] Timer up, no input or immediate feedback off.");
      }

       // Limpiar cajas de input para el siguiente intento
       setDigitAnswers(Array(currentProblem.answerMaxDigits).fill("")); // Limpiar cajas
       setFocusedDigitIndex(null); // Quitar foco temporalmente

       // Reiniciar timer para el próximo intento. problemTimerValue se resetea al valor inicial.
       setProblemTimerValue(settings?.timeValue ?? defaultModuleSettings.timeValue);
       // El useEffect del timer se encargará de reiniciarlo porque waitingRef.current es false y quedan intentos.
       console.log(`[ADDITION] Time up for this attempt. Attempts left: ${maxAttempts === 0 ? t('common.unlimited') : maxAttempts - newAttempts}.`);
    }

    // El timer del problema ya se detuvo en el useEffect cuando prevTimerValue llegó a 1.
    // Si no se detuvo por alguna razón, esta línea es una salvaguarda:
    if (singleProblemTimerRef.current) {
         clearInterval(singleProblemTimerRef.current);
         singleProblemTimerRef.current = null;
    }

  // Dependencias:
  // - currentProblem, digitAnswers: Estado para evaluar la respuesta/input.
  // - currentAttempts, settings (maxAttempts, enableCompensation, timeValue, enableAdaptiveDifficulty), defaultModuleSettings: Lógica de intentos/compensación/settings.
  // - adaptiveDifficulty: Para generar problema de compensación.
  // - autoContinue, blockAutoAdvance, autoContinueTimerRef, handleContinue: Lógica de auto-continuar.
  // - t: Para los mensajes traducidos.
  // - userAnswersHistory, currentProblemIndex, actualActiveProblemIndexBeforeViewingPrevious, problemsList (para length y añadir): Para actualizar historial y lista de problemas.
  // - set... setters: Para actualizar el estado (setFeedbackMessage, setFeedbackColor, setCurrentAttempts, setUserAnswersHistory, setActualActiveProblemIndexBeforeViewingPrevious, setProblemTimerValue, setProblemsList, setDigitAnswers, setFocusedDigitIndex).
  // - waitingRef: Para verificar el estado actual.
  // - checkCurrentAnswer (llamada implícita si había input?), generateAdditionProblem: Funciones llamadas dentro.
  // - showLevelUpReward: Para bloquear.
  }, [
     currentProblem, digitAnswers, currentAttempts, settings, defaultModuleSettings,
     adaptiveDifficulty, autoContinue, blockAutoAdvance, autoContinueTimerRef, t,
     userAnswersHistory, currentProblemIndex, actualActiveProblemIndexBeforeViewingPrevious,
     problemsList, waitingRef, generateAdditionProblem, showLevelUpReward,
     /* set... setters */
  ]);


  // Usa useCallback para estabilizar la función handleContinue
  // Se llama cuando el usuario hace clic en "Continuar" o por auto-continue timer.
  // Debe pasar al siguiente problema o manejar el final del ejercicio.
  const handleContinue = useCallback(() => {
    // Solo continuar si estamos en el estado de espera
    if (!waitingRef.current || !currentProblem) {
        console.log("[ADDITION] handleContinue blocked: Not in waiting state or no current problem.");
        return;
    }
    console.log("[ADDITION] handleContinue called. Proceeding...");

    // Limpiar cualquier timer de auto-continuar pendiente
    if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
    }

    // Limpiar feedback y estado de espera
    setWaitingForContinue(false); // Permitir interacción con el próximo problema
    setFeedbackMessage(null);
    setFeedbackColor(null);
    setFocusedDigitIndex(null); // Quitar foco si lo había


    // Determinar el índice del próximo problema ACTIVO
    const nextActiveIdx = actualActiveProblemIndexBeforeViewingPrevious + 1;

    // Avanzar al siguiente problema si existe
    if (nextActiveIdx < problemsList.length) {
      console.log(`[ADDITION] Advancing to next active problem: ${nextActiveIdx}`);
      setCurrentProblemIndex(nextActiveIdx); // Establecer el índice actual (visible) al próximo activo
      setCurrentProblem(problemsList[nextActiveIdx]); // Cargar el próximo problema
      setActualActiveProblemIndexBeforeViewingPrevious(nextActiveIdx); // Actualizar el índice del último problema activo intentado

      // Preparar el estado para el nuevo problema
      setDigitAnswers(Array(problemsList[nextActiveIdx].answerMaxDigits).fill("")); // Limpiar cajas de input
      setCurrentAttempts(0); // Resetear intentos para el NUEVO problema
      setProblemTimerValue(settings?.timeValue ?? defaultModuleSettings.timeValue); // Resetear timer para el NUEVO problema

      // El useEffect del timer del problema se encargará de iniciarlo si aplica.

    } else {
      // No hay más problemas en la lista activa -> completar ejercicio
      console.log("[ADDITION] No more problems in active list. Completing exercise.");
      completeExercise(); // Llama a la función memoizada para completar el ejercicio
    }

    // Asegurar que no estamos en modo historial después de continuar
    setViewingPrevious(false); // Dejar de ver historial

  // Dependencias:
  // - waitingRef.current: Condición de guarda.
  // - currentProblem: Condición de guarda.
  // - actualActiveProblemIndexBeforeViewingPrevious, problemsList: Para determinar el próximo problema.
  // - settings.timeValue, defaultModuleSettings.timeValue: Para resetear el timer del problema.
  // - completeExercise: Función llamada al final.
  // - autoContinueTimerRef: Para limpiar el timer.
  // - set... setters: Para actualizar el estado (setWaitingForContinue, setFeedbackMessage, setFeedbackColor, setFocusedDigitIndex, setCurrentProblemIndex, setCurrentProblem, setActualActiveProblemIndexBeforeViewingPrevious, setDigitAnswers, setCurrentAttempts, setProblemTimerValue, setViewingPrevious).
  }, [
     waitingRef, currentProblem, actualActiveProblemIndexBeforeViewingPrevious, problemsList,
     settings?.timeValue, defaultModuleSettings.timeValue, autoContinueTimerRef,
     /* set... setters */
  ]);


  // Usa useCallback para estabilizar la función completeExercise
  const completeExercise = useCallback(() => {
    console.log("[ADDITION] Exercise completing.");
    setExerciseCompleted(true);
    // Detener ambos timers
    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    generalTimerRef.current = null;
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    singleProblemTimerRef.current = null;
     // Limpiar timer de auto-continuar por si acaso
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    autoContinueTimerRef.current = null;

    // Calcular score final y otros stats del ejercicio
    const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;
    const totalProblemsAttempted = userAnswersHistory.filter(a => a !== null).length;
    const totalProblemsInList = problemsList.length;
    const timeTaken = timer;
    const finalDifficulty = (settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) ? adaptiveDifficulty : (settings?.difficulty as DifficultyLevel ?? defaultModuleSettings.difficulty as DifficultyLevel);


    console.log("[ADDITION] Saving exercise result:", {
      operationId: "addition",
      score: correctCount,
      totalProblems: totalProblemsInList, // Guardar el total de problemas generados
      timeSpent: timeTaken,
      difficulty: finalDifficulty,
      // Podrías añadir más detalles aquí si tu `saveExerciseResult` lo soporta
      // ej: { userAnswersHistory, attemptedCount: totalProblemsAttempted, totalAttempts: userAnswersHistory.reduce((sum, entry) => sum + (entry?.attemptsMade || 0), 0) }
    });

    // Guardar resultado (useProgress es asumido externo)
    saveExerciseResult({
      operationId: "addition", // ID específico de la operación
      date: new Date().toISOString(), // Fecha y hora de finalización
      score: correctCount,
      totalProblems: totalProblemsInList,
      timeSpent: timeTaken,
      difficulty: finalDifficulty,
    });

    console.log("[ADDITION] Exercise result saved.");

    // Al completar, también limpiamos las rachas si la dificultad adaptativa está activa,
    // para que el próximo ejercicio empiece desde la dificultad base o la última guardada.
    // Esto se hace también en generateNewProblemSet, pero una salvaguarda aquí es buena.
    // Esto debería ocurrir solo si enableAdaptiveDifficulty es true.
     const enableAdaptive = settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty;
    if (enableAdaptive) {
        console.log("[ADDITION] Exercise completed with adaptive difficulty enabled. Resetting consecutive counts.");
        setConsecutiveCorrectAnswers(0);
        setConsecutiveIncorrectAnswers(0);
        // Guardar 0s en localStorage inmediatamente
        try {
            localStorage.setItem('addition_consecutiveCorrectAnswers', '0');
            localStorage.setItem('addition_consecutiveIncorrectAnswers', '0');
        } catch (e) { console.error("Error resetting consecutive counts in localStorage:", e); }
    }


  // Dependencias: userAnswersHistory, problemsList, timer, settings, defaultModuleSettings, adaptiveDifficulty, saveExerciseResult.
  // set... setters son estables.
  }, [userAnswersHistory, problemsList.length, timer, settings, defaultModuleSettings, adaptiveDifficulty, saveExerciseResult /* set... setters */]);


  // Usa useCallback para estabilizar handleDigitBoxClick
  const handleDigitBoxClick = useCallback((index: number, event?: React.MouseEvent) => {
    // Usar waitingRef.current para la comprobación más actualizada
    // Bloquear si está viendo historial, esperando, ejercicio completado, o modal level up activo
    if (viewingPrevious || waitingRef.current || exerciseCompleted || showLevelUpReward) {
       event?.preventDefault(); // Evitar cualquier comportamiento por defecto si no se debe interactuar
       console.log("[ADDITION] Digit box click blocked:", { index, viewing: viewingPrevious, waiting: waitingRef.current, completed: exerciseCompleted, levelUp: showLevelUpReward });
       return;
    }
     // Si el ejercicio no ha comenzado, empezarlo al primer clic en una caja de input
    if (!exerciseStarted) {
       startExercise(); // Esto pondrá exerciseStarted a true
       console.log("[ADDITION] Exercise started by digit box click.");
    }

    // Determinar la dirección de input y establecer el foco
    if (currentProblem) {
        // La dirección de input (LTR/RTL) puede basarse en la vista (Horizontal/Vertical) o en la posición del punto decimal.
        // El código original usaba RTL para vertical, LTR para horizontal. Mantengamos eso.
        setInputDirection(currentProblem.layout === 'vertical' ? 'rtl' : 'ltr');
        setFocusedDigitIndex(index); // Establecer el foco en la caja clicada
        console.log(`[ADDITION] Digit box ${index} clicked. Setting focus and input direction ${currentProblem.layout === 'vertical' ? 'rtl' : 'ltr'}.`);
    } else {
       console.log("[ADDITION] Digit box clicked but no current problem.");
    }
    // El useEffect de enfocar se encargará de poner el foco real
  }, [viewingPrevious, waitingRef, exerciseCompleted, showLevelUpReward, exerciseStarted, currentProblem /* set... setters */]); // Dependencias: Estados que bloquean, estado de inicio, problema actual. Setters son estables.


   // Usa useCallback para estabilizar clearDigitBox
  const clearDigitBox = useCallback((index: number) => {
    // Bloquear si el índice es inválido o si no se debe permitir input
    if (index < 0 || index >= digitAnswers.length || viewingPrevious || waitingRef.current || exerciseCompleted || showLevelUpReward) {
       console.log("[ADDITION] Clear digit box blocked:", { index, viewing: viewingPrevious, waiting: waitingRef.current, completed: exerciseCompleted, levelUp: showLevelUpReward });
       return;
    }

    setDigitAnswers(prev => {
      const updated = [...prev];
      updated[index] = ""; // Limpiar el contenido de la caja en el índice dado
      console.log(`[ADDITION] Cleared digit box at index ${index}.`);
      return updated;
    });

  }, [digitAnswers.length, viewingPrevious, waitingRef, exerciseCompleted, showLevelUpReward /* setDigitAnswers */]); // Dependencias: longitud del array, estados que bloquean. Setter es estable.


   // Usa useCallback para estabilizar handleDigitKeyDown (controla input físico en las cajas)
   // Se pasa como onKeyDown a cada div de caja de dígito.
  const handleDigitKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    // Usar waitingRef.current para la comprobación más actualizada
    // Bloquear si no se debe permitir input
    if (viewingPrevious || waitingRef.current || exerciseCompleted || showLevelUpReward || !currentProblem) {
      e.preventDefault(); // Prevenir comportamiento por defecto (ej. scroll, input)
      // console.log("[ADDITION] Key down blocked:", { key: e.key, index, viewing: viewingPrevious, waiting: waitingRef.current, completed: exerciseCompleted, levelUp: showLevelUpReward });
      return;
    }

    const key = e.key;
    const maxDigits = currentProblem.answerMaxDigits; // Total de cajas de dígito (sin contar punto visual)

    // Navegación entre cajones con flechas
    if (key === "ArrowLeft") {
        e.preventDefault();
        // Mover a la izquierda (índice menor)
        if (index > 0) {
            setFocusedDigitIndex(index - 1);
            // console.log(`[ADDITION] Key 'ArrowLeft'. New focus: ${index - 1}.`);
        }
    } else if (key === "ArrowRight") {
        e.preventDefault();
        // Mover a la derecha (índice mayor)
        if (index < maxDigits - 1) { // maxDigits es el número de cajas, el último índice es maxDigits-1
            setFocusedDigitIndex(index + 1);
            // console.log(`[ADDITION] Key 'ArrowRight'. New focus: ${index + 1}.`);
        }
    }
    // Teclas de borrado
    else if (key === "Delete" || key === "Backspace") {
        e.preventDefault();
        // Borrar el contenido de la caja actual
        clearDigitBox(index); // Usa la función memoizada clearDigitBox

        // Moverse al cajón anterior después de borrar, si no es la primera caja
        // La lógica de movimiento después de borrar puede variar. Originalmente movía según inputDirection.
        // Aquí, en onKeyDown, es más común que backspace mueva a la izquierda.
        if (key === "Backspace" && index > 0) { // Backspace comúnmente borra a la izquierda y mueve a la izquierda
             setFocusedDigitIndex(index - 1);
             // console.log(`[ADDITION] Key 'Backspace'. Cleared index ${index}, new focus ${index - 1}.`);
        } else if (key === "Delete" && index < maxDigits - 1) { // Delete comúnmente borra a la derecha y mueve a la derecha
             // No, Delete borra el caracter *a la derecha* del cursor, o el seleccionado.
             // En este UI, Delete debería borrar el contenido de la *caja actual*.
             // El movimiento después de Delete es menos estandarizado. Podríamos dejar el foco o mover a la derecha.
             // Dejamos el foco en la caja actual para Delete, o movemos a la derecha como alternativa.
             // Por simplicidad, dejemos el foco en la caja borrada o movamos a la derecha.
              // setFocusedDigitIndex(index); // Quedarse en la misma caja
              // O mover a la derecha:
              // setFocusedDigitIndex(index + 1);
              // Mantengamos la lógica original que movía según inputDirection para Backspace, y simplemente borre para Delete.
              if (key === "Delete") {
                // Simplemente borrar, sin cambiar foco.
                 // console.log(`[ADDITION] Key 'Delete'. Cleared index ${index}. Focus remains.`);
              }
        } else if (key === "Backspace" && index === 0) {
           // Si es Backspace en la primera caja, solo borrar, no mover foco.
            // console.log(`[ADDITION] Key 'Backspace' on first box. Cleared index ${index}. Focus remains.`);
        }


    }
    // Entrada de dígitos numéricos
    else if (/^[0-9]$/.test(key)) {
        e.preventDefault(); // Prevenir que el dígito aparezca en un input real (usamos divs)
        // Solo iniciamos el ejercicio al ingresar el primer dígito válido
        if (!exerciseStarted) startExercise(); // Usa la función memoizada

        // Poner el dígito en la caja actual
        setDigitAnswers(prev => {
          const updated = [...prev];
          updated[index] = key;
          console.log(`[ADDITION] Key "${key}". Set digit box ${index} to "${key}".`);
          return updated;
        });

        // Mover el foco al siguiente cajón según la dirección de input
        if (inputDirection === 'ltr') { // Si es LTR, el siguiente dígito está a la DERECHA
            if (index < maxDigits - 1) { // maxDigits es el número de cajas
              setFocusedDigitIndex(index + 1);
              // console.log(`[ADDITION] Key "${key}". Input direction LTR. New focus: ${index + 1}.`);
            } else {
               // Si ya es la última caja, el foco puede quedarse ahí o moverse a la primera
               // Quedarse es más simple.
                // console.log(`[ADDITION] Key "${key}". On last box (LTR). Focus remains.`);
            }
        } else { // Si es RTL, el siguiente dígito está a la IZQUIERDA
            if (index > 0) {
               setFocusedDigitIndex(index - 1);
               // console.log(`[ADDITION] Key "${key}". Input direction RTL. New focus: ${index - 1}.`);
            } else {
               // Si ya es la primera caja (más a la izquierda en RTL), el foco puede quedarse ahí.
                // console.log(`[ADDITION] Key "${key}". On last box (RTL, i.e., first box). Focus remains.`);
            }
        }
    }
    // Tecla Enter para verificar la respuesta
    else if (key === "Enter") {
        e.preventDefault(); // Prevenir salto de línea u otro comportamiento
        console.log("[ADDITION] Key 'Enter'. Calling checkCurrentAnswer...");
        checkCurrentAnswer(); // Llama a la función memoizada
    }
    // Ignorar otras teclas
  }, [viewingPrevious, waitingRef, exerciseCompleted, showLevelUpReward, currentProblem,
      digitAnswers.length, inputDirection, clearDigitBox, exerciseStarted, checkCurrentAnswer /* set... setters */
  ]); // Dependencias: Estados que bloquean, problema actual, longitud del array, dirección de input, clearDigitBox, exerciseStarted, checkCurrentAnswer. Setters son estables.


  // Función para iniciar el ejercicio
  const startExercise = useCallback(() => {
    // Solo iniciar si el ejercicio no ha comenzado, no ha terminado y hay un problema cargado.
    if (exerciseStarted || exerciseCompleted || !currentProblem) {
       console.log("[ADDITION] startExercise blocked:", { started: exerciseStarted, completed: exerciseCompleted, problem: !!currentProblem });
       return;
    }
    setExerciseStarted(true);
    console.log("[ADDITION] Exercise started.");
    // El useEffect del timer general se activará ahora.
    // El useEffect del timer del problema también se activará si aplica.
  }, [exerciseStarted, exerciseCompleted, currentProblem /* setExerciseStarted */]); // Dependencias: estados de inicio/fin, problema actual. Setter es estable.


  // Función para generar un nuevo set completo de problemas (reiniciar)
  const generateNewProblemSet = useCallback(() => {
    console.log("[ADDITION] Generating a completely new problem set.");
    // Limpiar todos los timers activos
    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    generalTimerRef.current = null;
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    singleProblemTimerRef.current = null;
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    autoContinueTimerRef.current = null;

    // Usar la dificultad adaptativa si está habilitada, de lo contrario usar la configuración global.
    // Si settings es undefined (ej. error de carga), usar defaultModuleSettings.
    const effectiveDifficulty = (settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty)
                                ? adaptiveDifficulty // Usar la dificultad adaptativa actual
                                : (settings?.difficulty as DifficultyLevel ?? defaultModuleSettings.difficulty as DifficultyLevel); // O la configurada
    const problemCount = settings?.problemCount ?? defaultModuleSettings.problemCount;
    const timeValue = settings?.timeValue ?? defaultModuleSettings.timeValue;

    console.log(`[ADDITION] Generating new problems for restart: difficulty=${effectiveDifficulty}, count=${problemCount}`);
    const newProblems = Array.from({ length: problemCount }, () =>
      generateAdditionProblem(effectiveDifficulty)
    );

    // Resetear todos los estados a sus valores iniciales
    setProblemsList(newProblems);
    setCurrentProblemIndex(0); // Empezar siempre en el primer problema del nuevo set
    setActualActiveProblemIndexBeforeViewingPrevious(0); // El problema activo es el primero
    setCurrentProblem(newProblems[0]); // Cargar el primer problema

    // Inicializar historial de respuestas para el nuevo set (todos null)
    setUserAnswersHistory(Array(newProblems.length).fill(null));
    setTimer(0); // Resetear timer general
    setExerciseStarted(false); // El usuario debe presionar Start/Check para iniciar
    setExerciseCompleted(false);
    setFeedbackMessage(null); // Limpiar feedback
    setFeedbackColor(null);
    setWaitingForContinue(false); // No estamos esperando continuar
    setBlockAutoAdvance(false); // Desbloquear avance
    setShowLevelUpReward(false); // Ocultar modal de level up
    setViewingPrevious(false); // No estamos viendo problemas anteriores
    setProblemTimerValue(timeValue); // Resetear timer del problema (al valor de setting)
    setCurrentAttempts(0); // Resetear intentos del problema
    digitBoxRefs.current = []; // Limpiar referencias a las cajas de input
    setFocusedDigitIndex(null); // Asegurar que no hay foco inicial hasta la interacción


    // Resetear las rachas de dificultad adaptativa al reiniciar el ejercicio completo.
     console.log("[ADDITION] Restarting exercise, resetting consecutive counts.");
    setConsecutiveCorrectAnswers(0);
    setConsecutiveIncorrectAnswers(0);
     // Guardar 0s en localStorage inmediatamente al reiniciar
    try {
        localStorage.setItem('addition_consecutiveCorrectAnswers', '0');
        localStorage.setItem('addition_consecutiveIncorrectAnswers', '0');
        localStorage.setItem('addition_adaptiveDifficulty', effectiveDifficulty); // Guardar la dificultad base del nuevo set
    } catch (e) { console.error("Error resetting consecutive counts/difficulty in localStorage:", e); }

     // Asegurar que el estado de dificultad adaptativa refleje la dificultad base del nuevo set
     if (adaptiveDifficulty !== effectiveDifficulty) {
          setAdaptiveDifficulty(effectiveDifficulty);
     }


  // Dependencias: settings (para problemCount, timeValue, difficulty, enableAdaptiveDifficulty),
  // defaultModuleSettings, adaptiveDifficulty, generateAdditionProblem.
  // set... setters son estables.
  }, [settings, defaultModuleSettings, adaptiveDifficulty, generateAdditionProblem /* set... setters */]);


  // Usa useCallback para estabilizar restartExercise (llama a generateNewProblemSet)
  const restartExercise = useCallback(() => {
      // Cerrar modal de confirmación si estaba abierto
      setShowConfirmModal(false);
      // Llamar a la función principal de generación/reinicio
      generateNewProblemSet();
      console.log("[ADDITION] Exercise restarted.");
  }, [generateNewProblemSet /* setShowConfirmModal */]); // Dependencia: generateNewProblemSet. Setter es estable.


  // Usa useCallback para estabilizar handleViewPrevious (navegar atrás en historial)
  const handleViewPrevious = useCallback(() => {
     console.log("[ADDITION] Attempting to move to previous problem in history.");
    // No se puede ir atrás si ya estamos en el primer problema visible actualmente
    // O si no se ha intentado ningún problema aún (el historial está vacío o solo con nulls)
    const attemptedCount = userAnswersHistory.filter(a => a !== null).length;
    const canGoBack = currentProblemIndex > 0 && attemptedCount > 0;


    if (!canGoBack || exerciseCompleted || showLevelUpReward) {
        console.log("[ADDITION] Cannot move back:", { currentIndex: currentProblemIndex, attempted: attemptedCount, completed: exerciseCompleted, levelUp: showLevelUpReward });
        return; // No se puede ir más atrás o ejercicio completado/modal activo
    }

    // Si no estábamos viendo anteriores, guardar el índice del problema activo actual
    if (!viewingPrevious) {
        setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
        console.log(`[ADDITION] Saving active problem index before viewing history: ${currentProblemIndex}`);
    }
    setViewingPrevious(true); // Entrar en modo "ver anterior"

    // Detener timer del problema activo (si estaba corriendo)
    if (singleProblemTimerRef.current) {
        clearInterval(singleProblemTimerRef.current);
        singleProblemTimerRef.current = null;
        console.log("[ADDITION] Stopped problem timer for history view.");
    }
     // Limpiar timer de auto-continuar por si acaso
    if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
    }
     setWaitingForContinue(false); // No estamos esperando continuar en modo historial


    // Calcular el índice del problema anterior a visualizar
    const prevIndexToView = currentProblemIndex - 1;

    // Cargar datos del problema anterior de la lista de problemas
    setCurrentProblemIndex(prevIndexToView);
    const prevProblemToView = problemsList[prevIndexToView];
    setCurrentProblem(prevProblemToView); // Cargar datos del problema

    // Cargar la respuesta registrada en el historial para este problema anterior
    const prevAnswerEntry = userAnswersHistory[prevIndexToView];

    if (prevAnswerEntry && prevAnswerEntry.problemId === prevProblemToView.id) {
        console.log(`[ADDITION] Loading history for previous problem ${prevIndexToView}:`, prevAnswerEntry.status);
        // Reconstruir la string de la respuesta para mostrar en las cajas
        const answerStr = prevAnswerEntry.userAnswerString || ""; // Usar string si está guardado

        const numBoxes = prevProblemToView.answerMaxDigits || 0;
        const restoredDigitAnswers = Array(numBoxes).fill('');

        // Llenar las cajas con la string de respuesta
        for (let i = 0; i < Math.min(restoredDigitAnswers.length, answerStr.length); i++) {
             restoredDigitAnswers[i] = answerStr[i];
        }

        setDigitAnswers(restoredDigitAnswers); // Mostrar la respuesta del usuario
        // Mostrar feedback basado en el historial
        setFeedbackMessage(
            prevAnswerEntry.isCorrect ?
            t('exercises.yourAnswerWasCorrect', { userAnswer: prevAnswerEntry.userAnswer }) : // Mensaje específico para historia correcta
            prevAnswerEntry.status === 'revealed' || prevAnswerEntry.status === 'timeout' || ((settings?.maxAttempts ?? defaultModuleSettings.maxAttempts) > 0 && (prevAnswerEntry.attemptsMade || 0) >= (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts)) ?
                 // Si fue revelado, timeout, o intentos agotados, mostrar la respuesta correcta
                t('exercises.correctAnswerWas', { correctAnswer: prevProblemToView.correctAnswer }) : // Mensaje para historia con respuesta correcta revelada/final
                t('exercises.yourAnswerWasIncorrect', { userAnswer: (prevAnswerEntry.userAnswer === null || isNaN(prevAnswerEntry.userAnswer) ? t('common.notAnswered') : prevAnswerEntry.userAnswer), correctAnswer: prevProblemToView.correctAnswer }) // Mensaje para historia incorrecta
        );
         // Usar colores específicos para historial
        setFeedbackColor(prevAnswerEntry.isCorrect ? "green" : (prevAnswerEntry.status === 'revealed' ? "blue" : "red"));

    } else {
        console.log(`[ADDITION] No history found for problem ${prevIndexToView} while viewing previous.`);
        // No hay respuesta registrada para este problema anterior
        setDigitAnswers(prevProblemToView ? Array(prevProblemToView.answerMaxDigits).fill("") : []); // Limpiar cajas
        setFeedbackMessage(prevProblemToView ? t('exercises.noAnswerRecordedForThisProblem') : t('common.error'));
        setFeedbackColor("blue"); // Color neutro para "no hay historial"
    }
    setFocusedDigitIndex(null); // Quitar foco de input
  }, [currentProblemIndex, exerciseCompleted, showLevelUpReward, userAnswersHistory, viewingPrevious, actualActiveProblemIndexBeforeViewingPrevious, problemsList, settings?.maxAttempts, defaultModuleSettings.maxAttempts, t /* set... setters */]); // Dependencias: Estados de control/navegación, historial, lista problemas, settings, t. Setters son estables.


  // Usa useCallback para estabilizar handleViewNext (navegar adelante en historial o volver a activo)
  const handleViewNext = useCallback(() => {
     console.log("[ADDITION] Attempting to move to next problem in history.");
    // Solo permitir avanzar en historial si estamos viendo historial Y no es el último problema visible (que es el activo)
    const canGoNext = viewingPrevious && currentProblemIndex < actualActiveProblemIndexBeforeViewingPrevious;

    if (!canGoNext || exerciseCompleted || showLevelUpReward) {
         console.log("[ADDITION] Cannot move next in history:", { viewing: viewingPrevious, currentIndex: currentProblemIndex, activeIndex: actualActiveProblemIndexBeforeViewingPrevious, completed: exerciseCompleted, levelUp: showLevelUpReward });
        // Si no podemos ir siguiente en historial, quizás deberíamos volver al problema activo si estamos en un estado válido
        if (viewingPrevious && currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious && !exerciseCompleted && !showLevelUpReward) {
            console.log("[ADDITION] Reached active problem index. Returning to active view.");
             // Si ya estamos en el índice del problema activo guardado, volver a la vista activa
            returnToActiveProblem(); // Llama a la función memoizada
        }
        return; // No se puede ir más adelante en historial o ejercicio completado/modal activo
    }

    // Calcular el índice del próximo problema a visualizar
    const nextIndexToView = currentProblemIndex + 1;

    // Cargar datos del próximo problema de la lista de problemas
    setCurrentProblemIndex(nextIndexToView);
    const nextProblemToView = problemsList[nextIndexToView];
    setCurrentProblem(nextProblemToView); // Cargar datos del problema

    // Cargar la respuesta registrada en el historial para este problema
    const nextAnswerEntry = userAnswersHistory[nextIndexToView];

     if (nextAnswerEntry && nextAnswerEntry.problemId === nextProblemToView.id) {
        console.log(`[ADDITION] Loading history for next problem ${nextIndexToView}:`, nextAnswerEntry.status);
        // Reconstruir la string de la respuesta para mostrar en las cajas
        const answerStr = nextAnswerEntry.userAnswerString || ""; // Usar string si está guardado

        const numBoxes = nextProblemToView.answerMaxDigits || 0;
        const restoredDigitAnswers = Array(numBoxes).fill('');

        // Llenar las cajas con la string de respuesta
        for (let i = 0; i < Math.min(restoredDigitAnswers.length, answerStr.length); i++) {
             restoredDigitAnswers[i] = answerStr[i];
        }

        setDigitAnswers(restoredDigitAnswers); // Mostrar la respuesta del usuario
         // Mostrar feedback basado en el historial
        setFeedbackMessage(
            nextAnswerEntry.isCorrect ?
            t('exercises.yourAnswerWasCorrect', { userAnswer: nextAnswerEntry.userAnswer }) : // Mensaje específico para historia correcta
            nextAnswerEntry.status === 'revealed' || nextAnswerEntry.status === 'timeout' || ((settings?.maxAttempts ?? defaultModuleSettings.maxAttempts) > 0 && (nextAnswerEntry.attemptsMade || 0) >= (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts)) ?
                t('exercises.correctAnswerWas', { correctAnswer: nextProblemToView.correctAnswer }) : // Mensaje para historia con respuesta correcta revelada/final
                t('exercises.yourAnswerWasIncorrect', { userAnswer: (nextAnswerEntry.userAnswer === null || isNaN(nextAnswerEntry.userAnswer) ? t('common.notAnswered') : nextAnswerEntry.userAnswer), correctAnswer: nextProblemToView.correctAnswer }) // Mensaje para historia incorrecta
        );
         // Usar colores específicos para historial
        setFeedbackColor(nextAnswerEntry.isCorrect ? "green" : (nextAnswerEntry.status === 'revealed' ? "blue" : "red"));

     } else {
        console.log(`[ADDITION] No history found for problem ${nextIndexToView} while viewing next.`);
         // Esto no debería pasar si el problema es <= actualActiveProblemIndexBeforeViewingPrevious
         // ya que esos problemas deberían tener historial. Podría pasar si hay un bug.
         setDigitAnswers(nextProblemToView ? Array(nextProblemToView.answerMaxDigits).fill("") : []); // Limpiar cajas
         setFeedbackMessage(nextProblemToView ? t('exercises.noAnswerRecordedForThisProblem') : t('common.error'));
         setFeedbackColor("blue"); // Color neutro
     }
     setFocusedDigitIndex(null); // Quitar foco de input


    // Si el próximo índice a visualizar es el problema activo guardado, volver a la vista activa
     if (nextIndexToView === actualActiveProblemIndexBeforeViewingPrevious) {
         console.log("[ADDITION] Reached active problem index by viewing next. Returning to active view.");
        returnToActiveProblem(); // Llama a la función memoizada
     }

  }, [viewingPrevious, currentProblemIndex, actualActiveProblemIndexBeforeViewingPrevious, exerciseCompleted, showLevelUpReward, problemsList, userAnswersHistory, settings?.maxAttempts, defaultModuleSettings.maxAttempts, t /* set... setters */]); // Dependencias: Estados de control/navegación, historial, lista problemas, settings, t. Setters son estables.


   // Usa useCallback para estabilizar returnToActiveProblem (volver del historial a la vista activa)
   const returnToActiveProblem = useCallback(() => {
      console.log("[ADDITION] Returning to active problem:", actualActiveProblemIndexBeforeViewingPrevious);
      // Asegurar que el índice activo es válido
      if (actualActiveProblemIndexBeforeViewingPrevious < 0 || actualActiveProblemIndexBeforeViewingPrevious >= problemsList.length) {
         console.error("[ADDITION] Cannot return to active problem: invalid active index.");
         // Podríamos forzar un reinicio o mostrar un error.
         // Por ahora, simplemente salimos del modo historial sin cambiar de problema.
         setViewingPrevious(false);
         setFeedbackMessage(t('common.errorLoadingProblem'));
         setFeedbackColor("red");
         setWaitingForContinue(false);
         setFocusedDigitIndex(null);
         return;
      }

      setViewingPrevious(false); // Salir de modo "ver anterior"

      // Cargar datos del problema que estaba activo
      const activeProblemIndex = actualActiveProblemIndexBeforeViewingPrevious;
      const activeProblem = problemsList[activeProblemIndex];
      setCurrentProblemIndex(activeProblemIndex); // Establecer índice visible al activo
      setCurrentProblem(activeProblem); // Cargar problema activo

      // Restaurar estado relacionado con el problema activo desde el historial
      const activeProblemHistory = userAnswersHistory[activeProblemIndex];

      if (activeProblemHistory && activeProblemHistory.problemId === activeProblem.id) {
          console.log(`[ADDITION] Restoring state for active problem ${activeProblemIndex} from history:`, activeProblemHistory.status);

          // Limpiar cajas de input al volver al problema activo, el usuario reintentará si es necesario
          setDigitAnswers(Array(activeProblem.answerMaxDigits).fill(""));

          // Restaurar intentos y problemTimerValue al volver al problema activo
          setCurrentAttempts(activeProblemHistory.attemptsMade || 0); // Restaurar intentos o 0 si no se guardaron
          setProblemTimerValue(settings?.timeValue ?? defaultModuleSettings.timeValue); // Resetear timer al valor inicial para el intento

          // Determinar el estado de feedback y espera basado en el historial
          const maxAttempts = settings?.maxAttempts ?? defaultModuleSettings.maxAttempts;
          const attemptsMade = activeProblemHistory.attemptsMade || 0;
          const attemptsExhausted = maxAttempts > 0 && attemptsMade >= maxAttempts;

          if (activeProblemHistory.status === 'correct') {
              setFeedbackMessage(t('exercises.correct'));
              setFeedbackColor("green");
              setWaitingForContinue(true); // Esperar continuar después de correcto
              setFocusedDigitIndex(null); // Quitar foco si está esperando

          } else if (activeProblemHistory.status === 'revealed' || activeProblemHistory.status === 'timeout' || (activeProblemHistory.status === 'incorrect' && attemptsExhausted)) {
              // Si fue revelado, timeout, o incorrecto con intentos agotados -> mostrar respuesta correcta y esperar continuar
               const msgKey = activeProblemHistory.status === 'revealed' ? 'exercises.correctAnswerIs' : 'exercises.noAttemptsLeftAnswerWas';
              setFeedbackMessage(t(msgKey, { correctAnswer: activeProblem.correctAnswer }));
              setFeedbackColor(activeProblemHistory.status === 'revealed' ? "blue" : "red");
              setWaitingForContinue(true); // Esperar continuar
              setFocusedDigitIndex(null); // Quitar foco

          } else if (activeProblemHistory.status === 'incorrect' ) {
              // Incorrecta pero con intentos restantes (o ilimitados). Permitir reintentar.
               const showImmediate = settings?.showImmediateFeedback ?? defaultModuleSettings.showImmediateFeedback;
               if (showImmediate) {
                   setFeedbackMessage(t('exercises.yourPreviousAnswerWas', { userAnswer: (activeProblemHistory.userAnswer === null || isNaN(activeProblemHistory.userAnswer)) ? t('common.notAnswered') : activeProblemHistory.userAnswer }));
                   setFeedbackColor("red");
               } else {
                   setFeedbackMessage(null); // Limpiar si no se muestra feedback inmediato
                   setFeedbackColor(null);
               }
              setWaitingForContinue(false); // Permitir reintentar
               // Enfocar input si se permite reintentar
              const numBoxes = activeProblem.answerMaxDigits || 0;
              if (activeProblem.layout === 'horizontal') {
                 setInputDirection('ltr');
                 setFocusedDigitIndex(numBoxes > 0 ? 0 : null);
               } else { // Vertical
                 setInputDirection('rtl');
                 setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null);
               }


          } else { // 'unanswered' o 'skipped'
              // Problema sin respuesta o saltado -> limpiar y permitir empezar
               console.log(`[ADDITION] Returning to active problem ${activeProblemIndex}, status is '${activeProblemHistory.status}'.`);
               setFeedbackMessage(null);
               setFeedbackColor(null);
               setWaitingForContinue(false); // Permitir empezar
               // Enfocar input
              const numBoxes = activeProblem.answerMaxDigits || 0;
              if (activeProblem.layout === 'horizontal') {
                 setInputDirection('ltr');
                 setFocusedDigitIndex(numBoxes > 0 ? 0 : null);
               } else { // Vertical
                 setInputDirection('rtl');
                 setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null);
               }
          }
      } else if (activeProblem) {
          // Problema activo no encontrado en historial (ej. es el primer problema y aún no se intenta)
          console.log(`[ADDITION] Returning to active problem ${activeProblemIndex}, no history found.`);
          setDigitAnswers(Array(activeProblem.answerMaxDigits).fill(""));
          setFeedbackMessage(null);
          setFeedbackColor(null);
          setWaitingForContinue(false);
          setCurrentAttempts(0); // Resetear intentos
          setProblemTimerValue(settings?.timeValue ?? defaultModuleSettings.timeValue); // Resetear timer
           // Enfocar input
          const numBoxes = activeProblem.answerMaxDigits || 0;
          if (activeProblem.layout === 'horizontal') {
             setInputDirection('ltr');
             setFocusedDigitIndex(numBoxes > 0 ? 0 : null);
           } else { // Vertical
             setInputDirection('rtl');
             setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null);
           }
      } else {
         // Esto no debería ocurrir si actualActiveProblemIndexBeforeViewingPrevious es válido
         console.error("[ADDITION] Error: No active problem object found upon returning from history view.");
         setFeedbackMessage(t('common.errorLoadingProblem'));
         setFeedbackColor("red");
         setWaitingForContinue(false);
         setFocusedDigitIndex(null);
      }

      // El useEffect del timer del problema se encargará de reiniciarlo/pararlo según waitingForContinue.

   // Dependencias: actualActiveProblemIndexBeforeViewingPrevious, problemsList, userAnswersHistory, settings, defaultModuleSettings, t.
   // set... setters son estables.
   }, [
       actualActiveProblemIndexBeforeViewingPrevious, problemsList, userAnswersHistory, settings, defaultModuleSettings, t,
       /* set... setters */
       setViewingPrevious, setCurrentProblemIndex, setCurrentProblem, setDigitAnswers, setCurrentAttempts,
       setProblemTimerValue, setFeedbackMessage, setFeedbackColor, setWaitingForContinue, setFocusedDigitIndex, setInputDirection
   ]);


   // Helper para mostrar un modal de confirmación genérico
   const showConfirmation = useCallback((message: string, action: () => void) => {
      setConfirmModalMessage(message);
      setConfirmModalAction(() => action); // Usar un factory para que useCallback no reaccione a 'action' si no cambia
      setShowConfirmModal(true);
   }, [/* set... setters */]); // Setters son estables.

  // ==========================================
  // 4.3: RENDERIZADO DE LA INTERFAZ
  // ==========================================

  // Calcular score final para mostrar en el resumen
  const finalScorePercentage = useMemo(() => {
    if (exerciseCompleted) {
       const correctCount = userAnswersHistory.filter(a => a?.isCorrect).length;
       // Si no hay problemas intentados, el score es 0, no NaN
       return problemsList.length > 0 ? Math.round((correctCount / problemsList.length) * 100) : 0;
    }
     // Calcular score parcial para mostrar durante el ejercicio si se desea
     const correctCountCurrent = userAnswersHistory.filter(a => a?.isCorrect).length;
     const attemptedCount = userAnswersHistory.filter(a => a !== null).length;
    return attemptedCount > 0 ? Math.round((correctCountCurrent / attemptedCount) * 100) : 0;

  }, [userAnswersHistory, problemsList.length, exerciseCompleted]);

   // Determinar si se debe mostrar el progreso parcial o total en la barra
   const currentProgressValue = problemsList.length > 0 ? ((currentProblemIndex + (waitingRef.current ? 1 : 0)) / problemsList.length) * 100 : 0;


  // Mostrar mensaje de carga inicial si no hay problemas
  if (!currentProblem && problemsList.length === 0 && !exerciseCompleted) {
    return <div className="flex items-center justify-center min-h-64 p-6"><div className="text-center"><p className="text-lg font-medium text-gray-600">{t('exercises.loading')}</p></div></div>;
  }

  // Mostrar resumen al completar el ejercicio
  if (exerciseCompleted) {
    // Filtrar solo las respuestas que realmente fueron registradas (no los null iniciales)
    const attemptedAnswers = userAnswersHistory.filter(a => a !== null) as UserAnswer[];
    const correctCount = attemptedAnswers.filter(a => a.isCorrect).length;
    const incorrectCount = attemptedAnswers.filter(a => a && !a.isCorrect).length;
    const finalDifficulty = (settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) ? adaptiveDifficulty : (settings?.difficulty as DifficultyLevel ?? defaultModuleSettings.difficulty as DifficultyLevel);

    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="text-center mb-6">
           {/* Trophy icon es asumido externo */}
          <Trophy className="h-20 w-20 text-green-500 mx-auto mb-4" /> {/* Color verde para completado exitoso */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('exercises.completed')}</h2> {/* Título genérico de completado */}
          <p className="text-lg font-medium text-gray-600">{t('exercises.finalScore')}: {finalScorePercentage}%</p> {/* Usar finalScorePercentage */}
           {/* formatTime es asumido externo */}
          <p className="text-lg font-medium text-gray-600">{t('exercises.timeTaken')}: {formatTime(timer)}</p>
        </div>

        <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Resumen del Ejercicio:</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-medium text-blue-700 mb-2">Estadísticas:</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Problemas Intentados:</span>
                      <span className="font-medium">{attemptedAnswers.length}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Problemas Correctos:</span>
                      <span className="font-medium text-green-700 font-bold">{correctCount}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Problemas Incorrectos:</span>
                      <span className="font-medium text-red-700 font-bold">{incorrectCount}</span>
                    </li>
                     <li className="flex justify-between">
                      <span>Problemas Revelados/Tiempo:</span>
                      <span className="font-medium text-blue-700 font-bold">{attemptedAnswers.filter(a => a?.status === 'revealed' || a?.status === 'timeout').length}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Total de Problemas Generados:</span>
                      <span className="font-medium">{problemsList.length}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Dificultad Final:</span>
                      <span className="font-medium capitalize">{t(finalDifficulty)}</span> {/* Traducir la dificultad */}
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <h4 className="font-medium text-green-700 mb-2">Detalle de Respuestas:</h4>
                  <div className="max-h-40 overflow-y-auto pr-2">
                    <ul className="space-y-1 text-sm">
                      {userAnswersHistory.map((answer, idx) => {
                          // Mostrar solo si hay una entrada en el historial para este índice
                          if (!answer) return null;
                          return (
                            <li key={idx} className="flex justify-between items-center">
                              <span className="text-gray-700">
                                {idx + 1}: {answer.problem.operands.join(' + ')} =
                              </span>
                              <span className={`font-medium ml-2 ${answer.isCorrect ? 'text-green-600' : answer.status === 'revealed' || answer.status === 'timeout' ? 'text-blue-600' : 'text-red-600'}`}>
                                {answer.userAnswer !== undefined && answer.userAnswer !== null && !isNaN(answer.userAnswer)
                                  ? answer.userAnswer.toFixed(answer.problem.answerDecimalPosition ?? 0) // Formatear decimales para visualización
                                  : answer.status === 'timeout' ? t('common.timeout') : answer.status === 'revealed' ? t('common.revealed') : t('common.notAnswered')
                                }
                              </span>
                            </li>
                          );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

        <div className="flex justify-center mt-8 space-x-4">
           {/* Button y RotateCcw icon son asumidos externos */}
          <Button
            variant="outline"
            onClick={restartExercise}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t('exercises.tryAgain')}</span>
          </Button>

           {/* Button y ChevronLeft icon son asumidos externos */}
           {/* Este botón debería probablemente volver a la página principal o lista de ejercicios */}
          <Button
             // Podrías necesitar una prop `onBackToHome` si existe esta funcionalidad
            onClick={() => {
               // Opcional: Limpiar rachas al volver a casa si la dificultad adaptativa está activa
              if (settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) {
                try {
                  localStorage.setItem('addition_consecutiveCorrectAnswers', '0');
                  localStorage.setItem('addition_consecutiveIncorrectAnswers', '0');
                } catch (e) { console.error("Error resetting consecutive answers on back:", e); }
              }
              // Esto asume que hay una forma de navegar de vuelta, ej. history.back() o router.push('/')
              // location.reload(); // Una forma simple pero brusca de "volver"
              // window.history.back(); // O usar window.history si aplica
              // window.location.href = '/exercises'; // O navegar a una ruta específica
              console.log("[ADDITION] Navigating back or to home page...");
              // Dependiendo de tu framework (Next.js, React Router, etc.), implementa la navegación aquí.
              // Por ahora, solo loggeamos.
            }}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t('exercises.returnHome')}</span>
          </Button>
        </div>
      </div>
    );
  }

  // --- Renderizado del ejercicio en curso ---

  // Helper para renderizar el problema en formato horizontal
  const renderHorizontalProblem = () => (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center text-3xl sm:text-4xl font-bold space-x-3"> {/* Aumentado tamaño */}
        {currentProblem!.operands.map((op, index) => (
          <Fragment key={`op-${index}-${currentProblem!.id}`}>
            <span>{op}</span>
            {/* Mostrar el signo + solo entre operandos */}
            {index < currentProblem!.operands.length - 1 && <span className="text-gray-600 mx-0.5 sm:mx-1">+</span>}
          </Fragment>
        ))}
        <span className="text-gray-600 mx-0.5 sm:mx-1">=</span>
      </div>
    </div>
  );

  // Helper para renderizar el problema en formato vertical
  const renderVerticalProblem = () => {
    // Usar la utilidad para obtener la info de alineación vertical
    const { maxIntLength, maxDecLength, operandsFormatted } = getVerticalAlignmentInfo(
      currentProblem!.operands,
      currentProblem!.answerDecimalPosition // Usar decimales esperados en la respuesta para alinear operandos
    );

    return (
      <div className="py-4 flex justify-center">
        <div className="flex flex-col items-end">
          {operandsFormatted.map((op, idx) => (
            <div key={`op-v-${idx}-${currentProblem!.id}`} className="flex items-center mb-1">
              {/* Mostrar el signo + solo antes del último operando si hay más de uno */}
              {idx === operandsFormatted.length -1 && operandsFormatted.length > 1 && <span className={plusSignVerticalStyle}>+</span>}
              <span className={verticalOperandStyle}>
                 {/* Parte entera (alineada a la derecha con espacios) */}
                <span>{op.intStr}</span>
                 {/* Punto decimal y parte decimal si hay decimales esperados */}
                {maxDecLength > 0 && (
                  <>
                    <span className="text-gray-600">.</span> {/* El punto */}
                    <span>{op.decStr}</span> {/* Parte decimal (rellenada con 0s) */}
                  </>
                )}
              </span>
            </div>
          ))}
          {/* Línea de suma */}
          <div
            className={sumLineStyle}
             // Ajustar ancho basado en la longitud máxima de la parte formateada + un margen
            style={{ width: `${(maxIntLength + maxDecLength + (maxDecLength > 0 ? 1 : 0) + 2)}ch`, marginLeft: 'auto', marginRight: '0' }} // +2ch para margen
          />
        </div>
      </div>
    );
  };

  // Helper para renderizar las cajas de input de dígitos para la respuesta
  const renderDigitAnswerBoxes = () => {
    const decimalPosition = currentProblem!.answerDecimalPosition; // Número de decimales esperados
    const totalDigitBoxes = currentProblem!.answerMaxDigits; // Total de cajas de DÍGITO

    // Calculamos el índice donde iría el punto decimal visual
    // Si hay 3 decimales (XXX.YYY), el punto está después del 3er dígito de derecha a izquierda.
    // En un array LTR, si hay 7 cajas y 3 decimales, el punto está después del índice 7-3-1 = 3.
    // indices: [0][1][2][3] . [4][5][6]  (7 cajas, 3 decimales)
    // El punto está después de la caja con índice `totalDigitBoxes - decimalPosition - 1`
    const decimalPointVisualIndex = decimalPosition !== undefined && decimalPosition > 0
                                    ? totalDigitBoxes - decimalPosition -1
                                    : -1; // No hay punto visual

    return (
      <div className="flex justify-center items-center space-x-1 my-4">
        {/* Iterar sobre el número total de cajas de DÍGITO */}
        {Array(totalDigitBoxes).fill(0).map((_, index) => {

           // Determinar si debe haber un punto decimal visual DESPUÉS de esta caja
           const isVisualDecimalPointAfterThisBox = index === decimalPointVisualIndex;

          const isFocused = focusedDigitIndex === index;
          // Deshabilitar input si estamos viendo historial, esperando 'Continuar', ejercicio completado, o modal level up activo
          const disabled = viewingPrevious || waitingForContinue || exerciseCompleted || showLevelUpReward;

          return (
            <Fragment key={`digit-box-frag-${index}-${currentProblem!.id}`}>
              <div
                // Asignar la referencia al elemento DOM
                ref={el => {
                   if (el) {
                      // Almacenar la referencia en el array mutable de refs
                       digitBoxRefs.current[index] = el;
                   }
                }}
                // Hacer la caja enfocable solo si no está deshabilitada
                tabIndex={disabled ? -1 : 0}
                 // Aplicar estilos de base, foco, blur y deshabilitado
                className={`
                  ${digitBoxBaseStyle}
                  ${isFocused && !disabled ? digitBoxFocusStyle : digitBoxBlurStyle}
                  ${disabled ? digitBoxDisabledStyle : 'cursor-pointer hover:border-gray-400'}
                   ${(decimalPosition !== undefined && decimalPosition > 0 && index >= totalDigitBoxes - decimalPosition) ? 'bg-blue-50/60' : ''} {/* Estilo visual para parte decimal */}
                `}
                 // Manejar clic en la caja (solo si no está deshabilitada)
                onClick={(e) => handleDigitBoxClick(index, e)}
                 // Manejar eventos de teclado físico (solo si no está deshabilitada)
                onKeyDown={(e) => !disabled && handleDigitKeyDown(e, index)}
                data-testid={`digit-box-${index}`} // Atributo para tests
              >
                 {/* Mostrar el dígito o un espacio transparente para mantener el tamaño */}
                {digitAnswers[index] || <span className="opacity-0">0</span>}
              </div>
               {/* Renderizar el punto decimal como un elemento separado si corresponde */}
              {isVisualDecimalPointAfterThisBox && (
                <div className="text-2xl sm:text-3xl font-bold mx-0.5 sm:mx-1 opacity-80 self-center select-none pointer-events-none">.</div> // No interactuable
              )}
            </Fragment>
          );
        })}
      </div>
    );
  };


  return (
    // Contenedor principal del ejercicio
    <div className="bg-white rounded-lg shadow-md p-4 max-w-2xl mx-auto">

       {/* Overlay/Modal de Level Up (Componente LevelUpModal definido abajo) */}
       {/* LevelUpModal es un componente auxiliar, se define más abajo */}
       {showLevelUpReward && currentProblem && ( // Pasar problem si LevelUpModal lo necesita
         <LevelUpModal
           isOpen={showLevelUpReward}
           previousLevel={currentProblem.difficulty} // Mostrar la dificultad del problema que se acaba de resolver correctamente
           newLevel={adaptiveDifficulty} // Mostrar la nueva dificultad adaptativa
           onClose={() => {
             console.log("[ADDITION] Level Up Modal closed. Unblocking auto-advance.");
             setShowLevelUpReward(false); // Ocultar modal
             setBlockAutoAdvance(false); // Desbloquear auto-avance

              // Lógica de Regeneración del Problema para Dificultad Adaptativa
              // Esto se hace al cerrar el modal de level-up, NO en handleContinue directamente.
              const enableAdaptive = settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty;
              if (enableAdaptive && currentProblem && actualActiveProblemIndexBeforeViewingPrevious < problemsList.length) {
                  console.log(`[ADDITION] Regenerating problem ${actualActiveProblemIndexBeforeViewingPrevious} with new difficulty ${adaptiveDifficulty}.`);
                  const newProblemForLevelUp = generateAdditionProblem(adaptiveDifficulty); // Generar problema con la nueva dificultad
                  const updatedProblemsList = [...problemsList];
                  // Reemplazar el problema en el índice donde ocurrió el level up
                  updatedProblemsList[actualActiveProblemIndexBeforeViewingPrevious] = newProblemForLevelUp;
                  setProblemsList(updatedProblemsList);
                  setCurrentProblem(newProblemForLevelUp); // Cargar el problema regenerado

                  // Preparar el estado para el nuevo problema regenerado
                  setDigitAnswers(Array(newProblemForLevelUp.answerMaxDigits).fill("")); // Limpiar cajas
                  setCurrentAttempts(0); // Resetear intentos
                  setProblemTimerValue(settings?.timeValue ?? defaultModuleSettings.timeValue); // Reiniciar timer
                  setFeedbackMessage(null); // Limpiar feedback
                  setFeedbackColor(null);
                  setWaitingForContinue(false); // Permitir interactuar con el nuevo problema
                   setFocusedDigitIndex(null); // Asegurar que el foco se resetea o se establece por useEffect

                  // Si autoContinue está activado, iniciamos el timer de auto-continuar *después* de la regeneración y desbloqueo
                   if (autoContinue && !blockAutoAdvance) { // Re-verificar blockAutoAdvance aunque acabamos de desbloquear, para seguridad.
                      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
                       console.log("[ADDITION] Auto-continue enabled after level up modal close, waiting 3s for regenerated problem.");
                      autoContinueTimerRef.current = setTimeout(() => {
                          if (!blockAutoAdvance && waitingRef.current) { // Re-check state before calling handleContinue
                              console.log("[ADDITION] Auto-continuing after level up regeneration...");
                              handleContinue(); // Llama a la función memoizada (que ahora solo avanza)
                              autoContinueTimerRef.current = null;
                          } else {
                              console.log("[ADDITION] Auto-continue blocked or waiting state changed before trigger after level up.");
                          }
                      }, 3000); // 3 segundos de espera
                   }

              } else {
                 // Si la dificultad adaptativa no está activada, simplemente continuamos al siguiente problema normal.
                 // O si ya estamos en el último problema.
                 console.log("[ADDITION] Adaptive difficulty not enabled or already last problem. Calling handleContinue (advances or completes).");
                 // handleContinue ahora solo avanza o completa, lo cual es el comportamiento deseado aquí.
                 handleContinue();
              }
           }}
         />
       )}

       {/* Modal de confirmación genérico (ej: para reiniciar) */}
        {showConfirmModal && confirmModalAction && (
           // AlertDialog components son asumidos externos
            <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmationModal.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmModalMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                         {/* AlertDialogCancel es asumido externo */}
                        <AlertDialogCancel onClick={() => setShowConfirmModal(false)}>{t('common.cancel')}</AlertDialogCancel>
                         {/* AlertDialogAction es asumido externo */}
                        <AlertDialogAction onClick={confirmModalAction}>{t('common.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}


      {/* Cabecera principal del ejercicio (Progreso, Timers, Configuración) */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-medium text-gray-500">
          {/* Mostrar índice del problema actual (visible) y total */}
          {t('Problem')} {currentProblemIndex + 1} {t('of')} {problemsList.length}
        </div>

        {/* Área de Timers e Indicadores */}
         {/* Usamos flex items-center para alinear verticalmente */}
        <div className="flex items-center space-x-3 text-sm">
           {/* Timer general del ejercicio */}
           {/* Info icon y formatTime son asumidos externos */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium text-gray-700 flex items-center cursor-help">
                   <Info className="h-4 w-4 mr-1 opacity-70"/>{formatTime(timer)} {/* Tiempo total */}
                </span>
              </TooltipTrigger>
               {/* TooltipContent es asumido externo */}
              <TooltipContent>
                 {/* t() es asumido externo */}
                <p>{t('tooltips.totalTime')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>


          {/* Timer del problema actual (si hay límite de tiempo y no estamos en un estado de espera/final) */}
           {/* Usar waitingRef.current para checkear el estado de espera */}
          { (settings?.timeValue ?? defaultModuleSettings.timeValue) > 0 && !viewingPrevious && !waitingRef.current && exerciseStarted && !exerciseCompleted && !showLevelUpReward && (
             // Check si quedan intentos para mostrar el timer
             (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts) === 0 || currentAttempts < (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts)
          ) && (
            <span className={`font-medium p-1 px-2 rounded ${problemTimerValue <= 5 && problemTimerValue > 0 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"}`}>
              {t('Timer')}: {problemTimerValue}s
            </span>
          )}

          {/* Contador de intentos (si hay límite de intentos y no estamos viendo historial) */}
           {/* Usar waitingRef.current para checkear el estado de espera */}
          { (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts) > 0 && !viewingPrevious && !exerciseCompleted && !showLevelUpReward && (
             <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                   <span className={`font-medium p-1 px-2 rounded cursor-help ${currentAttempts > 0 && currentAttempts < (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts) ? "bg-amber-100 text-amber-800" : currentAttempts >= (settings?.maxAttempts ?? defaultModuleSettings.maxAttempts) ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                     {t('Attempts')}: {currentAttempts}/{settings.maxAttempts}
                   </span>
                </TooltipTrigger>
                 {/* TooltipContent es asumido externo */}
                <TooltipContent>
                   {/* t() es asumido externo */}
                  <p>{t('tooltips.maxAttemptsPerProblem')}</p>
                </TooltipContent>
              </Tooltip>
             </TooltipProvider>
          )}

           {/* Indicador de Score Parcial */}
           {/* Usar TooltipProvider y Tooltip */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                 {/* Usamos un span con cursor-help para indicar que es tooltip */}
                 <span className="font-medium p-1 px-2 rounded bg-blue-100 text-blue-800 cursor-help">
                   {t('Score')}: {finalScorePercentage}%
                 </span>
              </TooltipTrigger>
               {/* TooltipContent es asumido externo */}
              <TooltipContent>
                 {/* t() es asumido externo */}
                <p>{t('tooltips.partialScore')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>


           {/* Indicador de nivel de dificultad (adaptativa si está activa) */}
           {/* Usamos TooltipProvider y Tooltip */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                 {/* Usamos un span con cursor-help */}
                 <span className={`px-2 py-0.5 rounded-full font-semibold capitalize cursor-help ${
                   adaptiveDifficulty === "beginner" ? "bg-blue-100 text-blue-800" :
                   adaptiveDifficulty === "elementary" ? "bg-emerald-100 text-emerald-800" :
                   adaptiveDifficulty === "intermediate" ? "bg-orange-100 text-orange-800" :
                   adaptiveDifficulty === "advanced" ? "bg-purple-100 text-purple-800" :
                   adaptiveDifficulty === "expert" ? "bg-rose-100 text-rose-800" :
                  "bg-indigo-100 text-indigo-800" // Fallback
                }`}>
                    {/* Mostrar la dificultad adaptativa si está activa en settings, sino la configurada */}
                    {t('Level')}: {t((settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) ? adaptiveDifficulty : (settings?.difficulty as DifficultyLevel ?? defaultModuleSettings.difficulty as DifficultyLevel))}
                 </span>
              </TooltipTrigger>
               {/* TooltipContent es asumido externo */}
              <TooltipContent>
                 {/* t() es asumido externo */}
                <p>{t('tooltips.currentDifficulty')}</p>
                 {(settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) && (
                    <>
                        <p>{t('tooltips.adaptiveDifficultyEnabled')}</p>
                        <p>{t('tooltips.consecutiveCorrect', { count: consecutiveCorrectAnswers })}</p>
                        <p>{t('tooltips.consecutiveIncorrect', { count: consecutiveIncorrectAnswers })}</p>
                    </>
                 )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

           {/* Botón para abrir configuración (icono renombrado a SettingsIcon) */}
           {/* Button y Cog icon son asumidos externos */}
          <Button variant="ghost" size="sm" onClick={onOpenSettings} className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
            <Cog className="h-4 w-4" /> {t('common.settings')}
          </Button>
        </div>
      </div>

      {/* Barra de progreso del ejercicio */}
      <div className="mb-6">
         {/* ProgressBarUI es asumido externo */}
        <ProgressBarUI
           // Progreso basado en problemas intentados (no solo mostrados)
          value={problemsList.length > 0 ? (userAnswersHistory.filter(a => a !== null).length / problemsList.length) * 100 : 0}
          className="h-1.5 sm:h-2"
        />
      </div>

      {/* Contenedor del problema (expresión matemática) y la respuesta del usuario */}
      <div className="my-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm min-h-[150px] flex flex-col items-center justify-center">
         {/* Renderizar problema Horizontal o Vertical según layout */}
         {currentProblem.layout === 'horizontal'
          ? renderHorizontalProblem()
          : renderVerticalProblem()
         }

         {/* Renderizar las cajas de input para la respuesta */}
         {renderDigitAnswerBoxes()}
      </div>

      {/* Mensaje de feedback (Correcto, Incorrecto, etc.) */}
       {/* Solo mostrar feedback si hay mensaje Y no estamos en el modal de level up */}
      {feedbackMessage && !showLevelUpReward && (
        <div className={`mb-4 p-3 rounded-lg text-center font-medium text-sm sm:text-base ${
          feedbackColor === "green" ? "bg-green-50 border border-green-200 text-green-700" :
          feedbackColor === "red" ? "bg-red-50 border border-red-200 text-red-700" :
          "bg-blue-50 border border-blue-200 text-blue-700"
        }`}>
          {feedbackMessage}
        </div>
      )}

      {/* Botones de navegación y acción principal */}
      <div className="flex justify-between mt-4">
        {/* Grupo de botones Anterior/Siguiente (para historial) */}
        <div className="flex space-x-2">
           {/* Button y ChevronLeft icon son asumidos externos */}
          <Button
            variant="outline"
            size="sm"
             // Deshabilitar si ya estamos en el primer problema visualizado O si no hay problemas intentados aún
            disabled={currentProblemIndex === 0 || userAnswersHistory.filter(a => a !== null).length === 0 || exerciseCompleted || showLevelUpReward}
            onClick={handleViewPrevious}
            className="flex items-center text-xs sm:text-sm"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {/* Icono más pequeño */}
            {t('common.prev')}
          </Button>

           {/* Button y ChevronRight icon son asumidos externos */}
          <Button
            variant="outline"
            size="sm"
             // Deshabilitar si no estamos viendo historial O si ya estamos en el problema activo guardado
            disabled={!viewingPrevious || currentProblemIndex >= actualActiveProblemIndexBeforeViewingPrevious || exerciseCompleted || showLevelUpReward}
            onClick={handleViewNext}
            className="flex items-center text-xs sm:text-sm"
          >
            {t('common.next')}
            <ChevronRight className="h-3.5 w-3.5 ml-1" /> {/* Icono más pequeño */}
          </Button>
        </div>

        {/* Botón central de acción: Start, Check, o Continuar */}
        <div className="flex space-x-2">
          {!exerciseStarted ? (
            /* Button es asumido externo */
            /* Deshabilitar si está completado o modal level up activo */
            <Button onClick={startExercise} className="flex items-center px-4 sm:px-6 text-sm sm:text-base" disabled={exerciseCompleted || showLevelUpReward}>
              {t('exercises.start')}
            </Button>
          ) : waitingForContinue ? ( // Usar waitingRef.current para determinar si mostrar "Continuar"
            /* Button es asumido externo */
            /* Deshabilitar si showLevelUpReward es true, ya que el botón "Continuar" del modal se encarga */
            /* Usamos animate-pulse para hacerlo más llamativo */
            <Button
               // Deshabilitar si showLevelUpReward es true, ya que el botón "Continuar" del modal se encarga
              onClick={handleContinue}
              disabled={showLevelUpReward}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base ${showLevelUpReward ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 animate-pulse'} text-white flex items-center justify-center`}
            >
                <span className="flex-grow text-center font-medium">{t('Continue')}</span>
                 {/* Toggle de Auto-Continue (visible solo en el botón Continuar) */}
                 {/* Tooltip components son asumidos externos */}
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                         className={`ml-2 flex items-center bg-black/20 py-0.5 px-1.5 rounded-md cursor-pointer ${showLevelUpReward ? 'opacity-50 cursor-not-allowed' : ''}`}
                         // Solo permitir clic si no está bloqueado por level up modal
                        onClick={(e) => {
                          if (!showLevelUpReward) {
                            e.stopPropagation(); // Evita que el clic se propague al botón padre
                            setAutoContinue(prev => !prev);
                          }
                        }}
                      >
                         {/* Check icon es asumido externo */}
                        <div className={`h-3.5 w-3.5 border border-white rounded-sm flex items-center justify-center mr-1 ${autoContinue ? 'bg-white' : ''}`}>
                          {autoContinue && <Check className="h-2.5 w-2.5 text-green-700" />}
                        </div>
                        <span className="text-xs font-medium">{t('Auto')}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                       {/* t() es asumido externo */}
                      <p>{autoContinue ? t('tooltips.disableAutoContinue') : t('tooltips.enableAutoContinue')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </Button>
          ) : (
            /* Botón Check para verificar la respuesta */
            /* Button y Check icon son asumidos externos */
            /* Deshabilitar si está completado, esperando, viendo historial, o modal level up activo */
            <Button onClick={checkCurrentAnswer} disabled={exerciseCompleted || waitingRef.current || viewingPrevious || showLevelUpReward} className="px-4 sm:px-6 text-sm sm:text-base bg-blue-500 hover:bg-blue-600 text-white flex items-center">
              <Check className="h-4 w-4 mr-1" />
              {t('exercises.check')}
            </Button>
          )}

          {/* Botón Mostrar Respuesta */}
          {/* Button y Info icon son asumidos externos */}
          {/* Tooltip components son asumidos externos */}
          {/* Mostrar el botón solo si la configuración lo permite */}
          {(settings?.showAnswerWithExplanation ?? defaultModuleSettings.showAnswerWithExplanation) && !viewingPrevious && ( // No mostrar en vista de historial
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                     // Deshabilitado si el ejercicio no ha comenzado, está completado, esperando, viendo historial (ya chequeado), o modal level up activo
                    disabled={!exerciseStarted || exerciseCompleted || waitingRef.current || showLevelUpReward}
                    onClick={() => {
                        // Solo permitir si no está en estados deshabilitantes y se permite mostrar en settings
                        if(currentProblem && exerciseStarted && !exerciseCompleted && !waitingRef.current && !showLevelUpReward && (settings?.showAnswerWithExplanation ?? defaultModuleSettings.showAnswerWithExplanation)) {
                            console.log("[ADDITION] Showing answer via button...");
                            // Detener timer del problema si está corriendo
                            if (singleProblemTimerRef.current) {
                              clearInterval(singleProblemTimerRef.current);
                              singleProblemTimerRef.current = null;
                            }
                            // Mostrar la respuesta correcta
                            setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
                            setFeedbackColor("blue"); // Color para respuesta revelada
                            setWaitingForContinue(true); // Pone waitingRef.current = true -> espera para continuar
                            setFocusedDigitIndex(null); // Quitar foco

                            // Actualizar historial para marcar como revelado
                            const problemIdxForHistory = actualActiveProblemIndexBeforeViewingPrevious; // Índice del problema activo
                            const answerEntry = userAnswersHistory[problemIdxForHistory]; // Entrada actual en el historial

                            // Incrementar intentos al revelar, si no se han agotado
                             const maxAttempts = settings?.maxAttempts ?? defaultModuleSettings.maxAttempts;
                             const attemptsBeforeReveal = currentAttempts; // Intentos antes de hacer clic en revelar
                             let attemptsAfterReveal = attemptsBeforeReveal;

                             // Si hay límite de intentos y aún no se agotan, contamos el revelar como 1 intento.
                             // Si no hay límite, también se cuenta como un intento.
                             if (maxAttempts === 0 || attemptsBeforeReveal < maxAttempts) {
                                 attemptsAfterReveal = attemptsBeforeReveal + 1;
                                 setCurrentAttempts(attemptsAfterReveal); // Incrementar el contador de intentos
                             }

                            // Crear o actualizar la entrada del historial con el estado 'revealed'
                             const updatedHistoryEntry: UserAnswer = answerEntry ? {
                                 ...answerEntry, // Mantener id, problem, etc.
                                 userAnswerString: undefined, // No se introdujo una respuesta válida, limpiar string
                                 userAnswer: null, // No se introdujo una respuesta válida, null
                                 isCorrect: false, // No fue resuelta correctamente por el usuario
                                 status: 'revealed', // Marcada explícitamente como revelada
                                 attemptsMade: attemptsAfterReveal, // Guardar intentos incluyendo el revelar
                             } : { // Crear una nueva entrada (menos común)
                                 problemId: currentProblem.id,
                                 problem: currentProblem,
                                 userAnswerString: undefined,
                                 userAnswer: null,
                                 isCorrect: false,
                                 status: 'revealed',
                                 attemptsMade: attemptsAfterReveal,
                             };

                            setUserAnswersHistory(prev => {
                                const newHistory = [...prev];
                                newHistory[problemIdxForHistory] = updatedHistoryEntry;
                                return newHistory;
                            });


                            // Lógica de compensación: añadir problema si se revela la respuesta
                             const enableCompensation = settings?.enableCompensation ?? defaultModuleSettings.enableCompensation;
                             if (enableCompensation) {
                                console.log("[ADDITION] Compensation enabled. Adding one problem due to revealing answer.");
                                const difficultyForCompensation = (settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty) ? adaptiveDifficulty : (settings?.difficulty as DifficultyLevel ?? defaultModuleSettings.difficulty as DifficultyLevel);
                                const compensationProblem = generateAdditionProblem(difficultyForCompensation);
                                setProblemsList(prev => [...prev, compensationProblem]); // Añadir al final
                                setUserAnswersHistory(prev => [...prev, null]); // Añadir slot vacío en historial
                                console.log("[ADDITION] Problem added due to compensation (reveal).");
                             }

                             // Iniciar timer de auto-continuar si está activado (incluso después de revelar)
                             if (autoContinue && !blockAutoAdvance) { // También verificar blockAutoAdvance
                                if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
                                console.log("[ADDITION] Auto-continue enabled after revealing, waiting 3s...");
                                autoContinueTimerRef.current = setTimeout(() => {
                                    if (!blockAutoAdvance && waitingRef.current) { // Re-check state before calling handleContinue
                                         console.log("[ADDITION] Auto-continuing after revealing...");
                                        handleContinue(); // Llama a la función memoizada (que ahora solo avanza)
                                        autoContinueTimerRef.current = null;
                                    } else {
                                        console.log("[ADDITION] Auto-continue blocked or waiting state changed before trigger after revealing.");
                                    }
                                }, 3000);
                             }

                        } else {
                           console.log("[ADDITION] Show answer button clicked but logic blocked.");
                        }
                    }}
                    className="flex items-center text-xs sm:text-sm"
                >
                    <Info className="h-3.5 w-3.5 mr-1" /> {/* Icono más pequeño */}
                    {t('exercises.showAnswer')}
                  </Button>
                </TooltipTrigger>
                 {/* Tooltip content */}
                 {/* Mostrar tooltip solo si el botón está deshabilitado */}
                {(!exerciseStarted || exerciseCompleted || waitingRef.current || showLevelUpReward) && ( // Estados que deshabilitan el botón
                    <TooltipContent>
                        {/* t() es asumido externo */}
                       {/* Mensajes de tooltip específicos */}
                       {!exerciseStarted ? <p>{t('tooltips.startExerciseToShowAnswer')}</p> :
                        exerciseCompleted ? <p>{t('tooltips.showAnswerDisabledWhenCompleted')}</p> :
                        waitingRef.current || showLevelUpReward ? <p>{t('tooltips.showAnswerDisabledWhileWaiting')}</p> :
                         <p>{t('tooltips.genericShowAnswerDisabled')}</p>
                       }
                    </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Ajustes de auto-continuar (toggle) - Moverlo debajo de los botones de acción */}
      <div className="mt-4 border-t pt-3 flex justify-between items-center text-sm text-gray-500">
         {/* Label para el toggle */}
         {/* Usamos TooltipProvider y Tooltip para el toggle */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
               <Label htmlFor="auto-continue-toggle" className="flex items-center cursor-help"> {/* Usamos cursor-help para indicar tooltip */}
                 {t('exercises.autoContinue')}:
               </Label>
            </TooltipTrigger>
             {/* TooltipContent es asumido externo */}
            <TooltipContent>
               {/* t() es asumido externo */}
              <p>{autoContinue ? t('tooltips.disableAutoContinue') : t('tooltips.enableAutoContinue')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

         {/* Switch para el toggle de auto-continuar */}
         {/* Switch es asumido externo */}
        <Switch
          id="auto-continue-toggle"
          checked={autoContinue}
          onCheckedChange={(checked) => {
            setAutoContinue(checked);
             // La sincronización con localStorage se maneja en un useEffect
          }}
          className="data-[state=checked]:bg-green-500 h-4 w-7" // Estilos de Shadcn o similar
           // Deshabilitar el toggle si estamos esperando, completado, viendo historial, o modal level up activo
          disabled={waitingRef.current || exerciseCompleted || viewingPrevious || showLevelUpReward}
        />
      </div>

      {/* Botón de Reinicio del Ejercicio (Moverlo al final o en una sección de "acciones") */}
      {/* Colocarlo en la parte inferior izquierda, por ejemplo */}
      <div className="mt-4 border-t pt-3 flex justify-start">
         {/* Button y RotateCcw icon son asumidos externos */}
         {/* Deshabilitar si el ejercicio ya está completado o modal level up activo */}
        <Button
          variant="outline"
          size="sm"
           // Usar showConfirmation para mostrar un modal antes de reiniciar
          onClick={() => showConfirmation(t('confirmationModal.restartExercise'), restartExercise)}
          className="flex items-center text-xs sm:text-sm"
           // Deshabilitar si está completado o modal level up activo
          disabled={exerciseCompleted || showLevelUpReward}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> {/* Icono más pequeño */}
          {t('exercises.restartExercise')}
        </Button>
      </div>

    </div>
  );
}


// ========================================================================================
// COMPONENTE AUXILIAR: MODAL DE SUBIDA DE NIVEL
// Se define aquí porque es específico de este módulo de ejercicio.
// ========================================================================================

interface LevelUpModalProps {
  isOpen: boolean; // Controla si el modal está visible
  previousLevel: DifficultyLevel; // Nivel anterior (para mostrar)
  newLevel: DifficultyLevel; // Nuevo nivel (para mostrar)
  onClose: () => void; // Función para cerrar el modal (llamada al hacer clic en el botón)
}

// Este componente usa AlertDialog de Shadcn UI u otro sistema de modales.
function LevelUpModal({ isOpen, previousLevel, newLevel, onClose }: LevelUpModalProps) {
   // useTranslations es asumido externo
  const { t } = useTranslations();

  // No renderizar nada si no está abierto
  if (!isOpen) return null;

  return (
    // Usar AlertDialog u otro componente modal/overlay.
    // Este es un placeholder basado en AlertDialog, pero el diseño usa divs fijos.
    // Implementaremos la versión con divs fijos para coincidir con el "arte" del original.
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"> {/* z-index alto para overlay */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
         {/* Trophy icon es asumido externo */}
        <Trophy className="h-20 w-20 sm:h-24 sm:w-24 text-yellow-400 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('levelUp.title')}</h3>
        <p className="text-lg sm:text-xl mb-4 sm:mb-6">{t('levelUp.message', { level: t(newLevel) })}</p> {/* Usar el nuevo nivel traducido */}

         {/* Indicador visual de cambio de nivel */}
        <div className="flex justify-center mt-4 mb-6"> {/* Añadido margen inferior */}
            <div className="relative flex flex-col items-center">
                {/* Animación o icono arriba */}
                 {/* Puedes poner un icono o animación aquí si tienes un componente separado */}
                 {/* <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                   <div className="animate-bounce text-4xl">🎉</div>
                 </div> */}
                {/* Nivel Anterior */}
                <div className="bg-gradient-to-br from-blue-100 to-indigo-50 rounded-lg p-3 border border-indigo-200 min-w-[150px]"> {/* Ancho mínimo */}
                    <p className="text-sm text-indigo-700 mb-1">{t('levelUp.previousLevel')}</p>
                    <p className="text-xl font-bold text-indigo-600 capitalize">{t(previousLevel)}</p> {/* Traducir nivel anterior */}
                </div>
                {/* Flecha o separador */}
                <div className="flex justify-center my-2 text-indigo-500">
                    <ChevronRight className="h-6 w-6 rotate-90" /> {/* Icono de flecha rotado */}
                </div>
                {/* Nuevo Nivel */}
                <div className="bg-gradient-to-br from-indigo-100 to-purple-50 rounded-lg p-3 border border-purple-200 min-w-[150px]"> {/* Ancho mínimo */}
                    <p className="text-sm text-purple-700 mb-1">{t('levelUp.newLevel')}</p>
                    <p className="text-xl font-bold text-purple-600 capitalize">{t(newLevel)}</p> {/* Traducir nuevo nivel */}
                </div>
            </div>
        </div>

        <p className="text-sm text-gray-600 mt-6 italic">
           {(settings?.enableAdaptiveDifficulty ?? defaultModuleSettings.enableAdaptiveDifficulty)
              ? t('levelUp.adaptiveDifficultyEnabledInfo') // Mensaje si adaptativa está ON
              : t('levelUp.adaptiveDifficultyDisabledInfo')} {/* Mensaje si adaptativa está OFF */}
        </p>

        <div className="flex justify-center mt-6"> {/* Aumentado margen superior */}
             {/* Button es asumido externo */}
          <Button onClick={onClose} className="w-full max-w-[200px] bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg py-2.5 sm:py-3"> {/* Botón de tamaño fijo */}
            {t('levelUp.continueChallenge')}
          </Button>
        </div>
      </div>
    </div>
  );
}


// ========================================================================================
// COMPONENTE DE CONFIGURACIÓN (Originalmente Settings.tsx)
// Se renombra a SettingsPanel internamente para evitar conflicto con el export final.
// ========================================================================================

interface SettingsPanelProps {
  // Usamos la interfaz local ModuleSettings
  settings: ModuleSettings;
  onBack: () => void; // Función para volver al ejercicio (proveída por el padre)
}

function SettingsPanel({ settings, onBack }: SettingsPanelProps) {
  // Importamos la función de traducción
  const { t } = useTranslations();
  // useSettings y resetModuleSettings son asumidos externos
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  // Estado local para la configuración, inicializado con las props
  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
  // Estado para controlar la visualización del modal de confirmación de reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Referencia a la función debounced para guardar la configuración
  // debounce es asumido externo. Se usa useMemo para crear la función una vez.
  const debouncedSave = useMemo(
    () =>
      debounce((settings: ModuleSettings) => {
        // Llama a la función del contexto para guardar la configuración del módulo 'addition'
        updateModuleSettings("addition", settings);
        console.log(`[ADDITION] Guardando configuración (debounced):`, settings);
      }, 500), // Espera 500ms antes de ejecutar el guardado
    [updateModuleSettings] // Dependencia: la función de contexto updateModuleSettings
  );

  // Maneja la actualización de un ajuste individual
  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
    // Crear un nuevo objeto de configuración local con el ajuste actualizado
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings); // Actualizar estado local

    // Lógica para guardar: si cambia la dificultad, guardar inmediatamente; para otros ajustes, usar debounce.
    if (key === "difficulty") {
      console.log(`[ADDITION] Guardando configuración de dificultad inmediatamente: ${value}`);
      // Cast es necesario porque la prop value es ModuleSettings[K], pero el contexto espera ModuleSettings
      // y la dificultad aquí ya está validada por DifficultyExamples o Input.
      updateModuleSettings("addition", updatedSettings as ModuleSettings);
    } else {
      // Para otros ajustes (sliders, switches, etc.), usar la función debounced.
      // Se llama debouncedSave con el objeto de settings ACTUALIZADO.
      debouncedSave(updatedSettings);
    }
  };

  // Efecto para guardar la configuración inmediatamente al montar el componente
  // y como respaldo al desmontar.
  const hasSavedRef = useRef(false); // Ref para evitar guardar múltiples veces al desmontar

  useEffect(() => {
    // Guardar configuración inmediatamente al montar para asegurar que los valores
    // persistidos se carguen y se apliquen si no lo hicieron antes.
    console.log("[ADDITION] Guardando configuración al montar:", localSettings);
    updateModuleSettings("addition", localSettings);
     hasSavedRef.current = true; // Marca que ya se intentó guardar al montar

    // Función de limpieza: se ejecuta al desmontar el componente.
    return () => {
      // La lógica original forzaba un guardado directo en localStorage aquí.
      // Si `updateModuleSettings` ya gestiona la persistencia de forma confiable
      // (ej. usando useEffect en el contexto), este bloque puede ser redundante.
      // Lo mantenemos para coincidir con el código original, pero con la nota.
      // Idealmente, el `debouncedSave` o un efecto en el contexto de settings
      // debería manejar la persistencia.
       if (!hasSavedRef.current) { // Solo guardar si no se ha guardado ya (ej. por un cambio de dificultad inmediato)
           hasSavedRef.current = true; // Marca que se intentó guardar al desmontar
           console.log("[ADDITION] Guardando configuración al desmontar (final):", localSettings);
           updateModuleSettings("addition", localSettings); // Llamada directa sin debounce
           // La lógica de forzar localStorage directamente es una duplicación de la posible
           // lógica del contexto de settings y puede llevar a inconsistencias.
           // Se recomienda que la persistencia la maneje UNA ÚNICA fuente (preferiblemente el contexto).
           // Dejamos el acceso directo a localStorage del original por si acaso es necesario para algún side effect.
           try {
             const profileId = localStorage.getItem('activeProfileId');
             const suffix = profileId ? `-profile-${profileId}` : '';
             const key = `moduleSettings${suffix}`;
             const currentSettings = localStorage.getItem(key);
             const parsed = currentSettings ? JSON.parse(currentSettings) : {};
             const updated = {
               ...parsed,
               addition: localSettings
             };
             localStorage.setItem(key, JSON.stringify(updated));
             console.log("[ADDITION] Forzando actualización directa en localStorage al desmontar:", updated);
           } catch (e) {
             console.error("Error al forzar guardado directo en localStorage al desmontar:", e);
           }
       }
    };
  // Dependencias: localSettings (para guardar los cambios locales), updateModuleSettings (la función de guardado).
  // debouncedSave NO debe ser dependencia aquí si el objetivo es guardar el *último* localSettings al desmontar.
  // Si fuera dependencia, el efecto se re-ejecutaría cada vez que debouncedSave cambia (lo cual es solo al montar).
  }, [localSettings, updateModuleSettings]); // Dependencias correctas

  // Maneja el clic en el botón "Restablecer valores predeterminados"
  const handleResetSettings = async () => {
    if (showResetConfirm) {
      // Si el usuario ya confirmó, llama a la función del contexto para resetear
      await resetModuleSettings("addition");
      // Actualiza el estado local a los valores por defecto
      setLocalSettings({ ...defaultModuleSettings }); // Usamos el placeholder local
      setShowResetConfirm(false); // Oculta el mensaje de confirmación
    } else {
      // Si es el primer clic, muestra el mensaje de confirmación
      setShowResetConfirm(true);
    }
  };

  // Función auxiliar para obtener las clases de tema basadas en la dificultad seleccionada
  const getDifficultyTheme = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return {
          bg: "bg-gradient-to-br from-blue-50 to-blue-100",
          border: "border-blue-200",
          text: "text-blue-600",
          textSecondary: "text-blue-500",
          bgContainer: "bg-blue-50",
          bgLight: "bg-blue-100", // Usado en Slider/Switch track
          // bgMedium: "bg-blue-200", // No usado
          accent: "text-blue-700", // Usado para etiquetas y texto dentro de contenedores
          emoji: "🔵",
          // name: "Principiante" // No usado
        };
      case "elementary":
        return {
          bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
          border: "border-emerald-200",
          text: "text-emerald-600",
          textSecondary: "text-emerald-500",
          bgContainer: "bg-emerald-50",
          bgLight: "bg-emerald-100",
          // bgMedium: "bg-emerald-200",
          accent: "text-emerald-700",
          emoji: "🟢",
          // name: "Elemental"
        };
      case "intermediate":
        return {
          bg: "bg-gradient-to-br from-orange-50 to-orange-100",
          border: "border-orange-200",
          text: "text-orange-600",
          textSecondary: "text-orange-500",
          bgContainer: "bg-orange-50",
          bgLight: "bg-orange-100",
          // bgMedium: "bg-orange-200",
          accent: "text-orange-700",
          emoji: "🟠",
          // name: "Intermedio"
        };
      case "advanced":
        return {
          bg: "bg-gradient-to-br from-purple-50 to-purple-100",
          border: "border-purple-200",
          text: "text-purple-600",
          textSecondary: "text-purple-500",
          bgContainer: "bg-purple-50",
          bgLight: "bg-purple-100",
          // bgMedium: "bg-purple-200",
          accent: "text-purple-700",
          emoji: "🟣",
          // name: "Avanzado"
        };
      case "expert":
        return {
          bg: "bg-gradient-to-br from-rose-50 to-rose-100",
          border: "border-rose-200",
          text: "text-rose-600",
          textSecondary: "text-rose-500",
          bgContainer: "bg-rose-50",
          bgLight: "bg-rose-100",
          // bgMedium: "bg-rose-200",
          accent: "text-rose-700",
          emoji: "⭐",
          // name: "Experto"
        };
      default: // Tema por defecto si la dificultad no coincide (ej. undefined o error)
        return {
          bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
          border: "border-indigo-200",
          text: "text-indigo-600",
          textSecondary: "text-indigo-500",
          bgContainer: "bg-indigo-50",
          bgLight: "bg-indigo-100",
          // bgMedium: "bg-indigo-200",
          accent: "text-indigo-700",
          emoji: "⚡",
          // name: "General"
        };
    }
  };

  // Obtener el tema de color basado en la dificultad seleccionada en el estado local
  const theme = getDifficultyTheme(localSettings.difficulty || "beginner"); // Usar "beginner" como fallback

  // ==========================================
  // 5.1: RENDERIZADO DE LA INTERFAZ DE CONFIGURACIÓN
  // ==========================================

  return (
    // Contenedor principal de la configuración con estilos temáticos
    <div className={`px-4 py-5 sm:p-6 rounded-xl shadow-md ${theme.bg} border-2 ${theme.border}`}>
      {/* Cabecera de la configuración (Título y botón Volver) */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {/* Título con emoji temático */}
          <h2 className={`text-2xl font-bold ${theme.text} flex items-center`}>
            {theme.emoji} Configuración - Ejercicio de Suma
          </h2>
          <p className={`text-sm font-medium ${theme.textSecondary}`}>Personaliza tu experiencia de ejercicio</p>
        </div>
         {/* Botón Volver al Ejercicio */}
         {/* Button y ArrowLeft icon son asumidos externos */}
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className={`border ${theme.border} hover:${theme.bgContainer} text-gray-600 hover:text-gray-800`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Ejercicio
        </Button>
      </div>

      {/* Contenedores de secciones de configuración */}
      <div className="space-y-6">

        {/* Sección: Nivel de Dificultad */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🎯</span>Nivel de Dificultad
          </h3>
          <p className={`text-sm ${theme.textSecondary} mb-2`}>Haz clic en un ejemplo para cambiar el nivel de dificultad:</p>

          {/* Componente para mostrar ejemplos de dificultad y seleccionar */}
          {/* DifficultyExamples es asumido externo */}
          <div className="mt-4 mb-6 bg-white/80 rounded-lg p-4 border border-gray-100 shadow-sm">
            <DifficultyExamples
              operation="addition" // Especifica la operación
              activeDifficulty={localSettings.difficulty} // Pasa la dificultad actual seleccionada
              onSelectDifficulty={(difficulty) =>
                // Llama a handleUpdateSetting con la dificultad seleccionada (convertida a DifficultyLevel)
                handleUpdateSetting("difficulty", difficulty as DifficultyLevel)
              }
            />
          </div>

          {/* Descripciones textuales de los niveles de dificultad */}
          <div className="mt-3 mb-2 space-y-1.5">
             {/* Usar clases temáticas para el color del texto y borde */}
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('difficulty.beginner')}:</span> Sumas con dígitos simples (1+8, 7+5)
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('difficulty.elementary')}:</span> Sumas de números de dos dígitos (10+10 a 99+99)
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('difficulty.intermediate')}:</span> Sumas con 2-3 operandos, hasta ~500, con o sin 1 decimal
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('difficulty.advanced')}:</span> Sumas con 3-4 operandos, hasta ~1500, con 1 o 2 decimales
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('difficulty.expert')}:</span> Sumas con 4-5 operandos, hasta ~5000, con 1 o 2 decimales
            </p>
          </div>
        </div>

        {/* Sección: Número de Problemas */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🔢</span>Número de Problemas
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                {/* Slider para seleccionar el número de problemas */}
                {/* Slider es asumido externo */}
                <Slider
                  value={[localSettings.problemCount]} // Valor actual del slider (array de un elemento)
                  min={1} // Mínimo número de problemas
                  max={50} // Máximo número de problemas
                  step={1} // Incremento/decremento del slider
                  onValueChange={(value) => handleUpdateSetting("problemCount", value[0])} // Cuando el valor cambia, actualiza el estado local
                  className={`w-full ${theme.bgLight}`} // Clase temática para el track del slider
                />
                {/* Indicadores visuales en el slider */}
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>
              {/* Input numérico para entrada directa del número de problemas */}
              {/* Input es asumido externo */}
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.problemCount} // Valor actual del input
                  onChange={(e) => {
                    const value = parseInt(e.target.value); // Convertir a entero
                    // Validar que el valor es un número y está dentro del rango permitido
                    if (!isNaN(value) && value >= 1 && value <= 50) {
                      handleUpdateSetting("problemCount", value); // Actualizar estado local si es válido
                    }
                  }}
                  min={1} // Atributo min para input type="number"
                  max={50} // Atributo max para input type="number"
                  className={`w-full border ${theme.border}`} // Clase temática para el borde
                />
              </div>
            </div>
            {/* Texto informativo sobre el ajuste actual */}
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
              <span className="font-medium">Especifica cuántos problemas quieres resolver:</span> <span className={`font-bold ${theme.text}`}>{localSettings.problemCount}</span>
            </p>
          </div>
        </div>

        {/* Sección: Límite de Tiempo */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">⏱️</span>Límite de Tiempo
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                {/* Slider para seleccionar el tiempo límite por problema */}
                {/* Slider es asumido externo */}
                <Slider
                  value={[localSettings.timeValue]}
                  min={0} // 0 para sin límite
                  max={300} // 5 minutos (300 segundos)
                  step={5} // Incrementos de 5 segundos
                  onValueChange={(value) => handleUpdateSetting("timeValue", value[0])}
                  className={`w-full ${theme.bgLight}`} // Clase temática para el track del slider
                />
                {/* Indicadores visuales en el slider */}
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                  <span>0</span>
                  <span>150</span>
                  <span>300</span>
                </div>
              </div>
              {/* Input numérico para entrada directa del tiempo límite */}
              {/* Input es asumido externo */}
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.timeValue}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    // Validar que el valor es un número y está dentro del rango permitido
                    if (!isNaN(value) && value >= 0 && value <= 300) {
                      handleUpdateSetting("timeValue", value);
                    }
                  }}
                  min={0} // Atributo min para input type="number"
                  max={300} // Atributo max para input type="number"
                  className={`w-full border ${theme.border}`} // Clase temática para el borde
                />
              </div>
            </div>
            {/* Texto informativo sobre el ajuste actual */}
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
              <span className="font-medium">Tiempo en segundos:</span> <span className={`font-bold ${theme.text}`}>{localSettings.timeValue}</span> <span className="text-xs">(0 para sin límite)</span>
            </p>
          </div>
        </div>

        {/* Sección: Máximo de Intentos por Problema */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🔄</span>Máximo de Intentos por Problema
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                {/* Slider para seleccionar el máximo de intentos */}
                {/* Slider es asumido externo */}
                <Slider
                  value={[localSettings.maxAttempts]}
                  min={0} // 0 para intentos ilimitados
                  max={10} // Máximo 10 intentos
                  step={1} // Incrementos de 1 intento
                  onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])}
                  className={`w-full ${theme.bgLight}`} // Clase temática para el track del slider
                />
                {/* Indicadores visuales en el slider */}
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
              {/* Input numérico para entrada directa del máximo de intentos */}
              {/* Input es asumido externo */}
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.maxAttempts}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                     // Validar que el valor es un número y está dentro del rango permitido
                    if (!isNaN(value) && value >= 0 && value <= 10) {
                      handleUpdateSetting("maxAttempts", value);
                    }
                  }}
                  min={0} // Atributo min para input type="number"
                  max={10} // Atributo max para input type="number"
                  className={`w-full border ${theme.border}`} // Clase temática para el borde
                />
              </div>
            </div>
            {/* Texto informativo sobre el ajuste actual */}
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
              <span className="font-medium">Intentos máximos:</span> <span className={`font-bold ${theme.text}`}>{localSettings.maxAttempts}</span> <span className="text-xs">(0 para intentos ilimitados)</span>
            </p>
          </div>

          {/* Sección: Configuración Adicional (Switches) */}
          <h3 className={`text-lg font-bold ${theme.text} flex items-center mt-6`}>
            <span className="mr-2">⚙️</span>Configuración Adicional
          </h3>
          <div className="mt-3 space-y-3">
            {/* Switch: Mostrar retroalimentación inmediata */}
             {/* Label y Switch son asumidos externos */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="show-immediate-feedback" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">📝</span>Mostrar retroalimentación inmediata
              </Label>
              <Switch
                id="show-immediate-feedback"
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
                className={`data-[state=checked]:bg-${theme.bgLight.split('-')[1]}-500 ${theme.bgLight}`} // Clase temática para el track del Switch
              />
            </div>
            {/* Switch: Habilitar efectos de sonido */}
             {/* Label y Switch son asumidos externos */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-sound-effects" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">🔊</span>Habilitar efectos de sonido
              </Label>
              <Switch
                id="enable-sound-effects"
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
                className={`data-[state=checked]:bg-${theme.bgLight.split('-')[1]}-500 ${theme.bgLight}`} // Clase temática para el track del Switch
              />
            </div>
            {/* Switch: Mostrar explicación de respuestas */}
             {/* Label y Switch son asumidos externos */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="show-answer-explanation" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">❓</span>Mostrar explicación de respuestas
              </Label>
              <Switch
                id="show-answer-explanation"
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
                className={`data-[state=checked]:bg-${theme.bgLight.split('-')[1]}-500 ${theme.bgLight}`} // Clase temática para el track del Switch
              />
            </div>
            {/* Switch: Habilitar Dificultad Adaptativa */}
             {/* Label y Switch son asumidos externos */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-adaptive-difficulty" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">📈</span>Habilitar Dificultad Adaptativa
              </Label>
              <Switch
                id="enable-adaptive-difficulty"
                checked={localSettings.enableAdaptiveDifficulty}
                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
                className={`data-[state=checked]:bg-${theme.bgLight.split('-')[1]}-500 ${theme.bgLight}`} // Clase temática para el track del Switch
              />
            </div>
            {/* Switch: Habilitar Compensación */}
             {/* Label y Switch son asumidos externos */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-compensation" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">➕</span>Habilitar Compensación
                <br/><span className="text-xs ml-5 opacity-80">(Añadir 1 problema por cada incorrecto/revelado)</span>
              </Label>
              <Switch
                id="enable-compensation"
                checked={localSettings.enableCompensation}
                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
                 className={`data-[state=checked]:bg-${theme.bgLight.split('-')[1]}-500 ${theme.bgLight}`} // Clase temática para el track del Switch
              />
            </div>
             {/* Switch: Activar sistema de recompensas */}
             {/* Label y Switch son asumidos externos */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-rewards" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">🏆</span>Activar sistema de recompensas aleatorias
                 {/* Emojis o iconos de ejemplo de recompensas */}
                <div className="flex items-center ml-2 mt-1">
                  <span className="mx-0.5 text-xl">🏅</span>
                  <span className="mx-0.5 text-xl">🏆</span>
                  <span className="mx-0.5 text-xl">⭐</span>
                </div>
              </Label>
              <Switch
                id="enable-rewards"
                checked={localSettings.enableRewards}
                onCheckedChange={(checked) => handleUpdateSetting("enableRewards", checked)}
                className={`data-[state=checked]:bg-${theme.bgLight.split('-')[1]}-500 ${theme.bgLight}`} // Clase temática para el track del Switch
              />
            </div>
             {/* Información adicional sobre recompensas si están activadas */}
            {localSettings.enableRewards && (
              <div className={`ml-6 mt-3 p-3 rounded-md bg-white/70 border ${theme.border}`}>
                <p className={`text-sm ${theme.accent}`}>
                  <span className="mr-2">🎲</span>Las recompensas aparecerán de forma aleatoria durante los ejercicios:
                </p>
                 {/* Ejemplos visuales de recompensas */}
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">🏅</span>
                    <span className={`text-xs font-medium ${theme.text}`}>Medallas</span>
                  </div>
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">🏆</span>
                    <span className={`text-xs font-medium ${theme.text}`}>Trofeos</span>
                  </div>
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">⭐</span>
                    <span className={`text-xs font-medium ${theme.text}`}>Estrellas</span>
                  </div>
                </div>
                 {/* Texto explicativo */}
                <p className={`text-xs mt-3 ${theme.textSecondary} text-center italic`}>
                  El sistema elegirá automáticamente qué recompensa mostrar en cada ocasión
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sección: Restablecer Valores Predeterminados */}
        <div className="pt-4">
          <div className="flex justify-end">
             {/* Botón para restablecer configuración */}
             {/* Button y RotateCcw icon son asumidos externos */}
            <Button
              type="button"
              variant={showResetConfirm ? "destructive" : "outline"} // Cambia variante si se muestra confirmación
              onClick={handleResetSettings}
              className={`mr-3 ${showResetConfirm ? "" : `border ${theme.border} hover:${theme.bgContainer} text-gray-600 hover:text-gray-800`}`}
            >
              {showResetConfirm ? (
                 // Texto de confirmación
                "Confirmar Restablecimiento"
              ) : (
                 // Texto normal del botón
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restablecer valores predeterminados
                </>
              )}
            </Button>
            {/* El botón de guardar ya no es necesario si los cambios se guardan automáticamente */}
          </div>
        </div>
      </div>
    </div>
  );
}


// ========================================================================================
// EXPORTACIÓN DEL MÓDULO
// Exporta los componentes principales del módulo: Exercise y Settings (que es SettingsPanel).
// ========================================================================================

// Exportamos los componentes individuales para que puedan ser importados correctamente
export { SettingsPanel };
export default Exercise;
