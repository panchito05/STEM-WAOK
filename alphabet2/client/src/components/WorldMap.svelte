<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/userStore.js';
  import { inventory } from '../stores/worldStore.js';
  
  export let onExploreIsland;
  
  let worldContainer;
  let islands = [];
  let mapScale = 1;
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let mapPosition = { x: 0, y: 0 };
  let mapSize = { width: 0, height: 0 };
  
  // Generar coordenadas para las islas del alfabeto
  function generateIslandPositions() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    // Crear patrones específicos para ubicar las islas
    // Podemos crear un archipiélago o agrupar las islas por categorías
    const positions = {};
    
    // Generar posiciones en forma de archipiélago circular
    const centerX = 50;
    const centerY = 50;
    const spiralRadius = 35;
    const totalLetters = letters.length;
    
    letters.forEach((letter, index) => {
      // Crear un patrón en espiral
      const angle = (index / totalLetters) * Math.PI * 2;
      const distance = 5 + (index / totalLetters) * spiralRadius;
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      positions[letter] = { x, y };
    });
    
    return letters.map((letter, index) => ({
      id: letter,
      letter: letter,
      name: `Isla ${letter}`,
      position: positions[letter],
      discovered: index < 3, // Las primeras tres islas (A, B, C) están descubiertas
      visitCount: index === 0 ? 2 : (index === 1 ? 1 : 0), // A ha sido visitada 2 veces, B una vez
      activities: [
        { id: 'sound-mirror', name: 'Espejo de Sonidos', unlocked: true },
        { id: 'word-builder', name: 'Constructor de Palabras', unlocked: index < 2 },
        { id: 'motion-recognition', name: 'Letra en Movimiento', unlocked: index === 0 },
        { id: 'interactive-story', name: 'Historia Interactiva', unlocked: false },
        { id: 'letter-arcade', name: 'Arcade de Letras', unlocked: false }
      ],
      difficulty: index < 5 ? 'beginner' : (index < 15 ? 'intermediate' : 'advanced'),
      ecosystem: {
        growth: index < 3 ? Math.min(5, 3 - index) : 0,
        weather: ['sunny', 'rainy', 'cloudy'][Math.floor(Math.random() * 3)],
        plants: index === 0 ? 3 : (index === 1 ? 1 : 0),
        animals: index === 0 ? 2 : 0
      }
    }));
  }
  
  // Inicializar islas
  onMount(() => {
    islands = generateIslandPositions();
    
    // Actualizar el inventario con las letras descubiertas
    $inventory.letters = islands
      .filter(island => island.discovered)
      .map(island => island.letter);
      
    // Configurar el tamaño del mapa
    if (worldContainer) {
      mapSize.width = worldContainer.clientWidth;
      mapSize.height = worldContainer.clientHeight;
    }
    
    // Event listeners para zoom y pan
    const handleWheel = (e) => {
      e.preventDefault();
      
      // Zoom
      const zoomSensitivity = 0.1;
      const zoomDirection = e.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(0.5, Math.min(2, mapScale + zoomDirection * zoomSensitivity));
      
      if (newScale !== mapScale) {
        // Ajustar posición para hacer zoom hacia el cursor
        const rect = worldContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const oldScaleInverse = 1 / mapScale;
        const newScaleInverse = 1 / newScale;
        
        mapPosition.x -= (mouseX - mapPosition.x) * (newScaleInverse - oldScaleInverse);
        mapPosition.y -= (mouseY - mapPosition.y) * (newScaleInverse - oldScaleInverse);
        
        mapScale = newScale;
      }
    };
    
    worldContainer.addEventListener('wheel', handleWheel);
    
    return () => {
      if (worldContainer) {
        worldContainer.removeEventListener('wheel', handleWheel);
      }
    };
  });
  
  // Interacción con el mapa - arrastrar
  function handleMouseDown(e) {
    isDragging = true;
    dragStart.x = e.clientX - mapPosition.x;
    dragStart.y = e.clientY - mapPosition.y;
    worldContainer.style.cursor = 'grabbing';
  }
  
  function handleMouseMove(e) {
    if (!isDragging) return;
    
    mapPosition.x = e.clientX - dragStart.x;
    mapPosition.y = e.clientY - dragStart.y;
    
    // Limitar el panning para no alejar demasiado el mapa
    const maxPanX = mapSize.width * 0.5;
    const maxPanY = mapSize.height * 0.5;
    
    mapPosition.x = Math.max(-maxPanX, Math.min(maxPanX, mapPosition.x));
    mapPosition.y = Math.max(-maxPanY, Math.min(maxPanY, mapPosition.y));
  }
  
  function handleMouseUp() {
    isDragging = false;
    worldContainer.style.cursor = 'grab';
  }
  
  // Función para explorar una isla
  function exploreIsland(island) {
    if (!island.discovered) {
      // Mostrar un mensaje de que la isla está bloqueada
      return;
    }
    
    // Aumentar contador de visitas
    island.visitCount = (island.visitCount || 0) + 1;
    
    // Llamar a la función del componente padre
    onExploreIsland(island);
  }
  
  // Calcular el tamaño de la isla basado en su nivel
  function getIslandSize(island) {
    const baseSize = 60; // Tamaño base en píxeles
    const growthMultiplier = island.ecosystem?.growth || 0;
    const visitMultiplier = island.visitCount || 0;
    
    // Tamaño basado en crecimiento y visitas
    return baseSize + (growthMultiplier * 5) + (visitMultiplier * 2);
  }
  
  // Obtener clase de dificultad para estilos
  function getDifficultyClass(difficulty) {
    switch(difficulty) {
      case 'beginner': return 'difficulty-beginner';
      case 'intermediate': return 'difficulty-intermediate';
      case 'advanced': return 'difficulty-advanced';
      default: return '';
    }
  }
  
  // Formatear coordenadas para usar en CSS
  function formatPosition(position) {
    return `left: ${position.x}%; top: ${position.y}%;`;
  }
