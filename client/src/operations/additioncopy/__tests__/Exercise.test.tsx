// Pruebas unitarias para el componente Exercise
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Exercise from '../Exercise';
import * as utils from '../utils';

// Mock para las funciones de utils
jest.mock('../utils', () => {
  const originalModule = jest.requireActual('../utils');
  return {
    ...originalModule,
    generateAdditionCopyProblem: jest.fn(),
    saveExerciseResult: jest.fn(),
  };
});

// Mock para los contextos
jest.mock('@/context/SettingsContext', () => {
  return {
    useSettings: () => ({
      settings: {
        addition: {
          difficulty: 'beginner',
          problemCount: 5,
          timeValue: 0,
          hasTimerEnabled: false
        }
      },
      saveSettings: jest.fn(),
    }),
  };
});

jest.mock('@/context/ProgressContext', () => {
  return {
    useProgress: () => ({
      saveExerciseResult: jest.fn(),
      exerciseHistory: [],
    }),
  };
});

// La función generateAdditionCopyProblem devuelve un problema de suma simple para las pruebas
const mockGenerateProblem = () => {
  return {
    id: 'test-123',
    operands: [5, 7],
    correctAnswer: 12,
    layout: 'horizontal',
    answerMaxDigits: 2
  };
};

describe('Componente Exercise de suma', () => {
  
  beforeEach(() => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar el mock para que genere un problema de prueba
    (utils.generateAdditionCopyProblem as jest.Mock).mockImplementation(mockGenerateProblem);
  });
  
  test('se renderiza correctamente y muestra los controles básicos', () => {
    // Arrange - Configuración del componente
    const mockSettings = {
      difficulty: 'beginner',
      problemCount: 5,
      timeValue: 0,
      hasTimerEnabled: false,
      showAnswerWithExplanation: true,
      language: 'es',
      timeLimit: 'none',
      maxAttempts: 3,
      showImmediateFeedback: true,
      enableSoundEffects: false,
      enableAdaptiveDifficulty: false,
      enableCompensation: false,
      enableRewards: false,
      rewardType: 'stars'
    };
    
    const mockOpenSettings = jest.fn();
    
    // Act - Renderizar el componente
    render(<Exercise settings={mockSettings} onOpenSettings={mockOpenSettings} />);
    
    // Assert - Verificar que se muestran los elementos esperados
    expect(screen.getByText(/Problema 1 de 5/i)).toBeInTheDocument();
    expect(screen.getByText('Comprobar')).toBeInTheDocument();
    
    // Debería mostrar el teclado numérico
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    // No es necesario verificar todos los botones
  });
  
  test('permite abrir la pantalla de configuración', () => {
    // Arrange - Configuración del componente
    const mockSettings = {
      difficulty: 'beginner',
      problemCount: 5,
      timeValue: 0,
      hasTimerEnabled: false,
      showAnswerWithExplanation: true,
      language: 'es',
      timeLimit: 'none',
      maxAttempts: 3,
      showImmediateFeedback: true,
      enableSoundEffects: false,
      enableAdaptiveDifficulty: false,
      enableCompensation: false,
      enableRewards: false,
      rewardType: 'stars'
    };
    
    const mockOpenSettings = jest.fn();
    
    // Act - Renderizar el componente
    render(<Exercise settings={mockSettings} onOpenSettings={mockOpenSettings} />);
    
    // Buscar el botón de configuración y hacer clic en él
    const settingsButton = screen.getByLabelText(/configuración/i);
    fireEvent.click(settingsButton);
    
    // Assert - Verificar que se llamó a la función para abrir la configuración
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });
  
  test('genera problemas según la dificultad configurada', () => {
    // Arrange - Configuración del componente
    const mockSettings = {
      difficulty: 'intermediate',
      problemCount: 5,
      timeValue: 0,
      hasTimerEnabled: false,
      showAnswerWithExplanation: true,
      language: 'es',
      timeLimit: 'none',
      maxAttempts: 3,
      showImmediateFeedback: true,
      enableSoundEffects: false,
      enableAdaptiveDifficulty: false,
      enableCompensation: false,
      enableRewards: false,
      rewardType: 'stars'
    };
    
    const mockOpenSettings = jest.fn();
    
    // Act - Renderizar el componente
    render(<Exercise settings={mockSettings} onOpenSettings={mockOpenSettings} />);
    
    // Assert - Verificar que se llamó a generateAdditionCopyProblem con la dificultad correcta
    expect(utils.generateAdditionCopyProblem).toHaveBeenCalledWith('intermediate');
  });
  
  // Puedes agregar más pruebas según sea necesario
});