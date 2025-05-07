<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/userStore.js';
  import { currentIsland, ecosystemData, inventory } from '../stores/worldStore.js';
  import { message } from '../stores/uiStore.js';
  
  // Componentes para actividades
  import SoundMirror from './activities/SoundMirror.svelte';
  import WordBuilder from './activities/WordBuilder.svelte';
  import MotionRecognition from './activities/MotionRecognition.svelte';
  import InteractiveStory from './activities/InteractiveStory.svelte';
  import LetterArcade from './activities/LetterArcade.svelte';
  
  export let onReturn;
  
  // Estado local
  let selectedActivity = null;
  let ecosystem = null;
  let selectedTab = 'activities';
  let currentAnimation = '';
  let showActivityIntro = false;
  let activityDescription = '';
  
  onMount(() => {
    // Cargar datos del ecosistema si existen
    if ($currentIsland && $ecosystemData[$currentIsland.letter]) {
      ecosystem = $ecosystemData[$currentIsland.letter];
    } else {
      // Inicializar ecosistema si no existe
      ecosystem = {
        growth_level: 1,
        elements: {
          plants: 0,
          animals: 0,
          weather: 'sunny'
        }
      };
    }
    
    // Animación de entrada
    currentAnimation = 'fade-in';
  });
  
  // Seleccionar una actividad
  function selectActivity(activity) {
    if (!activity.unlocked) {
      $message = {
        type: 'info',
        text: `Esta actividad aún está bloqueada. ¡Completa otras actividades para desbloquearla!`,
        duration: 3000
      };
      return;
    }
    
    selectedActivity = activity;
    showActivityIntro = true;
    
    // Establecer descripción según el tipo de actividad
    switch(activity.id) {
      case 'sound-mirror':
        activityDescription = `
          En "Espejo de Sonidos" aprenderás a pronunciar correctamente la letra ${$currentIsland.letter}.
          Escucharás ejemplos de pronunciación y podrás grabar tu voz para comparar.
          ¡Practica el sonido de la letra y gana estrellas por tu pronunciación!
        `;
        break;
      case 'word-builder':
        activityDescription = `
          En "Constructor de Palabras" formarás palabras que comiencen con la letra ${$currentIsland.letter}.
          Arrastra letras para formar palabras y aprende nuevo vocabulario.
          ¡Cada palabra correcta ayudará a que crezca tu ecosistema de conocimiento!
        `;
        break;
      case 'motion-recognition':
        activityDescription = `
          En "Letra en Movimiento" dibujarás la letra ${$currentIsland.letter} siguiendo un patrón.
          Aprende la forma correcta de escribir la letra con movimientos fluidos.
          ¡Practica tu caligrafía mientras desarrollas habilidades motoras!
        `;
        break;
      case 'interactive-story':
        activityDescription = `
          En "Historia Interactiva" participarás en un cuento donde la letra ${$currentIsland.letter} es protagonista.
          Toma decisiones que afectarán el desarrollo de la historia.
          ¡Descubre personajes y situaciones divertidas mientras aprendes!
        `;
        break;
      case 'letter-arcade':
        activityDescription = `
          En "Arcade de Letras" jugarás minijuegos divertidos con la letra ${$currentIsland.letter}.
          Demuestra tu velocidad y precisión para ganar puntos y recompensas.
          ¡Supera los niveles y compite por el mejor puntaje!
        `;
        break;
    }
  }
  
  // Iniciar la actividad seleccionada
  function startActivity() {
    showActivityIntro = false;
  }
  
  // Volver a la selección de actividades
  function backToActivities() {
    selectedActivity = null;
    showActivityIntro = false;
  }
  
  // Manejar acciones del ecosistema
  function interactWithEcosystem(action) {
    // Verificar si el usuario tiene suficientes recursos
    if (action === 'water' && $inventory.resources.seeds <= 0) {
      $message = {
        type: 'error',
        text: 'No tienes suficientes semillas para regar las plantas.',
        duration: 3000
      };
      return;
    }
    
    // Consumir recursos
    if (action === 'water') {
      $inventory.resources.seeds--;
    }
    
    // Emitir evento de interacción con el ecosistema
    // En una implementación real, esto se enviaría al servidor
    console.log(`Interacting with ecosystem: ${action}`);
    
    // Actualizar el ecosistema localmente (simulación)
    if (action === 'water') {
      ecosystem.elements.plants = Math.min(5, (ecosystem.elements.plants || 0) + 1);
      ecosystem.elements.weather = 'rainy';
    } else if (action === 'feed') {
      ecosystem.elements.animals = Math.min(5, (ecosystem.elements.animals || 0) + 1);
    }
    
    // Actualizar el store
    $ecosystemData[$currentIsland.letter] = ecosystem;
    
    $message = {
      type: 'success',
      text: action === 'water' ? 'Has regado las plantas. ¡Tu ecosistema está creciendo!' : 'Has alimentado a los animales. ¡Tu ecosistema está más vivo!',
      duration: 3000
    };
  }
  
  // Completar una actividad
  function handleActivityComplete(event) {
    const { score, activityId } = event.detail;
    
    // Actualizar el crecimiento del ecosistema basado en la puntuación
    if (score > 0.7 && ecosystem.growth_level < 5) {
      ecosystem.growth_level++;
      
      $message = {
        type: 'success',
        text: '¡Excelente trabajo! Tu ecosistema ha crecido.',
        duration: 3000
      };
    }
    
    // Otorgar recompensas
    const rewardSeeds = Math.floor(score * 5);
    $inventory.resources.seeds += rewardSeeds;
    
    $message = {
      type: 'success',
      text: `Has ganado ${rewardSeeds} semillas por completar la actividad.`,
      duration: 3000
    };
    
    // Desbloquear siguiente actividad si corresponde
    if (score > 0.8) {
      const activities = $currentIsland.activities;
      const currentIndex = activities.findIndex(a => a.id === activityId);
      
      if (currentIndex >= 0 && currentIndex < activities.length - 1) {
        const nextActivity = activities[currentIndex + 1];
        
        if (!nextActivity.unlocked) {
          nextActivity.unlocked = true;
          
          $message = {
            type: 'success',
            text: `¡Has desbloqueado la actividad "${nextActivity.name}"!`,
            duration: 5000
          };
        }
      }
    }
    
    // Actualizar el store
    $ecosystemData[$currentIsland.letter] = ecosystem;
    
    // Volver a la selección de actividades
    selectedActivity = null;
  }
