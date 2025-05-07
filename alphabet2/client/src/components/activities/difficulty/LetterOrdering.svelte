<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { getRandomElements } from '../../../config/activities.js';
  
  // Props
  export let letter; // La letra actual (aunque en este nivel usaremos conjuntos de letras)
  export let language = 'spanish'; // Idioma seleccionado (default: español)
  export let onComplete; // Callback para cuando se completa la actividad
  export let onBack; // Callback para volver al menú
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Estado local
  let currentSet = []; // Conjunto de letras a ordenar
  let userArrangement = []; // Ordenamiento del usuario
  let setSize = 5; // Tamaño del conjunto de letras (entre 3-5 dependiendo del nivel)
  let score = 0;
  let totalRounds = 5; // Número total de rondas
  let currentRound = 0;
  let isAnswerChecked = false;
  let feedback = '';
  let feedbackClass = '';
  let isActivityCompleted = false;
  let completionMessage = '';
  let draggedItemIndex = null;
  let nextSetTimeout = null;
  let showCorrectOrder = false;
  
  // Sonidos
  let successSound = null;
  let errorSound = null;
  let dragSound = null;
  let dropSound = null;
  
  // Al montar el componente
  onMount(() => {
    // Inicializar sonidos
    try {
      successSound = new Audio('/sounds/success.mp3');
      errorSound = new Audio('/sounds/error.mp3');
      dragSound = new Audio('/sounds/drag.mp3');
      dropSound = new Audio('/sounds/drop.mp3');
    } catch (error) {
      console.error('Error al inicializar sonidos:', error);
    }
    
    // Iniciar la primera ronda
    startNewRound();
    
    // Limpieza al desmontar
    return () => {
      if (nextSetTimeout) clearTimeout(nextSetTimeout);
      [successSound, errorSound, dragSound, dropSound].forEach(sound => {
        if (sound) {
          sound.pause();
          sound.currentTime = 0;
        }
      });
    };
  });
  
  // Iniciar una nueva ronda
  function startNewRound() {
    // Incrementar contador de rondas
    currentRound++;
    
    // Resetear estado
    isAnswerChecked = false;
    feedback = '';
    showCorrectOrder = false;
    
    // Ajustar dificultad según el progreso
    // A medida que avanza, se incrementa el tamaño del conjunto
    setSize = Math.min(3 + Math.floor(currentRound / 2), 5);
    
    // Generar nuevo conjunto de letras
    generateLetterSet();
  }
  
  // Generar conjunto de letras para ordenar
  function generateLetterSet() {
    // Definir el alfabeto completo
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    // Opciones para seleccionar un subconjunto:
    // 1. Subconjunto aleatorio del alfabeto
    // 2. Subconjunto centrado en la letra actual
    // 3. Subconjunto con letras más difíciles
    
    let selectedLetters;
    
    // En este caso, tomamos un subconjunto centrado en la letra actual
    const letterIndex = alphabet.indexOf(letter);
    
    if (letterIndex !== -1) {
      // Calcula el inicio y fin del subconjunto
      const start = Math.max(0, letterIndex - Math.floor(setSize / 2));
      const end = Math.min(alphabet.length, start + setSize);
      
      // Ajusta el inicio si el final quedó cortado
      const adjustedStart = end - setSize < 0 ? 0 : end - setSize;
      
      // Obtener el subconjunto
      selectedLetters = alphabet.slice(adjustedStart, end);
    } else {
      // Si no encuentra la letra, toma un subconjunto aleatorio
      selectedLetters = getRandomElements(alphabet, setSize);
    }
    
    // Ordenar alfabéticamente para tener el orden correcto
    const orderedSet = [...selectedLetters].sort();
    
    // Mezclar para presentar al usuario (mientras sea diferente del orden correcto)
    let shuffledSet;
    do {
      shuffledSet = [...selectedLetters].sort(() => 0.5 - Math.random());
    } while (arraysEqual(shuffledSet, orderedSet));
    
    // Actualizar estado
    currentSet = orderedSet;
    userArrangement = shuffledSet;
  }
  
  // Comparar si dos arrays son iguales
  function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }
  
  // Manejar inicio de arrastre
  function handleDragStart(index) {
    draggedItemIndex = index;
    
    // Reproducir sonido
    if (dragSound) {
      dragSound.currentTime = 0;
      dragSound.play();
    }
  }
  
  // Manejar cuando se arrastra sobre otro elemento
  function handleDragOver(index) {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    // Intercambiar posiciones
    const newArrangement = [...userArrangement];
    [newArrangement[draggedItemIndex], newArrangement[index]] = 
      [newArrangement[index], newArrangement[draggedItemIndex]];
    
    // Actualizar el índice arrastrado
    draggedItemIndex = index;
    
    // Actualizar arreglo
    userArrangement = newArrangement;
  }
  
  // Manejar fin de arrastre
  function handleDragEnd() {
    draggedItemIndex = null;
    
    // Reproducir sonido
    if (dropSound) {
      dropSound.currentTime = 0;
      dropSound.play();
    }
  }
  
  // Verificar la respuesta
  function checkAnswer() {
    if (isAnswerChecked) return;
    
    isAnswerChecked = true;
    
    // Comparar con el orden correcto
    const isCorrect = arraysEqual(userArrangement, currentSet);
    
    if (isCorrect) {
      // Respuesta correcta
      score++;
      feedback = language === 'english' ? 'Correct order!' : '¡Orden correcto!';
      feedbackClass = 'positive';
      
      // Reproducir sonido de éxito
      if (successSound) {
        successSound.play();
      }
    } else {
      // Respuesta incorrecta
      feedback = language === 'english' ? 'Incorrect order!' : '¡Orden incorrecto!';
      feedbackClass = 'negative';
      showCorrectOrder = true;
      
      // Reproducir sonido de error
      if (errorSound) {
        errorSound.play();
      }
    }
    
    // Comprobar si hemos completado todas las rondas
    if (currentRound >= totalRounds) {
      nextSetTimeout = setTimeout(completeActivity, 3000);
    } else {
      // Pasar a la siguiente ronda después de un breve delay
      nextSetTimeout = setTimeout(startNewRound, 3000);
    }
  }
  
  // Completar la actividad
  function completeActivity() {
    // Calcular puntuación final (0-1)
    const finalScore = score / totalRounds;
    
    // Mostrar mensaje de finalización
    isActivityCompleted = true;
    
    // Generar mensaje según la puntuación
    if (finalScore >= 0.8) {
      completionMessage = language === 'english' 
        ? 'Excellent! You have mastered the alphabet order!' 
        : '¡Excelente! ¡Has dominado el orden alfabético!';
    } else if (finalScore >= 0.6) {
      completionMessage = language === 'english' 
        ? 'Good job! You\'re getting better at ordering letters!' 
        : '¡Buen trabajo! ¡Estás mejorando en ordenar letras!';
    } else {
      completionMessage = language === 'english' 
        ? 'Keep practicing the alphabet order. You\'ll improve!' 
        : '¡Sigue practicando el orden alfabético. ¡Mejorarás!';
    }
    
    // Emitir evento de finalización
    dispatch('complete', {
      score: finalScore,
      activityId: 'letter-ordering'
    });
  }
  
  // Volver al menú
  function handleBack() {
    if (nextSetTimeout) clearTimeout(nextSetTimeout);
    onBack();
  }
