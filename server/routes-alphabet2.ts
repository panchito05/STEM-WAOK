import express, { Request, Response, Router } from 'express';
import path from 'path';

const router = Router();

// Endpoint para verificar la salud del servidor
router.get('/health-check', (req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok', message: 'Alphabet Journey server is running' });
});

// Punto de entrada a la aplicación Svelte
router.get('/', (req: Request, res: Response) => {
  // Servir el archivo index.html de la aplicación Svelte
  res.sendFile(path.join(process.cwd(), 'alphabet2/client/public/index.html'));
});

// Servir archivos estáticos de la aplicación Svelte
router.use('/client/public', (req: Request, res: Response, next) => {
  // Permitir acceso a los archivos estáticos
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(process.cwd(), 'alphabet2/client/public')));

export default router;