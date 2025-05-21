import { generateProblemUseCase } from '../application/GenerateProblemUseCase';
import { AdditionSettings } from '../domain/AdditionSettings';
import { DifficultyLevel, DisplayFormat } from '../domain/AdditionProblem';

describe('GenerateProblemUseCase', () => {
  // Settings para tests
  const createTestSettings = (
    difficulty: DifficultyLevel = DifficultyLevel.EASY,
    allowNegatives: boolean = false,
    allowDecimals: boolean = false
  ): AdditionSettings => ({
    difficulty,
    problemCount: 5,
    displayFormat: DisplayFormat.STANDARD,
    allowNegatives,
    allowDecimals,
    maxOperandValue: 100
  });

  // Tests básicos de generación de problemas
  test('debe generar un problema con ID único', () => {
    const settings = createTestSettings();
    
    const problem = generateProblemUseCase.execute(settings);
    
    expect(problem.id).toBeDefined();
    expect(typeof problem.id).toBe('string');
    expect(problem.id.length).toBeGreaterThan(0);
  });
  
  test('debe generar problemas con operandos dentro del rango de dificultad', () => {
    // Dificultad BEGINNER (rango 1-10)
    const beginnerSettings = createTestSettings(DifficultyLevel.BEGINNER);
    const beginnerProblem = generateProblemUseCase.execute(beginnerSettings);
    
    // Verificar rango
    beginnerProblem.operands.forEach(operand => {
      expect(operand).toBeGreaterThanOrEqual(1);
      expect(operand).toBeLessThanOrEqual(10);
    });
    
    // Dificultad EXPERT (rango 10-1000)
    const expertSettings = createTestSettings(DifficultyLevel.EXPERT);
    const expertProblem = generateProblemUseCase.execute(expertSettings);
    
    // Verificar rango
    expertProblem.operands.forEach(operand => {
      expect(operand).toBeGreaterThanOrEqual(10);
      expect(operand).toBeLessThanOrEqual(1000);
    });
  });
  
  test('debe calcular correctamente la respuesta', () => {
    const settings = createTestSettings();
    
    const problem = generateProblemUseCase.execute(settings);
    
    // Calcular manualmente la suma de operandos
    const expectedSum = problem.operands.reduce((sum, operand) => sum + operand, 0);
    
    // Verificar que la respuesta correcta coincide
    expect(problem.correctAnswer).toBe(expectedSum);
  });
  
  test('debe generar problemas con números negativos cuando está permitido', () => {
    // Configurar para permitir negativos (ejecutar varias veces para aumentar probabilidad)
    const settings = createTestSettings(DifficultyLevel.MEDIUM, true, false);
    
    let foundNegative = false;
    const iterations = 20;
    
    for (let i = 0; i < iterations; i++) {
      const problem = generateProblemUseCase.execute(settings);
      
      // Verificar si algún operando es negativo
      if (problem.operands.some(op => op < 0)) {
        foundNegative = true;
        break;
      }
    }
    
    // Debe haber encontrado al menos un negativo en varias iteraciones
    expect(foundNegative).toBe(true);
  });
  
  test('debe generar problemas sin números negativos cuando no está permitido', () => {
    // Configurar para NO permitir negativos
    const settings = createTestSettings(DifficultyLevel.MEDIUM, false, false);
    
    // Generar varios problemas
    const iterations = 10;
    
    for (let i = 0; i < iterations; i++) {
      const problem = generateProblemUseCase.execute(settings);
      
      // Verificar que ningún operando es negativo
      problem.operands.forEach(operand => {
        expect(operand).toBeGreaterThanOrEqual(0);
      });
    }
  });
  
  test('debe generar problemas con decimales cuando está permitido', () => {
    // Configurar para permitir decimales (ejecutar varias veces para aumentar probabilidad)
    const settings = createTestSettings(DifficultyLevel.MEDIUM, false, true);
    
    let foundDecimal = false;
    const iterations = 20;
    
    for (let i = 0; i < iterations; i++) {
      const problem = generateProblemUseCase.execute(settings);
      
      // Verificar si algún operando tiene decimales
      if (problem.operands.some(op => !Number.isInteger(op))) {
        foundDecimal = true;
        break;
      }
    }
    
    // Debe haber encontrado al menos un decimal en varias iteraciones
    expect(foundDecimal).toBe(true);
  });
  
  // Test para generar múltiples problemas
  test('debe generar el número correcto de problemas', () => {
    const settings = createTestSettings();
    const count = 7;
    
    const problems = generateProblemUseCase.executeMultiple(settings, count);
    
    // Verificar cantidad
    expect(problems.length).toBe(count);
    
    // Verificar que todos los IDs son únicos
    const ids = problems.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(count);
  });
});