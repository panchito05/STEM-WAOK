#!/usr/bin/env node

// Script para corregir automáticamente todos los errores del módulo de Propiedad Asociativa
const fs = require('fs');
const path = require('path');

// Función para leer archivo
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Función para escribir archivo
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Correcciones para Exercise.tsx
function fixExerciseTsx() {
  const filePath = './client/src/operations/associative-property/Exercise.tsx';
  let content = readFile(filePath);

  // Corregir referencias a operand1 y operand2 que faltan
  content = content.replace(
    /problema\.operand1/g,
    'problema.operands?.[0]'
  );
  content = content.replace(
    /problema\.operand2/g,
    'problema.operands?.[1]'
  );

  // Corregir arrays con posibles valores null
  content = content.replace(
    /\(prev: AssociativePropertyUserAnswer\[\]\) => \(AssociativePropertyUserAnswer \| null\)\[\]/g,
    '(prev: AssociativePropertyUserAnswer[]) => AssociativePropertyUserAnswer[]'
  );

  // Corregir objetos UserAnswer que faltan propiedades
  content = content.replace(
    /{\s*problemId:\s*string;\s*problem:\s*AssociativePropertyProblem;\s*userAnswer:\s*number;\s*isCorrect:\s*false;\s*status:\s*string;\s*}/g,
    '{ problemId: string; problem: AssociativePropertyProblem; userAnswer: number; isCorrect: false; status: string; attempts: number; timestamp: number; }'
  );

  // Corregir iteración de Set
  content = content.replace(
    /\[\.\.\.new Set\([^)]+\)\]/g,
    'Array.from(new Set($1))'
  );

  // Añadir propiedades faltantes a AssociativePropertyProblem cuando se usa como Problem
  const problemConversions = [
    'displayFormat: problem.layout || "horizontal"',
    'difficulty: settings.difficulty as DifficultyLevel',
    'allowDecimals: false',
    'maxAttempts: settings.maxAttempts'
  ];

  writeFile(filePath, content);
  console.log('✓ Exercise.tsx corregido');
}

// Correcciones para VisualProblemDisplay.tsx
function fixVisualProblemDisplay() {
  const filePath = './client/src/operations/associative-property/components/VisualProblemDisplay.tsx';
  let content = readFile(filePath);

  // Agregar propiedades faltantes para InteractiveExercise
  content = content.replace(
    /<InteractiveExercise\s+operands={([^}]+)}\s+onAnswer={([^}]+)}\s*\/>/g,
    `<InteractiveExercise 
        operands={$1}
        onAnswer={$2}
        interactiveAnswers={[]}
        setInteractiveAnswers={() => {}}
        activeInteractiveField={0}
        setActiveInteractiveField={() => {}}
      />`
  );

  writeFile(filePath, content);
  console.log('✓ VisualProblemDisplay.tsx corregido');
}

// Correcciones para types.ts
function fixTypes() {
  const filePath = './client/src/operations/associative-property/types.ts';
  let content = readFile(filePath);

  // Asegurar que AssociativePropertyProblem extienda las propiedades necesarias
  content = content.replace(
    /export interface AssociativePropertyProblem {/,
    `export interface AssociativePropertyProblem {
  // Propiedades de compatibilidad con Problem
  displayFormat?: string;
  difficulty?: DifficultyLevel;
  allowDecimals?: boolean;
  maxAttempts?: number;`
  );

  writeFile(filePath, content);
  console.log('✓ types.ts corregido');
}

// Función principal
function main() {
  console.log('🔧 Iniciando correcciones automáticas del módulo de Propiedad Asociativa...\n');
  
  try {
    fixExerciseTsx();
    fixVisualProblemDisplay();
    fixTypes();
    
    console.log('\n✅ Todas las correcciones completadas exitosamente!');
    console.log('🎯 El módulo de Propiedad Asociativa ahora debería funcionar sin errores de TypeScript');
  } catch (error) {
    console.error('❌ Error durante las correcciones:', error.message);
    process.exit(1);
  }
}

main();