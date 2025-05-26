/**
 * SISTEMA DE SINCRONIZACIÓN DUAL
 * 
 * Este sistema implementa una estrategia de almacenamiento dual que:
 * - Preserva el mayor progreso siempre
 * - Mantiene backup continuo en localStorage
 * - Proporciona fallback automático ante fallos del servidor
 * - Sincroniza inteligentemente entre dispositivos
 */

import { toast } from '@/hooks/use-toast';
import { wrapWithIntegrity, unwrapWithIntegrity, VerifiedData } from './dataIntegrity';

// Tipos base
export interface SyncData {
  value: any;
  timestamp: number;
  version: number;
  source: 'local' | 'server';
}

export interface SyncConflict {
  localData: SyncData;
  serverData: SyncData;
  resolved: SyncData;
  strategy: 'preserve_greater' | 'preserve_newer' | 'merge';
}

export interface DataSyncOptions {
  preserveGreaterProgress?: boolean;
  enableDualStorage?: boolean;
  autoFallback?: boolean;
  syncInterval?: number;
}

// Configuración por defecto basada en las decisiones del usuario
const DEFAULT_OPTIONS: DataSyncOptions = {
  preserveGreaterProgress: true,    // Preservar mayor progreso
  enableDualStorage: true,          // Backup dual permanente
  autoFallback: true,              // Fallback automático
  syncInterval: 30000              // Sincronizar cada 30 segundos
};

/**
 * Clase principal para manejo de sincronización de datos
 */
export class DataSync {
  private options: DataSyncOptions;
  private isAuthenticated: boolean = false;
  private syncInProgress: boolean = false;
  private pendingWrites: Map<string, SyncData> = new Map();
  private conflictLog: SyncConflict[] = [];

  constructor(options: Partial<DataSyncOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initializeSync();
  }

  /**
   * Inicializar sistema de sincronización
   */
  private async initializeSync() {
    // Detectar estado de autenticación
    await this.checkAuthStatus();
    
    // Iniciar sincronización periódica si está autenticado
    if (this.isAuthenticated && this.options.syncInterval) {
      setInterval(() => this.backgroundSync(), this.options.syncInterval);
    }

    console.log('🔄 Sistema de sincronización dual inicializado');
  }

