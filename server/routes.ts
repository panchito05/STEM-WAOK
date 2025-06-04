import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import { 
  exerciseProgressSchema, 
  moduleSettingsSchema, 
  insertChildProfileSchema,
  users,
  ModuleSettingsData,
  progressEntries
} from "@shared/schema";
import { z } from "zod";
import alphabet2Routes from "./routes-alphabet2";
import { db } from "@db";
import { eq } from "drizzle-orm";

// Verificar si el usuario está autenticado
const isAuthenticated = (req: any, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Rutas para autenticación
  app.get("/api/auth/me", async (req: any, res) => {
    try {
      if (req.session && req.session.userId) {
        const user = await storage.getUserById(req.session.userId);
        if (user) {
          return res.json({
            id: user.id,
            username: user.username
          });
        }
      }
      return res.json(null);
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Ruta de inicio de sesión
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Verificar credenciales
      const isValid = await storage.verifyUserPassword(username, password);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Obtener el usuario
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Establecer sesión
      req.session.userId = user.id;
      
      return res.json({
        id: user.id,
        username: user.username
      });
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Ruta de registro
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { username, password, email, name } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Verificar si el usuario ya existe
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      // Verificar si el email ya existe (si se proporcionó uno)
      if (email) {
        const existingUserByEmail = await db.query.users.findFirst({
          where: eq(users.email, email)
        });
        
        if (existingUserByEmail) {
          return res.status(409).json({ error: "Email already in use" });
        }
      }
      
      // Crear el usuario
      const newUser = await storage.insertUser(username, password, email, name);
      
      // Establecer sesión
      req.session.userId = newUser.id;
      
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name
      });
    } catch (error) {
      console.error("Error during registration:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Ruta para autenticación con Google
  app.post("/api/auth/google", async (req: any, res) => {
    try {
      const { 
        providerId, 
        email, 
        name, 
        photoUrl 
      } = req.body;
      
      if (!providerId || !email) {
        return res.status(400).json({ error: "Provider ID and email are required" });
      }
      
      // Insertar o actualizar el usuario externo
      const user = await storage.insertOrUpdateExternalUser(
        providerId,
        'google',
        email,
        name || '',
        photoUrl
      );
      
      // Establecer sesión
      req.session.userId = user.id;
      
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        provider: user.provider
      });
    } catch (error) {
      console.error("Error during Google authentication:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Ruta de cierre de sesión
  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  // Rutas para configuraciones
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const moduleSettingsData = await storage.getModuleSettingsForUser(userId);
      
      // Convertir la lista de configuraciones de módulos a un objeto para el frontend
      const moduleSettings: Record<string, any> = {};
      if (Array.isArray(moduleSettingsData)) {
        moduleSettingsData.forEach(setting => {
          moduleSettings[setting.moduleId] = setting.settings;
        });
      }
      
      return res.json({
        moduleSettings
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Actualizar configuraciones de un módulo específico
  app.put("/api/settings/module/:moduleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const moduleId = req.params.moduleId;
      
      // Validar los datos de configuración con zod
      const validatedSettings = moduleSettingsSchema.parse(req.body);
      
      const updatedSettings = await storage.saveModuleSettings(
        userId,
        moduleId,
        validatedSettings
      );
      
      return res.json(updatedSettings);
    } catch (error) {
      console.error(`Error updating module settings:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Eliminar configuraciones de un módulo específico
  app.delete("/api/settings/module/:moduleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const moduleId = req.params.moduleId;
      
      await storage.deleteModuleSettings(userId, moduleId);
      
      return res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting module settings:`, error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rutas para progreso
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const progressData = await storage.getProgressForUser(userId);
      
      // Organizar los datos para el formato esperado por el frontend
      // Extrayendo ejercicios por operationId para construir moduleProgress
      const moduleProgress: Record<string, any> = {};
      const exerciseHistory = progressData || [];
      
      // Procesar datos para construir moduleProgress
      exerciseHistory.forEach(entry => {
        const opId = entry.operationId;
        if (!moduleProgress[opId]) {
          moduleProgress[opId] = {
            operationId: opId,
            totalCompleted: 0,
            bestScore: 0,
            averageScore: 0,
            totalScore: 0,
            averageTime: 0,
            totalTime: 0,
            lastAttempt: null
          };
        }
        
        // Actualizar métricas
        moduleProgress[opId].totalCompleted += 1;
        moduleProgress[opId].bestScore = Math.max(moduleProgress[opId].bestScore, entry.score);
        moduleProgress[opId].totalScore += entry.score;
        moduleProgress[opId].totalTime += entry.timeSpent;
        
        // Actualizar última fecha de intento
        const entryDate = new Date(entry.createdAt);
        const lastDate = moduleProgress[opId].lastAttempt ? new Date(moduleProgress[opId].lastAttempt) : null;
        
        if (!lastDate || entryDate > lastDate) {
          moduleProgress[opId].lastAttempt = entry.createdAt;
        }
      });
      
      // Calcular promedios
      Object.keys(moduleProgress).forEach(opId => {
        const module = moduleProgress[opId];
        if (module.totalCompleted > 0) {
          module.averageScore = module.totalScore / module.totalCompleted;
          module.averageTime = module.totalTime / module.totalCompleted;
        }
      });
      
      return res.json({
        exerciseHistory,
        moduleProgress
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Guardar nuevo progreso
  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Validar los datos de progreso con zod
      const validatedProgress = exerciseProgressSchema.parse(req.body);
      
      // Insertar el nuevo progreso
      await storage.insertProgress(userId, validatedProgress);
      
      // Obtener el progreso actualizado para devolverlo en el formato esperado
      const progressData = await storage.getProgressForUser(userId);
      
      // Organizar los datos para el formato esperado por el frontend
      const moduleProgress: Record<string, any> = {};
      const exerciseHistory = progressData || [];
      
      // Procesar datos para construir moduleProgress
      exerciseHistory.forEach(entry => {
        const opId = entry.operationId;
        if (!moduleProgress[opId]) {
          moduleProgress[opId] = {
            operationId: opId,
            totalCompleted: 0,
            bestScore: 0,
            averageScore: 0,
            totalScore: 0,
            averageTime: 0,
            totalTime: 0,
            lastAttempt: null
          };
        }
        
        // Actualizar métricas
        moduleProgress[opId].totalCompleted += 1;
        moduleProgress[opId].bestScore = Math.max(moduleProgress[opId].bestScore, entry.score);
        moduleProgress[opId].totalScore += entry.score;
        moduleProgress[opId].totalTime += entry.timeSpent;
        
        // Actualizar última fecha de intento
        const entryDate = new Date(entry.createdAt);
        const lastDate = moduleProgress[opId].lastAttempt ? new Date(moduleProgress[opId].lastAttempt) : null;
        
        if (!lastDate || entryDate > lastDate) {
          moduleProgress[opId].lastAttempt = entry.createdAt;
        }
      });
      
      // Calcular promedios
      Object.keys(moduleProgress).forEach(opId => {
        const module = moduleProgress[opId];
        if (module.totalCompleted > 0) {
          module.averageScore = module.totalScore / module.totalCompleted;
          module.averageTime = module.totalTime / module.totalCompleted;
        }
      });
      
      return res.status(201).json({
        exerciseHistory,
        moduleProgress
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid progress data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Eliminar todo el progreso
  app.delete("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      await storage.clearProgressForUser(userId);
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error clearing progress:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Borrar el progreso de un perfil de niño específico - VERSIÓN RADICAL
  app.delete("/api/child-profiles/:id/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      console.log(`⚡ BORRADO RADICAL: Solicitud para borrar progreso del perfil ${profileId} (usuario ${userId})`);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // SOLUCIÓN RADICAL: Usar SQL directo para un borrado completo
      try {
        // 1. Obtener todos los IDs de entradas para este perfil
        const entriesQuery = await db.query.progressEntries.findMany({
          where: eq(progressEntries.childProfileId, profileId),
          columns: { id: true }
        });
        
        const entryIds = entriesQuery.map(entry => entry.id);
        console.log(`🔍 Encontrados ${entryIds.length} registros para borrar`);
        
        if (entryIds.length === 0) {
          console.log("✅ No hay datos que borrar");
          return res.json({ 
            success: true, 
            message: "No progress data to delete"
          });
        }
        
        // 2. Borrado usando el ORM primero
        console.log(`🧨 Ejecutando borrado ORM para el perfil ${profileId}`);
        await db.delete(progressEntries)
          .where(eq(progressEntries.childProfileId, profileId));
        
        // 3. Verificar si quedaron registros
        const remainingRecords = await db.query.progressEntries.findMany({
          where: eq(progressEntries.childProfileId, profileId),
        });
        
        if (remainingRecords.length > 0) {
          console.log(`⚠️ Aún quedan ${remainingRecords.length} registros, intentando SQL directo...`);
          
          // 4. Intento extremo con SQL directo - usando solo SQL sin parámetros
          await db.execute(
            `DELETE FROM progress_entries WHERE child_profile_id = ${profileId}`
          );
          
          // 5. Verificación final
          const finalRecords = await db.query.progressEntries.findMany({
            where: eq(progressEntries.childProfileId, profileId),
          });
          
          if (finalRecords.length > 0) {
            console.error(`❌ FALLO CRÍTICO: Aún quedan ${finalRecords.length} registros`);
            return res.status(500).json({
              success: false,
              message: "Failed to remove all progress data despite extreme measures",
              initialCount: entryIds.length,
              remainingCount: finalRecords.length
            });
          }
        }
        
        console.log("✅ BORRADO EXITOSO: Todos los datos de progreso han sido eliminados");
        
        return res.json({
          success: true,
          message: "All progress data completely removed",
          count: entryIds.length
        });
        
      } catch (sqlError: any) {
        console.error("Error crítico en borrado SQL:", sqlError?.message || "Unknown SQL error");
        throw sqlError;
      }
      
    } catch (error: any) {
      console.error("Error catastrófico al borrar progreso:", error?.message || "Unknown error");
      return res.status(500).json({ 
        error: "Critical error while clearing progress data", 
        details: error?.message || "Unknown error" 
      });
    }
  });

  // Rutas para perfiles de niños
  app.get("/api/child-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profiles = await storage.getChildProfilesForUser(userId);
      
      return res.json(profiles);
    } catch (error) {
      console.error("Error fetching child profiles:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/child-profiles/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const activeProfile = await storage.getActiveChildProfile(userId);
      
      if (!activeProfile) {
        return res.json(null);
      }
      
      return res.json(activeProfile);
    } catch (error) {
      console.error("Error fetching active child profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/child-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Validar datos del perfil
      const validatedProfile = insertChildProfileSchema.parse({
        ...req.body,
        parentId: userId
      });
      
      const newProfile = await storage.createChildProfile(validatedProfile);
      
      return res.status(201).json(newProfile);
    } catch (error) {
      console.error("Error creating child profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/child-profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Actualizar perfil
      const updatedProfile = await storage.updateChildProfile(profileId, req.body);
      
      return res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating child profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/child-profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Eliminar perfil
      await storage.deleteChildProfile(profileId);
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting child profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/child-profiles/:id/activate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Activar perfil
      const activatedProfile = await storage.setActiveChildProfile(userId, profileId);
      
      return res.json(activatedProfile);
    } catch (error) {
      console.error("Error activating child profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/child-profiles/:id/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // 🔍 LOGS DE DIAGNÓSTICO PARA EL SERVIDOR
      console.log('🔍 [SERVER-DEBUG] ===== DATOS RECIBIDOS EN SERVIDOR =====');
      console.log('🔍 [SERVER-DEBUG] req.body completo:', JSON.stringify(req.body, null, 2));
      console.log('🔍 [SERVER-DEBUG] operationId recibido:', req.body.operationId);
      console.log('🔍 [SERVER-DEBUG] module recibido:', req.body.module);
      console.log('🔍 [SERVER-DEBUG] exercise recibido:', req.body.exercise);
      
      // 🔧 SOLUCION: Extraer operationId correctamente desde URL o contexto
      // La URL contiene el operationId del módulo que está ejecutando el ejercicio
      const currentUrl = req.headers.referer || req.headers.referrer || '';
      console.log('🔍 [SERVER-DEBUG] URL de referencia:', currentUrl);
      
      let operationId = req.body.operationId;
      
      // Intentar extraer operationId de la URL de referencia
      if (!operationId && currentUrl) {
        const urlParts = currentUrl.split('/');
        const operationIndex = urlParts.findIndex(part => 
          ['addition', 'subtraction', 'multiplication', 'division'].includes(part)
        );
        if (operationIndex !== -1) {
          operationId = urlParts[operationIndex];
          console.log('🔍 [SERVER-DEBUG] Extrayendo operationId de URL:', operationId);
        }
      }
      
      // Intentar extraer desde el objeto exercise
      if (!operationId && req.body.exercise?.module) {
        operationId = req.body.exercise.module;
        console.log('🔍 [SERVER-DEBUG] Extrayendo operationId de exercise.module:', operationId);
      }
      
      // Intentar extraer desde module
      if (!operationId && req.body.module) {
        operationId = req.body.module;
        console.log('🔍 [SERVER-DEBUG] Extrayendo operationId de module:', operationId);
      }
      
      // Solo usar fallback si realmente no se puede determinar
      if (!operationId) {
        operationId = "addition";
        console.log('🔍 [SERVER-DEBUG] Usando fallback operationId:', operationId);
      }
      
      // Crear objeto con el operationId correcto
      const correctedProgressData = {
        ...req.body,
        operationId: operationId
      };
      
      console.log('🔍 [SERVER-DEBUG] progressData con operationId corregido:', JSON.stringify(correctedProgressData, null, 2));
      
      // Validar datos de progreso
      const validatedProgress = exerciseProgressSchema.parse(correctedProgressData);
      
      // MEJORA: Asegurar que los problemas se guarden correctamente
      // Preservar la estructura completa de extra_data si existe
      if (validatedProgress.extra_data) {
        console.log("💾 Guardando datos extra con problemas:", 
          validatedProgress.extra_data.problems?.length || 0, "problemas");
        
        // Crear campo problemDetails para compatibilidad
        if (!validatedProgress.problemDetails && validatedProgress.extra_data.problems) {
          validatedProgress.problemDetails = validatedProgress.extra_data.problems;
        }
      }
      
      // Guardar progreso
      const newProgress = await storage.insertProgressForChildProfile(profileId, validatedProgress);
      
      // Devolver progreso completo actualizado
      const updatedProgressData = await storage.getProgressForChildProfile(profileId);
      
      return res.status(201).json({
        success: true,
        message: "Progress saved successfully",
        data: newProgress
      });
    } catch (error) {
      console.error("Error saving child profile progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid progress data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rutas para progreso de perfiles de niños
  app.get("/api/child-profiles/:id/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Obtener progreso
      const exerciseHistory = await storage.getProgressForChildProfile(profileId);
      
      // Organizar los datos para el formato esperado por el frontend
      // Extrayendo ejercicios por operationId para construir moduleProgress
      const moduleProgress: Record<string, any> = {};
      
      // Procesar datos para construir moduleProgress
      exerciseHistory.forEach(entry => {
        const opId = entry.operationId;
        if (!moduleProgress[opId]) {
          moduleProgress[opId] = {
            operationId: opId,
            totalCompleted: 0,
            bestScore: 0,
            averageScore: 0,
            totalScore: 0,
            averageTime: 0,
            totalTime: 0,
            lastAttempt: null
          };
        }
        
        // Actualizar métricas
        moduleProgress[opId].totalCompleted += 1;
        
        // Calcular el puntaje como porcentaje (0-1)
        const scorePercentage = entry.totalProblems > 0 ? entry.score / entry.totalProblems : 0;
        
        // Usar porcentaje en vez del puntaje bruto
        moduleProgress[opId].bestScore = Math.max(moduleProgress[opId].bestScore, scorePercentage);
        moduleProgress[opId].totalScore += scorePercentage;
        moduleProgress[opId].totalTime += entry.timeSpent;
        
        // Actualizar última fecha de intento
        const entryDate = new Date(entry.createdAt);
        const lastDate = moduleProgress[opId].lastAttempt ? new Date(moduleProgress[opId].lastAttempt) : null;
        
        if (!lastDate || entryDate > lastDate) {
          moduleProgress[opId].lastAttempt = entry.createdAt;
        }
      });
      
      // Calcular promedios
      Object.keys(moduleProgress).forEach(opId => {
        const module = moduleProgress[opId];
        if (module.totalCompleted > 0) {
          module.averageScore = module.totalScore / module.totalCompleted;
          module.averageTime = module.totalTime / module.totalCompleted;
        }
      });
      
      return res.json({
        exerciseHistory,
        moduleProgress
      });
    } catch (error) {
      console.error("Error fetching child profile progress:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/child-profiles/:id/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Validar datos de progreso
      const validatedProgress = exerciseProgressSchema.parse(req.body);
      
      // Guardar progreso
      const newProgress = await storage.insertProgressForChildProfile(profileId, validatedProgress);
      
      return res.status(201).json(newProgress);
    } catch (error) {
      console.error("Error saving child profile progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid progress data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rutas para configuraciones de perfiles de niños
  app.get("/api/child-profiles/:id/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Obtener configuraciones
      const moduleSettingsData = await storage.getModuleSettingsForChildProfile(profileId);
      
      // Convertir a formato para frontend
      const moduleSettings: Record<string, any> = {};
      if (Array.isArray(moduleSettingsData)) {
        moduleSettingsData.forEach(setting => {
          moduleSettings[setting.moduleId] = setting.settings;
        });
      }
      
      // Obtener módulos favoritos si existen
      const globalSettingsData = await storage.getModuleSettingsForChildProfile(profileId, "global");
      let favoriteModules: string[] = [];
      
      if (globalSettingsData && !Array.isArray(globalSettingsData) && 
          globalSettingsData.settings && 
          typeof globalSettingsData.settings === 'object' && 
          globalSettingsData.settings !== null &&
          'favorites' in globalSettingsData.settings) {
        favoriteModules = globalSettingsData.settings.favorites as string[];
      }
      
      return res.json({ moduleSettings, favoriteModules });
    } catch (error) {
      console.error("Error fetching child profile settings:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/child-profiles/:id/settings/module/:moduleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      const moduleId = req.params.moduleId;
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Validar datos de configuración
      const validatedSettings = moduleSettingsSchema.parse(req.body);
      
      // Guardar configuración
      const updatedSettings = await storage.saveModuleSettingsForChildProfile(
        profileId,
        moduleId,
        validatedSettings
      );
      
      return res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating child profile module settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Ruta para manejar los favoritos de un perfil
  app.put("/api/child-profiles/:id/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const profileId = parseInt(req.params.id);
      
      // Verificar que el perfil pertenezca al usuario
      const profiles = await storage.getChildProfilesForUser(userId);
      const isOwner = profiles.some(profile => profile.id === profileId);
      
      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Verificar que el cuerpo incluya una lista de favoritos
      if (!req.body.favorites || !Array.isArray(req.body.favorites)) {
        return res.status(400).json({ error: "Invalid favorites data" });
      }
      
      try {
        // Validar los favoritos
        const favoriteModules = req.body.favorites as string[];
        
        // Guardar favoritos en las configuraciones globales
        const globalSettings: ModuleSettingsData = {
          favorites: favoriteModules
        };
        
        await storage.saveModuleSettingsForChildProfile(
          profileId,
          "global",
          globalSettings
        );
        
        return res.json({ 
          success: true, 
          favorites: favoriteModules 
        });
      } catch (validationError) {
        console.error("Error validating favorites data:", validationError);
        return res.status(400).json({ error: "Invalid favorites format" });
      }
    } catch (error) {
      console.error("Error updating child profile favorites:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rutas para el módulo Alphabet Journey (alphabet2)
  app.use('/alphabet2', alphabet2Routes);

  const httpServer = createServer(app);
  return httpServer;
}