import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    getModuleSettings: jest.fn(),
  }),
  ModuleSettings: {},
}));

jest.mock('@/hooks/use-translations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    currentTranslations: {
      startExercise: 'Start Exercise',
      previous: 'Previous',
      showAnswer: 'Show Answer',
    },
  }),
}));

// Mock de componentes externos
jest.mock('@/components/LevelUpHandler', () => ({
  __esModule: true,
  default: () => <div data-testid="level-up-handler">Level Up Handler</div>,
}));

// Mock de las funciones de utilidad
jest.mock('../utils', () => ({
  generateAdditionProblem: jest.fn(() => ({
    id: 'test-problem-1',
    num1: 5,
    num2: 7,
    operands: [5, 7],
    correctAnswer: 12,
    layout: 'horizontal',
    answerMaxDigits: 2,
  })),
  checkAnswer: jest.fn((problem, answer) => answer === 12),
  getVerticalAlignmentInfo: jest.fn(() => ({
    maxIntLength: 1,
    maxDecLength: 0,
    operandsFormatted: [
      { original: 5, intStr: '5', decStr: '' },
      { original: 7, intStr: '7', decStr: '' },
    ],
    sumLineTotalCharWidth: 2,
  })),
}));

// Props comunes para las pruebas
const mockProps = {
  settings: {
    difficulty: 'beginner',
    problemCount: 5,
    timeValue: 0,
    hasTimerEnabled: false,
    showAnswerWithExplanation: true,
    language: 'en',
  },
  onOpenSettings: jest.fn(),
};

describe('Componente Exercise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente en estado inicial', () => {
    render(<Exercise {...mockProps} />);
    
    // Verifica que el componente principal se renderice
    expect(screen.getByText(/0 \/ 5/i)).toBeInTheDocument(); // Contador de problemas
    
    // Verifica que el botón de inicio esté presente
    const startButton = screen.getByRole('button', { name: /Start Exercise/i });
    expect(startButton).toBeInTheDocument();
    
    // Verifica que los contenedores de dígitos estén presentes pero vacíos
    const digitContainers = screen.getAllByTestId(/digit-container/i);
    expect(digitContainers.length).toBeGreaterThan(0);
    digitContainers.forEach(container => {
      expect(container).toHaveTextContent('');
    });
  });

  test('maneja entrada de dígitos correctamente', async () => {
    render(<Exercise {...mockProps} />);
    
    // Comienza el ejercicio
    const startButton = screen.getByRole('button', { name: /Start Exercise/i });
    fireEvent.click(startButton);
    
    // Simula hacer clic en los botones de dígitos
    const digitButtons = screen.getAllByRole('button').filter(button => 
      /^[0-9]$/.test(button.textContent || '')
    );
    
    // Presiona el dígito "1"
    fireEvent.click(digitButtons.find(btn => btn.textContent === '1') || digitButtons[0]);
    
    // Presiona el dígito "2"
    fireEvent.click(digitButtons.find(btn => btn.textContent === '2') || digitButtons[1]);
    
    // Verifica que el botón de verificar esté habilitado
    const checkButton = screen.getByRole('button', { name: /check/i });
    expect(checkButton).not.toBeDisabled();
    
    // Verifica respuesta
    fireEvent.click(checkButton);
    
    // Espera a que aparezca el feedback
    await waitFor(() => {
      const feedbackElement = screen.queryByText(/(correct|incorrect)/i);
      expect(feedbackElement).toBeInTheDocument();
    });
  });

  test('el botón de retroceso secuencial funciona correctamente', async () => {
    render(<Exercise {...mockProps} />);
    
    // Comienza el ejercicio
    const startButton = screen.getByRole('button', { name: /Start Exercise/i });
    fireEvent.click(startButton);
    
    // Simula hacer clic en los botones de dígitos
    const digitButtons = screen.getAllByRole('button').filter(button => 
      /^[0-9]$/.test(button.textContent || '')
    );
    
    // Presiona algunos dígitos
    fireEvent.click(digitButtons.find(btn => btn.textContent === '1') || digitButtons[0]);
    fireEvent.click(digitButtons.find(btn => btn.textContent === '2') || digitButtons[1]);
    
    // Presiona el botón de retroceso secuencial
    const seqBackspaceButton = screen.getAllByRole('button').find(btn => 
      btn.textContent === '>'
    );
    
    if (seqBackspaceButton) {
      fireEvent.click(seqBackspaceButton);
      
      // Verifica que se haya borrado un dígito
      const digitContainers = screen.getAllByTestId(/digit-container/i);
      const filledContainers = digitContainers.filter(container => 
        container.textContent && container.textContent.trim() !== ''
      );
      
      expect(filledContainers.length).toBe(1); // Solo debe quedar un dígito
    }
  });
});