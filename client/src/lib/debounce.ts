/**
 * Crea una versión "debounced" de una función que solo se activará
 * después de que haya pasado un tiempo determinado desde la última vez
 * que se invocó.
 * 
 * @param func La función a aplicar debounce
 * @param wait Tiempo de espera en milisegundos
 * @returns Función con debounce aplicado
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...funcArgs: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Versión de debounce que devuelve una promesa que se resuelve con el
 * resultado de la función original.
 */
export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...funcArgs: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  
  return function(...args: Parameters<T>): Promise<ReturnType<T>> {
    // Si ya hay una promesa pendiente, devuélvela
    if (pendingPromise) {
      return pendingPromise;
    }
    
    // Crear una nueva promesa
    pendingPromise = new Promise<ReturnType<T>>((resolve, reject) => {
      const later = () => {
        timeout = null;
        func(...args)
          .then((result) => {
            pendingPromise = null;
            resolve(result);
          })
          .catch((error) => {
            pendingPromise = null;
            reject(error);
          });
      };
      
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(later, wait);
    });
    
    return pendingPromise;
  };
}

/**
 * Versión de throttle que limita la frecuencia con la que se puede invocar una función
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...funcArgs: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}