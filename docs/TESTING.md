# Guía de Pruebas y Verificación

Este documento describe cómo ejecutar las pruebas y verificaciones de tipo para el módulo de suma en el proyecto Math W.A.O.K.

## Estructura de Pruebas

El proyecto incluye diferentes tipos de pruebas para garantizar la robustez del código:

### Pruebas Unitarias

Prueban componentes individuales y funciones para verificar que funcionan como se espera.

- Ubicación: `client/src/operations/addition/__tests__/utils.test.ts`
- Ejecuta: `node --experimental-vm-modules node_modules/.bin/jest client/src/operations/addition/__tests__/utils.test.ts`

### Pruebas de Integración

Verifican que diferentes componentes trabajen correctamente juntos.

- Ubicación: `client/src/operations/addition/__tests__/integration.test.tsx`
- Ejecuta: `node --experimental-vm-modules node_modules/.bin/jest client/src/operations/addition/__tests__/integration.test.tsx`

### Pruebas de Adaptadores de Tipo

Verifican que los convertidores entre tipos `AdditionProblem` y `Problem` funcionen correctamente.

- Ubicación: `client/src/operations/addition/__tests__/adapters.test.ts`
- Ejecuta: `node --experimental-vm-modules node_modules/.bin/jest client/src/operations/addition/__tests__/adapters.test.ts`

## Ejecutar todas las pruebas

Hemos creado un script para ejecutar todas las pruebas y verificaciones de tipo:

```bash
# Desde la raíz del proyecto
./scripts/run-tests.sh
```

Este script ejecutará:
1. Todas las pruebas unitarias y de integración
2. La verificación de tipos con TypeScript

## Integración Continua

El proyecto está configurado con GitHub Actions para ejecutar automáticamente todas las pruebas cada vez que se envía código al repositorio principal.

Configuración: `.github/workflows/tests.yml`

La integración continua ejecuta:
- Pruebas unitarias y de integración en múltiples versiones de Node.js
- Verificación de tipos con TypeScript

## Beneficios del Sistema de Pruebas

Este sistema de pruebas proporciona varios beneficios:

1. **Detección temprana de errores**: Los errores se detectan antes de que lleguen a producción.
2. **Documentación viva**: Las pruebas sirven como documentación sobre cómo deben funcionar los componentes.
3. **Refactorización segura**: El código puede ser refactorizado con confianza sabiendo que las pruebas detectarán cualquier regresión.
4. **Integración robusta**: Las pruebas de integración garantizan que los componentes trabajen bien juntos.
5. **Verificación de tipos**: El sistema verifica que todos los tipos sean consistentes, reduciendo errores en tiempo de ejecución.

## Tipos y Adaptadores

El proyecto utiliza un sistema de adaptadores para convertir entre diferentes estructuras de tipo:

```typescript
// Convertir de AdditionProblem a Problem
const problem = additionProblemToProblem(additionProblem);

// Convertir de Problem a AdditionProblem
const additionProblem = problemToAdditionProblem(problem);
```

Estos adaptadores permiten que el código existente siga funcionando mientras se implementa un sistema de tipos más robusto.

## Actualización de Pruebas

Al agregar nuevas características al módulo de suma, siempre debes:

1. Agregar pruebas unitarias para las nuevas funciones
2. Actualizar las pruebas de integración si es necesario
3. Asegurarte de que todas las pruebas pasen antes de enviar el código

La robustez del código depende de la calidad y cobertura de las pruebas.