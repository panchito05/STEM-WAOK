import {
  generateAssociativePropertyProblem,
  checkAnswer,
  generateAssociativeGroupings
} from '../utils';
import { DifficultyLevel } from '../types';

describe('Associative Property Utils', () => {
  describe('generateAssociativePropertyProblem', () => {
    test('should generate valid problems for beginner difficulty', () => {
      const problem = generateAssociativePropertyProblem('beginner');
      
      expect(problem).toBeDefined();
      expect(problem.id).toBeDefined();
      expect(problem.operands).toHaveLength(3);
      expect(problem.difficulty).toBe('beginner');
      expect(problem.correctAnswer).toBe(
        problem.operands.reduce((sum, op) => sum + op, 0)
      );
    });

    test('should generate problems with increasing difficulty', () => {
      const beginnerProblem = generateAssociativePropertyProblem('beginner', 3, 0, 10);
      const advancedProblem = generateAssociativePropertyProblem('advanced', 3, 0, 10);
      
      // Advanced problems should have larger numbers
      const beginnerMax = Math.max(...beginnerProblem.operands);
      const advancedMax = Math.max(...advancedProblem.operands);
      
      expect(advancedMax).toBeGreaterThan(beginnerMax);
    });

    test('should generate problems with correct operand count', () => {
      const problem = generateAssociativePropertyProblem('intermediate', 3, 0, 10);
      
      expect(problem.operands).toHaveLength(3);
      expect(problem.operands.every(op => typeof op === 'number')).toBe(true);
      expect(problem.operands.every(op => !isNaN(op))).toBe(true);
    });

    test('should include groupings for intermediate difficulty', () => {
      const problem = generateAssociativePropertyProblem('intermediate', 3, 0, 10);
      
      expect(problem.grouping1).toBeDefined();
      expect(problem.grouping2).toBeDefined();
      
      if (problem.grouping1 && problem.grouping2) {
        expect(problem.grouping1.totalSum).toBe(problem.correctAnswer);
        expect(problem.grouping2.totalSum).toBe(problem.correctAnswer);
      }
    });
  });

  describe('checkAnswer', () => {
    test('should validate correct answers', () => {
      const problem = generateAssociativePropertyProblem('beginner', 3, 0, 10);
      const correctAnswer = problem.correctAnswer;
      
      expect(checkAnswer(problem, correctAnswer)).toBe(true);
    });

    test('should reject incorrect answers', () => {
      const problem = generateAssociativePropertyProblem('beginner', 3, 0, 10);
      const incorrectAnswer = problem.correctAnswer + 1;
      
      expect(checkAnswer(problem, incorrectAnswer)).toBe(false);
    });

    test('should handle decimal precision correctly', () => {
      const problem = generateAssociativePropertyProblem('beginner', 3, 0, 10);
      const answer = problem.correctAnswer + 0.0001; // Very small difference
      
      expect(checkAnswer(problem, answer)).toBe(true); // Should be within tolerance
    });

    test('should reject NaN values', () => {
      const problem = generateAssociativePropertyProblem('beginner', 3, 0, 10);
      
      expect(checkAnswer(problem, NaN)).toBe(false);
    });
  });

  describe('generateAssociativeGroupings', () => {
    test('should create valid groupings for 3 operands', () => {
      const operands = [2, 3, 4];
      const groupings = generateAssociativeGroupings(operands);
      
      expect(groupings.grouping1).toBeDefined();
      expect(groupings.grouping2).toBeDefined();
      
      // First grouping: (2 + 3) + 4
      expect(groupings.grouping1.leftGroup).toEqual([2, 3]);
      expect(groupings.grouping1.rightGroup).toEqual([4]);
      expect(groupings.grouping1.leftSum).toBe(5);
      expect(groupings.grouping1.totalSum).toBe(9);
      
      // Second grouping: 2 + (3 + 4)
      expect(groupings.grouping2.leftGroup).toEqual([2]);
      expect(groupings.grouping2.rightGroup).toEqual([3, 4]);
      expect(groupings.grouping2.leftSum).toBe(2);
      expect(groupings.grouping2.totalSum).toBe(9);
    });

    test('should handle 4 operands correctly', () => {
      const operands = [1, 2, 3, 4];
      const groupings = generateAssociativeGroupings(operands);
      
      expect(groupings.grouping1.totalSum).toBe(10);
      expect(groupings.grouping2.totalSum).toBe(10);
      
      // Verify expressions are properly formatted
      expect(groupings.grouping1.expression).toContain('(');
      expect(groupings.grouping1.expression).toContain(')');
      expect(groupings.grouping2.expression).toContain('(');
      expect(groupings.grouping2.expression).toContain(')');
    });

    test('should demonstrate associative property', () => {
      const operands = [5, 7, 3];
      const groupings = generateAssociativeGroupings(operands);
      
      // Both groupings should have the same total
      expect(groupings.grouping1.totalSum).toBe(groupings.grouping2.totalSum);
      
      // Total should equal sum of all operands
      const expectedSum = operands.reduce((sum, op) => sum + op, 0);
      expect(groupings.grouping1.totalSum).toBe(expectedSum);
      expect(groupings.grouping2.totalSum).toBe(expectedSum);
    });
  });

  describe('Mathematical Properties Validation', () => {
    test('should validate associative property holds for all generated problems', () => {
      const difficulties: DifficultyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
      
      difficulties.forEach(difficulty => {
        for (let i = 0; i < 10; i++) {
          const problem = generateAssociativePropertyProblem(difficulty, 3, i, 10);
          const [a, b, c] = problem.operands;
          
          // Test associative property: (a + b) + c = a + (b + c)
          const leftGrouping = (a + b) + c;
          const rightGrouping = a + (b + c);
          
          expect(leftGrouping).toBe(rightGrouping);
          expect(leftGrouping).toBe(problem.correctAnswer);
        }
      });
    });

    test('should validate commutative property preservation', () => {
      const problem = generateAssociativePropertyProblem('intermediate', 3, 0, 10);
      const [a, b, c] = problem.operands;
      
      // While testing associative property, commutative should still hold
      expect(a + b).toBe(b + a);
      expect((a + b) + c).toBe(c + (a + b));
    });

    test('should validate identity property', () => {
      const problem = generateAssociativePropertyProblem('beginner', 3, 0, 10);
      const originalSum = problem.correctAnswer;
      
      // Adding zero should not change the result
      expect(originalSum + 0).toBe(originalSum);
      expect(0 + originalSum).toBe(originalSum);
    });
  });

  describe('Edge Cases', () => {
    test('should handle problems with zero operands', () => {
      const operands = [0, 5, 3];
      const groupings = generateAssociativeGroupings(operands);
      
      expect(groupings.grouping1.totalSum).toBe(8);
      expect(groupings.grouping2.totalSum).toBe(8);
    });

    test('should handle problems with negative numbers', () => {
      const operands = [-2, 5, -1];
      const groupings = generateAssociativeGroupings(operands);
      
      expect(groupings.grouping1.totalSum).toBe(2);
      expect(groupings.grouping2.totalSum).toBe(2);
      
      // Verify associative property holds with negative numbers
      const [a, b, c] = operands;
      expect((a + b) + c).toBe(a + (b + c));
    });

    test('should handle decimal numbers', () => {
      const operands = [1.5, 2.3, 1.2];
      const groupings = generateAssociativeGroupings(operands);
      
      const expectedSum = 5.0;
      expect(Math.abs(groupings.grouping1.totalSum - expectedSum)).toBeLessThan(0.001);
      expect(Math.abs(groupings.grouping2.totalSum - expectedSum)).toBeLessThan(0.001);
    });

    test('should handle large numbers', () => {
      const problem = generateAssociativePropertyProblem('expert', 3, 0, 10);
      
      expect(problem.operands.every(op => op <= 1000)).toBe(true);
      expect(problem.correctAnswer).toBeLessThan(3000);
    });
  });

  describe('Problem Generation Consistency', () => {
    test('should generate unique problem IDs', () => {
      const problem1 = generateAssociativePropertyProblem('beginner', 3, 0, 10);
      const problem2 = generateAssociativePropertyProblem('beginner', 3, 1, 10);
      
      expect(problem1.id).not.toBe(problem2.id);
    });

    test('should maintain problem metadata correctly', () => {
      const problem = generateAssociativePropertyProblem('intermediate', 5, 2, 15);
      
      expect(problem.index).toBe(2);
      expect(problem.total).toBe(15);
      expect(problem.maxAttempts).toBe(5);
    });

    test('should generate appropriate answer digit counts', () => {
      const problem = generateAssociativePropertyProblem('beginner', 3, 0, 10);
      const answerString = problem.correctAnswer.toString();
      const digitCount = answerString.replace('.', '').length;
      
      expect(problem.answerMaxDigits).toBeGreaterThanOrEqual(digitCount);
    });
  });

  describe('Integration Tests', () => {
    test('should work with the complete problem lifecycle', () => {
      // Generate problem
      const problem = generateAssociativePropertyProblem('intermediate', 3, 0, 10);
      
      // Validate problem structure
      expect(problem.operands).toHaveLength(3);
      expect(problem.grouping1).toBeDefined();
      expect(problem.grouping2).toBeDefined();
      
      // Test correct answer validation
      expect(checkAnswer(problem, problem.correctAnswer)).toBe(true);
      
      // Test incorrect answer validation
      expect(checkAnswer(problem, problem.correctAnswer + 1)).toBe(false);
      
      // Verify associative property demonstration
      if (problem.grouping1 && problem.grouping2) {
        expect(problem.grouping1.totalSum).toBe(problem.grouping2.totalSum);
        expect(problem.grouping1.totalSum).toBe(problem.correctAnswer);
      }
    });
  });
});