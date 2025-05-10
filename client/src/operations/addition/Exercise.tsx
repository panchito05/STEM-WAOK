// Exercise.tsx
import React, { useState, useEffect, useRef } from "react";
import { useProgress } from "@/context/ProgressContext"; // Asumiendo que existe y es correcto
import { ModuleSettings, useSettings } from "@/context/SettingsContext"; // Asumiendo que existe y es correcto
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress"; // Renombrado para evitar colisión si 'Progress' se usa en otro lado
import { generateAdditionProblem, checkAnswer, getVerticalAlignmentInfo } from "./utils";
import { Problem, UserAnswer as UserAnswerType, AdditionProblem, DifficultyLevel } from "./types"; // Asegúrate que estos tipos estén bien definidos
import { formatTime } from "@/lib/utils"; // Asumiendo que existe y es correcto
import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations"; // Asumiendo que existe y es correcto
import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager'; // Asumiendo que existe
import eventBus from '@/lib/eventBus'; // Asumiendo que existe y es correcto
import LevelUpHandler from "@/components/LevelUpHandler"; // Asumiendo que existe
import { useRewardsStore, awardReward, getRewardProbability } from '@/lib/rewards-system'; // Asumiendo que existe
import RewardAnimation from '@/components/rewards/RewardAnimation'; // Asumiendo que existe


interface ExerciseProps {
settings: ModuleSettings; // Este tipo debe venir de tu SettingsContext
onOpenSettings: () => void;
}

// Estilos para los cajones de respuesta y problema vertical
const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
const digitBoxFocusStyle = "border-blue-500 ring-2 ring-blue-300 shadow-lg";
const digitBoxBlurStyle = "border-gray-300";
const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const plusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const sumLineStyle = "border-t-2 border-gray-700 my-1";

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
// Estados principales del ejercicio
const [problemsList, setProblemsList] = useState<AdditionProblem[]>([]);
const [currentProblem, setCurrentProblem] = useState<AdditionProblem | null>(null);
const [currentProblemIndex, setCurrentProblemIndex] = useState(0); // Índice del problema que se está mostrando

// Estados para la entrada de respuesta con cajones
const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
// REF para mantener el valor más reciente de digitAnswers de forma síncrona
const digitAnswersRef = useRef<string[]>([]);
const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
const digitBoxRefs = useRef<(HTMLDivElement | null)[]>([]);

// Estados para el historial y seguimiento del ejercicio
const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswerType[]>([]);
const [timer, setTimer] = useState(0); // Timer general del ejercicio
const [problemTimerValue, setProblemTimerValue] = useState(settings.timeValue); // Timer para el problema actual
const [exerciseStarted, setExerciseStarted] = useState(false);
const [exerciseCompleted, setExerciseCompleted] = useState(false);

// Estados para feedback y UI
const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue" | null>(null);
const [waitingForContinue, setWaitingForContinue] = useState(false); // Esperando clic en "Continuar"
const [blockAutoAdvance, setBlockAutoAdvance] = useState(false); // Para bloquear avance después de subir de nivel, etc.
const [autoContinue, setAutoContinue] = useState(() => {
try {
const stored = localStorage.getItem('addition_autoContinue');
return stored === 'true';
} catch (e) {
return false;
}
}); // Estado para habilitar/deshabilitar auto-continuar

// Estados para dificultad adaptativa y recompensas
const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel>(() => {
try {
const storedSettings = localStorage.getItem('moduleSettings');
if (storedSettings) {
const parsedSettings = JSON.parse(storedSettings);
if (parsedSettings.addition && parsedSettings.addition.difficulty) return parsedSettings.addition.difficulty;
}
} catch (e) { console.error('Error loading adaptive difficulty from localStorage:', e); }
return settings.difficulty as DifficultyLevel;
});
const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveCorrectAnswers') || '0', 10));
const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveIncorrectAnswers') || '0', 10));
const [currentAttempts, setCurrentAttempts] = useState(0); // Intentos en el problema actual
const [showLevelUpReward, setShowLevelUpReward] = useState(false); // Para modal/animación de subida de nivel

// Estados para la funcionalidad "Previous"
const [viewingPrevious, setViewingPrevious] = useState(false);
const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState<number>(0);

// Refs para timers
const generalTimerRef = useRef<number | null>(null);
const singleProblemTimerRef = useRef<number | null>(null);
const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

// Hooks de contexto y utilidades
const { saveExerciseResult } = useProgress();
const { updateModuleSettings } = useSettings();
const { t } = useTranslations();
const { setShowRewardAnimation } = useRewardsStore(); // Asumiendo que este estado global existe

// --- EFECTOS DE REACT ---

// Sincronizar digitAnswers state con digitAnswersRef
useEffect(() => {
digitAnswersRef.current = digitAnswers;
}, [digitAnswers]);


// Generar problemas cuando cambian las settings relevantes
useEffect(() => {
generateNewProblemSet();
}, [settings.problemCount, settings.difficulty, settings.enableAdaptiveDifficulty]);

// Sincronizar dificultad adaptativa local con la de settings (si está habilitada)
useEffect(() => {
if (settings.enableAdaptiveDifficulty && settings.difficulty !== adaptiveDifficulty) {
setAdaptiveDifficulty(settings.difficulty as DifficultyLevel);
}
}, [settings.difficulty, settings.enableAdaptiveDifficulty]);

// Configurar el problema actual, cajones de respuesta y foco
useEffect(() => {
if (currentProblem && !viewingPrevious && !exerciseCompleted) {
const numBoxes = currentProblem.answerMaxDigits || 0;
// Solo limpiar digitAnswers si es un problema realmente nuevo para el flujo activo
// O si estamos volviendo al problema activo y no tenía una respuesta guardada.
const activeProblemHistoryEntry = userAnswersHistory[actualActiveProblemIndexBeforeViewingPrevious];
if (currentProblem.id !== problemsList[actualActiveProblemIndexBeforeViewingPrevious]?.id ||
!activeProblemHistoryEntry ||
currentProblemIndex !== actualActiveProblemIndexBeforeViewingPrevious) {
setDigitAnswers(Array(numBoxes).fill("")); // Esto también actualiza digitAnswersRef
}
// Si se quisiera restaurar una respuesta parcial del problema activo, se haría aquí.

digitBoxRefs.current = Array(numBoxes).fill(null).map(() => React.createRef<HTMLDivElement>() as any);

    if (currentProblem.layout === 'horizontal') {
        setInputDirection('ltr');
        setFocusedDigitIndex(0);
    } else { // Vertical
        setInputDirection('rtl');
        setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : 0);
    }
    setProblemTimerValue(settings.timeValue);
    setCurrentAttempts(0);

    // Limpiar feedback solo si no estamos esperando "Continuar" y es el problema activo
    if (!waitingForContinue && currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) {
        setFeedbackMessage(null);
        setFeedbackColor(null);
    }
} else if (viewingPrevious && currentProblem) {
    // Cuando se ve un problema anterior, el feedback y los digitAnswers se establecen en moveToPreviousProblem.
    // Quitar foco activo.
    setFocusedDigitIndex(null);
}


}, [currentProblem, viewingPrevious, exerciseCompleted, actualActiveProblemIndexBeforeViewingPrevious, waitingForContinue]);

// Aplicar foco al cajón cuando focusedDigitIndex cambia
useEffect(() => {
if (focusedDigitIndex !== null && !viewingPrevious && digitBoxRefs.current[focusedDigitIndex]) {
setTimeout(() => digitBoxRefs.current[focusedDigitIndex]?.focus(), 0); // Timeout para asegurar que el DOM está listo
}
}, [focusedDigitIndex, viewingPrevious]);

