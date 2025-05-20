import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Exercise from '../Exercise';

// Mock de los contextos necesarios
jest.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({
    exerciseHistory: [],
    addExerciseResult: jest.fn(),
    updateChildProgress: jest.fn(),
  }),
}));

jest.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    updateModuleSettings: jest.fn(),
    getModuleSettings: () => ({
      difficulty: 'beginner',
      problemCount: 5,
      hasTimeLimit: false,
      timeLimit: 0,
      hasPerProblemTimer: false,
      problemTimeLimit: 0,
      showExplanations: true,
      language: 'en',
      maxAttempts: 3,
      showImmediateFeedback: true,
      enableSoundEffects: false,
      enableAnimations: true,
      showAnswerWithExplanation: true,
      allowSkipping: true,
      enableHints: false
    }),
  }),
  ModuleSettings: {},
}));

jest.mock('@/hooks/use-translations', () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const translations: {[key: string]: string} = {
        'startExercise': 'Start Exercise',
        'previous': 'Previous',
        'showAnswer': 'Show Answer',
        'check': 'Check',
        'next': 'Next',
        'correct': 'Correct!',
        'incorrect': 'Incorrect. Try again.',
        'backspaceAriaLabel': 'Backspace',
        'sequentialBackspaceAriaLabel': 'Sequential Backspace',
      };
      return translations[key] || key;
    },
    currentTranslations: {},
  }),
}));

// Mock de componentes externos
jest.mock('@/components/LevelUpHandler', () => ({
  __esModule: true,
  default: () => <div data-testid="level-up-handler">Level Up Handler</div>,
}));

// Mock controlado para la generación de problemas para hacerlos predecibles en las pruebas
jest.mock('../utils', () => {
  // Problema predefinido para pruebas 
  const mockProblem = {
    id: 'test-problem-1',
    operands: [12, 34],
    num1: 12,
    num2: 34,
    correctAnswer: 46, // 12 + 34 = 46
    layout: 'horizontal',
    answerMaxDigits: 2,
  };
  
  return {
    generateAdditionProblem: jest.fn(() => mockProblem),
    checkAnswer: jest.fn((problem, answer) => answer === 46),
    getVerticalAlignmentInfo: jest.fn(() => ({
      maxIntLength: 2,
      maxDecLength: 0,
      operandsFormatted: [
        { original: 12, intStr: '12', decStr: '' },
        { original: 34, intStr: '34', decStr: '' },
      ],
      sumLineTotalCharWidth: 2,
    })),
    additionProblemToProblem: jest.fn((additionProblem) => ({
      id: additionProblem.id,
      operands: additionProblem.operands.map((value) => ({ value })),
      displayFormat: additionProblem.layout,
      correctAnswer: additionProblem.correctAnswer,
      difficulty: 'beginner',
      allowDecimals: false,
      maxAttempts: 3
    })),
    problemToAdditionProblem: jest.fn((problem) => ({
      id: problem.id,
      num1: problem.operands[0]?.value || 0,
      num2: problem.operands[1]?.value || 0,
      operands: problem.operands.map((op) => op.value),
      correctAnswer: problem.correctAnswer,
      layout: problem.displayFormat,
      answerMaxDigits: problem.correctAnswer.toString().length,
    })),
  };
});

// Props comunes para las pruebas
const mockProps = {
  settings: {
    difficulty: 'beginner',
    problemCount: 5,
    hasTimeLimit: false,
    timeLimit: 0,
    hasPerProblemTimer: false,
    problemTimeLimit: 0,
    showExplanations: true,
    language: 'en',
    maxAttempts: 3,
    showImmediateFeedback: true,
    enableSoundEffects: false,
    enableAnimations: true,
    showAnswerWithExplanation: true,
    allowSkipping: true,
    enableHints: false
  },
  onOpenSettings: jest.fn(),
};

