/**
 * HOOK PERSONALIZADO PARA SINCRONIZACIÓN DE DATOS
 * 
 * Proporciona una interfaz simple para que cualquier componente pueda
 * usar el sistema de sincronización dual sin preocuparse por los detalles.
 */

import { useState, useEffect, useCallback } from 'react';
import { dataManager, ProgressData, SettingsData, RewardsData } from '@/lib/dataAdapters';
import { useChildProfiles } from '@/context/ChildProfilesContext';

export interface UseSyncedDataOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

/**
 * Hook principal para manejar datos sincronizados
 */
export function useDataSync(options: UseSyncedDataOptions = {}) {
  const { autoSync = true, syncInterval = 30000 } = options;
  const { activeProfile } = useChildProfiles();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const profileId = activeProfile?.id || null;

  // Función para forzar sincronización manual
  const forceSync = useCallback(async () => {
    if (!profileId) return;
    
    setIsLoading(true);
    setSyncError(null);
    
    try {
      await dataManager.forceFullSync(profileId);
      setLastSync(new Date());
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Error de sincronización');
      console.warn('Error en sincronización manual:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  // Sincronización automática periódica
  useEffect(() => {
    if (!autoSync || !profileId) return;

    const interval = setInterval(async () => {
      try {
        await dataManager.forceFullSync(profileId);
        setLastSync(new Date());
        setSyncError(null);
      } catch (error) {
        console.warn('Error en sincronización automática:', error);
        // No mostrar error para sincronización automática - el sistema sigue funcionando con datos locales
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, profileId]);

  return {
    isLoading,
    lastSync,
    syncError,
    forceSync,
    stats: dataManager.getSystemStats()
  };
}

/**
 * Hook específico para progreso de ejercicios
 */
export function useSyncedProgress(operationId: string) {
  const { activeProfile } = useChildProfiles();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const profileId = activeProfile?.id || null;

  // Cargar progreso
  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dataManager.progress.loadProgress(profileId, operationId);
      setProgress(data);
    } catch (error) {
      console.warn('Error cargando progreso:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, operationId]);

  // Guardar progreso
  const saveProgress = useCallback(async (progressData: ProgressData) => {
    try {
      await dataManager.progress.saveProgress(profileId, operationId, progressData);
      setProgress(progressData);
    } catch (error) {
      console.warn('Error guardando progreso:', error);
      throw error;
    }
  }, [profileId, operationId]);

  // Cargar al inicio
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    isLoading,
    saveProgress,
    reloadProgress: loadProgress
  };
}

/**
 * Hook específico para configuraciones de módulos
 */
export function useSyncedSettings(moduleId: string) {
  const { activeProfile } = useChildProfiles();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const profileId = activeProfile?.id || null;

  // Cargar configuraciones
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dataManager.settings.loadSettings(profileId, moduleId);
      setSettings(data);
    } catch (error) {
      console.warn('Error cargando configuraciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, moduleId]);

  // Guardar configuraciones
  const saveSettings = useCallback(async (settingsData: SettingsData) => {
    try {
      await dataManager.settings.saveSettings(profileId, moduleId, settingsData);
      setSettings(settingsData);
      
      // También intentar guardar en servidor si estamos autenticados
      if (profileId) {
        try {
          await dataManager.settings.saveToServer(profileId, moduleId, settingsData);
        } catch (error) {
          console.warn('Error guardando configuraciones en servidor (usando fallback local):', error);
          // El dato ya se guardó localmente, así que no es crítico
        }
      }
    } catch (error) {
      console.warn('Error guardando configuraciones:', error);
      throw error;
    }
  }, [profileId, moduleId]);

  // Cargar al inicio
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    saveSettings,
    reloadSettings: loadSettings
  };
}

/**
 * Hook específico para sistema de recompensas
 */
export function useSyncedRewards() {
  const { activeProfile } = useChildProfiles();
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const profileId = activeProfile?.id || null;

  // Cargar recompensas
  const loadRewards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dataManager.rewards.loadRewards(profileId);
      setRewards(data);
    } catch (error) {
      console.warn('Error cargando recompensas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  // Guardar recompensas
  const saveRewards = useCallback(async (rewardsData: RewardsData) => {
    try {
      await dataManager.rewards.saveRewards(profileId, rewardsData);
      setRewards(rewardsData);
    } catch (error) {
      console.warn('Error guardando recompensas:', error);
      throw error;
    }
  }, [profileId]);

  // Cargar al inicio
  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  return {
    rewards,
    isLoading,
    saveRewards,
    reloadRewards: loadRewards
  };
}

/**
 * Hook para obtener estadísticas del sistema de sincronización
 */
export function useSyncStats() {
  const [stats, setStats] = useState(dataManager.getSystemStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(dataManager.getSystemStats());
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return stats;
}