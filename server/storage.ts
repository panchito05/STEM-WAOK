import { db } from "@db";
import { users, progressEntries, moduleSettings, ExerciseProgress, ModuleSettingsData } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { hash, compare } from "bcrypt";

// User operations
export async function getUserById(id: number) {
  return db.query.users.findFirst({
    where: eq(users.id, id)
  });
}

export async function getUserByUsername(username: string) {
  return db.query.users.findFirst({
    where: eq(users.username, username)
  });
}

export async function insertUser(username: string, password: string) {
  const passwordHash = await hash(password, 10);
  
  const [newUser] = await db.insert(users)
    .values({ username, password: passwordHash })
    .returning();
  
  return newUser;
}

export async function verifyUserPassword(username: string, password: string) {
  const user = await getUserByUsername(username);
  if (!user) return false;
  
  return compare(password, user.password);
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const passwordHash = await hash(newPassword, 10);
  
  const [updatedUser] = await db.update(users)
    .set({ password: passwordHash })
    .where(eq(users.id, userId))
    .returning();
  
  return updatedUser;
}

// Progress operations
export async function getProgressForUser(userId: number) {
  return db.query.progressEntries.findMany({
    where: eq(progressEntries.userId, userId),
    orderBy: (progressEntries, { desc }) => [desc(progressEntries.createdAt)]
  });
}

export async function insertProgress(userId: number, progressData: ExerciseProgress) {
  const [newProgress] = await db.insert(progressEntries)
    .values({
      userId,
      operationId: progressData.operationId,
      score: progressData.score,
      totalProblems: progressData.totalProblems,
      timeSpent: progressData.timeSpent,
      difficulty: progressData.difficulty
    })
    .returning();
  
  return newProgress;
}

export async function clearProgressForUser(userId: number) {
  return db.delete(progressEntries)
    .where(eq(progressEntries.userId, userId));
}

// Module settings operations
export async function getModuleSettingsForUser(userId: number, moduleId?: string) {
  if (moduleId) {
    return db.query.moduleSettings.findFirst({
      where: and(
        eq(moduleSettings.userId, userId),
        eq(moduleSettings.moduleId, moduleId)
      )
    });
  }
  
  return db.query.moduleSettings.findMany({
    where: eq(moduleSettings.userId, userId)
  });
}

export async function saveModuleSettings(userId: number, moduleId: string, settingsData: ModuleSettingsData) {
  // Check if settings already exist for this module
  const existingSettings = await db.query.moduleSettings.findFirst({
    where: and(
      eq(moduleSettings.userId, userId),
      eq(moduleSettings.moduleId, moduleId)
    )
  });
  
  if (existingSettings) {
    // Update existing settings
    const [updatedSettings] = await db.update(moduleSettings)
      .set({
        settings: settingsData,
        updatedAt: new Date()
      })
      .where(and(
        eq(moduleSettings.userId, userId),
        eq(moduleSettings.moduleId, moduleId)
      ))
      .returning();
    
    return updatedSettings;
  } else {
    // Insert new settings
    const [newSettings] = await db.insert(moduleSettings)
      .values({
        userId,
        moduleId,
        settings: settingsData
      })
      .returning();
    
    return newSettings;
  }
}

export async function deleteModuleSettings(userId: number, moduleId?: string) {
  if (moduleId) {
    return db.delete(moduleSettings)
      .where(and(
        eq(moduleSettings.userId, userId),
        eq(moduleSettings.moduleId, moduleId)
      ));
  }
  
  // Delete all module settings for user
  return db.delete(moduleSettings)
    .where(eq(moduleSettings.userId, userId));
}