// Timer general del ejercicio
useEffect(() => {
if (exerciseStarted && !exerciseCompleted) {
generalTimerRef.current = window.setInterval(() => setTimer(prev => prev + 1), 1000);
}
return () => { if (generalTimerRef.current) clearInterval(generalTimerRef.current); };
}, [exerciseStarted, exerciseCompleted]);

// Timer por problema individual
useEffect(() => {
if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); // Limpiar timer anterior

// Iniciar un nuevo temporizador solo si:
// 1. El ejercicio ha comenzado y no ha terminado
// 2. Existe un problema actual y no estamos viendo uno anterior
// 3. El tiempo está configurado (settings.timeValue > 0)
// 4. No se han agotado todos los intentos Y no estamos esperando 'Continuar'
// 5. No estamos bloqueados por eventos como subir de nivel

if (exerciseStarted && !exerciseCompleted && currentProblem && !viewingPrevious && settings.timeValue > 0 && !waitingForContinue && !blockAutoAdvance) {
  // Verificar si se han agotado todos los intentos
  const attemptsExhausted = settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts;

  // Solo configurar el temporizador si quedan intentos disponibles
  if (!attemptsExhausted) {
    // Reiniciar el valor del temporizador solo si es el inicio del problema (attempts === 0)
    // O si se reinicia después de un intento fallido por tiempo.
    // Si el timer llegó a 0 y handleTimeOrAttemptsUp lo manejó, ya debería estar parado.
    // Si un intento falló ANTES de tiempo, currentAttempts incrementó, y el timer se reinicia via dependency change.
    // Si problemTimerValue ya está en 0, no lo reiniciamos aquí a settings.timeValue, porque handleTimeOrAttemptsUp ya se encargó.
    // Esto evita reiniciar el timer *después* de que ya expiró y se manejó.
    // Asegurarse de que problemTimerValue se resetea solo cuando se carga un nuevo problema o se inicia un nuevo intento por tiempo.
     // El useEffect con [currentProblem, viewingPrevious] resetea problemTimerValue y currentAttempts.
     // Si un intento falla por tiempo, handleTimeOrAttemptsUp reinicia problemTimerValue.
     // Si un intento falla por check manual, el timer sigue corriendo.
    // Parece que el reseteo ya está cubierto.

    singleProblemTimerRef.current = window.setInterval(() => {
      setProblemTimerValue(prev => {
        // Si el temporizador llega a 0 o menos, manejar el tiempo agotado
        if (prev <= 1) {
          if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
          // Llama a la función que ahora valida la respuesta antes de marcar como incorrecto
          // Al llegar a 0, la validación se hace sobre el estado final del input.
          handleTimeOrAttemptsUp();
          return 0; // Asegura que el valor no sea negativo
        }
        return prev - 1;
      });
    }, 1000);
  } else {
       // If attempts were ALREADY exhausted when useEffect runs (e.g. returning from prev view)
       // make sure feedback for exhausted attempts is visible if needed.
        if (currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) {
            const activeHistory = userAnswersHistory[actualActiveProblemIndexBeforeViewingPrevious];
            // Check if history exists and indicates it was revealed or incorrect with attempts exhausted
            if (activeHistory && (activeHistory.status === 'revealed' || (!activeHistory.isCorrect && settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts))) {
               // This case might be redundant as handleTimeOrAttemptsUp handles the final state,
               // but ensures feedback is shown if navigating back to an exhausted problem.
               setFeedbackMessage(`Incorrect. No attempts left. The answer was: ${currentProblem.correctAnswer}.`);
               setFeedbackColor("red");
               setWaitingForContinue(true); // If attempts exhausted, wait for continue
            } else if (activeHistory && !activeHistory.isCorrect && activeHistory.status === 'attempted') {
                 // If it was attempted but not exhausted, show incorrect feedback without revealing answer
                 setFeedbackMessage(t('exercises.incorrect'));
                 setFeedbackColor("red");
                 // Don't set waitingForContinue, allow more attempts
            }
        }
   }
} else {
    // If exercise not started, completed, viewing previous, blocked, or no time set, ensure timer is cleared.
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
}


// Limpiar el temporizador cuando el componente se desmonte o las dependencias cambien
return () => {
  if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
};
}, [exerciseStarted, exerciseCompleted, settings.timeValue, currentProblem, viewingPrevious, currentAttempts, settings.maxAttempts, waitingForContinue, blockAutoAdvance, actualActiveProblemIndexBeforeViewingPrevious]); // Added dependencies

// Guardar contadores de rachas en localStorage
useEffect(() => localStorage.setItem('addition_consecutiveCorrectAnswers', consecutiveCorrectAnswers.toString()), [consecutiveCorrectAnswers]);
useEffect(() => localStorage.setItem('addition_consecutiveIncorrectAnswers', consecutiveIncorrectAnswers.toString()), [consecutiveIncorrectAnswers]);
useEffect(() => localStorage.setItem('addition_autoContinue', autoContinue.toString()), [autoContinue]);

// --- FUNCIONES MANEJADORAS DEL EJERCICIO ---

const generateNewProblemSet = () => {
const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
const newProblemsArray: AdditionProblem[] = [];
for (let i = 0; i < settings.problemCount; i++) {
newProblemsArray.push(generateAdditionProblem(difficultyToUse));
}
setProblemsList(newProblemsArray);
setCurrentProblemIndex(0);
setActualActiveProblemIndexBeforeViewingPrevious(0); // El problema activo es el primero
setCurrentProblem(newProblemsArray[0]); // Esto dispara el useEffect para configurar cajones y foco

setUserAnswersHistory(Array(newProblemsArray.length).fill(null)); // Inicializar historial
setTimer(0);
setExerciseStarted(false);
setExerciseCompleted(false);
setFeedbackMessage(null);
setFeedbackColor(null);
setWaitingForContinue(false);
setBlockAutoAdvance(false);
setShowLevelUpReward(false);
setViewingPrevious(false);

};

const startExercise = () => {
if (!exerciseStarted) {
setExerciseStarted(true);
// El foco inicial se maneja en el useEffect [currentProblem, viewingPrevious]
// El timer se inicia en el useEffect [exerciseStarted, exerciseCompleted]
}
};

const advanceToNextActiveProblem = () => {
// Esta función avanza al siguiente problema en el que se debe trabajar
const nextActiveIdx = actualActiveProblemIndexBeforeViewingPrevious + 1;
if (nextActiveIdx < problemsList.length) {
setCurrentProblemIndex(nextActiveIdx);
setCurrentProblem(problemsList[nextActiveIdx]);
setActualActiveProblemIndexBeforeViewingPrevious(nextActiveIdx);
setFeedbackMessage(null); // Limpiar feedback para el nuevo problema activo
setFeedbackColor(null);
// The useEffect [currentProblem, viewingPrevious] will handle resetting digitAnswers, focus, timerValue and attempts.
} else {
completeExercise();
}
};

const moveToPreviousProblem = () => {
// Determinar si se puede ir hacia atrás
const canGoBack = viewingPrevious ? currentProblemIndex > 0 : actualActiveProblemIndexBeforeViewingPrevious > 0 ; // Allow going back from index > 0 when active
if (!canGoBack || exerciseCompleted || showLevelUpReward) return; // Can't go back while level-up is showing

if (!viewingPrevious) { // Si es la primera vez que se presiona "Previous" desde un problema activo
    setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex); // Guardar el índice del problema activo antes de navegar
}
setViewingPrevious(true); // Entrar en modo revisión
if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); // Detener timer si estaba activo
if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); // Clear auto-continue timer
setWaitingForContinue(false); // Ensure not waiting when reviewing

