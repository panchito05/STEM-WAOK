
                // ========================================================================================
                // DEPENDENCIAS EXTERNAS ASUMIDAS
                // Para que este código funcione, se requieren los siguientes componentes, hooks y utilidades
                // de tu entorno de aplicación (ej: un framework como Next.js, un sistema de diseño, etc.):
                //
                // 1. React y hooks: Ya importados (useState, useEffect, useRef, useCallback, useMemo)
                // 2. Componentes UI: Button, Input, Label, Switch, RadioGroup, RadioGroupItem, Slider,
                //    Progress (renombrado a ProgressBarUI), Tooltip, TooltipTrigger, TooltipContent,
                //    TooltipProvider. (Probablemente de una librería como Shadcn UI).
                // 3. Contextos/Hooks de la aplicación:
                //    - useProgress (maneja el progreso del usuario)
                //    - useSettings (maneja la configuración del módulo y del usuario)
                //    - useTranslations (hook de i18n/l10n)
                //    - useRewardsStore, awardReward, getRewardProbability (sistema de recompensas)
                // 4. Utilidades:
                //    - debounce (función para limitar la frecuencia de llamadas)
                //    - formatTime (función para formatear segundos a MM:SS)
                //    - eventBus (sistema de eventos simple, ej: para notificar level up)
                //    - CORRECT_ANSWERS_FOR_LEVEL_UP (constante del sistema de niveles)
                //    - defaultModuleSettings (objeto con la config por defecto para este módulo)
                // 5. Componentes Auxiliares: DifficultyExamples, LevelUpHandler, RewardAnimation.
                // 6. Iconos: lucide-react (ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy).
                //
                // Si alguno de estos elementos no está disponible en tu entorno, este código no funcionará
                // tal cual. Se ha incluido un placeholder mínimo para ModuleSettings,
                // CORRECT_ANSWERS_FOR_LEVEL_UP y defaultModuleSettings solo para permitir la compilación
                // del archivo combinado, pero sus implementaciones reales deben venir de tu proyecto.
                // ========================================================================================

                import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

                // ========================================================================================
                // PLACEHOLDERS MÍNIMOS PARA DEPENDENCIAS ASUMIDAS (REEMPLAZAR CON LAS REALES DE TU PROYECTO)
                // ========================================================================================

                // Placeholder para ModuleSettings (asumiendo que viene del contexto de settings)
                // DEBERÍA ESTAR DEFINIDO EN TU ARCHIVO DE CONTEXTO DE SETTINGS
                interface ModuleSettings {
                  difficulty: string; // Usamos string aquí porque DifficultyLevel viene después
                  problemCount: number;
                  timeValue: number;
                  maxAttempts: number;
                  showImmediateFeedback: boolean;
                  enableSoundEffects: boolean;
                  showAnswerWithExplanation: boolean;
                  enableAdaptiveDifficulty: boolean;
                  enableCompensation: boolean;
                  enableRewards: boolean;
                  [key: string]: any; // Permite otras propiedades si existen en tu contexto real
                }

                // Placeholder para defaultModuleSettings
                // DEBERÍA ESTAR DEFINIDO EN TU ARCHIVO DE DEFAULT SETTINGS PARA LOS MÓDULOS
                const defaultModuleSettings: ModuleSettings = {
                  difficulty: "beginner",
                  problemCount: 10,
                  timeValue: 60,
                  maxAttempts: 3,
                  showImmediateFeedback: true,
                  enableSoundEffects: true,
                  showAnswerWithExplanation: true,
                  enableAdaptiveDifficulty: true, // O false, según tu valor por defecto
                  enableCompensation: false,
                  enableRewards: true,
                };

                // Placeholder para CORRECT_ANSWERS_FOR_LEVEL_UP
                // DEBERÍA ESTAR DEFINIDO EN TU ARCHIVO DE LEVEL MANAGER
                const CORRECT_ANSWERS_FOR_LEVEL_UP = 5; // Ejemplo, usa el valor real de tu proyecto


                // ========================================================================================
                // TIPOS (Originalmente types.ts)
                // ========================================================================================

                export type DifficultyLevel = "beginner" | "elementary" | "intermediate" | "advanced" | "expert";
                export type ExerciseLayout = 'horizontal' | 'vertical';

                // Ajustamos el tipo Problem para que coincida con la estructura generada por generateAdditionProblem
                // y usada en Exercise.tsx, usando los nombres de propiedades encontrados allí.
                export interface Problem {
                  id: string; // Añadido 'id' basado en generateAdditionProblem
                  operands: number[]; // Array para soportar 2 o más operandos
                  correctAnswer: number;
                  layout: ExerciseLayout; // 'horizontal' o 'vertical'
                  answerMaxDigits: number; // Número total de cajones para la respuesta (incluyendo el punto si existe)
                                           // Renombrado de numberOfAnswerSlots a answerMaxDigits para coincidir con Exercise.tsx
                  answerDecimalPosition?: number; // Posición del punto decimal contado desde la DERECHA (ej: 2 para XX.YY).
                                                  // undefined si la respuesta no tiene decimales.
                                                  // Renombrado de decimalPositionInAnswer a answerDecimalPosition para coincidir con Exercise.tsx
                  difficulty: DifficultyLevel; // La dificultad con la que se generó este problema específico
                  num1: number; // Mantener por compatibilidad (usado en generateAdditionProblem)
                  num2: number; // Mantener por compatibilidad (usado en generateAdditionProblem)
                }

                // AdditionProblem es un alias
                export type AdditionProblem = Problem;

                // Ajustamos el tipo UserAnswer para que coincida con la estructura usada en userAnswersHistory en Exercise.tsx
                export interface UserAnswer {
                  problemId: string; // Añadido problemId
                  problem: Problem; // Usa la estructura de Problem definida arriba
                  userAnswer: number; // La respuesta numérica del usuario
                  isCorrect: boolean;
                  status: 'correct' | 'incorrect' | 'revealed' | 'timeout' | 'unanswered'; // Añadido status
                  // userAnswerString ya no es estrictamente necesario si solo se guarda el número,
                  // pero podría añadirse si la representación exacta del input es importante.
                }


                // ========================================================================================
                // UTILIDADES (Originalmente utils.ts)
                // ========================================================================================

                // --- Funciones auxiliares ---
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
                  // Importante para mantener ceros finales para el conteo de dígitos (aunque parseFloat los quita, toFixed los añade para la string)
                  // toFixed es útil para la representación, pero parseFloat para el valor numérico.
                  // La generación se basa en el valor numérico, la representación en la respuesta se manejará en el componente.
                  return parseFloat(value.toFixed(maxDecimals));
                }

                function generateUniqueId(): string {
                  return Date.now().toString(36) + Math.random().toString(36).substring(2);
                }

                // --- Generación del Problema ---
                export function generateAdditionProblem(difficulty: DifficultyLevel): AdditionProblem {
                  const id = generateUniqueId();
                  let operands: number[] = [];
                  let layout: ExerciseLayout = 'horizontal';
                  let problemMaxDecimals: 0 | 1 | 2 = 0; // Máximos decimales *en los operandos*

                  switch (difficulty) {
                    case "beginner": // Sumas simples, ej: 1+1 a 9+9
                      operands = [getRandomInt(1, 9), getRandomInt(1, 9)];
                      layout = 'horizontal';
                      break;
                    case "elementary": // Dos dígitos + un dígito, sin acarreo (adaptado) ej: 12+5, o dos dígitos simples
                      // Modificación: Hacerla más como sumas de dos dígitos (ej: 10+10 a 99+99) sin decimales
                      // El original mezclaba 10-30 + 1-9. Ajustamos para ser más puramente "dos dígitos".
                      operands = [getRandomInt(10, 99), getRandomInt(10, 99)]; // ej: 23 + 47
                      layout = 'horizontal';
                      break;
                    case "intermediate": // 2-3 operandos, aleatoriamente vertical, posible 1 decimal
                      layout = getRandomBool(0.6) ? 'vertical' : 'horizontal'; // 60% vertical
                      const numOperandsIntermediate = layout === 'vertical' ? (getRandomBool(0.7) ? 2 : 3) : 2; // Vertical 70% 2 ops, 30% 3 ops; Horizontal siempre 2 ops

                      problemMaxDecimals = layout === 'vertical' && getRandomBool(0.4) ? 1 : 0; // 40% de chance de 1 decimal si es vertical

                      for (let i = 0; i < numOperandsIntermediate; i++) {
                         if (problemMaxDecimals > 0) {
                            operands.push(getRandomDecimal(1, getRandomInt(50, 500), problemMaxDecimals)); // Números más pequeños con decimales
                         } else {
                            operands.push(getRandomInt(10, getRandomInt(100, 500))); // Enteros más grandes
                         }
                      }
                       // Asegurar al menos 2 operandos
                      while(operands.length < 2) {
                           operands.push(getRandomInt(1,10));
                      }
                      break;
                    case "advanced": // 3-4 operandos, siempre vertical, 1 o 2 decimales
                      layout = 'vertical';
                      const numOperandsAdvanced = getRandomBool() ? 3 : 4;
                      problemMaxDecimals = getRandomBool(0.6) ? 2 : 1; // 60% chance de 2 decimales
                      for (let i = 0; i < numOperandsAdvanced; i++) {
                        operands.push(getRandomDecimal(10, getRandomInt(300, 1500), problemMaxDecimals));
                      }
                       // Asegurar al menos 3 operandos
                      while(operands.length < 3) {
                           operands.push(getRandomDecimal(1,10, problemMaxDecimals));
                      }
                      break;
                    case "expert": // 4-5 operandos, siempre vertical, 1 o 2 decimales
                      layout = 'vertical';
                      const numOperandsExpert = getRandomBool() ? 4 : 5;
                      problemMaxDecimals = getRandomBool(0.75) ? 2 : 1; // 75% chance de 2 decimales
                      for (let i = 0; i < numOperandsExpert; i++) {
                        operands.push(getRandomDecimal(100, getRandomInt(1000, 5000), problemMaxDecimals));
                      }
                       // Asegurar al menos 4 operandos
                       while(operands.length < 4) {
                           operands.push(getRandomDecimal(10,100, problemMaxDecimals));
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

                   // Determinar los decimales efectivos en la respuesta *basado en los operandos*
                   // La respuesta debe tener tantos decimales como el operando con más decimales.
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

                  // answerMaxDigits: Total de caracteres en la respuesta (sin el punto)
                  // Incluye ceros a la izquierda si los hay por formateo? No, solo dígitos.
                  // El número de cajas debe ser suficiente para la parte entera más la parte decimal.
                  // La parte entera puede necesitar cajas adicionales para acarreo en vertical.
                  // Para simplificar, calculamos el tamaño máximo necesario para la suma + 1 para acarreo potencial,
                  // más los decimales. Esto puede ser excesivo en horizontal o sin acarreo, pero seguro.

                  // Calcular el número máximo de dígitos enteros requeridos por los operandos
                  const maxOperandIntLength = Math.max(1, ...operands.map(op => String(Math.floor(op)).length));
                   // El resultado podría tener un dígito entero más que el operando más grande debido al acarreo.
                  const requiredIntBoxes = integerPartOfSumStr.length; // Usar la suma real calculada para el tamaño entero

                  const requiredDecBoxes = effectiveDecimalsInResult;

                  const answerMaxDigits = requiredIntBoxes + requiredDecBoxes;

                  let answerDecimalPosition: number | undefined = undefined;
                  if (requiredDecBoxes > 0) {
                      // La posición del punto decimal es el número de dígitos a la derecha del punto.
                      answerDecimalPosition = requiredDecBoxes;
                  }

                  return {
                    id,
                    num1: operands[0], // Mantener por compatibilidad (el original solo tenía num1, num2)
                    num2: operands.length > 1 ? operands[1] : 0, // Mantener por compatibilidad
                    operands,
                    correctAnswer,
                    layout,
                    answerMaxDigits, // Total de cajas necesarias (sin incluir el punto como caja)
                    answerDecimalPosition, // Número de decimales (define la posición del punto)
                    difficulty, // Añadir dificultad al problema generado
                  };
                }

                // --- Validación de la Respuesta ---
                export function checkAnswer(problem: AdditionProblem, userAnswer: number): boolean {
                  if (isNaN(userAnswer)) return false;

                  // La precisión debe basarse en los decimales del problema generado.
                  // Problem.answerDecimalPosition indica cuántos decimales debe tener la respuesta correcta.
                  const precisionForComparison = problem.answerDecimalPosition !== undefined && problem.answerDecimalPosition > 0
                    ? problem.answerDecimalPosition
                    : 0;

                  const factor = Math.pow(10, precisionForComparison);
                  // Redondear ambas respuestas a la precisión requerida antes de comparar
                  const roundedCorrectAnswer = Math.round(problem.correctAnswer * factor) / factor;
                  const roundedUserAnswer = Math.round(userAnswer * factor) / factor;

                  // Comparación con una pequeña tolerancia debido a posibles imprecisiones de punto flotante,
                  // aunque redondear primero minimiza esto. Epsilon es más robusto.
                   const epsilon = Number.EPSILON * 2; // Una pequeña tolerancia
                  return Math.abs(roundedUserAnswer - roundedCorrectAnswer) < epsilon;
                }

                // --- Funciones auxiliares para formatear números para la vista vertical ---
                export function getVerticalAlignmentInfo(
                    operands: number[],
                    problemOverallDecimalPrecision?: number
                ): {
                    maxIntLength: number;
                    maxDecLength: number;
                    operandsFormatted: Array<{ original: number, intStr: string, decStr: string }>;
                    sumLineTotalCharWidth: number;
                } {
                    // Determinar los decimales efectivos para mostrar.
                    // Si problemOverallDecimalPrecision está definido (viene del problema generado), úsalo.
                    // De lo contrario, calcula el máximo de decimales en los operandos para alineación.
                    let effectiveDecimalPlacesToShow = problemOverallDecimalPrecision !== undefined ? problemOverallDecimalPrecision : 0;
                     if (problemOverallDecimalPrecision === undefined) {
                         operands.forEach(op => {
                            const opStr = String(op);
                            const decimalPart = opStr.split('.')[1];
                            if (decimalPart) {
                                effectiveDecimalPlacesToShow = Math.max(effectiveDecimalPlacesToShow, decimalPart.length);
                            }
                        });
                     }


                    const operandsDisplayInfo = operands.map(op => {
                        // Formatear con el número efectivo de decimales para mostrar
                        const s = op.toFixed(effectiveDecimalPlacesToShow);
                        const parts = s.split('.');
                        return {
                            original: op,
                            intPart: parts[0],
                            decPart: parts[1] || ""
                        };
                    });

                    // Calcular la longitud máxima de la parte entera entre todos los operandos
                    const maxIntLength = Math.max(1, ...operandsDisplayInfo.map(info => info.intPart.length));
                    const maxDecLength = effectiveDecimalPlacesToShow; // Usamos la precisión efectiva determinada

                    const operandsFormatted = operandsDisplayInfo.map(info => ({
                        original: info.original,
                        // Rellenar la parte entera con espacios a la izquierda
                        intStr: info.intPart.padStart(maxIntLength, ' '),
                        // Rellenar la parte decimal con ceros a la derecha hasta la longitud máxima de decimales
                        decStr: info.decPart.padEnd(maxDecLength, '0')
                    }));

                    // El ancho de la línea de suma debe ser suficiente para la parte entera más larga,
                    // el punto decimal (si hay decimales), y la parte decimal más larga.
                    // Añadimos un espacio extra para el signo '+' o para alineación.
                    const sumLineTotalCharWidth = maxIntLength + (maxDecLength > 0 ? 1 : 0) + maxDecLength + 1; // +1 para el signo o espacio

                    return { maxIntLength, maxDecLength, operandsFormatted, sumLineTotalCharWidth };
                }


                // ========================================================================================
                // COMPONENTE DE CONFIGURACIÓN (Originalmente Settings.tsx)
                // ========================================================================================

                // Asegúrate de importar o tener disponibles los componentes UI y hooks necesarios
                // import { Button } from "@/components/ui/button"; // Asumidos externos
                // import { Input } from "@/components/ui/input"; // Asumidos externos
                // import { Label } from "@/components/ui/label"; // Asumidos externos
                // import { Switch } from "@/components/ui/switch"; // Asumidos externos
                // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Asumidos externos
                // import { Slider } from "@/components/ui/slider"; // Asumidos externos
                // import { ArrowLeft, RotateCcw } from "lucide-react"; // Asumidos externos
                // import { useSettings } from "@/context/SettingsContext"; // Asumido externo
                // import DifficultyExamples from "@/components/DifficultyExamples"; // Asumido externo
                // import { debounce } from "@/lib/utils"; // Asumido externo
                // import { defaultModuleSettings } from "@/utils/operationComponents"; // Usamos el placeholder local

                interface SettingsProps {
                  // Usamos el placeholder local ModuleSettings
                  settings: ModuleSettings;
                  onBack: () => void;
                }

                export function Settings({ settings, onBack }: SettingsProps) {
                  // useSettings y resetModuleSettings son asumidos externos
                  const { updateModuleSettings, resetModuleSettings } = useSettings();
                  const [localSettings, setLocalSettings] = useState<ModuleSettings>({ ...settings });
                  const [showResetConfirm, setShowResetConfirm] = useState(false);

                  // Referencia a la función debounced para guardar la configuración
                  // debounce es asumido externo
                  const debouncedSave = useMemo(
                    () =>
                      debounce((settings: ModuleSettings) => {
                        updateModuleSettings("addition", settings);
                        console.log(`[ADDITION] Guardando configuración (debounced):`, settings);
                      }, 500), // Reducir el tiempo de espera a 500ms para asegurar que se guarde pronto
                    [updateModuleSettings]
                  );

                  // Guardar automáticamente cada vez que cambia un ajuste
                  const handleUpdateSetting = <K extends keyof ModuleSettings>(key: K, value: ModuleSettings[K]) => {
                    const updatedSettings = { ...localSettings, [key]: value };
                    setLocalSettings(updatedSettings);

                    // Para cambios de dificultad, aplicar cambio inmediatamente
                    if (key === "difficulty") {
                      console.log("[ADDITION] Guardando configuración de dificultad inmediatamente:", value);
                      // Actualizamos directamente sin usar debounce para cambios de dificultad
                      // Cast a DifficultyLevel es seguro aquí si el RadioGroup solo permite esos valores
                      updateModuleSettings("addition", updatedSettings as ModuleSettings);
                    } else {
                      // Para otros ajustes, usar debounce para evitar múltiples llamadas de guardado
                      debouncedSave(updatedSettings);
                    }
                  };

                  // Efecto para guardar al desmontar y asegurar persistencia
                  const hasSavedRef = useRef(false);

                  useEffect(() => {
                    // Guardar configuración inmediatamente al montar el componente para persistir valores actuales
                    updateModuleSettings("addition", localSettings);
                    console.log("[ADDITION] Guardando configuración al cargar:", localSettings);

                    // Al desmontar, volver a guardar
                    return () => {
                      // Solo guardar si no se ha guardado ya (ej. por otro evento de debounce o cambio de dificultad)
                      // Aunque el debounce ya maneja esto, la lógica de forzar localStorage al desmontar
                      // es un intento de asegurar la persistencia en ciertos escenarios de navegación rápida.
                      // El debounce final podría no ejecutarse si el componente se desmonta antes del timeout.
                      // La lógica de forzar localStorage aquí podría ser redundante si updateModuleSettings
                      // ya garantiza la persistencia inmediata o casi inmediata.
                      // Dejamos la lógica original pero con la nota.
                      if (!hasSavedRef.current) {
                         hasSavedRef.current = true; // Marca que se intentó guardar al desmontar

                         // Llamada directa sin debounce para asegurar que se ejecute
                         updateModuleSettings("addition", localSettings);
                         console.log("[ADDITION] Guardando configuración al desmontar (final):", localSettings);

                         // Forzar localStorage para asegurar persistencia
                         // Esto es un acceso directo a localStorage que bypassa el contexto de settings
                         // y podría ser problemático si el contexto tiene lógica adicional (ej. perfiles).
                         // Es mejor confiar en que updateModuleSettings maneja la persistencia correctamente.
                         // Dejamos el código original por si acaso tiene un propósito específico en el proyecto fuente.
                         try {
                           const profileId = localStorage.getItem('activeProfileId');
                           const suffix = profileId ? `-profile-${profileId}` : '';
                           const key = `moduleSettings${suffix}`;

                           // Obtener y actualizar configuraciones actuales en localStorage
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
                  // localSettings y updateModuleSettings son dependencias correctas
                  // debouncedSave NO debe ser dependencia aquí si el objetivo es guardar `localSettings` al desmontar.
                  // El efecto debe reaccionar a cambios en `localSettings` o `updateModuleSettings`.
                  }, [localSettings, updateModuleSettings]);


                  const handleResetSettings = async () => {
                    if (showResetConfirm) {
                      // resetModuleSettings es asumido externo
                      await resetModuleSettings("addition");
                      setLocalSettings({ ...defaultModuleSettings }); // Usamos el placeholder local
                      setShowResetConfirm(false);
                    } else {
                      setShowResetConfirm(true);
                    }
                  };

                  // Obtener el color del tema basado en la dificultad seleccionada
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
                          bgMedium: "bg-blue-200", // No usado en el código, mantener por si acaso
                          accent: "text-blue-700", // Usado para etiquetas y texto dentro de contenedores
                          emoji: "🔵",
                          name: "Principiante" // No usado en el código, mantener por si acaso
                        };
                      case "elementary":
                        return {
                          bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
                          border: "border-emerald-200",
                          text: "text-emerald-600",
                          textSecondary: "text-emerald-500",
                          bgContainer: "bg-emerald-50",
                          bgLight: "bg-emerald-100",
                          bgMedium: "bg-emerald-200",
                          accent: "text-emerald-700",
                          emoji: "🟢",
                          name: "Elemental"
                        };
                      case "intermediate":
                        return {
                          bg: "bg-gradient-to-br from-orange-50 to-orange-100",
                          border: "border-orange-200",
                          text: "text-orange-600",
                          textSecondary: "text-orange-500",
                          bgContainer: "bg-orange-50",
                          bgLight: "bg-orange-100",
                          bgMedium: "bg-orange-200",
                          accent: "text-orange-700",
                          emoji: "🟠",
                          name: "Intermedio"
                        };
                      case "advanced":
                        return {
                          bg: "bg-gradient-to-br from-purple-50 to-purple-100",
                          border: "border-purple-200",
                          text: "text-purple-600",
                          textSecondary: "text-purple-500",
                          bgContainer: "bg-purple-50",
                          bgLight: "bg-purple-100",
                          bgMedium: "bg-purple-200",
                          accent: "text-purple-700",
                          emoji: "🟣",
                          name: "Avanzado"
                        };
                      case "expert":
                        return {
                          bg: "bg-gradient-to-br from-rose-50 to-rose-100",
                          border: "border-rose-200",
                          text: "text-rose-600",
                          textSecondary: "text-rose-500",
                          bgContainer: "bg-rose-50",
                          bgLight: "bg-rose-100",
                          bgMedium: "bg-rose-200",
                          accent: "text-rose-700",
                          emoji: "⭐",
                          name: "Experto"
                        };
                      default: // Tema por defecto si la dificultad no coincide (ej. undefined o error)
                        return {
                          bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
                          border: "border-indigo-200",
                          text: "text-indigo-600",
                          textSecondary: "text-indigo-500",
                          bgContainer: "bg-indigo-50",
                          bgLight: "bg-indigo-100",
                          bgMedium: "bg-indigo-200",
                          accent: "text-indigo-700",
                          emoji: "⚡",
                          name: "General"
                        };
                    }
                  };

                  const theme = getDifficultyTheme(localSettings.difficulty);

                  return (
                    <div className={`px-4 py-5 sm:p-6 rounded-xl shadow-md ${theme.bg} border-2 ${theme.border}`}>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className={`text-2xl font-bold ${theme.text} flex items-center`}>
                            {theme.emoji} Configuración - Ejercicio de Suma
                          </h2>
                          <p className={`text-sm font-medium ${theme.textSecondary}`}>Personaliza tu experiencia de ejercicio</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onBack}
                          className={`border ${theme.border} hover:${theme.bgContainer}`}
                        >
                          {/* ArrowLeft es asumido externo */}
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Volver al Ejercicio
                        </Button>
                      </div>

                      <div className="space-y-6">
                        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
                          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
                            <span className="mr-2">🎯</span>Nivel de Dificultad
                          </h3>
                          <p className={`text-sm ${theme.textSecondary} mb-2`}>Haz clic en un ejemplo para cambiar el nivel de dificultad:</p>

                          <div className="mt-4 mb-6 bg-white/80 rounded-lg p-4 border border-gray-100 shadow-sm">
                             {/* DifficultyExamples es asumido externo */}
                            <DifficultyExamples
                              operation="addition"
                              activeDifficulty={localSettings.difficulty}
                              onSelectDifficulty={(difficulty) =>
                                // Cast es necesario porque onSelectDifficulty devuelve string
                                handleUpdateSetting("difficulty", difficulty as DifficultyLevel)
                              }
                            />
                          </div>

                          <div className="mt-3 mb-2 space-y-1.5">
                            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                              <span className="font-bold">Principiante:</span> Sumas con dígitos simples (1+8, 7+5)
                            </p>
                            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                              <span className="font-bold">Elemental:</span> Sumas de números de dos dígitos (10+10 a 99+99) - *Ajustado de la descripción original para reflejar la nueva generación*
                            </p>
                            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                              <span className="font-bold">Intermedio:</span> Sumas con 2-3 operandos, hasta ~500, con o sin 1 decimal - *Ajustado*
                            </p>
                            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                              <span className="font-bold">Avanzado:</span> Sumas con 3-4 operandos, hasta ~1500, con 1 o 2 decimales - *Ajustado*
                            </p>
                            <p className={`text-sm ${theme.accent} bg-white/60 rounded-md p-2 border ${theme.border}`}>
                              <span className="font-bold">Experto:</span> Sumas con 4-5 operandos, hasta ~5000, con 1 o 2 decimales - *Ajustado*
                            </p>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
                          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
                            <span className="mr-2">🔢</span>Número de Problemas
                          </h3>
                          <div className="mt-3">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                 {/* Slider es asumido externo */}
                                <Slider
                                  value={[localSettings.problemCount]}
                                  min={1}
                                  max={50}
                                  step={1}
                                  onValueChange={(value) => handleUpdateSetting("problemCount", value[0])}
                                  className={`w-full ${theme.bgLight}`}
                                />
                                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                                  <span>1</span>
                                  <span>25</span>
                                  <span>50</span>
                                </div>
                              </div>
                              <div className="w-20">
                                 {/* Input es asumido externo */}
                                <Input
                                  type="number"
                                  value={localSettings.problemCount}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 1 && value <= 50) {
                                      handleUpdateSetting("problemCount", value);
                                    }
                                  }}
                                  min={1}
                                  max={50}
                                  className={`w-full border ${theme.border}`}
                                />
                              </div>
                            </div>
                            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
                              <span className="font-medium">Especifica cuántos problemas quieres resolver:</span> <span className={`font-bold ${theme.text}`}>{localSettings.problemCount}</span>
                            </p>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
                          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
                            <span className="mr-2">⏱️</span>Límite de Tiempo
                          </h3>
                          <div className="mt-3">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                {/* Slider es asumido externo */}
                                <Slider
                                  value={[localSettings.timeValue]}
                                  min={0}
                                  max={300}
                                  step={5}
                                  onValueChange={(value) => handleUpdateSetting("timeValue", value[0])}
                                  className={`w-full ${theme.bgLight}`}
                                />
                                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                                  <span>0</span>
                                  <span>150</span>
                                  <span>300</span>
                                </div>
                              </div>
                              <div className="w-20">
                                 {/* Input es asumido externo */}
                                <Input
                                  type="number"
                                  value={localSettings.timeValue}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= 300) {
                                      handleUpdateSetting("timeValue", value);
                                    }
                                  }}
                                  min={0}
                                  max={300}
                                  className={`w-full border ${theme.border}`}
                                />
                              </div>
                            </div>
                            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
                              <span className="font-medium">Tiempo en segundos:</span> <span className={`font-bold ${theme.text}`}>{localSettings.timeValue}</span> <span className="text-xs">(0 para sin límite)</span>
                            </p>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg shadow-sm ${theme.bgContainer} border ${theme.border}`}>
                          <h3 className={`text-lg font-bold ${theme.text} flex items-center`}>
                            <span className="mr-2">🔄</span>Máximo de Intentos por Problema
                          </h3>
                          <div className="mt-3">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                {/* Slider es asumido externo */}
                                <Slider
                                  value={[localSettings.maxAttempts]}
                                  min={0}
                                  max={10}
                                  step={1}
                                  onValueChange={(value) => handleUpdateSetting("maxAttempts", value[0])}
                                  className={`w-full ${theme.bgLight}`}
                                />
                                <div className={`flex justify-between text-xs font-medium mt-1 ${theme.accent}`}>
                                  <span>0</span>
                                  <span>5</span>
                                  <span>10</span>
                                </div>
                              </div>
                              <div className="w-20">
                                 {/* Input es asumido externo */}
                                <Input
                                  type="number"
                                  value={localSettings.maxAttempts}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= 10) {
                                      handleUpdateSetting("maxAttempts", value);
                                    }
                                  }}
                                  min={0}
                                  max={10}
                                  className={`w-full border ${theme.border}`}
                                />
                              </div>
                            </div>
                            <p className={`mt-3 text-sm ${theme.accent} bg-white/50 p-2 rounded-md border ${theme.border}`}>
                              <span className="font-medium">Intentos máximos:</span> <span className={`font-bold ${theme.text}`}>{localSettings.maxAttempts}</span> <span className="text-xs">(0 para intentos ilimitados)</span>
                            </p>
                          </div>

                          <h3 className={`text-lg font-bold ${theme.text} flex items-center mt-6`}>
                            <span className="mr-2">⚙️</span>Configuración Adicional
                          </h3>
                          <div className="mt-3 space-y-3">
                            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
                               {/* Label y Switch son asumidos externos */}
                              <Label htmlFor="show-immediate-feedback" className={`cursor-pointer ${theme.accent} flex items-center`}>
                                <span className="mr-2">📝</span>Mostrar retroalimentación inmediata
                              </Label>
                              <Switch
                                id="show-immediate-feedback"
                                checked={localSettings.showImmediateFeedback}
                                onCheckedChange={(checked) => handleUpdateSetting("showImmediateFeedback", checked)}
                                className={theme.bgLight} // ClassName para el track del Switch
                              />
                            </div>
                            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
                               {/* Label y Switch son asumidos externos */}
                              <Label htmlFor="enable-sound-effects" className={`cursor-pointer ${theme.accent} flex items-center`}>
                                <span className="mr-2">🔊</span>Habilitar efectos de sonido
                              </Label>
                              <Switch
                                id="enable-sound-effects"
                                checked={localSettings.enableSoundEffects}
                                onCheckedChange={(checked) => handleUpdateSetting("enableSoundEffects", checked)}
                                className={theme.bgLight} // ClassName para el track del Switch
                              />
                            </div>
                            <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
                              {/* Label y Switch son asumidos externos */}
                              <Label htmlFor="show-answer-explanation" className={`cursor-pointer ${theme.accent} flex items-center`}>
                                <span className="mr-2">❓</span>Mostrar explicación de respuestas
                              </Label>
                              <Switch
                                id="show-answer-explanation"
                                checked={localSettings.showAnswerWithExplanation}
                                onCheckedChange={(checked) => handleUpdateSetting("showAnswerWithExplanation", checked)}
                                className={theme.bgLight} // ClassName para el track del Switch
                              />
                            </div>
                             <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
                              {/* Label y Switch son asumidos externos */}
                              <Label htmlFor="enable-adaptive-difficulty" className={`cursor-pointer ${theme.accent} flex items-center`}>
                                <span className="mr-2">📈</span>Habilitar Dificultad Adaptativa
                              </Label>
                              <Switch
                                id="enable-adaptive-difficulty"
                                checked={localSettings.enableAdaptiveDifficulty}
                                onCheckedChange={(checked) => handleUpdateSetting("enableAdaptiveDifficulty", checked)}
                                className={theme.bgLight} // ClassName para el track del Switch
                              />
                            </div>
                             <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
                              {/* Label y Switch son asumidos externos */}
                              <Label htmlFor="enable-compensation" className={`cursor-pointer ${theme.accent} flex items-center`}>
                                <span className="mr-2">➕</span>Habilitar Compensación
                                <br/><span className="text-xs ml-5 opacity-80">(Añadir 1 problema por cada incorrecto/revelado)</span>
                              </Label>
                              <Switch
                                id="enable-compensation"
                                checked={localSettings.enableCompensation}
                                onCheckedChange={(checked) => handleUpdateSetting("enableCompensation", checked)}
                                className={theme.bgLight} // ClassName para el track del Switch
                              />
                            </div>
                             <div className={`flex items-center justify-between p-2.5 rounded-md bg-white/70 border ${theme.border}`}>
                              {/* Label y Switch son asumidos externos */}
                              <Label htmlFor="enable-rewards" className={`cursor-pointer ${theme.accent} flex items-center`}>
                                <span className="mr-2">🏆</span>Activar sistema de recompensas aleatorias
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
                                className={theme.bgLight} // ClassName para el track del Switch
                              />
                            </div>
                            {localSettings.enableRewards && (
                              <div className={`ml-6 mt-3 p-3 rounded-md bg-white/70 border ${theme.border}`}>
                                <p className={`text-sm ${theme.accent}`}>
                                  <span className="mr-2">🎲</span>Las recompensas aparecerán de forma aleatoria durante los ejercicios:
                                </p>
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
                                <p className={`text-xs mt-3 ${theme.textSecondary} text-center italic`}>
                                  El sistema elegirá automáticamente qué recompensa mostrar en cada ocasión
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-4">
                          <div className="flex justify-end">
                            {/* Button es asumido externo */}
                            {/* RotateCcw es asumido externo */}
                            <Button
                              type="button"
                              variant={showResetConfirm ? "destructive" : "outline"}
                              onClick={handleResetSettings}
                              className={`mr-3 ${showResetConfirm ? "" : `border ${theme.border} hover:${theme.bgContainer}`}`}
                            >
                              {showResetConfirm ? (
                                "Confirmar Restablecimiento"
                              ) : (
                                <>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Restablecer valores predeterminados
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


                // ========================================================================================
                // COMPONENTE DE EJERCICIO (Originalmente Exercise.tsx)
                // ========================================================================================

                // Asegúrate de importar o tener disponibles los componentes UI y hooks necesarios
                // import { useProgress } from "@/context/ProgressContext"; // Asumido externo
                // import { ModuleSettings, useSettings } from "@/context/SettingsContext"; // ModuleSettings placeholder local, useSettings asumido externo
                // import { Button } from "@/components/ui/button"; // Asumido externo
                // import { Progress as ProgressBarUI } from "@/components/ui/progress"; // Asumido externo
                // import { Settings, ChevronLeft, ChevronRight, Check, Cog, Info, Star, Award, Trophy, RotateCcw } from "lucide-react"; // Asumidos externos
                // import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"; // Asumidos externos
                // import { useTranslations } from "@/hooks/use-translations"; // Asumido externo
                // import { CORRECT_ANSWERS_FOR_LEVEL_UP } from '@/lib/levelManager'; // Usamos el placeholder local
                // import eventBus from '@/lib/eventBus'; // Asumido externo
                // import LevelUpHandler from "@/components/LevelUpHandler"; // Asumido externo
                // import { useRewardsStore, awardReward, getRewardProbability } from '@/lib/rewards-system'; // Asumidos externos
                // import RewardAnimation from '@/components/rewards/RewardAnimation'; // Asumido externo
                // import { formatTime } from "@/lib/utils"; // Asumido externo

                interface ExerciseProps {
                  // Usamos el placeholder local ModuleSettings
                  settings: ModuleSettings;
                  onOpenSettings: () => void;
                }

                const digitBoxBaseStyle = "w-10 h-12 sm:w-11 sm:h-14 text-xl sm:text-2xl font-bold border-2 rounded-md flex items-center justify-center transition-all select-none";
                const digitBoxFocusStyle = "border-blue-500 ring-2 ring-blue-300 shadow-lg";
                const digitBoxBlurStyle = "border-gray-300";
                const digitBoxDisabledStyle = "bg-gray-100 text-gray-500 border-gray-200 cursor-default";
                const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
                const plusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
                const sumLineStyle = "border-t-2 border-gray-700 my-1";

                export function Exercise({ settings, onOpenSettings }: ExerciseProps) {
                  const [problemsList, setProblemsList] = useState<AdditionProblem[]>([]);
                  const [currentProblem, setCurrentProblem] = useState<AdditionProblem | null>(null);
                  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

                  const [digitAnswers, setDigitAnswers] = useState<string[]>([]);
                  const [focusedDigitIndex, setFocusedDigitIndex] = useState<number | null>(null);
                  const [inputDirection, setInputDirection] = useState<'ltr' | 'rtl'>('rtl');
                  // Cambiar el tipo a HTMLDivElement, que es lo que realmente estamos usando
                  // Usaremos una única referencia para el array de elementos
                  const digitBoxRefs = useRef<HTMLDivElement[]>([]);

                  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswer[]>([]); // Usar el tipo UserAnswer ajustado
                  const [timer, setTimer] = useState(0); // Timer general del ejercicio
                  const [problemTimerValue, setProblemTimerValue] = useState(settings.timeValue); // Timer para el problema actual
                  const [exerciseStarted, setExerciseStarted] = useState(false);
                  const [exerciseCompleted, setExerciseCompleted] = useState(false);

                  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
                  const [feedbackColor, setFeedbackColor] = useState<"green" | "red" | "blue" | null>(null);
                  const [waitingForContinue, setWaitingForContinue] = useState(false);
                  // Ref para el estado de waitingForContinue, útil en efectos y callbacks
                  const waitingRef = useRef(waitingForContinue);
                  useEffect(() => {
                    waitingRef.current = waitingForContinue;
                  }, [waitingForContinue]);


                  const [blockAutoAdvance, setBlockAutoAdvance] = useState(false);
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
                  // Guardar autoContinue en localStorage cuando cambia
                  useEffect(() => {
                     try {
                       localStorage.setItem('addition_autoContinue', autoContinue.toString());
                     } catch (e) {
                       console.error("Error writing autoContinue to localStorage", e);
                     }
                  }, [autoContinue]);


                  // Estado y refs para la dificultad adaptativa
                  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel>(settings.difficulty as DifficultyLevel);
                   // Leer rachas de localStorage al inicializar
                  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveCorrectAnswers') || '0', 10));
                  const [consecutiveIncorrectAnswers, setConsecutiveIncorrectAnswers] = useState(() => parseInt(localStorage.getItem('addition_consecutiveIncorrectAnswers') || '0', 10));

                  // Guardar rachas en localStorage cuando cambian
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


                  const [currentAttempts, setCurrentAttempts] = useState(0); // Intentos para el problema actual
                  const [showLevelUpReward, setShowLevelUpReward] = useState(false); // Para mostrar el modal de level up

                  const [viewingPrevious, setViewingPrevious] = useState(false); // Estamos viendo un problema anterior?
                  // Índice del problema REALMENTE activo antes de ir a ver anteriores
                  const [actualActiveProblemIndexBeforeViewingPrevious, setActualActiveProblemIndexBeforeViewingPrevious] = useState<number>(0);

                  const generalTimerRef = useRef<number | null>(null);
                  const singleProblemTimerRef = useRef<number | null>(null);
                  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

                  // useProgress es asumido externo
                  const { saveExerciseResult } = useProgress();
                  // useSettings y updateModuleSettings son asumidos externos
                  const { updateModuleSettings } = useSettings();
                  // useTranslations es asumido externo
                  const { t } = useTranslations();
                  // useRewardsStore y setShowRewardAnimation son asumidos externos
                  const { setShowRewardAnimation } = useRewardsStore();


                  // Hook para generar el set de problemas
                  // Depende de settings.problemCount, settings.difficulty, settings.enableAdaptiveDifficulty, adaptiveDifficulty
                  useEffect(() => {
                    // Si la dificultad adaptativa está activada, usamos adaptiveDifficulty.
                    // Si no, usamos settings.difficulty.
                    const difficultyToUse = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
                    console.log(`[ADDITION] Generando problemas con dificultad: ${difficultyToUse} (Adaptive: ${settings.enableAdaptiveDifficulty})`);

                    const newProblemsArray: AdditionProblem[] = [];
                    for (let i = 0; i < settings.problemCount; i++) {
                      newProblemsArray.push(generateAdditionProblem(difficultyToUse));
                    }
                    setProblemsList(newProblemsArray);
                    setCurrentProblemIndex(0); // Empezar siempre en el primer problema del nuevo set
                    setActualActiveProblemIndexBeforeViewingPrevious(0); // El problema activo es el primero
                    setCurrentProblem(newProblemsArray[0]); // Cargar el primer problema

                    // Inicializar historial de respuestas para el nuevo set
                    setUserAnswersHistory(Array(newProblemsArray.length).fill(null));
                    setTimer(0); // Resetear timer general
                    setExerciseStarted(false); // Reiniciar estado de ejercicio
                    setExerciseCompleted(false);
                    setFeedbackMessage(null); // Limpiar feedback
                    setWaitingForContinue(false); // No estamos esperando continuar al inicio
                    setBlockAutoAdvance(false); // Desbloquear avance
                    setShowLevelUpReward(false); // Ocultar modal de level up
                    setViewingPrevious(false); // No estamos viendo problemas anteriores
                    setProblemTimerValue(settings.timeValue); // Resetear timer del problema
                    setCurrentAttempts(0); // Resetear intentos del problema
                    digitBoxRefs.current = []; // Limpiar referencias a las cajas de input
                  // Regenerar solo cuando cambian los parámetros que afectan la generación
                  // Incluir adaptiveDifficulty aquí es correcto porque la generación depende de él cuando adaptiveDifficulty está activado
                  }, [settings.problemCount, settings.difficulty, settings.enableAdaptiveDifficulty, adaptiveDifficulty, settings.timeValue /* timeValue afecta problemTimerValue */]);


                  // Efecto para reaccionar a cambios en el problema actual
                  // Se ejecuta cuando currentProblem cambia, O cuando salimos/entramos a viewingPrevious
                  // O cuando se completa el ejercicio.
                  useEffect(() => {
                    // Limpiar timer del problema actual al cambiar de problema o estado
                    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                    singleProblemTimerRef.current = null;

                    if (currentProblem && !viewingPrevious && !exerciseCompleted) {
                      // Estamos en un problema activo, no viendo anteriores, y el ejercicio no ha terminado.

                      const numBoxes = currentProblem.answerMaxDigits || 0;

                      // Limpiar las respuestas actuales en las cajas
                      setDigitAnswers(Array(numBoxes).fill(""));

                      // Resetear las referencias de las cajas. Se rellenarán en el render.
                      digitBoxRefs.current = [];

                      // Establecer la dirección de input y el foco inicial
                      if (currentProblem.layout === 'horizontal') {
                        setInputDirection('ltr');
                        setFocusedDigitIndex(numBoxes > 0 ? 0 : null);
                      } else { // Vertical
                        setInputDirection('rtl');
                        setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null);
                      }

                      // Cargar el estado de respuesta del historial si ya existe una entrada para este problema
                      const historyEntryForCurrent = userAnswersHistory[currentProblemIndex];
                      if (historyEntryForCurrent && historyEntryForCurrent.problemId === currentProblem.id) {
                          // Si hay una entrada en el historial para este problema
                          if (historyEntryForCurrent.status !== 'unanswered') {
                              // Si ya fue intentado (correcta, incorrecta, revelada, timeout)
                              const isResolved = historyEntryForCurrent.isCorrect || historyEntryForCurrent.status === 'revealed' || (settings.maxAttempts > 0 && historyEntryForCurrent.status === 'incorrect' && historyEntryForCurrent.userAnswer !== undefined && !isNaN(historyEntryForCurrent.userAnswer) && historyEntryForCurrent.attemptsMade >= settings.maxAttempts);
                              // Nota: El historial no guarda attemptsMade en la definición, necesitamos pasárselo a checkAnswer o handleTimeOrAttemptsUp
                              // o añadirlo al tipo UserAnswer si queremos re-evaluar si se agotaron intentos al cargar.
                              // Por ahora, asumimos que el estado 'revealed' o el agotamiento de intentos se decidió al MOMENTO de la respuesta.

                              if(isResolved || historyEntryForCurrent.status === 'timeout' || historyEntryForCurrent.status === 'revealed'){
                                   // Problema ya resuelto o revelado o timeout sin respuesta -> esperar continuar
                                   setFeedbackMessage(
                                       historyEntryForCurrent.isCorrect ? t('exercises.correct') :
                                       historyEntryForCurrent.status === 'revealed' ? t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }) :
                                       historyEntryForCurrent.status === 'timeout' ? t('exercises.timeUpNoAnswer', {attemptsMade: 1, maxAttempts: settings.maxAttempts}) : // Simplificado el mensaje de timeout al recargar
                                       // Si es incorrecta y se agotaron intentos, el status debería ser 'revealed' o manejado de forma similar.
                                       t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }) // Fallback para incorrecta sin intentos
                                   );
                                   setFeedbackColor(historyEntryForCurrent.isCorrect ? "green" : (historyEntryForCurrent.status === 'revealed' ? "blue" : "red"));
                                   setWaitingForContinue(true); // Esto actualizará waitingRef.current
                                   // No iniciar timer ni permitir input
                                   setFocusedDigitIndex(null); // Quitar foco si ya está resuelto/esperando
                               } else {
                                  // Incorrecta pero aún con intentos restantes -> puede reintentar
                                  setFeedbackMessage(t('exercises.yourPreviousAnswerWas', { userAnswer: historyEntryForCurrent.userAnswer }));
                                  setFeedbackColor("red");
                                  setWaitingForContinue(false); // Permitir reintentar
                                  setProblemTimerValue(settings.timeValue); // Reiniciar timer para el intento
                                   // Restaurar intentos? El historial no guarda intentos por problema.
                                   // Esto implica que los intentos se gestionan GLOBALMENTE para el problema actual, no persistidos por problema individual en el historial.
                                   // Necesitamos resetear currentAttempts al cargar un problema *no resuelto* desde el historial?
                                   // O currentAttempts se resetea SOLO al avanzar a un *nuevo* problema?
                                   // La lógica actual resetea `currentAttempts` solo al avanzar a `nextActiveIdx`.
                                   // Esto significa que si vuelves a un problema incorrecto NO resuelto, `currentAttempts` mantiene su valor.
                                   // Esto parece un bug. Deberíamos guardar `attemptsMade` por problema en `UserAnswer` o resetear `currentAttempts` si el problema actual *ya está en el historial* pero *no está resuelto*.
                                   // **Ajuste:** Resetear `currentAttempts` a 0 si el problema cargado desde historial NO está en estado final (correct, revealed, timeout, incorrect con intentos agotados).
                                   const previousAttempts = 0; // Asumiendo que no guardamos intentos en historial
                                   setCurrentAttempts(previousAttempts); // Resetear o restaurar si se guardan
                               }
                          } else {
                             // Problema en historial pero status 'unanswered' -> limpiar y permitir empezar
                              setFeedbackMessage(null);
                              setWaitingForContinue(false); // Permitir empezar/reintentar
                              setProblemTimerValue(settings.timeValue); // Reiniciar timer
                              setCurrentAttempts(0); // Resetear intentos
                          }
                      } else {
                          // Problema nuevo (o no encontrado en historial por alguna razón)
                          setFeedbackMessage(null);
                          setWaitingForContinue(false); // Permitir empezar
                          setProblemTimerValue(settings.timeValue); // Reiniciar timer
                          setCurrentAttempts(0); // Resetear intentos
                      }

                      // Enfocar la primera/última caja después de que se renderice
                      if (!waitingRef.current) { // Solo enfocar si no estamos esperando
                          // El enfoque se maneja en otro useEffect que depende de focusedDigitIndex
                      }

                    } else if (viewingPrevious) {
                      // Estamos viendo un problema anterior
                      setFocusedDigitIndex(null); // Quitar foco de las cajas
                      setWaitingForContinue(false); // No estamos "esperando continuar" un problema activo

                      // La carga de datos y feedback para viewingPrevious se maneja en moveToPreviousProblem/returnToActiveProblem
                    } else if (exerciseCompleted) {
                      // El ejercicio ha terminado
                      setFocusedDigitIndex(null); // Quitar foco
                      setWaitingForContinue(true); // Mostrar el botón "Continuar" (que en este caso no hará nada?)
                                                    // O simplemente deshabilitar todo y mostrar el resumen.
                                                    // La UI muestra el resumen, no un botón de continuar.
                                                    // Mantendremos waitingForContinue = true para deshabilitar los inputs.
                    }

                    // El useEffect que maneja el timer del problema depende de exerciseStarted, exerciseCompleted,
                    // settings.timeValue, currentProblem, viewingPrevious, currentAttempts, settings.maxAttempts,
                    // Y CRUCIALMENTE waitingRef.current. Este hook se encargará de iniciar/detener el timer.

                  // Dependencias: currentProblem, viewingPrevious, exerciseCompleted, userAnswersHistory,
                  // currentProblemIndex, settings.timeValue, settings.maxAttempts, settings.enableAdaptiveDifficulty,
                  // adaptiveDifficulty, t. (t es de useTranslations y se asume estable).
                  // Se ha añadido userAnswersHistory y currentProblemIndex porque el estado cargado depende de ellos.
                  // Se ha añadido settings.timeValue, settings.maxAttempts, etc. porque el comportamiento (timer, attempts) depende de settings.
                  }, [
                    currentProblem, viewingPrevious, exerciseCompleted, userAnswersHistory, currentProblemIndex,
                    settings.timeValue, settings.maxAttempts, settings.enableAdaptiveDifficulty, adaptiveDifficulty, t, /* waitingRef no es dep */
                    /* dependencias de feedbackMessage, feedbackColor, etc. son manejadas internamente por los setters */
                    /* Dependencias de los setters: setDigitAnswers, setFocusedDigitIndex, setInputDirection, setFeedbackMessage, setFeedbackColor, setWaitingForContinue, setProblemTimerValue, setCurrentAttempts */
                  ]);


                   // Efecto para enfocar la caja de input.
                   // Depende solo del índice enfocado y si estamos viendo historial o si el ejercicio ha terminado/está esperando.
                  useEffect(() => {
                     // Solo intentar enfocar si hay un índice enfocado y no estamos en estados deshabilitantes
                    if (focusedDigitIndex !== null && !viewingPrevious && !exerciseCompleted && !waitingRef.current) {
                       // Usar setTimeout para asegurar que el elemento existe en el DOM después de la actualización del estado
                      const element = digitBoxRefs.current[focusedDigitIndex];
                      if (element) {
                        setTimeout(() => {
                          try {
                             element.focus();
                             // Opcional: seleccionar el contenido actual al enfocar
                             // element.select();
                          } catch (error) {
                             console.error("Failed to focus element:", error);
                          }
                        }, 0); // Un retardo mínimo
                      } else {
                         console.log(`Element at index ${focusedDigitIndex} not found for focusing.`);
                      }
                    }
                  // Dependencias: focusedDigitIndex, viewingPrevious, exerciseCompleted, waitingRef.current
                  // digitBoxRefs.current NO debe ser una dependencia directa aquí, ya que es una ref mutable.
                  // Su contenido cambia (el array de refs), pero la ref `digitBoxRefs` en sí misma no cambia.
                  // El efecto debe re-ejecutarse cuando `focusedDigitIndex` cambia y las condiciones de estado lo permiten.
                  // Asumimos que `digitBoxRefs.current` estará actualizado cuando se necesite debido a los renders.
                  }, [focusedDigitIndex, viewingPrevious, exerciseCompleted, waitingRef.current]); // Solo estas dependencias


                  // Hook para el timer general del ejercicio
                  useEffect(() => {
                    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
                    generalTimerRef.current = null;

                    if (exerciseStarted && !exerciseCompleted) {
                      generalTimerRef.current = window.setInterval(() => {
                          setTimer(prev => prev + 1);
                      }, 1000);
                    }

                    return () => {
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
                    // Limpiar también el timer de auto-continuar si existe
                    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
                    autoContinueTimerRef.current = null;


                    // Iniciar el timer del problema si:
                    // 1. El ejercicio ha comenzado pero no terminado.
                    // 2. Hay un problema actual cargado.
                    // 3. NO estamos viendo problemas anteriores.
                    // 4. settings.timeValue es mayor que 0 (hay límite de tiempo).
                    // 5. NO estamos esperando una acción de "Continuar".
                    // 6. Todavía quedan intentos disponibles para el problema actual (si maxAttempts es > 0).

                    const shouldStartProblemTimer = exerciseStarted &&
                                                   !exerciseCompleted &&
                                                   currentProblem !== null &&
                                                   !viewingPrevious &&
                                                   settings.timeValue > 0 &&
                                                   !waitingRef.current && // Usa la ref actualizada
                                                   (settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts); // Verifica intentos

                    if (shouldStartProblemTimer) {
                       console.log("[ADDITION] Starting problem timer...");
                       // El timer cuenta hacia atrás desde problemTimerValue
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
                        console.log("[ADDITION] Not starting problem timer.", { exerciseStarted, exerciseCompleted, currentProblem: !!currentProblem, viewingPrevious, timeValue: settings.timeValue, waiting: waitingRef.current, attemptsLeft: settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts });
                    }


                    // Función de limpieza al desmontar o re-ejecutar el efecto
                    return () => {
                      console.log("[ADDITION] Cleaning up problem timer...");
                      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                      singleProblemTimerRef.current = null;
                      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
                      autoContinueTimerRef.current = null;
                    };

                  // Dependencias:
                  // - exerciseStarted, exerciseCompleted: Controlan si el timer debe estar activo.
                  // - settings.timeValue: Si el límite de tiempo cambia o se desactiva.
                  // - currentProblem: Si cambia el problema (reinicia el timer).
                  // - viewingPrevious: El timer solo corre para el problema activo.
                  // - currentAttempts, settings.maxAttempts: Para saber si quedan intentos y el timer debe seguir.
                  // - waitingRef.current: Para pausar el timer cuando se espera 'Continuar'.
                  // - handleTimeOrAttemptsUp: La función que se llama al acabar el tiempo (debe ser estable).
                  }, [ exerciseStarted, exerciseCompleted, settings.timeValue, currentProblem,
                       viewingPrevious, currentAttempts, settings.maxAttempts, waitingRef, // waitingRef ES una dependencia porque usamos .current dentro
                       handleTimeOrAttemptsUp // Asegurarse de que handleTimeOrAttemptsUp sea useCallback
                     ]);


                  // Usa useCallback para estabilizar la función checkCurrentAnswer
                  const checkCurrentAnswer = useCallback(() => {
                    // Usar waitingRef.current para la comprobación más actualizada
                    if (!currentProblem || waitingRef.current || exerciseCompleted || viewingPrevious) {
                       console.log("[ADDITION] checkAnswer blocked:", { currentProblem: !!currentProblem, waiting: waitingRef.current, completed: exerciseCompleted, viewing: viewingPrevious });
                       return false; // No se pudo verificar o ya se está esperando
                    }

                    // Si el ejercicio no ha comenzado, empezarlo al primer intento de check
                    if (!exerciseStarted) {
                      startExercise(); // Esto pondrá exerciseStarted a true
                      // No verificamos la respuesta en este mismo ciclo, el usuario tendrá que hacer clic de nuevo.
                      // Podríamos llamar a checkAnswer() de nuevo justo después, pero mejor dejar que el usuario intente de nuevo.
                      return false;
                    }

                    let userAnswerString = "";
                    const decPosInAnswer = currentProblem.answerDecimalPosition;
                    const totalDigitBoxes = currentProblem.answerMaxDigits;
                    const integerBoxesCount = totalDigitBoxes - (decPosInAnswer || 0);

                    // Reconstruir la respuesta del usuario desde las cajas
                     // Manejar el caso donde no se han introducido dígitos
                    const filledAnswers = digitAnswers.filter(d => d && d.trim() !== "");
                    if (filledAnswers.length === 0) {
                       setFeedbackMessage(t('exercises.noAnswerEntered'));
                       setFeedbackColor("blue"); // O un color neutro
                       // No contamos esto como un intento fallido que agota intentos, solo una verificación vacía.
                       // Pero sí contamos el evento como una "acción". ¿Incrementar attempts?
                       // No, la lógica del timer o attemptsUp maneja intentos. checkAnswer solo evalúa una respuesta *potencial*.
                       // Si no hay respuesta, no es un intento válido de responder, es un clic en check sin input.
                       console.log("[ADDITION] Check clicked with no digits entered.");
                       return false;
                    }


                    if (decPosInAnswer !== undefined && decPosInAnswer > 0) {
                        // La parte entera son las primeras `integerBoxesCount` cajas
                        const integerPart = digitAnswers.slice(0, integerBoxesCount).join('');
                        // La parte decimal son las siguientes `decPosInAnswer` cajas
                        const decimalPart = digitAnswers.slice(integerBoxesCount, integerBoxesCount + decPosInAnswer).join(''); // Asegurarse de tomar solo los decimales correctos
                        // Para formar el número, si la parte entera está vacía, debe ser "0".
                        userAnswerString = `${integerPart || '0'}.${decimalPart || '0'}`; // Añadir '0' si la parte decimal está vacía? No, parseFloat lo maneja.
                         // Solo añadir el punto si hay parte decimal esperada
                         if (decPosInAnswer > 0) {
                             userAnswerString = `${integerPart || '0'}.${decimalPart}`;
                         } else {
                             userAnswerString = integerPart || '0';
                         }

                    } else {
                        userAnswerString = digitAnswers.join('') || '0';
                    }

                    const userNumericAnswer = parseFloat(userAnswerString);

                    // Validación básica de si el input introducido es convertible a número
                    if (isNaN(userNumericAnswer)) {
                        setFeedbackMessage(t('exercises.invalidAnswer'));
                        setFeedbackColor("red");
                        console.log("[ADDITION] Invalid answer entered:", userAnswerString);
                        // Contar como intento inválido? Generalmente no se cuentan los inputs no numéricos como intentos válidos agotables.
                        // La lógica de intentos se aplica a respuestas numéricas incorrectas o timeouts.
                        return false; // Inválido, no resuelto
                    }

                    // **Incrementar intento AQUÍ** solo si la respuesta es numérica y válida para evaluar
                    const newAttempts = currentAttempts + 1;
                    setCurrentAttempts(newAttempts);
                    console.log(`[ADDITION] Attempt ${newAttempts}/${settings.maxAttempts || 'Unlimited'}`);

                    const isCorrect = checkAnswer(currentProblem, userNumericAnswer);

                    // Actualizar historial
                    const problemIndexForHistory = currentProblemIndex;
                    const newHistoryEntry: UserAnswer = {
                        problemId: currentProblem.id,
                        problem: currentProblem,
                        userAnswer: userNumericAnswer,
                        isCorrect,
                        status: isCorrect ? 'correct' : 'incorrect',
                        // attemptsMade: newAttempts, // Si quisiéramos guardar intentos por problema
                    };
                    setUserAnswersHistory(prev => {
                        const newHistory = [...prev];
                        newHistory[problemIndexForHistory] = newHistoryEntry;
                        return newHistory;
                    });
                    // Si estamos en el último problema activo, actualizamos el índice del último problema activo
                    if (currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) {
                       setActualActiveProblemIndexBeforeViewingPrevious(problemIndexForHistory);
                    }


                    if (isCorrect) {
                      console.log("[ADDITION] Correct answer!");
                      setFeedbackMessage(t('exercises.correct'));
                      setFeedbackColor("green");
                      const newConsecutive = consecutiveCorrectAnswers + 1;
                      setConsecutiveCorrectAnswers(newConsecutive);
                      setConsecutiveIncorrectAnswers(0); // Rompe la racha de incorrectas

                      // Lógica de dificultad adaptativa (subir nivel)
                      if (settings.enableAdaptiveDifficulty && newConsecutive >= CORRECT_ANSWERS_FOR_LEVEL_UP) {
                          const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
                          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
                          if (currentLevelIdx < difficultiesOrder.length - 1) {
                              const newLevel = difficultiesOrder[currentLevelIdx + 1];
                              console.log(`[ADDITION] Level Up! From ${adaptiveDifficulty} to ${newLevel}`);
                              setAdaptiveDifficulty(newLevel);
                              // Guardar la nueva dificultad inmediatamente via settings context
                              updateModuleSettings("addition", { ...settings, difficulty: newLevel }); // Asegurar que otras settings se mantienen
                              setConsecutiveCorrectAnswers(0); // Resetear racha para el nuevo nivel
                              setShowLevelUpReward(true); // Mostrar modal/animación
                              setBlockAutoAdvance(true); // Bloquear avance hasta que se cierre el modal
                              // eventBus.emit es asumido externo
                              eventBus.emit('levelUp', { previousLevel: adaptiveDifficulty, newLevel });
                          }
                      }

                      // Lógica de recompensas aleatorias
                      if (settings.enableRewards) {
                           // getRewardProbability y awardReward son asumidos externos
                          const rewardContext = { streak: newConsecutive, difficulty: adaptiveDifficulty, problemIndex: currentProblemIndex, totalProblems: problemsList.length };
                          if (Math.random() < getRewardProbability(rewardContext as any)) {
                              awardReward('addition_correct_answer', { module: 'addition', difficulty: adaptiveDifficulty }); // Usar un ID de recompensa más específico
                               // setShowRewardAnimation es asumido externo
                              setShowRewardAnimation(true); // Mostrar animación de recompensa
                          }
                      }

                      setWaitingForContinue(true); // Pone waitingRef.current = true via useEffect
                      // Detener timer del problema actual
                      if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                      singleProblemTimerRef.current = null;

                      // Iniciar timer de auto-continuar si está activado Y no estamos bloqueados por level up
                      if (autoContinue && !blockAutoAdvance) {
                        if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); // Limpiar timer previo por si acaso
                         console.log("[ADDITION] Auto-continue enabled, waiting 3s...");
                        autoContinueTimerRef.current = setTimeout(() => {
                          // Verificar si waitingRef.current sigue siendo true y si no hay bloqueo antes de avanzar
                          if (!blockAutoAdvance && waitingRef.current) {
                            console.log("[ADDITION] Auto-continuing...");
                            handleContinue(); // Usar la versión memoizada/stable
                            autoContinueTimerRef.current = null;
                          } else {
                             console.log("[ADDITION] Auto-continue blocked or waiting state changed.");
                          }
                        }, 3000); // 3 segundos de espera antes de avanzar
                      }
                      return true; // Problema resuelto (correctamente)
                    } else { // Incorrecta
                      console.log(`[ADDITION] Incorrect answer: ${userNumericAnswer} (Correct: ${currentProblem.correctAnswer})`);
                      setFeedbackMessage(t('exercises.incorrect'));
                      setFeedbackColor("red");
                      const newConsecutiveInc = consecutiveIncorrectAnswers + 1;
                      setConsecutiveIncorrectAnswers(newConsecutiveInc);
                      setConsecutiveCorrectAnswers(0); // Rompe la racha de correctas

                      // Lógica de dificultad adaptativa (bajar nivel)
                      if (settings.enableAdaptiveDifficulty && newConsecutiveInc >= 5) { // Bajar nivel después de 5 incorrectas seguidas
                          const difficultiesOrder: DifficultyLevel[] = ["beginner", "elementary", "intermediate", "advanced", "expert"];
                          const currentLevelIdx = difficultiesOrder.indexOf(adaptiveDifficulty);
                          if (currentLevelIdx > 0) {
                              const newLevel = difficultiesOrder[currentLevelIdx - 1];
                              console.log(`[ADDITION] Level Down! From ${adaptiveDifficulty} to ${newLevel}`);
                              setAdaptiveDifficulty(newLevel);
                               // Guardar la nueva dificultad inmediatamente via settings context
                              updateModuleSettings("addition", { ...settings, difficulty: newLevel }); // Asegurar que otras settings se mantienen
                              setConsecutiveIncorrectAnswers(0); // Resetear racha de incorrectas al bajar nivel
                              setFeedbackMessage(`${t('adaptiveDifficulty.levelDecreased', { level: t(newLevel) })}. ${t('exercises.incorrect')}`); // Mensaje combinado
                              // No hay animación o bloqueo para bajar nivel por defecto
                          }
                      }

                      // Lógica de intentos máximos
                      if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
                        console.log(`[ADDITION] Max attempts reached (${settings.maxAttempts}). Revealing answer.`);
                        // Mostrar mensaje en el formato "Answered (Incorrect!). The correct answer is = X"
                        setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer })); // Mensaje de agotamiento de intentos
                        setFeedbackColor("red"); // O color de revelado si es diferente

                        // Actualizar historial para reflejar que la respuesta fue revelada (o intentos agotados)
                        const updatedHistoryEntry: UserAnswer = { ...newHistoryEntry, status: 'revealed' }; // Marcar como revelado
                        setUserAnswersHistory(prev => {
                            const newHistory = [...prev];
                            newHistory[problemIndexForHistory] = updatedHistoryEntry;
                            return newHistory;
                        });
                        setWaitingForContinue(true); // Pone waitingRef.current = true via useEffect -> espera para continuar
                        // Detener timer del problema actual
                        if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                        singleProblemTimerRef.current = null;

                         // Iniciar timer de auto-continuar si está activado (incluso después de agotar intentos/revelar)
                        if (autoContinue && !blockAutoAdvance) {
                            if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
                            console.log("[ADDITION] Auto-continue enabled after failed attempts, waiting 3s...");
                            autoContinueTimerRef.current = setTimeout(() => {
                                if (!blockAutoAdvance && waitingRef.current) {
                                    console.log("[ADDITION] Auto-continuing after failed attempts...");
                                    handleContinue();
                                    autoContinueTimerRef.current = null;
                                } else {
                                    console.log("[ADDITION] Auto-continue blocked or waiting state changed after failed attempts.");
                                }
                            }, 3000);
                        }

                        // Lógica de compensación: añadir problema si se agotan intentos o se revela la respuesta
                        if (settings.enableCompensation) {
                             console.log("[ADDITION] Compensation enabled. Adding one problem.");
                             const difficultyForCompensation = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
                             const compensationProblem = generateAdditionProblem(difficultyForCompensation);
                             setProblemsList(prev => [...prev, compensationProblem]);
                             // No necesitamos actualizar el historial *ahora* para este nuevo problema,
                             // se añadirá un `null` cuando la lista `problemsList` cambie y `userAnswersHistory` se alargue.
                             // Sin embargo, el useEffect que gestiona problemsList/historial no hace eso directamente.
                             // **AJUSTE:** Debemos asegurar que el historial se extiende correctamente.
                             setUserAnswersHistory(prev => [...prev, null]); // Añadir un slot vacío para el nuevo problema
                             console.log("[ADDITION] Problem added due to compensation.");
                        }


                        return true; // Problema resuelto (sin más intentos disponibles)
                      }

                      // Si llega aquí, la respuesta es incorrecta pero aún quedan intentos.
                      // El feedback ya fue mostrado.
                      // No se pone waitingForContinue(true), el usuario puede intentarlo de nuevo.
                      // El timer del problema sigue corriendo (manejado por el useEffect del timer).
                      return false; // Problema no resuelto aún
                    }
                  // Dependencias:
                  // - currentProblem: Se evalúa la respuesta para este problema.
                  // - waitingRef.current: Evita evaluar si ya se está esperando 'Continuar'.
                  // - exerciseCompleted, viewingPrevious, exerciseStarted: Controlan si la evaluación es permitida.
                  // - digitAnswers: La respuesta del usuario introducida.
                  // - currentAttempts, settings.maxAttempts, settings.enableCompensation: Lógica de intentos y compensación.
                  // - settings.enableAdaptiveDifficulty, adaptiveDifficulty, consecutiveCorrectAnswers, consecutiveIncorrectAnswers: Lógica adaptativa.
                  // - CORRECT_ANSWERS_FOR_LEVEL_UP, updateModuleSettings, eventBus, setShowLevelUpReward, setBlockAutoAdvance: Acciones de level up.
                  // - settings.enableRewards, getRewardProbability, awardReward, setShowRewardAnimation: Lógica de recompensas.
                  // - autoContinue, autoContinueTimerRef, handleContinue: Lógica de auto-continuar.
                  // - t: Para los mensajes traducidos.
                  // - setFeedbackMessage, setFeedbackColor, setConsecutiveCorrectAnswers, setConsecutiveIncorrectAnswers, setAdaptiveDifficulty, setWaitingForContinue, setCurrentAttempts, setUserAnswersHistory, setActualActiveProblemIndexBeforeViewingPrevious, setProblemsList: Setters de estado/refs.
                  // Esta es una función useCallback compleja, asegurar que *todas* las dependencias externas o de estado/ref mutables que *afectan su lógica* están listadas.
                  // `handleContinue` se incluye porque se llama dentro si autoContinue está activo.
                  }, [
                    currentProblem, waitingRef, exerciseCompleted, viewingPrevious, exerciseStarted, digitAnswers,
                    currentAttempts, settings.maxAttempts, settings.enableCompensation, settings.enableAdaptiveDifficulty,
                    adaptiveDifficulty, consecutiveCorrectAnswers, consecutiveIncorrectAnswers, CORRECT_ANSWERS_FOR_LEVEL_UP,
                    updateModuleSettings, eventBus, setShowLevelUpReward, setBlockAutoAdvance, settings.enableRewards,
                    getRewardProbability, awardReward, setShowRewardAnimation, autoContinue, autoContinueTimerRef, handleContinue,
                    t, setFeedbackMessage, setFeedbackColor, setConsecutiveCorrectAnswers, setConsecutiveIncorrectAnswers,
                    setAdaptiveDifficulty, setWaitingForContinue, setCurrentAttempts, setUserAnswersHistory,
                    actualActiveProblemIndexBeforeViewingPrevious, setProblemsList, problemsList.length // problemsList.length para la compensación
                    /* checkAnswer (la utilidad) NO es dependencia, se llama dentro */
                  ]);


                  // Usa useCallback para estabilizar la función handleTimeOrAttemptsUp
                  const handleTimeOrAttemptsUp = useCallback(() => {
                    console.log("[ADDITION] handleTimeOrAttemptsUp triggered.");
                    // Usar waitingRef.current para la comprobación más actualizada
                    if (waitingRef.current || !currentProblem || exerciseCompleted || viewingPrevious) {
                       console.log("[ADDITION] handleTimeOrAttemptsUp blocked:", { waiting: waitingRef.current, currentProblem: !!currentProblem, completed: exerciseCompleted, viewing: viewingPrevious });
                       return; // Si ya se está esperando "Continuar", no hacer nada.
                    }

                    // Determinar si se ha introducido *algún* dígito en las cajas
                    const userAnswerIsPresent = digitAnswers.some(d => d && d.trim() !== "");

                    if (userAnswerIsPresent) {
                      console.log("[ADDITION] Time up, answer is present. Calling checkCurrentAnswer...");
                      // Hay una respuesta parcial o completa, la tratamos como un intento.
                      // checkCurrentAnswer incrementa currentAttempts, evalúa, muestra feedback,
                      // y pone waitingForContinue(true) si es correcta o agota intentos.
                      const problemResolvedByCheck = checkCurrentAnswer(); // Esta llamada ya maneja intentos, feedback, etc.

                      // Si checkCurrentAnswer NO resolvió el problema (es decir, fue incorrecta y aún quedan intentos)
                      // Y estamos aquí porque el timer del problema actual se agotó, entonces el feedback de incorrecto ya se mostró.
                      // Solo necesitamos asegurar que el estado se resetea para el siguiente intento si aplica.
                      // La lógica dentro de checkCurrentAnswer ya maneja el caso de agotamiento final.
                      // Si problemResolvedByCheck es false, significa que hubo un intento incorrecto PERO AÚN QUEDAN INTENTOS.
                      // En este caso, el timer del problema se detuvo porque handleTimeOrAttemptsUp se llamó.
                      // Necesitamos reiniciar el timer para el próximo intento.
                      // La lógica actual del useEffect del timer lo reinicia si waitingRef.current es false.
                      // No necesitamos hacer nada más aquí *a menos* que queramos añadir un mensaje específico de "Tiempo agotado para este intento".

                       if (!problemResolvedByCheck && !waitingRef.current) {
                          // checkCurrentAnswer la marcó incorrecta Y AÚN QUEDAN INTENTOS (waitingRef.current es false)
                          // Esto significa que el timer del problema se agotó *antes* de que el usuario hiciera clic en "Check".
                          // checkCurrentAnswer ya incrementó attempts y mostró "Incorrecto".
                          // Aquí, el feedback ya está configurado a "red" y "Incorrecto".
                          // Podemos añadir un mensaje suplementario o simplemente dejarlo.
                           console.log("[ADDITION] Time up for current attempt, but attempts remain.");
                          // El timer se reiniciará automáticamente en el useEffect del timer
                          // porque waitingRef.current es false y quedan intentos.
                       }
                       // Si problemResolvedByCheck es true, checkCurrentAnswer ya puso waitingForContinue(true) y detuvo el timer.
                       // Si waitingRef.current es true, ya estamos esperando, lo cual es una condición de guarda al inicio.

                    } else {
                      console.log("[ADDITION] Time up, no answer entered.");
                      // No hay respuesta escrita, tiempo agotado.
                      // Contar esto como un intento.
                      const newAttempts = currentAttempts + 1;
                      setCurrentAttempts(newAttempts);

                      const problemIndexForHistory = currentProblemIndex;
                       // Si ya hay una entrada para este problema en el historial, la actualizamos.
                       // Si no, creamos una nueva.
                       const existingHistoryEntry = userAnswersHistory[problemIndexForHistory];
                       const newHistoryEntry: UserAnswer = existingHistoryEntry ? {
                           ...existingHistoryEntry, // Mantener problem, problemId
                           userAnswer: NaN, // Respuesta como NaN
                           isCorrect: false,
                           status: (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) ? 'revealed' : 'timeout', // Si se agotan intentos, marcar como revelado, sino como timeout
                           // attemptsMade: newAttempts, // Si quisiéramos guardar intentos
                       } : {
                           problemId: currentProblem.id,
                           problem: currentProblem,
                           userAnswer: NaN,
                           isCorrect: false,
                           status: (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) ? 'revealed' : 'timeout',
                           // attemptsMade: newAttempts, // Si quisiéramos guardar intentos
                       };

                      setUserAnswersHistory(prev => {
                          const newHistory = [...prev];
                          newHistory[problemIndexForHistory] = newHistoryEntry;
                          return newHistory;
                      });
                       // Si es el último problema activo, actualizamos el índice
                       if (currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) {
                          setActualActiveProblemIndexBeforeViewingPrevious(problemIndexForHistory);
                       }


                      if (settings.maxAttempts > 0 && newAttempts >= settings.maxAttempts) {
                        console.log(`[ADDITION] Max attempts reached (${settings.maxAttempts}) due to timeout. Revealing answer.`);
                        // Se agotaron los intentos (por timeouts sucesivos o combinación con clics en check), revelar respuesta.
                        setFeedbackMessage(t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: currentProblem.correctAnswer }));
                        setFeedbackColor("red"); // O color de revelado
                        setWaitingForContinue(true); // Pone waitingRef.current = true via useEffect -> espera para continuar

                         // Lógica de compensación: añadir problema si se agotan intentos (incluyendo timeouts)
                         if (settings.enableCompensation) {
                            console.log("[ADDITION] Compensation enabled. Adding one problem due to timeout/attempts up.");
                            const difficultyForCompensation = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
                            const compensationProblem = generateAdditionProblem(difficultyForCompensation);
                            setProblemsList(prev => [...prev, compensationProblem]);
                            setUserAnswersHistory(prev => [...prev, null]); // Añadir un slot vacío
                            console.log("[ADDITION] Problem added due to compensation (timeout).");
                         }

                         // Iniciar timer de auto-continuar si está activado (incluso después de agotar intentos)
                         if (autoContinue && !blockAutoAdvance) {
                             if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
                             console.log("[ADDITION] Auto-continue enabled after timeout, waiting 3s...");
                             autoContinueTimerRef.current = setTimeout(() => {
                                 if (!blockAutoAdvance && waitingRef.current) {
                                     console.log("[ADDITION] Auto-continuing after timeout...");
                                     handleContinue();
                                     autoContinueTimerRef.current = null;
                                 } else {
                                     console.log("[ADDITION] Auto-continue blocked or waiting state changed after timeout.");
                                 }
                             }, 3000);
                         }

                      } else {
                        // Quedan más intentos, pero el tiempo de este intento se agotó.
                        setFeedbackMessage(t('exercises.timeUpNoAnswer', {attemptsMade: newAttempts, maxAttempts: settings.maxAttempts > 0 ? settings.maxAttempts : t('common.unlimited')}));
                        setFeedbackColor("red");
                        setProblemTimerValue(settings.timeValue); // Reiniciar timer para el próximo intento
                        // El useEffect del timer se encargará de reiniciarlo porque waitingRef.current es false y quedan intentos.
                        console.log(`[ADDITION] Time up for this attempt. Attempts left: ${settings.maxAttempts - newAttempts}`);
                      }
                    }
                    // El timer del problema ya se detuvo en el useEffect cuando prevTimerValue llegó a 1.
                    // Si no se detuvo por alguna razón, esta línea es una salvaguarda:
                    if (singleProblemTimerRef.current) {
                         clearInterval(singleProblemTimerRef.current);
                         singleProblemTimerRef.current = null;
                    }

                  // Dependencias:
                  // - currentProblem, digitAnswers: Estado para evaluar la respuesta.
                  // - currentAttempts, settings.maxAttempts, settings.enableCompensation: Lógica de intentos/compensación.
                  // - settings.enableAdaptiveDifficulty, adaptiveDifficulty: Para generar problema de compensación.
                  // - autoContinue, blockAutoAdvance, autoContinueTimerRef, handleContinue: Lógica de auto-continuar.
                  // - t: Para los mensajes traducidos.
                  // - userAnswersHistory, currentProblemIndex, actualActiveProblemIndexBeforeViewingPrevious: Para actualizar historial.
                  // - setFeedbackMessage, setFeedbackColor, setCurrentAttempts, setUserAnswersHistory, setActualActiveProblemIndexBeforeViewingPrevious, setProblemTimerValue, setProblemsList: Setters de estado/refs.
                  // - waitingRef: Para verificar el estado actual.
                  // - checkCurrentAnswer: Se llama dentro si hay input.
                  // - generateAdditionProblem: Se llama para compensación.
                  // - problemsList.length: Necesario si se añade un problema a problemsList.
                  // - settings: Necesario para acceder a enableCompensation, enableAdaptiveDifficulty, difficulty, maxAttempts, timeValue.
                  }, [
                     currentProblem, digitAnswers, currentAttempts, settings, autoContinue, blockAutoAdvance,
                     autoContinueTimerRef, handleContinue, t, userAnswersHistory, currentProblemIndex,
                     actualActiveProblemIndexBeforeViewingPrevious, setFeedbackMessage, setFeedbackColor,
                     setCurrentAttempts, setUserAnswersHistory, setActualActiveProblemIndexBeforeViewingPrevious,
                     setProblemTimerValue, setProblemsList, waitingRef, checkCurrentAnswer, generateAdditionProblem,
                     problemsList.length, adaptiveDifficulty // adaptiveDifficulty para compensación
                  ]);


                  // Usa useCallback para estabilizar la función advanceToNextActiveProblem
                  const advanceToNextActiveProblem = useCallback(() => {
                    console.log("[ADDITION] Advancing to next active problem.");
                    const nextActiveIdx = actualActiveProblemIndexBeforeViewingPrevious + 1;
                    if (nextActiveIdx < problemsList.length) {
                      setCurrentProblemIndex(nextActiveIdx); // Actualizar índice del problema actual
                      setCurrentProblem(problemsList[nextActiveIdx]); // Cargar el próximo problema
                      setActualActiveProblemIndexBeforeViewingPrevious(nextActiveIdx); // Actualizar el índice del problema activo

                      // Limpiar estados relacionados con el problema anterior
                      setFeedbackMessage(null);
                      setDigitAnswers(Array(problemsList[nextActiveIdx].answerMaxDigits).fill("")); // Limpiar cajas
                      setCurrentAttempts(0); // Resetear intentos para el NUEVO problema
                      setProblemTimerValue(settings.timeValue); // Resetear timer para el NUEVO problema
                      setWaitingForContinue(false); // Ya no estamos esperando 'Continuar' del problema anterior

                      // El useEffect del timer del problema se encargará de iniciarlo si settings.timeValue > 0

                    } else {
                      // No hay más problemas en la lista activa -> completar ejercicio
                      console.log("[ADDITION] No more problems. Completing exercise.");
                      completeExercise();
                    }
                  // Dependencias: actualActiveProblemIndexBeforeViewingPrevious, problemsList, settings.timeValue, completeExercise
                  // set... setters son estables.
                  }, [actualActiveProblemIndexBeforeViewingPrevious, problemsList, settings.timeValue, completeExercise /* set... setters */]);


                  // Usa useCallback para estabilizar la función handleContinue
                  const handleContinue = useCallback(() => {
                    // Se llama cuando el usuario hace clic en "Continuar" o por auto-continue timer.
                    // Debe pasar al siguiente problema o manejar el final del ejercicio.
                    console.log("[ADDITION] handleContinue called.");

                    // Limpiar cualquier timer de auto-continuar pendiente
                    if (autoContinueTimerRef.current) {
                        clearTimeout(autoContinueTimerRef.current);
                        autoContinueTimerRef.current = null;
                    }

                    // Si estamos mostrando el modal de level up, el botón "Continuar" en el modal
                    // tiene una lógica ligeramente diferente: oculta el modal, desbloquea el auto-avance
                    // y LUEGO regenera el problema actual con la nueva dificultad.
                    if (showLevelUpReward) {
                        console.log("[ADDITION] Handling continue after level up.");
                        setShowLevelUpReward(false); // Ocultar modal
                        setBlockAutoAdvance(false); // Desbloquear avance (permite avanzar *después* de regenerar)

                        // Regenerar el problema actual con la nueva dificultad adaptativa
                        // Esto reemplaza el problema que acabas de responder correctamente
                        const newProblemForLevelUp = generateAdditionProblem(adaptiveDifficulty);
                        const updatedProblemsList = [...problemsList];
                        // Reemplazar el problema en el índice donde ocurrió el level up
                        updatedProblemsList[actualActiveProblemIndexBeforeViewingPrevious] = newProblemForLevelUp;
                        setProblemsList(updatedProblemsList);
                        setCurrentProblem(newProblemForLevelUp); // Cargar el problema regenerado

                        // Preparar el estado para el nuevo problema regenerado
                        setDigitAnswers(Array(newProblemForLevelUp.answerMaxDigits).fill("")); // Limpiar cajas
                        setCurrentAttempts(0); // Resetear intentos
                        setProblemTimerValue(settings.timeValue); // Reiniciar timer
                        setFeedbackMessage(null); // Limpiar feedback
                        setWaitingForContinue(false); // Permitir interactuar con el nuevo problema

                        // Nota: El índice actual (currentProblemIndex) y el índice activo (actualActiveProblemIndexBeforeViewingPrevious)
                        // siguen siendo los mismos. El usuario está reintentando el mismo "slot" de problema, pero con una versión más difícil/fácil.
                        // No avanzar a nextActiveIdx aquí, el usuario debe resolver el problema regenerado primero.
                        return; // Lógica de level up manejada, salir.
                    }


                    // Si no hay bloqueo (ej. por modal de level up), avanzar al siguiente problema activo
                    if (!blockAutoAdvance) {
                        console.log("[ADDITION] Handling standard continue.");
                        // setWaitingForContinue(false); // Esto se hará dentro de advanceToNextActiveProblem
                        advanceToNextActiveProblem(); // Esta función maneja el avance o la finalización
                    } else {
                        console.log("[ADDITION] Continue blocked by blockAutoAdvance.");
                        // Si hay bloqueo (ej. modal de level up), no hacemos nada hasta que el bloqueo se levante.
                        // El botón "Continuar" del modal de level up ya llama a esta función, pero maneja el desbloqueo primero.
                    }

                  // Dependencias:
                  // - showLevelUpReward, adaptiveDifficulty, problemsList, actualActiveProblemIndexBeforeViewingPrevious, blockAutoAdvance: Para la lógica de level up.
                  // - settings.timeValue, generateAdditionProblem, advanceToNextActiveProblem: Para generar el nuevo problema y avanzar.
                  // - set... setters: Para actualizar el estado.
                  // - autoContinueTimerRef: Para limpiar el timer.
                  }, [
                     showLevelUpReward, adaptiveDifficulty, problemsList, actualActiveProblemIndexBeforeViewingPrevious,
                     blockAutoAdvance, settings.timeValue, generateAdditionProblem, advanceToNextActiveProblem, autoContinueTimerRef,
                     /* set... setters: setShowLevelUpReward, setBlockAutoAdvance, setProblemsList, setCurrentProblem, setDigitAnswers, setCurrentAttempts, setProblemTimerValue, setFeedbackMessage, setWaitingForContinue */
                  ]);


                  // Usa useCallback para estabilizar la función completeExercise
                  const completeExercise = useCallback(() => {
                    console.log("[ADDITION] Exercise completed.");
                    setExerciseCompleted(true);
                    // Detener ambos timers
                    if (generalTimerRef.current) clearInterval(generalTimerRef.current);
                    generalTimerRef.current = null;
                    if (singleProblemTimerRef.current) clearInterval(singleProblemTimerRef.current);
                    singleProblemTimerRef.current = null;
                     // Limpiar timer de auto-continuar por si acaso
                    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
                    autoContinueTimerRef.current = null;


                    // Calcular score final
                    const correctCount = userAnswersHistory.filter(a => a && a.isCorrect).length;

                    // Guardar resultado (useProgress es asumido externo)
                    saveExerciseResult({
                      operationId: "addition", // ID específico de la operación
                      date: new Date().toISOString(),
                      score: correctCount,
                      totalProblems: problemsList.length,
                      timeSpent: timer,
                      difficulty: (settings.enableAdaptiveDifficulty ? adaptiveDifficulty : settings.difficulty), // Guardar la dificultad final o configurada
                    });
                    console.log("[ADDITION] Exercise result saved.");

                  // Dependencias: userAnswersHistory, problemsList, timer, settings, adaptiveDifficulty, saveExerciseResult.
                  // set... setters son estables.
                  }, [userAnswersHistory, problemsList.length, timer, settings, adaptiveDifficulty, saveExerciseResult /* set... setters */]);


                  // Funciones de navegación entre problemas
                  const moveToPreviousProblem = () => {
                     console.log("[ADDITION] Moving to previous problem.");
                    // No se puede ir atrás si estamos en el primer problema visualizado actualmente
                    const canGoBack = viewingPrevious ? currentProblemIndex > 0 : actualActiveProblemIndexBeforeViewingPrevious > 0;

                    if (!canGoBack || exerciseCompleted) {
                        console.log("[ADDITION] Cannot move back.");
                        return; // No se puede ir más atrás o ejercicio completado
                    }

                    // Si no estábamos viendo anteriores, guardar el índice del problema activo actual
                    if (!viewingPrevious) {
                        setActualActiveProblemIndexBeforeViewingPrevious(currentProblemIndex);
                        console.log(`[ADDITION] Saving active problem index: ${currentProblemIndex}`);
                    }
                    setViewingPrevious(true); // Entrar en modo "ver anterior"

                    // Detener timer del problema activo (si estaba corriendo)
                    if (singleProblemTimerRef.current) {
                        clearInterval(singleProblemTimerRef.current);
                        singleProblemTimerRef.current = null;
                        console.log("[ADDITION] Stopped problem timer.");
                    }
                     // Limpiar timer de auto-continuar por si acaso
                    if (autoContinueTimerRef.current) {
                        clearTimeout(autoContinueTimerRef.current);
                        autoContinueTimerRef.current = null;
                    }
                     setWaitingForContinue(false); // No estamos esperando continuar en modo historial

                    // Calcular el índice del problema anterior a visualizar
                    const prevIndexToView = currentProblemIndex - 1;

                    // Cargar datos del problema anterior
                    setCurrentProblemIndex(prevIndexToView);
                    const prevProblemToView = problemsList[prevIndexToView];
                    setCurrentProblem(prevProblemToView);

                    // Cargar la respuesta registrada en el historial para este problema anterior
                    const prevAnswerEntry = userAnswersHistory[prevIndexToView];

                    if (prevAnswerEntry && prevProblemToView) {
                        console.log("[ADDITION] Loading history for previous problem:", prevIndexToView);
                        // Reconstruir la string de la respuesta para mostrar en las cajas
                        const answerStr = isNaN(prevAnswerEntry.userAnswer) ? "" : String(prevAnswerEntry.userAnswer);

                        // Asegurarse de que la string de respuesta tiene la cantidad correcta de decimales
                        const expectedDecimals = prevProblemToView.answerDecimalPosition || 0;
                        let [intPart, decPart = ""] = answerStr.split('.');
                        decPart = decPart.padEnd(expectedDecimals, '0').slice(0, expectedDecimals);

                        // Determinar cuántas cajas necesita la parte entera para este problema
                        const numIntBoxes = prevProblemToView.answerMaxDigits - expectedDecimals;

                        // Para la visualización en las cajas, reconstruimos la string completa.
                        // La parte entera debe ocupar `numIntBoxes` posiciones, rellenando con espacios a la izquierda si es vertical
                        // o simplemente mostrando los dígitos si es horizontal.
                        // Como estamos mostrando el input del usuario, es mejor no forzar padding con '0'
                        // a menos que el usuario los haya puesto. Sin embargo, el `userAnswer` numérico
                        // no distingue entre "05" y "5".
                        // Si queremos mostrar exactamente lo que el usuario tecleó, necesitaríamos guardarlo (userAnswerString).
                        // Como no está guardado, reconstruimos desde el número.
                        // Para vertical, rellenar la parte entera con espacios para alineación visual.
                        let displayIntPart = prevProblemToView.layout === 'vertical' ? intPart.padStart(numIntBoxes, ' ') : intPart;
                        // Para decimales, la parte decimal ya está padded con '0's arriba.

                        const reconstructedAnswerString = displayIntPart + decPart;

                        const restoredDigitAnswers = Array(prevProblemToView.answerMaxDigits).fill('');
                         // Rellenar las cajas con la string reconstruida
                         for (let i = 0; i < Math.min(restoredDigitAnswers.length, reconstructedAnswerString.length); i++) {
                             restoredDigitAnswers[i] = reconstructedAnswerString[i];
                         }

                        setDigitAnswers(restoredDigitAnswers);
                        // Mostrar feedback basado en el historial
                        setFeedbackMessage(
                            prevAnswerEntry.isCorrect ?
                            t('exercises.yourAnswerWasCorrect', { userAnswer: prevAnswerEntry.userAnswer }) :
                            t('exercises.yourAnswerWasIncorrect', { userAnswer: (prevAnswerEntry.userAnswer === undefined || isNaN(prevAnswerEntry.userAnswer) ? t('common.notAnswered') : prevAnswerEntry.userAnswer), correctAnswer: prevProblemToView.correctAnswer })
                        );
                        setFeedbackColor(prevAnswerEntry.isCorrect ? "green" : "red"); // O color de revelado si status es 'revealed'
                         if (prevAnswerEntry.status === 'revealed') setFeedbackColor("blue"); // Usar azul para respuestas reveladas en historial


                    } else {
                        console.log("[ADDITION] No history found for previous problem:", prevIndexToView);
                        // No hay respuesta registrada para este problema anterior
                        setDigitAnswers(prevProblemToView ? Array(prevProblemToView.answerMaxDigits).fill("") : []);
                        setFeedbackMessage(prevProblemToView ? t('exercises.noAnswerRecordedForThisProblem') : t('common.error'));
                        setFeedbackColor("blue"); // Color neutro para "no hay historial"
                    }
                    setFocusedDigitIndex(null); // Quitar foco de input
                  };

                  const returnToActiveProblem = () => {
                     console.log("[ADDITION] Returning to active problem:", actualActiveProblemIndexBeforeViewingPrevious);
                    setViewingPrevious(false); // Salir de modo "ver anterior"

                    // Cargar datos del problema que estaba activo
                    const activeProblem = problemsList[actualActiveProblemIndexBeforeViewingPrevious];
                    setCurrentProblemIndex(actualActiveProblemIndexBeforeViewingPrevious);
                    setCurrentProblem(activeProblem);

                    // Restaurar estado relacionado con el problema activo
                    const activeProblemHistory = userAnswersHistory[actualActiveProblemIndexBeforeViewingPrevious];

                    if (activeProblemHistory && activeProblem) {
                        // Restaurar las digitAnswers para el problema activo.
                        // Si guardamos userAnswerString en el historial, podríamos restaurarlo.
                        // Como no lo guardamos, limpiamos las cajas.
                        setDigitAnswers(Array(activeProblem.answerMaxDigits).fill("")); // Limpiar cajas

                        // Restaurar feedback y estado de espera basado en el historial del problema activo
                        const isResolved = activeProblemHistory.isCorrect || activeProblemHistory.status === 'revealed' || (settings.maxAttempts > 0 && activeProblemHistory.status === 'incorrect' && activeProblemHistory.userAnswer !== undefined && !isNaN(activeProblemHistory.userAnswer) /* && attemptsMade >= settings.maxAttempts */); // Asumimos attemptsMade check se hizo antes

                        if (isResolved || activeProblemHistory.status === 'timeout') {
                            // Si fue resuelto (correcta, revelada, intentos agotados) o timeout -> esperar continuar
                            setFeedbackMessage(
                                activeProblemHistory.isCorrect ?
                                t('exercises.correct') :
                                 activeProblemHistory.status === 'revealed' ? t('exercises.correctAnswerIs', { correctAnswer: activeProblem.correctAnswer }) :
                                 activeProblemHistory.status === 'timeout' ? t('exercises.timeUpNoAnswer', {attemptsMade: 1, maxAttempts: settings.maxAttempts}) : // Mensaje simplificado de timeout al recargar
                                t('exercises.noAttemptsLeftAnswerWas', { correctAnswer: activeProblem.correctAnswer }) // Mensaje de agotamiento de intentos
                            );
                            setFeedbackColor(activeProblemHistory.isCorrect ? "green" : (activeProblemHistory.status === 'revealed' ? "blue" : "red"));
                            setWaitingForContinue(true); // Esto actualizará waitingRef.current
                            setFocusedDigitIndex(null); // Quitar foco si está esperando continuar

                            // No iniciar timer del problema. Se iniciará/mantendrá detenido según waitingRef.current.

                        } else if (activeProblemHistory.status === 'incorrect' ) {
                            // Incorrecta pero aún con intentos restantes (o sin límite) -> puede reintentar
                             console.log("[ADDITION] Returning to active problem (incorrect, attempts remaining).");
                            setFeedbackMessage(t('exercises.yourPreviousAnswerWas', { userAnswer: activeProblemHistory.userAnswer }));
                            setFeedbackColor("red");
                            setWaitingForContinue(false); // Permitir reintentar
                            setProblemTimerValue(settings.timeValue); // Reiniciar timer para el intento
                            // Restaurar currentAttempts? No se guarda en historial. Reseteamos o mantenemos global.
                            // Manteniendo global por ahora.
                            // setCurrentAttempts(???);
                             // Enfocar input si se permite reintentar
                             const numBoxes = activeProblem.answerMaxDigits || 0;
                             if (activeProblem.layout === 'horizontal') {
                                setInputDirection('ltr');
                                setFocusedDigitIndex(numBoxes > 0 ? 0 : null);
                              } else { // Vertical
                                setInputDirection('rtl');
                                setFocusedDigitIndex(numBoxes > 0 ? numBoxes - 1 : null);
                              }


                        } else {
                            // Problema activo aún no intentado o status 'unanswered' -> limpiar y permitir empezar
                             console.log("[ADDITION] Returning to active problem (unattempted or unanswered).");
                            setFeedbackMessage(null);
                            setWaitingForContinue(false); // Permitir empezar
                            setProblemTimerValue(settings.timeValue); // Reiniciar timer
                            // setCurrentAttempts(0); // Resetear intentos para un problema no intentado
                             // Enfocar input si se permite empezar
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
                         console.log("[ADDITION] Returning to active problem (no history found).");
                        setDigitAnswers(Array(activeProblem.answerMaxDigits).fill(""));
                        setFeedbackMessage(null);
                        setWaitingForContinue(false);
                        setProblemTimerValue(settings.timeValue);
                        setCurrentAttempts(0);
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
                       console.error("[ADDITION] Error: No active problem found upon returning from history view.");
                       // Podríamos forzar un reset o mostrar un error.
                       setFeedbackMessage(t('common.errorLoadingProblem'));
                       setFeedbackColor("red");
                       setWaitingForContinue(false); // Permitir reset/otra acción
                       setFocusedDigitIndex(null);
                    }

                    // El useEffect del timer se encargará de reiniciarlo si !waitingRef.current y aplican otras condiciones.
                  };

                  // Manejo de clics en las cajas de input de dígitos
                  const handleDigitBoxClick = (index: number) => {
                    // Usar waitingRef.current para la comprobación más actualizada
                    if (waitingRef.current || exerciseCompleted || viewingPrevious) {
                       console.log("[ADDITION] Digit box click blocked:", { index, waiting: waitingRef.current, completed: exerciseCompleted, viewing: viewingPrevious });
                       return; // No permitir interacción si se está esperando, ejercicio completado o viendo historial
                    }
                    // Si el ejercicio no ha comenzado, empezarlo al primer clic de input
                    if (!exerciseStarted) {
                       startExercise();
                       console.log("[ADDITION] Exercise started by digit box click.");
                    }

                    // Determinar la dirección de input (LTR o RTL) basada en la posición de la caja y la presencia de decimales
                    if (currentProblem) {
                        const decPos = currentProblem.answerDecimalPosition || 0;
                        const intBoxes = currentProblem.answerMaxDigits - decPos;
                        // Si la caja clicada está en la parte entera, la dirección es RTL (para entrada de números grandes)
                        // Si la caja clicada está en la parte decimal, la dirección es LTR.
                        // Esto puede ser contra-intuitivo. El código original usaba RTL para vertical y LTR para horizontal.
                        // Mantendremos esa lógica simplificada: RTL para vertical, LTR para horizontal.
                        // La dirección del input afecta cómo se mueve el foco después de introducir un dígito.
                        setInputDirection(currentProblem.layout === 'vertical' ? 'rtl' : 'ltr');
                        setFocusedDigitIndex(index); // Establecer el foco en la caja clicada
                        console.log(`[ADDITION] Digit box ${index} clicked. Setting focus and input direction ${currentProblem.layout === 'vertical' ? 'rtl' : 'ltr'}.`);
                    } else {
                       console.log("[ADDITION] Digit box clicked but no current problem.");
                    }

                    // El useEffect de enfocar se encargará de poner el foco real
                  };

                  // Manejo de input virtual (clics en botones numéricos o backspace)
                  const handleDigitInput = (value: string) => {
                     // Usar waitingRef.current para la comprobación más actualizada
                    if (waitingRef.current || focusedDigitIndex === null || !currentProblem || exerciseCompleted || viewingPrevious) {
                       console.log("[ADDITION] Digit input blocked:", { value, focused: focusedDigitIndex, currentProblem: !!currentProblem, completed: exerciseCompleted, viewing: viewingPrevious, waiting: waitingRef.current });
                       return; // Bloquear input si no hay foco, no hay problema, ejercicio completado, viendo historial o esperando
                    }
                     // Si el ejercicio no ha comenzado, empezarlo al primer input válido
                     if (!exerciseStarted && value !== "backspace" && /[0-9]/.test(value)) {
                        startExercise();
                         console.log("[ADDITION] Exercise started by digit input.");
                     }

                    let newAnswers = [...digitAnswers];
                    let currentFocus = focusedDigitIndex;
                    const maxDigits = currentProblem.answerMaxDigits;

                    if (value === "backspace") {
                        // Borrar el dígito actual y mover el foco hacia atrás (si inputDirection es LTR)
                        // o hacia adelante (si inputDirection es RTL) - esta es la lógica común de calculadoras/inputs RTL.
                        newAnswers[currentFocus] = ""; // Borrar el contenido de la caja actual
                        // Mover el foco
                         if (inputDirection === 'rtl') { // Si estamos en RTL (ej. vertical), backspace mueve el foco hacia la DERECHA
                             if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1);
                         } else { // Si estamos en LTR (ej. horizontal), backspace mueve el foco hacia la IZQUIERDA
                             if (currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
                         }

                    } else if (/[0-9]/.test(value)) { // Input es un dígito
                      newAnswers[currentFocus] = value; // Poner el dígito en la caja actual
                      // Mover el foco al siguiente dígito según la dirección
                      if (inputDirection === 'rtl') { // Si es RTL, el siguiente dígito está a la IZQUIERDA
                        if (currentFocus > 0) setFocusedDigitIndex(currentFocus - 1);
                        else { // Si ya estamos en la primera caja (más a la izquierda en RTL), quedarnos ahí
                           // Opcional: si ya estás en el último dígito a la izquierda (en RTL), podrías mover el foco a la caja anterior (a la derecha) para simular un 'overflow' de entrada, pero quedarse está bien.
                        }
                      } else { // Si es LTR, el siguiente dígito está a la DERECHA
                        if (currentFocus < maxDigits - 1) setFocusedDigitIndex(currentFocus + 1);
                         else { // Si ya estamos en la última caja (más a la derecha en LTR), quedarnos ahí
                            // Opcional: podrías mover el foco a la primera caja (a la izquierda) para empezar de nuevo.
                         }
                      }
                    }
                    setDigitAnswers(newAnswers);
                    console.log(`[ADDITION] Input: "${value}". New answers: ${newAnswers.join('')}. New focus: ${focusedDigitIndex}.`);
                  };


                  // Hook para manejar eventos de teclado físicos
                   useEffect(() => {
                    const handlePhysicalKeyDown = (event: KeyboardEvent) => {
                      // Usar waitingRef.current para la comprobación más actualizada
                      if (focusedDigitIndex === null || waitingRef.current || exerciseCompleted || viewingPrevious || showLevelUpReward || !currentProblem) {
                         // console.log("[ADDITION] Physical key blocked:", { key: event.key, focused: focusedDigitIndex, waiting: waitingRef.current, completed: exerciseCompleted, viewing: viewingPrevious, levelUp: showLevelUpReward, currentProblem: !!currentProblem });
                         return; // Bloquear keydown si no hay foco, esperando, completado, viendo historial, level up modal activo, o no hay problema
                      }

                      const key = event.key;
                      const maxDigits = currentProblem.answerMaxDigits;

                      if (key >= '0' && key <= '9') {
                          // Input numérico
                          let newAnswers = [...digitAnswers];
                          newAnswers[focusedDigitIndex] = key;
                          setDigitAnswers(newAnswers);
                          // Mover foco según inputDirection
                          if (inputDirection === 'rtl') {
                              if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
                          } else {
                              if (focusedDigitIndex < maxDigits - 1) setFocusedDigitIndex(focusedDigitIndex + 1);
                          }
                          event.preventDefault(); // Prevenir el comportamiento por defecto del navegador (ej. scroll)
                          // console.log(`[ADDITION] Key "${key}". New answers: ${newAnswers.join('')}. New focus: ${focusedDigitIndex}.`);

                      } else if (key === 'Backspace') {
                          // Borrar y mover foco
                          let newAnswers = [...digitAnswers];
                          newAnswers[focusedDigitIndex] = "";
                          setDigitAnswers(newAnswers);
                           // Mover foco según inputDirection
                           if (inputDirection === 'rtl') { // Backspace en RTL mueve foco a la DERECHA
                               if (focusedDigitIndex < maxDigits - 1) setFocusedDigitIndex(focusedDigitIndex + 1);
                           } else { // Backspace en LTR mueve foco a la IZQUIERDA
                               if (focusedDigitIndex > 0) setFocusedDigitIndex(focusedDigitIndex - 1);
                           }
                          event.preventDefault();
                          // console.log(`[ADDITION] Key "Backspace". New answers: ${newAnswers.join('')}. New focus: ${focusedDigitIndex}.`);

                      } else if (key === 'Enter') {
                          // Verificar respuesta al presionar Enter
                           console.log("[ADDITION] Key 'Enter'. Calling checkCurrentAnswer...");
                          checkCurrentAnswer(); // Llama a la función memoizada
                          event.preventDefault();

                      } else if (key === 'ArrowLeft') {
                          // Mover foco a la izquierda
                          if (focusedDigitIndex > 0) {
                            setFocusedDigitIndex(focusedDigitIndex - 1);
                            // console.log(`[ADDITION] Key "ArrowLeft". New focus: ${focusedDigitIndex - 1}.`);
                          }
                          event.preventDefault();

                      } else if (key === 'ArrowRight') {
                          // Mover foco a la derecha
                          if (focusedDigitIndex < maxDigits - 1) {
                              setFocusedDigitIndex(focusedDigitIndex + 1);
                              // console.log(`[ADDITION] Key "ArrowRight". New focus: ${focusedDigitIndex + 1}.`);
                          }
                          event.preventDefault();
                      }
                    };

                    document.addEventListener('keydown', handlePhysicalKeyDown);

                    return () => {
                      document.removeEventListener('keydown', handlePhysicalKeyDown);
                    };

                  // Dependencias:
                  // - focusedDigitIndex: Para saber en qué caja estamos.
                  // - waitingRef.current, exerciseCompleted, viewingPrevious, showLevelUpReward, currentProblem: Controlan si el evento es procesado.
                  // - digitAnswers: Para modificar el array.
                  // - inputDirection, currentProblem.answerMaxDigits: Para determinar el movimiento del foco.
                  // - checkCurrentAnswer: La función llamada por Enter.
                  // - set... setters: Para actualizar el estado (setDigitAnswers, setFocusedDigitIndex).
                  }, [focusedDigitIndex, waitingRef, exerciseCompleted, viewingPrevious, showLevelUpReward, currentProblem,
                      digitAnswers, inputDirection, checkCurrentAnswer /* set... setters */
                  ]);


                   // UI - Mostrar mensaje de carga/error si los problemas no están listos
                  if (!currentProblem && problemsList.length === 0 && !exerciseCompleted) {
                    return <div className="p-8 text-center">{t('common.loadingProblems')}...</div>;
                  }
                  // Esto puede ocurrir brevemente después de generar problemas pero antes de que se cargue el primero
                  if (!currentProblem && !exerciseCompleted) {
                     console.log("[ADDITION] currentProblem is null, but exercise not completed. Attempting to load from list.");
                     if(problemsList.length > actualActiveProblemIndexBeforeViewingPrevious) {
                       setCurrentProblem(problemsList[actualActiveProblemIndexBeforeViewingPrevious]);
                     } else if (problemsList.length > 0) {
                        // Fallback si el índice activo guardado es inválido (ej. lista se acortó)
                        setCurrentProblemIndex(0);
                        setActualActiveProblemIndexBeforeViewingPrevious(0);
                        setCurrentProblem(problemsList[0]);
                     } else {
                        // No hay problemas en la lista? Esto no debería ocurrir si el primer if de carga falló.
                        return <div className="p-8 text-center">{t('common.errorLoadingProblem')}</div>;
                     }
                     return <div className="p-8 text-center">{t('common.reloadingProblem')}...</div>;
                  }

                  // UI - Mostrar resumen al completar el ejercicio
                  if (exerciseCompleted) {
                    const finalScore = userAnswersHistory.filter(a => a && a.isCorrect).length;
                    return (
                      <div className="px-4 py-5 sm:p-6 text-center">
                         {/* Trophy es asumido externo */}
                        <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">{t('Congratulations, You Have Completed The Established Exercises15')}</h2>
                        <p className="text-gray-700 mt-2">{t('Your Score Is')} {finalScore}/{problemsList.length}</p>
                         {/* formatTime es asumido externo */}
                        <p className="text-gray-600">{t('exercises.timeTaken')}: {formatTime(timer)}</p>
                        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
                           {/* Button es asumido externo */}
                          <Button onClick={generateNewProblemSet} className="w-full sm:w-auto">
                            {t('exercises.tryAgain')}
                          </Button>
                           {/* Button y Settings icon son asumidos externos */}
                          <Button variant="outline" onClick={onOpenSettings} className="w-full sm:w-auto">
                            <Cog className="mr-2 h-4 w-4" />
                            {t('common.settings')}
                          </Button>
                        </div>
                      </div>
                    );
                  }

                   // Si llegamos aquí, currentProblem existe y el ejercicio no está completado.
                   // Renderizar la interfaz principal del ejercicio.

                  // Calcular información para la alineación vertical si es necesario
                  const { maxIntLength = 0, maxDecLength = 0, operandsFormatted = [], sumLineTotalCharWidth = 0 } =
                    currentProblem.layout === 'vertical'
                    ? getVerticalAlignmentInfo(currentProblem.operands, currentProblem.answerDecimalPosition)
                    : { operandsFormatted: currentProblem.operands.map(op => ({original: op, intStr: String(op), decStr: ""})), maxIntLength:0, maxDecLength:0, sumLineTotalCharWidth:0 };

                  // Calcular progreso y score
                  const attemptedProblemsCount = userAnswersHistory.filter(a => a !== null).length;
                  const progressValue = problemsList.length > 0 ? (attemptedProblemsCount / problemsList.length) * 100 : 0;
                  const score = userAnswersHistory.filter(a => a && a.isCorrect).length;

                  // Determinar el tema de color basado en la dificultad actual (adaptativa si está activa)
                   const currentThemeDifficulty = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
                    const themeClass =
                      currentThemeDifficulty === "beginner" ? "bg-blue-50 border-blue-200" :
                      currentThemeDifficulty === "elementary" ? "bg-emerald-50 border-emerald-200" :
                      currentThemeDifficulty === "intermediate" ? "bg-orange-50 border-orange-200" :
                      currentThemeDifficulty === "advanced" ? "bg-purple-50 border-purple-200" :
                      currentThemeDifficulty === "expert" ? "bg-rose-50 border-rose-200" :
                      "bg-indigo-50 border-indigo-200"; // Fallback

                  return (
                    <div className="relative">
                       {/* Componentes que flotan por encima del ejercicio, asumidos externos */}
                      <LevelUpHandler />
                      <RewardAnimation />

                      {/* Modal/Overlay de Level Up */}
                      {showLevelUpReward && (
                           // Este div crea un overlay de pantalla completa. Asegúrate de que el z-index es adecuado.
                          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"> {/* Ajustar z-index si es necesario */}
                            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
                               {/* Trophy es asumido externo */}
                              <Trophy className="h-20 w-20 sm:h-24 sm:w-24 text-yellow-400 mx-auto mb-3 sm:mb-4" />
                              <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('levelUp.title')}</h3>
                               {/* t() es asumido externo */}
                              <p className="text-lg sm:text-xl mb-4 sm:mb-6">{t('levelUp.message', { level: t(adaptiveDifficulty) })}</p>
                               {/* Button es asumido externo */}
                              <Button onClick={handleContinue} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg py-2.5 sm:py-3">
                                {t('levelUp.continueChallenge')}
                              </Button>
                            </div>
                          </div>
                        )}

                      {/* Contenedor principal del ejercicio con tema de dificultad */}
                      <div className={`px-2 py-3 sm:px-4 sm:py-5 rounded-xl shadow-lg ${themeClass} border-2`}>
                        {/* Header con título, timers, intentos y botón de configuración */}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{t('Addition')}</h2>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                 {/* Icono Info y formatTime son asumidos externos */}
                                <span className="font-medium text-gray-700 flex items-center"><Info className="h-4 w-4 mr-1 opacity-70"/>{formatTime(timer)}</span>
                                {/* Timer del problema actual, visible si timeValue > 0, no viendo historial, no esperando, iniciado, y quedan intentos */}
                                {settings.timeValue > 0 && !viewingPrevious && !waitingRef.current && exerciseStarted && (settings.maxAttempts === 0 || currentAttempts < settings.maxAttempts) && (
                                  <span className={`font-medium p-1 rounded ${problemTimerValue <= 5 && problemTimerValue > 0 ? "text-red-600 animate-pulse bg-red-100" : "text-gray-700 bg-gray-100"}`}>
                                    P: {problemTimerValue}s
                                  </span>
                                )}
                                {/* Contador de intentos, visible si maxAttempts > 0 y no viendo historial */}
                                {settings.maxAttempts > 0 && !viewingPrevious && (
                                   // Tooltip components son asumidos externos
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
                                {/* Indicador de nivel de dificultad */}
                                <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                                   currentThemeDifficulty === "beginner" ? "bg-blue-100 text-blue-800" :
                                   currentThemeDifficulty === "elementary" ? "bg-emerald-100 text-emerald-800" :
                                   currentThemeDifficulty === "intermediate" ? "bg-orange-100 text-orange-800" :
                                   currentThemeDifficulty === "advanced" ? "bg-purple-100 text-purple-800" :
                                   currentThemeDifficulty === "expert" ? "bg-rose-100 text-rose-800" :
                                  "bg-indigo-100 text-indigo-800"
                                }`}>
                                    {t('Level')}: {t(currentThemeDifficulty)}
                                </span>
                                {/* Botón para abrir configuración */}
                                 {/* Button y Cog icon son asumidos externos */}
                                <Button variant="ghost" size="sm" onClick={onOpenSettings} className="flex items-center gap-1 py-1 px-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100">
                                  <Cog className="h-4 w-4" /> {t('common.settings')}
                                </Button>
                            </div>
                        </div>
                        {/* Barra de progreso */}
                         {/* ProgressBarUI es asumido externo */}
                        <ProgressBarUI value={progressValue} className="h-1.5 sm:h-2 mb-1" />
                        {/* Contador de problemas y score */}
                        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                            <span>{t('Problem')} {currentProblemIndex + 1} {t('of')} {problemsList.length}</span>
                            <span className="font-semibold">{t('exercises.score')}: {score}</span>
                        </div>

                        {/* Área del problema y la respuesta */}
                        <div className={`p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 shadow-md bg-white min-h-[150px] sm:min-h-[180px] flex flex-col items-center justify-center`}>
                          {/* Visualización del problema (Horizontal vs Vertical) */}
                          {currentProblem.layout === 'horizontal' ? (
                            <div className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                              {currentProblem.operands.map((op, index) => (
                                <React.Fragment key={`op-${index}-${currentProblem.id}`}>
                                  <span>{op}</span>
                                  {index < currentProblem.operands.length - 1 && <span className="text-gray-600 mx-0.5 sm:mx-1">+</span>}
                                </React.Fragment>
                              ))}
                              <span className="text-gray-600 mx-0.5 sm:mx-1">=</span>
                            </div>
                          ) : (
                             // Vista vertical
                            <div className="inline-block text-right my-1 sm:my-2">
                              {operandsFormatted.map((op, index) => (
                                <div key={`op-v-${index}-${currentProblem.id}`} className={verticalOperandStyle}>
                                   {/* Mostrar el signo + solo antes del último operando si hay más de uno */}
                                  {index === operandsFormatted.length -1 && operandsFormatted.length > 1 && <span className={plusSignVerticalStyle}>+</span>}
                                  <span>{op.intStr}</span>
                                   {/* Mostrar punto decimal y parte decimal si hay decimales esperados */}
                                  {maxDecLength > 0 && (
                                    <>
                                      <span className="opacity-60">.</span>
                                      <span>{op.decStr}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                               {/* Línea de suma */}
                              <div
                                className={sumLineStyle}
                                 // Ajustar ancho y alineación derecha
                                style={{width: `${Math.max(5, sumLineTotalCharWidth)}ch`, marginLeft: 'auto', marginRight: '0'}}
                              />
                            </div>
                          )}

                          {/* Cajones de input para la respuesta */}
                          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
                            {Array(currentProblem.answerMaxDigits).fill(0).map((_, index) => {
                              // Determinar si debe haber un punto decimal visual después de esta caja
                              const integerDigitsCount = currentProblem.answerMaxDigits - (currentProblem.answerDecimalPosition || 0);
                              const isVisualDecimalPointAfterThisBox = currentProblem.answerDecimalPosition !== undefined &&
                                                                       currentProblem.answerDecimalPosition > 0 &&
                                                                       index === integerDigitsCount - 1 &&
                                                                       integerDigitsCount < currentProblem.answerMaxDigits; // Asegurar que hay cajas decimales después


                              return (
                                <React.Fragment key={`digit-box-frag-${index}-${currentProblem.id}`}>
                                  <div
                                    // Usar la referencia para guardar el elemento DOM
                                    ref={el => {
                                       if (el) {
                                          // Almacenar la referencia en el array mutable
                                           digitBoxRefs.current[index] = el;
                                       }
                                    }}
                                    tabIndex={viewingPrevious || exerciseCompleted || waitingRef.current || showLevelUpReward ? -1 : 0} // No focusable si está deshabilitado
                                    className={`${digitBoxBaseStyle}
                                                ${viewingPrevious || exerciseCompleted || waitingRef.current || showLevelUpReward ? digitBoxDisabledStyle : (focusedDigitIndex === index ? digitBoxFocusStyle : digitBoxBlurStyle)}
                                                ${!viewingPrevious && !exerciseCompleted && !waitingRef.current && !showLevelUpReward ? 'cursor-text hover:border-gray-400' : ''}`}
                                    onClick={() => !viewingPrevious && !exerciseCompleted && !waitingRef.current && !showLevelUpReward && handleDigitBoxClick(index)}
                                    onFocus={() => {if (!viewingPrevious && !exerciseCompleted && !waitingRef.current && !showLevelUpReward) setFocusedDigitIndex(index);}}
                                    // Permitir input directo solo si no está deshabilitado
                                    // inputMode="numeric" // Sugiere teclado numérico en móviles
                                    // pattern="[0-9]*" // Ayuda a validar y sugerir teclado en móviles
                                  >
                                    {/* Mostrar el dígito o un espacio transparente */}
                                    {digitAnswers[index] || <span className="opacity-0">0</span>}
                                  </div>
                                   {/* Renderizar el punto decimal si corresponde */}
                                  {isVisualDecimalPointAfterThisBox && (
                                    <div className="text-2xl sm:text-3xl font-bold mx-0.5 sm:mx-1 opacity-80 self-center pt-1 select-none">.</div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                           {/* Área de feedback (Correcto/Incorrecto/Tiempo/Revelado) */}
                          {feedbackMessage && (viewingPrevious || (!viewingPrevious && currentProblemIndex === actualActiveProblemIndexBeforeViewingPrevious) || exerciseCompleted) && (
                            <div className={`mt-2 sm:mt-3 text-center font-medium text-sm sm:text-base ${feedbackColor === "green" ? "text-green-600" : feedbackColor === "blue" ? "text-blue-700" : "text-red-600"}`}>
                              {feedbackMessage}
                            </div>
                          )}
                        </div>

                        {/* Teclado numérico virtual */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-xs mx-auto">
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"].map((key, idx) => (
                            /* Button es asumido externo */
                            <Button
                              key={key || `empty-key-${idx}`}
                              variant="outline"
                              className={`text-lg sm:text-xl h-11 sm:h-12 ${key === "" ? "invisible pointer-events-none" : "bg-white hover:bg-gray-50 shadow-sm active:bg-gray-100"}`}
                               // Deshabilitar botones si está esperando, completado, viendo historial, level up activo, o si es el espacio vacío,
                               // o si el ejercicio no ha empezado y no es un dígito o backspace (aunque backspace sin input no hace nada).
                              onClick={() => !viewingPrevious && !exerciseCompleted && !waitingRef.current && !showLevelUpReward && key && key !== "" && handleDigitInput(key)}
                              disabled={waitingRef.current || exerciseCompleted || viewingPrevious || showLevelUpReward || key === ""}
                            >
                              {/* ChevronLeft icon es asumido externo */}
                              {key === "backspace" ? <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" /> : key}
                            </Button>
                          ))}
                        </div>

                        {/* Controles de navegación y acción principal */}
                        <div className="mt-4 sm:mt-6 flex justify-between items-center">
                           {/* Botón Anterior */}
                           {/* Button y ChevronLeft icon son asumidos externos */}
                          <Button
                            variant="outline" size="sm"
                             // Deshabilitar si es el primer problema activo O si estamos viendo historial y es el primer problema del historial
                            disabled={(!viewingPrevious && actualActiveProblemIndexBeforeViewingPrevious === 0) || (viewingPrevious && currentProblemIndex === 0) || exerciseCompleted || showLevelUpReward}
                            onClick={moveToPreviousProblem}
                            className="text-xs sm:text-sm"
                          >
                            <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {t('common.prev')}
                          </Button>

                          {/* Botón central: Volver al Activo, Continuar, o Check/Start */}
                          {viewingPrevious ? (
                            /* Botón es asumido externo */
                            /* RotateCcw icon es asumido externo */
                            <Button onClick={returnToActiveProblem} className="px-4 sm:px-5 text-sm sm:text-base bg-orange-500 hover:bg-orange-600 text-white">
                                <RotateCcw className="mr-1 h-4 w-4" /> {t('common.returnToActive')}
                            </Button>
                          ) : waitingRef.current ? (
                            <Button
                              onClick={handleContinue}
                              disabled={showLevelUpReward}
                              className={`px-5 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg ${showLevelUpReward ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 animate-pulse'} text-white flex items-center justify-center w-full max-w-xs mx-auto`}
                            >
                              <span className="flex-grow text-center font-medium">{t('Continue')}</span>
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`ml-3 flex items-center bg-black/20 py-1 px-2 rounded-md cursor-pointer ${showLevelUpReward ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={(e) => {
                                        if (!showLevelUpReward) {
                                          e.stopPropagation(); // Evita que el clic se propague al botón padre
                                          setAutoContinue(prev => !prev);
                                        }
                                      }}
                                    >
                                      {/* Check icon es asumido externo */}
                                      <div className={`h-4 w-4 border border-white rounded-sm flex items-center justify-center mr-1.5 ${autoContinue ? 'bg-white' : ''}`}>
                                        {autoContinue && <Check className="h-3 w-3 text-green-700" />}
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
                            <Button
                              onClick={checkCurrentAnswer}
                              disabled={exerciseCompleted || waitingRef.current || viewingPrevious || showLevelUpReward}
                              className={`px-5 sm:px-6 text-sm sm:text-base ${exerciseCompleted || waitingRef.current || viewingPrevious || showLevelUpReward ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                            >
                              {!exerciseStarted ? t('exercises.start') : <><Check className="mr-1 h-4 w-4" />{t('exercises.check')}</>}
                            </Button>
                          )}

                           {/* Botón Mostrar Respuesta */}
                           {/* Button y Info icon son asumidos externos */}
                           {/* Tooltip components son asumidos externos */}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                    variant="outline" size="sm"
                                     // Deshabilitado si no se permite mostrar respuesta en settings Y no estás viendo historial,
                                     // o si estás viendo historial, o si el ejercicio está completado, esperando, o level up activo.
                                    disabled={(!settings.showAnswerWithExplanation && !viewingPrevious) || viewingPrevious || exerciseCompleted || waitingRef.current || showLevelUpReward}
                                    onClick={() => {
                                        // Solo permitir si no está viendo historial, no completado, no esperando, no level up activo, Y se permite mostrar en settings.
                                        if(currentProblem && !viewingPrevious && !exerciseCompleted && !waitingRef.current && !showLevelUpReward && settings.showAnswerWithExplanation) {
                                            console.log("[ADDITION] Showing answer...");
                                            // Detener timer del problema si está corriendo
                                            if (singleProblemTimerRef.current) {
                                              clearInterval(singleProblemTimerRef.current);
                                              singleProblemTimerRef.current = null;
                                            }
                                            // Mostrar la respuesta correcta
                                            setFeedbackMessage(t('exercises.correctAnswerIs', { correctAnswer: currentProblem.correctAnswer }));
                                            setFeedbackColor("blue"); // Color para respuesta revelada
                                            setWaitingForContinue(true); // Pone waitingRef.current = true -> espera para continuar

                                            // Actualizar historial para marcar como revelado
                                            const problemIdxForHistory = actualActiveProblemIndexBeforeViewingPrevious;
                                            const answerEntry = userAnswersHistory[problemIdxForHistory];

                                            // Crear o actualizar la entrada del historial
                                             const updatedHistoryEntry: UserAnswer = answerEntry ? {
                                                 ...answerEntry, // Mantener id, problem
                                                 userAnswer: NaN, // No se introdujo una respuesta válida
                                                 isCorrect: false, // No fue resuelta correctamente por el usuario
                                                 status: 'revealed', // Marcada explícitamente como revelada
                                                 // attemptsMade: (answerEntry.attemptsMade || 0) + 1, // Contar como un intento si se revela? Original lo hacía.
                                             } : {
                                                 problemId: currentProblem.id,
                                                 problem: currentProblem,
                                                 userAnswer: NaN,
                                                 isCorrect: false,
                                                 status: 'revealed',
                                                 // attemptsMade: 1, // Primer "intento" (revelado)
                                             };

                                            setUserAnswersHistory(prev => {
                                                const newHistory = [...prev];
                                                newHistory[problemIdxForHistory] = updatedHistoryEntry;
                                                return newHistory;
                                            });

                                            // Contar como un intento si maxAttempts > 0 y no se han agotado
                                             if (settings.maxAttempts > 0 && currentAttempts < settings.maxAttempts) {
                                                 setCurrentAttempts(prev => prev + 1); // Incrementar intentos
                                             } else if (settings.maxAttempts === 0) {
                                                 // Si no hay límite de intentos, ¿contar como intento?
                                                 // La lógica original incrementaba. Lo mantenemos.
                                                 setCurrentAttempts(prev => prev + 1);
                                             }

                                            // Lógica de compensación: añadir problema si se revela la respuesta
                                             if (settings.enableCompensation) {
                                                console.log("[ADDITION] Compensation enabled. Adding one problem due to revealing answer.");
                                                const difficultyForCompensation = settings.enableAdaptiveDifficulty ? adaptiveDifficulty : (settings.difficulty as DifficultyLevel);
                                                const compensationProblem = generateAdditionProblem(difficultyForCompensation);
                                                setProblemsList(prev => [...prev, compensationProblem]);
                                                setUserAnswersHistory(prev => [...prev, null]); // Añadir un slot vacío
                                                console.log("[ADDITION] Problem added due to compensation (reveal).");
                                             }

                                             // Iniciar timer de auto-continuar si está activado (incluso después de revelar)
                                             if (autoContinue && !blockAutoAdvance) {
                                                if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
                                                console.log("[ADDITION] Auto-continue enabled after revealing, waiting 3s...");
                                                autoContinueTimerRef.current = setTimeout(() => {
                                                    if (!blockAutoAdvance && waitingRef.current) {
                                                         console.log("[ADDITION] Auto-continuing after revealing...");
                                                        handleContinue();
                                                        autoContinueTimerRef.current = null;
                                                    } else {
                                                        console.log("[ADDITION] Auto-continue blocked or waiting state changed after revealing.");
                                                    }
                                                }, 3000);
                                             }

                                        }
                                    }}
                                    className="text-xs sm:text-sm"
                                >
                                    <Info className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {t('exercises.showAnswer')}
                                </Button>
                              </TooltipTrigger>
                               {/* Tooltip content */}
                              {(!settings.showAnswerWithExplanation && !viewingPrevious && !waitingRef.current && !showLevelUpReward) ? (
                                  <TooltipContent><p>{t('tooltips.activateShowAnswerInSettings')}</p></TooltipContent>
                              ) : viewingPrevious ? (
                                  <TooltipContent><p>{t('tooltips.showAnswerDisabledInHistory')}</p></TooltipContent>
                              ) : waitingRef.current || showLevelUpReward ? ( // Usar waitingRef.current o showLevelUpReward
                                  <TooltipContent><p>{t('tooltips.showAnswerDisabledWhileWaiting')}</p></TooltipContent>
                              ) : null }
                            </Tooltip>
                          </TooltipProvider>

                        </div>
                      </div>
                    </div>
                  );
                }


                // ========================================================================================
                // EXPORTACIÓN DEL MÓDULO (Originalmente index.ts)
                // ========================================================================================

                export default { Exercise, Settings };
                // Si quieres exportar individualmente:
                // export { Exercise, Settings };
              