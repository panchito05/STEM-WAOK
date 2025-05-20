#!/bin/bash

# Script para ejecutar todas las pruebas y verificaciones de tipo

echo "🧪 Ejecutando pruebas unitarias y de integración..."
node --experimental-vm-modules node_modules/.bin/jest "client/src/operations/addition/__tests__/*.test.(ts|tsx)"

if [ $? -ne 0 ]; then
  echo "❌ Las pruebas fallaron"
  exit 1
fi

echo "✅ Todas las pruebas pasaron correctamente"

echo "🔍 Ejecutando verificación de tipos..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ La verificación de tipos falló"
  exit 1
fi

echo "✅ Verificación de tipos completada con éxito"
echo "🎉 CI completado exitosamente! El código es robusto y está listo para producción."