// Calcular el índice del problema anterior a mostrar
const prevIndexToView = currentProblemIndex - 1; // Always go back one from the currently displayed index

setCurrentProblemIndex(prevIndexToView); // Actualizar el índice del problema que se está mostrando
const prevProblemToView = problemsList[prevIndexToView];
setCurrentProblem(prevProblemToView); // Cargar el problema anterior

const prevAnswerEntry = userAnswersHistory[prevIndexToView]; // Obtener la respuesta del historial

if (prevAnswerEntry && prevProblemToView) {
    // Reconstruct digitAnswers for display from stored answer
    const answerStr = isNaN(prevAnswerEntry.userAnswer) ? "" : String(prevAnswerEntry.userAnswer);
    let [intPart, decPart = ""] = answerStr.split('.');
    const expectedDecimals = prevProblemToView.answerDecimalPosition || 0;
    const numIntBoxes = prevProblemToView.answerMaxDigits - expectedDecimals;

    // Pad integer part with zeros to fill the boxes for display
    const paddedIntPartForBoxes = intPart.padStart(numIntBoxes, '0');
    // Pad decimal part with zeros if needed
    decPart = decPart.padEnd(expectedDecimals, '0').slice(0, expectedDecimals);

    const fullAnswerDigitsString = paddedIntPartForBoxes + decPart;

    const restoredDigitAnswers = Array(prevProblemToView.answerMaxDigits).fill('');
    for (let i = 0; i < Math.min(restoredDigitAnswers.length, fullAnswerDigitsString.length); i++) {
        restoredDigitAnswers[i] = fullAnswerDigitsString[i];
    }
    setDigitAnswers(restoredDigitAnswers); // This also updates digitAnswersRef

    // Determine feedback based on history entry
    if(prevAnswerEntry.status === 'revealed') {
         setFeedbackMessage(`${t('exercises.answerWasNotAnswered')}. ${t('exercises.correctAnswerIs')} ${prevProblemToView.correctAnswer}`);
         setFeedbackColor("blue");
    } else if (prevAnswerEntry.isCorrect) {
        setFeedbackMessage(`${t('exercises.yourAnswerWas')}: ${prevAnswerEntry.userAnswer} (${t('exercises.correct')})`);
        setFeedbackColor("green");
    } else { // Incorrect or attempted but not correct
         const displayAnswer = isNaN(prevAnswerEntry.userAnswer) ? t('common.notAnswered') : prevAnswerEntry.userAnswer;
         setFeedbackMessage(`${t('exercises.yourAnswerWas')}: ${displayAnswer} (${t('exercises.incorrect')}). ${t('exercises.correctAnswerIs')} ${prevProblemToView.correctAnswer}`);
         setFeedbackColor("red");
    }

} else {
    // If no answer recorded for that previous problem
    setDigitAnswers(prevProblemToView ? Array(prevProblemToView.answerMaxDigits).fill("") : []); // Updates ref
    setFeedbackMessage(prevProblemToView ? t('exercises.noAnswerRecordedForThisProblem') : t('common.error'));
    setFeedbackColor("blue");
}
setFocusedDigitIndex(null); // Quitar foco

};

const returnToActiveProblem = () => {
setViewingPrevious(false); // Salir del modo revisión
// Restore the problem the user was working on
const activeIndex = actualActiveProblemIndexBeforeViewingPrevious;
setCurrentProblemIndex(activeIndex);
setCurrentProblem(problemsList[activeIndex]);

// The useEffect [currentProblem, viewingPrevious] will handle resetting digitAnswers, focus, timerValue and attempts.
// Restore feedback for the active problem if it had an incorrect answer or was revealed.
const activeProblemHistory = userAnswersHistory[activeIndex];
if(activeProblemHistory){
     if(activeProblemHistory.status === 'revealed') {
         setFeedbackMessage(`${t('exercises.answerWasNotAnswered')}. ${t('exercises.correctAnswerIs')} ${problemsList[activeIndex].correctAnswer}`);
         setFeedbackColor("blue");
         setWaitingForContinue(true); // If coming back to a revealed problem, user needs to click continue
     } else if (!activeProblemHistory.isCorrect && !isNaN(activeProblemHistory.userAnswer)) {
         setFeedbackMessage(`${t('exercises.yourAnswerWas')}: ${activeProblemHistory.userAnswer} (${t('exercises.incorrect')})`);
         setFeedbackColor("red");
         // If it was just incorrect (not revealed), don't set waitingForContinue, allow user to try again.
     } else if (activeProblemHistory.isCorrect) {
         setFeedbackMessage(t('exercises.correct')); // Should not happen when returning to 'active' unless active was last problem?
         setFeedbackColor("green");
          setWaitingForContinue(true); // If somehow returning to a correct problem, wait for continue
     }
     else {
         setFeedbackMessage(null); // Clear feedback if returning to a correct problem
         setFeedbackColor(null);
     }
} else {
    setFeedbackMessage(null); // No feedback if problem hasn't been attempted
    setFeedbackColor(null);
}
// Note: If the user had a partial answer when leaving the active problem, it will be cleared by the useEffect.
// Implementing saving/restoring partial answers would require more complex state management per problem.
};

