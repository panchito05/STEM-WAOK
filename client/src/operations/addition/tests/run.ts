/**
 * Script para ejecutar todos los tests de forma automática
 * y generar un reporte visual
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

/**
 * Ejecuta un archivo de test y captura el resultado
 */
function runTest(testFile: string): { success: boolean; output: string } {
  try {
    // Ejecutar el test con Jest
    const output = execSync(`npx jest ${testFile} --no-cache`, { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    return { success: true, output };
  } catch (error: any) {
    // Si hay error, capturar la salida
    return { 
      success: false, 
      output: error.stdout || error.message || 'Error desconocido'
    };
  }
}

/**
 * Obtiene la lista de archivos de test
 */
function getTestFiles(): string[] {
  const testsDir = path.resolve(__dirname);
  
  // Leer directorio de tests
  const files = fs.readdirSync(testsDir);
  
  // Filtrar archivos .test.ts
  return files
    .filter(file => file.endsWith('.test.ts'))
    .map(file => path.join(testsDir, file));
}

/**
 * Genera un reporte visual en consola
 */
function generateReport(results: { file: string; success: boolean; output: string }[]): void {
  console.log('\n');
  console.log(`${colors.magenta}===============================${colors.reset}`);
  console.log(`${colors.magenta}= REPORTE DE TESTS AUTOMÁTICOS =${colors.reset}`);
  console.log(`${colors.magenta}===============================${colors.reset}`);
  console.log('\n');
  
  // Contador de resultados
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  // Mostrar resumen
  console.log(`${colors.cyan}RESUMEN:${colors.reset}`);
  console.log(`${colors.cyan}➤ Total de tests: ${colors.white}${totalTests}${colors.reset}`);
  console.log(`${colors.cyan}➤ Tests correctos: ${colors.green}${passedTests}${colors.reset}`);
  console.log(`${colors.cyan}➤ Tests fallidos: ${colors.red}${failedTests}${colors.reset}`);
  console.log('\n');
  
  // Mostrar resultados detallados
  console.log(`${colors.cyan}RESULTADOS DETALLADOS:${colors.reset}`);
  results.forEach((result, index) => {
    const fileName = path.basename(result.file);
    const status = result.success 
      ? `${colors.bgGreen}${colors.white} PASÓ ${colors.reset}` 
      : `${colors.bgRed}${colors.white} FALLÓ ${colors.reset}`;
    
    console.log(`${colors.yellow}${index + 1}.${colors.reset} ${fileName} ${status}`);
    
    // Mostrar salida en caso de error
    if (!result.success) {
      console.log(`\n${colors.red}SALIDA DE ERROR:${colors.reset}`);
      
      // Limitar la salida a las líneas más relevantes
      const relevantOutput = result.output
        .split('\n')
        .filter(line => 
          line.includes('FAIL') || 
          line.includes('Error:') || 
          line.includes('expect') ||
          line.match(/^\s+at\s/)
        )
        .slice(0, 10)
        .join('\n');
      
      console.log(relevantOutput);
      console.log('\n');
    }
  });
  
  // Mostrar resumen final con indicador visual
  console.log('\n');
  const passRate = (passedTests / totalTests) * 100;
  let statusLine = '';
  
  if (passRate === 100) {
    statusLine = `${colors.green}✓ TODOS LOS TESTS PASARON CORRECTAMENTE ✓${colors.reset}`;
  } else if (passRate >= 80) {
    statusLine = `${colors.yellow}⚠ LA MAYORÍA DE LOS TESTS PASARON (${passRate.toFixed(0)}%) ⚠${colors.reset}`;
  } else {
    statusLine = `${colors.red}✗ DEMASIADOS TESTS FALLARON (${passRate.toFixed(0)}%) ✗${colors.reset}`;
  }
  
  console.log(statusLine);
  console.log('\n');
}

/**
 * Función principal
 */
function main(): void {
  console.log(`${colors.blue}Ejecutando tests de módulo de suma...${colors.reset}`);
  
  // Obtener archivos de test
  const testFiles = getTestFiles();
  
  if (testFiles.length === 0) {
    console.log(`${colors.red}No se encontraron archivos de test.${colors.reset}`);
    return;
  }
  
  console.log(`${colors.blue}Se encontraron ${testFiles.length} archivos de test.${colors.reset}`);
  
  // Ejecutar cada test
  const results = testFiles.map(file => {
    console.log(`${colors.yellow}Ejecutando ${path.basename(file)}...${colors.reset}`);
    const result = runTest(file);
    return { file, ...result };
  });
  
  // Generar reporte
  generateReport(results);
}

// Ejecutar función principal
main();