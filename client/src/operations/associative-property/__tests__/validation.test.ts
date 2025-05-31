import {
  validateUserAnswer,
  validateAssociativePropertyProblem,
  validateExerciseSettings
} from '../validation/inputValidators';
import { generateAssociativePropertyProblem } from '../utils';
import { AssociativePropertyProblem } from '../types';

describe('Input Validation', () => {
  describe('validateUserAnswer', () => {
    test('should accept valid numeric answers', () => {
      const result = validateUserAnswer('42');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept decimal numbers', () => {
      const result = validateUserAnswer('42.5');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept negative numbers', () => {
      const result = validateUserAnswer('-15');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty input', () => {
      const result = validateUserAnswer('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La respuesta no puede estar vacía');
    });

    test('should reject non-numeric input', () => {
      const result = validateUserAnswer('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La respuesta debe ser un número válido');
    });

    test('should reject numbers that are too large', () => {
      const result = validateUserAnswer('1000000');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La respuesta debe estar entre -999,999 y 999,999');
    });

    test('should warn about excessive decimal precision', () => {
      const result = validateUserAnswer('3.1415926535');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Se recomienda usar máximo 6 decimales');
    });

    test('should reject input with invalid characters', () => {
      const result = validateUserAnswer('12.3.4');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La respuesta contiene caracteres no válidos');
    });

    test('should handle numeric input type', () => {
      const result = validateUserAnswer(42);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateAssociativePropertyProblem', () => {
    test('should validate correct problems', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      const result = validateAssociativePropertyProblem(problem);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject problems without ID', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      (problem as any).id = '';
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El problema debe tener un ID válido');
    });

    test('should reject problems with insufficient operands', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      problem.operands = [1, 2]; // Only 2 operands instead of minimum 3
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La propiedad asociativa requiere al menos 3 operandos');
    });

    test('should reject problems with invalid operands', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      (problem.operands as any)[0] = 'invalid';
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El operando 1 no es un número válido');
    });

    test('should reject problems with incorrect answer', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      problem.correctAnswer = 999; // Wrong answer
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('no coincide con la propiedad asociativa'));
    });

    test('should reject problems with invalid difficulty', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      (problem.difficulty as any) = 'invalid-difficulty';
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nivel de dificultad no válido');
    });

    test('should reject problems with invalid maxAttempts', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      problem.maxAttempts = 0;
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El máximo de intentos debe ser un entero entre 1 y 10');
    });

    test('should reject problems with invalid layout', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      (problem.layout as any) = 'invalid-layout';
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El layout debe ser "horizontal" o "vertical"');
    });

    test('should reject problems with invalid answerMaxDigits', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      problem.answerMaxDigits = 0;
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('answerMaxDigits debe ser un entero positivo');
    });

    test('should handle NaN in correctAnswer', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      problem.correctAnswer = NaN;
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La respuesta correcta debe ser un número válido');
    });
  });

  describe('validateExerciseSettings', () => {
    const validSettings = {
      problemCount: 10,
      hasTimerEnabled: false,
      timeValue: 30,
      timeLimit: 'per-problem',
      maxAttempts: 3,
      showImmediateFeedback: true,
      enableSoundEffects: true,
      showAnswerWithExplanation: true,
      enableAdaptiveDifficulty: true,
      enableCompensation: true,
      enableRewards: true
    };

    test('should validate correct settings', () => {
      const result = validateExerciseSettings(validSettings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid problem count', () => {
      const settings = { ...validSettings, problemCount: 0 };
      const result = validateExerciseSettings(settings);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El número de problemas debe ser un entero entre 1 y 100');
    });

    test('should reject problem count that is too high', () => {
      const settings = { ...validSettings, problemCount: 150 };
      const result = validateExerciseSettings(settings);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El número de problemas debe ser un entero entre 1 y 100');
    });

    test('should validate timer settings when enabled', () => {
      const settings = { 
        ...validSettings, 
        hasTimerEnabled: true,
        timeValue: 5000 // Too high
      };
      const result = validateExerciseSettings(settings);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El tiempo límite debe ser un entero entre 1 y 3600 segundos');
    });

    test('should reject invalid time limit type', () => {
      const settings = { 
        ...validSettings, 
        hasTimerEnabled: true,
        timeLimit: 'invalid-type'
      };
      const result = validateExerciseSettings(settings);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El tipo de tiempo límite debe ser "per-problem" o "exercise"');
    });

    test('should reject invalid maxAttempts', () => {
      const settings = { ...validSettings, maxAttempts: 15 };
      const result = validateExerciseSettings(settings);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El máximo de intentos debe ser un entero entre 1 y 10');
    });

    test('should handle non-integer values', () => {
      const settings = { ...validSettings, problemCount: 10.5 };
      const result = validateExerciseSettings(settings);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El número de problemas debe ser un entero entre 1 y 100');
    });
  });

  describe('Cross-validation Tests', () => {
    test('should validate problem-answer consistency', () => {
      const problem = generateAssociativePropertyProblem('intermediate');
      
      // Validate the problem itself
      const problemValidation = validateAssociativePropertyProblem(problem);
      expect(problemValidation.isValid).toBe(true);
      
      // Validate the correct answer
      const answerValidation = validateUserAnswer(problem.correctAnswer.toString());
      expect(answerValidation.isValid).toBe(true);
      
      // Validate that the answer is mathematically correct
      const expectedSum = problem.operands.reduce((sum, op) => sum + op, 0);
      expect(Math.abs(problem.correctAnswer - expectedSum)).toBeLessThan(0.001);
    });

    test('should validate associative property demonstration', () => {
      const problem = generateAssociativePropertyProblem('intermediate');
      
      if (problem.grouping1 && problem.grouping2) {
        // Both groupings should be valid and equal
        expect(problem.grouping1.totalSum).toBe(problem.grouping2.totalSum);
        expect(problem.grouping1.totalSum).toBe(problem.correctAnswer);
        
        // Mathematical verification
        const [a, b, c] = problem.operands;
        const leftGrouping = (a + b) + c;
        const rightGrouping = a + (b + c);
        
        expect(leftGrouping).toBe(rightGrouping);
        expect(leftGrouping).toBe(problem.correctAnswer);
      }
    });
  });

  describe('Edge Case Validation', () => {
    test('should handle validation of problems with zero', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      problem.operands = [0, 5, 3];
      problem.correctAnswer = 8;
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(true);
    });

    test('should handle validation of problems with negative numbers', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      problem.operands = [-2, 5, -1];
      problem.correctAnswer = 2;
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(true);
    });

    test('should handle validation with decimal operands', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      problem.operands = [1.5, 2.5, 1.0];
      problem.correctAnswer = 5.0;
      
      const result = validateAssociativePropertyProblem(problem);
      expect(result.isValid).toBe(true);
    });

    test('should validate answers with small floating point errors', () => {
      const result = validateUserAnswer('10.000000001');
      expect(result.isValid).toBe(true);
    });
  });
});