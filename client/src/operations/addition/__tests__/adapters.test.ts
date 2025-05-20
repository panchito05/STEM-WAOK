import { additionProblemToProblem, problemToAdditionProblem } from '../utils';
import { AdditionProblem, Problem } from '../types';

describe('Adaptadores de tipo para problemas matemáticos', () => {
  describe('additionProblemToProblem', () => {
    test('convierte correctamente un AdditionProblem a Problem', () => {
      // Crear un problema de adición de prueba
      const additionProblem: AdditionProblem = {
        id: 'test-123',
        num1: 25,
        num2: 17,
        operands: [25, 17],
        correctAnswer: 42,
        layout: 'horizontal',
        answerMaxDigits: 2,
      };

      // Convertir a Problem
      const problem = additionProblemToProblem(additionProblem, 'intermediate');

      // Verificar todos los campos
      expect(problem.id).toBe('test-123');
      expect(problem.operands.length).toBe(2);
      expect(problem.operands[0].value).toBe(25);
      expect(problem.operands[1].value).toBe(17);
      expect(problem.displayFormat).toBe('horizontal');
      expect(problem.correctAnswer).toBe(42);
      expect(problem.difficulty).toBe('intermediate');
      expect(problem.allowDecimals).toBe(false);
      expect(problem.maxAttempts).toBe(3);
    });

    test('maneja correctamente problemas con decimales', () => {
      // Crear un problema con decimales
      const additionProblem: AdditionProblem = {
        id: 'test-456',
        num1: 12.5,
        num2: 7.75,
        operands: [12.5, 7.75],
        correctAnswer: 20.25,
        layout: 'vertical',
        answerMaxDigits: 4,
        answerDecimalPosition: 2
      };

      // Convertir a Problem
      const problem = additionProblemToProblem(additionProblem, 'advanced');

      // Verificar campos específicos para decimales
      expect(problem.allowDecimals).toBe(true);
      expect(problem.displayFormat).toBe('vertical');
      expect(problem.correctAnswer).toBe(20.25);
    });
  });

  describe('problemToAdditionProblem', () => {
    test('convierte correctamente un Problem a AdditionProblem', () => {
      // Crear un problema genérico
      const problem: Problem = {
        id: 'test-789',
        operands: [{ value: 35 }, { value: 48 }],
        displayFormat: 'horizontal',
        correctAnswer: 83,
        difficulty: 'beginner',
        allowDecimals: false,
        maxAttempts: 2
      };

      // Convertir a AdditionProblem
      const additionProblem = problemToAdditionProblem(problem);

      // Verificar todos los campos
      expect(additionProblem.id).toBe('test-789');
      expect(additionProblem.num1).toBe(35);
      expect(additionProblem.num2).toBe(48);
      expect(additionProblem.operands).toEqual([35, 48]);
      expect(additionProblem.layout).toBe('horizontal');
      expect(additionProblem.correctAnswer).toBe(83);
      expect(additionProblem.answerMaxDigits).toBe(2); // '83' tiene 2 dígitos
      expect(additionProblem.answerDecimalPosition).toBeUndefined();
    });

    test('maneja correctamente problemas con decimales', () => {
      // Crear un problema con decimales
      const problem: Problem = {
        id: 'test-000',
        operands: [{ value: 8.5 }, { value: 3.75 }],
        displayFormat: 'vertical',
        correctAnswer: 12.25,
        difficulty: 'advanced',
        allowDecimals: true,
        maxAttempts: 3
      };

      // Convertir a AdditionProblem
      const additionProblem = problemToAdditionProblem(problem);

      // Verificar campos específicos para decimales
      expect(additionProblem.num1).toBe(8.5);
      expect(additionProblem.num2).toBe(3.75);
      expect(additionProblem.operands).toEqual([8.5, 3.75]);
      expect(additionProblem.correctAnswer).toBe(12.25);
      expect(additionProblem.answerMaxDigits).toBe(4); // '12.25' tiene 4 caracteres sin contar el punto
      expect(additionProblem.answerDecimalPosition).toBe(2); // 2 dígitos después del punto decimal
    });

    test('conversión bidireccional preserva información esencial', () => {
      // Crear un problema original
      const originalProblem: Problem = {
        id: 'test-bidirectional',
        operands: [{ value: 42 }, { value: 28 }],
        displayFormat: 'horizontal',
        correctAnswer: 70,
        difficulty: 'elementary',
        allowDecimals: false,
        maxAttempts: 2
      };

      // Convertir de Problem a AdditionProblem
      const additionProblem = problemToAdditionProblem(originalProblem);
      
      // Convertir de vuelta a Problem
      const convertedProblem = additionProblemToProblem(additionProblem, originalProblem.difficulty);

      // Verificar que los datos esenciales se preservaron
      expect(convertedProblem.id).toBe(originalProblem.id);
      expect(convertedProblem.correctAnswer).toBe(originalProblem.correctAnswer);
      expect(convertedProblem.difficulty).toBe(originalProblem.difficulty);
      expect(convertedProblem.operands[0].value).toBe(originalProblem.operands[0].value);
      expect(convertedProblem.operands[1].value).toBe(originalProblem.operands[1].value);
      expect(convertedProblem.displayFormat).toBe(originalProblem.displayFormat);
    });
  });
});