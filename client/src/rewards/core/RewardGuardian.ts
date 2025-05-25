// RewardGuardian: Sistema de Triple Validación de Recompensas
// Previene recompensas falsas mediante verificación cruzada de múltiples fuentes

import { 
  RewardCandidate, 
  RewardEvidence, 
  UserProgressData, 
  ValidatedReward 
} from './RewardTypes';

export class RewardGuardian {
  private readonly MIN_VALIDATION_SCORE = 0.7;
  private readonly MIN_EVIDENCE_SOURCES = 2;
  private readonly RELIABILITY_THRESHOLD = 0.6;

  /**
   * Valida una recompensa candidata usando triple verificación
   */
  async validateReward(candidate: RewardCandidate): Promise<ValidatedReward | null> {
    try {
      // 1. Verificar que tengamos suficiente evidencia
      if (!this.hasSufficientEvidence(candidate.evidence)) {
        console.warn(`🛡️ RewardGuardian: Evidencia insuficiente para recompensa ${candidate.reward.id}`);
        return null;
      }

      // 2. Verificar la consistencia entre fuentes
      const consistencyScore = this.calculateConsistencyScore(candidate.evidence);
      if (consistencyScore < this.MIN_VALIDATION_SCORE) {
        console.warn(`🛡️ RewardGuardian: Inconsistencia detectada para recompensa ${candidate.reward.id}. Score: ${consistencyScore}`);
        return null;
      }

      // 3. Detectar patrones sospechosos
      if (this.detectAnomalies(candidate)) {
        console.warn(`🛡️ RewardGuardian: Anomalía detectada para recompensa ${candidate.reward.id}`);
        return null;
      }

      // 4. Validar criterios específicos
      const criteriaValid = this.validateCriteria(candidate);
      if (!criteriaValid) {
        console.warn(`🛡️ RewardGuardian: Criterios no cumplidos para recompensa ${candidate.reward.id}`);
        return null;
      }

      // ✅ Recompensa validada exitosamente
      const validatedReward: ValidatedReward = {
        ...candidate.reward,
        validatedAt: new Date(),
        validationScore: consistencyScore,
        shouldShow: true
      };

      console.log(`✅ RewardGuardian: Recompensa ${candidate.reward.id} validada exitosamente (Score: ${consistencyScore})`);
      return validatedReward;

    } catch (error) {
      console.error(`❌ RewardGuardian: Error validando recompensa ${candidate.reward.id}:`, error);
      return null;
    }
  }

  /**
   * Verifica que tengamos evidencia de al menos 2 fuentes confiables
   */
  private hasSufficientEvidence(evidence: RewardEvidence[]): boolean {
    const reliableSources = evidence.filter(e => e.reliability >= this.RELIABILITY_THRESHOLD);
    return reliableSources.length >= this.MIN_EVIDENCE_SOURCES;
  }

  /**
   * Calcula un score de consistencia comparando datos entre fuentes
   */
  private calculateConsistencyScore(evidence: RewardEvidence[]): number {
    if (evidence.length < 2) return 0;

    const problemCounts = evidence.map(e => e.data.totalProblemsCompleted);
    const streakCounts = evidence.map(e => e.data.currentStreak);

    // Calcular varianza en los datos
    const problemVariance = this.calculateVariance(problemCounts);
    const streakVariance = this.calculateVariance(streakCounts);

    // Penalizar mucha varianza (datos inconsistentes)
    const maxAllowedVariance = 5; // 5 problemas de diferencia máxima
    const problemScore = Math.max(0, 1 - (problemVariance / maxAllowedVariance));
    const streakScore = Math.max(0, 1 - (streakVariance / maxAllowedVariance));

    // Score ponderado
    return (problemScore * 0.7) + (streakScore * 0.3);
  }

