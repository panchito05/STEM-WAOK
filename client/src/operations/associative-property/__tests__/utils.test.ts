import { generateAssociativePropertyProblem, checkAnswer, getVerticalAlignmentInfo } from '../utils';
import { DifficultyLevel } from '../types';

// Mock para funciones aleatorias para hacer los tests determinísticos
jest.mock('math', () => ({
  random: jest.fn()
    .mockReturnValueOnce(0.5) // Para el primer número aleatorio
    .mockReturnValueOnce(0.3) // Para el segundo número aleatorio
    .mockReturnValueOnce(0.7) // Para decisiones aleatorias
}));

describe('Módulo de Suma - Funciones Utilitarias', () => {
  
  describe('generateAssociativePropertyProblem', () => {
    // Prueba que la función genere un problema válido para cada nivel de dificultad
    test.each([
      ['beginner' as DifficultyLevel],
      ['elementary' as DifficultyLevel],
      ['intermediate' as DifficultyLevel], 
      ['advanced' as DifficultyLevel],
      ['expert' as DifficultyLevel]
    ])('genera problemas válidos para dificultad %s', (difficulty) => {
      const problem = generateAssociativePropertyProblem(difficulty);
      
      // Verificaciones comunes para todas las dificultades
      expect(problem).toBeDefined();
      expect(problem.id).toBeDefined();
      expect(problem.operands.length).toBeGreaterThan(0);
      expect(problem.correctAnswer).toBeDefined();
      expect(problem.layout).toBeDefined();
      expect(problem.answerMaxDigits).toBeGreaterThan(0);
      
      // La suma de los operandos debe ser igual a la respuesta correcta
      const sum = problem.operands.reduce((acc, val) => acc + val, 0);
      expect(Number(sum.toFixed(10))).toBeCloseTo(problem.correctAnswer, 10);
      
      // Verificaciones específicas por nivel de dificultad
      switch(difficulty) {
        case 'beginner':
          expect(problem.operands.length).toBe(2);
          expect(problem.layout).toBe('horizontal');
          expect(problem.answerDecimalPosition).toBeUndefined();
          break;
        case 'elementary':
          expect(problem.operands.length).toBe(2);
          expect(problem.layout).toBe('horizontal');
          expect(problem.answerDecimalPosition).toBeUndefined();
          break;
        case 'intermediate':
          expect(problem.operands.length).toBe(2);
          break;
        case 'advanced':
          expect(problem.operands.length).toBe(3);
          expect(problem.layout).toBe('vertical');
          break;
        case 'expert':
          expect(problem.operands.length).toBeGreaterThanOrEqual(4);
          expect(problem.layout).toBe('vertical');
          break;
      }
    });
    
    // Prueba que los problemas generados tengan valores dentro de los rangos esperados
    test('genera números dentro de los rangos esperados para cada dificultad', () => {
      const beginnerProblem = generateAssociativePropertyProblem('beginner' as DifficultyLevel);
      expect(beginnerProblem.operands[0]).toBeLessThanOrEqual(9);
      expect(beginnerProblem.operands[0]).toBeGreaterThanOrEqual(1);
      expect(beginnerProblem.operands[1]).toBeLessThanOrEqual(9);
      expect(beginnerProblem.operands[1]).toBeGreaterThanOrEqual(1);
      
      const elementaryProblem = generateAssociativePropertyProblem('elementary' as DifficultyLevel);
      elementaryProblem.operands.forEach(op => {
        expect(op).toBeGreaterThanOrEqual(1);
        expect(op).toBeLessThanOrEqual(30);
      });
    });
  });
  
  describe('checkAnswer', () => {
    test('valida respuestas correctas para problemas sin decimales', () => {
      const problem = {
        id: '123',
        operands: [5, 7],
        correctAnswer: 12,
        layout: 'horizontal' as const,
        answerMaxDigits: 2,
        num1: 5,
        num2: 7
      };
      
      expect(checkAnswer(problem, 12)).toBe(true);
      expect(checkAnswer(problem, 11)).toBe(false);
      expect(checkAnswer(problem, 13)).toBe(false);
    });
    
    test('valida respuestas correctas para problemas con decimales', () => {
      const problem = {
        id: '123',
        operands: [5.5, 7.7],
        correctAnswer: 13.2,
        layout: 'horizontal' as const,
        answerMaxDigits: 3,
        answerDecimalPosition: 1,
        num1: 5.5,
        num2: 7.7
      };
      
      expect(checkAnswer(problem, 13.2)).toBe(true);
      expect(checkAnswer(problem, 13.1)).toBe(false);
      expect(checkAnswer(problem, 13.3)).toBe(false);
    });
    
    test('maneja respuestas NaN correctamente', () => {
      const problem = {
        id: '123',
        operands: [5, 7],
        correctAnswer: 12,
        layout: 'horizontal' as const,
        answerMaxDigits: 2,
        num1: 5,
        num2: 7
      };
      
      expect(checkAnswer(problem, NaN)).toBe(false);
    });
  });
  
  describe('getVerticalAlignmentInfo', () => {
    test('retorna información de alineación correcta para números enteros', () => {
      const operands = [12, 345, 6];
      const result = getVerticalAlignmentInfo(operands);
      
      expect(result.maxIntLength).toBe(3); // El número más largo tiene 3 dígitos (345)
      expect(result.maxDecLength).toBe(0); // No hay decimales
      expect(result.operandsFormatted.length).toBe(3);
      expect(result.operandsFormatted[0].intStr).toBe(' 12'); // Alineado a 3 dígitos
      expect(result.operandsFormatted[1].intStr).toBe('345');
      expect(result.operandsFormatted[2].intStr).toBe('  6'); // Alineado a 3 dígitos
    });
    
    test('retorna información de alineación correcta para números con decimales', () => {
      const operands = [12.3, 4.56, 78.9];
      const result = getVerticalAlignmentInfo(operands, 2);
      
      expect(result.maxIntLength).toBe(2); // El número entero más largo tiene 2 dígitos (78)
      expect(result.maxDecLength).toBe(2); // 2 decimales máximo
      expect(result.operandsFormatted.length).toBe(3);
      expect(result.operandsFormatted[0].intStr).toBe('12');
      expect(result.operandsFormatted[0].decStr).toBe('30'); // 12.3 -> 12.30
      expect(result.operandsFormatted[1].intStr).toBe(' 4');
      expect(result.operandsFormatted[1].decStr).toBe('56');
      expect(result.operandsFormatted[2].intStr).toBe('78');
      expect(result.operandsFormatted[2].decStr).toBe('90'); // 78.9 -> 78.90
    });
  });
});