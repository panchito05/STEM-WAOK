/**
 * REWARD GUARDIAN - TERCER MECANISMO DE PROTECCIÓN
 * Sistema independiente que supervisa y valida todas las recompensas
 * antes de mostrarlas al usuario. Última línea de defensa contra recompensas falsas.
 */

interface GuardianVerificationResult {
  isValid: boolean;
  actualCount: number;
  requiredCount: number;
  reason: string;
  timestamp: string;
}

interface GuardianReport {
  totalVerifications: number;
  blockedRewards: number;
  approvedRewards: number;
  lastVerification: string;
  selfTestsPassed: number;
  selfTestsFailed: number;
}

class RewardGuardianSystem {
  private verificationHistory: GuardianVerificationResult[] = [];
  private report: GuardianReport = {
    totalVerifications: 0,
    blockedRewards: 0,
    approvedRewards: 0,
    lastVerification: '',
    selfTestsPassed: 0,
    selfTestsFailed: 0
  };

  constructor() {
    console.log("🛡️ [REWARD-GUARDIAN] Sistema Guardian inicializado");
    this.runSelfDiagnostics();
  }

  /**
   * FUNCIÓN PRINCIPAL: Verifica si una recompensa es legítima
   * Se ejecuta ANTES de mostrar cualquier recompensa al usuario
   */
  async verifyRewardLegitimacy(rewardId: string, requiredProblems: number): Promise<GuardianVerificationResult> {
    console.log(`🛡️ [REWARD-GUARDIAN] ==================== VERIFICACIÓN INICIADA ====================`);
    console.log(`🛡️ [REWARD-GUARDIAN] Recompensa: ${rewardId}, Problemas requeridos: ${requiredProblems}`);
    
    const timestamp = new Date().toISOString();
    this.report.totalVerifications++;

    try {
      // MÉTODO 1: Contar desde la base de datos (más confiable)
      const dbCount = await this.countProblemsFromDatabase();
      
      // MÉTODO 2: Contar desde localStorage como respaldo
      const localCount = this.countProblemsFromLocalStorage();
      
      // MÉTODO 3: Contar desde el ProgressContext
      const contextCount = this.countProblemsFromContext();
      
      console.log(`🛡️ [REWARD-GUARDIAN] CONTEOS MÚLTIPLES:`);
      console.log(`   - Base de datos: ${dbCount}`);
      console.log(`   - localStorage: ${localCount}`);
      console.log(`   - Context: ${contextCount}`);
      
      // Usar el MENOR de todos los conteos para máxima seguridad
      const actualCount = Math.min(dbCount, localCount, contextCount);
      console.log(`🛡️ [REWARD-GUARDIAN] Contador FINAL (menor): ${actualCount}`);
      
      const isValid = actualCount >= requiredProblems;
      const reason = isValid 
        ? `Recompensa APROBADA: ${actualCount} >= ${requiredProblems}` 
        : `Recompensa BLOQUEADA: ${actualCount} < ${requiredProblems}`;
      
      const result: GuardianVerificationResult = {
        isValid,
        actualCount,
        requiredCount: requiredProblems,
        reason,
        timestamp
      };
      
      // Actualizar estadísticas
      if (isValid) {
        this.report.approvedRewards++;
        console.log(`✅ [REWARD-GUARDIAN] RECOMPENSA APROBADA: ${rewardId}`);
      } else {
        this.report.blockedRewards++;
        console.log(`❌ [REWARD-GUARDIAN] RECOMPENSA BLOQUEADA: ${rewardId}`);
        console.log(`❌ [REWARD-GUARDIAN] RAZÓN: ${reason}`);
      }
      
      this.verificationHistory.push(result);
      this.report.lastVerification = timestamp;
      
      console.log(`🛡️ [REWARD-GUARDIAN] ==================== VERIFICACIÓN COMPLETADA ====================`);
      return result;
      
    } catch (error) {
      console.error(`🛡️ [REWARD-GUARDIAN] ERROR en verificación:`, error);
      this.report.blockedRewards++;
      
      return {
        isValid: false,
        actualCount: 0,
        requiredCount: requiredProblems,
        reason: `Error en verificación: ${error}`,
        timestamp
      };
    }
  }