</script>

<div class="ordering-activity">
  <div class="activity-header">
    <button class="back-button" on:click={handleBack}>
      <span class="back-icon">←</span> 
      {language === 'english' ? 'Back' : 'Volver'}
    </button>
    
    <h1 class="activity-title">
      {language === 'english' ? 'Letter Ordering' : 'Ordenamiento de Letras'}
    </h1>
    
    <div class="progress-container">
      <div class="progress-bar" style="--progress: {(currentRound / totalRounds) * 100}%"></div>
      <span class="progress-text">{currentRound}/{totalRounds}</span>
    </div>
  </div>
  
  {#if !isActivityCompleted}
    <div class="ordering-content">
      <div class="instruction">
        {language === 'english' 
          ? 'Drag and drop the letters in alphabetical order' 
          : 'Arrastra y suelta las letras en orden alfabético'}
      </div>
      
      <div class="letter-tray">
        {#each userArrangement as letter, index}
          <div 
            class="letter-tile"
            class:dragging={draggedItemIndex === index}
            draggable={!isAnswerChecked}
            on:dragstart={() => handleDragStart(index)}
            on:dragover|preventDefault={() => handleDragOver(index)}
            on:dragend={handleDragEnd}
          >
            {letter}
          </div>
        {/each}
      </div>
      
      {#if showCorrectOrder}
        <div class="correct-order">
          <div class="order-label">
            {language === 'english' ? 'Correct order:' : 'Orden correcto:'}
          </div>
          <div class="order-tiles">
            {#each currentSet as letter}
              <div class="correct-tile">{letter}</div>
            {/each}
          </div>
        </div>
      {/if}
      
      <div class="action-container">
        {#if feedback}
          <div class="feedback {feedbackClass}">
            {feedback}
          </div>
        {/if}
        
        {#if !isAnswerChecked}
          <button 
            class="check-button"
            on:click={checkAnswer}
          >
            {language === 'english' ? 'Check Order' : 'Verificar Orden'}
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Pantalla de actividad completada -->
    <div class="completion-screen">
      <div class="completion-icon">🏆</div>
      <h2 class="completion-title">
        {language === 'english' ? 'Activity Completed!' : '¡Actividad Completada!'}
      </h2>
      <p class="completion-message">{completionMessage}</p>
      <div class="completion-score">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">{language === 'english' ? 'Correct' : 'Correctas'}</span>
            <span class="stat-value correct">{score}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{language === 'english' ? 'Incorrect' : 'Incorrectas'}</span>
            <span class="stat-value incorrect">{totalRounds - score}</span>
          </div>
        </div>
        
        <div class="stars">
          {#each Array(Math.round(score / totalRounds * 5)) as _, i}
            <span class="star">⭐</span>
          {/each}
        </div>
        
        <p class="score-text">
          {language === 'english' ? 'Your score' : 'Tu puntuación'}: {Math.round(score / totalRounds * 100)}%
        </p>
      </div>
      <button class="continue-button" on:click={handleBack}>
        {language === 'english' ? 'Continue' : 'Continuar'}
      </button>
    </div>
  {/if}
</div>

<style>
  .ordering-activity {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-color: #f8f9fa;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #4361ee;
    color: white;
  }
  
  .back-button {
    background: none;
    border: none;
    color: white;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .back-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .back-icon {
    margin-right: 5px;
    font-size: 1.2rem;
  }
  
  .activity-title {
    font-size: 1.5rem;
    margin: 0;
    text-align: center;
    flex-grow: 1;
  }
  
  .progress-container {
    position: relative;
    width: 120px;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: var(--progress);
    background-color: #4cc9f0;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.875rem;
    font-weight: bold;
    color: white;
  }
  
  .ordering-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    flex-grow: 1;
    gap: 2rem;
  }
  
  .instruction {
    font-size: 1.5rem;
    font-weight: bold;
    color: #3a0ca3;
    text-align: center;
    max-width: 80%;
  }
  
  .letter-tray {
    display: flex;
    gap: 1rem;
    justify-content: center;
    width: 100%;
    max-width: 600px;
    padding: 2rem;
    background-color: rgba(76, 201, 240, 0.1);
    border-radius: 16px;
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .letter-tile {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: bold;
    color: #3a0ca3;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: grab;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    user-select: none;
  }
  
  .letter-tile:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  .letter-tile.dragging {
    opacity: 0.7;
    transform: scale(1.1);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    cursor: grabbing;
    z-index: 10;
  }
  
  .correct-order {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    animation: fadeIn 0.5s ease;
  }
  
  .order-label {
    font-size: 1.2rem;
    font-weight: bold;
    color: #4361ee;
  }
  
  .order-tiles {
    display: flex;
    gap: 0.5rem;
  }
  
  .correct-tile {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: bold;
    color: white;
    background-color: #38b000;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(56, 176, 0, 0.3);
  }
  
  .action-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .check-button {
    background-color: #4361ee;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .check-button:hover {
    background-color: #3a0ca3;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  .feedback {
    font-size: 1.2rem;
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .feedback.positive {
    color: #38b000;
  }
  
  .feedback.negative {
    color: #d90429;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Pantalla de finalización */
  .completion-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    flex-grow: 1;
    text-align: center;
    gap: 1.5rem;
    background: linear-gradient(135deg, #4cc9f0 0%, #3a0ca3 100%);
    color: white;
  }
  
  .completion-icon {
    font-size: 5rem;
    animation: bounce 1s ease infinite alternate;
  }
  
  .completion-title {
    font-size: 2.5rem;
    margin: 0;
  }
  
  .completion-message {
    font-size: 1.2rem;
    max-width: 80%;
  }
  
  .completion-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 1.5rem 0;
    gap: 1rem;
  }
  
  .stats {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-label {
    font-size: 0.875rem;
    opacity: 0.8;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
  }
  
  .stat-value.correct {
    color: #a7f3d0;
  }
  
  .stat-value.incorrect {
    color: #fda4af;
  }
  
  .stars {
    display: flex;
    gap: 0.5rem;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .star {
    animation: twinkle 1.5s ease infinite alternate;
  }
  
  .star:nth-child(2) {
    animation-delay: 0.3s;
  }
  
  .star:nth-child(3) {
    animation-delay: 0.6s;
  }
  
  .star:nth-child(4) {
    animation-delay: 0.9s;
  }
  
  .star:nth-child(5) {
    animation-delay: 1.2s;
  }
  
  @keyframes twinkle {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
  
  @keyframes bounce {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-10px);
    }
  }
  
  .score-text {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
  }
  
  .continue-button {
    background-color: white;
    color: #3a0ca3;
    border: none;
    border-radius: 8px;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .continue-button:hover {
    background-color: #f8f8f8;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
</style>