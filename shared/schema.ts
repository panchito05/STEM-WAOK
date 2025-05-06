import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Progress entries table
export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  operationId: text("operation_id").notNull(),
  score: integer("score").notNull(),
  totalProblems: integer("total_problems").notNull(),
  timeSpent: integer("time_spent").notNull(),
  difficulty: text("difficulty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progressEntriesRelations = relations(progressEntries, ({ one }) => ({
  user: one(users, {
    fields: [progressEntries.userId],
    references: [users.id],
  }),
}));

// Module settings table
export const moduleSettings = pgTable("module_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
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
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export interface ExerciseProgress {
  operationId: string;
  score: number;
  totalProblems: number;
  timeSpent: number;
  difficulty: string;
}

export interface ModuleSettingsData {
  difficulty: string;
  problemCount: number;
  timeLimit: string;
  timeValue: number;
  showImmediateFeedback: boolean;
  enableSoundEffects: boolean;
  showSolution: boolean;
  requireSimplified?: boolean;
  fractionType?: string;
  [key: string]: any;
}

// Validation schemas
export const exerciseProgressSchema = z.object({
  operationId: z.string(),
  score: z.number().int().min(0),
  totalProblems: z.number().int().min(1),
  timeSpent: z.number().int().min(0),
  difficulty: z.string(),
});

export const moduleSettingsSchema = z.object({
  difficulty: z.string(),
  problemCount: z.number().int().min(1).max(50),
  timeLimit: z.string(),
  timeValue: z.number().int().min(5).max(600),
  showImmediateFeedback: z.boolean(),
  enableSoundEffects: z.boolean(),
  showSolution: z.boolean(),
  requireSimplified: z.boolean().optional(),
  fractionType: z.string().optional(),
});
