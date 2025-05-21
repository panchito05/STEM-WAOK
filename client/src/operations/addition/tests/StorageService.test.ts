import { StorageService } from '../infrastructure/StorageService';
import { EventBus } from '../infrastructure/EventBus';

// Mock para localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock del EventBus
jest.mock('../infrastructure/EventBus', () => {
  return {
    EventBus: jest.fn().mockImplementation(() => ({
      emit: jest.fn(),
      on: jest.fn(() => jest.fn()),
      once: jest.fn(() => jest.fn()),
      removeAllListeners: jest.fn()
    }))
  };
});

describe('StorageService', () => {
  // Instancia del servicio para tests
  let storageService: StorageService;
  let mockEventBus: jest.Mocked<EventBus>;
  
  // Configuración antes de cada test
  beforeEach(() => {
    // Asignar el mock a window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Limpiar el mock
    localStorageMock.clear();
    
    // Crear mock del EventBus
    mockEventBus = new EventBus() as jest.Mocked<EventBus>;
    
    // Crear instancia de servicio para tests
    storageService = new StorageService(mockEventBus);
  });

  // Test para save
  test('save debe guardar datos correctamente en localStorage', async () => {
    const key = 'testKey';
    const data = { test: 'value', number: 42 };
    
    const result = await storageService.save(key, data);
    
    // Verificar resultado
    expect(result).toBe(true);
    
    // Verificar que se guardó correctamente
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Verificar el formato de la clave
    const expectedKey = expect.stringMatching(/^math_waok_addition_testKey$/);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      expectedKey,
      expect.any(String)
    );
    
    // Verificar el contenido
    const setItemCall = (localStorageMock.setItem as jest.Mock).mock.calls[0];
    const savedValue = JSON.parse(setItemCall[1]);
    expect(savedValue.data).toEqual(data);
    expect(savedValue.timestamp).toBeGreaterThan(0);
  });

  // Test para load
  test('load debe cargar datos correctamente desde localStorage', async () => {
    const key = 'testKey';
    const data = { test: 'value', number: 42 };
    const storedValue = JSON.stringify({
      timestamp: Date.now(),
      data
    });
    
    // Simular datos existentes
    localStorageMock.setItem(`math_waok_addition_${key}`, storedValue);
    
    // Cargar los datos
    const result = storageService.load(key);
    
    // Verificar resultado
    expect(result).toEqual(data);
    expect(localStorageMock.getItem).toHaveBeenCalledWith(`math_waok_addition_${key}`);
  });

  // Test para valor predeterminado
  test('load debe devolver el valor predeterminado si no hay datos', () => {
    const key = 'nonExistentKey';
    const defaultValue = { default: true };
    
    const result = storageService.load(key, defaultValue);
    
    expect(result).toEqual(defaultValue);
  });

  // Test para remove
  test('remove debe eliminar datos correctamente', () => {
    const key = 'testKey';
    
    // Simular datos existentes
    localStorageMock.setItem(`math_waok_addition_${key}`, 'testValue');
    
    // Eliminar los datos
    const result = storageService.remove(key);
    
    // Verificar resultado
    expect(result).toBe(true);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(`math_waok_addition_${key}`);
  });

  // Test para getKeys
  test('getKeys debe devolver todas las claves que coinciden con el prefijo', () => {
    // Simular datos existentes
    localStorageMock.setItem('math_waok_addition_key1', 'value1');
    localStorageMock.setItem('math_waok_addition_key2', 'value2');
    localStorageMock.setItem('math_waok_addition_test3', 'value3');
    localStorageMock.setItem('other_prefix_key4', 'value4');
    
    // Configurar mock para key()
    const mockKeys = ['math_waok_addition_key1', 'math_waok_addition_key2', 'math_waok_addition_test3', 'other_prefix_key4'];
    jest.spyOn(Object, 'keys').mockReturnValue(mockKeys);
    Object.defineProperty(localStorageMock, 'length', { value: mockKeys.length });
    
    // Obtener claves sin patrón
    const allKeys = storageService.getKeys();
    
    // Verificar todas las claves con prefijo
    expect(allKeys).toContain('key1');
    expect(allKeys).toContain('key2');
    expect(allKeys).toContain('test3');
    expect(allKeys).not.toContain('key4');
    expect(allKeys.length).toBe(3);
    
    // Obtener claves con patrón
    const filteredKeys = storageService.getKeys('key');
    
    // Verificar filtrado
    expect(filteredKeys).toContain('key1');
    expect(filteredKeys).toContain('key2');
    expect(filteredKeys).not.toContain('test3');
    expect(filteredKeys.length).toBe(2);
  });

  // Test para manejo de errores
  test('save debe reintentar en caso de error', async () => {
    const key = 'testKey';
    const data = { test: 'value' };
    
    // Simular error en el primer intento
    let attemptCount = 0;
    (localStorageMock.setItem as jest.Mock).mockImplementation(() => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('Storage error');
      }
    });
    
    // Ejecutar save
    const result = await storageService.save(key, data, {
      maxAttempts: 3,
      delayMs: 10,
      backoffFactor: 1.5
    });
    
    // Verificar que se intentó más de una vez
    expect(attemptCount).toBe(2);
    expect(result).toBe(true);
    
    // Verificar que se emitió evento
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'storage:retry',
      expect.objectContaining({
        operation: 'save',
        attempt: 1,
        maxAttempts: 3
      })
    );
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'storage:retry_success',
      expect.objectContaining({
        operation: 'save',
        attempts: 2
      })
    );
  });

  // Test para cleanup
  test('cleanupOldData debe eliminar datos antiguos', () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Simular datos existentes con diferentes timestamps
    localStorageMock.setItem('math_waok_addition_recent', JSON.stringify({
      timestamp: now - oneDay / 2,
      data: 'recent data'
    }));
    
    localStorageMock.setItem('math_waok_addition_old', JSON.stringify({
      timestamp: now - oneDay * 10,
      data: 'old data'
    }));
    
    // Configurar mock para getKeys
    jest.spyOn(storageService, 'getKeys').mockReturnValue(['recent', 'old']);
    
    // Ejecutar limpieza para datos más antiguos que una semana
    const removedCount = storageService.cleanupOldData(oneDay * 7);
    
    // Verificar que solo se eliminaron los datos antiguos
    expect(removedCount).toBe(1);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('math_waok_addition_old');
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('math_waok_addition_recent');
    
    // Verificar evento de limpieza
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'storage:cleanup',
      expect.objectContaining({
        removedCount: 1,
        threshold: oneDay * 7
      })
    );
  });

  // Test para importData y exportData
  test('importData y exportData deben funcionar juntos correctamente', async () => {
    // Datos de prueba
    const testData = {
      key1: { value: 'test1' },
      key2: { value: 'test2' }
    };
    
    // Exportar los datos
    await storageService.importData(testData);
    
    // Verificar que se guardaron correctamente
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    
    // Simular los datos guardados
    jest.spyOn(storageService, 'load')
      .mockImplementationOnce(() => testData.key1)
      .mockImplementationOnce(() => testData.key2);
    
    // Exportar los datos
    const exportedData = storageService.exportData(['key1', 'key2']);
    
    // Verificar que coinciden
    expect(exportedData).toEqual(testData);
  });
});