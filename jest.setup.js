// Este archivo se ejecuta después de que Jest haya sido cargado
// Podemos agregar configuraciones globales para los tests aquí

// Aumentar el tiempo límite para los tests más complejos
jest.setTimeout(10000);

// Configuraciones globales para los mocks
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

// Soluciones para otras APIs del navegador que puedan necesitar mocks para las pruebas
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));