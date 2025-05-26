# Empty Module - Plantilla para Nuevos Módulos

Este es un módulo plantilla completamente funcional que puedes usar como base para crear nuevos tipos de ejercicios educativos en la plataforma Math W+A+O+K.

## ¿Qué incluye?

### 1. **Exercise.tsx** - Componente principal del ejercicio
- Interface limpia y moderna con progreso visual
- Sistema de validación de respuestas
- Manejo de tiempo y puntuación
- Feedback inmediato al usuario
- Pantalla de resultados al completar

### 2. **Settings.tsx** - Panel de configuración completo
- Configuración de dificultad (5 niveles)
- Número de problemas (5-50)
- Límite de tiempo por problema
- Máximo de intentos
- Opciones de experiencia de usuario
- Configuraciones personalizadas

### 3. **types.ts** - Definiciones de tipos TypeScript
- `EmptyProblem` - Estructura del problema
- `DifficultyLevel` - Niveles de dificultad
- `ExerciseLayout` - Formatos de visualización

### 4. **utils.ts** - Funciones utilitarias
- Generación de problemas
- Validación de respuestas
- Cálculo de puntuaciones
- Formateo de tiempo
- Evaluación de rendimiento

### 5. **index.ts** - Exportaciones y metadatos del módulo

## Cómo personalizar este módulo

### Paso 1: Renombrar archivos y carpeta
```bash
# Crea una nueva carpeta con el nombre de tu módulo
cp -r client/src/operations/empty client/src/operations/tu-modulo
```

### Paso 2: Personalizar tipos (types.ts)
```typescript
// Cambia EmptyProblem por tu tipo específico
export interface TuModuloProblem {
  id: string;
  content: string;        // Personaliza según tu necesidad
  correctAnswer: any;     // Cambia el tipo según tu módulo
  layout: ExerciseLayout;
  // Añade campos específicos de tu módulo
  specialField?: string;
}
```

### Paso 3: Personalizar generación de problemas (Exercise.tsx)
```typescript
// En la función generateProblems, personaliza la lógica:
const problem: TuModuloProblem = {
  id: `tu-modulo-${i + 1}`,
  content: "Tu contenido específico aquí",
  correctAnswer: "Tu lógica de respuesta aquí",
  layout: 'horizontal',
  // ... resto de campos
};
```

### Paso 4: Personalizar validación (Exercise.tsx)
```typescript
// En la función checkAnswer, personaliza la validación:
const isCorrect = tuLogicaDeValidacion(userAnswer, currentProblem.correctAnswer);
```

### Paso 5: Personalizar configuraciones (Settings.tsx)
```typescript
// Añade configuraciones específicas de tu módulo
export interface TuModuloSettings extends EmptyModuleSettings {
  configuracionEspecifica1: boolean;
  configuracionEspecifica2: number;
  // ... más configuraciones
}
```

### Paso 6: Actualizar información del módulo (index.ts)
```typescript
export const tuModuloInfo = {
  id: 'tu-modulo',
  name: 'Tu Módulo',
  description: 'Descripción de tu módulo',
  icon: '🔢', // Cambia por tu emoji
  category: 'math', // o la categoría apropiada
  version: '1.0.0',
  // ... resto de configuración
};
```

## Ejemplos de tipos de módulos que puedes crear

### 1. **Módulo de Multiplicación**
- Contenido: operaciones de multiplicación
- Respuesta: resultado numérico
- Validación: comparación exacta

### 2. **Módulo de Vocabulario**
- Contenido: palabra en un idioma
- Respuesta: traducción o definición
- Validación: texto flexible (mayúsculas/minúsculas)

### 3. **Módulo de Geometría**
- Contenido: figura geométrica con medidas
- Respuesta: área, perímetro, etc.
- Validación: rango numérico con tolerancia

### 4. **Módulo de Identificación**
- Contenido: imagen o descripción
- Respuesta: selección múltiple
- Validación: opción exacta

## Integración con el sistema

Una vez que hayas personalizado tu módulo:

1. **Importa tu módulo** en los archivos principales de la aplicación
2. **Registra el módulo** en el sistema de navegación
3. **Configura el almacenamiento** de datos específico del módulo
4. **Prueba todas las funcionalidades** antes de publicar

## Funcionalidades ya incluidas

✅ **Sistema de progreso** - Barra de progreso visual
✅ **Validación de respuestas** - Framework flexible
✅ **Configuraciones avanzadas** - Panel completo de opciones
✅ **Responsive design** - Funciona en móvil y desktop
✅ **Accesibilidad** - Navegación por teclado
✅ **Internacionalización** - Soporte para múltiples idiomas
✅ **Sistema de puntuación** - Cálculo automático de scores
✅ **Feedback visual** - Toasts y animaciones
✅ **Almacenamiento local** - Persistencia de configuraciones

## Estructura de archivos recomendada

```
tu-modulo/
├── Exercise.tsx          # Componente principal
├── Settings.tsx          # Panel de configuración
├── types.ts             # Definiciones TypeScript
├── utils.ts             # Funciones utilitarias
├── index.ts             # Exportaciones
├── README.md            # Documentación
├── components/          # Componentes específicos (opcional)
│   ├── ProblemDisplay.tsx
│   └── AnswerInput.tsx
├── hooks/              # Hooks personalizados (opcional)
│   └── useTuModulo.ts
└── __tests__/          # Tests unitarios (opcional)
    ├── Exercise.test.tsx
    └── utils.test.ts
```

## Consejos de desarrollo

1. **Mantén la consistencia** con el diseño existente de la plataforma
2. **Usa TypeScript** para mayor seguridad de tipos
3. **Implementa tests** para funcionalidades críticas
4. **Documenta bien** tu código y funcionalidades especiales
5. **Sigue las convenciones** de nomenclatura del proyecto
6. **Optimiza el rendimiento** especialmente en la generación de problemas
7. **Considera la accesibilidad** en todos los componentes

¡Ahora tienes una base sólida para crear tu propio módulo educativo! 🚀