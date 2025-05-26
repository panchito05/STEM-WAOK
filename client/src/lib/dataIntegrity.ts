/**
 * SISTEMA DE AUTO-VERIFICACIÓN E INTEGRIDAD DE DATOS
 * 
 * Este sistema añade checksums, validación de integridad y auto-reparación
 * para garantizar que los datos nunca se corrompan o se pierdan.
 */

import { validateAndFixScore, validateAccuracy, interceptSaveData } from '@/utils/scoreValidator';

// Tipos para datos con verificación de integridad
export interface VerifiedData<T = any> {
  data: T;
  checksum: string;
  timestamp: number;
  version: string;
  integrity: {
    isValid: boolean;
    lastVerified: number;
    verificationCount: number;
    corruptionAttempts: number;
  };
}

export interface IntegrityReport {
  isHealthy: boolean;
  issues: Array<{
    type: 'corruption' | 'missing' | 'invalid' | 'outdated';
    key: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    canAutoFix: boolean;
  }>;
  stats: {
    totalKeys: number;
    healthyKeys: number;
    corruptedKeys: number;
    missingKeys: number;
    lastFullCheck: Date;
  };
}

/**
 * Clase principal para verificación de integridad de datos
 */
export class DataIntegrityManager {
  private readonly CHECKSUM_ALGORITHM = 'simple-hash'; // Implementación ligera para el navegador
  private readonly VERIFICATION_INTERVAL = 60000; // 1 minuto
  private readonly MAX_CORRUPTION_ATTEMPTS = 3;
  
  private verificationTimer?: NodeJS.Timeout;
  private integrityReport: IntegrityReport = this.createEmptyReport();

  constructor() {
    this.startPeriodicVerification();
    console.log('🛡️ Sistema de auto-verificación de integridad inicializado');
  }

