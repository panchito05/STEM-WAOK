// useRewards: Hook Principal del Sistema de Recompensas
// Interfaz React para que los módulos interactúen con el sistema

import { useEffect, useRef, useCallback } from 'react';
import { useRewardStore, useRewardSelectors } from '../core/RewardStore';
import { RewardEngine } from '../core/RewardEngine';
import { 
  CollectorCoordinator, 
  DatabaseCollector, 
  LocalStorageCollector, 
  ContextCollector 
} from '../collectors/DataCollectors';
import { 
  ValidatedReward, 
  UserProgressData, 
  ModuleRewardConfig,
  DEFAULT_MODULE_REWARD_CONFIG
} from '../core/RewardTypes';

export interface UseRewardsOptions {
  moduleId: string;
  userId?: string;
  childProfileId?: number;
  autoCheck?: boolean; // Si debe verificar automáticamente por nuevas recompensas
  enabledCategories?: string[];
}

export interface UseRewardsReturn {
  // Estado
  isEnabled: boolean;
  totalPoints: number;
  newRewardsCount: number;
  recentRewards: ValidatedReward[];
  
  // Acciones
  checkForRewards: (progressData: UserProgressData) => Promise<ValidatedReward[]>;
  markRewardAsViewed: (rewardId: string) => void;
  markAllRewardsAsViewed: () => void;
  
  // Configuración
  updateModuleConfig: (config: Partial<ModuleRewardConfig>) => void;
  enableRewards: () => void;
  disableRewards: () => void;
  
  // Utilidades
  getMetrics: () => any;
  performHealthCheck: () => any;
}

