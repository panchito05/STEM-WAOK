/**
 * ADAPTADORES DE DATOS
 * 
 * Este archivo conecta el sistema de sincronización dual con las APIs existentes
 * del sistema, proporcionando una interfaz unificada para todos los tipos de datos.
 */

import { dataSync, SyncData } from './dataSync';

// Tipos específicos para cada categoría de datos
export interface ProgressData {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastAttempt: Date;
  moduleProgress: Record<string, any>;
}

export interface SettingsData {
  difficulty: string;
  timeLimit: string;
  language: string;
  enableSoundEffects: boolean;
  showImmediateFeedback: boolean;
}

export interface RewardsData {
  totalPoints: number;
  unlockedRewards: string[];
  newRewards: string[];
  currentLevel: string;
}

/**
 * Adaptador para progreso de ejercicios
 */
export class ProgressAdapter {
  private keyPrefix = 'progress';

  async saveProgress(profileId: number | null, operationId: string, progressData: ProgressData): Promise<void> {
    const key = this.getKey(profileId, operationId);
    await dataSync.save(key, progressData, { type: 'progress', profileId, operationId });
  }

  async loadProgress(profileId: number | null, operationId: string): Promise<ProgressData | null> {
    const key = this.getKey(profileId, operationId);
    return await dataSync.load(key);
  }

  async saveExerciseResult(profileId: number | null, exerciseResult: any): Promise<void> {
    const key = `${this.keyPrefix}_exercise_${profileId || 'default'}_${Date.now()}`;
    await dataSync.save(key, exerciseResult, { type: 'exercise_result', profileId });
  }

  private getKey(profileId: number | null, operationId: string): string {
    return `${this.keyPrefix}_${profileId || 'default'}_${operationId}`;
  }

  // Integración con APIs existentes del servidor
  async syncWithServer(profileId: number): Promise<void> {
    try {
      // Cargar progreso del servidor
      const response = await fetch(`/api/child-profiles/${profileId}/progress`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const serverProgress = await response.json();
        
        // Convertir formato del servidor al formato interno
        if (serverProgress.exerciseHistory) {
          for (const exercise of serverProgress.exerciseHistory) {
            const key = `progress_${profileId}_${exercise.operationId}`;
            const syncData: SyncData = {
              value: {
                totalCompleted: 1,
                currentStreak: exercise.score === exercise.totalProblems ? 1 : 0,
                longestStreak: exercise.score === exercise.totalProblems ? 1 : 0,
                lastAttempt: new Date(exercise.createdAt),
                moduleProgress: {
                  [exercise.operationId]: {
                    totalCompleted: 1,
                    bestScore: exercise.score,
                    averageScore: exercise.score,
                    totalTime: exercise.timeSpent
                  }
                }
              },
              timestamp: new Date(exercise.createdAt).getTime(),
              version: 1,
              source: 'server'
            };
            
            await dataSync.save(key, syncData.value);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error sincronizando progreso con servidor:', error);
    }
  }
}

/**
 * Adaptador para configuraciones
 */
export class SettingsAdapter {
  private keyPrefix = 'settings';

  async saveSettings(profileId: number | null, moduleId: string, settings: SettingsData): Promise<void> {
    const key = this.getKey(profileId, moduleId);
    await dataSync.save(key, settings, { type: 'settings', profileId, moduleId });
  }

  async loadSettings(profileId: number | null, moduleId: string): Promise<SettingsData | null> {
    const key = this.getKey(profileId, moduleId);
    return await dataSync.load(key);
  }

  private getKey(profileId: number | null, moduleId: string): string {
    return `${this.keyPrefix}_${profileId || 'default'}_${moduleId}`;
  }

  // Integración con APIs existentes del servidor
  async syncWithServer(profileId: number): Promise<void> {
    try {
      const response = await fetch(`/api/child-profiles/${profileId}/settings`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const serverSettings = await response.json();
        
        // Sincronizar configuraciones de módulos
        if (serverSettings.moduleSettings) {
          for (const [moduleId, settings] of Object.entries(serverSettings.moduleSettings)) {
            const key = `settings_${profileId}_${moduleId}`;
            await dataSync.save(key, settings);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error sincronizando configuraciones con servidor:', error);
    }
  }

  async saveToServer(profileId: number, moduleId: string, settings: SettingsData): Promise<void> {
    try {
      await fetch(`/api/child-profiles/${profileId}/settings/module/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.warn('⚠️ Error guardando configuraciones en servidor:', error);
      throw error;
    }
  }
}

/**
 * Adaptador para sistema de recompensas
 */
export class RewardsAdapter {
  private keyPrefix = 'rewards';

  async saveRewards(profileId: number | null, rewardsData: RewardsData): Promise<void> {
    const key = this.getKey(profileId);
    await dataSync.save(key, rewardsData, { type: 'rewards', profileId });
  }

  async loadRewards(profileId: number | null): Promise<RewardsData | null> {
    const key = this.getKey(profileId);
    return await dataSync.load(key);
  }

  private getKey(profileId: number | null): string {
    return `${this.keyPrefix}_${profileId || 'default'}`;
  }
}

/**
 * Gestor principal que coordina todos los adaptadores
 */
export class DataManager {
  public progress = new ProgressAdapter();
  public settings = new SettingsAdapter();
  public rewards = new RewardsAdapter();

  /**
   * Migrar todos los datos cuando el usuario se loguea
   */
  async migrateAllData(profileId: number): Promise<void> {
    console.log('🚀 Iniciando migración completa de datos...');
    
    try {
      // Ejecutar migraciones en paralelo
      await Promise.allSettled([
        this.progress.syncWithServer(profileId),
        this.settings.syncWithServer(profileId),
        dataSync.migrateLocalToServer()
      ]);

      console.log('✅ Migración completa terminada');
      
    } catch (error) {
      console.error('❌ Error en migración completa:', error);
      throw error;
    }
  }

  /**
   * Forzar sincronización de todos los datos
   */
  async forceFullSync(profileId: number): Promise<void> {
    await this.migrateAllData(profileId);
    await dataSync.forceSync();
  }

  /**
   * Obtener estadísticas completas del sistema
   */
  getSystemStats() {
    return {
      sync: dataSync.getSyncStats(),
      timestamp: new Date().toISOString()
    };
  }
}

// Instancia singleton
export const dataManager = new DataManager();

// Funciones de conveniencia para usar en componentes
export const saveProgress = (profileId: number | null, operationId: string, data: ProgressData) => 
  dataManager.progress.saveProgress(profileId, operationId, data);

export const loadProgress = (profileId: number | null, operationId: string) => 
  dataManager.progress.loadProgress(profileId, operationId);

export const saveSettings = (profileId: number | null, moduleId: string, data: SettingsData) => 
  dataManager.settings.saveSettings(profileId, moduleId, data);

export const loadSettings = (profileId: number | null, moduleId: string) => 
  dataManager.settings.loadSettings(profileId, moduleId);

export const saveRewards = (profileId: number | null, data: RewardsData) => 
  dataManager.rewards.saveRewards(profileId, data);

export const loadRewards = (profileId: number | null) => 
  dataManager.rewards.loadRewards(profileId);

export const migrateUserData = (profileId: number) => 
  dataManager.migrateAllData(profileId);

export const forceSync = (profileId: number) => 
  dataManager.forceFullSync(profileId);