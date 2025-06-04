import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  // Password puede ser nulo para usuarios que solo usan autenticación con proveedores externos
  password: text("password"),
  email: text("email").unique(),
  name: text("name"),
  provider: text("provider"), // 'local', 'google', etc.
  providerId: text("provider_id"), // ID externo del proveedor
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Perfiles de niños
export const childProfiles = pgTable("child_profiles", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  age: integer("age"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relaciones para los perfiles de niños
export const childProfilesRelations = relations(childProfiles, ({ one, many }) => ({
  parent: one(users, {
    fields: [childProfiles.parentId],
    references: [users.id],
  }),
  progress: many(progressEntries),
  settings: many(moduleSettings),
}));

// Esquema para inserción de perfiles de niños
export const insertChildProfileSchema = createInsertSchema(childProfiles).pick({
  parentId: true,
  name: true,
  avatar: true,
  age: true,
});

// Esquema para registro con contraseña
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// Esquema para registro/login con proveedores externos
export const externalAuthUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  name: true,
  provider: true,
  providerId: true,
  photoUrl: true,
});

// Progress entries table
export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  childProfileId: integer("child_profile_id").references(() => childProfiles.id),
  operationId: text("operation_id").notNull(),
  score: integer("score").notNull(),
  totalProblems: integer("total_problems").notNull(),
  timeSpent: integer("time_spent").notNull(),
  difficulty: text("difficulty").notNull(),
  extraData: jsonb("extra_data"), // Para almacenar detalles de problemas y estadísticas adicionales
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progressEntriesRelations = relations(progressEntries, ({ one }) => ({
  user: one(users, {
    fields: [progressEntries.userId],
    references: [users.id],
  }),
  childProfile: one(childProfiles, {
    fields: [progressEntries.childProfileId],
    references: [childProfiles.id],
  }),
}));

// Module settings table
export const moduleSettings = pgTable("module_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  childProfileId: integer("child_profile_id").references(() => childProfiles.id),
  moduleId: text("module_id").notNull(),
  settings: jsonb("settings").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moduleSettingsRelations = relations(moduleSettings, ({ one }) => ({
  user: one(users, {
    fields: [moduleSettings.userId],
    references: [users.id],
  }),
  childProfile: one(childProfiles, {
    fields: [moduleSettings.childProfileId],
    references: [childProfiles.id],
  }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ExternalAuthUser = z.infer<typeof externalAuthUserSchema>;
export type ChildProfile = typeof childProfiles.$inferSelect;
export type InsertChildProfile = z.infer<typeof insertChildProfileSchema>;

export interface MathProblem {
  problem: string;
  isCorrect: boolean;
  level?: string;
  attempts?: string | number;
  timeSpent?: string | number;
  info?: string;
  userAnswer?: string;
  correctAnswer?: string;
}

export interface ExerciseProgress {
  operationId: string;
  score: number;
  totalProblems: number;
  timeSpent: number;
  difficulty: string;
  date?: string;
  accuracy?: number;
  avgTimePerProblem?: number; 
  avgAttempts?: number;
  revealedAnswers?: number;
  problemDetails?: Array<any>;
  extra_data?: {
    version?: string;
    timestamp?: number;
    problems?: MathProblem[];
    mathProblems?: MathProblem[];
    capturedProblems?: MathProblem[];
    [key: string]: any;
  };
}

export interface ModuleSettingsData {
  difficulty?: string;
  problemCount?: number;
  timeLimit?: string;
  timeValue?: number;
  maxAttempts?: number;
  showImmediateFeedback?: boolean;
  enableSoundEffects?: boolean;
  showAnswerWithExplanation?: boolean;
  enableAdaptiveDifficulty?: boolean;
  enableCompensation?: boolean;
  requireSimplified?: boolean;
  favorites?: string[];
  [key: string]: any;
}

// Validation schemas
export const exerciseProgressSchema = z.object({
  operationId: z.string(),
  score: z.number().int().min(0),
  totalProblems: z.number().int().min(1),
  timeSpent: z.number().int().min(0),
  difficulty: z.string(),
  
  // Campos opcionales para estadísticas adicionales
  accuracy: z.number().optional(),
  avgTimePerProblem: z.number().optional(),
  avgAttempts: z.number().optional(),
  revealedAnswers: z.number().optional(),
  
  // Permitir campos adicionales para datos extendidos
  extra_data: z.any().optional(),
  problemDetails: z.any().optional()
});

export const moduleSettingsSchema = z.object({
  difficulty: z.string().optional(),
  problemCount: z.number().int().min(1).max(100).optional(),
  timeLimit: z.string().optional(),
  timeValue: z.number().int().min(0).max(600).optional(),
  maxAttempts: z.number().int().min(0).max(10).optional(),
  showImmediateFeedback: z.boolean().optional(),
  enableSoundEffects: z.boolean().optional(),
  showAnswerWithExplanation: z.boolean().optional(),
  enableAdaptiveDifficulty: z.boolean().optional(),
  enableCompensation: z.boolean().optional(),
  requireSimplified: z.boolean().optional(),
  favorites: z.array(z.string()).optional(),
}).passthrough();