</script>

<div class="island-view {currentAnimation}">
  <!-- Cabecera de la isla -->
  <div class="island-header">
    <button class="back-button" on:click={onReturn}>
      <span class="back-icon">←</span> Volver al Mapa
    </button>
    
    <div class="island-title">
      <h1 class="island-name">Isla {$currentIsland?.letter || ''}</h1>
      <div class="user-resources">
        <div class="resource-item">
          <span class="resource-icon">⭐</span>
          <span class="resource-value">{$inventory.resources.stars}</span>
        </div>
        <div class="resource-item">
          <span class="resource-icon">🌱</span>
          <span class="resource-value">{$inventory.resources.seeds}</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Vista principal de la isla (cuando no hay actividad seleccionada) -->
  {#if !selectedActivity}
    <!-- Pestañas de navegación -->
    <div class="island-tabs">
      <button 
        class="tab-button {selectedTab === 'activities' ? 'active' : ''}" 
        on:click={() => selectedTab = 'activities'}
      >
        Actividades
      </button>
      <button 
        class="tab-button {selectedTab === 'ecosystem' ? 'active' : ''}" 
        on:click={() => selectedTab = 'ecosystem'}
      >
        Ecosistema
      </button>
      <button 
        class="tab-button {selectedTab === 'info' ? 'active' : ''}" 
        on:click={() => selectedTab = 'info'}
      >
        Información
      </button>
    </div>
    
    <!-- Contenido de las pestañas -->
    <div class="tab-content">
      {#if selectedTab === 'activities'}
        <div class="activities-grid">
          {#each $currentIsland?.activities || [] as activity}
            <div 
              class="activity-card {activity.unlocked ? '' : 'locked'}"
              on:click={() => selectActivity(activity)}
            >
              <div class="activity-icon">
                {#if activity.id === 'sound-mirror'}
                  🔊
                {:else if activity.id === 'word-builder'}
                  📝
                {:else if activity.id === 'motion-recognition'}
                  ✍️
                {:else if activity.id === 'interactive-story'}
                  📚
                {:else if activity.id === 'letter-arcade'}
                  🎮
                {/if}
              </div>
              <div class="activity-details">
                <h3 class="activity-name">{activity.name}</h3>
                {#if !activity.unlocked}
                  <div class="activity-lock">🔒</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        
      {:else if selectedTab === 'ecosystem'}
        <div class="ecosystem-view">
          <div class="ecosystem-island" style="--growth-level: {ecosystem?.growth_level || 1};">
            <!-- Elementos visuales del ecosistema -->
            <div class="ecosystem-weather {ecosystem?.elements?.weather || 'sunny'}"></div>
            
            {#if ecosystem?.elements?.plants > 0}
              <div class="ecosystem-plants" style="--plants-count: {ecosystem.elements.plants};">
                {#each Array(ecosystem.elements.plants) as _, i}
                  <div class="plant" style="--plant-index: {i};"></div>
                {/each}
              </div>
            {/if}
            
            {#if ecosystem?.elements?.animals > 0}
              <div class="ecosystem-animals" style="--animals-count: {ecosystem.elements.animals};">
                {#each Array(ecosystem.elements.animals) as _, i}
                  <div class="animal" style="--animal-index: {i};"></div>
                {/each}
              </div>
            {/if}
            
            <div class="ecosystem-letter">{$currentIsland?.letter}</div>
          </div>
          
          <div class="ecosystem-controls">
            <div class="ecosystem-info">
              <h3>Nivel de Crecimiento: {ecosystem?.growth_level || 1}/5</h3>
              <p>Tu ecosistema está {['recién comenzando', 'creciendo', 'desarrollándose', 'prosperando', 'floreciendo'][Math.min(4, (ecosystem?.growth_level || 1) - 1)]}.</p>
            </div>
            
            <div class="ecosystem-actions">
              <button 
                class="eco-action water" 
                on:click={() => interactWithEcosystem('water')}
                disabled={$inventory.resources.seeds <= 0}
              >
                Regar Plantas 🌧️ (-1 Semilla)
              </button>
              <button 
                class="eco-action feed" 
                on:click={() => interactWithEcosystem('feed')}
              >
                Alimentar Animales 🥕
              </button>
            </div>
          </div>
        </div>
        
      {:else if selectedTab === 'info'}
        <div class="info-content">
          <div class="info-section">
            <h2>Acerca de la Letra {$currentIsland?.letter}</h2>
            <p>
              La letra <strong>{$currentIsland?.letter}</strong> es la letra número {$currentIsland?.letter.charCodeAt(0) - 64} del alfabeto.
              {#if 'AEIOU'.includes($currentIsland?.letter)}
                Es una vocal, lo que significa que su sonido se puede pronunciar sin obstruir el flujo de aire desde los pulmones.
              {:else}
                Es una consonante, lo que significa que su sonido se produce obstruyendo parcial o totalmente el flujo de aire desde los pulmones.
              {/if}
            </p>
          </div>
          
          <div class="info-section">
            <h3>Pronunciación</h3>
            <p>
              {#if $currentIsland?.letter === 'A'}
                La letra A se pronuncia /a/ como en "casa".
              {:else if $currentIsland?.letter === 'B'}
                La letra B se pronuncia /b/ como en "barco".
              {:else if $currentIsland?.letter === 'C'}
                La letra C tiene dos sonidos distintos:
                <ul>
                  <li>Se pronuncia /k/ como en "casa" cuando va seguida de 'a', 'o', 'u' o consonante.</li>
                  <li>Se pronuncia /s/ (en algunas regiones) o /th/ (en España) cuando va seguida de 'e' o 'i'.</li>
                </ul>
              {:else if $currentIsland?.letter === 'D'}
                La letra D se pronuncia /d/ como en "dedo".
              {:else if $currentIsland?.letter === 'E'}
                La letra E se pronuncia /e/ como en "mesa".
              {:else if $currentIsland?.letter === 'F'}
                La letra F se pronuncia /f/ como en "fácil".
              {:else}
                Para aprender la pronunciación correcta de esta letra, ¡prueba la actividad "Espejo de Sonidos"!
              {/if}
            </p>
          </div>
          
          <div class="info-section">
            <h3>Palabras que empiezan con {$currentIsland?.letter}</h3>
            <div class="word-examples">
              {#if $currentIsland?.letter === 'A'}
                <span class="word-example">Árbol</span>
                <span class="word-example">Amor</span>
                <span class="word-example">Agua</span>
                <span class="word-example">Avión</span>
                <span class="word-example">Animal</span>
              {:else if $currentIsland?.letter === 'B'}
                <span class="word-example">Barco</span>
                <span class="word-example">Bola</span>
                <span class="word-example">Beso</span>
                <span class="word-example">Bebé</span>
                <span class="word-example">Bosque</span>
              {:else if $currentIsland?.letter === 'C'}
                <span class="word-example">Casa</span>
                <span class="word-example">Comer</span>
                <span class="word-example">Ciudad</span>
                <span class="word-example">Calle</span>
                <span class="word-example">Cebra</span>
              {:else}
                <span class="word-example">Explora las actividades para descubrir palabras</span>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
    
  <!-- Vista de introducción a la actividad -->
  {:else if showActivityIntro}
    <div class="activity-intro">
      <h2>{selectedActivity.name}</h2>
      
      <div class="activity-description">
        <p>{activityDescription}</p>
      </div>
      
      <div class="activity-controls">
        <button class="secondary" on:click={backToActivities}>Volver</button>
        <button on:click={startActivity}>¡Comenzar!</button>
      </div>
    </div>
    
  <!-- Vista de la actividad -->
  {:else}
    <div class="activity-container">
      {#if selectedActivity.id === 'sound-mirror'}
        <SoundMirror 
          letter={$currentIsland?.letter} 
          onComplete={handleActivityComplete}
          onBack={backToActivities}
        />
      {:else if selectedActivity.id === 'word-builder'}
        <WordBuilder 
          letter={$currentIsland?.letter} 
          onComplete={handleActivityComplete}
          onBack={backToActivities}
        />
      {:else if selectedActivity.id === 'motion-recognition'}
        <MotionRecognition 
          letter={$currentIsland?.letter} 
          onComplete={handleActivityComplete}
          onBack={backToActivities}
        />
      {:else if selectedActivity.id === 'interactive-story'}
        <InteractiveStory 
          letter={$currentIsland?.letter} 
          onComplete={handleActivityComplete}
          onBack={backToActivities}
        />
      {:else if selectedActivity.id === 'letter-arcade'}
        <LetterArcade 
          letter={$currentIsland?.letter} 
          onComplete={handleActivityComplete}
          onBack={backToActivities}
        />
      {:else}
        <div class="activity-error">
          <p>La actividad seleccionada no está disponible.</p>
          <button on:click={backToActivities}>Volver</button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .island-view {
    width: 100%;
    height: 100vh;
    overflow-y: auto;
    padding: 1rem;
    background-color: var(--background);
  }
  
  .island-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .back-button {
    background-color: white;
    color: var(--primary);
    border: 2px solid var(--primary);
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
  }
  
  .back-button:hover {
    background-color: var(--primary);
    color: white;
  }
  
  .back-icon {
    font-size: 1.2rem;
  }
  
  .island-title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .island-name {
    margin: 0;
  }
  
  .user-resources {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .resource-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background-color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 1rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .resource-icon {
    font-size: 1.2rem;
  }
  
  .resource-value {
    font-weight: 600;
  }
  
  .island-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid rgba(91, 72, 199, 0.1);
  }
  
  .tab-button {
    background-color: transparent;
    color: var(--text-light);
    padding: 0.7rem 1.5rem;
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    font-weight: 600;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
  }
  
  .tab-button:hover {
    background-color: rgba(91, 72, 199, 0.05);
    color: var(--primary);
  }
  
  .tab-button.active {
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
    background-color: rgba(91, 72, 199, 0.05);
  }
  
  .tab-content {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  /* Estilo para las actividades */
  .activities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  
  .activity-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.2rem;
    background-color: white;
    border-radius: var(--border-radius);
    border: 2px solid rgba(91, 72, 199, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .activity-card:hover {
    border-color: var(--primary);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(91, 72, 199, 0.1);
  }
  
  .activity-card.locked {
    opacity: 0.7;
    background-color: rgba(91, 72, 199, 0.05);
  }
  
  .activity-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: rgba(91, 72, 199, 0.1);
    border-radius: 50%;
    font-size: 1.5rem;
  }
  
  .activity-details {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .activity-name {
    margin: 0;
    font-size: 1.1rem;
  }
  
  .activity-lock {
    font-size: 1.2rem;
  }
  
  /* Estilo para el ecosistema */
  .ecosystem-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .ecosystem-island {
    position: relative;
    width: 100%;
    height: 300px;
    background-color: #8ae379;
    background-image: radial-gradient(circle at 50% 50%, 
      #a5e996 0%, 
      #8ae379 calc(30% + (var(--growth-level) * 5%)), 
      #77d566 100%);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  .ecosystem-weather {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 40%;
    background-size: contain;
    background-repeat: repeat-x;
  }
  
  .ecosystem-weather.sunny {
    background-image: url('/images/weather-sunny.png');
  }
  
  .ecosystem-weather.rainy {
    background-image: url('/images/weather-rainy.png');
  }
  
  .ecosystem-weather.cloudy {
    background-image: url('/images/weather-cloudy.png');
  }
  
  .ecosystem-plants {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
  }
  
  .plant {
    position: absolute;
    bottom: 0;
    width: 40px;
    height: calc(40px + (var(--plant-index) * 10px));
    background-image: url('/images/plant.png');
    background-size: contain;
    background-position: bottom;
    background-repeat: no-repeat;
    left: calc(10% + (var(--plant-index) * 18%));
  }
  
  .ecosystem-animals {
    position: absolute;
    bottom: 20px;
    width: 100%;
    height: 30%;
  }
  
  .animal {
    position: absolute;
    bottom: 0;
    width: 30px;
    height: 30px;
    background-image: url('/images/animal.png');
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    left: calc(20% + (var(--animal-index) * 20%));
    animation: float 5s ease-in-out infinite;
    animation-delay: calc(var(--animal-index) * 0.5s);
  }
  
  .ecosystem-letter {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 5rem;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.3);
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .ecosystem-controls {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .ecosystem-info {
    background-color: white;
    padding: 1rem;
    border-radius: var(--border-radius);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .ecosystem-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .eco-action {
    flex: 1;
    min-width: 200px;
    padding: 1rem;
  }
  
  .eco-action.water {
    background-color: #4fc3f7;
  }
  
  .eco-action.water:hover {
    background-color: #0288d1;
  }
  
  .eco-action.feed {
    background-color: #ffa726;
  }
  
  .eco-action.feed:hover {
    background-color: #ef6c00;
  }
  
  /* Estilo para la sección de información */
  .info-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .info-section {
    background-color: white;
    padding: 1.5rem;
    border-radius: var(--border-radius);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .info-section h2, .info-section h3 {
    margin-top: 0;
    color: var(--primary);
  }
  
  .info-section p {
    line-height: 1.6;
    margin-bottom: 1rem;
  }
  
  .word-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .word-example {
    background-color: rgba(91, 72, 199, 0.1);
    color: var(--primary);
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    font-weight: 600;
  }
  
  /* Estilo para la introducción de actividad */
  .activity-intro {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 2rem;
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .activity-description {
    margin: 2rem 0;
    text-align: left;
    line-height: 1.8;
  }
  
  .activity-controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  /* Estilo para el contenedor de actividad */
  .activity-container {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    height: calc(100vh - 120px);
    overflow-y: auto;
  }
  
  .activity-error {
    text-align: center;
    padding: 3rem;
  }
  
  /* Animaciones */
  .fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  @media (max-width: 768px) {
    .island-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .island-title {
      width: 100%;
      justify-content: space-between;
    }
    
    .activities-grid {
      grid-template-columns: 1fr;
    }
    
    .ecosystem-actions {
      flex-direction: column;
    }
  }
</style>