<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { user } from '../../stores/userStore.js';
  import { message } from '../../stores/uiStore.js';
  import confetti from 'canvas-confetti';
  
  export let letter = '';
  export let onComplete;
  export let onBack;
  
  const dispatch = createEventDispatcher();
  
  // Estado de la actividad
  let availableLetters = [];
  let selectedLetters = [];
  let words = [];
  let score = 0;
  let totalScore = 0;
  let maxScore = 100;
  let isChecking = false;
  let lastCheck = null;
  let activityComplete = false;
  let remainingTime = 120; // 2 minutos
  let timerInterval;
  
  // Generar un conjunto de letras disponibles
  function generateLetters() {
    // Siempre incluir la letra actual
    let letters = [letter];
    
    // Añadir vocales
    letters = letters.concat(['A', 'E', 'I', 'O', 'U']);
    
    // Añadir consonantes comunes
    const commonConsonants = ['B', 'C', 'D', 'F', 'G', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
    
    // Seleccionar algunas consonantes aleatorias
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * commonConsonants.length);
      letters.push(commonConsonants[randomIndex]);
    }
    
    // Eliminar duplicados
    letters = [...new Set(letters)];
    
    // Asegurar que tenemos suficientes letras (al menos 12)
    while (letters.length < 12) {
      const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      if (!letters.includes(randomLetter)) {
        letters.push(randomLetter);
      }
    }
    
    // Limitar a 12 letras como máximo
    if (letters.length > 12) {
      letters = letters.slice(0, 12);
    }
    
    // Aleatorizar el orden
    return letters.sort(() => Math.random() - 0.5);
  }
  
  // Inicializar actividad
  onMount(() => {
    if (letter) {
      availableLetters = generateLetters();
      
      // Iniciar temporizador
      startTimer();
    }
    
    return () => {
      clearInterval(timerInterval);
    };
  });
  
  // Iniciar temporizador
  function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      remainingTime -= 1;
      
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        completeActivity();
      }
    }, 1000);
  }
  
  // Formatear tiempo restante
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  // Seleccionar una letra
  function selectLetter(letter, index) {
    selectedLetters = [...selectedLetters, { letter, originalIndex: index }];
  }
  
  // Deseleccionar una letra
  function deselectLetter(index) {
    selectedLetters = selectedLetters.filter((_, i) => i !== index);
  }
  
  // Comprobar la palabra formada
  async function checkWord() {
    if (selectedLetters.length === 0 || isChecking) return;
    
    isChecking = true;
    
    // Formar la palabra a partir de las letras seleccionadas
    const word = selectedLetters.map(item => item.letter).join('');
    
    try {
      // En una aplicación real, enviaríamos la palabra al servidor para verificar
      // Aquí simularemos una respuesta
      
      // Simular latencia de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar que la palabra comience con la letra correcta
      if (word[0] !== letter) {
        lastCheck = {
          word,
          valid: false,
          points: 0,
          reason: `La palabra debe comenzar con la letra ${letter}`
        };
        
        isChecking = false;
        return;
      }
      
      // Simular validación del diccionario
      // En realidad, esto se haría en el servidor con un diccionario real
      const isValid = Math.random() > 0.3 && word.length > 2;
      
      // Calcular puntos (longitud de la palabra * 10)
      const points = isValid ? word.length * 10 : 0;
      
      lastCheck = {
        word,
        valid: isValid,
        points,
        reason: isValid ? 'Palabra válida' : 'Palabra no encontrada en el diccionario'
      };
      
      // Si es válida, añadir a la lista de palabras formadas
      if (isValid) {
        // No añadir palabras duplicadas
        if (!words.some(w => w.word === word)) {
          words = [...words, lastCheck];
          totalScore += points;
          
          // Efecto de confeti para palabra válida
          if (typeof window !== 'undefined') {
            confetti({
              particleCount: 30 + (word.length * 5),
              spread: 60,
              origin: { y: 0.6 }
            });
          }
        } else {
          lastCheck.valid = false;
          lastCheck.points = 0;
          lastCheck.reason = 'Ya has formado esta palabra';
        }
      }
      
      // Limpiar letras seleccionadas después de comprobar
      selectedLetters = [];
      
      // Completar actividad si se alcanza la puntuación máxima
      if (totalScore >= maxScore) {
        completeActivity();
      }
      
    } catch (err) {
      console.error('Error al verificar palabra:', err);
      $message = {
        type: 'error',
        text: 'Error al verificar la palabra. Inténtalo de nuevo.',
        duration: 3000
      };
    } finally {
      isChecking = false;
    }
  }
  
  // Limpiar selección actual
  function clearSelection() {
    selectedLetters = [];
  }
  
  // Completar actividad
  function completeActivity() {
    if (activityComplete) return;
    
    clearInterval(timerInterval);
    activityComplete = true;
    
    // Calcular puntuación final (de 0 a 1)
    const finalScore = Math.min(1, totalScore / maxScore);
    
    // Notificar al componente padre
    dispatch('complete', {
      score: finalScore,
      activityId: 'word-builder'
    });
    
    // Si hay un callback, llamarlo
    if (onComplete) {
      onComplete({
        detail: {
          score: finalScore,
          activityId: 'word-builder'
        }
      });
    }
  }
  
  // Calcular progreso como porcentaje
  $: progressPercentage = Math.min(100, (totalScore / maxScore) * 100);
