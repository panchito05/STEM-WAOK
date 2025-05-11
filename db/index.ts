import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { loadEnv } from 'vite';
import * as schema from "@shared/schema";

// Load environment variables from .replit file
loadEnv('', process.cwd(), '');

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Check your .replit file or environment variables.",
  );
}

// Ensure we're using the correct connection string format
const connectionString = process.env.DATABASE_URL.startsWith('postgresql://') 
  ? process.env.DATABASE_URL.replace('postgresql://', 'postgres://')
  : process.env.DATABASE_URL;

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });