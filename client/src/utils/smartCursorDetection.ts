/**
 * Detección Inteligente de Cursor para Sumas Verticales
 * Determina si el usuario quiere empezar por la izquierda (memoria) o derecha (paso a paso)
 * basándose en el primer dígito que presiona
 */

type CursorDirection = 'left' | 'right' | 'default';

/**
 * Detecta la intención del usuario basándose en el primer dígito presionado
 */
export function detectIntentionalDirection(
  firstDigit: string, 
  correctAnswer: string | number, 
  totalFields: number = 1
): CursorDirection {
  // Solo aplicar para sumas complejas con múltiples campos (5 o más)
  if (totalFields < 5) {
    return 'default';
  }

  // Validar entrada
  if (!firstDigit || !correctAnswer || typeof firstDigit !== 'string') {
    return 'default';
  }

  // Limpiar la respuesta correcta (remover puntos decimales y espacios)
  const cleanAnswer = correctAnswer.toString().replace(/[.,\s]/g, '');
  
  // Obtener primer y último dígito de la respuesta
  const leftmostDigit = cleanAnswer.charAt(0);
  const rightmostDigit = cleanAnswer.charAt(cleanAnswer.length - 1);

  console.log('[SMART-CURSOR] Detectando dirección:', {
    firstDigit,
    correctAnswer,
    cleanAnswer,
    leftmostDigit,
    rightmostDigit,
    totalFields
  });

  // Si el primer dígito coincide con el extremo izquierdo -> Memoria (izquierda a derecha)
  if (firstDigit === leftmostDigit) {
    console.log('[SMART-CURSOR] Detección: MEMORIA - Empezar por la IZQUIERDA');
    return 'left';
  }
  
  // Si el primer dígito coincide con el extremo derecho -> Paso a paso (derecha a izquierda)
  if (firstDigit === rightmostDigit) {
    console.log('[SMART-CURSOR] Detección: PASO A PASO - Empezar por la DERECHA');
    return 'right';
  }

  // Si no coincide con ningún extremo, usar comportamiento por defecto
  console.log('[SMART-CURSOR] Sin coincidencia en extremos - Usar comportamiento DEFAULT');
  return 'default';
}

/**
 * Verifica si un problema es elegible para la detección inteligente
 */
export function isEligibleForSmartCursor(problem: any, fieldCount: number): boolean {
  // Solo para sumas verticales complejas
  const isVertical = problem?.layout === 'vertical' || fieldCount >= 5;
  const isComplex = fieldCount >= 5;
  
  return isVertical && isComplex;
}

/**
 * Obtiene la configuración del cursor inteligente desde localStorage
 */
export function isSmartCursorEnabled(): boolean {
  try {
    const settings = localStorage.getItem('addition_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.enableSmartCursor !== false; // Por defecto habilitado
    }
    return true; // Por defecto habilitado
  } catch (error) {
    console.warn('[SMART-CURSOR] Error leyendo configuración:', error);
    return true; // Por defecto habilitado en caso de error
  }
}

/**
 * Guarda la configuración del cursor inteligente
 */
export function setSmartCursorEnabled(enabled: boolean): void {
  try {
    const settings = localStorage.getItem('addition_settings');
    let parsed: any = {};
    
    if (settings) {
      parsed = JSON.parse(settings);
    }
    
    parsed.enableSmartCursor = enabled;
    localStorage.setItem('addition_settings', JSON.stringify(parsed));
    
    console.log('[SMART-CURSOR] Configuración guardada:', enabled);
  } catch (error) {
    console.error('[SMART-CURSOR] Error guardando configuración:', error);
  }
}