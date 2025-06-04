# STEM-WAOK

Una aplicación educativa interactiva para el aprendizaje de matemáticas diseñada para estudiantes y profesores.

## 📋 Descripción

STEM-WAOK es una plataforma educativa que permite a los usuarios practicar operaciones matemáticas básicas (suma, resta, multiplicación, división y propiedades asociativas) a través de una interfaz moderna e intuitiva. La aplicación incluye modos para estudiantes y profesores, sistema de recompensas, y seguimiento del progreso.

## ✨ Características Principales

- **Operaciones Matemáticas**: Suma, resta, multiplicación, división y propiedades asociativas
- **Modo Dual**: Interfaz para estudiantes y profesores
- **Sistema de Recompensas**: Motivación a través de logros y puntuaciones
- **Seguimiento de Progreso**: Estadísticas detalladas del rendimiento
- **Interfaz Moderna**: Diseño responsivo con animaciones suaves
- **Base de Datos Local**: Almacenamiento SQLite para desarrollo
- **Sesiones Persistentes**: Manejo de sesiones de usuario

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **ORM**: Drizzle ORM
- **Estilos**: Tailwind CSS
- **Componentes**: Radix UI
- **Animaciones**: Framer Motion
- **Routing**: Wouter
- **Estado**: Zustand

## 📦 Requisitos Previos

- **Node.js**: v18 o superior
- **npm**: v8 o superior
- **Sistema Operativo**: Windows, macOS, o Linux

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/panchito05/STEM-WAOK.git
cd STEM-WAOK
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="file:./local.db"

# Sesiones
SESSION_SECRET="your-session-secret-here"

# Puerto del servidor
PORT=5000
```

### 4. Inicializar la Base de Datos

```bash
npm run db:push
npm run db:seed
```

### 5. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5000`

## 📁 Estructura del Proyecto

```
STEM-WAOK/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── operations/     # Módulos de operaciones matemáticas
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── store/          # Estado global (Zustand)
│   │   └── context/        # Contextos de React
├── server/                 # Backend Express
│   ├── routes/             # Rutas de la API
│   └── index.ts            # Servidor principal
├── db/                     # Esquemas y migraciones
├── shared/                 # Tipos compartidos
└── docs/                   # Documentación
```

## 🧪 Testing

Ejecutar pruebas:

```bash
npm test
```

Ejecutar pruebas con cobertura:

```bash
npm run test:coverage
```

## 🚀 Despliegue

### Construcción para Producción

```bash
npm run build
```

### Ejecutar en Producción

```bash
npm start
```

## 📖 Documentación

- [Guía de Testing](./docs/TESTING.md)
- [Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Equipo STEM-WAOK** - *Desarrollo inicial*

## 🙏 Agradecimientos

- A todos los educadores que inspiraron este proyecto
- A la comunidad de desarrolladores que contribuyeron con feedback
- A las familias que probaron la aplicación en sus hogares