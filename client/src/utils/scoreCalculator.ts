/**
 * SISTEMA ROBUSTO DE CÁLCULO DE SCORE - ANTIFRAGIL
 * Este módulo centraliza toda la lógica de cálculo de puntajes para evitar inconsistencias
 */

export interface UserAnswer {
  problemId: string;
  problem: any;
  userAnswer: number;
  isCorrect: boolean;
  status: string;
  attempts: number;
  timestamp: number;
}

export interface ScoreCalculationResult {
  score: number;
  totalProblems: number;
  accuracy: number;
  correctAnswers: number;
  incorrectAnswers: number;
  revealedAnswers: number;
  validationStatus: 'valid' | 'warning' | 'error';
  validationMessage: string;
}

/**
 * CALCULADORA PRINCIPAL DE SCORE - MÚLTIPLES VALIDACIONES
 * Implementa verificaciones cruzadas para garantizar precisión
 */
export function calculateScoreRobust(userAnswersHistory: UserAnswer[]): ScoreCalculationResult {
  console.log("🔬 [SCORE-CALC] ===== INICIO CÁLCULO ROBUSTO =====");
  console.log("🔬 [SCORE-CALC] userAnswersHistory recibido:", userAnswersHistory);
  
  // VALIDACIÓN 1: Filtrar respuestas válidas
  const answersValidas = userAnswersHistory.filter(answer => 
    answer && 
    typeof answer === 'object' && 
    answer.status !== undefined
  );
  
  console.log("🔬 [SCORE-CALC] Respuestas válidas filtradas:", answersValidas.length);
  
  // VALIDACIÓN 2: Múltiples métodos de cálculo para verificación cruzada
  const metodos = {
    // Método 1: Por status 'correct'
    porStatus: answersValidas.filter(a => a.status === 'correct').length,
    
    // Método 2: Por campo isCorrect
    porIsCorrect: answersValidas.filter(a => a.isCorrect === true).length,
    
    // Método 3: Por status NOT 'incorrect' y NOT 'revealed'
    porExclusion: answersValidas.filter(a => 
      a.status !== 'incorrect' && 
      a.status !== 'revealed'
    ).length,
    
    // Método 4: Conteo manual verificando ambos campos
    porVerificacion: answersValidas.reduce((count, answer) => {
      const esCorrecta = (answer.status === 'correct' && answer.isCorrect === true);
      return esCorrecta ? count + 1 : count;
    }, 0)
  };
  
  console.log("🔬 [SCORE-CALC] Resultados por método:", metodos);
  
  // VALIDACIÓN 3: Verificar consistencia entre métodos
  const valores = Object.values(metodos);
  const valorMasFrecuente = valores.sort((a,b) => 
    valores.filter(v => v === a).length - valores.filter(v => v === b).length
  ).pop();
  
  // VALIDACIÓN 4: Calcular otras métricas
  const totalProblems = answersValidas.length;
  const correctAnswers = valorMasFrecuente || 0;
  const incorrectAnswers = answersValidas.filter(a => 
    a.status === 'incorrect' || (a.isCorrect === false && a.status !== 'revealed')
  ).length;
  const revealedAnswers = answersValidas.filter(a => a.status === 'revealed').length;
  
  // VALIDACIÓN 5: Verificar que la suma cuadre
  const sumaVerificacion = correctAnswers + incorrectAnswers + revealedAnswers;
  const accuracy = totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0;
  
  // VALIDACIÓN 6: Determinar estado de validación
  let validationStatus: 'valid' | 'warning' | 'error' = 'valid';
  let validationMessage = 'Cálculo correcto';
  
  if (sumaVerificacion !== totalProblems) {
    validationStatus = 'error';
    validationMessage = `ERROR: Suma no cuadra (${sumaVerificacion} ≠ ${totalProblems})`;
    console.error("🚨 [SCORE-CALC]", validationMessage);
  } else if (valores.some(v => v !== valorMasFrecuente)) {
    validationStatus = 'warning';
    validationMessage = `WARNING: Inconsistencia entre métodos de cálculo`;
    console.warn("⚠️ [SCORE-CALC]", validationMessage);
  }
  
  const resultado: ScoreCalculationResult = {
    score: correctAnswers,
    totalProblems,
    accuracy,
    correctAnswers,
    incorrectAnswers,
    revealedAnswers,
    validationStatus,
    validationMessage
  };
  
  console.log("🔬 [SCORE-CALC] Resultado final:", resultado);
  console.log("🔬 [SCORE-CALC] ===== FIN CÁLCULO ROBUSTO =====");
  
  return resultado;
}

/**
 * SISTEMA DE AUTO-DIAGNÓSTICO
 * Verifica la integridad de los datos antes del cálculo
 */
export function diagnosticarDatos(userAnswersHistory: UserAnswer[]): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Verificar que hay datos
  if (!userAnswersHistory || userAnswersHistory.length === 0) {
    issues.push("No hay datos de respuestas");
    recommendations.push("Verificar que se estén guardando las respuestas correctamente");
    return { isValid: false, issues, recommendations };
  }
  
  // Verificar estructura de cada respuesta
  userAnswersHistory.forEach((answer, index) => {
    if (!answer) {
      issues.push(`Respuesta ${index + 1} es null/undefined`);
    } else {
      if (answer.status === undefined) {
        issues.push(`Respuesta ${index + 1} no tiene campo 'status'`);
      }
      if (answer.isCorrect === undefined) {
        issues.push(`Respuesta ${index + 1} no tiene campo 'isCorrect'`);
      }
      if (answer.status && answer.isCorrect !== undefined) {
        // Verificar consistencia
        if (answer.status === 'correct' && answer.isCorrect !== true) {
          issues.push(`Respuesta ${index + 1}: inconsistencia status='correct' pero isCorrect=${answer.isCorrect}`);
        }
        if (answer.status === 'incorrect' && answer.isCorrect !== false) {
          issues.push(`Respuesta ${index + 1}: inconsistencia status='incorrect' pero isCorrect=${answer.isCorrect}`);
        }
      }
    }
  });
  
  // Recomendaciones
  if (issues.length > 0) {
    recommendations.push("Revisar la lógica de guardado de respuestas");
    recommendations.push("Verificar que status e isCorrect se asignen correctamente");
    recommendations.push("Implementar validación en el momento de guardar cada respuesta");
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * VALIDADOR DE INTEGRIDAD POST-CÁLCULO
 * Verifica que el resultado tenga sentido
 */
export function validarResultado(resultado: ScoreCalculationResult): boolean {
  // Verificaciones básicas
  if (resultado.score < 0 || resultado.score > resultado.totalProblems) {
    console.error("🚨 [SCORE-VALIDATOR] Score fuera de rango válido");
    return false;
  }
  
  if (resultado.accuracy < 0 || resultado.accuracy > 100) {
    console.error("🚨 [SCORE-VALIDATOR] Accuracy fuera de rango válido");
    return false;
  }
  
  if (resultado.correctAnswers + resultado.incorrectAnswers + resultado.revealedAnswers !== resultado.totalProblems) {
    console.error("🚨 [SCORE-VALIDATOR] Suma de respuestas no cuadra con total");
    return false;
  }
  
  return true;
}