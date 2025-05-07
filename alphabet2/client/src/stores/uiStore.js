import { writable } from 'svelte/store';

// Mensajes y notificaciones
export const message = writable(null);

// Estado de carga
export const loading = writable(false);

// Configuración de la interfaz de usuario
export const uiSettings = writable({
  language: 'es', // Idioma predeterminado
  soundEnabled: true,
  musicEnabled: true,
  showTutorials: true,
  highContrast: false,
  largeText: false,
  dyslexicFont: false, // Fuente especial para dislexia
  animationsReduced: false
});