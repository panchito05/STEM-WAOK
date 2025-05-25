// RewardEngine: Motor Principal del Sistema de Recompensas
// Coordina la detección, validación y otorgamiento de recompensas

import { RewardGuardian } from './RewardGuardian';
import { 
  BaseReward, 
  RewardCandidate, 
  RewardCriteria, 
  RewardEvent, 
  UserProgressData,
  ValidatedReward,
  ModuleRewardConfig,
  RewardEvidence
} from './RewardTypes';

export class RewardEngine {
  private guardian: RewardGuardian;
  private eventListeners: Map<string, ((event: RewardEvent) => void)[]> = new Map();
  private moduleConfigs: Map<string, ModuleRewardConfig> = new Map();

  constructor() {
    this.guardian = new RewardGuardian();
  }

  /**
   * Registra un módulo en el sistema de recompensas
   */
  registerModule(config: ModuleRewardConfig): void {
    this.moduleConfigs.set(config.moduleId, config);
    console.log(`🎯 RewardEngine: Módulo ${config.moduleId} registrado con ${config.enabledCategories.length} categorías`);
  }

  /**
   * Evalúa si se debe otorgar una recompensa basada en el progreso del usuario
   */
  async evaluateRewards(
    moduleId: string, 
    progressData: UserProgressData,
    evidence: RewardEvidence[]
  ): Promise<ValidatedReward[]> {
    const moduleConfig = this.moduleConfigs.get(moduleId);
    if (!moduleConfig) {
      console.warn(`⚠️ RewardEngine: Módulo ${moduleId} no registrado`);
      return [];
    }

    const candidates = this.generateRewardCandidates(moduleConfig, progressData, evidence);
    const validatedRewards: ValidatedReward[] = [];

    for (const candidate of candidates) {
      const validated = await this.guardian.validateReward(candidate);
      if (validated) {
        validatedRewards.push(validated);
        this.emitEvent({
          type: 'reward_unlocked',
          rewardId: validated.id,
          moduleId,
          timestamp: new Date()
        });
      }
    }

    return validatedRewards;
  }

  /**
   * Genera candidatos a recompensa basados en criterios del módulo
   */
  private generateRewardCandidates(
    config: ModuleRewardConfig,
    progressData: UserProgressData,
    evidence: RewardEvidence[]
  ): RewardCandidate[] {
    const candidates: RewardCandidate[] = [];

    // Generar candidatos para cada categoría habilitada
    for (const category of config.enabledCategories) {
      const categoryCandidates = this.generateCategoryRewards(
        category,
        config,
        progressData,
        evidence
      );
      candidates.push(...categoryCandidates);
    }

    // Agregar recompensas customizadas del módulo
    if (config.customRewards) {
      for (const customReward of config.customRewards) {
        const criteria: RewardCriteria = {
          type: 'milestone',
          threshold: 1,
          moduleId: config.moduleId
        };

        candidates.push({
          reward: customReward,
          criteria,
          triggeredBy: 'problem_completed',
          evidence
        });
      }
    }

    return candidates;
  }

  /**
   * Genera recompensas específicas por categoría
   */
  private generateCategoryRewards(
    category: string,
    config: ModuleRewardConfig,
    progressData: UserProgressData,
    evidence: RewardEvidence[]
  ): RewardCandidate[] {
    const candidates: RewardCandidate[] = [];

    switch (category) {
      case 'milestone':
        candidates.push(...this.generateMilestoneRewards(config, progressData, evidence));
        break;
      case 'streak':
        candidates.push(...this.generateStreakRewards(config, progressData, evidence));
        break;
      case 'level_up':
        candidates.push(...this.generateLevelUpRewards(config, progressData, evidence));
        break;
      case 'achievement':
        candidates.push(...this.generateAchievementRewards(config, progressData, evidence));
        break;
    }

    return candidates;
  }

  /**
   * Genera recompensas de hitos (10, 25, 50, 100 problemas)
   */
  private generateMilestoneRewards(
    config: ModuleRewardConfig,
    progressData: UserProgressData,
    evidence: RewardEvidence[]
  ): RewardCandidate[] {
    const milestones = [
      { threshold: 10, rarity: 'common' as const, name: 'Aprendiz de Suma', points: 100 },
      { threshold: 25, rarity: 'rare' as const, name: 'Entusiasta de Sumas', points: 250 },
      { threshold: 50, rarity: 'epic' as const, name: 'Experto en Sumas', points: 500 },
      { threshold: 100, rarity: 'legendary' as const, name: 'Maestro de la Suma', points: 1000 }
    ];

    const candidates: RewardCandidate[] = [];

    for (const milestone of milestones) {
      if (progressData.totalProblemsCompleted >= milestone.threshold) {
        const reward: BaseReward = {
          id: `${config.moduleId}_milestone_${milestone.threshold}`,
          name: milestone.name,
          description: `Has completado ${milestone.threshold} problemas de suma correctamente`,
          rarity: milestone.rarity,
          category: 'milestone',
          theme: 'addition',
          points: milestone.points * config.pointMultiplier,
          icon: '🎯',
          animationType: milestone.rarity === 'legendary' ? 'confetti' : 'pulse',
          soundEffect: milestone.rarity === 'legendary' ? 'celebration' : 'achievement'
        };

        const criteria: RewardCriteria = {
          type: 'milestone',
          threshold: milestone.threshold,
          moduleId: config.moduleId
        };

        candidates.push({
          reward,
          criteria,
          triggeredBy: 'problem_completed',
          evidence
        });
      }
    }

    return candidates;
  }

