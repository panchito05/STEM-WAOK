import { writable } from 'svelte/store';

// Isla actual que el usuario está explorando
export const currentIsland = writable(null);

// Datos del ecosistema para cada letra
export const ecosystemData = writable({});

// Objetos y recursos descubiertos
export const inventory = writable({
  letters: [],
  artifacts: [],
  companions: [],
  resources: {
    stars: 0,
    energy: 100,
    seeds: 5
  }
});

// Misiones disponibles y completadas
export const missions = writable({
  active: [],
  completed: []
});