describe('Integración del Módulo de Suma', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Flujo completo - respuesta correcta', async () => {
    render(<Exercise {...mockProps} />);
    
    // 1. Verificar que el componente se renderiza con botón de inicio
    const startButton = screen.getByRole('button', { name: /Start Exercise/i });
    expect(startButton).toBeInTheDocument();
    
    // 2. Iniciar el ejercicio
    userEvent.click(startButton);
    
    // 3. Verificar que se muestra el problema (12 + 34)
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/\+/)).toBeInTheDocument();
    expect(screen.getByText(/34/)).toBeInTheDocument();
    
    // 4. Ingresar la respuesta (46)
    const digits = ['4', '6'];
    for (const digit of digits) {
      const digitButton = screen.getByRole('button', { name: new RegExp(`^${digit}$`) });
      userEvent.click(digitButton);
    }
    
    // 5. Verificar que los dígitos aparecen en los contenedores
    const digitContainers = screen.getAllByTestId(/digit-container/i);
    const filledContainers = digitContainers.filter(container => 
      container.textContent && container.textContent.trim() !== ''
    );
    expect(filledContainers.length).toBe(2); // dos dígitos: 4 y 6
    
    // 6. Enviar la respuesta
    const checkButton = screen.getByRole('button', { name: /Check/i });
    userEvent.click(checkButton);
    
    // 7. Verificar que se muestra feedback de respuesta correcta
    await waitFor(() => {
      expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
    });
    
    // 8. Pasar al siguiente problema
    const nextButton = screen.getByRole('button', { name: /Next/i });
    userEvent.click(nextButton);
    
    // 9. Verificar que se actualizó el contador de problemas
    expect(screen.getByText(/1 \/ 5/i)).toBeInTheDocument();
  });

  test('Prueba del botón de retroceso secuencial', async () => {
    render(<Exercise {...mockProps} />);
    
    // 1. Iniciar el ejercicio
    const startButton = screen.getByRole('button', { name: /Start Exercise/i });
    userEvent.click(startButton);
    
    // 2. Ingresar varios dígitos (456)
    const digits = ['4', '5', '6'];
    for (const digit of digits) {
      const digitButton = screen.getByRole('button', { name: new RegExp(`^${digit}$`) });
      userEvent.click(digitButton);
    }
    
    // 3. Verificar que se ingresaron tres dígitos
    let digitContainers = screen.getAllByTestId(/digit-container/i);
    let filledContainers = digitContainers.filter(container => 
      container.textContent && container.textContent.trim() !== ''
    );
    expect(filledContainers.length).toBe(3); // tres dígitos: 4, 5 y 6
    
    // 4. Usar el botón de retroceso secuencial (>)
    const seqBackspaceButton = screen.getByLabelText(/Sequential Backspace/i);
    userEvent.click(seqBackspaceButton);
    
    // 5. Verificar que se borró un dígito (456 -> 45)
    digitContainers = screen.getAllByTestId(/digit-container/i);
    filledContainers = digitContainers.filter(container => 
      container.textContent && container.textContent.trim() !== ''
    );
    expect(filledContainers.length).toBe(2); // Ahora solo quedan 2 dígitos: 4 y 5
    
    // 6. Usar el botón de retroceso secuencial de nuevo (45 -> 4)
    userEvent.click(seqBackspaceButton);
    
    // 7. Verificar que se borró otro dígito
    digitContainers = screen.getAllByTestId(/digit-container/i);
    filledContainers = digitContainers.filter(container => 
      container.textContent && container.textContent.trim() !== ''
    );
    expect(filledContainers.length).toBe(1); // Ahora solo queda 1 dígito: 4
    
    // 8. Usar el botón de retroceso secuencial una vez más (4 -> "")
    userEvent.click(seqBackspaceButton);
    
    // 9. Verificar que se borraron todos los dígitos
    digitContainers = screen.getAllByTestId(/digit-container/i);
    filledContainers = digitContainers.filter(container => 
      container.textContent && container.textContent.trim() !== ''
    );
    expect(filledContainers.length).toBe(0); // No debe quedar ningún dígito
  });

  test('El botón de retroceso secuencial salta correctamente entre contenedores', async () => {
    // Esta prueba simula la funcionalidad específica de saltar entre contenedores
    render(<Exercise {...mockProps} />);
    
    // 1. Iniciar el ejercicio
    const startButton = screen.getByRole('button', { name: /Start Exercise/i });
    userEvent.click(startButton);
    
    // 2. Ingresar dígitos en diferentes contenedores para simular
    //    un escenario con varios contenedores (ej: con decimales)
    // Supongamos que tenemos varios contenedores que representan: unidades, decenas, centenas
    const digitButtons = ['1', '2', '3'].map(digit => 
      screen.getByRole('button', { name: new RegExp(`^${digit}$`) })
    );
    
    // Ingresar dígitos en orden
    for (const button of digitButtons) {
      userEvent.click(button);
    }
    
    // Usar el botón de retroceso secuencial repetidamente
    const seqBackspaceButton = screen.getByLabelText(/Sequential Backspace/i);
    
    // 3. Verificar que cada clic en retroceso secuencial borra un dígito
    //    y eventualmente salta al contenedor anterior
    for (let i = 0; i < 3; i++) {
      userEvent.click(seqBackspaceButton);
      
      // Verificar que después de cada clic, tenemos i+1 dígitos menos
      const digitContainers = screen.getAllByTestId(/digit-container/i);
      const filledContainers = digitContainers.filter(container => 
        container.textContent && container.textContent.trim() !== ''
      );
      expect(filledContainers.length).toBe(3 - (i + 1)); 
    }
  });
});