  /**
   * Detecta patrones sospechosos en los datos
   */
  private detectAnomalies(candidate: RewardCandidate): boolean {
    const evidence = candidate.evidence;
    
    // Anomalía 1: Saltos imposibles en problemas completados
    const problemCounts = evidence.map(e => e.data.totalProblemsCompleted);
    const maxCount = Math.max(...problemCounts);
    const minCount = Math.min(...problemCounts);
    
    if (maxCount - minCount > 50) {
      console.warn(`🚨 Anomalía detectada: Salto de ${minCount} a ${maxCount} problemas`);
      return true;
    }

    // Anomalía 2: Rachas imposibles (más del 200% de problemas totales)
    for (const e of evidence) {
      if (e.data.currentStreak > e.data.totalProblemsCompleted * 2) {
        console.warn(`🚨 Anomalía detectada: Racha (${e.data.currentStreak}) > 2x problemas totales (${e.data.totalProblemsCompleted})`);
        return true;
      }
    }

    // Anomalía 3: Actividad imposible (más de 1000 problemas en un día)
    const recentActivity = evidence.filter(e => {
      const timeDiff = Date.now() - e.timestamp.getTime();
      return timeDiff < 24 * 60 * 60 * 1000; // Últimas 24 horas
    });

    if (recentActivity.length > 0) {
      const maxProblemsToday = Math.max(...recentActivity.map(e => e.data.totalProblemsCompleted));
      if (maxProblemsToday > 1000) {
        console.warn(`🚨 Anomalía detectada: Demasiados problemas en 24h (${maxProblemsToday})`);
        return true;
      }
    }

    return false;
  }

  /**
   * Valida que se cumplan los criterios específicos de la recompensa
   */
  private validateCriteria(candidate: RewardCandidate): boolean {
    const { criteria } = candidate;
    const mostReliableEvidence = this.getMostReliableEvidence(candidate.evidence);
    
    if (!mostReliableEvidence) return false;

    const data = mostReliableEvidence.data;

    switch (criteria.type) {
      case 'milestone':
        return data.totalProblemsCompleted >= criteria.threshold;
      
      case 'streak':
        return data.currentStreak >= criteria.threshold || data.longestStreak >= criteria.threshold;
      
      case 'level_up':
        // Validar que el usuario esté en el nivel requerido o superior
        const levelOrder = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
        const currentLevelIndex = levelOrder.indexOf(data.currentLevel.toLowerCase());
        const requiredLevelIndex = criteria.threshold;
        return currentLevelIndex >= requiredLevelIndex;
      
      case 'perseverance':
        // Validar perseverancia basada en metadata específica
        return criteria.metadata?.attempts >= criteria.threshold;
      
      default:
        console.warn(`⚠️ Tipo de criterio desconocido: ${criteria.type}`);
        return false;
    }
  }

  /**
   * Obtiene la evidencia más confiable
   */
  private getMostReliableEvidence(evidence: RewardEvidence[]): RewardEvidence | null {
    if (evidence.length === 0) return null;
    
    return evidence.reduce((most, current) => 
      current.reliability > most.reliability ? current : most
    );
  }

  /**
   * Calcula la varianza de un array de números
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }

  /**
   * Combina datos de múltiples fuentes usando el valor más conservador
   */
  getCombinedProgressData(evidence: RewardEvidence[]): UserProgressData | null {
    if (evidence.length === 0) return null;

    // Usar el valor MÁS BAJO (más conservador) de cada métrica
    const totalProblems = Math.min(...evidence.map(e => e.data.totalProblemsCompleted));
    const currentStreak = Math.min(...evidence.map(e => e.data.currentStreak));
    const longestStreak = Math.min(...evidence.map(e => e.data.longestStreak));
    
    // Para el nivel, usar el más bajo también
    const levels = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
    const levelIndices = evidence.map(e => levels.indexOf(e.data.currentLevel.toLowerCase()));
    const minLevelIndex = Math.min(...levelIndices);
    const currentLevel = levels[minLevelIndex] || 'beginner';

    return {
      totalProblemsCompleted: totalProblems,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      currentLevel: currentLevel,
      moduleProgress: evidence[0].data.moduleProgress, // Usar el primero como base
      lastActivity: new Date()
    };
  }

  /**
   * Verifica la integridad del sistema de recompensas
   */
  performSystemIntegrityCheck(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Esta es una implementación básica que se puede expandir
    const isHealthy = issues.length === 0;

    return {
      isHealthy,
      issues,
      recommendations: isHealthy ? ['Sistema funcionando correctamente'] : recommendations
    };
  }
}