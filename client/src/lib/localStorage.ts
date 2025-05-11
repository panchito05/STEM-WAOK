/**
 * Servicio de almacenamiento local que maneja la persistencia de datos
 * en localStorage con marcas de tiempo para detectar cambios y conflictos.
 */

// Interfaz para datos con marca de tiempo
export interface TimestampedData<T> {
  data: T;
  lastModified: number;
}

/**
 * Obtiene el prefijo de la clave de almacenamiento basado en el ID de usuario o un valor por defecto
 * @param profileId - ID opcional de perfil de usuario
 * @returns El prefijo de la clave para el almacenamiento
 */
export function getStoragePrefix(profileId?: number | null): string {
  return profileId ? `profile_${profileId}` : 'user_default';
}

/**
 * Genera una clave completa para localStorage basada en el prefijo y la clave base
 */
export function getFullStorageKey(baseKey: string, profileId?: number | null): string {
  const prefix = getStoragePrefix(profileId);
  return `${prefix}_${baseKey}`;
}

/**
 * Guarda datos en localStorage con una marca de tiempo
 */
export function saveToLocalStorage<T>(
  key: string, 
  data: T, 
  profileId?: number | null
): void {
  const fullKey = getFullStorageKey(key, profileId);
  const timestampedData: TimestampedData<T> = {
    data,
    lastModified: Date.now()
  };
  
  try {
    localStorage.setItem(fullKey, JSON.stringify(timestampedData));
    console.log(`✅ Guardado en localStorage: ${fullKey}`, timestampedData);
  } catch (error) {
    console.error(`❌ Error al guardar en localStorage: ${fullKey}`, error);
    // Intentar limpiar localStorage si está lleno
    if (error instanceof DOMException && (
      error.name === 'QuotaExceededError' || 
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn('🧹 localStorage lleno, intentando limpiar datos antiguos...');
      clearOldData();
      
      // Intentar guardar de nuevo
      try {
        localStorage.setItem(fullKey, JSON.stringify(timestampedData));
        console.log(`✅ Guardado exitoso después de limpiar localStorage: ${fullKey}`);
      } catch (retryError) {
        console.error(`❌ Error al guardar después de limpiar localStorage: ${fullKey}`, retryError);
      }
    }
  }
}

/**
 * Limpia datos antiguos de localStorage (más de 30 días)
 */
function clearOldData(): void {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const timestampedData = JSON.parse(item) as TimestampedData<unknown>;
          if (timestampedData.lastModified && timestampedData.lastModified < thirtyDaysAgo) {
            localStorage.removeItem(key);
            console.log(`🧹 Eliminado dato antiguo: ${key}`);
          }
        }
      } catch (error) {
        // Si no es un dato con formato esperado, ignorarlo
      }
    }
  }
}

/**
 * Recupera datos de localStorage con verificación de formato
 */
export function getFromLocalStorage<T>(
  key: string, 
  defaultValue: T,
  profileId?: number | null
): TimestampedData<T> {
  const fullKey = getFullStorageKey(key, profileId);
  
  try {
    const item = localStorage.getItem(fullKey);
    
    if (!item) {
      console.log(`⚠️ No se encontró dato en localStorage: ${fullKey}, usando valor por defecto`);
      return { data: defaultValue, lastModified: Date.now() };
    }
    
    const parsedItem = JSON.parse(item) as TimestampedData<T>;
    
    // Verificar que tenga la estructura esperada
    if (typeof parsedItem !== 'object' || !parsedItem.hasOwnProperty('data') || !parsedItem.hasOwnProperty('lastModified')) {
      console.warn(`⚠️ Formato incorrecto en localStorage: ${fullKey}, reconstruyendo`);
      
      // Si el dato existe pero no tiene el formato correcto, reconstruirlo
      const timestampedData: TimestampedData<T> = {
        data: item ? (JSON.parse(item) as T) : defaultValue,
        lastModified: Date.now()
      };
      
      // Guardar la versión corregida
      saveToLocalStorage(key, timestampedData.data, profileId);
      
      return timestampedData;
    }
    
    return parsedItem;
  } catch (error) {
    console.error(`❌ Error al leer de localStorage: ${fullKey}`, error);
    return { data: defaultValue, lastModified: Date.now() };
  }
}

/**
 * Elimina datos de localStorage
 */
export function removeFromLocalStorage(key: string, profileId?: number | null): void {
  const fullKey = getFullStorageKey(key, profileId);
  
  try {
    localStorage.removeItem(fullKey);
    console.log(`🗑️ Eliminado de localStorage: ${fullKey}`);
  } catch (error) {
    console.error(`❌ Error al eliminar de localStorage: ${fullKey}`, error);
  }
}

/**
 * Sincroniza múltiples valores en localStorage
 */
export function syncBatchToLocalStorage<T>(
  keyValuePairs: Array<{key: string, value: T}>, 
  profileId?: number | null
): void {
  keyValuePairs.forEach(({key, value}) => {
    saveToLocalStorage(key, value, profileId);
  });
}