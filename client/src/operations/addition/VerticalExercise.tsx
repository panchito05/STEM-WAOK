import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { DifficultyLevel, AdditionProblem } from "./types";

interface VerticalExerciseProps {
  problem: AdditionProblem;
  onSubmit: (answer: number) => void;
  isActive: boolean;
  currentAttempts: number;
  maxAttempts: number;
  waitingForContinue: boolean;
  difficultyLevel: DifficultyLevel;
}

/**
 * NUEVA IMPLEMENTACIÓN DEL COMPONENTE
 * 
 * Arquitectura completamente rediseñada para manejar sumas verticales con decimales:
 * 1. Modelo de datos más claro y explícito para seguimiento de valores
 * 2. Manejo independiente de parte entera y parte decimal
 * 3. Renderizado basado en posiciones específicas
 * 4. Validación simplificada y robusta
 */
export default function VerticalExercise({
  problem,
  onSubmit,
  isActive,
  currentAttempts,
  maxAttempts,
  waitingForContinue,
  difficultyLevel
}: VerticalExerciseProps) {
  // Usamos el patrón temporal mientras arreglamos el problema con i18n
  const useTranslation = () => ({ t: (key: string) => key.includes('.') ? key.split('.')[1] : key });
  const { t } = useTranslation();

  // -------- ESTADO Y REFERENCIAS --------
  
  // Los inputs del usuario se separan explícitamente entre parte entera y decimal
  const [integerInputs, setIntegerInputs] = useState<string[]>([]);
  const [decimalInputs, setDecimalInputs] = useState<string[]>([]);
  
  // Referencias para los campos de texto
  const integerRefs = useRef<(HTMLInputElement | null)[]>([]);
  const decimalRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // -------- PROCESAMIENTO INICIAL DE DATOS --------
  
  // Identificamos explícitamente las características de cada número
  const num1Str = problem.num1.toString();
  const num2Str = problem.num2.toString();
  const expectedAnswer = problem.correctAnswer;
  const expectedAnswerStr = expectedAnswer.toString();
  
  // Descomponemos en parte entera y decimal de manera explícita
  const hasDecimal1 = num1Str.includes('.');
  const hasDecimal2 = num2Str.includes('.');
  const hasDecimalResult = expectedAnswerStr.includes('.');
  const useDecimalFormat = hasDecimal1 || hasDecimal2 || hasDecimalResult;
  
  // Obtenemos las partes de cada número
  const [int1 = "", dec1 = ""] = num1Str.split('.');
  const [int2 = "", dec2 = ""] = num2Str.split('.');
  const [intResult = "", decResult = ""] = expectedAnswerStr.split('.');
  
  // Calculamos el tamaño requerido para cada sección
  const maxIntLength = Math.max(int1.length, int2.length, intResult.length);
  const maxDecLength = useDecimalFormat ? 
    Math.max(dec1.length, dec2.length, decResult.length, 1) : 0;
  
  // Parseamos los números para verificación
  const num1Value = parseFloat(num1Str);
  const num2Value = parseFloat(num2Str);
  const resultValue = num1Value + num2Value;
  
  // -------- FORMATEADO PARA VISUALIZACIÓN --------
  
  // Creamos los arreglos de visualización alineados correctamente
  const num1Integers = int1.padStart(maxIntLength, ' ').split('');
  const num2Integers = int2.padStart(maxIntLength, ' ').split('');
  
  const num1Decimals = useDecimalFormat ? dec1.padEnd(maxDecLength, '0').split('') : [];
  const num2Decimals = useDecimalFormat ? dec2.padEnd(maxDecLength, '0').split('') : [];
  
  // -------- EFECTOS PARA MANEJO DEL ESTADO --------
  
  // Inicializamos los inputs cuando cambia el problema
  useEffect(() => {
    // Inicializar arreglos de inputs
    setIntegerInputs(Array(maxIntLength).fill(''));
    setDecimalInputs(useDecimalFormat ? Array(maxDecLength).fill('') : []);
    
    // Inicializar referencias
    integerRefs.current = Array(maxIntLength).fill(null);
    decimalRefs.current = Array(maxDecLength).fill(null);
    
    // Registrar información para depuración
    console.log('[VERTICAL_EXERCISE] Inicialización del ejercicio:', {
      operandos: { num1: num1Str, num2: num2Str },
      resultado: expectedAnswerStr,
      formato: { 
        useDecimal: useDecimalFormat,
        maxIntLength,
        maxDecLength 
      },
      visualización: {
        num1: { integers: num1Integers, decimals: num1Decimals },
        num2: { integers: num2Integers, decimals: num2Decimals }
      }
    });
    
    // Si el ejercicio está activo, enfocar automáticamente el último dígito
    if (isActive) {
      setTimeout(() => {
        if (useDecimalFormat && maxDecLength > 0 && decimalRefs.current[maxDecLength - 1]) {
          decimalRefs.current[maxDecLength - 1]?.focus();
        } else if (maxIntLength > 0 && integerRefs.current[maxIntLength - 1]) {
          integerRefs.current[maxIntLength - 1]?.focus();
        }
      }, 100);
    }
  }, [isActive, problem.num1, problem.num2, maxIntLength, maxDecLength, useDecimalFormat]);
  
  // -------- FUNCIONES PARA VALIDACIÓN Y MANEJO --------
  
  // Reconstruir la respuesta completa del usuario
  const getUserAnswer = (): { numberValue: number, stringValue: string } => {
    // Verificar si hay algún valor en los inputs antes de continuar
    const hasAnyValue = integerInputs.some(val => val !== '') || decimalInputs.some(val => val !== '');
    
    // Si no hay ningún valor en ningún input y estamos esperando por continue o no está activo, retornar 0
    if (!hasAnyValue && (waitingForContinue || !isActive)) {
      console.log('[VERTICAL_EXERCISE] No hay valores ingresados, devolviendo 0');
      return { numberValue: 0, stringValue: '' };
    }
    
    // Si hay algún valor, procesamos normalmente
    // Importante: considera todos los dígitos, incluso si hay espacios entre ellos
    let processedIntegerInputs = [...integerInputs];
    let processedDecimalInputs = [...decimalInputs];
    
    // Los campos vacíos en medio deberían considerarse como '0'
    for (let i = 0; i < processedIntegerInputs.length; i++) {
      if (processedIntegerInputs[i] === '' && hasAnyValue) {
        // Solo rellena con '0' si hay algún valor a su izquierda o derecha
        const hasValueLeft = processedIntegerInputs.slice(0, i).some(v => v !== '');
        const hasValueRight = processedIntegerInputs.slice(i + 1).some(v => v !== '');
        
        if (hasValueLeft || hasValueRight) {
          processedIntegerInputs[i] = '0';
        }
      }
    }
    
    // Lo mismo para los decimales
    for (let i = 0; i < processedDecimalInputs.length; i++) {
      if (processedDecimalInputs[i] === '' && hasAnyValue) {
        const hasValueLeft = processedDecimalInputs.slice(0, i).some(v => v !== '');
        const hasValueRight = processedDecimalInputs.slice(i + 1).some(v => v !== '');
        
        if (hasValueLeft || hasValueRight) {
          processedDecimalInputs[i] = '0';
        }
      }
    }
    
    // Unir los dígitos
    const intPart = processedIntegerInputs.join('').replace(/^0+/, '') || '0'; // Eliminar ceros a la izquierda, pero mantener al menos un 0
    const decPart = processedDecimalInputs.join('');
    
    // Crear string completo según formato
    const stringValue = useDecimalFormat && decPart.length > 0 ? 
      `${intPart}.${decPart}` : intPart;
    
    // Comparar con la respuesta esperada
    const expectedStr = expectedAnswerStr;
    
    console.log('[VERTICAL_EXERCISE] Procesando respuesta de usuario:', {
      integerInputsOriginales: integerInputs,
      decimalInputsOriginales: decimalInputs,
      integerInputsProcesados: processedIntegerInputs,
      decimalInputsProcesados: processedDecimalInputs,
      intPart, 
      decPart,
      stringValue,
      expectedStr
    });
    
    // Parsear a número, asegurando que sea un valor válido
    let numberValue: number;
    try {
      numberValue = parseFloat(stringValue);
      if (isNaN(numberValue) || stringValue === '') {
        console.log('[VERTICAL_EXERCISE] Valor numérico inválido, usando respuesta esperada');
        numberValue = expectedAnswer; // Si no podemos obtener un valor válido, usamos la respuesta esperada
      }
    } catch (e) {
      console.error('[VERTICAL_EXERCISE] Error al parsear valor:', e);
      numberValue = expectedAnswer;
    }
    
    return { numberValue, stringValue };
  };
  
  // Validar si la respuesta es correcta
  const validateAnswer = (): boolean => {
    const { numberValue, stringValue } = getUserAnswer();
    
    console.log('[VERTICAL_EXERCISE] Validando respuesta:', {
      userInput: stringValue,
      userValue: numberValue,
      expected: {
        string: expectedAnswerStr,
        value: expectedAnswer
      }
    });
    
    // Comparación directa de strings
    if (stringValue === expectedAnswerStr) {
      console.log('[VERTICAL_EXERCISE] Coincidencia exacta de strings');
      return true;
    }
    
    // Comparación con tolerancia numérica para evitar errores de punto flotante
    const tolerance = 0.001;
    if (Math.abs(numberValue - expectedAnswer) < tolerance) {
      console.log('[VERTICAL_EXERCISE] Coincidencia numérica dentro de tolerancia');
      return true;
    }
    
    // Normalización para comparar ignorando ceros iniciales o finales
    const normalizedUser = stringValue.replace(/^0+/, '').replace(/\.0+$/, '');
    const normalizedExpected = expectedAnswerStr.replace(/^0+/, '').replace(/\.0+$/, '');
    
    if (normalizedUser === normalizedExpected) {
      console.log('[VERTICAL_EXERCISE] Coincidencia tras normalización');
      return true;
    }
    
    console.log('[VERTICAL_EXERCISE] Respuesta incorrecta');
    return false;
  };
  
  // Manejar cambio en input de parte entera
  const handleIntegerChange = (index: number, value: string) => {
    if (waitingForContinue) return;
    
    // Permitir borrar
    if (value === '') {
      const newValues = [...integerInputs];
      newValues[index] = '';
      setIntegerInputs(newValues);
      return;
    }
    
    // Solo permitir dígitos
    if (!/^[0-9]$/.test(value)) {
      return;
    }
    
    // Actualizar valor
    const newValues = [...integerInputs];
    newValues[index] = value;
    setIntegerInputs(newValues);
    
    // Mover al siguiente input a la izquierda
    if (index > 0) {
      integerRefs.current[index - 1]?.focus();
    } else if (useDecimalFormat && maxDecLength > 0) {
      // Si llegamos al final de la parte entera, saltar al punto decimal
      const decimalPoint = document.getElementById('decimal-point');
      if (decimalPoint) {
        decimalPoint.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };
  
  // Manejar cambio en input de parte decimal
  const handleDecimalChange = (index: number, value: string) => {
    if (waitingForContinue) return;
    
    // Permitir borrar
    if (value === '') {
      const newValues = [...decimalInputs];
      newValues[index] = '';
      setDecimalInputs(newValues);
      return;
    }
    
    // Solo permitir dígitos
    if (!/^[0-9]$/.test(value)) {
      return;
    }
    
    // Actualizar valor
    const newValues = [...decimalInputs];
    newValues[index] = value;
    setDecimalInputs(newValues);
    
    // Navegar al siguiente input
    if (index > 0) {
      decimalRefs.current[index - 1]?.focus();
    } else if (maxIntLength > 0) {
      // Si llegamos al primer decimal, pasar a la parte entera
      integerRefs.current[maxIntLength - 1]?.focus();
    }
  };
  
  // Enviar respuesta - VERSIÓN COMPLETAMENTE REESCRITA Y SIMPLIFICADA
  const handleSubmit = () => {
    if (waitingForContinue) return;
    
    // SOLUCIÓN ULTRA SIMPLIFICADA QUE FUNCIONA Y ESTÁ BASADA EN EL PATRÓN DE VALIDACIÓN DEL FORMATO HORIZONTAL
    console.log('[VERTICAL_EXERCISE] USANDO NUEVO MÉTODO DE VALIDACIÓN SIMPLIFICADO');
    
    // 1. Recuperar los valores del usuario de forma directa
    const { numberValue, stringValue } = getUserAnswer();
    
    // 2. Imprimir información de diagnóstico completa
    console.log('[VERTICAL_EXERCISE] DIAGNÓSTICO DE RESPUESTA:', {
      stringValue,
      numberValue,
      inputsEnteros: integerInputs, 
      inputsDecimales: decimalInputs,
      esperado: expectedAnswerStr,
      esperadoNum: expectedAnswer
    });
    
    // 3. Verificar validez de la respuesta
    if (stringValue === '') {
      console.log('[VERTICAL_EXERCISE] Respuesta vacía, enviando 0');
      onSubmit(0);
      return;
    }
    
    // 4. Comparar con respuesta esperada usando el mismo sistema del formato horizontal
    // Añadimos tolerancia para manejar imprecisiones de punto flotante
    const isCorrect = Math.abs(numberValue - expectedAnswer) < 0.0001;
    
    console.log('[VERTICAL_EXERCISE] RESULTADO DE VALIDACIÓN:', {
      respuestaUsuario: numberValue,
      respuestaEsperada: expectedAnswer,
      diferencia: Math.abs(numberValue - expectedAnswer),
      esCorrecta: isCorrect
    });
    
    // 5. Enviar resultado exactamente como lo hace el formato horizontal
    onSubmit(isCorrect ? expectedAnswer : numberValue);
  };
  
  // -------- UTILIDADES DE UI --------
  
  // Colores según nivel de dificultad
  const getDifficultyColor = () => {
    switch (difficultyLevel) {
      case "beginner": return "bg-blue-50 border-blue-300";
      case "elementary": return "bg-emerald-50 border-emerald-300";
      case "intermediate": return "bg-orange-50 border-orange-300";
      case "advanced": return "bg-purple-50 border-purple-300";
      case "expert": return "bg-gray-50 border-gray-500";
      default: return "bg-gray-50 border-gray-300";
    }
  };
  
  const getDifficultyTextColor = () => {
    switch (difficultyLevel) {
      case "beginner": return "text-blue-700";
      case "elementary": return "text-emerald-700";
      case "intermediate": return "text-orange-700";
      case "advanced": return "text-purple-700";
      case "expert": return "text-gray-900";
      default: return "text-gray-700";
    }
  };
  
  // -------- RENDERIZADO --------
  
  return (
    <div className="flex flex-col items-center">
      <div className={`p-6 rounded-xl ${getDifficultyColor()} shadow-sm mb-6 max-w-md`}>
        {/* Contenedor principal para el formato vertical */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-2 text-xl font-medium">
            {/* Primera fila - Primer número */}
            <div className="flex justify-end items-center">
              {/* Parte entera del primer número */}
              <div className="flex space-x-2">
                {num1Integers.map((digit, index) => (
                  <div 
                    key={`num1-int-${index}`} 
                    className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                  >
                    {digit === ' ' ? '' : digit}
                  </div>
                ))}
              </div>
              
              {/* Punto decimal y parte decimal del primer número */}
              {useDecimalFormat && (
                <>
                  <div className={`w-6 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>
                    .
                  </div>
                  <div className="flex space-x-2">
                    {num1Decimals.map((digit, index) => (
                      <div 
                        key={`num1-dec-${index}`} 
                        className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Segunda fila - Operador y segundo número */}
            <div className="flex justify-end items-center border-b-2 border-gray-400 pb-1">
              <div className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>+</div>
              
              {/* Parte entera del segundo número */}
              <div className="flex space-x-2">
                {num2Integers.map((digit, index) => (
                  <div 
                    key={`num2-int-${index}`} 
                    className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                  >
                    {digit === ' ' ? '' : digit}
                  </div>
                ))}
              </div>
              
              {/* Punto decimal y parte decimal del segundo número */}
              {useDecimalFormat && (
                <>
                  <div className={`w-6 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}>
                    .
                  </div>
                  <div className="flex space-x-2">
                    {num2Decimals.map((digit, index) => (
                      <div 
                        key={`num2-dec-${index}`} 
                        className={`w-10 h-10 flex items-center justify-center ${getDifficultyTextColor()}`}
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Tercera fila - Campos de entrada para la respuesta */}
            <div className="flex justify-end items-center pt-1">
              {/* Parte entera de la respuesta */}
              <div className="flex space-x-2">
                {Array(maxIntLength).fill(0).map((_, index) => (
                  <Input
                    key={`input-int-${index}`}
                    type="text"
                    maxLength={1}
                    className={`w-10 h-10 text-center font-bold text-xl p-0 ${
                      waitingForContinue ? getDifficultyColor() : 'bg-white'
                    }`}
                    value={integerInputs[index] || ''}
                    onChange={(e) => handleIntegerChange(index, e.target.value)}
                    ref={(el) => (integerRefs.current[index] = el)}
                    disabled={waitingForContinue}
                    readOnly={waitingForContinue}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit();
                      } else if (e.key === "Backspace") {
                        // Si el campo está vacío, ir al campo de la derecha
                        if (!integerInputs[index] && index < maxIntLength - 1) {
                          integerRefs.current[index + 1]?.focus();
                        } else {
                          // Si hay contenido, borrarlo
                          const newValues = [...integerInputs];
                          newValues[index] = '';
                          setIntegerInputs(newValues);
                        }
                      } else if (e.key === "ArrowRight" && index < maxIntLength - 1) {
                        integerRefs.current[index + 1]?.focus();
                      } else if (e.key === "ArrowLeft" && index > 0) {
                        integerRefs.current[index - 1]?.focus();
                      } else if (e.key === "ArrowRight" && index === maxIntLength - 1 && useDecimalFormat) {
                        // Si presiona derecha en el último entero, ir al primer decimal
                        decimalRefs.current[0]?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              
              {/* Punto decimal y parte decimal de la respuesta */}
              {useDecimalFormat && (
                <>
                  <div 
                    id="decimal-point"
                    className={`w-6 h-10 flex items-center justify-center text-xl font-bold ${getDifficultyTextColor()}`}
                  >
                    .
                  </div>
                  <div className="flex space-x-2">
                    {Array(maxDecLength).fill(0).map((_, index) => (
                      <Input
                        key={`input-dec-${index}`}
                        type="text"
                        maxLength={1}
                        className={`w-10 h-10 text-center font-bold text-xl p-0 ${
                          waitingForContinue ? getDifficultyColor() : 'bg-white'
                        }`}
                        value={decimalInputs[index] || ''}
                        onChange={(e) => handleDecimalChange(index, e.target.value)}
                        ref={(el) => (decimalRefs.current[index] = el)}
                        disabled={waitingForContinue}
                        readOnly={waitingForContinue}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSubmit();
                          } else if (e.key === "Backspace") {
                            // Si el campo está vacío, ir al campo de la derecha
                            if (!decimalInputs[index]) {
                              if (index < maxDecLength - 1) {
                                decimalRefs.current[index + 1]?.focus();
                              } else if (index === 0) {
                                // Si es el primer decimal y está vacío, ir al último entero
                                integerRefs.current[0]?.focus();
                              }
                            } else {
                              // Si hay contenido, borrarlo
                              const newValues = [...decimalInputs];
                              newValues[index] = '';
                              setDecimalInputs(newValues);
                            }
                          } else if (e.key === "ArrowRight" && index < maxDecLength - 1) {
                            decimalRefs.current[index + 1]?.focus();
                          } else if (e.key === "ArrowLeft" && index > 0) {
                            decimalRefs.current[index - 1]?.focus();
                          } else if (e.key === "ArrowLeft" && index === 0) {
                            // Si presiona izquierda en el primer decimal, ir al último entero
                            integerRefs.current[maxIntLength - 1]?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}