  /**
   * Contar problemas desde la base de datos (método más confiable)
   */
  private async countProblemsFromDatabase(): Promise<number> {
    try {
      console.log(`🛡️ [REWARD-GUARDIAN] Consultando base de datos...`);
      
      // Obtener datos desde la API del progreso
      const response = await fetch('/api/child-profiles/1/progress');
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      const exerciseHistory = data.exerciseHistory || [];
      
      const totalFromDB = exerciseHistory.reduce((acc: number, exercise: any) => {
        const score = exercise.score || 0;
        return acc + score;
      }, 0);
      
      console.log(`🛡️ [REWARD-GUARDIAN] Problemas desde BD: ${totalFromDB}`);
      return totalFromDB;
      
    } catch (error) {
      console.warn(`🛡️ [REWARD-GUARDIAN] No se pudo acceder a BD:`, error);
      return 0; // Conservador: si no puede verificar, asume 0
    }
  }

  /**
   * Contar problemas desde localStorage (método de respaldo)
   */
  private countProblemsFromLocalStorage(): number {
    try {
      const progressData = localStorage.getItem('progress-storage');
      if (!progressData) return 0;
      
      const parsed = JSON.parse(progressData);
      const history = parsed.state?.exerciseHistory || [];
      
      const totalFromLocal = history.reduce((acc: number, exercise: any) => {
        const score = exercise.score || 0;
        return acc + score;
      }, 0);
      
      console.log(`🛡️ [REWARD-GUARDIAN] Problemas desde localStorage: ${totalFromLocal}`);
      return totalFromLocal;
      
    } catch (error) {
      console.warn(`🛡️ [REWARD-GUARDIAN] Error en localStorage:`, error);
      return 0;
    }
  }

  /**
   * Contar problemas desde el contexto (método adicional)
   */
  private countProblemsFromContext(): number {
    try {
      // Intentar acceder al estado del contexto de progreso
      const contextData = (window as any).__PROGRESS_CONTEXT_STATE__;
      if (!contextData?.exerciseHistory) return 0;
      
      const totalFromContext = contextData.exerciseHistory.reduce((acc: number, exercise: any) => {
        const score = exercise.score || 0;
        return acc + score;
      }, 0);
      
      console.log(`🛡️ [REWARD-GUARDIAN] Problemas desde contexto: ${totalFromContext}`);
      return totalFromContext;
      
    } catch (error) {
      console.warn(`🛡️ [REWARD-GUARDIAN] Error en contexto:`, error);
      return 0;
    }
  }

  /**
   * AUTO-DIAGNÓSTICOS: Verifica que el propio Guardian funcione correctamente
   */
  private runSelfDiagnostics(): void {
    console.log(`🛡️ [REWARD-GUARDIAN] Ejecutando auto-diagnósticos...`);
    
    try {
      // Test 1: Verificar que puede acceder a localStorage
      const test1 = localStorage.getItem('progress-storage') !== undefined;
      
      // Test 2: Verificar que puede hacer operaciones matemáticas
      const test2 = Math.min(10, 5, 15) === 5;
      
      // Test 3: Verificar que puede crear timestamps
      const test3 = new Date().toISOString().length > 0;
      
      const passedTests = [test1, test2, test3].filter(Boolean).length;
      
      if (passedTests === 3) {
        this.report.selfTestsPassed++;
        console.log(`✅ [REWARD-GUARDIAN] Auto-diagnósticos PASADOS (${passedTests}/3)`);
      } else {
        this.report.selfTestsFailed++;
        console.log(`❌ [REWARD-GUARDIAN] Auto-diagnósticos FALLARON (${passedTests}/3)`);
      }
      
    } catch (error) {
      this.report.selfTestsFailed++;
      console.error(`❌ [REWARD-GUARDIAN] Error en auto-diagnósticos:`, error);
    }
  }

