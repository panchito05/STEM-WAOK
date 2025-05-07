<script>
  import { onMount } from 'svelte';
  import { difficultyLevels } from '../config/activities.js';
  
  // Props
  export let onSelectLevel; // Callback cuando se selecciona un nivel
  export let selectedLevel = 'beginner'; // Nivel seleccionado por defecto
  export let language = 'spanish'; // Idioma seleccionado
  
  // Estado local
  let levels = Object.keys(difficultyLevels);
  let activeLevels = []; // Niveles que están desbloqueados
  
  onMount(() => {
    // Al iniciar, determinamos qué niveles están desbloqueados
    // Esto puede venir de un API en una implementación real
    // Por ahora, hacemos que beginner siempre esté desbloqueado
    
    activeLevels = levels.filter(level => {
      return level === 'beginner' || difficultyLevels[level].unlocked;
    });
  });
  
  // Manejar la selección de nivel
  function selectLevel(level) {
    // Verificar si el nivel está desbloqueado
    if (activeLevels.includes(level)) {
      selectedLevel = level;
      onSelectLevel(level);
    } else {
      // Mostrar mensaje de nivel bloqueado
      const levelName = difficultyLevels[level].name;
      alert(language === 'english' 
        ? `The ${levelName} level is locked. Complete previous levels to unlock it.` 
        : `El nivel ${levelName} está bloqueado. Completa los niveles anteriores para desbloquearlo.`);
    }
  }
</script>

<div class="difficulty-selector">
  <h2 class="selector-title">
    {language === 'english' ? 'Select Difficulty Level' : 'Selecciona Nivel de Dificultad'}
  </h2>
  
  <div class="levels-container">
    {#each levels as level}
      <div 
        class="level-card"
        class:active={activeLevels.includes(level)}
        class:selected={selectedLevel === level}
        class:locked={!activeLevels.includes(level)}
        on:click={() => selectLevel(level)}
      >
        <div class="level-icon">
          {#if activeLevels.includes(level)}
            {#if level === 'beginner'}
              🌱
            {:else if level === 'elementary'}
              🌿
            {:else if level === 'intermediate'}
              🌲
            {:else if level === 'advanced'}
              🌳
            {:else if level === 'expert'}
              🌴
            {/if}
          {:else}
            🔒
          {/if}
        </div>
        
        <div class="level-details">
          <h3 class="level-name">{difficultyLevels[level].name}</h3>
          <p class="level-description">{difficultyLevels[level].description}</p>
          <div class="level-example">{difficultyLevels[level].example}</div>
        </div>
      </div>
    {/each}
  </div>
  
  {#if selectedLevel && difficultyLevels[selectedLevel]}
    <div class="selected-level-details">
      <h3 class="details-title">
        {language === 'english' ? 'Activity Details' : 'Detalles de la Actividad'}
      </h3>
      <p class="details-text">
        {difficultyLevels[selectedLevel].details}
      </p>
    </div>
  {/if}
</div>

<style>
  .difficulty-selector {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  .selector-title {
    font-size: 1.8rem;
    color: #3a0ca3;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .levels-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .level-card {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .level-card.active:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  .level-card.selected {
    border: 3px solid #4361ee;
    transform: translateY(-3px);
  }
  
  .level-card.locked {
    opacity: 0.7;
    filter: grayscale(0.7);
    cursor: not-allowed;
  }
  
  .level-icon {
    background-color: #4cc9f0;
    color: white;
    font-size: 2.5rem;
    padding: 1.5rem;
    text-align: center;
  }
  
  .level-card.selected .level-icon {
    background-color: #4361ee;
  }
  
  .level-details {
    padding: 1.5rem;
  }
  
  .level-name {
    font-size: 1.3rem;
    color: #3a0ca3;
    margin: 0 0 0.5rem;
  }
  
  .level-description {
    font-size: 0.9rem;
    color: #4361ee;
    margin: 0 0 1rem;
  }
  
  .level-example {
    font-size: 1rem;
    background-color: rgba(76, 201, 240, 0.1);
    padding: 0.5rem;
    border-radius: 8px;
    color: #3a0ca3;
    text-align: center;
  }
  
  .selected-level-details {
    background-color: rgba(76, 201, 240, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 2rem;
    border-left: 5px solid #4361ee;
  }
  
  .details-title {
    font-size: 1.3rem;
    color: #3a0ca3;
    margin: 0 0 1rem;
  }
  
  .details-text {
    font-size: 1rem;
    color: #4361ee;
    line-height: 1.6;
    margin: 0;
  }
</style>