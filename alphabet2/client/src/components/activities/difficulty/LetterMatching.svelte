<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { letterExamples, getRandomElements } from '../../../config/activities.js';
  
  // Props
  export let letter; // La letra actual
  export let language = 'spanish'; // Idioma seleccionado (default: español)
  export let onComplete; // Callback para cuando se completa la actividad
  export let onBack; // Callback para volver al menú
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Estado local
  let currentLetter = letter || 'A';
  let currentLetterData = null;
  let imageOptions = [];
  let optionsCount = 4; // Número de opciones a mostrar
  let score = 0;
  let mistakes = 0;
  let totalRounds = 5; // Número total de rondas
  let currentRound = 0;
  let selectedOption = null;
  let isAnswerChecked = false;
  let feedback = '';
  let feedbackClass = '';
  let isActivityCompleted = false;
  let completionMessage = '';
  
  // Sonidos
  let successSound = null;
  let errorSound = null;
  
  // Al montar el componente
  onMount(() => {
    // Inicializar datos de la letra
    updateLetterData();
    
    // Inicializar sonidos
    try {
      successSound = new Audio('/sounds/success.mp3');
      errorSound = new Audio('/sounds/error.mp3');
    } catch (error) {
      console.error('Error al inicializar sonidos:', error);
    }
    
    // Iniciar la primera ronda
    startNewRound();
    
    // Limpieza al desmontar
    return () => {
      [successSound, errorSound].forEach(sound => {
        if (sound) {
          sound.pause();
          sound.currentTime = 0;
        }
      });
    };
  });
  
  // Actualizar datos cuando cambia la letra o idioma
  $: if (letter || language) {
    updateLetterData();
  }
  
  // Actualizar los datos de la letra actual
  function updateLetterData() {
    if (!letter) return;
    
    // Obtener datos de la letra según el idioma
    if (letterExamples[language] && letterExamples[language][letter]) {
      currentLetterData = letterExamples[language][letter];
    } else {
      // Fallback por si no existe el dato
      currentLetterData = {
        word: language === 'english' ? 'Example' : 'Ejemplo',
        imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/question-mark_2753.png'
      };
    }
  }
  
  // Iniciar una nueva ronda
  function startNewRound() {
    // Incrementar contador de rondas
    currentRound++;
    
    // Resetear estado de selección
    selectedOption = null;
    isAnswerChecked = false;
    feedback = '';
    
    // Obtener letras aleatorias para las opciones
    generateImageOptions();
  }
  
  // Generar opciones de imágenes para emparejar
  function generateImageOptions() {
    // Obtener todas las letras disponibles (excepto la actual)
    const allLetters = Object.keys(letterExamples[language])
      .filter(key => key !== letter);
    
    // Seleccionar algunas letras aleatorias
    const randomLetters = getRandomElements(allLetters, optionsCount - 1);
    
    // Obtener sus datos
    const wrongOptions = randomLetters.map(letterKey => ({
      letter: letterKey,
      ...letterExamples[language][letterKey]
    }));
    
    // Añadir la opción correcta
    const correctOption = {
      letter: currentLetter,
      ...currentLetterData,
      isCorrect: true
    };
    
    // Combinar y mezclar
    const allOptions = [...wrongOptions, correctOption]
      .sort(() => 0.5 - Math.random());
    
    // Actualizar estado
    imageOptions = allOptions;
  }
  
  // Manejar la selección de una opción
  function handleSelectOption(option) {
    if (isAnswerChecked) return;
    
    selectedOption = option;
  }
  
  // Verificar la respuesta
  function checkAnswer() {
    if (!selectedOption || isAnswerChecked) return;
    
    isAnswerChecked = true;
    
    // Comprobar si es correcta
    if (selectedOption.letter === currentLetter) {
      // Respuesta correcta
      score++;
      feedback = language === 'english' ? 'Correct!' : '¡Correcto!';
      feedbackClass = 'positive';
      
      // Reproducir sonido de éxito
      if (successSound) {
        successSound.play();
      }
    } else {
      // Respuesta incorrecta
      mistakes++;
      feedback = language === 'english' ? 'Incorrect!' : '¡Incorrecto!';
      feedbackClass = 'negative';
      
      // Reproducir sonido de error
      if (errorSound) {
        errorSound.play();
      }
    }
    
    // Comprobar si hemos completado todas las rondas
    if (currentRound >= totalRounds) {
      setTimeout(completeActivity, 1500);
    } else {
      // Pasar a la siguiente ronda después de un breve delay
      setTimeout(startNewRound, 1500);
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
        ? 'Excellent job! You matched the letters perfectly!' 
        : '¡Excelente trabajo! Emparejaste las letras perfectamente!';
    } else if (finalScore >= 0.6) {
      completionMessage = language === 'english' 
        ? 'Good job! You\'re getting better at matching!' 
        : '¡Buen trabajo! Estás mejorando en el emparejamiento!';
    } else {
      completionMessage = language === 'english' 
        ? 'Keep practicing! You\'ll improve with more practice.' 
        : '¡Sigue practicando! Mejorarás con más práctica.';
    }
    
    // Emitir evento de finalización
    dispatch('complete', {
      score: finalScore,
      activityId: 'letter-matching'
    });
  }
  
  // Volver al menú
  function handleBack() {
    onBack();
  }