  /**
   * Genera recompensas de rachas consecutivas
   */
  private generateStreakRewards(
    config: ModuleRewardConfig,
    progressData: UserProgressData,
    evidence: RewardEvidence[]
  ): RewardCandidate[] {
    const streaks = [
      { threshold: 5, rarity: 'common' as const, name: 'Racha de 5', points: 50 },
      { threshold: 10, rarity: 'rare' as const, name: 'Racha de 10', points: 150 },
      { threshold: 15, rarity: 'epic' as const, name: 'Racha de 15', points: 300 },
      { threshold: 20, rarity: 'legendary' as const, name: 'Súper Racha', points: 600 }
    ];

    const candidates: RewardCandidate[] = [];

    for (const streak of streaks) {
      if (progressData.currentStreak >= streak.threshold || progressData.longestStreak >= streak.threshold) {
        const reward: BaseReward = {
          id: `${config.moduleId}_streak_${streak.threshold}`,
          name: streak.name,
          description: `Has respondido ${streak.threshold} problemas seguidos correctamente`,
          rarity: streak.rarity,
          category: 'streak',
          theme: 'addition',
          points: streak.points * config.pointMultiplier,
          icon: '🔥',
          animationType: streak.rarity === 'legendary' ? 'confetti' : 'glow',
          soundEffect: streak.rarity === 'legendary' ? 'celebration' : 'achievement'
        };

        const criteria: RewardCriteria = {
          type: 'streak',
          threshold: streak.threshold,
          moduleId: config.moduleId
        };

        candidates.push({
          reward,
          criteria,
          triggeredBy: 'streak_achieved',
          evidence
        });
      }
    }

    return candidates;
  }

  /**
   * Genera recompensas por subida de nivel
   */
  private generateLevelUpRewards(
    config: ModuleRewardConfig,
    progressData: UserProgressData,
    evidence: RewardEvidence[]
  ): RewardCandidate[] {
    const levels = [
      { name: 'elementary', displayName: 'Elemental', points: 200 },
      { name: 'intermediate', displayName: 'Intermedio', points: 400 },
      { name: 'advanced', displayName: 'Avanzado', points: 600 },
      { name: 'expert', displayName: 'Experto', points: 1000 }
    ];

    const candidates: RewardCandidate[] = [];
    const currentLevel = progressData.currentLevel.toLowerCase();

    for (const level of levels) {
      if (currentLevel === level.name) {
        const reward: BaseReward = {
          id: `${config.moduleId}_level_${level.name}`,
          name: `Nivel ${level.displayName}`,
          description: `Has alcanzado el nivel ${level.displayName} en suma`,
          rarity: level.name === 'expert' ? 'legendary' : 'epic',
          category: 'level_up',
          theme: 'addition',
          points: level.points * config.pointMultiplier,
          icon: '⬆️',
          animationType: level.name === 'expert' ? 'confetti' : 'pulse',
          soundEffect: 'level_up'
        };

        const criteria: RewardCriteria = {
          type: 'level_up',
          threshold: levels.findIndex(l => l.name === level.name),
          moduleId: config.moduleId
        };

        candidates.push({
          reward,
          criteria,
          triggeredBy: 'level_up',
          evidence
        });
      }
    }

    return candidates;
  }

  /**
   * Genera recompensas de logros especiales
   */
  private generateAchievementRewards(
    config: ModuleRewardConfig,
    progressData: UserProgressData,
    evidence: RewardEvidence[]
  ): RewardCandidate[] {
    const candidates: RewardCandidate[] = [];

    // Logro: Primer problema completado
    if (progressData.totalProblemsCompleted >= 1) {
      const reward: BaseReward = {
        id: `${config.moduleId}_first_problem`,
        name: 'Primer Paso',
        description: 'Has completado tu primer problema de suma',
        rarity: 'common',
        category: 'achievement',
        theme: 'addition',
        points: 25 * config.pointMultiplier,
        icon: '🌟',
        animationType: 'pulse',
        soundEffect: 'achievement'
      };

      const criteria: RewardCriteria = {
        type: 'milestone',
        threshold: 1,
        moduleId: config.moduleId
      };

      candidates.push({
        reward,
        criteria,
        triggeredBy: 'problem_completed',
        evidence
      });
    }

    return candidates;
  }

  /**
   * Registra un listener para eventos de recompensas
   */
  addEventListener(eventType: string, listener: (event: RewardEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Emite un evento de recompensa
   */
  private emitEvent(event: RewardEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error en listener de evento ${event.type}:`, error);
      }
    });
  }

  /**
   * Obtiene la configuración de un módulo
   */
  getModuleConfig(moduleId: string): ModuleRewardConfig | undefined {
    return this.moduleConfigs.get(moduleId);
  }

  /**
   * Verifica la salud del sistema de recompensas
   */
  performHealthCheck(): {
    isHealthy: boolean;
    registeredModules: number;
    activeListeners: number;
    guardianStatus: any;
  } {
    const guardianCheck = this.guardian.performSystemIntegrityCheck();
    
    return {
      isHealthy: guardianCheck.isHealthy && this.moduleConfigs.size > 0,
      registeredModules: this.moduleConfigs.size,
      activeListeners: Array.from(this.eventListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      guardianStatus: guardianCheck
    };
  }
}