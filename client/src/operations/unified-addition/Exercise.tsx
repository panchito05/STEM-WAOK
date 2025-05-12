// src/modules/addition/Addition.tsx - Módulo autocontenido de Addition

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Importaciones de hooks y contextos
import { useSettings, ModuleSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';
import { useTranslations } from '@/hooks/use-translations';

// Importaciones de la lógica de recompensas y niveles
import { useRewardsStore, awardReward, getRewardProbability } from '@/lib/rewards-system';
import eventBus from '@/lib/eventBus'; // Usado para notificar eventos como subida de nivel
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager';

// Importaciones de componentes de UI (asumiendo shadcn/ui u similar)
import { Button } from '@/components/ui/button';
import { Progress as ProgressBarUI } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
// Iconos
import { Settings as SettingsIcon, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw, ArrowLeft } from 'lucide-react';

// Importaciones de utilidades generales
import { formatTime, debounce } from '@/lib/utils'; // debounce está en lib/utils
import { defaultModuleSettings } from '@/utils/operationComponents'; // default settings para reset

// Importaciones de componentes específicos (si son externos, ej: DifficultyExamples)
import DifficultyExamples from '@/components/DifficultyExamples'; // Componente para mostrar ejemplos de dificultad
import LevelUpHandler from '@/components/LevelUpHandler'; // Componente para manejar la visualización de subida de nivel (puede ser un modal o similar)
import RewardAnimation from '@/components/rewards/RewardAnimation'; // Componente para mostrar animaciones de recompensa

// Importaciones de utilidades y tipos que se definen en este archivo ahora
// (No se importan, se definen localmente)


// ==========================================
// SECCIÓN 1: TIPOS Y INTERFACES
// ==========================================
// Definiciones de tipos que originalmente estaban en types.ts
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';
export type ExerciseLayout = 'horizontal' | 'vertical';

// Interfaz para un problema de ejercicio (genérico para sumas)
export interface Problem {
  id: string; // Identificador único del problema
  operands: number[]; // Array de números a sumar (soporta 2+)
  correctAnswer: number; // La respuesta correcta del problema
  layout: ExerciseLayout; // Diseño para mostrar el problema ('horizontal' o 'vertical')
  answerMaxDigits: number; // El número total de dígitos esperados en la respuesta (sin contar el punto decimal si existe)
  answerDecimalPosition?: number; // La posición del punto decimal contado desde la DERECHA de la respuesta. Undefined si no hay decimales.
  difficulty: DifficultyLevel; // La dificultad con la que se generó este problema
  // Props adicionales que podrían ser útiles o estaban en versiones anteriores
  num1?: number; // Puede mantenerse para compatibilidad o simplicidad si solo hay 2 operandos
  num2?: number; // Igual que num1
}

// Alias para la compatibilidad con el código existente que podría usar AdditionProblem
export type AdditionProblem = Problem;

// Interfaz para la respuesta del usuario a un problema
export interface UserAnswer {
  problem: Problem; // Referencia al problema respondido
  problemId: string; // ID del problema respondido
  userAnswerString?: string; // La respuesta del usuario como string (tal cual se ingresó en los cajones)
  userAnswer: number | null; // La respuesta del usuario convertida a número (null si no se ingresó nada válido)
  isCorrect: boolean; // Si la respuesta fue correcta
  status?: 'correct' | 'incorrect' | 'revealed' | 'timeout' | 'unanswered'; // Estado final del intento
  attemptsMade: number; // Número de intentos que se hicieron en este problema (incluyendo el actual)
  timeSpentOnProblem?: number; // Tiempo que tardó el usuario en responder este problema (si aplica)
}


// ==========================================
// SECCIÓN 2: FUNCIONES UTILITARIAS
// ==========================================
// Funciones auxiliares que originalmente estaban en utils.ts

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
  // Para asegurar que los decimales se mantienen en el string si son ceros finales
  const fixedString = value.toFixed(maxDecimals); 
  return parseFloat(fixedString); // Usar parseFloat para el valor numérico exacto
}

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9); // Substring para hacerlo más corto
}

// Generación del Problema de Suma
export function generateAdditionProblem(difficulty: DifficultyLevel): AdditionProblem {
  const id = generateUniqueId();
  let operands: number[] = [];
  let layout: ExerciseLayout = 'horizontal';
  let problemMaxDecimals: 0 | 1 | 2 = 0;

  switch (difficulty) {
    case "beginner": // Sumas simples de 1 dígito
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
      break;
    case "elementary": // 2 operandos, hasta 2 dígitos, sin acarreo complejo inicialmente
      operands = [getRandomInt(10, 40), getRandomInt(1, 15)]; // ej: 23 + 7, 35 + 12
      if (getRandomBool(0.5)) { // 50% chance de dos dígitos + dos dígitos simples
          operands = [getRandomInt(10, 40), getRandomInt(10, 40)]; // ej: 12 + 15, 31 + 24
      }
      layout = getRandomBool(0.2) ? 'vertical' : 'horizontal'; // Pequeña chance de vertical
      break;
    case "intermediate": // 2-3 operandos, hasta 3 dígitos, posible 1 decimal, aleatoriamente vertical
      layout = getRandomBool(0.75) ? 'vertical' : 'horizontal'; // 75% vertical
      const numIntermediateOperands = getRandomBool(0.6) ? 2 : 3; // 60% chance de 2 operandos
      problemMaxDecimals = getRandomBool(0.4) ? 1 : 0; // 40% chance de 1 decimal

      for (let i = 0; i < numIntermediateOperands; i++) {
         operands.push(getRandomDecimal(10, getRandomInt(50, 250), problemMaxDecimals)); // Ej: 45 + 120, 3.5 + 8.1 + 12
      }
      break;
    case "advanced": // 3-4 operandos, hasta 4 dígitos, 1 o 2 decimales, siempre vertical
      layout = 'vertical';
      const numAdvancedOperands = getRandomBool(0.5) ? 3 : 4; // 50% chance de 3 o 4 operandos
      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1; // 60% chance de 2 decimales

      for (let i = 0; i < numAdvancedOperands; i++) {
        operands.push(getRandomDecimal(50, getRandomInt(300, 1500), problemMaxDecimals)); // Ej: 120.5 + 345.7 + 600.1, 850 + 1120 + 550 + 210
      }
      break;
    case "expert": // 4-5 operandos, hasta 5 dígitos, 1 o 2 decimales, siempre vertical
      layout = 'vertical';
      const numExpertOperands = getRandomBool(0.5) ? 4 : 5; // 50% chance de 4 o 5 operandos
      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1; // 75% chance de 2 decimales

      for (let i = 0; i < numExpertOperands; i++) {
        operands.push(getRandomDecimal(100, getRandomInt(1000, 5000), problemMaxDecimals)); // Ej: 1234.5 + ..., 5000 + ...
      }
      break;
    default: // Fallback a beginner
      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
      layout = 'horizontal';
  }

  if (operands.length === 0) { // Salvaguarda final
    operands = [getRandomInt(1,5), getRandomInt(1,5)];
  }

  const sum = operands.reduce((acc, val) => acc + val, 0);

  // Calcular la máxima precisión decimal necesaria para la respuesta
  // Si se generaron decimales explícitamente, usar esa precisión
  // Si no, encontrar la máxima precisión entre los operandos (para sumas de enteros con decimales)
  let effectiveAnswerDecimalPrecision = problemMaxDecimals;
   if (effectiveAnswerDecimalPrecision === 0) {
       effectiveAnswerDecimalPrecision = Math.max(0, ...operands.map(op => {
           const opStr = String(op);
           return (opStr.split('.')[1] || '').length;
       }));
   }


  // Calcular la respuesta correcta redondeada a la precisión necesaria
  const correctAnswer = parseFloat(sum.toFixed(effectiveAnswerDecimalPrecision));

  // Preparar información para las cajas de respuesta
  const correctAnswerStr = correctAnswer.toFixed(effectiveAnswerDecimalPrecision);
  const [integerPartOfSumStr, decimalPartOfSumStr = ""] = correctAnswerStr.split('.');

  const answerMaxDigits = integerPartOfSumStr.length + decimalPartOfSumStr.length;
  const answerDecimalPosition = effectiveAnswerDecimalPrecision > 0 ? effectiveAnswerDecimalPrecision : undefined;
  const numberOfAnswerSlots = answerMaxDigits + (answerDecimalPosition !== undefined ? 1 : 0);


  return {
    id,
    num1: operands[0],
    num2: operands.length > 1 ? operands[1] : 0,
    operands,
    correctAnswer,
    layout,
    answerMaxDigits,
    answerDecimalPosition,
    numberOfAnswerSlots,
    difficulty,
  };
}

// Validación de la Respuesta
function checkAnswer(problem: AdditionProblem, userAnswer: number | null): boolean {
  if (userAnswer === null || isNaN(userAnswer)) return false;

  // Usar la precisión definida en el problema para la comparación
  const precisionForComparison = problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0
    ? problem.answerDecimalPosition
    : 0;

  const factor = Math.pow(10, precisionForComparison);
  const roundedCorrectAnswer = Math.round(problem.correctAnswer * factor) / factor;
  const roundedUserAnswer = Math.round(userAnswer * factor) / factor;

  return roundedUserAnswer === roundedCorrectAnswer;
}

// Funciones auxiliares para formatear números para la vista vertical
// Asegura que todos los operandos tengan la misma cantidad de decimales para la alineación
export function getVerticalAlignmentInfo(
    operands: number[],
    problemOverallDecimalPrecision?: number
): {
    maxIntLength: number;
    maxDecLength: number;
    operandsFormatted: Array<{ original: number, intStr: string, decStr: string }>;
    sumLineTotalCharWidth: number;
} {
    const effectiveDecimalPlacesToShow = problemOverallDecimalPrecision || 0;

    const operandsDisplayInfo = operands.map(op => {
        // Formatea cada operando con la precisión global definida para el problema
        const s = op.toFixed(effectiveDecimalPlacesToShow);
        const parts = s.split('.');
        return {
            original: op,
            intPart: parts[0],
            decPart: parts[1] || ""
        };
    });

    // Encuentra la longitud máxima de la parte entera entre todos los operandos formateados
    const maxIntLength = Math.max(1, ...operandsDisplayInfo.map(info => info.intPart.length));
    // La longitud máxima de la parte decimal es la precisión global
    const maxDecLength = effectiveDecimalPlacesToShow;

    // Formatea cada operando añadiendo espacios a la izquierda para alinear la parte entera
    // y ceros a la derecha para alinear la parte decimal (si hay decimales)
    const operandsFormatted = operandsDisplayInfo.map(info => ({
        original: info.original,
        intStr: info.intPart.padStart(maxIntLength, ' '),
        decStr: info.decPart.padEnd(maxDecLength, '0') // Pad con 0s para la vista vertical
    }));

    // Calcula el ancho total necesario para la línea de suma y las cajas de respuesta en formato vertical
    // maxIntLength (parte entera) + (1 si hay decimales) + maxDecLength (parte decimal)
    const sumLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 : 0) + maxDecLength;

    return { maxIntLength, maxDecLength, operandsFormatted, sumLineTotalCharWidth };
}


// ==========================================
// SECCIÓN 3: COMPONENTE PRINCIPAL (EXERCISE)
// ==========================================
interface ExerciseProps {
  // settings se pasa como prop, pero el componente SettingsPanel usa useSettings
  // Esto implica que el componente principal (que renderiza Exercise O SettingsPanel)
  // pasa los settings obtenidos de useSettings a Exercise.
  // Para un módulo autocontenido, idealmente Exercise y SettingsPanel
  // deberían estar juntos y manejar el estado de configuración a través de useSettings.
  // Vamos a asumir que se usa useSettings directamente dentro de Exercise y SettingsPanel.
  // Por lo tanto, eliminamos 'settings' de las props aquí.
  // Y 'onOpenSettings' es manejado por el estado interno del componente compuesto.
}

// Estilos de cajas de entrada y de visualización vertical
const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
const digitBoxFocusStyle = "border-blue-500 ring-2 ring-blue-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300 focus:border-blue-500"; // Añadido focus style on blur state
const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const plusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const sumLineStyle = "border-t-2 border-gray-700 my-1";