// MODIFICADA para usar digitAnswersRef para la verificación final
const handleTimeOrAttemptsUp = () => {
    if (!currentProblem || viewingPrevious || exerciseCompleted || showLevelUpReward) return;

    console.log(`Time or Attempts up for problem ${currentProblemIndex}. Checking current input.`);

    // Always clear the single problem timer when this function is triggered
    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);

    // Use the REF to get the absolute latest digit answers
    const currentDigitAnswers = digitAnswersRef.current;

    // 1. Construct user answer from current digitAnswers from REF
    let userAnswerString = "";
    const decPosInAnswer = currentProblem.answerDecimalPosition;
    const totalDigitBoxes = currentProblem.answerMaxDigits;
    const integerBoxesCount = totalDigitBoxes - (decPosInAnswer || 0);

    if (decPosInAnswer !== undefined && decPosInAnswer > 0) {
        const integerPart = currentDigitAnswers.slice(0, integerBoxesCount).join('');
        const decimalPart = currentDigitAnswers.slice(integerBoxesCount).join('');
         // Ensure some integer part is present if decimal exists, e.g., ".5" becomes "0.5" for parsing
        const displayIntegerPart = integerPart === '' ? '0' : integerPart;
        userAnswerString = `${displayIntegerPart}.${decimalPart}`;
    } else {
         // Remove leading zeros unless it's just '0'
        const integerPart = currentDigitAnswers.join('');
        userAnswerString = integerPart.replace(/^0+/, '') || (integerPart === '' ? '0' : integerPart);
    }

    const userNumericAnswer = parseFloat(userAnswerString);

     // Check if *any* digit box has content, even if it doesn't form a valid number yet.
     // This distinguishes 'no input' from 'invalid input'.
    const hasAnyInput = currentDigitAnswers.some(d => d !== null && d.trim() !== "");
    const hasValidNumericInput = !isNaN(userNumericAnswer);


    // Check correctness *only* if there was valid numeric input
    const isCorrectAtTimeout = hasValidNumericInput && checkAnswer(currentProblem, userNumericAnswer);

    // Increment attempt count (the timeout/exhaustion counts as an attempt)
    // Increment first, then check if attempts are exhausted by this increment.
    const newAttempts = currentAttempts + 1;
    // setCurrentAttempts will be called below based on outcome, but we use newAttempts for logic here.

    const attemptsExhaustedNow = settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts;
    const problemIndexToUpdate = actualActiveProblemIndexBeforeViewingPrevious; // Update history for the active problem

    // 2. Determine Outcome and Update State/History

    if (isCorrectAtTimeout) {
        // Case 1: User had the correct answer entered when time/attempts ran out
        console.log(`Problem ${currentProblemIndex}: Correct answer entered just in time!`);

        setFeedbackMessage(t('exercises.correct'));
        setFeedbackColor("green");
         // Set attempts *after* successful attempt (optional, but keeps count consistent)
         setCurrentAttempts(newAttempts);

        // Update history as correct for the current active problem index
        const newHistoryEntry: UserAnswerType = {
            problemId: currentProblem.id,
            problem: currentProblem,
            userAnswer: userNumericAnswer,
            isCorrect: true,
            status: 'answered' // Mark as answered successfully
        };
        setUserAnswersHistory(prev => {
            const newHistory = [...prev];
            newHistory[problemIndexToUpdate] = newHistoryEntry;
            return newHistory;
        });

        // Update streaks and handle level up/rewards
        const newConsecutive = consecutiveCorrectAnswers + 1;
        setConsecutiveCorrectAnswers(newConsecutive);
        setConsecutiveIncorrectAnswers(0); // Reset incorrect streak on correct answer

        // Level up logic (copied from checkCurrentAnswer for consistency)
        if (newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP && settings.enableAdaptiveDifficulty) {
             const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
             const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
             if (currentLevelIdx < difficultiesOrder.length - 1) {
                 const newLevel = difficultiesOrder[currentLevelIdx + 1];
                 setAdaptiveDifficulty(newLevel);
                 // Update global settings via context
                 updateModuleSettings("addition", { difficulty: newLevel, enableAdaptiveDifficulty: true });
                 setConsecutiveCorrectAnswers(0); // Reset streak after level up
                 setShowLevelUpReward(true); // Show level up UI
                 setBlockAutoAdvance(true); // Block automatic advance until level up UI is dismissed
                 eventBus.emit('levelUp', { previousLevel: adaptiveDifficulty, newLevel }); // Emit event for handlers
             }
         }

         // Rewards logic (copied from checkCurrentAnswer)
         if (settings.enableRewards) {
             const rewardContext = { streak: newConsecutive, difficulty: adaptiveDifficulty, problemIndex: problemIndexToUpdate, totalProblems: problemsList.length };
             if (Math.random() < getRewardProbability(rewardContext as any)) {
                 awardReward('correct_addition_problem' as any, { module: 'addition', level: adaptiveDifficulty }); // Use a specific reward ID
                 setShowRewardAnimation(true); // Show reward animation
             }
         }

        // Set waiting state and handle auto-continue
        setWaitingForContinue(true);
        // Auto-continue if enabled and not blocked by level up etc.
        if (autoContinue && !blockAutoAdvance) {
           if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
           autoContinueTimerRef.current = setTimeout(() => {
             // Re-check blockAutoAdvance before continuing, as it might have changed
             if (!blockAutoAdvance) {
               handleContinue();
               autoContinueTimerRef.current = null;
             }
           }, 3000); // Give user a moment to see "Correct"
        }

    } else {
        // Case 2: User did NOT have the correct or valid answer entered when time/attempts ran out

        // Set attempts *after* failed attempt
        setCurrentAttempts(newAttempts); // Update state

        // Determine feedback based on input validity and attempts
        let feedbackMsg = '';
        let feedbackClr: "green" | "red" | "blue" = "red"; // Default color for incorrect path

        if (!hasAnyInput) {
             feedbackMsg = t('Answer Not Provided');
             feedbackClr = "blue";
             // Note: attempt was already incremented, which is intended even for blank input on timeout.
        } else if (!hasValidNumericInput) {
            feedbackMsg = t('exercises.invalidAnswerFormat');
            feedbackClr = "red";
        } else { // Valid numeric input but incorrect
             feedbackMsg = t('exercises.incorrect');
             feedbackClr = "red";
        }


        // Update history entry as incorrect (status depends on whether attempts are exhausted)
         const newHistoryEntry: UserAnswerType = {
             problemId: currentProblem.id,
             problem: currentProblem,
             userAnswer: hasValidNumericInput ? userNumericAnswer : NaN, // Store NaN if input wasn't numeric
             isCorrect: false,
             status: attemptsExhaustedNow || !hasAnyInput || !hasValidNumericInput || settings.showAnswerWithExplanation ? 'revealed' : 'attempted' // Reveal if attempts exhausted, or if no/invalid input, or setting is on
         };

         setUserAnswersHistory(prev => {
             const newHistory = [...prev];
             newHistory[problemIndexToUpdate] = newHistoryEntry;
             return newHistory;
         });

        // Update incorrect streak and handle difficulty decrease
        const newConsecutiveInc = consecutiveIncorrectAnswers + 1;
        setConsecutiveIncorrectAnswers(newConsecutiveInc);
        setConsecutiveCorrectAnswers(0); // Reset correct streak on incorrect answer

        // Adaptive difficulty decrease logic (copied from checkCurrentAnswer)
        if (settings.enableAdaptiveDifficulty && newConsecutiveInc >= 5) { // Threshold for decreasing difficulty
           const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
           const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
           if (currentLevelIdx > 0) { // Can't go below 'beginner'
               const newLevel = difficultiesOrder[currentLevelIdx - 1];
               setAdaptiveDifficulty(newLevel);
               // Update global settings via context
               updateModuleSettings("addition", { difficulty: newLevel, enableAdaptiveDifficulty: true });
               setConsecutiveIncorrectAnswers(0); // Reset incorrect streak after difficulty change
               // Add feedback indicating difficulty decrease
               feedbackMsg = `${t('adaptiveDifficulty.levelDecreased', { level: newLevel })}. ${feedbackMsg}`; // Prepend difficulty message
           }
        }

        // Final feedback message and state based on attempts/time
        if (attemptsExhaustedNow || !hasAnyInput || !hasValidNumericInput || settings.showAnswerWithExplanation) {
            // If attempts are exhausted, or input was invalid/empty, or answer reveal is forced by setting
            setFeedbackMessage(`${feedbackMsg}. ${t('exercises.correctAnswerIs')} ${currentProblem.correctAnswer}.`); // Add correct answer to feedback
            setFeedbackColor("red"); // Final color is red for incorrect outcome
            setWaitingForContinue(true); // Wait for user to click continue
            // Timer is already cleared at the start of function.
        } else {
             // If time ran out, but attempts are NOT exhausted and input was valid but incorrect
             setFeedbackMessage(`${feedbackMsg}. Time's up for this attempt. Attempts: ${newAttempts}/${settings.maxAttempts}`);
             setFeedbackColor("red");
             // Restart the timer for the next attempt if any
             setProblemTimerValue(settings.timeValue);
             // Don't set waitingForContinue here, user can continue typing for the next attempt.
        }
        // Note: digitAnswers are not cleared in case of incorrect answer to allow correction.
    }
    // The index actualActiveProblemIndexBeforeViewingPrevious is already set correctly by advanceToNextActiveProblem
    // or initialize, so no need to set it here.
};


const completeExercise = () => {
setExerciseCompleted(true);
if (generalTimerRef.current) clearInterval(generalTimerRef.current);
if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); // Clear auto-continue timer on completion
const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;
saveExerciseResult({
operationId: "addition",
date: new Date().toISOString(),
score: correctCount,
totalProblems: problemsList.length,
timeSpent: timer,
difficulty: (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty) as string,
});
};

