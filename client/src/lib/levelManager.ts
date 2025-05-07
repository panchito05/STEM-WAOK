/**
 * Sistema dedicado para la gestión de niveles de dificultad
 * 
 * Este enfoque separa completamente la lógica de progresión de niveles del resto del código,
 * facilitando su mantenimiento y evitando efectos secundarios no deseados.
 */

import eventBus from './eventBus';

// Definición de los niveles disponibles
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

// Configuración de niveles
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'beginner', 
  'elementary', 
  'intermediate', 
  'advanced', 
  'expert'
];

// Configuración de cuántas respuestas correctas consecutivas son necesarias para subir de nivel
export const CORRECT_ANSWERS_FOR_LEVEL_UP = 10;

// Configuración de cuántas respuestas incorrectas consecutivas para bajar de nivel
export const INCORRECT_ANSWERS_FOR_LEVEL_DOWN = 5;

// Clase para manejar el nivel de dificultad
export class LevelManager {
  private currentLevel: DifficultyLevel;
  private correctStreak: number;
  private incorrectStreak: number;
  private adaptiveDifficultyEnabled: boolean;
  private moduleId: string;
  
  constructor(
    moduleId: string, 
    initialLevel: DifficultyLevel = 'beginner', 
    adaptiveDifficultyEnabled: boolean = false
  ) {
    this.moduleId = moduleId;
    this.currentLevel = initialLevel;
    this.correctStreak = 0;
    this.incorrectStreak = 0;
    this.adaptiveDifficultyEnabled = adaptiveDifficultyEnabled;
    
    // Cargar estado desde localStorage si existe
    this.loadFromStorage();
  }
  
  /**
   * Registra una respuesta correcta y actualiza el nivel si es necesario
   */
  public registerCorrectAnswer(): boolean {
    // Resetear contador de incorrectas
    this.incorrectStreak = 0;
    
    // Incrementar contador de correctas
    this.correctStreak += 1;
    
    // Guardar el estado actualizado
    this.saveToStorage();
    
    console.log(`[LEVEL MANAGER] Respuesta correcta registrada. Racha: ${this.correctStreak}/${CORRECT_ANSWERS_FOR_LEVEL_UP}`);
    
    // Verificar si debe subir de nivel
    const shouldLevelUp = this.correctStreak >= CORRECT_ANSWERS_FOR_LEVEL_UP;
    
    if (shouldLevelUp) {
      const didLevelUp = this.attemptLevelUp();
      if (didLevelUp) {
        // Resetear el contador después de subir de nivel
        this.correctStreak = 0;
        this.saveToStorage();
      }
      return didLevelUp;
    }
    
    return false;
  }
  
  /**
   * Registra una respuesta incorrecta y actualiza el nivel si es necesario
   */
  public registerIncorrectAnswer(): boolean {
    // Resetear contador de correctas
    this.correctStreak = 0;
    
    // Incrementar contador de incorrectas
    this.incorrectStreak += 1;
    
    // Guardar el estado actualizado
    this.saveToStorage();
    
    console.log(`[LEVEL MANAGER] Respuesta incorrecta registrada. Racha: ${this.incorrectStreak}/${INCORRECT_ANSWERS_FOR_LEVEL_DOWN}`);
    
    // Verificar si debe bajar de nivel (solo si dificultad adaptativa está activada)
    if (this.adaptiveDifficultyEnabled && this.incorrectStreak >= INCORRECT_ANSWERS_FOR_LEVEL_DOWN) {
      const didLevelDown = this.attemptLevelDown();
      if (didLevelDown) {
        // Resetear el contador después de bajar de nivel
        this.incorrectStreak = 0;
        this.saveToStorage();
      }
      return didLevelDown;
    }
    
    return false;
  }
  
  /**
   * Intenta subir de nivel si es posible
   */
  private attemptLevelUp(): boolean {
    const currentIndex = DIFFICULTY_LEVELS.indexOf(this.currentLevel);
    
    // Si ya está en el nivel máximo, no hacer nada
    if (currentIndex >= DIFFICULTY_LEVELS.length - 1) {
      console.log(`[LEVEL MANAGER] Ya está en el nivel máximo (${this.currentLevel})`);
      return false;
    }
    
    // Obtener el siguiente nivel
    const previousLevel = this.currentLevel;
    const newLevel = DIFFICULTY_LEVELS[currentIndex + 1];
    
    // Actualizar el nivel
    this.currentLevel = newLevel;
    
    // Activar dificultad adaptativa si no estaba activa
    const wasAdaptive = this.adaptiveDifficultyEnabled;
    this.adaptiveDifficultyEnabled = true;
    
    // Guardar cambios
    this.saveToStorage();
    
    console.log(`[LEVEL MANAGER] ¡NIVEL SUPERADO! De ${previousLevel} a ${newLevel}`);
    
    // Emitir evento de subida de nivel
    eventBus.emit('levelUp', {
      previousLevel,
      newLevel,
      consecutiveCorrectAnswers: CORRECT_ANSWERS_FOR_LEVEL_UP
    });
    
    return true;
  }
  
