#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Ejecutar TypeScript en modo de comprobación (sin generar archivos)
try {
  console.log('Ejecutando verificación de tipos...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Verificación de tipos completada con éxito');
  process.exit(0);
} catch (error) {
  console.error('❌ Error en la verificación de tipos');
  process.exit(1);
}