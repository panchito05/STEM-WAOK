// DataCollectors: Sistema de Recolección de Datos de Múltiples Fuentes
// Recopila información de BD, localStorage y contexto para validación cruzada

import { RewardEvidence, UserProgressData } from '../core/RewardTypes';

export interface RewardDataCollector {
  collect(): Promise<RewardEvidence>;
  getReliability(): number;
  getSourceName(): string;
}

/**
 * Recolector de datos desde la base de datos
 */
export class DatabaseCollector implements RewardDataCollector {
  private childProfileId: number | null = null;

  constructor(childProfileId?: number) {
    this.childProfileId = childProfileId || null;
  }

  async collect(): Promise<RewardEvidence> {
    try {
      // Obtener datos del progreso desde la API
      const endpoint = this.childProfileId 
        ? `/api/child-profiles/${this.childProfileId}/progress`
        : '/api/progress';
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const progressData = await response.json();
      
      // Transformar datos de la API al formato esperado
      const userData: UserProgressData = this.transformApiData(progressData);

      return {
        source: 'database',
        data: userData,
        timestamp: new Date(),
        reliability: 0.95 // Base de datos es muy confiable
      };
    } catch (error) {
      console.warn('📊 DatabaseCollector: Error recolectando datos de BD:', error);
      
      // Retornar datos vacíos en caso de error
      return {
        source: 'database',
        data: this.getEmptyUserData(),
        timestamp: new Date(),
        reliability: 0.0 // Sin confiabilidad si hay error
      };
    }
  }

  private transformApiData(apiData: any): UserProgressData {
    const exerciseHistory = apiData.exerciseHistory || [];
    
    // Calcular total de problemas completados
    const totalProblems = exerciseHistory.reduce((total: number, exercise: any) => {
      return total + (exercise.totalProblems || 0);
    }, 0);

    // Calcular racha actual y más larga
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Analizar historial para calcular rachas
    exerciseHistory.forEach((exercise: any) => {
      if (exercise.extra_data?.problems) {
        exercise.extra_data.problems.forEach((problem: any) => {
          if (problem.isCorrect) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        });
      }
    });

    currentStreak = tempStreak; // La racha actual es la última secuencia

    // Determinar nivel actual basado en el progreso
    let currentLevel = 'beginner';
    if (totalProblems >= 100) currentLevel = 'expert';
    else if (totalProblems >= 50) currentLevel = 'advanced';
    else if (totalProblems >= 25) currentLevel = 'intermediate';
    else if (totalProblems >= 10) currentLevel = 'elementary';

    // Progreso por módulo
    const moduleProgress: Record<string, any> = {};
    
    exerciseHistory.forEach((exercise: any) => {
      const moduleId = exercise.operationId || 'addition';
      if (!moduleProgress[moduleId]) {
        moduleProgress[moduleId] = {
          problemsCompleted: 0,
          accuracy: 0,
          avgTimePerProblem: 0,
          consecutiveCorrect: 0
        };
      }
      
      moduleProgress[moduleId].problemsCompleted += exercise.totalProblems || 0;
      if (exercise.accuracy !== undefined) {
        moduleProgress[moduleId].accuracy = exercise.accuracy;
      }
    });

    return {
      totalProblemsCompleted: totalProblems,
      currentStreak,
      longestStreak,
      currentLevel,
      moduleProgress,
      lastActivity: new Date()
    };
  }

  getReliability(): number {
    return 0.95;
  }

  getSourceName(): string {
    return 'database';
  }

  private getEmptyUserData(): UserProgressData {
    return {
      totalProblemsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      currentLevel: 'beginner',
      moduleProgress: {},
      lastActivity: new Date()
    };
  }
}

/**
 * Recolector de datos desde localStorage
 */
export class LocalStorageCollector implements RewardDataCollector {
  private userId: string;

  constructor(userId: string = 'default') {
    this.userId = userId;
  }

