import { db } from "@db";
import { 
  users, 
  progressEntries, 
  moduleSettings, 
  childProfiles,
  ExerciseProgress, 
  ModuleSettingsData,
  InsertChildProfile 
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
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

export async function insertUser(username: string, password: string, email?: string, name?: string) {
  const passwordHash = await hash(password, 10);
  
  const [newUser] = await db.insert(users)
    .values({ 
      username, 
      password: passwordHash,
      email,
      name,
      provider: 'local'
    })
    .returning();
  
  return newUser;
}

export async function insertOrUpdateExternalUser(
  providerId: string,
  provider: string,
  email: string,
  name: string,
  photoUrl?: string
) {
  // Verificar si el usuario ya existe por providerId
  const existingUserByProviderId = await db.query.users.findFirst({
    where: and(
      eq(users.providerId, providerId),
      eq(users.provider, provider)
    )
  });
  
  if (existingUserByProviderId) {
    // Actualizar el usuario existente 
    const [updatedUser] = await db.update(users)
      .set({ 
        email,
        name,
        photoUrl,
        updatedAt: new Date() 
      })
      .where(eq(users.id, existingUserByProviderId.id))
      .returning();
      
    return updatedUser;
  }
  
  // Si no existe por providerId, buscar por email
  const existingUserByEmail = await db.query.users.findFirst({
    where: eq(users.email, email)
  });
  
  if (existingUserByEmail) {
    // Si existe un usuario con el mismo email pero diferente proveedor, actualizar sus datos
    const [updatedUser] = await db.update(users)
      .set({ 
        providerId,
        provider,
        name,
        photoUrl,
        updatedAt: new Date() 
      })
      .where(eq(users.id, existingUserByEmail.id))
      .returning();
      
    return updatedUser;
  }
  
  // Si no existe, crear un nuevo usuario
  // Generar un nombre de usuario único basado en el email
  let username = email.split('@')[0];
  let isUnique = false;
  let counter = 1;
  
  while (!isUnique) {
    const existingUser = await getUserByUsername(username);
    if (!existingUser) {
      isUnique = true;
    } else {
      username = `${email.split('@')[0]}${counter}`;
      counter++;
    }
  }
  
  const [newUser] = await db.insert(users)
    .values({ 
      username,
      email,
      name,
      photoUrl,
      provider,
      providerId,
    })
    .returning();
  
  return newUser;
}

export async function verifyUserPassword(username: string, password: string) {
  const user = await getUserByUsername(username);
  if (!user || !user.password) return false;
  
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

export async function clearProgressForChildProfile(childProfileId: number) {
  console.log(`Borrando todos los datos de progreso para el perfil ${childProfileId}`);
  
  try {
    // Primero intentamos la eliminación usando SQL directo para evitar problemas de caché
    await db.execute(`DELETE FROM progress_entries WHERE child_profile_id = ${childProfileId}`);
    
    // Como respaldo, usamos también el ORM para asegurar consistencia
    await db.delete(progressEntries)
      .where(eq(progressEntries.childProfileId, childProfileId));
    
    // Verificamos si quedaron entradas
    const remainingEntries = await db.query.progressEntries.findMany({
      where: eq(progressEntries.childProfileId, childProfileId)
    });
    
    if (remainingEntries.length > 0) {
      console.error(`⚠️ Alerta: Quedaron ${remainingEntries.length} entradas después de intentar borrar. IDs: ${remainingEntries.map(e => e.id).join(', ')}`);
    } else {
      console.log(`✅ Todos los datos de progreso para el perfil ${childProfileId} han sido eliminados correctamente.`);
    }
    
    return { success: true, entriesRemoved: true };
  } catch (error) {
    console.error("Error al eliminar datos de progreso:", error);
    throw error;
  }
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

// Child Profile operations
export async function getChildProfilesForUser(parentId: number) {
  return db.query.childProfiles.findMany({
    where: eq(childProfiles.parentId, parentId),
    orderBy: [desc(childProfiles.isActive), desc(childProfiles.createdAt)]
  });
}

export async function getActiveChildProfile(parentId: number) {
  return db.query.childProfiles.findFirst({
    where: and(
      eq(childProfiles.parentId, parentId),
      eq(childProfiles.isActive, true)
    )
  });
}

export async function createChildProfile(data: InsertChildProfile) {
  // Desactivar todos los perfiles existentes del padre
  await db.update(childProfiles)
    .set({ isActive: false })
    .where(eq(childProfiles.parentId, data.parentId));
  
  // Crear nuevo perfil (activo por defecto)
  const [newProfile] = await db.insert(childProfiles)
    .values({ ...data, isActive: true })
    .returning();
  
  return newProfile;
}

export async function updateChildProfile(id: number, data: Partial<InsertChildProfile>) {
  const [updatedProfile] = await db.update(childProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(childProfiles.id, id))
    .returning();
  
  return updatedProfile;
}

export async function deleteChildProfile(id: number) {
  // Eliminar configuraciones asociadas
  await db.delete(moduleSettings)
    .where(eq(moduleSettings.childProfileId, id));
  
  // Eliminar progreso asociado
  await db.delete(progressEntries)
    .where(eq(progressEntries.childProfileId, id));
  
  // Eliminar perfil
  return db.delete(childProfiles)
    .where(eq(childProfiles.id, id));
}

export async function setActiveChildProfile(parentId: number, profileId: number) {
  // Desactivar todos los perfiles del padre
  await db.update(childProfiles)
    .set({ isActive: false })
    .where(eq(childProfiles.parentId, parentId));
  
  // Activar el perfil seleccionado
  const [activatedProfile] = await db.update(childProfiles)
    .set({ isActive: true })
    .where(eq(childProfiles.id, profileId))
    .returning();
  
  return activatedProfile;
}

// Functions for progress and settings with child profiles
export async function getProgressForChildProfile(childProfileId: number) {
  return db.query.progressEntries.findMany({
    where: eq(progressEntries.childProfileId, childProfileId),
    orderBy: (progressEntries, { desc }) => [desc(progressEntries.createdAt)]
  });
}

export async function insertProgressForChildProfile(childProfileId: number, progressData: ExerciseProgress) {
  // Guardar todos los datos enviados, incluyendo los detalles de los problemas
  const progressDataToSave = {
    childProfileId,
    operationId: progressData.operationId,
    score: progressData.score,
    totalProblems: progressData.totalProblems,
    timeSpent: progressData.timeSpent,
    difficulty: progressData.difficulty,
    // Guardamos todos los campos adicionales como un objeto JSON en el campo extraData
    extraData: JSON.stringify({
      date: progressData.date || new Date().toISOString(),
      accuracy: progressData.accuracy,
      avgTimePerProblem: progressData.avgTimePerProblem,
      avgAttempts: progressData.avgAttempts,
      revealedAnswers: progressData.revealedAnswers,
      problemDetails: progressData.problemDetails || []
    })
  };
  
  const [newProgress] = await db.insert(progressEntries)
    .values(progressDataToSave)
    .returning();
  
  return newProgress;
}

export async function getModuleSettingsForChildProfile(childProfileId: number, moduleId?: string) {
  if (moduleId) {
    return db.query.moduleSettings.findFirst({
      where: and(
        eq(moduleSettings.childProfileId, childProfileId),
        eq(moduleSettings.moduleId, moduleId)
      )
    });
  }
  
  return db.query.moduleSettings.findMany({
    where: eq(moduleSettings.childProfileId, childProfileId)
  });
}

export async function saveModuleSettingsForChildProfile(childProfileId: number, moduleId: string, settingsData: ModuleSettingsData) {
  // Check if settings already exist for this module
  const existingSettings = await db.query.moduleSettings.findFirst({
    where: and(
      eq(moduleSettings.childProfileId, childProfileId),
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
        eq(moduleSettings.childProfileId, childProfileId),
        eq(moduleSettings.moduleId, moduleId)
      ))
      .returning();
    
    return updatedSettings;
  } else {
    // Insert new settings
    const [newSettings] = await db.insert(moduleSettings)
      .values({
        childProfileId,
        moduleId,
        settings: settingsData
      })
      .returning();
    
    return newSettings;
  }
}