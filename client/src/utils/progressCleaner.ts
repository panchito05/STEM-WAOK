/**
 * Utilidad para limpiar completamente los datos de progreso
 * Este módulo implementa un borrado exhaustivo de todos los datos
 * relacionados con el progreso y recompensas de la aplicación
 */

/**
 * Función para borrar todas las claves de localStorage relacionadas con progreso y recompensas
 * @returns Un objeto con estadísticas sobre la limpieza
 */
export function cleanLocalStorage() {
  // PASO 1: Obtener todas las claves existentes
  const allKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) allKeys.push(key);
  }
  
  console.log(`📋 Se encontraron ${allKeys.length} claves en localStorage`);
  
  // Lista de palabras clave para identificar datos relacionados
  const keywords = [
    // Progreso y ejercicios
    'progress', 'progreso', 'exercise', 'ejercicio', 'history', 'historial',
    'completed', 'completado', 'score', 'puntaje', 'result', 'resultado', 
    'data', 'datos', 'stats', 'estadisticas', 'timer', 'tiempo',
    
    // Recompensas y colecciones
    'rewards', 'recompensas', 'trophy', 'trofeo', 'achievement', 'logro',
    'album', 'álbum', 'collection', 'colección', 'unlock', 'desbloqueado',
    'badge', 'medalla', 'prize', 'premio',
    
    // Respaldos y backups
    'backup', 'respaldo', 'saved', 'guardado', 'math', 'matemáticas',
    'operation', 'operación', 'user', 'usuario', 'profile', 'perfil',
    
    // Formato específico usado en la app
    'mathApp_', 'math_', 'mathwaok_', 'waok_', 'problemDetails'
  ];
  
  // Lista de claves críticas que deben eliminarse explícitamente
  const criticalKeys = [
    // Recompensas principales
    'rewards_collection', 'rewardsCollection', 'mathwaok_rewards', 'mathApp_rewards', 
    'user_rewards', 'userRewards', 'rewards-collection', 'rewards_inventory',
    
    // Logros y trofeos
    'achievements', 'completed_achievements', 'trophies', 'badges', 
    'logros', 'achievementsData', 'achievementsProgress',
    
    // Datos de progreso principal
    'exercise_history', 'exerciseHistory', 'module_progress', 'moduleProgress',
    'mathApp_storage', 'mathwaok_storage', 'mathAppStorage',
    
    // Configuración y estados
    'rewardsState', 'rewardsProgress', 'rewardsData', 'rewards-state'
  ];
  
  // PASO 2: Borrar por coincidencia de palabras clave en el nombre
  let keywordMatches = 0;
  allKeys.forEach(key => {
    const matchesKeyword = keywords.some(keyword => 
      key.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (matchesKeyword) {
      localStorage.removeItem(key);
      keywordMatches++;
      console.log(`🗑️ Eliminada clave por palabra clave: ${key}`);
    }
  });
  
  // PASO 3: Borrar claves críticas explícitamente
  criticalKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🏆 Eliminación explícita de clave crítica: ${key}`);
  });
  
  // PASO 4: Verificar contenido de claves restantes
  // Obtener las claves que quedan después de la primera limpieza
  const remainingKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) remainingKeys.push(key);
  }
  
  // Buscar palabras clave en el contenido
  let contentMatches = 0;
  remainingKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return;
      
      const containsKeyword = keywords.some(keyword => 
        value.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (containsKeyword) {
        localStorage.removeItem(key);
        contentMatches++;
        console.log(`🔍 Eliminada clave por contenido sospechoso: ${key}`);
      }
    } catch (error) {
      console.error(`Error al analizar contenido de ${key}:`, error);
    }
  });
  
  // Estadísticas finales
  return {
    total: keywordMatches + criticalKeys.length + contentMatches,
    byKeyword: keywordMatches,
    criticalKeys: criticalKeys.length,
    byContent: contentMatches
  };
}

/**
 * Limpia los datos del localStorage y envía solicitud al servidor para limpiar datos remotos
 * @returns Una promesa que se resuelve cuando se completa la limpieza
 */
export async function cleanAllProgress() {
  try {
    // FASE 1: Limpiar localStorage
    console.log("🧨 INICIANDO PROCESO DE BORRADO TOTAL DE DATOS");
    
    const stats = cleanLocalStorage();
    
    console.log(`✅ FASE 1 COMPLETADA: ${stats.total} elementos eliminados de localStorage
      - ${stats.byKeyword} por coincidencia de nombre
      - ${stats.criticalKeys} claves críticas eliminadas
      - ${stats.byContent} por contenido sospechoso`);
    
    // FASE 2: Limpiar datos en el servidor
    try {
      const serverResponse = await fetch('/api/progress/clear', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (serverResponse.ok) {
        console.log("✅ FASE 2 COMPLETADA: Datos del servidor borrados correctamente");
      } else {
        console.error("⚠️ Error al borrar datos del servidor:", await serverResponse.text());
      }
    } catch (error) {
      console.error("⚠️ Error al conectar con el servidor para borrado:", error);
    }
    
    console.log("✅ PROCESO DE LIMPIEZA COMPLETADO EXITOSAMENTE");
    
    return {
      success: true,
      message: "Todos los datos borrados correctamente",
      stats
    };
  } catch (error) {
    console.error("❌ ERROR EN PROCESO DE LIMPIEZA:", error);
    return {
      success: false,
      message: "Error al limpiar datos",
      error
    };
  }
}