const handleDigitBoxClick = (index: number) => {
if (waitingForContinue || exerciseCompleted || viewingPrevious || showLevelUpReward) return; // Prevent interaction when blocked
if (!exerciseStarted) startExercise();
if (currentProblem) {
// Determine input direction based on which side of the decimal point (or middle for no decimal) is clicked
const integerDigitsCount = currentProblem.answerMaxDigits - (currentProblem.answerDecimalPosition || 0);
setInputDirection(index < integerDigitsCount ? 'rtl' : 'ltr'); // Integer part is RTL, decimal part is LTR
}
setFocusedDigitIndex(index);
};

const handleDigitInput = (value: string) => { // For on-screen keyboard
if (waitingForContinue || focusedDigitIndex === null || !currentProblem || exerciseCompleted || viewingPrevious || showLevelUpReward) return; // Prevent interaction when blocked
if (!exerciseStarted) startExercise();

let newAnswers = [...digitAnswers]; // Get current state
let currentFocus = focusedDigitIndex;
const maxDigits = currentProblem.answerMaxDigits;

if (value === "backspace") {
  newAnswers[currentFocus] = "";
  // Move focus back on backspace in RTL mode, stay in LTR mode
  // if (inputDirection === 'rtl') { // Keep previous logic or change? Let's keep for consistency with physical keyboard below
  //     if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1); // Move right in RTL == move back visually
  // }
   // Decide desired behavior: Does backspace move the cursor?
   // Common behavior for text fields: Backspace deletes character before cursor and moves cursor back.
   // For digit boxes: Easier might be: Backspace deletes current digit, cursor stays. Or, Backspace deletes current, moves back.
   // Let's implement: Backspace deletes current, moves *back* in the *current input direction*.
   if (inputDirection === 'rtl') { // In RTL, 'back' is towards higher index
        if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1);
   } else { // In LTR, 'back' is towards lower index
        if (currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
   }

} else if (/[0-9]/.test(value)) {
  newAnswers[currentFocus] = value;
  // Move focus forward after entering a digit
  if (inputDirection === 'rtl') {
    if (currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
  } else { // ltr
    if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1);
  }
}
setDigitAnswers(newAnswers); // Update state (and ref via useEffect)

};

// Listener para teclado físico
useEffect(() => {
const handlePhysicalKeyDown = (event: KeyboardEvent) => {
if (focusedDigitIndex === null || waitingForContinue || exerciseCompleted || viewingPrevious || showLevelUpReward) return;

const key = event.key;
const maxDigits = currentProblem?.answerMaxDigits || 0; // Ensure currentProblem exists

    if (key >= '0' && key <= '9') {
        if (!currentProblem) return; // Defensive check
        let newAnswers = [...digitAnswers]; // Use current state
        newAnswers[focusedDigitIndex] = key;
        setDigitAnswers(newAnswers); // Update state (and ref)
        // Move focus after the input based on input direction
        if (inputDirection === 'rtl') {
            if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
        } else {
            if (focusedDigitIndex < maxDigits - 1) setFocusedDigitIndex(focusedDigitIndex + 1);
        }
        event.preventDefault();
    } else if (key === 'Backspace') {
        if (!currentProblem) return; // Defensive check
        let newAnswers = [...digitAnswers];
        // Physical keyboard backspace behavior: Delete current character, move cursor back.
        // Let's implement this: If current box is empty, move cursor back first (in LTR), or forward (in RTL).
        // Then delete the content at the *new* position if it was empty before moving.
        // This is complex. Simpler: Delete current, cursor moves back (visually, in LTR).
        // Let's stick to the simpler Backspace: just delete current box content. User uses arrows to move.
        // Or: Delete current box content, move focus 'backward' based on current input direction.
         newAnswers[focusedDigitIndex] = "";
         setDigitAnswers(newAnswers); // Update state (and ref)

         // Move focus backward according to input direction
         if (inputDirection === 'rtl') { // In RTL, 'back' is towards higher index
            if (focusedDigitIndex < maxDigits - 1) setFocusedDigitIndex(focusedDigitIndex + 1);
         } else { // In LTR, 'back' is towards lower index
            if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
         }

        event.preventDefault();
    } else if (key === 'Enter') {
        checkCurrentAnswer();
        event.preventDefault();
    } else if (key === 'ArrowLeft') {
         // Move focus left regardless of inputDirection
        if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
        // Optional: setInputDirection('ltr'); if left arrow implies LTR
        event.preventDefault();
    } else if (key === 'ArrowRight') {
         // Move focus right regardless of inputDirection
        if (focusedDigitIndex < maxDigits - 1) {
            setFocusedDigitIndex(focusedDigitIndex + 1);
            // Optional: setInputDirection('ltr');
        }
        event.preventDefault();
    }
};
document.addEventListener('keydown', handlePhysicalKeyDown);
return () => document.removeEventListener('keydown', handlePhysicalKeyDown);
}, [focusedDigitIndex, waitingForContinue, exerciseCompleted, currentProblem, digitAnswers, inputDirection, viewingPrevious, showLevelUpReward, actualActiveProblemIndexBeforeViewingPrevious]); // Added digitAnswers to dependency to ensure reading latest state in effects


