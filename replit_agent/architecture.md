# Architecture Overview

## 1. Overview

Math W+A+O+K is a full-stack web application designed as an interactive math learning platform with various exercise modules for different mathematical operations (addition, subtraction, multiplication, division, fractions, etc.). The application features user authentication, progress tracking, and customizable settings for each exercise module.

The system utilizes a modern JavaScript/TypeScript stack with React for the frontend and Express.js for the backend. Data is persisted in a PostgreSQL database using Drizzle ORM.

## 2. System Architecture

The application follows a client-server architecture with clear separation between frontend and backend:

```
Math W+A+O+K
├── Client (React)
│   ├── Components
│   ├── Pages
│   ├── Operations (Math modules)
│   ├── Context (State management)
│   ├── Hooks
│   └── Utils/Lib
└── Server (Express.js)
    ├── API Routes
    ├── Database Interface
    └── Authentication
```

### Frontend Architecture

The frontend is built with React and uses a component-based architecture. It's organized into the following key areas:

- **Pages**: Individual routes for app navigation (home, login, profile, operation exercises)
- **Components**: Reusable UI elements using Shadcn UI component library
- **Operations**: Exercise modules for different math operations (addition, subtraction, etc.)
- **Context**: Global state management using React Context API
- **Hooks**: Custom React hooks for shared functionality
- **Utils/Lib**: Utility functions and shared libraries

The frontend employs a combination of global context state (for auth, settings, progress) and local component state for UI interactions.

### Backend Architecture

The backend is built with Express.js and provides:

- **REST API**: Endpoints for authentication, user data, progress tracking, and settings
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **Database Access**: Interface to PostgreSQL database via Drizzle ORM

## 3. Key Components

### Frontend Components

1. **Authentication System**
   - `AuthContext`: Manages user authentication state
   - Login and registration pages
   - Protected routes for authenticated users

2. **Exercise Modules**
   - Each math operation (addition, subtraction, etc.) has its own module
   - Modules have consistent interfaces with Exercise and Settings components
   - Exercise logic is encapsulated within each module

3. **Progress Tracking**
   - `ProgressContext`: Manages exercise history and progress statistics
   - Visualization of progress through charts and statistics

4. **Settings Management**
   - `SettingsContext`: Manages both global and per-module settings
   - Customizable difficulty levels, problem counts, time limits, etc.

5. **UI Components**
   - Uses Shadcn UI library for consistent design
   - Responsive layouts for both desktop and mobile views

### Backend Components

1. **API Routes**
   - Authentication endpoints
   - User management
   - Progress tracking
   - Settings storage and retrieval

2. **Database Interface**
   - Drizzle ORM for type-safe database access
   - Schema definitions for users, progress entries, and module settings

3. **Storage Service**
   - Abstracted data access through a storage interface
   - CRUD operations for all data entities

## 4. Data Flow

### Authentication Flow

1. User submits credentials through login/register form
2. Frontend sends request to `/api/auth` endpoints
3. Server validates credentials, creates session, and returns user data
4. AuthContext updates with authenticated user state
5. Protected routes become accessible

### Exercise Flow

1. User selects an exercise module from the home page
2. Frontend loads relevant module with settings from SettingsContext
3. User completes exercise problems
4. Results are saved to backend via ProgressContext
5. Progress statistics are updated and displayed

### Settings Management Flow

1. User accesses settings (global or per-module)
2. Changes are stored locally and sent to backend
3. Backend persists settings in database
4. Settings are loaded on subsequent application visits

## 5. Database Schema

The application uses PostgreSQL with the following schema:

1. **users**
   - Primary user account information
   - Username and hashed password
   - Creation and update timestamps

2. **progress_entries**
   - Records exercise attempts and results
   - Linked to users via foreign key
   - Stores score, time spent, difficulty level

3. **module_settings**
   - User-specific settings for each exercise module
   - Stored as JSON for flexibility
   - Linked to users via foreign key

## 6. External Dependencies

### Frontend Dependencies

- **React**: Core UI library
- **Radix UI**: Accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Data fetching and caching
- **Wouter**: Lightweight routing library
- **Recharts**: Charting library for progress visualization
- **React DnD**: Drag and drop functionality for module ordering
- **Zod**: Schema validation

### Backend Dependencies

- **Express.js**: Web server framework
- **Drizzle ORM**: Database access and schema management
- **Bcrypt**: Password hashing
- **Neon Database**: PostgreSQL serverless client
- **Vite**: Development and production build tool

## 7. Deployment Strategy

The application is configured for deployment on Replit with:

- **Development Mode**: Uses Vite's development server with HMR
- **Production Build**: 
  - Frontend: Bundled with Vite
  - Backend: Bundled with esbuild
- **Environment Variables**: Database URL and other configuration
- **Database**: PostgreSQL (likely Neon.tech serverless Postgres)

The deployment workflow includes:
1. Building frontend assets (`npm run build`)
2. Bundling server code
3. Running the production server (`npm run start`)

## 8. Security Considerations

1. **Authentication**: 
   - Password hashing with bcrypt
   - Session-based authentication with HTTP-only cookies

2. **Database Security**:
   - Type-safe database access with Drizzle ORM
   - Parameterized queries to prevent SQL injection

3. **Frontend Security**:
   - Form validation with Zod
   - Protected routes for authenticated content