  async collect(): Promise<RewardEvidence> {
    try {
      // Recolectar datos guardados en localStorage
      const progressKey = `user_${this.userId}_progress`;
      const streakKey = `user_${this.userId}_streak`;
      const levelKey = `user_${this.userId}_level`;

      const savedProgress = localStorage.getItem(progressKey);
      const savedStreak = localStorage.getItem(streakKey);
      const savedLevel = localStorage.getItem(levelKey);

      const userData: UserProgressData = {
        totalProblemsCompleted: savedProgress ? parseInt(savedProgress, 10) : 0,
        currentStreak: savedStreak ? parseInt(savedStreak, 10) : 0,
        longestStreak: savedStreak ? parseInt(savedStreak, 10) : 0, // Simplificado por ahora
        currentLevel: savedLevel || 'beginner',
        moduleProgress: this.getModuleProgressFromStorage(),
        lastActivity: new Date()
      };

      return {
        source: 'localStorage',
        data: userData,
        timestamp: new Date(),
        reliability: 0.7 // localStorage es menos confiable que BD
      };
    } catch (error) {
      console.warn('💾 LocalStorageCollector: Error recolectando datos de localStorage:', error);
      
      return {
        source: 'localStorage',
        data: this.getEmptyUserData(),
        timestamp: new Date(),
        reliability: 0.0
      };
    }
  }

  private getModuleProgressFromStorage(): Record<string, any> {
    try {
      const moduleProgressKey = `user_${this.userId}_moduleProgress`;
      const saved = localStorage.getItem(moduleProgressKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  getReliability(): number {
    return 0.7;
  }

  getSourceName(): string {
    return 'localStorage';
  }

  private getEmptyUserData(): UserProgressData {
    return {
      totalProblemsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      currentLevel: 'beginner',
      moduleProgress: {},
      lastActivity: new Date()
    };
  }

  // Método para actualizar datos en localStorage
  updateProgress(data: Partial<UserProgressData>): void {
    try {
      if (data.totalProblemsCompleted !== undefined) {
        localStorage.setItem(`user_${this.userId}_progress`, data.totalProblemsCompleted.toString());
      }
      if (data.currentStreak !== undefined) {
        localStorage.setItem(`user_${this.userId}_streak`, data.currentStreak.toString());
      }
      if (data.currentLevel !== undefined) {
        localStorage.setItem(`user_${this.userId}_level`, data.currentLevel);
      }
      if (data.moduleProgress !== undefined) {
        localStorage.setItem(`user_${this.userId}_moduleProgress`, JSON.stringify(data.moduleProgress));
      }
    } catch (error) {
      console.warn('💾 Error actualizando localStorage:', error);
    }
  }
}

/**
 * Recolector de datos desde contexto de React (en memoria)
 */
export class ContextCollector implements RewardDataCollector {
  private contextData: UserProgressData | null = null;

  constructor(contextData?: UserProgressData) {
    this.contextData = contextData || null;
  }

  async collect(): Promise<RewardEvidence> {
    const userData = this.contextData || this.getEmptyUserData();

    return {
      source: 'context',
      data: userData,
      timestamp: new Date(),
      reliability: this.contextData ? 0.8 : 0.0 // Confiable si hay datos
    };
  }

  updateContextData(data: UserProgressData): void {
    this.contextData = data;
  }

  getReliability(): number {
    return this.contextData ? 0.8 : 0.0;
  }

  getSourceName(): string {
    return 'context';
  }

  private getEmptyUserData(): UserProgressData {
    return {
      totalProblemsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      currentLevel: 'beginner',
      moduleProgress: {},
      lastActivity: new Date()
    };
  }
}

/**
 * Coordinador de todos los colectores
 */
export class CollectorCoordinator {
  private collectors: RewardDataCollector[] = [];

  addCollector(collector: RewardDataCollector): void {
    this.collectors.push(collector);
  }

  async collectAllEvidence(): Promise<RewardEvidence[]> {
    const evidence: RewardEvidence[] = [];

    // Recolectar de todos los colectores en paralelo
    const promises = this.collectors.map(collector => collector.collect());
    
    try {
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          evidence.push(result.value);
        } else {
          console.warn(`⚠️ Collector ${this.collectors[index].getSourceName()} falló:`, result.reason);
        }
      });
    } catch (error) {
      console.error('❌ Error recolectando evidencia:', error);
    }

    return evidence;
  }

  getCollectorCount(): number {
    return this.collectors.length;
  }

  getCollectorNames(): string[] {
    return this.collectors.map(c => c.getSourceName());
  }
}