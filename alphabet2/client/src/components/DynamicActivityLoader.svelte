<script>
  import { onMount } from 'svelte';
  import { difficultyLevels, activityComponentMap } from '../config/activities.js';
  import DifficultyLevelSelector from './DifficultyLevelSelector.svelte';
  
  // Importar dinámicamente las actividades
  import LetterRecognition from './activities/difficulty/LetterRecognition.svelte';
  import LetterMatching from './activities/difficulty/LetterMatching.svelte';
  import LetterQuiz from './activities/difficulty/LetterQuiz.svelte';
  import LetterOrdering from './activities/difficulty/LetterOrdering.svelte';
  import LetterSequence from './activities/difficulty/LetterSequence.svelte';
  
  // Props
  export let letter = ''; // La letra actual
  export let language = 'spanish'; // Idioma seleccionado
  export let onComplete; // Callback para cuando se completa la actividad
  export let onBack; // Callback para volver al menú
  
  // Estado local
  let selectedLevel = 'beginner'; // Nivel seleccionado por defecto
  let showLevelSelector = true; // Si se muestra el selector de niveles
  let activeActivity = null; // Referencia al componente de actividad activa
  
  // Mapa de componentes de actividad
  const activityComponents = {
    'letter-recognition': LetterRecognition,
    'letter-matching': LetterMatching,
    'letter-quiz': LetterQuiz,
    'letter-ordering': LetterOrdering,
    'letter-sequence': LetterSequence
  };
  
  // Manejar la selección de nivel de dificultad
  function handleSelectLevel(level) {
    selectedLevel = level;
    
    // Puede que queramos hacer más cosas aquí:
    // - Guardar la selección en el almacenamiento
    // - Actualizar estadísticas
    // etc...
  }
  
  // Iniciar la actividad seleccionada
  function startActivity() {
    showLevelSelector = false;
    
    // Aquí podríamos también:
    // - Registrar el inicio de la actividad
    // - Iniciar temporizadores
    // etc...
  }
  
  // Volver al selector de niveles
  function backToSelector() {
    showLevelSelector = true;
    
    // Podríamos hacer más cosas aquí:
    // - Guardar progreso parcial
    // - Limpiar recursos
    // etc...
  }
  
  // Manejar la finalización de la actividad
  function handleActivityComplete(event) {
    // Obtener datos de finalización
    const { score, activityId } = event.detail;
    
    // Propagar el evento al padre
    onComplete(event);
    
    // Determinar si deberíamos desbloquear el siguiente nivel
    // En una implementación real, esto se guardaría en el servidor
    
    // Volver al selector de niveles
    backToSelector();
  }
</script>

<div class="dynamic-activity-loader">
  {#if showLevelSelector}
    <div class="selector-container">
      <DifficultyLevelSelector 
        onSelectLevel={handleSelectLevel}
        selectedLevel={selectedLevel}
        language={language}
      />
      
      <div class="action-buttons">
        <button class="back-button" on:click={onBack}>
          {language === 'english' ? 'Back to Island' : 'Volver a la Isla'}
        </button>
        
        <button class="start-button" on:click={startActivity}>
          {language === 'english' ? 'Start Activity' : 'Iniciar Actividad'}
        </button>
      </div>
    </div>
  {:else}
    <div class="activity-container">
      {#if selectedLevel && difficultyLevels[selectedLevel]}
        {#if difficultyLevels[selectedLevel].activityId in activityComponents}
          <svelte:component 
            this={activityComponents[difficultyLevels[selectedLevel].activityId]}
            letter={letter}
            language={language}
            onComplete={handleActivityComplete}
            onBack={backToSelector}
          />
        {:else}
          <div class="activity-error">
            <p class="error-message">
              {language === 'english' 
                ? 'Activity not found. Please try another level.' 
                : 'Actividad no encontrada. Por favor intenta con otro nivel.'}
            </p>
            <button class="back-to-selector" on:click={backToSelector}>
              {language === 'english' ? 'Back to Level Selection' : 'Volver a Selección de Nivel'}
            </button>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .dynamic-activity-loader {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .selector-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 2rem;
  }
  
  .action-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding: 0 1rem;
  }
  
  .back-button,
  .start-button {
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .back-button {
    background-color: #e9ecef;
    color: #4361ee;
    border: 2px solid #4361ee;
  }
  
  .back-button:hover {
    background-color: #dee2e6;
  }
  
  .start-button {
    background-color: #4361ee;
    color: white;
    border: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .start-button:hover {
    background-color: #3a0ca3;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  .activity-container {
    width: 100%;
    height: 100%;
    flex-grow: 1;
    position: relative;
  }
  
  .activity-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
    background-color: #f8d7da;
    color: #842029;
  }
  
  .error-message {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
  
  .back-to-selector {
    background-color: #842029;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .back-to-selector:hover {
    background-color: #6c1a22;
  }
</style>