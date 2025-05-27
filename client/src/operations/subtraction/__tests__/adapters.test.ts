// Tests para los adaptadores de tipos entre SubtractionProblem y Problem
import { 
  SubtractionProblem, 
  Problem, 
  DifficultyLevel 
} from '../types';
import { 
  subtractionProblemToProblem, 
  problemToSubtractionProblem 
} from '../utils';

describe('Adaptadores de tipos', () => {
  // Caso de prueba: Conversión de AdditionProblem a Problem
  describe('additionProblemToProblem', () => {
    test('convierte correctamente un problema de suma sin decimales', () => {
      // Arrange - Problema de suma simple
      const additionProblem: AdditionProblem = {
        id: '123',
        operands: [5, 7],
        correctAnswer: 12,
        layout: 'horizontal',
        answerMaxDigits: 2
      };
      
      // Act - Convertir a Problem
      const problem = additionProblemToProblem(additionProblem, 'elementary');
      
      // Assert - Verificar conversión correcta
      expect(problem).toBeDefined();
      expect(problem.id).toBe('123');
      expect(problem.operands).toHaveLength(2);
      expect(problem.operands[0].value).toBe(5);
      expect(problem.operands[1].value).toBe(7);
      expect(problem.correctAnswer).toBe(12);
      expect(problem.displayFormat).toBe('horizontal');
      expect(problem.difficulty).toBe('elementary');
      expect(problem.allowDecimals).toBe(false);
      expect(problem.maxAttempts).toBe(3);
    });
    
    test('convierte correctamente un problema con decimales', () => {
      // Arrange - Problema con decimales
      const additionProblem: AdditionProblem = {
        id: '456',
        operands: [5.5, 7.25],
        correctAnswer: 12.75,
        layout: 'vertical',
        answerMaxDigits: 4,
        answerDecimalPosition: 2
      };
      
      // Act - Convertir a Problem
      const problem = additionProblemToProblem(additionProblem);
      
      // Assert - Verificar conversión correcta
      expect(problem).toBeDefined();
      expect(problem.id).toBe('456');
      expect(problem.operands).toHaveLength(2);
      expect(problem.operands[0].value).toBe(5.5);
      expect(problem.operands[1].value).toBe(7.25);
      expect(problem.correctAnswer).toBe(12.75);
      expect(problem.displayFormat).toBe('vertical');
      expect(problem.difficulty).toBe('beginner'); // Valor predeterminado
      expect(problem.allowDecimals).toBe(true); // Debe ser true porque hay decimales
      expect(problem.maxAttempts).toBe(3);
    });
    
    test('convierte correctamente un problema con múltiples operandos', () => {
      // Arrange - Problema con múltiples operandos
      const additionProblem: AdditionProblem = {
        id: '789',
        operands: [10, 20, 30, 40],
        correctAnswer: 100,
        layout: 'vertical',
        answerMaxDigits: 3
      };
      
      // Act - Convertir a Problem
      const problem = additionProblemToProblem(additionProblem, 'advanced');
      
      // Assert - Verificar conversión correcta
      expect(problem).toBeDefined();
      expect(problem.id).toBe('789');
      expect(problem.operands).toHaveLength(4);
      expect(problem.operands.map(op => op.value)).toEqual([10, 20, 30, 40]);
      expect(problem.correctAnswer).toBe(100);
      expect(problem.displayFormat).toBe('vertical');
      expect(problem.difficulty).toBe('advanced');
      expect(problem.allowDecimals).toBe(false);
      expect(problem.maxAttempts).toBe(3);
    });
  });
  
  // Caso de prueba: Conversión de Problem a AdditionProblem
  describe('problemToAdditionProblem', () => {
    test('convierte correctamente un problema sin decimales', () => {
      // Arrange - Problema genérico
      const problem: Problem = {
        id: '123',
        operands: [{ value: 5 }, { value: 7 }],
        correctAnswer: 12,
        displayFormat: 'horizontal',
        difficulty: 'elementary',
        allowDecimals: false,
        maxAttempts: 3
      };
      
      // Act - Convertir a AdditionProblem
      const additionProblem = problemToAdditionProblem(problem);
      
      // Assert - Verificar conversión correcta
      expect(additionProblem).toBeDefined();
      expect(additionProblem.id).toBe('123');
      expect(additionProblem.operands).toEqual([5, 7]);
      expect(additionProblem.correctAnswer).toBe(12);
      expect(additionProblem.layout).toBe('horizontal');
      expect(additionProblem.answerMaxDigits).toBe(2); // 12 tiene 2 dígitos
      expect(additionProblem.answerDecimalPosition).toBeUndefined();
    });
    
    test('convierte correctamente un problema con decimales', () => {
      // Arrange - Problema genérico con decimales
      const problem: Problem = {
        id: '456',
        operands: [{ value: 5.5 }, { value: 7.25 }],
        correctAnswer: 12.75,
        displayFormat: 'vertical',
        difficulty: 'intermediate',
        allowDecimals: true,
        maxAttempts: 3
      };
      
      // Act - Convertir a AdditionProblem
      const additionProblem = problemToAdditionProblem(problem);
      
      // Assert - Verificar conversión correcta
      expect(additionProblem).toBeDefined();
      expect(additionProblem.id).toBe('456');
      expect(additionProblem.operands).toEqual([5.5, 7.25]);
      expect(additionProblem.correctAnswer).toBe(12.75);
      expect(additionProblem.layout).toBe('vertical');
      expect(additionProblem.answerMaxDigits).toBe(4); // 12.75 tiene 4 caracteres
      expect(additionProblem.answerDecimalPosition).toBe(2); // 2 decimales
    });
    
    test('convierte correctamente un problema con múltiples operandos', () => {
      // Arrange - Problema genérico con múltiples operandos
      const problem: Problem = {
        id: '789',
        operands: [
          { value: 10 }, 
          { value: 20 }, 
          { value: 30 }, 
          { value: 40 }
        ],
        correctAnswer: 100,
        displayFormat: 'vertical',
        difficulty: 'advanced',
        allowDecimals: false,
        maxAttempts: 3
      };
      
      // Act - Convertir a AdditionProblem
      const additionProblem = problemToAdditionProblem(problem);
      
      // Assert - Verificar conversión correcta
      expect(additionProblem).toBeDefined();
      expect(additionProblem.id).toBe('789');
      expect(additionProblem.operands).toEqual([10, 20, 30, 40]);
      expect(additionProblem.correctAnswer).toBe(100);
      expect(additionProblem.layout).toBe('vertical');
      expect(additionProblem.answerMaxDigits).toBe(3); // 100 tiene 3 dígitos
      expect(additionProblem.answerDecimalPosition).toBeUndefined();
    });
    
    test('maneja correctamente casos con displayFormat no válido', () => {
      // Arrange - Problema con formato inválido para AdditionProblem
      const problem: Problem = {
        id: '123',
        operands: [{ value: 5 }, { value: 7 }],
        correctAnswer: 12,
        displayFormat: 'word', // No es válido para AdditionProblem
        difficulty: 'elementary',
        allowDecimals: false,
        maxAttempts: 3
      };
      
      // Act - Convertir a AdditionProblem
      const additionProblem = problemToAdditionProblem(problem);
      
      // Assert - Debe elegir un formato predeterminado
      expect(additionProblem.layout).toBe('horizontal'); // Default de seguridad
    });
  });
});