// MODIFICADA para usar digitAnswersRef
const checkCurrentAnswer = () => {
if (!currentProblem || waitingForContinue || exerciseCompleted || viewingPrevious || showLevelUpReward) return; // Prevent checking when blocked

// If the exercise hasn't started, just start it and exit. Don't count this as an attempt yet.
// The user will need to click check again or type for the first attempt.
if (!exerciseStarted) {
  startExercise();
  return;
}

// Use the REF to get the absolute latest digit answers
const currentDigitAnswers = digitAnswersRef.current;

 // Check if the input resulted in a valid number, UNLESS the boxes are all empty.
 // If boxes are empty, user didn't attempt to answer. If they have content but parseFloat results in NaN, it's invalid.
const hasAnyInput = currentDigitAnswers.some(d => d !== null && d.trim() !== "");

// Only increment attempt count if there was any input to check
if (!hasAnyInput) {
     setFeedbackMessage(t('Please Respond To Validate The Answer'));
     setFeedbackColor("blue");
     // Don't increment attempts for empty answers
     return;
}

// Increment attempt count regardless of correctness for manual checks *with input*
const newAttempts = currentAttempts + 1;
setCurrentAttempts(newAttempts); // Update state immediately


// 1. Construct user answer from current digitAnswers from REF
let userAnswerString = "";
const decPosInAnswer = currentProblem.answerDecimalPosition;
const totalDigitBoxes = currentProblem.answerMaxDigits;
const integerBoxesCount = totalDigitBoxes - (decPosInAnswer || 0);

if (decPosInAnswer !== undefined && decPosInAnswer > 0) {
    const integerPart = currentDigitAnswers.slice(0, integerBoxesCount).join('');
    const decimalPart = currentDigitAnswers.slice(integerBoxesCount).join('');
     // Ensure some integer part is present if decimal exists, e.g., ".5" becomes "0.5" for parsing
    const displayIntegerPart = integerPart === '' ? '0' : integerPart;
    userAnswerString = `${displayIntegerPart}.${decimalPart}`;
} else {
     // Remove leading zeros unless it's just '0'
    const integerPart = currentDigitAnswers.join('');
    userAnswerString = integerPart.replace(/^0+/, '') || (integerPart === '' ? '0' : integerPart);
}


const userNumericAnswer = parseFloat(userAnswerString);
const hasValidNumericInput = !isNaN(userNumericAnswer);

const isCorrect = hasValidNumericInput && checkAnswer(currentProblem, userNumericAnswer); // Check only if it's a valid number

// Always update history for a manual check if there was any input
const problemIndexForHistory = actualActiveProblemIndexBeforeViewingPrevious;
const attemptsExhaustedNow = settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts;

const newHistoryEntry: UserAnswerType = {
    problemId: currentProblem.id,
    problem: currentProblem,
    userAnswer: hasValidNumericInput ? userNumericAnswer : NaN, // Store NaN if input wasn't numeric
    isCorrect,
    status: isCorrect ? 'answered' : (attemptsExhaustedNow || !hasValidNumericInput || settings.showAnswerWithExplanation ? 'revealed' : 'attempted') // Status based on outcome/attempts, reveal if needed
};
setUserAnswersHistory(prev => {
    const newHistory = [...prev];
    newHistory[problemIndexForHistory] = newHistoryEntry;
    return newHistory;
});


if (isCorrect) {
  setFeedbackMessage(t('exercises.correct'));
  setFeedbackColor("green");
  const newConsecutive = consecutiveCorrectAnswers + 1;
  setConsecutiveCorrectAnswers(newConsecutive);
  setConsecutiveIncorrectAnswers(0);

  // Level up logic
  if (newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP && settings.enableAdaptiveDifficulty) {
      const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
      const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
      if (currentLevelIdx < difficultiesOrder.length - 1) {
          const newLevel = difficultiesOrder[currentLevelIdx + 1];
          setAdaptiveDifficulty(newLevel);
          
          // Guardar configuración inmediatamente en el contexto y localStorage
          console.log(`[ADDITION] Guardando configuración de dificultad inmediatamente:`, newLevel);
          console.log(`[ADDITION] También actualizado localStorage con difficulty:`, newLevel);
          updateModuleSettings("addition", { difficulty: newLevel, enableAdaptiveDifficulty: true });
          
          setConsecutiveCorrectAnswers(0);
          setShowLevelUpReward(true);
          setBlockAutoAdvance(true); // Block advance until modal is dismissed
          eventBus.emit('levelUp', { previousLevel: adaptiveDifficulty, newLevel });
      }
  }

  // Rewards logic
  if (settings.enableRewards) {
      const rewardContext = { streak: newConsecutive, difficulty: adaptiveDifficulty, problemIndex: problemIndexForHistory, totalProblems: problemsList.length };
      if (Math.random() < getRewardProbability(rewardContext as any)) {
          awardReward('correct_addition_problem' as any, { module: 'addition', level: adaptiveDifficulty });
          setShowRewardAnimation(true);
      }
  }

  setWaitingForContinue(true); // Wait for continue on correct answer
  if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); // Stop timer on correct answer

  // Auto-continue if enabled and not blocked
  if (autoContinue && !blockAutoAdvance) {
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    autoContinueTimerRef.current = setTimeout(() => {
       if (!blockAutoAdvance) { // Check again before executing
           handleContinue();
           autoContinueTimerRef.current = null;
       }
    }, 3000); // Give feedback time to show
  }

} else { // Incorrect (or invalid format)
    // Determine feedback based on input validity and attempts
    let feedbackMsg = '';
    let feedbackClr: "green" | "red" | "blue" = "red"; // Default color for incorrect path

    if (!hasValidNumericInput) {
        feedbackMsg = t('exercises.invalidAnswerFormat');
        feedbackClr = "red";
    } else { // Valid numeric input but incorrect
        feedbackMsg = t('exercises.incorrect');
        feedbackClr = "red";
    }

    setFeedbackMessage(feedbackMsg);
    setFeedbackColor(feedbackClr);

    const newConsecutiveInc = consecutiveIncorrectAnswers + 1;
    setConsecutiveIncorrectAnswers(newConsecutiveInc);
    setConsecutiveCorrectAnswers(0);

    // Adaptive difficulty decrease logic
    if (settings.enableAdaptiveDifficulty && newConsecutiveInc >= 5) {
        const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
        const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
        if (currentLevelIdx > 0) {
            const newLevel = difficultiesOrder[currentLevelIdx - 1];
            setAdaptiveDifficulty(newLevel);
            updateModuleSettings("addition", { difficulty: newLevel, enableAdaptiveDifficulty: true });
            setConsecutiveIncorrectAnswers(0); // Reset incorrect streak after difficulty change
            // Update feedback message
            setFeedbackMessage(`${t('adaptiveDifficulty.levelDecreased', { level: newLevel })}. ${feedbackMsg}`);
            setFeedbackColor("red"); // Ensure color is red
        }
    }

    // Handle attempts exhaustion
    if (attemptsExhaustedNow || !hasValidNumericInput || settings.showAnswerWithExplanation) { // Also reveal if invalid input or setting forces it
        // If attempts are exhausted, or input was invalid, or answer reveal is forced by setting
        setFeedbackMessage(`${feedbackMessage}. ${t('exercises.correctAnswerIs')} ${currentProblem.correctAnswer}.`); // Append correct answer
        setFeedbackColor("red"); // Final color is red for incorrect outcome
        setWaitingForContinue(true); // Wait for user to click continue
        if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); // Stop timer if it was running
    }
    // Note: If incorrect but attempts NOT exhausted, the timer continues and user can keep trying.
    // digitAnswers are not cleared to allow correction.
}
// Update actualActiveProblemIndexBeforeViewingPrevious to currentProblemIndex after checking
// This is important because checkCurrentAnswer operates on the currentProblemIndex
// setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex); // This should already be the case when checkCurrentAnswer is called
};


const handleContinue = () => {
// Clear any pending auto-continue timer
if (autoContinueTimerRef.current) {
  clearTimeout(autoContinueTimerRef.current);
  autoContinueTimerRef.current = null;
}

setWaitingForContinue(false);
setFeedbackMessage(null);
setFeedbackColor(null); // Clear feedback color too

if (showLevelUpReward) {
// If a level up occurred, dismiss the reward UI and generate a new problem for the current spot with the new difficulty.
setShowLevelUpReward(false);
setBlockAutoAdvance(false); // Unblock advance
// The problem at actualActiveProblemIndexBeforeViewingPrevious needs to be replaced.
const problemIndexToRegenerate = actualActiveProblemIndexBeforeViewingPrevious;
const newProblemForLevelUp = generateAdditionProblem(adaptiveDifficulty); // Generate with the new level
const updatedProblemsList = [...problemsList];
updatedProblemsList[problemIndexToRegenerate] = newProblemForLevelUp; // Replace the problem in the list
setProblemsList(updatedProblemsList);
// Now update currentProblem and currentProblemIndex to this new problem.
setCurrentProblemIndex(problemIndexToRegenerate); // Stay on the same index logically
setCurrentProblem(newProblemForLevelUp); // This triggers useEffect to reset state etc.
// History for the replaced problem is effectively marked as revealed (or whatever status it had) in userAnswersHistory.
// The new problem starts fresh at that index.

} else if (!blockAutoAdvance) { // Proceed normally if not blocked
// Advance to the next problem. This will update currentProblemIndex and currentProblem,
// triggering useEffect to reset state for the new problem.
advanceToNextActiveProblem();
}
// If blockAutoAdvance was true but it wasn't a level-up dismissal, we just stay on the same problem
// (e.g., after showing answer manually). handleContinue was triggered by waitingForContinue,
// but the next step (advance) is blocked. The user needs to start a new exercise or dismiss the block manually if implemented.
// The current logic for blockAutoAdvance is tied to showLevelUpReward.
};


