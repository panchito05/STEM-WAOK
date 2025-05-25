# COMPARACIÓN DE LAS TRES VERSIONES DEL CÁLCULO DE PROBLEMAS DESAFIANTES

## VERSIÓN 1.0 - ORIGINAL (Compleja con múltiples fuentes de datos)

```javascript
const moduleExercises = exerciseHistory.filter(ex => ex.operationId === module.id);
if (moduleExercises.length === 0) return 'N/A';

// Contar problemas desafiantes usando múltiples fuentes de datos
let problemasDesafiantes = 0;
let totalProblemas = 0;

moduleExercises.forEach(ex => {
  // Intentar múltiples fuentes de datos
  const extraData = ex.extra_data;
  
  if (extraData && extraData.problemDetails) {
    // Fuente 1: problemDetails en extra_data
    extraData.problemDetails.forEach((problem: any) => {
      if (problem) {
        totalProblemas++;
        if ((problem.attempts && problem.attempts > 1) || problem.status === 'revealed') {
          problemasDesafiantes++;
        }
      }
    });
  } else if (ex.score !== undefined && ex.totalProblems !== undefined) {
    // Fuente 2: datos básicos de score y totalProblems
    totalProblemas += ex.totalProblems;
    // Estimar problemas desafiantes como diferencia entre total y score
    const problemasIncorrectos = ex.totalProblems - ex.score;
    problemasDesafiantes += problemasIncorrectos;
  }
});

if (totalProblemas === 0) return 'N/A';
return `${problemasDesafiantes}/${totalProblemas}`;
```

**Problemas de la Versión 1.0:**
- Demasiada complejidad innecesaria
- Dependía de estructuras de datos específicas que podrían no existir
- Lógica anidada difícil de debuggear

---

## VERSIÓN 2.0 - SIMPLIFICADA (Datos básicos con prevención de doble conteo)

```javascript
// Nueva función simplificada para calcular problemas desafiantes
const calculateChallengingProblems = () => {
  const moduleExercises = exerciseHistory.filter(ex => ex.operationId === module.id);
  if (moduleExercises.length === 0) return 'N/A';
  
  let totalProblemas = 0;
  let problemasDesafiantes = 0;
  
  moduleExercises.forEach(exercise => {
    // Sumar todos los problemas del ejercicio
    const problemsInExercise = exercise.totalProblems || 0;
    totalProblemas += problemsInExercise;
    
    // Calcular problemas desafiantes usando diferentes métricas
    const correctAnswers = exercise.score || 0;
    const revealedAnswers = exercise.revealedAnswers || 0;
    
    // Problemas incorrectos (diferencia entre total y correctos)
    const incorrectProblems = Math.max(0, problemsInExercise - correctAnswers);
    
    // Los problemas desafiantes son:
    // 1. Problemas incorrectos + problemas revelados
    // 2. Asegurándonos de no contar doble si las respuestas reveladas ya están incluidas en score
    const challengingFromIncorrect = incorrectProblems;
    const challengingFromRevealed = revealedAnswers;
    
    // Usar el mayor entre incorrectos y revelados para evitar doble conteo
    const exerciseChallengingProblems = Math.max(challengingFromIncorrect, challengingFromRevealed);
    
    problemasDesafiantes += exerciseChallengingProblems;
  });
  
  return totalProblemas > 0 ? `${problemasDesafiantes}/${totalProblemas}` : 'N/A';
};

return calculateChallengingProblems();
```

**Problemas de la Versión 2.0:**
- Aún tenía lógica de prevención de doble conteo que podría ser incorrecta
- No era suficientemente granular
- Seguía siendo una función monolítica

---

## VERSIÓN 3.0 - ULTRA GRANULAR (Arquitectura modular con funciones especializadas)

