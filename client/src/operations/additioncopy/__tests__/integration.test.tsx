// Pruebas de integración para el módulo de suma
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsProvider } from '@/context/SettingsContext';
import { ProgressProvider } from '@/context/ProgressContext';
import Exercise from '../Exercise';
import { UserAnswer, AdditionCopyProblem } from '../types';
import * as utils from '../utils';

// Mock para las dependencias
jest.mock('../utils', () => {
  // Conservamos las implementaciones originales
  const originalModule = jest.requireActual('../utils');
  
  // Sobreescribimos solo las funciones que necesitamos controlar
  return {
    ...originalModule,
    generateAdditionCopyProblem: jest.fn(),
    saveExerciseResult: jest.fn(),
  };
});

// Mock para el contexto
jest.mock('@/context/SettingsContext', () => {
  return {
    SettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSettings: () => ({
      settings: {
        addition: {
          difficulty: 'beginner',
          problemCount: 5,
          timeValue: 30,
          hasTimerEnabled: true
        }
      },
      saveSettings: jest.fn(),
    }),
  };
});

jest.mock('@/context/ProgressContext', () => {
  return {
    ProgressProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useProgress: () => ({
      saveExerciseResult: jest.fn(),
      exerciseHistory: [],
    }),
  };
});

// Funciones helper para las pruebas
const generateMockProblem = (n1: number, n2: number): AdditionCopyProblem => {
  return {
    id: `test-${n1}-${n2}`,
    operands: [n1, n2],
    correctAnswer: n1 + n2,
    layout: 'horizontal',
    answerMaxDigits: (n1 + n2).toString().length
  };
};

// Simulación de entrada numérica en el teclado virtual
const enterAnswer = (value: string) => {
  // Simular pulsación de los botones del teclado numérico
  for (const digit of value) {
    fireEvent.click(screen.getByText(digit));
  }
};

// Simulación de la pulsación de un botón en la interfaz
const clickButton = (buttonText: string) => {
  const button = screen.getByText(buttonText, { selector: 'button' });
  fireEvent.click(button);
};

// Simulación de respuesta a un problema usando el teclado virtual
const solveAdditionCopyProblem = (operands: number[], correctAnswer: boolean = true) => {
  const answer = correctAnswer ? operands.reduce((a, b) => a + b, 0) : operands.reduce((a, b) => a + b, 0) + 1;
  enterAnswer(answer.toString());
  clickButton('Comprobar');
};

