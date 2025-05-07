import { writable } from 'svelte/store';

// Estado del usuario
export const user = writable(null);

// Logros del usuario
export const achievements = writable([]);

// Progreso del usuario
export const userProgress = writable({});

// Accesorio actual del usuario (avatares, personajes, etc.)
export const userAccessories = writable({
  avatar: 'default',
  companion: 'default',
  theme: 'default'
});