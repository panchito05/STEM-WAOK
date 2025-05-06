# Architecture Overview

## Overview

This repository contains a full-stack educational math learning application built with React and Express. The system follows a client-server architecture with a React frontend and Node.js backend, using PostgreSQL for data persistence via the Drizzle ORM. The application focuses on providing interactive math exercises across various operations (addition, subtraction, multiplication, division, fractions, etc.) with customizable settings and progress tracking.

## System Architecture

The application follows a modern full-stack architecture with the following key components:

### Client-Side (Frontend)

- **Technology Stack**: React with TypeScript using Vite as the build tool
- **UI Framework**: Custom UI components built with Radix UI primitives and styled with Tailwind CSS
- **State Management**: Combination of React Context API for global state (auth, settings, progress) and zustand for module-specific state
- **Routing**: wouter (lightweight alternative to React Router)
- **API Communication**: React Query for data fetching, caching, and state management
- **Form Handling**: React Hook Form with zod for schema validation

### Server-Side (Backend)

- **Technology Stack**: Express.js with TypeScript
- **API Design**: RESTful API design with endpoints prefixed by `/api`
- **Database Access**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication using bcrypt for password hashing
- **Error Handling**: Express middleware for centralized error handling

### Database

- **Database System**: PostgreSQL (via Neon serverless Postgres)
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: Structured schema with tables for users, progress entries, and module settings

## Key Components

### Frontend Components

1. **Auth System**
   - `AuthContext`: Manages user authentication state, login, registration, and session handling
   - `ProtectedRoute`: Higher-order component to protect routes from unauthorized access

2. **Module System**
   - Modular structure for different math operations under `client/src/operations/`
   - Each operation module consists of an Exercise component and Settings component
   - `ModuleList`: Draggable and customizable grid of available math modules

3. **Settings System**
   - `SettingsContext`: Manages global and per-module settings
   - Module-specific settings for difficulty levels, problem counts, time limits, etc.

4. **Progress Tracking**
   - `ProgressContext`: Tracks and persists user progress across different modules
   - Progress visualization with charts for performance metrics

### Backend Components

1. **Express Server**
   - HTTP server with middleware for request logging, JSON parsing, and error handling
   - Route system for handling API requests
   - Integration with Vite dev server in development mode

2. **Storage Layer**
   - Database connection and query layer abstracted through `storage.ts`
   - CRUD operations for user management and progress tracking

3. **Database Schema**
   - `users`: User authentication and profile data
   - `progress_entries`: Records of exercise attempts and scores
   - `module_settings`: Per-user and per-module settings storage

## Data Flow

1. **Authentication Flow**:
   - User submits credentials via login/register form
   - Server validates credentials and creates/verifies user
   - Session is established and stored
   - Frontend updates auth context based on authenticated state

2. **Exercise Flow**:
   - User selects a module from the home page
   - Module settings are loaded from the context
   - Exercise problems are generated based on difficulty settings
   - User completes problems and receives feedback
   - Results are saved to the progress tracking system

3. **Settings Management Flow**:
   - User modifies global or module-specific settings
   - Settings are saved to context and persisted to the database
   - Updated settings are applied to the relevant modules

## External Dependencies

### Frontend Dependencies

- **UI Components**: Radix UI primitives with shadcn/ui implementation
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: 
  - `@tanstack/react-query` for server state
  - `zustand` for client state
  - Context API for global state
- **Form Handling**: `react-hook-form` with `zod` validation
- **Visualization**: `recharts` for progress charts

### Backend Dependencies

- **Database**: 
  - `@neondatabase/serverless` for PostgreSQL connection
  - `drizzle-orm` for database operations
- **Security**: 
  - `bcrypt` for password hashing
  - Express session management
- **Development**: 
  - TypeScript for type safety
  - Vite for development server and building

## Deployment Strategy

The application is configured for deployment on Replit with the following strategy:

1. **Build Process**:
   - Frontend: Vite builds the React application to static assets
   - Backend: esbuild compiles the server code to a distributable bundle

2. **Runtime**:
   - Production environment uses the compiled Node.js server
   - Server serves the static frontend assets
   - Configured to use environment variables for database connection

3. **Database**:
   - Uses the Neon serverless PostgreSQL database
   - Connection established via `DATABASE_URL` environment variable

4. **CI/CD**:
   - Replit workflows for running the development server
   - Build script creates production assets ready for deployment

## Future Considerations

1. **Scalability**:
   - The current architecture can be extended with additional math modules
   - The database schema supports storing module-specific settings and progress

2. **Performance Optimizations**:
   - Implement caching for frequently accessed data
   - Consider code splitting for large module components

3. **Features**:
   - Add more advanced analytics for progress tracking
   - Implement social features like leaderboards or multiplayer modes
   - Expand accessibility options for diverse user needs