describe('Módulo de Suma - Pruebas de Integración', () => {
  
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar el mock para generar problemas controlados
    (utils.generateAdditionCopyProblem as jest.Mock).mockImplementation((difficulty) => {
      if (difficulty === 'beginner') {
        return generateMockProblem(2, 3);
      } else if (difficulty === 'elementary') {
        return generateMockProblem(12, 15);
      } else {
        return generateMockProblem(25, 37);
      }
    });
  });
  
  test('El componente se renderiza correctamente con problemas iniciales', async () => {
    // Arrange - Configuración del componente
    const mockSettings = {
      difficulty: 'beginner',
      problemCount: 3,
      hasTimeLimit: false,
      timeLimit: 0,
      hasPerProblemTimer: false,
      problemTimeLimit: 0,
      showExplanations: true,
      language: 'es',
      maxAttempts: 3,
      showImmediateFeedback: true,
      enableSoundEffects: false,
      allowCalculator: false,
      allowBackspace: true,
      allowSkip: true,
      enableHints: true
    };
    
    const mockOpenSettings = jest.fn();
    
    // Act - Renderizar el componente
    render(<Exercise settings={mockSettings} onOpenSettings={mockOpenSettings} />);
    
    // Assert - Verificar que se muestren los elementos básicos
    expect(screen.getByText(/Problema 1 de 3/i)).toBeInTheDocument();
    
    // Debería mostrar los operandos (2 + 3)
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Debería mostrar los controles de navegación
    expect(screen.getByText('Comprobar')).toBeInTheDocument();
  });
  
  test('El usuario puede responder preguntas y avanzar', async () => {
    // Arrange - Configuración del componente
    const mockSettings = {
      difficulty: 'beginner',
      problemCount: 3,
      hasTimeLimit: false,
      timeLimit: 0,
      hasPerProblemTimer: false,
      problemTimeLimit: 0,
      showExplanations: true,
      language: 'es',
      maxAttempts: 3,
      showImmediateFeedback: true,
      enableSoundEffects: false,
      allowCalculator: false,
      allowBackspace: true,
      allowSkip: true,
      enableHints: true
    };
    
    const mockOpenSettings = jest.fn();
    
    // Act - Renderizar el componente
    render(<Exercise settings={mockSettings} onOpenSettings={mockOpenSettings} />);
    
    // Simular la respuesta al primer problema (2 + 3 = 5)
    enterAnswer('5'); // Simulamos la entrada de la respuesta correcta
    clickButton('Comprobar');
    
    // Assert - Verificar que avance al siguiente problema
    await waitFor(() => {
      expect(screen.getByText(/Problema 2 de 3/i)).toBeInTheDocument();
    });
    
    // Simular la respuesta al segundo problema
    enterAnswer('5'); // Respuesta correcta para el mismo problema (mock configurado así)
    clickButton('Comprobar');
    
    // Verificar que avance al tercer problema
    await waitFor(() => {
      expect(screen.getByText(/Problema 3 de 3/i)).toBeInTheDocument();
    });
    
    // Simular la respuesta al tercer problema
    enterAnswer('5'); // Respuesta correcta para el mismo problema (mock configurado así)
    clickButton('Comprobar');
    
    // Verificar que se muestre la pantalla de resultados
    await waitFor(() => {
      expect(screen.getByText(/Resultados/i)).toBeInTheDocument();
      expect(screen.getByText(/3 de 3/i)).toBeInTheDocument(); // Todas correctas
    });
  });
  
  test('El usuario puede usar la funcionalidad de borrado (backspace)', async () => {
    // Arrange - Configuración del componente
    const mockSettings = {
      difficulty: 'beginner',
      problemCount: 3,
      hasTimeLimit: false,
      timeLimit: 0,
      hasPerProblemTimer: false,
      problemTimeLimit: 0,
      showExplanations: true,
      language: 'es',
      maxAttempts: 3,
      showImmediateFeedback: true,
      enableSoundEffects: false,
      allowCalculator: false,
      allowBackspace: true,
      allowSkip: true,
      enableHints: true
    };
    
    const mockOpenSettings = jest.fn();
    
    // Act - Renderizar el componente
    render(<Exercise settings={mockSettings} onOpenSettings={mockOpenSettings} />);
    
    // Introducir un número incorrecto
    enterAnswer('56');
    
    // Debería verse "56" en la entrada
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('56');
    
    // Usar la función de borrado para corregir
    const backspaceButton = screen.getByText('⌫');
    fireEvent.click(backspaceButton);
    
    // Ahora debería verse "5"
    expect(input).toHaveValue('5');
    
    // Comprobar la respuesta
    clickButton('Comprobar');
    
    // Verificar que avance al siguiente problema
    await waitFor(() => {
      expect(screen.getByText(/Problema 2 de 3/i)).toBeInTheDocument();
    });
  });
  
  test('El sistema maneja correctamente respuestas incorrectas', async () => {
    // Arrange - Configuración del componente
    const mockSettings = {
      difficulty: 'beginner',
      problemCount: 2,
      hasTimeLimit: false,
      timeLimit: 0,
      hasPerProblemTimer: false,
      problemTimeLimit: 0,
      showExplanations: true,
      language: 'es',
      maxAttempts: 2, // Solo 2 intentos permitidos
      showImmediateFeedback: true,
      enableSoundEffects: false,
      allowCalculator: false,
      allowBackspace: true,
      allowSkip: true,
      enableHints: true
    };
    
    const mockOpenSettings = jest.fn();
    
    // Act - Renderizar el componente
    render(<Exercise settings={mockSettings} onOpenSettings={mockOpenSettings} />);
    
    // Introducir una respuesta incorrecta
    enterAnswer('6'); // La respuesta correcta sería 5
    clickButton('Comprobar');
    
    // Debería mostrar un mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/incorrecto/i)).toBeInTheDocument();
    });
    
    // Intentar de nuevo con la respuesta correcta
    enterAnswer('5');
    clickButton('Comprobar');
    
    // Debería avanzar al siguiente problema
    await waitFor(() => {
      expect(screen.getByText(/Problema 2 de 2/i)).toBeInTheDocument();
    });
  });
  
  // Puedes agregar más pruebas según sea necesario
});