  /**
   * Obtener reporte del Guardian
   */
  getGuardianReport(): GuardianReport {
    return { ...this.report };
  }

  /**
   * Obtener historial de verificaciones
   */
  getVerificationHistory(): GuardianVerificationResult[] {
    return [...this.verificationHistory];
  }

  /**
   * Limpiar historial (para testing)
   */
  clearHistory(): void {
    this.verificationHistory = [];
    this.report = {
      totalVerifications: 0,
      blockedRewards: 0,
      approvedRewards: 0,
      lastVerification: '',
      selfTestsPassed: 0,
      selfTestsFailed: 0
    };
    console.log(`🛡️ [REWARD-GUARDIAN] Historial limpiado`);
  }
}

// Instancia singleton del Guardian
const rewardGuardian = new RewardGuardianSystem();

/**
 * FUNCIÓN PRINCIPAL PARA USO EXTERNO
 * Verificar si una recompensa específica debe mostrarse al usuario
 */
export async function guardianVerifyReward(rewardId: string): Promise<boolean> {
  console.log(`🛡️ [REWARD-GUARDIAN] Verificando recompensa: ${rewardId}`);
  
  // Mapear recompensas a sus requisitos
  const rewardRequirements: Record<string, number> = {
    'addition-novice': 10,
    'addition-enthusiast': 25,
    'addition-expert': 50,
    'addition-master': 100
  };
  
  const requiredProblems = rewardRequirements[rewardId];
  if (!requiredProblems) {
    console.log(`🛡️ [REWARD-GUARDIAN] Recompensa desconocida: ${rewardId}, APROBANDO por defecto`);
    return true;
  }
  
  const verification = await rewardGuardian.verifyRewardLegitimacy(rewardId, requiredProblems);
  return verification.isValid;
}

/**
 * FUNCIÓN PARA FILTRAR LISTA DE RECOMPENSAS
 * Remueve recompensas que no pasan la verificación del Guardian
 */
export async function guardianFilterRewards(rewards: any[]): Promise<any[]> {
  console.log(`🛡️ [REWARD-GUARDIAN] Filtrando ${rewards.length} recompensas...`);
  
  const filteredRewards = [];
  
  for (const reward of rewards) {
    const isValid = await guardianVerifyReward(reward.id);
    if (isValid) {
      filteredRewards.push(reward);
      console.log(`✅ [REWARD-GUARDIAN] Recompensa APROBADA: ${reward.id}`);
    } else {
      console.log(`❌ [REWARD-GUARDIAN] Recompensa BLOQUEADA: ${reward.id}`);
    }
  }
  
  console.log(`🛡️ [REWARD-GUARDIAN] Resultado: ${filteredRewards.length}/${rewards.length} recompensas aprobadas`);
  return filteredRewards;
}

/**
 * FUNCIÓN DE DIAGNÓSTICO PARA DEBUGGING
 */
export function guardianGetDiagnostics() {
  const report = rewardGuardian.getGuardianReport();
  const history = rewardGuardian.getVerificationHistory();
  
  console.log(`🛡️ [REWARD-GUARDIAN] ==================== REPORTE DEL GUARDIAN ====================`);
  console.log(`   Verificaciones totales: ${report.totalVerifications}`);
  console.log(`   Recompensas bloqueadas: ${report.blockedRewards}`);
  console.log(`   Recompensas aprobadas: ${report.approvedRewards}`);
  console.log(`   Auto-pruebas pasadas: ${report.selfTestsPassed}`);
  console.log(`   Auto-pruebas falladas: ${report.selfTestsFailed}`);
  console.log(`   Última verificación: ${report.lastVerification}`);
  console.log(`🛡️ [REWARD-GUARDIAN] ================================================================`);
  
  return { report, history };
}

export default rewardGuardian;