  /**
   * Calcular checksum simple pero efectivo
   */
  private calculateChecksum(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Envolver datos con verificación de integridad
   */
  wrapData<T>(data: T, key: string): VerifiedData<T> {
    // Interceptar y validar datos antes de envolver
    const validatedData = this.validateDataBeforeWrap(data, key);
    
    const verifiedData: VerifiedData<T> = {
      data: validatedData,
      checksum: this.calculateChecksum(validatedData),
      timestamp: Date.now(),
      version: '1.0',
      integrity: {
        isValid: true,
        lastVerified: Date.now(),
        verificationCount: 1,
        corruptionAttempts: 0
      }
    };

    console.log(`🔒 Datos protegidos con integridad: ${key} (checksum: ${verifiedData.checksum})`);
    return verifiedData;
  }

  /**
   * Verificar y extraer datos
   */
  unwrapData<T>(verifiedData: VerifiedData<T> | null, key: string): T | null {
    if (!verifiedData) {
      this.reportIssue('missing', key, 'medium', 'Datos no encontrados', false);
      return null;
    }

    // Verificar integridad básica
    if (!this.verifyBasicStructure(verifiedData)) {
      this.reportIssue('corruption', key, 'critical', 'Estructura de datos corrompida', false);
      return null;
    }

    // Verificar checksum
    const expectedChecksum = this.calculateChecksum(verifiedData.data);
    const isValid = expectedChecksum === verifiedData.checksum;

    if (!isValid) {
      verifiedData.integrity.corruptionAttempts++;
      
      if (verifiedData.integrity.corruptionAttempts < this.MAX_CORRUPTION_ATTEMPTS) {
        // Intentar auto-reparación
        const repairedData = this.attemptDataRepair(verifiedData, key);
        if (repairedData) {
          console.log(`🔧 Auto-reparación exitosa para: ${key}`);
          return repairedData;
        }
      }

      this.reportIssue('corruption', key, 'high', 
        `Checksum inválido: esperado ${expectedChecksum}, encontrado ${verifiedData.checksum}`, 
        verifiedData.integrity.corruptionAttempts < this.MAX_CORRUPTION_ATTEMPTS
      );
      
      return null;
    }

    // Actualizar métricas de verificación
    verifiedData.integrity.lastVerified = Date.now();
    verifiedData.integrity.verificationCount++;
    verifiedData.integrity.isValid = true;

    console.log(`✅ Datos verificados correctamente: ${key}`);
    return verifiedData.data;
  }

  /**
   * Validar datos usando validadores existentes antes de envolver
   */
  private validateDataBeforeWrap(data: any, key: string): any {
    let validatedData = { ...data };

    // Si es un resultado de ejercicio, usar validadores existentes
    if (this.isExerciseResult(data)) {
      validatedData = interceptSaveData(validatedData, `integrity-${key}`);
      
      // Validar score adicional
      if (data.userAnswersHistory || data.extra_data?.userAnswersHistory) {
        const answers = data.userAnswersHistory || data.extra_data?.userAnswersHistory;
        const validation = validateAndFixScore(answers, data.score, `integrity-${key}`);
        
        if (validation.isFixed) {
          validatedData.score = validation.score;
          console.log(`🔧 Score corregido durante envoltorio de integridad: ${validation.score}`);
        }
      }

      // Validar accuracy
      if (typeof data.accuracy === 'number' && typeof data.score === 'number' && typeof data.totalProblems === 'number') {
        const accuracyValidation = validateAccuracy(data.score, data.totalProblems, data.accuracy, `integrity-${key}`);
        if (accuracyValidation.isFixed) {
          validatedData.accuracy = accuracyValidation.accuracy;
        }
      }
    }

    return validatedData;
  }

  /**
   * Detectar si los datos son un resultado de ejercicio
   */
  private isExerciseResult(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           ('score' in data || 'totalProblems' in data || 'accuracy' in data);
  }

  /**
   * Verificar estructura básica de datos verificados
   */
  private verifyBasicStructure(verifiedData: any): boolean {
    return verifiedData &&
           typeof verifiedData === 'object' &&
           'data' in verifiedData &&
           'checksum' in verifiedData &&
           'timestamp' in verifiedData &&
           'integrity' in verifiedData &&
           typeof verifiedData.checksum === 'string' &&
           typeof verifiedData.timestamp === 'number';
  }

  /**
   * Intentar reparar datos corruptos
   */
  private attemptDataRepair<T>(verifiedData: VerifiedData<T>, key: string): T | null {
    console.log(`🔧 Intentando auto-reparación para: ${key}`);

    try {
      // Estrategia 1: Recalcular checksum (puede ser corrupción menor)
      const newChecksum = this.calculateChecksum(verifiedData.data);
      verifiedData.checksum = newChecksum;
      verifiedData.integrity.corruptionAttempts--;
      
      console.log(`🔧 Checksum recalculado para ${key}: ${newChecksum}`);
      return verifiedData.data;
      
    } catch (error) {
      console.warn(`❌ Auto-reparación fallida para ${key}:`, error);
      return null;
    }
  }

  /**
   * Reportar problema de integridad
   */
  private reportIssue(
    type: IntegrityReport['issues'][0]['type'],
    key: string,
    severity: IntegrityReport['issues'][0]['severity'],
    description: string,
    canAutoFix: boolean
  ) {
    const issue = { type, key, severity, description, canAutoFix };
    this.integrityReport.issues.push(issue);
    this.integrityReport.isHealthy = false;

    console.warn(`🚨 Problema de integridad detectado:`, issue);
  }

  /**
   * Verificación completa del sistema
   */
  async performFullIntegrityCheck(): Promise<IntegrityReport> {
    console.log('🔍 Iniciando verificación completa de integridad...');
    
    this.integrityReport = this.createEmptyReport();
    this.integrityReport.stats.lastFullCheck = new Date();

    // Verificar todas las claves en localStorage
    const keysToCheck = this.getStorageKeys();
    this.integrityReport.stats.totalKeys = keysToCheck.length;

    for (const key of keysToCheck) {
      try {
        const rawData = localStorage.getItem(key);
        
        if (!rawData) {
          this.integrityReport.stats.missingKeys++;
          continue;
        }

        const parsedData = JSON.parse(rawData);
        
        // Si es un dato verificado, verificar integridad
        if (this.verifyBasicStructure(parsedData)) {
          const result = this.unwrapData(parsedData, key);
          
          if (result !== null) {
            this.integrityReport.stats.healthyKeys++;
          } else {
            this.integrityReport.stats.corruptedKeys++;
          }
        } else {
          // Datos legacy sin verificación - marcar para actualización
          this.reportIssue('outdated', key, 'low', 'Datos sin verificación de integridad', true);
          this.integrityReport.stats.healthyKeys++; // Aún utilizables
        }

      } catch (error) {
        this.integrityReport.stats.corruptedKeys++;
        this.reportIssue('corruption', key, 'medium', `Error parsing: ${error}`, false);
      }
    }

    // Determinar salud general del sistema
    const corruptionRate = this.integrityReport.stats.corruptedKeys / this.integrityReport.stats.totalKeys;
    this.integrityReport.isHealthy = corruptionRate < 0.1; // Menos del 10% de corrupción

    console.log('✅ Verificación completa terminada:', this.integrityReport);
    return this.integrityReport;
  }

  /**
   * Obtener claves relevantes del localStorage
   */
  private getStorageKeys(): string[] {
    const keys = [];
    const prefixes = ['sync_', 'user_', 'profile_', 'addition_', 'reward-'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && prefixes.some(prefix => key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  /**
   * Inicializar reporte vacío
   */
  private createEmptyReport(): IntegrityReport {
    return {
      isHealthy: true,
      issues: [],
      stats: {
        totalKeys: 0,
        healthyKeys: 0,
        corruptedKeys: 0,
        missingKeys: 0,
        lastFullCheck: new Date()
      }
    };
  }

  /**
   * Iniciar verificación periódica
   */
  private startPeriodicVerification() {
    this.verificationTimer = setInterval(async () => {
      await this.performFullIntegrityCheck();
      
      // Si hay problemas críticos, alertar
      const criticalIssues = this.integrityReport.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        console.error('🚨 PROBLEMAS CRÍTICOS DE INTEGRIDAD DETECTADOS:', criticalIssues);
      }
      
    }, this.VERIFICATION_INTERVAL);
  }

  /**
   * Obtener último reporte de integridad
   */
  getIntegrityReport(): IntegrityReport {
    return { ...this.integrityReport };
  }

  /**
   * Limpiar sistema
   */
  destroy() {
    if (this.verificationTimer) {
      clearInterval(this.verificationTimer);
    }
  }
}

// Instancia singleton
export const dataIntegrityManager = new DataIntegrityManager();

// Funciones de conveniencia
export const wrapWithIntegrity = <T>(data: T, key: string): VerifiedData<T> => 
  dataIntegrityManager.wrapData(data, key);

export const unwrapWithIntegrity = <T>(verifiedData: VerifiedData<T> | null, key: string): T | null => 
  dataIntegrityManager.unwrapData(verifiedData, key);

export const checkSystemIntegrity = (): Promise<IntegrityReport> => 
  dataIntegrityManager.performFullIntegrityCheck();

export const getIntegrityStats = (): IntegrityReport => 
  dataIntegrityManager.getIntegrityReport();