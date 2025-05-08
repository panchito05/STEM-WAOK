/**
 * Función ultra robusta para comparar números que tolera diferentes formatos,
 * errores de punto flotante, y discrepancias menores.
 */
export function superRobustNumberComparison(val1: any, val2: any): boolean {
  console.log("[SUPER-COMPARATOR] Comparando valores:", { val1, val2, types: [typeof val1, typeof val2] });
  
  // Convertir a string y limpiar cualquier formato
  const cleanNumber = (val: any): string => {
    if (val === null || val === undefined) return "0";
    
    // Convertir a string
    let strVal = String(val).trim();
    
    // Limpiar cualquier carácter no numérico, excepto punto decimal
    strVal = strVal.replace(/[^\d.-]/g, '');
    
    // Manejar múltiples puntos decimales (quedarse con el primero)
    if (strVal.indexOf('.') !== strVal.lastIndexOf('.')) {
      const parts = strVal.split('.');
      strVal = parts[0] + '.' + parts.slice(1).join('');
    }
    
    return strVal;
  };
  
  // Comparación exacta como strings después de limpiar
  const str1 = cleanNumber(val1);
  const str2 = cleanNumber(val2);
  if (str1 === str2) {
    console.log("[SUPER-COMPARATOR] EXACT STRING MATCH!");
    return true;
  }
  
  // Convertir a números y manejar NaN
  let num1 = parseFloat(str1);
  let num2 = parseFloat(str2);
  
  if (isNaN(num1) && isNaN(num2)) {
    console.log("[SUPER-COMPARATOR] BOTH NaN - CONSIDERING EQUAL!");
    return true;
  }
  
  if (isNaN(num1) || isNaN(num2)) {
    console.log("[SUPER-COMPARATOR] ONE IS NaN - NOT EQUAL!");
    return false;
  }
  
  // Verificar igualdad exacta después de conversión
  if (num1 === num2) {
    console.log("[SUPER-COMPARATOR] EXACT NUMBER MATCH!");
    return true;
  }
  
  // Verificar con tolerancia para errores de punto flotante
  const epsilon = 0.0001;
  const relativeEqual = Math.abs(num1 - num2) <= epsilon * Math.max(Math.abs(num1), Math.abs(num2));
  
  if (relativeEqual) {
    console.log("[SUPER-COMPARATOR] RELATIVE TOLERANCE MATCH!");
    return true;
  }
  
  // Comparar después de redondear a 10 decimales
  const rounded1 = Math.round(num1 * 1e10) / 1e10;
  const rounded2 = Math.round(num2 * 1e10) / 1e10;
  
  if (rounded1 === rounded2) {
    console.log("[SUPER-COMPARATOR] ROUNDED DECIMAL MATCH!");
    return true;
  }
  
  // Último intento: convertir a enteros si son muy cercanos a enteros
  if (Math.abs(num1 - Math.round(num1)) < 1e-10 && 
      Math.abs(num2 - Math.round(num2)) < 1e-10) {
    const int1 = Math.round(num1);
    const int2 = Math.round(num2);
    if (int1 === int2) {
      console.log("[SUPER-COMPARATOR] INTEGER APPROXIMATION MATCH!");
      return true;
    }
  }
  
  // Si la diferencia absoluta es muy pequeña
  if (Math.abs(num1 - num2) < 0.01) {
    console.log("[SUPER-COMPARATOR] ABSOLUTE DIFFERENCE NEGLIGIBLE!");
    return true;
  }
  
  // ¿Son múltiplos de 10 que difieren solo en ceros al final?
  const str1WithoutZeros = str1.replace(/\.?0+$/, '');
  const str2WithoutZeros = str2.replace(/\.?0+$/, '');
  if (str1WithoutZeros === str2WithoutZeros) {
    console.log("[SUPER-COMPARATOR] MATCH AFTER REMOVING TRAILING ZEROS!");
    return true;
  }
  
  console.log("[SUPER-COMPARATOR] NO MATCH FOUND!", { num1, num2, difference: Math.abs(num1 - num2) });
  return false;
}