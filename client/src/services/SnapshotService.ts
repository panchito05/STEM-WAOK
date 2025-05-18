// Base de datos IndexedDB temporal para almacenar las capturas del DOM
class SnapshotDatabase {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'exercise_snapshots';
  private readonly STORE_NAME = 'dom_snapshots';
  
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async saveSnapshot(exerciseId: string, htmlContent: string): Promise<string> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const id = `${exerciseId}_${Date.now()}`;
      const snapshot = {
        id,
        exerciseId,
        htmlContent,
        timestamp: Date.now(),
        date: new Date().toISOString(),
        synced: false
      };
      
      const request = store.add(snapshot);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getSnapshot(id: string): Promise<any> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async getSnapshotsByDate(date: string): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const snapshots: any[] = [];
      
      const request = store.openCursor();
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          // Comparar solo la parte de la fecha (sin hora)
          if (cursor.value.date.split('T')[0] === date.split('T')[0]) {
            snapshots.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(snapshots);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async getAllSnapshotsForExercise(exerciseId: string): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const snapshots: any[] = [];
      
      const request = store.openCursor();
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (cursor.value.exerciseId === exerciseId) {
            snapshots.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(snapshots);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async getAllUnsyncedSnapshots(): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const snapshots: any[] = [];
      
      const request = store.openCursor();
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (!cursor.value.synced) {
            snapshots.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(snapshots);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async markAsSynced(ids: string[]): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      let completed = 0;
      let errors = 0;
      
      ids.forEach(id => {
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
          const snapshot = getRequest.result;
          if (snapshot) {
            snapshot.synced = true;
            const updateRequest = store.put(snapshot);
            
            updateRequest.onsuccess = () => {
              completed++;
              if (completed + errors === ids.length) {
                resolve();
              }
            };
            
            updateRequest.onerror = () => {
              errors++;
              if (completed + errors === ids.length) {
                resolve();
              }
            };
          } else {
            errors++;
            if (completed + errors === ids.length) {
              resolve();
            }
          }
        };
        
        getRequest.onerror = () => {
          errors++;
          if (completed + errors === ids.length) {
            resolve();
          }
        };
      });
      
      if (ids.length === 0) {
        resolve();
      }
    });
  }
  
  async clearAll(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Servicio principal para capturar y restaurar snapshots
export class SnapshotService {
  private db = new SnapshotDatabase();
  
  async captureExerciseSnapshot(exerciseId: string): Promise<string> {
    console.log("📸 Capturando DOM snapshot del ejercicio...");
    
    try {
      // Capturar el contenido del elemento de revisión de problemas
      const reviewContainer = document.querySelector('.problem-review');
      if (!reviewContainer) {
        console.error('No se pudo encontrar el elemento .problem-review');
        return '';
      }
      
      // Clonar el elemento para evitar modificar el DOM original
      const clone = reviewContainer.cloneNode(true) as HTMLElement;
      
      // Guardar el HTML completo del elemento
      const htmlContent = clone.outerHTML;
      console.log("📦 Tamaño del snapshot HTML:", htmlContent.length, "bytes");
      
      // Almacenar en IndexedDB
      const snapshotId = await this.db.saveSnapshot(exerciseId, htmlContent);
      console.log("✅ Snapshot guardado con ID:", snapshotId);
      
      return snapshotId;
    } catch (error) {
      console.error("❌ Error al capturar snapshot:", error);
      return '';
    }
  }
  
  async renderSnapshot(snapshotId: string, container: HTMLElement): Promise<boolean> {
    console.log("🔍 Buscando snapshot:", snapshotId);
    
    try {
      // Recuperar el snapshot guardado
      const snapshot = await this.db.getSnapshot(snapshotId);
      if (!snapshot || !snapshot.htmlContent) {
        console.error("❌ No se encontró el snapshot o no tiene contenido HTML");
        return false;
      }
      
      console.log("📤 Renderizando snapshot del:", new Date(snapshot.timestamp).toLocaleString());
      
      // Insertar el HTML en el contenedor
      container.innerHTML = snapshot.htmlContent;
      
      // Eliminar eventos para evitar comportamientos inesperados
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        button.disabled = true;
        button.style.pointerEvents = 'none';
      });
      
      const inputs = container.querySelectorAll('input');
      inputs.forEach(input => {
        input.disabled = true;
        input.style.pointerEvents = 'none';
      });
      
      console.log("✅ Snapshot renderizado correctamente");
      return true;
    } catch (error) {
      console.error('❌ Error al renderizar snapshot:', error);
      return false;
    }
  }
  
  async findSnapshotByExerciseDate(exerciseId: string, date: string): Promise<string | null> {
    try {
      console.log("🔍 Buscando snapshots para la fecha:", date);
      
      // Obtener todos los snapshots de esa fecha
      const snapshots = await this.db.getSnapshotsByDate(date);
      console.log(`📊 Encontrados ${snapshots.length} snapshots para la fecha`);
      
      // Filtrar por ejercicio
      const matchingSnapshots = snapshots.filter(s => s.exerciseId === exerciseId);
      console.log(`📊 De los cuales ${matchingSnapshots.length} corresponden al ejercicio ${exerciseId}`);
      
      if (matchingSnapshots.length > 0) {
        // Ordenar por timestamp y tomar el más cercano a la fecha del ejercicio
        matchingSnapshots.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          const targetDate = new Date(date).getTime();
          
          return Math.abs(dateA - targetDate) - Math.abs(dateB - targetDate);
        });
        
        return matchingSnapshots[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error al buscar snapshot por fecha:', error);
      return null;
    }
  }
  
  async syncSnapshotsWithServer(): Promise<void> {
    try {
      // Obtener todos los snapshots no sincronizados
      const snapshots = await this.db.getAllUnsyncedSnapshots();
      
      if (snapshots.length === 0) {
        console.log("ℹ️ No hay snapshots pendientes de sincronización");
        return;
      }
      
      console.log(`🔄 Sincronizando ${snapshots.length} snapshots con el servidor...`);
      
      // Preparar los datos a enviar (versión comprimida)
      const syncData = snapshots.map(s => ({
        id: s.id,
        exerciseId: s.exerciseId,
        date: s.date,
        timestamp: s.timestamp,
        // Enviar solo los primeros 200 caracteres para debug
        htmlPreview: s.htmlContent.substring(0, 200) + '...',
        contentLength: s.htmlContent.length
      }));
      
      // TODO: Implementar la sincronización con el servidor si se decide
      // usar esta función en el futuro
      
      console.log("✅ Simulación de sincronización completada");
      
      // Marcar como sincronizados
      await this.db.markAsSynced(snapshots.map(s => s.id));
    } catch (error) {
      console.error('❌ Error al sincronizar snapshots:', error);
    }
  }
  
  async clearAllSnapshots(): Promise<void> {
    try {
      await this.db.clearAll();
      console.log("🧹 Todos los snapshots han sido eliminados");
    } catch (error) {
      console.error('❌ Error al limpiar snapshots:', error);
    }
  }
}

export const snapshotService = new SnapshotService();