  /**
   * Intenta bajar de nivel si es posible
   */
  private attemptLevelDown(): boolean {
    const currentIndex = DIFFICULTY_LEVELS.indexOf(this.currentLevel);
    
    // Si ya está en el nivel mínimo, no hacer nada
    if (currentIndex <= 0) {
      console.log(`[LEVEL MANAGER] Ya está en el nivel mínimo (${this.currentLevel})`);
      return false;
    }
    
    // Obtener el nivel anterior
    const previousLevel = this.currentLevel;
    const newLevel = DIFFICULTY_LEVELS[currentIndex - 1];
    
    // Actualizar el nivel
    this.currentLevel = newLevel;
    
    // Guardar cambios
    this.saveToStorage();
    
    console.log(`[LEVEL MANAGER] Bajando de nivel de ${previousLevel} a ${newLevel}`);
    
    return true;
  }
  
  /**
   * Establece manualmente el nivel de dificultad
   */
  public setLevel(level: DifficultyLevel): void {
    // Solo permitir niveles válidos
    if (DIFFICULTY_LEVELS.includes(level)) {
      this.currentLevel = level;
      this.saveToStorage();
    }
  }
  
  /**
   * Activa o desactiva la dificultad adaptativa
   */
  public setAdaptiveDifficulty(enabled: boolean): void {
    this.adaptiveDifficultyEnabled = enabled;
    this.saveToStorage();
  }
  
  /**
   * Guarda el estado actual en localStorage
   */
  private saveToStorage(): void {
    try {
      // Guardar todos los datos relevantes
      localStorage.setItem(`${this.moduleId}_currentLevel`, this.currentLevel);
      localStorage.setItem(`${this.moduleId}_correctStreak`, this.correctStreak.toString());
      localStorage.setItem(`${this.moduleId}_incorrectStreak`, this.incorrectStreak.toString());
      localStorage.setItem(`${this.moduleId}_adaptiveDifficulty`, this.adaptiveDifficultyEnabled.toString());
      
      // También actualizar el objeto de configuración completo
      const moduleSettings = localStorage.getItem('moduleSettings');
      if (moduleSettings) {
        try {
          const settings = JSON.parse(moduleSettings);
          if (!settings[this.moduleId]) {
            settings[this.moduleId] = {};
          }
          
          settings[this.moduleId].difficulty = this.currentLevel;
          settings[this.moduleId].enableAdaptiveDifficulty = this.adaptiveDifficultyEnabled;
          
          localStorage.setItem('moduleSettings', JSON.stringify(settings));
        } catch (error) {
          console.error("[LEVEL MANAGER] Error al actualizar moduleSettings:", error);
        }
      }
    } catch (error) {
      console.error("[LEVEL MANAGER] Error al guardar en localStorage:", error);
    }
  }
  
  /**
   * Carga el estado desde localStorage
   */
  private loadFromStorage(): void {
    try {
      // Cargar nivel actual
      const storedLevel = localStorage.getItem(`${this.moduleId}_currentLevel`);
      if (storedLevel && DIFFICULTY_LEVELS.includes(storedLevel as DifficultyLevel)) {
        this.currentLevel = storedLevel as DifficultyLevel;
      }
      
      // Cargar contadores
      const storedCorrectStreak = localStorage.getItem(`${this.moduleId}_correctStreak`);
      if (storedCorrectStreak) {
        this.correctStreak = parseInt(storedCorrectStreak, 10) || 0;
      }
      
      const storedIncorrectStreak = localStorage.getItem(`${this.moduleId}_incorrectStreak`);
      if (storedIncorrectStreak) {
        this.incorrectStreak = parseInt(storedIncorrectStreak, 10) || 0;
      }
      
      // Cargar configuración de dificultad adaptativa
      const storedAdaptive = localStorage.getItem(`${this.moduleId}_adaptiveDifficulty`);
      if (storedAdaptive) {
        this.adaptiveDifficultyEnabled = storedAdaptive === 'true';
      }
      
      console.log(`[LEVEL MANAGER] Estado cargado: Nivel=${this.currentLevel}, CorrectStreak=${this.correctStreak}, IncorrectStreak=${this.incorrectStreak}, Adaptive=${this.adaptiveDifficultyEnabled}`);
    } catch (error) {
      console.error("[LEVEL MANAGER] Error al cargar desde localStorage:", error);
    }
  }
  
  /**
   * Obtiene el nivel actual
   */
  public getCurrentLevel(): DifficultyLevel {
    return this.currentLevel;
  }
  
  /**
   * Obtiene la racha actual de respuestas correctas
   */
  public getCorrectStreak(): number {
    return this.correctStreak;
  }
  
  /**
   * Obtiene la racha actual de respuestas incorrectas
   */
  public getIncorrectStreak(): number {
    return this.incorrectStreak;
  }
  
  /**
   * Verifica si la dificultad adaptativa está activada
   */
  public isAdaptiveDifficultyEnabled(): boolean {
    return this.adaptiveDifficultyEnabled;
  }
  
  /**
   * Reinicia los contadores pero mantiene el nivel
   */
  public resetStreaks(): void {
    this.correctStreak = 0;
    this.incorrectStreak = 0;
    this.saveToStorage();
  }
}

// Exportar una función para crear instancias del administrador de nivel
export function createLevelManager(
  moduleId: string, 
  initialLevel: DifficultyLevel = 'beginner', 
  adaptiveDifficultyEnabled: boolean = false
): LevelManager {
  return new LevelManager(moduleId, initialLevel, adaptiveDifficultyEnabled);
}