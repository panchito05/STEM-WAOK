/**
 * DOMCapture.js - Un servicio simple para capturar el DOM de los ejercicios
 * Esta solución usa localStorage directamente, sin IndexedDB, para simplificar
 */

// Prefijo para las claves de localStorage
const STORAGE_PREFIX = 'math_waok_dom_';

/**
 * Captura el DOM de un ejercicio y lo guarda en localStorage
 * @param {string} operationId - El ID de la operación (addition, fractions, etc.)
 * @param {object} exerciseData - Datos adicionales del ejercicio
 * @returns {string} La clave de localStorage donde se guardó
 */
export function captureDOMSnapshot(operationId, exerciseData = {}) {
  try {
    console.log(`📸 Capturando DOM de ejercicio ${operationId}...`);
    
    // Buscar el contenedor de revisión
    const reviewContainers = [
      '.problem-review',         // Contenedor principal
      '.exercise-complete',      // Alternativa
      '.exercise-summary'        // Otra alternativa
    ];
    
    let container = null;
    for (const selector of reviewContainers) {
      const el = document.querySelector(selector);
      if (el) {
        container = el;
        console.log(`✅ Encontrado contenedor: ${selector}`);
        break;
      }
    }
    
    if (!container) {
      console.error('❌ No se encontró ningún contenedor para capturar');
      return null;
    }
    
    // Limpiar el contenedor (desactivar botones, etc.)
    const clone = container.cloneNode(true);
    
    // Desactivar todos los elementos interactivos
    clone.querySelectorAll('button, input, select, a').forEach(el => {
      if (el.tagName === 'A') {
        el.href = '#';
        el.style.pointerEvents = 'none';
      } else {
        el.disabled = true;
      }
      el.style.cursor = 'default';
    });
    
    // Generar clave única
    const timestamp = Date.now();
    const key = `${STORAGE_PREFIX}${operationId}_${timestamp}`;
    
    // Preparar datos para guardar
    const snapshotData = {
      html: clone.outerHTML,
      timestamp,
      date: new Date().toISOString(),
      operationId,
      ...exerciseData
    };
    
    // Guardar en localStorage
    localStorage.setItem(key, JSON.stringify(snapshotData));
    console.log(`✅ DOM guardado con clave: ${key}`);
    
    // También guardar la referencia por fecha para facilitar búsqueda
    saveDOMReference(key, snapshotData.date);
    
    return key;
  } catch (error) {
    console.error('❌ Error al capturar DOM:', error);
    return null;
  }
}

/**
 * Guarda una referencia al snapshot por fecha
 */
function saveDOMReference(key, dateStr) {
  try {
    // Usar solo la fecha sin la hora (YYYY-MM-DD)
    const dateKey = dateStr.split('T')[0];
    const refsKey = `${STORAGE_PREFIX}refs`;
    
    // Obtener referencias existentes
    const refs = JSON.parse(localStorage.getItem(refsKey) || '{}');
    
    // Actualizar para esta fecha
    if (!refs[dateKey]) {
      refs[dateKey] = [];
    }
    
    refs[dateKey].push(key);
    
    // Guardar referencias actualizadas
    localStorage.setItem(refsKey, JSON.stringify(refs));
  } catch (error) {
    console.error('❌ Error al guardar referencia DOM:', error);
  }
}

/**
 * Busca snapshots DOM por fecha
 * @param {string} dateStr - La fecha en formato ISO (YYYY-MM-DD)
 * @param {string} operationId - Opcional: filtrar por operación
 * @returns {Array} Lista de claves que coinciden
 */
export function findDOMSnapshotsByDate(dateStr, operationId = null) {
  try {
    // Si se proporciona la fecha completa con hora, quedarse solo con YYYY-MM-DD
    const dateKey = dateStr.split('T')[0];
    const refsKey = `${STORAGE_PREFIX}refs`;
    
    // Obtener todas las referencias
    const refs = JSON.parse(localStorage.getItem(refsKey) || '{}');
    const dateRefs = refs[dateKey] || [];
    
    // Si no hay referencias para esta fecha, devolver vacío
    if (dateRefs.length === 0) {
      console.log(`ℹ️ No hay snapshots para la fecha ${dateKey}`);
      return [];
    }
    
    // Si no se necesita filtrar por operación, devolver todas
    if (!operationId) {
      return dateRefs;
    }
    
    // Filtrar por operación
    const filteredRefs = [];
    for (const ref of dateRefs) {
      try {
        // Intentar leer el snapshot
        const snapshotData = JSON.parse(localStorage.getItem(ref) || '{}');
        
        // Comprobar si coincide con la operación
        if (snapshotData.operationId === operationId) {
          filteredRefs.push(ref);
        }
      } catch (e) {
        // Ignora errores al leer los snapshots
      }
    }
    
    console.log(`ℹ️ Encontrados ${filteredRefs.length} snapshots para ${operationId} en ${dateKey}`);
    return filteredRefs;
  } catch (error) {
    console.error('❌ Error al buscar snapshots por fecha:', error);
    return [];
  }
}

/**
 * Renderiza un snapshot DOM en un contenedor
 * @param {string} key - La clave del snapshot
 * @param {HTMLElement} container - El contenedor donde renderizar
 * @returns {boolean} True si se renderizó correctamente
 */
export function renderDOMSnapshot(key, container) {
  try {
    // Intentar obtener el snapshot
    const snapshotStr = localStorage.getItem(key);
    if (!snapshotStr) {
      console.error(`❌ No se encontró el snapshot con clave ${key}`);
      return false;
    }
    
    // Parsear los datos
    const snapshotData = JSON.parse(snapshotStr);
    
    // Verificar que tenga HTML
    if (!snapshotData.html) {
      console.error(`❌ El snapshot no contiene HTML`);
      return false;
    }
    
    // Renderizar en el contenedor
    container.innerHTML = snapshotData.html;
    console.log(`✅ Snapshot renderizado correctamente`);
    
    return true;
  } catch (error) {
    console.error('❌ Error al renderizar snapshot:', error);
    return false;
  }
}

/**
 * Limpia todos los snapshots guardados
 * Útil cuando se usa "Clear All Progress"
 */
export function clearAllDOMSnapshots() {
  try {
    // Obtener todas las claves de localStorage
    const allKeys = Object.keys(localStorage);
    
    // Filtrar solo las que tienen nuestro prefijo
    const snapshotKeys = allKeys.filter(key => key.startsWith(STORAGE_PREFIX));
    
    // Eliminar cada una
    snapshotKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`🧹 Eliminados ${snapshotKeys.length} snapshots DOM`);
    return true;
  } catch (error) {
    console.error('❌ Error al limpiar snapshots:', error);
    return false;
  }
}

// Exportar todas las funciones
export default {
  captureDOMSnapshot,
  findDOMSnapshotsByDate,
  renderDOMSnapshot,
  clearAllDOMSnapshots
};