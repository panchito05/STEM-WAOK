/**
 * VALIDADOR UNIVERSAL DE SCORES - ANTIFRAGIL
 * Este interceptor garantiza que todos los cálculos sean consistentes
 */

// Interceptor que previene pérdida de datos
export const validateAndFixScore = (
  userAnswersHistory: any[], 
  calculatedScore: number,
  context: string = "unknown"
): { score: number; isFixed: boolean; warnings: string[] } => {
  
  console.log(`🛡️ [SCORE-VALIDATOR] ===== VALIDANDO EN ${context} =====`);
  console.log(`🛡️ [SCORE-VALIDATOR] Score calculado originalmente:`, calculatedScore);
  console.log(`🛡️ [SCORE-VALIDATOR] Datos recibidos:`, userAnswersHistory);
  
  const warnings: string[] = [];
  
  // Filtrar respuestas válidas
  const answersValidas = userAnswersHistory.filter(answer => 
    answer && 
    typeof answer === 'object' && 
    (answer.status !== undefined || answer.isCorrect !== undefined)
  );
  
  if (answersValidas.length === 0) {
    warnings.push("No hay respuestas válidas para validar");
    return { score: calculatedScore, isFixed: false, warnings };
  }
  
  // Múltiples métodos de cálculo para verificación
  const metodos = {
    porStatus: answersValidas.filter(a => a.status === 'correct').length,
    porIsCorrect: answersValidas.filter(a => a.isCorrect === true).length,
    porVerificacionDual: answersValidas.filter(a => 
      a.status === 'correct' && a.isCorrect === true
    ).length,
    porExclusion: answersValidas.filter(a => 
      a.status !== 'incorrect' && 
      a.status !== 'revealed' && 
      a.isCorrect !== false
    ).length
  };
  
  console.log(`🛡️ [SCORE-VALIDATOR] Métodos de verificación:`, metodos);
  
  // Encontrar el valor más consistente
  const valores = Object.values(metodos);
  const conteos = valores.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const scoreCorregido = Number(Object.keys(conteos).reduce((a, b) => 
    conteos[Number(a)] > conteos[Number(b)] ? a : b
  ));
  
  const isFixed = scoreCorregido !== calculatedScore;
  
  if (isFixed) {
    warnings.push(`Score corregido de ${calculatedScore} a ${scoreCorregido}`);
    console.warn(`🚨 [SCORE-VALIDATOR] CORRECCIÓN APLICADA en ${context}:`);
    console.warn(`🚨 [SCORE-VALIDATOR] Original: ${calculatedScore} → Corregido: ${scoreCorregido}`);
  } else {
    console.log(`✅ [SCORE-VALIDATOR] Score verificado correcto en ${context}: ${scoreCorregido}`);
  }
  
  return { score: scoreCorregido, isFixed, warnings };
};

// Hook para interceptar cualquier cálculo de accuracy
export const validateAccuracy = (
  score: number, 
  total: number, 
  originalAccuracy: number,
  context: string = "unknown"
): { accuracy: number; isFixed: boolean } => {
  
  const accuracyCorrecta = total > 0 ? Math.round((score / total) * 100) : 0;
  const isFixed = accuracyCorrecta !== originalAccuracy;
  
  if (isFixed) {
    console.warn(`🚨 [ACCURACY-VALIDATOR] CORRECCIÓN en ${context}:`);
    console.warn(`🚨 [ACCURACY-VALIDATOR] Original: ${originalAccuracy}% → Corregido: ${accuracyCorrecta}%`);
  }
  
  return { accuracy: accuracyCorrecta, isFixed };
};

// Interceptor para datos antes de ser enviados
export const interceptSaveData = (data: any, context: string = "unknown"): any => {
  console.log(`🔒 [SAVE-INTERCEPTOR] ===== INTERCEPTANDO GUARDADO EN ${context} =====`);
  console.log(`🔒 [SAVE-INTERCEPTOR] Datos originales:`, data);
  
  // Si hay userAnswersHistory en extra_data, validar
  if (data.extra_data?.userAnswersHistory) {
    const validacion = validateAndFixScore(
      data.extra_data.userAnswersHistory, 
      data.score, 
      context
    );
    
    if (validacion.isFixed) {
      data.score = validacion.score;
      console.log(`🔒 [SAVE-INTERCEPTOR] Score corregido antes del guardado: ${validacion.score}`);
    }
    
    // Recalcular accuracy si es necesario
    const accuracyValidation = validateAccuracy(
      data.score, 
      data.totalProblems, 
      data.accuracy, 
      context
    );
    
    if (accuracyValidation.isFixed) {
      data.accuracy = accuracyValidation.accuracy;
      console.log(`🔒 [SAVE-INTERCEPTOR] Accuracy corregida: ${accuracyValidation.accuracy}%`);
    }
  }
  
  console.log(`🔒 [SAVE-INTERCEPTOR] Datos finales:`, data);
  return data;
};