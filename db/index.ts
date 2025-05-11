import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

// Use a default SQLite connection string if DATABASE_URL is not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable';

console.log("Using database connection:", DATABASE_URL.replace(/:[^:]*@/, ':****@')); // Log connection string with password hidden
}

// Ensure we're using the correct connection string format
const connectionString = DATABASE_URL.startsWith('postgresql://') 
  ? DATABASE_URL.replace('postgresql://', 'postgres://')
  : DATABASE_URL;

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });