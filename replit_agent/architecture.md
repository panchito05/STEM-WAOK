# Architecture Overview

## Overview

This application is a full-stack math learning platform that offers interactive exercises across various mathematical operations (addition, subtraction, multiplication, division, fractions, etc.). The application follows a client-server architecture where the React-based frontend communicates with an Express backend that interfaces with a PostgreSQL database using Drizzle ORM.

## System Architecture

The system follows a modern web application architecture with clear separation between:

1. **Frontend**: React-based single-page application (SPA) with client-side routing
2. **Backend**: Express.js server providing RESTful API endpoints
3. **Database**: PostgreSQL database accessed through Drizzle ORM
4. **Build System**: Vite for frontend bundling and TypeScript for type safety

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │<─────│  Express Server │<─────│  PostgreSQL DB  │
│  (Vite/TypeScript) │   │  (API Endpoints) │     │  (Drizzle ORM)  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Key Components

### Frontend

1. **Client Application (`client/` directory)**
   - Built with React and TypeScript
   - Uses Wouter for client-side routing
   - Implements Shadcn UI components library for consistent styling
   - Tailwind CSS for utility-first styling approach
   - React Context API for global state management:
     - `AuthContext`: User authentication state
     - `ProgressContext`: User progress tracking
     - `SettingsContext`: Application and module settings

2. **Math Operations Modules (`client/src/operations/` directory)**
   - Each mathematical operation (addition, subtraction, etc.) is implemented as a separate module
   - Each module follows a consistent pattern with:
     - `Exercise.tsx`: The interactive exercise component
     - `Settings.tsx`: Configuration component for the exercise
     - `utils.ts`: Helper functions for generating problems and checking answers
     - `types.ts`: TypeScript interfaces for the module

3. **Pages (`client/src/pages/` directory)**
   - `HomePage.tsx`: Main landing page with module selection
   - `OperationPage.tsx`: Container for individual operation exercises
   - `ProgressPage.tsx`: User progress visualization and statistics
   - `ProfilePage.tsx`: User profile management
   - `SettingsPage.tsx`: Global app settings
   - `LoginPage.tsx` & `RegisterPage.tsx`: Authentication pages

4. **State Management**
   - Context API for global application state
   - Zustand for more complex state (module organization, favorites)
   - React Query for data fetching and caching

### Backend

1. **Server (`server/` directory)**
   - Express.js server handling API requests
   - Request logging middleware
   - Error handling middleware
   - Route management (`routes.ts`)

2. **Database Interface (`server/storage.ts`)**
   - Abstracts database operations from the API endpoints
   - Provides functions for CRUD operations on users, progress, and settings

3. **Development Server Integration (`server/vite.ts`)**
   - Integration with Vite development server
   - Serves static files in production

### Database

1. **Schema (`shared/schema.ts`)**
   - Defines database tables using Drizzle ORM
   - Main tables:
     - `users`: User authentication and profile data
     - `progressEntries`: Records of completed exercises
     - `moduleSettings`: User-specific settings for each module

2. **Database Connection (`db/index.ts`)**
   - Sets up connection to PostgreSQL database via NeonDB serverless
   - Exports database client instance

3. **Migrations and Seeding**
   - Drizzle Kit for schema migrations
   - Seed script for initial data population

## Data Flow

### Authentication Flow

1. User registers/logs in via the frontend interface
2. Credentials are sent to the backend API
3. Backend verifies credentials against the database
4. On successful authentication, a session is created
5. Protected routes check for active session before providing data

### Exercise Interaction Flow

1. User selects a math operation module from the homepage
2. The corresponding exercise component loads with settings from `SettingsContext`
3. Problems are generated based on difficulty level and settings
4. User solves problems and receives immediate feedback
5. Results are sent to the backend API and stored in the database
6. Progress statistics are updated and displayed in the Progress page

### Settings Management Flow

1. User adjusts global or module-specific settings
2. Changes are stored in the `SettingsContext`
3. Settings are persisted to the backend API
4. Settings are loaded from the database when the user returns to the application

## External Dependencies

### Frontend Dependencies

1. **UI Components**: 
   - Radix UI primitives for accessible components
   - Shadcn UI component library
   - Tailwind CSS for styling

2. **Data Management**:
   - Tanstack React Query for API data fetching and caching
   - Zod for schema validation

3. **Routing and Navigation**:
   - Wouter for lightweight client-side routing

4. **Drag and Drop**:
   - React DnD for drag-and-drop functionality

### Backend Dependencies

1. **Database**:
   - Drizzle ORM for database interactions
   - NeonDB serverless PostgreSQL connection

2. **Authentication**:
   - Bcrypt for password hashing
   - Express session management

3. **Development Tools**:
   - Vite for development server and build process
   - TypeScript for type safety
   - ESBuild for server-side bundling

## Deployment Strategy

The application is configured for deployment on Replit, with specific configurations:

1. **Build Process**:
   - `npm run build`: Builds both client and server code
     - Vite builds the client-side application
     - ESBuild bundles the server code

2. **Production Deployment**:
   - `npm run start`: Starts the production server
   - Serves static assets from the `dist/public` directory
   - Handles API requests through Express routes

3. **Environment Configuration**:
   - Requires `DATABASE_URL` environment variable for database connection
   - NODE_ENV set to "production" in production mode

4. **Replit-Specific Configuration**:
   - `.replit` file configures the Replit environment
   - Deployment target set to "autoscale"
   - Port mapping from 5000 (internal) to 80 (external)

## Security Considerations

1. **Authentication**:
   - Passwords are hashed using bcrypt before storage
   - Session-based authentication for API requests

2. **Data Validation**:
   - Zod schemas for data validation on both client and server
   - Drizzle schema validation for database operations

3. **Error Handling**:
   - Centralized error handling middleware in Express
   - Sanitized error messages in production

## Future Extensibility

The architecture is designed for extensibility:

1. **Module System**: New math operations can be added by creating new modules following the established pattern
2. **Settings Framework**: Consistent settings management allows for new configurable options
3. **API Structure**: Clear separation of concerns enables adding new API endpoints without modifying existing code

## Development Workflow

1. **Local Development**:
   - `npm run dev`: Starts the development server with hot reloading
   - TypeScript checking with `npm run check`

2. **Database Management**:
   - `npm run db:push`: Apply schema changes to the database
   - `npm run db:seed`: Populate test data