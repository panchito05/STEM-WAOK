import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import { exerciseProgressSchema, moduleSettingsSchema } from "@shared/schema";
import { z } from "zod";

// Verificar si el usuario está autenticado
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Rutas para autenticación
  app.get("/api/auth/me", async (req, res) => {
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

  // Rutas para configuraciones
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
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
  app.put("/api/settings/module/:moduleId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
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
  app.delete("/api/settings/module/:moduleId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const moduleId = req.params.moduleId;
      
      await storage.deleteModuleSettings(userId, moduleId);
      
      return res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting module settings:`, error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rutas para progreso
  app.get("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const progressData = await storage.getProgressForUser(userId);
      
      return res.json(progressData);
    } catch (error) {
      console.error("Error fetching progress:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Guardar nuevo progreso
  app.post("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
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
  app.delete("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
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