</script>

<div class="word-builder-activity">
  <div class="activity-header">
    <div class="header-controls">
      <button class="back-button" on:click={onBack}>
        <span class="back-icon">←</span> Volver
      </button>
      <h2 class="activity-title">Constructor de Palabras: Letra {letter}</h2>
    </div>
    
    <div class="activity-info">
      <div class="timer">
        <div class="timer-icon">⏱️</div>
        <div class="timer-value">{formatTime(remainingTime)}</div>
      </div>
      
      <div class="score-container">
        <div class="score-label">Puntuación:</div>
        <div class="score-value">{totalScore} / {maxScore}</div>
      </div>
    </div>
  </div>
  
  <div class="word-building-area">
    <div class="progress-bar">
      <div class="progress-value" style="width: {progressPercentage}%"></div>
    </div>
    
    <div class="word-display">
      {#if selectedLetters.length > 0}
        <div class="selected-letters">
          {#each selectedLetters as item, index}
            <div class="letter-tile selected" on:click={() => deselectLetter(index)}>
              {item.letter}
            </div>
          {/each}
        </div>
      {:else}
        <div class="word-placeholder">
          Selecciona letras para formar palabras que comiencen con {letter}
        </div>
      {/if}
    </div>
    
    <div class="word-actions">
      <button 
        class="action-button check" 
        on:click={checkWord}
        disabled={selectedLetters.length === 0 || isChecking}
      >
        {isChecking ? 'Verificando...' : 'Verificar Palabra'}
      </button>
      
      <button 
        class="action-button clear" 
        on:click={clearSelection}
        disabled={selectedLetters.length === 0}
      >
        Limpiar
      </button>
    </div>
    
    {#if lastCheck}
      <div class="word-result {lastCheck.valid ? 'valid' : 'invalid'}">
        <div class="result-word">{lastCheck.word}</div>
        <div class="result-info">
          {#if lastCheck.valid}
            <div class="result-points">+{lastCheck.points} puntos</div>
          {/if}
          <div class="result-reason">{lastCheck.reason}</div>
        </div>
      </div>
    {/if}
  </div>
  
  <div class="letters-container">
    <div class="available-letters">
      {#each availableLetters as letter, index}
        <div 
          class="letter-tile {selectedLetters.some(item => item.originalIndex === index) ? 'used' : ''}"
          on:click={() => {
            if (!selectedLetters.some(item => item.originalIndex === index)) {
              selectLetter(letter, index);
            }
          }}
        >
          {letter}
        </div>
      {/each}
    </div>
  </div>
  
  <div class="words-container">
    <h3 class="section-title">Palabras Formadas</h3>
    
    {#if words.length > 0}
      <div class="words-list">
        {#each words as word}
          <div class="word-item">
            <div class="word-text">{word.word}</div>
            <div class="word-points">+{word.points}</div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-words">
        No has formado ninguna palabra todavía
      </div>
    {/if}
  </div>
  
  <div class="activity-footer">
    <button class="finish-button" on:click={completeActivity}>
      Finalizar Actividad
    </button>
  </div>
</div>

<style>
  .word-builder-activity {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
    gap: 1.5rem;
  }
  
  .activity-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .back-button {
    background-color: transparent;
    color: var(--primary);
    border: none;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .back-icon {
    font-size: 1.2rem;
  }
  
  .activity-title {
    margin: 0;
    color: var(--primary);
  }
  
  .activity-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
    border-radius: var(--border-radius);
    padding: 0.75rem 1rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .timer-value {
    font-weight: 700;
    font-size: 1.1rem;
  }
  
  .score-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .score-label {
    font-weight: 600;
  }
  
  .score-value {
    font-weight: 700;
    color: var(--primary);
  }
  
  .word-building-area {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .progress-bar {
    height: 8px;
    background-color: rgba(91, 72, 199, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }
  
  .progress-value {
    height: 100%;
    background: linear-gradient(to right, var(--primary), var(--secondary));
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .word-display {
    min-height: 80px;
    padding: 1rem;
    background-color: rgba(91, 72, 199, 0.05);
    border-radius: var(--border-radius);
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .word-placeholder {
    color: var(--text-light);
    text-align: center;
  }
  
  .selected-letters {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .word-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .action-button {
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius);
    font-weight: 600;
  }
  
  .action-button.check {
    background-color: var(--primary);
    color: white;
  }
  
  .action-button.check:hover:not(:disabled) {
    background-color: var(--primary-dark);
  }
  
  .action-button.clear {
    background-color: transparent;
    color: var(--primary);
    border: 1px solid var(--primary);
  }
  
  .action-button.clear:hover:not(:disabled) {
    background-color: rgba(91, 72, 199, 0.1);
  }
  
  .word-result {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: var(--border-radius);
    text-align: center;
    animation: fadeIn 0.3s ease-out;
  }
  
  .word-result.valid {
    background-color: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.3);
  }
  
  .word-result.invalid {
    background-color: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.3);
  }
  
  .result-word {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .result-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .result-points {
    font-weight: 600;
    color: var(--success);
  }
  
  .result-reason {
    font-size: 0.9rem;
    color: var(--text-light);
  }
  
  .letters-container {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .available-letters {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .letter-tile {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--primary-light);
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
  }
  
  .letter-tile:hover:not(.used) {
    transform: translateY(-5px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
  }
  
  .letter-tile.used {
    opacity: 0.3;
    pointer-events: none;
  }
  
  .letter-tile.selected {
    background-color: var(--secondary);
    transform: scale(0.95);
  }
  
  .letter-tile.selected:hover {
    background-color: var(--secondary-dark);
  }
  
  .words-container {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .section-title {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--primary);
  }
  
  .words-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .word-item {
    background-color: rgba(91, 72, 199, 0.05);
    border-radius: var(--border-radius);
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .word-text {
    font-weight: 600;
  }
  
  .word-points {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--success);
    background-color: rgba(76, 175, 80, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 1rem;
  }
  
  .no-words {
    color: var(--text-light);
    text-align: center;
    padding: 1rem;
  }
  
  .activity-footer {
    margin-top: 1rem;
    text-align: center;
  }
  
  .finish-button {
    background-color: var(--secondary);
    color: white;
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
  }
  
  .finish-button:hover {
    background-color: var(--secondary-dark);
  }
  
  @media (max-width: 768px) {
    .header-controls {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .activity-info {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }
    
    .letter-tile {
      width: 40px;
      height: 40px;
      font-size: 1.3rem;
    }
    
    .word-actions {
      flex-direction: column;
    }
    
    .action-button {
      width: 100%;
    }
  }
</style>