</script>

<div 
  class="world-map" 
  bind:this={worldContainer}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
>
  <div 
    class="map-content"
    style="transform: translate({mapPosition.x}px, {mapPosition.y}px) scale({mapScale});"
  >
    <!-- Fondo del mapa con océano -->
    <div class="ocean"></div>
    
    <!-- Rutas entre islas -->
    <svg class="routes-container">
      {#each islands.filter(i => i.discovered) as island, index}
        {#if index > 0}
          <!-- Conectar con la isla anterior si está descubierta -->
          {#if islands[index-1].discovered}
            <line 
              x1={islands[index-1].position.x + "%"} 
              y1={islands[index-1].position.y + "%"} 
              x2={island.position.x + "%"} 
              y2={island.position.y + "%"} 
              class="route-line"
            />
          {/if}
        {/if}
      {/each}
    </svg>
    
    <!-- Islas -->
    {#each islands as island}
      <div 
        class="island {island.discovered ? 'discovered' : 'undiscovered'} {getDifficultyClass(island.difficulty)}"
        style="{formatPosition(island.position)} width: {getIslandSize(island)}px; height: {getIslandSize(island)}px;"
        on:click={() => exploreIsland(island)}
      >
        <div class="island-content">
          <div class="island-letter">{island.letter}</div>
          {#if island.ecosystem?.growth > 0}
            <div class="ecosystem-indicator" style="height: {island.ecosystem.growth * 20}%"></div>
          {/if}
        </div>
        
        {#if island.discovered}
          <div class="island-name">{island.name}</div>
        {:else}
          <div class="island-lock">🔒</div>
        {/if}
      </div>
    {/each}
    
    <!-- Embarcación del jugador (ubicada en la última isla visitada) -->
    {#if $user}
      <div class="player-vessel float"></div>
    {/if}
  </div>
  
  <!-- Controles de navegación -->
  <div class="map-controls">
    <button class="map-button" on:click={() => mapScale = Math.min(2, mapScale + 0.1)}>+</button>
    <button class="map-button" on:click={() => mapScale = Math.max(0.5, mapScale - 0.1)}>-</button>
    <button class="map-button" on:click={() => { mapPosition = {x: 0, y: 0}; mapScale = 1; }}>🏠</button>
  </div>
  
  <!-- Brújula decorativa -->
  <div class="compass"></div>
</div>

<style>
  .world-map {
    width: 100%;
    height: calc(100vh - 100px);
    position: relative;
    overflow: hidden;
    cursor: grab;
    background-color: #e6f7ff;
  }
  
  .map-content {
    position: absolute;
    width: 100%;
    height: 100%;
    transform-origin: center;
    transition: transform 0.1s ease-out;
  }
  
  .ocean {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background-color: #a7d8ff;
    background-image: radial-gradient(circle at 50% 50%, #c2e5ff 0%, #a7d8ff 50%, #86c6ff 100%);
    z-index: 0;
  }
  
  .routes-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  
  .route-line {
    stroke: #ffffff;
    stroke-width: 2px;
    stroke-dasharray: 5;
    stroke-opacity: 0.7;
    animation: dash 30s linear infinite;
  }
  
  @keyframes dash {
    to {
      stroke-dashoffset: 1000;
    }
  }
  
  .island {
    position: absolute;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease-out;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .discovered {
    cursor: pointer;
  }
  
  .undiscovered {
    opacity: 0.6;
    filter: grayscale(0.8) brightness(0.5);
  }
  
  .difficulty-beginner {
    background-color: #8ae379;
    background-image: radial-gradient(circle at 50% 50%, #a5e996 0%, #8ae379 50%, #77d566 100%);
  }
  
  .difficulty-intermediate {
    background-color: #ffcc5c;
    background-image: radial-gradient(circle at 50% 50%, #ffdb82 0%, #ffcc5c 50%, #ffbd36 100%);
  }
  
  .difficulty-advanced {
    background-color: #ff7d5b;
    background-image: radial-gradient(circle at 50% 50%, #ff9a7f 0%, #ff7d5b 50%, #ff5f37 100%);
  }
  
  .island-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .island-letter {
    font-size: 1.8rem;
    font-weight: 800;
    color: rgba(0, 0, 0, 0.8);
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
    z-index: 2;
  }
  
  .island-name {
    position: absolute;
    bottom: -25px;
    background-color: white;
    padding: 3px 10px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.8rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
  }
  
  .island-lock {
    position: absolute;
    font-size: 1.3rem;
  }
  
  .ecosystem-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.3);
    z-index: 1;
  }
  
  .player-vessel {
    position: absolute;
    width: 30px;
    height: 30px;
    background-image: url('/images/vessel.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    z-index: 3;
  }
  
  .map-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 10;
  }
  
  .map-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: white;
    border: 2px solid var(--primary);
    color: var(--primary);
    font-size: 1.2rem;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .compass {
    position: absolute;
    bottom: 20px;
    left: 20px;
    width: 60px;
    height: 60px;
    background-image: url('/images/compass.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    z-index: 10;
    opacity: 0.8;
  }
  
  /* Hover effects */
  .discovered:hover {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    z-index: 10;
  }
  
  .island-name {
    opacity: 0;
    transform: translateY(5px);
    transition: all 0.3s ease-out;
  }
  
  .discovered:hover .island-name {
    opacity: 1;
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    .island-letter {
      font-size: 1.2rem;
    }
    
    .island-name {
      font-size: 0.7rem;
    }
    
    .map-controls {
      bottom: 10px;
      right: 10px;
    }
    
    .map-button {
      width: 35px;
      height: 35px;
      font-size: 1rem;
    }
    
    .compass {
      width: 40px;
      height: 40px;
    }
  }
</style>