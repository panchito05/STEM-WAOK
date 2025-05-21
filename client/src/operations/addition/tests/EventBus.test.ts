import { EventBus } from '../infrastructure/EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  // Configuración antes de cada test
  beforeEach(() => {
    eventBus = new EventBus();
  });

  test('debe permitir registrar y emitir eventos', () => {
    // Crear espía para escucha
    const listener = jest.fn();
    
    // Registrar escucha
    eventBus.on('test-event', listener);
    
    // Emitir evento
    const testData = { value: 'test' };
    eventBus.emit('test-event', testData);
    
    // Verificar que el escucha fue llamado con los datos correctos
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(testData);
  });

  test('debe permitir múltiples escuchas para un mismo evento', () => {
    // Crear espías para escuchas
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();
    
    // Registrar escuchas
    eventBus.on('test-event', listener1);
    eventBus.on('test-event', listener2);
    eventBus.on('test-event', listener3);
    
    // Emitir evento
    const testData = { value: 'test' };
    eventBus.emit('test-event', testData);
    
    // Verificar que todos los escuchas fueron llamados
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledTimes(1);
    
    // Verificar que todos recibieron los mismos datos
    expect(listener1).toHaveBeenCalledWith(testData);
    expect(listener2).toHaveBeenCalledWith(testData);
    expect(listener3).toHaveBeenCalledWith(testData);
  });

  test('debe permitir eliminar escuchas individualmente', () => {
    // Crear espías para escuchas
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    
    // Registrar escuchas
    eventBus.on('test-event', listener1);
    const removeListener = eventBus.on('test-event', listener2);
    
    // Eliminar el segundo escucha
    removeListener();
    
    // Emitir evento
    eventBus.emit('test-event', { value: 'test' });
    
    // Verificar que solo el primer escucha fue llamado
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).not.toHaveBeenCalled();
  });

  test('debe permitir escuchas para un solo evento (once)', () => {
    // Crear espía para escucha
    const listener = jest.fn();
    
    // Registrar escucha para un solo evento
    eventBus.once('test-event', listener);
    
    // Emitir evento dos veces
    eventBus.emit('test-event', { value: 'first' });
    eventBus.emit('test-event', { value: 'second' });
    
    // Verificar que el escucha solo fue llamado una vez
    // y con los datos del primer evento
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ value: 'first' });
  });

  test('debe permitir eliminar todos los escuchas', () => {
    // Crear espías para escuchas
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listenerOtherEvent = jest.fn();
    
    // Registrar escuchas
    eventBus.on('test-event', listener1);
    eventBus.on('test-event', listener2);
    eventBus.on('other-event', listenerOtherEvent);
    
    // Eliminar todos los escuchas de un evento
    eventBus.removeAllListeners('test-event');
    
    // Emitir eventos
    eventBus.emit('test-event', { value: 'test' });
    eventBus.emit('other-event', { value: 'other' });
    
    // Verificar que solo el escucha del otro evento fue llamado
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
    expect(listenerOtherEvent).toHaveBeenCalledTimes(1);
    
    // Eliminar todos los escuchas de todos los eventos
    eventBus.removeAllListeners();
    
    // Emitir evento nuevamente
    eventBus.emit('other-event', { value: 'other-again' });
    
    // Verificar que no se llamó nuevamente
    expect(listenerOtherEvent).toHaveBeenCalledTimes(1);
  });

  test('debe manejar errores en los escuchas sin interrumpir otros escuchas', () => {
    // Espía para capturar errores de consola
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Crear escuchas, uno que lanza error
    const successListener = jest.fn();
    const errorListener = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    const afterErrorListener = jest.fn();
    
    // Registrar escuchas
    eventBus.on('test-event', successListener);
    eventBus.on('test-event', errorListener);
    eventBus.on('test-event', afterErrorListener);
    
    // Emitir evento
    eventBus.emit('test-event', { value: 'test' });
    
    // Verificar que todos los escuchas fueron llamados
    expect(successListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(afterErrorListener).toHaveBeenCalledTimes(1);
    
    // Verificar que el error fue capturado
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error en escucha de evento'),
      expect.any(Error)
    );
  });

  test('debe emitir a los escuchas globales con la información correcta', () => {
    // Crear espía para escucha global
    const globalListener = jest.fn();
    
    // Registrar escucha global
    eventBus.on('*', globalListener);
    
    // Emitir evento
    const testData = { value: 'test' };
    eventBus.emit('specific-event', testData);
    
    // Verificar que el escucha global fue llamado con la información correcta
    expect(globalListener).toHaveBeenCalledTimes(1);
    expect(globalListener).toHaveBeenCalledWith({
      event: 'specific-event',
      data: testData
    });
  });

  test('debe funcionar con eventos sin datos', () => {
    // Crear espía para escucha
    const listener = jest.fn();
    
    // Registrar escucha
    eventBus.on('no-data-event', listener);
    
    // Emitir evento sin datos
    eventBus.emit('no-data-event');
    
    // Verificar que el escucha fue llamado con un objeto vacío por defecto
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({});
  });
});