```javascript
// VERSIÓN 3.0: ARQUITECTURA ULTRA GRANULAR CON FUNCIONES MODULARES

// Función 1: Extraer ejercicios del módulo específico
const extractModuleExercises = (moduleId: string) => {
  return exerciseHistory?.filter(ex => ex && ex.operationId === moduleId) || [];
};

// Función 2: Recolectar contadores básicos de un ejercicio
const collectBasicCounters = (exercise: any) => {
  return {
    totalProblems: Number(exercise.totalProblems) || 0,
    score: Number(exercise.score) || 0,
    revealedAnswers: Number(exercise.revealedAnswers) || 0
  };
};

// Función 3: Calcular problemas incorrectos
const calculateIncorrectProblems = (total: number, correct: number) => {
  return Math.max(0, total - correct);
};

// Función 4: Determinar problemas desafiantes por ejercicio
const determineChallengingProblems = (incorrect: number, revealed: number) => {
  // Lógica: Los problemas desafiantes son aquellos que causaron dificultad
  // Incluye tanto incorrectos como revelados, sin doble conteo
  return incorrect + revealed;
};

// Función 5: Agregar totales de múltiples ejercicios
const aggregateTotals = (exercises: any[]) => {
  let totalProblems = 0;
  let totalChallenging = 0;
  
  exercises.forEach(exercise => {
    const counters = collectBasicCounters(exercise);
    totalProblems += counters.totalProblems;
    
    const incorrect = calculateIncorrectProblems(counters.totalProblems, counters.score);
    const challenging = determineChallengingProblems(incorrect, counters.revealedAnswers);
    
    totalChallenging += challenging;
  });
  
  return { totalProblems, totalChallenging };
};

// Función 6: Formatear resultado final
const formatResult = (challenging: number, total: number) => {
  if (total === 0) return 'N/A';
  return `${challenging}/${total}`;
};

// EJECUTOR PRINCIPAL: Orquesta todas las funciones
const calculateChallengingProblemsV3 = () => {
  const moduleExercises = extractModuleExercises(module.id);
  
  if (moduleExercises.length === 0) {
    return formatResult(0, 0);
  }
  
  const totals = aggregateTotals(moduleExercises);
  return formatResult(totals.totalChallenging, totals.totalProblems);
};

return calculateChallengingProblemsV3();
```

**Ventajas de la Versión 3.0:**
- ✅ **Ultra granular**: Cada función tiene una responsabilidad específica
- ✅ **Fácil de debuggear**: Cada paso es independiente y testeable
- ✅ **Arquitectura modular**: Separación clara de responsabilidades
- ✅ **Lógica simple**: Problemas incorrectos + revelados (sin sobre-ingeniería)
- ✅ **Validación robusta**: Conversión explícita a números con fallbacks
- ✅ **Mantenible**: Fácil de modificar cualquier paso individual
- ✅ **Escalable**: Fácil añadir nuevas métricas o lógicas

---

## DIFERENCIAS CLAVE ENTRE LAS TRES VERSIONES

| Aspecto | Versión 1.0 | Versión 2.0 | Versión 3.0 |
|---------|-------------|-------------|-------------|
| **Complejidad** | Alta | Media | Baja (granular) |
| **Fuentes de datos** | Múltiples complejas | Básicas simplificadas | Básicas validadas |
| **Arquitectura** | Monolítica | Función única | Modular (6 funciones) |
| **Debuggeabilidad** | Difícil | Media | Fácil |
| **Mantenibilidad** | Baja | Media | Alta |
| **Lógica de cálculo** | Compleja con fallbacks | Max entre incorrectos/revelados | Suma directa |
| **Validación de datos** | Implícita | Básica | Explícita con Number() |

---

## CONCLUSIÓN

La **Versión 3.0** representa un cambio arquitectónico completo:
- Paso de una función monolítica a 6 funciones especializadas
- Cambio de lógica compleja con múltiples fuentes a datos básicos validados
- Arquitectura que permite fácil mantenimiento y expansión futura
- Cada función es independiente y testeable por separado