</script>

<div class="matching-activity">
  <div class="activity-header">
    <button class="back-button" on:click={handleBack}>
      <span class="back-icon">←</span> 
      {language === 'english' ? 'Back' : 'Volver'}
    </button>
    
    <h1 class="activity-title">
      {language === 'english' ? 'Letter Matching' : 'Emparejamiento de Letras'}
    </h1>
    
    <div class="progress-container">
      <div class="progress-bar" style="--progress: {(currentRound / totalRounds) * 100}%"></div>
      <span class="progress-text">{currentRound}/{totalRounds}</span>
    </div>
  </div>
  
  {#if !isActivityCompleted}
    <div class="matching-content">
      <div class="prompt-container">
        <div class="letter-display">
          <span class="letter">{currentLetter}</span>
        </div>
        
        <div class="instruction">
          {language === 'english' 
            ? 'Which image matches this letter?' 
            : '¿Qué imagen corresponde a esta letra?'}
        </div>
      </div>
      
      <div class="options-grid">
        {#each imageOptions as option, index}
          <div 
            class="option-card"
            class:selected={selectedOption === option}
            class:correct={isAnswerChecked && option.letter === currentLetter}
            class:incorrect={isAnswerChecked && selectedOption === option && option.letter !== currentLetter}
            on:click={() => handleSelectOption(option)}
          >
            <img 
              src={option.imageUrl} 
              alt={option.word}
              class="option-image"
            />
            <div class="option-word">{option.word}</div>
          </div>
        {/each}
      </div>
      
      <div class="action-container">
        {#if feedback}
          <div class="feedback {feedbackClass}">
            {feedback}
          </div>
        {/if}
        
        {#if !isAnswerChecked}
          <button 
            class="check-button"
            class:disabled={!selectedOption}
            on:click={checkAnswer}
          >
            {language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
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
  .matching-activity {
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
  
  .matching-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    flex-grow: 1;
    gap: 2rem;
  }
  
  .prompt-container {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .letter-display {
    background-color: #3a0ca3;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    box-shadow: 0 6px 12px rgba(58, 12, 163, 0.3);
    animation: pulse 2s infinite ease-in-out;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 6px 12px rgba(58, 12, 163, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 8px 16px rgba(58, 12, 163, 0.4);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 6px 12px rgba(58, 12, 163, 0.3);
    }
  }
  
  .letter {
    font-size: 5rem;
    font-weight: bold;
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .instruction {
    font-size: 1.5rem;
    font-weight: bold;
    color: #3a0ca3;
    margin-top: 1rem;
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    width: 100%;
    max-width: 600px;
  }
  
  .option-card {
    background-color: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border: 3px solid transparent;
  }
  
  .option-card:hover:not(.selected) {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  .option-card.selected {
    border-color: #4361ee;
    box-shadow: 0 8px 16px rgba(67, 97, 238, 0.3);
  }
  
  .option-card.correct {
    border-color: #38b000;
    background-color: rgba(56, 176, 0, 0.1);
  }
  
  .option-card.incorrect {
    border-color: #d90429;
    background-color: rgba(217, 4, 41, 0.1);
  }
  
  .option-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
  }
  
  .option-word {
    font-size: 1.2rem;
    font-weight: bold;
    color: #3a0ca3;
    text-align: center;
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
  
  .check-button:hover:not(.disabled) {
    background-color: #3a0ca3;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  .check-button.disabled {
    opacity: 0.5;
    cursor: default;
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
    margin: 1.5rem 0;
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