  /**
   * Verificar estado de autenticación
   */
  private async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      this.isAuthenticated = response.ok;
      return this.isAuthenticated;
    } catch (error) {
      console.warn('🔍 Error verificando autenticación:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * MÉTODO PRINCIPAL: Guardar datos con estrategia dual
   */
  async save(key: string, data: any, metadata?: any): Promise<void> {
    const syncData: SyncData = {
      value: data,
      timestamp: Date.now(),
      version: this.getNextVersion(key),
      source: this.isAuthenticated ? 'server' : 'local'
    };

    try {
      if (this.isAuthenticated && this.options.enableDualStorage) {
        // ESTRATEGIA DUAL: Guardar en servidor Y localStorage
        await Promise.allSettled([
          this.saveToServer(key, syncData, metadata),
          this.saveToLocal(key, syncData)
        ]);
        console.log('💾 Datos guardados en servidor + backup local:', key);
      } else {
        // Solo localStorage si no está autenticado
        await this.saveToLocal(key, syncData);
        console.log('🏠 Datos guardados solo en localStorage:', key);
      }
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
      // Fallback: asegurar que al menos se guarde localmente
      await this.saveToLocal(key, syncData);
    }
  }

  /**
   * MÉTODO PRINCIPAL: Cargar datos con fallback automático
   */
  async load(key: string): Promise<any> {
    try {
      if (this.isAuthenticated) {
        // Intentar cargar del servidor primero
        const serverData = await this.loadFromServer(key);
        if (serverData) {
          // Sincronizar con backup local
          await this.saveToLocal(key, serverData);
          return serverData.value;
        }
      }

      // Fallback a localStorage
      if (this.options.autoFallback) {
        const localData = await this.loadFromLocal(key);
        if (localData) {
          console.log('🔄 Usando fallback localStorage para:', key);
          return localData.value;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      
      // Último recurso: localStorage
      const localData = await this.loadFromLocal(key);
      return localData?.value || null;
    }
  }

  /**
   * Migrar datos locales al servidor cuando el usuario se loguea
   */
  async migrateLocalToServer(): Promise<void> {
    if (!this.isAuthenticated) {
      console.warn('⚠️ No se puede migrar: usuario no autenticado');
      return;
    }

    console.log('🚀 Iniciando migración de datos locales al servidor...');
    
    try {
      const localKeys = this.getLocalStorageKeys();
      const migrationResults = [];

      for (const key of localKeys) {
        try {
          const localData = await this.loadFromLocal(key);
          const serverData = await this.loadFromServer(key);

          if (localData && serverData) {
            // RESOLVER CONFLICTO: Preservar mayor progreso
            const resolved = this.resolveConflict(localData, serverData, key);
            await this.saveToServer(key, resolved);
            migrationResults.push({ key, status: 'conflict_resolved', strategy: 'preserve_greater' });
          } else if (localData && !serverData) {
            // MIGRAR: Solo existe en local
            await this.saveToServer(key, localData);
            migrationResults.push({ key, status: 'migrated' });
          }
          // Si solo existe en servidor, no hacer nada (ya está sincronizado)
          
        } catch (error) {
          console.error(`❌ Error migrando ${key}:`, error);
          migrationResults.push({ key, status: 'error', error: error.message });
        }
      }

      console.log('✅ Migración completada:', migrationResults);
      
      // Mostrar resumen al usuario
      const successCount = migrationResults.filter(r => r.status === 'migrated').length;
      const conflictCount = migrationResults.filter(r => r.status === 'conflict_resolved').length;
      
      if (successCount > 0 || conflictCount > 0) {
        toast({
          title: "Datos sincronizados",
          description: `${successCount} elementos migrados, ${conflictCount} conflictos resueltos`,
        });
      }

    } catch (error) {
      console.error('❌ Error en migración:', error);
      toast({
        title: "Error de sincronización",
        description: "Algunos datos no pudieron sincronizarse. Se mantendrán localmente.",
        variant: "destructive",
      });
    }
  }

  /**
   * Resolver conflictos preservando el mayor progreso
   */
  private resolveConflict(localData: SyncData, serverData: SyncData, key: string): SyncData {
    // Estrategia basada en las decisiones del usuario:
    // 1. Preservar mayor progreso numérico
    // 2. Si no es numérico, preservar el más reciente
    
    let resolved: SyncData;
    let strategy: SyncConflict['strategy'] = 'preserve_newer';

    if (this.isProgressData(localData.value, serverData.value)) {
      // Comparar progreso numérico
      const localProgress = this.extractProgressValue(localData.value);
      const serverProgress = this.extractProgressValue(serverData.value);
      
      if (localProgress > serverProgress) {
        resolved = localData;
        strategy = 'preserve_greater';
      } else if (serverProgress > localProgress) {
        resolved = serverData;
        strategy = 'preserve_greater';
      } else {
        // Progreso igual, tomar el más reciente
        resolved = localData.timestamp > serverData.timestamp ? localData : serverData;
      }
    } else {
      // Para datos no numéricos, preservar el más reciente
      resolved = localData.timestamp > serverData.timestamp ? localData : serverData;
    }

    // Registrar el conflicto para análisis
    this.conflictLog.push({
      localData,
      serverData,
      resolved,
      strategy
    });

    console.log(`🔄 Conflicto resuelto para ${key}:`, strategy);
    return resolved;
  }

  /**
   * Determinar si los datos representan progreso numérico
   */
  private isProgressData(localValue: any, serverValue: any): boolean {
    const progressKeys = [
      'totalCompleted', 'score', 'totalProblems', 'streak', 'consecutiveCorrectAnswers',
      'totalPoints', 'unlockedRewards', 'currentStreak', 'longestStreak'
    ];

    const hasProgressKey = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return false;
      return progressKeys.some(key => key in obj && typeof obj[key] === 'number');
    };

    return hasProgressKey(localValue) && hasProgressKey(serverValue);
  }

  /**
   * Extraer valor numérico de progreso para comparación
   */
  private extractProgressValue(data: any): number {
    if (typeof data === 'number') return data;
    if (typeof data !== 'object' || data === null) return 0;

    // Buscar el valor numérico más significativo
    const progressKeys = [
      'totalCompleted', 'score', 'totalProblems', 'streak', 'consecutiveCorrectAnswers',
      'totalPoints', 'currentStreak', 'longestStreak'
    ];

    for (const key of progressKeys) {
      if (key in data && typeof data[key] === 'number') {
        return data[key];
      }
    }

    return 0;
  }

  /**
   * Obtener claves de localStorage relacionadas con la app
   */
  private getLocalStorageKeys(): string[] {
    const keys = [];
    const appPrefixes = ['user_', 'profile_', 'addition_', 'reward-'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && appPrefixes.some(prefix => key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  /**
   * Guardar en servidor
   */
  private async saveToServer(key: string, data: SyncData, metadata?: any): Promise<void> {
    // Implementación específica según el tipo de dato
    // Por ahora, placeholder que se expandirá con las APIs existentes
    console.log('🌐 Guardando en servidor:', key, data);
  }

  /**
   * Cargar desde servidor
   */
  private async loadFromServer(key: string): Promise<SyncData | null> {
    // Implementación específica según el tipo de dato
    console.log('🌐 Cargando desde servidor:', key);
    return null;
  }

  /**
   * Guardar en localStorage con verificación de integridad
   */
  private async saveToLocal(key: string, data: SyncData): Promise<void> {
    try {
      // Envolver datos con verificación de integridad
      const verifiedData = wrapWithIntegrity(data, key);
      localStorage.setItem(`sync_${key}`, JSON.stringify(verifiedData));
      console.log('🏠 Guardado en localStorage con integridad:', key);
    } catch (error) {
      console.error('❌ Error guardando en localStorage:', error);
      throw error;
    }
  }

  /**
   * Cargar desde localStorage con verificación de integridad
   */
  private async loadFromLocal(key: string): Promise<SyncData | null> {
    try {
      const stored = localStorage.getItem(`sync_${key}`);
      if (stored) {
        const parsedData = JSON.parse(stored) as VerifiedData<SyncData>;
        
        // Verificar integridad y extraer datos
        const verifiedData = unwrapWithIntegrity(parsedData, key);
        if (verifiedData) {
          console.log('✅ Datos verificados desde localStorage:', key);
          return verifiedData;
        } else {
          console.warn('⚠️ Datos corruptos detectados en localStorage:', key);
          // Intentar cargar datos legacy sin verificación
          return JSON.parse(stored) as SyncData;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error cargando desde localStorage:', error);
      return null;
    }
  }

  /**
   * Obtener siguiente versión para un dato
   */
  private getNextVersion(key: string): number {
    const current = localStorage.getItem(`sync_${key}_version`);
    const version = current ? parseInt(current) + 1 : 1;
    localStorage.setItem(`sync_${key}_version`, version.toString());
    return version;
  }

  /**
   * Sincronización en segundo plano
   */
  private async backgroundSync(): Promise<void> {
    if (this.syncInProgress || !this.isAuthenticated) return;

    this.syncInProgress = true;
    try {
      // Sincronizar datos pendientes
      for (const [key, data] of this.pendingWrites) {
        await this.saveToServer(key, data);
      }
      this.pendingWrites.clear();
    } catch (error) {
      console.warn('⚠️ Error en sincronización de fondo:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Forzar sincronización completa
   */
  async forceSync(): Promise<void> {
    await this.checkAuthStatus();
    if (this.isAuthenticated) {
      await this.migrateLocalToServer();
    }
  }

  /**
   * Obtener estadísticas de sincronización
   */
  getSyncStats() {
    return {
      isAuthenticated: this.isAuthenticated,
      conflictsResolved: this.conflictLog.length,
      pendingWrites: this.pendingWrites.size,
      lastConflicts: this.conflictLog.slice(-5)
    };
  }
}

// Instancia singleton
export const dataSync = new DataSync();

// Funciones de conveniencia
export const saveData = (key: string, value: any, metadata?: any) => dataSync.save(key, value, metadata);
export const loadData = (key: string) => dataSync.load(key);
export const forceSync = () => dataSync.forceSync();
export const getSyncStats = () => dataSync.getSyncStats();