// Componente Exercise & Settings Container
// Este componente actúa como el módulo autocontenido, manejando si mostrar el ejercicio o la configuración.
export default function AdditionModule() {
  // Usamos useSettings aquí ya que es el contenedor del módulo
  const { moduleSettings, updateModuleSettings, resetModuleSettings } = useSettings();
  // Acceder directamente a las configuraciones de suma con fallback a valores por defecto
  const settings = moduleSettings?.addition || defaultModuleSettings;

  const [showSettings, setShowSettings] = useState(false);

  // ==========================================
  // ESTADO Y REFS DEL EJERCICIO (Movemos aquí)
  // ==========================================
  const [problemsList, setProblemsList] = useState<AdditionProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<AdditionProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl'); // Dirección de escritura por defecto
  const digitBoxRefs = useRef<HTMLDivElement[]>([]);
  const boxRefsArrayRef = useRef<HTMLDivElement[]>([]); // Auxiliar para reconstruir refs

  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswer[]>([]);
  const [timer, setTimer] = useState(0); // Timer general del ejercicio
  const [problemTimerValue, setProblemTimerValue] = useState(settings.timeValue); // Timer por problema
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue" | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false); // Esperando clic en "Continuar"
  const waitingRef = useRef(waitingForContinue); // Ref para usar en efectos sin dependencia

  const [blockAutoAdvance, setBlockAutoAdvance] = useState(false); // Bloquea auto-avance (ej: por modal)
  const [autoContinue, setAutoContinue] = useState(() => { // Auto-continuar al responder correcto
    try {
      const stored = localStorage.getItem('addition_autoContinue');
      return stored === 'true'; // True si 'true', false en cualquier otro caso (incluyendo null/undefined)
    } catch (e) { console.error('Error loading autoContinue from localStorage:', e); return false; }
  });

  // Estado para dificultad adaptativa
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel>(() => {
    try {
      const storedSettings = localStorage.getItem('moduleSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Usar la dificultad guardada si existe, de lo contrario usar la predeterminada del módulo
        if (parsedSettings.addition && parsedSettings.addition.difficulty) return parsedSettings.addition.difficulty as DifficultyLevel;
      }
    } catch (e) { console.error('Error loading adaptive difficulty from localStorage:', e); }
     // Fallback a la dificultad por defecto si no hay settings guardados o hay error
    return defaultModuleSettings.difficulty as DifficultyLevel;
  });
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveCorrectAnswers') || '0', 10));
  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveIncorrectAnswers') || '0', 10));

  const [currentAttempts, setCurrentAttempts] = useState(0); // Intentos para el problema actual

  // Estado para vista de problemas anteriores
  const [viewingPrevious, setViewingPrevious] = useState(false);
  // Índice del problema que estaba activo ANTES de empezar a ver problemas anteriores
  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState<number>(0);

  // Timers (usando window.setInterval/clearInterval para type safety con React refs)
  const generalTimerRef = useRef<number | null>(null);
  const singleProblemTimerRef = useRef<number | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para modals/animaciones
  const [showLevelUpReward, setShowLevelUpReward] = useState(false);


  // Hooks de contexto y utilidades
  const { saveExerciseResult } = useProgress();
  const { t } = useTranslations();
  const { setShowRewardAnimation } = useRewardsStore();

  // ==========================================
  // FUNCIONES DEL EJERCICIO
  // ==========================================
  
  // Generar un nuevo conjunto de problemas
  const generateNewProblemSet = useCallback(() => {
    const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
    console.log(`[ADDITION] Generating new problem set with difficulty: ${difficultyToUse}`);
    const newProblemsArray: AdditionProblem[] = [];
    for (let i = 0; i < settings.problemCount; i++) {
      newProblemsArray.push(generateAdditionProblem(difficultyToUse));
    }
    setProblemsList(newProblemsArray);
    setCurrentProblemIndex(0);
    setActualActiveProblemIndexBeforeViewingPrevious(0);
    setCurrentProblem(newProblemsArray[0]);

    setUserAnswersHistory(Array(newProblemsArray.length).fill(null));
    setTimer(0);
    setExerciseStarted(false);
    setExerciseCompleted(false);
    setFeedbackMessage(null);
    setWaitingForContinue(false); // Esto actualizará waitingRef.current
    setBlockAutoAdvance(false);
    setShowLevelUpReward(false);
    setViewingPrevious(false);
    setProblemTimerValue(settings.timeValue);
    setCurrentAttempts(0);
  }, [settings, adaptiveDifficulty]);
    
  // Callback para manejar el fin de tiempo por problema o agotar intentos
  const handleTimeOrAttemptsUp = useCallback(() => {
    console.log("[ADDITION] Time or Attempts Up triggered.");
    // No actuar si ya estamos en estado de espera o si no hay problema actual
    if (waitingRef.current || !currentProblem) {
      console.log("[ADDITION] handleTimeOrAttemptsUp ignored: waiting or no problem.");
      return;
    }

    // Incrementar los intentos para el problema actual
    const newAttempts = currentAttempts + 1;
    setCurrentAttempts(newAttempts);
    console.log(`[ADDITION] Attempt ${newAttempts}/${settings.maxAttempts} for problem ${currentProblemIndex + 1}`);

    const userAnswerString = digitAnswers.join(''); // La respuesta tal como está en las cajas
    const userNumericAnswer = parseFloat(userAnswerString) || null; // Convertir a número (null si vacío/NaN)

    // Determinar el estado basado en intentos vs maxAttempts
    const attemptsExhausted = settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts;
    const userAttemptWasMeaningful = digitAnswers.some(d => d && d.trim() !== ""); // Si el usuario llegó a escribir algo

    let finalStatus: UserAnswer['status'] = 'unanswered'; // Estado por defecto si no se escribió nada y tiempo/intentos se agotan
    if (userAttemptWasMeaningful) {
         // Si escribió algo, evaluamos si es correcto (aunque el tiempo se acabó)
         const isCorrect = checkAnswer(currentProblem, userNumericAnswer);
         if (isCorrect) {
             // Esto es un caso raro, tiempo/intentos se agotaron JUSTO cuando la respuesta era correcta.
             // checkCurrentAnswer maneja esto y pondría waitingForContinue true. Deberíamos llamarla.
             console.log("[ADDITION] Attempt has value, checking answer...");
             checkCurrentAnswer(); // checkCurrentAnswer gestionará feedback, history, waiting, etc.
             return; // checkCurrentAnswer ya se encarga del resto.
         } else {
             // Incorrecta, y tiempo/intentos se agotaron para este intento
             finalStatus = 'incorrect';
             setFeedbackMessage(t('exercises.incorrect')); // Mostrar feedback de intento fallido
             setFeedbackColor("red");
         }
    } else {
        // No escribió nada, tiempo agotado.
         finalStatus = 'timeout'; // O 'unanswered'
         setFeedbackMessage(t('exercises.timeUpNoAnswer'));
         setFeedbackColor("red");
         console.log("[ADDITION] Time Up, no answer.");
    }

    // Si se agotaron los intentos (después de incrementar)
    if (attemptsExhausted && finalStatus !== 'correct') {
       finalStatus = 'revealed'; // O 'incorrect' si prefieres no revelar. Aquí, revelamos.
       setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
       setFeedbackColor("blue");
    }

    // Actualizar historial con esta respuesta (ya sea por timeout o final)
    setUserAnswersHistory(prev => {
      const updatedHistory = [...prev];
      
      // Crear la entrada de historial para esta respuesta
      const historyEntry: UserAnswer = {
        problem: currentProblem,
        problemId: currentProblem.id,
        userAnswerString: userAnswerString,
        userAnswer: userNumericAnswer,
        isCorrect: false, // Ya sabemos que es incorrecta o tiempo agotado
        status: finalStatus,
        attemptsMade: newAttempts,
        timeSpentOnProblem: settings.timeValue - problemTimerValue // Cuánto tardó (relativo al límite)
      };
      
      updatedHistory[currentProblemIndex] = historyEntry;
      return updatedHistory;
    });

    // Si se agotaron los intentos o es timeout final, esperar "Continuar"
    if (attemptsExhausted) {
      setWaitingForContinue(true);
    }
    
  }, [currentAttempts, currentProblem, currentProblemIndex, digitAnswers, settings.maxAttempts, problemTimerValue, settings.timeValue, t]);
  
  // ==========================================
  // EFECTOS DEL EJERCICIO
  // ==========================================

  // Sincronizar ref con estado waitingForContinue
  useEffect(() => {
    waitingRef.current = waitingForContinue;
  }, [waitingForContinue]);

  // Generar conjunto de problemas al cargar o cambiar settings relevantes
  useEffect(() => {
    console.log("[ADDITION] Generating new problem set due to settings change or mount.");
    generateNewProblemSet();
  // Dependencias sensibles a cambios de settings que requieren regenerar problemas
  // adaptiveDifficulty también es dependencia si está habilitado, porque el nivel puede cambiar de forma reactiva
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.problemCount, settings.difficulty, settings.enableAdaptiveDifficulty, adaptiveDifficulty, generateNewProblemSet]);

  // Manejar cambio de dificultad por settings (ej: el usuario la cambia manualmente en settings)
  useEffect(() => {
    if (settings.enableAdaptiveDifficulty && settings.difficulty !== adaptiveDifficulty) {
      console.log(`[ADDITION] Adaptive difficulty mismatch: settings=${settings.difficulty}, adaptive=${adaptiveDifficulty}. Syncing adaptive.`);
      setAdaptiveDifficulty(settings.difficulty as DifficultyLevel);
      // Regenerar problemas inmediatamente cuando cambia el nivel
      generateNewProblemSet();
    }
  // Esta dependencia solo reacciona si la dificultad de settings cambia O si enableAdaptiveDifficulty cambia
  // y causa un desajuste con adaptiveDifficulty. No debe depender de adaptiveDifficulty directamente
  // para evitar bucles si adaptiveDifficulty cambia por rachas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.difficulty, settings.enableAdaptiveDifficulty, generateNewProblemSet]);


  // Inicializar estado del problema actual (respuestas, foco, timers, intentos) al cargar o avanzar
  useEffect(() => {
    if (currentProblem && !viewingPrevious && !exerciseCompleted) {
      const numBoxes = currentProblem.answerMaxDigits || 0;

      // Si estamos volviendo a un problema ACTIVO previamente visto (pero no completado/saltado)
      const isReturningToActiveProblem = currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious && userAnswersHistory[currentProblemIndex] !== null && userAnswersHistory[currentProblemIndex]?.status !== 'correct' && userAnswersHistory[currentProblemIndex]?.status !== 'revealed';

      if (!isReturningToActiveProblem) {
         // Si es un problema nuevo o uno que no se dejó a medias con intentos restantes
         setDigitAnswers(Array(numBoxes).fill(""));
         setCurrentAttempts(0); // Reset intentos para problema nuevo/reiniciado
         setProblemTimerValue(settings.timeValue); // Reset timer para problema nuevo/reiniciado
         setFeedbackMessage(null); // Limpiar feedback al cargar problema nuevo
         setWaitingForContinue(false); // Asegurar que no estamos esperando en un problema nuevo
      } else {
         // Si estamos volviendo al problema activo que se dejó a medias
         console.log(`[ADDITION] Returning to active problem index ${currentProblemIndex}. Restoring state.`);
         // Restablecer digitAnswers si se habían guardado (idealmente) o dejar los que estaban
         // Si no guardamos digitAnswers en historial, simplemente dejamos lo que estaba O limpiamos si no hay respuesta
         const histEntry = userAnswersHistory[currentProblemIndex];
         if (histEntry?.userAnswerString) {
             // Restaurar desde string si lo guardamos (preferible)
             const answerStr = histEntry.userAnswerString.replace('.', '');
             setDigitAnswers(Array(numBoxes).fill("").map((_, i) => answerStr[i] || ""));
         } else {
            // O limpiar si no había respuesta registrada
             if (histEntry?.userAnswer === null || isNaN(histEntry?.userAnswer as number)) {
                 setDigitAnswers(Array(numBoxes).fill(""));
             }
            // Si había respuesta incorrecta numérica pero no string, los digitAnswers actuales son los del intento anterior
         }

         // Restaurar intentos y timer desde el estado global si se maneja por problema
         // En este diseño, currentAttempts y problemTimerValue ya están asociados al currentProblemIndex
         // por la lógica de check/timeout/continue. Solo necesitamos asegurar que el timer se reinicia si no waiting.
         setProblemTimerValue(settings.timeValue); // Reiniciar timer para el nuevo intento
         // Feedback ya debería estar establecido por el intento anterior
         // waitingForContinue ya debería ser false si quedaron intentos
      }


      // Configurar referencias y foco para el nuevo problema
      boxRefsArrayRef.current = Array(numBoxes).fill(null);
      digitBoxRefs.current = boxRefsArrayRef.current; // Sincronizar la ref global

      if (currentProblem.layout === 'horizontal') {
        setInputDirection('ltr');
        setFocusedDigitIndex(0);
      } else {
        setInputDirection('rtl');
        setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null); // Foco en el último dígito para RTL/Vertical
      }

    } else if (viewingPrevious && currentProblem) {
      // Si estamos viendo un problema anterior/histórico, deshabilitar foco y entradas
      setFocusedDigitIndex(null);

      // Rellenar digitAnswers con la respuesta registrada en el historial
      const historyEntry = userAnswersHistory[currentProblemIndex];
       if (historyEntry && historyEntry.userAnswer !== null && !isNaN(historyEntry.userAnswer)) {
            const answerStr = String(historyEntry.userAnswer).replace('.', '');
            const numBoxes = currentProblem.answerMaxDigits || 0;
             setDigitAnswers(Array(numBoxes).fill("").map((_, i) => answerStr[i] || ""));
            // Mostrar feedback histórico
            setFeedbackMessage(
                historyEntry.isCorrect ?
                t('exercises.yourAnswerWasCorrect', { userAnswer: historyEntry.userAnswer }) :
                t('exercises.yourAnswerWasIncorrect', { userAnswer: (historyEntry.userAnswer === undefined || isNaN(historyEntry.userAnswer as number) ? t('common.notAnswered') : historyEntry.userAnswer), correctAnswer: currentProblem.correctAnswer })
            );
            setFeedbackColor(historyEntry.isCorrect ? "green" : "red");
       } else if (historyEntry?.status === 'revealed') {
           const numBoxes = currentProblem.answerMaxDigits || 0;
           const answerStr = String(currentProblem.correctAnswer).replace('.', '');
           setDigitAnswers(Array(numBoxes).fill("").map((_, i) => answerStr[i] || ""));
           setFeedbackMessage(t('exercises.correctAnswerWasRevealed', { correctAnswer: currentProblem.correctAnswer }));
           setFeedbackColor("blue");
       }
       else {
            // Si no hay respuesta en historial para este problema
            setDigitAnswers(Array(currentProblem.answerMaxDigits).fill(""));
            setFeedbackMessage(t('exercises.noAnswerRecordedForThisProblem'));
            setFeedbackColor("blue");
       }

    } else if (exerciseCompleted) {
      // Al completar, asegurar que no haya foco ni timers
      setFocusedDigitIndex(null);
       if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
       singleProblemTimerRef.current = null;
    }

  }, [currentProblem, viewingPrevious, exerciseCompleted, actualActiveProblemIndexBeforeViewingPrevious, problemsList, currentProblemIndex, userAnswersHistory, settings.timeValue, settings.maxAttempts, consecutiveIncorrectAnswers, t]); // Añadimos dependencies que podrían influir en la lógica de inicialización

  // Efecto para enfocar la caja de dígito activa cuando focusedDigitIndex cambia
  useEffect(() => {
    // Solo enfocar si no estamos viendo historial y no estamos esperando continuar
    if (focusedDigitIndex !== null && !viewingPrevious && !waitingRef.current && !exerciseCompleted && digitBoxRefs.current[focusedDigitIndex]) {
        // Usar un pequeño timeout para asegurar que el elemento esté renderizado y disponible
        const timeoutId = setTimeout(() => {
            try {
                const el = digitBoxRefs.current[focusedDigitIndex];
                if (el) {
                    el.focus();
                    // console.log("Enfocando elemento en índice:", focusedDigitIndex);
                } else {
                     // console.log("No se encontró elemento para enfocar en índice:", focusedDigitIndex);
                }
            } catch (err) {
                console.error("Error al intentar enfocar:", err);
            }
        }, 10); // Un timeout mínimo
         return () => clearTimeout(timeoutId); // Limpiar timeout si el componente se desmonta o el foco cambia de nuevo
    }
  }, [focusedDigitIndex, viewingPrevious, exerciseCompleted, waitingForContinue]); // Depende de focusedDigitIndex, viewingPrevious, exerciseCompleted, waitingForContinue (via ref)

  // Timer general del ejercicio
  useEffect(() => {
    if (exerciseStarted && !exerciseCompleted && !viewingPrevious) {
      // Asegurar que solo hay un timer general corriendo
      if (generalTimerRef.current) clearInterval(generalTimerRef.current);
      generalTimerRef.current = window.setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    // Limpiar timer al desmontar o completar/pausar
    return () => {
      if (generalTimerRef.current) clearInterval(generalTimerRef.current);
       generalTimerRef.current = null; // Reset ref
    };
  }, [exerciseStarted, exerciseCompleted, viewingPrevious]); // Depende del estado del ejercicio y si vemos historial


  // Timer por problema (si el límite de tiempo está habilitado)
  useEffect(() => {
    // Limpiar timer existente si hay uno
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
    singleProblemTimerRef.current = null; // Reset ref

    // Iniciar timer solo si:
    // 1. El ejercicio ha comenzado.
    // 2. El ejercicio NO ha terminado.
    // 3. Hay un problema actual.
    // 4. NO estamos viendo problemas anteriores.
    // 5. El límite de tiempo por problema es > 0.
    // 6. NO estamos esperando que el usuario haga clic en "Continuar".
    // 7. Aún quedan intentos (si maxAttempts > 0).
    const hasAttemptsLeft = settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts;

    if (exerciseStarted && !exerciseCompleted && currentProblem && !viewingPrevious && settings.timeValue > 0 && !waitingRef.current && hasAttemptsLeft) {

      singleProblemTimerRef.current = window.setInterval(() => {
        setProblemTimerValue(prevTimerValue => {
          if (prevTimerValue <= 1) {
            // Tiempo agotado para este intento
            if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
             singleProblemTimerRef.current = null; // Reset ref
            handleTimeOrAttemptsUp(); // Llamar a la función que maneja el fin de tiempo/intentos
            return 0;
          }
          return prevTimerValue - 1;
        });
      }, 1000);
    }

    // Limpiar timer al desmontar o cuando las condiciones de inicio dejan de cumplirse
    return () => {
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
      singleProblemTimerRef.current = null; // Reset ref
    };
  // Dependencias: estado del ejercicio, problema actual, vista historial, settings de tiempo/intentos, intentos actuales, estado de espera.
  // problemTimerValue NO debe ser dependencia aquí, ya que se actualiza dentro del intervalo.
  // waitingRef.current SÍ debe ser dependencia (o chequeada indirectamente si no se puede poner en deps)
  }, [exerciseStarted, exerciseCompleted, currentProblem, viewingPrevious, settings.timeValue, settings.maxAttempts, currentAttempts, waitingForContinue, handleTimeOrAttemptsUp]); // Añadido waitingForContinue explícitamente para asegurar que el efecto re-evalúa


  // Efectos para guardar estados persistentes en localStorage
  useEffect(() => { try { localStorage.setItem('addition_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString()); } catch (e) { console.error('Error saving consecutiveCorrectAnswers:', e); }}, [consecutiveCorrectAnswers]);
  useEffect(() => { try { localStorage.setItem('addition_consecutiveIncorrectAnswers', consecutiveIncorrectAnswers.toString()); } catch (e) { console.error('Error saving consecutiveIncorrectAnswers:', e); }}, [consecutiveIncorrectAnswers]);
  useEffect(() => { try { localStorage.setItem('addition_autoContinue', autoContinue.toString()); } catch (e) { console.error('Error saving autoContinue:', e); }}, [autoContinue]);

  // Guardar resultado del ejercicio al completarse
  useEffect(() => {
      if (exerciseCompleted && !viewingPrevious) {
          // Limpiar timers si aún están corriendo
          if (generalTimerRef.current) {
              clearInterval(generalTimerRef.current);
              generalTimerRef.current = null;
          }
          if (singleProblemTimerRef.current) {
               clearInterval(singleProblemTimerRef.current);
              singleProblemTimerRef.current = null;
          }
           if (autoContinueTimerRef.current) {
             clearTimeout(autoContinueTimerRef.current);
             autoContinueTimerRef.current = null;
           }


          // Calcular métricas finales
          const correctCount = userAnswersHistory.filter(a => a?.isCorrect).length;
          const totalProblems = problemsList.length;

          console.log("[ADDITION] Exercise Completed. Saving results.");
          // Guardar en el contexto de progreso
          saveExerciseResult({
              operationId: "addition", // Identificador único para suma
              date: new Date().toISOString(),
              score: correctCount,
              totalProblems: totalProblems,
              timeSpent: timer, // Tiempo total del ejercicio
              difficulty: (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) as string, // Dificultad final o configurada
          });
      }
  // Dependencias: estado de completado, vista historial (para guardar solo al completar la vista normal), historial, lista de problemas, timer, settings, adaptiveDifficulty, saveExerciseResult
  }, [exerciseCompleted, viewingPrevious, userAnswersHistory, problemsList, timer, settings.difficulty, settings.enableAdaptiveDifficulty, adaptiveDifficulty, saveExerciseResult]);

  // Callback para verificar la respuesta (accionado por botón o Enter)
  const checkCurrentAnswer = useCallback(() => {
      console.log("[ADDITION] Check Answer triggered.");
      // No hacer nada si ya estamos esperando "Continuar", ejercicio completado, o viendo historial
      if (waitingRef.current || exerciseCompleted || viewingPrevious || !currentProblem) {
           console.log("[ADDITION] Check Answer ignored: waiting, completed, viewing previous, or no problem.");
           return;
      }

      // Iniciar ejercicio al primer intento de check
      if (!exerciseStarted) {
          startExercise();
          // No retornamos, permitimos que el check continúe
      }

      let userAnswerString = digitAnswers.join('');
      const userNumericAnswer = parseFloat(userAnswerString);

      // Validación básica: si escribió algo pero no es un número válido
      if (isNaN(userNumericAnswer) && userAnswerString.trim() !== "") {
          setFeedbackMessage(t('exercises.invalidAnswer'));
          setFeedbackColor("red");
          // No incrementar intentos en este caso, es una entrada inválida
          console.log("[ADDITION] Invalid answer format.");
          return false; // No resuelto, no incrementa intento válido
      }

      // Incrementar intentos solo si la respuesta es numérica (válida o inválida)
      // Esto puede ser un punto de diseño. Podríamos solo contar intentos "serios" (numéricos).
      // Siguiendo la lógica anterior (handleTimeOrAttemptsUp) donde incrementamos si había *algo* escrito,
      // o si el tiempo se agota, parece que la intención es contar cualquier intento de "finalizar".
      // Vamos a incrementar aquí también si la entrada es numérica o vacía (lista para convertir a 0).
       const newAttempts = currentAttempts + 1;
       setCurrentAttempts(newAttempts);
       console.log(`[ADDITION] Attempt ${newAttempts}/${settings.maxAttempts} for problem ${currentProblemIndex + 1} via Check button.`);


      // Verificar si la respuesta numérica es correcta
      const isCorrect = checkAnswer(currentProblem, userNumericAnswer);

      // Preparar entrada del historial
      const problemIndexForHistory = currentProblemIndex;
      let historyEntry: UserAnswer = {
          problemId: currentProblem.id,
          problem: currentProblem,
          userAnswerString: userAnswerString, // Guardar el string exacto ingresado
          userAnswer: userNumericAnswer,
          isCorrect: isCorrect,
          status: isCorrect ? 'correct' : 'incorrect', // Estado inicial del intento
          attemptsMade: newAttempts,
          // timeSpentOnProblem: ...
      };

      // Actualizar historial
      setUserAnswersHistory(prev => {
          const newHistory = [...prev];
          newHistory[problemIndexForHistory] = historyEntry;
          return newHistory;
      });
       console.log(`[ADDITION] History updated for problem ${problemIndexForHistory}: Status = ${historyEntry.status}`);

      // Lógica post-verificación
      if (isCorrect) {
           console.log("[ADDITION] Answer Correct!");
          setFeedbackMessage(t('exercises.correct'));
          setFeedbackColor("green");
          // Manejar racha correcta y dificultad adaptativa
          const newConsecutive = consecutiveCorrectAnswers + 1;
          setConsecutiveCorrectAnswers(newConsecutive);
          setConsecutiveIncorrectAnswers(0); // Reset racha incorrecta

          // Lógica de subida de nivel si aplica
          if (settings.enableAdaptiveDifficulty && newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP) {
              const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
              const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
              if (currentLevelIdx < difficultiesOrder.length - 1) {
                  const newLevel = difficultiesOrder[currentLevelIdx + 1];
                   console.log(`[ADDITION] Level Up! From ${adaptiveDifficulty} to ${newLevel}. Racha: ${newConsecutive}`);
                  setAdaptiveDifficulty(newLevel); // Actualizar dificultad adaptativa
                   // Guardar la nueva dificultad en settings persistente inmediatamente
                   updateModuleSettings("addition", { ...settings, difficulty: newLevel, enableAdaptiveDifficulty: true });

                  setConsecutiveCorrectAnswers(0); // Reset racha correcta para el nuevo nivel
                   // Mostrar modal/animación de subida de nivel
                  setShowLevelUpReward(true);
                  setBlockAutoAdvance(true); // Bloquear auto-avance hasta que se cierre el modal
                   // Emitir evento de subida de nivel para otros componentes (ej: handler de estadísticas)
                  eventBus.emit('levelUp', { previousLevel: adaptiveDifficulty, newLevel, consecutiveCorrectAnswers: newConsecutive });
              } else {
                   console.log("[ADDITION] Max level reached.");
              }
          }

          // Lógica de recompensas aleatorias (si está activada)
          if (settings.enableRewards) {
               // Definir contexto para calcular probabilidad
              const rewardContext = {
                  streak: newConsecutive, // Racha actual de correctas
                  difficulty: adaptiveDifficulty, // Nivel de dificultad adaptativa
                  problemIndex: currentProblemIndex, // Índice del problema actual
                  totalProblems: problemsList.length, // Total de problemas en el set
                  isCorrect: true, // Indica que la respuesta fue correcta
                  attempts: newAttempts // Número de intentos realizados en este problema
              };
              // Si la probabilidad aleatoria se cumple, otorgar recompensa y mostrar animación
              if (Math.random() < getRewardProbability(rewardContext as any)) { // Casting a any si RewardContext no coincide exactamente
                  console.log("[ADDITION] Awarding random reward.");
                   // awardReward('addition_correct_problem' as any, { module: 'addition', context: rewardContext }); // Pasar contexto si la función lo acepta
                  setShowRewardAnimation(true); // Activar animación de recompensa global
              }
          }


          // Detener timer del problema actual si estaba corriendo
          if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
           singleProblemTimerRef.current = null;

          // Poner en estado de espera "Continuar"
          setWaitingForContinue(true); // Esto actualizará waitingRef.current via effect

          // Si auto-continuar está activado y no estamos bloqueados (por level-up modal, etc.)
          if (autoContinue && !blockAutoAdvance) {
              console.log("[ADDITION] Auto-Continue enabled, setting timeout.");
               // Cancelar cualquier timeout previo de auto-continuar
              if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
              // Configurar timeout para llamar a handleContinue después de un breve retraso
              autoContinueTimerRef.current = setTimeout(() => {
                  // Re-verificar que todavía estamos en estado de espera y no bloqueados antes de continuar
                  if (waitingRef.current && !blockAutoAdvance) {
                      console.log("[ADDITION] Auto-Continuing...");
                      handleContinue(); // Llamar a la función para avanzar al siguiente problema
                  }
                   autoContinueTimerRef.current = null; // Limpiar la ref del timeout
              }, 3000); // Esperar 3 segundos antes de auto-avanzar
          }


          return true; // Indicar que el problema fue "resuelto" (correctamente)

      } else { // Respuesta Incorrecta
           console.log("[ADDITION] Answer Incorrect.");
          setFeedbackMessage(t('exercises.incorrect'));
          setFeedbackColor("red");
          // Manejar racha incorrecta y dificultad adaptativa
          const newConsecutiveInc = consecutiveIncorrectAnswers + 1;
          setConsecutiveIncorrectAnswers(newConsecutiveInc);
          setConsecutiveCorrectAnswers(0); // Reset racha correcta

          // Lógica de bajada de nivel si aplica
           // Solo bajar nivel si se han acumulado suficientes respuestas incorrectas consecutivas (ej. 5)
           // y la dificultad actual no es la más baja ("beginner")
          if (settings.enableAdaptiveDifficulty && newConsecutiveInc >= 5) { // Usar un umbral para bajar
              const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
              const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
              if (currentLevelIdx > 0) { // No bajar si ya estamos en "beginner" (índice 0)
                  const newLevel = difficultiesOrder[currentLevelIdx - 1];
                   console.log(`[ADDITION] Level Down. From ${adaptiveDifficulty} to ${newLevel}. Racha Incorrecta: ${newConsecutiveInc}`);
                  setAdaptiveDifficulty(newLevel); // Actualizar dificultad adaptativa
                   // Guardar la nueva dificultad en settings persistente inmediatamente
                  updateModuleSettings("addition", { ...settings, difficulty: newLevel, enableAdaptiveDifficulty: true });

                  setConsecutiveIncorrectAnswers(0); // Reset racha incorrecta para el nuevo nivel
                   // Añadir mensaje de nivel bajado al feedback
                   setFeedbackMessage(`${t('adaptiveDifficulty.levelDecreased', { level: t(newLevel) })}. ${t('exercises.incorrect')}`);
              } else {
                   console.log("[ADDITION] Already at minimum level.");
              }
          }

          // Lógica de intentos máximos
          // Si se agotan los intentos después de este (newAttempts >= settings.maxAttempts)
          if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
              console.log(`[ADDITION] Max attempts reached (${newAttempts}/${settings.maxAttempts}). Revealing answer.`);
              // Actualizar el estado del historial a 'revealed' ya que se mostrará la respuesta correcta
              setUserAnswersHistory(prev => {
                  const updatedHistory = [...prev];
                  if (updatedHistory[problemIndexForHistory]) {
                       updatedHistory[problemIndexForHistory].status = 'revealed'; // Marcar como revelada
                       updatedHistory[problemIndexForHistory].attemptsMade = newAttempts; // Asegurar que los intentos se reflejan
                  }
                  return updatedHistory;
              });

              // Mostrar la respuesta correcta como parte del feedback final
              setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
              setFeedbackColor("blue"); // O algún color que indique revelación

               // Detener timer del problema si estaba corriendo
              if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
              singleProblemTimerRef.current = null;

              // Poner en estado de espera "Continuar"
              setWaitingForContinue(true); // Esto actualizará waitingRef.current via effect

              return true; // Indicar que el problema fue "resuelto" (aunque incorrecto, no hay más intentos)
          } else {
              // Quedan intentos: no poner en estado de espera "Continuar", permitir reintentar
              console.log(`[ADDITION] Attempts remaining (${newAttempts}/${settings.maxAttempts}). Allow retry.`);
              // Limpiar las cajas para el siguiente intento (opcional, depende del diseño)
              // setDigitAnswers(Array(currentProblem.answerMaxDigits).fill("")); // Decidimos no limpiar por defecto

              // El timer por problema se reiniciará automáticamente gracias al useEffect
              // porque waitingForContinue sigue siendo false.
              return false; // Indicar que el problema NO fue resuelto (quedan intentos)
          }
      }
  // Dependencias: currentProblem, digitAnswers, currentAttempts, settings, t, consecutiveCorrectAnswers, consecutiveIncorrectAnswers, adaptiveDifficulty, problemsList.length, autoContinue, blockAutoAdvance, updateModuleSettings, eventBus, getRewardProbability, awardReward, setShowRewardAnimation, setWaitingForContinue, setCurrentAttempts, setConsecutiveCorrectAnswers, setConsecutiveIncorrectAnswers, setAdaptiveDifficulty
  // Las funciones setter de estado y funciones de contexto/hooks (como t, updateModuleSettings, saveExerciseResult, etc.) suelen ser estables y no necesitan ser dependencias a menos que se usen en useCallback o useMemo
  // checkAnswer y userAnswersHistory sí deben ser dependencias si se usan directamente (checkAnswer sí, userAnswersHistory se usa con setter)
  }, [currentProblem, digitAnswers, currentAttempts, settings, t, consecutiveCorrectAnswers, consecutiveIncorrectAnswers, adaptiveDifficulty, problemsList.length, autoContinue, blockAutoAdvance, updateModuleSettings, eventBus, getRewardProbability, awardReward, setShowRewardAnimation, checkAnswer, userAnswersHistory]); // Simplificado deps asumiendo estabilidad de setters/hooks


  // Callback para avanzar al siguiente problema activo o completar ejercicio
  const advanceToNextActiveProblem = useCallback(() => {
      console.log("[ADDITION] Advancing to next active problem.");
      // Determinar el siguiente índice. Si hay compensación habilitada y el último problema fue incorrecto/revelado,
      // podríamos añadir un problema al final en lugar de simplemente avanzar.
      // Esta lógica de compensación es más compleja y podría requerir añadir el problema a problemsList.
      // Por ahora, sigamos la lógica simple de avanzar. La compensación podría manejarse en la generación inicial
      // o en el análisis post-ejercicio si es para futuros sets.
      // Asumimos que 'enableCompensation' significa añadir problemas *después* de que el set actual termine,
      // o modificar el tamaño del set basado en resultados pasados (lo cual es más avanzado).
      // Si 'enableCompensation' significa añadir un problema *al set actual* inmediatamente después de uno incorrecto/revelado,
      // la lógica de `checkCurrentAnswer` necesitaría modificar `problemsList`. Esto puede complicar los índices.
      // Mantengamos la compensación simple por ahora: afecta la generación de futuros sets, no el actual.

      const nextActiveIdx = actualActiveProblemIndexBeforeViewingPrevious + 1;

      if (nextActiveIdx < problemsList.length) {
           console.log(`[ADDITION] Moving to problem index ${nextActiveIdx + 1}`);
          setCurrentProblemIndex(nextActiveIdx); // Siguiente en la lista general
          setCurrentProblem(problemsList[nextActiveIdx]); // Cargar el problema
          setActualActiveProblemIndexBeforeViewingPrevious(nextActiveIdx); // Este es ahora el problema activo
          setDigitAnswers(Array(problemsList[nextActiveIdx].answerMaxDigits).fill("")); // Limpiar cajas para nuevo problema
          setCurrentAttempts(0); // Resetear intentos para el nuevo problema
          setProblemTimerValue(settings.timeValue); // Resetear timer para el nuevo problema
          setFeedbackMessage(null); // Limpiar feedback
          setFeedbackColor(null);
          setWaitingForContinue(false); // Permitir que el nuevo problema inicie su flujo (timers, input)
           // El useEffect del timer por problema se activará porque waitingForContinue es false

      } else {
           console.log("[ADDITION] End of problems list. Completing exercise.");
          completeExercise(); // No hay más problemas, completar ejercicio
      }
  }, [actualActiveProblemIndexBeforeViewingPrevious, problemsList, settings.timeValue]); // settings.enableCompensation, settings.problemCount no son deps directas de *avanzar*


  // Callback para manejar el clic en "Continuar"
  const handleContinue = useCallback(() => {
      console.log("[ADDITION] Continue button clicked.");
      // Solo actuar si estamos en estado de espera
      if (!waitingRef.current || !currentProblem) {
           console.log("[ADDITION] handleContinue ignored: not waiting or no problem.");
          return;
      }

      // Si se acaba de subir de nivel, primero manejar eso
      if (showLevelUpReward) {
          console.log("[ADDITION] Handling post-level-up continue.");
          // Cerrar el modal/animación de level up
          setShowLevelUpReward(false);
          // Desbloquear auto-avance si estaba bloqueado por el modal
          setBlockAutoAdvance(false);

          // Regenerar el problema ACTUAL con la NUEVA dificultad adaptativa
          // Esto permite al usuario intentar un problema del nuevo nivel inmediatamente.
          const newProblemForLevelUp = generateAdditionProblem(adaptiveDifficulty);
          const updatedProblemsList = [...problemsList];
          // Reemplazar el problema en el índice actual (que acaba de ser respondido correctamente para subir de nivel)
          updatedProblemsList[actualActiveProblemIndexBeforeViewingPrevious] = newProblemForLevelUp;

           console.log(`[ADDITION] Regenerating problem index ${actualActiveProblemIndexBeforeViewingPrevious} with new adaptive difficulty: ${adaptiveDifficulty}`);
          setProblemsList(updatedProblemsList); // Actualizar la lista
          setCurrentProblem(newProblemForLevelUp); // Cargar el nuevo problema regenerado
          // currentProblemIndex y actualActiveProblemIndexBeforeViewingPrevious ya apuntan al lugar correcto

          // Resetear estado para el nuevo problema en el mismo índice
          setDigitAnswers(Array(newProblemForLevelUp.answerMaxDigits).fill("")); // Limpiar cajas
          setCurrentAttempts(0); // Reset intentos
          setProblemTimerValue(settings.timeValue); // Reset timer
          setFeedbackMessage(null); // Limpiar feedback
          setFeedbackColor(null);
          setWaitingForContinue(false); // Permitir que el nuevo problema inicie su flujo
          // El useEffect del timer por problema se activará

          return; // Terminar la ejecución aquí después de manejar el level up
      }

      // Si no hubo level up (o ya se manejó), simplemente avanzar al siguiente problema activo
      if (!blockAutoAdvance) { // Asegurar que no estamos bloqueados por otra razón
           console.log("[ADDITION] No level up or already handled. Advancing to next active problem.");
          advanceToNextActiveProblem();
      } else {
           console.log("[ADDITION] Blocked from advancing automatically.");
           // Si estamos bloqueados (ej: por un modal de recompensa no de level up),
           // simplemente salimos del estado de espera, pero no avanzamos.
           setWaitingForContinue(false);
           // El timer del problema (si timeValue > 0) se reiniciará automáticamente al salir del estado de espera.
      }

  }, [showLevelUpReward, adaptiveDifficulty, problemsList, actualActiveProblemIndexBeforeViewingPrevious, blockAutoAdvance, advanceToNextActiveProblem, settings.timeValue, setProblemsList, setCurrentProblem, setDigitAnswers, setCurrentAttempts, setProblemTimerValue, setFeedbackMessage, setFeedbackColor, setWaitingForContinue, setShowLevelUpReward, setBlockAutoAdvance, generateAdditionProblem]); // Añadido generateAdditionProblem como dependencia


  // Iniciar el ejercicio (llamado al primer check o input)
  const startExercise = () => {
    if (exerciseStarted || exerciseCompleted || !currentProblem) return;
    console.log("[ADDITION] Exercise Started.");
    setExerciseStarted(true);
    // El useEffect del timer general se activará ahora
    // El useEffect del timer por problema se activará ahora (si timeValue > 0)
  };

  // Reiniciar todo el ejercicio
  const restartExercise = () => {
      console.log("[ADDITION] Restarting exercise.");
      // Limpiar todos los timers
      if (generalTimerRef.current) clearInterval(generalTimerRef.current);
      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);

      // Resetear estados relevantes
      setTimer(0);
      setExerciseStarted(false);
      setExerciseCompleted(false);
      setUserAnswersHistory([]); // Limpiar historial completo
      setConsecutiveCorrectAnswers(0); // Resetear rachas al reiniciar
      setConsecutiveIncorrectAnswers(0);

      // Generar un nuevo set de problemas (usará la dificultad actual de settings/adaptive)
      generateNewProblemSet();

      // Asegurar que no haya modales activos
      setShowLevelUpReward(false);
      setBlockAutoAdvance(false);

      // Resetear autoContinue state based on localStorage on restart if needed, or keep current state
      // Let's keep current state, user can toggle it.
  };

  // Navegar a problemas anteriores (para revisión)
  const handleViewPrevious = () => {
      console.log("[ADDITION] Viewing Previous Problem.");
      // No permitir si ya estamos en el primer problema o si el ejercicio ha terminado
      if (currentProblemIndex === 0 || exerciseCompleted) return;

      // Si no estamos ya en modo "viendo anteriores", guardar el índice del problema activo
      if (!viewingPrevious) {
          setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
           console.log(`[ADDITION] Saved active problem index: ${currentProblemIndex}`);
      }

      // Entrar en modo "viendo anteriores"
      setViewingPrevious(true);
      // Detener el timer del problema activo si estaba corriendo
       if (singleProblemTimerRef.current) {
           clearInterval(singleProblemTimerRefRef.current);
           singleProblemTimerRef.current = null;
       }
      // No detener el timer general (el useEffect lo manejará al cambiar viewingPrevious)

      // Calcular el índice del problema anterior a ver
      const prevIndexToView = currentProblemIndex - 1;
      if (prevIndexToView < 0) return; // Salvaguarda

       console.log(`[ADDITION] Navigating to view problem index ${prevIndexToView}.`);

      // Cargar el problema anterior
      setCurrentProblemIndex(prevIndexToView);
      setCurrentProblem(problemsList[prevIndexToView]);

      // El useEffect que depende de currentProblemIndex y viewingPrevious se encargará de:
      // - Deshabilitar el input de respuesta
      // - Cargar la respuesta y feedback del historial para ese problema
  };

  // Navegar al siguiente problema en el historial (o volver al activo)
  const handleViewNext = () => {
      console.log("[ADDITION] Viewing Next Problem.");
      // Solo permitir si estamos viendo problemas anteriores
      if (!viewingPrevious || exerciseCompleted) return;

      // Si el siguiente problema en el historial es el problema que estaba activo originalmente
      if (currentProblemIndex + 1 === actualActiveProblemIndexBeforeViewingPrevious) {
           console.log("[ADDITION] Reached active problem index. Returning to active mode.");
          returnToActiveProblem(); // Llamar a la función que sale del modo vista previa
      } else if (currentProblemIndex < problemsList.length -1) {
          // Si hay más problemas en el historial para ver (pero no es el activo)
           console.log(`[ADDITION] Navigating to view problem index ${currentProblemIndex + 1}.`);
          setCurrentProblemIndex(prev => prev + 1);
          setCurrentProblem(problemsList[currentProblemIndex + 1]);
          // El useEffect se encargará de cargar historial y feedback
      }
      // Si currentProblemIndex + 1 es >= problemsList.length (lo cual no debería pasar si actualActiveProblemIndexBeforeViewingPrevious es < problemsList.length)
      // o si ya estamos en actualActiveProblemIndexBeforeViewingPrevious, no hacemos nada más.
  };

  // Volver al problema que estaba activo antes de empezar a ver el historial
  const returnToActiveProblem = useCallback(() => {
      console.log("[ADDITION] Returning to Active Problem.");
      // Desactivar modo vista previa
      setViewingPrevious(false);

      // Restaurar el índice y el problema que estaba activo
      const activeIndex = actualActiveProblemIndexBeforeViewingPrevious;
       console.log(`[ADDITION] Restoring problem index: ${activeIndex}.`);
      setCurrentProblemIndex(activeIndex);
      const activeProblem = problemsList[activeIndex]; // Obtener el problema activo de la lista
      setCurrentProblem(activeProblem);

      // Restaurar el estado de input, feedback, intentos y timer para este problema activo
      const activeProblemHistory = userAnswersHistory[activeIndex];

      if (activeProblemHistory) {
          console.log(`[ADDITION] Restoring state for active problem ${activeIndex} from history: Status = ${activeProblemHistory.status}`);
          // Restaurar digitAnswers
           const numBoxes = activeProblem.answerMaxDigits || 0;
           if (activeProblemHistory.userAnswerString) {
               const answerStr = activeProblemHistory.userAnswerString.replace('.', '');
                setDigitAnswers(Array(numBoxes).fill("").map((_, i) => answerStr[i] || ""));
           } else {
               // Si no se guardó el string, limpiar si no hay respuesta numérica válida
               if (activeProblemHistory.userAnswer === null || isNaN(activeProblemHistory.userAnswer as number)) {
                    setDigitAnswers(Array(numBoxes).fill(""));
               } else {
                   // Si hay respuesta numérica pero no string, intentar rellenar las cajas con esa.
                   // Esto puede ser imperfecto para decimales/alineación, pero es mejor que nada.
                   const answerStr = String(activeProblemHistory.userAnswer).replace('.', '');
                    setDigitAnswers(Array(numBoxes).fill("").map((_, i) => answerStr[i] || ""));
               }
           }


          // Restaurar feedback y estado de espera
          if (activeProblemHistory.status === 'correct') {
               console.log("[ADDITION] Active problem was correct, setting waitingForContinue(true)");
              setFeedbackMessage(t('exercises.correct'));
              setFeedbackColor("green");
              setWaitingForContinue(true); // Estaba esperando "Continuar"
          } else if (activeProblemHistory.status === 'revealed' || (activeProblemHistory.status === 'incorrect' && activeProblemHistory.attemptsMade >= settings.maxAttempts && settings.maxAttempts > 0)) {
               console.log("[ADDITION] Active problem was revealed or incorrect with attempts exhausted, setting waitingForContinue(true)");
              setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: activeProblem.correctAnswer }));
              setFeedbackColor("blue"); // Color para respuesta revelada/final
              setWaitingForContinue(true); // Estaba esperando "Continuar"
          } else { // 'incorrect', 'timeout', 'unanswered', o primer intento
               console.log("[ADDITION] Active problem status allows reattempt, setting waitingForContinue(false)");
              // Si no fue resuelto o revelado, está listo para otro intento.
              // Mostrar feedback del último intento si hubo uno.
              if (activeProblemHistory.attemptsMade > 0) {
                   setFeedbackMessage(t('exercises.yourPreviousAnswerWas', { userAnswer: (activeProblemHistory.userAnswer === null || isNaN(activeProblemHistory.userAnswer as number) ? t('common.notAnswered') : activeProblemHistory.userAnswer) }));
                   setFeedbackColor("red");
              } else {
                   // Si no hubo intentos, limpiar feedback
                  setFeedbackMessage(null);
                  setFeedbackColor(null);
              }
              setWaitingForContinue(false); // Permitir un nuevo intento
               // Restaurar intentos para el problema activo
              setCurrentAttempts(activeProblemHistory.attemptsMade);
               // Resetear timer para el nuevo intento (si aplica)
              setProblemTimerValue(settings.timeValue);
              // El useEffect del timer se activará porque waitingForContinue es false
          }
      } else {
          console.log("[ADDITION] Active problem has no history entry. Initializing state.");
          // Problema activo aún no intentado
          setDigitAnswers(Array(activeProblem.answerMaxDigits).fill("")); // Limpiar cajas
          setCurrentAttempts(0); // Reset intentos
          setProblemTimerValue(settings.timeValue); // Reset timer
          setFeedbackMessage(null); // Limpiar feedback
          setFeedbackColor(null);
          setWaitingForContinue(false); // Permitir primer intento
           // El useEffect del timer se activará
      }
       // Asegurar que el foco se restaura correctamente al salir de viewingPrevious
       // El useEffect que depende de viewingPrevious y focusedDigitIndex se encargará de esto
       // una vez que viewingPrevious cambie a false y focusedDigitIndex se setee
       if (activeProblem?.layout === 'horizontal') {
         setFocusedDigitIndex(0);
       } else if (activeProblem?.answerMaxDigits > 0) {
         setFocusedDigitIndex(activeProblem.answerMaxDigits - 1);
       } else {
         setFocusedDigitIndex(null);
       }


  }, [actualActiveProblemIndexBeforeViewingPrevious, problemsList, userAnswersHistory, settings.maxAttempts, settings.timeValue, t]); // Depende de history y settings para restaurar el estado


  // Manejar la entrada de dígitos virtuales (clics en botones numéricos)
  const handleDigitInput = (value: string) => {
      // No permitir entrada si estamos viendo historial, esperando continuar, ejercicio completado, o no hay problema actual
      if (viewingPrevious || waitingRef.current || exerciseCompleted || !currentProblem || focusedDigitIndex === null) return;

      // Iniciar ejercicio al primer input numérico
      if (!exerciseStarted) startExercise();

      let newAnswers = [...digitAnswers];
      let currentFocus = focusedDigitIndex;
      const maxDigits = currentProblem.answerMaxDigits;

      if (value === "backspace") {
          // Si la caja actual no está vacía, solo borramos el contenido
          if (newAnswers[currentFocus] !== "") {
               newAnswers[currentFocus] = "";
          } else {
              // Si la caja actual está vacía, moverse a la caja anterior y borrar su contenido (simulando Backspace real)
              // Depende de la dirección de input
              if (inputDirection === 'ltr' && currentFocus > 0) {
                   setFocusedDigitIndex(currentFocus - 1);
                   newAnswers[currentFocus - 1] = "";
              } else if (inputDirection === 'rtl' && currentFocus < maxDigits - 1) {
                   setFocusedDigitIndex(currentFocus + 1);
                   newAnswers[currentFocus + 1] = "";
              }
          }
           setDigitAnswers(newAnswers);

      } else if (/[0-9]/.test(value)) {
          // Si es un dígito, colocarlo en la caja actual
          newAnswers[currentFocus] = value;
           setDigitAnswers(newAnswers);

          // Mover el foco a la siguiente caja según la dirección de input
          if (inputDirection === 'rtl') {
              if (currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
              // Si estamos en la primera caja (index 0) en RTL, no mover foco.
          } else { // ltr
              if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1);
              // Si estamos en la última caja (index maxDigits-1) en LTR, no mover foco.
          }
      }
      // Otros caracteres (como punto decimal virtual) podrían manejarse aquí si fuera necesario,
      // pero el input se gestiona dígito a dígito.
  };

  // Manejar clics directos en las cajas de dígitos
   const handleDigitBoxClick = (index: number) => {
       // No permitir clic si estamos viendo historial, esperando continuar, ejercicio completado
       if (viewingPrevious || waitingRef.current || exerciseCompleted) return;

       // Si el ejercicio no ha comenzado, iniciarlo
       if (!exerciseStarted) startExercise();

       // Establecer el foco en la caja clicada
       setFocusedDigitIndex(index);

       // Determinar la dirección de input basada en la mitad de las cajas o layout vertical (generalmente RTL)
       const numBoxes = currentProblem?.answerMaxDigits || 0;
       const decimalOffset = currentProblem?.answerDecimalPosition || 0;
       const integerBoxCount = numBoxes - decimalOffset;

        if (currentProblem?.layout === 'vertical' || decimalOffset > 0) {
            setInputDirection('rtl'); // La entrada vertical y decimales suelen ser RTL
        } else { // Horizontal sin decimales es LTR
             setInputDirection('ltr');
        }

       // La lógica de enfocar el DOM se maneja en el useEffect separado basado en focusedDigitIndex
   };

  // Manejar entrada de teclado físico globalmente
  useEffect(() => {
    const handlePhysicalKeyDown = (event: KeyboardEvent) => {
      // Si estamos en modo vista previa, ejercicio completado, esperando continuar,
      // o no hay problema actual, o un modal está abierto (showLevelUpReward), ignorar la entrada del teclado físico.
      if (viewingPrevious || exerciseCompleted || waitingRef.current || !currentProblem || showLevelUpReward) {
        return; // Permitir que eventos como Tab funcionen normalmente
      }

      const key = event.key;
      const maxDigits = currentProblem.answerMaxDigits;

      // Si una caja de dígito está enfocada
      if (focusedDigitIndex !== null) {
           if (key >= '0' && key <= '9') {
               event.preventDefault(); // Prevenir el comportamiento por defecto (ej. escribir en un input nativo si existiera)
               // Iniciar ejercicio al primer input numérico
               if (!exerciseStarted) startExercise();

               setDigitAnswers(prev => {
                   const updated = [...prev];
                   updated[focusedDigitIndex] = key;
                   return updated;
               });

               // Mover foco
               if (inputDirection === 'rtl') {
                   if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
               } else { // ltr
                   if (focusedDigitIndex < maxDigits - 1) setFocusedDigitIndex(focusedDigitIndex + 1);
               }
           } else if (key === 'Backspace') {
               event.preventDefault(); // Prevenir backspace por defecto

                setDigitAnswers(prev => {
                   const updated = [...prev];
                   // Si la caja actual tiene contenido, bórralo y quédate ahí
                   if (updated[focusedDigitIndex] !== "") {
                        updated[focusedDigitIndex] = "";
                        return updated;
                   } else {
                       // Si la caja actual está vacía, muévete a la anterior y bórrala
                       if (inputDirection === 'ltr' && focusedDigitIndex > 0) {
                           setFocusedDigitIndex(focusedDigitIndex - 1);
                           updated[focusedDigitIndex - 1] = "";
                       } else if (inputDirection === 'rtl' && focusedDigitIndex < maxDigits - 1) {
                            // En RTL, Backspace se siente más natural moviéndose a la derecha para borrar el dígito *anterior* (el que acaba de escribir)
                            // o simplemente borrar el actual si ya estaba ahí.
                            // Sigamos la lógica del teclado virtual: si current vacía, ir a la siguiente (anterior en orden visual RTL) y borrar.
                            setFocusedDigitIndex(focusedDigitIndex + 1);
                            updated[focusedDigitIndex + 1] = "";
                       }
                       // Si ya estamos en el borde (index 0 en LTR, index max-1 en RTL) y la caja está vacía, no hacer nada.
                       return updated; // Retornar el estado sin cambios si no se pudo borrar
                   }
               });

           } else if (key === 'ArrowLeft') {
               event.preventDefault();
               if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
           } else if (key === 'ArrowRight') {
               event.preventDefault();
               if (focusedDigitIndex < maxDigits - 1) setFocusedDigitIndex(focusedDigitIndex + 1);
           } else if (key === 'Enter') {
               event.preventDefault();
               checkCurrentAnswer(); // checkCurrentAnswer es useCallback
           } else if (key === '.') {
               // Si hay decimales permitidos y no estamos en modo vertical "paso a paso"
               // Esta lógica es más compleja para implementar input directo del punto.
               // Por ahora, dejemos que el usuario lo salte con flechas si está en el lugar correcto.
               // Si queremos input directo del punto, necesitamos lógica para insertarlo en el string y saltar.
               // Por simplicidad, y dado que las cajas gestionan dígitos, no añadimos el punto con teclado físico aquí.
               // El usuario debe usar los botones virtuales si se implementan, o simplemente teclear los dígitos.
               // Podríamos añadir un `if (index === positionBeforeDecimal)` y `setFocusedDigitIndex(index + 1)`
               // para saltar el punto si se presiona '.' en la caja correcta.
               const decimalPosFromRight = currentProblem.answerDecimalPosition;
               const totalBoxes = currentProblem.answerMaxDigits;
               const decimalBoxIndex = totalBoxes - (decimalPosFromRight || 0); // Índice de la caja *antes* del punto

               if (decimalPosFromRight !== undefined && decimalPosFromRight > 0 && focusedDigitIndex === decimalBoxIndex -1) {
                    event.preventDefault(); // Prevenir cualquier comportamiento por defecto del punto
                    // Mover el foco a la caja DESPUÉS del punto
                    setFocusedDigitIndex(decimalBoxIndex);
               }
           }
      }
    };
    document.addEventListener('keydown', handlePhysicalKeyDown);
    return () => document.removeEventListener('keydown', handlePhysicalKeyDown);
  // Dependencias del efecto: currentProblem, focusedDigitIndex, digitAnswers, inputDirection, viewingPrevious, exerciseCompleted, waitingRef.current, showLevelUpReward, checkCurrentAnswer, startExercise
  // Las setters y callbacks estables pueden omitirse, pero las variables de estado y refs que influyen en la lógica del handler deben estar.
  }, [currentProblem, focusedDigitIndex, digitAnswers, inputDirection, viewingPrevious, exerciseCompleted, waitingForContinue, showLevelUpReward, checkCurrentAnswer, startExercise]); // Añadido showLevelUpReward como dependencia


  // ==========================================
  // RENDERING DEL EJERCICIO
  // ==========================================

  // Renderizado del problema en formato horizontal
  const renderHorizontalProblem = useMemo(() => {
    if (!currentProblem) return null;
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center text-2xl sm:text-3xl font-bold space-x-2 sm:space-x-3 flex-wrap">
          {currentProblem.operands.map((op, index) => (
            <React.Fragment key={index}>
              <span>{op}</span>
              {index < currentProblem.operands.length - 1 && (
                <span className="text-gray-600 mx-1 sm:mx-1.5">+</span>
              )}
            </React.Fragment>
          ))}
          <span className="text-gray-600 mx-1 sm:mx-1.5">=</span>
        </div>
      </div>
    );
  }, [currentProblem]); // Regenerar solo si currentProblem cambia

  // Renderizado del problema en formato vertical
  const renderVerticalProblem = useMemo(() => {
    if (!currentProblem) return null;
    const { maxIntLength, maxDecLength, operandsFormatted } = getVerticalAlignmentInfo(
      currentProblem.operands,
      currentProblem.answerDecimalPosition
    );

    return (
      <div className="py-4 flex justify-center">
        <div className="flex flex-col items-end">
          {operandsFormatted.map((op, idx) => (
            <div key={idx} className="flex items-center mb-1">
              {/* El signo más solo aparece antes del segundo operando en adelante */}
              {idx === 0 ? <span className={plusSignVerticalStyle} style={{opacity:0}}>+</span> : <span className={plusSignVerticalStyle}>+</span>}
              <span className={verticalOperandStyle}>
                {op.intStr}
                {maxDecLength > 0 && (
                  <>
                    <span className="text-gray-600">.</span>
                    {op.decStr}
                  </>
                )}
              </span>
            </div>
          ))}
          {/* La línea de suma se extiende según el ancho calculado */}
          <div
            className={sumLineStyle}
             style={{ width: `${Math.max(6, sumLineTotalCharWidth * 0.7)}em`, marginRight: `${(maxDecLength > 0 ? 0.4 : 0)}em` }} // Ajuste de margen para alinear bajo decimales si existen
           />
        </div>
      </div>
    );
  }, [currentProblem]); // Regenerar solo si currentProblem cambia

  // Renderizado de las cajas de entrada de respuesta
  const renderDigitAnswerBoxes = useMemo(() => {
    if (!currentProblem) return null;
    const decimalPositionFromRight = currentProblem.answerDecimalPosition; // Ej: 2 para XX.YY
    const totalBoxes = currentProblem.answerMaxDigits; // Ej: 4 para XX.YY
    const integerBoxesCount = totalBoxes - (decimalPositionFromRight || 0); // Ej: 4 - 2 = 2

    // Asegurar que boxRefsArrayRef.current tiene el tamaño correcto
    if (boxRefsArrayRef.current.length !== totalBoxes) {
         boxRefsArrayRef.current = Array(totalBoxes).fill(null);
         digitBoxRefs.current = boxRefsArrayRef.current; // Sincronizar ref global
    }


    return (
      <div className="flex justify-center items-center gap-0.5 sm:gap-1 my-4">
        {Array(totalBoxes).fill(0).map((_, index) => {
          // Calcular si después de esta caja va el punto decimal visual
          const isVisualDecimalPointAfterThisBox = decimalPositionFromRight !== undefined &&
                                                       decimalPositionFromRight > 0 &&
                                                       index === integerBoxesCount - 1; // El punto va *después* de la última caja entera

          const isFocused = focusedDigitIndex === index;
          const disabled = viewingPrevious || waitingForContinue || exerciseCompleted;

          return (
            <React.Fragment key={`digit-box-frag-${index}-${currentProblem.id}`}>
              <div
                // Referencia para acceder al elemento DOM (para enfocar)
                ref={el => {
                   // Actualizar la referencia en el array auxiliar
                   boxRefsArrayRef.current[index] = el;
                   // Sincronizar la referencia principal para que useEffect pueda acceder
                   // Esto puede ser un poco delicado si el array cambia a menudo,
                   // pero en este caso solo cambia con currentProblem.
                   digitBoxRefs.current = boxRefsArrayRef.current;
                }}
                // tabIndex gestiona si el elemento es focusable con teclado (Tab)
                tabIndex={disabled ? -1 : 0} // No focusable si está deshabilitado
                className={`
                  ${digitBoxBaseStyle}
                  ${isFocused && !disabled ? digitBoxFocusStyle : digitBoxBlurStyle}
                  ${disabled ? digitBoxDisabledStyle : 'cursor-text hover:border-gray-400'}
                  ${decimalPositionFromRight !== undefined && index >= integerBoxesCount ? 'bg-blue-50' : ''} {/* Fondo para decimales */}
                `}
                // Manejar el clic para enfocar la caja
                onClick={() => handleDigitBoxClick(index)}
                // Manejar eventos de teclado (principalmente para Tab y Shift+Tab si tabIndex > -1)
                // El manejo principal del teclado físico está en el useEffect global
                onFocus={() => {
                     // Solo actualizar el estado de foco si no está deshabilitado
                    if (!disabled) setFocusedDigitIndex(index);
                }}
                onBlur={() => {
                     // Opcional: remover el foco visual si el foco se mueve a otro lugar fuera de las cajas
                    // setFocusedDigitIndex(null); // Esto podría interferir con la navegación entre cajas
                }}
                // Data attribute para testing o identificación
                data-testid={`digit-box-${index}`}
              >
                {/* Mostrar el dígito actual o un espacio transparente para mantener el tamaño */}
                {digitAnswers[index] || <span className="opacity-0">0</span>}
              </div>

              {/* Renderizar el punto decimal si es necesario después de esta caja */}
              {isVisualDecimalPointAfterThisBox && (
                <div
                  key={`decimal-point-${currentProblem.id}`} // Key única
                  className="text-2xl sm:text-3xl font-bold mx-0.5 sm:mx-1 opacity-80 self-center pt-1 select-none"
                  // El punto decimal no es una caja de input, no debe ser focusable ni interactivo como tal
                >
                  .
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }, [currentProblem, digitAnswers, focusedDigitIndex, viewingPrevious, waitingForContinue, exerciseCompleted, handleDigitBoxClick]); // Regenerar si cambian estas dependencias


  // Calcular el progreso para la barra
  const progressValue = problemsList.length > 0 ? (currentProblemIndex / problemsList.length) * 100 : 0;

  // Calcular el score (número de respuestas correctas hasta ahora)
  const score = userAnswersHistory.filter(a => a?.isCorrect).length;

  // Determinar si los botones de navegación (Anterior/Siguiente) están deshabilitados
  const canViewPrevious = currentProblemIndex > 0 && !exerciseCompleted;
  const canViewNext = viewingPrevious && currentProblemIndex < actualActiveProblemIndexBeforeViewingPrevious && !exerciseCompleted;
  const isAtActiveProblemInHistory = viewingPrevious && currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious;


   // Determinar el tema de color basado en la dificultad activa
   const getDifficultyTheme = (difficulty: DifficultyLevel) => {
       switch (difficulty) {
           case "beginner": return "bg-blue-50 border-blue-200 text-blue-800";
           case "elementary": return "bg-emerald-50 border-emerald-200 text-emerald-800";
           case "intermediate": return "bg-orange-50 border-orange-200 text-orange-800";
           case "advanced": return "bg-purple-50 border-purple-200 text-purple-800";
           case "expert": return "bg-rose-50 border-rose-200 text-rose-800";
           default: return "bg-indigo-50 border-indigo-200 text-indigo-800";
       }
   };

   const currentThemeClass = getDifficultyTheme(settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty as DifficultyLevel);
    const themeColorClass = settings.enableAdaptiveDifficulty ?
                            (adaptiveDifficulty === "beginner" ? "text-blue-600" :
                             adaptiveDifficulty === "elementary" ? "text-emerald-600" :
                             adaptiveDifficulty === "intermediate" ? "text-orange-600" :
                             adaptiveDifficulty === "advanced" ? "text-purple-600" :
                             adaptiveDifficulty === "expert" ? "text-rose-600" : "text-indigo-600")
                            :
                            (settings.difficulty === "beginner" ? "text-blue-600" :
                             settings.difficulty === "elementary" ? "text-emerald-600" :
                             settings.difficulty === "intermediate" ? "text-orange-600" :
                             settings.difficulty === "advanced" ? "text-purple-600" :
                             settings.difficulty === "expert" ? "text-rose-600" : "text-indigo-600");


   // Si showSettings es true, renderizar el panel de configuración en su lugar
   if (showSettings) {
       return <SettingsPanel settings={settings} onBack={() => setShowSettings(false)} />;
   }


  // Renderizado principal del ejercicio
  return (
    <div className={`px-2 py-3 sm:px-4 sm:py-5 rounded-xl shadow-lg border-2 ${currentThemeClass}`}>
      {/* Renderizar componentes de animaciones si aplican */}
      <LevelUpHandler /> {/* Podría ser un modal controlado por el eventBus */}
      <RewardAnimation /> {/* Controlado por useRewardsStore */}


      {/* Modal de subida de nivel (si showLevelUpReward es true) */}
      {showLevelUpReward && (
          // Usamos el componente LevelUpModal definido abajo
          <LevelUpModal
            isOpen={showLevelUpReward}
            previousLevel={settings.difficulty as DifficultyLevel} // Mostrar la dificultad configurada previamente
            newLevel={adaptiveDifficulty} // Mostrar la nueva dificultad adaptativa alcanzada
            onClose={handleContinue} // Al cerrar el modal, llama a handleContinue para regenerar el problema
          />
        )}


      {/* Cabecera del ejercicio */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className={`text-lg sm:text-xl font-bold ${themeColorClass}`}>{t('Addition Exercise')}</h2> {/* Título traducido */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            {/* Timer general */}
            <span className="font-medium text-gray-700 flex items-center">
                 <Info className="h-3.5 w-3.5 mr-1 opacity-70"/>
                 {formatTime(timer)}
             </span>
            {/* Timer por problema (si aplica) */}
            {settings.timeValue > 0 && !viewingPrevious && !waitingRef.current && exerciseStarted && (settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts) && (
              <span className={`font-medium p-1 rounded ${problemTimerValue <= 5 && problemTimerValue > 0 ? "text-red-600 animate-pulse bg-red-100" : "text-gray-700 bg-gray-100"}`}>
                P: {problemTimerValue}s
              </span>
            )}
            {/* Contador de intentos (si aplica) */}
            {settings.maxAttempts > 0 && !viewingPrevious && !exerciseCompleted && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`font-medium p-1 rounded ${currentAttempts > 0 && currentAttempts < settings.maxAttempts ? "bg-amber-100 text-amber-800" : currentAttempts >= settings.maxAttempts ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                      {t('Attempts')}: {currentAttempts}/{settings.maxAttempts}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('tooltips.maxAttemptsPerProblem')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Nivel de dificultad actual (configurado o adaptativo) */}
            <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${getDifficultyTheme(settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty as DifficultyLevel).replace('bg-', 'bg-').replace('border-', 'border-').replace('text-', 'text-').split(' ').map(cls => cls.startsWith('bg-') ? `${cls.replace('-50','-100')}` : cls).join(' ')}`}>
                 {/* Ajustar clases para un color de fondo más claro en el badge */}
                {t('Level')}: {t(settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty)}
            </span>
            {/* Botón para abrir configuración */}
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
              <Cog className="h-4 w-4" /> {t('common.settings')}
            </Button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-2"> {/* Reducido mb para acercar al texto de progreso */}
        <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2" />
      </div>
       {/* Texto de progreso y score */}
       <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
           <span>{t('Problem')} {currentProblemIndex + 1} {t('of')} {problemsList.length}</span>
           <span className="font-semibold">{t('exercises.score')}: {score}</span>
       </div>


      {/* Contenedor del problema y las cajas de respuesta */}
      <div className={`my-4 p-3 sm:p-4 rounded-lg bg-white border border-gray-200 shadow-sm min-h-[150px] sm:min-h-[180px] flex flex-col items-center justify-center`}>
        {/* Renderizado del problema (horizontal o vertical) */}
        {currentProblem.layout === 'horizontal'
          ? renderHorizontalProblem
          : renderVerticalProblem
        }

        {/* Renderizado de las cajas de entrada de respuesta */}
        {renderDigitAnswerBoxes}

        {/* Mensaje de feedback */}
        {feedbackMessage && (
          <div className={`mt-2 sm:mt-3 text-center font-medium text-sm sm:text-base ${feedbackColor === "green" ? "text-green-600" : feedbackColor === "blue" ? "text-blue-700" : "text-red-600"}`}>
            {feedbackMessage}
          </div>
        )}
      </div>

      {/* Botones de navegación y acción */}
      <div className="flex justify-between mt-4">
        {/* Botones de navegación (Anterior/Siguiente en historial) */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewPrevious}
            disabled={!canViewPrevious} // Deshabilitado si es el primer problema o no iniciado
            className="flex items-center text-xs sm:text-sm"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('common.prev')}
          </Button>

          {viewingPrevious ? (
              // Botón "Volver al problema activo" cuando se ve historial
               <Button onClick={returnToActiveProblem} className="px-4 sm:px-5 text-xs sm:text-sm bg-orange-500 hover:bg-orange-600 text-white flex items-center">
                   <RotateCcw className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('common.returnToActive')}
               </Button>
          ) : (
              // Botón "Siguiente" (solo habilitado si se está viendo historial y hay un siguiente)
               <Button
                 variant="outline"
                 size="sm"
                 onClick={handleViewNext}
                 disabled={!canViewNext} // Habilitado solo si viendoPrevious es true Y hay un siguiente en historial
                 className="flex items-center text-xs sm:text-sm"
               >
                 {t('common.next')} <ChevronRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
               </Button>
          )}
        </div>

        {/* Botones de acción principal (Empezar/Comprobar/Continuar) */}
        <div className="flex space-x-2">
          {!exerciseStarted ? (
            // Botón "Empezar" al inicio
            <Button onClick={startExercise} className="px-5 sm:px-6 text-sm sm:text-base flex items-center">
              {t('exercises.start')}
            </Button>
          ) : waitingForContinue ? (
            // Botón "Continuar" cuando se espera avance (correcto, revelado, etc.)
            <Button onClick={handleContinue} className="px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base animate-pulse bg-green-500 hover:bg-green-600 text-white flex items-center justify-center">
                <span className="flex-grow text-center font-medium">{t('Continue')}</span>
                 {/* Interruptor de Auto-Continuar integrado en el botón Continuar */}
                 <TooltipProvider delayDuration={300}>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div
                         className="ml-3 flex items-center bg-black/20 py-1 px-2 rounded-md cursor-pointer select-none"
                         onClick={(e) => {
                           e.stopPropagation(); // Prevenir que el clic cierre el tooltip y active handleContinue
                           setAutoContinue(prev => !prev);
                         }}
                       >
                         <div className={`h-3.5 w-3.5 border border-white rounded-sm flex items-center justify-center mr-1 ${autoContinue ? 'bg-white' : ''}`}>
                           {autoContinue && <Check className="h-2.5 w-2.5 text-green-700" />}
                         </div>
                         <span className="text-xs font-medium">{t('Auto')}</span>
                       </div>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>{autoContinue ? t('tooltips.disableAutoContinue') : t('tooltips.enableAutoContinue')}</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
            </Button>
          ) : (
            // Botón "Comprobar" durante el ejercicio activo
            <Button onClick={checkCurrentAnswer} disabled={exerciseCompleted || viewingPrevious} className="px-5 sm:px-6 text-sm sm:text-base flex items-center">
              <Check className="mr-1 h-4 w-4" />{t('exercises.check')}
            </Button>
          )}

          {/* Botón "Mostrar Respuesta" */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Deshabilitado si setting.showAnswerWithExplanation es false, o si estamos viendo historial, o si ya estamos esperando continuar */}
                <Button
                    variant="outline" size="sm"
                    onClick={() => {
                        // No permitir si está deshabilitado por lógica
                        if (!settings.showAnswerWithExplanation || viewingPrevious || waitingRef.current || exerciseCompleted || !currentProblem) return;

                        console.log("[ADDITION] Show Answer clicked.");
                        // Iniciar ejercicio si no ha empezado
                         if (!exerciseStarted) startExercise();

                        // Detener timer del problema si estaba corriendo
                        if (singleProblemTimerRef.current) {
                           clearInterval(singleProblemTimerRef.current);
                           singleProblemTimerRef.current = null;
                        }

                        // Mostrar la respuesta correcta
                        setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
                        setFeedbackColor("blue"); // Color para respuesta revelada

                        // Actualizar historial: marcar como 'revealed' si no estaba ya correcto o revelado
                        const problemIdxForHistory = actualActiveProblemIndexBeforeViewingPrevious;
                        const currentHistoryEntry = userAnswersHistory[problemIdxForHistory];

                        // Solo marcar como 'revealed' si no fue ya respondida correctamente
                        if (!currentHistoryEntry || (!currentHistoryEntry.isCorrect && currentHistoryEntry.status !== 'revealed')) {
                             console.log("[ADDITION] Marking problem as revealed in history.");
                             // Incrementar intentos si se reveló antes de agotar los intentos
                            const attemptsBeforeReveal = currentHistoryEntry?.attemptsMade || 0;
                             // Solo contar un intento si no hemos alcanzado el máximo O si maxAttempts es 0 (ilimitado)
                            const attemptsAfterReveal = settings.maxAttempts === 0 || attemptsBeforeReveal < settings.maxAttempts ? attemptsBeforeReveal + 1 : attemptsBeforeReveal;


                            setUserAnswersHistory(prev => {
                                 const newHistory = [...prev];
                                // Crear una nueva entrada o actualizar la existente
                                 newHistory[problemIdxForHistory] = {
                                     problemId: currentProblem.id,
                                     problem: currentProblem,
                                     userAnswerString: digitAnswers.join(''), // Guardar lo que estaba en las cajas
                                     userAnswer: parseFloat(digitAnswers.join('')) || null,
                                     isCorrect: false, // No fue correcta por mérito propio
                                     status: 'revealed', // Marcar como revelada
                                     attemptsMade: attemptsAfterReveal, // Contar este como un intento más
                                 };
                                 return newHistory;
                             });
                            // Actualizar currentAttempts en el estado local también
                            setCurrentAttempts(attemptsAfterReveal);

                        }
                        // Poner en estado de espera "Continuar" después de mostrar la respuesta
                        setWaitingForContinue(true); // Esto actualizará waitingRef.current via effect

                    }}
                    disabled={!settings.showAnswerWithExplanation || viewingPrevious || waitingRef.current || exerciseCompleted} // Deshabilitado por setting o estado
                    className="text-xs sm:text-sm flex items-center"
                >
                    <Info className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('exercises.showAnswer')}
                </Button>
              </TooltipTrigger>
              {/* Mostrar tooltip con explicación de por qué está deshabilitado */}
              {!settings.showAnswerWithExplanation && !viewingPrevious && !waitingRef.current ? (
                  <TooltipContent><p>{t('tooltips.activateShowAnswerInSettings')}</p></TooltipContent>
              ) : viewingPrevious ? (
                  <TooltipContent><p>{t('tooltips.showAnswerDisabledInHistory')}</p></TooltipContent>
              ) : waitingRef.current ? (
                  <TooltipContent><p>{t('tooltips.showAnswerDisabledWhileWaiting')}</p></TooltipContent>
              ) : null }
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Botón de reinicio del ejercicio completo */}
      <div className="mt-4 border-t pt-3 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Confirmación antes de reiniciar
            if (window.confirm(t('exercises.confirmRestart'))) { // Usar t() para traducir el mensaje de confirmación
              restartExercise();
            }
          }}
          className="flex items-center text-xs sm:text-sm"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1 sm:h-4 sm:w-4" />
          {t('exercises.restartExercise')}
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// SECCIÓN 4: COMPONENTES INTERNOS
// ==========================================

// Componente Modal para Subida de Nivel
interface LevelUpModalProps {
  isOpen: boolean;
  previousLevel: DifficultyLevel;
  newLevel: DifficultyLevel;
  onClose: () => void; // Función para cerrar el modal
}

function LevelUpModal({ isOpen, previousLevel, newLevel, onClose }: LevelUpModalProps) {
  // No renderizar si no está abierto
  if (!isOpen) return null;

  const { t } = useTranslations(); // Hook para traducciones

  return (
    // Overlay oscuro que cubre toda la pantalla
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"> {/* Usar un z-index alto */}
      {/* Contenido del modal */}
      <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl text-center">
        {/* Icono de trofeo o similar */}
        <Trophy className="h-16 w-16 sm:h-20 sm:w-20 text-yellow-400 mx-auto mb-3 sm:mb-4 animate-bounce" />
        {/* Título del modal */}
        <h3 className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2">{t('levelUp.title')}</h3>

        {/* Visualización de niveles (Anterior -> Nuevo) */}
        <div className="flex flex-col items-center my-4 sm:my-6">
          {/* Nivel Anterior */}
          <div className="bg-gradient-to-br from-blue-100 to-indigo-50 rounded-lg p-3 sm:p-4 border border-indigo-200 min-w-[150px]">
            <p className="text-sm text-indigo-700 mb-1">{t('levelUp.previousLevel')}</p>
            <p className="text-xl font-bold text-indigo-600 capitalize">{t(previousLevel)}</p> {/* Traducir el nombre del nivel */}
          </div>
          {/* Flecha indicando progreso */}
          <div className="my-2 sm:my-3 text-indigo-500 text-3xl font-bold">↓</div>
          {/* Nivel Nuevo */}
          <div className="bg-gradient-to-br from-indigo-100 to-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200 min-w-[150px]">
            <p className="text-sm text-purple-700 mb-1">{t('levelUp.newLevel')}</p>
            <p className="text-xl font-bold text-purple-600 capitalize">{t(newLevel)}</p> {/* Traducir el nombre del nivel */}
          </div>
        </div>

        {/* Mensaje adicional */}
        <p className="mt-4 text-sm text-gray-600">{t('levelUp.adaptiveDifficultyEnabled')}</p> {/* Mensaje traducido */}

        {/* Botón para cerrar el modal y continuar */}
        <div className="mt-6">
          <Button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg py-2.5 sm:py-3">
            {t('levelUp.continueChallenge')} {/* Botón traducido */}
          </Button>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// SECCIÓN 5: COMPONENTE DE CONFIGURACIÓN
// ==========================================

// Componente del Panel de Configuración (anteriormente Settings.tsx)
interface SettingsPanelProps {
  settings: ModuleSettings['addition']; // Recibe solo la parte de settings de addition
  onBack: () => void; // Función para volver al ejercicio
}

export function SettingsPanel({ settings, onBack }: SettingsPanelProps) {
  // Usa useSettings para actualizar el contexto global
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<ModuleSettings['addition']>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Traducciones
  const { t } = useTranslations();

  // Referencia a la función debounced para guardar la configuración
  // Usamos useMemo para que la función debounced no se cree en cada render
  const debouncedSave = useMemo(
    () =>
      debounce((settingsToSave: ModuleSettings['addition']) => {
        // Al guardar, actualizamos solo la parte 'addition' del contexto global
        updateModuleSettings("addition", settingsToSave);
        console.log(`[ADDITION] Guardando configuración (debounced):`, settingsToSave);
      }, 500), // Tiempo de espera de 500ms
    [updateModuleSettings] // La función updateModuleSettings es la dependencia
  );

  // Manejador genérico para actualizar un ajuste local y guardarlo (debounced o inmediato)
  const handleUpdateSetting = <K extends keyof ModuleSettings['addition']>(key: K, value: ModuleSettings['addition'][K]) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings); // Actualizar estado local inmediatamente

    // Para cambios de dificultad, aplicar cambio inmediatamente (sin debounce)
    // Esto asegura que la regeneración de problemas en el Exercise.tsx reaccione rápido
    if (key === "difficulty" || key === "enableAdaptiveDifficulty") { // También actualizar inmediatamente si se activa/desactiva adaptativa
      console.log(`[ADDITION] Guardando configuración de '${key}' inmediatamente:`, value);
      updateModuleSettings("addition", updatedSettings);
    } else {
      // Para otros ajustes, usar debounce para evitar múltiples llamadas de guardado rápido
      debouncedSave(updatedSettings);
    }
  };

  // Efecto para guardar los settings locales al desmontar el componente
  // Esto asegura que los cambios pendientes por debounce se guarden al salir de la pantalla de settings
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    // Guardar la configuración actual al montar para asegurar persistencia si se refresca
    // o se sale de forma inesperada sin desmontar limpiamente (aunque debounce debería manejar la mayoría)
    updateModuleSettings("addition", localSettings);
    console.log("[ADDITION] Guardando configuración de suma al cargar SettingsPanel:", localSettings);

    return () => {
      isMounted.current = false;
      // Llamar a la función debounced con flush(true) para forzar que se ejecute cualquier llamada pendiente
      // También una llamada directa como respaldo final
      debouncedSave.flush && debouncedSave.flush(); // Llamar flush si existe (depende de la implementación de debounce)
      updateModuleSettings("addition", localSettings); // Llamada directa de respaldo al desmontar
      console.log("[ADDITION] Guardando configuración de suma al desmontar SettingsPanel:", localSettings);

      // Forzar persistencia en localStorage como respaldo (useSettings ya debería hacerlo, pero por si acaso)
      try {
          const profileId = localStorage.getItem('activeProfileId');
          const suffix = profileId ? `-profile-${profileId}` : '';
          const key = `moduleSettings${suffix}`;

          const currentSettings = localStorage.getItem(key);
          const parsed = currentSettings ? JSON.parse(currentSettings) : {};
          const updated = {
            ...parsed,
            addition: localSettings // Asegurar que la parte de addition está actualizada
          };
          localStorage.setItem(key, JSON.stringify(updated));
          console.log("[ADDITION] Forzando actualización en localStorage (SettingsPanel unmount):", updated);
        } catch (e) {
          console.error("Error al forzar guardado en localStorage al desmontar:", e);
        }
    };
  }, [localSettings, updateModuleSettings, debouncedSave]); // Depende de localSettings y updateModuleSettings


  // Manejar el restablecimiento de la configuración a los valores predeterminados
  const handleResetSettings = async () => {
    if (showResetConfirm) {
      console.log("[ADDITION] Confirming reset settings to default.");
      await resetModuleSettings("addition"); // Llama a la función del contexto para resetear
      setLocalSettings({ ...defaultModuleSettings.addition }); // Actualiza el estado local con los valores por defecto
      setShowResetConfirm(false); // Oculta la confirmación
       // También reseteamos las rachas al resetear settings
       try {
           localStorage.setItem('addition_consecutiveCorrectAnswers', '0');
           localStorage.setItem('addition_consecutiveIncorrectAnswers', '0');
            console.log("[ADDITION] Resetting consecutive answers in localStorage.");
       } catch (e) {
           console.error("Error resetting consecutive answers on settings reset:", e);
       }

    } else {
      setShowResetConfirm(true); // Pide confirmación
    }
  };

  // Obtener clases de tema basadas en la dificultad seleccionada localmente
  const getThemeClasses = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "beginner": return { bg: "bg-gradient-to-br from-blue-50 to-blue-100", border: "border-blue-200", text: "text-blue-600", textSecondary: "text-blue-500", bgContainer: "bg-blue-50", bgLight: "bg-blue-100", accent: "text-blue-700", emoji: "🔵", name: t('beginner') };
      case "elementary": return { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100", border: "border-emerald-200", text: "text-emerald-600", textSecondary: "text-emerald-500", bgContainer: "bg-emerald-50", bgLight: "bg-emerald-100", accent: "text-emerald-700", emoji: "🟢", name: t('elementary') };
      case "intermediate": return { bg: "bg-gradient-to-br from-orange-50 to-orange-100", border: "border-orange-200", text: "text-orange-600", textSecondary: "text-orange-500", bgContainer: "bg-orange-50", bgLight: "bg-orange-100", accent: "text-orange-700", emoji: "🟠", name: t('intermediate') };
      case "advanced": return { bg: "bg-gradient-to-br from-purple-50 to-purple-100", border: "border-purple-200", text: "text-purple-600", textSecondary: "text-purple-500", bgContainer: "bg-purple-50", bgLight: "bg-purple-100", accent: "text-purple-700", emoji: "🟣", name: t('advanced') };
      case "expert": return { bg: "bg-gradient-to-br from-rose-50 to-rose-100", border: "border-rose-200", text: "text-rose-600", textSecondary: "text-rose-500", bgContainer: "bg-rose-50", bgLight: "bg-rose-100", accent: "text-rose-700", emoji: "⭐", name: t('expert') };
      default: return { bg: "bg-gradient-to-br from-indigo-50 to-indigo-100", border: "border-indigo-200", text: "text-indigo-600", textSecondary: "text-indigo-500", bgContainer: "bg-indigo-50", bgLight: "bg-indigo-100", accent: "text-indigo-700", emoji: "⚡", name: t('common.general') };
    }
  };

  const theme = getThemeClasses(localSettings.difficulty);

  return (
    <div className={`px-4 py-5 sm:p-6 rounded-xl shadow-md ${theme.bg} border-2 ${theme.border}`}>
      {/* Cabecera del panel de configuración */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text} flex items-center`}>
            {theme.emoji} {t('settings.titleAddition')} {/* Título traducido */}
          </h2>
          <p className={`text-sm font-medium ${theme.textSecondary}`}>{t('settings.subtitle')}</p> {/* Subtítulo traducido */}
        </div>
        {/* Botón para volver al ejercicio */}
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className={`border ${theme.border} hover:${theme.bgContainer} text-gray-600 hover:text-${theme.accent.split('-')[1]}-700`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('settings.backToExercise')} {/* Botón traducido */}
        </Button>
      </div>

      {/* Controles de configuración */}
      <div className="space-y-6">
        {/* Sección de Dificultad */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🎯</span>{t('settings.difficultyLevel')} {/* Título traducido */}
          </h3>
          <p className={`text-sm ${theme.textSecondary} mb-2`}>{t('settings.clickExampleToChangeDifficulty')}</p> {/* Descripción traducida */}

          {/* Componente para mostrar ejemplos visuales de dificultad */}
          {/* operation="addition" es hardcodeado porque este SettingsPanel es específico de Addition */}
          <div className="mt-4 mb-6 bg-white/80 rounded-lg p-4 border border-gray-100 shadow-sm">
            <DifficultyExamples
              operation="addition"
              activeDifficulty={localSettings.difficulty}
              onSelectDifficulty={(difficulty) =>
                handleUpdateSetting("difficulty", difficulty as DifficultyLevel) // Casting necesario
              }
            />
          </div>

          {/* Descripciones de los niveles de dificultad */}
          {/* Estas descripciones deberían idealmente venir de archivos de traducción */}
          {/* Por ahora, las dejamos hardcodeadas o usamos t() si están en el archivo de traducción global */}
          <div className="mt-3 mb-2 space-y-1.5">
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('beginner')}:</span> {t('difficultyDescriptions.beginner')} {/* Traducido */}
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('elementary')}:</span> {t('difficultyDescriptions.elementary')} {/* Traducido */}
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('intermediate')}:</span> {t('difficultyDescriptions.intermediate')} {/* Traducido */}
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('advanced')}:</span> {t('difficultyDescriptions.advanced')} {/* Traducido */}
            </p>
            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
              <span className="font-bold">{t('expert')}:</span> {t('difficultyDescriptions.expert')} {/* Traducido */}
            </p>
          </div>
        </div>

        {/* Sección de Número de Problemas */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🔢</span>{t('settings.numberOfProblems')} {/* Título traducido */}
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.problemCount]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={(value) => handleUpdateSetting("problemCount", value[0])}
                  className={`w-full`} // Clases de tema para el slider background podrían ir aquí
                />
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.problemCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    // Validar el rango
                    if (!isNaN(value) && value >= 1 && value <= 50) {
                      handleUpdateSetting("problemCount", value);
                    } else if (e.target.value === "") {
                       // Permitir campo vacío temporalmente para borrar
                       // No actualizar el setting hasta que sea un número válido
                   }
                  }}
                  onBlur={(e) => {
                      // Al salir del campo, si está vacío o inválido, restaurar el último valor válido
                      const value = parseInt(e.target.value);
                      if (isNaN(value) || value < 1 || value > 50) {
                          setLocalSettings(prev => ({...prev, problemCount: settings.problemCount})); // Restaurar el último valor guardado
                      }
                  }}
                  min={1}
                  max={50}
                  className={`w-full border ${theme.border}`}
                />
              </div>
            </div>
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
              <span className="font-medium">{t('settings.specifyProblemCount')}:</span> <span className={`font-bold ${theme.text}`}>{localSettings.problemCount}</span>
            </p>
          </div>
        </div>

        {/* Sección de Límite de Tiempo */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">⏱️</span>{t('settings.timeLimit')} {/* Título traducido */}
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.timeValue]}
                  min={0}
                  max={300}
                  step={5}
                  onValueChange={(value) => handleUpdateSetting("timeValue", value[0])}
                  className={`w-full`} // Clases de tema para el slider
                />
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                  <span>0</span>
                  <span>150</span>
                  <span>300</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.timeValue}
                   onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 300) {
                      handleUpdateSetting("timeValue", value);
                    } else if (e.target.value === "") {
                       // Permitir campo vacío
                    }
                   }}
                   onBlur={(e) => {
                       const value = parseInt(e.target.value);
                       if (isNaN(value) || value < 0 || value > 300) {
                           setLocalSettings(prev => ({...prev, timeValue: settings.timeValue}));
                       }
                   }}
                  min={0}
                  max={300}
                  className={`w-full border ${theme.border}`}
                />
              </div>
            </div>
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
              <span className="font-medium">{t('settings.timeInSeconds')}:</span> <span className={`font-bold ${theme.text}`}>{localSettings.timeValue}</span> <span className="text-xs">({t('settings.zeroForNoLimit')})</span> {/* Texto traducido */}
            </p>
          </div>
        </div>

        {/* Sección de Máximo de Intentos */}
        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
            <span className="mr-2">🔄</span>{t('settings.maxAttemptsPerProblem')} {/* Título traducido */}
          </h3>
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Slider
                  value={[localSettings.maxAttempts]}
                  min={0}
                  max={10}
                  step={1}
                  onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])}
                  className={`w-full`} // Clases de tema para el slider
                />
                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={localSettings.maxAttempts}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 10) {
                      handleUpdateSetting("maxAttempts", value);
                    } else if (e.target.value === "") {
                       // Permitir campo vacío
                    }
                  }}
                   onBlur={(e) => {
                       const value = parseInt(e.target.value);
                       if (isNaN(value) || value < 0 || value > 10) {
                           setLocalSettings(prev => ({...prev, maxAttempts: settings.maxAttempts}));
                       }
                   }}
                  min={0}
                  max={10}
                  className={`w-full border ${theme.border}`}
                />
              </div>
            </div>
            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
              <span className="font-medium">{t('settings.maxAttempts')}:</span> <span className={`font-bold ${theme.text}`}>{localSettings.maxAttempts}</span> <span className="text-xs">({t('settings.zeroForUnlimited')})</span> {/* Texto traducido */}
            </p>
          </div>

          {/* Configuración Adicional */}
          <h3 className={`text-lg font-bold ${theme.text} flex items-center mt-6`}>
            <span className="mr-2">⚙️</span>{t('settings.additionalSettings')} {/* Título traducido */}
          </h3>
          <div className="mt-3 space-y-3">
            {/* Switch: Mostrar retroalimentación inmediata */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="show-immediate-feedback" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">📝</span>{t('settings.showImmediateFeedback')} {/* Etiqueta traducida */}
              </Label>
              <Switch
                id="show-immediate-feedback"
                checked={localSettings.showImmediateFeedback}
                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
                className={theme.bgLight.replace('bg-','data-[state=checked]:bg-')} // Aplica color del tema al switch activado
              />
            </div>
            {/* Switch: Habilitar efectos de sonido */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-sound-effects" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">🔊</span>{t('settings.enableSoundEffects')} {/* Etiqueta traducida */}
              </Label>
              <Switch
                id="enable-sound-effects"
                checked={localSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
                className={theme.bgLight.replace('bg-','data-[state=checked]:bg-')}
              />
            </div>
            {/* Switch: Mostrar explicación de respuestas (Ej: la respuesta correcta) */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="show-answer-explanation" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">❓</span>{t('settings.showAnswerExplanation')} {/* Etiqueta traducida */}
              </Label>
              <Switch
                id="show-answer-explanation"
                checked={localSettings.showAnswerWithExplanation}
                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
                className={theme.bgLight.replace('bg-','data-[state=checked]:bg-')}
              />
            </div>
            {/* Switch: Habilitar Dificultad Adaptativa */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-adaptive-difficulty" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">📈</span>{t('settings.enableAdaptiveDifficulty')} {/* Etiqueta traducida */}
              </Label>
              <Switch
                id="enable-adaptive-difficulty"
                checked={localSettings.enableAdaptiveDifficulty}
                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
                className={theme.bgLight.replace('bg-','data-[state=checked]:bg-')}
              />
            </div>
            {/* Switch: Habilitar Compensación (Añadir problemas por incorrectos/revelados) */}
            {/* Nota: La implementación de la compensación en Exercise.tsx es compleja, esta opción solo habilita la flag */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-compensation" className={`cursor-pointer ${theme.accent} flex flex-col items-start`}> {/* flex-col items-start para que la descripción quede abajo */}
                <span className="flex items-center mb-1"><span className="mr-2">➕</span>{t('settings.enableCompensation')}</span> {/* Etiqueta traducida */}
                <span className="text-xs opacity-80 ml-5">{t('settings.compensationDescription')}</span> {/* Descripción traducida */}
              </Label>
              <Switch
                id="enable-compensation"
                checked={localSettings.enableCompensation}
                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
                className={theme.bgLight.replace('bg-','data-[state=checked]:bg-')}
              />
            </div>
            {/* Switch: Activar sistema de recompensas aleatorias */}
            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
              <Label htmlFor="enable-rewards" className={`cursor-pointer ${theme.accent} flex items-center`}>
                <span className="mr-2">🏆</span>{t('settings.enableRewards')} {/* Etiqueta traducida */}
                {/* Emojis decorativos */}
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
                className={theme.bgLight.replace('bg-','data-[state=checked]:bg-')}
              />
            </div>
            {/* Explicación de recompensas si están activadas */}
            {localSettings.enableRewards && (
              <div className={`ml-6 mt-3 p-3 rounded-md bg-white/70 border ${theme.border}`}>
                <p className={`text-sm ${theme.accent}`}>
                  <span className="mr-2">🎲</span>{t('settings.rewardsExplanation')} {/* Texto traducido */}
                </p>
                {/* Visualización de tipos de recompensas */}
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">🏅</span>
                    <span className={`text-xs font-medium ${theme.text}`}>{t('rewards.medal')}</span> {/* Traducido */}
                  </div>
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">🏆</span>
                    <span className={`text-xs font-medium ${theme.text}`}>{t('rewards.trophy')}</span> {/* Traducido */}
                  </div>
                  <div className={`p-2 rounded-md bg-white/90 border ${theme.border} flex flex-col items-center`}>
                    <span className="text-2xl">⭐</span>
                    <span className={`text-xs font-medium ${theme.text}`}>{t('rewards.star')}</span> {/* Traducido */}
                  </div>
                </div>
                <p className={`text-xs mt-3 ${theme.textSecondary} text-center italic`}>
                  {t('settings.rewardsSelectionAutomatic')} {/* Texto traducido */}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botón de Restablecer Configuración */}
        <div className="pt-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant={showResetConfirm ? "destructive" : "outline"}
              onClick={handleResetSettings}
              className={`mr-3 text-xs sm:text-sm ${showResetConfirm ? "" : `border ${theme.border} hover:${theme.bgContainer} text-gray-600 hover:text-${theme.accent.split('-')[1]}-700`}`}
            >
              {showResetConfirm ? (
                t('settings.confirmReset') // Texto traducido para confirmar
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t('settings.resetToDefaults')} {/* Texto traducido para restablecer */}
                </>
              )}
            </Button>
            {/* Botón de guardar eliminado - los cambios se guardan automáticamente */}
          </div>
        </div>
      </div>
    </div>
  );
}