// --- RENDERIZADO ---
if (!currentProblem && problemsList.length === 0 && !exerciseCompleted) {
// Initial loading state
return <div className="p-8 text-center">{t('common.loadingProblems')}...</div>;
}
if (!currentProblem && !exerciseCompleted && problemsList.length > 0) {
// Fallback: If currentProblem is null but problems exist, attempt to load the active one.
// This might happen on initial load or state inconsistencies.
useEffect(() => {
  if(!currentProblem && problemsList.length > 0) {
      const problemToLoad = problemsList[actualActiveProblemIndexBeforeViewingPrevious] || problemsList[0];
      setCurrentProblemIndex(actualActiveProblemIndexBeforeViewingPrevious); // Ensure index matches
      setCurrentProblem(problemToLoad); // This should trigger normal problem setup effects
  }
}, [currentProblem, problemsList, actualActiveProblemIndexBeforeViewingPrevious]); // Dependencies needed
return <div className="p-8 text-center">{t('common.reloadingProblem')}...</div>; // Show reloading message
}
if (exerciseCompleted) {
const finalScore = userAnswersHistory.filter(a => a && a.isCorrect).length;
return (
<div className="px-4 py-5 sm:p-6 text-center">
<Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
<h2 className="text-2xl font-bold text-gray-900">{t('exercises.exerciseCompletedExcl')}</h2>
<p className="text-gray-700 mt-2">{t('exercises.yourScoreIs')} {finalScore}/{problemsList.length}</p>
<p className="text-gray-600">{t('exercises.timeTaken')}: {formatTime(timer)}</p>
<div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
<Button onClick={generateNewProblemSet} className="w-full sm:w-auto">
{t('exercises.tryAgain')}
</Button>
<Button variant="outline" onClick={onOpenSettings} className="w-full sm:w-auto">
<Cog className="mr-2 h-4 w-4" />
{t('common.settings')}
</Button>
</div>
</div>
);
}
// Fallback final if currentProblem is still null and not completed state
if (!currentProblem) return <div className="p-8 text-center">{t('common.errorLoadingProblem')}</div>;


const { maxIntLength = 0, maxDecLength = 0, operandsFormatted = [], sumLineTotalCharWidth = 0 } =
currentProblem.layout === 'vertical'
? getVerticalAlignmentInfo(currentProblem.operands, currentProblem.answerDecimalPosition)
: { operandsFormatted: currentProblem.operands.map(op => ({original: op, intStr: String(op), decStr: ""})), maxIntLength:0, maxDecLength:0, sumLineTotalCharWidth:0 };

// The progress should ideally reflect completion, not just attempts.
// Let's calculate progress based on problems marked as correct or revealed (implicitly completed for review)
const completedProblemsCount = userAnswersHistory.filter(a => a && (a.isCorrect || a.status === 'revealed')).length;
const progressValue = problemsList.length > 0 ? (completedProblemsCount / problemsList.length) * 100 : 0;
const score = userAnswersHistory.filter(a => a && a.isCorrect).length;

