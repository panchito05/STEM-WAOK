# Architecture Overview

## Overview

This repository contains a full-stack web application for interactive math learning called "Math W+A+O+K". It follows a client-server architecture with a React-based frontend and an Express-based backend. The application uses a PostgreSQL database (via Neon Database) for data persistence, managed through Drizzle ORM.

The system allows users to practice various math operations (addition, subtraction, multiplication, division, fractions, etc.) through interactive exercises, track progress, and customize their learning experience.

## System Architecture

The application follows a modern full-stack architecture with the following key components:

```
┌─────────────────┐    ┌────────────────┐    ┌─────────────────┐
│                 │    │                │    │                 │
│  React Frontend │━━━━│ Express Server │━━━━│ PostgreSQL DB   │
│                 │    │                │    │                 │
└─────────────────┘    └────────────────┘    └─────────────────┘
```

### Client-Side (Frontend)
- Built with React and TypeScript
- Uses a component-based architecture
- State management with React Context API and Zustand
- UI components from shadcn/ui library (based on Radix UI)
- Styling with Tailwind CSS
- Client-side routing with Wouter
- Data fetching with TanStack React Query

### Server-Side (Backend)
- Node.js with Express framework
- TypeScript for type safety
- RESTful API architecture
- Session-based authentication
- Drizzle ORM for database interactions

### Database
- PostgreSQL (via Neon's serverless PostgreSQL)
- Schema managed with Drizzle ORM
- Migrations handled by Drizzle Kit

## Key Components

### Frontend Components

1. **Page Components** (`client/src/pages/`)
   - React components corresponding to different routes
   - Examples: `HomePage`, `OperationPage`, `ProgressPage`, etc.

2. **Operation Modules** (`client/src/operations/`)
   - Separate modules for different math operations (addition, subtraction, etc.)
   - Each module contains:
     - `Exercise.tsx`: The interactive exercise component
     - `Settings.tsx`: Configuration options for the exercise
     - `utils.ts`: Helper functions for problem generation and validation
     - `types.ts`: TypeScript interfaces for the module

3. **UI Components** (`client/src/components/ui/`)
   - Reusable UI components from shadcn/ui
   - Customized to match the application's design system

4. **Context Providers** (`client/src/context/`)
   - `AuthContext`: Manages user authentication state
   - `ProgressContext`: Tracks and persists user progress
   - `SettingsContext`: Manages user preferences and exercise settings

5. **Store** (`client/src/store/`)
   - Zustand-based state management
   - `moduleStore.ts`: Manages the state for module organization and preferences

### Backend Components

1. **Server Setup** (`server/index.ts`)
   - Express server configuration
   - Request handling middleware
   - Error handling

2. **Routes** (`server/routes.ts`)
   - API route definitions
   - Endpoint handlers

3. **Storage Interface** (`server/storage.ts`)
   - Database operations abstraction
   - CRUD operations for users, progress, and settings

4. **Database Connection** (`db/index.ts`)
   - Connection setup to Neon's serverless PostgreSQL
   - Drizzle ORM configuration

### Shared Components

1. **Database Schema** (`shared/schema.ts`)
   - Table definitions using Drizzle ORM
   - Zod validators for data validation
   - Relational schema for users, progress entries, and module settings

## Data Flow

### Authentication Flow
1. User registers or logs in through the frontend
2. Credentials are sent to the backend API
3. Server validates credentials and creates a session
4. Session ID is stored in a cookie and returned to the client
5. Subsequent requests include the session cookie for authentication

### Exercise Flow
1. User selects a math operation module from the homepage
2. Frontend loads the relevant exercise component and settings
3. Exercise component fetches or generates problems based on difficulty level
4. User completes problems, receiving immediate feedback
5. Results are sent to the backend API to update progress
6. Progress data is stored in the database and reflected in the UI

### Settings Management
1. User can customize global and module-specific settings
2. Settings are stored in the browser's localStorage for non-authenticated users
3. For authenticated users, settings are also persisted to the database
4. Settings are loaded when the user returns to the application

## External Dependencies

### Frontend Dependencies
- **React**: UI library
- **Wouter**: Client-side routing
- **TanStack React Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library based on Radix UI
- **Zustand**: State management
- **recharts**: Charting library for progress visualization

### Backend Dependencies
- **Express**: Web server framework
- **Drizzle ORM**: Database ORM
- **Neon Database**: Serverless PostgreSQL provider
- **bcrypt**: Password hashing
- **zod**: Schema validation

## Deployment Strategy

The application is configured for deployment on Replit:

1. **Build Process**
   - Frontend assets are built using Vite
   - Backend code is bundled using esbuild
   - Combined build output is placed in the `dist` directory

2. **Environment Configuration**
   - Environment variables such as `DATABASE_URL` are required for database connectivity
   - Production mode is enabled by setting `NODE_ENV=production`

3. **Deployment Steps**
   - The `.replit` configuration file defines the deployment settings
   - Build command: `npm run build`
   - Start command: `npm run start`
   - The application exposes port 5000 internally, which is mapped to port 80 externally

4. **Database Setup**
   - Database schema is initialized using Drizzle migrations
   - `db:push` script applies schema changes to the database
   - `db:seed` script populates initial data

## Development Workflow

1. Local development is supported with `npm run dev`
2. TypeScript type checking with `npm run check`
3. Database schema changes:
   - Update schema definitions in `shared/schema.ts`
   - Apply changes with `npm run db:push`
   - Seed data with `npm run db:seed`

## Security Considerations

1. **Authentication**
   - Password hashing with bcrypt
   - Session-based authentication

2. **Data Validation**
   - Input validation using Zod schemas
   - Type safety with TypeScript

3. **API Security**
   - Request validation
   - Error handling to prevent information leakage