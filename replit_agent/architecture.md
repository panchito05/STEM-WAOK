# Architecture Overview

## 1. Overview

This repository contains a full-stack web application for a math learning platform called "Math W+A+O+K". The application allows users to practice various mathematical operations with interactive exercises, track their progress, and customize their learning experience.

The application follows a modern client-server architecture:
- A React-based frontend for the user interface
- An Express.js backend for API endpoints and server-side logic
- A PostgreSQL database (via Neon) for data persistence
- Drizzle ORM for database schema management and queries

## 2. System Architecture

The system follows a classic three-tier architecture:

1. **Presentation Layer**: React-based SPA with shadcn/ui components
2. **Application Layer**: Express.js server handling API requests and business logic
3. **Data Layer**: PostgreSQL database via Neon's serverless offering with Drizzle ORM

### Key Architectural Decisions

- **Monorepo Structure**: The project uses a monorepo approach with both client and server code in the same repository, sharing common types and utilities.
- **Server-Side Rendering**: The application uses a hybrid approach where the server initially serves the React app but subsequent interactions are client-side.
- **Typed Schema**: Database schema is defined using Drizzle ORM with TypeScript, providing type safety throughout the application.
- **Authentication**: Custom authentication system using server sessions stored in PostgreSQL.
- **State Management**: Combination of React Context API and custom hooks for global state.

## 3. Key Components

### 3.1 Frontend (Client)

The frontend is built with:
- **React**: Core UI library
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **React Router (Wouter)**: Lightweight client-side routing
- **React Query**: Data fetching and caching
- **React Context API**: Global state management

#### Key Frontend Components:

1. **Pages**: 
   - HomePage: Landing page with module list
   - OperationPage: Interactive math exercises
   - ProgressPage: User progress tracking and visualization
   - SettingsPage: User preferences and module settings
   - Authentication pages (Login/Register)

2. **Operation Modules**:
   - Addition, Subtraction, Multiplication, Division
   - Fractions
   - Alphabet and Counting (non-math modules)
   - Each module has an Exercise and Settings component

3. **Context Providers**:
   - AuthContext: Authentication state and methods
   - ProgressContext: Exercise history and progress data
   - SettingsContext: User and module preferences

### 3.2 Backend (Server)

The backend is built with:
- **Express.js**: Web framework for API routes and middleware
- **Node.js**: JavaScript runtime
- **Drizzle ORM**: TypeScript-first ORM
- **Neon Serverless Postgres**: Serverless database

#### Key Backend Components:

1. **API Routes**:
   - Auth endpoints (login, register, me)
   - Progress tracking endpoints
   - Settings management endpoints

2. **Server**: 
   - Express application with middleware for API handling
   - Static file serving for the client application
   - Development mode with Vite integration

3. **Storage Layer**:
   - Database operations abstracted through a storage module
   - User management functions
   - Progress tracking operations
   - Settings management

### 3.3 Database Schema

The database uses a relational schema with the following tables:

1. **users**:
   - Primary user data (id, username, password, timestamps)

2. **progress_entries**:
   - Tracks user progress for each exercise session
   - Related to users through foreign key

3. **module_settings**:
   - Stores user-specific settings for each module
   - JSON field for flexible settings storage

### 3.4 Authentication

The authentication system uses:
- Session-based authentication
- Bcrypt for password hashing
- PostgreSQL for session storage via connect-pg-simple

## 4. Data Flow

### 4.1 Authentication Flow

1. User submits login/register form
2. Server validates credentials and creates session
3. Session ID stored in cookie
4. Client includes cookie in subsequent requests
5. Server validates session on protected routes

### 4.2 Exercise Execution Flow

1. User selects a math module
2. Client loads module settings from context or server
3. Exercise component generates problems based on settings
4. User solves problems with feedback
5. On completion, progress is saved to the server
6. Progress is reflected in the Progress page

### 4.3 Settings Management Flow

1. User modifies settings in the UI
2. Settings are updated in the context
3. Settings are persisted to the server
4. Server stores settings in the database
5. Settings are loaded on initial app load

## 5. External Dependencies

### 5.1 Frontend Dependencies

- **UI Libraries**: Radix UI components, Lucide icons
- **Data Visualization**: Recharts for progress charts
- **Forms**: React Hook Form with Zod validation
- **Drag and Drop**: React DnD for reordering modules

### 5.2 Backend Dependencies

- **Database**: Neon Serverless PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Bcrypt for password hashing
- **Session Management**: connect-pg-simple

### 5.3 Development Tools

- **Vite**: Development server and bundling
- **TypeScript**: Static typing
- **ESBuild**: Fast bundling for production
- **Drizzle Kit**: Database schema migrations

## 6. Deployment Strategy

The application is configured for deployment on Replit, as indicated by the `.replit` configuration file. The deployment strategy includes:

- **Build Process**: 
  1. Client-side code is built with Vite
  2. Server-side code is bundled with ESBuild
  3. Static assets are placed in the dist/public directory

- **Runtime Configuration**:
  - Environment variables (like DATABASE_URL) for configuration
  - Production mode flag to disable development features

- **Database Management**:
  - Drizzle migrations for schema updates
  - Seed script for initial data

- **Scaling**:
  - The `deploymentTarget` is set to "autoscale" in the Replit configuration
  - Serverless database can scale with application load

## 7. Future Considerations

Potential areas for architectural enhancement:

1. **API Versioning**: As the application grows, implementing explicit API versioning would help maintain backward compatibility.

2. **Caching Strategy**: Implementing more sophisticated caching (e.g., Redis) could improve performance for frequently accessed data.

3. **Microservices**: If complexity increases, certain features like progress analytics could be split into separate services.

4. **Real-time Features**: Adding WebSocket support would enable real-time collaborative features or live progress updates.

5. **Testing Infrastructure**: Adding a comprehensive testing strategy with unit, integration, and end-to-end tests.