export function useRewards(options: UseRewardsOptions): UseRewardsReturn {
  const {
    moduleId,
    userId = 'default',
    childProfileId,
    autoCheck = false,
    enabledCategories = ['achievement', 'milestone', 'streak', 'level_up']
  } = options;

  // Estado del store
  const isEnabled = useRewardSelectors.useIsEnabled();
  const totalPoints = useRewardSelectors.useTotalPoints();
  const newRewardsCount = useRewardSelectors.useNewRewardsCount();
  const recentRewards = useRewardSelectors.useRecentRewards(5);

  // Acciones del store
  const {
    addReward,
    markRewardAsViewed,
    markAllRewardsAsViewed,
    setModuleConfig,
    getModuleConfig,
    enableRewards: storeEnableRewards,
    disableRewards: storeDisableRewards,
    getMetrics
  } = useRewardStore();

  // Referencias para mantener instancias
  const engineRef = useRef<RewardEngine | null>(null);
  const coordinatorRef = useRef<CollectorCoordinator | null>(null);
  const lastCheckRef = useRef<Date>(new Date());

  // Inicializar sistema cuando el hook se monta
  useEffect(() => {
    initializeRewardSystem();
  }, [moduleId]);

  // Verificación automática si está habilitada
  useEffect(() => {
    if (autoCheck && isEnabled) {
      const interval = setInterval(() => {
        performAutoCheck();
      }, 30000); // Verificar cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoCheck, isEnabled]);

  /**
   * Inicializa el motor de recompensas y colectores
   */
  const initializeRewardSystem = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new RewardEngine();
      
      // Registrar el módulo
      const moduleConfig: ModuleRewardConfig = {
        ...DEFAULT_MODULE_REWARD_CONFIG,
        moduleId,
        enabledCategories: enabledCategories as any
      };
      
      engineRef.current.registerModule(moduleConfig);
      setModuleConfig(moduleId, moduleConfig);

      console.log(`🎯 Sistema de recompensas inicializado para módulo: ${moduleId}`);
    }

    if (!coordinatorRef.current) {
      coordinatorRef.current = new CollectorCoordinator();
      
      // Agregar colectores
      coordinatorRef.current.addCollector(new DatabaseCollector(childProfileId));
      coordinatorRef.current.addCollector(new LocalStorageCollector(userId));
      coordinatorRef.current.addCollector(new ContextCollector());

      console.log(`📊 Colectores de datos inicializados: ${coordinatorRef.current.getCollectorNames().join(', ')}`);
    }
  }, [moduleId, userId, childProfileId, enabledCategories]);

  /**
   * Verifica por nuevas recompensas basadas en el progreso del usuario
   */
  const checkForRewards = useCallback(async (progressData: UserProgressData): Promise<ValidatedReward[]> => {
    if (!isEnabled || !engineRef.current || !coordinatorRef.current) {
      return [];
    }

    try {
      console.log(`🔍 Verificando recompensas para ${moduleId}...`);
      
      // Actualizar colector de contexto con datos actuales
      const contextCollector = coordinatorRef.current['collectors']?.find(
        c => c.getSourceName() === 'context'
      ) as ContextCollector;
      
      if (contextCollector) {
        contextCollector.updateContextData(progressData);
      }

      // Recopilar evidencia de todas las fuentes
      const evidence = await coordinatorRef.current.collectAllEvidence();
      
      if (evidence.length === 0) {
        console.warn('⚠️ No se pudo recopilar evidencia para validación');
        return [];
      }

      // Evaluar recompensas
      const newRewards = await engineRef.current.evaluateRewards(
        moduleId,
        progressData,
        evidence
      );

      // Agregar recompensas validadas al store
      newRewards.forEach(reward => {
        addReward(reward);
      });

      lastCheckRef.current = new Date();

      if (newRewards.length > 0) {
        console.log(`🎉 ${newRewards.length} nueva(s) recompensa(s) desbloqueada(s):`, 
          newRewards.map(r => r.name).join(', ')
        );
      }

      return newRewards;

    } catch (error) {
      console.error('❌ Error verificando recompensas:', error);
      return [];
    }
  }, [isEnabled, moduleId, addReward]);

  /**
   * Verificación automática utilizando datos del localStorage
   */
  const performAutoCheck = useCallback(async () => {
    if (!coordinatorRef.current) return;

    try {
      // Obtener datos básicos del localStorage para verificación automática
      const localCollector = new LocalStorageCollector(userId);
      const evidence = await localCollector.collect();
      
      if (evidence.reliability > 0.5) {
        await checkForRewards(evidence.data);
      }
    } catch (error) {
      console.warn('⚠️ Error en verificación automática:', error);
    }
  }, [checkForRewards, userId]);

  /**
   * Actualiza la configuración del módulo
   */
  const updateModuleConfig = useCallback((configUpdate: Partial<ModuleRewardConfig>) => {
    const currentConfig = getModuleConfig(moduleId);
    const newConfig = { ...currentConfig, ...configUpdate };
    
    setModuleConfig(moduleId, newConfig);
    
    // Actualizar en el engine también
    if (engineRef.current) {
      engineRef.current.registerModule(newConfig);
    }

    console.log(`⚙️ Configuración actualizada para módulo ${moduleId}`);
  }, [moduleId, getModuleConfig, setModuleConfig]);

  /**
   * Habilita el sistema de recompensas
   */
  const enableRewards = useCallback(() => {
    storeEnableRewards();
    console.log('✅ Sistema de recompensas habilitado');
  }, [storeEnableRewards]);

  /**
   * Deshabilita el sistema de recompensas
   */
  const disableRewards = useCallback(() => {
    storeDisableRewards();
    console.log('⏸️ Sistema de recompensas deshabilitado');
  }, [storeDisableRewards]);

  /**
   * Realiza un chequeo de salud del sistema
   */
  const performHealthCheck = useCallback(() => {
    const engineHealth = engineRef.current?.performHealthCheck() || {
      isHealthy: false,
      registeredModules: 0,
      activeListeners: 0,
      guardianStatus: { isHealthy: false, issues: ['Engine no inicializado'] }
    };

    const collectorHealth = {
      isInitialized: !!coordinatorRef.current,
      collectorCount: coordinatorRef.current?.getCollectorCount() || 0,
      collectorNames: coordinatorRef.current?.getCollectorNames() || []
    };

    const storeHealth = {
      isEnabled,
      totalPoints,
      rewardsCount: recentRewards.length,
      lastCheck: lastCheckRef.current
    };

    return {
      overall: engineHealth.isHealthy && collectorHealth.isInitialized,
      engine: engineHealth,
      collectors: collectorHealth,
      store: storeHealth,
      moduleId
    };
  }, [isEnabled, totalPoints, recentRewards.length]);

  return {
    // Estado
    isEnabled,
    totalPoints,
    newRewardsCount,
    recentRewards,
    
    // Acciones
    checkForRewards,
    markRewardAsViewed,
    markAllRewardsAsViewed,
    
    // Configuración
    updateModuleConfig,
    enableRewards,
    disableRewards,
    
    // Utilidades
    getMetrics,
    performHealthCheck
  };
}