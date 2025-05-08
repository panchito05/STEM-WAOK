/**
 * Comparación super robusta de números
 * 
 * Esta función implementa múltiples estrategias para comparar números,
 * teniendo en cuenta problemas de punto flotante, representación interna,
 * errores de redondeo y otros problemas comunes en JavaScript.
 */
export function superRobustNumberComparison(a: number, b: number): boolean {
  // Caso especial: NaN
  if (isNaN(a) || isNaN(b)) {
    return false;
  }
  
  // Caso especial: infinitos
  if (!isFinite(a) || !isFinite(b)) {
    return a === b;
  }
  
  // Comprobación de igualdad exacta
  if (a === b) {
    return true;
  }
  
  // Estrategia 1: Comparación con tolerancia para valores flotantes
  // Útil para errores de redondeo en cálculos con decimales
  const epsilon = 0.00001; // Tolerancia muy pequeña
  if (Math.abs(a - b) < epsilon) {
    return true;
  }
  
  // Estrategia 2: Manejo especial para decimales
  // Convertir a string y validar si tienen los mismos dígitos significativos
  const aStr = a.toString();
  const bStr = b.toString();
  
  // Si tienen misma representación en string, son equivalentes
  if (aStr === bStr) {
    return true;
  }
  
  // Estrategia 3: Comparación de representación redondeada
  // Útil para errores de representación de punto flotante
  const precisionFactor = 1000000; // 6 decimales
  const roundedA = Math.round(a * precisionFactor) / precisionFactor;
  const roundedB = Math.round(b * precisionFactor) / precisionFactor;
  
  if (roundedA === roundedB) {
    return true;
  }
  
  // Estrategia 4: Tolerancia proporcional
  // Útil para números grandes donde epsilon fijo no es apropiado
  const maxAbs = Math.max(Math.abs(a), Math.abs(b));
  const relativeEpsilon = maxAbs * 0.0000001; // Tolerancia relativa
  
  if (Math.abs(a - b) < relativeEpsilon) {
    return true;
  }
  
  // Estrategia 5: Comparación de representación en una base fija
  // Útil para valores que pueden tener representaciones numéricas diferentes
  const toFixed = (num: number) => num.toFixed(6);
  if (toFixed(a) === toFixed(b)) {
    return true;
  }
  
  // Estrategia 6: Truncamiento a precisión específica
  // Elimina los "ruidos" en decimales irrelevantes
  const truncate = (num: number, decimals: number) => {
    const factor = Math.pow(10, decimals);
    return Math.trunc(num * factor) / factor;
  };
  
  if (truncate(a, 6) === truncate(b, 6)) {
    return true;
  }
  
  // Estrategia 7: Comparar partes enteras y decimales separadamente
  const aInt = Math.floor(a);
  const bInt = Math.floor(b);
  const aFrac = a - aInt;
  const bFrac = b - bInt;
  
  if (aInt === bInt && Math.abs(aFrac - bFrac) < 0.0001) {
    return true;
  }
  
  // Estrategia 8: Comparación de división para evitar problemas de punto flotante
  // Convierte ambos números a enteros multiplicando y luego los compara
  const multiplier = 1000000;
  const aScaled = Math.round(a * multiplier);
  const bScaled = Math.round(b * multiplier);
  
  if (aScaled === bScaled) {
    return true;
  }
  
  // Si todas las estrategias anteriores fallan, los números son diferentes
  return false;
}