return (
<div className="relative">
{/* Level Up & Reward Animations */}
<LevelUpHandler />
<RewardAnimation />

{/* Level Up Modal Overlay */}
{showLevelUpReward && (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <Trophy className="h-20 w-20 sm:h-24 sm:w-24 text-yellow-400 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('levelUp.title')}</h3>
        <p className="text-lg sm:text-xl mb-4 sm:mb-6">{t('levelUp.message', { level: adaptiveDifficulty })}</p>
        <Button onClick={handleContinue} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg py-2.5 sm:py-3">
          {t('levelUp.continueChallenge')}
        </Button>
      </div>
    </div>
  )}

  <div className={`px-2 py-3 sm:px-4 sm:py-5 rounded-xl shadow-lg ${ adaptiveDifficulty === "beginner" ? "bg-sky-50 border-sky-200" : adaptiveDifficulty === "elementary" ? "bg-green-50 border-green-200" : adaptiveDifficulty === "intermediate" ? "bg-yellow-50 border-yellow-200" : adaptiveDifficulty === "advanced" ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200" } border-2`}>
    <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Addition</h2>
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="font-medium text-gray-700 flex items-center"><Info className="h-4 w-4 mr-1 opacity-70"/>{formatTime(timer)}</span>
            {/* Show problem timer only when active, timer is enabled, and not waiting/completed/blocked */}
            {settings.timeValue > 0 && !viewingPrevious && !waitingForContinue && !exerciseCompleted && !showLevelUpReward && (
                <span className={`font-medium p-1 rounded ${problemTimerValue <= 5 && problemTimerValue > 0 ? "text-red-600 animate-pulse bg-red-100" : "text-gray-700 bg-gray-100"}`}>P: {problemTimerValue}s</span>
            )}
             {/* Show attempts only when active, attempts are limited, and not waiting/completed/blocked */}
             {settings.maxAttempts > 0 && !viewingPrevious && !waitingForContinue && !exerciseCompleted && !showLevelUpReward && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`font-medium p-1 rounded ${currentAttempts > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                      Attempts: {currentAttempts}/{settings.maxAttempts}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('tooltips.maxAttemptsPerProblem')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold capitalize">
                Level: {settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty}
            </span>
            <Button variant="default" onClick={onOpenSettings} className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white">
              <Cog className="h-4 w-4" /> Settings
            </Button>
        </div>
    </div>
     {/* Progress Bar shows completion of problem list */}
    <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1" />
    <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
        <span>Problem {currentProblemIndex + 1} of {problemsList.length}</span>
        <span className="font-semibold">Score: {score}</span>
    </div>

    <div className={`p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 shadow-md bg-white min-h-[150px] sm:min-h-[180px] flex flex-col items-center justify-center`}>
      {/* Problem Display (Horizontal or Vertical) */}
      {currentProblem.layout === 'horizontal' ? (
        <div className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          <span>{currentProblem.operands[0]}</span>
          <span className="text-gray-600 mx-1">+</span>
          <span>{currentProblem.operands.length > 1 ? currentProblem.operands[1] : '?'}</span> {/* Handle case with one operand */}
          <span className="text-gray-600 mx-1">=</span>
        </div>
      ) : (
        <div className="inline-block text-right my-1 sm:my-2">
          {operandsFormatted.map((op, index) => (
            <div key={`op-${index}-${currentProblem.id}`} className={verticalOperandStyle}>
              {index === operandsFormatted.length -1 && operandsFormatted.length > 1 && <span className={plusSignVerticalStyle}>+</span>}
              <span>{op.intStr}</span>
              {maxDecLength > 0 && (
                <>
                  <span className="opacity-60">.</span>
                  <span>{op.decStr}</span>
                </>
              )}
            </div>
          ))}
          <div
            className={sumLineStyle}
            // Adjust the width of the sum line based on calculated width
            style={{width: `${Math.max(5, sumLineTotalCharWidth + 2)}ch`, marginLeft: 'auto', marginRight: '0'}} // Use 'ch' for character-based width
          />
        </div>
      )}

      {/* Answer Input Boxes */}
      <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
        {Array(currentProblem.answerMaxDigits).fill(0).map((_, index) => {
          const integerDigitsCount = currentProblem.answerMaxDigits - (currentProblem.answerDecimalPosition || 0);
          const isVisualDecimalPointAfterThisBox = currentProblem.answerDecimalPosition !== undefined &&
                                                   currentProblem.answerDecimalPosition > 0 &&
                                                   index === integerDigitsCount - 1;

          return (
            <React.Fragment key={`digit-box-frag-${index}-${currentProblem.id}`}>
              <div
                ref={el => digitBoxRefs.current[index] = el}
                tabIndex={-1} // Make it focusable but not part of tab flow
                className={`${digitBoxBaseStyle}
                            ${viewingPrevious || waitingForContinue || exerciseCompleted || showLevelUpReward ? digitBoxDisabledStyle : (focusedDigitIndex === index ? digitBoxFocusStyle : digitBoxBlurStyle)}
                            ${!(viewingPrevious || waitingForContinue || exerciseCompleted || showLevelUpReward) ? 'cursor-text hover:border-gray-400' : ''}`}
                onClick={() => !(viewingPrevious || waitingForContinue || exerciseCompleted || showLevelUpReward) && handleDigitBoxClick(index)}
                onFocus={() => !viewingPrevious && !waitingForContinue && !exerciseCompleted && !showLevelUpReward && setFocusedDigitIndex(index)} // Set focus on actual focus event
                onBlur={() => setFocusedDigitIndex(null)} // Remove focus when not active element
              >
                {digitAnswers[index] || <span className="opacity-0">0</span>} {/* Display empty or a placeholder */}
              </div>
              {isVisualDecimalPointAfterThisBox && (
                <div className="text-2xl sm:text-3xl font-bold mx-0.5 sm:mx-1 opacity-80 self-center pt-1 select-none">.</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
       {/* Feedback Message */}
      {feedbackMessage && (viewingPrevious || (!viewingPrevious && (currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious || exerciseCompleted || waitingForContinue))) && (
        <div className={`mt-2 sm:mt-3 text-center font-medium text-sm sm:text-base ${feedbackColor === "green" ? "text-green-600" : feedbackColor === "blue" ? "text-blue-700" : "text-red-600"}`}>
          {feedbackMessage}
        </div>
      )}
    </div>

    {/* On-screen Number Pad */}
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-xs mx-auto">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"].map((key, idx) => (
        <Button
          key={key || `empty-key-${idx}`}
          variant="outline"
          className={`text-lg sm:text-xl h-11 sm:h-12 ${key === "" ? "invisible pointer-events-none" : "bg-white hover:bg-gray-50 shadow-sm active:bg-gray-100"}`}
          onClick={() => !(viewingPrevious || waitingForContinue || exerciseCompleted || showLevelUpReward) && key && key !== "" && handleDigitInput(key)}
          disabled={waitingForContinue || exerciseCompleted || viewingPrevious || key === "" || showLevelUpReward} // Disable button when blocked
        >
          {key === "backspace" ? <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" /> : key}
        </Button>
      ))}
    </div>

    {/* Navigation and Action Buttons */}
    <div className="mt-4 sm:mt-6 flex justify-between items-center">
       {/* Previous Button */}
      <Button
        variant="outline" size="sm"
        disabled={(viewingPrevious ? currentProblemIndex === 0 : actualActiveProblemIndexBeforeViewingPrevious === 0 && !viewingPrevious) || exerciseCompleted || showLevelUpReward}
        onClick={moveToPreviousProblem}
        className="text-xs sm:text-sm"
      >
        <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {t('common.prev')}
      </Button>

      {/* Central Action Button (Return, Continue, Check, Start) */}
      {viewingPrevious ? (
        <Button onClick={returnToActiveProblem} className="px-4 sm:px-5 text-sm sm:text-base bg-orange-500 hover:bg-orange-600 text-white">
            <RotateCcw className="mr-1 h-4 w-4" /> {t('common.returnToActive')}
        </Button>
      ) : waitingForContinue ? (
         <Button
            onClick={handleContinue}
            disabled={exerciseCompleted || showLevelUpReward} // Can't continue if exercise finished or level up is showing
            className="px-5 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg animate-pulse bg-green-500 hover:bg-green-600 text-white flex items-center justify-between w-full max-w-xs mx-auto"
         >
            <span className="flex-grow text-center font-medium">Continue</span>
            {/* Auto-continue Toggle */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="ml-3 flex items-center bg-black/20 py-1 px-2 rounded-md cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent clicking the main button
                      setAutoContinue(prev => !prev);
                    }}
                  >
                    <div className="h-4 w-4 border border-white rounded-sm flex items-center justify-center mr-1.5">
                      {autoContinue && <div className="h-2 w-2 bg-white rounded-sm"></div>}
                    </div>
                    <span className="text-xs font-medium">Auto</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('tooltips.autoContinue')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </Button>
      ) : (
        <Button
            onClick={checkCurrentAnswer}
            disabled={exerciseCompleted || viewingPrevious || showLevelUpReward} // Disable check when blocked
            className="px-5 sm:px-6 text-sm sm:text-base bg-blue-500 hover:bg-blue-600 text-white"
        >
          {!exerciseStarted ? t('exercises.start') : <><Check className="mr-1 h-4 w-4" />{t('exercises.check')}</>}
        </Button>
      )}

       {/* Show Answer Button */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
                variant="outline" size="sm"
                disabled={(!settings.showAnswerWithExplanation && !viewingPrevious) || viewingPrevious || exerciseCompleted || waitingForContinue || showLevelUpReward} // Disable when blocked or no setting
                onClick={() => {
                    if(currentProblem && !viewingPrevious && !exerciseCompleted && !waitingForContinue && !showLevelUpReward && settings.showAnswerWithExplanation) {
                        if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current); // Stop timer
                        setFeedbackMessage(`${t('exercises.correctAnswerIs')} ${currentProblem.correctAnswer}`);
                        setFeedbackColor("blue");
                        setWaitingForContinue(true); // Wait for continue after showing answer
                        const problemIdxForHistory = actualActiveProblemIndexBeforeViewingPrevious; // Use the active index
                        // Mark history entry as revealed
                        setUserAnswersHistory(prev => {
                           const newHistory = [...prev];
                           // If there was a previous attempt recorded, update it. Otherwise create a new minimal entry.
                           const existingEntry = newHistory[problemIdxForHistory];

                           // Reconstruct current answer from REF just for history if needed
                            const currentDigitAnswers = digitAnswersRef.current;
                            let userAnswerStringForHistory = "";
                            const decPosInAnswer = currentProblem.answerDecimalPosition;
                            const totalDigitBoxes = currentProblem.answerMaxDigits;
                            const integerBoxesCount = totalDigitBoxes - (decPosInAnswer || 0);

                            if (decPosInAnswer !== undefined && decPosInAnswer > 0) {
                                const integerPart = currentDigitAnswers.slice(0, integerBoxesCount).join('');
                                const decimalPart = currentDigitAnswers.slice(integerBoxesCount).join('');
                                const displayIntegerPart = integerPart === '' ? '0' : integerPart;
                                userAnswerStringForHistory = `${displayIntegerPart}.${decimalPart}`;
                            } else {
                                const integerPart = currentDigitAnswers.join('');
                                userAnswerStringForHistory = integerPart.replace(/^0+/, '') || (integerPart === '' ? '0' : integerPart);
                            }
                            const userNumericAnswerForHistory = parseFloat(userAnswerStringForHistory);


                           newHistory[problemIdxForHistory] = {
                               ...existingEntry, // Keep any existing data like problemId, problem etc.
                               problemId: currentProblem.id, // Ensure problem ID is set
                               problem: currentProblem, // Ensure problem data is linked
                               userAnswer: isNaN(userNumericAnswerForHistory) ? NaN : userNumericAnswerForHistory, // Keep current partial input if any, stored as NaN if invalid
                               isCorrect: false, // It wasn't answered correctly by the user
                               status: 'revealed' // Mark as revealed
                           };
                           return newHistory;
                       });
                         // No attempt count increment here, it's a reveal/skip.
                    }
                }}
                className="text-xs sm:text-sm"
            >
                <Info className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {t('exercises.showAnswer')}
            </Button>
          </TooltipTrigger>
          {(!settings.showAnswerWithExplanation && !viewingPrevious) && (
              <TooltipContent><p>{t('tooltips.activateShowAnswerInSettings')}</p></TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</div>

);
}