import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import { exerciseProgressSchema, moduleSettingsSchema } from "@shared/schema";
import { z } from "zod";

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
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Verificar si el usuario ya existe
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      // Crear el usuario
      const newUser = await storage.insertUser(username, password);
      
      // Establecer sesión
      req.session.userId = newUser.id;
      
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username
      });
    } catch (error) {
      console.error("Error during registration:", error);
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
      
      return res.json(progressData);
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
      
      const newProgress = await storage.insertProgress(userId, validatedProgress);
      
      return res.status(201).json(newProgress);
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

  const httpServer = createServer(app);
  return httpServer;
}
